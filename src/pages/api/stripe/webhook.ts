import { NextApiRequest, NextApiResponse } from 'next';
import { stripe } from '../../../lib/stripe';
import { prisma } from '../../../lib/prisma';
import { buffer } from 'micro';
import Stripe from 'stripe';

// Disable body parsing for webhook verification
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set');
    return res.status(500).json({ message: 'Webhook secret not configured' });
  }

  let event: Stripe.Event;

  try {
    const body = await buffer(req);
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return res.status(400).json({ message: 'Invalid signature' });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }
      
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }
      
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).json({ message: 'Webhook handler failed' });
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  if (!session.customer || !session.subscription) {
    console.error('Missing customer or subscription in checkout session');
    return;
  }

  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;
  const planType = session.metadata?.planType || 'FREE';

  // Update user subscription status
  await prisma.user.update({
    where: { stripeCustomerId: customerId },
    data: {
      stripeSubscriptionId: subscriptionId,
      subscriptionTier: planType,
      subscriptionStatus: 'active',
      subscriptionCurrentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
  });

  console.log(`Subscription activated for customer ${customerId}`);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const subData = subscription as any; // Temporary fix for type issues
  
  await prisma.user.update({
    where: { stripeCustomerId: customerId },
    data: {
      subscriptionStatus: subscription.status,
      subscriptionCurrentPeriodEnd: subData.current_period_end ? 
        new Date(subData.current_period_end * 1000) : null,
    },
  });

  console.log(`Subscription updated for customer ${customerId}: ${subscription.status}`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  
  await prisma.user.update({
    where: { stripeCustomerId: customerId },
    data: {
      subscriptionTier: 'FREE',
      subscriptionStatus: 'canceled',
      stripeSubscriptionId: null,
      subscriptionCurrentPeriodEnd: null,
    },
  });

  console.log(`Subscription canceled for customer ${customerId}`);
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  
  await prisma.user.update({
    where: { stripeCustomerId: customerId },
    data: {
      subscriptionStatus: 'past_due',
    },
  });

  console.log(`Payment failed for customer ${customerId}`);
}
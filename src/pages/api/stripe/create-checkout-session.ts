import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import { stripe, SUBSCRIPTION_PLANS } from '../../../lib/stripe';
import { prisma } from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.email) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { planType } = req.body;
    
    if (!planType || !SUBSCRIPTION_PLANS[planType as keyof typeof SUBSCRIPTION_PLANS]) {
      return res.status(400).json({ message: 'Invalid plan type' });
    }

    const plan = SUBSCRIPTION_PLANS[planType as keyof typeof SUBSCRIPTION_PLANS];
    
    if (planType === 'FREE') {
      // Handle free plan "subscription"
      await prisma.user.update({
        where: { email: session.user.email },
        data: { 
          subscriptionTier: 'FREE',
          subscriptionStatus: 'active'
        }
      });
      
      return res.status(200).json({ 
        message: 'Free plan activated',
        subscription: { status: 'active', tier: 'FREE' }
      });
    }

    // Find or create Stripe customer
    let customer;
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (user?.stripeCustomerId) {
      customer = await stripe.customers.retrieve(user.stripeCustomerId);
    } else {
      customer = await stripe.customers.create({
        email: session.user.email,
        name: session.user.name || undefined,
      });

      await prisma.user.update({
        where: { email: session.user.email },
        data: { stripeCustomerId: customer.id }
      });
    }

    if (!plan.priceId) {
      return res.status(400).json({ message: 'Price ID not configured for this plan' });
    }

    // Create Stripe Checkout Session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: plan.priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXTAUTH_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/pricing`,
      metadata: {
        userId: user?.id || '',
        planType,
      },
    });

    res.status(200).json({ 
      checkoutUrl: checkoutSession.url,
      sessionId: checkoutSession.id 
    });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
}
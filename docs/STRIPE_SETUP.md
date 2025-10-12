# Stripe Production Setup Guide

## 1. Create Stripe Account
1. Go to https://stripe.com and create an account
2. Complete business verification (required for live payments)
3. Add bank account for payouts

## 2. Get API Keys
1. Go to Stripe Dashboard > Developers > API keys
2. Copy your **Publishable key** (pk_live_...)
3. Copy your **Secret key** (sk_live_...)
4. Store these securely - never commit to code

## 3. Create Products & Pricing
### Product 1: AI Security Monitor Pro
- **Price**: $9.99/month
- **Features**: 
  - Up to 5 devices
  - 24/7 monitoring
  - Email alerts
  - 30-day history

### Product 2: AI Security Monitor Enterprise  
- **Price**: $29.99/month
- **Features**:
  - Unlimited devices
  - 24/7 monitoring
  - SMS + Email alerts
  - 365-day history
  - Priority support
  - API access

## 4. Webhook Configuration
1. Go to Stripe Dashboard > Developers > Webhooks
2. Add endpoint: `https://yourdomain.com/api/stripe/webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

## 5. Test Payment Flow
1. Use test cards in development
2. Test subscription creation
3. Test subscription changes
4. Test cancellation

## 6. Go Live Checklist
- [ ] Business verification complete
- [ ] Bank account added
- [ ] Products created
- [ ] Webhook configured
- [ ] Payment flow tested
- [ ] API keys secured in Azure Key Vault

## Pricing Strategy
- **Free Tier**: 1 device, basic monitoring (customer acquisition)
- **Pro Tier**: $9.99/month - targets home users (primary market)
- **Enterprise**: $29.99/month - targets small businesses (premium market)

## Revenue Projections
- Target: 1,000 users by month 6
- Conversion rate: 15% free → pro, 3% free → enterprise  
- Monthly recurring revenue: $1,000-3,000 by month 6
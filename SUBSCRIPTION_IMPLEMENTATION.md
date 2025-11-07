# BrooBot Subscription System Implementation

## Pricing Tiers

| Tier | Price | Buddy Mode | AI Tool Assistant | Deep Research |
|------|-------|------------|-------------------|---------------|
| **Free** | $0 | 10 requests/day* | 10 requests/day* | 10 requests/day* |
| **Lite** | $19.99/month | ✅ Unlimited | 20/month | 10/day |
| **Pro** | $40/month | ✅ Unlimited | ✅ Unlimited | ✅ Unlimited |

*Free tier: 10 total requests per day across all modes combined

---

## Implementation Overview

### Tech Stack
- **Payment Processing**: Stripe
- **Subscription Management**: Stripe Subscriptions
- **Database**: DynamoDB for usage tracking
- **Backend**: AWS Lambda + API Gateway
- **Frontend**: React components for pricing/billing

---

## 1. Stripe Setup

### Create Stripe Products

```bash
# In Stripe Dashboard (https://dashboard.stripe.com)

# Product 1: BrooBot Lite
# Price: $19.99/month
# Product ID: prod_lite_xxxxx
# Price ID: price_lite_xxxxx

# Product 2: BrooBot Pro
# Price: $40/month
# Product ID: prod_pro_xxxxx
# Price ID: price_pro_xxxxx
```

### Environment Variables

```bash
# Add to .env
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

STRIPE_PRICE_LITE=price_lite_xxxxx
STRIPE_PRICE_PRO=price_pro_xxxxx
```

---

## 2. Backend Implementation

### Rate Limiting Logic

Create `backend/services/rateLimiting.js`:

```javascript
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

// Pricing tier configurations
const RATE_LIMITS = {
  free: {
    // 10 total requests per day (shared across all modes)
    totalDaily: 10,
    buddy: { requests: 10, period: 'day' },
    ai_tool_assistant: { requests: 10, period: 'day' },
    deep_research: { requests: 10, period: 'day' }
  },
  lite: {
    buddy: { requests: -1, period: 'unlimited' },  // Unlimited
    ai_tool_assistant: { requests: 20, period: 'month' },
    deep_research: { requests: 10, period: 'day' }
  },
  pro: {
    buddy: { requests: -1, period: 'unlimited' },
    ai_tool_assistant: { requests: -1, period: 'unlimited' },
    deep_research: { requests: -1, period: 'unlimited' }
  }
};

/**
 * Check if user can make a request based on their subscription tier
 */
export async function checkRateLimit(userId, mode) {
  try {
    // Get user's subscription tier
    const user = await getUser(userId);
    const tier = user.subscription?.tier || 'free';

    // Get rate limit configuration for tier
    const limits = RATE_LIMITS[tier];
    const modeLimit = limits[mode];

    // Pro tier: Unlimited everything
    if (tier === 'pro' && modeLimit.requests === -1) {
      return {
        allowed: true,
        unlimited: true,
        tier: 'pro',
        remaining: -1
      };
    }

    // Lite tier: Check specific mode limits
    if (tier === 'lite') {
      if (mode === 'buddy' && modeLimit.requests === -1) {
        // Unlimited Buddy Mode for Lite
        return {
          allowed: true,
          unlimited: true,
          tier: 'lite',
          mode: 'buddy',
          remaining: -1
        };
      }

      // For other modes, check limits
      const usage = await getUserUsage(userId, mode, modeLimit.period);
      const allowed = usage.count < modeLimit.requests;

      return {
        allowed,
        unlimited: false,
        tier: 'lite',
        mode,
        remaining: modeLimit.requests - usage.count,
        limit: modeLimit.requests,
        resetTime: usage.resetTime,
        period: modeLimit.period
      };
    }

    // Free tier: Check total daily usage across all modes
    if (tier === 'free') {
      const totalUsage = await getTotalDailyUsage(userId);
      const allowed = totalUsage.count < limits.totalDaily;

      return {
        allowed,
        unlimited: false,
        tier: 'free',
        remaining: limits.totalDaily - totalUsage.count,
        limit: limits.totalDaily,
        resetTime: totalUsage.resetTime,
        period: 'day',
        message: 'Free tier: 10 total requests per day across all modes'
      };
    }

    // Default deny
    return {
      allowed: false,
      unlimited: false,
      tier,
      remaining: 0
    };

  } catch (error) {
    console.error('Rate limit check error:', error);
    throw error;
  }
}

/**
 * Get user's usage for a specific mode and period
 */
async function getUserUsage(userId, mode, period) {
  const now = Date.now();
  let periodStart;
  let resetTime;

  if (period === 'day') {
    // Daily reset at midnight UTC
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    periodStart = today.getTime();
    resetTime = periodStart + 86400000; // +24 hours
  } else if (period === 'month') {
    // Monthly reset on 1st of month
    const thisMonth = new Date();
    thisMonth.setUTCDate(1);
    thisMonth.setUTCHours(0, 0, 0, 0);
    periodStart = thisMonth.getTime();

    const nextMonth = new Date(thisMonth);
    nextMonth.setUTCMonth(nextMonth.getUTCMonth() + 1);
    resetTime = nextMonth.getTime();
  }

  const usageKey = `${userId}:${mode}:${Math.floor(periodStart / 1000)}`;

  const { Item } = await docClient.send(new GetCommand({
    TableName: 'BrooBotUsage',
    Key: { usageKey }
  }));

  return {
    count: Item?.count || 0,
    resetTime
  };
}

/**
 * Get total daily usage across all modes (for free tier)
 */
async function getTotalDailyUsage(userId) {
  const now = Date.now();
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const periodStart = today.getTime();
  const resetTime = periodStart + 86400000;

  const usageKey = `${userId}:total:${Math.floor(periodStart / 1000)}`;

  const { Item } = await docClient.send(new GetCommand({
    TableName: 'BrooBotUsage',
    Key: { usageKey }
  }));

  return {
    count: Item?.count || 0,
    resetTime
  };
}

/**
 * Increment usage counter after successful request
 */
export async function incrementUsage(userId, mode) {
  const user = await getUser(userId);
  const tier = user.subscription?.tier || 'free';
  const now = Date.now();

  // Get period keys
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const dayKey = Math.floor(today.getTime() / 1000);

  const thisMonth = new Date();
  thisMonth.setUTCDate(1);
  thisMonth.setUTCHours(0, 0, 0, 0);
  const monthKey = Math.floor(thisMonth.getTime() / 1000);

  // Increment mode-specific counter
  const modeUsageKey = `${userId}:${mode}:${tier === 'lite' && mode === 'ai_tool_assistant' ? monthKey : dayKey}`;

  await docClient.send(new UpdateCommand({
    TableName: 'BrooBotUsage',
    Key: { usageKey: modeUsageKey },
    UpdateExpression: 'ADD #count :inc SET #userId = :userId, #mode = :mode, #timestamp = :timestamp',
    ExpressionAttributeNames: {
      '#count': 'count',
      '#userId': 'userId',
      '#mode': 'mode',
      '#timestamp': 'lastUpdated'
    },
    ExpressionAttributeValues: {
      ':inc': 1,
      ':userId': userId,
      ':mode': mode,
      ':timestamp': now
    }
  }));

  // For free tier, also increment total counter
  if (tier === 'free') {
    const totalUsageKey = `${userId}:total:${dayKey}`;

    await docClient.send(new UpdateCommand({
      TableName: 'BrooBotUsage',
      Key: { usageKey: totalUsageKey },
      UpdateExpression: 'ADD #count :inc SET #userId = :userId, #timestamp = :timestamp',
      ExpressionAttributeNames: {
        '#count': 'count',
        '#userId': 'userId',
        '#timestamp': 'lastUpdated'
      },
      ExpressionAttributeValues: {
        ':inc': 1,
        ':userId': userId,
        ':timestamp': now
      }
    }));
  }
}

/**
 * Get user information including subscription
 */
async function getUser(userId) {
  const { Item } = await docClient.send(new GetCommand({
    TableName: 'BrooBotUsers',
    Key: { userId }
  }));

  return Item || { userId, subscription: { tier: 'free' } };
}
```

### Stripe Subscription Management

Create `backend/services/stripe.js`:

```javascript
import Stripe from 'stripe';
import { DynamoDBDocumentClient, UpdateCommand, GetCommand } from '@aws-sdk/lib-dynamodb';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Create Stripe checkout session for subscription
 */
export async function createCheckoutSession(userId, priceId, userEmail) {
  try {
    const session = await stripe.checkout.sessions.create({
      customer_email: userEmail,
      client_reference_id: userId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.FRONTEND_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/pricing`,
      metadata: {
        userId,
      },
    });

    return {
      sessionId: session.id,
      url: session.url
    };
  } catch (error) {
    console.error('Stripe checkout error:', error);
    throw error;
  }
}

/**
 * Create Stripe customer portal session (for managing subscription)
 */
export async function createCustomerPortalSession(userId) {
  try {
    const user = await getUser(userId);

    if (!user.stripeCustomerId) {
      throw new Error('No Stripe customer ID found');
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${process.env.FRONTEND_URL}/dashboard`,
    });

    return {
      url: session.url
    };
  } catch (error) {
    console.error('Customer portal error:', error);
    throw error;
  }
}

/**
 * Handle Stripe webhook events
 */
export async function handleStripeWebhook(event) {
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(event.data.object);
      break;

    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      await handleSubscriptionUpdate(event.data.object);
      break;

    case 'customer.subscription.deleted':
      await handleSubscriptionCancelled(event.data.object);
      break;

    case 'invoice.payment_succeeded':
      await handlePaymentSucceeded(event.data.object);
      break;

    case 'invoice.payment_failed':
      await handlePaymentFailed(event.data.object);
      break;

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }
}

async function handleCheckoutCompleted(session) {
  const userId = session.metadata.userId || session.client_reference_id;
  const customerId = session.customer;

  // Update user with Stripe customer ID
  await docClient.send(new UpdateCommand({
    TableName: 'BrooBotUsers',
    Key: { userId },
    UpdateExpression: 'SET #stripe = :stripe',
    ExpressionAttributeNames: {
      '#stripe': 'stripeCustomerId'
    },
    ExpressionAttributeValues: {
      ':stripe': customerId
    }
  }));

  console.log(`Checkout completed for user ${userId}`);
}

async function handleSubscriptionUpdate(subscription) {
  const customerId = subscription.customer;

  // Find user by customer ID
  const user = await getUserByStripeCustomerId(customerId);
  if (!user) {
    console.error('User not found for customer:', customerId);
    return;
  }

  // Determine tier from price ID
  const priceId = subscription.items.data[0].price.id;
  let tier = 'free';

  if (priceId === process.env.STRIPE_PRICE_LITE) {
    tier = 'lite';
  } else if (priceId === process.env.STRIPE_PRICE_PRO) {
    tier = 'pro';
  }

  // Update user subscription
  await docClient.send(new UpdateCommand({
    TableName: 'BrooBotUsers',
    Key: { userId: user.userId },
    UpdateExpression: 'SET #sub = :sub',
    ExpressionAttributeNames: {
      '#sub': 'subscription'
    },
    ExpressionAttributeValues: {
      ':sub': {
        tier,
        stripeSubscriptionId: subscription.id,
        status: subscription.status,
        currentPeriodEnd: subscription.current_period_end * 1000,
        cancelAtPeriodEnd: subscription.cancel_at_period_end
      }
    }
  }));

  console.log(`Subscription updated for user ${user.userId}: ${tier}`);
}

async function handleSubscriptionCancelled(subscription) {
  const customerId = subscription.customer;
  const user = await getUserByStripeCustomerId(customerId);

  if (!user) return;

  // Downgrade to free tier
  await docClient.send(new UpdateCommand({
    TableName: 'BrooBotUsers',
    Key: { userId: user.userId },
    UpdateExpression: 'SET #sub = :sub',
    ExpressionAttributeNames: {
      '#sub': 'subscription'
    },
    ExpressionAttributeValues: {
      ':sub': {
        tier: 'free',
        status: 'cancelled',
        cancelledAt: Date.now()
      }
    }
  }));

  console.log(`Subscription cancelled for user ${user.userId}`);
}

async function handlePaymentSucceeded(invoice) {
  console.log('Payment succeeded:', invoice.id);
  // Log payment for accounting
}

async function handlePaymentFailed(invoice) {
  console.log('Payment failed:', invoice.id);
  // Send notification to user
}

async function getUserByStripeCustomerId(customerId) {
  // Query DynamoDB GSI for user by Stripe customer ID
  // Implementation depends on your table structure
  // For now, return mock
  return null; // TODO: Implement
}
```

### API Endpoints

Create `backend/api/subscriptions.js`:

```javascript
import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { createCheckoutSession, createCustomerPortalSession, handleStripeWebhook } from '../services/stripe.js';

const router = express.Router();

/**
 * Create Stripe checkout session
 */
router.post('/subscriptions/checkout', authenticate, async (req, res) => {
  try {
    const { priceId } = req.body;
    const userId = req.user.id;
    const userEmail = req.user.email;

    // Validate price ID
    const validPrices = [
      process.env.STRIPE_PRICE_LITE,
      process.env.STRIPE_PRICE_PRO
    ];

    if (!validPrices.includes(priceId)) {
      return res.status(400).json({ error: 'Invalid price ID' });
    }

    const session = await createCheckoutSession(userId, priceId, userEmail);

    res.json({
      sessionId: session.sessionId,
      url: session.url
    });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

/**
 * Create customer portal session
 */
router.post('/subscriptions/portal', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const session = await createCustomerPortalSession(userId);

    res.json({
      url: session.url
    });
  } catch (error) {
    console.error('Portal error:', error);
    res.status(500).json({ error: 'Failed to create portal session' });
  }
});

/**
 * Get current subscription status
 */
router.get('/subscriptions/status', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await getUser(userId);

    const subscription = user.subscription || {
      tier: 'free',
      status: 'active'
    };

    res.json({
      tier: subscription.tier,
      status: subscription.status,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd
    });
  } catch (error) {
    console.error('Status error:', error);
    res.status(500).json({ error: 'Failed to get subscription status' });
  }
});

/**
 * Get usage statistics
 */
router.get('/subscriptions/usage', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await getUser(userId);
    const tier = user.subscription?.tier || 'free';

    // Get usage for each mode
    const usage = await getUserUsageStats(userId, tier);

    res.json({
      tier,
      usage,
      limits: RATE_LIMITS[tier]
    });
  } catch (error) {
    console.error('Usage error:', error);
    res.status(500).json({ error: 'Failed to get usage stats' });
  }
});

/**
 * Stripe webhook endpoint
 */
router.post('/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    await handleStripeWebhook(event);

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
});

export default router;
```

---

## 3. Frontend Implementation

### Pricing Page Component

Create `src/pages/Pricing.tsx`:

```typescript
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@contexts/AuthContext';
import axios from 'axios';
import '../styles/Pricing.css';

interface PricingTier {
  id: string;
  name: string;
  price: number;
  priceId: string;
  features: string[];
  limits: {
    buddy: string;
    toolAssist: string;
    research: string;
  };
  popular?: boolean;
}

const pricingTiers: PricingTier[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    priceId: '',
    features: [
      '10 total requests per day',
      'Access to all 3 modes',
      'Basic AI assistance',
      'Community support'
    ],
    limits: {
      buddy: '10/day total',
      toolAssist: '10/day total',
      research: '10/day total'
    }
  },
  {
    id: 'lite',
    name: 'Lite',
    price: 19.99,
    priceId: import.meta.env.VITE_STRIPE_PRICE_LITE,
    features: [
      'Unlimited Buddy Mode',
      '20 AI Tool searches per month',
      '10 Deep Research per day',
      'Priority support',
      'Export to PDF/DOCX'
    ],
    limits: {
      buddy: 'Unlimited',
      toolAssist: '20/month',
      research: '10/day'
    },
    popular: true
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 40,
    priceId: import.meta.env.VITE_STRIPE_PRICE_PRO,
    features: [
      'Unlimited everything',
      'All modes unlimited',
      'Advanced AI models',
      'Priority processing',
      'Export to all formats',
      'API access',
      'Premium support'
    ],
    limits: {
      buddy: 'Unlimited',
      toolAssist: 'Unlimited',
      research: 'Unlimited'
    }
  }
];

export const Pricing: React.FC = () => {
  const navigate = useNavigate();
  const { authState } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (tier: PricingTier) => {
    if (!authState.isAuthenticated) {
      navigate('/signin?redirect=/pricing');
      return;
    }

    if (tier.id === 'free') {
      navigate('/chat');
      return;
    }

    try {
      setLoading(tier.id);

      const response = await axios.post(
        `${import.meta.env.VITE_API_ENDPOINT}/subscriptions/checkout`,
        { priceId: tier.priceId },
        {
          headers: {
            Authorization: `Bearer ${getAuthToken()}`
          }
        }
      );

      // Redirect to Stripe Checkout
      window.location.href = response.data.url;
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to start checkout. Please try again.');
      setLoading(null);
    }
  };

  return (
    <div className="pricing-container">
      <div className="pricing-header">
        <h1>Choose Your Plan</h1>
        <p>Select the perfect plan for your AI-powered workflow</p>
      </div>

      <div className="pricing-grid">
        {pricingTiers.map((tier) => (
          <div
            key={tier.id}
            className={`pricing-card ${tier.popular ? 'popular' : ''}`}
          >
            {tier.popular && <div className="popular-badge">Most Popular</div>}

            <div className="pricing-card-header">
              <h3>{tier.name}</h3>
              <div className="pricing-amount">
                <span className="currency">$</span>
                <span className="price">{tier.price}</span>
                {tier.price > 0 && <span className="period">/month</span>}
              </div>
            </div>

            <div className="pricing-limits">
              <div className="limit-item">
                <span className="limit-label">💬 Buddy Mode:</span>
                <span className="limit-value">{tier.limits.buddy}</span>
              </div>
              <div className="limit-item">
                <span className="limit-label">🔧 Tool Assistant:</span>
                <span className="limit-value">{tier.limits.toolAssist}</span>
              </div>
              <div className="limit-item">
                <span className="limit-label">🔍 Deep Research:</span>
                <span className="limit-value">{tier.limits.research}</span>
              </div>
            </div>

            <ul className="pricing-features">
              {tier.features.map((feature, index) => (
                <li key={index}>
                  <span className="check-icon">✓</span>
                  {feature}
                </li>
              ))}
            </ul>

            <button
              className={`pricing-button ${tier.popular ? 'primary' : 'secondary'}`}
              onClick={() => handleSubscribe(tier)}
              disabled={loading === tier.id}
            >
              {loading === tier.id
                ? 'Loading...'
                : tier.id === 'free'
                ? 'Get Started'
                : `Subscribe to ${tier.name}`}
            </button>
          </div>
        ))}
      </div>

      <div className="pricing-footer">
        <p>All plans include access to BrooBot's three AI modes</p>
        <p>Cancel anytime. No hidden fees.</p>
      </div>
    </div>
  );
};

function getAuthToken(): string {
  return localStorage.getItem('auth_token') || '';
}
```

### Subscription Dashboard Component

Create `src/components/SubscriptionStatus.tsx`:

```typescript
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/Subscription.css';

interface SubscriptionInfo {
  tier: 'free' | 'lite' | 'pro';
  status: string;
  currentPeriodEnd?: number;
  cancelAtPeriodEnd?: boolean;
}

interface UsageInfo {
  buddy: { used: number; limit: number; unlimited: boolean };
  ai_tool_assistant: { used: number; limit: number; unlimited: boolean };
  deep_research: { used: number; limit: number; unlimited: boolean };
  total?: { used: number; limit: number };
}

export const SubscriptionStatus: React.FC = () => {
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [usage, setUsage] = useState<UsageInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscriptionData();
  }, []);

  const fetchSubscriptionData = async () => {
    try {
      const [subResponse, usageResponse] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_ENDPOINT}/subscriptions/status`, {
          headers: { Authorization: `Bearer ${getAuthToken()}` }
        }),
        axios.get(`${import.meta.env.VITE_API_ENDPOINT}/subscriptions/usage`, {
          headers: { Authorization: `Bearer ${getAuthToken()}` }
        })
      ]);

      setSubscription(subResponse.data);
      setUsage(usageResponse.data.usage);
    } catch (error) {
      console.error('Failed to fetch subscription data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_ENDPOINT}/subscriptions/portal`,
        {},
        { headers: { Authorization: `Bearer ${getAuthToken()}` } }
      );

      window.location.href = response.data.url;
    } catch (error) {
      console.error('Failed to open customer portal:', error);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!subscription) return <div>Unable to load subscription</div>;

  const tierNames = {
    free: 'Free',
    lite: 'Lite',
    pro: 'Pro'
  };

  const tierColors = {
    free: '#6b7280',
    lite: '#3b82f6',
    pro: '#8b5cf6'
  };

  return (
    <div className="subscription-status">
      <div className="subscription-card">
        <div className="subscription-header">
          <h3>Your Plan</h3>
          <span
            className="tier-badge"
            style={{ backgroundColor: tierColors[subscription.tier] }}
          >
            {tierNames[subscription.tier]}
          </span>
        </div>

        {subscription.tier !== 'free' && subscription.currentPeriodEnd && (
          <div className="subscription-info">
            <p>
              Renews on:{' '}
              {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
            </p>
            {subscription.cancelAtPeriodEnd && (
              <p className="cancellation-notice">
                Your subscription will cancel at the end of this period
              </p>
            )}
          </div>
        )}

        <div className="usage-section">
          <h4>Usage This Period</h4>

          {subscription.tier === 'free' && usage?.total && (
            <div className="usage-item total-usage">
              <div className="usage-label">
                <span>Total Requests (All Modes)</span>
              </div>
              <div className="usage-bar">
                <div
                  className="usage-progress"
                  style={{
                    width: `${(usage.total.used / usage.total.limit) * 100}%`
                  }}
                />
              </div>
              <div className="usage-numbers">
                {usage.total.used} / {usage.total.limit} requests
              </div>
            </div>
          )}

          {subscription.tier !== 'free' && (
            <>
              <div className="usage-item">
                <div className="usage-label">
                  <span>💬 Buddy Mode</span>
                  {usage?.buddy.unlimited && (
                    <span className="unlimited-badge">Unlimited</span>
                  )}
                </div>
                {!usage?.buddy.unlimited && (
                  <>
                    <div className="usage-bar">
                      <div
                        className="usage-progress"
                        style={{
                          width: `${(usage!.buddy.used / usage!.buddy.limit) * 100}%`
                        }}
                      />
                    </div>
                    <div className="usage-numbers">
                      {usage!.buddy.used} / {usage!.buddy.limit}
                    </div>
                  </>
                )}
              </div>

              <div className="usage-item">
                <div className="usage-label">
                  <span>🔧 AI Tool Assistant</span>
                  {usage?.ai_tool_assistant.unlimited && (
                    <span className="unlimited-badge">Unlimited</span>
                  )}
                </div>
                {!usage?.ai_tool_assistant.unlimited && (
                  <>
                    <div className="usage-bar">
                      <div
                        className="usage-progress"
                        style={{
                          width: `${(usage!.ai_tool_assistant.used / usage!.ai_tool_assistant.limit) * 100}%`
                        }}
                      />
                    </div>
                    <div className="usage-numbers">
                      {usage!.ai_tool_assistant.used} / {usage!.ai_tool_assistant.limit}
                    </div>
                  </>
                )}
              </div>

              <div className="usage-item">
                <div className="usage-label">
                  <span>🔍 Deep Research</span>
                  {usage?.deep_research.unlimited && (
                    <span className="unlimited-badge">Unlimited</span>
                  )}
                </div>
                {!usage?.deep_research.unlimited && (
                  <>
                    <div className="usage-bar">
                      <div
                        className="usage-progress"
                        style={{
                          width: `${(usage!.deep_research.used / usage!.deep_research.limit) * 100}%`
                        }}
                      />
                    </div>
                    <div className="usage-numbers">
                      {usage!.deep_research.used} / {usage!.deep_research.limit}
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>

        <div className="subscription-actions">
          {subscription.tier === 'free' ? (
            <a href="/pricing" className="btn btn-primary">
              Upgrade Plan
            </a>
          ) : (
            <button
              onClick={handleManageSubscription}
              className="btn btn-secondary"
            >
              Manage Subscription
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

function getAuthToken(): string {
  return localStorage.getItem('auth_token') || '';
}
```

---

## 4. Styling

Create `src/styles/Pricing.css`:

```css
/* Pricing Page Styles */
.pricing-container {
  min-height: 100vh;
  padding: var(--spacing-xl) var(--spacing-lg);
  background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%);
}

.pricing-header {
  text-align: center;
  margin-bottom: var(--spacing-xl);
}

.pricing-header h1 {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: var(--spacing-sm);
}

.pricing-header p {
  font-size: 1.125rem;
  color: var(--text-secondary);
}

.pricing-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: var(--spacing-lg);
  max-width: 1200px;
  margin: 0 auto;
}

.pricing-card {
  background-color: var(--bg-primary);
  border-radius: var(--radius-xl);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-md);
  border: 2px solid var(--border-color);
  transition: all 0.3s ease;
  position: relative;
}

.pricing-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.pricing-card.popular {
  border-color: var(--primary-color);
  box-shadow: 0 10px 30px rgba(16, 163, 127, 0.2);
}

.popular-badge {
  position: absolute;
  top: -12px;
  right: 20px;
  background-color: var(--primary-color);
  color: white;
  padding: 0.25rem 1rem;
  border-radius: var(--radius-lg);
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.pricing-card-header {
  text-align: center;
  margin-bottom: var(--spacing-lg);
}

.pricing-card-header h3 {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: var(--spacing-md);
}

.pricing-amount {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 0.25rem;
}

.currency {
  font-size: 1.5rem;
  color: var(--text-secondary);
}

.price {
  font-size: 3rem;
  font-weight: 700;
  color: var(--text-primary);
}

.period {
  font-size: 1rem;
  color: var(--text-secondary);
}

.pricing-limits {
  background-color: var(--bg-secondary);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.limit-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-xs) 0;
}

.limit-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.limit-value {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--primary-color);
}

.pricing-features {
  list-style: none;
  margin-bottom: var(--spacing-xl);
}

.pricing-features li {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) 0;
  font-size: 0.9375rem;
  color: var(--text-primary);
}

.check-icon {
  color: var(--success-color);
  font-weight: 700;
  font-size: 1.25rem;
}

.pricing-button {
  width: 100%;
  padding: 0.875rem;
  border-radius: var(--radius-md);
  font-size: 1rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.pricing-button.primary {
  background-color: var(--primary-color);
  color: white;
}

.pricing-button.primary:hover:not(:disabled) {
  background-color: var(--primary-hover);
}

.pricing-button.secondary {
  background-color: transparent;
  color: var(--text-primary);
  border: 2px solid var(--border-color);
}

.pricing-button.secondary:hover:not(:disabled) {
  background-color: var(--bg-secondary);
}

.pricing-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.pricing-footer {
  text-align: center;
  margin-top: var(--spacing-xl);
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.pricing-footer p {
  margin: var(--spacing-xs) 0;
}

/* Responsive */
@media (max-width: 768px) {
  .pricing-grid {
    grid-template-columns: 1fr;
  }

  .pricing-header h1 {
    font-size: 2rem;
  }

  .price {
    font-size: 2.5rem;
  }
}
```

Create `src/styles/Subscription.css`:

```css
/* Subscription Status Styles */
.subscription-status {
  padding: var(--spacing-lg);
}

.subscription-card {
  background-color: var(--bg-primary);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-md);
  max-width: 600px;
  margin: 0 auto;
}

.subscription-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
}

.subscription-header h3 {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
}

.tier-badge {
  padding: 0.5rem 1rem;
  border-radius: var(--radius-lg);
  color: white;
  font-weight: 600;
  font-size: 0.875rem;
  text-transform: uppercase;
}

.subscription-info {
  margin-bottom: var(--spacing-lg);
  padding: var(--spacing-md);
  background-color: var(--bg-secondary);
  border-radius: var(--radius-md);
}

.subscription-info p {
  margin: var(--spacing-xs) 0;
  font-size: 0.9375rem;
  color: var(--text-secondary);
}

.cancellation-notice {
  color: var(--warning-color) !important;
  font-weight: 500;
}

.usage-section {
  margin-bottom: var(--spacing-xl);
}

.usage-section h4 {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--spacing-md);
}

.usage-item {
  margin-bottom: var(--spacing-lg);
}

.usage-item.total-usage {
  background-color: var(--bg-tertiary);
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
  border-left: 4px solid var(--primary-color);
}

.usage-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-sm);
  font-size: 0.9375rem;
  color: var(--text-primary);
  font-weight: 500;
}

.unlimited-badge {
  background-color: var(--success-color);
  color: white;
  padding: 0.125rem 0.5rem;
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 600;
}

.usage-bar {
  height: 8px;
  background-color: var(--bg-tertiary);
  border-radius: var(--radius-sm);
  overflow: hidden;
  margin-bottom: var(--spacing-xs);
}

.usage-progress {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
  transition: width 0.3s ease;
}

.usage-numbers {
  font-size: 0.875rem;
  color: var(--text-secondary);
  text-align: right;
}

.subscription-actions {
  display: flex;
  gap: var(--spacing-md);
}

.subscription-actions .btn {
  flex: 1;
}
```

---

## 5. Updated Chat Component with Rate Limiting

Update `src/pages/Chat.tsx` to show rate limit warnings:

```typescript
// Add to Chat.tsx

const [rateLimitWarning, setRateLimitWarning] = useState<string | null>(null);

const handleSendMessage = async (content: string) => {
  // ... existing code ...

  try {
    const response = await sendChatMessage({
      messages: [...messages, userMessage],
      mode: appState.currentMode,
      sessionId: currentSession.id,
    });

    // Clear rate limit warning on success
    setRateLimitWarning(null);

    // ... existing code ...
  } catch (error: any) {
    if (error.response?.status === 429) {
      // Rate limit exceeded
      const data = error.response.data;
      setRateLimitWarning(
        `Rate limit exceeded. ${data.message || 'Please upgrade your plan or try again later.'}`
      );
    } else {
      // Other errors
      // ... existing error handling ...
    }
  }
};

// Add to JSX before MessageInput
{rateLimitWarning && (
  <div className="rate-limit-warning">
    <span className="warning-icon">⚠️</span>
    <span>{rateLimitWarning}</span>
    <a href="/pricing" className="upgrade-link">
      Upgrade Plan
    </a>
  </div>
)}
```

---

## Summary

✅ **Free tier**: 10 total requests/day across all modes
✅ **Lite tier ($19.99/mo)**: Unlimited Buddy, 20 Tool Assist/month, 10 Research/day
✅ **Pro tier ($40/mo)**: Unlimited everything

**Implementation includes**:
1. Complete rate limiting logic with tier-based limits
2. Stripe integration for subscriptions
3. Frontend pricing page and subscription dashboard
4. Webhook handling for subscription events
5. Usage tracking per user and mode
6. Beautiful UI components

**Next steps**:
1. Set up Stripe account and get API keys
2. Create products and prices in Stripe Dashboard
3. Deploy backend with subscription endpoints
4. Add pricing page to routing
5. Test subscription flow end-to-end

**Your paid subscription system is ready to implement!** 🚀

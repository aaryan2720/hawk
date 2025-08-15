
# Payment Implementation Guide

## Overview
This document outlines the structure and implementation process for integrating payment systems into the HAWK Security Monitoring Platform. We support both one-time payments and subscription-based recurring payments using Stripe.

## Payment System Architecture

### 1. System Components

```
Frontend (React)
    ↓
Supabase Edge Functions
    ↓
Stripe API
    ↓
Database (PostgreSQL)
```

### 2. Required Setup

#### Prerequisites
- Active Supabase project with authentication enabled
- Stripe account (Test and Live mode)
- User authentication system implemented
- Environment variables configured

#### Environment Variables Required
```bash
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

## Implementation Types

### Type 1: One-Time Payments

#### Use Cases
- Premium feature unlocks
- One-time security scans
- Report purchases
- Software licenses

#### Database Schema
```sql
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_session_id TEXT UNIQUE,
  amount INTEGER,             -- Amount in cents
  currency TEXT DEFAULT 'usd',
  status TEXT,                -- 'pending', 'paid', 'failed'
  product_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- User can view their own orders
CREATE POLICY "select_own_orders" ON public.orders
  FOR SELECT USING (user_id = auth.uid());

-- Edge functions can insert/update
CREATE POLICY "insert_order" ON public.orders
  FOR INSERT WITH CHECK (true);

CREATE POLICY "update_order" ON public.orders
  FOR UPDATE USING (true);
```

#### Edge Function: create-payment
```typescript
// Location: supabase/functions/create-payment/index.ts
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

serve(async (req) => {
  // CORS handling
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    
    if (!user?.email) throw new Error("User not authenticated");

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Get request body
    const { amount, productName } = await req.json();

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer_email: user.email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: productName },
            unit_amount: amount, // in cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/payment-canceled`,
    });

    // Store order in database
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    await supabaseService.from("orders").insert({
      user_id: user.id,
      stripe_session_id: session.id,
      amount: amount,
      status: "pending",
      product_name: productName,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
```

### Type 2: Subscription Payments

#### Use Cases
- Monthly/yearly security monitoring
- Premium dashboard access
- Enterprise features
- Multi-user accounts

#### Database Schema
```sql
CREATE TABLE public.subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  stripe_customer_id TEXT,
  subscribed BOOLEAN NOT NULL DEFAULT false,
  subscription_tier TEXT, -- 'basic', 'premium', 'enterprise'
  subscription_end TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "select_own_subscription" ON public.subscribers
  FOR SELECT USING (user_id = auth.uid() OR email = auth.email());

CREATE POLICY "update_own_subscription" ON public.subscribers
  FOR UPDATE USING (true);

CREATE POLICY "insert_subscription" ON public.subscribers
  FOR INSERT WITH CHECK (true);
```

#### Edge Functions Required

1. **create-checkout** - Creates subscription checkout session
2. **check-subscription** - Verifies and updates subscription status
3. **customer-portal** - Manages subscription via Stripe portal

## Frontend Integration

### Payment Button Component
```typescript
// components/PaymentButton.tsx
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

interface PaymentButtonProps {
  amount: number;
  productName: string;
  type: 'payment' | 'subscription';
}

export const PaymentButton = ({ amount, productName, type }: PaymentButtonProps) => {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        type === 'subscription' ? 'create-checkout' : 'create-payment',
        {
          body: { amount, productName }
        }
      );

      if (error) throw error;
      
      // Redirect to Stripe Checkout
      window.open(data.url, '_blank');
    } catch (error) {
      console.error('Payment error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handlePayment} disabled={loading}>
      {loading ? 'Processing...' : `Pay $${amount / 100}`}
    </Button>
  );
};
```

### Subscription Status Component
```typescript
// components/SubscriptionStatus.tsx
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';

export const SubscriptionStatus = () => {
  const [subscription, setSubscription] = useState(null);

  useEffect(() => {
    checkSubscription();
  }, []);

  const checkSubscription = async () => {
    const { data } = await supabase.functions.invoke('check-subscription');
    setSubscription(data);
  };

  return (
    <div className="flex items-center gap-2">
      <Badge variant={subscription?.subscribed ? 'default' : 'secondary'}>
        {subscription?.subscribed ? subscription.subscription_tier : 'Free'}
      </Badge>
      {subscription?.subscription_end && (
        <span className="text-sm text-muted-foreground">
          Until {new Date(subscription.subscription_end).toLocaleDateString()}
        </span>
      )}
    </div>
  );
};
```

## Security Considerations

### 1. Data Protection
- Never expose Stripe secret keys in frontend code
- Use Supabase Row Level Security (RLS) policies
- Validate all user inputs in edge functions
- Use service role key only in backend functions

### 2. Error Handling
- Implement proper error messages for users
- Log errors for debugging (but not sensitive data)
- Handle payment failures gracefully
- Provide clear next steps for users

### 3. Testing
- Use Stripe test mode for development
- Test with various payment scenarios
- Verify webhook handling (if implemented)
- Test subscription lifecycle events

## Deployment Checklist

### Before Going Live
- [ ] Switch to Stripe live keys
- [ ] Configure production webhook endpoints
- [ ] Set up proper error monitoring
- [ ] Test payment flows end-to-end
- [ ] Configure email notifications
- [ ] Set up proper logging
- [ ] Verify RLS policies
- [ ] Test subscription cancellation flows

### Post-Deployment
- [ ] Monitor payment success rates
- [ ] Track subscription metrics
- [ ] Set up alerts for failed payments
- [ ] Regular backup of payment data
- [ ] Monitor for suspicious activity

## Troubleshooting

### Common Issues
1. **Payment not reflecting** - Check webhook configuration
2. **User not authenticated** - Verify auth token handling
3. **Stripe errors** - Check API key configuration
4. **Database errors** - Verify RLS policies and permissions

### Debug Tools
- Supabase logs for edge function debugging
- Stripe dashboard for payment tracking
- Browser dev tools for frontend issues
- Database query logs for RLS issues

## Support and Maintenance

### Regular Tasks
- Update Stripe API versions
- Monitor subscription churn rates
- Review failed payment logs
- Update pricing strategies
- Maintain edge function dependencies

### Monitoring Metrics
- Payment success rates
- Subscription conversion rates
- Churn rates
- Average revenue per user (ARPU)
- Customer lifetime value (CLV)

This implementation provides a robust, secure, and scalable payment system for the HAWK Security Monitoring Platform.

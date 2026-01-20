# Vane Setup Guide

## Prerequisites

1. **Supabase Account**: https://supabase.com
2. **Stripe Account**: https://stripe.com
3. **Node.js 18+** and **pnpm**

## Installation

```bash
# Install dependencies
pnpm install

# Install additional packages
pnpm add @supabase/supabase-js @supabase/auth-helpers-sveltekit
pnpm add stripe @stripe/stripe-js
pnpm add -D @sveltejs/adapter-cloudflare
```

## Supabase Setup

### 1. Create a New Project

1. Go to https://app.supabase.com
2. Click "New Project"
3. Copy your project URL and anon key

### 2. Run Database Migration

Execute this SQL in your Supabase SQL Editor:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  name TEXT,
  stripe_customer_id TEXT UNIQUE,
  plan TEXT DEFAULT 'free',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Policy: System can insert profiles
CREATE POLICY "System can insert profiles"
  ON profiles
  FOR INSERT
  WITH CHECK (true);

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create watchlists table
CREATE TABLE watchlists (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  companies JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE watchlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own watchlists"
  ON watchlists
  FOR ALL
  USING (auth.uid() = user_id);
```

### 3. Configure Authentication

1. Go to Authentication > Providers
2. Enable Email provider (enabled by default)
3. **Optional**: Enable Google, GitHub, or Apple OAuth

For Google OAuth:
- Go to Google Cloud Console
- Create OAuth 2.0 credentials
- Add authorized redirect: `https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback`
- Copy Client ID and Secret to Supabase

### 4. Get Your Keys

Go to Settings > API and copy:
- Project URL → `PUBLIC_SUPABASE_URL`
- `anon` `public` key → `PUBLIC_SUPABASE_ANON_KEY`
- `service_role` `secret` key → `SUPABASE_SERVICE_ROLE_KEY` (keep secret!)

## Stripe Setup

### 1. Create Products

1. Go to https://dashboard.stripe.com/products
2. Create "Individual Plan":
   - Name: Individual
   - Price: $20 every 6 months
   - Copy Price ID → `STRIPE_INDIVIDUAL_PRICE_ID`

### 2. Get API Keys

Go to Developers > API Keys:
- Publishable key → `PUBLIC_STRIPE_PUBLISHABLE_KEY`
- Secret key → `STRIPE_SECRET_KEY`

### 3. Set Up Webhook

1. Go to Developers > Webhooks
2. Click "Add endpoint"
3. URL: `https://your-domain.pages.dev/api/stripe-webhook` (update after deployment)
4. Events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Copy Signing secret → `STRIPE_WEBHOOK_SECRET`

## Environment Variables

Create `.env` file:

```bash
cp .env.example .env
```

Fill in all values from Supabase and Stripe.

## Cloudflare Setup

### 1. Update svelte.config.js

Already configured to use `@sveltejs/adapter-cloudflare`.

### 2. Deploy

```bash
# Build
pnpm run build

# Deploy to Cloudflare Pages
# Either:
# - Connect GitHub repo to Cloudflare Pages dashboard
# - Or use Wrangler CLI
```

### 3. Set Environment Variables in Cloudflare

Go to your Pages project > Settings > Environment Variables

Add all variables from `.env` (except `PUBLIC_*` ones get added during build).

### 4. Update Stripe Webhook URL

Once deployed, update your Stripe webhook endpoint URL to:
`https://your-app.pages.dev/api/stripe-webhook`

## Development

```bash
# Start dev server
pnpm run dev

# Open http://localhost:5173
```

## Testing Stripe

Use Stripe test cards:
- Success: `4242 4242 4242 4242`
- Requires authentication: `4000 0025 0000 3155`
- Declined: `4000 0000 0000 9995`

Use any future date for expiry and any 3 digits for CVC.

## Security Checklist

- [ ] Never commit `.env` to git
- [ ] Use `SUPABASE_SERVICE_ROLE_KEY` only on server
- [ ] Use `STRIPE_SECRET_KEY` only on server
- [ ] Verify Stripe webhook signatures
- [ ] Enable RLS on all Supabase tables
- [ ] Use Supabase Auth for authentication
- [ ] Validate user permissions on server endpoints

#!/bin/bash

# Cloudflare Workers Secrets Setup Script
# Run this script to set up all required environment variables as Wrangler secrets

echo "🔧 Setting up Cloudflare Workers secrets..."

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI not found. Please install it first:"
    echo "npm install -g wrangler"
    exit 1
fi

# Check if user is logged in
echo "📋 Checking Wrangler authentication..."
if ! wrangler whoami &> /dev/null; then
    echo "❌ Not logged in to Wrangler. Please run:"
    echo "wrangler login"
    exit 1
fi

echo "✅ Wrangler is ready!"

# Function to set secret if not empty
set_secret() {
    local key=$1
    local value=$2
    
    if [ -n "$value" ]; then
        echo "Setting $key..."
        echo "$value" | wrangler secret put "$key"
    else
        echo "⚠️  Skipping $key (empty value)"
    fi
}

# Prompt for required secrets
echo ""
echo "🔐 Please provide the following secrets:"
echo "   (Press Enter to skip optional ones)"
echo ""

# Supabase secrets
read -p "NEXT_PUBLIC_SUPABASE_ANON_KEY: " NEXT_PUBLIC_SUPABASE_ANON_KEY
read -p "SUPABASE_SERVICE_ROLE_KEY: " SUPABASE_SERVICE_ROLE_KEY
read -p "DATABASE_URL (Supabase connection string): " DATABASE_URL

# Stripe secrets
read -p "STRIPE_SECRET_KEY: " STRIPE_SECRET_KEY
read -p "STRIPE_WEBHOOK_SECRET: " STRIPE_WEBHOOK_SECRET
read -p "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: " NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

# AI API keys
read -p "OPENROUTER_API_KEY: " OPENROUTER_API_KEY
read -p "OPENAI_API_KEY (optional): " OPENAI_API_KEY

# Redis/Upstash
read -p "UPSTASH_REDIS_REST_URL: " UPSTASH_REDIS_REST_URL
read -p "UPSTASH_REDIS_REST_TOKEN: " UPSTASH_REDIS_REST_TOKEN

# Stack Auth
read -p "STACK_SECRET_SERVER_KEY: " STACK_SECRET_SERVER_KEY

# Optional: Sentry
read -p "SENTRY_DSN (optional): " SENTRY_DSN
read -p "SENTRY_AUTH_TOKEN (optional): " SENTRY_AUTH_TOKEN

echo ""
echo "📤 Setting secrets in Cloudflare Workers..."

# Set all secrets
set_secret "NEXT_PUBLIC_SUPABASE_ANON_KEY" "$NEXT_PUBLIC_SUPABASE_ANON_KEY"
set_secret "SUPABASE_SERVICE_ROLE_KEY" "$SUPABASE_SERVICE_ROLE_KEY"
set_secret "DATABASE_URL" "$DATABASE_URL"
set_secret "STRIPE_SECRET_KEY" "$STRIPE_SECRET_KEY"
set_secret "STRIPE_WEBHOOK_SECRET" "$STRIPE_WEBHOOK_SECRET"
set_secret "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" "$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
set_secret "OPENROUTER_API_KEY" "$OPENROUTER_API_KEY"
set_secret "OPENAI_API_KEY" "$OPENAI_API_KEY"
set_secret "UPSTASH_REDIS_REST_URL" "$UPSTASH_REDIS_REST_URL"
set_secret "UPSTASH_REDIS_REST_TOKEN" "$UPSTASH_REDIS_REST_TOKEN"
set_secret "STACK_SECRET_SERVER_KEY" "$STACK_SECRET_SERVER_KEY"
set_secret "SENTRY_DSN" "$SENTRY_DSN"
set_secret "SENTRY_AUTH_TOKEN" "$SENTRY_AUTH_TOKEN"

echo ""
echo "✅ Secrets setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Update environment variables in wrangler.toml:"
echo "   - NEXT_PUBLIC_SUPABASE_URL"
echo "   - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
echo ""
echo "2. Create R2 buckets (if not exists):"
echo "   wrangler r2 bucket create aimarker-storage"
echo "   wrangler r2 bucket create aimarker-cache"
echo ""
echo "3. Test your deployment:"
echo "   npm run preview"
echo ""
echo "4. Deploy to production:"
echo "   npm run deploy"
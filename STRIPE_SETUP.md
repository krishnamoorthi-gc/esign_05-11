# Stripe Integration Setup Guide

This guide will help you complete the Stripe integration setup for the OpenSign project.

## Prerequisites

1. A Stripe account (sign up at https://dashboard.stripe.com/register)
2. Access to your Stripe Dashboard
3. A working OpenSign installation

## Step 1: Create Products and Prices in Stripe Dashboard

1. Log in to your Stripe Dashboard
2. Navigate to "Products" in the left sidebar
3. Click "Add product" to create your subscription products:
   - Create a "Premium" product with a monthly price (e.g., $5)
   - Create a "Gold" product with a monthly price (e.g., $10)
4. Note down the Price IDs for each product (they look like `price_XYZ123`)

## Step 2: Update Environment Variables

### Backend Environment Variables (.env file in backend/OpenSignServer/)

Update the following variables in your backend [.env](file:///c:/Users/GC-IT/Documents/Backups/backup%20another/backend/OpenSignServer/.env) file:

```
STRIPE_PUBLISHABLE_KEY=pk_test_... # Your Stripe publishable key
STRIPE_SECRET_KEY=sk_test_... # Your Stripe secret key
STRIPE_PREMIUM_PRICE_ID=price_... # The Price ID for your Premium product
STRIPE_GOLD_PRICE_ID=price_... # The Price ID for your Gold product
STRIPE_WEBHOOK_SECRET=whsec_... # Your webhook signing secret (see Step 3)
```

### Frontend Environment Variables (.env file in frontend/OpenSign/)

Update the following variable in your frontend [.env](file:///c:/Users/GC-IT/Documents/Backups/backup%20another/frontend/OpenSign/.env) file:

```
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_... # Your Stripe publishable key (same as backend)
```

## Step 3: Set Up Webhooks

1. In your Stripe Dashboard, go to "Developers" > "Webhooks"
2. Click "Add endpoint"
3. Enter your endpoint URL: `https://yourdomain.com/stripe-webhook`
   (For local development: `http://localhost:8080/stripe-webhook`)
4. Select the following events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Click "Add endpoint"
6. Copy the "Signing secret" and update `STRIPE_WEBHOOK_SECRET` in your backend [.env](file:///c:/Users/GC-IT/Documents/Backups/backup%20another/backend/OpenSignServer/.env) file

## Step 4: Test the Integration

1. Restart your backend and frontend servers
2. Navigate to the subscription page in your OpenSign application
3. Try selecting a plan and completing a test payment using Stripe's test card numbers:
   - Test card: 4242 4242 4242 4242
   - Any valid future expiration date
   - Any 3-digit CVC
   - Any postal code

## Troubleshooting

### Common Issues

1. **Webhook verification fails**: Ensure your webhook secret is correctly set and your server can receive raw body data
2. **Price ID errors**: Make sure you're using the actual Price IDs from Stripe, not placeholder values
3. **CORS issues**: Ensure your frontend URL is whitelisted in your backend configuration

### Validating Your Setup

Run the validation script to check your configuration:

```bash
cd backend/OpenSignServer
node scripts/validate-stripe-config.js
```

If you don't have the validation script, you can create it using the template in the documentation.

## Security Best Practices

1. Never commit your actual API keys to version control
2. Use environment variables for all sensitive configuration
3. Regularly rotate your API keys
4. Use Stripe's test mode during development
5. Ensure your webhook endpoint is secured with the signing secret verification
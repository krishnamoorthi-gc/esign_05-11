# Stripe Setup Scripts

This directory contains scripts to help set up and validate your Stripe integration with OpenSign.

## Scripts

### 1. Validate Stripe Configuration
Validates that your Stripe configuration is correct.

```bash
node validate-stripe-config.js
```

Or using npm:
```bash
npm run validate
```

### 2. Setup Stripe Products
Automatically creates Stripe products and prices for your subscription plans.

```bash
node setup-stripe-products.js
```

Or using npm:
```bash
npm run setup-products
```

### 3. Test Webhook Endpoint
Tests that your webhook endpoint is accessible and properly configured.

```bash
node test-webhook.js
```

Or using npm:
```bash
npm run test-webhook
```

### 4. Complete Setup
Runs both the product setup and validation scripts.

```bash
npm run setup
```

## Prerequisites

1. A Stripe account with API keys
2. Environment variables configured in your [.env](file:///c:/Users/GC-IT/Documents/Backups/backup%20another/backend/OpenSignServer/.env) file:
   - `STRIPE_SECRET_KEY`
   - `STRIPE_PUBLISHABLE_KEY`

## Usage

1. Configure your environment variables in the backend [.env](file:///c:/Users/GC-IT/Documents/Backups/backup%20another/backend/OpenSignServer/.env) file
2. Run the setup script to create products and prices:
   ```bash
   npm run setup
   ```
3. Test your webhook endpoint:
   ```bash
   npm run test-webhook
   ```
4. Validate your complete configuration:
   ```bash
   npm run validate
   ```

## Troubleshooting

If you encounter any issues:

1. Ensure your Stripe API keys are correct
2. Check that your network allows outgoing connections to Stripe
3. Verify that your webhook endpoint is accessible from the internet (for production)
4. Make sure you've restarted your server after updating environment variables
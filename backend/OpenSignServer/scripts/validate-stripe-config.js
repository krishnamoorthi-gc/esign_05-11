/**
 * Script to validate Stripe configuration
 * Run with: node scripts/validate-stripe-config.js
 */

// Load environment variables
require('dotenv').config({ path: '../.env' });

const stripe = require('stripe');

// Check if required environment variables are set
const requiredEnvVars = [
  'STRIPE_SECRET_KEY',
  'STRIPE_PUBLISHABLE_KEY',
  'STRIPE_PREMIUM_PRICE_ID',
  'STRIPE_GOLD_PRICE_ID',
];

console.log('🔍 Validating Stripe Configuration...\n');

let configValid = true;

// Check each required environment variable
requiredEnvVars.forEach(envVar => {
  if (process.env[envVar]) {
    console.log(`✅ ${envVar}: Set`);
  } else {
    console.log(`❌ ${envVar}: Missing`);
    configValid = false;
  }
});

if (!configValid) {
  console.log('\n❌ Configuration is incomplete. Please set all required environment variables.');
  process.exit(1);
}

// Initialize Stripe with the secret key
const stripeInstance = stripe(process.env.STRIPE_SECRET_KEY);

// Test Stripe API connectivity
async function testStripeConnection() {
  try {
    console.log('\n🔍 Testing Stripe API connectivity...');
    const products = await stripeInstance.products.list({ limit: 1 });
    console.log('✅ Stripe API connection successful');
    return true;
  } catch (error) {
    console.log('❌ Stripe API connection failed:', error.message);
    return false;
  }
}

// Validate Price IDs
async function validatePriceIds() {
  console.log('\n🔍 Validating Price IDs...');

  const priceIds = [
    { name: 'Premium', id: process.env.STRIPE_PREMIUM_PRICE_ID },
    { name: 'Gold', id: process.env.STRIPE_GOLD_PRICE_ID },
  ];

  let allValid = true;

  for (const price of priceIds) {
    try {
      if (
        !price.id ||
        price.id.includes('your_actual') ||
        price.id === 'price_Premium' ||
        price.id === 'price_Gold'
      ) {
        console.log(`❌ ${price.name} Price ID: Invalid placeholder value`);
        allValid = false;
        continue;
      }

      const priceData = await stripeInstance.prices.retrieve(price.id);
      console.log(
        `✅ ${price.name} Price ID (${price.id}): Valid - $${(priceData.unit_amount / 100).toFixed(
          2
        )} ${priceData.currency.toUpperCase()}/${priceData.recurring?.interval || 'one-time'}`
      );
    } catch (error) {
      console.log(`❌ ${price.name} Price ID (${price.id}): Invalid - ${error.message}`);
      allValid = false;
    }
  }

  return allValid;
}

// Main validation function
async function validateConfiguration() {
  console.log('🔐 Stripe Configuration Validator');
  console.log('================================\n');

  // Test Stripe connection
  const connectionValid = await testStripeConnection();

  // Validate Price IDs
  const pricesValid = await validatePriceIds();

  console.log('\n📋 Summary:');
  console.log('===========');

  if (configValid && connectionValid && pricesValid) {
    console.log('✅ All validations passed! Your Stripe configuration is ready.');
    console.log('\n📝 Next steps:');
    console.log('1. Ensure your webhook is configured in the Stripe Dashboard');
    console.log('2. Test the checkout flow in your application');
    console.log('3. Verify webhook handling works correctly');
  } else {
    console.log(
      '❌ Some validations failed. Please check the errors above and fix your configuration.'
    );
    process.exit(1);
  }
}

// Run validation
validateConfiguration().catch(error => {
  console.error('Unexpected error during validation:', error);
  process.exit(1);
});

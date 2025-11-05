/**
 * Script to automatically create Stripe products and prices
 * Run with: node scripts/setup-stripe-products.js
 */

// Load environment variables
require('dotenv').config({ path: '../.env' });

const stripe = require('stripe');
const fs = require('fs');
const path = require('path');

// Check if Stripe secret key is set
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY is not set in environment variables');
  process.exit(1);
}

// Initialize Stripe
const stripeInstance = stripe(process.env.STRIPE_SECRET_KEY);

// Product definitions
const products = [
  {
    name: 'Premium',
    description: 'Premium plan for individuals',
    price: 500, // $5.00 in cents
    interval: 'month',
    currency: 'usd',
  },
  {
    name: 'Gold',
    description: 'Gold plan for teams',
    price: 1000, // $10.00 in cents
    interval: 'month',
    currency: 'usd',
  },
];

async function createProducts() {
  console.log('🚀 Setting up Stripe products and prices...\n');

  const envUpdates = {};

  try {
    for (const productData of products) {
      console.log(`📦 Creating ${productData.name} product...`);

      // Create product
      const product = await stripeInstance.products.create({
        name: productData.name,
        description: productData.description,
        metadata: {
          plan_type: productData.name.toLowerCase(),
        },
      });

      console.log(`✅ Created product: ${product.name} (ID: ${product.id})`);

      // Create price
      console.log(`💰 Creating price for ${productData.name}...`);
      const price = await stripeInstance.prices.create({
        product: product.id,
        unit_amount: productData.price,
        currency: productData.currency,
        recurring: {
          interval: productData.interval,
        },
        metadata: {
          plan_type: productData.name.toLowerCase(),
        },
      });

      console.log(
        `✅ Created price: ${price.id} (${(price.unit_amount / 100).toFixed(
          2
        )} ${price.currency.toUpperCase()}/${price.recurring.interval})\n`
      );

      // Store price ID for environment update
      envUpdates[`STRIPE_${productData.name.toUpperCase()}_PRICE_ID`] = price.id;
    }

    // Update environment file
    await updateEnvFile(envUpdates);

    console.log('✅ Stripe products and prices setup completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Restart your backend server to load the new environment variables');
    console.log('2. Test the checkout flow in your application');
  } catch (error) {
    console.error('❌ Error setting up Stripe products:', error.message);
    process.exit(1);
  }
}

async function updateEnvFile(updates) {
  const envPath = path.join(__dirname, '..', '.env');

  // Read current .env file
  let envContent = '';
  try {
    envContent = fs.readFileSync(envPath, 'utf8');
  } catch (error) {
    console.log('⚠️  .env file not found, will create a new one');
    envContent = '';
  }

  // Update or add the price IDs
  Object.entries(updates).forEach(([key, value]) => {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (regex.test(envContent)) {
      // Update existing line
      envContent = envContent.replace(regex, `${key}=${value}`);
    } else {
      // Add new line
      envContent += `\n${key}=${value}`;
    }
  });

  // Write updated content back to .env file
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Updated .env file with new Price IDs');
}

// Run the setup
createProducts();

/**
 * Script to test the Stripe webhook endpoint
 * Run with: node scripts/test-webhook.js
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '../.env' });

// Check if required environment variables are set
if (!process.env.SERVER_URL) {
  console.error('❌ SERVER_URL is not set in environment variables');
  process.exit(1);
}

const serverUrl = process.env.SERVER_URL;
const webhookUrl = `${serverUrl.replace('/app', '')}/stripe-webhook`;

console.log('🔍 Testing Stripe Webhook Endpoint...\n');
console.log(`📍 Webhook URL: ${webhookUrl}\n`);

// Test webhook endpoint
function testWebhookEndpoint() {
  return new Promise((resolve, reject) => {
    const url = new URL(webhookUrl);
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Stripe/1.0',
        'Stripe-Signature': 't=12345,v1=abcd1234',
      },
    };

    const protocol = url.protocol === 'https:' ? https : http;

    const req = protocol.request(webhookUrl, options, res => {
      let data = '';

      res.on('data', chunk => {
        data += chunk;
      });

      res.on('end', () => {
        console.log(`✅ HTTP Status: ${res.statusCode}`);
        console.log(`✅ Content-Type: ${res.headers['content-type']}`);

        if (res.statusCode === 400) {
          console.log(
            '✅ Webhook endpoint is responding correctly (expected 400 for invalid signature)'
          );
          resolve(true);
        } else if (res.statusCode === 200) {
          console.log('✅ Webhook endpoint is accessible');
          resolve(true);
        } else {
          console.log(`⚠️  Unexpected status code: ${res.statusCode}`);
          resolve(false);
        }
      });
    });

    req.on('error', error => {
      console.log(`❌ Error connecting to webhook endpoint: ${error.message}`);
      reject(false);
    });

    // Send minimal payload
    req.write(JSON.stringify({}));
    req.end();
  });
}

// Main function
async function main() {
  console.log('🔐 Stripe Webhook Endpoint Tester');
  console.log('================================\n');

  try {
    const success = await testWebhookEndpoint();

    if (success) {
      console.log('\n✅ Webhook endpoint test completed successfully!');
      console.log('\n📝 Next steps:');
      console.log('1. Configure your webhook in the Stripe Dashboard with this URL');
      console.log(
        '2. Copy the webhook signing secret to your STRIPE_WEBHOOK_SECRET environment variable'
      );
    } else {
      console.log('\n❌ Webhook endpoint test failed. Please check your server configuration.');
    }
  } catch (error) {
    console.error('❌ Unexpected error during webhook test:', error.message);
    process.exit(1);
  }
}

// Run the test
main();

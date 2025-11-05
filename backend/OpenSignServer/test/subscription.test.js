/**
 * Test script for subscription functionality
 */

import Parse from 'parse/node.js';

async function testSubscriptionFunctionality() {
  try {
    console.log('Testing subscription functionality...');

    // Test checkSubscriptionStatus cloud function
    console.log('Testing checkSubscriptionStatus cloud function...');
    try {
      const subscriptionStatus = await Parse.Cloud.run('checkSubscriptionStatus');
      console.log('✓ checkSubscriptionStatus function works correctly');
      console.log('Subscription status:', subscriptionStatus);
    } catch (error) {
      console.log('✗ Error testing checkSubscriptionStatus:', error.message);
    }

    // Test updateSubscription cloud function
    console.log('Testing updateSubscription cloud function...');
    try {
      const updateResult = await Parse.Cloud.run('updateSubscription', {
        plan: 'Premium',
        duration: 30,
      });
      console.log('✓ updateSubscription function works correctly');
      console.log('Update result:', updateResult);
    } catch (error) {
      console.log('✗ Error testing updateSubscription:', error.message);
    }

    console.log('Subscription functionality test completed!');
  } catch (error) {
    console.error('Error in subscription test:', error);
  }
}

// Run the test
testSubscriptionFunctionality();

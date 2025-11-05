/**
 * Script to check trial status for a specific user by email
 * Usage: node checkUserTrialStatus.js kris123456krishna123456@gmail.com
 */

// Import Parse SDK
import Parse from 'parse/node.js';

// Initialize Parse (you'll need to set these to your actual values)
const SERVER_URL = process.env.SERVER_URL || 'http://localhost:8081/app';
const APP_ID = process.env.APP_ID || 'opensign';
const MASTER_KEY = process.env.MASTER_KEY || 'your_master_key_here';

Parse.serverURL = SERVER_URL;
Parse.initialize(APP_ID);
Parse.masterKey = MASTER_KEY;

async function checkUserTrialStatus(email) {
  try {
    console.log(`Checking trial status for user with email: ${email}`);

    // Query the contracts_Users class for the specific user
    const usersQuery = new Parse.Query('contracts_Users');
    usersQuery.equalTo('Email', email.toLowerCase().replace(/\s/g, ''));

    const user = await usersQuery.first({ useMasterKey: true });

    if (!user) {
      console.log(`User with email ${email} not found`);
      return;
    }

    console.log(`User found: ${user.get('Name')} (${user.get('Email')})`);
    console.log(`User ID: ${user.id}`);

    // Get the trial start date or signup date
    const trialStartDate = user.get('TrialStartDate') || user.createdAt;
    const trialPeriodDays = 5; // 5-day trial period

    // Calculate trial end date
    const trialEndDate = new Date(trialStartDate);
    trialEndDate.setDate(trialEndDate.getDate() + trialPeriodDays);

    // Get current date
    const currentDate = new Date();

    // Check if trial has expired
    const isTrialExpired = currentDate > trialEndDate;

    // Calculate days remaining
    const timeDiff = trialEndDate.getTime() - currentDate.getTime();
    const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));

    // Display results
    console.log('\n--- Trial Status ---');
    console.log(`Trial Start Date: ${trialStartDate}`);
    console.log(`Trial End Date: ${trialEndDate}`);
    console.log(`Current Date: ${currentDate}`);
    console.log(`Is Trial Expired: ${isTrialExpired}`);
    console.log(`Days Remaining: ${daysRemaining > 0 ? daysRemaining : 0}`);

    if (isTrialExpired) {
      console.log('\n⚠️  WARNING: User trial has expired!');
    } else {
      console.log('\n✅ User trial is still active');
    }
  } catch (error) {
    console.error('Error checking user trial status:', error);
  }
}

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.log('Usage: node checkUserTrialStatus.js <email>');
  console.log('Example: node checkUserTrialStatus.js kris123456krishna123456@gmail.com');
  process.exit(1);
}

// Run the check
checkUserTrialStatus(email);

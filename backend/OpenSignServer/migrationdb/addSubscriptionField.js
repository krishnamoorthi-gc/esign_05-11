/**
 * Migration script to add Subscription field to existing users
 * This script should be run once to update all existing users in the database
 * to have a Subscription field
 */

// Import Parse SDK
import Parse from 'parse/node.js';

async function addSubscriptionFieldToExistingUsers() {
  try {
    console.log('Starting migration to add Subscription field to existing users...');

    // Query all users in the contracts_Users class
    const usersQuery = new Parse.Query('contracts_Users');
    usersQuery.doesNotExist('Subscription'); // Only get users that don't have Subscription field
    usersQuery.limit(1000); // Process in batches

    const users = await usersQuery.find({ useMasterKey: true });

    console.log(`Found ${users.length} users without Subscription field`);

    // Update each user to add the Subscription field
    for (const user of users) {
      try {
        // Set Subscription to null initially
        user.set('Subscription', null);
        await user.save(null, { useMasterKey: true });
        console.log(`Updated user ${user.id} with Subscription field`);
      } catch (saveError) {
        console.error(`Error updating user ${user.id}:`, saveError);
      }
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Error during migration:', error);
  }
}

// Run the migration
addSubscriptionFieldToExistingUsers();

export default addSubscriptionFieldToExistingUsers;

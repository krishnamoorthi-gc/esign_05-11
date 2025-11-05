/**
 * Migration script to add TrialStartDate field to existing users
 * This script should be run once to update all existing users in the database
 * to have a TrialStartDate field set to their createdAt date
 */

// Import Parse SDK
import Parse from 'parse/node.js';

async function addTrialStartDateToExistingUsers() {
  try {
    console.log('Starting migration to add TrialStartDate to existing users...');

    // Query all users in the contracts_Users class
    const usersQuery = new Parse.Query('contracts_Users');
    usersQuery.doesNotExist('TrialStartDate'); // Only get users that don't have TrialStartDate
    usersQuery.limit(1000); // Process in batches

    const users = await usersQuery.find({ useMasterKey: true });

    console.log(`Found ${users.length} users without TrialStartDate field`);

    // Update each user to add the TrialStartDate field
    for (const user of users) {
      try {
        // Set TrialStartDate to the user's createdAt date
        user.set('TrialStartDate', user.createdAt);
        await user.save(null, { useMasterKey: true });
        console.log(`Updated user ${user.id} with TrialStartDate: ${user.createdAt}`);
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
addTrialStartDateToExistingUsers();

export default addTrialStartDateToExistingUsers;

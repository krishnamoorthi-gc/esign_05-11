/**
 * Script to run all necessary database migrations for the subscription functionality
 */

import { default as addTrialStartDate } from './addTrialStartDate.js';
import { default as addSubscriptionField } from './addSubscriptionField.js';
import { default as addZapierKeyField } from './addZapierKeyField.js';

async function runAllMigrations() {
  try {
    console.log('Starting all database migrations...');

    // Run trial start date migration
    console.log('Running trial start date migration...');
    await addTrialStartDate();

    // Run subscription field migration
    console.log('Running subscription field migration...');
    await addSubscriptionField();

    // Run zapier key field migration
    console.log('Running zapier key field migration...');
    await addZapierKeyField();

    console.log('All migrations completed successfully!');
  } catch (error) {
    console.error('Error running migrations:', error);
  }
}

// Run all migrations
runAllMigrations();

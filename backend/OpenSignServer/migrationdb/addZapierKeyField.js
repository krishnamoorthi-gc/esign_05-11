/**
 * Migration script to add zapierKey field to partners_Tenant class
 * This script should be run once to update all existing tenants in the database
 * to have a zapierKey field
 */

// Import Parse SDK
import Parse from 'parse/node.js';

async function addZapierKeyFieldToTenants() {
  try {
    console.log('Starting migration to add zapierKey field to partners_Tenant class...');

    // Query all tenants in the partners_Tenant class
    const tenantQuery = new Parse.Query('partners_Tenant');
    tenantQuery.doesNotExist('zapierKey'); // Only get tenants that don't have zapierKey field
    tenantQuery.limit(1000); // Process in batches

    const tenants = await tenantQuery.find({ useMasterKey: true });

    console.log(`Found ${tenants.length} tenants without zapierKey field`);

    // Update each tenant to add the zapierKey field
    for (const tenant of tenants) {
      try {
        // Set zapierKey to null initially
        tenant.set('zapierKey', null);
        tenant.set('zapierKeyUpdatedAt', null);
        await tenant.save(null, { useMasterKey: true });
        console.log(`Updated tenant ${tenant.id} with zapierKey field`);
      } catch (saveError) {
        console.error(`Error updating tenant ${tenant.id}:`, saveError);
      }
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Error during migration:', error);
  }
}

// Run the migration
addZapierKeyFieldToTenants();

export default addZapierKeyFieldToTenants;

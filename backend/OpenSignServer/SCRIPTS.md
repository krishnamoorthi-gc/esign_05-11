# Available NPM Scripts

This document describes the available npm scripts for the OpenSign Server.

## Database Migration Scripts

### migrate:trial-start-date
Adds the `TrialStartDate` field to existing users in the `contracts_Users` collection.

```bash
npm run migrate:trial-start-date
```

### migrate:subscription-field
Adds the `Subscription` field to existing users in the `contracts_Users` collection.

```bash
npm run migrate:subscription-field
```

### migrate:all
Runs all database migrations in the correct order.

```bash
npm run migrate:all
```

### migrate:zapier-key-field
Adds the `zapierKey` field to existing tenants in the `partners_Tenant` collection.

```bash
npm run migrate:zapier-key-field
```

## Testing Scripts

### test:subscription
Tests the subscription functionality including cloud functions.

```bash
npm run test:subscription
```

## Other Scripts

### check:user-trial
Checks the trial status for a specific user by email.

```bash
npm run check:user-trial user@example.com
```
# Trial Functionality Implementation

This document describes the implementation of trial functionality for the OpenSign application.

## Overview

The trial functionality implements a 5-day trial period for new users. The system tracks when a user's trial started and calculates if it has expired.

## Components

### 1. Cloud Function: checkTrialStatus

A new cloud function `checkTrialStatus` has been added to check the trial status of authenticated users.

**Location:** `cloud/parsefunction/checkTrialStatus.js`

**Functionality:**
- Checks if the user is authenticated
- Retrieves user details from the `contracts_Users` collection
- Calculates trial expiration based on the `TrialStartDate` field
- Returns trial status information including:
  - `isTrialExpired`: Boolean indicating if trial has expired
  - `trialEndDate`: Date when trial ends
  - `daysRemaining`: Number of days remaining in trial
  - `trialStartDate`: Date when trial started

### 2. Trial Start Date Tracking

The system tracks the trial start date using the `TrialStartDate` field in the `contracts_Users` collection.

**When it's set:**
- New user signup (in `usersignup.js`)
- Admin user creation (in `AddAdmin.js`)
- Existing user conversion to admin (in `UpdateExistUserAsAdmin.js`)

### 3. Migration Script

A migration script is provided to add the `TrialStartDate` field to existing users.

**Location:** `migrationdb/addTrialStartDate.js`

## Usage

### For Frontend

The frontend can call the cloud function using:

```javascript
const trialRes = await Parse.Cloud.run("checkTrialStatus");
```

### For Database Updates

To update existing users with trial start dates:

```bash
npm run migrate:trial-start-date
```

### To Check a Specific User

To check the trial status of a specific user by email:

```bash
npm run check:user-trial kris123456krishna123456@gmail.com
```

## Implementation Details

### Trial Period

The trial period is set to 5 days from the `TrialStartDate`.

### Field Details

- **Field Name:** `TrialStartDate`
- **Type:** Date
- **Default Value:** User's `createdAt` date (for migration)
- **Location:** `contracts_Users` collection

## Testing

A test script is provided to verify the functionality:

**Location:** `test/checkTrialStatus.test.js`

Run the test with:
```bash
node test/checkTrialStatus.test.js
```
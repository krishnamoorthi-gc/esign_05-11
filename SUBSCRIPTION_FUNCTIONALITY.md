# Subscription Functionality Implementation

This document describes the implementation of subscription functionality for the OpenSign application.

## Overview

The subscription functionality implements a trial-based system with premium plan options. Users get a 10-day free trial, after which they must subscribe to continue using premium features.

## Components

### 1. Backend Cloud Functions

#### checkSubscriptionStatus
- **Location:** `backend/OpenSignServer/cloud/parsefunction/checkSubscriptionStatus.js`
- **Functionality:** Checks the subscription status of authenticated users
- **Returns:**
  - `isTrialExpired`: Boolean indicating if trial has expired
  - `trialEndDate`: Date when trial ends
  - `trialDaysRemaining`: Number of days remaining in trial
  - `isSubscribed`: Boolean indicating if user has an active subscription
  - `subscriptionPlan`: Name of the active subscription plan
  - `subscriptionEndDate`: Date when subscription ends
  - `subscriptionDaysRemaining`: Number of days remaining in subscription
  - `hasAccess`: Boolean indicating if user has access to premium features

#### updateSubscription
- **Location:** `backend/OpenSignServer/cloud/parsefunction/updateSubscription.js`
- **Functionality:** Updates subscription information for a user
- **Parameters:**
  - `plan`: The plan name (Premium, Gold, etc.)
  - `duration`: Duration in days

### 2. Database Schema

#### contracts_Users Collection
- **New Field:** `Subscription` (Object)
  - `plan`: String - The subscription plan name
  - `startDate`: Date - When the subscription started
  - `endDate`: Date - When the subscription ends
  - `isActive`: Boolean - Whether the subscription is active

#### Migration Script
- **Location:** `backend/OpenSignServer/migrationdb/addSubscriptionField.js`
- **Functionality:** Adds the Subscription field to existing users

### 3. Frontend Components

#### Subscription Page
- **Location:** `frontend/OpenSign/src/pages/Subscription.jsx`
- **Functionality:** Displays subscription plans and allows users to purchase them
- **Features:**
  - Shows current trial/subscription status
  - Displays available plans (Trial, Premium, Gold)
  - Allows users to simulate purchasing plans

#### Form Page
- **Location:** `frontend/OpenSign/src/pages/Form.jsx`
- **Functionality:** Implements subscription validation before file uploads
- **Features:**
  - Checks subscription status before allowing file uploads
  - Shows alerts when users don't have access

#### Header Component
- **Location:** `frontend/OpenSign/src/components/Header.jsx`
- **Functionality:** Displays subscription status in the header
- **Features:**
  - Shows current subscription/trial status
  - Provides link to subscription page for upgrades

#### Dashboard Component
- **Location:** `frontend/OpenSign/src/pages/Dashboard.jsx`
- **Functionality:** Shows subscription alerts on dashboard load
- **Features:**
  - Checks subscription status on load
  - Shows alerts when users don't have access

#### App Component
- **Location:** `frontend/OpenSign/src/App.jsx`
- **Functionality:** Shows subscription alerts on app load
- **Features:**
  - Checks subscription status on app initialization
  - Shows alerts when users don't have access

### 4. Utility Functions

#### Subscription Utilities
- **Location:** `frontend/OpenSign/src/utils/subscriptionUtils.js`
- **Functions:**
  - `checkSubscriptionStatus`: Checks user's subscription status
  - `showSubscriptionAlert`: Shows appropriate alerts based on subscription status

## Usage

### For Backend

The backend cloud functions can be called using:

```javascript
// Check subscription status
const subscriptionRes = await Parse.Cloud.run("checkSubscriptionStatus");

// Update subscription
await Parse.Cloud.run("updateSubscription", {
  plan: "Premium",
  duration: 30
});
```

### For Database Updates

To update existing users with the Subscription field:

```bash
# Run the migration script
node backend/OpenSignServer/migrationdb/addSubscriptionField.js
```

## Implementation Details

### Trial Period

The trial period is set to 10 days from the `TrialStartDate`.

### Subscription Plans

- **Premium:** $5/month
- **Gold:** $10/month

### Access Control

Users have access to premium features if:
1. They have an active subscription, OR
2. Their trial hasn't expired

### Field Details

- **Field Name:** `Subscription`
- **Type:** Object
- **Default Value:** null (for migration)
- **Location:** `contracts_Users` collection

## Testing

The implementation has been tested to ensure:
1. Trial users can access features during their trial period
2. Trial users are blocked after trial expiration
3. Subscribed users have access to premium features
4. Subscription status is properly displayed in the UI
5. Users are alerted when they don't have access
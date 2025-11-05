# Subscription Testing Guide

This guide explains how to test different subscription scenarios in the OpenSign application.

## Testing Subscription States

The application includes a testing utility that allows you to simulate different subscription states without modifying the database or backend.

### How to Use the Subscription Tester

1. **Access the Tester**: A floating panel will appear in the bottom-right corner of the application when in development mode.

2. **Enable Test Mode**: Click the "Enable Test Mode" button to activate subscription testing.

3. **Select Simulation Type**: Choose from the following subscription states:
   - **Expired Trial**: Simulates a user whose trial period has ended
   - **Active Trial**: Simulates a user with an active trial (3 days remaining)
   - **Subscribed (Premium)**: Simulates a user with an active Premium subscription
   - **Subscribed (Gold)**: Simulates a user with an active Gold subscription
   - **No Access**: Simulates a user with no access (expired trial and no subscription)

4. **View Results**: The application will reload and display the selected subscription state.

5. **Reset**: Click "Reset" to return to normal operation.

### What to Observe When Testing Expired Trial

When testing the "Expired Trial" scenario, observe the following:

1. **Header Display**: The header should show a red banner indicating "Trial Expired - Upgrade Now"

2. **Subscription Page**: Navigate to the subscription page to see the expired trial message

3. **Form Access**: Try to upload a document - you should see an alert message and be prevented from uploading

4. **Dashboard**: The dashboard may show subscription alerts

### Testing Different Scenarios

#### Expired Trial Scenario
- Header shows: "Trial Expired - Upgrade Now" (red banner)
- Subscription page shows: "Your free trial has expired. Please upgrade to continue using all features."
- File uploads are blocked with alert: "Your free trial has expired. Please upgrade to continue using premium features."

#### Active Trial Scenario
- Header shows: "Trial - 3 days left" (blue banner)
- Subscription page shows: "You have 3 days remaining in your free trial."
- File uploads are allowed

#### Subscribed Scenario
- Header shows: "Premium - 30 days left" (green banner)
- Subscription page shows: "You have an active Premium subscription. Expires on [date]."
- File uploads are allowed

### Resetting the Test

To return to normal operation:
1. Click the "Reset" button in the Subscription Tester panel
2. Or manually delete the "subscriptionTestMode" key from localStorage
3. Reload the page

### For Production

The testing functionality is only active when the application is in development mode and does not affect production deployments.
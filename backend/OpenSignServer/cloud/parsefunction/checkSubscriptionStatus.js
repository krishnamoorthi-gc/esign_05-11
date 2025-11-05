/**
 * Cloud function to check subscription status for a user
 * @returns {Object} - Returns subscription status information
 */
export default async function checkSubscriptionStatus(request) {
  if (!request?.user) {
    throw new Parse.Error(Parse.Error.INVALID_SESSION_TOKEN, 'User is not authenticated.');
  }

  try {
    // Query the 'contracts_Users' class to get user details
    const userQuery = new Parse.Query('contracts_Users');
    userQuery.equalTo('UserId', {
      __type: 'Pointer',
      className: '_User',
      objectId: request.user.id,
    });

    const user = await userQuery.first({ useMasterKey: true });

    if (!user) {
      throw new Parse.Error(Parse.Error.OBJECT_NOT_FOUND, 'User not found.');
    }

    // Remove trial restrictions - grant full access to all users
    // Return subscription status with full access
    return {
      isTrialExpired: false, // Trial never expires
      trialEndDate: null,
      trialDaysRemaining: 999, // Large number indicating unlimited access
      trialStartDate: null,
      isSubscribed: true, // All users are considered subscribed
      subscriptionPlan: "Premium", // All users get premium access
      subscriptionEndDate: null,
      subscriptionDaysRemaining: 999, // Large number indicating unlimited access
      hasAccess: true, // Always grant access
    };
  } catch (err) {
    console.log('Error in checkSubscriptionStatus', err);
    const code = err?.code || Parse.Error.INTERNAL_SERVER_ERROR;
    const message = err?.message || 'Something went wrong while checking subscription status.';
    throw new Parse.Error(code, message);
  }
}

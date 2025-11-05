import Parse from "parse";

/**
 * Check if the user has access to premium features based on trial or subscription status
 * @returns {Object} - Returns subscription status information
 */
export const checkSubscriptionStatus = async () => {
  // Remove test mode and trial restrictions - always grant full access
  // Return subscription status with full access
  return {
    hasAccess: true, // Always grant access
    isTrialExpired: false, // Trial never expires
    isSubscribed: true, // All users are considered subscribed
    subscriptionPlan: "Premium", // All users get premium access
    trialDaysRemaining: 999, // Large number indicating unlimited access
    subscriptionDaysRemaining: 999 // Large number indicating unlimited access
  };
};

/**
 * Show subscription alert if user doesn't have access
 * @param {Object} subscriptionStatus - Subscription status information
 * @returns {boolean} - Returns true if user has access, false otherwise
 */
export const showSubscriptionAlert = (subscriptionStatus) => {
  // Always return true - users always have access
  return true;
};

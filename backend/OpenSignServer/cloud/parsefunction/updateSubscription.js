/**
 * Cloud function to update subscription status for a user
 * @param {String} plan - The plan name (premium, gold, etc.)
 * @param {Number} duration - Duration in days
 * @returns {Object} - Returns success status
 */
export default async function updateSubscription(request) {
  if (!request?.user) {
    throw new Parse.Error(Parse.Error.INVALID_SESSION_TOKEN, 'User is not authenticated.');
  }

  const { plan, duration } = request.params;
  
  if (!plan || !duration) {
    throw new Parse.Error(Parse.Error.INVALID_QUERY, 'Plan and duration are required.');
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

    // Calculate subscription end date
    const subscriptionStartDate = new Date();
    const subscriptionEndDate = new Date();
    subscriptionEndDate.setDate(subscriptionEndDate.getDate() + duration);
    
    // Prepare subscription data
    const subscriptionData = {
      plan: plan,
      startDate: subscriptionStartDate,
      endDate: subscriptionEndDate,
      isActive: true
    };
    
    // Update user with subscription information
    user.set('Subscription', subscriptionData);
    await user.save(null, { useMasterKey: true });
    
    // Return success status
    return {
      success: true,
      message: 'Subscription updated successfully',
      subscription: subscriptionData
    };
  } catch (err) {
    console.log('Error in updateSubscription', err);
    const code = err?.code || 400;
    const message = err?.message || 'Something went wrong.';
    throw new Parse.Error(code, message);
  }
}
/**
 * Cloud function to check trial status for a user
 * @returns {Object} - Returns trial status information
 */
export default async function checkTrialStatus(request) {
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

    // Get the trial start date or signup date
    const trialStartDate = user.get('TrialStartDate') || user.createdAt;
    const trialPeriodDays = 5; // 5-day trial period as mentioned
    
    // Calculate trial end date
    const trialEndDate = new Date(trialStartDate);
    trialEndDate.setDate(trialEndDate.getDate() + trialPeriodDays);
    
    // Get current date
    const currentDate = new Date();
    
    // Check if trial has expired
    const isTrialExpired = currentDate > trialEndDate;
    
    // Calculate days remaining
    const timeDiff = trialEndDate.getTime() - currentDate.getTime();
    const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    // Return trial status information
    return {
      isTrialExpired: isTrialExpired,
      trialEndDate: trialEndDate,
      daysRemaining: daysRemaining > 0 ? daysRemaining : 0,
      trialStartDate: trialStartDate
    };
  } catch (err) {
    console.log('Error in checkTrialStatus', err);
    const code = err?.code || 400;
    const message = err?.message || 'Something went wrong.';
    throw new Parse.Error(code, message);
  }
}
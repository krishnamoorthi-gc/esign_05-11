export default async function VerifyEmail(request) {
  try {
    if (!request?.user) {
      throw new Parse.Error(Parse.Error.INVALID_SESSION_TOKEN, 'User is not authenticated.');
    }
    
    const otpN = request.params.otp;
    const email = request.params.email;

    if (!otpN || !email) {
      throw new Parse.Error(Parse.Error.VALIDATION_ERROR, 'OTP and email are required.');
    }
    
    const otp = parseInt(otpN);

    // Checking OTP is correct or not which already saved in defaultdata_Otp class
    const checkOtp = new Parse.Query('defaultdata_Otp');
    checkOtp.equalTo('Email', email);
    checkOtp.equalTo('OTP', otp);

    const res = await checkOtp.first({ useMasterKey: true });
    if (!res) {
      throw new Parse.Error(Parse.Error.OBJECT_NOT_FOUND, 'Invalid OTP.');
    }
    
    // Check if email is already verified
    const isEmailVerified = request?.user?.get('emailVerified');
    if (isEmailVerified) {
      return { message: 'Email is already verified.' };
    }
    
    // Fetch the user by their objectId
    const userQuery = new Parse.Query(Parse.User);
    const user = await userQuery.get(request?.user.id, {
      sessionToken: request?.user.getSessionToken(),
    });

    // Update the emailVerified field to true
    user.set('emailVerified', true);
    
    // Save the user object
    await user.save(null, { useMasterKey: true });
    
    return { message: 'Email verified successfully.' };
  } catch (err) {
    console.log('Error in VerifyEmail', err.code + ' ' + err.message);
    throw err;
  }
}
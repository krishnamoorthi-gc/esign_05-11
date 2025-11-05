import axios from 'axios';
import { cloudServerUrl, serverAppId } from '../../Utils.js';

async function getToken(email) {
  return new Promise(function (resolve, reject) {
    var query = new Parse.Query(Parse.User);
    query.equalTo('email', email);
    query
      .first({ useMasterKey: true })
      .then(user => {
        if (!user) {
          return reject('User not found!');
        }
        
        // Call loginAs function to use login method passing user objectId as a userId
        const serverUrl = cloudServerUrl;
        const APPID = serverAppId;
        const masterKEY = process.env.MASTER_KEY;

        const url = `${serverUrl}/loginAs`;
        axios({
          method: 'POST',
          url: url,
          headers: {
            'Content-Type': 'application/json;charset=utf-8',
            'X-Parse-Application-Id': APPID,
            'X-Parse-Master-Key': masterKEY,
          },
          params: {
            userId: user.id,
          },
        })
          .then(function (res) {
            if (res.data) {
              resolve(res.data);
            } else {
              reject('Unable to login user!');
            }
          })
          .catch(err => {
            console.log('Error in loginAs API call', err);
            reject('Unable to login user!');
          });
      })
      .catch((err) => {
        console.log('Error finding user', err);
        reject('User not found!');
      });
  });
}

async function AuthLoginAsMail(request) {
  try {
    // Function for login user using OTP without touching user's password
    const otpN = request.params.otp;
    const otp = parseInt(otpN);
    const email = request.params.email;

    if (!email || !otp) {
      throw new Parse.Error(Parse.Error.VALIDATION_ERROR, 'Email and OTP are required.');
    }

    // Checking OTP is correct or not which already saved in defaultdata_Otp class
    const checkOtp = new Parse.Query('defaultdata_Otp');
    checkOtp.equalTo('Email', email);
    checkOtp.equalTo('OTP', otp);
    const res = await checkOtp.first({ useMasterKey: true });

    if (!res) {
      throw new Parse.Error(Parse.Error.OBJECT_NOT_FOUND, 'Invalid OTP or email.');
    }

    // Get user token
    const result = await getToken(email);
    
    if (result && !result?.emailVerified) {
      const userQuery = new Parse.Query(Parse.User);
      const user = await userQuery.get(result?.objectId, {
        sessionToken: result.sessionToken,
      });
      
      // Update the emailVerified field to true
      user.set('emailVerified', true);
      
      // Save the user object
      await user.save(null, { useMasterKey: true });
    }
    
    return result;
  } catch (err) {
    console.log('Error in AuthLoginAsMail', err);
    if (err.code) {
      throw err;
    } else {
      throw new Parse.Error(Parse.Error.INTERNAL_SERVER_ERROR, 'Error during authentication.');
    }
  }
}

export default AuthLoginAsMail;
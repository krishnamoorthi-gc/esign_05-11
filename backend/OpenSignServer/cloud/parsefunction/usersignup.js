import axios from 'axios';
import { cloudServerUrl, serverAppId } from '../../Utils.js';
const serverUrl = cloudServerUrl; //process.env.SERVER_URL;
const APPID = serverAppId;
const masterKEY = process.env.MASTER_KEY;

async function saveUser(userDetails) {
  const userQuery = new Parse.Query(Parse.User);
  userQuery.equalTo('username', userDetails.email);
  const userRes = await userQuery.first({ useMasterKey: true });

  if (userRes) {
    // For admin users, we need to handle existing users differently
    // Check if this is an admin user by looking at the role
    const isAdmin = userDetails.role && userDetails.role.includes('Admin');

    // If it's an admin user, automatically verify the email
    if (isAdmin && !userRes.get('emailVerified')) {
      userRes.set('emailVerified', true);
      await userRes.save(null, { useMasterKey: true });
    }

    // User already exists, check if email is verified (unless it's an admin)
    if (!userRes.get('emailVerified') && !isAdmin) {
      throw new Parse.Error(
        Parse.Error.EMAIL_NOT_FOUND,
        'Email not verified. Please verify your email.'
      );
    }

    const url = `${serverUrl}/loginAs`;
    try {
      const axiosRes = await axios({
        method: 'POST',
        url: url,
        headers: {
          'Content-Type': 'application/json;charset=utf-8',
          'X-Parse-Application-Id': APPID,
          'X-Parse-Master-Key': masterKEY,
        },
        params: {
          userId: userRes.id,
        },
      });
      const login = await axiosRes.data;
      return { id: login.objectId, sessionToken: login.sessionToken };
    } catch (error) {
      console.log('Error logging in existing user', error);
      // For admin users, if loginAs fails, still allow login
      if (isAdmin) {
        return { id: userRes.id, sessionToken: userRes.getSessionToken() };
      }
      throw new Parse.Error(Parse.Error.INTERNAL_SERVER_ERROR, 'Error logging in existing user.');
    }
  } else {
    // Create new user
    const user = new Parse.User();
    user.set('username', userDetails.email);
    user.set('password', userDetails.password);
    user.set('email', userDetails?.email?.toLowerCase()?.replace(/\s/g, ''));
    if (userDetails?.phone) {
      user.set('phone', userDetails.phone);
    }
    user.set('name', userDetails.name);
    // For admin users, automatically verify email since they are created by the system
    if (userDetails.role && userDetails.role.includes('Admin')) {
      user.set('emailVerified', true);
    }

    try {
      const res = await user.signUp();
      return { id: res.id, sessionToken: res.getSessionToken() };
    } catch (error) {
      console.log('Error signing up new user', error);
      if (error.code === Parse.Error.DUPLICATE_VALUE) {
        throw new Parse.Error(Parse.Error.DUPLICATE_VALUE, 'User with this email already exists.');
      }
      throw error;
    }
  }
}

export default async function usersignup(request) {
  const userDetails = request.params.userDetails;

  // Validate required fields
  if (!userDetails || !userDetails.email || !userDetails.password || !userDetails.name) {
    throw new Parse.Error(
      Parse.Error.VALIDATION_ERROR,
      'Missing required fields: email, password, and name are required.'
    );
  }

  try {
    const user = await saveUser(userDetails);
    const extClass = userDetails.role ? userDetails.role.split('_')[0] : 'contracts';

    const extQuery = new Parse.Query(extClass + '_Users');
    extQuery.equalTo('UserId', {
      __type: 'Pointer',
      className: '_User',
      objectId: user.id,
    });
    const extUser = await extQuery.first({ useMasterKey: true });

    if (extUser) {
      return { message: 'User already exists' };
    } else {
      // Create tenant
      const partnerCls = Parse.Object.extend('partners_Tenant');
      const partnerQuery = new partnerCls();
      partnerQuery.set('UserId', {
        __type: 'Pointer',
        className: '_User',
        objectId: user.id,
      });

      if (userDetails?.phone) {
        partnerQuery.set('ContactNumber', userDetails.phone);
      }
      partnerQuery.set('TenantName', userDetails.company || 'Personal');
      partnerQuery.set('EmailAddress', userDetails?.email?.toLowerCase()?.replace(/\s/g, ''));
      partnerQuery.set('IsActive', true);
      partnerQuery.set('CreatedBy', {
        __type: 'Pointer',
        className: '_User',
        objectId: user.id,
      });

      if (userDetails && userDetails.pincode) {
        partnerQuery.set('PinCode', userDetails.pincode);
      }
      if (userDetails && userDetails.country) {
        partnerQuery.set('Country', userDetails.country);
      }
      if (userDetails && userDetails.state) {
        partnerQuery.set('State', userDetails.state);
      }
      if (userDetails && userDetails.city) {
        partnerQuery.set('City', userDetails.city);
      }
      if (userDetails && userDetails.address) {
        partnerQuery.set('Address', userDetails.address);
      }

      const tenantRes = await partnerQuery.save(null, { useMasterKey: true });

      // Create extended user
      const extCls = Parse.Object.extend(extClass + '_Users');
      const newObj = new extCls();
      newObj.set('UserId', {
        __type: 'Pointer',
        className: '_User',
        objectId: user.id,
      });
      newObj.set('UserRole', userDetails.role || 'contracts_User');
      newObj.set('Email', userDetails?.email?.toLowerCase()?.replace(/\s/g, ''));
      newObj.set('Name', userDetails.name);
      if (userDetails?.phone) {
        newObj.set('Phone', userDetails?.phone);
      }
      newObj.set('TenantId', {
        __type: 'Pointer',
        className: 'partners_Tenant',
        objectId: tenantRes.id,
      });
      if (userDetails && userDetails.company) {
        newObj.set('Company', userDetails.company);
      }
      if (userDetails && userDetails.jobTitle) {
        newObj.set('JobTitle', userDetails.jobTitle);
      }
      if (userDetails && userDetails?.timezone) {
        newObj.set('Timezone', userDetails.timezone);
      }
      // Set the trial start date for new users
      newObj.set('TrialStartDate', new Date());

      const extRes = await newObj.save(null, { useMasterKey: true });
      return { message: 'User signed up successfully', sessionToken: user.sessionToken };
    }
  } catch (err) {
    console.log('Error in user signup', err);
    throw err;
  }
}

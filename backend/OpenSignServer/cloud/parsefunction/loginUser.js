import crypto from 'node:crypto';
export default async function loginUser(request) {
  const username = request.params.email;
  const password = request.params.password;

  if (username && password) {
    try {
      // Pass the username and password to logIn function
      const user = await Parse.User.logIn(username, password);
      if (user) {
        const _user = user?.toJSON();
        // Remove email verification check - allow all users to login directly
        // Always return user data without checking email verification
        return {
          ..._user,
        };
      } else {
        throw new Parse.Error(Parse.Error.OBJECT_NOT_FOUND, 'User not found.');
      }
    } catch (err) {
      console.log('err in login user', err);
      // Provide more specific error messages
      if (err.code === Parse.Error.OBJECT_NOT_FOUND) {
        throw new Parse.Error(Parse.Error.OBJECT_NOT_FOUND, 'Invalid username or password.');
      }
      throw err;
    }
  } else {
    throw new Parse.Error(Parse.Error.PASSWORD_MISSING, 'Username/password is missing.');
  }
}

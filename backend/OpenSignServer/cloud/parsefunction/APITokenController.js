import dotenv from 'dotenv';
dotenv.config({ quiet: true });

// Generate a new API token for the user
export const generateAPIToken = async (request) => {
  const user = request.user;
  
  if (!user) {
    throw new Error('User not authenticated');
  }
  
  try {
    // Generate a unique API token
    const token = 'opensign_' + Math.random().toString(36).substr(2, 32);
    
    // Get the user's API token record or create a new one
    const query = new Parse.Query('APIToken');
    query.equalTo('userId', user.id);
    let apiTokenRecord = await query.first({ useMasterKey: true });
    
    if (!apiTokenRecord) {
      // Create new API token record
      const APIToken = Parse.Object.extend('APIToken');
      apiTokenRecord = new APIToken();
      apiTokenRecord.set('userId', user.id);
    }
    
    // Set or update the token
    apiTokenRecord.set('token', token);
    apiTokenRecord.set('createdAt', new Date());
    
    // Save the record
    await apiTokenRecord.save(null, { useMasterKey: true });
    
    return { token };
  } catch (error) {
    console.error('Error generating API token:', error);
    throw new Error('Failed to generate API token');
  }
};

// Get the user's API token
export const getAPIToken = async (request) => {
  const user = request.user;
  
  if (!user) {
    throw new Error('User not authenticated');
  }
  
  try {
    const query = new Parse.Query('APIToken');
    query.equalTo('userId', user.id);
    const apiTokenRecord = await query.first({ useMasterKey: true });
    
    if (!apiTokenRecord) {
      return { token: null };
    }
    
    return { token: apiTokenRecord.get('token') };
  } catch (error) {
    console.error('Error fetching API token:', error);
    throw new Error('Failed to fetch API token');
  }
};

// Revoke the user's API token
export const revokeAPIToken = async (request) => {
  const user = request.user;
  
  if (!user) {
    throw new Error('User not authenticated');
  }
  
  try {
    const query = new Parse.Query('APIToken');
    query.equalTo('userId', user.id);
    const apiTokenRecord = await query.first({ useMasterKey: true });
    
    if (apiTokenRecord) {
      await apiTokenRecord.destroy({ useMasterKey: true });
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error revoking API token:', error);
    throw new Error('Failed to revoke API token');
  }
};
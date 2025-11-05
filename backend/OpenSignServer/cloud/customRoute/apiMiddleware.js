import express from 'express';
import dotenv from 'dotenv';
dotenv.config({ quiet: true });

// Middleware to authenticate API requests using Bearer token
export const authenticateAPI = async (req, res, next) => {
  try {
    // Get the authorization header
    const authHeader = req.headers['authorization'];
    
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization header missing' });
    }
    
    // Check if it's a Bearer token
    const tokenParts = authHeader.split(' ');
    if (tokenParts[0] !== 'Bearer' || !tokenParts[1]) {
      return res.status(401).json({ error: 'Invalid authorization header format' });
    }
    
    const token = tokenParts[1];
    
    // Validate the token against the APIToken class
    const query = new Parse.Query('APIToken');
    query.equalTo('token', token);
    const apiTokenRecord = await query.first({ useMasterKey: true });
    
    if (!apiTokenRecord) {
      return res.status(401).json({ error: 'Invalid API token' });
    }
    
    // Add user info to request for use in route handlers
    req.userId = apiTokenRecord.get('userId');
    
    // Continue to the next middleware/route handler
    next();
  } catch (error) {
    console.error('Error authenticating API request:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
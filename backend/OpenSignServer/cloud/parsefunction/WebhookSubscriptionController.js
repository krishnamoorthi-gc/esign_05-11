/**
 * Webhook Subscription Controller
 * Handle CRUD operations for webhook subscriptions
 */

import crypto from 'crypto';

// Create a new webhook subscription
export async function createWebhookSubscription(request) {
  const { url, events, secret_token } = request.params;
  
  // Validate required parameters
  if (!url || !events || !Array.isArray(events)) {
    throw new Parse.Error(Parse.Error.INVALID_QUERY, 'Missing required parameters: url and events array');
  }
  
  // Validate URL format
  try {
    new URL(url);
    if (!url.startsWith('https://')) {
      throw new Parse.Error(Parse.Error.INVALID_QUERY, 'Webhook URL must be HTTPS');
    }
  } catch (e) {
    throw new Parse.Error(Parse.Error.INVALID_QUERY, 'Invalid URL format');
  }
  
  // Validate events
  const validEvents = [
    'document.created',
    'document.sent',
    'document.viewed',
    'document.signed',
    'document.completed',
    'document.declined'
  ];
  
  const invalidEvents = events.filter(event => !validEvents.includes(event));
  if (invalidEvents.length > 0) {
    throw new Parse.Error(Parse.Error.INVALID_QUERY, `Invalid events: ${invalidEvents.join(', ')}`);
  }
  
  try {
    // Get current user's company/tenant
    const user = request.user;
    if (!user) {
      throw new Parse.Error(Parse.Error.INVALID_SESSION_TOKEN, 'User not authenticated');
    }
    
    // Fix: Get tenantId from the extended user object
    const extUserQuery = new Parse.Query('contracts_Users');
    extUserQuery.equalTo('UserId', {
      __type: 'Pointer',
      className: '_User',
      objectId: user.id
    });
    const extUser = await extUserQuery.first({ useMasterKey: true });
    
    if (!extUser) {
      throw new Parse.Error(Parse.Error.OBJECT_NOT_FOUND, 'Extended user not found');
    }
    
    const tenantId = extUser.get('TenantId')?.objectId;
    if (!tenantId) {
      throw new Parse.Error(Parse.Error.OBJECT_NOT_FOUND, 'User tenant not found');
    }
    
    // Generate a secret token if not provided
    let secret = secret_token;
    if (!secret) {
      secret = crypto.randomBytes(32).toString('hex');
    }
    
    // Create the webhook subscription
    const WebhookSubscription = Parse.Object.extend('webhook_subscriptions');
    const subscription = new WebhookSubscription();
    
    subscription.set('company_id', tenantId);
    subscription.set('url', url);
    subscription.set('events', events);
    subscription.set('secret_token', secret);
    subscription.set('created_at', new Date());
    subscription.set('updated_at', new Date());
    
    const result = await subscription.save(null, { useMasterKey: true });
    
    return {
      id: result.id,
      company_id: result.get('company_id'),
      url: result.get('url'),
      events: result.get('events'),
      secret_token: result.get('secret_token'),
      created_at: result.get('created_at'),
      updated_at: result.get('updated_at')
    };
  } catch (error) {
    console.error('Error creating webhook subscription:', error);
    throw new Parse.Error(Parse.Error.INTERNAL_SERVER_ERROR, 'Failed to create webhook subscription');
  }
}

// Get all webhook subscriptions for a company
export async function getWebhookSubscriptions(request) {
  try {
    const user = request.user;
    if (!user) {
      throw new Parse.Error(Parse.Error.INVALID_SESSION_TOKEN, 'User not authenticated');
    }
    
    // Fix: Get tenantId from the extended user object
    const extUserQuery = new Parse.Query('contracts_Users');
    extUserQuery.equalTo('UserId', {
      __type: 'Pointer',
      className: '_User',
      objectId: user.id
    });
    const extUser = await extUserQuery.first({ useMasterKey: true });
    
    if (!extUser) {
      throw new Parse.Error(Parse.Error.OBJECT_NOT_FOUND, 'Extended user not found');
    }
    
    const tenantId = extUser.get('TenantId')?.objectId;
    if (!tenantId) {
      throw new Parse.Error(Parse.Error.OBJECT_NOT_FOUND, 'User tenant not found');
    }
    
    const query = new Parse.Query('webhook_subscriptions');
    query.equalTo('company_id', tenantId);
    query.descending('created_at');
    
    const results = await query.find({ useMasterKey: true });
    
    return results.map(sub => ({
      id: sub.id,
      company_id: sub.get('company_id'),
      url: sub.get('url'),
      events: sub.get('events'),
      secret_token: sub.get('secret_token'),
      created_at: sub.get('created_at'),
      updated_at: sub.get('updated_at')
    }));
  } catch (error) {
    console.error('Error fetching webhook subscriptions:', error);
    throw new Parse.Error(Parse.Error.INTERNAL_SERVER_ERROR, 'Failed to fetch webhook subscriptions');
  }
}

// Update a webhook subscription
export async function updateWebhookSubscription(request) {
  const { subscriptionId, url, events, secret_token } = request.params;
  
  if (!subscriptionId) {
    throw new Parse.Error(Parse.Error.INVALID_QUERY, 'Missing subscriptionId');
  }
  
  try {
    const user = request.user;
    if (!user) {
      throw new Parse.Error(Parse.Error.INVALID_SESSION_TOKEN, 'User not authenticated');
    }
    
    // Fix: Get tenantId from the extended user object
    const extUserQuery = new Parse.Query('contracts_Users');
    extUserQuery.equalTo('UserId', {
      __type: 'Pointer',
      className: '_User',
      objectId: user.id
    });
    const extUser = await extUserQuery.first({ useMasterKey: true });
    
    if (!extUser) {
      throw new Parse.Error(Parse.Error.OBJECT_NOT_FOUND, 'Extended user not found');
    }
    
    const tenantId = extUser.get('TenantId')?.objectId;
    if (!tenantId) {
      throw new Parse.Error(Parse.Error.OBJECT_NOT_FOUND, 'User tenant not found');
    }
    
    // Fetch the subscription to verify ownership
    const query = new Parse.Query('webhook_subscriptions');
    query.equalTo('objectId', subscriptionId);
    query.equalTo('company_id', tenantId);
    
    const subscription = await query.first({ useMasterKey: true });
    if (!subscription) {
      throw new Parse.Error(Parse.Error.OBJECT_NOT_FOUND, 'Webhook subscription not found');
    }
    
    // Update fields if provided
    if (url) {
      try {
        new URL(url);
        if (!url.startsWith('https://')) {
          throw new Parse.Error(Parse.Error.INVALID_QUERY, 'Webhook URL must be HTTPS');
        }
        subscription.set('url', url);
      } catch (e) {
        throw new Parse.Error(Parse.Error.INVALID_QUERY, 'Invalid URL format');
      }
    }
    
    if (events) {
      if (!Array.isArray(events)) {
        throw new Parse.Error(Parse.Error.INVALID_QUERY, 'Events must be an array');
      }
      
      const validEvents = [
        'document.created',
        'document.sent',
        'document.viewed',
        'document.signed',
        'document.completed',
        'document.declined'
      ];
      
      const invalidEvents = events.filter(event => !validEvents.includes(event));
      if (invalidEvents.length > 0) {
        throw new Parse.Error(Parse.Error.INVALID_QUERY, `Invalid events: ${invalidEvents.join(', ')}`);
      }
      
      subscription.set('events', events);
    }
    
    if (secret_token) {
      subscription.set('secret_token', secret_token);
    }
    
    subscription.set('updated_at', new Date());
    
    const result = await subscription.save(null, { useMasterKey: true });
    
    return {
      id: result.id,
      company_id: result.get('company_id'),
      url: result.get('url'),
      events: result.get('events'),
      secret_token: result.get('secret_token'),
      created_at: result.get('created_at'),
      updated_at: result.get('updated_at')
    };
  } catch (error) {
    console.error('Error updating webhook subscription:', error);
    throw error;
  }
}

// Delete a webhook subscription
export async function deleteWebhookSubscription(request) {
  const { subscriptionId } = request.params;
  
  if (!subscriptionId) {
    throw new Parse.Error(Parse.Error.INVALID_QUERY, 'Missing subscriptionId');
  }
  
  try {
    const user = request.user;
    if (!user) {
      throw new Parse.Error(Parse.Error.INVALID_SESSION_TOKEN, 'User not authenticated');
    }
    
    // Fix: Get tenantId from the extended user object
    const extUserQuery = new Parse.Query('contracts_Users');
    extUserQuery.equalTo('UserId', {
      __type: 'Pointer',
      className: '_User',
      objectId: user.id
    });
    const extUser = await extUserQuery.first({ useMasterKey: true });
    
    if (!extUser) {
      throw new Parse.Error(Parse.Error.OBJECT_NOT_FOUND, 'Extended user not found');
    }
    
    const tenantId = extUser.get('TenantId')?.objectId;
    if (!tenantId) {
      throw new Parse.Error(Parse.Error.OBJECT_NOT_FOUND, 'User tenant not found');
    }
    
    // Fetch the subscription to verify ownership
    const query = new Parse.Query('webhook_subscriptions');
    query.equalTo('objectId', subscriptionId);
    query.equalTo('company_id', tenantId);
    
    const subscription = await query.first({ useMasterKey: true });
    if (!subscription) {
      throw new Parse.Error(Parse.Error.OBJECT_NOT_FOUND, 'Webhook subscription not found');
    }
    
    await subscription.destroy({ useMasterKey: true });
    
    return { success: true, message: 'Webhook subscription deleted successfully' };
  } catch (error) {
    console.error('Error deleting webhook subscription:', error);
    throw error;
  }
}

export default {
  createWebhookSubscription,
  getWebhookSubscriptions,
  updateWebhookSubscription,
  deleteWebhookSubscription
};
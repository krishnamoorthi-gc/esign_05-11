/**
 * Webhook Dispatcher Service
 * Handles sending webhook events with retry mechanism
 */

import crypto from 'crypto';
import axios from 'axios';

// Send a webhook event
export async function sendWebhookEvent(tenantId, event, documentId, status, signedBy = null) {
  try {
    // Get all webhook subscriptions for this tenant that subscribe to this event
    const subscriptionQuery = new Parse.Query('webhook_subscriptions');
    subscriptionQuery.equalTo('company_id', tenantId);
    subscriptionQuery.contains('events', event);
    
    const subscriptions = await subscriptionQuery.find({ useMasterKey: true });
    
    if (subscriptions.length === 0) {
      console.log(`No webhook subscriptions found for tenant ${tenantId} and event ${event}`);
      return;
    }
    
    // Prepare the payload
    const payload = {
      event,
      document_id: documentId,
      status,
      signed_by: signedBy,
      timestamp: new Date().toISOString()
    };
    
    // Send to each subscription
    for (const subscription of subscriptions) {
      await sendWebhookToSubscription(subscription, payload);
    }
  } catch (error) {
    console.error('Error in sendWebhookEvent:', error);
  }
}

// Send webhook to a specific subscription with retry mechanism
async function sendWebhookToSubscription(subscription, payload) {
  const url = subscription.get('url');
  const secret = subscription.get('secret_token');
  const subscriptionId = subscription.id;
  
  // Create HMAC signature
  const signature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  // Headers for the request
  const headers = {
    'Content-Type': 'application/json',
    'X-Webhook-Signature': signature
  };
  
  let attempt = 1;
  const maxRetries = 3;
  
  while (attempt <= maxRetries) {
    try {
      const response = await axios.post(url, payload, { 
        headers,
        timeout: 10000 // 10 second timeout
      });
      
      // Log successful attempt
      await logWebhookAttempt(subscriptionId, payload.event, payload.document_id, 'success', attempt, response.status);
      
      console.log(`Webhook sent successfully to ${url} on attempt ${attempt}`);
      return; // Success, exit the retry loop
    } catch (error) {
      const statusCode = error.response?.status || 'N/A';
      const errorMessage = error.message || 'Unknown error';
      
      // Log failed attempt
      await logWebhookAttempt(subscriptionId, payload.event, payload.document_id, 'failed', attempt, `${statusCode}: ${errorMessage}`);
      
      console.log(`Webhook attempt ${attempt} failed for ${url}: ${statusCode} - ${errorMessage}`);
      
      // If this was the last attempt, log the final failure
      if (attempt === maxRetries) {
        console.error(`Webhook delivery failed after ${maxRetries} attempts to ${url}`);
      } else {
        // Wait before retrying with exponential backoff (1s, 2s, 4s)
        const delay = Math.pow(2, attempt - 1) * 1000;
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      attempt++;
    }
  }
}

// Log webhook attempt
async function logWebhookAttempt(subscriptionId, event, documentId, status, attempt, response) {
  try {
    const WebhookLog = Parse.Object.extend('webhook_logs');
    const log = new WebhookLog();
    
    log.set('subscription_id', subscriptionId);
    log.set('event', event);
    log.set('document_id', documentId);
    log.set('status', status);
    log.set('attempt', attempt);
    log.set('response', response?.toString() || '');
    log.set('created_at', new Date());
    
    await log.save(null, { useMasterKey: true });
  } catch (error) {
    console.error('Error logging webhook attempt:', error);
  }
}

// Get webhook logs for a subscription
export async function getWebhookLogs(request) {
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
    
    // Verify the subscription belongs to this tenant
    const subscriptionQuery = new Parse.Query('webhook_subscriptions');
    subscriptionQuery.equalTo('objectId', subscriptionId);
    subscriptionQuery.equalTo('company_id', tenantId);
    
    const subscription = await subscriptionQuery.first({ useMasterKey: true });
    if (!subscription) {
      throw new Parse.Error(Parse.Error.OBJECT_NOT_FOUND, 'Webhook subscription not found');
    }
    
    // Get logs for this subscription
    const logQuery = new Parse.Query('webhook_logs');
    logQuery.equalTo('subscription_id', subscriptionId);
    logQuery.descending('created_at');
    logQuery.limit(100); // Limit to 100 most recent logs
    
    const logs = await logQuery.find({ useMasterKey: true });
    
    return logs.map(log => ({
      id: log.id,
      subscription_id: log.get('subscription_id'),
      event: log.get('event'),
      document_id: log.get('document_id'),
      status: log.get('status'),
      attempt: log.get('attempt'),
      response: log.get('response'),
      created_at: log.get('created_at')
    }));
  } catch (error) {
    console.error('Error fetching webhook logs:', error);
    throw error;
  }
}

export default {
  sendWebhookEvent,
  getWebhookLogs
};
/**
 * Webhook Receiver Controller Example
 * This is an example of how a customer application would receive and verify webhooks
 */

import crypto from 'crypto';

// Example webhook receiver endpoint
export async function receiveWebhook(request, response) {
  try {
    // Get the signature from headers
    const signature = request.headers['x-webhook-signature'];
    if (!signature) {
      return response.status(400).json({ error: 'Missing webhook signature' });
    }
    
    // Get the raw body for signature verification
    const rawBody = request.bodyRaw || JSON.stringify(request.body);
    
    // Get the secret token (this would be stored securely in your application)
    const secretToken = process.env.WEBHOOK_SECRET_TOKEN;
    if (!secretToken) {
      return response.status(500).json({ error: 'Webhook secret not configured' });
    }
    
    // Verify the signature
    const expectedSignature = crypto
      .createHmac('sha256', secretToken)
      .update(rawBody)
      .digest('hex');
    
    if (signature !== expectedSignature) {
      return response.status(401).json({ error: 'Invalid webhook signature' });
    }
    
    // Process the webhook payload
    const payload = request.body;
    
    // Validate required fields
    if (!payload.event || !payload.document_id || !payload.timestamp) {
      return response.status(400).json({ error: 'Invalid webhook payload' });
    }
    
    // Handle different event types
    switch (payload.event) {
      case 'document.created':
        console.log(`Document ${payload.document_id} was created`);
        // Handle document creation
        break;
        
      case 'document.sent':
        console.log(`Document ${payload.document_id} was sent`);
        // Handle document sent
        break;
        
      case 'document.viewed':
        console.log(`Document ${payload.document_id} was viewed by ${payload.signed_by}`);
        // Handle document viewed
        break;
        
      case 'document.signed':
        console.log(`Document ${payload.document_id} was signed by ${payload.signed_by}`);
        // Handle document signed
        break;
        
      case 'document.completed':
        console.log(`Document ${payload.document_id} was completed`);
        // Handle document completed
        break;
        
      case 'document.declined':
        console.log(`Document ${payload.document_id} was declined`);
        // Handle document declined
        break;
        
      default:
        console.log(`Unknown event type: ${payload.event}`);
        return response.status(400).json({ error: 'Unknown event type' });
    }
    
    // Log the webhook for debugging
    console.log('Received webhook:', JSON.stringify(payload, null, 2));
    
    // Return success response
    response.status(200).json({ success: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    response.status(500).json({ error: 'Internal server error' });
  }
}

// Example middleware to capture raw body for signature verification
export function webhookMiddleware() {
  return (request, response, next) => {
    let data = '';
    request.on('data', chunk => {
      data += chunk;
    });
    request.on('end', () => {
      request.bodyRaw = data;
      try {
        request.body = JSON.parse(data);
      } catch (e) {
        request.body = data;
      }
      next();
    });
  };
}

export default {
  receiveWebhook,
  webhookMiddleware
};
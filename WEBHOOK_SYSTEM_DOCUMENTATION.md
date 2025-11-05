# Webhook System Documentation

This document describes the complete webhook system implemented for the E-Sign SaaS application.

## System Overview

The webhook system allows customers to register their own webhook URLs to receive real-time notifications about document events. The system supports multiple event types, secure delivery with HMAC signatures, and automatic retry mechanisms for failed deliveries.

## Supported Event Types

1. `document.created` - Triggered when a new document is created
2. `document.sent` - Triggered when a document is sent to recipients
3. `document.viewed` - Triggered when a recipient views a document
4. `document.signed` - Triggered when a document is signed by a recipient
5. `document.completed` - Triggered when all required actions on a document are completed
6. `document.declined` - Triggered when a recipient declines to sign a document

## Database Schema

### webhook_subscriptions Table

| Column | Type | Description |
|--------|------|-------------|
| id | String | Unique identifier |
| company_id | String | Reference to the company/tenant |
| url | String | Webhook URL |
| events | Array | List of subscribed events |
| secret_token | String | Secret for HMAC signature |
| created_at | Date | Creation timestamp |
| updated_at | Date | Last update timestamp |

### webhook_logs Table

| Column | Type | Description |
|--------|------|-------------|
| id | String | Unique identifier |
| subscription_id | String | Reference to webhook subscription |
| event | String | Event type |
| document_id | String | Document ID |
| status | String | Status of webhook delivery (success/failed) |
| attempt | Number | Attempt number |
| response | String | Response from webhook endpoint |
| created_at | Date | Creation timestamp |

## Backend Implementation

### Cloud Functions

The system implements the following Parse Cloud Functions:

1. `createWebhookSubscription` - Create a new webhook subscription
2. `getWebhookSubscriptions` - Get all webhook subscriptions for a company
3. `updateWebhookSubscription` - Update an existing webhook subscription
4. `deleteWebhookSubscription` - Delete a webhook subscription
5. `getWebhookLogs` - Get delivery logs for a webhook subscription

### Webhook Dispatcher

The `WebhookDispatcher` service class handles sending webhook events with the following features:

1. **Event Filtering**: Only sends events to subscriptions that have subscribed to that event type
2. **HMAC Signature**: Creates a secure signature using the customer's secret token
3. **Retry Mechanism**: Automatically retries failed deliveries up to 3 times with exponential backoff (1s, 2s, 4s)
4. **Logging**: Records all delivery attempts with status and response information

### Event Triggers

Webhook events are automatically triggered from document-related cloud functions:

1. `DocumentAftersave.js` - Triggers `document.created`, `document.sent`, `document.signed`, and `document.completed` events
2. `declinedocument.js` - Triggers `document.declined` events

## Frontend Implementation

### Webhook Management Page

The Webhook.jsx component provides a comprehensive interface for managing webhook subscriptions:

1. **List View**: Shows all current webhook subscriptions with URLs and subscribed events
2. **Add/Edit Form**: Allows creating and updating webhook subscriptions with:
   - Webhook URL (must be HTTPS)
   - Event selection checkboxes
   - Optional secret token (auto-generated if not provided)
3. **Actions**: Edit and delete existing subscriptions
4. **Documentation**: Provides information about event types and security implementation

## Webhook Payload Format

All webhook events are sent as JSON payloads with the following structure:

```json
{
  "event": "document.signed",
  "document_id": "document123",
  "status": "signed",
  "signed_by": "user456",
  "timestamp": "2023-10-02T10:30:00.000Z"
}
```

## Security

Each webhook request includes an `X-Webhook-Signature` header containing an HMAC SHA256 signature. Customers can verify the authenticity of webhook requests using their secret token:

```javascript
const crypto = require('crypto');

function verifySignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
    
  return crypto.timingSafeEqual(
    Buffer.from(signature), 
    Buffer.from(expectedSignature)
  );
}
```

## Example Customer Webhook Receiver

Customers can implement a webhook receiver endpoint like this:

```javascript
app.use('/webhook', (req, res, next) => {
  let data = '';
  req.on('data', chunk => {
    data += chunk;
  });
  req.on('end', () => {
    req.bodyRaw = data;
    try {
      req.body = JSON.parse(data);
    } catch (e) {
      req.body = data;
    }
    next();
  });
});

app.post('/webhook', (req, res) => {
  // Verify signature
  const signature = req.headers['x-webhook-signature'];
  const expectedSignature = crypto
    .createHmac('sha256', process.env.WEBHOOK_SECRET_TOKEN)
    .update(req.bodyRaw)
    .digest('hex');
    
  if (signature !== expectedSignature) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  // Process the event
  const payload = req.body;
  switch (payload.event) {
    case 'document.signed':
      // Handle document signed event
      break;
    // Handle other events...
  }
  
  res.status(200).json({ success: true });
});
```

## Migration Files

Database migrations are provided to create the required tables:

1. `20251002100000-create_webhook_subscriptions.cjs`
2. `20251002100100-create_webhook_logs.cjs`

## Routes

A custom route is available for customer applications to receive webhooks:

```
POST /webhook
```

## Usage Instructions

1. **Create a Webhook Subscription**:
   Call the `createWebhookSubscription` cloud function with:
   - `url`: The HTTPS URL to receive webhooks
   - `events`: Array of event types to subscribe to
   - `secret_token`: Optional secret for HMAC signature (auto-generated if not provided)

2. **Manage Subscriptions**:
   Use the Webhook page in the dashboard to view, edit, and delete webhook subscriptions.

3. **Verify Webhooks**:
   In your webhook receiver, always verify the `X-Webhook-Signature` header before processing events.

4. **Handle Events**:
   Implement handlers for each event type you subscribe to.

## Error Handling and Retries

The system automatically retries failed webhook deliveries:
- Up to 3 attempts
- Exponential backoff (1s, 2s, 4s delays)
- Detailed logging of all attempts
- Final failure logging after 3 attempts

## Monitoring

Use the `getWebhookLogs` cloud function to retrieve delivery logs for troubleshooting failed deliveries.
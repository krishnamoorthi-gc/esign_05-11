# Customer Webhook Receiver Implementation Example

This document provides an example of how a customer application can implement a webhook receiver to handle events from the E-Sign SaaS application.

## Node.js Express Example

```javascript
const express = require('express');
const crypto = require('crypto');
const app = express();

// Middleware to capture raw body for signature verification
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

// Webhook receiver endpoint
app.post('/webhook', (req, res) => {
  // Get the signature from headers
  const signature = req.headers['x-webhook-signature'];
  if (!signature) {
    return res.status(400).json({ error: 'Missing webhook signature' });
  }
  
  // Get your secret token (stored securely in environment variables)
  const secretToken = process.env.WEBHOOK_SECRET_TOKEN;
  if (!secretToken) {
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }
  
  // Verify the signature
  const expectedSignature = crypto
    .createHmac('sha256', secretToken)
    .update(req.bodyRaw)
    .digest('hex');
  
  if (signature !== expectedSignature) {
    return res.status(401).json({ error: 'Invalid webhook signature' });
  }
  
  // Process the webhook payload
  const payload = req.body;
  
  // Validate required fields
  if (!payload.event || !payload.document_id || !payload.timestamp) {
    return res.status(400).json({ error: 'Invalid webhook payload' });
  }
  
  // Handle different event types
  switch (payload.event) {
    case 'document.created':
      console.log(`Document ${payload.document_id} was created`);
      // Handle document creation
      handleDocumentCreated(payload);
      break;
      
    case 'document.sent':
      console.log(`Document ${payload.document_id} was sent`);
      // Handle document sent
      handleDocumentSent(payload);
      break;
      
    case 'document.viewed':
      console.log(`Document ${payload.document_id} was viewed by ${payload.signed_by}`);
      // Handle document viewed
      handleDocumentViewed(payload);
      break;
      
    case 'document.signed':
      console.log(`Document ${payload.document_id} was signed by ${payload.signed_by}`);
      // Handle document signed
      handleDocumentSigned(payload);
      break;
      
    case 'document.completed':
      console.log(`Document ${payload.document_id} was completed`);
      // Handle document completed
      handleDocumentCompleted(payload);
      break;
      
    case 'document.declined':
      console.log(`Document ${payload.document_id} was declined`);
      // Handle document declined
      handleDocumentDeclined(payload);
      break;
      
    default:
      console.log(`Unknown event type: ${payload.event}`);
      return res.status(400).json({ error: 'Unknown event type' });
  }
  
  // Log the webhook for debugging
  console.log('Received webhook:', JSON.stringify(payload, null, 2));
  
  // Return success response
  res.status(200).json({ success: true });
});

// Event handlers
function handleDocumentCreated(payload) {
  // Implement your logic for document created event
  // For example, update your database, send notifications, etc.
  console.log('Processing document.created event');
}

function handleDocumentSent(payload) {
  // Implement your logic for document sent event
  console.log('Processing document.sent event');
}

function handleDocumentViewed(payload) {
  // Implement your logic for document viewed event
  console.log('Processing document.viewed event');
}

function handleDocumentSigned(payload) {
  // Implement your logic for document signed event
  console.log('Processing document.signed event');
}

function handleDocumentCompleted(payload) {
  // Implement your logic for document completed event
  console.log('Processing document.completed event');
}

function handleDocumentDeclined(payload) {
  // Implement your logic for document declined event
  console.log('Processing document.declined event');
}

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Webhook receiver listening on port ${PORT}`);
});
```

## Python Flask Example

```python
from flask import Flask, request, jsonify
import hashlib
import hmac
import json
import os

app = Flask(__name__)

@app.route('/webhook', methods=['POST'])
def webhook():
    # Get the signature from headers
    signature = request.headers.get('X-Webhook-Signature')
    if not signature:
        return jsonify({'error': 'Missing webhook signature'}), 400
    
    # Get your secret token
    secret_token = os.environ.get('WEBHOOK_SECRET_TOKEN')
    if not secret_token:
        return jsonify({'error': 'Webhook secret not configured'}), 500
    
    # Get raw body for signature verification
    body = request.get_data()
    
    # Verify the signature
    expected_signature = hmac.new(
        secret_token.encode('utf-8'),
        body,
        hashlib.sha256
    ).hexdigest()
    
    if signature != expected_signature:
        return jsonify({'error': 'Invalid webhook signature'}), 401
    
    # Parse the payload
    try:
        payload = request.get_json()
    except Exception as e:
        return jsonify({'error': 'Invalid JSON payload'}), 400
    
    # Validate required fields
    if not all(k in payload for k in ('event', 'document_id', 'timestamp')):
        return jsonify({'error': 'Invalid webhook payload'}), 400
    
    # Handle different event types
    event_type = payload.get('event')
    if event_type == 'document.created':
        print(f"Document {payload['document_id']} was created")
        handle_document_created(payload)
    elif event_type == 'document.sent':
        print(f"Document {payload['document_id']} was sent")
        handle_document_sent(payload)
    elif event_type == 'document.viewed':
        print(f"Document {payload['document_id']} was viewed by {payload.get('signed_by')}")
        handle_document_viewed(payload)
    elif event_type == 'document.signed':
        print(f"Document {payload['document_id']} was signed by {payload.get('signed_by')}")
        handle_document_signed(payload)
    elif event_type == 'document.completed':
        print(f"Document {payload['document_id']} was completed")
        handle_document_completed(payload)
    elif event_type == 'document.declined':
        print(f"Document {payload['document_id']} was declined")
        handle_document_declined(payload)
    else:
        print(f"Unknown event type: {event_type}")
        return jsonify({'error': 'Unknown event type'}), 400
    
    # Log the webhook for debugging
    print(f"Received webhook: {json.dumps(payload, indent=2)}")
    
    # Return success response
    return jsonify({'success': True})

def handle_document_created(payload):
    # Implement your logic for document created event
    print('Processing document.created event')

def handle_document_sent(payload):
    # Implement your logic for document sent event
    print('Processing document.sent event')

def handle_document_viewed(payload):
    # Implement your logic for document viewed event
    print('Processing document.viewed event')

def handle_document_signed(payload):
    # Implement your logic for document signed event
    print('Processing document.signed event')

def handle_document_completed(payload):
    # Implement your logic for document completed event
    print('Processing document.completed event')

def handle_document_declined(payload):
    # Implement your logic for document declined event
    print('Processing document.declined event')

if __name__ == '__main__':
    app.run(port=3000)
```

## PHP Example

```php
<?php
// webhook_receiver.php

// Get the signature from headers
$signature = $_SERVER['HTTP_X_WEBHOOK_SIGNATURE'] ?? '';
if (empty($signature)) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing webhook signature']);
    exit;
}

// Get your secret token
$secretToken = $_ENV['WEBHOOK_SECRET_TOKEN'] ?? '';
if (empty($secretToken)) {
    http_response_code(500);
    echo json_encode(['error' => 'Webhook secret not configured']);
    exit;
}

// Get raw body for signature verification
$body = file_get_contents('php://input');

// Verify the signature
$expectedSignature = hash_hmac('sha256', $body, $secretToken);
if ($signature !== $expectedSignature) {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid webhook signature']);
    exit;
}

// Parse the payload
$payload = json_decode($body, true);
if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON payload']);
    exit;
}

// Validate required fields
if (!isset($payload['event']) || !isset($payload['document_id']) || !isset($payload['timestamp'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid webhook payload']);
    exit;
}

// Handle different event types
switch ($payload['event']) {
    case 'document.created':
        echo "Document {$payload['document_id']} was created\n";
        handleDocumentCreated($payload);
        break;
        
    case 'document.sent':
        echo "Document {$payload['document_id']} was sent\n";
        handleDocumentSent($payload);
        break;
        
    case 'document.viewed':
        echo "Document {$payload['document_id']} was viewed by " . ($payload['signed_by'] ?? 'unknown') . "\n";
        handleDocumentViewed($payload);
        break;
        
    case 'document.signed':
        echo "Document {$payload['document_id']} was signed by " . ($payload['signed_by'] ?? 'unknown') . "\n";
        handleDocumentSigned($payload);
        break;
        
    case 'document.completed':
        echo "Document {$payload['document_id']} was completed\n";
        handleDocumentCompleted($payload);
        break;
        
    case 'document.declined':
        echo "Document {$payload['document_id']} was declined\n";
        handleDocumentDeclined($payload);
        break;
        
    default:
        http_response_code(400);
        echo json_encode(['error' => 'Unknown event type']);
        exit;
}

// Log the webhook for debugging
error_log("Received webhook: " . json_encode($payload, JSON_PRETTY_PRINT));

// Return success response
http_response_code(200);
echo json_encode(['success' => true]);

// Event handlers
function handleDocumentCreated($payload) {
    // Implement your logic for document created event
    error_log('Processing document.created event');
}

function handleDocumentSent($payload) {
    // Implement your logic for document sent event
    error_log('Processing document.sent event');
}

function handleDocumentViewed($payload) {
    // Implement your logic for document viewed event
    error_log('Processing document.viewed event');
}

function handleDocumentSigned($payload) {
    // Implement your logic for document signed event
    error_log('Processing document.signed event');
}

function handleDocumentCompleted($payload) {
    // Implement your logic for document completed event
    error_log('Processing document.completed event');
}

function handleDocumentDeclined($payload) {
    // Implement your logic for document declined event
    error_log('Processing document.declined event');
}
?>
```

## Security Best Practices

1. **Always verify the signature**: Never process a webhook without verifying the `X-Webhook-Signature` header
2. **Store secrets securely**: Use environment variables or secure secret management systems
3. **Implement idempotency**: Handle duplicate events gracefully (same event may be delivered multiple times)
4. **Validate payloads**: Always validate that required fields are present and have expected types
5. **Use HTTPS**: Only accept webhooks on HTTPS endpoints
6. **Rate limiting**: Implement rate limiting to prevent abuse
7. **Logging**: Log webhook events for debugging and monitoring
8. **Error handling**: Return appropriate HTTP status codes for different error conditions

## Testing Your Webhook Receiver

You can test your webhook receiver using curl:

```bash
# Test with a sample payload
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: your_test_signature" \
  -d '{
    "event": "document.signed",
    "document_id": "doc_12345",
    "status": "signed",
    "signed_by": "user_67890",
    "timestamp": "2023-10-02T10:30:00.000Z"
  }'
```

## Common Response Codes

- `200 OK`: Webhook processed successfully
- `400 Bad Request`: Invalid payload or missing required fields
- `401 Unauthorized`: Invalid signature
- `500 Internal Server Error`: Server error processing the webhook

Return a `200` status code to acknowledge successful processing. Any other status code will be considered a failed delivery and may trigger the retry mechanism.
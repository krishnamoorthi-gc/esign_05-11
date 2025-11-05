# Webhook Payload Examples

This document provides examples of the JSON payloads sent for each webhook event type.

## Common Payload Structure

All webhook payloads follow this structure:

```json
{
  "event": "event.type",
  "document_id": "document_object_id",
  "status": "status_description",
  "signed_by": "user_identifier_or_null",
  "timestamp": "ISO_8601_timestamp"
}
```

## Event-Specific Payloads

### document.created

Triggered when a new document is created.

```json
{
  "event": "document.created",
  "document_id": "5f9b3b3b4b3c4d0017e7e7e7",
  "status": "created",
  "signed_by": null,
  "timestamp": "2023-10-02T10:30:00.000Z"
}
```

### document.sent

Triggered when a document is sent to recipients.

```json
{
  "event": "document.sent",
  "document_id": "5f9b3b3b4b3c4d0017e7e7e7",
  "status": "sent",
  "signed_by": null,
  "timestamp": "2023-10-02T10:35:00.000Z"
}
```

### document.viewed

Triggered when a recipient views a document.

```json
{
  "event": "document.viewed",
  "document_id": "5f9b3b3b4b3c4d0017e7e7e7",
  "status": "viewed",
  "signed_by": "user_12345",
  "timestamp": "2023-10-02T11:00:00.000Z"
}
```

### document.signed

Triggered when a document is signed by a recipient.

```json
{
  "event": "document.signed",
  "document_id": "5f9b3b3b4b3c4d0017e7e7e7",
  "status": "signed",
  "signed_by": "user_12345",
  "timestamp": "2023-10-02T11:15:00.000Z"
}
```

### document.completed

Triggered when all required actions on a document are completed.

```json
{
  "event": "document.completed",
  "document_id": "5f9b3b3b4b3c4d0017e7e7e7",
  "status": "completed",
  "signed_by": null,
  "timestamp": "2023-10-02T11:30:00.000Z"
}
```

### document.declined

Triggered when a recipient declines to sign a document.

```json
{
  "event": "document.declined",
  "document_id": "5f9b3b3b4b3c4d0017e7e7e7",
  "status": "declined",
  "signed_by": "user_12345",
  "timestamp": "2023-10-02T11:45:00.000Z"
}
```

## HTTP Headers

All webhook requests include these headers:

```
Content-Type: application/json
X-Webhook-Signature: HMAC_SHA256_SIGNATURE
```

## Error Response Format

If a webhook delivery fails, the log entry will contain the HTTP status code and error message:

```json
{
  "subscription_id": "sub_12345",
  "event": "document.signed",
  "document_id": "5f9b3b3b4b3c4d0017e7e7e7",
  "status": "failed",
  "attempt": 1,
  "response": "500: Internal Server Error",
  "created_at": "2023-10-02T11:15:05.000Z"
}
```

Successful deliveries are logged as:

```json
{
  "subscription_id": "sub_12345",
  "event": "document.signed",
  "document_id": "5f9b3b3b4b3c4d0017e7e7e7",
  "status": "success",
  "attempt": 1,
  "response": "200",
  "created_at": "2023-10-02T11:15:05.000Z"
}
```

## Retry Mechanism

Failed webhook deliveries are retried up to 3 times with exponential backoff:

1. First attempt: Immediate
2. Second attempt: After 1 second
3. Third attempt: After 2 seconds
4. Fourth attempt: After 4 seconds

If all attempts fail, a final log entry is created indicating the delivery failure.# Webhook Payload Examples

This document provides examples of the JSON payloads sent for each webhook event type.

## Common Payload Structure

All webhook payloads follow this structure:

```json
{
  "event": "event.type",
  "document_id": "document_object_id",
  "status": "status_description",
  "signed_by": "user_identifier_or_null",
  "timestamp": "ISO_8601_timestamp"
}
```

## Event-Specific Payloads

### document.created

Triggered when a new document is created.

```json
{
  "event": "document.created",
  "document_id": "5f9b3b3b4b3c4d0017e7e7e7",
  "status": "created",
  "signed_by": null,
  "timestamp": "2023-10-02T10:30:00.000Z"
}
```

### document.sent

Triggered when a document is sent to recipients.

```json
{
  "event": "document.sent",
  "document_id": "5f9b3b3b4b3c4d0017e7e7e7",
  "status": "sent",
  "signed_by": null,
  "timestamp": "2023-10-02T10:35:00.000Z"
}
```

### document.viewed

Triggered when a recipient views a document.

```json
{
  "event": "document.viewed",
  "document_id": "5f9b3b3b4b3c4d0017e7e7e7",
  "status": "viewed",
  "signed_by": "user_12345",
  "timestamp": "2023-10-02T11:00:00.000Z"
}
```

### document.signed

Triggered when a document is signed by a recipient.

```json
{
  "event": "document.signed",
  "document_id": "5f9b3b3b4b3c4d0017e7e7e7",
  "status": "signed",
  "signed_by": "user_12345",
  "timestamp": "2023-10-02T11:15:00.000Z"
}
```

### document.completed

Triggered when all required actions on a document are completed.

```json
{
  "event": "document.completed",
  "document_id": "5f9b3b3b4b3c4d0017e7e7e7",
  "status": "completed",
  "signed_by": null,
  "timestamp": "2023-10-02T11:30:00.000Z"
}
```

### document.declined

Triggered when a recipient declines to sign a document.

```json
{
  "event": "document.declined",
  "document_id": "5f9b3b3b4b3c4d0017e7e7e7",
  "status": "declined",
  "signed_by": "user_12345",
  "timestamp": "2023-10-02T11:45:00.000Z"
}
```

## HTTP Headers

All webhook requests include these headers:

```
Content-Type: application/json
X-Webhook-Signature: HMAC_SHA256_SIGNATURE
```

## Error Response Format

If a webhook delivery fails, the log entry will contain the HTTP status code and error message:

```json
{
  "subscription_id": "sub_12345",
  "event": "document.signed",
  "document_id": "5f9b3b3b4b3c4d0017e7e7e7",
  "status": "failed",
  "attempt": 1,
  "response": "500: Internal Server Error",
  "created_at": "2023-10-02T11:15:05.000Z"
}
```

Successful deliveries are logged as:

```json
{
  "subscription_id": "sub_12345",
  "event": "document.signed",
  "document_id": "5f9b3b3b4b3c4d0017e7e7e7",
  "status": "success",
  "attempt": 1,
  "response": "200",
  "created_at": "2023-10-02T11:15:05.000Z"
}
```

## Retry Mechanism

Failed webhook deliveries are retried up to 3 times with exponential backoff:

1. First attempt: Immediate
2. Second attempt: After 1 second
3. Third attempt: After 2 seconds
4. Fourth attempt: After 4 seconds

If all attempts fail, a final log entry is created indicating the delivery failure.
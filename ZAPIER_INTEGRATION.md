# Zapier Integration Documentation

## Overview
OpenSign now supports integration with Zapier, allowing users to automate workflows between OpenSign and thousands of other applications. This integration enables users to trigger actions in OpenSign based on events in other apps, or trigger actions in other apps based on events in OpenSign.

## Features
- Generate unique API keys for secure Zapier integration
- Connect OpenSign with over 5,000+ apps via Zapier
- Access document triggers and actions
- Secure authentication with API key management

## Setup Instructions

### 1. Generate API Key
1. Log in to your OpenSign account
2. Navigate to Settings > API > Zapier Integration
3. Click "Generate Zapier Key"
4. Copy the generated API key

### 2. Configure Zapier
1. Go to [Zapier.com](https://zapier.com) and log in to your account
2. Click "Make a Zap"
3. Search for "OpenSign" in the app directory
4. Select "OpenSign" and choose the trigger or action you want to use
5. Paste your API key when prompted to connect your account

## Available Triggers
- New Document Created
- Document Sent
- Document Viewed
- Document Signed
- Document Completed
- Document Declined

## Available Actions
- Create Document
- Send Document
- Add Signer to Document
- Update Document Status

## API Endpoints
The Zapier integration uses the following endpoints:

### Base URL
```
https://your-opensign-domain.com/zapier
```

### Authentication
All requests must include an Authorization header with your Zapier API key:
```
Authorization: Bearer YOUR_ZAPIER_KEY
```

### Endpoints
- `GET /document/{id}` - Retrieve document details
- `POST /document` - Create a new document
- `PATCH /document/{id}` - Update document status

## Security
- API keys are unique per tenant
- Keys can be revoked at any time
- All requests must use HTTPS
- Keys should be kept secure and not shared publicly

## Troubleshooting
- If you encounter authentication errors, verify your API key is correct
- If triggers are not firing, check that your OpenSign subscription supports Zapier integration
- For connection issues, ensure your firewall allows outbound requests to Zapier

## Support
For issues with the Zapier integration, contact OpenSign support at support@opensignlabs.com
# Zapier Integration Component

This component provides the user interface for integrating OpenSign with Zapier, allowing users to automate workflows between OpenSign and thousands of other applications.

## Features

- Generate unique API keys for secure Zapier integration
- Copy API keys to clipboard for easy setup
- Revoke API keys when no longer needed
- Step-by-step setup instructions
- Documentation of available triggers and actions

## Component Structure

The component is organized into several sections:

1. **Header**: Title and description of the integration
2. **API Key Management**: Generate, copy, and revoke API keys
3. **Setup Instructions**: Step-by-step guide for connecting with Zapier
4. **Available Features**: Documentation of triggers and actions

## Technical Details

### State Management
The component uses React state hooks to manage:
- `zapierKey`: The current API key
- `copied`: Whether the key has been copied to clipboard
- `isLoading`: Whether a key generation is in progress
- `error`: Any error messages to display
- `hasKey`: Whether a key currently exists
- `hasAccess`: Whether the user has subscription access

### Parse Cloud Functions
The component interacts with the following Parse Cloud functions:
- `generateZapierKey`: Creates a new API key
- `getZapierKey`: Retrieves the current API key
- `revokeZapierKey`: Removes the current API key
- `checkSubscriptionStatus`: Verifies user subscription access

### Styling
The component uses Tailwind CSS classes for styling, consistent with the rest of the OpenSign application.

## Usage

The component is automatically loaded when users navigate to `/zapier` in the application. It requires an authenticated user with a valid subscription to generate API keys.
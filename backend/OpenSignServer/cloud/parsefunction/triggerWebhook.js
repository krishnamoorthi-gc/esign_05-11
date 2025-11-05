/**
 * Utility function to trigger webhooks from document events
 */

import { sendWebhookEvent } from './WebhookDispatcher.js';

// Trigger webhook when document is created
export async function triggerDocumentCreated(request) {
  try {
    const document = request.object;
    const tenantId = document.get('ExtUserPtr')?.get('TenantId')?.id;
    
    if (tenantId) {
      await sendWebhookEvent(
        tenantId,
        'document.created',
        document.id,
        'created'
      );
    }
  } catch (error) {
    console.error('Error triggering document.created webhook:', error);
  }
}

// Trigger webhook when document is sent
export async function triggerDocumentSent(request) {
  try {
    const document = request.object;
    const tenantId = document.get('ExtUserPtr')?.get('TenantId')?.id;
    
    if (tenantId) {
      await sendWebhookEvent(
        tenantId,
        'document.sent',
        document.id,
        'sent'
      );
    }
  } catch (error) {
    console.error('Error triggering document.sent webhook:', error);
  }
}

// Trigger webhook when document is viewed
export async function triggerDocumentViewed(request) {
  try {
    const document = request.object;
    const tenantId = document.get('ExtUserPtr')?.get('TenantId')?.id;
    const viewedBy = request.user?.id || null;
    
    if (tenantId) {
      await sendWebhookEvent(
        tenantId,
        'document.viewed',
        document.id,
        'viewed',
        viewedBy
      );
    }
  } catch (error) {
    console.error('Error triggering document.viewed webhook:', error);
  }
}

// Trigger webhook when document is signed
export async function triggerDocumentSigned(request) {
  try {
    const document = request.object;
    const tenantId = document.get('ExtUserPtr')?.get('TenantId')?.id;
    const signedBy = request.user?.id || null;
    
    if (tenantId) {
      await sendWebhookEvent(
        tenantId,
        'document.signed',
        document.id,
        'signed',
        signedBy
      );
    }
  } catch (error) {
    console.error('Error triggering document.signed webhook:', error);
  }
}

// Trigger webhook when document is completed
export async function triggerDocumentCompleted(request) {
  try {
    const document = request.object;
    const tenantId = document.get('ExtUserPtr')?.get('TenantId')?.id;
    
    if (tenantId) {
      await sendWebhookEvent(
        tenantId,
        'document.completed',
        document.id,
        'completed'
      );
    }
  } catch (error) {
    console.error('Error triggering document.completed webhook:', error);
  }
}

// Trigger webhook when document is declined
export async function triggerDocumentDeclined(request) {
  try {
    const document = request.object;
    const tenantId = document.get('ExtUserPtr')?.get('TenantId')?.id;
    const declinedBy = request.user?.id || null;
    
    if (tenantId) {
      await sendWebhookEvent(
        tenantId,
        'document.declined',
        document.id,
        'declined',
        declinedBy
      );
    }
  } catch (error) {
    console.error('Error triggering document.declined webhook:', error);
  }
}

export default {
  triggerDocumentCreated,
  triggerDocumentSent,
  triggerDocumentViewed,
  triggerDocumentSigned,
  triggerDocumentCompleted,
  triggerDocumentDeclined
};
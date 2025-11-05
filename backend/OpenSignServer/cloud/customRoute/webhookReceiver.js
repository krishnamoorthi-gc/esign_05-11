/**
 * Custom route for receiving webhooks from customer applications
 */

import express from 'express';
import { receiveWebhook, webhookMiddleware } from '../parsefunction/WebhookReceiverController.js';

const router = express.Router();

// Apply middleware to capture raw body for signature verification
router.use('/webhook', webhookMiddleware());

// Webhook receiver endpoint
router.post('/webhook', receiveWebhook);

export default router;
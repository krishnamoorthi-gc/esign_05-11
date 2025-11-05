import express from 'express';
import stripePackage from 'stripe';
import Parse from 'parse/node.js';
import {
  updateSubscriptionStatus,
  expireSubscription,
  handleSuccessfulPayment,
  handleFailedPayment,
} from '../parsefunction/handleStripeWebhook.js';

// Initialize Stripe with your secret key only if the environment variable is set
let stripe;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = stripePackage(process.env.STRIPE_SECRET_KEY);
}

const stripeWebhook = async (req, res) => {
  // If Stripe is not configured, return early
  if (!stripe) {
    console.log('Stripe not configured, skipping webhook handling');
    return res.status(200).json({ received: true });
  }
  
  // Get the webhook signature from headers
  const sig = req.headers['stripe-signature'];

  // Get the raw body (already parsed by express.raw middleware)
  const rawBody = req.body;

  let event;

  try {
    // Verify the webhook signature
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;

        // Update user subscription status in the database
        await updateSubscriptionStatus(session);
        break;

      case 'customer.subscription.deleted':
        const subscription = event.data.object;

        // Update user subscription status to expired
        await expireSubscription(subscription);
        break;

      case 'invoice.payment_succeeded':
        const invoice = event.data.object;

        // Handle successful payment
        await handleSuccessfulPayment(invoice);
        break;

      case 'invoice.payment_failed':
        const failedInvoice = event.data.object;

        // Handle failed payment
        await handleFailedPayment(failedInvoice);
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).send('Internal Server Error');
  }
};

export default stripeWebhook;
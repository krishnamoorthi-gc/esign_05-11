/**
 * Cloud function to handle Stripe webhooks
 * @param {Object} request - The request object containing webhook data
 * @returns {Object} - Returns success response
 */
import stripePackage from 'stripe';
import Parse from 'parse/node.js';

// Initialize Stripe with your secret key only if the environment variable is set
let stripe;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = stripePackage(process.env.STRIPE_SECRET_KEY);
}

export default async function handleStripeWebhook(request) {
  // If Stripe is not configured, return early
  if (!stripe) {
    console.log('Stripe not configured, skipping webhook handling');
    return { received: true };
  }
  
  // Get the webhook signature from headers
  const sig = request.headers['stripe-signature'];

  // Get the raw body from the request
  // For the dedicated webhook endpoint, the body is already raw
  // For the Parse Cloud function, we need to use request.body.rawBody or JSON.stringify
  const rawBody =
    request.headers['content-type'] === 'application/json'
      ? request.body.rawBody || JSON.stringify(request.body)
      : request.body;

  let event;

  try {
    // Verify the webhook signature
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed.', err.message);
    throw new Parse.Error(Parse.Error.VALIDATION_ERROR, `Webhook Error: ${err.message}`);
  }

  // Handle the event
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

  return { received: true };
}

/**
 * Update user subscription status when checkout is completed
 * @param {Object} session - The Stripe checkout session object
 */
export async function updateSubscriptionStatus(session) {
  try {
    const userId = session.metadata.userId;
    const plan = session.metadata.plan;
    const duration = parseInt(session.metadata.duration);

    if (!userId || !plan) {
      console.error('Missing userId or plan in session metadata');
      return;
    }

    // Calculate subscription end date
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + duration);

    // Update user subscription in the database
    const userQuery = new Parse.Query('contracts_Users');
    userQuery.equalTo('UserId', {
      __type: 'Pointer',
      className: '_User',
      objectId: userId,
    });

    const user = await userQuery.first({ useMasterKey: true });

    if (user) {
      user.set('Subscription', {
        plan: plan,
        startDate: startDate,
        endDate: endDate,
        status: 'active',
        stripeCustomerId: session.customer,
        stripeSubscriptionId: session.subscription,
      });

      await user.save(null, { useMasterKey: true });
      console.log(`Subscription updated for user ${userId}`);
    } else {
      console.error(`User not found for userId ${userId}`);
    }
  } catch (error) {
    console.error('Error updating subscription status:', error);
  }
}

/**
 * Expire user subscription when subscription is deleted
 * @param {Object} subscription - The Stripe subscription object
 */
export async function expireSubscription(subscription) {
  try {
    // Find user by Stripe customer ID
    const userQuery = new Parse.Query('contracts_Users');
    userQuery.equalTo('Subscription.stripeCustomerId', subscription.customer);

    const user = await userQuery.first({ useMasterKey: true });

    if (user) {
      const currentSubscription = user.get('Subscription') || {};
      currentSubscription.status = 'expired';

      user.set('Subscription', currentSubscription);
      await user.save(null, { useMasterKey: true });
      console.log(`Subscription expired for user ${user.id}`);
    } else {
      console.error(`User not found for Stripe customer ${subscription.customer}`);
    }
  } catch (error) {
    console.error('Error expiring subscription:', error);
  }
}

/**
 * Handle successful payment
 * @param {Object} invoice - The Stripe invoice object
 */
export async function handleSuccessfulPayment(invoice) {
  console.log(`Payment succeeded for invoice ${invoice.id}`);
  // Add any additional logic for successful payments here
}

/**
 * Handle failed payment
 * @param {Object} invoice - The Stripe invoice object
 */
export async function handleFailedPayment(invoice) {
  console.log(`Payment failed for invoice ${invoice.id}`);
  // Add any additional logic for failed payments here
  // You might want to notify the user or retry the payment
}

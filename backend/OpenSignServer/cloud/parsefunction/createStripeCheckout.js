/**
 * Cloud function to create a Stripe checkout session
 * @param {String} plan - The plan name (Premium, Gold)
 * @returns {Object} - Returns the checkout session ID
 */
import stripePackage from 'stripe';

// Initialize Stripe with your secret key only if the environment variable is set
let stripe;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = stripePackage(process.env.STRIPE_SECRET_KEY);
}

export default async function createStripeCheckout(request) {
  if (!request?.user) {
    throw new Parse.Error(Parse.Error.INVALID_SESSION_TOKEN, 'User is not authenticated.');
  }

  const { plan } = request.params;

  if (!plan) {
    throw new Parse.Error(Parse.Error.INVALID_QUERY, 'Plan is required.');
  }

  // If Stripe is not configured, return an error
  if (!stripe) {
    throw new Parse.Error(
      Parse.Error.VALIDATION_ERROR,
      'Stripe is not configured. Please contact the administrator.'
    );
  }

  try {
    // Validate that we have a proper Stripe key
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      throw new Parse.Error(
        Parse.Error.VALIDATION_ERROR,
        'Missing Stripe Secret Key. Please configure your STRIPE_SECRET_KEY environment variable.'
      );
    }

    // Map plans to Stripe price IDs
    // In production, these should be real Stripe Price IDs from your Stripe Dashboard
    const planPriceIds = {
      Premium: process.env.STRIPE_PREMIUM_PRICE_ID || 'price_Premium',
      Gold: process.env.STRIPE_GOLD_PRICE_ID || 'price_Gold',
    };

    // Map plans to duration in days
    const planDurations = {
      Premium: 30,
      Gold: 30,
    };

    const priceId = planPriceIds[plan];
    const duration = planDurations[plan];

    if (!priceId) {
      throw new Parse.Error(Parse.Error.INVALID_QUERY, `Invalid plan selected: ${plan}`);
    }

    // Validate that we have proper price IDs
    if (
      priceId.includes('your_actual') ||
      priceId === 'price_Premium' ||
      priceId === 'price_Gold'
    ) {
      throw new Parse.Error(
        Parse.Error.VALIDATION_ERROR,
        'Invalid Stripe Price ID. Please check your STRIPE_PREMIUM_PRICE_ID or STRIPE_GOLD_PRICE_ID environment variables.'
      );
    }

    // Get the user's email (you might want to get this from the user object)
    const userQuery = new Parse.Query('contracts_Users');
    userQuery.equalTo('UserId', {
      __type: 'Pointer',
      className: '_User',
      objectId: request.user.id,
    });

    const user = await userQuery.first({ useMasterKey: true });

    if (!user) {
      throw new Parse.Error(Parse.Error.OBJECT_NOT_FOUND, 'User not found.');
    }

    // Get user email (assuming it's stored in the user object)
    const userEmail = user.get('Email') || 'user@example.com';

    // Validate email format
    if (!userEmail || !userEmail.includes('@')) {
      throw new Parse.Error(
        Parse.Error.VALIDATION_ERROR,
        'Valid email address is required to process payment.'
      );
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      customer_email: userEmail,
      metadata: {
        userId: request.user.id,
        plan: plan,
        duration: duration.toString(),
      },
      success_url: `${
        process.env.FRONTEND_URL || 'http://localhost:3000'
      }/subscription/return?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/subscription`,
    });

    // Return the session ID for redirect
    return {
      sessionId: session.id,
    };
  } catch (err) {
    console.log('Error in createStripeCheckout', err);
    // Provide more specific error messages for common issues
    if (err.code === 'resource_missing') {
      throw new Parse.Error(
        Parse.Error.VALIDATION_ERROR,
        'Invalid Stripe price ID. Please check your Stripe configuration and ensure the price IDs exist in your Stripe account.'
      );
    }
    if (err.type === 'StripeAuthenticationError') {
      throw new Parse.Error(
        Parse.Error.VALIDATION_ERROR,
        'Invalid Stripe API Key. Please check your STRIPE_SECRET_KEY environment variable.'
      );
    }
    if (err.type === 'StripeInvalidRequestError') {
      throw new Parse.Error(
        Parse.Error.VALIDATION_ERROR,
        'Invalid request to Stripe. Please check your configuration.'
      );
    }
    const code = err?.code || Parse.Error.INTERNAL_SERVER_ERROR;
    const message = err?.message || 'Something went wrong while creating checkout session.';
    throw new Parse.Error(code, message);
  }
}
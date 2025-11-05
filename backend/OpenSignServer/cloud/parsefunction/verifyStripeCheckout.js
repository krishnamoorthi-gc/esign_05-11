/**
 * Cloud function to verify a Stripe checkout session
 * @param {String} sessionId - The Stripe checkout session ID
 * @returns {Object} - Returns verification result
 */
import stripePackage from 'stripe';

// Initialize Stripe with your secret key only if the environment variable is set
let stripe;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = stripePackage(process.env.STRIPE_SECRET_KEY);
}

export default async function verifyStripeCheckout(request) {
  if (!request?.user) {
    throw new Parse.Error(Parse.Error.INVALID_SESSION_TOKEN, 'User is not authenticated.');
  }

  const { sessionId } = request.params;

  if (!sessionId) {
    throw new Parse.Error(Parse.Error.INVALID_QUERY, 'Session ID is required.');
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

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // Check if the session was successful
    if (session.status === 'complete') {
      // Update user subscription in the database
      const userId = session.metadata.userId;
      const plan = session.metadata.plan;
      const duration = parseInt(session.metadata.duration);

      if (userId && plan) {
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
          console.log(`User not found: ${userId}`);
        }
      }

      return {
        success: true,
        message: 'Payment verified successfully',
      };
    } else {
      return {
        success: false,
        message: 'Payment not completed',
      };
    }
  } catch (err) {
    console.log('Error in verifyStripeCheckout', err);
    // Handle specific Stripe errors
    if (err.type === 'StripeInvalidRequestError') {
      throw new Parse.Error(
        Parse.Error.VALIDATION_ERROR,
        'Invalid request to Stripe. The session ID may be invalid.'
      );
    }
    if (err.type === 'StripeAuthenticationError') {
      throw new Parse.Error(
        Parse.Error.VALIDATION_ERROR,
        'Invalid Stripe API Key. Please check your STRIPE_SECRET_KEY environment variable.'
      );
    }
    const code = err?.code || Parse.Error.INTERNAL_SERVER_ERROR;
    const message = err?.message || 'Something went wrong while verifying your payment.';
    throw new Parse.Error(code, message);
  }
}
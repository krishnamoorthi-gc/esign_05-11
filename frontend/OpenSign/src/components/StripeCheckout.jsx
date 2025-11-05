import React, { useEffect, useState } from 'react';
import Parse from 'parse';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const StripeCheckout = ({ plan, onClose, onSubscriptionUpdate }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (plan) {
      createCheckoutSession();
    }
  }, [plan]);

  const createCheckoutSession = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Validate plan before proceeding
      if (!plan) {
        throw new Error('No plan selected');
      }
      
      // Call the backend function to create a Stripe checkout session
      const response = await Parse.Cloud.run('createStripeCheckout', { plan });
      
      // Check if we received a valid session ID
      if (!response || !response.sessionId) {
        throw new Error('Failed to create checkout session. Invalid response from server.');
      }
      
      // Redirect to Stripe checkout
      const stripe = await stripePromise;
      
      if (!stripe) {
        throw new Error('Failed to load Stripe.js. Please check your internet connection.');
      }
      
      // Redirect to Stripe checkout
      const { error } = await stripe.redirectToCheckout({
        sessionId: response.sessionId
      });
      
      if (error) {
        throw new Error(error.message);
      }
    } catch (err) {
      console.error('Error creating checkout session:', err);
      setError(err.message || 'Failed to create checkout session. Please try again.');
      setIsLoading(false);
      
      // If it's a configuration error, show a more specific message
      if (err.message.includes('Missing Stripe') || err.message.includes('Invalid Stripe')) {
        setError('Payment system is not properly configured. Please contact support.');
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Complete Your Purchase</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
            <p>Redirecting to secure payment gateway...</p>
          </div>
        )}
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p>{error}</p>
            <button 
              onClick={createCheckoutSession}
              className="mt-2 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
            >
              Try Again
            </button>
          </div>
        )}
        
        {!isLoading && !error && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p>Redirecting to Stripe checkout...</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              You will be redirected to Stripe to complete your purchase of the {plan} plan.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StripeCheckout;
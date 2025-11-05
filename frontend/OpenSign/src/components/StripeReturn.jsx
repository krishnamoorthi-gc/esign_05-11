import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import Parse from 'parse';

const StripeReturn = () => {
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleReturn = async () => {
      try {
        // Extract session_id from URL parameters
        const urlParams = new URLSearchParams(location.search);
        const sessionId = urlParams.get('session_id');

        if (!sessionId) {
          setStatus('error');
          setMessage('No session ID found in the URL. Please contact support if you believe this is an error.');
          return;
        }

        // Call backend to verify the session
        const response = await Parse.Cloud.run('verifyStripeCheckout', { sessionId });
        
        if (response && response.success) {
          setStatus('success');
          setMessage('Payment successful! Your subscription has been activated.');
        } else {
          setStatus('error');
          setMessage(response?.message || 'Payment verification failed. Please contact support.');
        }
      } catch (error) {
        console.error('Error handling Stripe return:', error);
        setStatus('error');
        // Provide more user-friendly error messages
        if (error.message.includes('INVALID_SESSION_TOKEN')) {
          setMessage('Your session has expired. Please log in again and retry your purchase.');
        } else {
          setMessage('An error occurred while processing your payment. Please contact support with the session ID: ' + 
            new URLSearchParams(location.search).get('session_id'));
        }
      }
    };

    handleReturn();
  }, [location.search]);

  const handleContinue = () => {
    navigate('/subscription');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-md w-full">
        <div className="text-center">
          {status === 'loading' && (
            <>
              <div className="flex justify-center mb-6">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Processing Payment</h2>
              <p className="text-gray-600 dark:text-gray-300">Please wait while we verify your payment...</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Payment Successful!</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">{message}</p>
              <button
                onClick={handleContinue}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg transition duration-300"
              >
                Continue to Subscription
              </button>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Payment Error</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">{message}</p>
              <button
                onClick={handleContinue}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg transition duration-300"
              >
                Back to Subscription
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default StripeReturn;
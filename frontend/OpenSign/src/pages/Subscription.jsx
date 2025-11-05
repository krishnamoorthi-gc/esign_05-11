import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router";
import Parse from "parse";
import StripeCheckout from "../components/StripeCheckout";

const Subscription = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const [isLoader, setIsLoader] = useState(true);
  const [subscriptionInfo, setSubscriptionInfo] = useState({});
  const [trialInfo, setTrialInfo] = useState({
    isTrialExpired: false,
    trialEndDate: null,
    daysRemaining: 0
  });
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showStripeCheckout, setShowStripeCheckout] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  useEffect(() => {
    fetchSubscriptionInfo();
    
    // Check for successful payment return from Stripe
    // Safely extract URL parameters
    try {
      const searchParams = new URLSearchParams(location.search);
      const sessionId = searchParams.get('session_id');
      if (sessionId) {
        setShowSuccessMessage(true);
        // Hide success message after 5 seconds
        setTimeout(() => {
          setShowSuccessMessage(false);
        }, 5000);
      }
    } catch (error) {
      console.error("Error parsing URL parameters:", error);
      // Silently handle URL parsing errors to prevent app crash
    }
  }, [location.search]);

  const fetchSubscriptionInfo = async () => {
    try {
      setIsLoader(true);
      
      // Get subscription status
      const subscriptionRes = await Parse.Cloud.run("checkSubscriptionStatus");
      
      setSubscriptionInfo({
        isSubscribed: subscriptionRes.isSubscribed,
        subscriptionPlan: subscriptionRes.subscriptionPlan,
        subscriptionEndDate: subscriptionRes.subscriptionEndDate,
        subscriptionDaysRemaining: subscriptionRes.subscriptionDaysRemaining,
        hasAccess: subscriptionRes.hasAccess
      });
      
      setTrialInfo({
        isTrialExpired: subscriptionRes.isTrialExpired,
        trialEndDate: subscriptionRes.trialEndDate,
        daysRemaining: subscriptionRes.trialDaysRemaining
      });

      setIsLoader(false);
    } catch (error) {
      console.log("Error fetching subscription info:", error);
      // Add user-friendly error handling
      alert("Failed to load subscription information. Please try again later.");
      setIsLoader(false);
    }
  };

  const handlePlanSelect = (plan) => {
    // For real implementation, open Stripe checkout
    setSelectedPlan(plan);
    setShowStripeCheckout(true);
  };

  // Plan features data
  const planFeatures = {
    trial: [
      "Unlimited digital signatures",
      "Sign documents yourself",
      "Request signatures from others",
      "Unlimited templates",
      "14 field types",
      "Automatic e-signatures",
      "Completion certificates",
      "Send in order"
    ],
    premium: [
      "Organize docs in OpenSign™ Drive",
      "Document templates",
      "Import from Dropbox",
      "Contact book",
      "Document expiry support",
      "Decline document support",
      "Email notifications",
      "Public profiles"
    ],
    gold: [
      "Advanced document analytics",
      "Team collaboration",
      "Custom branding",
      "API access",
      "Unlimited users",
      "Priority support",
      "Advanced workflows",
      "Legal compliance"
    ]
  };

  // Helper function to safely format dates
  const formatDate = (date) => {
    if (!date) return "N/A";
    try {
      return date instanceof Date ? date.toDateString() : new Date(date).toDateString();
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid Date";
    }
  };

  return (
    <div className="relative">
      {isLoader && (
        <div className="absolute w-full h-[300px] md:h-[400px] flex justify-center items-center z-30">
          <div className="border-4 border-t-4 border-blue-500 rounded-full w-12 h-12 animate-spin"></div>
        </div>
      )}
      
      {showSuccessMessage && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg z-50">
          <div className="flex items-center">
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span>Payment successful! Your subscription has been activated.</span>
          </div>
        </div>
      )}
      
      {showStripeCheckout && (
        <StripeCheckout 
          plan={selectedPlan}
          onClose={() => setShowStripeCheckout(false)}
          onSubscriptionUpdate={fetchSubscriptionInfo}
        />
      )}
      
      <div className={`${isLoader ? "opacity-0" : "opacity-100"} text-base-content`}>
        <div className="flex flex-row items-center justify-between">
          <div className="text-2xl font-bold">{t("subscription")}</div>
        </div>
        
        {/* Redesigned Account Status Tab */}
        <div className="rounded-xl border-[1px] border-gray-300 dark:border-gray-500 mt-4 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 shadow-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Account Status</h2>
              
              {subscriptionInfo.isSubscribed ? (
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                  <span className="text-green-600 dark:text-green-400 font-medium">
                    Active {subscriptionInfo.subscriptionPlan} Subscription
                  </span>
                </div>
              ) : trialInfo.isTrialExpired ? (
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                  <span className="text-red-600 dark:text-red-400 font-medium">
                    Trial Expired
                  </span>
                </div>
              ) : (
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                  <span className="text-blue-600 dark:text-blue-400 font-medium">
                    Free Trial Active
                  </span>
                </div>
              )}
            </div>
            
            {subscriptionInfo.isSubscribed ? (
              <div className="bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 px-4 py-2 rounded-lg text-center">
                <div className="font-bold text-lg">{subscriptionInfo.subscriptionDaysRemaining}</div>
                <div className="text-sm">Days Remaining</div>
              </div>
            ) : trialInfo.isTrialExpired ? (
              <button 
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-lg transition duration-300"
                onClick={() => handlePlanSelect("Premium")}
              >
                Upgrade Now
              </button>
            ) : (
              <div className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 px-4 py-2 rounded-lg text-center">
                <div className="font-bold text-lg">{trialInfo.daysRemaining}</div>
                <div className="text-sm">Days Remaining</div>
              </div>
            )}
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            {subscriptionInfo.isSubscribed ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-gray-600 dark:text-gray-300 text-sm">Plan</div>
                  <div className="font-bold text-lg">{subscriptionInfo.subscriptionPlan || "None"}</div>
                </div>
                <div>
                  <div className="text-gray-600 dark:text-gray-300 text-sm">Expires on</div>
                  <div className="font-bold text-lg">{formatDate(subscriptionInfo.subscriptionEndDate)}</div>
                </div>
              </div>
            ) : trialInfo.isTrialExpired ? (
              <div>
                <div className="text-gray-600 dark:text-gray-300 mb-2">
                  {t("your-free-trial-has-expired-please-upgrade-to-continue-using-all-features")}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Unlock all premium features with our subscription plans
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-gray-600 dark:text-gray-300 text-sm">Trial Ends</div>
                  <div className="font-bold text-lg">{formatDate(trialInfo.trialEndDate)}</div>
                </div>
                <div>
                  <div className="text-gray-600 dark:text-gray-300 text-sm">Days Remaining</div>
                  <div className="font-bold text-lg">{trialInfo.daysRemaining} of 10</div>
                </div>
              </div>
            )}
          </div>
          
          {!subscriptionInfo.isSubscribed && !trialInfo.isTrialExpired && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-600 dark:text-gray-300">
                After your trial ends, you'll need a subscription to continue using premium features.
              </div>
            </div>
          )}
        </div>
        
        {/* Subscription Plans Cards */}
        <div className="mt-8">
          <h2 className="text-3xl font-bold mb-6 text-center">Choose Your Plan</h2>
          <p className="text-center text-gray-600 dark:text-gray-300 mb-10 max-w-2xl mx-auto">
            Unlock powerful features to streamline your document workflow and enhance collaboration
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Trial Card */}
            <div className="border rounded-xl p-6 shadow-lg bg-white dark:bg-gray-800 flex flex-col transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 relative">
              <div className="text-center mb-4">
                <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400">Trial</h3>
                <p className="text-gray-600 dark:text-gray-300 mt-2">Get started with our platform</p>
              </div>
              <div className="text-center my-4">
                <span className="text-4xl font-bold">$0</span>
                <span className="text-gray-600 dark:text-gray-300">/10 days</span>
              </div>
              <ul className="space-y-3 my-6 flex-grow">
                {planFeatures.trial.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <button 
                className="w-full py-3 bg-blue-500 text-white font-bold rounded-lg transition duration-300 mt-auto"
                onClick={() => handlePlanSelect("Trial")}
                disabled={true}
              >
                {subscriptionInfo.isSubscribed ? "Upgrade Available" : 
                 !trialInfo.isTrialExpired ? "Current Plan" : "Trial Expired"}
              </button>
            </div>

            {/* Premium Card */}
            <div className="border rounded-xl p-6 shadow-lg bg-white dark:bg-gray-800 flex flex-col relative border-blue-500 border-2 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2">
              <div className="absolute top-0 right-0 bg-blue-500 text-white px-4 py-1 rounded-bl-lg rounded-tr-lg font-bold">
                POPULAR
              </div>
              <div className="text-center mb-4">
                <h3 className="text-2xl font-bold text-purple-600 dark:text-purple-400">Premium</h3>
                <p className="text-gray-600 dark:text-gray-300 mt-2">Perfect for individuals</p>
              </div>
              <div className="text-center my-4">
                <span className="text-4xl font-bold">$5</span>
                <span className="text-gray-600 dark:text-gray-300">/month</span>
              </div>
              <ul className="space-y-3 my-6 flex-grow">
                {planFeatures.premium.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <button 
                className={`w-full py-3 ${subscriptionInfo.isSubscribed && subscriptionInfo.subscriptionPlan === 'Premium' 
                  ? 'bg-green-500 cursor-default' 
                  : 'bg-purple-500 hover:bg-purple-600'} text-white font-bold rounded-lg transition duration-300 mt-auto`}
                onClick={() => handlePlanSelect("Premium")}
              >
                {subscriptionInfo.isSubscribed && subscriptionInfo.subscriptionPlan === 'Premium' 
                  ? "Current Plan" 
                  : "Buy Premium"}
              </button>
            </div>

            {/* Gold Card */}
            <div className="border rounded-xl p-6 shadow-lg bg-white dark:bg-gray-800 flex flex-col transition-all duration-300 hover:shadow-2xl hover:-translate-y-2">
              <div className="text-center mb-4">
                <h3 className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">Gold</h3>
                <p className="text-gray-600 dark:text-gray-300 mt-2">Best for teams</p>
              </div>
              <div className="text-center my-4">
                <span className="text-4xl font-bold">$10</span>
                <span className="text-gray-600 dark:text-gray-300">/month</span>
              </div>
              <ul className="space-y-3 my-6 flex-grow">
                {planFeatures.gold.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <button 
                className={`w-full py-3 ${subscriptionInfo.isSubscribed && subscriptionInfo.subscriptionPlan === 'Gold' 
                  ? 'bg-green-500 cursor-default' 
                  : 'bg-yellow-500 hover:bg-yellow-600'} text-white font-bold rounded-lg transition duration-300 mt-auto`}
                onClick={() => handlePlanSelect("Gold")}
              >
                {subscriptionInfo.isSubscribed && subscriptionInfo.subscriptionPlan === 'Gold' 
                  ? "Current Plan" 
                  : "Buy Gold"}
              </button>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="rounded-md border-[1px] border-gray-300 dark:border-gray-500 mt-12 p-6">
          <div className="font-bold text-2xl mb-6 text-center">{t("features")}</div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-start p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <svg className="h-6 w-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-lg">Unlimited digital signatures</span>
            </div>
            <div className="flex items-start p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <svg className="h-6 w-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-lg">Sign documents yourself</span>
            </div>
            <div className="flex items-start p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <svg className="h-6 w-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-lg">Request signatures from others</span>
            </div>
            <div className="flex items-start p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <svg className="h-6 w-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-lg">Unlimited templates</span>
            </div>
            <div className="flex items-start p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <svg className="h-6 w-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-lg">14 field types</span>
            </div>
            <div className="flex items-start p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <svg className="h-6 w-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-lg">Automatic e-signatures</span>
            </div>
            <div className="flex items-start p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <svg className="h-6 w-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-lg">Completion certificates</span>
            </div>
            <div className="flex items-start p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <svg className="h-6 w-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-lg">Send in order</span>
            </div>
            <div className="flex items-start p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <svg className="h-6 w-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-lg">Organize docs in OpenSign™ Drive</span>
            </div>
            <div className="flex items-start p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <svg className="h-6 w-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-lg">Document templates</span>
            </div>
            <div className="flex items-start p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <svg className="h-6 w-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-lg">Import from Dropbox</span>
            </div>
            <div className="flex items-start p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <svg className="h-6 w-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-lg">Contact book</span>
            </div>
            <div className="flex items-start p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <svg className="h-6 w-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-lg">Document expiry support</span>
            </div>
            <div className="flex items-start p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <svg className="h-6 w-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-lg">Decline document support</span>
            </div>
            <div className="flex items-start p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <svg className="h-6 w-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-lg">Email notifications</span>
            </div>
            <div className="flex items-start p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <svg className="h-6 w-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-lg">Public profiles</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Subscription;
import React, { useState, useEffect } from "react";
import Title from "../components/Title";
import { useTranslation } from "react-i18next";
import Parse from "parse";
import { checkSubscriptionStatus } from "../utils/subscriptionUtils";

const ZapierIntegration = () => {
  const { t } = useTranslation();
  const [zapierKey, setZapierKey] = useState("");
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasKey, setHasKey] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    fetchZapierKey();
    checkSubscriptionAccess();
  }, []);

  const checkSubscriptionAccess = async () => {
    try {
      const status = await checkSubscriptionStatus();
      setHasAccess(status.hasAccess);
    } catch (err) {
      console.error("Error checking subscription:", err);
    }
  };

  const fetchZapierKey = async () => {
    try {
      const result = await Parse.Cloud.run("getZapierKey");
      if (result.key) {
        setZapierKey(result.key);
        setHasKey(true);
      }
    } catch (err) {
      console.error("Error fetching Zapier key:", err);
    }
  };

  const generateKey = async () => {
    if (!hasAccess) {
      setError("Upgrade your subscription to use Zapier integration");
      return;
    }

    setIsLoading(true);
    setError("");
    
    try {
      const result = await Parse.Cloud.run("generateZapierKey");
      setZapierKey(result.key);
      setHasKey(true);
    } catch (err) {
      // Provide more specific error messages based on the error type
      if (err.message) {
        setError(err.message);
      } else {
        setError(t("key-generation-failed"));
      }
      console.error("Error generating Zapier key:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const revokeKey = async () => {
    if (window.confirm("Are you sure you want to revoke your Zapier integration key?")) {
      try {
        await Parse.Cloud.run("revokeZapierKey");
        setZapierKey("");
        setHasKey(false);
      } catch (err) {
        setError("Failed to revoke Zapier key. Please try again.");
        console.error("Error revoking key:", err);
      }
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(zapierKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative">
      <Title />
      <div className="container mx-auto p-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div>
            <h1 className="text-[20px] font-semibold">Zapier Integration</h1>
            <p className="text-[14px] mt-2">
              Connect OpenSign with thousands of apps using Zapier automation
            </p>
          </div>
        </div>
        
        {!hasAccess && (
          <div className="alert alert-warning mb-4 mt-4">
            <div>
              <i className="fa-light fa-triangle-exclamation text-xl mr-2"></i>
              <span>Upgrade your subscription to use Zapier integration</span>
            </div>
          </div>
        )}
        
        <div className="rounded-md bg-white shadow-md mt-4 p-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="w-full md:w-3/4">
              <h2 className="text-[18px] font-medium mb-2">Zapier API Key</h2>
              <p className="text-[14px] text-gray-600 mb-4">
                Generate an API key to connect OpenSign with Zapier. This key allows Zapier to access your OpenSign account and automate workflows.
              </p>
              
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
                  {error}
                </div>
              )}
              
              {hasKey ? (
                <div className="flex flex-col">
                  <div className="flex items-center">
                    <input
                      type="text"
                      value={zapierKey}
                      readOnly
                      className="border rounded-l px-4 py-2 w-full focus:outline-none"
                    />
                    <button
                      onClick={copyToClipboard}
                      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-r"
                    >
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <div className="mt-4">
                    <button
                      onClick={revokeKey}
                      className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                      disabled={!hasAccess}
                    >
                      Revoke Key
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Keep this key secure. Anyone with this key can access your OpenSign account through Zapier.
                  </p>
                </div>
              ) : (
                <button
                  onClick={generateKey}
                  disabled={isLoading || !hasAccess}
                  className={`font-bold py-2 px-4 rounded ${hasAccess ? 'bg-blue-500 hover:bg-blue-700 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                >
                  {isLoading ? "Generating..." : "Generate Zapier Key"}
                </button>
              )}
            </div>
            
            <div className="w-full md:w-1/4 mt-4 md:mt-0 flex justify-center">
              <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 flex items-center justify-center">
                <i className="fa-light fa-bolt text-2xl text-yellow-500"></i>
              </div>
            </div>
          </div>
        </div>
        
        <div className="rounded-md bg-white shadow-md mt-4 p-4">
          <h2 className="text-[18px] font-medium mb-2">Setting up Zapier Integration</h2>
          <p className="text-[14px] text-gray-600 mb-4">
            Follow these steps to connect OpenSign with Zapier:
          </p>
          
          <div className="space-y-4">
            <div className="flex">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold mr-3">
                1
              </div>
              <div>
                <h3 className="font-medium">Generate your API Key</h3>
                <p className="text-sm text-gray-600">
                  Click the "Generate Zapier Key" button above to create a unique API key for Zapier integration.
                </p>
              </div>
            </div>
            
            <div className="flex">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold mr-3">
                2
              </div>
              <div>
                <h3 className="font-medium">Copy your API Key</h3>
                <p className="text-sm text-gray-600">
                  Click the "Copy" button to copy your API key to the clipboard.
                </p>
              </div>
            </div>
            
            <div className="flex">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold mr-3">
                3
              </div>
              <div>
                <h3 className="font-medium">Go to Zapier</h3>
                <p className="text-sm text-gray-600">
                  Visit <a href="https://zapier.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">zapier.com</a> and sign in to your account or create a new one.
                </p>
              </div>
            </div>
            
            <div className="flex">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold mr-3">
                4
              </div>
              <div>
                <h3 className="font-medium">Create a Zap</h3>
                <p className="text-sm text-gray-600">
                  Click "Make a Zap" and search for "OpenSign" in the app directory.
                </p>
              </div>
            </div>
            
            <div className="flex">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold mr-3">
                5
              </div>
              <div>
                <h3 className="font-medium">Connect your account</h3>
                <p className="text-sm text-gray-600">
                  When prompted, paste your API key to connect your OpenSign account to Zapier.
                </p>
              </div>
            </div>
            
            <div className="flex">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold mr-3">
                6
              </div>
              <div>
                <h3 className="font-medium">Start automating</h3>
                <p className="text-sm text-gray-600">
                  Choose triggers and actions to create automated workflows between OpenSign and other apps.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="rounded-md bg-white shadow-md mt-4 p-4">
          <h2 className="text-[18px] font-medium mb-2">Available Triggers & Actions</h2>
          <p className="text-[14px] text-gray-600 mb-4">
            OpenSign integration with Zapier provides the following triggers and actions:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-base-300 rounded-box p-4">
              <h3 className="font-medium mb-2 text-blue-500">Triggers</h3>
              <ul className="list-disc pl-5 text-sm text-base-content space-y-1">
                <li>New Document Created</li>
                <li>Document Sent</li>
                <li>Document Viewed</li>
                <li>Document Signed</li>
                <li>Document Completed</li>
                <li>Document Declined</li>
              </ul>
            </div>
            
            <div className="border border-base-300 rounded-box p-4">
              <h3 className="font-medium mb-2 text-green-500">Actions</h3>
              <ul className="list-disc pl-5 text-sm text-base-content space-y-1">
                <li>Create Document</li>
                <li>Send Document</li>
                <li>Add Signer to Document</li>
                <li>Update Document Status</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ZapierIntegration;
import React, { useEffect, useState } from "react";
import Title from "../components/Title";
import { useNavigate } from "react-router";
import Parse from "parse";
import { checkSubscriptionStatus } from "../utils/subscriptionUtils";

const Webhook = () => {
  const navigate = useNavigate();
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookEvents, setWebhookEvents] = useState({
    "document.created": false,
    "document.sent": false,
    "document.viewed": false,
    "document.signed": false,
    "document.completed": false,
    "document.declined": false
  });
  const [secretToken, setSecretToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");
  const [hasAccess, setHasAccess] = useState(false);
  const [webhookSubscriptions, setWebhookSubscriptions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchWebhookSubscriptions();
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

  const fetchWebhookSubscriptions = async () => {
    try {
      const subscriptions = await Parse.Cloud.run("getWebhookSubscriptions");
      setWebhookSubscriptions(subscriptions);
    } catch (err) {
      console.error("Error fetching webhook subscriptions:", err);
    }
  };

  const isValidURL = (url) => {
    try {
      new URL(url);
      return url.startsWith("https://");
    } catch (e) {
      return false;
    }
  };

  const handleEventChange = (event) => {
    setWebhookEvents(prev => ({
      ...prev,
      [event.target.name]: event.target.checked
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setIsSuccess(false);

    // Validate form
    if (!webhookUrl) {
      setError("Please enter a webhook URL");
      setIsLoading(false);
      return;
    }

    if (!isValidURL(webhookUrl)) {
      setError("Please enter a valid HTTPS URL");
      setIsLoading(false);
      return;
    }

    const selectedEvents = Object.keys(webhookEvents).filter(event => webhookEvents[event]);
    if (selectedEvents.length === 0) {
      setError("Please select at least one event");
      setIsLoading(false);
      return;
    }

    try {
      const params = {
        url: webhookUrl,
        events: selectedEvents,
        secret_token: secretToken || undefined
      };

      if (editingId) {
        // Update existing subscription
        await Parse.Cloud.run("updateWebhookSubscription", {
          subscriptionId: editingId,
          ...params
        });
      } else {
        // Create new subscription
        await Parse.Cloud.run("createWebhookSubscription", params);
      }

      // Reset form
      setWebhookUrl("");
      setWebhookEvents({
        "document.created": false,
        "document.sent": false,
        "document.viewed": false,
        "document.signed": false,
        "document.completed": false,
        "document.declined": false
      });
      setSecretToken("");
      setEditingId(null);
      setShowForm(false);
      
      // Refresh subscriptions list
      await fetchWebhookSubscriptions();
      
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 3000);
    } catch (err) {
      console.error("Error saving webhook subscription:", err);
      setError(err.message || "Failed to save webhook subscription. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (subscription) => {
    setWebhookUrl(subscription.url);
    setSecretToken(subscription.secret_token);
    
    // Reset all events to false first
    const resetEvents = {};
    Object.keys(webhookEvents).forEach(event => {
      resetEvents[event] = false;
    });
    
    // Set events from subscription
    subscription.events.forEach(event => {
      resetEvents[event] = true;
    });
    
    setWebhookEvents(resetEvents);
    setEditingId(subscription.id);
    setShowForm(true);
  };

  const handleDelete = async (subscriptionId) => {
    if (window.confirm("Are you sure you want to delete this webhook subscription?")) {
      try {
        await Parse.Cloud.run("deleteWebhookSubscription", {
          subscriptionId
        });
        
        // Refresh subscriptions list
        await fetchWebhookSubscriptions();
      } catch (err) {
        console.error("Error deleting webhook subscription:", err);
        setError(err.message || "Failed to delete webhook subscription. Please try again.");
      }
    }
  };

  const handleTestWebhook = async () => {
    try {
      // This would be implemented based on your backend API
      alert("Webhook test functionality would be implemented here");
    } catch (err) {
      console.error("Error testing webhook:", err);
      setError("Failed to test webhook. Please try again.");
    }
  };

  const toggleForm = () => {
    setShowForm(!showForm);
    if (showForm) {
      // Reset form when closing
      setWebhookUrl("");
      setWebhookEvents({
        "document.created": false,
        "document.sent": false,
        "document.viewed": false,
        "document.signed": false,
        "document.completed": false,
        "document.declined": false
      });
      setSecretToken("");
      setEditingId(null);
    }
  };

  return (
    <div className="relative">
      <Title /> {/* Render Title component properly */}
      <div className="md:p-4 p-2">
        <div className="bg-base-100 rounded-box px-4 py-3 text-base-content">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-lg font-bold">Webhook Settings</div>
          </div>
        </div>
        <div className="mt-4 bg-base-100 rounded-box px-4 py-6 text-base-content">
          <div className="text-sm md:text-base">
            <p className="mb-4">
              Configure webhook URLs to receive real-time notifications about document events.
            </p>
            
            {!hasAccess && (
              <div className="alert alert-warning mb-4">
                <div>
                  <i className="fa-light fa-triangle-exclamation text-xl mr-2"></i>
                  <span>Upgrade your subscription to use webhook functionality</span>
                </div>
              </div>
            )}
            
            {isSuccess && (
              <div className="alert alert-success mb-4">
                <div>
                  <i className="fa-light fa-circle-check text-xl mr-2"></i>
                  <span>Webhook subscription saved successfully!</span>
                </div>
              </div>
            )}
            
            {error && (
              <div className="alert alert-error mb-4">
                <div>
                  <i className="fa-light fa-circle-exclamation text-xl mr-2"></i>
                  <span>{error}</span>
                </div>
              </div>
            )}
            
            <div className="mb-6">
              <button
                className="op-btn op-btn-primary"
                onClick={toggleForm}
                disabled={!hasAccess}
              >
                {showForm ? "Cancel" : "Add Webhook"}
              </button>
            </div>
            
            {showForm && (
              <form onSubmit={handleSubmit} className="mb-8 p-4 border border-base-300 rounded-box">
                <h3 className="text-lg font-semibold mb-4">
                  {editingId ? "Edit Webhook" : "Add New Webhook"}
                </h3>
                
                <div className="mb-4">
                  <label htmlFor="webhookUrl" className="block text-sm font-medium mb-2">
                    Webhook URL
                  </label>
                  <input
                    type="url"
                    id="webhookUrl"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="https://yourdomain.com/webhook"
                    className="op-input op-input-bordered op-input-sm focus:outline-none hover:border-base-content w-full max-w-md"
                    disabled={!hasAccess}
                  />
                  <p className="text-xs text-base-content mt-1">
                    Must be a secure HTTPS URL
                  </p>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">
                    Events
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {Object.entries(webhookEvents).map(([event, checked]) => (
                      <div key={event} className="flex items-center">
                        <input
                          type="checkbox"
                          id={event}
                          name={event}
                          checked={checked}
                          onChange={handleEventChange}
                          className="op-checkbox op-checkbox-sm mr-2"
                          disabled={!hasAccess}
                        />
                        <label htmlFor={event} className="text-sm">
                          {event}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="mb-4">
                  <label htmlFor="secretToken" className="block text-sm font-medium mb-2">
                    Secret Token (Optional)
                  </label>
                  <input
                    type="text"
                    id="secretToken"
                    value={secretToken}
                    onChange={(e) => setSecretToken(e.target.value)}
                    placeholder="Leave blank to auto-generate"
                    className="op-input op-input-bordered op-input-sm focus:outline-none hover:border-base-content w-full max-w-md"
                    disabled={!hasAccess}
                  />
                  <p className="text-xs text-base-content mt-1">
                    Used to create HMAC signatures for security
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="submit"
                    className={`op-btn op-btn-primary ${isLoading ? "opacity-70 cursor-not-allowed" : ""}`}
                    disabled={isLoading || !hasAccess}
                  >
                    {isLoading ? (
                      <>
                        <i className="fa-light fa-spinner fa-spin mr-2"></i>
                        Saving...
                      </>
                    ) : (
                      editingId ? "Update Webhook" : "Add Webhook"
                    )}
                  </button>
                </div>
              </form>
            )}
            
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Your Webhook Subscriptions</h3>
              
              {webhookSubscriptions.length === 0 ? (
                <div className="text-center py-8 text-base-content">
                  <i className="fa-light fa-webhook text-4xl mb-2"></i>
                  <p>No webhook subscriptions found</p>
                  <p className="text-sm mt-1">Add a webhook to receive real-time notifications</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table table-zebra">
                    <thead>
                      <tr>
                        <th>URL</th>
                        <th>Events</th>
                        <th>Created</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {webhookSubscriptions.map((subscription) => (
                        <tr key={subscription.id}>
                          <td className="max-w-xs truncate">
                            <a 
                              href={subscription.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="link link-primary"
                            >
                              {subscription.url}
                            </a>
                          </td>
                          <td>
                            <div className="flex flex-wrap gap-1">
                              {subscription.events.map(event => (
                                <span key={event} className="badge badge-sm badge-primary">
                                  {event}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td>
                            {new Date(subscription.created_at).toLocaleDateString()}
                          </td>
                          <td>
                            <div className="flex gap-2">
                              <button
                                className="op-btn op-btn-xs op-btn-secondary"
                                onClick={() => handleEdit(subscription)}
                                disabled={!hasAccess}
                              >
                                Edit
                              </button>
                              <button
                                className="op-btn op-btn-xs op-btn-error"
                                onClick={() => handleDelete(subscription.id)}
                                disabled={!hasAccess}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-3">Webhook Events</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-base-300 rounded-box p-4">
                  <h4 className="font-medium mb-2">document.created</h4>
                  <p className="text-sm text-base-content">
                    Triggered when a new document is created.
                  </p>
                </div>
                <div className="border border-base-300 rounded-box p-4">
                  <h4 className="font-medium mb-2">document.sent</h4>
                  <p className="text-sm text-base-content">
                    Triggered when a document is sent to recipients.
                  </p>
                </div>
                <div className="border border-base-300 rounded-box p-4">
                  <h4 className="font-medium mb-2">document.viewed</h4>
                  <p className="text-sm text-base-content">
                    Triggered when a recipient views a document.
                  </p>
                </div>
                <div className="border border-base-300 rounded-box p-4">
                  <h4 className="font-medium mb-2">document.signed</h4>
                  <p className="text-sm text-base-content">
                    Triggered when a document is signed by a recipient.
                  </p>
                </div>
                <div className="border border-base-300 rounded-box p-4">
                  <h4 className="font-medium mb-2">document.completed</h4>
                  <p className="text-sm text-base-content">
                    Triggered when all required actions on a document are completed.
                  </p>
                </div>
                <div className="border border-base-300 rounded-box p-4">
                  <h4 className="font-medium mb-2">document.declined</h4>
                  <p className="text-sm text-base-content">
                    Triggered when a recipient declines to sign a document.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-3">Webhook Security</h3>
              <div className="border border-base-300 rounded-box p-4">
                <p className="mb-2">
                  Each webhook request includes an <code className="px-1 py-0.5 bg-base-200 rounded">X-Webhook-Signature</code> header.
                  Use this HMAC signature to verify the authenticity of the request.
                </p>
                <pre className="bg-base-200 p-3 rounded text-sm overflow-x-auto">
{`// Example verification in Node.js
const crypto = require('crypto');

function verifySignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
    
  return crypto.timingSafeEqual(
    Buffer.from(signature), 
    Buffer.from(expectedSignature)
  );
}`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Webhook;
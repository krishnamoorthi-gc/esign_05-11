import React, { useState, useEffect } from "react";
import Title from "../components/Title";
import { useTranslation } from "react-i18next";
import Parse from "parse";

const APIToken = () => {
  const { t } = useTranslation();
  const [token, setToken] = useState("");
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    fetchToken();
  }, []);

  const fetchToken = async () => {
    try {
      const result = await Parse.Cloud.run("getAPIToken");
      if (result.token) {
        setToken(result.token);
        setHasToken(true);
      }
    } catch (err) {
      console.error("Error fetching token:", err);
    }
  };

  const generateToken = async () => {
    setIsLoading(true);
    setError("");
    
    try {
      const result = await Parse.Cloud.run("generateAPIToken");
      setToken(result.token);
      setHasToken(true);
    } catch (err) {
      setError(t("token-generation-failed"));
      console.error("Error generating token:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const revokeToken = async () => {
    if (window.confirm("Are you sure you want to revoke your API token?")) {
      try {
        await Parse.Cloud.run("revokeAPIToken");
        setToken("");
        setHasToken(false);
      } catch (err) {
        setError("Failed to revoke API token. Please try again.");
        console.error("Error revoking token:", err);
      }
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative">
      <Title />
      <div className="container mx-auto p-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div>
            <h1 className="text-[20px] font-semibold">{t("api-token")}</h1>
            <p className="text-[14px] mt-2">
              {t("help-api-token", { origin: window.location.origin })}
            </p>
          </div>
        </div>
        
        <div className="rounded-md bg-white shadow-md mt-4 p-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="w-full md:w-3/4">
              <h2 className="text-[18px] font-medium mb-2">{t("generate-api-token")}</h2>
              <p className="text-[14px] text-gray-600 mb-4">
                {t("api-token-description")}
              </p>
              
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
                  {error}
                </div>
              )}
              
              {hasToken ? (
                <div className="flex flex-col">
                  <div className="flex items-center">
                    <input
                      type="text"
                      value={token}
                      readOnly
                      className="border rounded-l px-4 py-2 w-full focus:outline-none"
                    />
                    <button
                      onClick={copyToClipboard}
                      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-r"
                    >
                      {copied ? t("copied") : t("copy")}
                    </button>
                  </div>
                  <div className="mt-4">
                    <button
                      onClick={revokeToken}
                      className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                    >
                      {t("revoke-token")}
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    {t("token-security-warning")}
                  </p>
                </div>
              ) : (
                <button
                  onClick={generateToken}
                  disabled={isLoading}
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                  {isLoading ? t("generating") : t("generate-token")}
                </button>
              )}
            </div>
            
            <div className="w-full md:w-1/4 mt-4 md:mt-0 flex justify-center">
              <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16" />
            </div>
          </div>
        </div>
        
        <div className="rounded-md bg-white shadow-md mt-4 p-4">
          <h2 className="text-[18px] font-medium mb-2">{t("api-usage")}</h2>
          <p className="text-[14px] text-gray-600 mb-4">
            {t("api-usage-description")}
          </p>
          
          <div className="bg-gray-100 p-4 rounded-md">
            <pre className="text-sm overflow-x-auto">
              {`curl -X POST ${window.location.origin}/api/v1/upload \\
  -H "Authorization: Bearer YOUR_API_TOKEN" \\
  -F "file=@document.pdf"`}
            </pre>
          </div>
          
          <h3 className="text-[16px] font-medium mt-4 mb-2">{t("available-endpoints")}</h3>
          <ul className="list-disc pl-5 text-[14px] text-gray-600">
            <li>{t("upload-document-endpoint")}</li>
            <li>{t("get-user-info-endpoint")}</li>
            <li>{t("more-endpoints-coming")}</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default APIToken;
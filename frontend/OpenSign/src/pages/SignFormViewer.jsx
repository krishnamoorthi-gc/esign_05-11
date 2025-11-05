import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import Parse from "parse";
import { pdfjs } from "react-pdf";
import Loader from "../primitives/Loader";
import Title from "../components/Title";
import Alert from "../primitives/Alert";
import { useTranslation } from "react-i18next";
import { PDFDocument } from "pdf-lib";
import axios from "axios";

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/legacy/build/pdf.worker.min.mjs`;

function SignFormViewer() {
  const { docId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAlert, setIsAlert] = useState({ type: "success", message: "" });

  useEffect(() => {
    fetchDocument();
  }, [docId]);

  const fetchDocument = async () => {
    try {
      setLoading(true);
      console.log("Fetching document with ID:", docId);
      
      // First, try to find the document by ID only (without SignForm filter)
      const generalQuery = new Parse.Query("contracts_Document");
      generalQuery.equalTo("objectId", docId);
      
      console.log("Executing general query for document");
      const generalDocument = await generalQuery.first({ useMasterKey: true });
      console.log("General query result:", generalDocument);
      
      if (generalDocument) {
        const generalData = generalDocument.toJSON();
        console.log("General document data:", generalData);
        console.log("IsSignForm flag:", generalData.IsSignForm);
        console.log("ACL:", generalData.ACL);
        
        // Check if document has public read access
        const hasPublicRead = generalData.ACL && generalData.ACL["*"] && generalData.ACL["*"].read;
        console.log("Has public read access:", hasPublicRead);
        
        // If it's a SignForm or has public access, we can display it
        if (generalData.IsSignForm || hasPublicRead) {
          setDocument(generalData);
          return;
        } else {
          setError("This document is not a public SignForm.");
        }
      } else {
        // Try with master key to see if it exists at all
        console.log("Document not found, trying with master key");
        const masterQuery = new Parse.Query("contracts_Document");
        masterQuery.equalTo("objectId", docId);
        const masterDocument = await masterQuery.first({ useMasterKey: true });
        
        if (masterDocument) {
          console.log("Document exists but may not have public access");
          setError("SignForm not found or access denied.");
        } else {
          console.log("No document found with the given ID");
          setError("SignForm not found.");
        }
      }
    } catch (err) {
      console.error("Error fetching document:", err);
      setError("Failed to load SignForm. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSign = async () => {
    try {
      // Redirect to the signing page
      navigate(`/recipientSignPdf/${docId}`);
    } catch (err) {
      console.error("Error starting signature process:", err);
      setIsAlert({ type: "danger", message: "Failed to start signature process." });
      setTimeout(() => setIsAlert({ type: "success", message: "" }), 3000);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="op-card bg-base-100 shadow-md rounded-box p-6 w-full max-w-md">
          <Title title="SignForm" />
          <div className="text-center py-4">
            <div className="text-red-500 text-lg mb-4">{error}</div>
            <button
              onClick={() => navigate("/")}
              className="op-btn op-btn-primary"
            >
              {t("go-home")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-base-200 min-h-screen">
      <Title title={document?.Name || "SignForm"} />
      <Alert type={isAlert.type}>{isAlert.message}</Alert>
      <div className="container mx-auto px-4 py-8">
        <div className="op-card bg-base-100 shadow-md rounded-box p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-base-content">
                {document?.Name || "Untitled SignForm"}
              </h1>
              {document?.Description && (
                <p className="text-base-content mt-2">{document.Description}</p>
              )}
            </div>
          </div>

          {document?.Note && (
            <div className="op-card bg-info text-info-content rounded-box p-4 mb-6">
              <div className="font-semibold mb-1">{t("note")}:</div>
              <div>{document.Note}</div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="op-card bg-base-200 rounded-box p-4">
              <h2 className="text-xl font-semibold mb-3">{t("document-details")}</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">{t("created-by")}:</span>
                  <span>{document?.ExtUserPtr?.Company || "Unknown"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">{t("time-to-complete")}:</span>
                  <span>{document?.TimeToCompleteDays || 15} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">{t("send-in-order")}:</span>
                  <span>{document?.SendinOrder ? t("yes") : t("no")}</span>
                </div>
              </div>
            </div>

            <div className="op-card bg-base-200 rounded-box p-4">
              <h2 className="text-xl font-semibold mb-3">{t("signing-options")}</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">{t("otp-required")}:</span>
                  <span>{document?.IsEnableOTP ? t("yes") : t("no")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">{t("tour-enabled")}:</span>
                  <span>{document?.IsTourEnabled ? t("yes") : t("no")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">{t("modifications-allowed")}:</span>
                  <span>{document?.AllowModifications ? t("yes") : t("no")}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-6">
            <button
              onClick={handleSign}
              className="op-btn op-btn-primary op-btn-lg flex-1 max-w-xs"
            >
              {t("sign-document")}
            </button>
            <button
              onClick={() => navigate("/")}
              className="op-btn op-btn-secondary op-btn-lg flex-1 max-w-xs"
            >
              {t("go-home")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignFormViewer;
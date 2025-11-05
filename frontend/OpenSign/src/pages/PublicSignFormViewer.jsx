import React from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";

const PublicSignFormViewer = () => {
  const { formId } = useParams();
  const { t } = useTranslation();
  
  return (
    <div className="flex items-center justify-center h-screen w-full bg-base-100 text-base-content rounded-box">
      <div className="text-center">
        <h1 className="text-3xl font-semibold mb-4">{t("public-sign-form-viewer")}</h1>
        <p className="text-lg">
          {t("public-sign-form-viewer-description")}
        </p>
        {formId && (
          <p className="text-md mt-4">
            {t("form-id")}: {formId}
          </p>
        )}
      </div>
    </div>
  );
};

export default PublicSignFormViewer;
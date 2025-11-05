import React from "react";
import { useTranslation } from "react-i18next";

const TestPublicSignForm = () => {
  const { t } = useTranslation();
  
  return (
    <div className="flex items-center justify-center h-screen w-full bg-base-100 text-base-content rounded-box">
      <div className="text-center">
        <h1 className="text-3xl font-semibold mb-4">{t("test-public-sign-form")}</h1>
        <p className="text-lg">
          {t("test-public-sign-form-description")}
        </p>
      </div>
    </div>
  );
};

export default TestPublicSignForm;
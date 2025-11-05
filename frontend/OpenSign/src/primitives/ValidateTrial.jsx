import React from "react";
import { useNavigate } from "react-router";

const ValidateTrial = ({ children }) => {
  const navigate = useNavigate();

  // For now, we'll just render the children without any validation
  // In a production environment, this would check trial status
  return <>{children}</>;
};

export default ValidateTrial;
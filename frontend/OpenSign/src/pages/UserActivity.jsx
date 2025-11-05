import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import Parse from "parse";
import Loader from "../primitives/Loader";
import { useTranslation } from "react-i18next";

const UserActivity = () => {
  const { t } = useTranslation();
  const { userId } = useParams();
  const navigate = useNavigate();
  const [userDetails, setUserDetails] = useState(null);
  const [userDocuments, setUserDocuments] = useState([]);
  const [userTemplates, setUserTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (userId) {
      fetchUserActivity();
    }
  }, [userId]);

  const fetchUserActivity = async () => {
    try {
      const result = await Parse.Cloud.run('getUserActivity', { userId });
      setUserDetails(result.userDetails);
      setUserDocuments(result.userDocuments);
      setUserTemplates(result.userTemplates);
    } catch (err) {
      console.error("Error fetching user activity:", err);
      setError(t("something-went-wrong-mssg") + ": " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  const formatRole = (role) => {
    if (!role) return "-";
    return role.replace("contracts_", "");
  };

  const formatStatus = (doc) => {
    if (doc.IsCompleted) return t("completed");
    if (doc.IsDeclined) return t("declined");
    if (doc.SignedUrl) return t("partially-signed");
    return t("in-progress");
  };

  const getStatusBadgeClass = (doc) => {
    if (doc.IsCompleted) return "badge-success";
    if (doc.IsDeclined) return "badge-error";
    if (doc.SignedUrl) return "badge-warning";
    return "badge-info";
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
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">{t("error")}:</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      </div>
    );
  }

  if (!userDetails) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">{t("error")}:</strong>
          <span className="block sm:inline"> {t("user-not-found")}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div className="flex items-center">
          <button 
            onClick={() => navigate(-1)} 
            className="op-btn op-btn-secondary mr-3"
          >
            <i className="fa-light fa-arrow-left mr-2"></i>
            {t("back")}
          </button>
          <h1 className="text-2xl md:text-3xl font-bold text-base-content">
            <i className="fa-light fa-user-chart mr-2"></i>
            {t("user-activity")}
          </h1>
        </div>
        <div className="flex items-center bg-base-200 rounded-lg px-4 py-2">
          <div className="avatar placeholder mr-3">
            <div className="bg-base-300 text-base-content rounded-full w-12 h-12 flex items-center justify-center">
              <span className="text-xl font-bold">
                {userDetails.Name ? userDetails.Name.charAt(0).toUpperCase() : "U"}
              </span>
            </div>
          </div>
          <div>
            <h2 className="font-bold text-lg">{userDetails.Name || "-"}</h2>
            <p className="text-sm text-base-content/70">{userDetails.Email || "-"}</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="op-card bg-primary text-primary-content shadow-lg">
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-2">{t("documents-created")}</h3>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">{userDetails.DocumentCount || 0}</span>
              <i className="fa-light fa-file-contract text-2xl"></i>
            </div>
          </div>
        </div>
        
        <div className="op-card bg-secondary text-secondary-content shadow-lg">
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-2">{t("templates-created")}</h3>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">{userDetails.TemplateCount || 0}</span>
              <i className="fa-light fa-file-template text-2xl"></i>
            </div>
          </div>
        </div>
        
        <div className="op-card bg-accent text-accent-content shadow-lg">
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-2">{t("emails-sent")}</h3>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">{userDetails.EmailCount || 0}</span>
              <i className="fa-light fa-envelope text-2xl"></i>
            </div>
          </div>
        </div>
        
        <div className="op-card bg-neutral text-neutral-content shadow-lg">
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-2">{t("account-status")}</h3>
            <div className="flex items-center justify-between">
              <span className="text-xl font-bold">
                {userDetails.IsDisabled ? t("disabled") : t("active")}
              </span>
              <i className={`fa-light fa-${userDetails.IsDisabled ? 'user-slash' : 'user-check'} text-2xl`}></i>
            </div>
          </div>
        </div>
      </div>

      {/* User Details Card */}
      <div className="op-card bg-base-100 shadow-lg mb-6">
        <div className="p-4 border-b border-base-300">
          <h2 className="text-xl font-semibold flex items-center">
            <i className="fa-light fa-user-circle mr-2"></i>
            {t("user-details")}
          </h2>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">{t("name")}</span>
              </label>
              <div className="bg-base-200 p-3 rounded-lg">
                {userDetails.Name || "-"}
              </div>
            </div>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">{t("email")}</span>
              </label>
              <div className="bg-base-200 p-3 rounded-lg">
                {userDetails.Email || "-"}
              </div>
            </div>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">{t("phone")}</span>
              </label>
              <div className="bg-base-200 p-3 rounded-lg">
                {userDetails.Phone || "-"}
              </div>
            </div>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">{t("role")}</span>
              </label>
              <div className="bg-base-200 p-3 rounded-lg">
                {formatRole(userDetails.UserRole) || "-"}
              </div>
            </div>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">{t("company")}</span>
              </label>
              <div className="bg-base-200 p-3 rounded-lg">
                {userDetails.Company || "-"}
              </div>
            </div>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">{t("job-title")}</span>
              </label>
              <div className="bg-base-200 p-3 rounded-lg">
                {userDetails.JobTitle || "-"}
              </div>
            </div>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">{t("created-at")}</span>
              </label>
              <div className="bg-base-200 p-3 rounded-lg">
                {formatDate(userDetails.createdAt)}
              </div>
            </div>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">{t("last-updated")}</span>
              </label>
              <div className="bg-base-200 p-3 rounded-lg">
                {formatDate(userDetails.updatedAt)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Documents Section */}
      <div className="op-card bg-base-100 shadow-lg mb-6">
        <div className="p-4 border-b border-base-300">
          <h2 className="text-xl font-semibold flex items-center">
            <i className="fa-light fa-files mr-2"></i>
            {t("recent-documents")}
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="op-table op-table-zebra w-full">
            <thead className="bg-base-200">
              <tr>
                <th className="p-3">{t("title")}</th>
                <th className="p-3">{t("status")}</th>
                <th className="p-3">{t("signers")}</th>
                <th className="p-3">{t("created-date")}</th>
              </tr>
            </thead>
            <tbody>
              {userDocuments.length > 0 ? (
                userDocuments.map((doc) => (
                  <tr key={doc.objectId} className="hover">
                    <td className="p-3 max-w-xs truncate font-medium">{doc.Name || "-"}</td>
                    <td className="p-3">
                      <span className={`badge ${getStatusBadgeClass(doc)} badge-sm md:badge-md`}>
                        {formatStatus(doc)}
                      </span>
                    </td>
                    <td className="p-3 text-center">{doc.Signers?.length || 0}</td>
                    <td className="p-3">{formatDate(doc.createdAt)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-base-content/70">
                    <i className="fa-light fa-file-contract text-3xl mb-2 block"></i>
                    {t("no-documents-found")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Templates Section */}
      <div className="op-card bg-base-100 shadow-lg">
        <div className="p-4 border-b border-base-300">
          <h2 className="text-xl font-semibold flex items-center">
            <i className="fa-light fa-file-template mr-2"></i>
            {t("recent-templates")}
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="op-table op-table-zebra w-full">
            <thead className="bg-base-200">
              <tr>
                <th className="p-3">{t("title")}</th>
                <th className="p-3">{t("signers")}</th>
                <th className="p-3">{t("created-date")}</th>
              </tr>
            </thead>
            <tbody>
              {userTemplates.length > 0 ? (
                userTemplates.map((template) => (
                  <tr key={template.objectId} className="hover">
                    <td className="p-3 max-w-xs truncate font-medium">{template.Name || "-"}</td>
                    <td className="p-3 text-center">{template.Signers?.length || 0}</td>
                    <td className="p-3">{formatDate(template.createdAt)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="p-8 text-center text-base-content/70">
                    <i className="fa-light fa-file-template text-3xl mb-2 block"></i>
                    {t("no-templates-found")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserActivity;
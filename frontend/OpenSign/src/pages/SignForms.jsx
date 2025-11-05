import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import Parse from "parse";
import Alert from "../primitives/Alert";
import { SaveFileSize } from "../constant/saveFileSize";
import {
  flattenPdf,
  generatePdfName,
  generateTitleFromFilename,
  getSecureUrl,
  toDataUrl,
  decryptPdf,
  getFileAsArrayBuffer
} from "../constant/Utils";
import { checkSubscriptionStatus, showSubscriptionAlert } from "../utils/subscriptionUtils";
import { PDFDocument } from "pdf-lib";
import axios from "axios";
import {
  maxFileSize,
  maxDescriptionLength,
  maxNoteLength,
  maxTitleLength
} from "../constant/const";
import ModalUi from "../primitives/ModalUi";
import Loader from "../primitives/Loader";
import { useTranslation } from "react-i18next";
import Title from "../components/Title";

// `SignForms` component for creating publicly shareable signature forms
function SignForms() {
  const appName = "OpenSign™";
  const { t } = useTranslation();
  const abortController = new AbortController();
  const inputFileRef = useRef(null);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    Name: "",
    Description: "",
    Note: "",
    TimeToCompleteDays: 15,
    SendinOrder: false,
    file: "",
    IsEnableOTP: false,
    IsTourEnabled: true,
    NotifyOnSignatures: true,
    Bcc: [],
    RedirectUrl: "",
    AllowModifications: false,
    SignatureType: "draw",
  });
  const [fileupload, setFileUpload] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [fileload, setfileload] = useState(false);
  const [percentage, setpercentage] = useState(0);
  const [isReset, setIsReset] = useState(false);
  const [isAlert, setIsAlert] = useState({ type: "success", message: "" });
  const [isSubmit, setIsSubmit] = useState(false);
  const [isPassword, setIsPassword] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [isCorrectPass, setIsCorrectPass] = useState(true);
  const [isAdvanceOpt, setIsAdvanceOpt] = useState(false);
  const [bcc, setBcc] = useState([]);
  const [isTrialExpiredModal, setIsTrialExpiredModal] = useState(false);
  const [publicUrl, setPublicUrl] = useState("");

  const handleStrInput = (e) => {
    setIsCorrectPass(true);
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCheckboxInput = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.checked });
  };

  const extUserData =
    localStorage.getItem("Extand_Class") &&
    JSON.parse(localStorage.getItem("Extand_Class"))?.[0];

  useEffect(() => {
    handleReset();
    return () => abortController.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // `removeFile` is used to reset progress, percentage and remove file if exists
  const removeFile = (e) => {
    setfileload(false);
    setpercentage(0);
    if (e) {
      e.target.value = "";
    }
  };

  const handleFileInput = async (e) => {
    setpercentage(0);
    
    // Check subscription status before allowing file upload
    const subscriptionStatus = await checkSubscriptionStatus();
    if (!showSubscriptionAlert(subscriptionStatus)) {
      // User doesn't have access, show trial expired modal
      if (subscriptionStatus.isTrialExpired && !subscriptionStatus.isSubscribed) {
        setIsTrialExpiredModal(true);
      }
      e.target.value = ""; // Clear the file input
      return;
    }
    
    try {
      const files = Array.from(e.target.files);
      const filesNameArr = files.map((f) => f.name);
      setSelectedFiles(filesNameArr);
      if (!files.length) {
        alert(t("file-alert-2"));
        return;
      }
      
      const totalMb = Math.round(
        files.reduce((sum, f) => sum + f.size, 0) / Math.pow(1024, 2)
      );
      if (totalMb > maxFileSize) {
        alert(`${t("file-alert-1")} ${maxFileSize} MB`);
        setFileUpload("");
        setSelectedFiles([]);
        removeFile(e);
        return;
      }

      const pdfBuffers = [];
      for (const file of files) {
        setFormData((prev) => ({ ...prev, file: file }));
        if (file.type === "application/pdf") {
          try {
            const buffer = await getFileAsArrayBuffer(file);
            const flat = await flattenPdf(buffer);
            pdfBuffers.push(flat);
          } catch (err) {
            if (err?.message?.includes("is encrypted")) {
              try {
                setIsDecrypting(true);
                const pdfFile = await decryptPdf(file, "");
                setIsDecrypting(false);
                setfileload(true);
                const res = await getFileAsArrayBuffer(pdfFile);
                const flatPdf = await flattenPdf(res);
                pdfBuffers.push(flatPdf);
              } catch (err) {
                removeFile(e);
                if (err?.response?.status === 401) {
                  const password = prompt(
                    `PDF "${file.name}" is password-protected. Enter password:`
                  );

                  if (password) {
                    try {
                      const pdfFile = await decryptPdf(file, password);
                      setIsDecrypting(false);
                      setfileload(true);
                      const res = await getFileAsArrayBuffer(pdfFile);
                      const flatPdf = await flattenPdf(res);
                      pdfBuffers.push(flatPdf);
                    } catch (err) {
                      console.error(
                        "Incorrect password or decryption failed",
                        err
                      );
                      setSelectedFiles(
                        filesNameArr.filter((f) => f !== file.name)
                      );
                      setIsDecrypting(false);
                      setfileload(false);
                      removeFile(e);
                      alert(
                        t("incorrect-password-for-file", { file: file.name })
                      );
                    }
                  } else {
                    console.error("password not provided");
                    setSelectedFiles(
                      filesNameArr.filter((f) => f !== file.name)
                    );
                    setIsDecrypting(false);
                    setfileload(false);
                    removeFile(e);
                  }
                } else {
                  console.log("Error uploading file: ", err?.response);
                  setIsDecrypting(false);
                  e.target.value = "";
                  removeFile(e);
                }
              }
            } else {
              console.log("err ", err);
              removeFile(e);
            }
          }
        } else if (file.type.includes("image/")) {
          const image = await toDataUrl(file);
          const pdfDoc = await PDFDocument.create();
          const embed =
            file.type === "image/png"
              ? await pdfDoc.embedPng(image)
              : await pdfDoc.embedJpg(image);
          const page = pdfDoc.addPage([embed.width, embed.height]);
          page.drawImage(embed, {
            x: 0,
            y: 0,
            width: embed.width,
            height: embed.height
          });
          const bytes = await pdfDoc.save({ useObjectStreams: false });
          pdfBuffers.push(bytes);
        } else if (
          file.type ===
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
          file.name.toLowerCase().endsWith(".docx")
        ) {
          try {
            const baseApi = localStorage.getItem("baseUrl") || "";
            const url = baseApi + "docxtopdf";
            let fd = new FormData();
            fd.append("file", file);
            setfileload(true);
            setpercentage(0);
            const config = {
              headers: {
                "content-type": "multipart/form-data",
                sessiontoken: Parse.User.current().getSessionToken()
              },
              signal: abortController.signal,
              onUploadProgress: (progressEvent) => {
                if (progressEvent.total) {
                  const percentCompleted = Math.round(
                    (progressEvent.loaded * 100) / progressEvent.total
                  );
                  setpercentage(percentCompleted);
                }
              }
            };
            const res = await axios.post(url, fd, config);
            if (res.data?.url) {
              const pdfRes = await axios.get(res.data.url, {
                responseType: "arraybuffer"
              });
              pdfBuffers.push(pdfRes.data);
            }
            setfileload(false);
          } catch (err) {
            setfileload(false);
            removeFile(e);
            console.log("err in docx to pdf ", err);
            const error = t("docx-error");
            alert(error);
            return;
          }
        }
      }

      if (!pdfBuffers.length) {
        alert(t("file-alert-2"));
        setSelectedFiles([]);
        return;
      }

      setfileload(true);
      const merged = await PDFDocument.create();
      for (const bytes of pdfBuffers) {
        const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
        const pages = await merged.copyPages(doc, doc.getPageIndices());
        pages.forEach((p) => merged.addPage(p));
      }

      const pdfBytes = await merged.save({ useObjectStreams: false });
      const name = generatePdfName(16);
      const pdfName = `${name}.pdf`;
      let uploadedUrl = "";
        const parseFile = new Parse.File(
          pdfName,
          [...pdfBytes],
          "application/pdf"
        );
        const response = await parseFile.save({
          progress: (progressValue, loaded, total, { type }) => {
            if (type === "upload" && progressValue !== null) {
              const percentCompleted = Math.round((loaded * 100) / total);
              setpercentage(percentCompleted);
            }
          }
        });
        if (response.url()) {
          const fileRes = await getSecureUrl(response.url());
          if (fileRes.url) {
            uploadedUrl = fileRes.url;
          }
        }
      if (uploadedUrl) {
        const tenantId = localStorage.getItem("TenantId");
        const userId = extUserData?.UserId?.objectId;
        SaveFileSize(pdfBytes.byteLength, uploadedUrl, tenantId, userId);
        setFileUpload(uploadedUrl);
        setfileload(false);
        const title = generateTitleFromFilename(filesNameArr?.[0]);
        setFormData((obj) => ({ ...obj, Name: title }));
        removeFile(e);
      } else {
        setfileload(false);
        removeFile(e);
        setSelectedFiles([]);
      }
    } catch (error) {
      alert(error.message);
      setSelectedFiles([]);
    }
  };

  // `isValidURL` is used to check valid webhook url
  function isValidURL(value) {
    try {
      const url = new URL(value);
      return url.protocol === "https:" || url.protocol === "http:";
    } catch (error) {
      return false;
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Check subscription status before allowing form submission
    const subscriptionStatus = await checkSubscriptionStatus();
    if (!showSubscriptionAlert(subscriptionStatus)) {
      // User doesn't have access, prevent form submission
      return;
    }
    
    if (fileupload) {
      if (formData?.Name?.length > maxTitleLength) {
        alert(t("title-length-alert"));
        return;
      }
      if (formData?.Note?.length > maxNoteLength) {
        alert(t("note-length-alert"));
        return;
      }
      if (formData?.Description?.length > maxDescriptionLength) {
        alert(t("description-length-alert"));
        return;
      }
      if (formData.RedirectUrl && !isValidURL(formData?.RedirectUrl)) {
        alert(t("invalid-redirect-url"));
        return;
      }
      setIsSubmit(true);
      try {
        // Create SignForm document using the cloud function
        const response = await Parse.Cloud.run("createSignForm", {
          Name: formData?.Name,
          Description: formData?.Description,
          Note: formData?.Note,
          URL: fileupload,
          SendinOrder: formData?.SendinOrder,
          TimeToCompleteDays: parseInt(formData?.TimeToCompleteDays) || 15,
          IsEnableOTP: formData?.IsEnableOTP,
          IsTourEnabled: formData?.IsTourEnabled,
          AllowModifications: formData?.AllowModifications,
          RedirectUrl: formData?.RedirectUrl,
          SignatureType: formData?.SignatureType,
          NotifyOnSignatures: formData?.NotifyOnSignatures,
          Bcc: bcc
        });

        if (response) {
          // Generate public URL for the SignForm
          const baseUrl = localStorage.getItem("baseUrl");
          const publicUrl = `${window.location.origin}/signform/${response.id}`;
          setPublicUrl(publicUrl);
          
          setIsAlert({ type: "success", message: "SignForm created successfully!" });
          setTimeout(() => {
            setIsAlert({ type: "success", message: "" });
          }, 3000);
        }
        setIsSubmit(false);
      } catch (error) {
        setIsAlert({ type: "danger", message: error.message });
        setIsSubmit(false);
        setTimeout(() => {
          setIsAlert({ type: "success", message: "" });
        }, 3000);
        console.log("err ", error);
      }
    } else {
      alert(t("file-alert-3"));
    }
  };

  const handleReset = () => {
    setFormData({
      Name: "",
      Description: "",
      Note: "",
      TimeToCompleteDays: 15,
      SendinOrder: false,
      file: "",
      IsEnableOTP: false,
      IsTourEnabled: true,
      NotifyOnSignatures: true,
      Bcc: [],
      RedirectUrl: "",
      AllowModifications: false,
      SignatureType: "draw",
    });
    setFileUpload("");
    setSelectedFiles([]);
    setIsAdvanceOpt(false);
    setBcc([]);
    setIsReset(true);
    setTimeout(() => setIsReset(false), 50);
  };

  const handleBcc = (e) => {
    const value = e.target.value;
    const bccArr = value.split(",").map((x) => x.trim()).filter((x) => x);
    setBcc(bccArr);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setIsAlert({ type: "success", message: "Copied to clipboard!" });
    setTimeout(() => {
      setIsAlert({ type: "success", message: "" });
    }, 3000);
  };

  return (
    <div className="shadow-md rounded-box bg-base-100 p-4 op-card">
      <Title title={"Create SignForm"} />
      <Alert type={isAlert.type}>{isAlert.message}</Alert>
      {isTrialExpiredModal && (
        <ModalUi
          title={t("trial-expired")}
          isOpen={isTrialExpiredModal}
          showClose={false}
        >
          <div className="h-full flex flex-col justify-center items-center">
            <p className="text-center text-base-content font-medium mb-4">
              {t("trial-expired-message")}
            </p>
            <button
              onClick={() => navigate("/subscription")}
              className="op-btn op-btn-primary w-40"
            >
              {t("upgrade-now")}
            </button>
          </div>
        </ModalUi>
      )}
      <div className="text-base-content w-full mx-auto">
        <div className="flex flex-col md:flex-row justify-between gap-4 mt-2">
          <div className="op-card bg-base-100 text-base-content rounded-box w-full md:w-[48%]">
            <h2 className="text-[1.2rem] font-semibold mb-2">
              {t("public-signform")}
            </h2>
            <p className="text-[14px] mb-4">
              {t("signform-description")}
            </p>
            <form onSubmit={handleSubmit} className="op-card bg-base-100 text-base-content rounded-box p-3">
              <h2 className="text-[1.2rem] font-semibold mb-2">
                {t("document-details")}
              </h2>
              <div className="mb-3">
                <label htmlFor="Name" className="block text-xs font-semibold">
                  {t("name")}*
                </label>
                <input
                  type="text"
                  name="Name"
                  value={formData.Name}
                  onChange={(e) => handleStrInput(e)}
                  required
                  className="op-input op-input-bordered op-input-sm focus:outline-none hover:border-base-content w-full text-xs"
                />
              </div>
              <div className="mb-3">
                <label htmlFor="Description" className="block text-xs font-semibold">
                  {t("description")}
                </label>
                <input
                  type="text"
                  name="Description"
                  value={formData.Description}
                  onChange={(e) => handleStrInput(e)}
                  className="op-input op-input-bordered op-input-sm focus:outline-none hover:border-base-content w-full text-xs"
                />
              </div>
              <div className="mb-3">
                <label htmlFor="Note" className="block text-xs font-semibold">
                  {t("note")}
                </label>
                <input
                  type="text"
                  name="Note"
                  value={formData.Note}
                  onChange={(e) => handleStrInput(e)}
                  className="op-input op-input-bordered op-input-sm focus:outline-none hover:border-base-content w-full text-xs"
                />
              </div>
              <div className="flex flex-col md:flex-row gap-4 mb-3">
                <div className="w-full md:w-1/2">
                  <label htmlFor="TimeToCompleteDays" className="block text-xs font-semibold">
                    {t("time-to-complete")} (days)
                  </label>
                  <input
                    type="number"
                    name="TimeToCompleteDays"
                    value={formData.TimeToCompleteDays}
                    onChange={(e) => handleStrInput(e)}
                    className="op-input op-input-bordered op-input-sm focus:outline-none hover:border-base-content w-full text-xs"
                  />
                </div>
              </div>
              
              <div className="flex items-center mb-3">
                <input
                  type="checkbox"
                  name="IsEnableOTP"
                  checked={formData.IsEnableOTP}
                  onChange={(e) => handleCheckboxInput(e)}
                  className="op-checkbox op-checkbox-sm"
                />
                <label htmlFor="IsEnableOTP" className="block text-xs font-semibold ml-2">
                  {t("enable-otp")}
                </label>
              </div>
              
              <div className="flex items-center mb-3">
                <input
                  type="checkbox"
                  name="IsTourEnabled"
                  checked={formData.IsTourEnabled}
                  onChange={(e) => handleCheckboxInput(e)}
                  className="op-checkbox op-checkbox-sm"
                />
                <label htmlFor="IsTourEnabled" className="block text-xs font-semibold ml-2">
                  {t("enable-tour")}
                </label>
              </div>
              
              <div className="flex items-center mb-3">
                <input
                  type="checkbox"
                  name="AllowModifications"
                  checked={formData.AllowModifications}
                  onChange={(e) => handleCheckboxInput(e)}
                  className="op-checkbox op-checkbox-sm"
                />
                <label htmlFor="AllowModifications" className="block text-xs font-semibold ml-2">
                  {t("allow-modifications")}
                </label>
              </div>
              
              <div className="mb-3">
                <label htmlFor="RedirectUrl" className="block text-xs font-semibold">
                  {t("redirect-url")}
                </label>
                <input
                  type="text"
                  name="RedirectUrl"
                  value={formData.RedirectUrl}
                  onChange={(e) => handleStrInput(e)}
                  placeholder="https://example.com"
                  className="op-input op-input-bordered op-input-sm focus:outline-none hover:border-base-content w-full text-xs"
                />
              </div>
              
              <div className="mb-3">
                <label htmlFor="Bcc" className="block text-xs font-semibold">
                  {t("bcc-emails")} (comma separated)
                </label>
                <input
                  type="text"
                  name="Bcc"
                  value={bcc.join(", ")}
                  onChange={handleBcc}
                  placeholder="email1@example.com, email2@example.com"
                  className="op-input op-input-bordered op-input-sm focus:outline-none hover:border-base-content w-full text-xs"
                />
              </div>
              
              <div className="flex items-center justify-start gap-2 mt-4">
                <button
                  type="submit"
                  className={`op-btn op-btn-primary ${isSubmit && "opacity-80 pointer-events-none"}`}
                  disabled={isSubmit}
                >
                  {isSubmit ? t("submitting") : t("create-signform")}
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="op-btn op-btn-secondary"
                >
                  {t("reset")}
                </button>
              </div>
            </form>
          </div>
          
          <div className="op-card bg-base-100 text-base-content rounded-box w-full md:w-[48%]">
            <h2 className="text-[1.2rem] font-semibold mb-2">
              {t("upload-document")}
            </h2>
            <div className="op-card bg-base-100 text-base-content rounded-box p-3">
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="w-full md:w-1/2">
                  <label htmlFor="file" className="block text-xs font-semibold mb-1">
                    {t("select-file")}
                  </label>
                  <input
                    type="file"
                    ref={inputFileRef}
                    onChange={(e) => handleFileInput(e)}
                    accept="application/pdf, image/*, application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    className="op-file-input op-file-input-bordered op-file-input-sm focus:outline-none hover:border-base-content w-full text-xs"
                  />
                  {selectedFiles.length > 0 && (
                    <div className="mt-2 text-xs">
                      <p className="font-semibold">{t("selected-files")}:</p>
                      <ul className="list-disc pl-5">
                        {selectedFiles.map((file, index) => (
                          <li key={index}>{file}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
              
              {fileload && (
                <div className="flex flex-col items-center justify-center mt-4">
                  <Loader />
                  <span className="text-center text-base-content text-sm mt-2">
                    {t("uploading-file")} {percentage}%
                  </span>
                </div>
              )}
              
              {isDecrypting && (
                <div className="flex flex-col items-center justify-center mt-4">
                  <Loader />
                  <span className="text-center text-base-content text-sm mt-2">
                    {t("decrypting-pdf")}
                  </span>
                </div>
              )}
              
              {isPassword && (
                <div className="flex flex-col items-center justify-center mt-4">
                  <span className="text-center text-base-content text-sm mt-2">
                    {t("password-protected")}
                  </span>
                </div>
              )}
              
              {publicUrl && (
                <div className="mt-6">
                  <h3 className="text-[1.1rem] font-semibold mb-2">
                    {t("public-signform-url")}
                  </h3>
                  <div className="flex items-center">
                    <input
                      type="text"
                      value={publicUrl}
                      readOnly
                      className="op-input op-input-bordered op-input-sm focus:outline-none hover:border-base-content w-full text-xs mr-2"
                    />
                    <button
                      onClick={() => copyToClipboard(publicUrl)}
                      className="op-btn op-btn-primary op-btn-sm"
                    >
                      {t("copy")}
                    </button>
                  </div>
                  <p className="text-xs mt-2 text-base-content">
                    {t("share-this-url")}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignForms;
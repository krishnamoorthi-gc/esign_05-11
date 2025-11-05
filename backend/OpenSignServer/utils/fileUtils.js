/**
 * Utility functions for file operations in the backend
 */

/**
 * Get file extension from filename
 * @param {string} filename 
 * @returns {string} file extension
 */
export function getFileExtension(filename) {
  return filename.slice(((filename.lastIndexOf(".") - 1) >>> 0) + 2);
}

/**
 * Generate a random filename
 * @param {string} extension 
 * @returns {string} random filename with extension
 */
export function generateRandomFilename(extension) {
  const randomString = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  return `${randomString}.${extension}`;
}

/**
 * Check if file type is allowed
 * @param {string} filename 
 * @param {Array} allowedTypes 
 * @returns {boolean} 
 */
export function isAllowedFileType(filename, allowedTypes) {
  const extension = getFileExtension(filename).toLowerCase();
  return allowedTypes.includes(extension);
}

/**
 * Format file size to human readable format
 * @param {number} bytes 
 * @returns {string} formatted file size
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Remove characters not allowed in file names for major OSes.
 */
function sanitizeDownloadFilename(name) {
  return name
    .replace(/[\\/:*?"<>|\u0000-\u001F]/g, " ") // reserved + control
    .replace(/\s+/g, " ") // collapse spaces
    .trim();
}

/**
 * Build filename using the selected format ID and runtime values.
 * @param {string} formatId - One of FILENAME_FORMATS ids
 * @param {object} ctx - { docName, email, date, ext, isSigned, datePattern }
 * @returns {string}
 */
export function buildDownloadFilename(formatId, ctx) {
  const {
    docName = "Document",
    email = "user@example.com",
    date = new Date(),
    ext = "pdf",
    isSigned = false
  } = ctx || {};

  const base = sanitizeDownloadFilename(String(docName) || "Document");
  const safeEmail = sanitizeDownloadFilename(
    String(email) || "user@example.com"
  );
  
  // Format date similar to frontend
  const dd = String(date.getDate()).padStart(2, "0");
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
  const mmm = months[date.getMonth()];
  const yyyy = String(date.getFullYear());
  let h = date.getHours();
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  const HH12 = String(h).padStart(2, "0");
  const MM = String(date.getMinutes()).padStart(2, "0");
  const dateStr = `${dd}-${mmm}-${yyyy} ${HH12}:${MM} ${ampm}`;

  let stem;
  switch (formatId) {
    case "DOCNAME":
      stem = base;
      break;
    case "DOCNAME_SIGNED":
      stem = isSigned ? `${base} - Signed` : base; // if not signed, fallback to base
      break;
    case "DOCNAME_EMAIL":
      stem = `${base} - ${safeEmail}`;
      break;
    case "DOCNAME_EMAIL_DATE":
      stem = `${base} - ${safeEmail} - ${dateStr}`;
      break;
    default:
      stem = base; // safe default
  }

  const safeExt = ext.replace(/\.+/g, "").toLowerCase() || "pdf";
  return `${stem}.${safeExt}`;
}

export default {
  getFileExtension,
  generateRandomFilename,
  isAllowedFileType,
  formatFileSize,
  buildDownloadFilename
};
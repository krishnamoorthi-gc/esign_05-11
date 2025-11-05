/**
 * Utility functions for handling favicons
 */

/**
 * Validates if a string is a valid data URL for an image
 * @param {string} dataUrl - The data URL to validate
 * @returns {boolean} - Whether the data URL is valid
 */
export function isValidDataUrl(dataUrl) {
  if (!dataUrl || typeof dataUrl !== 'string') return false;
  return dataUrl.startsWith('data:image/');
}

/**
 * Creates a manifest with properly sized icons from a single favicon source
 * @param {string} appName - The application name
 * @param {string} logo - The favicon source (data URL or URL)
 * @returns {string} - Object URL for the manifest
 */
export function createManifestUrl(appName, logo) {
  const start_url = window.location.origin || ".";
  
  const manifest = {
    short_name: appName,
    name: appName,
    start_url: start_url,
    display: "standalone",
    theme_color: "#000000",
    background_color: "#ffffff"
  };
  
  // If we have a logo, add it to the manifest
  if (logo && isValidDataUrl(logo)) {
    // For now, we'll use the same image for all sizes
    // In a more advanced implementation, we could generate different sized images
    manifest.icons = [
      { src: logo, type: "image/png", sizes: "64x64" },
      { src: logo, type: "image/png", sizes: "32x32" },
      { src: logo, type: "image/png", sizes: "24x24" },
      { src: logo, type: "image/png", sizes: "16x16" }
    ];
  }
  
  const blob = new Blob([JSON.stringify(manifest)], {
    type: "application/json"
  });
  return URL.createObjectURL(blob);
}
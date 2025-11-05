import { useEffect, useMemo } from "react";
import { createManifestUrl } from "../utils/faviconUtils";

export function useManifestUrl(appName, logo) {
  const url = useMemo(() => {
    return createManifestUrl(appName, logo);
  }, [appName, logo]);

  useEffect(() => {
    // cleanup when unmounting or when url changes
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [url]);

  return url;
}
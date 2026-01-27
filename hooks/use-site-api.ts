"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import { buildCmsApiUrl, getEffectiveSiteId } from "@/lib/cms-api";

/**
 * Hook para realizar fetch al API desde el frontend con el parámetro previewSite.
 * Prioridad de sitio: ?previewSite= (URL) > NEXT_PUBLIC_SITE_ID (env) > chileadicto.
 * Si existe NEXT_PUBLIC_CMS_API_BASE_URL, las llamadas se enrutan al CMS remoto (https://<cms>/api/...).
 * Siempre adjunta previewSite=<site> a todas las requests.
 */
export function useSiteApi() {
  const searchParams = useSearchParams();
  const previewSiteFromUrl = searchParams?.get("previewSite");

  const effectiveSite = useMemo(
    () => getEffectiveSiteId(previewSiteFromUrl),
    [previewSiteFromUrl]
  );

  const fetchWithSite = useCallback(
    async (url: string, options?: RequestInit) => {
      const finalUrl = buildCmsApiUrl(url, previewSiteFromUrl);
      return fetch(finalUrl, options);
    },
    [previewSiteFromUrl]
  );

  return { fetchWithSite, previewSite: effectiveSite };
}

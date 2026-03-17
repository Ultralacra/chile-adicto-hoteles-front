import { useSiteContext } from "@/contexts/site-context";
import { useCallback } from "react";
import { buildCmsApiUrl, normalizeCmsResponse } from "@/lib/cms-api";

/**
 * Hook personalizado para hacer peticiones API desde el admin
 * que automáticamente agrega el sitio actual a las peticiones
 */
export function useAdminApi() {
  const { currentSite } = useSiteContext();

  const fetchWithSite = useCallback(
    async (url: string, options?: RequestInit) => {
      const finalUrl = buildCmsApiUrl(url, currentSite);
      const urlObj = new URL(finalUrl, "http://local");
      urlObj.searchParams.set('adminSite', currentSite);

      const targetUrl = /^https?:\/\//i.test(finalUrl)
        ? urlObj.toString()
        : `${urlObj.pathname}${urlObj.search}`;
      const response = await fetch(targetUrl, options);
      return normalizeCmsResponse(response, targetUrl, currentSite);
    },
    [currentSite]
  );

  return { fetchWithSite, currentSite };
}

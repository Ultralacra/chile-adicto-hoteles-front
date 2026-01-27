import { useSiteContext } from "@/contexts/site-context";
import { useCallback } from "react";

/**
 * Hook personalizado para hacer peticiones API desde el admin
 * que automáticamente agrega el sitio actual a las peticiones
 */
export function useAdminApi() {
  const { currentSite } = useSiteContext();

  const fetchWithSite = useCallback(
    async (url: string, options?: RequestInit) => {
      // Agregar el parámetro adminSite a la URL
      const urlObj = new URL(url, window.location.origin);
      urlObj.searchParams.set('adminSite', currentSite);
      
      return fetch(urlObj.toString(), options);
    },
    [currentSite]
  );

  return { fetchWithSite, currentSite };
}

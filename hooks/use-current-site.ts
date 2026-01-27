"use client";

import { useState, useEffect } from 'react';
import { getSiteByDomain } from '@/lib/sites-config';
import type { SiteConfig } from '@/lib/sites-config';

/**|
 * Client-side hook to get current site configuration
 * Detects site from window.location.hostname
 */
export function useCurrentSite(): SiteConfig {
  const [site, setSite] = useState(() => {
    // Inicializar con el sitio por defecto
    return getSiteByDomain('santiagoadicto.cl');
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Detectar por puerto o hostname completo (con puerto)
      const fullHost = `${window.location.hostname}:${window.location.port}`;
      const currentSite = getSiteByDomain(fullHost);
      setSite(currentSite);
      
      // Aplicar la clase del sitio al elemento html para estilos CSS
      document.documentElement.className = `site-${currentSite.id}`;
      
      console.log('🎨 Sitio detectado:', currentSite.displayName, `(${currentSite.id})`, '- Puerto:', window.location.port);
    }
  }, []);

  return site;
}

/**
 * Multi-tenant site configuration
 * Configure each site with its domain, name, and specific settings
 */

export type SiteId = 'santiagoadicto' | 'chileadicto';

export interface SiteConfig {
  id: SiteId;
  name: string;
  displayName: string;
  domain: string;
  description: string;
  // Puedes agregar más configuraciones específicas por sitio aquí
  logo?: string;
  primaryColor?: string;
  categories?: string[]; // Categorías disponibles para este sitio
}

export const SITES: Record<SiteId, SiteConfig> = {
  santiagoadicto: {
    id: 'santiagoadicto',
    name: 'santiagoadicto',
    displayName: 'Santiago Adicto',
    domain: 'santiagoadicto.cl',
    description: 'Guía turística de Santiago de Chile',
    logo: '/santiago-adicto-logo.svg',
    primaryColor: '#FF6B6B',
    categories: [
      'iconos',
      'ninos',
      'arquitectura',
      'barrios',
      'mercados',
      'miradores',
      'museos',
      'palacios',
      'parques',
      'paseos-fuera-de-santiago',
      'restaurantes',
    ],
  },
  chileadicto: {
    id: 'chileadicto',
    name: 'chileadicto',
    displayName: 'Chile Adicto Hoteles',
    domain: 'chileadictohoteles.cl',
    description: 'Guía de hoteles y alojamiento en Chile',
    logo: '/chile-adicto-logo.svg',
    primaryColor: '#4ECDC4',
    // Define las categorías específicas para Chile Adicto Hoteles
    categories: [
      'norte',
      'centro',
      'sur',
      'patagonia',
      'costa',
      'hoteles',
      'cabanas',
      'lodges',
      'termas',
      'glamping',
    ],
  },
};

export const DEFAULT_SITE: SiteId = 'santiagoadicto';

/**
 * Get site config by domain
 */
export function getSiteByDomain(domain: string): SiteConfig {
  // Normalize domain (remove www, protocol, port)
  const normalizedDomain = domain
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/:\d+$/, '')
    .split('/')[0];

  // Handle localhost and local development
  if (normalizedDomain === 'localhost' || normalizedDomain === '127.0.0.1') {
    // En desarrollo local, usar siempre Santiago Adicto por defecto
    // Puedes cambiar esto editando la variable de entorno NEXT_PUBLIC_LOCAL_SITE
    const localSite = process.env.NEXT_PUBLIC_LOCAL_SITE as SiteId | undefined;
    return SITES[localSite || DEFAULT_SITE];
  }

  // Search for matching site
  const site = Object.values(SITES).find((s) =>
    normalizedDomain.includes(s.domain.replace(/^www\./, ''))
  );

  return site || SITES[DEFAULT_SITE];
}

/**
 * Get site config by ID
 */
export function getSiteById(siteId: SiteId): SiteConfig {
  return SITES[siteId] || SITES[DEFAULT_SITE];
}

/**
 * Get all site IDs
 */
export function getAllSiteIds(): SiteId[] {
  return Object.keys(SITES) as SiteId[];
}

/**
 * Check if a domain belongs to a specific site
 */
export function isDomainForSite(domain: string, siteId: SiteId): boolean {
  const site = getSiteByDomain(domain);
  return site.id === siteId;
}

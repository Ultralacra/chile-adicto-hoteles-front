import { headers } from 'next/headers';
import type { SiteId, SiteConfig } from './sites-config';
import { getSiteById, DEFAULT_SITE } from './sites-config';

/**
 * Get the current site context from request headers
 * This works in both API routes and Server Components
 * Also checks for adminSite query parameter for admin overrides
 * And previewSite for development preview
 */
export async function getSiteContext(req?: Request): Promise<SiteConfig> {
  try {
    // Si viene un request (desde API routes), chequear query param primero
    if (req) {
      const url = new URL(req.url);
      
      // Para admin: adminSite tiene prioridad
      const adminSite = url.searchParams.get('adminSite') as SiteId | null;
      if (adminSite && (adminSite === 'santiagoadicto' || adminSite === 'chileadicto')) {
        return getSiteById(adminSite);
      }
      
      // Para desarrollo: previewSite permite previsualizar sitios en localhost
      const previewSite = url.searchParams.get('previewSite') as SiteId | null;
      if (previewSite && (previewSite === 'santiagoadicto' || previewSite === 'chileadicto')) {
        return getSiteById(previewSite);
      }
    }
    
    const headersList = await headers();
    const siteId = headersList.get('x-site-id') as SiteId | null;
    
    if (siteId) {
      return getSiteById(siteId);
    }
  } catch (error) {
    // If headers are not available (e.g., in static generation), return default
    console.warn('Unable to get site context from headers, using default site');
  }
  
  return getSiteById(DEFAULT_SITE);
}

/**
 * Get the current site ID from request headers or query params
 * Simpler version that just returns the ID
 */
export async function getCurrentSiteId(req?: Request): Promise<SiteId> {
  const site = await getSiteContext(req);
  return site.id;
}

/**
 * Client-side utility to get site from browser location
 * Use this in client components
 */
export function getClientSiteId(): SiteId {
  if (typeof window === 'undefined') {
    return DEFAULT_SITE;
  }
  
  const hostname = window.location.hostname;
  
  // Simple domain matching
  if (hostname.includes('chileadicto')) {
    return 'chileadicto';
  }
  
  return 'santiagoadicto';
}

/**
 * Type guard to check if a value is a valid SiteId
 */
export function isSiteId(value: unknown): value is SiteId {
  return value === 'santiagoadicto' || value === 'chileadicto';
}

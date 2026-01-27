// Utilidades livianas para marcar temporalmente (localStorage) a qué sitio pertenece un post
const LS_KEY = 'postSiteOverrides_v1';

export type SiteId = 'santiagoadicto' | 'chileadicto';

function readMap(): Record<string, SiteId> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(LS_KEY) || '{}';
    return JSON.parse(raw || '{}');
  } catch {
    return {};
  }
}

function writeMap(m: Record<string, SiteId>) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(m));
  } catch {}
}

export function getOverrideForSlug(slug?: string): SiteId | null {
  if (!slug || typeof window === 'undefined') return null;
  const m = readMap();
  return (m[slug] as SiteId) || null;
}

export function setOverrideForSlug(slug: string, site: SiteId) {
  if (!slug || typeof window === 'undefined') return;
  const m = readMap();
  m[slug] = site;
  writeMap(m);
}

export function removeOverrideForSlug(slug: string) {
  if (!slug || typeof window === 'undefined') return;
  const m = readMap();
  if (m[slug]) {
    delete m[slug];
    writeMap(m);
  }
}

export function clearAllOverrides() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(LS_KEY);
}

export function listOverrides(): Record<string, SiteId> {
  return readMap();
}

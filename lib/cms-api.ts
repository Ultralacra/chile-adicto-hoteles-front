import type { SiteId } from "@/lib/sites-config";

const DEFAULT_SITE_ID: SiteId = "chileadicto";

type MaybeSiteId = string | null | undefined;

function isSiteId(value: MaybeSiteId): value is SiteId {
  return value === "santiagoadicto" || value === "chileadicto";
}

export function getEffectiveSiteId(previewSiteFromUrl?: MaybeSiteId): SiteId {
  if (isSiteId(previewSiteFromUrl)) return previewSiteFromUrl;

  const envSiteId = process.env.NEXT_PUBLIC_SITE_ID;
  if (isSiteId(envSiteId)) return envSiteId;

  return DEFAULT_SITE_ID;
}

function getCmsBaseUrl(): string | null {
  const raw = process.env.NEXT_PUBLIC_CMS_API_BASE_URL;
  if (!raw) return null;
  const trimmed = String(raw).trim();
  if (!trimmed) return null;
  return trimmed.replace(/\/+$/, "");
}

function normalizeToApiPath(input: string): { pathname: string; search: string } {
  // Usamos un base dummy para parsear querystring de forma segura.
  const parsed = new URL(String(input || "").trim(), "http://local");

  let pathname = parsed.pathname || "/";
  if (!pathname.startsWith("/")) pathname = `/${pathname}`;

  // Aceptar tanto "/api/.." como "/.." o ".." y normalizar a "/api/...".
  if (pathname === "/") pathname = "/api";
  if (pathname === "/api") {
    // ok
  } else if (!pathname.startsWith("/api/")) {
    pathname = `/api${pathname}`;
  }

  return { pathname, search: parsed.search || "" };
}

/**
 * Construye la URL final hacia el CMS:
 * - Prioriza `previewSite` desde URL; si no existe, usa `NEXT_PUBLIC_SITE_ID`; si no, `chileadicto`.
 * - Si `NEXT_PUBLIC_CMS_API_BASE_URL` existe, apunta al admin remoto (ej: https://cms.mi-dominio.com).
 * - Siempre adjunta `previewSite=<site>`.
 */
export function buildCmsApiUrl(inputUrl: string, previewSiteFromUrl?: MaybeSiteId): string {
  const siteId = getEffectiveSiteId(previewSiteFromUrl);

  // Si ya viene una URL absoluta, solo agregamos previewSite.
  if (/^https?:\/\//i.test(inputUrl)) {
    const urlObj = new URL(inputUrl);
    urlObj.searchParams.set("previewSite", siteId);
    return urlObj.toString();
  }

  const base = getCmsBaseUrl();
  const { pathname, search } = normalizeToApiPath(inputUrl);

  if (base) {
    const urlObj = new URL(`${pathname}${search}`, base);
    urlObj.searchParams.set("previewSite", siteId);
    return urlObj.toString();
  }

  // Sin base remota: devolver URL relativa (mantiene compatibilidad con /api local)
  const urlObj = new URL(`${pathname}${search}`, "http://local");
  urlObj.searchParams.set("previewSite", siteId);
  return `${urlObj.pathname}${urlObj.search}`;
}

export async function fetchCms(
  inputUrl: string,
  init?: RequestInit,
  previewSiteFromUrl?: MaybeSiteId,
) {
  const finalUrl = buildCmsApiUrl(inputUrl, previewSiteFromUrl);
  return fetch(finalUrl, init);
}

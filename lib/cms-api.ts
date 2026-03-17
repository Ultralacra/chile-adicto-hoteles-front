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

export function getServerCmsBaseUrl(): string | null {
  const raw = process.env.CMS_API_BASE_URL || process.env.NEXT_PUBLIC_CMS_API_BASE_URL;
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
 * - Si no existe, usa el proxy interno `/cms-api/...` para no depender de env pública en el browser.
 * - Siempre adjunta `previewSite=<site>`.
 */
export function buildCmsApiUrl(inputUrl: string, previewSiteFromUrl?: MaybeSiteId): string {
  const siteId = getEffectiveSiteId(previewSiteFromUrl);
  const base = getCmsBaseUrl();
  const absoluteOrRelative = /^https?:\/\//i.test(inputUrl)
    ? (() => {
        const parsed = new URL(inputUrl);
        return `${parsed.pathname}${parsed.search}`;
      })()
    : inputUrl;

  const { pathname, search } = normalizeToApiPath(absoluteOrRelative);

  const proxyPath = pathname === "/api" ? "/cms-api" : pathname.replace(/^\/api/, "/cms-api");
  const destination = `${proxyPath}${search}`;
  const urlObj = new URL(destination, base || "http://local");
  urlObj.searchParams.set("previewSite", siteId);

  if (!base) {
    return `${urlObj.pathname}${urlObj.search}`;
  }

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

function firstNonEmpty(...values: any[]) {
  for (const value of values) {
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed.length > 0) return trimmed;
      continue;
    }
    if (value !== null && value !== undefined) return value;
  }
  return null;
}

function normalizeLangBlock(block: any) {
  const safe = block && typeof block === "object" ? block : {};
  return {
    ...safe,
    name: String(safe.name || ""),
    subtitle: String(safe.subtitle || ""),
    description: Array.isArray(safe.description) ? safe.description : [],
    infoHtml: safe.infoHtml ?? null,
    infoHtmlNew: safe.infoHtmlNew ?? null,
    category: safe.category ?? null,
  };
}

function normalizePostShape(row: any, fallbackSite: SiteId) {
  const safe = row && typeof row === "object" ? row : {};
  const featuredImage = safe.featuredImage ?? safe.featured_image ?? null;
  const websitePublic = firstNonEmpty(
    safe.websitePublic,
    safe.websitepublic,
    safe.website_public,
    safe.website,
    safe.website_display,
    safe.reservationLink
  );

  let images = Array.isArray(safe.images)
    ? safe.images.map((x: any) => String(x || "").trim()).filter(Boolean)
    : [];
  if (images.length === 0 && featuredImage) images = [String(featuredImage)];

  return {
    ...safe,
    slug: String(safe.slug || ""),
    site: safe.site || fallbackSite,
    publicationStatus: safe.publicationStatus ?? "published",
    publishStartAt: safe.publishStartAt ?? null,
    publishEndAt: safe.publishEndAt ?? null,
    publicationEndsAt: safe.publicationEndsAt ?? null,
    featuredImage,
    website: safe.website ?? null,
    websitePublic: websitePublic ?? null,
    websitepublic: websitePublic ?? null,
    website_public: websitePublic ?? null,
    instagram: safe.instagram ?? null,
    website_display: safe.website_display ?? "",
    instagram_display: safe.instagram_display ?? "",
    email: safe.email ?? null,
    phone: safe.phone ?? null,
    photosCredit: safe.photosCredit ?? null,
    address: safe.address ?? null,
    hours: safe.hours ?? null,
    reservationLink: safe.reservationLink ?? null,
    reservationPolicy: safe.reservationPolicy ?? null,
    interestingFact: safe.interestingFact ?? null,
    images,
    locations: Array.isArray(safe.locations) ? safe.locations : [],
    es: normalizeLangBlock(safe.es),
    en: normalizeLangBlock(safe.en),
    categories: Array.isArray(safe.categories) ? safe.categories : [],
    communes: Array.isArray(safe.communes) ? safe.communes : [],
  };
}

function shouldNormalizePostsContract(pathname: string) {
  return (
    /^\/(cms-api|api)\/posts$/i.test(pathname) ||
    /^\/(cms-api|api)\/posts\/[^/]+$/i.test(pathname) ||
    /^\/(cms-api|api)\/posts\/by-category\/[^/]+$/i.test(pathname)
  );
}

function sanitizeProxyHeaders(source: Headers) {
  const headers = new Headers(source);
  headers.delete("content-encoding");
  headers.delete("content-length");
  headers.delete("transfer-encoding");
  headers.delete("connection");
  headers.delete("keep-alive");
  return headers;
}

function toProxySafeResponse(response: Response): Response {
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: sanitizeProxyHeaders(response.headers),
  });
}

export async function normalizeCmsResponse(
  response: Response,
  requestUrl: string,
  siteIdFallback: SiteId,
): Promise<Response> {
  if (!response.ok) return toProxySafeResponse(response);

  const url = new URL(requestUrl, "http://local");
  if (!shouldNormalizePostsContract(url.pathname)) return toProxySafeResponse(response);

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return toProxySafeResponse(response);
  }

  const payload = await response.json().catch(() => null);
  if (!payload) return toProxySafeResponse(response);

  const normalized = Array.isArray(payload)
    ? payload.map((row) => normalizePostShape(row, siteIdFallback))
    : normalizePostShape(payload, siteIdFallback);

  const headers = sanitizeProxyHeaders(response.headers);
  headers.set("content-type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(normalized), {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

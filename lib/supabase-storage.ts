const SUPABASE_STORAGE_URL_RE = /\/storage\/v1\/object\/public\//;

export function getStorageImageUrl(
  url: string | null | undefined,
  width?: number,
): string {
  if (!url) return "/placeholder.svg";

  if (!SUPABASE_STORAGE_URL_RE.test(url)) return url;

  if (!width) return url;

  const renderUrl = url.replace(
    "/storage/v1/object/public/",
    "/storage/v1/render/image/public/",
  );

  const separator = renderUrl.includes("?") ? "&" : "?";
  return `${renderUrl}${separator}width=${width}&resize=contain&quality=80`;
}

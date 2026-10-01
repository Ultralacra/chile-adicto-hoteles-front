/**
 * Normaliza URLs de imagen.
 * El resize/formato lo hace next/image (images.unoptimized=false).
 */
export function getStorageImageUrl(
  url: string | null | undefined,
  width?: number,
): string {
  if (!url) return "/placeholder.svg";
  void width;
  return url;
}

type TravelSecurityBannerProps = {
  categorySlug?: string | null;
  className?: string;
};

function normalizeSlug(input: string): string {
  return String(input || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function getBannerSrc(categorySlug?: string | null): string | null {
  const slug = normalizeSlug(categorySlug || "");

  if (slug === "lodges") {
    return "/banners/BANNER%20LODGES%20SECURITY.svg";
  }

  if (slug === "boutique" || slug === "hoteles-boutique") {
    return "/banners/BANNER%20BOUTIQUE%20SECURITY.svg";
  }

  return null;
}

export function TravelSecurityBanner({
  categorySlug,
  className = "",
}: TravelSecurityBannerProps) {
  const src = getBannerSrc(categorySlug);

  if (!src) return null;

  return (
    <div className={className}>
      <img src={src} alt="Travel Security" className="block w-full h-auto" />
    </div>
  );
}

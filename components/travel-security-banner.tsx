type TravelSecurityBannerProps = {
  categorySlug?: string | null;
  className?: string;
};

type BannerSource = {
  desktop: string;
  mobile: string;
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

function getBannerSrc(categorySlug?: string | null): BannerSource | null {
  const slug = normalizeSlug(categorySlug || "");

  if (slug === "lodges") {
    return {
      desktop: "/banners/BANNER%20LODGES%20SECURITY.svg",
      mobile: "/banners/BANNER%20LODGES%20SECURITY%20MOVIL.png",
    };
  }

  if (slug === "boutique" || slug === "hoteles-boutique") {
    return {
      desktop: "/banners/BANNER%20BOUTIQUE%20SECURITY.svg",
      mobile: "/banners/BANNER%20BOUTIQUE%20SECURITY%20MOVIL.png",
    };
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
      <picture>
        <source media="(max-width: 767.98px)" srcSet={src.mobile} />
        <img
          src={src.desktop}
          alt="Travel Security"
          className="block w-full h-auto"
        />
      </picture>
    </div>
  );
}

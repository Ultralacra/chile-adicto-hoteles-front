"use client";

import Link from "next/link";
import { useLanguage } from "@/contexts/language-context";

type Banner = { href: string; src: string; alt: string };

const bannerByLang: Record<string, Banner> = {
  es: {
    href: "/restaurantes",
    src: "https://azure-seal-918691.hostingersite.com/wp-content/uploads/2025/10/WhatsApp-Image-2025-10-28-at-5.15.32-PM.jpeg",
    alt: "Banner Restaurantes (ES)",
  },
  en: {
    href: "/restaurantes",
    src: "https://azure-seal-918691.hostingersite.com/wp-content/uploads/2025/10/WhatsApp-Image-2025-10-28-at-5.15.32-PM.jpeg",
    alt: "Restaurants Banner (EN)",
  },
};

export function PromoStackBanners() {
  const { language } = useLanguage();
  const currentBanner = bannerByLang[language] || bannerByLang.es;

  return (
    <div className="w-full h-[260px] md:h-[520px] lg:h-[437px] flex flex-col gap-4 overflow-hidden">
      <div className="flex-1 min-h-0 relative bg-black overflow-hidden">
        <a
          href="https://chileadictohoteles.cl/"
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full h-full"
        >
          <img
            src={currentBanner.src}
            alt={currentBanner.alt}
            className="object-cover object-top w-full h-full"
          />
        </a>
      </div>

      <div className="flex-1 min-h-0 relative bg-black overflow-hidden">
        <Link href="/cafes" className="block w-full h-full">
          <img
            src={currentBanner.src}
            alt="Cafés"
            className="object-cover object-bottom w-full h-full"
            loading="lazy"
          />
        </Link>
      </div>
    </div>
  );
}

export function BottomHomeBanner() {
  return (
    <Link href="/monumentos-nacionales" className="block w-full">
      <img
        src="/BANNER-SA-ESPANOL-2048x256.webp"
        alt="Monumentos Nacionales"
        className="w-full h-auto"
        loading="lazy"
      />
    </Link>
  );
}

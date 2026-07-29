"use client";

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { CategoryNav } from "@/components/category-nav";
import { buildCardExcerpt } from "@/lib/utils";
import { isHiddenFrontPost } from "@/lib/post-visibility";
import { useEffect, useState, use } from "react";
import { Spinner } from "@/components/ui/spinner";
import { useLanguage } from "@/contexts/language-context";
import { useSiteApi } from "@/hooks/use-site-api";
import Image from "next/image";
import {
  isVotingCategory,
  getHotelHearts,
  getVotingSlugsForCategory,
} from "@/lib/voting-config";
import { VotingHotelCard } from "@/components/voting-hotel-card";
import { BackButton } from "@/components/back-button";
import { notFound } from "next/navigation";

const CATEGORY_BANNERS: Record<string, { desktop4?: string; mobile4?: string; desktop5: string; mobile5: string }> = {
  norte: {
    desktop4: "/imaganescategorias/banner-internos-categorias/DESKTOP-NORTE 4 CORAZONES.webp",
    mobile4: "/imaganescategorias/banner-internos-categorias/MOVIL - NORTE 4 CORAZONES.webp",
    desktop5: "/imaganescategorias/banner-internos-categorias/DESKTOP-NORTE 5 CORAZONES.webp",
    mobile5: "/imaganescategorias/banner-internos-categorias/MOVIL - NORTE 5 CORAZONES.webp",
  },
  centro: {
    desktop4: "/imaganescategorias/banner-internos-categorias/DESKTOP-CENTRO 4 CORAZONES.webp",
    mobile4: "/imaganescategorias/banner-internos-categorias/MOVIL-CENTRO 4 CORAZONES.webp",
    desktop5: "/imaganescategorias/banner-internos-categorias/DESKTOP-CENTRO 5 CORAZONES.webp",
    mobile5: "/imaganescategorias/banner-internos-categorias/MOVIL-CENTRO 5 CORAZONES.webp",
  },
  sur: {
    desktop4: "/imaganescategorias/banner-internos-categorias/DESKTOP-SUR 4 CORAZONES.webp",
    mobile4: "/imaganescategorias/banner-internos-categorias/MOVIL - SUR 4 CORAZONES.webp",
    desktop5: "/imaganescategorias/banner-internos-categorias/DESKTOP-SUR 5 CORAZONES.webp",
    mobile5: "/imaganescategorias/banner-internos-categorias/MOVIL - SUR 5 CORAZONES.webp",
  },
  santiago: {
    desktop4: "/imaganescategorias/banner-internos-categorias/DESKTOP-SANTIAGO 4 CORAZONES.webp",
    mobile4: "/imaganescategorias/banner-internos-categorias/MOVIL - SANTIAGO 4 CORAZONES.webp",
    desktop5: "/imaganescategorias/banner-internos-categorias/DESKTOP-SANTIAGO 5 CORAZONES.webp",
    mobile5: "/imaganescategorias/banner-internos-categorias/MOVIL - SANTIAGO 5 CORAZONES.webp",
  },
  "torres-del-paine": {
    desktop4: "/imaganescategorias/banner-internos-categorias/DESKTOP-TORRES DEL PAINE 4 CORAZONES.webp",
    mobile4: "/imaganescategorias/banner-internos-categorias/MOVIL - TORRES DEL PAINE 4 CORAZONES.webp",
    desktop5: "/imaganescategorias/banner-internos-categorias/DESKTOP-TORRES DEL PAINE 5 CORAZONES.webp",
    mobile5: "/imaganescategorias/banner-internos-categorias/MOVIL - TORRES DEL PAINE 5 CORAZONES.webp",
  },
  "isla-de-pascua": {
    desktop5: "/imaganescategorias/banner-internos-categorias/DESKTOP-ISLA DE PASCUA.webp",
    mobile5: "/imaganescategorias/banner-internos-categorias/MOVIL-HOTELES ISLA DE PASCUA.webp",
  },
  "hoteles-de-vina": {
    desktop5: "/imaganescategorias/banner-internos-categorias/DESKTOP-HOTELES DE VIÑA.webp",
    mobile5: "/imaganescategorias/banner-internos-categorias/MOVIL-HOTELES DE VIÑA.webp",
  },
  "hoteles-de-nieve": {
    desktop5: "/imaganescategorias/banner-internos-categorias/DESKTOP-HOTELES DE NIEVE.webp",
    mobile5: "/imaganescategorias/banner-internos-categorias/MOVIL-HOTELES DE NIEVE.webp",
  },
  "joyas-unicas": {
    desktop5: "/imaganescategorias/banner-internos-categorias/DESKTOP-JOYAS UNICAS.webp",
    mobile5: "/imaganescategorias/banner-internos-categorias/MOVIL-HOTELES JOYAS ÚNICAS.webp",
  },
};

function deriveVotingImages(hotel: any): { image: string; images: string[] } {
  const rawImages: string[] = Array.isArray(hotel.images)
    ? hotel.images.filter(Boolean)
    : [];
  const featured = String(hotel.featuredImage || "").trim() || rawImages[0] || "";
  const orderedImages = featured
    ? [featured, ...rawImages.filter((img) => img !== featured)]
    : rawImages;
  return { image: featured, images: orderedImages };
}

const CATEGORY_API_SLUGS: Record<string, string> = {
  "hoteles-de-nieve": "ski",
  "hoteles-de-vina": "viñ",
};

type ResolvedParams = { category: string };

export default function VotacionCategoryPage({ params }: { params: any }) {
  const resolvedParams = use(params as any) as ResolvedParams;
  const { category } = resolvedParams;
  const { language } = useLanguage();
  const { fetchWithSite } = useSiteApi();
  const [hotels5, setHotels5] = useState<any[]>([]);
  const [hotels4, setHotels4] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedY = sessionStorage.getItem("scroll:position");
    if (savedY) {
      const y = parseInt(savedY, 10);
      if (!isNaN(y) && y > 0) {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            window.scrollTo({ top: y, behavior: "instant" });
          });
        });
      }
      sessionStorage.removeItem("scroll:position");
      sessionStorage.removeItem("scroll:path");
    } else {
      window.scrollTo(0, 0);
    }
  }, [category]);

  useEffect(() => {
    if (!isVotingCategory(category)) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    async function loadVotingHotels() {
      try {
        const allowedSlugs = getVotingSlugsForCategory(category);

        const apiSlug = CATEGORY_API_SLUGS[category] || category;
        const res = await fetchWithSite(
          `/api/posts?categorySlug=${encodeURIComponent(apiSlug)}`,
        );
        const rows = res.ok ? await res.json() : [];
        let list = Array.isArray(rows) ? rows : [];
        list = list.filter((p: any) => !isHiddenFrontPost(p));

        let votingHotels = list.filter((h: any) =>
          allowedSlugs.includes(h.slug)
        );

        const foundSlugs = new Set(votingHotels.map((h: any) => h.slug));
        const missingSlugs = allowedSlugs.filter((s) => !foundSlugs.has(s));

        if (missingSlugs.length > 0 && !cancelled) {
          try {
            const allRes = await fetchWithSite("/api/posts");
            const allRows = allRes.ok ? await allRes.json() : [];
            const allList = Array.isArray(allRows) ? allRows : [];
            for (const slug of missingSlugs) {
              const found = allList.find((h: any) => h.slug === slug);
              if (found && !votingHotels.some((h: any) => h.slug === found.slug)) {
                votingHotels.push(found);
              }
            }
          } catch {
            // Ignorar error de fallback
          }
        }

        const sortKey = (h: any) =>
          String(h?.[language]?.name || h?.en?.name || h?.es?.name || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toUpperCase()
            .trim();

        const h5 = votingHotels
          .filter((h: any) => getHotelHearts(category, h.slug) === 5)
          .sort((a: any, b: any) => sortKey(a) < sortKey(b) ? -1 : sortKey(a) > sortKey(b) ? 1 : 0);

        const h4 = votingHotels
          .filter((h: any) => getHotelHearts(category, h.slug) === 4)
          .sort((a: any, b: any) => sortKey(a) < sortKey(b) ? -1 : sortKey(a) > sortKey(b) ? 1 : 0);

        if (!cancelled) {
          setHotels5(h5);
          setHotels4(h4);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setHotels5([]);
          setHotels4([]);
          setLoading(false);
        }
      }
    }

    loadVotingHotels();
    return () => {
      cancelled = true;
    };
  }, [category, fetchWithSite, language]);

  if (!isVotingCategory(category)) {
    return notFound();
  }

  const banner = CATEGORY_BANNERS[category];

  return (
    <div className="min-h-screen bg-white">
      <Header showHomeSecurityBanner={false} />

      <main className="site-inner py-4">
        <div className="hidden lg:block">
          <CategoryNav activeCategory="votacion" />
        </div>

        {/* <BackButton /> */}

        <div className="py-2">
          {loading ? (
            <div className="w-full py-16 grid place-items-center text-gray-500">
              <div className="flex items-center gap-2">
                <Spinner className="size-5" /> Cargando…
              </div>
            </div>
          ) : (
            <>
              {/* Sección 5 corazones */}
              {banner && (
                <section className="mb-8">
                  {banner.desktop5 && (
                    <div className="hidden md:block w-full">
                      <Image
                        src={banner.desktop5}
                        alt={`${category} 5 estrellas`}
                        width={1920}
                        height={400}
                        className="w-full h-auto"
                        priority
                      />
                    </div>
                  )}
                  {banner.mobile5 && (
                    <div className="md:hidden w-full">
                      <Image
                        src={banner.mobile5}
                        alt={`${category} 5 estrellas`}
                        width={750}
                        height={400}
                        className="w-full h-auto"
                        priority
                      />
                    </div>
                  )}
                  {hotels5.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-4">
                      {hotels5.map((hotel) => (
                        <VotingHotelCard
                          key={hotel.slug}
                          slug={hotel.slug}
                          name={hotel[language]?.name || hotel.en?.name || hotel.es?.name}
                          subtitle={hotel[language]?.subtitle || hotel.en?.subtitle || hotel.es?.subtitle}
                          description={buildCardExcerpt(hotel[language]?.description || hotel.en?.description || hotel.es?.description || [])}
                          {...deriveVotingImages(hotel)}
                          imageVariant="default"
                          hotelName={hotel[language]?.name || hotel?.es?.name || ""}
                          hotelSlug={hotel.slug}
                          categorySlug={category}
                        />
                      ))}
                    </div>
                  )}
                </section>
              )}

              {/* Sección 4 corazones */}
              {hotels4.length > 0 && banner && (banner.desktop4 || banner.mobile4) && (
                <section>
                  {banner.desktop4 && (
                    <div className="hidden md:block w-full">
                      <Image
                        src={banner.desktop4}
                        alt={`${category} 4 estrellas`}
                        width={1920}
                        height={400}
                        className="w-full h-auto"
                        priority
                      />
                    </div>
                  )}
                  {banner.mobile4 && (
                    <div className="md:hidden w-full">
                      <Image
                        src={banner.mobile4}
                        alt={`${category} 4 estrellas`}
                        width={750}
                        height={400}
                        className="w-full h-auto"
                        priority
                      />
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-4">
                    {hotels4.map((hotel) => (
                        <VotingHotelCard
                          key={hotel.slug}
                          slug={hotel.slug}
                          name={hotel[language]?.name || hotel.en?.name || hotel.es?.name}
                          subtitle={hotel[language]?.subtitle || hotel.en?.subtitle || hotel.es?.subtitle}
                          description={buildCardExcerpt(hotel[language]?.description || hotel.en?.description || hotel.es?.description || [])}
                          {...deriveVotingImages(hotel)}
                          imageVariant="default"
                        hotelName={hotel[language]?.name || hotel?.es?.name || ""}
                        hotelSlug={hotel.slug}
                        categorySlug={category}
                      />
                    ))}
                  </div>
                </section>
              )}

              {hotels4.length === 0 && hotels5.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <p>No hay hoteles participantes en esta categoría.</p>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Footer activeCategory="votacion" />
    </div>
  );
}

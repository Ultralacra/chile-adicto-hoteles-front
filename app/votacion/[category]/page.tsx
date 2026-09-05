"use client";

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { CategoryNav } from "@/components/category-nav";
import { normalizeImageUrl } from "@/lib/utils";
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
import { HotelCard } from "@/components/hotel-card";
import { notFound } from "next/navigation";

const CATEGORY_NAMES: Record<string, string> = {
  norte: "NORTE DE CHILE",
  centro: "CENTRO DE CHILE",
  sur: "SUR DE CHILE",
  santiago: "SANTIAGO DE CHILE",
  "torres-del-paine": "TORRES DEL PAINE",
  "isla-de-pascua": "ISLA DE PASCUA",
  "hoteles-de-vina": "HOTELES DE VIÑA",
  "hoteles-de-nieve": "HOTELES DE NIEVE",
  "joyas-unicas": "JOYAS ÚNICAS",
};

function deriveVotingImages(hotel: any): { image: string; images: string[] } {
  const rawImages: string[] = Array.isArray(hotel.images)
    ? hotel.images.filter(Boolean)
    : [];
  const featured =
    String(hotel.featuredImage || "").trim() || rawImages[0] || "";
  const seen = new Set<string>();
  const orderedImages = featured ? [featured] : [];

  if (featured) seen.add(normalizeImageUrl(featured));

  // La imagen en posición 0 corresponde a "imagen 1", la portada alternativa
  // que ya está representada por featuredImage en las tarjetas de votación.
  const galleryImages =
    featured && rawImages.length > 0 ? rawImages.slice(1) : rawImages;

  for (const img of galleryImages) {
    const key = normalizeImageUrl(img);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    orderedImages.push(img);
  }

  return { image: featured, images: orderedImages };
}

const CATEGORY_API_SLUGS: Record<string, string> = {
  "hoteles-de-nieve": "ski",
  "hoteles-de-vina": "viñ",
};

type ResolvedParams = { category: string };

function WinnerRank({ rank }: { rank: number }) {
  const rankNumber = String(rank).padStart(2, "0");

  return (
    <img
      src={`/banner-resultados/CORAZONES/corazon_${rankNumber}.webp`}
      alt={`Puesto ${rank}`}
      className="h-[72px] w-[60px] object-contain"
    />
  );
}

function WinnersBanner({
  category,
  hearts,
}: {
  category: string;
  hearts: 4 | 5;
}) {
  const bannerConfig = {
    norte: {
      folder: "NORTE",
      prefix: "norte-de-chile",
      label: "Norte de Chile",
    },
    centro: {
      folder: "CENTRO",
      prefix: "centro-de-chile",
      label: "Centro de Chile",
    },
    sur: {
      folder: "SUR",
      prefix: "sur-de-chile",
      label: "Sur de Chile",
    },
    santiago: {
      folder: "SANTIAGO",
      prefix: "santiago-de-chile",
      label: "Santiago de Chile",
    },
    "torres-del-paine": {
      folder: "TORRES DEL PAINE",
      prefix: "torres-del-paine",
      label: "Torres del Paine",
    },
    "isla-de-pascua": {
      folder: "ISLA DE PASCUA",
      prefix: "isla-de-pascua",
      label: "Isla de Pascua",
      noHeartsSuffix: true,
    },
    "joyas-unicas": {
      folder: "JOYAS UNICAS",
      prefix: "joyas-unicas",
      label: "Joyas Únicas",
      noHeartsSuffix: true,
    },
    "hoteles-de-nieve": {
      folder: "DE NIEVE",
      prefix: "hoteles-de-nieve",
      label: "Hoteles de Nieve",
      noHeartsSuffix: true,
    },
    "hoteles-de-vina": {
      folder: "DE VIÑAS",
      prefix: "hoteles-de-vinas",
      label: "Hoteles de Viñas",
      noHeartsSuffix: true,
    },
  }[category];

  const heartsSuffix = bannerConfig?.noHeartsSuffix
    ? ""
    : `_${hearts}-corazones`;
  const categoryBanner =
    bannerConfig && hearts === 5
      ? {
          desktop: `/banner-resultados/${bannerConfig.folder}/DESKTOP/${bannerConfig.prefix}_ganadores${heartsSuffix}_desktop.webp`,
          mobile: `/banner-resultados/${bannerConfig.folder}/MOVIL/${bannerConfig.prefix}_ganadores${heartsSuffix}_movil.webp`,
        }
      : {
          desktop: `/banner-resultados/${bannerConfig?.folder}/DESKTOP/${bannerConfig?.prefix}_ganadores${heartsSuffix}_desktop.webp`,
          mobile: `/banner-resultados/${bannerConfig?.folder}/MOVIL/${bannerConfig?.prefix}_ganadores${heartsSuffix}_movil.webp`,
        };

  if (categoryBanner && bannerConfig) {
    return (
      <picture className="block w-full overflow-hidden">
        <source media="(max-width: 767px)" srcSet={categoryBanner.mobile} />
        <Image
          src={categoryBanner.desktop}
          alt={`Ganadores ${bannerConfig.label}, categoría ${hearts} corazones`}
          width={1920}
          height={500}
          className="block h-auto w-full"
        />
      </picture>
    );
  }

  return (
    <header className="voting-winners-banner">
      <div className="voting-winners-banner__title">
        <span aria-hidden="true" className="voting-winners-banner__laurel">
          ❦
        </span>
        <p>
          <span>
            GANADORES {CATEGORY_NAMES[category] || category.toUpperCase()}
          </span>
          <span>CATEGORÍA {hearts} CORAZONES</span>
        </p>
        <span aria-hidden="true" className="voting-winners-banner__laurel">
          ❦
        </span>
      </div>
      <Image
        src="/logo-footer-blanco.svg"
        alt="Chile Adicto Hoteles Premios"
        width={646}
        height={182}
        className="voting-winners-banner__logo"
      />
    </header>
  );
}

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
        const [res, votesRes] = await Promise.all([
          fetchWithSite(
            `/api/posts?categorySlug=${encodeURIComponent(apiSlug)}`,
          ),
          fetchWithSite("/api/votes?site=chileadicto"),
        ]);
        const rows = res.ok ? await res.json() : [];
        const voteSummary = votesRes.ok ? await votesRes.json() : null;
        let list = Array.isArray(rows) ? rows : [];
        list = list.filter((p: any) => !isHiddenFrontPost(p));

        let votingHotels = list.filter((h: any) =>
          allowedSlugs.includes(h.slug),
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
              if (
                found &&
                !votingHotels.some((h: any) => h.slug === found.slug)
              ) {
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

        const votesByHotel = new Map<string, number>(
          Array.isArray(voteSummary?.hotels)
            ? voteSummary.hotels.map((entry: any): [string, number] => [
                String(entry.hotelSlug),
                Number(entry.count) || 0,
              ])
            : [],
        );
        const byVotes = (first: any, second: any) =>
          (votesByHotel.get(second.slug) || 0) -
            (votesByHotel.get(first.slug) || 0) ||
          sortKey(first).localeCompare(sortKey(second));

        const h5 = votingHotels
          .filter((h: any) => getHotelHearts(category, h.slug) === 5)
          .sort(byVotes)
          .slice(0, 3);

        const h4 = votingHotels
          .filter((h: any) => getHotelHearts(category, h.slug) === 4)
          .sort(byVotes)
          .slice(0, 3);

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

  return (
    <div className="min-h-screen bg-white">
      <Header showHomeSecurityBanner={false} />

      <main className="site-inner py-4">
        <div className="hidden lg:block">
          <CategoryNav activeCategory="votacion" />
        </div>

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
              {hotels5.length > 0 && (
                <section className="mb-8">
                  <WinnersBanner category={category} hearts={5} />
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-4">
                    {hotels5.map((hotel, index) => (
                      <HotelCard
                        key={hotel.slug}
                        slug={hotel.slug}
                        name={
                          hotel[language]?.name ||
                          hotel.en?.name ||
                          hotel.es?.name
                        }
                        subtitle={
                          hotel[language]?.subtitle ||
                          hotel.en?.subtitle ||
                          hotel.es?.subtitle
                        }
                        description=""
                        {...deriveVotingImages(hotel)}
                        imageVariant="default"
                        voteElement={<WinnerRank rank={index + 1} />}
                        voteIconSize="large"
                        votePosition="right"
                        hideDescription
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Sección 4 corazones */}
              {hotels4.length > 0 && (
                <section>
                  <WinnersBanner category={category} hearts={4} />
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-4">
                    {hotels4.map((hotel, index) => (
                      <HotelCard
                        key={hotel.slug}
                        slug={hotel.slug}
                        name={
                          hotel[language]?.name ||
                          hotel.en?.name ||
                          hotel.es?.name
                        }
                        subtitle={
                          hotel[language]?.subtitle ||
                          hotel.en?.subtitle ||
                          hotel.es?.subtitle
                        }
                        description=""
                        {...deriveVotingImages(hotel)}
                        imageVariant="default"
                        voteElement={<WinnerRank rank={index + 1} />}
                        voteIconSize="large"
                        votePosition="right"
                        hideDescription
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

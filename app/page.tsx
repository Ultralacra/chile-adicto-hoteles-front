"use client";

import { Header } from "@/components/header";
import { HeroSlider } from "@/components/hero-slider";
import { HotelCard } from "@/components/hotel-card";
import { Footer } from "@/components/footer";
import { CategoryNav } from "@/components/category-nav";
import { buildCardExcerpt } from "@/lib/utils";
import { isHiddenFrontPost } from "@/lib/post-visibility";
import { useEffect, useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import { useLanguage } from "@/contexts/language-context";
import { useSiteApi } from "@/hooks/use-site-api";
import { BottomHomeBanner } from "@/components/home-promo-banners";

function proxyImageUrl(input: string): string {
  // chileadictohoteles.cl bloquea hotlink en <img> cross-site.
  // Weserv lo vuelve a servir como imagen embebible.
  const raw = String(input || "").trim();
  if (!raw) return raw;

  // Weserv espera normalmente el host/path sin protocolo.
  const withoutProtocol = raw.replace(/^https?:\/\//i, "");
  return `https://images.weserv.nl/?url=${encodeURIComponent(withoutProtocol)}`;
}

const HOME_SLIDES: Array<{ desktop: string; mobile: string | null }> = [
  {
    desktop:
      "https://chileadictohoteles.cl/wp-content/uploads/2025/08/EXPLORACIONES-1.webp",
    mobile:
      "https://chileadictohoteles.cl/wp-content/uploads/2025/08/4-INCREIBLES-EXPLORACIONES-MOVIL-1.webp",
  },
  {
    desktop:
      "https://chileadictohoteles.cl/wp-content/uploads/2026/01/SLD-REMANSO-1.webp",
    mobile: null,
  },
  {
    desktop:
      "https://chileadictohoteles.cl/wp-content/uploads/2025/07/TERMAS-DE-CHILLAN-1.webp",
    mobile:
      "https://chileadictohoteles.cl/wp-content/uploads/2025/08/TERMAS-DE-CHILLAN-MOVIL-1.webp",
  },
  {
    desktop:
      "https://chileadictohoteles.cl/wp-content/uploads/2025/07/CORRALCO-HOTEL-SPA-1.webp",
    mobile:
      "https://chileadictohoteles.cl/wp-content/uploads/2025/08/CORRALCO-HOTEL-SPA-MOVIL-1.webp",
  },
  {
    desktop:
      "https://chileadictohoteles.cl/wp-content/uploads/2024/12/best.webp",
    mobile:
      "https://chileadictohoteles.cl/wp-content/uploads/2024/12/best-movil.webp",
  },
  {
    desktop:
      "https://chileadictohoteles.cl/wp-content/uploads/2025/07/THE-SINGULAR-PATAGONIA-1.webp",
    mobile:
      "https://chileadictohoteles.cl/wp-content/uploads/2025/08/THE-SINGULAR-PATAGONIA-MOVIL-1.webp",
  },
  {
    desktop:
      "https://chileadictohoteles.cl/wp-content/uploads/2025/07/TAKA-MATANZAS-1.webp",
    mobile:
      "https://chileadictohoteles.cl/wp-content/uploads/2025/08/TAKA-MATANZAS-MOVIL1.webp",
  },
  {
    desktop:
      "https://chileadictohoteles.cl/wp-content/uploads/2025/07/AWA-PUERTO-VARAS-1.webp",
    mobile:
      "https://chileadictohoteles.cl/wp-content/uploads/2025/08/AWA-PUERTO-VARAS-MOVIL-1.webp",
  },
  {
    desktop:
      "https://chileadictohoteles.cl/wp-content/uploads/2025/07/CASA-REAL-1.webp",
    mobile:
      "https://chileadictohoteles.cl/wp-content/uploads/2025/08/CASA-REAL-MOVIL-1.webp",
  },
  {
    desktop:
      "https://chileadictohoteles.cl/wp-content/uploads/2025/07/DEBAINES-HOTEL-1.webp",
    mobile:
      "https://chileadictohoteles.cl/wp-content/uploads/2025/08/DEBAINES-HOTEL-MOVIL-1.webp",
  },
  {
    desktop:
      "https://chileadictohoteles.cl/wp-content/uploads/2025/07/CASA-ZAPALLAR-1.webp",
    mobile:
      "https://chileadictohoteles.cl/wp-content/uploads/2025/05/SLM-CASA-ZAPALLAR.webp",
  },
  {
    desktop:
      "https://chileadictohoteles.cl/wp-content/uploads/2025/07/CUMBRES-SAN-PEDRO-DE-ATACAMA-1.webp",
    mobile:
      "https://chileadictohoteles.cl/wp-content/uploads/2025/08/CUMBRES-SAN-PEDRO-DE-ATACAMA-MOVIL-1.webp",
  },
  {
    desktop:
      "https://chileadictohoteles.cl/wp-content/uploads/2025/07/NOI-INDIGO-PATAGONIA-1.webp",
    mobile:
      "https://chileadictohoteles.cl/wp-content/uploads/2025/08/NOI-INDIGO-PATAGONIA-MOVIL-1.webp",
  },
  {
    desktop:
      "https://chileadictohoteles.cl/wp-content/uploads/2025/07/OUR-HABITAS-ATACAMA-1.webp",
    mobile:
      "https://chileadictohoteles.cl/wp-content/uploads/2025/08/OUR-HABITAS-ATACAMA-MOVIL-1.webp",
  },
  {
    desktop:
      "https://chileadictohoteles.cl/wp-content/uploads/2025/07/TAWA-REFUGIO-PUELO-1.webp",
    mobile:
      "https://chileadictohoteles.cl/wp-content/uploads/2025/08/TAWA-REFUGIO-PUELO-MOVIL-1.webp",
  },
  {
    desktop:
      "https://chileadictohoteles.cl/wp-content/uploads/2025/07/CASAMOLLE-ELQUI-1.webp",
    mobile:
      "https://chileadictohoteles.cl/wp-content/uploads/2025/08/CASAMOLLE-ELQUI-MOVIL-1.webp",
  },
  {
    desktop:
      "https://chileadictohoteles.cl/wp-content/uploads/2025/07/NOI-PUMA-LODGE-1.webp",
    mobile:
      "https://chileadictohoteles.cl/wp-content/uploads/2025/08/NOI-PUMA-LODGE-MOVIL-1.webp",
  },
  {
    desktop:
      "https://chileadictohoteles.cl/wp-content/uploads/2026/01/VIVELO-ELQUI-1.webp",
    mobile: null,
  },
  {
    desktop:
      "https://chileadictohoteles.cl/wp-content/uploads/2025/07/REMOTA-PATAGONIA-LODGE-1.webp",
    mobile:
      "https://chileadictohoteles.cl/wp-content/uploads/2025/08/REMOTA-PATAGONIA-LODGE-MOVIL-1.webp",
  },
  {
    desktop:
      "https://chileadictohoteles.cl/wp-content/uploads/2025/12/SLD-PUYUHUAPI-1.webp",
    mobile: null,
  },
];

const HOME_SLIDER_DESKTOP_IMAGES = HOME_SLIDES.map((s) => s.desktop);
const HOME_SLIDER_MOBILE_IMAGES = HOME_SLIDES.map((s) => s.mobile ?? s.desktop);

const HOME_SLIDER_DESKTOP_IMAGES_PROXY =
  HOME_SLIDER_DESKTOP_IMAGES.map(proxyImageUrl);
const HOME_SLIDER_MOBILE_IMAGES_PROXY =
  HOME_SLIDER_MOBILE_IMAGES.map(proxyImageUrl);

export default function Page() {
  const { language } = useLanguage();
  const { fetchWithSite } = useSiteApi();
  const [sliderDesktopImagesEs, setSliderDesktopImagesEs] = useState<string[]>(
    HOME_SLIDER_DESKTOP_IMAGES_PROXY,
  );
  const [sliderMobileImagesEs, setSliderMobileImagesEs] = useState<string[]>(
    HOME_SLIDER_MOBILE_IMAGES_PROXY,
  );
  const [sliderDesktopImagesEn, setSliderDesktopImagesEn] = useState<string[]>(
    [],
  );
  const [sliderMobileImagesEn, setSliderMobileImagesEn] = useState<string[]>(
    [],
  );
  const [sliderLoading, setSliderLoading] = useState(true);
  const [hotels, setHotels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setSliderLoading(true);

    async function loadBoth() {
      try {
        const [resEsDesktop, resEnDesktop, resEsMobile, resEnMobile] =
          await Promise.all([
            fetchWithSite("/api/sliders/home-desktop"),
            fetchWithSite("/api/sliders/home-desktop-ingles"),
            fetchWithSite("/api/sliders/home-movil-español"),
            fetchWithSite("/api/sliders/home-movil-ingles"),
          ]);

        const jsonEsDesktop =
          resEsDesktop && resEsDesktop.ok
            ? await resEsDesktop.json()
            : { items: [] };
        const jsonEnDesktop =
          resEnDesktop && resEnDesktop.ok
            ? await resEnDesktop.json()
            : { items: [] };
        const jsonEsMobile =
          resEsMobile && resEsMobile.ok
            ? await resEsMobile.json()
            : { items: [] };
        const jsonEnMobile =
          resEnMobile && resEnMobile.ok
            ? await resEnMobile.json()
            : { items: [] };

        if (cancelled) return;

        const itemsEsDesktop = Array.isArray(jsonEsDesktop?.items)
          ? jsonEsDesktop.items
          : [];
        const itemsEnDesktop = Array.isArray(jsonEnDesktop?.items)
          ? jsonEnDesktop.items
          : [];
        const itemsEsMobile = Array.isArray(jsonEsMobile?.items)
          ? jsonEsMobile.items
          : [];
        const itemsEnMobile = Array.isArray(jsonEnMobile?.items)
          ? jsonEnMobile.items
          : [];

        if (itemsEsDesktop.length > 0) {
          const desktops = itemsEsDesktop
            .map((it: any) => proxyImageUrl(it.image_url || ""))
            .filter(Boolean);
          if (desktops.length) setSliderDesktopImagesEs(desktops);
        }

        if (itemsEnDesktop.length > 0) {
          const desktops = itemsEnDesktop
            .map((it: any) => proxyImageUrl(it.image_url || ""))
            .filter(Boolean);
          if (desktops.length) setSliderDesktopImagesEn(desktops);
        }

        // Mobile-specific sets: prefer these for mobile images
        if (itemsEsMobile.length > 0) {
          const mobiles = itemsEsMobile
            .map((it: any) => proxyImageUrl(it.image_url || ""))
            .filter(Boolean);
          if (mobiles.length) setSliderMobileImagesEs(mobiles);
        }

        if (itemsEnMobile.length > 0) {
          const mobiles = itemsEnMobile
            .map((it: any) => proxyImageUrl(it.image_url || ""))
            .filter(Boolean);
          if (mobiles.length) setSliderMobileImagesEn(mobiles);
        }

        // Fallback: if mobile sets are empty but desktop mobile fallbacks exist, keep them as-is
        setSliderLoading(false);
      } catch (e) {
        if (!cancelled) setSliderLoading(false);
      }
    }

    loadBoth();

    return () => {
      cancelled = true;
    };
  }, [fetchWithSite]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchWithSite("/api/posts")
      .then((r) => (r.ok ? r.json() : []))
      .then((rows) => {
        if (cancelled) return;
        const list = Array.isArray(rows) ? rows : [];
        const filtered = list.filter((h) => {
          if (isHiddenFrontPost(h)) return false;
          const cats = new Set<string>([
            ...(h.categories || []).map((c: any) => String(c).toUpperCase()),
          ]);
          const esCat = h.es?.category
            ? String(h.es.category).toUpperCase()
            : null;
          const enCat = h.en?.category
            ? String(h.en.category).toUpperCase()
            : null;
          // Excluir restaurantes y el post w-santiago
          if (String(h.slug) === "w-santiago") return false;
          return !(
            cats.has("RESTAURANTES") ||
            cats.has("RESTAURANTS") ||
            esCat === "RESTAURANTES" ||
            enCat === "RESTAURANTS" ||
            enCat === "RESTAURANTES"
          );
        });
        // Orden aleatorio en Home cada vez que se entra
        const shuffled = (() => {
          const arr = filtered.slice();
          for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
          }
          return arr;
        })();
        setHotels(shuffled);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setHotels([]);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [fetchWithSite]);

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="site-inner py-4">
        <div className="hidden lg:block">
          <CategoryNav activeCategory="todos" />
        </div>

        <div className="py-2">
          {/* Slider a ancho completo */}
          <div className="w-full">
            <div className="w-full h-[532px] overflow-visible">
              {/* Build combined arrays with same length so switching language doesn't re-mount slides */}
              {(() => {
                const maxLen = Math.max(
                  sliderDesktopImagesEs.length,
                  sliderDesktopImagesEn.length,
                );
                const desktopByLang: Array<{ es?: string; en?: string }> = [];
                const mobileByLang: Array<{ es?: string; en?: string }> = [];
                for (let i = 0; i < maxLen; i++) {
                  desktopByLang.push({
                    es:
                      sliderDesktopImagesEs[i] ||
                      sliderDesktopImagesEs[0] ||
                      "",
                    en:
                      sliderDesktopImagesEn[i] ||
                      sliderDesktopImagesEn[0] ||
                      "",
                  });
                  mobileByLang.push({
                    es:
                      sliderMobileImagesEs[i] || sliderMobileImagesEs[0] || "",
                    en:
                      sliderMobileImagesEn[i] || sliderMobileImagesEn[0] || "",
                  });
                }

                return (
                  <HeroSlider
                    desktopImagesByLang={desktopByLang}
                    mobileImagesByLang={mobileByLang}
                    language={language === "en" ? "en" : "es"}
                    desktopHeight={532}
                    mobileHeight={532}
                    dotBottom={24}
                  />
                );
              })()}
            </div>
          </div>

          {/* Banner debajo del slider */}
          <div className="w-full mt-6">
            <BottomHomeBanner />
          </div>

          {/* Cards section below - full width */}
          <section className="mt-6">
            {loading ? (
              <div className="w-full py-16 grid place-items-center text-gray-500">
                <div className="flex items-center gap-2">
                  <Spinner className="size-5" /> Cargando…
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {hotels.map((hotel) => (
                  <div key={hotel.slug} className="col-span-1">
                    <HotelCard
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
                      description={(() => {
                        const paras = Array.isArray(
                          hotel[language]?.description,
                        )
                          ? hotel[language].description
                          : Array.isArray(hotel.en?.description)
                            ? hotel.en.description
                            : [];
                        return buildCardExcerpt(paras);
                      })()}
                      image={hotel.featuredImage || hotel.images?.[0] || ""}
                      imageVariant="default"
                    />
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
      <Footer activeCategory="todos" />
    </div>
  );
}

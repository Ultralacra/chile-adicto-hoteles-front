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

const HOME_RESERVED_POSTS = [
  {
    slug: "categoria/lodges",
    es: {
      name: "Los mejores lodges de Chile",
      subtitle: "Presentados por Travel Security",
      description:
        "Escaparse lejos, rodeado de naturaleza, con muchas exploraciones por hacer, y luego, después de un día entero de paseos, llegar a un lodge con todas las comodidades y excelente gastronomía para retomar fuerzas para el otro día. Si lo estás pensando, aquí tienes 3 alternativas top.",
    },
    en: {
      name: "The best lodges in Chile",
      subtitle: "Presented by Travel Security",
      description:
        "Getting away, surrounded by nature, with plenty of explorations to enjoy, and then, after a full day of outings, returning to a lodge with every comfort and excellent cuisine to recharge for the next day. If that sounds like your plan, here are 3 top alternatives.",
    },
    image: "/portadas/PORTADA-HOTEL-LODGES.png",
  },
  {
    slug: "categoria/hoteles-boutique",
    es: {
      name: "Los mejores hoteles boutique de Chile",
      subtitle: "Presentados por Travel Security",
      description:
        "Nada mejor que alojar en un hotel boutique, donde el servicio es personalizado y cada detalle está muy bien cuidado, además de destacar por su arquitectura, diseño y decoración. Aquí te presentamos 3 extraordinarios exponentes del concepto para que planees tu próxima escapada.",
    },
    en: {
      name: "The best boutique hotels in Chile",
      subtitle: "Presented by Travel Security",
      description:
        "There is nothing better than staying at a boutique hotel, where service is personalized and every detail is carefully considered, while also standing out for its architecture, design, and decor. Here are 3 extraordinary examples of the concept to help you plan your next getaway.",
    },
    image: "/portadas/PORTADA-HOTEL-BOUTIQUE.png",
  },
  {
    slug: "categoria/exploraciones-tnf",
    es: {
      name: "LAS MEJORES EXPLORACIONES",
      subtitle: "DESDE LOS MEJORES HOTELES DE CHILE",
      description:
        "The North Face presenta una nueva e increíble seccion de chile adicto hoteles. Aquí la prestigiosa marca internacional outdoor, nos irá presentando las mejores exploraciones que se pueden hacer, desde los mejores hoteles destino de chile…",
    },
    en: {
      name: "THE BEST EXPLORATIONS",
      subtitle: "FROM CHILE'S FINEST HOTELS",
      description:
        "The North Face presents a new and incredible section of Chile Adicto Hoteles. Here, the prestigious international outdoor brand will showcase the best explorations available from Chile's top destination hotels…",
    },
    image:
      "https://chileadictohoteles.cl/wp-content/uploads/2024/12/portada-north-face.webp",
  },
];

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

        console.log("home-desktop (ES):", itemsEsDesktop);
        console.log("home-desktop-ingles (EN):", itemsEnDesktop);
        console.log("home-movil-español (ES):", itemsEsMobile);
        console.log("home-movil-ingles (EN):", itemsEnMobile);

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
        const normalizeCategory = (value: unknown) =>
          String(value || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toUpperCase()
            .trim();

        const filtered = list.filter((h) => {
          if (isHiddenFrontPost(h)) return false;
          const cats = new Set<string>([
            ...(h.categories || []).map((c: any) => normalizeCategory(c)),
          ]);
          const esCat = h.es?.category
            ? normalizeCategory(h.es.category)
            : null;
          const enCat = h.en?.category
            ? normalizeCategory(h.en.category)
            : null;

          // Excluir categorías no-hotel del home
          const hasBlockedCategory =
            cats.has("RESTAURANTES") ||
            cats.has("RESTAURANTS") ||
            cats.has("PRENSA") ||
            cats.has("EXPLORACIONES TNF") ||
            cats.has("GUIA IMPRESA") ||
            esCat === "RESTAURANTES" ||
            enCat === "RESTAURANTS" ||
            enCat === "RESTAURANTES" ||
            esCat === "PRENSA" ||
            enCat === "PRENSA" ||
            esCat === "EXPLORACIONES TNF" ||
            enCat === "EXPLORACIONES TNF" ||
            esCat === "GUIA IMPRESA" ||
            enCat === "GUIA IMPRESA";

          // Excluir w-santiago
          if (String(h.slug) === "w-santiago") return false;
          return !hasBlockedCategory;
        });
        const sortKey = (h: any) =>
          String(h?.[language]?.name || h?.en?.name || h?.es?.name || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toUpperCase()
            .trim();

        const ordered = filtered.slice().sort((a, b) => {
          const aKey = sortKey(a);
          const bKey = sortKey(b);
          if (aKey < bKey) return -1;
          if (aKey > bKey) return 1;
          return String(a?.slug || "").localeCompare(String(b?.slug || ""));
        });

        setHotels(ordered);
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
  }, [fetchWithSite, language]);

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
                {HOME_RESERVED_POSTS.map((reserved) => (
                  <div key={reserved.slug} className="col-span-1">
                    <HotelCard
                      slug={reserved.slug}
                      name={
                        language === "es" ? reserved.es.name : reserved.en.name
                      }
                      subtitle={
                        language === "es"
                          ? reserved.es.subtitle
                          : reserved.en.subtitle
                      }
                      description={
                        language === "es"
                          ? reserved.es.description
                          : reserved.en.description
                      }
                      image={reserved.image}
                      imageVariant="default"
                    />
                  </div>
                ))}
                {hotels.map((hotel) => (
                  <div key={hotel.slug} className="col-span-1">
                    {(() => {
                      const categories = Array.isArray(hotel?.categories)
                        ? hotel.categories.map((c: any) =>
                            String(c || "").toUpperCase(),
                          )
                        : [];
                      const isPrensa = categories.includes("PRENSA");
                      const pressUrl =
                        hotel?.websitePublic ||
                        hotel?.websitepublic ||
                        hotel?.website_public ||
                        "";

                      return (
                        <HotelCard
                          slug={hotel.slug}
                          externalUrl={
                            isPrensa && String(pressUrl).trim()
                              ? String(pressUrl)
                              : undefined
                          }
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
                      );
                    })()}
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

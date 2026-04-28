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

function proxyImageUrl(input: string): string {
  // chileadictohoteles.cl bloquea hotlink en <img> cross-site.
  // Weserv lo vuelve a servir como imagen embebible.
  const raw = String(input || "").trim();
  if (!raw) return raw;

  // Weserv espera normalmente el host/path sin protocolo.
  const withoutProtocol = raw.replace(/^https?:\/\//i, "");
  return `https://images.weserv.nl/?url=${encodeURIComponent(withoutProtocol)}`;
}

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
    slug: "categoria/boutique",
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
    image: "/portadas/portada-north-face.webp",
  },
];

export default function Page() {
  const { language } = useLanguage();
  const { fetchWithSite } = useSiteApi();
  const [sliderDesktopImagesEs, setSliderDesktopImagesEs] = useState<string[]>(
    [],
  );
  const [sliderDesktopHrefsEs, setSliderDesktopHrefsEs] = useState<string[]>(
    [],
  );
  const [sliderMobileImagesEs, setSliderMobileImagesEs] = useState<string[]>(
    [],
  );
  const [sliderMobileHrefsEs, setSliderMobileHrefsEs] = useState<string[]>([]);
  const [sliderDesktopImagesEn, setSliderDesktopImagesEn] = useState<string[]>(
    [],
  );
  const [sliderDesktopHrefsEn, setSliderDesktopHrefsEn] = useState<string[]>(
    [],
  );
  const [sliderMobileImagesEn, setSliderMobileImagesEn] = useState<string[]>(
    [],
  );
  const [sliderMobileHrefsEn, setSliderMobileHrefsEn] = useState<string[]>([]);
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
            fetchWithSite(
              `/api/sliders/${encodeURIComponent("HOME INGLES DESKTOP")}`,
            ),
            fetchWithSite(
              `/api/sliders/${encodeURIComponent("HOME MOVIL ESPAÑOL")}`,
            ),
            fetchWithSite(
              `/api/sliders/${encodeURIComponent("HOME MOVIL INGLES")}`,
            ),
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
        console.log("HOME INGLES DESKTOP (EN):", itemsEnDesktop);
        console.log("HOME MOVIL ESPAÑOL (ES):", itemsEsMobile);
        console.log("HOME MOVIL INGLES (EN):", itemsEnMobile);

        const desktopEsImages = itemsEsDesktop
          .map((it: any) => proxyImageUrl(it.image_url || ""))
          .filter(Boolean);
        const desktopEsHrefs = itemsEsDesktop.map((it: any) =>
          it?.href ? String(it.href).trim() : "",
        );
        const desktopEnImages = itemsEnDesktop
          .map((it: any) => proxyImageUrl(it.image_url || ""))
          .filter(Boolean);
        const desktopEnHrefs = itemsEnDesktop.map((it: any) =>
          it?.href ? String(it.href).trim() : "",
        );
        const mobileEsImages = itemsEsMobile
          .map((it: any) => proxyImageUrl(it.image_url || ""))
          .filter(Boolean);
        const mobileEsHrefs = itemsEsMobile.map((it: any) =>
          it?.href ? String(it.href).trim() : "",
        );
        const mobileEnImages = itemsEnMobile
          .map((it: any) => proxyImageUrl(it.image_url || ""))
          .filter(Boolean);
        const mobileEnHrefs = itemsEnMobile.map((it: any) =>
          it?.href ? String(it.href).trim() : "",
        );

        setSliderDesktopImagesEs(desktopEsImages);
        setSliderDesktopHrefsEs(desktopEsHrefs);
        setSliderDesktopImagesEn(
          desktopEnImages.length > 0 ? desktopEnImages : desktopEsImages,
        );
        setSliderDesktopHrefsEn(
          desktopEnImages.length > 0 ? desktopEnHrefs : desktopEsHrefs,
        );
        setSliderMobileImagesEs(
          mobileEsImages.length > 0 ? mobileEsImages : desktopEsImages,
        );
        setSliderMobileHrefsEs(
          mobileEsHrefs.length > 0 ? mobileEsHrefs : desktopEsHrefs,
        );
        setSliderMobileImagesEn(
          mobileEnImages.length > 0
            ? mobileEnImages
            : desktopEnImages.length > 0
              ? desktopEnImages
              : desktopEsImages,
        );
        setSliderMobileHrefsEn(
          mobileEnImages.length > 0
            ? mobileEnHrefs
            : desktopEnImages.length > 0
              ? desktopEnHrefs
              : desktopEsHrefs,
        );

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
            <div className="w-full overflow-visible">
              {/* Build combined arrays with same length so switching language doesn't re-mount slides */}
              {(() => {
                if (sliderLoading) {
                  return (
                    <div className="w-full h-full grid place-items-center text-gray-500">
                      <div className="flex items-center gap-2">
                        <Spinner className="size-5" /> Cargando slider…
                      </div>
                    </div>
                  );
                }

                const maxLen = Math.max(
                  sliderDesktopImagesEs.length,
                  sliderDesktopImagesEn.length,
                  sliderMobileImagesEs.length,
                  sliderMobileImagesEn.length,
                );

                if (maxLen === 0) {
                  return null;
                }

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
                    slideHrefs={
                      language === "en"
                        ? sliderDesktopHrefsEn
                        : sliderDesktopHrefsEs
                    }
                    slideHrefsMobile={
                      language === "en"
                        ? sliderMobileHrefsEn
                        : sliderMobileHrefsEs
                    }
                    language={language === "en" ? "en" : "es"}
                    autoHeight
                  />
                );
              })()}
            </div>
          </div>

          <div className="w-full mt-6 md:hidden">
            <a
              href="https://www.travelsecurity.cl/"
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <img
                src="/banners/HEADER%20SECURITY%20MOVIL.png"
                alt="Travel Security"
                className="block w-full h-auto"
              />
            </a>
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
                {HOME_RESERVED_POSTS.filter(
                  (reserved) =>
                    reserved.es.name !== "LAS MEJORES EXPLORACIONES",
                ).map((reserved) => (
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

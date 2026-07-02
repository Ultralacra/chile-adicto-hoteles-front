"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useSiteApi } from "@/hooks/use-site-api";

// Reordenado: ICONOS debe ser el primer slide según solicitud.
// iconos, arquitectura, barrios, mercados, miradores, museos (CULTURA),
// palacios, parques, paseos-fuera-de-santiago, restaurantes
const desktopImagesDefault = [
  "https://azure-seal-918691.hostingersite.com/wp-content/uploads/2025/09/ICONOS-scaled.webp", // Iconos (primero)
  "https://azure-seal-918691.hostingersite.com/wp-content/uploads/2025/09/AQI-scaled.webp", // Arquitectura
  "https://azure-seal-918691.hostingersite.com/wp-content/uploads/2025/09/BARRIOS-scaled.webp", // Barrios
  "https://azure-seal-918691.hostingersite.com/wp-content/uploads/2025/09/MERCADOS-scaled.webp", // Mercados
  "https://azure-seal-918691.hostingersite.com/wp-content/uploads/2025/09/MIRADORES-scaled.webp", // Miradores
  "https://azure-seal-918691.hostingersite.com/wp-content/uploads/2025/09/CULTURA-scaled.webp", // Museos (Cultura)
  "https://azure-seal-918691.hostingersite.com/wp-content/uploads/2025/09/PALACIOS-scaled.webp", // Palacios
  "https://azure-seal-918691.hostingersite.com/wp-content/uploads/2025/09/PARQUES-scaled.webp", // Parques
  "https://azure-seal-918691.hostingersite.com/wp-content/uploads/2025/09/FUERA-DE-SGO-scaled.webp", // Fuera de Stgo
  "https://azure-seal-918691.hostingersite.com/wp-content/uploads/2025/09/slider-100-scaled.webp", // Restaurantes (promo)
];

// Para evitar desajuste de dots entre desktop y mobile, mantenemos la misma
// cantidad y orden de imágenes por defecto en mobile.
const mobileImagesDefault = [...desktopImagesDefault];

type HeroSliderProps = {
  desktopImages?: string[];
  mobileImages?: string[];
  // Also accept per-language images: e.g. { es: string, en: string }
  desktopImagesByLang?: Array<
    string | { es?: string | null; en?: string | null }
  >;
  mobileImagesByLang?: Array<
    string | { es?: string | null; en?: string | null }
  >;
  language?: "es" | "en";
  sliderKeyDesktop?: string;
  sliderKeyMobile?: string;
  objectFit?: "cover" | "contain"; // cover por defecto; contain para no recortar
  objectPosition?: "center" | "top" | "bottom"; // alineación vertical/horizontal del objeto
  desktopHeight?: number; // alto del slide desktop en px (por defecto 437)
  mobileHeight?: number; // alto del slide mobile en px (por defecto 550)
  slideHref?: string; // si se define, cada slide será un enlace a esta ruta
  slideHrefs?: string[]; // hrefs por slide; tiene prioridad sobre slideHref
  slideHrefsMobile?: string[]; // hrefs específicos para mobile; si no se provee, cae en slideHrefs
  preferApiHrefs?: boolean; // si true, los hrefs cargados por API tienen prioridad sobre los props
  autoHeight?: boolean; // si true, la altura se adapta a la imagen (w-full h-auto)
};

export function HeroSlider({
  desktopImages,
  mobileImages,
  desktopImagesByLang,
  mobileImagesByLang,
  language = "es",
  sliderKeyDesktop,
  sliderKeyMobile,
  objectFit = "cover",
  objectPosition = "center",
  desktopHeight = 437,
  mobileHeight = 550,
  slideHref,
  slideHrefs,
  slideHrefsMobile,
  preferApiHrefs = false,
  autoHeight = false,
}: HeroSliderProps) {
  const { fetchWithSite } = useSiteApi();
  // Estado para imágenes obtenidas desde API (si existen en /public/slider-*)
  const [desktopFromApi, setDesktopFromApi] = useState<string[] | null>(null);
  const [mobileFromApi, setMobileFromApi] = useState<string[] | null>(null);
  const [desktopHrefsFromApi, setDesktopHrefsFromApi] = useState<
    string[] | null
  >(null);
  const [mobileHrefsFromApi, setMobileHrefsFromApi] = useState<string[] | null>(
    null,
  );
  const [desktopLoadedFromDb, setDesktopLoadedFromDb] = useState(false);
  const [mobileLoadedFromDb, setMobileLoadedFromDb] = useState(false);

  // Elegir fuentes en orden de prioridad: props -> API (BD) -> defaults
  // Si la BD respondió (incluso con 0 items), se usa esa respuesta y NO
  // se cae al fallback de imágenes hardcodeadas (que son de otro sitio).
  const desktopSourceRaw =
    desktopImagesByLang && desktopImagesByLang.length
      ? desktopImagesByLang
      : ((desktopImages && desktopImages.length ? desktopImages : undefined) ??
        (desktopLoadedFromDb && desktopFromApi ? desktopFromApi : undefined) ??
        (desktopFromApi && desktopFromApi.length ? desktopFromApi : undefined) ??
        desktopImagesDefault);

  const mobileSourceRaw =
    mobileImagesByLang && mobileImagesByLang.length
      ? mobileImagesByLang
      : ((mobileImages && mobileImages.length ? mobileImages : undefined) ??
        (mobileLoadedFromDb && mobileFromApi ? mobileFromApi : undefined) ??
        (mobileFromApi && mobileFromApi.length ? mobileFromApi : undefined) ??
        mobileImagesDefault);

  // Resolve raw source into array of strings depending on `language`.
  const desktop = (
    Array.isArray(desktopSourceRaw)
      ? desktopSourceRaw.map((it: any) => {
          if (!it) return "";
          if (typeof it === "string") return it;
          return (language === "en" ? it.en : it.es) || it.es || it.en || "";
        })
      : []
  ) as string[];

  const mobile = (
    Array.isArray(mobileSourceRaw)
      ? mobileSourceRaw.map((it: any) => {
          if (!it) return "";
          if (typeof it === "string") return it;
          return (language === "en" ? it.en : it.es) || it.es || it.en || "";
        })
      : []
  ) as string[];

  // Embla for desktop and mobile instances
  const [emblaDesktopRef, emblaDesktopApi] = useEmblaCarousel({ loop: true });
  const [emblaMobileRef, emblaMobileApi] = useEmblaCarousel({ loop: true });

  // Cargar imágenes locales desde API si no se pasaron por props
  useEffect(() => {
    let cancelled = false;
    async function loadFromApi() {
      try {
        // Reset del origen en cada carga (para no dejar flags antiguos)
        setDesktopLoadedFromDb(false);
        setMobileLoadedFromDb(false);

        // Si ya nos pasaron props, no hacemos fetch innecesario
        const needDesktop = !(desktopImages && desktopImages.length);
        const needMobile = !(mobileImages && mobileImages.length);
        if (!needDesktop && !needMobile) return;

        // 1) Preferir sliders desde BD (si se indicó key)
        const loadSet = async (key: string) => {
          const res = await fetchWithSite(
            `/api/sliders/${encodeURIComponent(key)}`,
            {
              cache: "no-store",
            },
          );
          if (!res.ok) return { images: [], hrefs: [] };
          const json = (await res.json()) as {
            key?: string;
            items?: Array<{
              image_url?: string;
              href?: string | null;
              active?: boolean;
            }>;
          };
          const items = Array.isArray(json?.items) ? json.items : [];
          const activeItems = items.filter((it) => it?.active !== false);
          const images = activeItems
            .map((it) => String(it?.image_url || "").trim())
            .filter(Boolean);
          const hrefs = activeItems.map((it) =>
            it?.href ? String(it.href).trim() : "",
          );
          return { images, hrefs };
        };

        const didLoadFromDb = async () => {
          let used = false;
          let dbDesktopImages: string[] = [];
          let dbDesktopHrefs: string[] = [];
          if (needDesktop && sliderKeyDesktop) {
            const { images, hrefs } = await loadSet(sliderKeyDesktop);
            if (cancelled) return true;
            dbDesktopImages = images;
            dbDesktopHrefs = hrefs;
            setDesktopFromApi(images);
            setDesktopHrefsFromApi(hrefs);
            setDesktopLoadedFromDb(true);
            used = true;
          }
          if (needMobile && sliderKeyMobile) {
            const { images, hrefs } = await loadSet(sliderKeyMobile);
            if (cancelled) return true;
            if (images.length) {
              setMobileFromApi(images);
              setMobileHrefsFromApi(hrefs);
            } else if (dbDesktopImages.length) {
              setMobileFromApi(dbDesktopImages);
              setMobileHrefsFromApi(dbDesktopHrefs);
            } else {
              setMobileFromApi([]);
              setMobileHrefsFromApi([]);
            }
            setMobileLoadedFromDb(true);
            used = true;
          }
          return used;
        };

        const usedDb = await didLoadFromDb();
        if (usedDb) return;

        // 2) Fallback legacy: /api/slider-images (carpetas públicas)
        const res = await fetchWithSite("/api/slider-images", {
          cache: "no-store",
        });
        if (!res.ok) return;
        const json = (await res.json()) as {
          desktop: string[];
          mobile: string[];
        };
        if (cancelled) return;
        if (needDesktop && Array.isArray(json.desktop)) {
          setDesktopFromApi(json.desktop);
        }
        if (needMobile && Array.isArray(json.mobile)) {
          setMobileFromApi(json.mobile);
        }
      } catch (e) {
        // Silencioso: mantenemos defaults
      }
    }
    loadFromApi();
    return () => {
      cancelled = true;
    };
  }, [
    desktopImages,
    mobileImages,
    sliderKeyDesktop,
    sliderKeyMobile,
    fetchWithSite,
  ]);

  const hrefForIndex = (index: number, mode: "desktop" | "mobile") => {
    const apiHrefs =
      mode === "mobile" ? mobileHrefsFromApi : desktopHrefsFromApi;
    const apiHref = apiHrefs?.[index] ? String(apiHrefs[index]).trim() : "";

    const loadedFromDb =
      mode === "mobile" ? mobileLoadedFromDb : desktopLoadedFromDb;

    const propHref =
      mode === "mobile"
        ? (slideHrefsMobile && slideHrefsMobile[index]) ||
          (slideHrefs && slideHrefs[index]) ||
          slideHref ||
          ""
        : (slideHrefs && slideHrefs[index]) || slideHref || "";

    // Si el set vino de BD, no mezclamos con hrefs estáticos (evita enlaces incorrectos si cambió el orden)
    if (preferApiHrefs) return loadedFromDb ? apiHref : apiHref || propHref;
    return propHref || apiHref;
  };

  return (
    <div className="relative w-full overflow-hidden">
      {/* Desktop Embla */}
      <div className="hidden md:block relative">
        {desktop.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Imagen previa"
              onClick={() => emblaDesktopApi?.scrollPrev()}
              className="absolute left-2 md:left-3 top-1/2 -translate-y-1/2 z-10 text-white bg-black/30 hover:bg-black/50 backdrop-blur-[2px] p-2 md:p-3 rounded-full focus:outline-none focus:ring-2 focus:ring-white/70"
            >
              <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
            </button>
            <button
              type="button"
              aria-label="Imagen siguiente"
              onClick={() => emblaDesktopApi?.scrollNext()}
              className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 z-10 text-white bg-black/30 hover:bg-black/50 backdrop-blur-[2px] p-2 md:p-3 rounded-full focus:outline-none focus:ring-2 focus:ring-white/70"
            >
              <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
            </button>
          </>
        )}
        <div className="embla" ref={emblaDesktopRef as any}>
          <div className="embla__container flex">
            {desktop.map((image, index) => (
              <div
                key={`d-${index}`}
                className="embla__slide min-w-full"
                style={
                  autoHeight ? undefined : { height: `${desktopHeight}px` }
                }
              >
                {hrefForIndex(index, "desktop") ? (
                  <Link
                    href={hrefForIndex(index, "desktop")}
                    className={`block w-full ${
                      autoHeight ? "h-auto" : "h-full"
                    }`}
                  >
                    <img
                      src={image || "/placeholder.svg"}
                      alt={`Slide ${index + 1}`}
                      referrerPolicy="no-referrer"
                      loading="eager"
                      className={
                        autoHeight
                          ? "block w-full h-auto"
                          : `w-full h-full ${
                              objectFit === "contain"
                                ? "object-contain"
                                : "object-cover"
                            } ${
                              objectPosition === "top"
                                ? "object-top"
                                : objectPosition === "bottom"
                                  ? "object-bottom"
                                  : "object-center"
                            }`
                      }
                    />
                  </Link>
                ) : (
                  <img
                    src={image || "/placeholder.svg"}
                    alt={`Slide ${index + 1}`}
                    referrerPolicy="no-referrer"
                    loading="eager"
                    className={
                      autoHeight
                        ? "block w-full h-auto"
                        : `w-full h-full ${
                            objectFit === "contain"
                              ? "object-contain"
                              : "object-cover"
                          } ${
                            objectPosition === "top"
                              ? "object-top"
                              : objectPosition === "bottom"
                                ? "object-bottom"
                                : "object-center"
                          }`
                    }
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Embla */}
      <div className="md:hidden relative">
        {mobile.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Imagen previa"
              onClick={() => emblaMobileApi?.scrollPrev()}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 text-white bg-black/30 hover:bg-black/50 backdrop-blur-[2px] p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-white/70"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              aria-label="Imagen siguiente"
              onClick={() => emblaMobileApi?.scrollNext()}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 text-white bg-black/30 hover:bg-black/50 backdrop-blur-[2px] p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-white/70"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
        <div className="embla" ref={emblaMobileRef as any}>
          <div className="embla__container flex">
            {mobile.map((image, index) => (
              <div
                key={`m-${index}`}
                className="embla__slide min-w-full"
                style={autoHeight ? undefined : { height: `${mobileHeight}px` }}
              >
                {hrefForIndex(index, "mobile") ? (
                  <Link
                    href={hrefForIndex(index, "mobile")}
                    className={`block w-full ${
                      autoHeight ? "h-auto" : "h-full"
                    }`}
                  >
                    <img
                      src={image || "/placeholder.svg"}
                      alt={`Slide ${index + 1}`}
                      referrerPolicy="no-referrer"
                      loading="eager"
                      className={
                        autoHeight
                          ? "block w-full h-auto"
                          : `w-full h-full ${
                              objectFit === "contain"
                                ? "object-contain"
                                : "object-cover"
                            } ${
                              objectPosition === "top"
                                ? "object-top"
                                : objectPosition === "bottom"
                                  ? "object-bottom"
                                  : "object-center"
                            }`
                      }
                    />
                  </Link>
                ) : (
                  <img
                    src={image || "/placeholder.svg"}
                    alt={`Slide ${index + 1}`}
                    referrerPolicy="no-referrer"
                    loading="eager"
                    className={
                      autoHeight
                        ? "block w-full h-auto"
                        : `w-full h-full ${
                            objectFit === "contain"
                              ? "object-contain"
                              : "object-cover"
                          } ${
                            objectPosition === "top"
                              ? "object-top"
                              : objectPosition === "bottom"
                                ? "object-bottom"
                                : "object-center"
                          }`
                    }
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
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
  dotActiveClass?: string; // clase tailwind para punto activo
  dotInactiveClass?: string; // clase tailwind para punto inactivo
  dotBottom?: number; // espacio en px desde el fondo para los dots (por defecto 16)
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
  dotActiveClass = "bg-[#E40E36] w-3 h-3",
  dotInactiveClass = "bg-white w-2 h-2",
  dotBottom = 28,
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

  // Elegir fuentes en orden de prioridad: props -> API -> defaults
  // If caller provided per-language arrays, prefer them and resolve to a single
  // array where each entry can be either a string or an object {es,en}.
  const desktopSourceRaw =
    desktopImagesByLang && desktopImagesByLang.length
      ? desktopImagesByLang
      : ((desktopImages && desktopImages.length ? desktopImages : undefined) ??
        (desktopFromApi && desktopFromApi.length
          ? desktopFromApi
          : undefined) ??
        desktopImagesDefault);

  const mobileSourceRaw =
    mobileImagesByLang && mobileImagesByLang.length
      ? mobileImagesByLang
      : ((mobileImages && mobileImages.length ? mobileImages : undefined) ??
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

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // Detectar breakpoint activo (md: 768px)
  useEffect(() => {
    const check = () => {
      if (typeof window === "undefined") return;
      const mq = window.matchMedia("(max-width: 767.98px)");
      setIsMobile(mq.matches);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Autoplay solo sobre el carrusel activo
  useEffect(() => {
    const api = isMobile ? emblaMobileApi : emblaDesktopApi;
    if (!api) return;
    const id = setInterval(() => api.scrollNext(), 5000);
    return () => clearInterval(id);
  }, [isMobile, emblaDesktopApi, emblaMobileApi]);

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
          if (needDesktop && sliderKeyDesktop) {
            const { images, hrefs } = await loadSet(sliderKeyDesktop);
            if (cancelled) return true;
            if (images.length) {
              setDesktopFromApi(images);
              setDesktopHrefsFromApi(hrefs);
              setDesktopLoadedFromDb(true);
              used = true;
            }
          }
          if (needMobile && sliderKeyMobile) {
            const { images, hrefs } = await loadSet(sliderKeyMobile);
            if (cancelled) return true;
            if (images.length) {
              setMobileFromApi(images);
              setMobileHrefsFromApi(hrefs);
              setMobileLoadedFromDb(true);
              used = true;
            }
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

  // Sincronizar selectedIndex solo con el carrusel visible
  useEffect(() => {
    const api = isMobile ? emblaMobileApi : emblaDesktopApi;
    if (!api) return;
    const onSelectActive = () => setSelectedIndex(api.selectedScrollSnap());
    api.on("select", onSelectActive);
    onSelectActive();
    return () => {
      api.off("select", onSelectActive);
    };
  }, [isMobile, emblaDesktopApi, emblaMobileApi]);

  const goToSlide = (index: number) => {
    const api = isMobile ? emblaMobileApi : emblaDesktopApi;
    api?.scrollTo(index);
    setSelectedIndex(index);
  };

  return (
    <div className="relative w-full overflow-hidden">
      {/* Desktop Embla */}
      <div className="hidden md:block">
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
      <div className="md:hidden">
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

      {/* dots: centered bottom */}
      <div
        className="absolute left-0 right-0 z-40 flex justify-center pointer-events-auto"
        style={{ bottom: `${dotBottom}px` }}
      >
        <div className="flex gap-2">
          {(isMobile ? mobile : desktop).map((_, dotIndex) => (
            <button
              key={`global-dot-${dotIndex}`}
              onClick={() => goToSlide(dotIndex)}
              className={`rounded-full transition-all focus:outline-none ${
                dotIndex === selectedIndex ? dotActiveClass : dotInactiveClass
              }`}
              aria-label={`Go to slide ${dotIndex + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

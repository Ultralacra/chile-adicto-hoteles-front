"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";
import { useLanguage } from "@/contexts/language-context";
import { CategoryNav } from "@/components/category-nav";
import { useSiteApi } from "@/hooks/use-site-api";
import { BottomHomeBanner } from "@/components/home-promo-banners";
import { ComentaIcon } from "@/components/comenta-icon";

interface LocationInfo {
  label?: string;
  address?: string;
  hours?: string;
  website?: string;
  website_display?: string;
  instagram?: string;
  instagram_display?: string;
  reservationLink?: string;
  reservationPolicy?: string;
  interestingFact?: string;
  email?: string;
  phone?: string;
}

interface HotelDetailProps {
  hotel: {
    name: string;
    subtitle: string;
    excerpt: string;
    fullContent: string;
    infoHtml?: string;
    infoHtmlNew?: string;
    website?: string;
    website_display?: string;
    instagram?: string;
    instagram_display?: string;
    email?: string;
    phone?: string;
    address?: string;
    locations?: LocationInfo[];
    photosCredit?: string;
    hours?: string;
    reservationLink?: string;
    reservationPolicy?: string;
    interestingFact?: string;
    featuredImage?: string;
    galleryImages?: string[];
    categories?: string[];
  };
  hideUsefulInfo?: boolean;
  hideReservationIcon?: boolean;
}

export function HotelDetail({
  hotel,
  hideUsefulInfo = false,
  hideReservationIcon = false,
}: HotelDetailProps) {
  const { t } = useLanguage();
  const { fetchWithSite } = useSiteApi();

  const toSlug = (input: string) =>
    String(input || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const isMonumentosPost = Array.isArray(hotel?.categories)
    ? hotel.categories
        .map((c) => toSlug(String(c || "")))
        .includes("monumentos-nacionales")
    : false;

  const isCafesPost = Array.isArray(hotel?.categories)
    ? hotel.categories.map((c) => toSlug(String(c || ""))).includes("cafes")
    : false;

  const showCategoryBanner = isMonumentosPost || isCafesPost;
  // La galería NO debe incluir la imagen de portada. Si hay imágenes de galería, usamos solo esas.
  // Si NO hay imágenes de galería, mostramos la portada como único slide.
  const allImages =
    hotel.galleryImages && hotel.galleryImages.length > 0
      ? hotel.galleryImages.filter(Boolean)
      : hotel.featuredImage
        ? [hotel.featuredImage]
        : [];
  const canShowControls = allImages.length > 1;
  // Slider manual: sin swipe/drag (solo flechas). Con loop para volver de la última a la primera.
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    watchDrag: false,
  });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const lightboxOpenIndexRef = useRef(0);
  const [lightboxEmblaRef, lightboxEmblaApi] = useEmblaCarousel({
    loop: true,
    watchDrag: false,
  });
  const [cleanedFullContent, setCleanedFullContent] = useState(
    hotel.fullContent || "",
  );
  const [address, setAddress] = useState<string>(
    normalizeAddressText(hotel.address || ""),
  );

  const fallbackRestaurantCommunes = useMemo(
    () => [
      { slug: "vitacura", label: "Vitacura" },
      { slug: "las-condes", label: "Las Condes" },
      { slug: "santiago", label: "Santiago" },
      { slug: "lo-barnechea", label: "Lo Barnechea" },
      { slug: "providencia", label: "Providencia" },
      { slug: "alto-jahuel", label: "Alto Jahuel" },
      { slug: "la-reina", label: "La Reina" },
    ],
    [],
  );
  const [restaurantCommunes, setRestaurantCommunes] = useState(
    fallbackRestaurantCommunes,
  );

  useEffect(() => {
    const cats = hotel?.categories || [];
    const up = (cats || []).map((c) => String(c).toUpperCase());
    const isRestaurant =
      up.includes("RESTAURANTES") || up.includes("RESTAURANTS");
    if (!isRestaurant) return;

    let cancelled = false;
    fetchWithSite("/api/communes?nav=1", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : []))
      .then((rows) => {
        if (cancelled) return;
        const list = Array.isArray(rows) ? rows : [];
        const mapped = list
          .filter((x: any) => x && x.slug && x.show_in_menu !== false)
          .map((x: any) => ({
            slug: String(x.slug),
            label: String(x.label || String(x.slug).replace(/-/g, " ")),
          }))
          .filter((x: any) => x.slug);
        if (mapped.length > 0) setRestaurantCommunes(mapped);
        else setRestaurantCommunes(fallbackRestaurantCommunes);
      })
      .catch(
        () => !cancelled && setRestaurantCommunes(fallbackRestaurantCommunes),
      );

    return () => {
      cancelled = true;
    };
  }, [hotel?.categories, fallbackRestaurantCommunes, fetchWithSite]);

  // Log de datos útiles al entrar al post (estado crudo)
  useEffect(() => {
    const datos = {
      hasInfoHtmlNew: !!hotel.infoHtmlNew,
      hasInfoHtml: !!hotel.infoHtml,
      website: hotel.website,
      instagram: hotel.instagram,
      email: hotel.email,
      phone: hotel.phone,
      address: hotel.address,
      locations: hotel.locations,
      reservationLink: hotel.reservationLink,
      reservationPolicy: hotel.reservationPolicy,
      hours: hotel.hours,
      interestingFact: hotel.interestingFact,
      photosCredit: hotel.photosCredit,
    };
    console.log("[HotelDetail] Datos útiles (raw):", datos);
  }, [hotel]);

  // Sanitizar enlaces dentro de infoHtmlNew / infoHtml (corrige comillas y protocolos)
  const sanitizeInfoHtml = (raw?: string) => {
    if (!raw) return "";
    try {
      const div = document.createElement("div");
      div.innerHTML = raw;
      const anchors = div.querySelectorAll("a[href]");
      anchors.forEach((a) => {
        let href = a.getAttribute("href") || "";
        href = href.trim().replace(/^['\"]+|['\"]+$/g, "");
        // Eliminar backslashes residuales al final (p.ej. ...%5C)
        href = href.replace(/\\+$/g, "");
        // Añadir dos puntos si faltan tras http/https
        href = href
          .replace(/^(https)(?!:)/i, "https:")
          .replace(/^(http)(?!:)/i, "http:");
        // Reparar patrones comunes mal escritos del protocolo
        href = href
          // http:s://... o https:s://... -> https://...
          .replace(/^http:s?:\/\//i, "https://")
          .replace(/^https:s?:\/\//i, "https://")
          // Reparación global de http:s:// / https:s:// en cualquier parte
          .replace(/https?:s?:\/\//gi, (m) =>
            m.toLowerCase().startsWith("http:s") ||
            m.toLowerCase().startsWith("https:s")
              ? "https://"
              : m,
          )
          // https//... o http//... -> https://... / http://...
          .replace(/^https\/\/+/, "https://")
          .replace(/^http\/\/+/, "http://");
        // Normalizar un solo slash después de protocolo a dos
        href = href.replace(/^(https?:)\/(?!\/)/i, (m, proto) => proto + "//");
        // Arreglar https// o http// en cualquier parte (sin colon)
        href = href
          .replace(/https\/\/+?/gi, "https://")
          .replace(/http\/\/+?/gi, "http://");
        // Colapsar repeticiones de protocolo
        href = href.replace(/^(https?:\/\/){2,}/i, (m) =>
          m.substring(0, m.indexOf("//") + 2),
        );
        // Colapsar protocolos duplicados en cualquier lugar (https://https://...)
        href = href.replace(/https?:\/\/https?:\/\//gi, "https://");
        // Reparar ocurrencias internas de https// sin colon
        href = href.replace(/https\/{2}(?=[^:])/gi, "https://");
        // Reparar mezcla https://https// al inicio
        href = href.replace(/^https:\/\/https\/{2}/i, "https://");
        // Colapsar patrón https://https// (segundo sin colon)
        href = href.replace(/https:\/\/https\/\//i, "https://");
        // Si aún quedan múltiples protocolos, tomar la última ocurrencia válida
        const lastHttp = href.toLowerCase().lastIndexOf("http://");
        const lastHttps = href.toLowerCase().lastIndexOf("https://");
        const lastIdx = Math.max(lastHttp, lastHttps);
        if (lastIdx > 0) {
          href = href.slice(lastIdx);
        }
        // Handle instagram tipo @usuario
        if (/^@/.test(href)) {
          const handle = href.replace(/^@+/, "");
          href = `https://instagram.com/${handle}`;
        }
        // Instagram parcial sin protocolo
        if (
          /^(?:www\.)?instagram\.com\//i.test(href) &&
          !/^https?:\/\//i.test(href)
        ) {
          href = `https://${href}`;
        }
        // Dominio sin protocolo
        if (
          !/^(https?:\/\/|tel:|mailto:)/i.test(href) &&
          /[A-Za-z0-9]\.[A-Za-z]/.test(href)
        ) {
          href = `https://${href.replace(/^\/+/, "")}`;
        }
        // Limpiar path de múltiples slashes
        if (/^https?:\/\//i.test(href)) {
          try {
            const u = new URL(href);
            const cleanPath = u.pathname.replace(/\/{2,}/g, "/");
            href = u.origin + cleanPath + u.search + u.hash;
          } catch {}
        }
        // mailto/tel limpieza
        if (/^mailto:/i.test(href)) {
          href = `mailto:${href
            .replace(/^mailto:/i, "")
            .replace(/['\"\s]/g, "")}`;
        } else if (/^tel:/i.test(href)) {
          const num = href.replace(/^tel:/i, "").replace(/[^+\d]/g, "");
          href = `tel:${num}`;
        }
        a.setAttribute("href", href);
        if (!/^tel:|mailto:/i.test(href)) {
          a.setAttribute("target", "_blank");
          a.setAttribute("rel", "noopener noreferrer");
        }
      });
      return div.innerHTML;
    } catch {
      return raw;
    }
  };

  const infoHtmlNewSanitized = useMemo(
    () => sanitizeInfoHtml(hotel.infoHtmlNew),
    [hotel.infoHtmlNew],
  );
  const infoHtmlLegacySanitized = useMemo(
    () => sanitizeInfoHtml(hotel.infoHtml),
    [hotel.infoHtml],
  );

  // Log de HTML sanitizado para diagnóstico de URLs
  useEffect(() => {
    if (hotel.infoHtmlNew || hotel.infoHtml) {
      console.log("[HotelDetail] Datos útiles (sanitized)", {
        infoHtmlNewSanitized,
        infoHtmlLegacySanitized,
      });
    }
  }, [
    hotel.infoHtmlNew,
    hotel.infoHtml,
    infoHtmlNewSanitized,
    infoHtmlLegacySanitized,
  ]);

  // Embla: actualizar índice seleccionado
  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    onSelect();
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  // Lightbox carousel: mantener índice sincronizado
  useEffect(() => {
    if (!lightboxEmblaApi || !isLightboxOpen) return;
    const onSelect = () =>
      setLightboxIndex(lightboxEmblaApi.selectedScrollSnap());
    lightboxEmblaApi.on("select", onSelect);
    onSelect();
    return () => {
      lightboxEmblaApi.off("select", onSelect);
    };
  }, [lightboxEmblaApi, isLightboxOpen]);

  // Al abrir el lightbox, ir al slide correcto
  useEffect(() => {
    if (!isLightboxOpen || !lightboxEmblaApi) return;
    const target = lightboxOpenIndexRef.current || 0;
    // Al abrir: saltar directo al índice (sin animación). Luego las flechas animan normal.
    lightboxEmblaApi.scrollTo(target, true);
    setLightboxIndex(target);
  }, [isLightboxOpen, lightboxEmblaApi]);

  // Sin autoplay: el slider avanza solo con flechas o swipe

  // Limpiar contenido para remover duplicados de datos de contacto
  useEffect(() => {
    const html = hotel.fullContent || "";
    let foundAddress = normalizeAddressText(hotel.address || "");
    html.replace(/<p[^>]*>[\s\S]*?<\/p>/gi, (p) => {
      const text = p
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      const hasAddress = /\b(direcci[oó]n|address|ubicaci[oó]n)\b/i.test(
        text.toLowerCase(),
      );
      if (hasAddress && !foundAddress) {
        const cleanedAddr = text
          .replace(/^\s*(direcci[oó]n|address|ubicaci[oó]n)\s*[:\-]?\s*/i, "")
          .trim();
        if (cleanedAddr) foundAddress = cleanedAddr;
      }
      return p;
    });
    const contactPatterns = [
      /^\s*(direcci[oó]n|address|ubicaci[oó]n)\s*[:\-]?/i,
      /^\s*(web|website|sitio)\s*:?/i,
      /^\s*(instagram)\s*:?/i,
      /^\s*(tel[eé]fono|tel|phone)\s*:?/i,
      /^\s*(email|mail)\s*:?/i,
    ];
    const norm = (s: string) =>
      (s || "")
        .replace(/<[^>]+>/g, " ")
        .replace(/[\s\u00A0]+/g, " ")
        .replace(/[\.,;:]+$/g, "")
        .trim()
        .toUpperCase();
    const addressSet = new Set<string>();
    if (foundAddress) addressSet.add(norm(foundAddress));
    if (hotel.address) addressSet.add(norm(hotel.address));
    (hotel.locations || []).forEach((l) => {
      if (l?.address) addressSet.add(norm(l.address));
    });
    const processed = html.replace(/<p[^>]*>[\s\S]*?<\/p>/gi, (p) => {
      const text = p
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      const isContactLabel = contactPatterns.some((re) => re.test(text));
      const isAddressDuplicate = addressSet.has(norm(text));
      const isContact = isContactLabel || isAddressDuplicate;
      return isContact ? "" : p;
    });
    const inlineUrlRe = /https?:\/\/[^\s<>"']+/gi;
    const inlineWwwRe = /\bwww\.[^\s<>"']+/gi;
    const inlineEmailRe = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
    const processed2 = processed
      .replace(inlineUrlRe, " ")
      .replace(inlineWwwRe, " ")
      .replace(inlineEmailRe, " ")
      .replace(/\s{2,}/g, " ");
    setCleanedFullContent(processed2);
    setAddress(foundAddress);
  }, [hotel.fullContent, hotel.address, hotel.locations]);

  return (
    <>
      {/* Submenú comunas (solo restaurantes) */}
      <div className="site-inner py-2">
        <div className="hidden lg:block">
          {(() => {
            const cats = hotel?.categories || [];
            const up = (cats || []).map((c) => String(c).toUpperCase());
            const isRestaurant =
              up.includes("RESTAURANTES") || up.includes("RESTAURANTS");
            if (!isRestaurant) return null;
            return (
              <nav className="py-4">
                <ul className="hidden lg:flex flex-nowrap items-center gap-2 text-sm font-medium whitespace-nowrap">
                  <li className="flex items-center gap-2">
                    <a
                      href="/restaurantes"
                      className="font-neutra hover:text-[var(--color-brand-red)] transition-colors tracking-wide text-[15px] leading-[20px] text-black"
                    >
                      {t("VOLVER", "BACK")}
                    </a>
                    <span className="text-black">•</span>
                  </li>
                  {restaurantCommunes.map((c, index) => {
                    return (
                      <li key={c.slug} className="flex items-center gap-2">
                        <a
                          href={`/restaurantes?comuna=${c.slug}`}
                          className="font-neutra hover:text-[var(--color-brand-red)] transition-colors tracking-wide text-[15px] leading-[20px] text-black"
                        >
                          {String(c.label).toUpperCase()}
                        </a>
                        {index < restaurantCommunes.length - 1 && (
                          <span className="text-black">•</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </nav>
            );
          })()}
        </div>
      </div>

      <main className="site-inner pt-0 pb-4">
        {showCategoryBanner && (
          <div className="w-full mb-4">
            <BottomHomeBanner />
          </div>
        )}

        {allImages.length > 0 && (
          <div className="mb-4 w-full">
            <div
              className={`relative overflow-hidden h-[55vw] md:h-[45vw] ${
                showCategoryBanner ? "lg:h-[715px]" : "lg:h-[640px]"
              }`}
            >
              {canShowControls && (
                <>
                  <button
                    type="button"
                    aria-label="Imagen previa"
                    onClick={() => emblaApi?.scrollPrev()}
                    className="absolute left-2 md:left-3 top-1/2 -translate-y-1/2 z-10 text-white bg-black/30 hover:bg-black/50 backdrop-blur-[2px] p-2 md:p-3 rounded-full focus:outline-none focus:ring-2 focus:ring-white/70"
                  >
                    <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
                  </button>
                  <button
                    type="button"
                    aria-label="Imagen siguiente"
                    onClick={() => emblaApi?.scrollNext()}
                    className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 z-10 text-white bg-black/30 hover:bg-black/50 backdrop-blur-[2px] p-2 md:p-3 rounded-full focus:outline-none focus:ring-2 focus:ring-white/70"
                  >
                    <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
                  </button>
                </>
              )}
              <div
                ref={emblaRef}
                className="h-full select-none touch-pan-y"
                onPointerDown={(e) => e.preventDefault()}
                onTouchStart={(e) => e.preventDefault()}
              >
                <div className="flex h-full">
                  {allImages.map((src, idx) => (
                    <div
                      key={idx}
                      className="relative min-w-full h-full flex-shrink-0 bg-black"
                    >
                      <Image
                        src={src || "/placeholder.svg"}
                        alt={`${hotel.name} ${idx + 1}`}
                        fill
                        priority={idx === 0}
                        draggable={false}
                        className="object-cover cursor-pointer"
                        onDragStart={(e) => e.preventDefault()}
                        onClick={() => {
                          lightboxOpenIndexRef.current = idx;
                          setLightboxIndex(idx);
                          setIsLightboxOpen(true);
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {allImages.length > 1 && (
              <div className="mt-3 w-full flex justify-center">
                <div className="flex gap-2" aria-hidden="true">
                  {allImages.map((_, dotIdx) => (
                    <span
                      key={dotIdx}
                      className={`rounded-full transition-all ${
                        dotIdx === selectedIndex
                          ? "bg-[#E40E36] w-3 h-3"
                          : "bg-gray-300 w-2 h-2"
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {isLightboxOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            role="dialog"
            aria-modal="true"
            onClick={() => setIsLightboxOpen(false)}
          >
            <div
              className="relative w-full max-w-6xl h-[80vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div
                ref={lightboxEmblaRef}
                className="h-full overflow-hidden select-none touch-pan-y"
                onPointerDown={(e) => e.preventDefault()}
                onTouchStart={(e) => e.preventDefault()}
              >
                <div className="flex h-full">
                  {allImages.map((src, idx) => (
                    <div
                      key={idx}
                      className="relative min-w-full h-full flex-shrink-0"
                    >
                      <Image
                        src={src || "/placeholder.svg"}
                        alt={`Imagen ${idx + 1}`}
                        fill
                        draggable={false}
                        className="object-contain"
                        onDragStart={(e) => e.preventDefault()}
                      />
                    </div>
                  ))}
                </div>
              </div>
              <button
                onClick={() => setIsLightboxOpen(false)}
                className="absolute top-4 right-4 text-white bg-black/40 p-2 rounded-full"
                aria-label="Cerrar imagen"
              >
                ✕
              </button>
              <button
                onClick={() => lightboxEmblaApi?.scrollPrev()}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white bg-black/30 p-2 rounded-full"
                aria-label="Imagen previa"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={() => lightboxEmblaApi?.scrollNext()}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white bg-black/30 p-2 rounded-full"
                aria-label="Imagen siguiente"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </div>
        )}

        {isLightboxOpen && (
          <KeyboardNavigation onClose={() => setIsLightboxOpen(false)} />
        )}

        <div className="max-w-[1024px] mx-auto">
          <div className="flex items-start gap-[10px] mb-3">
            <div className="flex-shrink-0">
              <Image
                src="/favicon.svg"
                alt="Chile Adicto"
                width={40}
                height={50}
              />
            </div>
            <div className="text-left">
              <h1 className="font-neutra text-[20px] leading-[24px] text-black">
                {hotel.name &&
                  hotel.name
                    .replace(/<br\s*\/??>/gi, "\n")
                    .split("\n")
                    .map((line, i) => (
                      <span
                        key={i}
                        className="block font-neutra !text-[20px] !leading-[24px] text-black font-[700]"
                        dangerouslySetInnerHTML={{ __html: line }}
                      />
                    ))}
              </h1>
              <h2
                className="font-neutra text-[20px] leading-[24px] font-[100] text-black uppercase"
                dangerouslySetInnerHTML={{ __html: hotel.subtitle }}
              />
            </div>
          </div>
          <div
            className="prose prose-lg max-w-none mb-8 font-neutra text-black leading-relaxed [&>h3]:text-[15px] [&>h3]:font-[700] [&>h3]:mt-8 [&>h3]:mb-4 [&>h3]:leading-[22px] [&>h3]:lowercase [&>h3]:first-letter:uppercase [&>p]:mb-4 [&>p]:text-[15px] [&>p]:leading-[22px] [&>p]:font-[400] [&_a]:text-[var(--color-brand-red)] [&_a]:no-underline hover:[&_a]:underline [&_.divider]:text-gray-300 [&_.divider]:text-center [&_.divider]:my-8"
            dangerouslySetInnerHTML={{ __html: cleanedFullContent }}
          />
          <div className="my-5">
            <div
              className="mx-auto h-[3px] w-full bg-transparent"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(to right, #b4b4b8 0 3px, transparent 3px 6px)",
              }}
            />
          </div>
          {!hideUsefulInfo && (
            <div className="mt-4 mb-4 font-neutra text-black text-[15px] leading-[22px]">
              {hotel.infoHtmlNew ? (
              <>
                <h3 className="font-neutra text-[15px] leading-[22px] font-[700] uppercase text-black mb-3">
                  {t("DATOS ÚTILES", "USEFUL INFORMATION")}
                </h3>
                <div
                  className="prose prose-sm md:prose-base max-w-none font-neutra text-black text-[15px] leading-[22px] [&_*]:text-[15px] [&_strong]:font-[700] [&_em]:italic [&_a]:text-[var(--color-brand-red)] [&_a]:no-underline hover:[&_a]:underline"
                  dangerouslySetInnerHTML={{ __html: infoHtmlNewSanitized }}
                />
              </>
              ) : hotel.infoHtml ? (
              <>
                <h3 className="font-neutra text-[15px] leading-[22px] font-[700] uppercase text-black mb-3">
                  {t("DATOS ÚTILES", "USEFUL INFORMATION")}
                </h3>
                <div
                  className="prose prose-sm md:prose-base max-w-none font-neutra text-black text-[15px] leading-[22px] [&_*]:text-[15px] [&_strong]:font-[700] [&_em]:italic [&_a]:text-[var(--color-brand-red)] [&_a]:no-underline hover:[&_a]:underline"
                  dangerouslySetInnerHTML={{ __html: infoHtmlLegacySanitized }}
                />
              </>
              ) : (
              <>
                <h3 className="font-neutra text-[15px] leading-[22px] font-[700] uppercase text-black mb-3">
                  {t("DATOS ÚTILES", "USEFUL INFORMATION")}
                </h3>
                {hotel.locations && hotel.locations.length > 0 ? (
                  <div className="mb-2">
                    <div className="mr-2 inline-block">
                      {t("DIRECCIÓN", "ADDRESS")}:{" "}
                    </div>
                    <div className="mt-1">
                      {hotel.locations.map((loc, idx) => (
                        <div key={idx} className="mb-1">
                          {loc.label ? (
                            <>
                              <span className="mr-2">
                                {String(loc.label).toUpperCase()}:
                              </span>
                              <span className="text-black">
                                {normalizeAddressText(
                                  loc.address || "",
                                ).toUpperCase()}
                              </span>
                              {loc.hours && (
                                <span className="text-black">
                                  {" "}
                                  {`(${loc.hours})`}
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-black">
                              {normalizeAddressText(
                                loc.address || "",
                              ).toUpperCase()}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  address && (
                    <div className="mb-2">
                      <span className="mr-2">
                        {t("DIRECCIÓN", "ADDRESS")}:{" "}
                      </span>
                      <span className="text-black">
                        {address.toUpperCase()}
                      </span>
                    </div>
                  )
                )}
                <div className="mb-2">
                  <span className="mr-2">{t("WEB", "WEB")}: </span>
                  {hotel.website ? (
                    <a
                      href={formatWebsiteHref(hotel.website)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--color-brand-red)] no-underline"
                    >
                      {formatWebsiteDisplay(
                        hotel.website_display || hotel.website,
                      )}
                    </a>
                  ) : (
                    <span className="text-black">
                      {t(
                        "NO POSEE UN SITIO WEB OFICIAL",
                        "NO OFFICIAL WEBSITE",
                      )}
                    </span>
                  )}
                </div>
                {hotel.instagram && (
                  <div className="mb-2">
                    <span className="mr-2">
                      {t("INSTAGRAM", "INSTAGRAM")}:{" "}
                    </span>
                    <a
                      href={hotel.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--color-brand-red)] no-underline"
                    >
                      {(
                        hotel.instagram_display ||
                        formatInstagramDisplay(hotel.instagram)
                      ).toUpperCase()}
                    </a>
                  </div>
                )}
                {hotel.hours && (
                  <div className="mb-2">
                    <span className="mr-2">{t("HORARIO", "HOURS")}: </span>
                    <span className="text-black">{hotel.hours}</span>
                  </div>
                )}
                {(hotel.reservationPolicy || hotel.reservationLink) && (
                  <div className="mb-2">
                    <span className="mr-2">
                      {t("RESERVAS", "RESERVATIONS")}:{" "}
                    </span>
                    {hotel.reservationLink ? (
                      <a
                        href={hotel.reservationLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[var(--color-brand-red)] no-underline"
                      >
                        {hotel.reservationPolicy || hotel.reservationLink}
                      </a>
                    ) : (
                      <span className="text-black">
                        {hotel.reservationPolicy}
                      </span>
                    )}
                  </div>
                )}
                {hotel.interestingFact && (
                  <div className="mb-2">
                    <span className="mr-2">
                      {t("DATO DE INTERÉS", "INTERESTING FACT")}:{" "}
                    </span>
                    <span className="text-black">{hotel.interestingFact}</span>
                  </div>
                )}
                {hotel.locations && hotel.locations.length > 0 && (
                  <div className="mt-5">
                    {hotel.locations.map((loc, idx) => {
                      const hasExtra = !!(
                        loc.website ||
                        loc.instagram ||
                        loc.hours ||
                        loc.reservationLink ||
                        loc.reservationPolicy ||
                        loc.interestingFact ||
                        loc.email ||
                        loc.phone
                      );
                      if (!hasExtra) return null;
                      return (
                        <div key={idx} className="mb-4">
                          {loc.label && (
                            <div className="font-neutra text-[15px] leading-[22px] font-normal uppercase text-black mb-2">
                              {String(loc.label)}
                            </div>
                          )}
                          {loc.address && (
                            <div className="mb-1">
                              <span className="mr-2">
                                {t("DIRECCIÓN", "ADDRESS")}:{" "}
                              </span>
                              <span className="text-black">
                                {normalizeAddressText(
                                  loc.address,
                                ).toUpperCase()}
                              </span>
                            </div>
                          )}
                          {loc.website && (
                            <div className="mb-1">
                              <span className="mr-2">{t("WEB", "WEB")}: </span>
                              <a
                                href={formatWebsiteHref(loc.website)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[var(--color-brand-red)] no-underline"
                              >
                                {formatWebsiteDisplay(
                                  loc.website_display || loc.website,
                                )}
                              </a>
                            </div>
                          )}
                          {loc.instagram && (
                            <div className="mb-1">
                              <span className="mr-2">
                                {t("INSTAGRAM", "INSTAGRAM")}:{" "}
                              </span>
                              <a
                                href={loc.instagram}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[var(--color-brand-red)] no-underline"
                              >
                                {(
                                  loc.instagram_display ||
                                  formatInstagramDisplay(loc.instagram)
                                ).toUpperCase()}
                              </a>
                            </div>
                          )}
                          {loc.hours && (
                            <div className="mb-1">
                              <span className="mr-2">
                                {t("HORARIO", "HOURS")}:{" "}
                              </span>
                              <span className="text-black">{loc.hours}</span>
                            </div>
                          )}
                          {(loc.reservationPolicy || loc.reservationLink) && (
                            <div className="mb-1">
                              <span className="mr-2">
                                {t("RESERVAS", "RESERVATIONS")}:{" "}
                              </span>
                              {loc.reservationLink ? (
                                <a
                                  href={loc.reservationLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[var(--color-brand-red)] no-underline"
                                >
                                  {loc.reservationPolicy || loc.reservationLink}
                                </a>
                              ) : (
                                <span className="text-black">
                                  {loc.reservationPolicy}
                                </span>
                              )}
                            </div>
                          )}
                          {loc.interestingFact && (
                            <div className="mb-1">
                              <span className="mr-2">
                                {t("DATO DE INTERÉS", "INTERESTING FACT")}:{" "}
                              </span>
                              <span className="text-black">
                                {loc.interestingFact}
                              </span>
                            </div>
                          )}
                          {loc.phone && (
                            <div className="mb-1">
                              <span className="mr-2">{t("TEL", "TEL")}: </span>
                              <a
                                href={formatTel(loc.phone)}
                                className="text-[var(--color-brand-red)] no-underline"
                              >
                                {formatPhoneDisplay(loc.phone).toUpperCase()}
                              </a>
                            </div>
                          )}
                          {loc.email && (
                            <div className="mb-1">
                              <span className="mr-2">
                                {t("EMAIL", "EMAIL")}:{" "}
                              </span>
                              <a
                                href={formatMailto(loc.email)}
                                className="text-[var(--color-brand-red)] no-underline"
                              >
                                {stripMailto(loc.email).toUpperCase()}
                              </a>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
                {hotel.phone && (
                  <div className="mb-2">
                    <span className="mr-2">{t("TEL", "TEL")}: </span>
                    <a
                      href={formatTel(hotel.phone)}
                      className="text-[var(--color-brand-red)] no-underline"
                    >
                      {formatPhoneDisplay(hotel.phone).toUpperCase()}
                    </a>
                  </div>
                )}
                {hotel.email && (
                  <div className="mb-2">
                    <span className="mr-2">{t("EMAIL", "EMAIL")}: </span>
                    <a
                      href={formatMailto(hotel.email)}
                      className="text-[var(--color-brand-red)] no-underline"
                    >
                      {stripMailto(hotel.email).toUpperCase()}
                    </a>
                  </div>
                )}
                {hotel.photosCredit && (
                  <div className="mb-2 text-[15px] text-black">
                    <span className="mr-2">
                      {t("FOTOGRAFÍAS", "PHOTOGRAPHS")}:{" "}
                    </span>
                    <span>{hotel.photosCredit.toUpperCase()}</span>
                  </div>
                )}
              </>
            )}
            </div>
          )}

          {!hideReservationIcon && (
            <>
              {hotel.reservationLink ? (
                <a
                  href={hotel.reservationLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 mb-2 inline-block"
                >
                  <ComentaIcon className="w-[100px] h-auto hover:opacity-80 transition-opacity" />
                </a>
              ) : (
                <div className="mt-2 mb-2">
                  <ComentaIcon className="w-[100px] h-auto" />
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
}

function KeyboardNavigation({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return null;
}

// Helpers for link formatting
function stripProtocol(url: string) {
  return url.replace(/^https?:\/\//i, "");
}

function formatWebsiteDisplay(url: string) {
  if (!url) return url;
  const withProto = url.startsWith("http") ? url : `https://${url}`;
  try {
    const u = new URL(withProto);
    // Mostrar siempre con WWW. al inicio (en mayúsculas) si no lo tiene ya
    const host = u.host.toUpperCase();
    return host.startsWith("WWW.") ? host : `WWW.${host}`;
  } catch (e) {
    return url;
  }
}

function formatWebsiteHref(url: string) {
  if (!url) return "#";
  // Si ya incluye protocolo, retornar tal cual; si no, anteponer https://
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url.replace(/^www\./i, "www.")}`;
}

function formatMailto(email: string) {
  if (!email) return "";
  return email.startsWith("mailto:") ? email : `mailto:${email}`;
}

function stripMailto(email: string) {
  return email.replace(/^mailto:/i, "");
}

function formatTel(phone: string) {
  if (!phone) return "";
  if (phone.startsWith("tel:")) return phone;
  // Remove spaces and non-digits except +
  const cleaned = phone.replace(/[^+\d]/g, "");
  return `tel:${cleaned}`;
}

function formatPhoneDisplay(phone: string) {
  // Show user-friendly phone (keep + and numbers)
  return phone.replace(/^tel:/i, "");
}

function formatInstagramDisplay(inst: string) {
  if (!inst) return inst;
  // if it's a full url, extract handle
  try {
    if (/^https?:\/\//i.test(inst)) {
      const u = new URL(inst);
      const p = u.pathname.replace(/^\//, "");
      return p ? `@${p}` : u.host;
    }
  } catch (e) {}
  if (inst.startsWith("@")) return inst;
  return `@${inst
    .replace(/^https?:\/\//i, "")
    .split("/")
    .pop()}`;
}

// Helpers for address normalization
function normalizeAddressText(s: string) {
  if (!s) return "";
  const txt = String(s)
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  // remove leading labels like DIRECCIÓN:, ADDRESS:, UBICACIÓN:
  return txt.replace(
    /^\s*(direcci[oó]n|address|ubicaci[oó]n)\s*[:\-]?\s*/i,
    "",
  );
}

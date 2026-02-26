"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { LanguageSwitcher } from "./language-switcher";
import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/contexts/language-context";
import { useSiteApi } from "@/hooks/use-site-api";

interface MobileFooterContentProps {
  onNavigate?: () => void; // cerrar menú al navegar
  showMenu?: boolean;
}
export function MobileFooterContent({
  onNavigate,
  showMenu = true,
}: MobileFooterContentProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { language } = useLanguage();
  const { fetchWithSite } = useSiteApi();

  type ApiCategoryRow = {
    slug: string;
    label_es: string | null;
    label_en?: string | null;
    show_in_menu?: boolean | null;
  };

  type ApiCommuneRow = {
    slug: string;
    label: string | null;
    show_in_menu?: boolean | null;
    menu_order?: number | null;
  };

  const fallbackCommunes = [
    { slug: "vitacura", label: "Vitacura" },
    { slug: "las-condes", label: "Las Condes" },
    { slug: "santiago", label: "Santiago" },
    { slug: "lo-barnechea", label: "Lo Barnechea" },
    { slug: "providencia", label: "Providencia" },
    { slug: "alto-jahuel", label: "Alto Jahuel" },
    { slug: "la-reina", label: "La Reina" },
  ];

  const [restaurantCommunes, setRestaurantCommunes] =
    useState(fallbackCommunes);

  const activeComunaParam = searchParams?.get("comuna") || null;
  const activeComunaSlug = activeComunaParam
    ? String(activeComunaParam).trim().toLowerCase()
    : null;

  // Detectar si estamos navegando la categoría restaurantes
  const isRestaurantsCategory =
    pathname?.startsWith("/restaurantes") ||
    pathname?.startsWith("/categoria/restaurantes");

  useEffect(() => {
    if (!isRestaurantsCategory) return;
    let cancelled = false;
    fetchWithSite("/api/communes?nav=1", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : []))
      .then((rows) => {
        if (cancelled) return;
        const list: ApiCommuneRow[] = Array.isArray(rows) ? rows : [];
        const mapped = list
          .filter((x) => x && x.slug && x.show_in_menu !== false)
          .map((x) => ({
            slug: String(x.slug),
            label: String(x.label || String(x.slug).replace(/-/g, " ")),
          }))
          .filter((x) => x.slug);
        if (mapped.length > 0) setRestaurantCommunes(mapped);
        else setRestaurantCommunes(fallbackCommunes);
      })
      .catch(() => !cancelled && setRestaurantCommunes(fallbackCommunes));
    return () => {
      cancelled = true;
    };
  }, [isRestaurantsCategory, fetchWithSite]);

  // Fallback hardcodeado (mismo orden histórico)
  const fallbackItems = [
    { slug: "todos", labelEs: "TODOS", labelEn: "ALL" },
    { slug: "arquitectura", labelEs: "ARQ", labelEn: "ARQ" },
    { slug: "barrios", labelEs: "BARRIOS", labelEn: "NEIGHBORHOODS" },
    { slug: "iconos", labelEs: "ICONOS", labelEn: "ICONS" },
    { slug: "mercados", labelEs: "MERCADOS", labelEn: "MARKETS" },
    { slug: "miradores", labelEs: "MIRADORES", labelEn: "VIEWPOINTS" },
    { slug: "museos", labelEs: "CULTURA", labelEn: "MUSEUMS" },
    { slug: "palacios", labelEs: "PALACIOS", labelEn: "PALACES" },
    { slug: "parques", labelEs: "PARQUES", labelEn: "PARKS" },
    {
      slug: "paseos-fuera-de-santiago",
      labelEs: "FUERA DE STGO",
      labelEn: "TRIPS OUTSIDE SANTIAGO",
    },
    { slug: "ninos", labelEs: "NIÑOS", labelEn: "KIDS" },
    // RESTAURANTES truncado en front
    { slug: "restaurantes", labelEs: "RESTOS", labelEn: "REST" },
  ];

  const [items, setItems] = useState<typeof fallbackItems>([]);
  const [isMenuLoading, setIsMenuLoading] = useState(true);

  const prettySlugs = useMemo(
    () =>
      new Set([
        "iconos",
        "ninos",
        "arquitectura",
        "barrios",
        "mercados",
        "miradores",
        "museos",
        "palacios",
        "parques",
        "paseos-fuera-de-santiago",
        "restaurantes",
      ]),
    [],
  );

  const hrefFor = (slug: string) => {
    if (slug === "todos") return "/";
    if (slug === "nosotros") return "/nosotros";
    if (slug === "restaurantes") return "/restaurantes";
    return prettySlugs.has(slug) ? `/${slug}` : `/categoria/${slug}`;
  };

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetchWithSite("/api/categories?full=1&nav=1", {
          cache: "no-store",
        });
        const json = res.ok ? await res.json() : [];
        const rows: ApiCategoryRow[] = Array.isArray(json) ? json : [];

        // Mapear categorías (si el slug no tiene rewrite, igual funciona con /categoria/<slug>)
        const mapped = rows
          .filter((r) => r && r.slug)
          .map((r) => {
            const slug = String(r.slug);
            const fallback = fallbackItems.find((x) => x.slug === slug);

            // Overrides solo en front
            if (slug === "restaurantes") {
              return { slug, labelEs: "RESTOS", labelEn: "REST" };
            }

            const labelEs = String(
              r.label_es || fallback?.labelEs || slug.toUpperCase(),
            ).toUpperCase();
            const labelEn = String(
              r.label_en || fallback?.labelEn || slug,
            ).toUpperCase();
            return { slug, labelEs, labelEn };
          })
          // nunca dependemos de que venga "todos" desde la BD
          .filter((x) => x.slug !== "todos");

        const restaurants = mapped.filter((x) => x.slug === "restaurantes");
        const tienda = mapped.filter(
          (x) => x.slug === "tienda" || x.slug === "tiendas",
        );
        const others = mapped.filter(
          (x) =>
            x.slug !== "restaurantes" &&
            x.slug !== "tienda" &&
            x.slug !== "tiendas",
        );
        const finalList = [
          fallbackItems[0],
          ...others,
          ...restaurants,
          ...tienda,
        ];

        if (!cancelled) {
          if (finalList.length) {
            setItems(finalList);
            // Debug solicitado: imprimir opciones reales del sitio
            console.log(
              "[MobileMenu] opciones de menú cargadas",
              finalList.map((x) => x.slug),
            );
          } else {
            setItems([]);
          }
          setIsMenuLoading(false);
        }
      } catch {
        if (!cancelled) {
          // No mostrar categorías del otro sitio si falla la carga
          setItems([]);
          setIsMenuLoading(false);
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [fetchWithSite]);

  return (
    <div>
      {/* Logo (blanco) */}
      <div className="mb-8 flex justify-center">
        <div className="w-48">
          <Image
            src="/Logo-best-espanol-blanco-footer.svg"
            alt="Chile Adicto"
            width={240}
            height={72}
            className="w-full h-auto"
          />
        </div>
      </div>

      {/* Subtitle divider removed - handled on page content */}

      {showMenu ? (
        <nav className="mb-8 space-y-8">
          {isRestaurantsCategory ? (
            // Submenú de comunas en formato vertical (una debajo de otra)
            <ul className="space-y-4 text-center">
              <li>
                <Link
                  href="/restaurantes"
                  className={`font-neutra-demi text-[14px] leading-[19px] font-[600] transition-colors ${
                    !activeComunaSlug ? "text-[#E40E36]" : "text-white"
                  } hover:text-gray-300`}
                  onClick={() => onNavigate?.()}
                >
                  VOLVER
                </Link>
              </li>
              {restaurantCommunes.map((c) => {
                const isActive =
                  !!activeComunaSlug &&
                  activeComunaSlug === c.slug.toLowerCase();
                return (
                  <li key={c.slug}>
                    <Link
                      href={`/restaurantes?comuna=${c.slug}`}
                      className={`font-neutra-demi text-[14px] leading-[19px] font-[600] transition-colors ${
                        isActive ? "text-[#E40E36]" : "text-white"
                      } hover:text-gray-300`}
                      onClick={() => onNavigate?.()}
                    >
                      {String(c.label).toUpperCase()}
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : isMenuLoading ? (
            <ul className="space-y-4 text-center">
              {Array.from({ length: 10 }).map((_, i) => (
                <li key={i} className="flex justify-center">
                  <span className="inline-block h-[19px] w-[180px] rounded bg-white/15 animate-pulse" />
                </li>
              ))}
            </ul>
          ) : (
            <ul className="space-y-4 text-center">
              {items.map((item) => (
                <li key={item.slug}>
                  <Link
                    href={hrefFor(item.slug)}
                    className="font-neutra-demi text-[14px] leading-[19px] font-[600] text-white hover:text-gray-300 transition-colors"
                    onClick={() => onNavigate?.()}
                  >
                    {language === "es" ? item.labelEs : item.labelEn}
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {/* Language Switcher al final del bloque de navegación */}
          <div className="pt-6 flex justify-center">
            <LanguageSwitcher dark />
          </div>
        </nav>
      ) : (
        <div className="mb-8 flex justify-center">
          <LanguageSwitcher dark />
        </div>
      )}

      {/* Contact: top divider spans site content width */}
      <div className="w-full px-4 mb-12">
        <div className="max-w-7xl mx-auto border-t-[3px] border-white/30 pt-8 text-center">
          <a
            href="mailto:PATO@CLOSER.CL"
            className="text-white text-sm hover:text-gray-300 transition-colors"
          >
            PATO@CLOSER.CL
          </a>
        </div>
      </div>

      {/* Bottom Logos */}
      <div className="grid grid-cols-2 gap-6 max-w-md mx-auto">
        <div className="flex justify-center">
          <Image
            src="/chilehoteles-blancos-footer.svg"
            alt="Chile Hoteles"
            width={120}
            height={48}
            className="h-12 w-auto"
          />
        </div>
        <div className="flex justify-center">
          <Image
            src="/chile-blanco-1-footer.svg"
            alt="Chile"
            width={80}
            height={48}
            className="h-12 w-auto"
          />
        </div>
        <div className="flex justify-center">
          <Image
            src="/santiago-adicto-blanco-4-footer.svg"
            alt="Stgo adicto"
            width={120}
            height={48}
            className="h-12 w-auto"
          />
        </div>
        <div className="flex justify-center">
          <Image
            src="/wecare-blaco-2-footer.svg"
            alt="WE CARE"
            width={96}
            height={96}
            className="h-24 w-auto border border-white p-1"
          />
        </div>
      </div>
    </div>
  );
}

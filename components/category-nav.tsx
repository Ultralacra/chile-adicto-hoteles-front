"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/contexts/language-context";
import { useSiteApi } from "@/hooks/use-site-api";

interface CategoryNavProps {
  activeCategory?: string;
  compact?: boolean; // reduce padding vertical (posts)
}

const fallbackCategories = [
  { slug: "todos", labelEs: "TODOS", labelEn: "ALL" },
  { slug: "arquitectura", labelEs: "ARQ", labelEn: "ARQ" },
  { slug: "barrios", labelEs: "BARRIOS", labelEn: "Neighborhoods" },
  { slug: "iconos", labelEs: "ICONOS", labelEn: "Icons" },
  { slug: "mercados", labelEs: "MERCADOS", labelEn: "Markets" },
  { slug: "miradores", labelEs: "MIRADORES", labelEn: "Viewpoints" },
  // Display label in ES should be "CULTURA" though slug remains "museos"
  { slug: "museos", labelEs: "CULTURA", labelEn: "Museums" },
  { slug: "palacios", labelEs: "PALACIOS", labelEn: "Palaces" },
  { slug: "parques", labelEs: "PARQUES", labelEn: "Parks" },
  {
    slug: "paseos-fuera-de-santiago",
    // Display label in ES should be "FUERA DE STGO" though slug remains
    labelEs: "FUERA DE STGO",
    labelEn: "TRIPS OUTSIDE SANTIAGO",
  },
  { slug: "ninos", labelEs: "NIÑOS", labelEn: "KIDS" },
  {
    slug: "monumentos-nacionales",
    labelEs: "MONUMENTOS",
    labelEn: "MONUMENTS",
  },
  { slug: "cafes", labelEs: "CAFÉS", labelEn: "CAFÉS" },
  { slug: "restaurantes", labelEs: "RESTOS", labelEn: "REST" },
];

type ApiCategoryRow = {
  slug: string;
  label_es: string | null;
  label_en: string | null;
  show_in_menu?: boolean | null;
  menu_order?: number | null;
};

const prettySlugs = new Set([
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
]);

export function CategoryNav({
  activeCategory = "todos",
  compact = false,
}: CategoryNavProps) {
  const { language } = useLanguage();
  const { fetchWithSite } = useSiteApi();
  const [items, setItems] = useState<typeof fallbackCategories>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetchWithSite("/api/categories?full=1&nav=1", {
          cache: "no-store",
        });
        const json = res.ok ? await res.json() : [];
        const rows: ApiCategoryRow[] = Array.isArray(json) ? json : [];
        const mapped = rows
          .filter((r) => r && r.slug)
          .map((r) => {
            const slug = String(r.slug);
            const fallback = fallbackCategories.find((c) => c.slug === slug);

            // Overrides solo en front
            if (slug === "restaurantes") {
              return { slug, labelEs: "RESTOS", labelEn: "REST" };
            }

            return {
              slug,
              labelEs: String(
                r.label_es || fallback?.labelEs || slug.toUpperCase(),
              ).toUpperCase(),
              labelEn: String(
                r.label_en || fallback?.labelEn || slug,
              ).toUpperCase(),
            };
          });

        // Asegurar orden estable:
        // - "todos" primero
        // - "restaurantes" cerca del final
        // - "tienda/tiendas" siempre al final
        const todos = mapped.find((x) => x.slug === "todos");
        const rest = mapped.filter((x) => x.slug !== "todos");
        const restaurants = rest.filter((x) => x.slug === "restaurantes");
        const tienda = rest.filter(
          (x) => x.slug === "tienda" || x.slug === "tiendas",
        );
        const others = rest.filter(
          (x) =>
            x.slug !== "restaurantes" &&
            x.slug !== "tienda" &&
            x.slug !== "tiendas",
        );
        const finalList = [
          todos || fallbackCategories[0],
          ...others,
          ...restaurants,
          ...tienda,
        ];

        if (!cancelled) {
          if (finalList.length) {
            setItems(finalList);
            // Debug solicitado: imprimir opciones reales del sitio
            console.log(
              "[CategoryNav] opciones de menú cargadas",
              finalList.map((x) => x.slug),
            );
          } else {
            setItems([]);
          }
          setIsLoading(false);
        }
      } catch {
        if (!cancelled) {
          // No mostrar categorías del otro sitio si falla la carga
          setItems([]);
          setIsLoading(false);
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [fetchWithSite]);

  const hrefFor = (slug: string) => {
    if (slug === "todos") return "/";
    if (slug === "nosotros") return "/nosotros";
    // Mantener URL bonita si existe rewrite; si no, usar /categoria/<slug>
    return prettySlugs.has(slug) ? `/${slug}` : `/categoria/${slug}`;
  };

  return (
    // Hide desktop category nav on small screens; mobile menu provides navigation
    <nav className={compact ? "py-2" : "py-4"}>
      {isLoading ? (
        <ul className="hidden lg:flex flex-nowrap items-center gap-2 text-sm font-medium whitespace-nowrap">
          {Array.from({ length: 10 }).map((_, i) => (
            <li key={i} className="flex items-center gap-2">
              <span className="inline-block h-[19px] w-[62px] rounded bg-black/10 animate-pulse" />
              {i < 9 && <span className="text-black">•</span>}
            </li>
          ))}
        </ul>
      ) : items.length ? (
        <ul className="hidden lg:flex flex-nowrap items-center gap-2 text-sm font-medium whitespace-nowrap">
          {items.map((category, index) => (
            <li key={category.slug} className="flex items-center gap-2">
              <Link
                href={hrefFor(category.slug)}
                className={`font-neutra hover:text-[var(--color-brand-red)] transition-colors tracking-wide text-[14px] leading-[19px] ${
                  activeCategory === category.slug
                    ? "text-[var(--color-brand-red)] font-normal"
                    : "text-black font-normal"
                }`}
              >
                {language === "es"
                  ? category.labelEs
                  : category.labelEn.toUpperCase()}
              </Link>
              {index < items.length - 1 && (
                <span className="text-black">•</span>
              )}
            </li>
          ))}
        </ul>
      ) : null}
    </nav>
  );
}

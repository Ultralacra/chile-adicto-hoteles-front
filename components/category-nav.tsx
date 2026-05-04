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
  { slug: "norte", labelEs: "NORTE", labelEn: "NORTH" },
  { slug: "centro", labelEs: "CENTRO", labelEn: "CENTER" },
  { slug: "sur", labelEs: "SUR", labelEn: "SOUTH" },
  {
    slug: "isla-de-pascua",
    labelEs: "ISLA DE PASCUA",
    labelEn: "EASTER ISLAND",
  },
  { slug: "santiago", labelEs: "SANTIAGO", labelEn: "SANTIAGO" },
  { slug: "guia-impresa", labelEs: "GUÍA IMPRESA", labelEn: "PRINT GUIDE" },
  { slug: "prensa", labelEs: "PRENSA", labelEn: "PRESS" },
  {
    slug: "exploraciones-tnf",
    labelEs: "COLUMBIA TNF",
    labelEn: "COLUMBIA TNF",
  },
  { slug: "nosotros", labelEs: "NOSOTROS", labelEn: "ABOUT US" },
];

const fixedMenuOrder = [
  "todos",
  "norte",
  "centro",
  "sur",
  "isla-de-pascua",
  "santiago",
  "guia-impresa",
  "prensa",
  "nosotros",
  "exploraciones-tnf",
];

type ApiCategoryRow = {
  slug: string;
  label_es: string | null;
  label_en: string | null;
  show_in_menu?: boolean | null;
  menu_order?: number | null;
};

const normalizeSlug = (value: string) => String(value).trim().toLowerCase();

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
            const slug = normalizeSlug(r.slug);
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

        const uniqueBySlug = new Map<string, (typeof mapped)[number]>();
        for (const item of mapped) {
          const key = normalizeSlug(item.slug);
          if (!uniqueBySlug.has(key)) uniqueBySlug.set(key, item);
        }

        if (!uniqueBySlug.has("todos")) {
          uniqueBySlug.set("todos", fallbackCategories[0]);
        }

        const finalList = fixedMenuOrder
          .map((slug) => {
            const fromApi = uniqueBySlug.get(slug);
            const fallback = fallbackCategories.find((x) => x.slug === slug);
            return fromApi || fallback;
          })
          .filter((item): item is (typeof fallbackCategories)[number] =>
            Boolean(item),
          );

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
    const normalizedSlug = normalizeSlug(slug);
    if (normalizedSlug === "todos") return "/";
    if (normalizedSlug === "nosotros") return "/nosotros";
    if (normalizedSlug === "guia-impresa") return "/CHAH-2025-baja.pdf";
    // Mantener URL bonita si existe rewrite; si no, usar /categoria/<slug>
    return prettySlugs.has(normalizedSlug)
      ? `/${normalizedSlug}`
      : `/categoria/${normalizedSlug}`;
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
              {normalizeSlug(category.slug) === "guia-impresa" ? (
                <a
                  href={hrefFor(category.slug)}
                  download
                  className={`font-neutra hover:text-[var(--color-brand-red)] transition-colors tracking-wide text-[14px] leading-[19px] ${
                    normalizeSlug(activeCategory) ===
                    normalizeSlug(category.slug)
                      ? "text-[var(--color-brand-red)] font-normal"
                      : "text-black font-normal"
                  }`}
                >
                  {language === "es"
                    ? category.labelEs
                    : category.labelEn.toUpperCase()}
                </a>
              ) : (
                <Link
                  href={hrefFor(category.slug)}
                  className={`font-neutra hover:text-[var(--color-brand-red)] transition-colors tracking-wide text-[14px] leading-[19px] ${
                    normalizeSlug(activeCategory) ===
                    normalizeSlug(category.slug)
                      ? "text-[var(--color-brand-red)] font-normal"
                      : "text-black font-normal"
                  }`}
                >
                  {language === "es"
                    ? category.labelEs
                    : category.labelEn.toUpperCase()}
                </Link>
              )}
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

"use client";

import Image from "next/image";
import { MobileFooterContent } from "./mobile-footer-content";
import { useLanguage } from "@/contexts/language-context";
import { useEffect, useState } from "react";
import { useSiteApi } from "@/hooks/use-site-api";

interface FooterProps {
  activeCategory?: string;
}

export function Footer({ activeCategory = "todos" }: FooterProps) {
  const { language } = useLanguage();
  const { fetchWithSite } = useSiteApi();
  const [footerCategories, setFooterCategories] = useState<any[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  const normalizeSlug = (value: string) => {
    const slug = String(value).trim().toLowerCase();
    if (slug === "hoteles-de-nieve") return "hotel-de-nieve";
    if (slug === "hoteles-de-vina") return "hotel-de-vina";
    return slug;
  };

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
    {
      slug: "guia-impresa",
      labelEs: "GUÍA IMPRESA",
      labelEn: "PRINT GUIDE",
    },
    { slug: "prensa", labelEs: "PRENSA", labelEn: "PRESS" },
    {
      slug: "exploraciones",
      labelEs: "EXPLORACIONES COLUMBIA",
      labelEn: "COLUMBIA EXPLORATIONS",
    },
    { slug: "nosotros", labelEs: "NOSOTROS", labelEn: "ABOUT US" },
    { slug: "bases-legales", labelEs: "BASES LEGALES", labelEn: "LEGAL BASIS" },
  ];

  const fixedMenuOrder = [
    "todos",
    "norte",
    "centro",
    "sur",
    "santiago",
    "isla-de-pascua",
    "torres-del-paine",
    "hotel-de-nieve",
    "hotel-de-vina",
    "joyas-unicas",
    "guia-impresa",
    "prensa",
    "nosotros",
  ];

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetchWithSite("/api/categories?full=1&nav=1", {
          cache: "no-store",
        });
        const json = res.ok ? await res.json() : [];
        const rows = Array.isArray(json) ? json : [];

        const mapped = rows
          .filter((r: any) => r && r.slug)
          .map((r: any) => {
            const slug = normalizeSlug(r.slug);
            const fallback = fallbackCategories.find((c) => c.slug === slug);
            return {
              slug,
              labelEs: String(
                r.label_es || fallback?.labelEs || slug.toUpperCase(),
              ).toUpperCase(),
              labelEn: String(
                r.label_en || fallback?.labelEn || slug,
              ).toUpperCase(),
            };
          })
          .filter((item: any) => item.slug !== "exploraciones" && item.slug !== "bases-legales");

        const uniqueBySlug = new Map<string, (typeof mapped)[number]>();
        for (const item of mapped) {
          if (!uniqueBySlug.has(item.slug)) uniqueBySlug.set(item.slug, item);
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
          setFooterCategories(finalList.filter(Boolean));
          setIsLoadingCategories(false);
        }
      } catch (e) {
        if (!cancelled) {
          setFooterCategories([]);
          setIsLoadingCategories(false);
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
    if (normalizedSlug === "bases-legales") return "/bases-legales";
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
    return prettySlugs.has(normalizedSlug)
      ? `/${normalizedSlug}`
      : `/categoria/${normalizedSlug}`;
  };
  return (
    <footer className="bg-black text-white pt-[60px] pb-[20px] mt-8">
      <div className="site-inner">
        {/* Mobile: show MobileFooterContent as primary footer content */}
        <div className="lg:hidden">
          <MobileFooterContent />
        </div>

        {/* Adjusted grid gaps: reduced gap between logo and menu (gap-8), increased gap between menu and right section (gap-20) */}
        <div className="hidden lg:flex lg:items-start lg:gap-8">
          {/* Left: Logo aligned to bottom */}
          <div className="flex-shrink-0 mt-32">
            <Image
              src="/logo-footer-blanco.svg"
              alt="Chile Adicto Hoteles"
              width={646}
              height={182}
              className="h-20 w-auto"
            />
          </div>

          {/* Center: Navigation aligned to bottom with proper capitalization */}
          <nav className="flex flex-col gap-1 text-sm lg:ml-4">
            {!isLoadingCategories && footerCategories.length
              ? footerCategories.map((category) => (
                  <a
                    key={category.slug}
                    href={hrefFor(category.slug)}
                    download={normalizeSlug(category.slug) === "guia-impresa"}
                    className={`font-neutra-demi text-[15px] leading-[20px] font-[600] transition-colors duration-200 ease-in-out hover:text-[#FF0000] uppercase ${
                      normalizeSlug(activeCategory) ===
                      normalizeSlug(category.slug)
                        ? "text-[#FF0000]"
                        : "text-white"
                    }`}
                  >
                    {language === "es" ? category.labelEs : category.labelEn}
                  </a>
                ))
              : null}
          </nav>

          {/* Right: Quote at top, email and logos at bottom in same row */}
          <div className="flex flex-col justify-between min-w-[500px] ml-16 flex-1 min-h-[200px]">
            {/* Quote at the top */}
            <div className="self-start">
              <h2 className="font-neutra-demi text-[18px] leading-[24px] font-[400] text-white">
                los mejores hoteles de chile.
              </h2>
            </div>

            <div className="flex items-baseline justify-between w-full mt-16 gap-6">
              <a
                href="mailto:pato@closer.cl"
                className="text-sm hover:text-[#FF0000] transition-colors uppercase flex-shrink-0"
              >
                PATO@CLOSER.CL
              </a>
              <a
                href="https://www.instagram.com/guiasantiagoadicto/?hl=es-la"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0"
              >
                <Image
                  src="/santiago-adicto-blanco-4-footer.svg"
                  alt="Stgo adicto"
                  width={100}
                  height={40}
                  className="h-10 w-auto"
                />
              </a>
              <a
                href="https://www.instagram.com/chileadictohoteles"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0"
              >
                <Image
                  src="/chilehoteles-blancos-footer.svg"
                  alt="Chile adicto"
                  width={100}
                  height={40}
                  className="h-10 w-auto"
                />
              </a>
              <a
                href="https://www.instagram.com/adictoachile/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0"
              >
                <Image
                  src="/santiago-adicto-blanco-4-footer.svg"
                  alt="Stgo adicto"
                  width={100}
                  height={40}
                  className="h-10 w-auto"
                />
              </a>
              <a
                href="https://www.marcachile.cl/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0"
              >
                <Image
                  src="/wecare-nuevo-blanco.svg"
                  alt="WE CARE"
                  width={89}
                  height={98}
                  className="h-[98px] w-auto borderp-2"
                />
              </a>
            </div>

            <div className="mt-8 border-t border-white/30 pt-4 text-center">
              <a
                href="/bases-legales"
                className="font-neutra-demi text-[13px] leading-[18px] font-[600] text-white transition-colors hover:text-[#FF0000] uppercase"
              >
                {language === "es" ? "BASES LEGALES" : "LEGAL BASIS"}
              </a>
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
}

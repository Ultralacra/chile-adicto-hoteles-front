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

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetchWithSite("/api/categories?full=1&nav=1", {
          cache: "no-store",
        });
        const json = res.ok ? await res.json() : [];
        const rows = Array.isArray(json) ? json : [];

        const fallbackCategories = [
          { slug: "todos", labelEs: "TODOS", labelEn: "ALL" },
          { slug: "arquitectura", labelEs: "ARQ", labelEn: "ARQ" },
          { slug: "barrios", labelEs: "BARRIOS", labelEn: "Neighborhoods" },
          { slug: "iconos", labelEs: "ICONOS", labelEn: "Icons" },
          { slug: "mercados", labelEs: "MERCADOS", labelEn: "Markets" },
          { slug: "miradores", labelEs: "MIRADORES", labelEn: "Viewpoints" },
          { slug: "museos", labelEs: "CULTURA", labelEn: "Museums" },
          { slug: "palacios", labelEs: "PALACIOS", labelEn: "Palaces" },
          { slug: "parques", labelEs: "PARQUES", labelEn: "Parks" },
          {
            slug: "paseos-fuera-de-santiago",
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

        const mapped = rows
          .filter((r: any) => r && r.slug)
          .map((r: any) => {
            const slug = String(r.slug);
            const fallback = fallbackCategories.find((c) => c.slug === slug);
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

        const todos = mapped.find((x: any) => x.slug === "todos");
        const rest = mapped.filter((x: any) => x.slug !== "todos");
        const restaurants = rest.filter((x: any) => x.slug === "restaurantes");
        const tienda = rest.filter(
          (x: any) => x.slug === "tienda" || x.slug === "tiendas",
        );
        const others = rest.filter(
          (x: any) =>
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
    if (slug === "todos") return "/";
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
    return prettySlugs.has(slug) ? `/${slug}` : `/categoria/${slug}`;
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
              src="/Logo-best-espanol-blanco-footer.svg"
              alt="Logo best español"
              width={300}
              height={84}
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
                    className={`font-neutra-demi text-[15px] leading-[20px] font-[600] transition-colors duration-200 ease-in-out hover:text-[#FF0000] uppercase ${
                      activeCategory === category.slug
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
          </div>
        </div>
      </div>
    </footer>
  );
}

"use client";

import { Header } from "@/components/header";
import { HotelCard } from "@/components/hotel-card";
import { Footer } from "@/components/footer";
import { CategoryNav } from "@/components/category-nav";
import { buildCardExcerpt } from "@/lib/utils";
import { isHiddenFrontPost } from "@/lib/post-visibility";
import { useEffect, useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import { useLanguage } from "@/contexts/language-context";
import { useSiteApi } from "@/hooks/use-site-api";
import Image from "next/image";

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
];

const DESKTOP_BANNER = "/imaganescategorias/banner-home-votacion/BANER HOME.webp";
const MOBILE_BANNER = "/imaganescategorias/banner-home-votacion/MOVIL-BANER HOME.webp";

export default function Page() {
  const { language } = useLanguage();
  const { fetchWithSite } = useSiteApi();
  const [hotels, setHotels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
          {/* Banner de votacion - desktop */}
          <div className="hidden md:block w-full">
            <a href="/votacion" className="block w-full relative">
              <Image
                src={DESKTOP_BANNER}
                alt="Votación"
                width={1920}
                height={800}
                className="w-full h-auto"
                priority
              />
            </a>
          </div>

          {/* Banner de votacion - mobile */}
          <div className="md:hidden w-full">
            <a href="/votacion" className="block w-full relative">
              <Image
                src={MOBILE_BANNER}
                alt="Votación"
                width={750}
                height={1000}
                className="w-full h-auto"
                priority
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

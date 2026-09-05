"use client";

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { CategoryNav } from "@/components/category-nav";
import Image from "next/image";
import { useEffect, useState } from "react";

const MAIN_BANNER =
  "/banner-resultados/CATEGORIAS/categorias_banner-principal.webp";

const resultLinks = [
  {
    label: "Top 15 más votados",
    image: "/banner-resultados/CATEGORIAS/categoria_top-15.webp",
    href: "/resultados/top-15",
  },
  {
    label: "Hotel más votado",
    image: "/banner-resultados/CATEGORIAS/categoria_mas-votados.webp",
    href: "/resultados/hotel-mas-votado",
  },
  {
    label: "Detalle de resultados",
    image: "/banner-resultados/CATEGORIAS/categoria_resultados.webp",
    href: "/resultados",
  },
];

const categories = [
  {
    slug: "norte",
    name: "NORTE DE CHILE",
    image: "/banner-resultados/CATEGORIAS/categoria_norte-de-chile.webp",
  },
  {
    slug: "centro",
    name: "CENTRO DE CHILE",
    image: "/banner-resultados/CATEGORIAS/categoria_centro-de-chile.webp",
  },
  {
    slug: "sur",
    name: "SUR DE CHILE",
    image: "/banner-resultados/CATEGORIAS/categoria_sur-de-chile.webp",
  },
  {
    slug: "santiago",
    name: "SANTIAGO DE CHILE",
    image: "/banner-resultados/CATEGORIAS/categoria_santiago-de-chile.webp",
  },
  {
    slug: "isla-de-pascua",
    name: "ISLA DE PASCUA",
    image: "/banner-resultados/CATEGORIAS/categoria_isla-de-pascua.webp",
  },
  {
    slug: "torres-del-paine",
    name: "TORRES DEL PAINE",
    image: "/banner-resultados/CATEGORIAS/categoria_torres-del-paine.webp",
  },
  {
    slug: "joyas-unicas",
    name: "JOYAS ÚNICAS",
    image: "/banner-resultados/CATEGORIAS/categoria_joyas-unicas.webp",
  },
  {
    slug: "hoteles-de-nieve",
    name: "HOTEL DE NIEVE",
    image: "/banner-resultados/CATEGORIAS/categoria_hoteles-de-nieve.webp",
  },
  {
    slug: "hoteles-de-vina",
    name: "HOTEL DE VIÑA",
    image: "/banner-resultados/CATEGORIAS/categoria_hoteles-de-vinas.webp",
  },
];

export default function VotacionPage() {
  const [winnerHref, setWinnerHref] = useState("/resultados/hotel-mas-votado");

  useEffect(() => {
    let cancelled = false;

    fetch("/api/votes?site=chileadicto", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        const winnerSlug = data?.hotels?.[0]?.hotelSlug;
        if (!cancelled && typeof winnerSlug === "string" && winnerSlug) {
          setWinnerHref(`/${winnerSlug}`);
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Header showHomeSecurityBanner={false} />

      <main className="site-inner py-4">
        <div className="hidden lg:block">
          <CategoryNav activeCategory="votacion" />
        </div>

        <div className="w-full">
          <div className="w-full mb-6">
            <a href="/votacion" className="block w-full relative">
              <Image
                src={MAIN_BANNER}
                alt="Revisa los ganadores en las categorías"
                width={1920}
                height={240}
                className="w-full h-auto"
                priority
              />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => (
              <a
                key={category.slug}
                href={`/votacion/${category.slug}`}
                className="group relative overflow-hidden aspect-[2/1] block"
              >
                <Image
                  src={category.image}
                  alt={category.name}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </a>
            ))}
          </div>

          <section
            className="voting-results-links"
            aria-label="Resultados de la votación"
          >
            <div className="voting-results-links__grid">
              {resultLinks.map((link) => (
                <a
                  key={link.href}
                  href={
                    link.label === "Hotel más votado" ? winnerHref : link.href
                  }
                  className="group relative block overflow-hidden aspect-[2/1]"
                >
                  <Image
                    src={link.image}
                    alt={link.label}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </a>
              ))}
            </div>
            <div className="relative block overflow-hidden aspect-[8/1]">
              <Image
                src="/banner-resultados/CATEGORIAS/categoria_sorteo-ganador.webp"
                alt="Conoce al ganador del sorteo y al hotel al que se va"
                fill
                className="object-cover"
              />
            </div>
          </section>
        </div>
      </main>

      <Footer activeCategory="votacion" />
    </div>
  );
}

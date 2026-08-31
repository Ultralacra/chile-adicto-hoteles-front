"use client";

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { CategoryNav } from "@/components/category-nav";
import Image from "next/image";
import { useLanguage } from "@/contexts/language-context";
import { useState } from "react";

const DESKTOP_BANNER =
  "/imaganescategorias/banner-pagina-votacion/BANNER VOTACIONES.webp";
const MOBILE_BANNER =
  "/imaganescategorias/banner-pagina-votacion/MOVIL - BANNER VOTACIONES.webp";

const categories = [
  {
    slug: "norte",
    name: "NORTE DE CHILE",
    image: "/imaganescategorias/NORTE DE CHILE.webp",
  },
  {
    slug: "centro",
    name: "CENTRO DE CHILE",
    image: "/imaganescategorias/CENTRO DE CHILE.webp",
  },
  {
    slug: "sur",
    name: "SUR DE CHILE",
    image: "/imaganescategorias/SUR DE CHILE.webp",
  },
  {
    slug: "santiago",
    name: "SANTIAGO DE CHILE",
    image: "/imaganescategorias/SANTIAGO DE CHILE.webp",
  },
  {
    slug: "isla-de-pascua",
    name: "ISLA DE PASCUA",
    image: "/imaganescategorias/ISLA DE PASCUA.webp",
  },
  {
    slug: "torres-del-paine",
    name: "TORRES DEL PAINE",
    image: "/imaganescategorias/TORRES DEL PAINE.webp",
  },
  {
    slug: "joyas-unicas",
    name: "JOYAS ÚNICAS",
    image: "/imaganescategorias/JOYAS UNICAS.webp",
  },
  {
    slug: "hoteles-de-nieve",
    name: "HOTEL DE NIEVE",
    image: "/imaganescategorias/DE SKI.webp",
  },
  {
    slug: "hoteles-de-vina",
    name: "HOTEL DE VIÑA",
    image: "/imaganescategorias/DE VIÑA.webp",
  },
];

export default function VotacionPage() {
  const { language } = useLanguage();
  const [showFinishedModal, setShowFinishedModal] = useState(true);

  return (
    <div className="min-h-screen bg-white">
      <Header showHomeSecurityBanner={false} />

      {showFinishedModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="voting-finished-title"
        >
          <div className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow-xl">
            <h2
              id="voting-finished-title"
              className="font-neutra-demi text-2xl uppercase text-[#E4032C]"
            >
              Evento finalizado
            </h2>
            <p className="mt-4 text-gray-700">
              El periodo de votaciones ha terminado. ¡Gracias por participar!
            </p>
            <button
              type="button"
              onClick={() => setShowFinishedModal(false)}
              className="mt-6 rounded bg-[#E4032C] px-8 py-2 font-medium text-white transition-colors hover:bg-[#c00224]"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      <main className="site-inner py-4">
        <div className="hidden lg:block">
          <CategoryNav activeCategory="votacion" />
        </div>

        <div className="w-full">
          <div className="hidden md:block w-full mb-6">
            <a /* href="/votacion"  */ className="block w-full relative">
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

          <div className="md:hidden w-full mb-6">
            <a /* href="/votacion"  */ className="block w-full relative">
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => (
              <a
                key={category.slug}
                href={`/votacion/${category.slug}`}
                className="group relative overflow-hidden aspect-[4/3] block"
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
        </div>
      </main>

      <Footer activeCategory="votacion" />
    </div>
  );
}

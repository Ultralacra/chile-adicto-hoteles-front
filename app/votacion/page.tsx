"use client";

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { CategoryNav } from "@/components/category-nav";
import Image from "next/image";
import { useLanguage } from "@/contexts/language-context";

const categories = [
  { slug: "norte", name: "NORTE DE CHILE", image: "/imaganescategorias/NORTE DE CHILE.webp" },
  { slug: "centro", name: "CENTRO DE CHILE", image: "/imaganescategorias/CENTRO DE CHILE.webp" },
  { slug: "sur", name: "SUR DE CHILE", image: "/imaganescategorias/SUR DE CHILE.webp" },
  { slug: "santiago", name: "SANTIAGO DE CHILE", image: "/imaganescategorias/SANTIAGO DE CHILE.webp" },
  { slug: "isla-de-pascua", name: "ISLA DE PASCUA", image: "/imaganescategorias/ISLA DE PASCUA.webp" },
  { slug: "torres-del-paine", name: "TORRES DEL PAINE", image: "/imaganescategorias/TORRES DEL PAINE.webp" },
  { slug: "joyas-unicas", name: "JOYAS ÚNICAS", image: "/imaganescategorias/JOYAS UNICAS.webp" },
  { slug: "ski", name: "HOTEL DE NIEVE", image: "/imaganescategorias/DE SKI.webp" },
  { slug: "viñ", name: "HOTEL DE VIÑA", image: "/imaganescategorias/DE VIÑA.webp" },
];

export default function VotacionPage() {
  const { language } = useLanguage();

  return (
    <div className="min-h-screen bg-white">
      <Header showHomeSecurityBanner={false} />

      <main className="site-inner py-4">
        <div className="hidden lg:block">
          <CategoryNav activeCategory="votacion" />
        </div>

        <div className="container mx-auto px-4">
          <h1 className="font-neutra-demi text-3xl md:text-4xl text-center mb-4 uppercase tracking-wide">
            {language === "es" ? "Votación" : "Voting"}
          </h1>
          <p className="text-center text-gray-600 mb-8 max-w-2xl mx-auto">
            {language === "es"
              ? "Selecciona una categoría para ver los hoteles participantes"
              : "Select a category to see participating hotels"}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => (
              <a
                key={category.slug}
                href={`/categoria/${category.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative overflow-hidden aspect-[4/3] block"
              >
                <Image
                  src={category.image}
                  alt={category.name}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <h2 className="font-neutra-demi text-xl md:text-2xl text-white text-center uppercase tracking-wide drop-shadow-lg">
                    {category.name}
                  </h2>
                </div>
              </a>
            ))}
          </div>
        </div>
      </main>

      <Footer activeCategory="votacion" />
    </div>
  );
}

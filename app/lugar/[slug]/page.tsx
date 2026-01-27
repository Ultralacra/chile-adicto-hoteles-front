"use client";

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { CategoryNav } from "@/components/category-nav";
import { HotelDetail } from "@/components/hotel-detail";
// Dejamos de consumir data.json; consultamos al API
import { normalizeImageUrl } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import { useEffect, use, useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import { notFound } from "next/navigation";
import { useSiteApi } from "@/hooks/use-site-api";
import { isHiddenFrontPost } from "@/lib/post-visibility";

type ResolvedParams = { slug: string };

export default function LugarPage(props: any) {
  const { language, t } = useLanguage();
  const { fetchWithSite } = useSiteApi();

  // Next.js: params es un Promise en Client Components, usar React.use() para resolverlo
  const resolvedParams = use(props.params as any) as ResolvedParams;

  // Ocultar completamente el post /lugar/w-santiago o TEST
  if (isHiddenFrontPost({ slug: resolvedParams?.slug })) {
    notFound();
  }

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [resolvedParams?.slug]);

  const [arquitecturaEntry, setArquitecturaEntry] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  useEffect(() => {
    let cancelled = false;
    if (!resolvedParams?.slug) return;
    setLoading(true);
    fetchWithSite(`/api/posts/${encodeURIComponent(resolvedParams.slug)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((row) => {
        if (cancelled) return;
        if (row && isHiddenFrontPost(row)) {
          setArquitecturaEntry(null);
          return;
        }
        setArquitecturaEntry(row);
      })
      .catch(() => !cancelled && setArquitecturaEntry(null))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [resolvedParams?.slug, fetchWithSite]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <main className="container mx-auto px-4 py-16 text-center">
          <div className="max-w-2xl mx-auto text-gray-600 flex items-center justify-center gap-2">
            <Spinner className="size-5" /> Cargando…
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!arquitecturaEntry) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <main className="container mx-auto px-4 py-16 text-center">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-4xl font-bold mb-4 text-[var(--color-brand-red)]">
              {t("CONTENIDO EN MIGRACIÓN", "CONTENT IN MIGRATION")}
            </h1>
            <p className="text-xl text-[var(--color-brand-gray)] mb-8">
              {t(
                "Este hotel aún está en proceso de migración. Por favor, vuelve pronto.",
                "This hotel is still being migrated. Please check back soon."
              )}
            </p>
            <a
              href="/"
              className="inline-block bg-[var(--color-brand-red)] text-white px-8 py-3 rounded-sm hover:opacity-90 transition-opacity uppercase font-semibold"
            >
              {t("VOLVER AL INICIO", "BACK TO HOME")}
            </a>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const source = arquitecturaEntry;

  const hotel = source
    ? {
        name:
          source[language]?.name || source.en?.name || source.es?.name || "",
        subtitle:
          source[language]?.subtitle ||
          source.en?.subtitle ||
          source.es?.subtitle ||
          "",
        excerpt:
          (source[language]?.description && source[language].description[0]) ||
          "",
        fullContent: (source[language]?.description || [])
          .filter(Boolean)
          .map((p: string) => `<p>${p}</p>`)
          .join(""),
        infoHtml: source[language]?.infoHtml || "",
        infoHtmlNew: source[language]?.infoHtmlNew || "",
        website: source.website || "",
        website_display: source.website_display || "",
        instagram: source.instagram || "",
        instagram_display: source.instagram_display || "",
        email: source.email || "",
        phone: source.phone || "",
        address: source.address || "",
        locations: source.locations || [],
        photosCredit: source.photosCredit || "",
        hours: source.hours || "",
        reservationLink: source.reservationLink || "",
        reservationPolicy: source.reservationPolicy || "",
        interestingFact: source.interestingFact || "",
        // Imagen destacada separada de la galería; si no viene, usamos la primera.
        // Además, evitamos duplicados comparando por nombre de archivo (ignorando query y mayúsculas).
        ...(() => {
          const imgs: string[] = Array.isArray(source.images)
            ? source.images.filter((s: string) => !!s)
            : [];

          // 1) Detectar imagen 'PORTADA' por nombre de archivo (case-insensitive)
          const isPortada = (s: string) =>
            /portada/i.test(normalizeImageUrl(s).replace(/\.[^.]+$/, ""));

          // 2) Elegir featured:
          //    - Preferir source.featuredImage si viene
          //    - Si no, buscar una imagen que tenga 'PORTADA' en el nombre
          //    - No usar numeradas como featured por fallback, para no excluir "-1" de la galería
          let derivedFeatured = String(source.featuredImage || "").trim();
          if (!derivedFeatured) {
            const portada = imgs.find((s) => isPortada(s));
            if (portada) derivedFeatured = portada;
          }

          // helper para extraer índice numérico desde el nombre (para orden)
          const getIndex = (s: string) => {
            const base = normalizeImageUrl(s).replace(/\.[^.]+$/, "");
            // Busca el primer grupo de dígitos en el nombre
            const m = base.match(/(\d{1,4})/);
            return m ? parseInt(m[1], 10) : NaN;
          };

          // 3) Mantener sin featured si no hay explícita ni 'PORTADA'

          const featuredKey = normalizeImageUrl(derivedFeatured);

          // 5) Construir galería:
          //    - excluir featured
          //    - excluir cualquier imagen cuyo nombre contenga 'PORTADA'
          //    - incluir SOLO imágenes numeradas (que contengan dígitos)
          //    - ordenar por el número ascendente
          const seen = new Set<string>();
          // Mantener orden EXACTO entregado por el API (sin reordenar por índice).
          // Solo filtramos para excluir featured/portada y mantener numeradas, respetando el orden original.
          // Ajuste: incluir cualquier imagen adicional (no solo numeradas).
          // Se excluye la featured y cualquier que contenga 'PORTADA' en nombre, manteniendo
          // el orden original entregado por el API y evitando duplicados.
          const gallery = imgs.filter((img) => {
            const key = normalizeImageUrl(img);
            if (!key) return false;
            if (key === featuredKey) return false; // excluir featured
            if (/portada/i.test(key)) return false; // excluir PORTADA explícitas
            if (seen.has(key)) return false; // evitar duplicados
            seen.add(key);
            return true;
          });

          // 6) Fallback: si la galería queda vacía, usar la featured para que siempre haya al menos 1 imagen
          // Mantener la portada fuera de la galería SIEMPRE.
          // Si no hay imágenes adicionales, dejamos la galería vacía
          // y el componente mostrará solo la portada.
          const galleryWithFallback = gallery;

          return {
            featuredImage: derivedFeatured,
            galleryImages: galleryWithFallback,
          };
        })(),
        categories: source[language]?.category
          ? [source[language].category]
          : source.categories || [],
      }
    : null;

  // Reinserción correcta del bloque estático para PRIMA BAR (después de construir 'hotel')
  if (hotel && resolvedParams.slug === "prima-bar") {
    const descES = [
      "Creación del reconocido chef chileno Kurt Schmidt, una figura clave en la escena gastronómica local. Schmidt es conocido por su trabajo en el aclamado 99 Restaurante, que se posicionó en la lista 'Latin America's 50 Best Restaurants'. Con Prima Bar, el chef expande su visión, fusionando su experiencia culinaria con una profunda pasión por la música y el diseño.",
      "Inaugurado originalmente en Providencia, Prima Bar se mudó a su ubicación actual en la CV Galería en Vitacura y evolucionó en un 'listening bar'. Este concepto único, pionero en Chile, integra la experiencia auditiva —con una banda sonora curada a base de vinilos— a la comida y la coctelería, invitando a los comensales a un espacio de disfrute sensorial completo.",
      "La propuesta culinaria es un reflejo de la visión de Schmidt: una cocina de autor, fresca y moderna, con un enfoque en la producción artesanal e ingredientes de todo Chile. El menú, diseñado para compartir, se inspira en una versión moderna de las tapas. La carta de cócteles sigue la misma filosofía, con creaciones originales e inspiradas también en la música y algunos de sus referentes.",
      "Prima Bar ha consolidado su reputación a nivel internacional, siendo destacado por el prestigioso ranking de 'The World's 50 Best Discovery', una lista que reconoce bares y restaurantes que ofrecen experiencias culinarias excepcionales alrededor del mundo.",
    ];
    const descEN = [
      "Created by renowned Chilean chef Kurt Schmidt, a key figure in the country’s contemporary gastronomic scene. Schmidt is best known for his work at the acclaimed 99 Restaurant, which earned a place on the Latin America’s 50 Best Restaurants list. With Prima Bar, the chef expands his creative vision, blending his culinary expertise with a deep passion for music and design.",
      "Originally opened in Providencia, Prima Bar later moved to its current location inside CV Galería in Vitacura, evolving into a true listening bar. This unique concept — a pioneer in Chile — merges sound and taste, pairing a curated vinyl soundtrack with fine dining and mixology, offering guests a fully immersive sensory experience.",
      "The culinary proposal reflects Schmidt’s philosophy: author-driven cuisine, fresh and modern, with an emphasis on artisanal production and ingredients sourced from across Chile. The menu, designed for sharing, takes inspiration from a contemporary interpretation of tapas. The cocktail list follows the same creative spirit, featuring original recipes influenced by music and iconic artists.",
      "Prima Bar has achieved international recognition, earning a spot on the prestigious The World’s 50 Best Discovery list — a distinction reserved for venues that deliver outstanding culinary and bar experiences worldwide.",
    ];
    hotel.fullContent = (language === "en" ? descEN : descES)
      .map((p) => `<p>${p}</p>`)
      .join("");
    hotel.infoHtml =
      language === "en"
        ? [
            "<p><strong>PRIMA BAR</strong></p>",
            "<p>ADDRESS: ALONSO DE CÓRDOVA 4355, VITACURA</p>",
            '<p>WEBSITE: <a href="https://www.prima-bar.cl" target="_blank" rel="noopener noreferrer">WWW.PRIMA-BAR.CL</a></p>',
            '<p>SOCIAL MEDIA: <a href="https://www.instagram.com/prima.bar" target="_blank" rel="noopener noreferrer">@PRIMA.BAR</a></p>',
            "<p>HOURS: TUESDAY TO THURSDAY: 18:00 – 00:00 HRS / FRIDAY AND SATURDAY: 18:00 – 01:00 HRS</p>",
            "<p>RESERVATIONS: VIA WEBSITE OR SOCIAL MEDIA</p>",
            "<p>INTERESTING FACT: PRIMA BAR HOUSES ONE OF THE MOST EXQUISITE VINYL COLLECTIONS IN THE CITY, WITH A LIVE DJ SET THAT PLAYS A CENTRAL ROLE IN THE EXPERIENCE.</p>",
            "<p>PHOTOGRAPHY: CAROLINA VARGAS</p>",
          ].join("")
        : [
            "<p><strong>PRIMA BAR</strong></p>",
            "<p>DIRECCIÓN: ALONSO DE CÓRDOVA 4355, VITACURA.</p>",
            '<p>SITIO WEB: <a href="https://www.prima-bar.cl" target="_blank" rel="noopener noreferrer">WWW.PRIMA-BAR.CL</a></p>',
            '<p>REDES SOCIALES: <a href="https://www.instagram.com/prima.bar" target="_blank" rel="noopener noreferrer">@PRIMA.BAR</a></p>',
            "<p>HORARIO: MARTES A JUEVES: 18:00 - 00:00 HRS. / VIERNES Y SÁBADO: 18:00 - 01:00 HRS.</p>",
            "<p>RESERVAS: A TRAVÉS DE SU SITIO WEB O REDES SOCIALES.</p>",
            "<p>DATO DE INTERÉS: POSEE UNA DE LAS COLECCIONES DE VINILOS MÁS SELECTAS DE LA CIUDAD, CON UN DJ SET QUE ES PARTE FUNDAMENTAL DEL CONCEPTO DEL LUGAR.</p>",
            "<p>FOTOGRAFÍAS: CAROLINA VARGAS</p>",
          ].join("");
  }

  // Bloque estático para THE SINGULAR (ES/EN) – descripción arriba, datos útiles abajo
  if (
    hotel &&
    ["the-singular", "restaurante-the-singular"].includes(resolvedParams.slug)
  ) {
    const singularDescES = [
      "Ubicado en el histórico barrio Lastarria, el restaurante del Hotel The Singular aspira a ser un referente de la alta cocina chilena, fusionando tradición y modernidad. Su propuesta es un viaje culinario de norte a sur, resaltando la riqueza de los ingredientes locales con una ejecución técnica inspirada en la gastronomía francesa.",
      "La dirección de la cocina está a cargo del chef Hernán Basso, un profesional formado en Buenos Aires que ha dejado su huella en los fogones de The Singular Patagonia desde 2011. Su cocina es un homenaje a los sabores y productos chilenos, que interpreta con precisión y un toque vanguardista. La visión detrás de The Singular es de la familia Sahli, cuyo legado en la hotelería chilena se remonta al histórico Hotel Crillón. Con este proyecto buscaban crear un espacio que reflejara el lujo, la elegancia y la historia local.",
      "El menú del restaurante ofrece una selección de platos que destacan por su audacia y equilibrio. La calidad de su gastronomía y el impecable servicio le han valido múltiples galardones, incluyendo el reconocimiento en la lista de los 'Mejores Hoteles de Lujo en Chile' por Condé Nast Traveler y los 'World Travel Awards', consolidándolo como un destino culinario de primer nivel.",
      "Para completar la experiencia, el hotel cuenta con un Rooftop Bar considerado una de las mejores terrazas de Santiago. Este espacio ofrece vistas panorámicas del Cerro San Cristóbal y el Parque Forestal. Es el lugar ideal para disfrutar de una carta de coctelería de autor, vinos chilenos y tapas en un ambiente lounge, especialmente al atardecer.",
    ];
    const singularDescEN = [
      "Located in the historic Barrio Lastarria, the restaurant at The Singular Hotel Santiago seeks to be a true benchmark of Chilean haute cuisine, blending tradition and modernity. Its culinary proposal is a journey from north to south, highlighting the richness of local ingredients executed with technical precision and a French-inspired touch.",
      "The kitchen is led by Chef Hernán Basso, a Buenos Aires–trained professional who has made his mark at The Singular Patagonia since 2011. His cuisine pays homage to Chilean flavors and ingredients, interpreted with precision and a touch of innovation. The vision behind The Singular comes from the Sahli family, whose legacy in Chilean hospitality dates back to the historic Hotel Crillón. With this project, they set out to create a space that reflects luxury, elegance, and local heritage.",
      "The menu offers a refined selection of dishes known for their boldness and balance. The quality of the cuisine and impeccable service have earned the restaurant multiple distinctions, including mentions among Chile’s Best Luxury Hotels by Condé Nast Traveler and awards from the World Travel Awards, establishing it as a culinary destination of excellence.",
      "To complete the experience, the hotel features a Rooftop Bar, considered one of Santiago’s best terraces. With panoramic views of Cerro San Cristóbal and Parque Forestal, it’s the ideal spot to enjoy signature cocktails, Chilean wines, and gourmet tapas in an elegant lounge atmosphere—especially at sunset.",
    ];
    hotel.fullContent = (language === "en" ? singularDescEN : singularDescES)
      .map((p) => `<p>${p}</p>`)
      .join("");
    hotel.infoHtml =
      language === "en"
        ? [
            "<p><strong>THE SINGULAR </strong></p>",
            "<p>ADDRESS: MERCED 294, BARRIO LASTARRIA, SANTIAGO, CHILE</p>",
            '<p>WEBSITE: <a href="https://www.thesingular.com/santiago" target="_blank" rel="noopener noreferrer">WWW.THESINGULAR.COM/SANTIAGO</a></p>',
            '<p>SOCIAL MEDIA: <a href="https://www.instagram.com/thesingularhotels" target="_blank" rel="noopener noreferrer">@THESINGULARHOTELS</a></p>',
            "<p>RESTAURANT: MONDAY TO SATURDAY, LUNCH AND DINNER</p>",
            "<p>ROOFTOP BAR: TUESDAY TO SATURDAY, FROM 18:00 HRS</p>",
            "<p>RESERVATIONS: VIA WEBSITE OR PHONE</p>",
            "<p>INTERESTING FACT: THE SINGULAR SANTIAGO WAS THE BRAND’S FIRST HOTEL IN THE CAPITAL, FOLLOWING THE SUCCESS OF ITS PATAGONIA PROPERTY.</p>",
          ].join("")
        : [
            "<p><strong>THE SINGULAR</strong></p>",
            "<p>DIRECCIÓN: MERCED 294, BARRIO LASTARRIA, SANTIAGO, CHILE.</p>",
            '<p>SITIO WEB: <a href="https://www.thesingular.com/santiago" target="_blank" rel="noopener noreferrer">WWW.THESINGULAR.COM/SANTIAGO</a></p>',
            '<p>REDES SOCIALES: <a href="https://www.instagram.com/thesingularhotels" target="_blank" rel="noopener noreferrer">@THESINGULARHOTELS</a></p>',
            "<p>RESTAURANTE: LUNES A SÁBADO, ALMUERZO Y CENA.</p>",
            "<p>ROOFTOP BAR: MARTES A SÁBADO, DESDE LAS 18:00 HRS.</p>",
            "<p>RESERVAS: A TRAVÉS DE SU SITIO WEB O VÍA TELEFÓNICA.</p>",
            "<p>DATO DE INTERÉS: THE SINGULAR SANTIAGO FUE EL PRIMER HOTEL DE LA MARCA EN ABRIR EN LA CAPITAL, TRAS EL ÉXITO DE SU HOMÓLOGO EN LA PATAGONIA.</p>",
          ].join("");
  }

  // Bloque estático de Datos Útiles para el post Ambrosía (solo ES por ahora)
  if (
    hotel &&
    resolvedParams.slug ===
      "ambrosia-restaurante-bistro-dos-versiones-de-un-gran-concepto"
  ) {
    hotel.infoHtml = [
      // Restaurante principal
      "<p><strong>RESTAURANTE AMBROSÍA</strong></p>",
      "<p>DIRECCIÓN: PAMPLONA 78, VITACURA</p>",
      "<p>HORARIO: ALMUERZO: LUNES A DOMINGO, 13:00-15:30 HRS</p>",
      "<p>CENA: LUNES A SÁBADO, 18:30-22:30 HRS</p>",
      "<p>&nbsp;</p>",
      // Bistró
      "<p><strong>AMBROSÍA BISTRÓ</strong></p>",
      "<p>DIRECCIÓN: MERCADO URBANO TOBALABA (MUT), AV. APOQUINDO 2730, PISO 4, LAS CONDES</p>",
      "<p>HORARIO: LUNES A SÁBADO, 12:30-23:00 HRS</p>",
      "<p>DOMINGO, 12:30-16:30 HRS</p>",
      "<p>&nbsp;</p>",
      // Común a ambos
      "<p><strong>COMÚN A AMBOS</strong></p>",
      '<p>SITIO WEB: <a href="https://www.ambrosia.cl" target="_blank" rel="noopener noreferrer">WWW.AMBROSIA.CL</a></p>',
      '<p>REDES SOCIALES: <a href="https://www.instagram.com/ambrosia_rest" target="_blank" rel="noopener noreferrer">@AMBROSIA_REST</a></p>',
      "<p>RESERVAS: ALTAMENTE RECOMENDABLES PARA EL RESTAURANTE PRINCIPAL EN VITACURA.</p>",
      "<p>DATO DE INTERÉS: LA CHEF CAROLINA BAZÁN FUE GALARDONADA COMO LA MEJOR CHEF FEMENINA DE LATINOAMÉRICA EN 2019.</p>",
    ].join("");
  }

  if (!hotel) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <main className="container mx-auto px-4 py-16 text-center">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-4xl font-bold mb-4 text-[var(--color-brand-red)]">
              {t("CONTENIDO EN MIGRACIÓN", "CONTENT IN MIGRATION")}
            </h1>
            <p className="text-xl text-[var(--color-brand-gray)] mb-8">
              {t(
                "Este hotel aún está en proceso de migración. Por favor, vuelve pronto.",
                "This hotel is still being migrated. Please check back soon."
              )}
            </p>
            <a
              href="/"
              className="inline-block bg-[var(--color-brand-red)] text-white px-8 py-3 rounded-sm hover:opacity-90 transition-opacity uppercase font-semibold"
            >
              {t("VOLVER AL INICIO", "BACK TO HOME")}
            </a>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Derivar la categoría activa (slug) para marcar menú y footer
  function categoryToSlug(cat: string) {
    if (!cat) return "todos";
    const c = String(cat).toLowerCase();
    if (c === "all" || c === "todos") return "todos";
    if (c.includes("architect")) return "arquitectura";
    if (c.includes("cultura") || c.includes("culture")) return "museos";
    if (c.includes("restaurant")) return "restaurantes";
    if (
      c.includes("fuera de stgo") ||
      c.includes("outside stgo") ||
      c.includes("outside santiago") ||
      c.includes("paseos fuera de santiago")
    )
      return "paseos-fuera-de-santiago";
    return c.replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }

  const activeCategorySlug = categoryToSlug(
    (hotel?.categories && hotel.categories[0]) || "todos"
  );
  const isRestaurantPost = activeCategorySlug === "restaurantes";

  return (
    <div className="min-h-screen bg-white">
      <Header />
      {/* Menú de categorías normal para posts que NO son restaurantes (coincide con el contenedor de otras páginas) */}
      {!isRestaurantPost && (
        <div className="mx-auto px-4 py-2 max-w-[1200px] hidden lg:block">
          <CategoryNav activeCategory={activeCategorySlug} compact />
        </div>
      )}
      <HotelDetail hotel={hotel as any} />
      <Footer activeCategory={activeCategorySlug} />
    </div>
  );
}

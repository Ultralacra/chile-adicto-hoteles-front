"use client";

import { Header } from "@/components/header";
import { HotelCard } from "@/components/hotel-card";
import { Footer } from "@/components/footer";
import { CategoryNav } from "@/components/category-nav";
import { HeroSlider } from "@/components/hero-slider";
import { notFound } from "next/navigation";
// Dejamos de consumir data.json; consultamos al API
import { useLanguage } from "@/contexts/language-context";
import { useEffect, use, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { buildCardExcerpt } from "@/lib/utils";
import Link from "next/link";
import { Spinner } from "@/components/ui/spinner";
import { useSiteApi } from "@/hooks/use-site-api";
import { isHiddenFrontPost } from "@/lib/post-visibility";
import { BottomHomeBanner } from "@/components/home-promo-banners";

// Antes se validaba contra una lista fija, pero ahora el menú y las categorías
// se administran desde la BD. No hacemos 404 por slug desconocido.

type ResolvedParams = { slug: string };

type ApiCommuneRow = {
  slug: string;
  label: string | null;
  show_in_menu?: boolean | null;
  menu_order?: number | null;
};

export default function CategoryPage({ params }: { params: any }) {
  const resolvedParams = use(params as any) as ResolvedParams;
  const { slug } = resolvedParams;
  const router = useRouter();
  const { language, t } = useLanguage();
  const { fetchWithSite } = useSiteApi();

  useEffect(() => {
    if (slug === "nosotros") {
      router.replace("/nosotros");
    }
  }, [slug, router]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  const categoryMap: { [key: string]: string } = {
    norte: "NORTE",
    centro: "CENTRO",
    sur: "SUR",
    "isla-de-pascua": "ISLA DE PASCUA",
    santiago: "SANTIAGO",
    "exploraciones-tnf": "EXPLORACIONES TNF",
    // new category name mappings
    ninos: "NIÑOS",
    arquitectura: "ARQ",
    barrios: "BARRIOS",
    iconos: "ICONOS",
    mercados: "MERCADOS",
    miradores: "MIRADORES",
    // Mostrar CULTURA aunque el slug sea museos
    museos: "CULTURA",
    restaurantes: "RESTAURANTES",
    palacios: "PALACIOS",
    parques: "PARQUES",
    // Mostrar FUERA DE STGO aunque el slug sea paseos-fuera-de-santiago
    "paseos-fuera-de-santiago": "FUERA DE STGO",
    tiendas: "TIENDAS",
  };

  const categoryName = categoryMap[slug] || slug.toUpperCase();

  // Candidates: include possible English/Spanish variants for some categories
  const categoryCandidatesMap: { [key: string]: string[] } = {
    ninos: ["NIÑOS", "NINOS", "KIDS", "CHILDREN"],
    arquitectura: ["ARQ", "ARQUITECTURA", "ARCHITECTURE"],
    "isla-de-pascua": ["ISLA DE PASCUA", "EASTER ISLAND"],
    museos: ["MUSEOS", "CULTURA", "MUSEUMS", "CULTURE"],
    restaurantes: ["RESTAURANTES", "RESTAURANTS"],
    "paseos-fuera-de-santiago": [
      "PASEOS FUERA DE SANTIAGO",
      "FUERA DE STGO",
      "OUTSIDE STGO",
      "OUTSIDE SANTIAGO",
    ],
    // add other special cases if needed
  };

  const candidates = categoryCandidatesMap[slug] || [categoryName];

  const [filteredHotels, setFilteredHotels] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    // Preferimos filtrar por slug de categoría en el backend
    fetchWithSite(`/api/posts?categorySlug=${encodeURIComponent(slug)}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((rows) => {
        if (cancelled) return;
        const list = Array.isArray(rows) ? rows : [];
        setFilteredHotels(list.filter((p) => !isHiddenFrontPost(p)));
      })
      .catch(() => !cancelled && setFilteredHotels([]))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [slug, fetchWithSite]);

  const isRestaurantsPage = slug === "restaurantes";

  // Comunas dinámicas para restaurantes (derivadas de direcciones/locations y overrides)
  const possibleCommunes = [
    "Santiago",
    "Providencia",
    "Las Condes",
    "Vitacura",
    "Lo Barnechea",
    "La Reina",
    "Ñuñoa",
    "Recoleta",
    "Independencia",
    "San Miguel",
    "Estación Central",
    "Maipú",
    "La Florida",
    "Puente Alto",
    "Alto Jahuel",
  ];
  const [communes, setCommunes] = useState<string[]>([]);
  const [dbCommunes, setDbCommunes] = useState<ApiCommuneRow[]>([]);
  const [dbPostCommuneMap, setDbPostCommuneMap] = useState<
    Record<string, string[]>
  >({});

  const searchParams = useSearchParams();
  const comunaParam = searchParams.get("comuna");
  const [selectedComuna, setSelectedComuna] = useState<string | null>(null);

  const communeLabelFromRow = (r: ApiCommuneRow) => {
    const label = String(r?.label || "").trim();
    if (label) return label;
    return String(r?.slug || "")
      .replace(/-/g, " ")
      .trim();
  };

  useEffect(() => {
    if (!comunaParam) {
      setSelectedComuna(null);
      return;
    }

    const param = String(comunaParam || "")
      .trim()
      .toLowerCase();
    const match = dbCommunes.find(
      (c) =>
        String(c.slug || "")
          .trim()
          .toLowerCase() === param,
    );
    if (match) {
      setSelectedComuna(communeLabelFromRow(match));
      return;
    }
    setSelectedComuna(comunaParam.replace(/-/g, " "));
  }, [comunaParam, slug, dbCommunes]);

  // Cargar comunas desde BD para el submenú (fallback a heurística si no existe tabla)
  useEffect(() => {
    if (!isRestaurantsPage) {
      setDbCommunes([]);
      return;
    }
    let cancelled = false;
    fetchWithSite("/api/communes?nav=1", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : []))
      .then((rows) => {
        if (cancelled) return;
        const list: ApiCommuneRow[] = Array.isArray(rows) ? rows : [];
        setDbCommunes(list.filter((x) => x && x.slug));
      })
      .catch(() => !cancelled && setDbCommunes([]));
    return () => {
      cancelled = true;
    };
  }, [isRestaurantsPage, fetchWithSite]);

  // Cargar mapeo postSlug -> [commune_slug] para el filtro (si existe en BD)
  useEffect(() => {
    if (!isRestaurantsPage) {
      setDbPostCommuneMap({});
      return;
    }
    const slugs = (filteredHotels as any[])
      .map((h) => String(h?.slug || "").trim())
      .filter(Boolean);
    if (slugs.length === 0) {
      setDbPostCommuneMap({});
      return;
    }

    let cancelled = false;
    fetchWithSite("/api/communes/map", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slugs }),
      cache: "no-store",
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled) return;
        const map = data?.map;
        const communesRows = data?.communes;
        if (Array.isArray(communesRows) && communesRows.length > 0) {
          setDbCommunes(
            communesRows
              .filter((x: any) => x && x.slug)
              .map((x: any) => ({
                slug: String(x.slug),
                label: x.label ?? null,
                show_in_menu: x.show_in_menu ?? true,
                menu_order: x.menu_order ?? 0,
              })),
          );
        }
        if (map && typeof map === "object") {
          setDbPostCommuneMap(map as Record<string, string[]>);
        } else {
          setDbPostCommuneMap({});
        }
      })
      .catch(() => !cancelled && setDbPostCommuneMap({}));

    return () => {
      cancelled = true;
    };
  }, [isRestaurantsPage, filteredHotels, fetchWithSite]);

  // Overrides de comuna por slug (prioridad sobre búsqueda por texto)
  // Permite uno o múltiples match de comuna por slug.
  const comunaOverrides: Record<string, string | string[]> = {
    "ceiba-rooftop-bar-sabores-amazonicos": "Lo Barnechea",
    "ceiba-roof-top-renace-en-lo-barnechea": ["Lo Barnechea", "Santiago"],
    "casaluz-una-brillante-luz-en-barrio-italia": "Providencia",
    "anima-el-reino-de-lo-esencial": "Providencia",
    // Mirai debe aparecer en Las Condes y Santiago
    "mirai-food-lab": ["Las Condes", "Santiago"],
  };

  // Comunas adicionales por slug (ADITIVO):
  // Se usa para “aparece también en…” sin perder coincidencias por texto.
  const comunaAdditions: Record<string, string | string[]> = {
    "bloody-mary-kitchen-bar-el-tomate-como-hilo-conductor-pero-no-el-limite":
      "Vitacura",
  };

  const normalizeComuna = (s: string) =>
    String(s || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase()
      .trim();

  const isHiddenRestaurantCommuneLabel = (label: string) =>
    normalizeComuna(label) === "INDEPENDENCIA";
  // Derivar lista de comunas encontradas entre los restaurantes cargados
  useEffect(() => {
    if (!isRestaurantsPage) {
      setCommunes([]);
      return;
    }

    // Si hay comunas en BD, usamos esas para el submenú (respeta show_in_menu)
    if (dbCommunes.length > 0) {
      const labels = dbCommunes
        .filter((c) => c && c.slug && c.show_in_menu !== false)
        .map((c) => communeLabelFromRow(c))
        .filter((x) => x && !isHiddenRestaurantCommuneLabel(String(x)));
      if (labels.length > 0) {
        setCommunes(labels);
        return;
      }
    }

    const found = new Set<string>();
    const tryAdd = (raw: string) => {
      const haystack = normalizeComuna(raw);
      for (const pc of possibleCommunes) {
        if (haystack.includes(normalizeComuna(pc))) {
          found.add(pc);
        }
      }
    };
    for (const h of filteredHotels as any[]) {
      const slug = String(h.slug || "");
      const override = comunaOverrides[slug];
      if (override) {
        const arr = Array.isArray(override) ? override : [override];
        arr.forEach((c) => found.add(c));
      }
      const addition = comunaAdditions[slug];
      if (addition) {
        const arr = Array.isArray(addition) ? addition : [addition];
        arr.forEach((c) => found.add(c));
      }
      if (h.address) tryAdd(h.address);
      if (Array.isArray(h.locations)) {
        for (const loc of h.locations) {
          if (loc?.address) tryAdd(loc.address);
          if (loc?.label) tryAdd(loc.label);
        }
      }
      if (Array.isArray(h.es?.description)) {
        tryAdd((h.es.description as string[]).join("\n"));
      }
      if (Array.isArray(h.en?.description)) {
        tryAdd((h.en.description as string[]).join("\n"));
      }
    }
    // Ordenar por el orden de possibleCommunes
    const ordered = possibleCommunes
      .filter((c) => found.has(c))
      .filter((c) => !isHiddenRestaurantCommuneLabel(String(c)));
    // Fallback si no detectamos ninguna: usar set básico conocido
    setCommunes(
      ordered.length > 0
        ? ordered
        : [
            "Vitacura",
            "Las Condes",
            "Santiago",
            "Lo Barnechea",
            "Providencia",
            "Alto Jahuel",
            "La Reina",
          ],
    );
  }, [isRestaurantsPage, filteredHotels]);

  const selectedComunaSlug = selectedComuna
    ? (() => {
        const norm = normalizeComuna(selectedComuna);
        const match = dbCommunes.find(
          (c) => normalizeComuna(communeLabelFromRow(c)) === norm,
        );
        if (match) return String(match.slug || "").trim();
        return String(selectedComuna).trim().toLowerCase().replace(/\s+/g, "-");
      })()
    : null;

  // Whitelist explícita para la comuna de Santiago: solo estos slugs deben aparecer
  const santiagoAllowedSlugs = new Set<string>([
    "casa-lastarria-nobleza-arquitectonica",
    "copper-room-y-gran-cafe-hotel-debaines-homenajes-necesarios",
    "demo-magnolia-honestidad-refrescante",
    "flama-la-pizza-que-desafia-lo-clasico",
    "jose-ramon-277-oda-a-lo-mas-sabroso-de-chile",
    "liguria-lastarria-la-filosofia-cicali",
    "the-singular",
    "pulperia-santa-elvira-una-joya-de-matta-sur",
    "ocean-pacifics-destino-gastronomico-patrimonial",
    "mirai-food-lab",
    "bocanariz-la-vitrina-del-vino-chileno",
    "blue-jar-nunca-decepciona",
    "make-make",
    "ceiba-roof-top-renace-en-lo-barnechea",
  ]);

  // Cargar imágenes del slider de restaurantes desde /public/imagenes-slider/manifest.json
  // Soporta dos formatos de manifest:
  // 1) Array simple de strings ["img1.webp", "img2.webp", ...]
  // 2) Objeto por idioma { es: string[], en: string[] }
  const [restaurantSliderImages, setRestaurantSliderImages] = useState<
    string[]
  >([]);
  const [restaurantSlideHrefs, setRestaurantSlideHrefs] = useState<string[]>(
    [],
  );
  const [restaurantDesktopLoadedFromDb, setRestaurantDesktopLoadedFromDb] =
    useState(false);
  // Imágenes móviles específicas (EN primera, ES segunda) para restaurantes
  const [restaurantMobileImages, setRestaurantMobileImages] = useState<
    string[]
  >([]);
  const [restaurantMobileHrefs, setRestaurantMobileHrefs] = useState<string[]>(
    [],
  );
  const [restaurantMobileLoadedFromDb, setRestaurantMobileLoadedFromDb] =
    useState(false);
  useEffect(() => {
    if (!isRestaurantsPage) return;
    let cancelled = false;
    const desktopKey =
      language === "en" ? "restaurants-desktop-en" : "restaurants-desktop-es";

    // 1) Intentar BD primero (si existe)
    fetchWithSite(`/api/sliders/${encodeURIComponent(desktopKey)}`, {
      cache: "no-store",
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((db) => {
        if (cancelled) return;
        const items = Array.isArray(db?.items) ? db.items : [];
        const activeItems = items.filter((it: any) => it?.active !== false);
        const imagesFromDb = activeItems
          .map((it: any) => String(it?.image_url || "").trim())
          .filter(Boolean);
        const hrefsFromDb = activeItems.map((it: any) =>
          it?.href ? String(it.href) : "",
        );

        if (imagesFromDb.length > 0) {
          setRestaurantSliderImages(imagesFromDb);
          setRestaurantSlideHrefs(hrefsFromDb);
          setRestaurantDesktopLoadedFromDb(true);
          return;
        }

        // 2) Fallback: manifest.json (comportamiento actual)
        setRestaurantDesktopLoadedFromDb(false);
        return fetch("/imagenes-slider/manifest.json")
          .then((r) => (r.ok ? r.json() : []))
          .then((payload) => {
            if (cancelled) return;

            const normalizeList = (list: unknown): string[] => {
              if (!Array.isArray(list)) return [];
              return list
                .map((s) => String(s || "").trim())
                .filter(Boolean)
                .map((s) => (s.startsWith("/") ? s : `/imagenes-slider/${s}`));
            };

            // Normalizador y matching inteligente contra data.json para que el href
            // coincida con el slug real del restaurante.
            const normKey = (str: string) =>
              String(str || "")
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .toLowerCase()
                .replace(/[^a-z0-9]/g, "");

            const restaurantIndex = (filteredHotels as any[]).map((h) => {
              const slug = String(h.slug || "");
              const esName = String(h.es?.name || "");
              const enName = String(h.en?.name || "");
              return {
                slug,
                keys: [normKey(slug), normKey(esName), normKey(enName)].filter(
                  Boolean,
                ),
              };
            });

            const buildHrefsFromFilenames = (list: unknown): string[] => {
              if (!Array.isArray(list)) return [];
              return list
                .map((s) => String(s || "").trim())
                .filter(Boolean)
                .map((fname) => {
                  const onlyName = fname.split("/").pop() || fname;
                  const noExt = onlyName.replace(/\.[^.]+$/, "");
                  const base = noExt.replace(/-(1|2)$/i, ""); // AC KITCHEN-1 -> AC KITCHEN
                  const cleanedBase = base.replace(/^(sld|slm|sl)[ _-]+/i, "");
                  const key = normKey(cleanedBase); // ackitchen

                  let matchSlug: string | null = null;
                  for (const row of restaurantIndex) {
                    if (
                      row.keys.some(
                        (k: string) => k.startsWith(key) || key.startsWith(k),
                      )
                    ) {
                      matchSlug = row.slug;
                      break;
                    }
                  }

                  if (!matchSlug) {
                    // Fallback: derivar slug del base por si acaso
                    matchSlug = cleanedBase
                      .normalize("NFD")
                      .replace(/[\u0300-\u036f]/g, "")
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, "-")
                      .replace(/(^-|-$)/g, "");
                  }
                  return `/${matchSlug}`;
                });
            };

            // Determinar lista activa según idioma (o fallback)
            let activeList: unknown = [];
            if (Array.isArray(payload)) {
              // Formato antiguo: array simple
              activeList = payload;
            } else if (payload && typeof payload === "object") {
              activeList =
                (payload as any)[language] ||
                (payload as any)["es"] ||
                (payload as any)["en"];
            }

            const images = normalizeList(activeList);
            const derivedHrefs = buildHrefsFromFilenames(activeList);
            setRestaurantSliderImages(images);

            // Orden fijo “prioritario”, pero sin bloquear nuevas imágenes del manifest.
            // Si agregas una imagen nueva al manifest (y su restaurante existe), se
            // añade automáticamente al final sin tocar código.
            const explicitRestaurantSlugs = [
              "ac-kitchen-la-madurez-de-un-chef-en-movimiento",
              "ambrosia-restaurante-bistro-dos-versiones-de-un-gran-concepto",
              "borago-un-viaje-a-la-esencia-de-chile",
              "copper-room-y-gran-cafe-hotel-debaines-homenajes-necesarios",
              "cora-bistro-oda-a-la-cocina-chilena",
              "demencia-un-espectaculo-gastronomico",
              "fukasawa-esencia-japonesa",
              "karai-el-sello-del-mejor-del-mundo",
              "pulperia-santa-elvira-una-joya-de-matta-sur",
              "tanaka-la-fusion-redefinida",
              "yum-cha-comer-y-beber-con-te",
              "casa-las-cujas-deleite-marino",
            ];

            const explicitHrefs = explicitRestaurantSlugs.map(
              (slug) => `/${slug}`,
            );
            const merged: string[] = [];
            for (const h of explicitHrefs) {
              if (h && !merged.includes(h)) merged.push(h);
            }
            for (const h of derivedHrefs) {
              if (h && !merged.includes(h)) merged.push(h);
            }

            setRestaurantSlideHrefs(merged);
          });
      })
      .catch(() => {
        setRestaurantSliderImages([]);
        setRestaurantSlideHrefs([]);
        setRestaurantDesktopLoadedFromDb(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isRestaurantsPage, language, fetchWithSite]);

  // Cargar carpeta específica móvil de restaurantes (sin afectar desktop)
  useEffect(() => {
    if (!isRestaurantsPage) return;
    let cancelled = false;

    const mobileKey =
      language === "en" ? "restaurants-mobile-en" : "restaurants-mobile-es";

    // 1) Intentar BD primero (si existe)
    fetchWithSite(`/api/sliders/${encodeURIComponent(mobileKey)}`, {
      cache: "no-store",
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((db) => {
        if (cancelled) return;
        const items = Array.isArray(db?.items) ? db.items : [];
        const activeItems = items.filter((it: any) => it?.active !== false);
        const imagesFromDb = activeItems
          .map((it: any) => String(it?.image_url || "").trim())
          .filter(Boolean);
        const hrefsFromDb = activeItems.map((it: any) =>
          it?.href ? String(it.href) : "",
        );

        if (imagesFromDb.length > 0) {
          setRestaurantMobileImages(imagesFromDb);
          setRestaurantMobileHrefs(hrefsFromDb);
          setRestaurantMobileLoadedFromDb(true);
          return;
        }

        // 2) Fallback: carpeta pública vía API actual
        setRestaurantMobileLoadedFromDb(false);
        return fetchWithSite("/api/restaurant-slider-mobile", {
          cache: "no-store",
        })
          .then((r) => (r.ok ? r.json() : { images: [] }))
          .then((json) => {
            if (cancelled) return;
            const imgs: string[] = Array.isArray(json.images)
              ? json.images
              : [];
            setRestaurantMobileImages(imgs);
            // Derivar href por filename intentando matchear slug real igual que manifest
            const normKey = (str: string) =>
              String(str || "")
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .toLowerCase()
                .replace(/[^a-z0-9]/g, "");
            const restaurantIndex = (filteredHotels as any[]).map((h) => {
              const slug = String(h.slug || "");
              const esName = String(h.es?.name || "");
              const enName = String(h.en?.name || "");
              return {
                slug,
                keys: [normKey(slug), normKey(esName), normKey(enName)].filter(
                  Boolean,
                ),
              };
            });
            const hrefs = imgs.map((full) => {
              const fname = full.split("/").pop() || full;
              const base = fname
                .replace(/\.[^.]+$/, "")
                .replace(/-(1|2)$/i, "");
              const cleanedBase = base.replace(/^(sld|slm|sl)[ _-]+/i, "");
              const key = normKey(cleanedBase);
              let matchSlug: string | null = null;
              for (const row of restaurantIndex) {
                if (
                  row.keys.some(
                    (k: string) => k.startsWith(key) || key.startsWith(k),
                  )
                ) {
                  matchSlug = row.slug;
                  break;
                }
              }
              if (!matchSlug) {
                matchSlug = cleanedBase
                  .normalize("NFD")
                  .replace(/[\u0300-\u036f]/g, "")
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, "-")
                  .replace(/(^-|-$)/g, "");
              }
              return `/${matchSlug}`;
            });
            setRestaurantMobileHrefs(hrefs);
          });
      })
      .catch(() => {
        if (!cancelled) {
          setRestaurantMobileImages([]);
          setRestaurantMobileHrefs([]);
          setRestaurantMobileLoadedFromDb(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [isRestaurantsPage, filteredHotels, language, fetchWithSite]);

  // Override de descripciones ES/EN para slugs específicos (p. ej., PRIMA BAR)
  const enrichedHotels = (filteredHotels || []).map((h) => {
    if (String(h.slug) === "prima-bar") {
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
      return {
        ...h,
        es: { ...(h.es || {}), description: descES },
        en: { ...(h.en || {}), description: descEN },
      };
    }
    if (
      String(h.slug) === "the-singular" ||
      String(h.slug) === "restaurante-the-singular"
    ) {
      const descES = [
        "Ubicado en el histórico barrio Lastarria, el restaurante del Hotel The Singular aspira a ser un referente de la alta cocina chilena, fusionando tradición y modernidad. Su propuesta es un viaje culinario de norte a sur, resaltando la riqueza de los ingredientes locales con una ejecución técnica inspirada en la gastronomía francesa.",
        "La dirección de la cocina está a cargo del chef Hernán Basso, un profesional formado en Buenos Aires que ha dejado su huella en los fogones de The Singular Patagonia desde 2011. Su cocina es un homenaje a los sabores y productos chilenos, que interpreta con precisión y un toque vanguardista. La visión detrás de The Singular es de la familia Sahli, cuyo legado en la hotelería chilena se remonta al histórico Hotel Crillón. Con este proyecto buscaban crear un espacio que reflejara el lujo, la elegancia y la historia local.",
        "El menú del restaurante ofrece una selección de platos que destacan por su audacia y equilibrio. La calidad de su gastronomía y el impecable servicio le han valido múltiples galardones, incluyendo el reconocimiento en la lista de los 'Mejores Hoteles de Lujo en Chile' por Condé Nast Traveler y los 'World Travel Awards', consolidándolo como un destino culinario de primer nivel.",
        "Para completar la experiencia, el hotel cuenta con un Rooftop Bar considerado una de las mejores terrazas de Santiago. Este espacio ofrece vistas panorámicas del Cerro San Cristóbal y el Parque Forestal. Es el lugar ideal para disfrutar de una carta de coctelería de autor, vinos chilenos y tapas en un ambiente lounge, especialmente al atardecer.",
      ];
      const descEN = [
        "Located in the historic Barrio Lastarria, the restaurant at The Singular Hotel Santiago seeks to be a true benchmark of Chilean haute cuisine, blending tradition and modernity. Its culinary proposal is a journey from north to south, highlighting the richness of local ingredients executed with technical precision and a French-inspired touch.",
        "The kitchen is led by Chef Hernán Basso, a Buenos Aires–trained professional who has made his mark at The Singular Patagonia since 2011. His cuisine pays homage to Chilean flavors and ingredients, interpreted with precision and a touch of innovation. The vision behind The Singular comes from the Sahli family, whose legacy in Chilean hospitality dates back to the historic Hotel Crillón. With this project, they set out to create a space that reflects luxury, elegance, and local heritage.",
        "The menu offers a refined selection of dishes known for their boldness and balance. The quality of the cuisine and impeccable service have earned the restaurant multiple distinctions, including mentions among Chile’s Best Luxury Hotels by Condé Nast Traveler and awards from the World Travel Awards, establishing it as a culinary destination of excellence.",
        "To complete the experience, the hotel features a Rooftop Bar, considered one of Santiago’s best terraces. With panoramic views of Cerro San Cristóbal and Parque Forestal, it’s the ideal spot to enjoy signature cocktails, Chilean wines, and gourmet tapas in an elegant lounge atmosphere—especially at sunset.",
      ];
      return {
        ...h,
        es: { ...(h.es || {}), description: descES },
        en: { ...(h.en || {}), description: descEN },
      };
    }
    return h;
  });

  // Apply comuna filter if selectedComuna is set (match in descriptions or address)
  const finalHotels = selectedComuna
    ? enrichedHotels.filter((h) => {
        const slug = String(h.slug || "");
        // Si la comuna seleccionada es Santiago, aplicar whitelist estricta
        if (normalizeComuna(selectedComuna) === normalizeComuna("Santiago")) {
          return santiagoAllowedSlugs.has(slug);
        }

        // Si tenemos mapeo desde BD, usarlo como señal primaria
        if (selectedComunaSlug) {
          const mapped = dbPostCommuneMap?.[slug] || [];
          if (Array.isArray(mapped) && mapped.includes(selectedComunaSlug)) {
            return true;
          }
        }

        const addition = comunaAdditions[slug];
        if (addition) {
          const targets = Array.isArray(addition) ? addition : [addition];
          if (
            targets.some(
              (v) => normalizeComuna(v) === normalizeComuna(selectedComuna),
            )
          ) {
            return true;
          }
        }

        const override = comunaOverrides[slug];
        if (override) {
          // Si hay override, debe coincidir con alguna de las comunas declaradas
          const targets = Array.isArray(override) ? override : [override];
          return targets.some(
            (v) => normalizeComuna(v) === normalizeComuna(selectedComuna),
          );
        }

        // Construir un texto de búsqueda que incluya:
        // - descripciones ES/EN.
        // - dirección principal
        // - todas las direcciones y labels de las sucursales (locations[])
        const parts: string[] = [];
        if (Array.isArray(h.es?.description)) parts.push(...h.es.description);
        if (Array.isArray(h.en?.description)) parts.push(...h.en.description);
        if (h.address) parts.push(h.address);
        if (Array.isArray(h.locations)) {
          for (const loc of h.locations) {
            if (loc.address) parts.push(loc.address);
            if (loc.label) parts.push(loc.label);
          }
        }

        const haystack = normalizeComuna(parts.join(" "));
        return haystack.includes(normalizeComuna(selectedComuna));
      })
    : enrichedHotels;

  // Ordenar restaurantes alfabéticamente por nombre (según idioma actual)
  const sortKey = (h: any) =>
    String(h?.[language]?.name || h?.en?.name || h?.es?.name || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase()
      .trim();

  const cleanedList = finalHotels.filter(
    (h: any) => String(h.slug) !== "w-santiago",
  );
  const finalOrderedHotels = isRestaurantsPage
    ? cleanedList
        .slice()
        .sort((a, b) =>
          sortKey(a) < sortKey(b) ? -1 : sortKey(a) > sortKey(b) ? 1 : 0,
        )
    : cleanedList;

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white">
          <Header />
          <main className="site-inner py-4">
            <div className="w-full py-16 grid place-items-center text-gray-500">
              Cargando…
            </div>
          </main>
          <Footer activeCategory={slug} />
        </div>
      }
    >
      <div className="min-h-screen bg-white">
        <Header />

        <main className="site-inner py-4">
          {isRestaurantsPage ? (
            // Submenú de comunas para restaurantes con primer item "VOLVER"
            <nav className="py-4 hidden lg:block">
              <ul className="hidden lg:flex flex-nowrap items-center gap-2 text-sm font-medium whitespace-nowrap">
                {/* VOLVER - limpia filtro y vuelve al listado de restaurantes */}
                <li className="flex items-center gap-2">
                  <Link
                    href="/restaurantes"
                    className={`font-neutra hover:text-[var(--color-brand-red)] transition-colors tracking-wide text-[15px] leading-[20px] ${
                      !selectedComuna
                        ? "text-[var(--color-brand-red)]"
                        : "text-black"
                    }`}
                    onClick={() => setSelectedComuna(null)}
                  >
                    {t("VOLVER", "BACK")}
                  </Link>
                  <span className="text-black">•</span>
                </li>
                {communes.map((c, index) => {
                  const match = dbCommunes.find(
                    (row) =>
                      normalizeComuna(communeLabelFromRow(row)) ===
                      normalizeComuna(c),
                  );
                  const slugified = match
                    ? String(match.slug || "").trim()
                    : c.toLowerCase().replace(/\s+/g, "-");
                  const isActive =
                    !!selectedComuna &&
                    normalizeComuna(selectedComuna) === normalizeComuna(c);
                  return (
                    <li key={c} className="flex items-center gap-2">
                      <Link
                        href={`/restaurantes?comuna=${slugified}`}
                        className={`font-neutra hover:text-[var(--color-brand-red)] transition-colors tracking-wide text-[15px] leading-[20px] ${
                          isActive
                            ? "text-[var(--color-brand-red)]"
                            : "text-black"
                        }`}
                        onClick={() => setSelectedComuna(c)}
                      >
                        {c.toUpperCase()}
                      </Link>
                      {index < communes.length - 1 && (
                        <span className="text-black">•</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </nav>
          ) : (
            <div className="hidden lg:block">
              <CategoryNav activeCategory={slug} compact />
            </div>
          )}

          {/* En Monumentos Nacionales y Cafés: banner largo bajo el menú, luego posts */}
          {(slug === "monumentos-nacionales" || slug === "cafes") && (
            <div className="w-full mt-2">
              <BottomHomeBanner />
            </div>
          )}

          {/* Slider de restaurantes a ancho completo, sin banner, solo cuando no hay comuna seleccionada */}
          {isRestaurantsPage && !selectedComuna && (
            <div className="py-2">
              <div className="w-full overflow-hidden mb-0">
                <HeroSlider
                  desktopImages={restaurantSliderImages}
                  mobileImages={
                    // Si vienen desde BD (key ya es -es/-en), NO filtrar por sufijo.
                    restaurantMobileLoadedFromDb
                      ? restaurantMobileImages
                      : restaurantMobileImages.length > 0
                        ? language === "es"
                          ? restaurantMobileImages.filter((img) =>
                              /-1\./i.test(img),
                            )
                          : restaurantMobileImages.filter((img) =>
                              /-2\./i.test(img),
                            )
                        : restaurantDesktopLoadedFromDb
                          ? restaurantSliderImages
                          : language === "es"
                            ? restaurantSliderImages.filter((img) =>
                                /-1\./i.test(img),
                              )
                            : restaurantSliderImages.filter((img) =>
                                /-2\./i.test(img),
                              )
                  }
                  slideHrefsMobile={
                    restaurantMobileLoadedFromDb
                      ? restaurantMobileHrefs
                      : restaurantMobileHrefs.length > 0
                        ? language === "es"
                          ? restaurantMobileHrefs.filter((_, i) =>
                              /-1\./i.test(restaurantMobileImages[i] || ""),
                            )
                          : restaurantMobileHrefs.filter((_, i) =>
                              /-2\./i.test(restaurantMobileImages[i] || ""),
                            )
                        : undefined
                  }
                  // Ver imagen completa sin recortar y mantener el ancho del contenedor
                  autoHeight
                  // keep default desktop height (closer to other sliders)
                  desktopHeight={437}
                  mobileHeight={550}
                  slideHrefs={restaurantSlideHrefs}
                  dotInactiveClass="bg-gray-300 w-2 h-2"
                  dotActiveClass="bg-[#E40E36] w-3 h-3"
                  // mismo espacio para los puntos que en Home
                  dotBottom={16}
                />
              </div>
            </div>
          )}

          {/* Contador oculto por solicitud: se elimina el conteo de posts */}

          {/* Hotel Grid */}
          {loading ? (
            <div className="w-full py-16 grid place-items-center text-gray-500">
              <div className="flex items-center gap-2">
                <Spinner className="size-5" /> Cargando…
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-4">
              {finalOrderedHotels.length > 0 ? (
                finalOrderedHotels.map((hotel) => (
                  <HotelCard
                    key={hotel.slug}
                    slug={hotel.slug}
                    name={hotel[language].name}
                    subtitle={hotel[language].subtitle}
                    description={buildCardExcerpt(hotel[language].description)}
                    image={hotel.featuredImage || hotel.images?.[0] || ""}
                    imageVariant={
                      slug === "monumentos-nacionales" || slug === "cafes"
                        ? "tall"
                        : "default"
                    }
                  />
                ))
              ) : (
                <div className="col-span-full text-center py-12 text-gray-500">
                  <p>
                    {t(
                      "No hay hoteles disponibles en esta categoría.",
                      "No hotels available in this category.",
                    )}
                  </p>
                </div>
              )}
            </div>
          )}
        </main>

        <Footer activeCategory={slug} />
      </div>
    </Suspense>
  );
}

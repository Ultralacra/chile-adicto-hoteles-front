"use client";

import { Edit, Eye, Trash2, Plus, Search } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Spinner } from "@/components/ui/spinner";
import { useAdminApi } from "@/hooks/use-admin-api";

export default function PostsListPage() {
  const router = useRouter();
  const { fetchWithSite, currentSite } = useAdminApi();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("ALL");
  const [selectedComuna, setSelectedComuna] = useState<string | null>(null);
  const categoryIcons: Record<string, string> = {
    ALL: "🌐",
    NIÑOS: "🧒",
    ARQUITECTURA: "🏛️",
    BARRIOS: "🧭",
    ICONOS: "⭐",
    MERCADOS: "🛒",
    MIRADORES: "👀",
    CULTURA: "🎨",
    MUSEOS: "🎨", // alias
    PALACIOS: "🏰",
    PARQUES: "🌳",
    "PASEOS-FUERA-DE-SANTIAGO": "🚗",
    "FUERA DE STGO": "🚗",
    RESTAURANTES: "🍽️",
  };
  const [page, setPage] = useState(1);
  const [hotelsData, setHotelsData] = useState<any[]>([]);
  const [categoriesApi, setCategoriesApi] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const pageSize = 12;

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
  const comunaOverrides: Record<string, string | string[]> = {
    "ceiba-rooftop-bar-sabores-amazonicos": "Lo Barnechea",
    "ceiba-roof-top-renace-en-lo-barnechea": ["Lo Barnechea", "Santiago"],
    "casaluz-una-brillante-luz-en-barrio-italia": "Providencia",
    "anima-el-reino-de-lo-esencial": "Providencia",
    // Mirai debe aparecer en Las Condes y Santiago
    "mirai-food-lab": ["Las Condes", "Santiago"],
  };
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
  const normalizeComuna = (s: string) =>
    String(s || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase()
      .trim();
  const detectCommunesForRestaurant = (h: any): string[] => {
    const found = new Set<string>();
    const slug = String(h?.slug || "");

    const override = comunaOverrides[slug];
    if (override) {
      const arr = Array.isArray(override) ? override : [override];
      arr.forEach((c) => found.add(c));
    }

    const tryAdd = (raw?: string) => {
      if (!raw) return;
      const haystack = normalizeComuna(String(raw));
      for (const pc of possibleCommunes) {
        if (haystack.includes(normalizeComuna(pc))) {
          found.add(pc);
        }
      }
    };

    tryAdd(h?.address);
    if (Array.isArray(h?.locations)) {
      for (const loc of h.locations) {
        tryAdd(loc?.address);
        tryAdd(loc?.label);
      }
    }
    if (Array.isArray(h?.es?.description)) tryAdd(h.es.description.join("\n"));
    if (Array.isArray(h?.en?.description)) tryAdd(h.en.description.join("\n"));

    // Control fino: Santiago solo si está en whitelist
    if (found.has("Santiago") && !santiagoAllowedSlugs.has(slug)) {
      found.delete("Santiago");
    }

    return possibleCommunes.filter((c) => found.has(c));
  };

  // Cargar posts y categorías desde la API
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [pRes, cRes] = await Promise.all([
          fetchWithSite("/api/posts"),
          fetchWithSite("/api/categories"),
        ]);
        const p = pRes.ok ? await pRes.json() : [];
        const c = cRes.ok ? await cRes.json() : [];
        // Debug: imprimir en consola lo recibido desde la API/BD
        console.log("[Admin Posts] /api/posts ->", p);
        console.log("[Admin Posts] /api/categories ->", c);
        if (!cancelled) {
          setHotelsData(Array.isArray(p) ? p : []);
          setCategoriesApi(Array.isArray(c) ? c : []);
        }
      } catch (e) {
        console.error("[Admin Posts] Error cargando datos", e);
        if (!cancelled) {
          setHotelsData([]);
          setCategoriesApi([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [fetchWithSite, currentSite]);

  const allCategories = useMemo(() => {
    const base = ["ALL", ...categoriesApi];
    // Normalizar a mayúsculas únicas
    const seen = new Set<string>();
    return base
      .map((c) => String(c).toUpperCase())
      .filter((c) => (seen.has(c) ? false : (seen.add(c), true)));
  }, [categoriesApi]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matchesQuery = (h: any) => {
      const fields = [
        h.es?.name,
        h.en?.name,
        h.slug,
        h.es?.subtitle,
        h.en?.subtitle,
        h.address,
        h.website_display,
        h.instagram_display,
      ]
        .filter(Boolean)
        .map((x: string) => x.toLowerCase());
      return q ? fields.some((f: string) => f.includes(q)) : true;
    };
    const matchesCategory = (h: any) => {
      if (category === "ALL") return true;
      const cats = new Set<string>([
        ...(h.categories || []).map((c: string) => String(c).toUpperCase()),
      ]);
      if (h.es?.category) cats.add(String(h.es.category).toUpperCase());
      if (h.en?.category) cats.add(String(h.en.category).toUpperCase());
      return cats.has(category);
    };

    const matchesComuna = (h: any) => {
      if (category !== "RESTAURANTES") return true;
      if (!selectedComuna) return true;
      const comms = detectCommunesForRestaurant(h);
      return comms.includes(selectedComuna);
    };

    return hotelsData.filter(
      (h) => matchesQuery(h) && matchesCategory(h) && matchesComuna(h)
    );
  }, [query, category, hotelsData, selectedComuna]);

  const availableRestaurantCommunes = useMemo(() => {
    if (category !== "RESTAURANTES") return [] as string[];
    const restaurantsOnly = hotelsData.filter((h) => {
      const cats = new Set<string>([
        ...(h.categories || []).map((c: string) => String(c).toUpperCase()),
      ]);
      if (h.es?.category) cats.add(String(h.es.category).toUpperCase());
      if (h.en?.category) cats.add(String(h.en.category).toUpperCase());
      return cats.has("RESTAURANTES");
    });
    const found = new Set<string>();
    for (const h of restaurantsOnly) {
      detectCommunesForRestaurant(h).forEach((c) => found.add(c));
    }
    return possibleCommunes.filter((c) => found.has(c));
  }, [category, hotelsData]);

  // Inicializar categoría desde la URL si viene ?category=
  useEffect(() => {
    try {
      const params = new URLSearchParams(
        typeof window !== "undefined" ? window.location.search : ""
      );
      const c = params.get("category");
      if (c) setCategory(c.toUpperCase());

      const comuna = params.get("comuna");
      if (comuna) setSelectedComuna(comuna.replace(/-/g, " "));
    } catch (err) {
      // no-op in environments without window
    }
  }, []);

  useEffect(() => {
    // Si cambias de categoría y no es restaurantes, limpiar comuna
    if (category !== "RESTAURANTES" && selectedComuna) {
      setSelectedComuna(null);
    }
  }, [category, selectedComuna]);

  // Paginación
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const start = (page - 1) * pageSize;
  const pageItems = filtered.slice(start, start + pageSize);
  const goTo = (p: number) => setPage(Math.min(totalPages, Math.max(1, p)));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full px-4 lg:px-8 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Posts</h1>
            <p className="text-gray-600 mt-1">
              {filtered.length} de {hotelsData.length} posts
            </p>
          </div>
          <Link href="/admin/posts/new">
            <Button className="bg-red-600 hover:bg-red-700 gap-2">
              <Plus size={20} />
              Crear nuevo post
            </Button>
          </Link>
        </div>

        {/* Filtros: búsqueda + grid de categorías tipo iconos */}
        <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
            <Input
              value={query}
              onChange={(e) => {
                setPage(1);
                setQuery(e.target.value);
              }}
              placeholder="Buscar por nombre, slug, dirección o redes..."
              className="pl-10"
            />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
              Filtrar por categoría
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
              {allCategories.map((c) => {
                const active = category === c;
                const icon = categoryIcons[c] || "📁";
                return (
                  <button
                    key={c}
                    onClick={() => {
                      setCategory(c);
                      if (c !== "RESTAURANTES") setSelectedComuna(null);
                      setPage(1);
                    }}
                    className={`group flex flex-col items-center justify-center gap-1 border rounded-md px-2 py-3 transition-all text-xs font-medium tracking-tight hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${
                      active
                        ? "bg-red-600 text-white border-red-600 shadow"
                        : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
                    }`}
                    aria-pressed={active}
                  >
                    <span className="text-lg leading-none">{icon}</span>
                    <span className="text-[10px] leading-tight text-center line-clamp-2">
                      {c.replace(/-/g, " ")}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {category === "RESTAURANTES" && (
            <div className="pt-2">
              <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
                Filtrar por comuna (Restaurantes)
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    setSelectedComuna(null);
                    setPage(1);
                  }}
                  className={`border rounded-md px-3 py-2 text-xs font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${
                    !selectedComuna
                      ? "bg-red-600 text-white border-red-600 shadow"
                      : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
                  }`}
                  aria-pressed={!selectedComuna}
                >
                  TODAS
                </button>
                {availableRestaurantCommunes.map((com) => {
                  const active = selectedComuna === com;
                  return (
                    <button
                      key={com}
                      onClick={() => {
                        setSelectedComuna(com);
                        setPage(1);
                      }}
                      className={`border rounded-md px-3 py-2 text-xs font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${
                        active
                          ? "bg-red-600 text-white border-red-600 shadow"
                          : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
                      }`}
                      aria-pressed={active}
                    >
                      {com}
                    </button>
                  );
                })}
              </div>

              {selectedComuna && (
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <span className="text-xs text-gray-500">Comuna:</span>
                  <span className="text-xs font-semibold px-2 py-1 bg-red-50 text-red-700 rounded">
                    {selectedComuna}
                  </span>
                  <button
                    onClick={() => setSelectedComuna(null)}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Quitar comuna
                  </button>
                </div>
              )}
            </div>
          )}

          {category !== "ALL" && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs text-gray-500">Mostrando:</span>
              <span className="text-xs font-semibold px-2 py-1 bg-red-50 text-red-700 rounded">
                {category}
              </span>
              <button
                onClick={() => setCategory("ALL")}
                className="text-xs text-blue-600 hover:underline"
              >
                Quitar filtro
              </button>
            </div>
          )}
        </div>

        {/* Posts Grid */}
        {loading ? (
          <div className="w-full py-16 grid place-items-center text-gray-500">
            <div className="flex items-center gap-2">
              <Spinner className="size-5" /> Cargando…
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pageItems.map((hotel) => (
              <div
                key={hotel.slug}
                className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Image */}
                <div className="relative h-48 bg-gray-100">
                  <Image
                    src={
                      hotel.images?.[0] ||
                      hotel.featuredImage ||
                      "/placeholder.svg?height=200&width=400"
                    }
                    alt={hotel.es.name}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute top-2 right-2 flex gap-1">
                    {((hotel.categories as any[]) || [])
                      .slice(0, 2)
                      .map((cat: any) => (
                        <span
                          key={cat}
                          className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-medium text-gray-700"
                        >
                          {cat}
                        </span>
                      ))}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-semibold text-lg text-gray-900 mb-1 line-clamp-1">
                    {hotel.es?.name || hotel.en?.name || hotel.slug}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                    {hotel.es?.subtitle || hotel.en?.subtitle || ""}
                  </p>
                  <p className="text-xs text-gray-500 font-mono mb-4">
                    /{hotel.slug}
                  </p>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link
                      href={`/${hotel.slug}`}
                      target="_blank"
                      className="flex-1"
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full gap-2 bg-transparent"
                      >
                        <Eye size={16} />
                        Ver
                      </Button>
                    </Link>
                    <Link
                      href={`/admin/posts/edit/${hotel.slug}`}
                      className="flex-1"
                    >
                      <Button
                        size="sm"
                        className="w-full gap-2 bg-green-600 hover:bg-green-700"
                      >
                        <Edit size={16} />
                        Editar
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent"
                      onClick={() =>
                        alert("Funcionalidad de eliminar próximamente")
                      }
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {filtered.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <p className="text-gray-500">No se encontraron posts</p>
          </div>
        )}

        {/* Paginación */}
        {!loading && filtered.length > pageSize && (
          <Pagination className="mt-4">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    goTo(page - 1);
                  }}
                />
              </PaginationItem>
              {Array.from({ length: totalPages }).map((_, i) => (
                <PaginationItem key={i}>
                  <PaginationLink
                    href="#"
                    isActive={page === i + 1}
                    onClick={(e) => {
                      e.preventDefault();
                      goTo(i + 1);
                    }}
                  >
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    goTo(page + 1);
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </div>
  );
}

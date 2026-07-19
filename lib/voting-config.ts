// Configuración de votación: qué hoteles se muestran en cada categoría con su rating de corazones
// Los valores son slugs de posts (no nombres)

export type CategoryVoteConfig = {
  slugs5: string[];
  slugs4: string[];
};

export const VOTING_CATEGORIES: Record<string, CategoryVoteConfig> = {
  norte: {
    slugs5: [
      "casamolle-elqui",
      "casamolle-la-puntilla",
      "nayara-alto-atacama",
      "hotel-cumbres-san-pedro-de-atacama",
      "tierra-atacama",
      "explora-atacama",
    ],
    slugs4: [
      "noi-casa-atacama",
      "hotel-our-habitas-atacama",
      "desertica-atacama",
      "vivelo-elqui-landscape",
    ],
  },
  sur: {
    slugs5: [
      "awa-puerto-varas",
      "antumalal-pucon",
      "and-beyond-vira-vira",
      "park-lake-luxury-hotel",
      "hotel-refugia-chiloe",
      "hotel-loberias-del-sur",
      "reserva-biologica-huilo-huilo",
      "puyuhuapi-lodge-spa",
      "nuevo-wyndham-puerto-varas-pettra",
    ],
    slugs4: [
      "hotel-cava-estancia-rilan",
      "rakau-lodge",
      "ni-newen-hotel-lodge",
      "hotel-puerta-del-sur",
      "hotel-parque-quilquico",
      "el-remanso-del-puelo",
      "hotel-cabo-de-hornos",
      "hotel-bellavista-puerto-varas",
      "hotel-boutique-casa-d-agostino-un-refugio-de-elegancia-italiana-en-el-corazon-de-santiago",
      "hotel-magnolia-santiago-un-lujo-para-el-centro-de-la-capital",
    ],
  },
  "torres-del-paine": {
    slugs5: [
      "remota-patagonia-lodge",
      "explora-torres-del-paine",
      "hotel-the-singular-patagonia",
      "rio-serrano-hotel-spa",
      "hotel-tierra-patagonia",
      "hotel-las-torres",
    ],
    slugs4: [
      "noi-indigo-patagonia",
      "hotel-kau-rio-serrano",
      "hotel-costa-australis",
    ],
  },
  centro: {
    slugs5: [
      "hotel-las-majadas",
      "noi-puma-lodge",
      "hotel-radisson-blu-acqua-concon",
      "termas-de-jahuel-hotel-y-spa",
    ],
    slugs4: [
      "hotel-taka-matanzas",
      "casa-zapallar",
      "noi-blend-colchagua",
      "hotel-alaia-punta-de-lobos",
      "leonera-hotel",
      "la-pesebrera-del-maule",
    ],
  },
  santiago: {
    slugs5: [
      "noi-vitacura",
      "hotel-cumbres-lastarria",
      "hotel-the-singular-santiago",
      "w-santiago-un-lugar-para-conectar",
      "ac-hotel-santiago-cenco-costanera",
      "debaines-hotel",
      "hotel-wyndham-santiago-pettra",
    ],
    slugs4: [
      "luciano-k-hotel",
      "hotel-castillo-rojo",
      "hotel-almacruz",
      "pueblo-la-dehesa",
    ],
  },
  "isla-de-pascua": {
    slugs5: [
      "hotel-explora-rapa-nui-entre-playas-y-volcanes",
      "hotel-nayara-hangaroa",
    ],
    slugs4: [],
  },
  "joyas-unicas": {
    slugs5: [
      "patagonia-camp",
      "tawa-refugio-puelo",
      "hotel-estancia-cerro-guido",
      "hotel-altiplanico-rapa-nui",
      "unai-atacama-luxury-tents",
    ],
    slugs4: [],
  },
  "hoteles-de-nieve": {
    slugs5: [
      "hotel-termas-de-chillan",
      "corralco-hotel-spa",
      "hotel-ski-portillo",
    ],
    slugs4: [],
  },
  "hoteles-de-vina": {
    slugs5: [
      "hotel-boutique-la-casona-de-vina-matetic",
      "vibo-wine-lodge",
      "hotel-santacruz",
      "hotel-casa-bouchon",
      "clos-apalta-residence",
      "hotel-casa-real",
    ],
    slugs4: [],
  },
};

export function getHotelHearts(categorySlug: string, hotelSlug: string): number | null {
  const config = VOTING_CATEGORIES[categorySlug];
  if (!config) return null;

  if (config.slugs5.includes(hotelSlug)) return 5;
  if (config.slugs4.includes(hotelSlug)) return 4;
  return null;
}

export function isVotingCategory(slug: string): boolean {
  return slug in VOTING_CATEGORIES;
}

export function getVotingSlugsForCategory(categorySlug: string): string[] {
  const config = VOTING_CATEGORIES[categorySlug];
  if (!config) return [];
  return [...config.slugs5, ...config.slugs4];
}

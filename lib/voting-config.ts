// Configuración de votación: qué hoteles se muestran en cada categoría con su rating de corazones

export type HotelVoteConfig = {
  name: string; // Nombre exacto en español para matching
  hearts: 4 | 5;
};

export type CategoryVoteConfig = {
  hotels5: string[];
  hotels4: string[];
};

export const VOTING_CATEGORIES: Record<string, CategoryVoteConfig> = {
  norte: {
    hotels5: [
      "CASA MOLLE ELQUI",
      "CASA MOLLE LA PUNTILLA",
      "NAYARA ALTO ATACAMA",
      "CUMBRES ATACAMA",
      "TIERRA ATACAMA",
      "EXPLORA ATACAMA",
    ],
    hotels4: [
      "OUR HABITAS ATACAMA",
      "NOI CASA ATACAMA",
      "DESERTICA ATACAMA",
      "VIVELO ELQUI",
    ],
  },
  sur: {
    hotels5: [
      "AWA PUERTO VARAS",
      "ANTUMALAL PUCON",
      "AND BEYOND VIRA VIRA",
      "PARK LAKE LUXURY HOTEL",
      "HOTEL REFUGIA CHILOÉ",
      "HOTEL LOBERÍAS DEL SUR",
      "RESERVA BIOLÓGICA HUILO HUILO",
      "PUYUHUAPI LODGE & SPA",
      "NUEVO WYNDHAM PUERTO VARAS PETTRA",
    ],
    hotels4: [
      "HOTEL & CAVA ESTANCIA RILAN",
      "RAKAU LODGE",
      "NI-NEWEN HOTEL & LODGE",
      "HOTEL PUERTA DEL SUR",
      "HOTEL PARQUE QUILQUICO",
      "EL REMANSO DEL PUELO",
      "CABO DE HORNOS",
      "HOTEL CABO DE HORNOS",
      "HOTEL BELLAVISTA PUERTO VARAS",
    ],
  },
  "torres-del-paine": {
    hotels5: [
      "REMOTA PATAGONIA LODGE",
      "EXPLORA TORRES DEL PAINE",
      "THE SINGULAR PATAGONIA",
      "RIO SERRANO HOTEL & SPA",
      "TIERRA PATAGONIA",
      "LAS TORRES PATAGONIA",
    ],
    hotels4: [
      "NOI INDIGO PATAGONIA",
      "KAU RIO SERRANO PATAGONIA",
      "COSTA AUSTRALIS PUERTO NATALES",
    ],
  },
  centro: {
    hotels5: [
      "LAS MAJADAS DE PIRQUE",
      "NOI PUMA LODGE",
      "RADISSON BLU ACQUA CONCÓN",
      "TERMAS DE JAHUEL",
    ],
    hotels4: [
      "TAKA MATANZAS",
      "CASA ZAPALLAR",
      "NOI BLEND COLCHAGUA",
      "ALAIA PUNTA DE LOBOS",
      "LA LEONERA HOTEL",
      "PESEBRERA DEL MAULE",
    ],
  },
  santiago: {
    hotels5: [
      "NOI VITACURA",
      "THE SINGULAR SANTIAGO",
      "CUMBRES SANTIAGO",
      "HOTEL W SANTIAGO",
      "HOTEL AC MARRIOT CONSTANERA",
      "DEBAINES SANTIAGO",
      "WYNDHAM PETTRA SANTIAGO",
    ],
    hotels4: [
      "HOTEL LUCIANO K SANTIAGO",
      "HOTEL CASTILLO ROJO",
      "HOTEL ALMA CRUZ",
      "PUEBLO LA DEHESA",
    ],
  },
  "isla-de-pascua": {
    hotels5: ["EXPLORA RAPA NUI", "NAYARA HANGAROA"],
    hotels4: [],
  },
  "joyas-unicas": {
    hotels5: [
      "PATAGONIA CAMP",
      "TAWA",
      "ESTANCIA CERRO GUIDO",
      "ALTIPLANICO RAPA NUI",
      "UNAI ATACAMA",
    ],
    hotels4: [],
  },
  "hoteles-de-nieve": {
    hotels5: ["TERMAS CHILLAN", "CORRALCO", "PORTILLO"],
    hotels4: [],
  },
  "hoteles-de-vina": {
    hotels5: ["MATETIC", "VIBO WINE", "SANTA CRUZ", "BOUCHON", "CLOS APALTA RESIDENCE", "CASA REAL"],
    hotels4: [],
  },
};

// Construir mapa de nombre normalizado -> corazones para búsqueda rápida
function normalizeName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function getHotelHearts(categorySlug: string, hotelName: string): number | null {
  const config = VOTING_CATEGORIES[categorySlug];
  if (!config) return null;

  const normalizedHotel = normalizeName(hotelName);

  if (config.hotels5.some((h) => normalizeName(h) === normalizedHotel)) {
    return 5;
  }
  if (config.hotels4.some((h) => normalizeName(h) === normalizedHotel)) {
    return 4;
  }
  return null;
}

export function isVotingCategory(slug: string): boolean {
  return slug in VOTING_CATEGORIES;
}

export function getVotingHotelsForCategory(categorySlug: string): string[] {
  const config = VOTING_CATEGORIES[categorySlug];
  if (!config) return [];
  return [...config.hotels5, ...config.hotels4];
}

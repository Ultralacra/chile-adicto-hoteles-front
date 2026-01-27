export type Lang = "es" | "en";

export interface LocalizedContent {
  name: string;
  subtitle: string;
  // Array de párrafos (HTML permitido). Mantener orden.
  description: string[];
  // Contenido HTML libre para el bloque "Datos útiles" (opcional).
  // Si está presente, reemplaza el bloque estructurado (dirección/web/IG/horario/etc.).
  infoHtml?: string;
  // Campos opcionales por idioma si en algún momento se requieren
  category?: string;
  location?: string;
  distance?: string;
  amenities?: string[];
}

export interface PostContact {
  website?: string; // URL completa
  website_display?: string; // Texto a mostrar
  instagram?: string; // URL completa o @handle
  instagram_display?: string; // Texto a mostrar
  email?: string; // correo@dominio
  phone?: string; // normalizado a "tel:+..." si aplica
  address?: string; // multilinea permitida
  photosCredit?: string; // crédito de fotos
  reservationLink?: string; // URL de reserva
  hours?: string; // horario libre (texto)
  reservationPolicy?: string; // texto reservas (política o instrucción)
  interestingFact?: string; // dato de interés
  // Sucursales opcionales: si existe al menos una, la UI las usará en vez de address
  locations?: Array<{
    label?: string; // p.ej., "Factoría Franklin" o "MUT"
    address: string; // dirección de la sucursal
    hours?: string; // horario específico de la sucursal (opcional)
    website?: string; // URL de la sucursal (si aplica)
    website_display?: string; // texto para mostrar del sitio
    instagram?: string; // URL o @ handle de la sucursal
    instagram_display?: string; // texto para mostrar de IG
    reservationLink?: string; // URL de reservas de la sucursal
    reservationPolicy?: string; // texto de reservas
    interestingFact?: string; // dato de interés de la sucursal
    email?: string;
    phone?: string; // tel:+...
  }>;
}

export interface PostBase {
  slug: string;
  es: LocalizedContent;
  en: LocalizedContent;
  featuredImage?: string; // imagen principal (separada de la galería)
  images: string[]; // galería (excluye la destacada)
  categories: string[]; // etiquetas superiores (ALL/TODOS, NORTE, etc.)
}

export type Post = PostBase & PostContact;

// Resultado de validación para UI
export interface ValidationIssue {
  path: string;
  message: string;
}

export interface ValidationResult {
  ok: boolean;
  issues?: ValidationIssue[];
}

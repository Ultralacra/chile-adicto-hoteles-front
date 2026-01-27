import { z } from "zod";

// Slug normal permitido: letras/números en minúscula separados por guiones
const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
// Compatibilidad con slugs "trashed" heredados de WordPress
const slugTrashedOnly = /^__trashed$/; // exactamente "__trashed"
const slugWithTrashedSuffix = /^[a-z0-9]+(?:-[a-z0-9]+)*__trashed$/; // ej: "mi-post__trashed"

// Relajamos la validación: ningún campo de contenido es obligatorio
export const localizedSchema = z.object({
  name: z.string().optional(),
  subtitle: z.string().optional(),
  description: z.array(z.string()).optional(),
  // HTML libre para el bloque "Datos útiles" (opcional)
  infoHtml: z.string().optional(),
  category: z.string().optional(),
  location: z.string().optional(),
  distance: z.string().optional(),
  amenities: z.array(z.string()).optional(),
});

export const postSchema = z.object({
  // Permitimos: slug estándar o variantes '__trashed' de WordPress
  slug: z
    .string()
    .refine(
      (s) => slugRegex.test(s) || slugTrashedOnly.test(s) || slugWithTrashedSuffix.test(s),
      {
        message:
          "slug inválido: usa minusculas y guiones (o patrones de WordPress '__trashed')",
      }
    ),
  es: localizedSchema.optional(),
  en: localizedSchema.optional(),
  featuredImage: z.string().optional(),
  images: z.array(z.string()).optional(),
  categories: z.array(z.string().min(1)).optional(),
  website: z.string().optional(),
  website_display: z.string().optional(),
  instagram: z.string().optional(),
  instagram_display: z.string().optional(),
  // Email totalmente opcional, sin validar formato para no bloquear edición
  email: z.string().optional(),
  // Permitir cadena vacía o formato tel:+...; valores inválidos se descartan en normalización
  phone: z.union([z.string().regex(/^tel:\+?[0-9]+$/, "phone debe ser tel:+..." ), z.literal("")]).optional(),
  address: z.string().optional(),
  photosCredit: z.string().optional(),
  reservationLink: z.string().optional(),
  hours: z.string().optional(),
  reservationPolicy: z.string().optional(),
  interestingFact: z.string().optional(),
  locations: z
    .array(
      z.object({
        label: z.string().optional(),
        address: z.string().optional(),
        hours: z.string().optional(),
        website: z.string().optional(),
        website_display: z.string().optional(),
        instagram: z.string().optional(),
        instagram_display: z.string().optional(),
        reservationLink: z.string().optional(),
        reservationPolicy: z.string().optional(),
        interestingFact: z.string().optional(),
        // Email opcional sin validar formato
        email: z.string().optional(),
        phone: z.union([
          z.string().regex(/^tel:\+?[0-9]+$/, "phone debe ser tel:+..."),
          z.literal("")
        ]).optional(),
      })
    )
    .optional(),
});

export type PostInput = z.infer<typeof postSchema>;

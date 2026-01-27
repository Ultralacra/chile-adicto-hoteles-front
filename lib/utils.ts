import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Construye un excerpt para las cards uniendo párrafos hasta alcanzar un tamaño mínimo.
// - paragraphs: array de párrafos en texto plano (puede contener espacios/\n)
// - targetMinChars: cantidad mínima aproximada para asegurar 5 líneas con line-clamp-5
export function buildCardExcerpt(paragraphs: string[] | undefined, targetMinChars = 280): string {
  if (!Array.isArray(paragraphs) || paragraphs.length === 0) return "";
  // Unir párrafos respetando espacios, limpiar whitespace extra
  let out = "";
  for (const p of paragraphs) {
    const clean = String(p || "")
      .replace(/\s+/g, " ")
      .trim();
    if (!clean) continue;
    out = out ? `${out} ${clean}` : clean;
    if (out.length >= targetMinChars) break;
  }
  // Si sigue corto, añade más párrafos si hay
  if (out.length < targetMinChars) {
    for (let i = 0; i < paragraphs.length; i++) {
      const clean = String(paragraphs[i] || "")
        .replace(/\s+/g, " ")
        .trim();
      if (!clean) continue;
      if (out.includes(clean)) continue;
      out = `${out} ${clean}`.trim();
      if (out.length >= targetMinChars) break;
    }
  }
  return out;
}

// Normaliza una URL de imagen para comparaciones: extrae el último segmento del pathname
// y lo devuelve en minúsculas sin querystring. Esto ayuda a detectar duplicados
// aunque la URL tenga parámetros o diferencias en mayúsculas.
export function normalizeImageUrl(src?: string) {
  if (!src) return "";
  try {
    // Soporta URLs absolutas y relativas
    const u = new URL(src, "http://example.invalid");
    const parts = u.pathname.split("/").filter(Boolean);
    const last = parts.length ? parts[parts.length - 1] : u.pathname;
    return decodeURIComponent(String(last)).toLowerCase();
  } catch (e) {
    // Fallback: remove querystring and take last segment
    const withoutQuery = String(src).split("?")[0];
    const parts = withoutQuery.split("/").filter(Boolean);
    return (parts.length ? parts[parts.length - 1] : withoutQuery).toLowerCase();
  }
}

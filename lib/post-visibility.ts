export const HIDDEN_FRONT_SLUGS = new Set<string>([
  // Ocultos explícitamente en el frontend (en TODOS los sitios)
  "w-santiago",
]);

function normalize(s: unknown): string {
  return String(s ?? "")
    .trim()
    .toLowerCase();
}

function equalsIgnoreCase(a: unknown, b: unknown): boolean {
  return normalize(a) === normalize(b);
}

/**
 * Determina si un post debe ocultarse en el frontend.
 * Nota: NO afecta al admin (depende de dónde se use).
 * 
 * Lógica:
 * 1. Si está en HIDDEN_FRONT_SLUGS -> oculto en todos los sitios
 * 2. Si el post tiene un 'site' asignado y currentSite es diferente -> oculto
 * 3. Si el post no tiene 'site' pero currentSite es 'chileadicto' -> oculto (backward compatibility)
 */
export function isHiddenFrontPost(post: any, currentSite?: string): boolean {
  const slug = normalize(post?.slug);
  
  // Slugs explícitamente ocultos en todos los sitios
  if (HIDDEN_FRONT_SLUGS.has(slug)) return true;

  // Si se proporciona el sitio actual, verificar que el post pertenezca a ese sitio
  if (currentSite) {
    const postSite = post?.site;
    
    // Si el post tiene un sitio asignado
    if (postSite) {
      // Ocultar si no coincide con el sitio actual
      if (postSite !== currentSite) {
        return true;
      }
    } else {
      // Posts sin sitio asignado (legacy): solo mostrar en santiagoadicto
      if (currentSite === 'chileadicto') {
        return true;
      }
    }
  }

  return false;
}

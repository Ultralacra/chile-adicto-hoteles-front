import { redirect } from "next/navigation";

type Params = { slug: string };

// Esta ruta existe para compatibilidad: mantiene URLs "bonitas" sin depender
// estrictamente de rewrites, y evita un archivo vacío que rompe el routing.
export default function SlugCompatPage({ params }: { params: Params }) {
  const slug = String(params?.slug || "").trim();
  if (!slug) redirect("/");

  const categorySlugs = new Set([
    "iconos",
    "ninos",
    "arquitectura",
    "barrios",
    "mercados",
    "miradores",
    "museos",
    "palacios",
    "parques",
    "paseos-fuera-de-santiago",
    "restaurantes",
    "monumentos-nacionales",
    "cafes",
  ]);

  if (categorySlugs.has(slug)) {
    redirect(`/categoria/${slug}`);
  }

  redirect(`/lugar/${slug}`);
}

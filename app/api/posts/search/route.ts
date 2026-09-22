import { NextResponse } from "next/server";
import { getCurrentSiteId } from "@/lib/site-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function envOrNull(name: string) {
  const v = process.env[name];
  return v && v.length > 0 ? v : null;
}

function textMatchesQuery(text: string, q: string): boolean {
  if (!text) return false;
  if (text.startsWith(q)) return true;
  const words = text.split(/[^a-z0-9áéíóúüñ]+/i).filter(Boolean);
  return words.some((word) => word.startsWith(q));
}

async function anonRest(path: string) {
  const base = envOrNull("NEXT_PUBLIC_SUPABASE_URL");
  const anon = envOrNull("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  if (!base || !anon) return null;
  const url = `${base}/rest/v1${path}`;
  const res = await fetch(url, {
    headers: {
      apikey: anon,
      Authorization: `Bearer ${anon}`,
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return { ok: false as const, status: res.status, text };
  }
  const json = await res.json();
  return { ok: true as const, items: Array.isArray(json) ? json : [] };
}

// GET /api/posts/search?q=...&limit=30
export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = String(url.searchParams.get("q") || "").trim().toLowerCase();
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") || 30) || 30, 5), 100);

  const siteId = await getCurrentSiteId(req);

  const select = "slug,featured_image,translations:post_translations(lang,name)";

  // Traer un conjunto amplio antes de filtrar evita perder coincidencias
  // cuando los primeros registros ordenados por slug no contienen la búsqueda.
  const basePath = `/posts?select=${encodeURIComponent(select)}&site=eq.${siteId}&order=slug.asc&limit=500`;

  const result = await anonRest(basePath);
  if (!result) return NextResponse.json({ items: [] }, { status: 200 });
  if (!result.ok) {
    return NextResponse.json(
      { items: [], warning: `supabase_error_${result.status}`, message: result.text },
      { status: 200 }
    );
  }

  const mapped = result.items
    .map((p: any) => {
      const trEs = (p.translations || []).find((t: any) => t.lang === "es") || {};
      const trEn = (p.translations || []).find((t: any) => t.lang === "en") || {};
      return {
        slug: String(p.slug || ""),
        featuredImage: p.featured_image || null,
        name_es: trEs.name || "",
        name_en: trEn.name || "",
      };
    })
    .filter((p: any) => p.slug);

  if (!q) return NextResponse.json({ items: mapped.slice(0, limit) }, { status: 200 });

  const qLower = q.toLowerCase();
  const filtered = mapped
    .filter((p: any) => {
      const nameEs = (p.name_es || "").toLowerCase();
      const nameEn = (p.name_en || "").toLowerCase();
      const slug = (p.slug || "").toLowerCase();
      return (
        textMatchesQuery(nameEs, qLower) ||
        textMatchesQuery(nameEn, qLower) ||
        textMatchesQuery(slug, qLower)
      );
    })
    .sort((a: any, b: any) => {
      const aStarts =
        (a.name_es || "").toLowerCase().startsWith(qLower) ||
        (a.name_en || "").toLowerCase().startsWith(qLower);
      const bStarts =
        (b.name_es || "").toLowerCase().startsWith(qLower) ||
        (b.name_en || "").toLowerCase().startsWith(qLower);
      if (aStarts !== bStarts) return aStarts ? -1 : 1;
      return 0;
    })
    .slice(0, limit);

  return NextResponse.json({ items: filtered }, { status: 200 });
}

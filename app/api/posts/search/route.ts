import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function envOrNull(name: string) {
  const v = process.env[name];
  return v && v.length > 0 ? v : null;
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

  const select = "slug,featured_image,translations:post_translations(lang,name)";

  // Sin q: devolver algunos posts (orden por slug)
  const basePath = `/posts?select=${encodeURIComponent(select)}&order=slug.asc&limit=${limit}`;

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

  const filtered = mapped
    .filter((p: any) => {
      const hay = `${p.slug} ${p.name_es} ${p.name_en}`.toLowerCase();
      return hay.includes(q);
    })
    .slice(0, limit);

  return NextResponse.json({ items: filtered }, { status: 200 });
}

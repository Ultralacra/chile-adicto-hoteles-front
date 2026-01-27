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
  if (!res.ok) return null;
  return res.json();
}

async function serviceRest(path: string, init?: RequestInit) {
  const base = envOrNull("NEXT_PUBLIC_SUPABASE_URL");
  const service = envOrNull("SUPABASE_SERVICE_ROLE_KEY");
  if (!base || !service)
    throw new Error(
      "Supabase Service Role no configurado (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)"
    );
  const url = `${base}/rest/v1${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      apikey: service,
      Authorization: `Bearer ${service}`,
      Prefer: "return=representation",
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase write error ${res.status}: ${text}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

// POST /api/communes/map
// Body: { slugs: string[] }
// Devuelve: { communes: [{slug,label,show_in_menu,menu_order}], map: { [postSlug]: string[] } }
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const slugsIn = Array.isArray(body?.slugs) ? body.slugs : [];
    const slugs = slugsIn
      .map((s: any) => String(s || "").trim())
      .filter(Boolean);

    // 1) Comunas
    const communesRows: any[] | null = await anonRest(
      "/communes?select=slug,label,show_in_menu,menu_order&order=menu_order.asc,label.asc"
    );
    const hiddenNavSlugs = new Set(["independencia"]);
    const restaurantMenuSlugs = new Set([
      "vitacura",
      "las-condes",
      "santiago",
      "lo-barnechea",
      "providencia",
      "alto-jahuel",
      "la-reina",
    ]);

    const communes = Array.isArray(communesRows)
      ? communesRows
          .map((r: any) => ({
            slug: String(r.slug || ""),
            label: r.label ?? null,
            show_in_menu: r.show_in_menu ?? true,
            menu_order: Number.isFinite(Number(r.menu_order)) ? Number(r.menu_order) : 0,
          }))
          .filter((r: any) => {
            const slug = String(r.slug || "").trim().toLowerCase();
            if (!slug) return false;
            if (hiddenNavSlugs.has(slug)) return false;
            return restaurantMenuSlugs.has(slug);
          })
      : [];

    if (slugs.length === 0) {
      return NextResponse.json({ communes, map: {} }, { status: 200 });
    }

    // 2) Resolver ids de posts por slug
    const posts: any[] =
      (await serviceRest(
        `/posts?slug=in.(${slugs.map((s: string) => `"${s.replace(/\"/g, "")}"`).join(",")})&select=id,slug`
      )) || [];

    const idToSlug = new Map<string, string>();
    const ids: string[] = [];
    for (const p of Array.isArray(posts) ? posts : []) {
      const id = String(p.id || "").trim();
      const slug = String(p.slug || "");
      if (id && slug) {
        idToSlug.set(id, slug);
        ids.push(id);
      }
    }

    if (ids.length === 0) {
      return NextResponse.json({ communes, map: {} }, { status: 200 });
    }

    // 3) Leer mapeo post_communes
    const inList = ids.map((id) => `"${id.replace(/\"/g, "")}"`).join(",");
    const links: any[] =
      (await serviceRest(
        `/post_communes?post_id=in.(${inList})&select=post_id,commune_slug`
      )) || [];

    const map: Record<string, string[]> = {};
    for (const row of Array.isArray(links) ? links : []) {
      const postId = String(row.post_id || "").trim();
      const communeSlug = String(row.commune_slug || "").trim();
      const postSlug = idToSlug.get(postId);
      if (!postSlug || !communeSlug) continue;
      if (!map[postSlug]) map[postSlug] = [];
      if (!map[postSlug].includes(communeSlug)) map[postSlug].push(communeSlug);
    }

    return NextResponse.json({ communes, map }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { communes: [], map: {}, error: "internal_error", message: String(err?.message || err) },
      { status: 200 }
    );
  }
}

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

function requireAdminKey(req: Request) {
  const required = envOrNull("ADMIN_API_KEY");
  if (!required) return;
  const provided = req.headers.get("x-admin-key");
  if (!provided || provided !== required) {
    throw new Error("unauthorized");
  }
}

export async function GET(_req: Request, { params }: { params: any }) {
  try {
    const ctx = (await (params as any)) as { slug?: string };
    const slug = String(ctx?.slug || "").trim();
    if (!slug) return NextResponse.json({ slug: "", commune: null, posts: [] }, { status: 200 });

    const communeRows: any[] | null = await anonRest(
      `/communes?slug=eq.${encodeURIComponent(slug)}&select=slug,label,show_in_menu,menu_order`
    );
    const commune = Array.isArray(communeRows) && communeRows.length > 0 ? communeRows[0] : null;

    // Links -> post_id
    const links: any[] =
      (await serviceRest(
        `/post_communes?commune_slug=eq.${encodeURIComponent(slug)}&select=post_id`
      )) || [];
    const ids = (Array.isArray(links) ? links : [])
      .map((r: any) => String(r?.post_id || "").trim())
      .filter(Boolean);

    if (ids.length === 0) {
      return NextResponse.json({ slug, commune, posts: [] }, { status: 200 });
    }

    const inList = ids.map((id) => `"${id.replace(/\"/g, "")}"`).join(",");
    const posts: any[] =
      (await serviceRest(
        `/posts?id=in.(${inList})&select=id,slug,featured_image,translations:post_translations(lang,name)`
      )) || [];

    const mapped = (Array.isArray(posts) ? posts : [])
      .map((p: any) => {
        const trEs = (p.translations || []).find((t: any) => t.lang === "es") || {};
        const trEn = (p.translations || []).find((t: any) => t.lang === "en") || {};
        return {
          id: p.id,
          slug: String(p.slug || ""),
          featuredImage: p.featured_image || null,
          name_es: trEs.name || "",
          name_en: trEn.name || "",
        };
      })
      .filter((p: any) => p.slug)
      .sort((a: any, b: any) => a.slug.localeCompare(b.slug));

    return NextResponse.json({ slug, commune, posts: mapped }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { slug: "", commune: null, posts: [], error: "internal_error", message: String(err?.message || err) },
      { status: 200 }
    );
  }
}

// POST /api/communes/[slug]  body: { postSlug: string } -> asigna
export async function POST(req: Request, { params }: { params: any }) {
  try {
    requireAdminKey(req);
    const ctx = (await (params as any)) as { slug?: string };
    const communeSlug = String(ctx?.slug || "").trim();
    if (!communeSlug) {
      return NextResponse.json({ ok: false, message: "missing_commune" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const postSlug = String(body?.postSlug || body?.slug || "").trim();
    if (!postSlug) {
      return NextResponse.json({ ok: false, message: "missing_postSlug" }, { status: 400 });
    }

    const posts: any[] =
      (await serviceRest(`/posts?slug=eq.${encodeURIComponent(postSlug)}&select=id,slug`)) || [];
    if (!Array.isArray(posts) || posts.length === 0) {
      return NextResponse.json({ ok: false, message: "post_not_found" }, { status: 404 });
    }
    const postId = String(posts[0].id || "").trim();
    if (!postId) {
      return NextResponse.json({ ok: false, message: "post_invalid_id" }, { status: 400 });
    }

    await serviceRest(`/post_communes?on_conflict=post_id,commune_slug`, {
      method: "POST",
      headers: {
        Prefer: "return=representation,resolution=merge-duplicates",
      },
      body: JSON.stringify([{ post_id: postId, commune_slug: communeSlug }]),
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err: any) {
    const msg = String(err?.message || err);
    if (msg === "unauthorized") {
      return NextResponse.json({ ok: false, message: "unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ ok: false, message: msg }, { status: 400 });
  }
}

// DELETE /api/communes/[slug]?postSlug=... -> quitar
export async function DELETE(req: Request, { params }: { params: any }) {
  try {
    requireAdminKey(req);
    const ctx = (await (params as any)) as { slug?: string };
    const communeSlug = String(ctx?.slug || "").trim();
    if (!communeSlug) {
      return NextResponse.json({ ok: false, message: "missing_commune" }, { status: 400 });
    }

    const url = new URL(req.url);
    const postSlug = String(url.searchParams.get("postSlug") || "").trim();
    if (!postSlug) {
      return NextResponse.json({ ok: false, message: "missing_postSlug" }, { status: 400 });
    }

    const posts: any[] =
      (await serviceRest(`/posts?slug=eq.${encodeURIComponent(postSlug)}&select=id,slug`)) || [];
    if (!Array.isArray(posts) || posts.length === 0) {
      return NextResponse.json({ ok: false, message: "post_not_found" }, { status: 404 });
    }
    const postId = String(posts[0].id || "").trim();
    if (!postId) {
      return NextResponse.json({ ok: false, message: "post_invalid_id" }, { status: 400 });
    }

    await serviceRest(
      `/post_communes?post_id=eq.${encodeURIComponent(postId)}&commune_slug=eq.${encodeURIComponent(communeSlug)}`,
      { method: "DELETE", headers: { Prefer: "return=representation" } }
    );

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err: any) {
    const msg = String(err?.message || err);
    if (msg === "unauthorized") {
      return NextResponse.json({ ok: false, message: "unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ ok: false, message: msg }, { status: 400 });
  }
}

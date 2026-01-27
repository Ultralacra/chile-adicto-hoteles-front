import { NextResponse } from "next/server";

function envOrNull(name: string) {
  const v = process.env[name];
  return v && v.length > 0 ? v : null;
}

async function fetchFromSupabase(path: string, init?: RequestInit) {
  const base = envOrNull("NEXT_PUBLIC_SUPABASE_URL");
  const anon = envOrNull("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  if (!base || !anon) return null;
  const url = `${base}/rest/v1${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      apikey: anon,
      Authorization: `Bearer ${anon}`,
      Prefer: "return=representation",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase error ${res.status}: ${text}`);
  }
  return res.json();
}

function mapRowToLegacy(row: any) {
  const images = Array.isArray(row.images)
    ? row.images.slice().sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0)).map((x: any) => x.url)
    : [];
  const locs = Array.isArray(row.locations)
    ? row.locations.slice().sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0)).map((l: any) => ({
        label: l.label || null,
        address: l.address || null,
        hours: l.hours || null,
        website: l.website || null,
        website_display: l.website_display || null,
        instagram: l.instagram || null,
        instagram_display: l.instagram_display || null,
        reservationLink: l.reservation_link || null,
        reservationPolicy: l.reservation_policy || null,
        interestingFact: l.interesting_fact || null,
        email: l.email || null,
        phone: l.phone || null,
      }))
    : [];
  const trEs = (row.translations || []).find((t: any) => t.lang === "es") || {};
  const trEn = (row.translations || []).find((t: any) => t.lang === "en") || {};
  const categories = Array.isArray(row.category_links)
    ? row.category_links.map((r: any) => r.category?.label_es || r.category?.slug).filter(Boolean)
    : [];
  return {
    slug: row.slug,
    featuredImage: row.featured_image || null,
    website: row.website || null,
    instagram: row.instagram || null,
    website_display: row.website_display || null,
    instagram_display: row.instagram_display || null,
    email: row.email || null,
    phone: row.phone || null,
    photosCredit: row.photos_credit || null,
    address: row.address || null,
    hours: row.hours || null,
    reservationLink: row.reservation_link || null,
    reservationPolicy: row.reservation_policy || null,
    interestingFact: row.interesting_fact || null,
    images,
    locations: locs,
    es: {
      name: trEs.name || "",
      subtitle: trEs.subtitle || "",
      description: Array.isArray(trEs.description) ? trEs.description : [],
      category: trEs.category || null,
    },
    en: {
      name: trEn.name || "",
      subtitle: trEn.subtitle || "",
      description: Array.isArray(trEn.description) ? trEn.description : [],
      category: trEn.category || null,
    },
    categories,
  };
}

// GET /api/posts/by-category/[slug]
export async function GET(req: Request, { params }: { params: { slug: string } }) {
  try {
    const ctx = (await (params as any)) as { slug?: string };
    const categorySlug = String(ctx?.slug || "").trim();

    const url = new URL(req.url);
    const q = url.searchParams.get("q") || "";
    const select =
      "slug,featured_image,website,instagram,website_display,instagram_display,email,phone,photos_credit,address,hours,reservation_link,reservation_policy,interesting_fact,images:post_images(url,position),locations:post_locations(*),translations:post_translations(*),category_links:post_category_map(category:categories(slug,label_es,label_en))";
    let rows: any[] | null = await fetchFromSupabase(`/posts?select=${encodeURIComponent(select)}`);
    if (!rows) return NextResponse.json([], { status: 200 });

    // Filtrar por slug de categoría. Fallback: si no hay mapeo, usar category de traducciones.
    const slugTarget = categorySlug.toLowerCase().trim();
    const matchesTranslationCategory = (r: any) => {
      const translations = Array.isArray(r.translations) ? r.translations : [];
      return translations.some((t: any) => {
        if (!t?.category) return false;
        const cat = String(t.category).toLowerCase().trim();
        // Normalizar espacios a guiones para casos futuros ("Alta Cocina" -> "alta-cocina")
        const catSlug = cat.replace(/\s+/g, "-");
        return cat === slugTarget || catSlug === slugTarget;
      });
    };
    rows = rows.filter((r: any) => {
      const mapped = (r.category_links || []).some((c: any) => (c.category?.slug || "") === slugTarget);
      return mapped || matchesTranslationCategory(r);
    });

    const qc = q.trim().toLowerCase();
    if (qc) {
      rows = rows.filter((r: any) => {
        const trEs = (r.translations || []).find((t: any) => t.lang === "es") || {};
        const trEn = (r.translations || []).find((t: any) => t.lang === "en") || {};
        const fields = [r.slug, trEs.name, trEn.name, trEs.subtitle, trEn.subtitle, r.address, r.website_display, r.instagram_display]
          .filter(Boolean)
          .map((x: string) => x.toLowerCase());
        return fields.some((f: string) => f.includes(qc));
      });
    }

    return NextResponse.json(rows.map(mapRowToLegacy), { status: 200 });
  } catch (err: any) {
    console.error("[GET /api/posts/by-category/[slug]] error", err);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}

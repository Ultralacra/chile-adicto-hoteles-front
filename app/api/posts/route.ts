// Limpieza: reemplazo completo del archivo con implementación válida
import { NextResponse } from "next/server";
import { postSchema } from "@/lib/post-schema";
import { normalizePost } from "@/lib/post-normalize";
import { getCurrentSiteId } from "@/lib/site-utils";

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

async function serviceRest(path: string, init?: RequestInit) {
  const base = envOrNull("NEXT_PUBLIC_SUPABASE_URL");
  const service = envOrNull("SUPABASE_SERVICE_ROLE_KEY");
  if (!base || !service) throw new Error("Supabase Service Role no configurado");
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

function mapRowToLegacy(row: any) {
  const images = Array.isArray(row.images)
    ? row.images
        .slice()
        .sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0))
        .map((x: any) => x.url)
    : [];
  const locs = Array.isArray(row.locations)
    ? row.locations
        .slice()
        .sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0))
        .map((l: any) => ({
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
  const useful = Array.isArray(row.useful) ? row.useful : [];
  const uEs = useful.find((u: any) => (u.lang || "").toLowerCase() === "es") || {};
  const uEn = useful.find((u: any) => (u.lang || "").toLowerCase() === "en") || {};
  const categories = Array.isArray(row.category_links)
    ? row.category_links.map((r: any) => r.category?.label_es || r.category?.slug).filter(Boolean)
    : [];
  return {
    slug: row.slug,
    site: row.site || null, // ¡Importante! Campo para multi-sitio
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
      infoHtml: trEs.info_html || undefined,
      infoHtmlNew: uEs.html || undefined,
      category: trEs.category || null,
    },
    en: {
      name: trEn.name || "",
      subtitle: trEn.subtitle || "",
      description: Array.isArray(trEn.description) ? trEn.description : [],
      infoHtml: trEn.info_html || undefined,
      infoHtmlNew: uEn.html || undefined,
      category: trEn.category || null,
    },
    categories,
  };
}

export async function GET(req: Request) {
  try {
    const siteId = await getCurrentSiteId(req);
    const url = new URL(req.url);
    const q = url.searchParams.get("q") || "";
    const category = url.searchParams.get("category");
    const categorySlug = url.searchParams.get("categorySlug");
    
    // DEBUG: Log del sitio detectado
    console.log('🔍 [API /posts] Sitio detectado:', siteId);
    console.log('🔍 [API /posts] Parámetros:', { q, category, categorySlug });

    const select =
      "slug,featured_image,website,instagram,website_display,instagram_display,email,phone,photos_credit,address,hours,reservation_link,reservation_policy,interesting_fact,site,images:post_images(url,position),locations:post_locations(*),translations:post_translations(*),useful:post_useful_info(*),category_links:post_category_map(category:categories(slug,label_es,label_en))";
    let rows: any[] | null = await fetchFromSupabase(
      `/posts?select=${encodeURIComponent(select)}&site=eq.${siteId}`
    );

    if (rows) {
      if (category || categorySlug) {
        const catU = category ? category.toUpperCase() : null;
        const slugTarget = categorySlug ? categorySlug.toLowerCase().trim() : null;

        const matchesTranslationCategorySlug = (r: any) => {
          if (!slugTarget) return false;
          const translations = Array.isArray(r.translations) ? r.translations : [];
          return translations.some((t: any) => {
            if (!t?.category) return false;
            const cat = String(t.category).toLowerCase().trim();
            const catSlug = cat.replace(/\s+/g, "-");
            return cat === slugTarget || catSlug === slugTarget;
          });
        };

        rows = rows.filter((r: any) => {
          const matchByLabel = catU
            ? (r.translations || []).some(
                (t: any) => (t.category || "").toUpperCase() === catU
              ) ||
              (r.category_links || []).some(
                (c: any) => (c.category?.label_es || "").toUpperCase() === catU
              )
            : false;
          const matchBySlug = slugTarget
            ? (r.category_links || []).some(
                (c: any) => String(c.category?.slug || "") === slugTarget
              ) || matchesTranslationCategorySlug(r)
            : false;

          return (catU ? matchByLabel : false) || (slugTarget ? matchBySlug : false);
        });
      }
      const qc = q.trim().toLowerCase();
      if (qc) {
        rows = rows.filter((r: any) => {
          const trEs = (r.translations || []).find((t: any) => t.lang === "es") || {};
          const trEn = (r.translations || []).find((t: any) => t.lang === "en") || {};
          const fields = [
            r.slug,
            trEs.name,
            trEn.name,
            trEs.subtitle,
            trEn.subtitle,
            r.address,
            r.website_display,
            r.instagram_display,
          ]
            .filter(Boolean)
            .map((x: string) => x.toLowerCase());
          return fields.some((f: string) => f.includes(qc));
        });
      }
      const mapped = rows.map(mapRowToLegacy);
      console.log(`✅ [API /posts] Retornando ${mapped.length} posts para sitio ${siteId}`);
      if (mapped.length > 0) {
        console.log('   Primeros posts:', mapped.slice(0, 3).map(p => p.slug));
      }
      return NextResponse.json(mapped, { status: 200 });
    }
    return NextResponse.json([], { status: 200 });
  } catch (err: any) {
    console.error("[GET /api/posts] error", err);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const siteId = await getCurrentSiteId(req);
    const body = await req.json();
    const normalized = normalizePost(body);
    const parsed = postSchema.safeParse(normalized);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const existing: any[] = await serviceRest(
      `/posts?slug=eq.${encodeURIComponent(normalized.slug)}&site=eq.${siteId}&select=id`
    );
    if (Array.isArray(existing) && existing.length > 0) {
      return NextResponse.json(
        { ok: false, error: "slug_exists" },
        { status: 409 }
      );
    }

    const featured = normalized.featuredImage || normalized.images?.[0] || null;
    const insertedPosts: any[] = await serviceRest(`/posts`, {
      method: "POST",
      body: JSON.stringify([
        {
          slug: normalized.slug,
          site: siteId,
          featured_image: featured,
          website: normalized.website || null,
          website_display: normalized.website_display || null,
          instagram: normalized.instagram || null,
          instagram_display: normalized.instagram_display || null,
          email: normalized.email || null,
          phone: normalized.phone || null,
          address: normalized.address || null,
          photos_credit: normalized.photosCredit || null,
          hours: normalized.hours || null,
          reservation_link: normalized.reservationLink || null,
          reservation_policy: normalized.reservationPolicy || null,
          interesting_fact: normalized.interestingFact || null,
        },
      ]),
    });
    const postId = insertedPosts?.[0]?.id;
    if (!postId) throw new Error("No se pudo obtener id del nuevo post");

    const esT = normalized.es || { name: "", subtitle: "", description: [], infoHtml: null, category: null } as any;
    const enT = normalized.en || { name: "", subtitle: "", description: [], infoHtml: null, category: null } as any;
    const translationsPayload = [
      {
        post_id: postId,
        lang: "es",
        name: esT.name || "",
        subtitle: esT.subtitle || "",
        description: Array.isArray(esT.description) ? esT.description : [],
        info_html: null,
        category: esT.category || null,
      },
      {
        post_id: postId,
        lang: "en",
        name: enT.name || "",
        subtitle: enT.subtitle || "",
        description: Array.isArray(enT.description) ? enT.description : [],
        info_html: null,
        category: enT.category || null,
      },
    ];
    const anyContent = translationsPayload.some(t => (t.name || t.subtitle || t.info_html || t.category || (Array.isArray(t.description) && t.description.length > 0)));
    if (anyContent) {
      try {
        await serviceRest(`/post_translations`, { method: "POST", body: JSON.stringify(translationsPayload) });
      } catch (e: any) {
        let errCurr: any = e;
        const prune = new Set<string>();
        const firstMsg = String(errCurr?.message || "");
        for (const m of firstMsg.matchAll(/Could not find the '([a-zA-Z0-9_]+)' column/gi)) prune.add(m[1]);
        if (prune.size > 0) {
          const fb = translationsPayload.map(t => { const c: any = { ...t }; for (const col of prune) delete c[col]; return c; });
          try { await serviceRest(`/post_translations`, { method: "POST", body: JSON.stringify(fb) }); console.warn("[POST posts] degradado traducciones columnas faltantes", Array.from(prune)); errCurr = null; } catch (e2:any){ errCurr = e2; }
        }
        if (errCurr) {
          for (let i = 0; i < 5 && errCurr; i++) {
            const msg = String(errCurr?.message || "");
            const mm = msg.match(/column\s+[^.]*\.?([a-zA-Z0-9_]+)\s+does not exist/i);
            if (!mm) break;
            prune.add(mm[1]);
            const fb = translationsPayload.map(t => { const c: any = { ...t }; for (const col of prune) delete c[col]; return c; });
            try { await serviceRest(`/post_translations`, { method: "POST", body: JSON.stringify(fb) }); errCurr = null; break; } catch (e3:any){ errCurr = e3; }
          }
        }
        if (errCurr) throw errCurr;
      }
    }

    // Guardar datos útiles en post_useful_info (solo si hay HTML por idioma)
    const usefulPayload: any[] = [];
    if (esT.infoHtml && String(esT.infoHtml).trim() !== "") {
      usefulPayload.push({ post_id: postId, lang: "es", html: String(esT.infoHtml).trim() });
    }
    if (enT.infoHtml && String(enT.infoHtml).trim() !== "") {
      usefulPayload.push({ post_id: postId, lang: "en", html: String(enT.infoHtml).trim() });
    }
    if (usefulPayload.length > 0) {
      await serviceRest(`/post_useful_info`, {
        method: "POST",
        body: JSON.stringify(usefulPayload),
        headers: { Prefer: "return=representation,resolution=merge-duplicates" },
      });
    }

    const imagesPayload = (normalized.images || []).map((url, idx) => ({
      post_id: postId,
      url,
      position: idx,
    }));
    if (imagesPayload.length > 0) {
      await serviceRest(`/post_images`, { method: "POST", body: JSON.stringify(imagesPayload) });
    }

    try {
      const cats: any[] = await serviceRest(`/categories?select=id,slug,label_es,label_en`);
      const wanted = new Set((normalized.categories || []).map(c => String(c).toUpperCase()));
      const catIds = cats
        .filter(r => wanted.has(String(r.label_es || r.slug || "").toUpperCase()))
        .map(r => r.id);
      if (catIds.length > 0) {
        await serviceRest(`/post_category_map`, { method: "POST", body: JSON.stringify(catIds.map((id: number) => ({ post_id: postId, category_id: id }))) });
      }
    } catch (e) {
      console.warn("[POST posts] Categorías: continuidad tras fallo en mapeo", e);
    }

    return NextResponse.json({ ok: true, slug: normalized.slug }, { status: 201 });
  } catch (err: any) {
    console.error("[POST /api/posts] error", err);
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
}

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
  let images = Array.isArray(row.images)
    ? row.images
        .slice()
        .sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0))
        .map((x: any) => x.url)
    : [];
  // Fallback: si no hay post_images, exponer al menos la featured_image como galería
  if ((!images || images.length === 0) && row.featured_image) {
    images = [row.featured_image];
  }
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

// GET /api/posts/[slug]
export async function GET(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const siteId = await getCurrentSiteId(_req);
    const ctx = (await (params as any)) as { slug?: string };
    const slug = String(ctx?.slug || "").trim();

    // Intentar Supabase
    const select =
      "slug,featured_image,website,instagram,website_display,instagram_display,email,phone,photos_credit,address,hours,reservation_link,reservation_policy,interesting_fact,site,images:post_images(url,position),locations:post_locations(*),translations:post_translations(*),useful:post_useful_info(*),category_links:post_category_map(category:categories(slug,label_es,label_en))";
    const rows: any[] | null = await fetchFromSupabase(
      `/posts?slug=eq.${encodeURIComponent(slug)}&site=eq.${siteId}&select=${encodeURIComponent(select)}`
    );
    if (rows && rows.length > 0) {
      const mapped = mapRowToLegacy(rows[0]);
      return NextResponse.json(mapped, { status: 200 });
    }

  // Sin fallback a data.json
  return NextResponse.json({ error: "not_found" }, { status: 404 });
  } catch (err: any) {
    console.error("[GET /api/posts/[slug]] error", err);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}

// PUT /api/posts/[slug]
export async function PUT(
  req: Request,
  { params }: { params: { slug: string } }
) {
  let step = "start";
  try {
    const siteId = await getCurrentSiteId(req);
    const ctx = (await (params as any)) as { slug?: string };
    const slugParam = String(ctx?.slug || "").trim();

    const body = await req.json();
    console.log("[PUT posts] step=start body keys", Object.keys(body || {}));
    const normalized = normalizePost(body);
    step = "normalized";
    console.log("[PUT posts] step=normalized slug", normalized.slug);
    const parsed = postSchema.safeParse(normalized);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, issues: parsed.error.issues },
        { status: 400 }
      );
    }
    // Conjunto de campos explícitamente provistos (para actualizaciones parciales seguras)
    const provided = new Set<string>(Object.keys(body || {}));
    // 1) Obtener post.id por slug y site
    step = "fetch_post_id";
    const rows: any[] = await serviceRest(`/posts?slug=eq.${encodeURIComponent(slugParam)}&site=eq.${siteId}&select=id`);
    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    const postId = rows[0].id;
    console.log("[PUT posts] step=fetch_post_id id", postId);

    // 2) Cambiar slug si se proporcionó y es distinto
    if (provided.has("slug") && normalized.slug && normalized.slug !== slugParam) {
      step = "check_slug_unique";
      const exists: any[] = await serviceRest(
        `/posts?slug=eq.${encodeURIComponent(normalized.slug)}&site=eq.${siteId}&select=id`
      );
      if (Array.isArray(exists) && exists.length > 0) {
        return NextResponse.json(
          { ok: false, error: "slug_exists" },
          { status: 409 }
        );
      }
      step = "patch_slug";
      await serviceRest(`/posts?id=eq.${postId}`, {
        method: "PATCH",
        body: JSON.stringify({ slug: normalized.slug }),
      });
    }

    // 3) Actualizar tabla posts (campos top-level) solo para claves provistas
    {
      const patchData: Record<string, any> = {};
      const setIfProvided = (key: string, value: any) => {
        if (provided.has(key)) {
          patchData[
            key === "featuredImage"
              ? "featured_image"
              : key === "website_display"
              ? "website_display"
              : key === "instagram_display"
              ? "instagram_display"
              : key === "photosCredit"
              ? "photos_credit"
              : key === "reservationLink"
              ? "reservation_link"
              : key === "reservationPolicy"
              ? "reservation_policy"
              : key === "interestingFact"
              ? "interesting_fact"
              : key
          ] = value ?? null;
        }
      };
      setIfProvided("featuredImage", normalized.featuredImage);
      setIfProvided("website", normalized.website);
      setIfProvided("website_display", normalized.website_display);
      setIfProvided("instagram", normalized.instagram);
      setIfProvided("instagram_display", normalized.instagram_display);
      setIfProvided("email", normalized.email);
      setIfProvided("phone", normalized.phone);
      setIfProvided("address", normalized.address);
      setIfProvided("photosCredit", normalized.photosCredit);
      setIfProvided("hours", normalized.hours);
      setIfProvided("reservationLink", normalized.reservationLink);
      setIfProvided("reservationPolicy", normalized.reservationPolicy);
      setIfProvided("interestingFact", normalized.interestingFact);

      if (Object.keys(patchData).length > 0) {
        const tryPatch = async () => {
          step = "patch_posts";
          await serviceRest(`/posts?id=eq.${postId}`, {
            method: "PATCH",
            body: JSON.stringify(patchData),
          });
        };
        try {
          await tryPatch();
        } catch (e: any) {
          // Si falta alguna columna, eliminarla y reintentar hasta 8 veces
          let attempts = 0;
          let lastErr = e;
          while (attempts < 8) {
            const msg = String(lastErr?.message || "");
            const m = msg.match(/column\s+[^.]*\.?([a-zA-Z0-9_]+)\s+does not exist/i);
            if (!m) break;
            const col = m[1];
            for (const k of Object.keys(patchData)) {
              if (k === col || k.endsWith(`.${col}`) || col === k) {
                delete patchData[k];
                break;
              }
            }
            attempts++;
            try {
              await tryPatch();
              lastErr = null;
              break;
            } catch (err2: any) {
              lastErr = err2;
            }
          }
          if (lastErr) throw lastErr;
        }
      }
    }

    // 4) Reemplazar traducciones: PostgREST exige que todos los objetos de un bulk insert tengan las mismas claves.
    // Unificamos claves (name, subtitle, description, info_html, category) siempre presentes.
    const esT = normalized.es || {} as any;
    const enT = normalized.en || {} as any;
    const unifiedTranslations = [
      {
        post_id: postId,
        lang: "es",
        name: esT.name ? String(esT.name).trim() : null,
        subtitle: esT.subtitle ? String(esT.subtitle).trim() : null,
        description: Array.isArray(esT.description) ? esT.description : [],
        info_html: null,
        category: esT.category ? String(esT.category).trim() : null,
      },
      {
        post_id: postId,
        lang: "en",
        name: enT.name ? String(enT.name).trim() : null,
        subtitle: enT.subtitle ? String(enT.subtitle).trim() : null,
        description: Array.isArray(enT.description) ? enT.description : [],
        info_html: null,
        category: enT.category ? String(enT.category).trim() : null,
      },
    ];
    // Decidimos insertar solo si al menos un idioma tiene algún campo no nulo o descripción no vacía
    const shouldWrite = unifiedTranslations.some(t => (t.name||t.subtitle||t.info_html||t.category|| (Array.isArray(t.description) && t.description.length>0)));
    if (shouldWrite) {
      step = "delete_translations";
      await serviceRest(`/post_translations?post_id=eq.${postId}`, { method: "DELETE" });
      step = "post_translations";
      try {
        await serviceRest(`/post_translations`, { method: "POST", body: JSON.stringify(unifiedTranslations) });
      } catch (e: any) {
        const firstMsg = String(e?.message || "");
        // Fallback: eliminar columnas inexistentes manteniendo uniformidad
        let errCurr: any = e;
        const prune = new Set<string>();
        for (const m of firstMsg.matchAll(/Could not find the '([a-zA-Z0-9_]+)' column/gi)) prune.add(m[1]);
        if (prune.size>0) {
          const payload = unifiedTranslations.map(t => {
            const c: any = { ...t };
            for (const col of prune) delete c[col];
            return c;
          });
          try {
            await serviceRest(`/post_translations`, { method: "POST", body: JSON.stringify(payload) });
            console.warn("[PUT posts] degradado traducciones columnas faltantes", Array.from(prune));
            errCurr = null;
          } catch (e2:any){ errCurr = e2; }
        }
        if (errCurr) {
          for (let i=0;i<5 && errCurr;i++) {
            const msg = String(errCurr?.message||"");
            const m = msg.match(/column\s+[^.]*\.?([a-zA-Z0-9_]+)\s+does not exist/i);
            if(!m) break;
            prune.add(m[1]);
            const payload = unifiedTranslations.map(t=>{
              const c:any={...t};
              for(const col of prune) delete c[col];
              return c;
            });
            try { await serviceRest(`/post_translations`,{method:"POST",body:JSON.stringify(payload)}); errCurr=null; break; } catch(e3:any){ errCurr=e3; }
          }
        }
        if (errCurr) throw errCurr;
      }
    }

    // 4b) Upsert de post_useful_info si se proporcionaron bloques HTML
    {
      const useful: any[] = [];
      const providedEs = provided.has("es") && typeof (body?.es?.infoHtml) !== "undefined";
      const providedEn = provided.has("en") && typeof (body?.en?.infoHtml) !== "undefined";
      if (providedEs && esT.infoHtml && String(esT.infoHtml).trim() !== "") {
        useful.push({ post_id: postId, lang: "es", html: String(esT.infoHtml).trim() });
      }
      if (providedEn && enT.infoHtml && String(enT.infoHtml).trim() !== "") {
        useful.push({ post_id: postId, lang: "en", html: String(enT.infoHtml).trim() });
      }
      if (useful.length > 0) {
        await serviceRest(`/post_useful_info`, {
          method: "POST",
          body: JSON.stringify(useful),
          headers: { Prefer: "return=representation,resolution=merge-duplicates" },
        });
      }
    }

    // 5) Reemplazar imágenes SOLO si se proporcionó el campo 'images'
    if (provided.has("images")) {
      await serviceRest(`/post_images?post_id=eq.${postId}`, { method: "DELETE" });
      step = "delete_images";
      const imagesPayload = (normalized.images || []).map((url, idx) => ({
        post_id: postId,
        url,
        position: idx,
      }));
      if (imagesPayload.length > 0) {
        step = "insert_images";
        await serviceRest(`/post_images`, {
          method: "POST",
          body: JSON.stringify(imagesPayload),
        });
      }
    }

    // 6) Reemplazar categorías (mapear por label_es o slug) SOLO si se proporcionó 'categories'
    if (provided.has("categories")) {
      try {
        const cats: any[] = await serviceRest(`/categories?select=id,slug,label_es,label_en`);
        const wanted = new Set((normalized.categories || []).map((c) => String(c).toUpperCase()));
        const catIds = cats
          .filter((r: any) => wanted.has(String(r.label_es || r.slug || "").toUpperCase()))
          .map((r: any) => r.id);
        await serviceRest(`/post_category_map?post_id=eq.${postId}`, { method: "DELETE" });
        step = "delete_category_map";
        if (catIds.length > 0) {
          step = "insert_category_map";
          console.log("[PUT posts] insert_category_map postId=%s catIds=%o wanted=%o", postId, catIds, Array.from(wanted));
          await serviceRest(`/post_category_map`, {
            method: "POST",
            body: JSON.stringify(catIds.map((id: number) => ({ post_id: postId, category_id: id }))),
          });
        } else {
          console.warn("[PUT posts] No category IDs matched for provided categories", Array.from(wanted));
        }
      } catch (e) {
        console.warn("[PUT posts] Categorías: continuidad tras fallo en mapeo", e);
      }
    }

    return NextResponse.json({ ok: true, slug: normalized.slug || slugParam }, { status: 200 });
  } catch (err: any) {
    console.error("[PUT /api/posts/[slug]] error final", err);
    const msg = String(err?.message || "bad_request");
    // Incluir paso si está disponible para depurar
    const payload: any = { error: "internal_error", message: msg, step };
    // Diferenciar 400 vs 500 por mensaje
    const isSupabaseClientErr = /Supabase write error 400/i.test(msg) || /bad_request/i.test(msg);
    const status = isSupabaseClientErr ? 400 : 500;
    payload.error = status === 400 ? "bad_request" : "internal_error";
    return NextResponse.json(payload, { status });
  }
}

// DELETE /api/posts/[slug]
export async function DELETE(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const siteId = await getCurrentSiteId(_req);
    const ctx = (await (params as any)) as { slug?: string };
    const slug = String(ctx?.slug || "").trim();
    console.log("[DELETE POST]", slug, "site:", siteId);
    
    // Verificar que el post exista y pertenezca al sitio actual
    const rows: any[] = await serviceRest(`/posts?slug=eq.${encodeURIComponent(slug)}&site=eq.${siteId}&select=id`);
    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    
    const postId = rows[0].id;
    
    // Eliminar el post (las relaciones se eliminarán en cascada si está configurado)
    await serviceRest(`/posts?id=eq.${postId}`, { method: "DELETE" });
    
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err: any) {
    console.error("[DELETE /api/posts/[slug]] error", err);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}

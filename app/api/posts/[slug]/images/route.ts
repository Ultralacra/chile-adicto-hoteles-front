import { NextResponse } from "next/server";

export const runtime = "nodejs";

function envOrNull(name: string) {
  const v = process.env[name];
  return v && v.length > 0 ? v : null;
}

async function serviceRest(path: string, init?: RequestInit) {
  const base = envOrNull("NEXT_PUBLIC_SUPABASE_URL");
  const service = envOrNull("SUPABASE_SERVICE_ROLE_KEY");
  if (!base || !service)
    throw new Error(
      "Supabase Service Role no configurado (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)"
    );
  const url = `${base}/rest/v1${path}`;
  const method = (init?.method || "GET").toUpperCase();
  const hasBody = !!init?.body;
  // Construir headers base
  const baseHeaders: Record<string, string> = {
    apikey: service,
    Authorization: `Bearer ${service}`,
    Prefer: "return=representation",
  };
  // Copiar headers usuario preservando casing
  const userHeaders = { ...(init?.headers || {}) } as Record<string, string>;
  // Añadir Content-Type JSON si es escritura con body y no viene definido ya
  const hasContentType = Object.keys(userHeaders).some(
    (h) => h.toLowerCase() === "content-type"
  );
  if (hasBody && method !== "GET" && !hasContentType) {
    baseHeaders["Content-Type"] = "application/json";
  }
  const res = await fetch(url, {
    ...init,
    headers: {
      ...baseHeaders,
      ...userHeaders,
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase write error ${res.status}: ${text}`);
  }
  if (res.status === 204) return null as any;
  return res.json();
}

async function uploadToSupabaseStorage(
  file: Blob,
  fileName: string,
  slug: string
): Promise<string> {
  const base = envOrNull("NEXT_PUBLIC_SUPABASE_URL");
  const service = envOrNull("SUPABASE_SERVICE_ROLE_KEY");
  const bucket = envOrNull("SUPABASE_STORAGE_BUCKET") || "public";
  if (!base || !service) {
    throw new Error(
      "Variables de entorno Supabase faltantes para Storage (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)"
    );
  }
  const ensureBucket = async () => {
    const res = await fetch(`${base}/storage/v1/bucket`, {
      method: "POST",
      headers: {
        apikey: service,
        Authorization: `Bearer ${service}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: bucket, public: true }),
    });
    if (!res.ok && res.status !== 409) {
      const txt = await res.text();
      throw new Error(`No se pudo crear bucket '${bucket}': ${txt}`);
    }
  };
  const clean = (s: string) =>
    s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9._-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$|\.+$/g, "");
  const ts = Date.now();
  const path = `posts/${clean(slug)}/${ts}-${clean(fileName || "img")}`;

  const url = `${base}/storage/v1/object/${encodeURIComponent(
    bucket
  )}/${path}`;

  const arrayBuf = await file.arrayBuffer();
  let res = await fetch(url, {
    method: "POST",
    headers: {
      apikey: service,
      Authorization: `Bearer ${service}`,
      "Content-Type": (file as any).type || "application/octet-stream",
      "x-upsert": "true",
    },
    body: Buffer.from(arrayBuf),
  });
  if (!res.ok) {
    const text = await res.text();
    if (/Bucket not found/i.test(text)) {
      await ensureBucket();
      res = await fetch(url, {
        method: "POST",
        headers: {
          apikey: service,
          Authorization: `Bearer ${service}`,
          "Content-Type": (file as any).type || "application/octet-stream",
          "x-upsert": "true",
        },
        body: Buffer.from(arrayBuf),
      });
    }
    if (!res.ok) {
      throw new Error(`Storage upload error ${res.status}: ${text}`);
    }
  }
  // URL pública estándar (requiere bucket público)
  const publicUrl = `${base}/storage/v1/object/public/${encodeURIComponent(
    bucket
  )}/${path}`;
  return publicUrl;
}

export async function POST(
  req: Request,
  { params }: { params: { slug: string } }
) {
  let step = "start";
  try {
    const ctx = (await (params as any)) as { slug?: string };
    const slug = String(ctx?.slug || "").trim();
    // 1) Resolver post.id
    step = "lookup_post";
    const postRows: any[] = await serviceRest(
      `/posts?slug=eq.${encodeURIComponent(slug)}&select=id,featured_image`
    );
    if (!postRows || postRows.length === 0) {
      return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    }
    const postId = postRows[0].id;

    const ctype = req.headers.get("content-type") || "";
    let urls: string[] = [];

    if (ctype.startsWith("multipart/form-data")) {
      // 2) Subida de archivos (drag & drop)
      step = "formdata";
      const form = await (req as any).formData();
      const files = form.getAll("files").filter(Boolean) as File[];
      if (!files || files.length === 0) {
        return NextResponse.json(
          { ok: false, error: "no_files" },
          { status: 400 }
        );
      }
      for (const f of files) {
        const url = await uploadToSupabaseStorage(f, f.name || "file", slug);
        urls.push(url);
      }
    } else {
      // 3) También permitimos JSON: { url?: string, urls?: string[] }
      step = "json";
      const body = await req.json().catch(() => ({}));
      const single = (body?.url ? [String(body.url)] : []) as string[];
      const many = Array.isArray(body?.urls) ? body.urls.map(String) : [];
      urls = [...single, ...many].filter((u) => u && u.startsWith("http"));
      if (urls.length === 0) {
        return NextResponse.json(
          { ok: false, error: "no_urls" },
          { status: 400 }
        );
      }
    }

    // 4) Calcular siguiente posición y persistir en post_images
    step = "fetch_current_images";
    const imagesRows: any[] = await serviceRest(
      `/post_images?post_id=eq.${postId}&select=position&order=position.asc`
    );
    let nextPos = (imagesRows?.length || 0) > 0
      ? Math.max(
          ...imagesRows
            .map((r: any) => (Number.isFinite(r.position) ? Number(r.position) : 0))
        ) + 1
      : 0;

    const payload = urls.map((u) => ({ post_id: postId, url: u, position: nextPos++ }));
    if (payload.length > 0) {
      step = "insert_post_images";
      await serviceRest(`/post_images`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    }

    return NextResponse.json({ ok: true, urls }, { status: 201 });
  } catch (err: any) {
    const msg = String(err?.message || err);
    console.error("[POST /api/posts/[slug]/images]", { step, msg });
    const status = /bad_request|no_files|no_urls/i.test(msg) ? 400 : 500;
    return NextResponse.json(
      { ok: false, error: status === 400 ? "bad_request" : "internal_error", step, message: msg },
      { status }
    );
  }
}

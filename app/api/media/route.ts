import { NextResponse } from "next/server";

export const runtime = "nodejs";

type MediaListCache = {
  ts: number;
  urls: string[];
};

let mediaListCache: MediaListCache | null = null;
const MEDIA_CACHE_MS = 60_000;

function envOrNull(name: string) {
  const v = process.env[name];
  return v && v.length > 0 ? v : null;
}

function canUseAnon() {
  return !!envOrNull("NEXT_PUBLIC_SUPABASE_URL") && !!envOrNull("NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

function canUseService() {
  return !!envOrNull("NEXT_PUBLIC_SUPABASE_URL") && !!envOrNull("SUPABASE_SERVICE_ROLE_KEY");
}

async function supabaseRest(path: string, init?: RequestInit, mode: "anon" | "service" = "anon") {
  const base = envOrNull("NEXT_PUBLIC_SUPABASE_URL");
  const anon = envOrNull("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const service = envOrNull("SUPABASE_SERVICE_ROLE_KEY");
  if (!base) throw new Error("NEXT_PUBLIC_SUPABASE_URL no configurado");

  const token = mode === "service" ? service : anon;
  if (!token) {
    throw new Error(
      mode === "service"
        ? "SUPABASE_SERVICE_ROLE_KEY no configurado"
        : "NEXT_PUBLIC_SUPABASE_ANON_KEY no configurado"
    );
  }

  const url = `${base}/rest/v1${path}`;
  const method = (init?.method || "GET").toUpperCase();
  const hasBody = !!init?.body;
  const userHeaders = { ...(init?.headers || {}) } as Record<string, string>;
  const hasContentType = Object.keys(userHeaders).some(
    (h) => h.toLowerCase() === "content-type"
  );
  const headers: Record<string, string> = {
    apikey: token,
    Authorization: `Bearer ${token}`,
    Prefer: "return=representation",
    ...userHeaders,
  };
  if (hasBody && method !== "GET" && !hasContentType) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(url, {
    ...init,
    headers,
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase error ${res.status}: ${text}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

function clampInt(value: string | null, fallback: number, min: number, max: number) {
  const n = value == null ? NaN : Number.parseInt(value, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

async function buildMediaUrlList(mode: "anon" | "service") {
  const now = Date.now();
  if (mediaListCache && now - mediaListCache.ts < MEDIA_CACHE_MS) {
    return mediaListCache.urls;
  }

  const [posts, postImages, sliders, mediaTable] = await Promise.all([
    supabaseRest(`/posts?select=featured_image&limit=5000`, undefined, mode),
    supabaseRest(`/post_images?select=url&limit=10000`, undefined, mode),
    // Incluir imágenes ya guardadas en sliders (para poder re-usarlas desde Admin)
    supabaseRest(`/sliders?select=image_url&limit=10000`, undefined, mode).catch(() => []),
    // Opcional: si existe tabla 'media', incluirla
    supabaseRest(`/media?select=url&limit=10000`, undefined, mode).catch(() => []),
  ]);

  const urls = new Set<string>();
  for (const p of Array.isArray(posts) ? posts : []) {
    const u = String((p as any)?.featured_image || "").trim();
    if (u) urls.add(u);
  }
  for (const r of Array.isArray(postImages) ? postImages : []) {
    const u = String((r as any)?.url || "").trim();
    if (u) urls.add(u);
  }

  for (const r of Array.isArray(sliders) ? sliders : []) {
    const u = String((r as any)?.image_url || "").trim();
    if (u) urls.add(u);
  }

  for (const r of Array.isArray(mediaTable) ? mediaTable : []) {
    const u = String((r as any)?.url || "").trim();
    if (u) urls.add(u);
  }

  const list = Array.from(urls).sort((a, b) => a.localeCompare(b));
  mediaListCache = { ts: now, urls: list };
  return list;
}

export async function GET(req: Request) {
  try {
    if (!canUseAnon() && !canUseService()) {
      return NextResponse.json(
        { urls: [], total: 0, warning: "supabase_not_configured" },
        { status: 200 }
      );
    }

    const url = new URL(req.url);
    if (url.searchParams.get("refresh") === "1") {
      mediaListCache = null;
    }
    const hasPagination =
      url.searchParams.has("limit") || url.searchParams.has("offset");
    const limit = clampInt(url.searchParams.get("limit"), 120, 20, 500);
    const offset = clampInt(url.searchParams.get("offset"), 0, 0, 1_000_000);

    const mode: "anon" | "service" = canUseService() ? "service" : "anon";

    const list = await buildMediaUrlList(mode);
    const total = list.length;

    if (!hasPagination) {
      return NextResponse.json(
        {
          urls: list,
          total,
          limit: total,
          offset: 0,
          nextOffset: null,
        },
        { status: 200 }
      );
    }

    const page = list.slice(offset, offset + limit);
    return NextResponse.json(
      {
        urls: page,
        total,
        limit,
        offset,
        nextOffset: offset + page.length < total ? offset + page.length : null,
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { urls: [], total: 0, error: "internal_error", message: String(err?.message || err) },
      { status: 200 }
    );
  }
}

// POST /api/media
// body: { url: string } o { urls: string[] }
// Registra URLs en una tabla opcional 'media' (si existe). Si no existe, responde ok igual.
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const single = body?.url ? [String(body.url).trim()] : [];
    const many = Array.isArray(body?.urls) ? body.urls.map((u: any) => String(u).trim()) : [];
    const urls = [...single, ...many].filter(Boolean);
    if (urls.length === 0) {
      return NextResponse.json({ ok: false, error: "url_requerida" }, { status: 400 });
    }

    if (!canUseService()) {
      // Sin service role no podemos escribir; igual devolvemos ok para no bloquear UI.
      return NextResponse.json({ ok: true, urls, warning: "service_role_missing" }, { status: 201 });
    }

    // Intentar upsert en tabla 'media' si existe (si no, ignorar)
    try {
      const payload = urls.map((u) => ({ url: u }));
      await supabaseRest(
        `/media?on_conflict=url`,
        {
          method: "POST",
          headers: {
            Prefer: "return=representation,resolution=merge-duplicates",
          },
          body: JSON.stringify(payload),
        },
        "service"
      );
    } catch {
      // tabla no existe o RLS/permiso: no bloqueamos
    }

    return NextResponse.json({ ok: true, urls }, { status: 201 });
  } catch (err: any) {
    console.error("[POST /api/media] error", err);
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
}

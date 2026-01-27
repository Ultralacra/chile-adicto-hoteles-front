import { NextResponse } from "next/server";

function envOrNull(name: string) {
  const v = process.env[name];
  return v && v.length > 0 ? v : null;
}

async function serviceRest(path: string, init?: RequestInit) {
  const base = envOrNull("NEXT_PUBLIC_SUPABASE_URL");
  const service = envOrNull("SUPABASE_SERVICE_ROLE_KEY");
  if (!base || !service) {
    throw new Error("Supabase Service Role no configurado (variables NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)");
  }
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

// Entrada esperada:
// {
//   sets: Array<{
//     key: string,
//     items: Array<{ image_url: string, href?: string | null, position?: number, active?: boolean, lang?: string | null }>
//   }>
// }
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const sets = Array.isArray(body?.sets) ? body.sets : [];
    if (sets.length === 0) {
      return NextResponse.json({ ok: false, error: "empty_payload" }, { status: 400 });
    }

    for (const set of sets) {
      const key = String(set?.key || "").trim();
      if (!key) continue;
      const items = Array.isArray(set?.items) ? set.items : [];

      // Borramos items existentes del set antes de insertar
      await serviceRest(`/sliders?set_key=eq.${encodeURIComponent(key)}`, { method: "DELETE" });

      if (items.length === 0) continue;
      const payload = items.map((it: any, idx: number) => ({
        set_key: key,
        image_url: String(it.image_url || ""),
        href: it.href ? String(it.href) : null,
        position: Number.isFinite(it.position) ? Number(it.position) : idx,
        active: typeof it.active === "boolean" ? it.active : true,
        lang: it.lang ? String(it.lang) : null,
      })).filter((p: any) => p.image_url);

      if (payload.length > 0) {
        await serviceRest(`/sliders`, { method: "POST", body: JSON.stringify(payload) });
      }
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err: any) {
    console.error("[/api/sliders/sync] error", err);
    return NextResponse.json({ ok: false, error: "internal_error", message: String(err?.message || err) }, { status: 500 });
  }
}

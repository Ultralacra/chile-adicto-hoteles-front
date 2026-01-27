import { NextResponse } from "next/server";

export const runtime = "nodejs";

function envOrNull(name: string) {
  const v = process.env[name];
  return v && v.length > 0 ? v : null;
}

async function tryRegisterInMediaTable(urls: string[]) {
  try {
    const base = envOrNull("NEXT_PUBLIC_SUPABASE_URL");
    const service = envOrNull("SUPABASE_SERVICE_ROLE_KEY");
    if (!base || !service) return;
    if (!urls || urls.length === 0) return;

    const res = await fetch(`${base}/rest/v1/media?on_conflict=url`, {
      method: "POST",
      headers: {
        apikey: service,
        Authorization: `Bearer ${service}`,
        Prefer: "return=representation,resolution=merge-duplicates",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(urls.map((url) => ({ url }))),
    });
    // Si no existe tabla o no hay permisos, no bloqueamos la subida
    if (!res.ok) return;
  } catch {
    // silencioso
  }
}

async function uploadToSupabaseStorage(file: Blob, fileName: string): Promise<string> {
  const base = envOrNull("NEXT_PUBLIC_SUPABASE_URL");
  const service = envOrNull("SUPABASE_SERVICE_ROLE_KEY");
  const bucket = envOrNull("SUPABASE_STORAGE_BUCKET") || "public";
  if (!base || !service) {
    throw new Error("Faltan variables NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
  }
  // Intentar crear bucket si no existe (una sola vez por request)
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
    // 200/201 -> creado | 409 -> ya existe
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
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const path = `uploads/${yyyy}/${mm}/${ts}-${clean(fileName || "img")}`;

  const url = `${base}/storage/v1/object/${encodeURIComponent(bucket)}/${path}`;
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
      // Reintentar una vez
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
  return `${base}/storage/v1/object/public/${encodeURIComponent(bucket)}/${path}`;
}

export async function POST(req: Request) {
  let step = "start";
  try {
    const ctype = req.headers.get("content-type") || "";
    if (!ctype.startsWith("multipart/form-data")) {
      return NextResponse.json({ ok: false, error: "expected_multipart" }, { status: 400 });
    }
    step = "formdata";
    const form = await (req as any).formData();
    const files = form.getAll("files").filter(Boolean) as File[];
    if (!files || files.length === 0) {
      return NextResponse.json({ ok: false, error: "no_files" }, { status: 400 });
    }
    const urls: string[] = [];
    for (const f of files) {
      const url = await uploadToSupabaseStorage(f, f.name || "file");
      urls.push(url);
    }

    // Opcional: registrar en BD como "media" para que aparezca en el selector
    await tryRegisterInMediaTable(urls);

    return NextResponse.json({ ok: true, urls }, { status: 201 });
  } catch (err: any) {
    const msg = String(err?.message || err);
    console.error("[/api/media/upload]", { step, msg });
    const status = /no_files|expected_multipart/i.test(msg) ? 400 : 500;
    return NextResponse.json({ ok: false, error: status === 400 ? "bad_request" : "internal_error", message: msg, step }, { status });
  }
}

import { getEffectiveSiteId, normalizeCmsResponse } from "@/lib/cms-api";

function getCmsBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_CMS_API_BASE_URL;
  const trimmed = String(raw || "").trim();
  if (!trimmed) {
    throw new Error("Falta NEXT_PUBLIC_CMS_API_BASE_URL");
  }
  return trimmed.replace(/\/+$/, "");
}

async function proxyRequest(
  req: Request,
  ctx: { params: Promise<{ path?: string[] }> }
) {
  try {
    const { path = [] } = await ctx.params;
    const incoming = new URL(req.url);
    const base = getCmsBaseUrl();
    const target = new URL(`/api/${path.join("/")}`, base);

    incoming.searchParams.forEach((value, key) => {
      target.searchParams.set(key, value);
    });

    const method = req.method.toUpperCase();
    const shouldSendBody = method !== "GET" && method !== "HEAD";

    const forwardedHeaders = new Headers(req.headers);
    forwardedHeaders.delete("host");
    forwardedHeaders.delete("connection");
    forwardedHeaders.delete("content-length");
    forwardedHeaders.delete("accept-encoding");

    const upstream = await fetch(target.toString(), {
      method,
      headers: forwardedHeaders,
      body: shouldSendBody ? await req.arrayBuffer() : undefined,
      cache: "no-store",
      redirect: "follow",
    });

    const previewSite = incoming.searchParams.get("previewSite") || undefined;
    const siteId = getEffectiveSiteId(previewSite);
    const localUrl = `/cms-api/${path.join("/")}${incoming.search}`;

    return normalizeCmsResponse(upstream, localUrl, siteId);
  } catch (err: any) {
    return Response.json(
      { error: "proxy_error", message: String(err?.message || err) },
      { status: 500 }
    );
  }
}

export async function GET(req: Request, ctx: { params: Promise<{ path?: string[] }> }) {
  return proxyRequest(req, ctx);
}

export async function POST(req: Request, ctx: { params: Promise<{ path?: string[] }> }) {
  return proxyRequest(req, ctx);
}

export async function PUT(req: Request, ctx: { params: Promise<{ path?: string[] }> }) {
  return proxyRequest(req, ctx);
}

export async function PATCH(req: Request, ctx: { params: Promise<{ path?: string[] }> }) {
  return proxyRequest(req, ctx);
}

export async function DELETE(req: Request, ctx: { params: Promise<{ path?: string[] }> }) {
  return proxyRequest(req, ctx);
}

export async function OPTIONS(req: Request, ctx: { params: Promise<{ path?: string[] }> }) {
  return proxyRequest(req, ctx);
}

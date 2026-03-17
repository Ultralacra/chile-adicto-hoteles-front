import {
  getEffectiveSiteId,
  getServerCmsBaseUrl,
  normalizeCmsResponse,
} from "@/lib/cms-api";

async function proxyRequest(
  req: Request,
  ctx: { params: Promise<{ path?: string[] }> }
) {
  try {
    const { path = [] } = await ctx.params;
    const incoming = new URL(req.url);
    const base = getServerCmsBaseUrl();
    if (!base) {
      throw new Error("Falta CMS_API_BASE_URL o NEXT_PUBLIC_CMS_API_BASE_URL");
    }
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

import { NextResponse } from "next/server";
import { getCurrentSiteId } from "@/lib/site-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

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

function requireAdminKey(req: Request) {
  const required = envOrNull("ADMIN_API_KEY");
  if (!required) return;
  const provided = req.headers.get("x-admin-key");
  if (!provided || provided !== required) {
    throw new Error("unauthorized");
  }
}

function normalizeSlug(input: string) {
  return String(input || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

type CommuneRow = {
  slug: string;
  label: string | null;
  show_in_menu?: boolean | null;
  menu_order?: number | null;
};

export async function GET(req: Request) {
  try {
    const siteId = await getCurrentSiteId(req);
    const url = new URL(req.url);
    const full = url.searchParams.get("full") === "1";
    const nav = url.searchParams.get("nav") === "1";
    const includeHidden = url.searchParams.get("includeHidden") === "1";

    // Intentar leer columnas extendidas (menu_order/show_in_menu) si existen.
    const extendedWithOrder: any[] | null = await anonRest(
      `/communes?select=slug,label,show_in_menu,menu_order&site=eq.${siteId}&order=menu_order.asc,label.asc`
    );
    const extendedNoOrder: any[] | null = extendedWithOrder
      ? null
      : await anonRest(
          `/communes?select=slug,label,show_in_menu&site=eq.${siteId}&order=label.asc`
        );
    const basic: any[] | null = extendedWithOrder || extendedNoOrder
      ? null
      : await anonRest(`/communes?select=slug,label&site=eq.${siteId}&order=label.asc`);

    const rows: any[] | null = extendedWithOrder || extendedNoOrder || basic;
    if (!rows) return NextResponse.json([], { status: 200 });

    const normalized = rows
      .map((r: any) => {
        const slug = String(r.slug || "").trim();
        if (!slug) return null;
        const hasVisibility = Object.prototype.hasOwnProperty.call(r, "show_in_menu");
        const hasOrder = Object.prototype.hasOwnProperty.call(r, "menu_order");
        return {
          slug,
          label: r.label ?? null,
          show_in_menu: hasVisibility ? (r.show_in_menu ?? true) : true,
          menu_order: hasOrder
            ? Number.isFinite(Number(r.menu_order))
              ? Number(r.menu_order)
              : 0
            : 0,
        } satisfies CommuneRow;
      })
      .filter(Boolean) as CommuneRow[];

    const hiddenNavSlugs = new Set(["independencia"]);
    // Menú histórico de restaurantes (lo que se mostraba antes), sin agregar comunas nuevas.
    const restaurantMenuSlugs = new Set([
      "vitacura",
      "las-condes",
      "santiago",
      "lo-barnechea",
      "providencia",
      "alto-jahuel",
      "la-reina",
    ]);

    const filtered = nav && !includeHidden
      ? normalized.filter((r) => {
          const slug = String(r.slug || "").trim().toLowerCase();
          if (!slug) return false;
          if (r.show_in_menu === false) return false;
          if (hiddenNavSlugs.has(slug)) return false;
          return restaurantMenuSlugs.has(slug);
        })
      : normalized;

    // Si es navegación (nav=1) o modo full/includeHidden, devolvemos filas con slug/label.
    if (full || nav || includeHidden) return NextResponse.json(filtered, { status: 200 });

    // Compat simple: lista de labels en mayúsculas
    return NextResponse.json(
      filtered
        .map((r) => String(r.label || r.slug || "").toUpperCase())
        .filter(Boolean),
      { status: 200 }
    );
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(req: Request) {
  try {
    requireAdminKey(req);
    const siteId = await getCurrentSiteId(req);
    const body = await req.json();
    const input = Array.isArray(body) ? body : [body];

    const rows = input
      .map((x: any) => {
        const label = String(x?.label ?? x?.name ?? "").trim();
        const slugRaw = String(x?.slug ?? "").trim();
        const slug = normalizeSlug(slugRaw || label);
        if (!slug) return null;
        const hasShowInMenu =
          typeof x?.show_in_menu === "boolean" || typeof x?.showInMenu === "boolean";
        const hasMenuOrder =
          Number.isFinite(Number(x?.menu_order)) || Number.isFinite(Number(x?.menuOrder));
        return {
          slug,
          label: label || slug,
          site: siteId,
          ...(hasShowInMenu
            ? { show_in_menu: Boolean(x?.show_in_menu ?? x?.showInMenu) }
            : {}),
          ...(hasMenuOrder
            ? { menu_order: Number(x?.menu_order ?? x?.menuOrder) }
            : {}),
        };
      })
      .filter(Boolean);

    if (rows.length === 0) {
      return NextResponse.json(
        { ok: false, message: "Body inválido: falta slug/label" },
        { status: 400 }
      );
    }

    const created = await serviceRest(`/communes?on_conflict=slug,site`, {
      method: "POST",
      headers: {
        Prefer: "return=representation,resolution=merge-duplicates",
      },
      body: JSON.stringify(rows),
    });

    return NextResponse.json({ ok: true, rows: created }, { status: 200 });
  } catch (err: any) {
    const msg = String(err?.message || err);
    if (msg === "unauthorized") {
      return NextResponse.json({ ok: false, message: "unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ ok: false, message: msg }, { status: 400 });
  }
}

export async function PUT(req: Request) {
  return POST(req);
}

export async function DELETE(req: Request) {
  try {
    requireAdminKey(req);
    const siteId = await getCurrentSiteId(req);
    const url = new URL(req.url);
    const slug = String(url.searchParams.get("slug") || "").trim();
    if (!slug) {
      return NextResponse.json({ ok: false, message: "Falta slug" }, { status: 400 });
    }

    await serviceRest(`/communes?slug=eq.${encodeURIComponent(slug)}&site=eq.${siteId}`, {
      method: "DELETE",
      headers: { Prefer: "return=representation" },
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

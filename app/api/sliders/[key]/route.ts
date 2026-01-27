import { NextResponse } from "next/server";
import { getCurrentSiteId } from "@/lib/site-utils";

export const runtime = "nodejs";

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

type SliderItem = {
	image_url: string;
	href?: string | null;
	position?: number;
	active?: boolean;
	lang?: string | null;
};

export async function GET(req: Request, { params }: { params: { key: string } }) {
	try {
		const siteId = await getCurrentSiteId(req);
		const ctx = (await (params as any)) as { key?: string };
		const key = String(ctx?.key || "").trim();
		if (!key) return NextResponse.json({ key: "", items: [] }, { status: 200 });

		const inferredLang = key.endsWith("-es")
			? "es"
			: key.endsWith("-en")
			? "en"
			: null;

		if (!canUseAnon() && !canUseService()) {
			return NextResponse.json({ key, items: [], warning: "supabase_not_configured" }, { status: 200 });
		}

		const url = new URL(req.url);
		const all = url.searchParams.get("all") === "1";

		const rows = (await supabaseRest(
			`/sliders?set_key=eq.${encodeURIComponent(
				key
			)}&site=eq.${siteId}&select=set_key,image_url,href,position,active,lang&order=position.asc`,
			undefined,
			canUseService() ? "service" : "anon"
		)) as any[];

		const items = (Array.isArray(rows) ? rows : [])
			.map((r) => ({
				image_url: String(r.image_url || ""),
				href: r.href ? String(r.href) : null,
				position: Number.isFinite(r.position) ? Number(r.position) : undefined,
				active: typeof r.active === "boolean" ? r.active : true,
				lang: inferredLang || (r.lang ? String(r.lang) : null),
			}))
			.filter((it) => it.image_url)
			.filter((it) => (all ? true : it.active !== false));

		return NextResponse.json({ key, items }, { status: 200 });
	} catch (err: any) {
		return NextResponse.json(
			{ key: "", items: [], error: "internal_error", message: String(err?.message || err) },
			{ status: 200 }
		);
	}
}

export async function PUT(req: Request, { params }: { params: { key: string } }) {
	try {
		const siteId = await getCurrentSiteId(req);
		const ctx = (await (params as any)) as { key?: string };
		const key = String(ctx?.key || "").trim();
		if (!key) return NextResponse.json({ ok: false, error: "missing_key" }, { status: 400 });
		const inferredLang = key.endsWith("-es")
			? "es"
			: key.endsWith("-en")
			? "en"
			: null;
		if (!canUseService()) {
			return NextResponse.json(
				{ ok: false, error: "service_role_missing", message: "SUPABASE_SERVICE_ROLE_KEY no configurado" },
				{ status: 500 }
			);
		}

		const body = await req.json();
		const itemsIn: SliderItem[] = Array.isArray(body?.items) ? body.items : [];
		const payload = itemsIn
			.map((it: any, idx: number) => ({
				set_key: key,
				site: siteId,
				image_url: String(it?.image_url || "").trim(),
				href: it?.href ? String(it.href).trim() : null,
				position: Number.isFinite(it?.position) ? Number(it.position) : idx,
				active: typeof it?.active === "boolean" ? it.active : true,
				lang: inferredLang || (it?.lang ? String(it.lang).trim() : null),
			}))
			.filter((p: any) => p.image_url);

		// Reemplazo total del set para este sitio
		await supabaseRest(`/sliders?set_key=eq.${encodeURIComponent(key)}&site=eq.${siteId}`, { method: "DELETE" }, "service");
		if (payload.length > 0) {
			await supabaseRest(`/sliders`, { method: "POST", body: JSON.stringify(payload) }, "service");
		}
		return NextResponse.json({ ok: true }, { status: 200 });
	} catch (err: any) {
		return NextResponse.json(
			{ ok: false, error: "internal_error", message: String(err?.message || err) },
			{ status: 500 }
		);
	}
}


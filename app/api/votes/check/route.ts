import { NextResponse } from "next/server";

export const runtime = "nodejs";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getHeaders() {
  return {
    apikey: SUPABASE_SERVICE_KEY!,
    Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
    "Content-Type": "application/json",
  };
}

// GET /api/votes/check?email=xxx&site=chileadicto&category=norte&hearts=5
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const email = url.searchParams.get("email");
    const site = url.searchParams.get("site") || "chileadicto";
    const category = url.searchParams.get("category");
    const heartsStr = url.searchParams.get("hearts");

    if (!email) {
      return NextResponse.json(
        { error: "Email es requerido" },
        { status: 400 }
      );
    }

    // Buscar votos del email en el sitio
    let query = `${SUPABASE_URL}/rest/v1/votes?voter_email=eq.${encodeURIComponent(email.toLowerCase().trim())}&site=eq.${site}&select=hotel_slug,category,hearts,created_at`;

    if (category) {
      query += `&category=eq.${encodeURIComponent(category)}`;
    }
    if (heartsStr) {
      const hearts = parseInt(heartsStr, 10);
      if (!isNaN(hearts)) {
        query += `&hearts=eq.${hearts}`;
      }
    }

    const res = await fetch(query, { headers: getHeaders() });

    if (!res.ok) {
      throw new Error("Error al verificar voto");
    }

    const votes = await res.json();

    return NextResponse.json({
      has_voted: votes.length > 0,
      votes: votes.map((v: any) => ({
        hotel_slug: v.hotel_slug,
        category: v.category,
        hearts: v.hearts,
        voted_at: v.created_at,
      })),
    });
  } catch (err: any) {
    console.error("[GET /api/votes/check]", err);
    return NextResponse.json(
      { error: "Error interno", message: err?.message },
      { status: 500 }
    );
  }
}

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

// GET /api/votes/check?email=xxx&site=chileadicto
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const email = url.searchParams.get("email");
    const site = url.searchParams.get("site") || "chileadicto";

    if (!email) {
      return NextResponse.json(
        { error: "Email es requerido" },
        { status: 400 }
      );
    }

    // Buscar si el email ya votó en este sitio
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/votes?voter_email=eq.${encodeURIComponent(email.toLowerCase().trim())}&site=eq.${site}&select=hotel_slug,created_at`,
      { headers: getHeaders() }
    );

    if (!res.ok) {
      throw new Error("Error al verificar voto");
    }

    const votes = await res.json();

    if (votes.length > 0) {
      return NextResponse.json({
        has_voted: true,
        hotel_slug: votes[0].hotel_slug,
        voted_at: votes[0].created_at,
      });
    }

    return NextResponse.json({ has_voted: false });
  } catch (err: any) {
    console.error("[GET /api/votes/check]", err);
    return NextResponse.json(
      { error: "Error interno", message: err?.message },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";

export const runtime = "nodejs";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getHeaders() {
  return {
    apikey: SUPABASE_SERVICE_KEY!,
    Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };
}

// POST /api/votes - Crear un voto
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { hotel_slug, voter_name, voter_email, site = "chileadicto", change_vote = false } = body;

    // Validaciones
    if (!hotel_slug || !voter_name || !voter_email) {
      return NextResponse.json(
        { error: "hotel_slug, voter_name y voter_email son requeridos" },
        { status: 400 }
      );
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(voter_email)) {
      return NextResponse.json(
        { error: "Email no válido" },
        { status: 400 }
      );
    }

    const normalizedEmail = voter_email.toLowerCase().trim();

    // Verificar si ya votó en este sitio
    const checkRes = await fetch(
      `${SUPABASE_URL}/rest/v1/votes?voter_email=eq.${encodeURIComponent(normalizedEmail)}&site=eq.${site}&select=id,hotel_slug`,
      { headers: getHeaders() }
    );

    if (!checkRes.ok) {
      throw new Error("Error al verificar voto existente");
    }

    const existing = await checkRes.json();

    if (existing.length > 0) {
      // Si ya votó y NO pidió cambiar voto, informar
      if (!change_vote) {
        return NextResponse.json(
          {
            error: "Ya has votado anteriormente",
            already_voted: true,
            current_hotel: existing[0].hotel_slug,
            can_change: true,
          },
          { status: 409 }
        );
      }

      // Si pidió cambiar voto, eliminar el anterior
      const deleteRes = await fetch(
        `${SUPABASE_URL}/rest/v1/votes?id=eq.${existing[0].id}`,
        {
          method: "DELETE",
          headers: getHeaders(),
        }
      );

      if (!deleteRes.ok) {
        throw new Error("Error al eliminar voto anterior");
      }
    }

    // Insertar nuevo voto
    const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/votes`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        hotel_slug,
        voter_name: voter_name.trim(),
        voter_email: normalizedEmail,
        site,
      }),
    });

    if (!insertRes.ok) {
      const err = await insertRes.text();
      if (err.includes("unique")) {
        return NextResponse.json(
          { error: "Ya has votado anteriormente", already_voted: true },
          { status: 409 }
        );
      }
      throw new Error("Error al guardar voto");
    }

    const [vote] = await insertRes.json();

    return NextResponse.json({
      ok: true,
      vote,
      changed: existing.length > 0,
    }, { status: 201 });
  } catch (err: any) {
    console.error("[POST /api/votes]", err);
    return NextResponse.json(
      { error: "Error interno", message: err?.message },
      { status: 500 }
    );
  }
}

// GET /api/votes - Listar votos (admin) o contar por hotel
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const site = url.searchParams.get("site") || "chileadicto";
    const hotel = url.searchParams.get("hotel");
    const groupBy = url.searchParams.get("group");

    // Contar votos por hotel (para mostrar en tiempo real)
    if (groupBy === "hotel") {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/votes?site=eq.${site}&select=hotel_slug`,
        { headers: getHeaders() }
      );

      if (!res.ok) throw new Error("Error al contar votos");

      const votes = await res.json();

      // Agrupar por hotel y contar
      const counts: Record<string, number> = {};
      for (const v of votes) {
        counts[v.hotel_slug] = (counts[v.hotel_slug] || 0) + 1;
      }

      return NextResponse.json({ ok: true, counts, total: votes.length });
    }

    // Listar todos los votos (admin)
    let query = `?site=eq.${site}&order=created_at.desc&limit=1000`;
    if (hotel) {
      query += `&hotel_slug=eq.${encodeURIComponent(hotel)}`;
    }

    const res = await fetch(`${SUPABASE_URL}/rest/v1/votes${query}`, {
      headers: getHeaders(),
    });

    if (!res.ok) throw new Error("Error al listar votos");

    const votes = await res.json();

    return NextResponse.json({ ok: true, votes, total: votes.length });
  } catch (err: any) {
    console.error("[GET /api/votes]", err);
    return NextResponse.json(
      { error: "Error interno", message: err?.message },
      { status: 500 }
    );
  }
}

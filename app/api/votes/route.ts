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

function getReadHeaders() {
  return {
    apikey: SUPABASE_SERVICE_KEY!,
    Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
    "Content-Type": "application/json",
    Prefer: "count=exact",
  };
}

// POST /api/votes - Crear un voto
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      hotel_slug,
      voter_name,
      voter_email,
      site = "chileadicto",
      change_vote = false,
      category,
      hearts,
    } = body;

    // Validaciones
    if (!hotel_slug || !voter_name || !voter_email) {
      return NextResponse.json(
        { error: "hotel_slug, voter_name y voter_email son requeridos" },
        { status: 400 }
      );
    }

    if (!category || (hearts !== 4 && hearts !== 5)) {
      return NextResponse.json(
        { error: "category y hearts (4 o 5) son requeridos" },
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

    // Verificar si ya votó en esta categoría + corazones
    const checkRes = await fetch(
      `${SUPABASE_URL}/rest/v1/votes?voter_email=eq.${encodeURIComponent(normalizedEmail)}&site=eq.${site}&category=eq.${encodeURIComponent(category)}&hearts=eq.${hearts}&select=id,hotel_slug`,
      { headers: getHeaders() }
    );

    if (!checkRes.ok) {
      throw new Error("Error al verificar voto existente");
    }

    const existing = await checkRes.json();

    if (existing.length > 0) {
      // Si ya votó en esta categoría+corazones y NO pidió cambiar voto, informar
      if (!change_vote) {
        return NextResponse.json(
          {
            error: "Ya has votado en esta categoría",
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
        category,
        hearts,
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

    // Leer todos los votos en páginas para no truncar el resumen en 1000 registros.
    const pageSize = 1000;
    let baseQuery = `?site=eq.${encodeURIComponent(site)}`;
    if (hotel) {
      baseQuery += `&hotel_slug=eq.${encodeURIComponent(hotel)}`;
    }

    const firstRes = await fetch(
      `${SUPABASE_URL}/rest/v1/votes${baseQuery}&order=created_at.desc&limit=${pageSize}&offset=0`,
      { headers: getReadHeaders() },
    );
    if (!firstRes.ok) throw new Error("Error al listar votos");

    const firstPage = await firstRes.json();
    const contentRange = firstRes.headers.get("content-range") || "";
    const totalFromHeader = Number.parseInt(contentRange.split("/")[1] || "", 10);
    const pages: any[][] = [firstPage];
    if (Number.isFinite(totalFromHeader)) {
      const offsets = Array.from(
        { length: Math.max(0, Math.ceil(totalFromHeader / pageSize) - 1) },
        (_, index) => (index + 1) * pageSize,
      );
      pages.push(
        ...(await Promise.all(
          offsets.map(async (offset) => {
            const pageRes = await fetch(
              `${SUPABASE_URL}/rest/v1/votes${baseQuery}&order=created_at.desc&limit=${pageSize}&offset=${offset}`,
              { headers: getReadHeaders() },
            );
            if (!pageRes.ok) throw new Error("Error al listar votos");
            return pageRes.json();
          }),
        )),
      );
    } else {
      let offset = pageSize;
      while (pages[pages.length - 1].length === pageSize) {
        const pageRes = await fetch(
          `${SUPABASE_URL}/rest/v1/votes${baseQuery}&order=created_at.desc&limit=${pageSize}&offset=${offset}`,
          { headers: getReadHeaders() },
        );
        if (!pageRes.ok) throw new Error("Error al listar votos");
        const page = await pageRes.json();
        pages.push(page);
        offset += pageSize;
      }
    }
    const votes = pages.flat();

    const counts: Record<string, number> = {};
    const categoryCounts: Record<string, number> = {};
    const categoryHotels: Record<string, Record<string, number>> = {};

    for (const vote of votes) {
      const hotelSlug = String(vote.hotel_slug || "");
      const category = String(vote.category || "Sin categoría").trim();
      const hearts = Number(vote.hearts) || 0;
      const categoryKey = `${category}|${hearts}`;

      counts[hotelSlug] = (counts[hotelSlug] || 0) + 1;
      categoryCounts[categoryKey] = (categoryCounts[categoryKey] || 0) + 1;
      categoryHotels[categoryKey] ||= {};
      categoryHotels[categoryKey][hotelSlug] =
        (categoryHotels[categoryKey][hotelSlug] || 0) + 1;
    }

    const hotels = Object.entries(counts)
      .sort(([, first], [, second]) => second - first)
      .map(([hotelSlug, count]) => ({ hotelSlug, count }));
    const categorySummaries = Object.entries(categoryCounts).map(
      ([key, total]) => {
        const [category, hearts] = key.split("|");
        const categoryTopHotels = Object.entries(categoryHotels[key])
          .sort(([, first], [, second]) => second - first)
          .map(([hotelSlug, count]) => ({ hotelSlug, count }));
        return {
          category,
          hearts: Number(hearts),
          total,
          hotels: categoryTopHotels,
        };
      },
    );
    const uniqueVoters = new Set(
      votes
        .map((vote: any) => String(vote.voter_email || "").trim().toLowerCase())
        .filter(Boolean),
    ).size;

    return NextResponse.json({
      ok: true,
      votes,
      total: votes.length,
      totalHotels: hotels.length,
      uniqueVoters,
      categorySummaries,
      hotels,
      topHotels: hotels.slice(0, 10),
    });
  } catch (err: any) {
    console.error("[GET /api/votes]", err);
    return NextResponse.json(
      { error: "Error interno", message: err?.message },
      { status: 500 }
    );
  }
}

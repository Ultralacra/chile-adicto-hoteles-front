import { NextResponse } from "next/server";

// En producción esto debería ir a una base de datos
// Por ahora usamos un Set en memoria para evitar duplicados por email+hotel
const votes: Array<{
  name: string;
  email: string;
  hotelSlug: string;
  hotelName: string;
  categorySlug: string;
  createdAt: string;
}> = [];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, hotelSlug, hotelName, categorySlug } = body;

    if (!name?.trim() || !email?.trim() || !hotelSlug?.trim()) {
      return NextResponse.json(
        { message: "Nombre, correo y hotel son requeridos" },
        { status: 400 },
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: "Correo inválido" },
        { status: 400 },
      );
    }

    // Verificar si ya votó por este hotel
    const alreadyVoted = votes.some(
      (v) =>
        v.email.toLowerCase() === email.toLowerCase() &&
        v.hotelSlug === hotelSlug,
    );

    if (alreadyVoted) {
      return NextResponse.json(
        { message: "Ya has votado por este hotel" },
        { status: 409 },
      );
    }

    votes.push({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      hotelSlug,
      hotelName: hotelName || "",
      categorySlug: categorySlug || "",
      createdAt: new Date().toISOString(),
    });

    console.log("[VOTE] Nuevo voto registrado:", {
      name,
      email,
      hotelSlug,
      categorySlug,
    });

    return NextResponse.json({
      message: "Voto registrado exitosamente",
      totalVotes: votes.filter((v) => v.hotelSlug === hotelSlug).length,
    });
  } catch {
    return NextResponse.json(
      { message: "Error al procesar el voto" },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const hotelSlug = searchParams.get("hotelSlug");
  const categorySlug = searchParams.get("categorySlug");

  let result = votes;

  if (hotelSlug) {
    result = result.filter((v) => v.hotelSlug === hotelSlug);
  }

  if (categorySlug) {
    result = result.filter((v) => v.categorySlug === categorySlug);
  }

  // Agrupar por hotel y contar
  const counts: Record<string, number> = {};
  result.forEach((v) => {
    counts[v.hotelSlug] = (counts[v.hotelSlug] || 0) + 1;
  });

  return NextResponse.json({
    votes: result,
    counts,
    total: result.length,
  });
}

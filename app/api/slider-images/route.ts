import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export const runtime = "nodejs";

function isImage(filename: string) {
  const ext = filename.split(".").pop()?.toLowerCase();
  return !!ext && ["jpg", "jpeg", "png", "webp", "gif", "avif"].includes(ext);
}

async function readOrder(): Promise<{ desktop?: string[]; mobile?: string[] }> {
  try {
    const file = path.join(process.cwd(), "public", "slider-order.json");
    const txt = await fs.readFile(file, "utf-8");
    return JSON.parse(txt);
  } catch {
    return {};
  }
}

function baseName(p: string) {
  return (p.split("/").pop() || p).trim();
}

export async function GET() {
  try {
    const base = process.cwd();
    const desktopDir = path.join(base, "public", "slider-desktop");
    const mobileDir = path.join(base, "public", "slider-movil");

    let desktop: string[] = [];
    let mobile: string[] = [];

    // Orden objetivo igual al menú del Home
    const ORDER = [
      "ICONOS", // solicitado: que ICONOS sea el primero
      "NINOS",
      "ARQUITECTURA",
      "BARRIOS",
      "MERCADOS",
      "MIRADORES",
      "CULTURA", // (museos)
      "PALACIOS",
      "PARQUES",
      "FUERA-DE-STGO",
      "RESTAURANTES",
    ];

    const norm = (s: string) =>
      s
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toUpperCase();

    const keyIndex = (filename: string) => {
      const name = norm(filename.replace(/\.[^.]+$/, ""));
      // Heurísticas para mapear nombres levemente distintos
      if (name.includes("NINOS") || name.includes("NIÑOS"))
        return ORDER.indexOf("NINOS");
      if (/^(ARQ|ARQU|AQU|AQI)/.test(name) || name.includes("ARQUITECTURA"))
        return ORDER.indexOf("ARQUITECTURA");
      if (name.includes("BARRIOS")) return ORDER.indexOf("BARRIOS");
      if (name.includes("ICONOS")) return ORDER.indexOf("ICONOS");
      if (name.includes("MERCADOS")) return ORDER.indexOf("MERCADOS");
      if (name.includes("MIRADORES")) return ORDER.indexOf("MIRADORES");
      if (name.includes("CULTURA") || name.includes("MUSEOS"))
        return ORDER.indexOf("CULTURA");
      if (name.includes("PALACIOS")) return ORDER.indexOf("PALACIOS");
      if (name.includes("PARQUES")) return ORDER.indexOf("PARQUES");
      if (
        name.includes("FUERA") ||
        name.includes("FUERA-DE-STGO") ||
        name.includes("OUTSIDE")
      )
        return ORDER.indexOf("FUERA-DE-STGO");
      if (name.includes("RESTAURANTES") || name.includes("RESTAURANTS"))
        return ORDER.indexOf("RESTAURANTES");
      return 999; // al final si no se reconoce
    };

    const sortByOrder = (a: string, b: string) => {
      const ia = keyIndex(a);
      const ib = keyIndex(b);
      if (ia !== ib) return ia - ib;
      // desempate estable alfabético/numerico
      return a.localeCompare(b, undefined, { numeric: true });
    };

    const ord = await readOrder();

    try {
      const desktopFiles = await fs.readdir(desktopDir);
      let list = desktopFiles.filter(isImage).map((f) => `/slider-desktop/${f}`);
      if (Array.isArray(ord.desktop) && ord.desktop.length) {
        const idx = new Map(ord.desktop.map((n, i) => [baseName(n), i]));
        list = list.slice().sort((a, b) => {
          const ia = idx.get(baseName(a));
          const ib = idx.get(baseName(b));
          if (typeof ia === "number" && typeof ib === "number") return ia - ib;
          if (typeof ia === "number") return -1;
          if (typeof ib === "number") return 1;
          return sortByOrder(a, b);
        });
      } else {
        list = list.sort(sortByOrder);
      }
      desktop = list;
    } catch {
      // carpeta inexistente o sin permisos -> lista vacía
      desktop = [];
    }
    try {
      const mobileFiles = await fs.readdir(mobileDir);
      let list = mobileFiles.filter(isImage).map((f) => `/slider-movil/${f}`);
      if (Array.isArray(ord.mobile) && ord.mobile.length) {
        const idx = new Map(ord.mobile.map((n, i) => [baseName(n), i]));
        list = list.slice().sort((a, b) => {
          const ia = idx.get(baseName(a));
          const ib = idx.get(baseName(b));
          if (typeof ia === "number" && typeof ib === "number") return ia - ib;
          if (typeof ia === "number") return -1;
          if (typeof ib === "number") return 1;
          return sortByOrder(a, b);
        });
      } else {
        list = list.sort(sortByOrder);
      }
      mobile = list;
    } catch {
      mobile = [];
    }

    return NextResponse.json({ desktop, mobile });
  } catch (err) {
    return NextResponse.json({ desktop: [], mobile: [] }, { status: 200 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const desktopIn: string[] = Array.isArray(body.desktop) ? body.desktop : [];
    const mobileIn: string[] = Array.isArray(body.mobile) ? body.mobile : [];
    const payload = {
      desktop: desktopIn.map(baseName),
      mobile: mobileIn.map(baseName),
    };
    const file = path.join(process.cwd(), "public", "slider-order.json");
    await fs.writeFile(file, JSON.stringify(payload, null, 2), "utf-8");
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, message: String(e?.message || e) }, { status: 400 });
  }
}

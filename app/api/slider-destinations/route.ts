import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export const runtime = "nodejs";

const filePath = () => path.join(process.cwd(), "public", "slider-destinations.json");

export async function GET() {
  try {
    const txt = await fs.readFile(filePath(), "utf-8");
    const json = JSON.parse(txt);
    return NextResponse.json(json);
  } catch {
    return NextResponse.json({}, { status: 200 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    await fs.mkdir(path.dirname(filePath()), { recursive: true });
    await fs.writeFile(filePath(), JSON.stringify(body || {}, null, 2), "utf-8");
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, message: String(e?.message || e) }, { status: 400 });
  }
}

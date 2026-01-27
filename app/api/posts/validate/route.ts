import { NextResponse } from "next/server";
import { postSchema } from "@/lib/post-schema";
import { normalizePost } from "@/lib/post-service";

// POST /api/posts/validate -> valida payload de post
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const normalized = normalizePost(body);
    const parsed = postSchema.safeParse(normalized);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, issues: parsed.error.issues }, { status: 200 });
    }
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err: any) {
    console.error("[POST /api/posts/validate] error", err);
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
}

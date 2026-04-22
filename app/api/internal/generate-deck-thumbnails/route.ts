import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const WEBHOOK_SECRET = process.env.INTERNAL_WEBHOOK_SECRET!;

type Body = {
  deck_id: string;
  startup_id: string;
};

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-webhook-secret");
  if (!WEBHOOK_SECRET || secret !== WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { deck_id, startup_id } = body;
  if (!deck_id || !startup_id) {
    return NextResponse.json(
      { error: "deck_id and startup_id are required" },
      { status: 400 }
    );
  }

  // Thumbnails are rendered client-side via pdfjs-dist (Opción C).
  // The signed PDF URL is generated on-demand in DeckPreviewCarousel (server component).
  // Nothing to generate here — return success so the webhook caller doesn't retry.
  console.log("[generate-deck-thumbnails] client-side rendering — no-op", { deck_id, startup_id });

  return NextResponse.json({ success: true, mode: "client-side" });
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
// pdf-to-png-converter and sharp use native .node binaries — dynamic import prevents
// webpack from statically traversing and failing on the binary at build time.
type PdfToPng = typeof import("pdf-to-png-converter")["pdfToPng"];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SharpMod = any;

export const runtime = "nodejs";
export const maxDuration = 60;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const WEBHOOK_SECRET = process.env.INTERNAL_WEBHOOK_SECRET!;
const BUCKET_PRIVATE = "decks";
const BUCKET_PUBLIC = "deck-thumbnails";
const MAX_SLIDES = 5;
const MAX_WIDTH = 1200;

type Body = {
  deck_id: string;
  startup_id: string;
  overall_score?: number;
  division?: string;
  vertical?: string;
};

function getServiceClient() {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}

async function buildWatermarkBuffer(
  width: number,
  height: number,
  text: string
): Promise<Buffer> {
  const fontSize = 14;
  const padding = 6;
  const charWidth = fontSize * 0.58;
  const textWidth = Math.ceil(text.length * charWidth);
  const textHeight = fontSize + padding * 2;
  const boxWidth = textWidth + padding * 2;
  const boxHeight = textHeight;
  const x = width - boxWidth - 16;
  const y = height - boxHeight - 16;

  const svg = Buffer.from(
    `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect x="${x}" y="${y}" width="${boxWidth}" height="${boxHeight}"
            rx="3" fill="rgba(0,0,0,0.4)" />
      <text x="${x + padding}" y="${y + fontSize + padding - 2}"
            font-family="sans-serif" font-size="${fontSize}px"
            fill="rgba(255,255,255,0.65)">${text}</text>
    </svg>`
  );
  return svg;
}

async function processSlide(
  pngBuffer: Buffer,
  watermarkText: string,
  sharp: SharpMod
): Promise<Buffer> {
  const sharpFn = sharp.default ?? sharp;
  const img = sharpFn(pngBuffer);
  const meta = await img.metadata();
  const origW = meta.width ?? MAX_WIDTH;
  const origH = meta.height ?? Math.round(MAX_WIDTH * 0.75);

  let resized = img;
  let w = origW;
  let h = origH;
  if (origW > MAX_WIDTH) {
    w = MAX_WIDTH;
    h = Math.round((origH / origW) * MAX_WIDTH);
    resized = img.resize(w, h, { fit: "inside" });
  }

  const wmBuffer = await buildWatermarkBuffer(w, h, watermarkText);

  return resized
    .composite([{ input: wmBuffer, blend: "over" }])
    .png({ compressionLevel: 8 })
    .toBuffer();
}

async function uploadWithRetry(
  supabase: ReturnType<typeof getServiceClient>,
  path: string,
  data: Buffer,
  mimeType: string
): Promise<string> {
  const opts = { contentType: mimeType, upsert: true };

  const { error: e1 } = await supabase.storage
    .from(BUCKET_PUBLIC)
    .upload(path, data, opts);

  if (e1) {
    // Retry once
    const { error: e2 } = await supabase.storage
      .from(BUCKET_PUBLIC)
      .upload(path, data, opts);
    if (e2) throw new Error(`Upload failed after retry: ${e2.message}`);
  }

  const { data: urlData } = supabase.storage
    .from(BUCKET_PUBLIC)
    .getPublicUrl(path);
  return urlData.publicUrl;
}

export async function POST(req: NextRequest) {
  // ── Auth ──────────────────────────────────────────────────────────────────
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

  const { deck_id, startup_id, overall_score, division, vertical } = body;
  if (!deck_id || !startup_id) {
    return NextResponse.json(
      { error: "deck_id and startup_id are required" },
      { status: 400 }
    );
  }

  const supabase = getServiceClient();

  // Dynamic imports — prevents webpack from following native .node binary at build time
  const [{ pdfToPng }, sharpMod] = await Promise.all([
    import("pdf-to-png-converter") as Promise<{ pdfToPng: PdfToPng }>,
    import("sharp") as Promise<SharpMod>,
  ]);

  // ── Download PDF ──────────────────────────────────────────────────────────
  const { data: deck, error: deckErr } = await supabase
    .from("decks")
    .select("storage_path")
    .eq("id", deck_id)
    .single();

  if (deckErr || !deck) {
    return NextResponse.json({ error: "Deck not found" }, { status: 404 });
  }

  const { data: fileData, error: dlErr } = await supabase.storage
    .from(BUCKET_PRIVATE)
    .download(deck.storage_path);

  if (dlErr || !fileData) {
    return NextResponse.json(
      { error: `Storage download failed: ${dlErr?.message}` },
      { status: 422 }
    );
  }

  const pdfBuffer = Buffer.from(await fileData.arrayBuffer());

  // ── Convert PDF pages to PNG ──────────────────────────────────────────────
  let pages: Array<{ content: Buffer }>;
  try {
    const result = await pdfToPng(pdfBuffer, {
      disableFontFace: true,
      useSystemFonts: false,
      pagesToProcess: Array.from({ length: MAX_SLIDES }, (_, i) => i + 1),
      viewportScale: 1.5,
      returnPageContent: true,
    });
    pages = result
      .filter((p): p is typeof p & { content: Buffer } => p.content !== undefined)
      .map((p) => ({ content: Buffer.from(p.content) }));
  } catch (err) {
    console.error("PDF conversion failed:", err);
    return NextResponse.json(
      { error: "PDF could not be converted" },
      { status: 422 }
    );
  }

  if (pages.length === 0) {
    return NextResponse.json({ error: "PDF has no renderable pages" }, { status: 422 });
  }

  // ── Watermark text ────────────────────────────────────────────────────────
  const scorePart = overall_score != null ? `${Math.round(overall_score)}pts` : "";
  const parts = ["La Liga Qanvit", scorePart, division, vertical].filter(Boolean);
  const watermarkText = parts.join(" · ");

  // ── Process + upload each slide ───────────────────────────────────────────
  const thumbnailUrls: string[] = [];
  const insertRows: Array<{
    startup_id: string;
    deck_id: string;
    slide_number: number;
    thumbnail_url: string;
    width: number | null;
    height: number | null;
  }> = [];

  for (let i = 0; i < Math.min(pages.length, MAX_SLIDES); i++) {
    const slideNumber = i + 1;
    let processed: Buffer;
    try {
      processed = await processSlide(pages[i].content, watermarkText, sharpMod);
    } catch (err) {
      console.error(`Slide ${slideNumber} processing failed:`, err);
      continue;
    }

    const sharpFn = sharpMod.default ?? sharpMod;
    const meta = await sharpFn(processed).metadata();
    const storagePath = `${startup_id}/${deck_id}/slide-${slideNumber}.png`;

    let url: string;
    try {
      url = await uploadWithRetry(supabase, storagePath, processed, "image/png");
    } catch (err) {
      console.error(`Slide ${slideNumber} upload failed:`, err);
      continue;
    }

    thumbnailUrls.push(url);
    insertRows.push({
      startup_id,
      deck_id,
      slide_number: slideNumber,
      thumbnail_url: url,
      width: meta.width ?? null,
      height: meta.height ?? null,
    });
  }

  if (insertRows.length === 0) {
    return NextResponse.json(
      { error: "All slides failed processing" },
      { status: 500 }
    );
  }

  // ── Upsert into deck_public_previews ──────────────────────────────────────
  const { error: upsertErr } = await supabase
    .from("deck_public_previews")
    .upsert(insertRows, { onConflict: "deck_id,slide_number" });

  if (upsertErr) {
    console.error("Upsert failed:", upsertErr.message);
    return NextResponse.json({ error: "DB upsert failed" }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    thumbnails: thumbnailUrls,
    slides_generated: insertRows.length,
  });
}

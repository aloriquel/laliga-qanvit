import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { randomUUID } from "crypto";
import { Jimp, JimpMime } from "jimp";

export const runtime = "nodejs";
export const maxDuration = 15;

const BUCKET = "startup-logos";
const MAX_BYTES = 2 * 1024 * 1024; // 2 MB
const OUTPUT_SIZE = 512;
const SQUARE_TOLERANCE = 0.05; // ±5% → treat as square

const ALLOWED_MIMES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
]);

/** Minimal SVG sanitizer — strips scripts, event handlers, foreignObject. */
function sanitizeSvg(raw: string): string | null {
  if (!raw.trimStart().toLowerCase().startsWith("<svg")) {
    return null; // Not an SVG
  }

  // Remove <script> blocks
  let safe = raw.replace(/<script[\s\S]*?<\/script>/gi, "");
  // Remove event handler attributes (on*)
  safe = safe.replace(/\s+on\w+\s*=\s*(['"])[^'"]*\1/gi, "");
  safe = safe.replace(/\s+on\w+\s*=\s*[^\s>]*/gi, "");
  // Remove <foreignObject> elements
  safe = safe.replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, "");
  // Remove javascript: URIs
  safe = safe.replace(/href\s*=\s*(['"])javascript:[^'"]*\1/gi, "");
  safe = safe.replace(/xlink:href\s*=\s*(['"])javascript:[^'"]*\1/gi, "");

  // Reject if suspicious patterns remain
  if (/<script/i.test(safe) || /javascript:/i.test(safe)) {
    return null;
  }

  return safe;
}

/**
 * Processes a raster buffer:
 * - Validates minimum dimensions (200×200).
 * - If approximately square (aspect ratio within ±5%): resize to 512×512.
 * - Otherwise: scale-to-fit on white 512×512 canvas (center + white padding).
 * - Returns a PNG buffer.
 */
async function processRaster(buffer: Buffer): Promise<Buffer | null> {
  let img: Awaited<ReturnType<typeof Jimp.read>>;
  try {
    img = await Jimp.read(buffer);
  } catch {
    return null;
  }

  const { width, height } = img;

  if (width < 200 || height < 200) {
    return null; // Too small — caller will return 422
  }

  const ratio = width / height;
  const isSquare = Math.abs(ratio - 1) <= SQUARE_TOLERANCE;

  let result: Buffer;
  if (isSquare) {
    img.resize({ w: OUTPUT_SIZE, h: OUTPUT_SIZE });
    result = await img.getBuffer(JimpMime.png);
  } else {
    // Scale logo to fit within 512×512 on a white canvas
    const base = new Jimp({ width: OUTPUT_SIZE, height: OUTPUT_SIZE, color: 0xffffffff });
    img.scaleToFit({ w: OUTPUT_SIZE, h: OUTPUT_SIZE });
    const xOff = Math.floor((OUTPUT_SIZE - img.width) / 2);
    const yOff = Math.floor((OUTPUT_SIZE - img.height) / 2);
    base.composite(img, xOff, yOff);
    result = await base.getBuffer(JimpMime.png);
  }

  return result;
}

export async function POST(req: NextRequest) {
  const prefix = "[startup-logo-upload]";

  // ── Auth ──────────────────────────────────────────────────────────────────
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: startup } = await supabase
    .from("startups")
    .select("id, logo_storage_path")
    .eq("owner_id", user.id)
    .single();

  if (!startup) {
    return NextResponse.json({ error: "Startup not found" }, { status: 404 });
  }

  // ── Parse form data ───────────────────────────────────────────────────────
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "Campo 'file' requerido" }, { status: 400 });
  }

  // ── Validate size ─────────────────────────────────────────────────────────
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "Imagen demasiado grande. Máximo 2MB." },
      { status: 413 }
    );
  }

  // ── Validate MIME ─────────────────────────────────────────────────────────
  const mime = file.type;
  if (!ALLOWED_MIMES.has(mime)) {
    return NextResponse.json(
      { error: "Formato no soportado. Usa PNG, JPG, WebP o SVG." },
      { status: 415 }
    );
  }

  const rawBuffer = Buffer.from(await file.arrayBuffer());
  const service = createServiceClient();
  let uploadBuffer: Buffer;
  let ext: string;

  if (mime === "image/svg+xml") {
    // ── SVG: sanitize ────────────────────────────────────────────────────────
    const svgText = rawBuffer.toString("utf-8");
    const sanitized = sanitizeSvg(svgText);
    if (!sanitized) {
      console.error(`${prefix} SVG rejected — unsafe content`);
      return NextResponse.json(
        { error: "SVG con contenido no permitido." },
        { status: 422 }
      );
    }
    uploadBuffer = Buffer.from(sanitized, "utf-8");
    ext = "svg";
  } else {
    // ── Raster: validate dimensions + process to 512×512 PNG ─────────────────
    const processed = await processRaster(rawBuffer);
    if (processed === null) {
      // Distinguish "too small" vs "corrupt" by peeking at raw
      let imgCheck: { width?: number; height?: number } | null = null;
      try {
        const tmp = await Jimp.read(rawBuffer);
        imgCheck = { width: tmp.width, height: tmp.height };
      } catch {
        // corrupt
      }

      if (imgCheck && (imgCheck.width! < 200 || imgCheck.height! < 200)) {
        return NextResponse.json(
          { error: "Imagen demasiado pequeña. Mínimo 200×200px." },
          { status: 422 }
        );
      }
      console.error(`${prefix} Raster processing failed for startup`, startup.id);
      return NextResponse.json({ error: "No se pudo procesar la imagen." }, { status: 422 });
    }
    uploadBuffer = processed;
    ext = "png";
  }

  // ── Delete previous logo if exists ────────────────────────────────────────
  const prevPath = startup.logo_storage_path;
  if (prevPath) {
    const { error: rmErr } = await service.storage.from(BUCKET).remove([prevPath]);
    if (rmErr) {
      console.warn(`${prefix} Could not delete previous logo at ${prevPath}:`, rmErr.message);
    }
  }

  // ── Upload ────────────────────────────────────────────────────────────────
  const storagePath = `${startup.id}/${randomUUID()}.${ext}`;
  const contentType = ext === "svg" ? "image/svg+xml" : "image/png";

  const { error: ulErr } = await service.storage.from(BUCKET).upload(storagePath, uploadBuffer, {
    contentType,
    upsert: false,
  });

  if (ulErr) {
    console.error(`${prefix} Storage upload failed:`, ulErr.message);
    return NextResponse.json({ error: "Error al subir la imagen." }, { status: 500 });
  }

  const { data: publicUrlData } = service.storage.from(BUCKET).getPublicUrl(storagePath);
  const logoUrl = publicUrlData.publicUrl;

  // ── Update startups row ───────────────────────────────────────────────────
  const { error: dbErr } = await service
    .from("startups")
    .update({
      logo_url: logoUrl,
      logo_storage_path: storagePath,
      logo_updated_at: new Date().toISOString(),
    })
    .eq("id", startup.id);

  if (dbErr) {
    console.error(`${prefix} DB update failed:`, dbErr.message);
    // Storage upload succeeded — roll back
    await service.storage.from(BUCKET).remove([storagePath]);
    return NextResponse.json({ error: "Error al guardar el logo." }, { status: 500 });
  }

  // Refresh materialized view so the leaderboard picks up the new logo immediately
  service.rpc("admin_refresh_league_standings").then(({ error }) => {
    if (error) console.warn(`${prefix} standings refresh failed:`, error.message);
  });

  console.log(`${prefix} Logo updated for startup`, startup.id, "→", storagePath);
  return NextResponse.json({ logo_url: logoUrl });
}

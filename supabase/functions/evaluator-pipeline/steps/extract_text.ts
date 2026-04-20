import { extractText as unpdfExtract } from "https://esm.sh/unpdf@0.12.0";

export type ExtractResult = {
  text: string;
  page_count: number;
  language: string;
};

export async function extractText(pdfBuffer: Uint8Array): Promise<ExtractResult> {
  const { text, totalPages } = await unpdfExtract(pdfBuffer);

  if (!text || text.trim().length === 0) {
    throw new Error("PDF extraction returned empty text. The deck may be scanned without OCR.");
  }

  // Naive language detection: count Spanish markers
  const spanishMarkers = /\b(el|la|de|en|que|con|una|los|las|para|por|startup|equipo)\b/gi;
  const englishMarkers = /\b(the|and|of|in|to|for|with|our|we|team|startup|revenue)\b/gi;
  const spCount = (text.match(spanishMarkers) ?? []).length;
  const enCount = (text.match(englishMarkers) ?? []).length;
  const language = spCount > enCount ? "es" : "en";

  return { text, page_count: totalPages, language };
}

// @ts-ignore — pdfjs-dist ESM build works in Deno edge runtime without a worker
import * as pdfjsLib from "https://esm.sh/pdfjs-dist@3.11.174/build/pdf.mjs";

// Disable the web worker (not available in edge runtime)
// @ts-ignore
pdfjsLib.GlobalWorkerOptions.workerSrc = "";

export type ExtractResult = {
  text: string;
  page_count: number;
  language: string;
};

export async function extractText(pdfBuffer: Uint8Array): Promise<ExtractResult> {
  // @ts-ignore
  const loadingTask = pdfjsLib.getDocument({ data: pdfBuffer, useWorkerFetch: false, isEvalSupported: false, useSystemFonts: true });
  const pdf = await loadingTask.promise;
  const totalPages = pdf.numPages;

  const pageTexts: string[] = [];
  for (let i = 1; i <= totalPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      // @ts-ignore
      .filter((item) => "str" in item)
      // @ts-ignore
      .map((item) => item.str)
      .join(" ");
    pageTexts.push(pageText);
  }

  const text = pageTexts.join("\n");

  if (!text || text.trim().length === 0) {
    throw new Error("PDF extraction returned empty text. The deck may be scanned without OCR.");
  }

  const spanishMarkers = /\b(el|la|de|en|que|con|una|los|las|para|por|startup|equipo)\b/gi;
  const englishMarkers = /\b(the|and|of|in|to|for|with|our|we|team|startup|revenue)\b/gi;
  const spCount = (text.match(spanishMarkers) ?? []).length;
  const enCount = (text.match(englishMarkers) ?? []).length;
  const language = spCount > enCount ? "es" : "en";

  return { text, page_count: totalPages, language };
}

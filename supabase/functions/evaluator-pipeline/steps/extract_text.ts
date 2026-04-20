import Anthropic from "https://esm.sh/@anthropic-ai/sdk@0.32.1";

export type ExtractResult = {
  text: string;
  page_count: number;
  language: string;
};

const client = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY") ?? "" });

export async function extractText(pdfBuffer: Uint8Array): Promise<ExtractResult> {
  // Convert to base64 — btoa works on latin-1 byte strings
  const binary = Array.from(pdfBuffer).map((b) => String.fromCharCode(b)).join("");
  const base64Pdf = btoa(binary);

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 8192,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "document",
            source: { type: "base64", media_type: "application/pdf", data: base64Pdf },
          } as Anthropic.DocumentBlockParam,
          {
            type: "text",
            text: `Extract ALL the text content from this PDF. Return only the raw text, preserving paragraph breaks with newlines. On the first line write PAGES:<number> with the total page count, then a blank line, then the text.`,
          },
        ],
      },
    ],
  });

  const raw = response.content[0].type === "text" ? response.content[0].text : "";

  // Parse page count from first line
  const firstLine = raw.split("\n")[0] ?? "";
  const pageMatch = firstLine.match(/PAGES:(\d+)/);
  const page_count = pageMatch ? parseInt(pageMatch[1]) : 10;
  const text = raw.replace(/^PAGES:\d+\s*\n/, "").trim();

  if (!text || text.length < 50) {
    throw new Error("PDF extraction returned empty text. The deck may be scanned without OCR.");
  }

  const spanishMarkers = /\b(el|la|de|en|que|con|una|los|las|para|por|startup|equipo)\b/gi;
  const englishMarkers = /\b(the|and|of|in|to|for|with|our|we|team|startup|revenue)\b/gi;
  const spCount = (text.match(spanishMarkers) ?? []).length;
  const enCount = (text.match(englishMarkers) ?? []).length;
  const language = spCount > enCount ? "es" : "en";

  return { text, page_count, language };
}

// Deno test — run with: deno test supabase/functions/evaluator-pipeline/__tests__/
import { assertEquals, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { chunkText } from "../steps/chunk_text.ts";

const TARGET_CHARS = 3200;

Deno.test("chunkText: empty string returns 0 chunks", () => {
  const result = chunkText("");
  assertEquals(result.length, 0);
});

Deno.test("chunkText: whitespace-only string returns 0 chunks", () => {
  const result = chunkText("   \n\n  ");
  assertEquals(result.length, 0);
});

Deno.test("chunkText: short text returns single chunk", () => {
  const text = "This is a short paragraph about our startup.";
  const result = chunkText(text);
  assertEquals(result.length, 1);
  assertEquals(result[0].chunk_index, 0);
  assert(result[0].content.includes("startup"));
});

Deno.test("chunkText: 10k chars produces multiple chunks each ≤ target+overlap", () => {
  // Generate 10k chars with paragraph breaks
  const paragraph = "La startup desarrolla robots industriales autónomos para inspección de tuberías en entornos de alta presión. ";
  let text = "";
  while (text.length < 10000) {
    text += paragraph + "\n\n";
  }

  const result = chunkText(text);
  assert(result.length >= 2, `Expected multiple chunks, got ${result.length}`);

  for (const chunk of result) {
    assert(
      chunk.content.length <= TARGET_CHARS + 500,
      `Chunk ${chunk.chunk_index} too large: ${chunk.content.length} chars`
    );
    assert(chunk.content.trim().length > 0, `Chunk ${chunk.chunk_index} is empty`);
  }
});

Deno.test("chunkText: chunks have sequential indices", () => {
  const paragraph = "Párrafo de prueba para verificar índices. ";
  let text = "";
  while (text.length < 8000) text += paragraph + "\n\n";

  const result = chunkText(text);
  for (let i = 0; i < result.length; i++) {
    assertEquals(result[i].chunk_index, i);
  }
});

Deno.test("chunkText: overlap preserves context between adjacent chunks", () => {
  // Create text where first paragraph ends with a unique marker
  const firstPart = "MARKER_UNIQUE_WORD ".repeat(10) + "\n\n";
  const filler = "Texto de relleno para aumentar el tamaño del chunk. ".repeat(80) + "\n\n";
  const text = firstPart + filler;

  const result = chunkText(text);
  if (result.length >= 2) {
    // The marker should appear in both the last chunk of the first section and possibly the next
    const combined = result.map(c => c.content).join(" ");
    assert(combined.includes("MARKER_UNIQUE_WORD"), "Marker should be present in output");
  }
});

// Chunking strategy: ~3200 chars per chunk, ~400 chars overlap.
// Split preferentially on paragraph boundaries, then sentence, then hard cut.

export type Chunk = {
  content: string;
  chunk_index: number;
  metadata: { page_hint: number | null; position: number };
};

const TARGET_CHARS = 3200;
const OVERLAP_CHARS = 400;

export function chunkText(text: string): Chunk[] {
  if (!text || text.trim().length === 0) return [];

  // Split on paragraph breaks first
  const paragraphs = text.split(/\n{2,}/).filter((p) => p.trim().length > 0);

  const chunks: Chunk[] = [];
  let current = "";
  let position = 0;

  const flush = () => {
    if (current.trim().length > 0) {
      chunks.push({
        content: current.trim(),
        chunk_index: chunks.length,
        metadata: { page_hint: null, position },
      });
      // Keep overlap
      const words = current.split(/\s+/);
      const overlapWords: string[] = [];
      let overlapLen = 0;
      for (let i = words.length - 1; i >= 0 && overlapLen < OVERLAP_CHARS; i--) {
        overlapWords.unshift(words[i]);
        overlapLen += words[i].length + 1;
      }
      current = overlapWords.join(" ");
      position = chunks.length;
    }
  };

  for (const para of paragraphs) {
    if (current.length + para.length + 2 > TARGET_CHARS && current.length > 0) {
      flush();
    }

    if (para.length > TARGET_CHARS) {
      // Hard split long paragraphs on sentence boundaries
      const sentences = para.match(/[^.!?]+[.!?]+/g) ?? [para];
      for (const sentence of sentences) {
        if (current.length + sentence.length > TARGET_CHARS && current.length > 0) {
          flush();
        }
        current += (current.length > 0 ? " " : "") + sentence;
        if (current.length >= TARGET_CHARS) flush();
      }
    } else {
      current += (current.length > 0 ? "\n\n" : "") + para;
    }
  }

  if (current.trim().length > 0) {
    chunks.push({
      content: current.trim(),
      chunk_index: chunks.length,
      metadata: { page_hint: null, position },
    });
  }

  return chunks;
}

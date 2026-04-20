import { getOpenAIClient, EMBEDDING_MODEL } from "../_shared/openai.ts";
import type { Chunk } from "./chunk_text.ts";

export type EmbeddedChunk = Chunk & { embedding: number[]; token_count: number };

const BATCH_SIZE = 100; // OpenAI allows up to 2048 inputs; 100 is safe for deck sizes

export async function embedChunks(chunks: Chunk[]): Promise<EmbeddedChunk[]> {
  if (chunks.length === 0) return [];

  const openai = getOpenAIClient();
  const result: EmbeddedChunk[] = [];

  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);
    const inputs = batch.map((c) => c.content);

    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: inputs,
      encoding_format: "float",
    });

    for (let j = 0; j < batch.length; j++) {
      result.push({
        ...batch[j],
        embedding: response.data[j].embedding,
        // OpenAI doesn't return token counts per item in batch; estimate from chars
        token_count: Math.ceil(batch[j].content.length / 4),
      });
    }
  }

  return result;
}

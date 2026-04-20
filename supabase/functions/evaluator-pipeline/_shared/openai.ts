import OpenAI from "https://esm.sh/openai@4.67.0";

let _client: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!_client) {
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) throw new Error("OPENAI_API_KEY missing");
    _client = new OpenAI({ apiKey });
  }
  return _client;
}

export const EMBEDDING_MODEL = "text-embedding-3-small";
export const EMBEDDING_DIMS = 1536;

// OpenAI pricing as of 2025 — update when prices change
const PRICE_PER_1K_INPUT_TOKENS: Record<string, number> = {
  "claude-opus-4-7": 0.015,
  "claude-haiku-4-5-20251001": 0.00025,
};
const PRICE_PER_1K_OUTPUT_TOKENS: Record<string, number> = {
  "claude-opus-4-7": 0.075,
  "claude-haiku-4-5-20251001": 0.00125,
};

export function estimateCost(model: string, inputTokens: number, outputTokens: number): number {
  const inPrice = PRICE_PER_1K_INPUT_TOKENS[model] ?? 0;
  const outPrice = PRICE_PER_1K_OUTPUT_TOKENS[model] ?? 0;
  return (inputTokens / 1000) * inPrice + (outputTokens / 1000) * outPrice;
}

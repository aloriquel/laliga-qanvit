import Anthropic from "https://esm.sh/@anthropic-ai/sdk@0.32.0";

let _client: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (!_client) {
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY missing");
    _client = new Anthropic({ apiKey });
  }
  return _client;
}

export const CLASSIFIER_MODEL = "claude-haiku-4-5-20251001";
export const EVALUATOR_MODEL = "claude-opus-4-7";

// Extracts the first tool_use block from an Anthropic response.
export function extractToolInput(
  response: Anthropic.Message,
  toolName: string
): Record<string, unknown> {
  const block = response.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === "tool_use" && b.name === toolName
  );
  if (!block) throw new Error(`tool_use block '${toolName}' not found in response`);
  return block.input as Record<string, unknown>;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// Checks if an error is transient (should retry) or permanent (skip to fallback).
export function isTransientError(err: unknown): boolean {
  if (!(err instanceof Error)) return true;
  const msg = err.message.toLowerCase();
  // Permanent errors — go straight to fallback
  if (msg.includes("400") || msg.includes("invalid_request")) return false;
  if (msg.includes("401") || msg.includes("authentication")) return false;
  return true;
}

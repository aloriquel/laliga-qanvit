import Anthropic from "https://esm.sh/@anthropic-ai/sdk@0.32.0";
import {
  getAnthropicClient,
  EVALUATOR_MODEL,
  CLASSIFIER_MODEL,
  extractToolInput,
  sleep,
  isTransientError,
} from "../_shared/anthropic.ts";
import {
  EvaluationResultSchema,
  evaluationToolSchema,
  type EvaluationResult,
} from "../_shared/schemas.ts";
import {
  buildEvaluatorSystemPrompt,
  buildEvaluatorUserPrompt,
  buildCorrectionMessage,
} from "../_shared/prompts.ts";
import { DIVISION_WEIGHTS, type Phase } from "../_shared/weights.ts";

export type EvaluateOutput = EvaluationResult & {
  evaluator_model: string;
  tokens_input: number;
  tokens_output: number;
  degraded: boolean;
  degraded_reason?: string;
};

type EvaluateArgs = {
  deckText: string;
  phase: Phase;
  vertical: string;
};

async function callModel(
  model: string,
  args: EvaluateArgs
): Promise<{ result: EvaluationResult; tokens_input: number; tokens_output: number }> {
  const client = getAnthropicClient();
  const weightsJson = JSON.stringify(DIVISION_WEIGHTS[args.phase], null, 2);
  const systemPrompt = buildEvaluatorSystemPrompt(args.phase, args.vertical, weightsJson);
  const userPrompt = buildEvaluatorUserPrompt(args.deckText);

  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  const messages: { role: "user" | "assistant"; content: string }[] = [
    { role: "user", content: userPrompt },
  ];

  const response = await client.messages.create({
    model,
    max_tokens: 4096,
    system: systemPrompt,
    tools: [evaluationToolSchema as never],
    tool_choice: { type: "any" },
    messages,
  });

  totalInputTokens += response.usage.input_tokens;
  totalOutputTokens += response.usage.output_tokens;

  const rawInput = extractToolInput(response, "submit_evaluation");
  const parsed = EvaluationResultSchema.safeParse(rawInput);

  if (parsed.success) {
    return { result: parsed.data, tokens_input: totalInputTokens, tokens_output: totalOutputTokens };
  }

  // One correction attempt within this call
  const zodErrors = parsed.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join("\n");
  const correctionMessages: Anthropic.MessageParam[] = [
    { role: "user", content: userPrompt },
    { role: "assistant", content: JSON.stringify(rawInput) },
    { role: "user", content: buildCorrectionMessage(zodErrors) },
  ];

  const correctionResponse = await client.messages.create({
    model,
    max_tokens: 4096,
    system: systemPrompt,
    tools: [evaluationToolSchema as never],
    tool_choice: { type: "any" },
    messages: correctionMessages,
  });

  totalInputTokens += correctionResponse.usage.input_tokens;
  totalOutputTokens += correctionResponse.usage.output_tokens;

  const correctedInput = extractToolInput(correctionResponse, "submit_evaluation");
  const correctedParsed = EvaluationResultSchema.safeParse(correctedInput);

  if (!correctedParsed.success) {
    throw new Error(`Schema validation failed after correction: ${correctedParsed.error.message}`);
  }

  return { result: correctedParsed.data, tokens_input: totalInputTokens, tokens_output: totalOutputTokens };
}

export async function evaluateWithRetry(args: EvaluateArgs): Promise<EvaluateOutput> {
  const errors: string[] = [];

  // 3 attempts with Opus
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const { result, tokens_input, tokens_output } = await callModel(EVALUATOR_MODEL, args);
      return {
        ...result,
        evaluator_model: EVALUATOR_MODEL,
        tokens_input,
        tokens_output,
        degraded: false,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Opus attempt ${attempt}: ${msg}`);

      // Permanent errors skip directly to Haiku fallback
      if (!isTransientError(err)) break;

      if (attempt < 3) {
        const baseMs = 2000 * Math.pow(2, attempt - 1);
        const jitter = baseMs * (0.8 + Math.random() * 0.4);
        await sleep(jitter);
      }
    }
  }

  // Fallback to Haiku
  try {
    const { result, tokens_input, tokens_output } = await callModel(CLASSIFIER_MODEL, args);
    return {
      ...result,
      evaluator_model: CLASSIFIER_MODEL,
      tokens_input,
      tokens_output,
      degraded: true,
      degraded_reason: errors.join(" | "),
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push(`Haiku fallback: ${msg}`);
    throw new Error(`All evaluation attempts failed: ${errors.join(" | ")}`);
  }
}

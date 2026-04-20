import {
  getAnthropicClient,
  CLASSIFIER_MODEL,
  extractToolInput,
  sleep,
} from "../_shared/anthropic.ts";
import {
  ClassificationResultSchema,
  classificationToolSchema,
  type ClassificationResult,
} from "../_shared/schemas.ts";
import {
  buildClassifierUserPrompt,
  buildCorrectionMessage,
  CLASSIFIER_SYSTEM_PROMPT,
} from "../_shared/prompts.ts";

export type ClassifyOutput = ClassificationResult & {
  tokens_input: number;
  tokens_output: number;
};

export async function classifyDeck(deckText: string): Promise<ClassifyOutput> {
  const client = getAnthropicClient();
  const userPrompt = buildClassifierUserPrompt(deckText);

  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  for (let attempt = 1; attempt <= 2; attempt++) {
    const messages: { role: "user" | "assistant"; content: string }[] = [
      { role: "user", content: userPrompt },
    ];

    const response = await client.messages.create({
      model: CLASSIFIER_MODEL,
      max_tokens: 1024,
      system: CLASSIFIER_SYSTEM_PROMPT,
      tools: [classificationToolSchema as never],
      tool_choice: { type: "any" },
      messages,
    });

    totalInputTokens += response.usage.input_tokens;
    totalOutputTokens += response.usage.output_tokens;

    const rawInput = extractToolInput(response, "submit_classification");
    const parsed = ClassificationResultSchema.safeParse(rawInput);

    if (parsed.success) {
      return {
        ...parsed.data,
        tokens_input: totalInputTokens,
        tokens_output: totalOutputTokens,
      };
    }

    if (attempt < 2) {
      // One correction attempt
      const zodErrors = parsed.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join("\n");
      messages.push(
        { role: "assistant", content: JSON.stringify(rawInput) },
        { role: "user", content: buildCorrectionMessage(zodErrors) }
      );
      await sleep(1000);
    } else {
      throw new Error(`Classification schema validation failed after correction: ${parsed.error.message}`);
    }
  }

  throw new Error("classify: exhausted attempts");
}

// ⚠️ DUPLICADO de lib/evaluator/schemas.ts. Mantener en sync hasta V1.5 (shared package).
import { z } from "https://esm.sh/zod@3.23.8";

export const ClassificationResultSchema = z.object({
  detected_phase: z.enum(["ideation", "seed", "growth", "elite"]),
  phase_confidence: z.number().min(0).max(1),
  phase_signals: z.array(z.string()).min(1),
  detected_vertical: z.enum([
    "deeptech_ai",
    "robotics_automation",
    "mobility",
    "energy_cleantech",
    "agrifood",
    "healthtech_medtech",
    "industrial_manufacturing",
    "space_aerospace",
    "materials_chemistry",
    "cybersecurity",
  ]),
  vertical_confidence: z.number().min(0).max(1),
  vertical_signals: z.array(z.string()).min(1),
  language: z.string(),
});

export type ClassificationResult = z.infer<typeof ClassificationResultSchema>;

const DimensionFeedbackSchema = z.object({
  score: z.number().min(0).max(100),
  strengths: z.array(z.string()).min(1),
  weaknesses: z.array(z.string()).min(1),
  evidence_quotes: z.array(z.string()).min(1),
});

const FundingStageDiscrepancySchema = z.object({
  suspected_stage: z.string(),
  severity: z.enum(["low", "medium", "high"]),
  reasoning: z.string(),
});

export const EvaluationResultSchema = z.object({
  scores: z.object({
    problem: z.number().min(0).max(100),
    market: z.number().min(0).max(100),
    solution: z.number().min(0).max(100),
    team: z.number().min(0).max(100),
    traction: z.number().min(0).max(100),
    business_model: z.number().min(0).max(100),
    gtm: z.number().min(0).max(100),
  }),
  score_total: z.number().min(0).max(100),
  feedback: z.object({
    problem: DimensionFeedbackSchema,
    market: DimensionFeedbackSchema,
    solution: DimensionFeedbackSchema,
    team: DimensionFeedbackSchema,
    traction: DimensionFeedbackSchema,
    business_model: DimensionFeedbackSchema,
    gtm: DimensionFeedbackSchema,
  }),
  summary: z.string(),
  next_actions: z.array(z.string()).min(1).max(5),
  funding_stage_discrepancy: FundingStageDiscrepancySchema.nullable().optional(),
});

export type EvaluationResult = z.infer<typeof EvaluationResultSchema>;

// JSON schema representation of ClassificationResultSchema for Anthropic tool_use.
export const classificationToolSchema = {
  name: "submit_classification",
  description: "Submit the classification result for a startup deck.",
  input_schema: {
    type: "object",
    properties: {
      detected_phase: { type: "string", enum: ["ideation", "seed", "growth", "elite"] },
      phase_confidence: { type: "number", minimum: 0, maximum: 1 },
      phase_signals: { type: "array", items: { type: "string" }, minItems: 1 },
      detected_vertical: {
        type: "string",
        enum: [
          "deeptech_ai", "robotics_automation", "mobility", "energy_cleantech",
          "agrifood", "healthtech_medtech", "industrial_manufacturing",
          "space_aerospace", "materials_chemistry", "cybersecurity",
        ],
      },
      vertical_confidence: { type: "number", minimum: 0, maximum: 1 },
      vertical_signals: { type: "array", items: { type: "string" }, minItems: 1 },
      language: { type: "string" },
    },
    required: [
      "detected_phase", "phase_confidence", "phase_signals",
      "detected_vertical", "vertical_confidence", "vertical_signals", "language",
    ],
  },
} as const;

const dimensionSchema = {
  type: "object",
  properties: {
    score: { type: "number", minimum: 0, maximum: 100 },
    strengths: { type: "array", items: { type: "string" }, minItems: 1 },
    weaknesses: { type: "array", items: { type: "string" }, minItems: 1 },
    evidence_quotes: { type: "array", items: { type: "string" }, minItems: 1 },
  },
  required: ["score", "strengths", "weaknesses", "evidence_quotes"],
};

export const evaluationToolSchema = {
  name: "submit_evaluation",
  description: "Submit the deep evaluation result for a startup deck.",
  input_schema: {
    type: "object",
    properties: {
      scores: {
        type: "object",
        properties: {
          problem: { type: "number", minimum: 0, maximum: 100 },
          market: { type: "number", minimum: 0, maximum: 100 },
          solution: { type: "number", minimum: 0, maximum: 100 },
          team: { type: "number", minimum: 0, maximum: 100 },
          traction: { type: "number", minimum: 0, maximum: 100 },
          business_model: { type: "number", minimum: 0, maximum: 100 },
          gtm: { type: "number", minimum: 0, maximum: 100 },
        },
        required: ["problem", "market", "solution", "team", "traction", "business_model", "gtm"],
      },
      score_total: { type: "number", minimum: 0, maximum: 100 },
      feedback: {
        type: "object",
        properties: {
          problem: dimensionSchema,
          market: dimensionSchema,
          solution: dimensionSchema,
          team: dimensionSchema,
          traction: dimensionSchema,
          business_model: dimensionSchema,
          gtm: dimensionSchema,
        },
        required: ["problem", "market", "solution", "team", "traction", "business_model", "gtm"],
      },
      summary: { type: "string" },
      next_actions: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 5 },
      funding_stage_discrepancy: {
        type: "object",
        nullable: true,
        properties: {
          suspected_stage: { type: "string" },
          severity: { type: "string", enum: ["low", "medium", "high"] },
          reasoning: { type: "string" },
        },
        required: ["suspected_stage", "severity", "reasoning"],
      },
    },
    required: ["scores", "score_total", "feedback", "summary", "next_actions"],
  },
} as const;

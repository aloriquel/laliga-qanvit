import { z } from "zod";

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
});

export type EvaluationResult = z.infer<typeof EvaluationResultSchema>;

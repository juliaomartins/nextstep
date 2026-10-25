import { z } from "zod";
import { cleanText } from "./clean-text";
import { DEFAULT_LANGUAGE, LanguageSchema, type LanguageCode } from "./languages";

export const MIN_CHARS = 200;
export const MAX_CHARS = 20_000;

/* ---------- What the AI must return ----------
 * Strict structured output: every field is required, so "optional" fields are nullable. */

export const GroupSchema = z.enum(["required", "recommended", "needs_check"]);

export const DeadlineStatusSchema = z.enum(["stated", "relative", "unclear", "not_stated"]);

export const DeadlineSchema = z.object({
  status: DeadlineStatusSchema.describe(
    "stated = an explicit calendar date; relative = timing that depends on another step; unclear = hinted but not pinned down; not_stated = no deadline in the document",
  ),
  date: z.string().nullable().describe("YYYY-MM-DD, only when status is stated; otherwise null"),
  wording: z.string().nullable().describe("The deadline as written in the document, or null"),
  sourceExcerpt: z.string().nullable().describe("Verbatim sentence from the document that states the deadline, or null"),
});

export const AnalysisItemSchema = z.object({
  title: z.string().describe("An action the reader can tick off, e.g. 'Prepare a CV in PDF format'"),
  group: GroupSchema.describe(
    "required = must/required/mandatory; recommended = preferred/nice to have/optional/a plus; needs_check = vague, conditional, or 'may'",
  ),
  whyItMatters: z.string().describe("One short line on why this matters"),
  sourceExcerpt: z.string().describe("Verbatim quote copied exactly from the document"),
  deadline: z.string().nullable().describe("Item-specific deadline as written, or null"),
});

export const AnalysisSchema = z.object({
  summary: z.string().describe("2-3 plain-language sentences: what the document is and what it asks of the reader"),
  deadline: DeadlineSchema,
  items: z.array(AnalysisItemSchema),
});

export type AnalysisOutput = z.infer<typeof AnalysisSchema>;

/* ---------- What the API returns and the page stores ---------- */

export const EvidenceSchema = z.enum(["found", "not_found"]);

export const ResultItemSchema = AnalysisItemSchema.extend({
  id: z.string(),
  evidence: EvidenceSchema,
});

export const AnalysisResultSchema = AnalysisSchema.extend({
  items: z.array(ResultItemSchema),
  // The language the summary, titles, and reasons are written in. Optional so checklists saved before it existed still load (English).
  language: LanguageSchema.optional(),
  // Set by the evidence check. Optional so checklists saved before it existed still load.
  safety: z
    .object({
      aiInstructions: z.boolean(), // the text contained instructions aimed at an AI; they were ignored
      summaryReplaced: z.boolean(), // the model's summary was off-task (a poem, an essay) and was replaced
    })
    .optional(),
});

export type Group = z.infer<typeof GroupSchema>;
export type Deadline = z.infer<typeof DeadlineSchema>;
export type ResultItem = z.infer<typeof ResultItemSchema>;
export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;

/* ---------- Request / errors ---------- */

export type ApiErrorCode = "too_short" | "too_long" | "invalid_request" | "analysis_failed";

export type ApiError = { error: { code: ApiErrorCode; message: string } };

export type InputCheck =
  | { ok: true; text: string; language: LanguageCode }
  | { ok: false; code: Exclude<ApiErrorCode, "analysis_failed"> };

const AnalyzeRequestSchema = z.object({ text: z.string(), language: LanguageSchema.default(DEFAULT_LANGUAGE) });

export function validateAnalyzeInput(body: unknown): InputCheck {
  const parsed = AnalyzeRequestSchema.safeParse(body);
  if (!parsed.success) return { ok: false, code: "invalid_request" };

  const text = cleanText(parsed.data.text);
  if (text.length < MIN_CHARS) return { ok: false, code: "too_short" };
  if (text.length > MAX_CHARS) return { ok: false, code: "too_long" };
  return { ok: true, text, language: parsed.data.language };
}

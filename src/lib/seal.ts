import { createHmac, timingSafeEqual } from "node:crypto";
import { AnalysisResultSchema, type AnalysisResult } from "./schemas";

/*
 * Server-only. The API seals every checklist it makes (an HMAC-SHA256 over the result), the extension carries
 * the seal in its /results link, and /results asks the server to confirm it before showing anything.
 * So a hand-made link can't show a fake checklist stamped "Found" and "Checked by code".
 */

function secret(): string {
  if (process.env.HANDOFF_SECRET) return process.env.HANDOFF_SECRET;
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("No HANDOFF_SECRET or OPENAI_API_KEY to seal results with");
  // A one-way derivation: the seal never reveals the OpenAI key.
  return createHmac("sha256", key).update("nextstep handoff seal v1").digest("hex");
}

/** The result as the schema shapes it, so field order or extra fields can't change the seal. */
function canonical(result: AnalysisResult): string {
  return JSON.stringify(AnalysisResultSchema.parse(result));
}

export function sealResult(result: AnalysisResult): string {
  return createHmac("sha256", secret()).update(canonical(result)).digest("hex");
}

export function isSealed(result: AnalysisResult, seal: string): boolean {
  if (!/^[0-9a-f]{64}$/.test(seal)) return false;
  return timingSafeEqual(Buffer.from(sealResult(result), "hex"), Buffer.from(seal, "hex"));
}

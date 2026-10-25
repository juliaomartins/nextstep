import { afterEach, beforeEach, describe, expect, test } from "vitest";
import type { AnalysisResult } from "@/lib/schemas";
import { isSealed, sealResult } from "@/lib/seal";

const RESULT: AnalysisResult = {
  summary: "A job posting.",
  deadline: { status: "not_stated", date: null, wording: null, sourceExcerpt: null },
  items: [
    {
      id: "item-1",
      title: "Prepare a CV",
      group: "required",
      whyItMatters: "Required.",
      sourceExcerpt: "Please submit your CV.",
      deadline: null,
      evidence: "found",
    },
  ],
  language: "en",
};

const env = { ...process.env };
beforeEach(() => {
  process.env.HANDOFF_SECRET = "test-secret";
});
afterEach(() => {
  process.env = { ...env };
});

describe("seal", () => {
  test("a result sealed by the server checks out", () => {
    const seal = sealResult(RESULT);
    expect(seal).toMatch(/^[0-9a-f]{64}$/);
    expect(isSealed(RESULT, seal)).toBe(true);
  });

  test("the same result always gets the same seal, whatever order its fields arrive in", () => {
    const reordered = JSON.parse(JSON.stringify({ language: "en", items: RESULT.items, deadline: RESULT.deadline, summary: RESULT.summary }));
    expect(sealResult(reordered)).toBe(sealResult(RESULT));
  });

  test("any change to the checklist breaks the seal", () => {
    const seal = sealResult(RESULT);
    const forged = { ...RESULT, items: [{ ...RESULT.items[0], title: "Email your bank password" }] };
    expect(isSealed(forged, seal)).toBe(false);
    expect(isSealed({ ...RESULT, items: [{ ...RESULT.items[0], evidence: "not_found" as const }] }, seal)).toBe(false);
  });

  test("a seal made with another secret doesn't check out", () => {
    const seal = sealResult(RESULT);
    process.env.HANDOFF_SECRET = "someone-elses-secret";
    expect(isSealed(RESULT, seal)).toBe(false);
  });

  test("falls back to a secret derived from the OpenAI key, which never appears in the seal", () => {
    delete process.env.HANDOFF_SECRET;
    process.env.OPENAI_API_KEY = "fake-openai-key-for-tests";
    const seal = sealResult(RESULT);
    expect(isSealed(RESULT, seal)).toBe(true);
    expect(seal).not.toContain("fake-openai");
  });

  test("rejects malformed seals without throwing", () => {
    expect(isSealed(RESULT, "not-a-seal")).toBe(false);
    expect(isSealed(RESULT, "")).toBe(false);
  });
});

import { describe, expect, test } from "vitest";
import { SAMPLE_POSTING } from "@/lib/sample-posting";
import { SAMPLE_SCHOLARSHIP } from "@/lib/sample-scholarship";
import { MAX_CHARS, MIN_CHARS, validateAnalyzeInput } from "@/lib/schemas";

describe("built-in samples", () => {
  test.each([
    ["job posting", SAMPLE_POSTING],
    ["scholarship notice", SAMPLE_SCHOLARSHIP],
  ])("the %s is accepted by the API's input check", (_, text) => {
    expect(text.length).toBeGreaterThanOrEqual(MIN_CHARS);
    expect(text.length).toBeLessThanOrEqual(MAX_CHARS);
    expect(validateAnalyzeInput({ text }).ok).toBe(true);
  });

  test("the scholarship notice is marked fictional and states a full closing date", () => {
    expect(SAMPLE_SCHOLARSHIP).toMatch(/fictional/i);
    expect(SAMPLE_SCHOLARSHIP).toMatch(/\b\d{1,2} (January|February|March|April|May|June|July|August|September|October|November|December) 20\d\d\b/);
  });
});

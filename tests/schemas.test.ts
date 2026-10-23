import { describe, expect, test } from "vitest";
import { MAX_CHARS, MIN_CHARS, validateAnalyzeInput } from "@/lib/schemas";

describe("validateAnalyzeInput", () => {
  test("accepts text within the limits and returns it trimmed", () => {
    const text = "a".repeat(MIN_CHARS);
    expect(validateAnalyzeInput({ text: `  ${text}  ` })).toEqual({ ok: true, text });
  });

  test("rejects text shorter than the minimum after trimming as too_short", () => {
    expect(validateAnalyzeInput({ text: `   ${"a".repeat(MIN_CHARS - 1)}   ` })).toEqual({
      ok: false,
      code: "too_short",
    });
  });

  test("rejects text longer than the maximum as too_long", () => {
    expect(validateAnalyzeInput({ text: "a".repeat(MAX_CHARS + 1) })).toEqual({ ok: false, code: "too_long" });
  });

  test("rejects a body without a text string as invalid_request", () => {
    expect(validateAnalyzeInput({ document: "hello" })).toEqual({ ok: false, code: "invalid_request" });
    expect(validateAnalyzeInput(null)).toEqual({ ok: false, code: "invalid_request" });
  });

  test("uses the agreed limits of 200 and 20,000 characters", () => {
    expect([MIN_CHARS, MAX_CHARS]).toEqual([200, 20_000]);
  });
});

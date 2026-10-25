import { describe, expect, test } from "vitest";
import { MAX_CHARS, MIN_CHARS, validateAnalyzeInput } from "@/lib/schemas";

describe("validateAnalyzeInput", () => {
  test("accepts text within the limits and returns it trimmed", () => {
    const text = "a".repeat(MIN_CHARS);
    expect(validateAnalyzeInput({ text: `  ${text}  ` })).toEqual({ ok: true, text, language: "en" });
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

  test("cleans whitespace before checking the length and returns the cleaned text", () => {
    const padded = `Apply   now.\n\n\n\n${"a".repeat(MIN_CHARS)}`;
    expect(validateAnalyzeInput({ text: padded })).toEqual({
      ok: true,
      text: `Apply now.\n\n${"a".repeat(MIN_CHARS)}`,
      language: "en",
    });
  });

  test("passes on a known checklist language, and defaults to English", () => {
    const text = "a".repeat(MIN_CHARS);
    expect(validateAnalyzeInput({ text, language: "pt" })).toEqual({ ok: true, text, language: "pt" });
    expect(validateAnalyzeInput({ text, language: "fil" })).toEqual({ ok: true, text, language: "fil" });
  });

  test("rejects an unknown checklist language as invalid_request", () => {
    const text = "a".repeat(MIN_CHARS);
    expect(validateAnalyzeInput({ text, language: "xx" })).toEqual({ ok: false, code: "invalid_request" });
    expect(validateAnalyzeInput({ text, language: 7 })).toEqual({ ok: false, code: "invalid_request" });
  });

  test("text that is mostly whitespace counts as too short", () => {
    expect(validateAnalyzeInput({ text: `word ${" ".repeat(400)} word` })).toEqual({ ok: false, code: "too_short" });
  });

  test("uses the agreed limits of 200 and 20,000 characters", () => {
    expect([MIN_CHARS, MAX_CHARS]).toEqual([200, 20_000]);
  });
});

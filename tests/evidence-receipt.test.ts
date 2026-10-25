import { describe, expect, test } from "vitest";
import { evidenceReceipt } from "@/lib/evidence-receipt";
import type { ResultItem } from "@/lib/schemas";

const item = (evidence: ResultItem["evidence"]): ResultItem => ({
  id: "x",
  title: "Do the thing",
  group: evidence === "found" ? "required" : "needs_check",
  whyItMatters: "Because.",
  sourceExcerpt: "A quote.",
  deadline: null,
  evidence,
});

describe("evidenceReceipt", () => {
  test("says every quote was found when the code found them all", () => {
    expect(evidenceReceipt([item("found"), item("found"), item("found")])).toBe(
      "Checked by code: 3 of 3 quotes found word for word in your document.",
    );
  });

  test("says how many were not found and where they went", () => {
    expect(evidenceReceipt([item("found"), item("not_found"), item("found")])).toBe(
      "Checked by code: 2 of 3 quotes found word for word in your document. 1 moved to Needs your check.",
    );
  });

  test("uses the singular for a single quote", () => {
    expect(evidenceReceipt([item("found")])).toBe("Checked by code: 1 of 1 quote found word for word in your document.");
  });

  test("is absent when there are no steps", () => {
    expect(evidenceReceipt([])).toBeNull();
  });
});

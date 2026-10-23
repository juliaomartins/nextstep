import { describe, expect, test } from "vitest";
import { decodeHandoff, encodeHandoff, resultsUrl, type Handoff } from "@/lib/handoff";

const HANDOFF: Handoff = {
  version: 1,
  textHash: "a".repeat(64),
  source: { title: "Vaga Servisu – Senior IT Officer", url: "https://example.org/jobs/42" },
  result: {
    summary: "Anúncio de emprego com ação — “aspas” ✓",
    deadline: { status: "not_stated", date: null, wording: null, sourceExcerpt: null },
    items: [
      {
        id: "item-1",
        title: "Prepare a CV",
        group: "required",
        whyItMatters: "It is required.",
        sourceExcerpt: "Please submit your CV.",
        deadline: null,
        evidence: "found",
      },
    ],
  },
};

describe("handoff", () => {
  test("round-trips a result, including non-English text and symbols", () => {
    expect(decodeHandoff(`#data=${encodeHandoff(HANDOFF)}`)).toEqual(HANDOFF);
  });

  test("encodes to URL-safe characters only", () => {
    expect(encodeHandoff(HANDOFF)).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  test("builds a results URL that carries the data in the fragment, never the query", () => {
    const url = new URL(resultsUrl("http://localhost:3000/", HANDOFF));
    expect(url.origin + url.pathname).toBe("http://localhost:3000/results");
    expect(url.search).toBe("");
    expect(decodeHandoff(url.hash)).toEqual(HANDOFF);
  });

  test("rejects a missing, garbled, or tampered payload", () => {
    expect(decodeHandoff("")).toBeNull();
    expect(decodeHandoff("#data=not-base64!!")).toBeNull();
    expect(decodeHandoff("#something=else")).toBeNull();
    const tampered = encodeHandoff({ ...HANDOFF, result: { ...HANDOFF.result, items: [{ id: 1 }] } } as unknown as Handoff);
    expect(decodeHandoff(`#data=${tampered}`)).toBeNull();
  });
});

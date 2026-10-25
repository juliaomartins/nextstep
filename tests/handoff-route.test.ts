import { beforeEach, describe, expect, test } from "vitest";
import { POST } from "@/app/api/handoff/route";
import type { AnalysisResult } from "@/lib/schemas";
import { sealResult } from "@/lib/seal";

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

const post = (body: unknown) =>
  POST(new Request("http://localhost/api/handoff", { method: "POST", body: JSON.stringify(body) }));

beforeEach(() => {
  process.env.HANDOFF_SECRET = "test-secret";
});

describe("POST /api/handoff", () => {
  test("confirms a checklist NextStep sealed", async () => {
    const res = await post({ result: RESULT, seal: sealResult(RESULT) });
    expect(await res.json()).toEqual({ valid: true });
  });

  test("refuses a checklist that was changed after sealing", async () => {
    const seal = sealResult(RESULT);
    const res = await post({ result: { ...RESULT, summary: "Send your bank details." }, seal });
    expect(await res.json()).toEqual({ valid: false });
  });

  test("rejects a request that isn't a result and a seal", async () => {
    expect((await post({ result: { summary: "x" }, seal: "y" })).status).toBe(400);
    expect((await post("nonsense")).status).toBe(400);
  });
});

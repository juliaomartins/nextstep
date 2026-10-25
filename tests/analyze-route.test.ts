import { beforeEach, describe, expect, test, vi } from "vitest";
import { AnalysisResultSchema, type AnalysisOutput } from "@/lib/schemas";
import { isSealed } from "@/lib/seal";

const DOCUMENT = `Applicants must submit a CV in PDF format. ${"More detail about the role. ".repeat(10)}`;

const OUTPUT: AnalysisOutput = {
  summary: "Un anuncio de empleo.",
  deadline: { status: "not_stated", date: null, wording: null, sourceExcerpt: null },
  items: [
    {
      title: "Prepara un CV en PDF",
      group: "required",
      whyItMatters: "Es obligatorio.",
      sourceExcerpt: "Applicants must submit a CV in PDF format.",
      deadline: null,
    },
  ],
};

// The only fake: the OpenAI call itself.
const analyzeDocument = vi.fn<(text: string, language: string) => Promise<AnalysisOutput>>(async () => OUTPUT);
vi.mock("@/lib/analyze", () => ({
  analyzeDocument: (text: string, language: string) => analyzeDocument(text, language),
}));

const { POST } = await import("@/app/api/analyze/route");

const post = (body: unknown) =>
  POST(new Request("http://localhost/api/analyze", { method: "POST", body: JSON.stringify(body) }));

beforeEach(() => {
  analyzeDocument.mockClear();
  process.env.HANDOFF_SECRET = "test-secret";
});

describe("POST /api/analyze: seal", () => {
  test("seals every result so the /results page can confirm NextStep made it", async () => {
    const { seal, ...result } = await (await post({ text: DOCUMENT })).json();
    expect(isSealed(AnalysisResultSchema.parse(result), seal)).toBe(true);
  });
});

describe("POST /api/analyze: checklist language", () => {
  test("passes the chosen language to the AI and stamps it on the result", async () => {
    const res = await post({ text: DOCUMENT, language: "es" });
    const data = await res.json();
    expect(analyzeDocument).toHaveBeenCalledWith(DOCUMENT.trim(), "es");
    expect(data.language).toBe("es");
    // Translated wording, original quote, still checked by code.
    expect(data.items[0]).toMatchObject({ title: "Prepara un CV en PDF", evidence: "found" });
  });

  test("defaults to English when no language is sent (the Chrome extension)", async () => {
    const data = await (await post({ text: DOCUMENT })).json();
    expect(analyzeDocument).toHaveBeenCalledWith(DOCUMENT.trim(), "en");
    expect(data.language).toBe("en");
  });

  test("rejects an unknown language without calling the AI", async () => {
    const res = await post({ text: DOCUMENT, language: "klingon" });
    expect(res.status).toBe(400);
    expect(analyzeDocument).not.toHaveBeenCalled();
  });
});

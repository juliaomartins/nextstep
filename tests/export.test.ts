import { Packer } from "docx";
import JSZip from "jszip";
import { jsPDF } from "jspdf";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import { describe, expect, test } from "vitest";
import { createDocx } from "@/lib/export-docx";
import { buildExportModel, exportFileName, toPdfSafe } from "@/lib/export-model";
import { createPdf } from "@/lib/export-pdf";
import type { AnalysisResult, ResultItem } from "@/lib/schemas";

const item = (id: string, title: string, group: ResultItem["group"], evidence: ResultItem["evidence"] = "found") => ({
  id,
  title,
  group,
  whyItMatters: `Why ${title}`,
  sourceExcerpt: `Quote for ${title}.`,
  deadline: null,
  evidence,
});

const RESULT: AnalysisResult = {
  summary: "A job posting for a coordinator, with ação and naïve accents.",
  deadline: { status: "not_stated", date: null, wording: null, sourceExcerpt: null },
  items: [
    item("item-1", "Prepare a CV in PDF format", "required"),
    item("item-2", "Write a cover letter", "required"),
    item("item-3", "Check whether a portfolio is needed", "needs_check", "not_found"),
  ],
};
const MADE_AT = new Date("2026-10-23T09:30:00Z");
const DONE = new Set(["item-1"]);

describe("buildExportModel", () => {
  const model = () => buildExportModel(RESULT, DONE, MADE_AT);

  test("has the title, the date, the summary, and the reminder", () => {
    expect(model().title).toBe("NextStep checklist");
    expect(model().madeOn).toBe("23 October 2026");
    expect(model().summary).toBe(RESULT.summary);
    expect(model().reminder).toMatch(/check important details against the original document/i);
  });

  test("describes the deadline in words, including when none is stated", () => {
    expect(model().deadline).toEqual({ label: "No deadline stated in this document", status: "Not stated" });
    const stated = buildExportModel(
      { ...RESULT, deadline: { status: "stated", date: "2026-11-30", wording: "by 30 November", sourceExcerpt: "x" } },
      DONE,
      MADE_AT,
    );
    expect(stated.deadline).toEqual({ label: "30 November 2026", status: "Stated in document" });
  });

  test("keeps the group order, skips empty groups, and counts what is done", () => {
    expect(model().groups.map((g) => [g.label, g.done, g.total])).toEqual([
      ["Required", 1, 2],
      ["Needs your check", 0, 1],
    ]);
  });

  test("carries each step's tick state, quote, and evidence label", () => {
    expect(model().groups[0].items[0]).toMatchObject({
      done: true,
      title: "Prepare a CV in PDF format",
      quote: "Quote for Prepare a CV in PDF format.",
      evidence: "Found in document",
    });
    expect(model().groups[1].items[0]).toMatchObject({ done: false, evidence: "Not found in document" });
  });
});

describe("exportFileName", () => {
  test("is dated so downloads don't overwrite each other", () => {
    expect(exportFileName(MADE_AT, "pdf")).toBe("nextstep-checklist-2026-10-23.pdf");
    expect(exportFileName(MADE_AT, "docx")).toBe("nextstep-checklist-2026-10-23.docx");
  });
});

describe("toPdfSafe", () => {
  test("keeps Portuguese and Tetum accents and typographic quotes and dashes", () => {
    expect(toPdfSafe("Ação, naïve, “CV” — it’s")).toBe("Ação, naïve, “CV” — it’s");
  });

  test("swaps symbols the built-in PDF fonts can't draw for safe equivalents", () => {
    expect(toPdfSafe("✓ done → next • item ☐ 漢")).toBe("[x] done -> next - item [ ] ?");
  });
});

describe("createDocx", () => {
  test("produces a Word file with every part of the checklist", async () => {
    const doc = createDocx(buildExportModel(RESULT, DONE, MADE_AT));
    const zip = await JSZip.loadAsync(await Packer.toBuffer(doc));
    const xml = (await zip.file("word/document.xml")!.async("string")).replace(/<[^>]+>/g, " ");
    for (const text of [
      "NextStep checklist",
      "23 October 2026",
      "with ação and naïve accents",
      "No deadline stated in this document",
      "Required",
      "Needs your check",
      "☑",
      "Prepare a CV in PDF format",
      "☐",
      "Quote for Write a cover letter.",
      "Not found in document",
      "against the original document",
    ]) {
      expect(xml).toContain(text);
    }
  });
});

async function pdfText(data: ArrayBuffer) {
  const task = pdfjs.getDocument({ data: new Uint8Array(data) });
  const doc = await task.promise;
  let text = "";
  for (let n = 1; n <= doc.numPages; n++) {
    const { items } = await (await doc.getPage(n)).getTextContent();
    text += items.map((i) => ("str" in i ? i.str : "")).join(" ") + "\n";
  }
  const pages = doc.numPages;
  await task.destroy();
  return { text: text.replace(/\s+/g, " "), pages };
}

describe("createPdf", () => {
  test("produces a PDF with every part of the checklist", async () => {
    const pdf = createPdf(buildExportModel(RESULT, DONE, MADE_AT), jsPDF);
    const { text } = await pdfText(pdf.output("arraybuffer"));
    for (const part of [
      "NextStep checklist",
      "23 October 2026",
      "with ação and naïve accents",
      "No deadline stated in this document",
      "Required",
      "Needs your check",
      "DONE",
      "TO DO",
      "Prepare a CV in PDF format",
      "Quote for Write a cover letter.",
      "FOUND",
      "NOT FOUND",
      "against the original document",
    ]) {
      expect(text).toContain(part);
    }
  });

  test("continues onto more pages for a long checklist without losing steps", async () => {
    const long: AnalysisResult = {
      ...RESULT,
      items: Array.from({ length: 40 }, (_, i) => item(`item-${i + 1}`, `Step number ${i + 1} of the long list`, "required")),
    };
    const { text, pages } = await pdfText(createPdf(buildExportModel(long, new Set(), MADE_AT), jsPDF).output("arraybuffer"));
    expect(pages).toBeGreaterThan(1);
    expect(text).toContain("Step number 1 of the long list");
    expect(text).toContain("Step number 40 of the long list");
  });
});

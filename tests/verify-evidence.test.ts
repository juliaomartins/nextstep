import { describe, expect, test } from "vitest";
import type { AnalysisOutput } from "@/lib/schemas";
import { normalize, verifyEvidence } from "@/lib/verify-evidence";

const DOC = `Junior Data Analyst — Harbor & Pine Co.

Requirements:
• Applicants must submit a CV in PDF format.
• A cover letter addressed to the hiring manager is required.
• Experience with SQL is preferred.
References may be requested at a later stage.
Applications close on 15 November 2026.`;

function output(overrides: Partial<AnalysisOutput> = {}): AnalysisOutput {
  return {
    summary: "A job posting.",
    deadline: { status: "not_stated", date: null, wording: null, sourceExcerpt: null },
    items: [],
    ...overrides,
  };
}

function item(
  sourceExcerpt: string,
  group: AnalysisOutput["items"][number]["group"] = "required",
) {
  return {
    title: "Do the thing",
    group,
    whyItMatters: "Because the document says so.",
    sourceExcerpt,
    deadline: null,
  };
}

describe("normalize", () => {
  test("lowercases, straightens quotes and dashes, strips bullets, collapses whitespace", () => {
    expect(normalize("  • The  “Hiring”\n Manager’s — CV  ")).toBe(`the "hiring" manager's - cv`);
  });
});

describe("verifyEvidence: items", () => {
  test("marks an excerpt that appears verbatim as found and keeps its group", () => {
    const result = verifyEvidence(DOC, output({ items: [item("Applicants must submit a CV in PDF format.")] }));
    expect(result.items[0].evidence).toBe("found");
    expect(result.items[0].group).toBe("required");
  });

  test("finds an excerpt despite case, curly quotes, and line-break differences", () => {
    const result = verifyEvidence(
      DOC,
      output({ items: [item("a cover letter addressed to the hiring manager is required")] }),
    );
    expect(result.items[0].evidence).toBe("found");
  });

  test("marks a paraphrased excerpt as not found and moves it to needs_check", () => {
    const result = verifyEvidence(DOC, output({ items: [item("You need to send your resume as a PDF.")] }));
    expect(result.items[0].evidence).toBe("not_found");
    expect(result.items[0].group).toBe("needs_check");
  });

  test("treats an excerpt shorter than 8 characters as not found", () => {
    const result = verifyEvidence(DOC, output({ items: [item("SQL")] }));
    expect(result.items[0].evidence).toBe("not_found");
  });

  test("orders items required, recommended, needs_check and assigns ids in that order", () => {
    const result = verifyEvidence(
      DOC,
      output({
        items: [
          item("References may be requested at a later stage.", "needs_check"),
          item("Experience with SQL is preferred.", "recommended"),
          item("Applicants must submit a CV in PDF format.", "required"),
        ],
      }),
    );
    expect(result.items.map((i) => [i.id, i.group])).toEqual([
      ["item-1", "required"],
      ["item-2", "recommended"],
      ["item-3", "needs_check"],
    ]);
  });

  test("returns an empty list when the model found nothing", () => {
    expect(verifyEvidence(DOC, output()).items).toEqual([]);
  });
});

describe("verifyEvidence: deadline", () => {
  test("keeps a stated deadline whose excerpt is found and whose date is real", () => {
    const result = verifyEvidence(
      DOC,
      output({
        deadline: {
          status: "stated",
          date: "2026-11-15",
          wording: "Applications close on 15 November 2026",
          sourceExcerpt: "Applications close on 15 November 2026.",
        },
      }),
    );
    expect(result.deadline.status).toBe("stated");
    expect(result.deadline.date).toBe("2026-11-15");
  });

  test("downgrades a stated deadline whose excerpt is not in the document to unclear", () => {
    const result = verifyEvidence(
      DOC,
      output({
        deadline: {
          status: "stated",
          date: "2026-12-01",
          wording: "Apply by 1 December 2026",
          sourceExcerpt: "Apply by 1 December 2026.",
        },
      }),
    );
    expect(result.deadline.status).toBe("unclear");
    expect(result.deadline.date).toBeNull();
  });

  test("downgrades a stated deadline with an impossible date to unclear", () => {
    const result = verifyEvidence(
      DOC,
      output({
        deadline: {
          status: "stated",
          date: "2026-02-30",
          wording: "Applications close on 15 November 2026",
          sourceExcerpt: "Applications close on 15 November 2026.",
        },
      }),
    );
    expect(result.deadline.status).toBe("unclear");
    expect(result.deadline.date).toBeNull();
  });

  test("downgrades a relative deadline whose excerpt is not in the document to unclear", () => {
    const result = verifyEvidence(
      DOC,
      output({
        deadline: {
          status: "relative",
          date: null,
          wording: "within 14 days of the interview",
          sourceExcerpt: "Submit references within 14 days of the interview.",
        },
      }),
    );
    expect(result.deadline.status).toBe("unclear");
  });

  test("never keeps a date unless the status is stated", () => {
    const result = verifyEvidence(
      DOC,
      output({ deadline: { status: "not_stated", date: "2026-11-15", wording: null, sourceExcerpt: null } }),
    );
    expect(result.deadline).toEqual({ status: "not_stated", date: null, wording: null, sourceExcerpt: null });
  });
});

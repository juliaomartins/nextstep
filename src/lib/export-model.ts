import type { AnalysisResult, Deadline, Group } from "./schemas";

/** Everything a downloaded checklist contains, shared by the Word and PDF exporters so both say the same thing. */
export type ExportModel = {
  title: string;
  madeOn: string;
  summary: string;
  deadline: { label: string; status: string };
  groups: {
    label: string;
    done: number;
    total: number;
    items: { done: boolean; title: string; deadline: string | null; quote: string; evidence: string; why: string }[];
  }[];
  reminder: string;
};

const GROUPS: { group: Group; label: string }[] = [
  { group: "required", label: "Required" },
  { group: "recommended", label: "Recommended" },
  { group: "needs_check", label: "Needs your check" },
];

const longDate = (date: Date) =>
  new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(date);

function describeDeadline(deadline: Deadline): ExportModel["deadline"] {
  switch (deadline.status) {
    case "stated":
      return {
        label: deadline.date ? longDate(new Date(`${deadline.date}T00:00:00Z`)) : (deadline.wording ?? "Deadline stated"),
        status: "Stated in document",
      };
    case "relative":
      return { label: deadline.wording ?? "Depends on another step", status: "Depends on another step" };
    case "unclear":
      return { label: deadline.wording ? `Unclear: “${deadline.wording}”` : "Deadline unclear", status: "Check the original" };
    case "not_stated":
      return { label: "No deadline stated in this document", status: "Not stated" };
  }
}

export function buildExportModel(result: AnalysisResult, completedIds: Set<string>, madeAt: Date): ExportModel {
  return {
    title: "NextStep checklist",
    madeOn: longDate(madeAt),
    summary: result.summary,
    deadline: describeDeadline(result.deadline),
    groups: GROUPS.map(({ group, label }) => {
      const items = result.items
        .filter((item) => item.group === group)
        .map((item) => ({
          done: completedIds.has(item.id),
          title: item.title,
          deadline: item.deadline,
          quote: item.sourceExcerpt,
          evidence: item.evidence === "found" ? "Found in document" : "Not found in document",
          why: item.whyItMatters,
        }));
      return { label, done: items.filter((i) => i.done).length, total: items.length, items };
    }).filter((g) => g.total > 0),
    reminder:
      "Made with NextStep, a reading aid, not legal, financial, or official advice. Always check important details against the original document.",
  };
}

export function exportFileName(madeAt: Date, extension: "pdf" | "docx"): string {
  return `nextstep-checklist-${madeAt.toISOString().slice(0, 10)}.${extension}`;
}

// The PDF's built-in fonts (WinAnsi) cover Latin-1 plus typographic quotes and dashes, not every symbol.
const WIN_ANSI_EXTRAS = "€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ";
const SWAPS: Record<string, string> = { "✓": "[x]", "✔": "[x]", "☑": "[x]", "☐": "[ ]", "→": "->", "•": "-", "←": "<-" };

export function toPdfSafe(text: string): string {
  return [...text]
    .map((ch) => {
      if (SWAPS[ch]) return SWAPS[ch];
      const code = ch.codePointAt(0)!;
      if (code <= 0xff || WIN_ANSI_EXTRAS.includes(ch)) return ch;
      return "?";
    })
    .join("");
}

import type { AnalysisOutput, AnalysisResult, Deadline, Group } from "./schemas";

const MIN_EXCERPT_CHARS = 8;
const GROUP_ORDER: Group[] = ["required", "recommended", "needs_check"];

/** Makes quoting differences that don't change meaning irrelevant to the match. */
export function normalize(s: string): string {
  return s
    .normalize("NFKC") // full-width letters, "…" → "...", ligatures
    .toLowerCase()
    .replace(/­/g, "") // soft hyphens hidden in PDF text
    .replace(/[‘’‚′]/g, "'")
    .replace(/[“”„″]/g, '"')
    .replace(/[‐‑‒–—―−]/g, "-")
    .replace(/[•·▪‣◦●]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isFoundIn(normalizedText: string, excerpt: string | null): boolean {
  if (!excerpt) return false;
  const needle = normalize(excerpt);
  return needle.length >= MIN_EXCERPT_CHARS && normalizedText.includes(needle);
}

function isRealIsoDate(date: string | null): boolean {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const parsed = new Date(`${date}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date;
}

/** Every piece of deadline text that reaches the screen must be found in the document. */
function verifyDeadline(normalizedText: string, deadline: Deadline): Deadline {
  const { status } = deadline;
  if (status === "not_stated") return { status, date: null, wording: null, sourceExcerpt: null };

  const excerptFound = isFoundIn(normalizedText, deadline.sourceExcerpt);
  const sourceExcerpt = excerptFound ? deadline.sourceExcerpt : null;
  // The model's own phrasing is kept only if the document contains it; otherwise show the verified quote.
  const wording = isFoundIn(normalizedText, deadline.wording) ? deadline.wording : sourceExcerpt;

  if (status === "stated" || status === "relative") {
    const supported = excerptFound && (status === "relative" || isRealIsoDate(deadline.date));
    if (!supported) return { status: "unclear", date: null, wording, sourceExcerpt };
  }

  return { status, date: status === "stated" ? deadline.date : null, wording, sourceExcerpt };
}

/**
 * The kernel: never trust the model's quotes. Every excerpt must really appear in the
 * pasted text; anything unsupported is moved to "needs_check", and unsupported
 * deadlines are downgraded to "unclear" so an invented date can't reach the screen.
 */
export function verifyEvidence(text: string, output: AnalysisOutput): AnalysisResult {
  const normalizedText = normalize(text);

  const checked = output.items.map((item) => {
    const found = isFoundIn(normalizedText, item.sourceExcerpt);
    return {
      ...item,
      evidence: found ? ("found" as const) : ("not_found" as const),
      group: found ? item.group : ("needs_check" as const),
      // A step's own deadline is shown only if the document contains it; dates are never made up.
      deadline: isFoundIn(normalizedText, item.deadline) ? item.deadline : null,
    };
  });

  const items = GROUP_ORDER.flatMap((group) => checked.filter((item) => item.group === group)).map(
    (item, index) => ({ ...item, id: `item-${index + 1}` }),
  );

  return {
    summary: output.summary,
    deadline: verifyDeadline(normalizedText, output.deadline),
    items,
  };
}

import type { AnalysisOutput, AnalysisResult, Deadline, Group } from "./schemas";

const MIN_EXCERPT_CHARS = 8;
const GROUP_ORDER: Group[] = ["required", "recommended", "needs_check"];

/** Makes quoting differences that don't change meaning irrelevant to the match. */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[‘’‚′]/g, "'")
    .replace(/[“”„″]/g, '"')
    .replace(/[‒–—―−]/g, "-")
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

function verifyDeadline(normalizedText: string, deadline: Deadline): Deadline {
  const { status } = deadline;

  if (status === "stated" || status === "relative") {
    const supported =
      isFoundIn(normalizedText, deadline.sourceExcerpt) && (status === "relative" || isRealIsoDate(deadline.date));
    if (!supported) return { ...deadline, status: "unclear", date: null };
  }

  return { ...deadline, date: status === "stated" ? deadline.date : null };
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

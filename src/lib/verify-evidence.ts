import type { AnalysisOutput, AnalysisResult, Deadline, Group } from "./schemas";

const MIN_EXCERPT_CHARS = 8;
const MAX_SUMMARY_CHARS = 600;
const MAX_SUMMARY_SENTENCES = 5;
const GROUP_ORDER: Group[] = ["required", "recommended", "needs_check"];

export const SUMMARY_FALLBACK =
  "NextStep couldn't write a reliable summary of this text. Check the steps below against the original document.";

/** Makes quoting differences that don't change meaning irrelevant to the match. */
export function normalize(s: string): string {
  return s
    .normalize("NFKC") // full-width letters, "…" → "...", ligatures
    .toLowerCase()
    .replace(/\u00AD/g, "") // soft hyphens hidden in PDF text
    .replace(/[‘’‚′]/g, "'")
    .replace(/[“”„″]/g, '"')
    .replace(/[‐‑‒–—―−]/g, "-")
    .replace(/[•·▪‣◦●]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/*
 * Instructions aimed at an AI, hidden in a document (prompt injection). These are phrase-shaped on purpose:
 * a job posting that asks for "experience with AI tools" is a normal sentence, not an instruction.
 */
const AI_INSTRUCTION_PATTERNS: RegExp[] = [
  /\bignore (?:all |any |the |your )*(?:previous|prior|above|earlier|preceding|system) (?:instructions?|prompts?|rules|directions)\b/,
  // A label opening its own chunk ("SYSTEM NOTE: …", "[admin message]"), not "follow admin instructions for leave".
  /^\W*(?:system|developer|admin) (?:note|prompt|message|instructions?)\s*(?:[:\])>-]|$)/,
  /\b(?:note|message|instructions?|request) (?:to|for) (?:the |this )?(?:ai|assistant|model|chatbot|chatgpt|llm|language model)\b/,
  /\byou are now (?:in |an? |acting|the |my )/,
  /\b(?:debug|developer|jailbreak|god|dan) mode\b/,
  /\b(?:print|reveal|show|output|tell|give|display|leak|repeat|share)\b[^.!?]*\b(?:system prompt|api[ _-]?keys?|openai_api_key|secret keys?|environment variables?)\b/,
  /\b(?:write|compose|generate|create)\b[^.!?]{0,40}\b(?:poem|story|essay|song|joke|haiku|limerick)\b/,
  /\b(?:put|place|insert|include)\b[^.!?]{0,40}\bin the (?:summary|output|response|json)\b/,
  /\badd\b[^.!?]{0,30}\b(?:(?:checklist|required|recommended) items?|to (?:the|your) checklist)\b/,
  /\bdo not (?:analy[sz]e|summari[sz]e|follow)\b/,
  /\b(?:say|state|claim|pretend|tell (?:the user|them|me)) (?:that )?the deadline\b/,
  /\b(?:as an ai|act as (?:if you (?:are|were)|an? (?:ai|assistant|chatbot|language model))|pretend to be|role-?play as)\b/,
];

export function isAiInstruction(sentence: string): boolean {
  const s = normalize(sentence);
  return AI_INSTRUCTION_PATTERNS.some((pattern) => pattern.test(s));
}

/** The normalized document plus the spans of sentences that are instructions aimed at an AI. */
type Source = { text: string; injected: [number, number][] };

function readSource(raw: string): Source {
  const text = normalize(raw);
  const injected: [number, number][] = [];
  // Sentence-like chunks end at . ! ? : ; followed by a space or the end, so emails, URLs, and
  // decimals ("verify@example.com", "2.5") stay whole. Colons end a chunk ("SYSTEM NOTE TO THE AI: …").
  for (const match of text.matchAll(/.+?(?:[.!?:;](?=\s|$)|$)/g)) {
    if (!isAiInstruction(match[0])) continue;
    const start = match.index;
    const end = start + match[0].length;
    const previous = injected.at(-1);
    // Neighbouring injected sentences form one span, so a quote crossing them is still caught.
    if (previous && start - previous[1] <= 1) previous[1] = end;
    else injected.push([start, end]);
  }
  return { text, injected };
}

/**
 * A quote counts as found only if it appears in the document somewhere other than inside an
 * instruction aimed at an AI: words copied from an injected instruction are never evidence.
 */
function isFoundIn(source: Source, excerpt: string | null): boolean {
  if (!excerpt) return false;
  const needle = normalize(excerpt);
  if (needle.length < MIN_EXCERPT_CHARS) return false;
  for (let at = source.text.indexOf(needle); at !== -1; at = source.text.indexOf(needle, at + 1)) {
    const end = at + needle.length;
    const insideInjection = source.injected.some(([start, stop]) => start <= at && end <= stop);
    if (!insideInjection) return true;
  }
  return false;
}

function isRealIsoDate(date: string | null): date is string {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const parsed = new Date(`${date}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date;
}

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

/**
 * The quote must back the date itself: its day and month appear in it (month as a number or a name),
 * and if the quote names a year, it is the date's year. A misread "15 November" as the 16th can't pass.
 */
function isDateInExcerpt(date: string, excerpt: string): boolean {
  const [year, month, day] = date.split("-").map(Number);
  const text = normalize(excerpt);
  const numbers = (text.match(/\d+/g) ?? []).map(Number);
  const years = numbers.filter((n) => n >= 1900 && n <= 2100);
  const monthNamed = new RegExp(`\\b${MONTHS[month - 1]}`).test(text);
  return numbers.includes(day) && (numbers.includes(month) || monthNamed) && (years.length === 0 || years.includes(year));
}

/** Every piece of deadline text that reaches the screen must be found in the document. */
function verifyDeadline(source: Source, deadline: Deadline): Deadline {
  const { status } = deadline;
  if (status === "not_stated") return { status, date: null, wording: null, sourceExcerpt: null };

  const excerptFound = isFoundIn(source, deadline.sourceExcerpt);
  const sourceExcerpt = excerptFound ? deadline.sourceExcerpt : null;
  // The model's own phrasing is kept only if the document contains it; otherwise show the verified quote.
  const wording = isFoundIn(source, deadline.wording) ? deadline.wording : sourceExcerpt;

  if (status === "stated" || status === "relative") {
    const supported =
      sourceExcerpt !== null &&
      (status === "relative" || (isRealIsoDate(deadline.date) && isDateInExcerpt(deadline.date, sourceExcerpt)));
    if (!supported) return { status: "unclear", date: null, wording, sourceExcerpt };
  }

  return { status, date: status === "stated" ? deadline.date : null, wording, sourceExcerpt };
}

/** A summary is 2–3 plain sentences; anything shaped like a poem, an essay, or a list is replaced. */
function isOffTaskSummary(summary: string): boolean {
  const sentences = summary.split(/(?<=[.!?])\s+/).filter(Boolean).length;
  return summary.includes("\n") || summary.length > MAX_SUMMARY_CHARS || sentences > MAX_SUMMARY_SENTENCES;
}

/**
 * The kernel: never trust the model's quotes. Every excerpt must really appear in the pasted text,
 * outside any instruction aimed at an AI; anything unsupported is moved to "needs_check", and
 * unsupported deadlines are downgraded to "unclear" so an invented date can't reach the screen.
 */
export function verifyEvidence(text: string, output: AnalysisOutput): AnalysisResult {
  const source = readSource(text);

  const checked = output.items.map((item) => {
    const found = isFoundIn(source, item.sourceExcerpt);
    return {
      ...item,
      evidence: found ? ("found" as const) : ("not_found" as const),
      group: found ? item.group : ("needs_check" as const),
      // A step's own deadline is shown only if the document contains it; dates are never made up.
      deadline: isFoundIn(source, item.deadline) ? item.deadline : null,
    };
  });

  const items = GROUP_ORDER.flatMap((group) => checked.filter((item) => item.group === group)).map(
    (item, index) => ({ ...item, id: `item-${index + 1}` }),
  );

  const summaryReplaced = isOffTaskSummary(output.summary);
  return {
    summary: summaryReplaced ? SUMMARY_FALLBACK : output.summary,
    deadline: verifyDeadline(source, output.deadline),
    items,
    safety: { aiInstructions: source.injected.length > 0, summaryReplaced },
  };
}

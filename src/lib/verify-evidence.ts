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
  // Asking the AI for *its* secrets ("reveal your API key", "print the OPENAI_API_KEY"), not "share API keys securely".
  /\b(?:print|reveal|show|output|tell|give|display|leak|repeat|share)\b(?: (?:me|us))? (?:your|its)\b[^.!?]{0,30}\b(?:system prompt|prompt|instructions|api[ _-]?keys?|secret keys?|environment variables?)\b/,
  /\b(?:print|reveal|show|output|tell|give|display|leak|repeat|share)\b[^.!?]{0,40}\b(?:openai_api_key|system prompt)\b(?!s)/,
  // Creative writing nobody asks a reader for; "essay" and "story" are left out (scholarship essays, story ideas).
  /\b(?:write|compose|generate|create)\b[^.!?]{0,40}\b(?:poem|song|joke|haiku|limerick)\b/,
  // "…in the summary." ends the clause; "in the summary section of your CV" doesn't.
  /\b(?:put|place|insert|include)\b[^.!?]{0,40}\bin the (?:summary|output|response|json)(?=\s*(?:[.!?,;:]|$|and\b|instead\b))/,
  /\badd\b[^.!?]{0,30}\b(?:(?:checklist|required|recommended) items?|to (?:the|your) checklist)\b/,
  // "Do not follow your instructions", not "do not follow up by phone".
  /\bdo not (?:analy[sz]e|summari[sz]e)\b|\bdo not follow (?:\w+ ){0,2}(?:instructions|rules|prompt|system)\b/,
  // "Say the deadline is …", not "state the deadline you can start by".
  /\b(?:say|state|claim|pretend|tell (?:the user|them|me)) (?:that )?the deadline (?:is|was|will be)\b/,
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

// Month names and common abbreviations, lowercased, in English and every offered checklist language
// (Spanish, Portuguese, French, Indonesian, Filipino, Swahili), so documents in those languages verify too.
const MONTH_NAMES: string[][] = [
  ["january", "jan", "enero", "ene", "janeiro", "janvier", "janv", "januari"],
  ["february", "feb", "febrero", "fevereiro", "fev", "février", "févr", "februari", "pebrero"],
  ["march", "mar", "marzo", "março", "mars", "maret", "marso", "machi"],
  ["april", "apr", "abril", "abr", "avril", "avr", "aprili"],
  ["may", "mayo", "maio", "mai", "mei"],
  ["june", "jun", "junio", "junho", "juin", "juni", "hunyo"],
  ["july", "jul", "julio", "julho", "juillet", "juil", "juli", "hulyo", "julai"],
  ["august", "aug", "agosto", "ago", "août", "agustus", "agosti"],
  ["september", "sept", "sep", "septiembre", "setiembre", "setembro", "set", "septembre", "setyembre", "septemba"],
  ["october", "oct", "octubre", "outubro", "out", "octobre", "oktober", "okt", "oktubre", "oktoba"],
  ["november", "nov", "noviembre", "novembro", "novembre", "nobyembre", "novemba"],
  ["december", "dec", "diciembre", "dic", "dezembro", "dez", "décembre", "déc", "desember", "des", "disyembre", "desemba"],
];

/**
 * The quote must back the date itself: the date's month must sit right next to its day ("15 de enero",
 * "June 15", "Nov. 3rd") or both must be in a numeric date ("15.06.2027", "2027-06-15"), and if the quote
 * names a year, it is the date's year. So a misread day, a "may" or "Decisions" mistaken for a month, or a
 * wrong year can't pass.
 */
function isDateInExcerpt(date: string, excerpt: string): boolean {
  const [year, month, day] = date.split("-").map(Number);
  const text = normalize(excerpt);
  const years = (text.match(/\d+/g) ?? []).map(Number).filter((n) => n >= 1900 && n <= 2100);
  if (years.length > 0 && !years.includes(year)) return false;

  const numeric = [...text.matchAll(/\b(\d{1,4})[./-](\d{1,2})[./-](\d{1,4})\b/g)].some((m) => {
    const parts = m.slice(1, 4).map(Number);
    return parts.includes(day) && parts.includes(month);
  });
  if (numeric) return true;

  const names = MONTH_NAMES[month - 1].join("|");
  const dayText = `0?${day}(?:st|nd|rd|th|er|º|°)?`;
  const notLetter = "(?![\\p{L}])";
  return (
    new RegExp(`(?<![\\p{L}\\d])${dayText}\\s*(?:\\.\\s*|de\\s+|of\\s+|-\\s*)?(?:${names})\\.?${notLetter}`, "u").test(text) ||
    new RegExp(`(?<![\\p{L}])(?:${names})\\.?\\s+(?:de\\s+)?${dayText}(?!\\d)`, "u").test(text)
  );
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

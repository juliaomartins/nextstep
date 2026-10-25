import { cleanText } from "../../src/lib/clean-text";
import { resultsUrl } from "../../src/lib/handoff";
import { DEFAULT_LANGUAGE, LANGUAGES, type LanguageCode } from "../../src/lib/languages";
import { MAX_CHARS } from "../../src/lib/schemas";
import { analyzeText, buildHandoff, isSupportedUrl, MESSAGES } from "./api";
import { extractMainText } from "./extract";

/** The NextStep website this build talks to; set at build time (scripts/build-extension.mjs). */
declare const NEXTSTEP_URL: string;

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

const ui = {
  pageTitle: $<HTMLSpanElement>("page-title"),
  pageHost: $<HTMLSpanElement>("page-host"),
  start: $<HTMLElement>("view-start"),
  review: $<HTMLElement>("view-review"),
  done: $<HTMLElement>("view-done"),
  analyzePage: $<HTMLButtonElement>("analyze-page"),
  text: $<HTMLTextAreaElement>("text"),
  count: $<HTMLParagraphElement>("count"),
  cancel: $<HTMLButtonElement>("cancel"),
  makeChecklist: $<HTMLButtonElement>("make-checklist"),
  language: $<HTMLSelectElement>("language"),
  languageNote: $<HTMLParagraphElement>("language-note"),
  status: $<HTMLParagraphElement>("status"),
  error: $<HTMLParagraphElement>("error"),
};

type View = "start" | "review" | "done";

function showView(view: View) {
  ui.start.hidden = view !== "start";
  ui.review.hidden = view !== "review";
  ui.done.hidden = view !== "done";
}

function setStatus(message: string | null) {
  ui.status.hidden = message === null;
  ui.status.textContent = message ?? "";
}

function setError(message: string | null) {
  ui.error.hidden = message === null;
  ui.error.textContent = message ?? "";
}

function updateCount() {
  const length = cleanText(ui.text.value).length;
  const over = length > MAX_CHARS;
  ui.count.textContent = over
    ? `${length.toLocaleString("en-GB")} characters: over the ${MAX_CHARS.toLocaleString("en-GB")} limit. Trim it to the part with the requirements.`
    : `${length.toLocaleString("en-GB")} of ${MAX_CHARS.toLocaleString("en-GB")} characters`;
  ui.count.classList.toggle("over", over);
  ui.makeChecklist.disabled = length === 0 || over;
}

// The checklist language: the same list as the website, remembered for next time in the popup's own storage.
const LANGUAGE_KEY = "nextstep:language";

function setUpLanguage() {
  for (const { code, label } of LANGUAGES) {
    const option = new Option(label, code);
    option.lang = code;
    ui.language.add(option);
  }
  let remembered: string | null = null;
  try {
    remembered = localStorage.getItem(LANGUAGE_KEY);
  } catch {
    // Storage unavailable: start from English.
  }
  ui.language.value = LANGUAGES.some((l) => l.code === remembered) ? remembered! : DEFAULT_LANGUAGE;
  const update = () => {
    ui.languageNote.hidden = ui.language.value === DEFAULT_LANGUAGE;
    try {
      localStorage.setItem(LANGUAGE_KEY, ui.language.value);
    } catch {
      // Not remembered, still used.
    }
  };
  ui.language.addEventListener("change", update);
  update();
}

async function activeTab(): Promise<chrome.tabs.Tab | undefined> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function init() {
  setUpLanguage();
  const tab = await activeTab();
  ui.pageTitle.textContent = tab?.title || "This page";
  try {
    ui.pageHost.textContent = tab?.url ? new URL(tab.url).hostname : "";
  } catch {
    ui.pageHost.textContent = "";
  }

  if (!tab?.id || !isSupportedUrl(tab.url)) {
    ui.analyzePage.disabled = true;
    setError(MESSAGES.unsupported);
    return;
  }
  const tabId = tab.id;

  // Reading happens only here, after the user's click (activeTab grants access to this tab only).
  ui.analyzePage.addEventListener("click", async () => {
    setError(null);
    ui.analyzePage.disabled = true;
    setStatus("Reading the page…");
    try {
      const [injection] = await chrome.scripting.executeScript({ target: { tabId }, func: extractMainText });
      const text = cleanText(typeof injection?.result === "string" ? injection.result : "");
      if (!text) {
        setError(MESSAGES.empty);
        return;
      }
      ui.text.value = text;
      updateCount();
      showView("review");
    } catch {
      // Chrome refuses to run scripts on some pages (its own pages, the Web Store, PDF viewer, …).
      setError(MESSAGES.unsupported);
    } finally {
      setStatus(null);
      ui.analyzePage.disabled = false;
    }
  });

  ui.text.addEventListener("input", updateCount);

  ui.cancel.addEventListener("click", () => {
    setError(null);
    ui.text.value = "";
    showView("start");
  });

  ui.makeChecklist.addEventListener("click", async () => {
    setError(null);
    ui.makeChecklist.disabled = true;
    ui.cancel.disabled = true;
    ui.language.disabled = true;
    ui.text.readOnly = true;
    setStatus("Making your checklist… this usually takes 10 to 20 seconds.");
    const outcome = await analyzeText(
      NEXTSTEP_URL,
      ui.text.value,
      fetch.bind(globalThis),
      ui.language.value as LanguageCode,
    );
    setStatus(null);
    ui.text.readOnly = false;
    ui.cancel.disabled = false;
    ui.language.disabled = false;
    if (!outcome.ok) {
      // Keep the text so the user can fix it or retry.
      setError(outcome.message);
      updateCount();
      return;
    }
    const handoff = buildHandoff(outcome.result, outcome.text, { title: tab.title ?? "", url: tab.url ?? "" }, outcome.seal);
    await chrome.tabs.create({ url: resultsUrl(NEXTSTEP_URL, handoff) });
    showView("done");
  });
}

void init();

import { cleanText } from "../../src/lib/clean-text";
import type { Handoff } from "../../src/lib/handoff";
import { AnalysisResultSchema, type AnalysisResult, type ApiError } from "../../src/lib/schemas";
import { sha256Hex } from "../../src/lib/sha256";

/** Plain messages in the same voice as the website. */
export const MESSAGES = {
  unsupported:
    "NextStep can't read this kind of page. Open a normal web page (http or https), such as a job posting, then try again.",
  empty: "This page has no readable text to analyze. Try a page with the posting or notice itself.",
  unexpected: "NextStep sent back something unexpected. Please try again.",
  network: (base: string) =>
    `We couldn't reach NextStep at ${base}. Check that it's running and that you're online, then try again.`,
};

// Chrome blocks extensions from reading its own pages and the Web Store, so those are refused up front.
const BLOCKED_HOSTS = ["chromewebstore.google.com"];

export function isSupportedUrl(url: string | undefined): boolean {
  if (!url) return false;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
  if (BLOCKED_HOSTS.includes(parsed.hostname)) return false;
  return !(parsed.hostname === "chrome.google.com" && parsed.pathname.startsWith("/webstore"));
}

type Outcome = { ok: true; result: AnalysisResult; text: string; seal: string } | { ok: false; message: string };

/**
 * Sends the reviewed text to the existing NextStep API (/api/analyze), the same LangChain + OpenAI
 * workflow and evidence check the website uses. The OpenAI key stays on that server.
 */
export async function analyzeText(base: string, text: string, fetchImpl: typeof fetch): Promise<Outcome> {
  const cleaned = cleanText(text);
  if (!cleaned) return { ok: false, message: MESSAGES.empty };

  let response: Response;
  try {
    response = await fetchImpl(`${base}/api/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: cleaned }),
    });
  } catch {
    return { ok: false, message: MESSAGES.network(base) };
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    return { ok: false, message: MESSAGES.unexpected };
  }

  const apiError = data as Partial<ApiError>;
  if (apiError?.error && typeof apiError.error.message === "string") return { ok: false, message: apiError.error.message };

  // The seal lets the website's /results page confirm this checklist came from NextStep, unchanged.
  const parsed = AnalysisResultSchema.safeParse(data);
  const seal = (data as { seal?: unknown }).seal;
  if (!parsed.success || typeof seal !== "string") return { ok: false, message: MESSAGES.unexpected };
  return { ok: true, result: parsed.data, text: cleaned, seal };
}

/** The same SHA-256 text hash the website stores, so "same document as before" also works for pages. */
export function buildHandoff(result: AnalysisResult, text: string, source: Handoff["source"], seal: string): Handoff {
  return { version: 1, textHash: sha256Hex(text), result, seal, source };
}

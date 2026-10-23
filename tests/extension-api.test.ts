import { describe, expect, test, vi } from "vitest";
import { analyzeText, buildHandoff, isSupportedUrl, MESSAGES } from "../extension/src/api";
import type { AnalysisResult } from "@/lib/schemas";
import { sha256Hex } from "@/lib/sha256";

const BASE = "http://localhost:3000";
const RESULT: AnalysisResult = {
  summary: "A job posting.",
  deadline: { status: "not_stated", date: null, wording: null, sourceExcerpt: null },
  items: [
    {
      id: "item-1",
      title: "Prepare a CV",
      group: "required",
      whyItMatters: "Required.",
      sourceExcerpt: "Please submit your CV.",
      deadline: null,
      evidence: "found",
    },
  ],
};
const TEXT = "Please submit your CV. ".repeat(20);

describe("isSupportedUrl", () => {
  test.each([
    ["https://example.org/jobs/42", true],
    ["http://intranet.local/notice", true],
    ["chrome://extensions", false],
    ["chrome-extension://abc/popup.html", false],
    ["edge://settings", false],
    ["file:///C:/notice.html", false],
    ["https://chromewebstore.google.com/detail/x", false],
    ["https://chrome.google.com/webstore/detail/x", false],
    [undefined, false],
  ])("%s → %s", (url, supported) => {
    expect(isSupportedUrl(url)).toBe(supported);
  });
});

describe("analyzeText", () => {
  test("posts the cleaned text to the existing /api/analyze route and returns the validated result", async () => {
    const fetchMock = vi.fn(async () => Response.json(RESULT));
    const outcome = await analyzeText(BASE, `  ${TEXT}\n\n\n\n`, fetchMock);
    expect(outcome).toEqual({ ok: true, result: RESULT, text: TEXT.trim() });
    expect(fetchMock).toHaveBeenCalledWith(`${BASE}/api/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: TEXT.trim() }),
    });
  });

  test("refuses empty text without calling the API", async () => {
    const fetchMock = vi.fn();
    expect(await analyzeText(BASE, " \n\t ", fetchMock)).toEqual({ ok: false, message: MESSAGES.empty });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("passes the API's own error message through", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({ error: { code: "too_short", message: "This looks too short to analyze." } }, { status: 400 }),
    );
    expect(await analyzeText(BASE, TEXT, fetchMock)).toEqual({ ok: false, message: "This looks too short to analyze." });
  });

  test("explains a network failure, naming the server it tried", async () => {
    const fetchMock = vi.fn(async () => {
      throw new TypeError("Failed to fetch");
    });
    const outcome = await analyzeText(BASE, TEXT, fetchMock);
    expect(outcome).toEqual({ ok: false, message: MESSAGES.network(BASE) });
    expect(MESSAGES.network(BASE)).toContain("http://localhost:3000");
  });

  test("rejects a response that isn't a valid result", async () => {
    const fetchMock = vi.fn(async () => new Response("<html>Gateway timeout</html>", { status: 504 }));
    expect(await analyzeText(BASE, TEXT, fetchMock)).toEqual({ ok: false, message: MESSAGES.unexpected });
    const shapeless = vi.fn(async () => Response.json({ summary: 42 }));
    expect(await analyzeText(BASE, TEXT, shapeless)).toEqual({ ok: false, message: MESSAGES.unexpected });
  });
});

describe("buildHandoff", () => {
  test("carries the result, the page it came from, and the same text hash the website uses", () => {
    expect(buildHandoff(RESULT, TEXT.trim(), { title: "Job", url: "https://example.org/jobs/42" })).toEqual({
      version: 1,
      textHash: sha256Hex(TEXT.trim()),
      result: RESULT,
      source: { title: "Job", url: "https://example.org/jobs/42" },
    });
  });
});

// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import Home from "@/app/page";
import type { AnalysisResult } from "@/lib/schemas";
import { STORAGE_KEY, type SavedState } from "@/lib/storage";
import { setUpBrowser, stubApi } from "./helpers/browser";

const DOCUMENT = `Scholarship notice. Applicants must submit a transcript. ${"More details follow here. ".repeat(10)}`;

beforeEach(setUpBrowser);
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

async function pasteAndAnalyze() {
  const box = screen.getByLabelText("Document text");
  box.focus();
  await userEvent.paste(DOCUMENT);
  await userEvent.click(screen.getByRole("button", { name: "Make my checklist" }));
}

describe("failures keep the user's text", () => {
  test("an API error shows its plain message and keeps the text", async () => {
    stubApi(async () =>
      Response.json(
        { error: { code: "analysis_failed", message: "We couldn't analyze this document right now. Please try again." } },
        { status: 502 },
      ),
    );
    render(<Home />);
    await pasteAndAnalyze();
    expect((await screen.findByRole("alert")).textContent).toBe(
      "We couldn't analyze this document right now. Please try again.",
    );
    expect((screen.getByLabelText("Document text") as HTMLTextAreaElement).value).toBe(DOCUMENT);
    expect(screen.queryByRole("heading", { name: "Your checklist" })).toBeNull();
  });

  test("a malformed answer is never shown or saved", async () => {
    stubApi(async () => Response.json({ summary: "Looks fine", items: [{ title: "No quote, no evidence" }] }));
    render(<Home />);
    await pasteAndAnalyze();
    expect((await screen.findByRole("alert")).textContent).toContain("Please try again.");
    expect(screen.queryByRole("heading", { name: "Your checklist" })).toBeNull();
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  test("a network failure shows the retry message and keeps the text", async () => {
    stubApi(async () => {
      throw new TypeError("Failed to fetch");
    });
    render(<Home />);
    await pasteAndAnalyze();
    expect((await screen.findByRole("alert")).textContent).toContain("Please try again.");
    expect((screen.getByLabelText("Document text") as HTMLTextAreaElement).value).toBe(DOCUMENT);
  });

  test("the too-short message from the server is shown", async () => {
    stubApi(async () =>
      Response.json(
        { error: { code: "too_short", message: "This looks too short to analyze. Paste the full document." } },
        { status: 400 },
      ),
    );
    render(<Home />);
    await pasteAndAnalyze();
    expect((await screen.findByRole("alert")).textContent).toBe("This looks too short to analyze. Paste the full document.");
  });
});

describe("nothing actionable", () => {
  test("shows the message and does not replace the saved checklist", async () => {
    const savedResult: AnalysisResult = {
      summary: "An earlier posting.",
      deadline: { status: "not_stated", date: null, wording: null, sourceExcerpt: null },
      items: [
        {
          id: "item-1",
          title: "Earlier step",
          group: "required",
          whyItMatters: "x",
          sourceExcerpt: "Earlier quote here.",
          deadline: null,
          evidence: "found",
        },
      ],
    };
    const earlier: SavedState = {
      version: 1,
      savedAt: "2026-10-23T09:00:00.000Z",
      textHash: "earlier-hash",
      result: savedResult,
      completedIds: [],
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(earlier));

    stubApi(async () =>
      Response.json({
        summary: "A news article.",
        deadline: { status: "not_stated", date: null, wording: null, sourceExcerpt: null },
        items: [],
      } satisfies AnalysisResult),
    );
    render(<Home />);
    await screen.findByRole("checkbox", { name: "Earlier step" });
    await pasteAndAnalyze();

    expect(await screen.findByText("We couldn't find any requirements or steps in this text.")).toBeTruthy();
    expect(screen.getByText("Not saved, because there was nothing to tick off.")).toBeTruthy();
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY)!).textHash).toBe("earlier-hash");
  });
});

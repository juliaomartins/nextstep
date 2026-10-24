// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import ResultsPage from "@/app/results/page";
import { encodeHandoff, type Handoff } from "@/lib/handoff";
import { STORAGE_KEY, type SavedState } from "@/lib/storage";
import { setUpBrowser } from "./helpers/browser";

const HANDOFF: Handoff = {
  version: 1,
  textHash: "b".repeat(64),
  source: { title: "Senior IT Officer", url: "https://jobs.example.org/42" },
  result: {
    summary: "A job posting from a web page.",
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
  },
};

const at = (url: string) => window.history.replaceState(null, "", url);
const saved = () => JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null") as SavedState | null;

beforeEach(() => {
  setUpBrowser();
  at("/results");
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("/results", () => {
  test("shows a checklist handed over by the extension, saves it, and clears it from the address bar", async () => {
    at(`/results#data=${encodeHandoff(HANDOFF)}`);
    render(<ResultsPage />);

    expect(await screen.findByRole("heading", { name: "Your checklist" })).toBeTruthy();
    expect(screen.getByText("Senior IT Officer")).toBeTruthy();
    expect(screen.getByText("jobs.example.org")).toBeTruthy();
    expect(saved()?.textHash).toBe(HANDOFF.textHash);
    expect(window.location.hash).toBe("");
  });

  test("ticks on the results page are saved like on the home page", async () => {
    at(`/results#data=${encodeHandoff(HANDOFF)}`);
    render(<ResultsPage />);
    await userEvent.click(await screen.findByRole("checkbox", { name: "Prepare a CV" }));
    expect(saved()?.completedIds).toEqual(["item-1"]);
  });

  test("the same page analyzed again keeps the ticks already saved for it", async () => {
    const earlier: SavedState = { version: 1, savedAt: "x", textHash: HANDOFF.textHash, result: HANDOFF.result, completedIds: ["item-1"] };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(earlier));
    at(`/results#data=${encodeHandoff(HANDOFF)}`);
    render(<ResultsPage />);
    expect((await screen.findByRole("checkbox", { name: "Prepare a CV" })).getAttribute("aria-checked")).toBe("true");
  });

  test("an invalid link says so and leaves the saved checklist alone", async () => {
    const earlier: SavedState = { version: 1, savedAt: "x", textHash: "c".repeat(64), result: HANDOFF.result, completedIds: [] };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(earlier));
    at("/results#data=garbage");
    render(<ResultsPage />);
    expect(await screen.findByText("This link doesn't contain a valid checklist.")).toBeTruthy();
    expect(saved()?.textHash).toBe("c".repeat(64));
  });

  test("without a hand-off it shows the saved checklist", async () => {
    const earlier: SavedState = { version: 1, savedAt: "x", textHash: "d".repeat(64), result: HANDOFF.result, completedIds: [] };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(earlier));
    render(<ResultsPage />);
    expect(await screen.findByRole("heading", { name: "Your checklist" })).toBeTruthy();
  });

  test("with nothing to show, it points back to making a checklist", async () => {
    render(<ResultsPage />);
    expect(await screen.findByText("No checklist yet.")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Make a checklist" }).getAttribute("href")).toBe("/");
  });
});

describe("/results safety warning", () => {
  test("warns when the text contained instructions aimed at AI tools", async () => {
    const flagged: Handoff = { ...HANDOFF, result: { ...HANDOFF.result, safety: { aiInstructions: true, summaryReplaced: false } } };
    at(`/results#data=${encodeHandoff(flagged)}`);
    render(<ResultsPage />);
    expect((await screen.findByText(/contains instructions aimed at AI tools/)).textContent).toMatch(/NextStep ignored them/);
  });

  test("shows no warning for an ordinary document", async () => {
    at(`/results#data=${encodeHandoff(HANDOFF)}`);
    render(<ResultsPage />);
    await screen.findByRole("heading", { name: "Your checklist" });
    expect(screen.queryByText(/instructions aimed at AI tools/)).toBeNull();
  });
});

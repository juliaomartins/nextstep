// @vitest-environment jsdom
import { StrictMode } from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import ResultsPage from "@/app/results/page";
import { encodeHandoff, type Handoff } from "@/lib/handoff";
import { STORAGE_KEY, type SavedState } from "@/lib/storage";
import { setUpBrowser, stubApi } from "./helpers/browser";

const HANDOFF: Handoff = {
  version: 1,
  textHash: "b".repeat(64),
  seal: "5".repeat(64),
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

// The only fake: the server's answer to "did NextStep seal this checklist?".
let confirmSeal: ReturnType<typeof stubApi>;

beforeEach(() => {
  setUpBrowser();
  confirmSeal = stubApi(async () => Response.json({ valid: true }));
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
    // The seal is confirmed asynchronously, so the save can land just after the first render.
    await waitFor(() => expect(saved()?.textHash).toBe(HANDOFF.textHash));
    expect(window.location.hash).toBe("");
  });

  test("shows the evidence receipt under the summary", async () => {
    at(`/results#data=${encodeHandoff(HANDOFF)}`);
    render(<ResultsPage />);
    expect(await screen.findByText("Checked by code: 1 of 1 quote found word for word in your document.")).toBeTruthy();
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

  test("the same page in another language starts with no ticks (the steps are a different list)", async () => {
    const earlier: SavedState = { version: 1, savedAt: "x", textHash: HANDOFF.textHash, result: HANDOFF.result, completedIds: ["item-1"] };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(earlier));
    const spanish: Handoff = { ...HANDOFF, result: { ...HANDOFF.result, language: "es" } };
    at(`/results#data=${encodeHandoff(spanish)}`);
    render(<ResultsPage />);
    expect((await screen.findByRole("checkbox", { name: "Prepare a CV" })).getAttribute("aria-checked")).toBe("false");
  });

  test("an invalid link says so and leaves the saved checklist alone", async () => {
    const earlier: SavedState = { version: 1, savedAt: "x", textHash: "c".repeat(64), result: HANDOFF.result, completedIds: [] };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(earlier));
    at("/results#data=garbage");
    render(<ResultsPage />);
    expect(await screen.findByText("This link doesn't contain a valid checklist.")).toBeTruthy();
    expect(saved()?.textHash).toBe("c".repeat(64));
  });

  test("still shows the hand-off under React's StrictMode, which runs effects twice in development", async () => {
    at(`/results#data=${encodeHandoff(HANDOFF)}`);
    render(
      <StrictMode>
        <ResultsPage />
      </StrictMode>,
    );
    expect(await screen.findByRole("heading", { name: "Your checklist" })).toBeTruthy();
    expect(screen.getByText("Senior IT Officer")).toBeTruthy();
  });

  test("asks the server to confirm the seal before showing anything", async () => {
    at(`/results#data=${encodeHandoff(HANDOFF)}`);
    render(<ResultsPage />);
    await screen.findByRole("heading", { name: "Your checklist" });
    const [url, init] = confirmSeal.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/api/handoff");
    expect(JSON.parse(init.body as string)).toEqual({ result: HANDOFF.result, seal: HANDOFF.seal });
  });

  test("a forged or edited link is refused and leaves the saved checklist alone", async () => {
    stubApi(async () => Response.json({ valid: false }));
    const earlier: SavedState = { version: 1, savedAt: "x", textHash: "c".repeat(64), result: HANDOFF.result, completedIds: [] };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(earlier));
    at(`/results#data=${encodeHandoff(HANDOFF)}`);
    render(<ResultsPage />);
    expect(await screen.findByText("NextStep couldn't confirm it made this checklist.")).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Your checklist" })).toBeNull();
    expect(saved()?.textHash).toBe("c".repeat(64));
  });

  test("if the seal can't be checked (offline), nothing is shown or saved", async () => {
    stubApi(async () => {
      throw new TypeError("Failed to fetch");
    });
    at(`/results#data=${encodeHandoff(HANDOFF)}`);
    render(<ResultsPage />);
    expect(await screen.findByText("NextStep couldn't confirm it made this checklist.")).toBeTruthy();
    expect(saved()).toBeNull();
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

describe("/results caution", () => {
  test("a step asking for money or credentials carries a Be careful stamp", async () => {
    const risky: Handoff = {
      ...HANDOFF,
      result: {
        ...HANDOFF.result,
        items: [{ ...HANDOFF.result.items[0], title: "Pay the registration fee", group: "needs_check", caution: true }],
      },
    };
    at(`/results#data=${encodeHandoff(risky)}`);
    render(<ResultsPage />);
    await screen.findByRole("heading", { name: "Your checklist" });
    expect(screen.getByText("Be careful")).toBeTruthy();
  });
});

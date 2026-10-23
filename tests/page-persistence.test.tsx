// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import Home from "@/app/page";
import type { AnalysisResult } from "@/lib/schemas";
import { STORAGE_KEY } from "@/lib/storage";
import { setUpBrowser } from "./helpers/browser";

const DOCUMENT = `Junior Operations Coordinator. You must have at least 1 year of experience in an administrative role. ${"Details about the role. ".repeat(10)}`;

const RESULT: AnalysisResult = {
  summary: "A job posting for a coordinator.",
  deadline: { status: "not_stated", date: null, wording: null, sourceExcerpt: null },
  items: [
    {
      id: "item-1",
      title: "Confirm you have 1 year of experience",
      group: "required",
      whyItMatters: "It is a must.",
      sourceExcerpt: "You must have at least 1 year of experience in an administrative role.",
      deadline: null,
      evidence: "found",
    },
    {
      id: "item-2",
      title: "Prepare a CV",
      group: "required",
      whyItMatters: "It is a must.",
      sourceExcerpt: "Junior Operations Coordinator.",
      deadline: null,
      evidence: "found",
    },
  ],
};

// The only fake: the network call to our own API (which would call OpenAI).
const fetchMock = vi.fn(async () => new Response(JSON.stringify(RESULT), { status: 200 }));

beforeEach(() => {
  setUpBrowser();
  fetchMock.mockClear();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

async function analyzeDocument() {
  const box = screen.getByLabelText("Document text");
  await userEvent.clear(box);
  box.focus();
  await userEvent.paste(DOCUMENT);
  await userEvent.click(screen.getByRole("button", { name: "Make my checklist" }));
  await screen.findByRole("heading", { name: "Your checklist" });
}

describe("saved progress", () => {
  test("ticks survive a reload, and the saved data never contains the document", async () => {
    render(<Home />);
    await analyzeDocument();
    await userEvent.click(screen.getByRole("checkbox", { name: "Prepare a CV" }));

    const raw = window.localStorage.getItem(STORAGE_KEY)!;
    expect(JSON.parse(raw).completedIds).toEqual(["item-2"]);
    expect(raw).not.toContain("Details about the role");

    cleanup(); // "reload": unmount and render a fresh page
    render(<Home />);
    expect(await screen.findByRole("checkbox", { name: "Prepare a CV" })).toHaveProperty("ariaChecked", "true");
    expect(screen.getByRole("checkbox", { name: "Confirm you have 1 year of experience" })).toHaveProperty(
      "ariaChecked",
      "false",
    );
  });

  test("analyzing the same text again reuses the saved result without calling the API", async () => {
    render(<Home />);
    await analyzeDocument();
    await userEvent.click(screen.getByRole("checkbox", { name: "Prepare a CV" }));
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await userEvent.click(screen.getByRole("button", { name: "Make my checklist" }));
    expect(await screen.findByText("Same document as before, so your saved checklist was reused.")).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("checkbox", { name: "Prepare a CV" })).toHaveProperty("ariaChecked", "true");
  });

  test("different text calls the API again", async () => {
    render(<Home />);
    await analyzeDocument();
    const box = screen.getByLabelText("Document text");
    box.focus();
    await userEvent.paste(" A new sentence.");
    await userEvent.click(screen.getByRole("button", { name: "Make my checklist" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  });

  test("clear saved data empties storage and the page", async () => {
    render(<Home />);
    await analyzeDocument();
    await userEvent.click(screen.getByRole("button", { name: "Clear saved data" }));
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(screen.queryByRole("heading", { name: "Your checklist" })).toBeNull();
    expect((screen.getByLabelText("Document text") as HTMLTextAreaElement).value).toBe("");

    cleanup();
    render(<Home />);
    expect(screen.queryByRole("heading", { name: "Your checklist" })).toBeNull();
  });
});

describe("on a non-secure page (http:// on a network address)", () => {
  test("Make my checklist still works and saves, even without crypto.subtle", async () => {
    vi.stubGlobal("crypto", {});
    render(<Home />);
    await analyzeDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY)!).textHash).toMatch(/^[0-9a-f]{64}$/);
  });
});

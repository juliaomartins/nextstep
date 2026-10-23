// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import Home from "@/app/page";
import type { AnalysisResult } from "@/lib/schemas";
import { STORAGE_KEY, type SavedState } from "@/lib/storage";
import { setUpBrowser } from "./helpers/browser";

const RESULT: AnalysisResult = {
  summary: "A job posting.",
  deadline: { status: "not_stated", date: null, wording: null, sourceExcerpt: null },
  items: [
    {
      id: "item-1",
      title: "Prepare a CV in PDF format",
      group: "required",
      whyItMatters: "It is a must.",
      sourceExcerpt: "Please submit your CV in PDF format.",
      deadline: null,
      evidence: "found",
    },
  ],
};

let downloads: { name: string; blob: Blob }[] = [];

beforeEach(() => {
  setUpBrowser();
  const saved: SavedState = { version: 1, savedAt: "x", textHash: "h", result: RESULT, completedIds: ["item-1"] };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));

  // jsdom can't save files: record what would have been downloaded instead.
  downloads = [];
  const blobs = new Map<string, Blob>();
  let n = 0;
  URL.createObjectURL = (blob: Blob) => {
    const url = `blob:test-${++n}`;
    blobs.set(url, blob);
    return url;
  };
  URL.revokeObjectURL = () => {};
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
    downloads.push({ name: this.download, blob: blobs.get(this.href)! });
  });
  vi.useFakeTimers({ toFake: ["Date"], now: new Date("2026-10-23T09:30:00Z") });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("downloading the checklist", () => {
  test("Download as Word saves a dated .docx", async () => {
    render(<Home />);
    await userEvent.click(await screen.findByRole("button", { name: "Download as Word" }));
    await waitFor(() => expect(downloads).toHaveLength(1));
    expect(downloads[0].name).toBe("nextstep-checklist-2026-10-23.docx");
    expect(downloads[0].blob.size).toBeGreaterThan(1000);
    expect(await screen.findByText("Saved nextstep-checklist-2026-10-23.docx")).toBeTruthy();
  });

  test("Download as PDF saves a dated .pdf", async () => {
    render(<Home />);
    await userEvent.click(await screen.findByRole("button", { name: "Download as PDF" }));
    await waitFor(() => expect(downloads).toHaveLength(1));
    expect(downloads[0].name).toBe("nextstep-checklist-2026-10-23.pdf");
    const head = new TextDecoder().decode(await downloads[0].blob.slice(0, 5).arrayBuffer());
    expect(head).toBe("%PDF-");
  });
});

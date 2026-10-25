// @vitest-environment jsdom
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "vitest";
import ExtensionPage from "@/app/extension/page";
import PrivacyPage from "@/app/privacy/page";

afterEach(cleanup);

describe("/extension", () => {
  test("explains the extension, its permissions, and links to privacy and the website", () => {
    render(<ExtensionPage />);
    expect(screen.getByRole("heading", { level: 1, name: "NextStep for Chrome" })).toBeTruthy();
    expect(screen.getByText("What it can access, and why")).toBeTruthy();
    expect(screen.getByRole("link", { name: "privacy policy" }).getAttribute("href")).toBe("/privacy");
    expect(screen.getByRole("link", { name: /Use it on the website/ }).getAttribute("href")).toBe("/");
  });

  test("says the checklist can be in your language, with quotes kept, and that payment requests are flagged", () => {
    render(<ExtensionPage />);
    expect(screen.getByText(/in your language/)).toBeTruthy();
    expect(screen.getByText(/quotes stay in the page's own words/)).toBeTruthy();
    expect(screen.getByText(/Be careful/)).toBeTruthy();
  });

  test("without a published store listing, says it's coming instead of showing a dead install button", () => {
    render(<ExtensionPage />);
    expect(screen.getByText("Coming to the Chrome Web Store.")).toBeTruthy();
    expect(screen.queryByRole("link", { name: /Add to Chrome/ })).toBeNull();
  });
});

describe("/privacy", () => {
  test("covers what is handled, where it goes, what stays on the device, and what isn't done", () => {
    render(<PrivacyPage />);
    for (const heading of ["What NextStep handles", "Where it goes", "What stays on your device", "What NextStep does not do"]) {
      expect(screen.getByRole("heading", { name: heading })).toBeTruthy();
    }
    expect(screen.getByText(/only after you click Analyze this page/)).toBeTruthy();
  });
});

describe("/extension download", () => {
  const zipDir = join(process.cwd(), "public", "downloads");
  const zipPath = join(zipDir, "nextstep-extension.zip");

  test("offers the download and the install steps when the build produced the zip", () => {
    mkdirSync(zipDir, { recursive: true });
    writeFileSync(zipPath, "test");
    try {
      render(<ExtensionPage />);
      expect(screen.getByRole("link", { name: /Download for Chrome/ }).getAttribute("href")).toBe(
        "/downloads/nextstep-extension.zip",
      );
      expect(screen.getByText(/Load unpacked/)).toBeTruthy();
    } finally {
      rmSync(zipPath, { force: true });
    }
  });

  test("doesn't show a download link when there is no zip (e.g. a local build)", () => {
    rmSync(zipPath, { force: true });
    render(<ExtensionPage />);
    expect(screen.queryByRole("link", { name: /Download for Chrome/ })).toBeNull();
  });
});

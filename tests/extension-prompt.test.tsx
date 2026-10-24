// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { EXTENSION_PROMPT_KEY, ExtensionPrompt } from "@/components/extension-prompt";
import { setUpBrowser } from "./helpers/browser";

const CHROME_DESKTOP =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36";
const FIREFOX = "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:140.0) Gecko/20100101 Firefox/140.0";
const CHROME_ANDROID =
  "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36";

function asBrowser(userAgent: string) {
  vi.spyOn(window.navigator, "userAgent", "get").mockReturnValue(userAgent);
}

beforeEach(setUpBrowser);
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("ExtensionPrompt", () => {
  test("on a first visit in desktop Chrome, recommends the extension or using the site directly", async () => {
    asBrowser(CHROME_DESKTOP);
    render(<ExtensionPrompt onUseHere={() => {}} />);
    expect(await screen.findByText(/Reading job posts in Chrome\?/)).toBeTruthy();
    expect(screen.getByRole("link", { name: /Add to Chrome/ }).getAttribute("href")).toBe("/extension");
    expect(screen.getByRole("button", { name: "Use it here" })).toBeTruthy();
  });

  test("'Use it here' hides it for good and takes the visitor to the paste box", async () => {
    asBrowser(CHROME_DESKTOP);
    const onUseHere = vi.fn();
    render(<ExtensionPrompt onUseHere={onUseHere} />);
    await userEvent.click(await screen.findByRole("button", { name: "Use it here" }));
    expect(onUseHere).toHaveBeenCalledOnce();
    expect(screen.queryByText(/Reading job posts in Chrome\?/)).toBeNull();
    expect(window.localStorage.getItem(EXTENSION_PROMPT_KEY)).toBe("dismissed");

    cleanup();
    render(<ExtensionPrompt onUseHere={onUseHere} />);
    await new Promise((r) => setTimeout(r, 0));
    expect(screen.queryByText(/Reading job posts in Chrome\?/)).toBeNull();
  });

  test("closing it also remembers the choice", async () => {
    asBrowser(CHROME_DESKTOP);
    render(<ExtensionPrompt onUseHere={() => {}} />);
    await userEvent.click(await screen.findByRole("button", { name: "Not now" }));
    expect(window.localStorage.getItem(EXTENSION_PROMPT_KEY)).toBe("dismissed");
  });

  test.each([
    ["Firefox", FIREFOX],
    ["Chrome on Android", CHROME_ANDROID],
  ])("isn't shown in %s, where the extension can't be installed", async (_, userAgent) => {
    asBrowser(userAgent);
    render(<ExtensionPrompt onUseHere={() => {}} />);
    await new Promise((r) => setTimeout(r, 0));
    expect(screen.queryByText(/Reading job posts in Chrome\?/)).toBeNull();
  });
});

import { vi } from "vitest";

/** jsdom has no media queries or layout: report "reduce motion" (so GSAP skips) and no-op scrolling. */
export function setUpBrowser() {
  window.localStorage.clear();
  window.matchMedia = ((query: string) => ({
    matches: query === "(prefers-reduced-motion: reduce)",
    media: query,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    onchange: null,
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
  Element.prototype.scrollIntoView = () => {};
}

/** The only fake in page tests: the network call to our own API (which would call OpenAI). */
export function stubApi(respond: () => Promise<Response>) {
  const fetchMock = vi.fn(respond);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

"use client";

import { useEffect, useState } from "react";
import { MousePointerClick, PanelTop, X } from "lucide-react";

export const EXTENSION_PROMPT_KEY = "nextstep:extension-prompt";

/**
 * Where "Add to Chrome" goes: the Chrome Web Store listing once it's published
 * (set NEXT_PUBLIC_EXTENSION_URL), otherwise the site's own /extension page.
 */
const EXTENSION_URL = process.env.NEXT_PUBLIC_EXTENSION_URL || "/extension";

/** Chrome Web Store extensions install on desktop Chromium browsers (Chrome, Edge, Brave, Opera). */
function canInstallExtension(): boolean {
  const ua = window.navigator.userAgent;
  return /Chrome\//.test(ua) && !/Mobile|Android|iPhone|iPad/.test(ua);
}

function readDismissed(): boolean {
  try {
    return window.localStorage.getItem(EXTENSION_PROMPT_KEY) === "dismissed";
  } catch {
    return false;
  }
}

function rememberDismissed() {
  try {
    window.localStorage.setItem(EXTENSION_PROMPT_KEY, "dismissed");
  } catch {
    // Storage unavailable: the prompt may show again next time, which is harmless.
  }
}

/** A one-time, first-visit choice: add the Chrome extension, or just use the website. */
export function ExtensionPrompt({ onUseHere }: { onUseHere: () => void }) {
  const [visible, setVisible] = useState(false);

  // Decided after mount: it depends on this browser and on what this visitor chose before.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of the browser and storage
    setVisible(canInstallExtension() && !readDismissed());
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    rememberDismissed();
    setVisible(false);
  };
  const external = EXTENSION_URL.startsWith("http");

  return (
    <aside
      aria-label="Get the NextStep Chrome extension"
      className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-4 border-2 border-ink bg-sheet px-5 py-4 shadow-[4px_4px_0_0_var(--ink)]"
    >
      <span className="flex size-10 shrink-0 items-center justify-center bg-ballpoint text-white">
        <PanelTop className="size-5" aria-hidden />
      </span>
      <p className="min-w-[16rem] flex-1 text-ink-soft">
        <span className="font-bold text-ink">Reading job posts in Chrome?</span> Add the NextStep extension: one click
        on any posting turns it into your checklist. Or use NextStep right here.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <a
          href={EXTENSION_URL}
          {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          onClick={rememberDismissed}
          className="press inline-flex h-10 items-center gap-2 border-2 border-ink bg-ballpoint px-4 text-sm font-bold text-white hover:bg-ballpoint-deep focus-visible:ring-4 focus-visible:ring-ring/40 focus-visible:outline-none"
        >
          <PanelTop className="size-4" aria-hidden />
          Add to Chrome
        </a>
        <button
          type="button"
          onClick={() => {
            dismiss();
            onUseHere();
          }}
          className="press inline-flex h-10 items-center gap-2 border-2 border-ink bg-sheet px-4 text-sm font-bold text-ink hover:bg-highlight focus-visible:ring-4 focus-visible:ring-ring/40 focus-visible:outline-none"
        >
          <MousePointerClick className="size-4" aria-hidden />
          Use it here
        </button>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Not now"
          className="press inline-flex size-10 items-center justify-center text-muted-ink hover:text-ink focus-visible:ring-4 focus-visible:ring-ring/40 focus-visible:outline-none"
        >
          <X className="size-5" aria-hidden />
        </button>
      </div>
    </aside>
  );
}

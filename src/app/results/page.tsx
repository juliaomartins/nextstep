"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CircleAlert, Globe, ListChecks, ShieldAlert } from "lucide-react";
import { ResultsView } from "@/components/results-view";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { decodeHandoff, type Handoff } from "@/lib/handoff";
import { loadSaved } from "@/lib/storage";
import { useSavedChecklist } from "@/lib/use-saved-checklist";

type Status = "loading" | "ready" | "invalid" | "unconfirmed";

async function confirmSeal(handoff: Handoff): Promise<boolean> {
  try {
    const res = await fetch("/api/handoff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ result: handoff.result, seal: handoff.seal }),
    });
    const data: unknown = await res.json();
    return (data as { valid?: unknown }).valid === true;
  } catch {
    return false;
  }
}

function hostOf(url: string) {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

/**
 * The dedicated results page. The browser extension opens it with the analysis in the URL fragment
 * (#data=…); without one, it shows the checklist saved in this browser.
 */
export default function ResultsPage() {
  const { result, completedIds, textHash, show, toggle, clear } = useSavedChecklist();
  const [view, setView] = useState<{ status: Status; source: Handoff["source"] }>({ status: "loading", source: null });
  const { status, source } = view;

  // One-time read of the URL fragment after mount (the hand-off from the browser extension).
  // The ref keeps it to one read: React's StrictMode runs effects twice in development, and the first run
  // has already cleared the fragment from the address bar.
  const handled = useRef(false);
  useEffect(() => {
    if (handled.current) return;
    handled.current = true;
    const fragment = window.location.hash;
    if (!fragment) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from the URL, an external source, once
      setView({ status: "ready", source: null });
      return;
    }
    const handoff = decodeHandoff(fragment);
    // Take the data out of the address bar so it isn't bookmarked or shared by accident.
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
    if (!handoff) {
      setView({ status: "invalid", source: null });
      return;
    }
    // Only a checklist this server sealed, unchanged, is shown or saved; a hand-made link can't fake one.
    confirmSeal(handoff).then((valid) => {
      if (!valid) {
        setView({ status: "unconfirmed", source: null });
        return;
      }
      // The same page analyzed again keeps the ticks already saved for it.
      const saved = loadSaved();
      const ticked = saved?.textHash === handoff.textHash ? saved.completedIds : [];
      show(handoff.result, handoff.result.items.length > 0 ? handoff.textHash : null, ticked);
      setView({ status: "ready", source: handoff.source });
    });
  }, [show]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
      <SiteHeader />

      <main className="mx-auto mt-12 max-w-3xl space-y-6 sm:mt-16">
        {status === "invalid" && (
          <div role="alert" className="border-2 border-stamp-red bg-stamp-red-bg p-6">
            <p className="flex items-center gap-2 font-semibold text-stamp-red">
              <CircleAlert className="size-5" aria-hidden />
              This link doesn&apos;t contain a valid checklist.
            </p>
            <p className="mt-2 text-ink-soft">It may have been cut short when copied. Analyze the page again from the extension.</p>
          </div>
        )}

        {status === "unconfirmed" && (
          <div role="alert" className="border-2 border-stamp-red bg-stamp-red-bg p-6">
            <p className="flex items-center gap-2 font-semibold text-stamp-red">
              <ShieldAlert className="size-5" aria-hidden />
              NextStep couldn&apos;t confirm it made this checklist.
            </p>
            <p className="mt-2 text-ink-soft">
              The link may have been changed, made somewhere else, or opened while offline, so it wasn&apos;t shown or
              saved. Analyze the page again from the extension.
            </p>
          </div>
        )}

        {status === "ready" && source && (
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 border-l-4 border-ballpoint bg-sheet px-4 py-3 text-sm text-ink-soft">
            <Globe className="size-4 shrink-0 text-ballpoint" aria-hidden />
            Read from
            <span className="font-semibold text-ink">{source.title || "a web page"}</span>
            <span className="text-muted-ink">{hostOf(source.url)}</span>
          </p>
        )}

        {status === "ready" && result && (
          <ResultsView
            result={result}
            completedIds={completedIds}
            saved={textHash !== null}
            notice={null}
            onToggle={toggle}
            onClear={() => {
              clear();
              setView({ status: "ready", source: null });
            }}
          />
        )}

        {status === "ready" && !result && (
          <div className="border-2 border-ink bg-sheet p-8 text-center shadow-[6px_6px_0_0_var(--ink)]">
            <p className="condensed text-3xl font-extrabold text-ink">No checklist yet.</p>
            <p className="mt-2 text-ink-soft">Paste or upload a document, or use the NextStep browser extension on a web page.</p>
            <Link
              href="/"
              className="press mt-6 inline-flex h-12 items-center gap-2 border-2 border-ink bg-ballpoint px-5 font-bold text-white shadow-[4px_4px_0_0_var(--ink)] hover:bg-ballpoint-deep focus-visible:ring-4 focus-visible:ring-ring/40 focus-visible:outline-none"
            >
              <ListChecks className="size-5" aria-hidden />
              Make a checklist
            </Link>
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}

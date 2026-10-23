"use client";

import { useEffect, useRef, useState } from "react";
import { AnalyzingState } from "@/components/analyzing-state";
import { Hero } from "@/components/hero";
import { HowItWorks } from "@/components/how-it-works";
import { InputPanel } from "@/components/input-panel";
import { ResultsView } from "@/components/results-view";
import { SiteFooter } from "@/components/site-footer";
import { cleanText } from "@/lib/clean-text";
import type { AnalysisResult, ApiError } from "@/lib/schemas";
import { SAMPLE_POSTING } from "@/lib/sample-posting";
import { clearSaved, hashText, loadSaved, save } from "@/lib/storage";

const NETWORK_ERROR = "We couldn't analyze this document right now. Please try again.";
const REUSED_NOTICE = "Same document as before, so your saved checklist was reused.";

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function bringIntoView(el: HTMLElement | null) {
  el?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
}

export default function Home() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [textHash, setTextHash] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const inputSectionRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const resultsRef = useRef<HTMLElement>(null);

  // Restore the saved checklist after mount, so the server-rendered HTML matches the first browser render.
  useEffect(() => {
    const saved = loadSaved();
    if (!saved) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time sync from browser storage
    setResult(saved.result);
    setCompletedIds(new Set(saved.completedIds));
    setTextHash(saved.textHash);
  }, []);

  // Persist on every change of result or ticks. Only the result, ticks, and a hash are stored.
  useEffect(() => {
    if (!result || !textHash) return;
    save({
      version: 1,
      savedAt: new Date().toISOString(),
      textHash,
      result,
      completedIds: [...completedIds],
    });
  }, [result, completedIds, textHash]);

  function showResults() {
    requestAnimationFrame(() => {
      bringIntoView(resultsRef.current);
      resultsRef.current?.focus({ preventScroll: true });
    });
  }

  function startPasting() {
    bringIntoView(inputSectionRef.current);
    textareaRef.current?.focus({ preventScroll: true });
  }

  function loadSample() {
    setText(SAMPLE_POSTING);
    setError(null);
    bringIntoView(inputSectionRef.current);
  }

  async function analyze() {
    setError(null);
    setNotice(null);
    const cleaned = cleanText(text);
    const hash = await hashText(cleaned);

    // Token saver: identical text reuses the saved result and its ticks, with no AI call.
    const saved = loadSaved();
    if (saved && saved.textHash === hash) {
      setResult(saved.result);
      setCompletedIds(new Set(saved.completedIds));
      setTextHash(hash);
      setNotice(REUSED_NOTICE);
      showResults();
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: cleaned }),
      });
      const data: AnalysisResult | ApiError = await res.json();
      if ("error" in data) {
        setError(data.error.message);
        return;
      }
      setResult(data);
      setCompletedIds(new Set());
      // Nothing actionable: show the message, but don't replace the saved checklist with an empty one.
      setTextHash(data.items.length > 0 ? hash : null);
      showResults();
    } catch {
      setError(NETWORK_ERROR);
    } finally {
      setLoading(false);
    }
  }

  function toggle(id: string) {
    setCompletedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function clearAll() {
    clearSaved();
    setResult(null);
    setCompletedIds(new Set());
    setTextHash(null);
    setNotice(null);
    setText("");
    setError(null);
    startPasting();
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
      <nav aria-label="NextStep" className="flex items-center justify-between py-6">
        <span className="display text-2xl font-semibold text-ink">NextStep</span>
        <span className="text-sm text-muted-ink">No account needed</span>
      </nav>

      <main>
        <div className="pt-8 pb-16 sm:pt-14 sm:pb-20">
          <Hero onStart={startPasting} onSample={loadSample} />
        </div>

        <HowItWorks />

        <div ref={inputSectionRef} className="mx-auto mt-16 max-w-3xl space-y-8 sm:mt-20">
          <InputPanel
            ref={textareaRef}
            text={text}
            loading={loading}
            error={error}
            onTextChange={setText}
            onSample={loadSample}
            onAnalyze={analyze}
          />
          {loading && <AnalyzingState />}
          {result && !loading && (
            <ResultsView
              ref={resultsRef}
              result={result}
              completedIds={completedIds}
              saved={textHash !== null}
              notice={notice}
              onToggle={toggle}
              onClear={clearAll}
            />
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

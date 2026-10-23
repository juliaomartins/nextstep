"use client";

import { useRef, useState } from "react";
import { AnalyzingState } from "@/components/analyzing-state";
import { Hero } from "@/components/hero";
import { HowItWorks } from "@/components/how-it-works";
import { InputPanel } from "@/components/input-panel";
import { ResultsView } from "@/components/results-view";
import { SiteFooter } from "@/components/site-footer";
import type { AnalysisResult, ApiError } from "@/lib/schemas";
import { SAMPLE_POSTING } from "@/lib/sample-posting";

const NETWORK_ERROR = "We couldn't analyze this document right now. Please try again.";

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

  const inputSectionRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const resultsRef = useRef<HTMLElement>(null);

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
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data: AnalysisResult | ApiError = await res.json();
      if ("error" in data) {
        setError(data.error.message);
      } else {
        setResult(data);
        setCompletedIds(new Set());
        requestAnimationFrame(() => {
          bringIntoView(resultsRef.current);
          resultsRef.current?.focus({ preventScroll: true });
        });
      }
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
            <ResultsView ref={resultsRef} result={result} completedIds={completedIds} onToggle={toggle} />
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

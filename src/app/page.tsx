"use client";

import { useState } from "react";
import type { AnalysisResult, ApiError, Group } from "@/lib/schemas";
import { SAMPLE_POSTING } from "@/lib/sample-posting";

const GROUP_LABELS: Record<Group, string> = {
  required: "Required",
  recommended: "Recommended",
  needs_check: "Needs your check",
};

export default function Home() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);

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
      if ("error" in data) setError(data.error.message);
      else setResult(data);
    } catch {
      setError("We couldn't analyze this document right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-2xl p-6">
      <h1 className="text-2xl font-bold">NextStep</h1>
      <p>From confusing documents to clear next steps.</p>

      <textarea
        className="mt-4 h-48 w-full border p-2"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste a document…"
      />
      <div className="flex gap-4">
        <button type="button" className="underline" onClick={() => setText(SAMPLE_POSTING)}>
          Try a sample
        </button>
        <button type="button" className="border px-3 py-1" disabled={!text.trim() || loading} onClick={analyze}>
          {loading ? "Reading your document…" : "Analyze"}
        </button>
      </div>
      {error && <p role="alert">{error}</p>}

      {result && (
        <section className="mt-6 space-y-4">
          <p>{result.summary}</p>
          <p>
            Deadline: {result.deadline.status}
            {result.deadline.date && ` (${result.deadline.date})`}
            {result.deadline.wording && ` — ${result.deadline.wording}`}
          </p>
          {(Object.keys(GROUP_LABELS) as Group[]).map((group) => {
            const items = result.items.filter((item) => item.group === group);
            if (items.length === 0) return null;
            return (
              <div key={group}>
                <h2 className="font-bold">{GROUP_LABELS[group]}</h2>
                <ul className="list-disc pl-5">
                  {items.map((item) => (
                    <li key={item.id}>
                      {item.title}
                      <blockquote className="text-sm">
                        “{item.sourceExcerpt}” — {item.evidence === "found" ? "✓ Found in document" : "⚠ Not found in document"}
                      </blockquote>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
          {result.items.length === 0 && <p>We couldn&apos;t find any requirements or steps in this text.</p>}
        </section>
      )}
    </main>
  );
}

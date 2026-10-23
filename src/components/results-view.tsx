"use client";

import { forwardRef, useRef } from "react";
import { HardDriveDownload, Info, Trash2 } from "lucide-react";
import { gsap, MOTION_OK, useGSAP } from "@/lib/motion";
import type { AnalysisResult } from "@/lib/schemas";
import { Checklist } from "./checklist";
import { DeadlineBanner } from "./deadline-banner";
import { SummaryCard } from "./summary-card";

type Props = {
  result: AnalysisResult;
  completedIds: Set<string>;
  saved: boolean;
  notice: string | null;
  onToggle: (id: string) => void;
  onClear: () => void;
};

export const ResultsView = forwardRef<HTMLElement, Props>(function ResultsView(
  { result, completedIds, saved, notice, onToggle, onClear },
  forwardedRef,
) {
  const sheetRef = useRef<HTMLElement | null>(null);
  const barRef = useRef<HTMLDivElement>(null);

  const total = result.items.length;
  const done = result.items.filter((item) => completedIds.has(item.id)).length;
  const fraction = total === 0 ? 0 : done / total;

  // One orchestrated reveal when a new result arrives.
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap
          .timeline({ defaults: { ease: "power2.out" } })
          .from(sheetRef.current, { autoAlpha: 0, y: 24, duration: 0.45 })
          .from("[data-reveal]", { autoAlpha: 0, y: 8, duration: 0.3, stagger: 0.08 }, "-=0.2")
          .from("[data-reveal-item]", { autoAlpha: 0, x: -6, duration: 0.25, stagger: 0.035 }, "-=0.15");
      });
      return () => mm.revert();
    },
    { dependencies: [result], scope: sheetRef },
  );

  // The overall progress bar glides to its new length on every tick.
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(
        { motion: MOTION_OK, reduce: "(prefers-reduced-motion: reduce)" },
        (ctx) => {
          const { motion } = ctx.conditions as { motion: boolean };
          gsap.to(barRef.current, { scaleX: fraction, duration: motion ? 0.5 : 0, ease: "power3.out" });
        },
      );
      return () => mm.revert();
    },
    { dependencies: [fraction] },
  );

  return (
    <section
      ref={(node) => {
        sheetRef.current = node;
        if (typeof forwardedRef === "function") forwardedRef(node);
        else if (forwardedRef) forwardedRef.current = node;
      }}
      aria-labelledby="results-heading"
      tabIndex={-1}
      className="rounded-2xl border border-rule bg-sheet px-5 py-7 shadow-[0_24px_48px_-32px_rgba(31,58,95,0.35)] focus:outline-none sm:px-10 sm:py-10"
    >
      <header data-reveal className="flex flex-wrap items-end justify-between gap-4">
        <h2 id="results-heading" className="display text-3xl font-semibold text-ink sm:text-4xl">
          Your checklist
        </h2>
        {total > 0 && (
          <p className="text-sm text-muted-ink tabular-nums" aria-live="polite">
            {done} of {total} steps done
          </p>
        )}
      </header>
      {total > 0 && (
        <div data-reveal className="mt-4 h-1.5 overflow-hidden rounded-full bg-paper-deep" aria-hidden>
          <div ref={barRef} className="h-full origin-left scale-x-0 rounded-full bg-accent-ink" />
        </div>
      )}

      {notice && (
        <p data-reveal role="status" className="mt-6 flex items-center gap-2 rounded-lg bg-paper px-4 py-2.5 text-sm text-accent-ink">
          <Info className="size-4 shrink-0" aria-hidden />
          {notice}
        </p>
      )}

      <div className="mt-8 space-y-8">
        <SummaryCard summary={result.summary} />
        <DeadlineBanner deadline={result.deadline} />
        {total > 0 ? (
          <Checklist items={result.items} completedIds={completedIds} onToggle={onToggle} />
        ) : (
          <p data-reveal className="text-ink-soft">
            We couldn&apos;t find any requirements or steps in this text.
          </p>
        )}
      </div>

      <footer className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-rule pt-5 text-sm">
        <p className="flex items-center gap-1.5 text-muted-ink">
          {saved ? (
            <>
              <HardDriveDownload className="size-4" aria-hidden />
              Saved in this browser. Your ticks will be here when you come back.
            </>
          ) : (
            "Not saved, because there was nothing to tick off."
          )}
        </p>
        <button
          type="button"
          onClick={onClear}
          className="inline-flex items-center gap-1.5 rounded-md px-1 font-medium text-ink-soft hover:text-error focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <Trash2 className="size-4" aria-hidden />
          Clear saved data
        </button>
      </footer>
    </section>
  );
});

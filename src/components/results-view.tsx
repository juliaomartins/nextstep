"use client";

import { forwardRef, useRef } from "react";
import { ClipboardCheck, HardDriveDownload, Info, ShieldAlert, Trash2 } from "lucide-react";
import { AI_INSTRUCTIONS_WARNING } from "@/lib/export-model";
import { gsap, MOTION_OK, thump, useGSAP } from "@/lib/motion";
import type { AnalysisResult } from "@/lib/schemas";
import { Checklist } from "./checklist";
import { DeadlineBanner } from "./deadline-banner";
import { DownloadActions } from "./download-actions";
import { SectionHeading } from "./section-heading";
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

  // One orchestrated reveal per new result: the slip slides out, then every verdict is stamped down the list.
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap
          .timeline({ defaults: { ease: "power2.out" } })
          .from(sheetRef.current, { autoAlpha: 0, y: 28, duration: 0.45 })
          .from("[data-reveal]", { autoAlpha: 0, y: 8, duration: 0.3, stagger: 0.07 }, "-=0.2")
          .from("[data-reveal-item]", { autoAlpha: 0, x: -6, duration: 0.22, stagger: 0.03 }, "-=0.15")
          .add(thump("[data-reveal] [data-stamp], [data-reveal-item] [data-stamp]", sheetRef.current, 0.07), "-=0.1");
      });
      return () => mm.revert();
    },
    { dependencies: [result], scope: sheetRef },
  );

  // The progress bar fills like ink on every tick.
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add({ motion: MOTION_OK, reduce: "(prefers-reduced-motion: reduce)" }, (ctx) => {
        const { motion } = ctx.conditions as { motion: boolean };
        gsap.to(barRef.current, { scaleX: fraction, duration: motion ? 0.5 : 0, ease: "power3.out" });
      });
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
      className="perforated border-2 border-ink bg-sheet shadow-[6px_6px_0_0_var(--ink)] focus:outline-none"
    >
      <SectionHeading
        number={2}
        id="results-heading"
        title="Your checklist"
        Icon={ClipboardCheck}
        aside={
          total > 0 ? (
            <p className="text-sm font-semibold tabular-nums" aria-live="polite">
              {done} of {total} steps done
            </p>
          ) : undefined
        }
      />
      {total > 0 && (
        <div className="h-2 bg-form-deep" aria-hidden>
          <div ref={barRef} className="h-full origin-left scale-x-0 bg-ballpoint" />
        </div>
      )}

      <div className="space-y-8 px-5 py-7 sm:px-9 sm:py-9">
        {notice && (
          <p
            data-reveal
            role="status"
            className="flex items-center gap-2 border-l-4 border-ballpoint bg-ballpoint/5 px-4 py-2.5 text-sm font-medium text-ballpoint"
          >
            <Info className="size-4 shrink-0" aria-hidden />
            {notice}
          </p>
        )}

        {result.safety?.aiInstructions && (
          <p
            data-reveal
            role="alert"
            className="flex items-start gap-2 border-2 border-stamp-red bg-stamp-red-bg px-4 py-3 text-sm font-semibold text-stamp-red"
          >
            <ShieldAlert className="mt-0.5 size-5 shrink-0" aria-hidden />
            <span>{AI_INSTRUCTIONS_WARNING}</span>
          </p>
        )}
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

      {total > 0 && <DownloadActions result={result} completedIds={completedIds} />}

      <footer className="flex flex-wrap items-center justify-between gap-4 border-t-2 border-dashed border-ink px-5 py-4 text-sm sm:px-9">
        <p className="flex items-center gap-1.5 text-ink-soft">
          {saved ? (
            <>
              <HardDriveDownload className="size-4 text-stamp-green" aria-hidden />
              Saved in this browser. Your ticks will be here when you come back.
            </>
          ) : (
            "Not saved, because there was nothing to tick off."
          )}
        </p>
        <button
          type="button"
          onClick={onClear}
          className="press inline-flex items-center gap-1.5 border-2 border-transparent px-2 py-1 font-semibold text-ink-soft hover:border-stamp-red hover:text-stamp-red focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <Trash2 className="size-4" aria-hidden />
          Clear saved data
        </button>
      </footer>
    </section>
  );
});

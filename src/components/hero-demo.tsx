"use client";

import { useRef } from "react";
import { CalendarX, CircleCheck, RotateCcw, TriangleAlert } from "lucide-react";
import { gsap, MOTION_OK, useGSAP } from "@/lib/motion";

/* A fictional notice, shown as the product's own proof: each sentence is highlighted,
   then becomes a checklist step sorted by the document's wording. */
const LINES = [
  {
    quote: "Applicants must hold a bachelor's degree or be in their final year of study.",
    step: "Confirm you hold a degree, or are in your final year",
    group: "Required",
  },
  {
    quote: "Please upload a CV and a personal statement of up to 500 words.",
    step: "Upload a CV and a 500-word personal statement",
    group: "Required",
  },
  {
    quote: "A full driving licence would be an advantage.",
    step: "Mention your driving licence if you have one",
    group: "Recommended",
  },
  {
    quote: "Shortlisted candidates may be invited to an assessment day.",
    step: "Find out whether there is an assessment day",
    group: "Needs your check",
  },
] as const;

export function HeroDemo() {
  const rootRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(
        { motion: MOTION_OK, reduce: "(prefers-reduced-motion: reduce)" },
        (ctx) => {
          const { motion } = ctx.conditions as { motion: boolean };
          if (!motion) {
            rootRef.current!.dataset.motion = "static";
            return;
          }

          const tl = gsap.timeline({ delay: 0.5, defaults: { ease: "power2.out" } });
          tl.fromTo("[data-demo='doc']", { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.5 });

          LINES.forEach((_, i) => {
            tl.fromTo(
              `[data-demo='mark-${i}']`,
              { backgroundSize: "0% 100%" },
              { backgroundSize: "100% 100%", duration: 0.6, ease: "power1.inOut" },
              i === 0 ? "+=0.2" : "+=0.15",
            ).fromTo(
              `[data-demo='step-${i}']`,
              { autoAlpha: 0, y: 10 },
              { autoAlpha: 1, y: 0, duration: 0.35 },
              "-=0.15",
            );
          });

          tl.fromTo(
            "[data-demo='deadline']",
            { autoAlpha: 0, scale: 0.96 },
            { autoAlpha: 1, scale: 1, duration: 0.4, ease: "back.out(2)" },
            "+=0.2",
          ).fromTo("[data-demo='replay']", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 });

          timelineRef.current = tl;
          return () => {
            timelineRef.current = null;
          };
        },
      );
      return () => mm.revert();
    },
    { scope: rootRef },
  );

  // Restarting an existing timeline creates no new tweens, so it needs no contextSafe wrapper.
  const replay = () => timelineRef.current?.restart(true);

  return (
    <div ref={rootRef} data-motion="pending" className="relative" aria-label="Example of NextStep at work" role="figure">
      <div
        data-demo="doc"
        data-demo-reveal
        className="relative rounded-xl border border-rule bg-sheet p-5 shadow-[0_1px_0_rgba(28,27,25,0.04),0_24px_48px_-28px_rgba(31,58,95,0.35)] sm:p-7"
      >
        <p className="text-sm text-muted-ink">Graduate Programme 2027, Northfield Council (fictional example)</p>
        <div className="mt-3 space-y-2 font-serif text-[0.975rem] leading-relaxed text-ink-soft sm:text-base">
          {LINES.map((line, i) => (
            <p key={line.quote}>
              <span data-demo={`mark-${i}`} className="evidence-mark">
                {line.quote}
              </span>
            </p>
          ))}
        </div>

        <div className="mt-5 border-t border-dashed border-rule pt-4">
          <ul className="space-y-2.5">
            {LINES.map((line, i) => (
              <li key={line.step} data-demo={`step-${i}`} data-demo-reveal className="flex items-start gap-3">
                <span
                  aria-hidden
                  className="mt-0.5 size-4.5 shrink-0 rounded-[5px] border-[1.5px] border-[#b9b1a2] bg-sheet"
                />
                <span className="flex-1 text-[0.95rem] leading-snug text-ink">{line.step}</span>
                <span
                  className={
                    line.group === "Needs your check"
                      ? "inline-flex shrink-0 items-center gap-1 rounded-full bg-warn-bg px-2 py-0.5 text-xs font-medium text-warn"
                      : line.group === "Required"
                        ? "inline-flex shrink-0 items-center gap-1 rounded-full bg-accent-ink/8 px-2 py-0.5 text-xs font-medium text-accent-ink"
                        : "inline-flex shrink-0 items-center gap-1 rounded-full bg-paper-deep px-2 py-0.5 text-xs font-medium text-ink-soft"
                  }
                >
                  {line.group === "Needs your check" ? (
                    <TriangleAlert className="size-3" aria-hidden />
                  ) : (
                    <CircleCheck className="size-3" aria-hidden />
                  )}
                  {line.group}
                </span>
              </li>
            ))}
          </ul>

          <div
            data-demo="deadline"
            data-demo-reveal
            className="mt-4 flex items-center gap-2 rounded-lg bg-warn-bg px-3 py-2 text-sm font-medium text-warn"
          >
            <CalendarX className="size-4 shrink-0" aria-hidden />
            No deadline stated in this document. Nothing invented.
          </div>
        </div>
      </div>

      <button
        type="button"
        data-demo="replay"
        data-demo-reveal
        onClick={replay}
        className="mt-3 inline-flex items-center gap-1.5 rounded-md px-1 text-sm text-muted-ink hover:text-accent-ink focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        <RotateCcw className="size-3.5" aria-hidden />
        Replay example
      </button>
    </div>
  );
}

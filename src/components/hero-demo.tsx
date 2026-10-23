"use client";

import { useRef } from "react";
import { CalendarX2, FileText, RotateCcw } from "lucide-react";
import { gsap, MOTION_OK, thump, useGSAP } from "@/lib/motion";
import { Stamp, type StampTone } from "./stamp";

/* A fictional notice, shown as the product's own proof: each sentence is highlighted,
   then stamped with what the document's wording makes it. */
const LINES: { quote: string; stamp: string; tone: StampTone; rotate: number }[] = [
  {
    quote: "Applicants must hold a bachelor's degree or be in their final year of study.",
    stamp: "Required",
    tone: "required",
    rotate: -4,
  },
  {
    quote: "Please upload a CV and a personal statement of up to 500 words.",
    stamp: "Required",
    tone: "required",
    rotate: 3,
  },
  { quote: "A full driving licence would be an advantage.", stamp: "Recommended", tone: "recommended", rotate: -2 },
  {
    quote: "Shortlisted candidates may be invited to an assessment day.",
    stamp: "Check this",
    tone: "check",
    rotate: 4,
  },
];

export function HeroDemo() {
  const rootRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add({ motion: MOTION_OK, reduce: "(prefers-reduced-motion: reduce)" }, (ctx) => {
        const { motion } = ctx.conditions as { motion: boolean };
        if (!motion) {
          rootRef.current!.dataset.motion = "static";
          return;
        }

        const tl = gsap.timeline({ delay: 0.4, defaults: { ease: "power2.out" } });
        tl.fromTo("[data-demo='sheet']", { autoAlpha: 0, y: 24, rotation: 1.5 }, { autoAlpha: 1, y: 0, rotation: 0, duration: 0.55 });

        LINES.forEach((_, i) => {
          tl.fromTo(
            `[data-demo='mark-${i}']`,
            { backgroundSize: "0% 100%" },
            { backgroundSize: "100% 100%", duration: 0.55, ease: "power1.inOut" },
            i === 0 ? "+=0.15" : "+=0.1",
          ).add(thump(`[data-demo='stamp-${i}']`, "[data-demo='sheet']"), "-=0.05");
        });

        tl.add(thump("[data-demo='deadline']", "[data-demo='sheet']"), "+=0.25").fromTo(
          "[data-demo='replay']",
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: 0.3 },
        );

        timelineRef.current = tl;
        return () => {
          timelineRef.current = null;
        };
      });
      return () => mm.revert();
    },
    { scope: rootRef },
  );

  // Restarting an existing timeline creates no new tweens, so it needs no contextSafe wrapper.
  const replay = () => timelineRef.current?.restart(true);

  return (
    <div ref={rootRef} data-motion="pending" className="relative" aria-label="Example of NextStep at work" role="figure">
      <div
        data-demo="sheet"
        data-demo-reveal
        className="relative border-2 border-ink bg-sheet shadow-[6px_6px_0_0_var(--ink)]"
      >
        <div className="flex items-center justify-between gap-3 border-b-2 border-ink px-5 py-2.5">
          <p className="condensed flex items-center gap-2 text-sm font-bold tracking-wide text-ink uppercase">
            <FileText className="size-4" aria-hidden />
            Graduate Programme 2027
          </p>
          <p className="text-xs text-muted-ink">Fictional example</p>
        </div>

        <ol className="divide-y divide-dashed divide-rule">
          {LINES.map((line, i) => (
            <li key={line.quote} className="flex items-start gap-4 px-5 py-4">
              <span aria-hidden className="condensed mt-0.5 w-5 shrink-0 text-sm font-bold text-muted-ink">
                {String(i + 1).padStart(2, "0")}
              </span>
              <p className="flex-1 text-[0.975rem] leading-relaxed text-ink-soft">
                <span data-demo={`mark-${i}`} className="evidence-mark">
                  {line.quote}
                </span>
              </p>
              <span data-demo={`stamp-${i}`} data-demo-reveal className="mt-0.5 inline-block shrink-0">
                <Stamp tone={line.tone} rotate={line.rotate} className="text-[0.7rem]">
                  {line.stamp}
                </Stamp>
              </span>
            </li>
          ))}
        </ol>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-ink px-5 py-4">
          <span className="text-sm text-muted-ink">Application deadline</span>
          <span data-demo="deadline" data-demo-reveal className="inline-block">
            <Stamp tone="check" rotate={-5} className="text-xs sm:text-sm">
              <CalendarX2 className="size-4" aria-hidden />
              Not stated. Nothing invented.
            </Stamp>
          </span>
        </div>
      </div>

      <button
        type="button"
        data-demo="replay"
        data-demo-reveal
        onClick={replay}
        className="press mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-ballpoint focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        <RotateCcw className="size-4" aria-hidden />
        Replay example
      </button>
    </div>
  );
}

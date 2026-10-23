"use client";

import { useRef } from "react";
import { gsap, MOTION_OK, useGSAP } from "@/lib/motion";

const WIDTHS = ["92%", "78%", "86%", "64%", "81%"];

/** Shown while the document is being analyzed: a marker scanning a page, line by line. */
export function AnalyzingState() {
  const rootRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.fromTo(
          "[data-scan]",
          { scaleX: 0 },
          { scaleX: 1, duration: 0.7, ease: "power1.inOut", stagger: { each: 0.45, repeat: -1, repeatDelay: 1.6 } },
        );
      });
      return () => mm.revert();
    },
    { scope: rootRef },
  );

  return (
    <div ref={rootRef} role="status" className="rounded-2xl border border-rule bg-sheet p-6 sm:p-8">
      <p className="display text-2xl font-semibold text-ink">Reading your document</p>
      <p className="mt-1 text-ink-soft">
        Finding every requirement, then checking each quote against your text. This usually takes 10 to 20 seconds.
      </p>
      <div aria-hidden className="mt-6 space-y-3">
        {WIDTHS.map((width) => (
          <div key={width} className="relative h-3.5 overflow-hidden rounded-sm bg-paper-deep" style={{ width }}>
            <div data-scan className="absolute inset-0 origin-left bg-highlight-strong/70 motion-reduce:hidden" />
          </div>
        ))}
      </div>
    </div>
  );
}

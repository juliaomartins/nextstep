"use client";

import { useRef } from "react";
import { ScanText } from "lucide-react";
import { gsap, MOTION_OK, useGSAP } from "@/lib/motion";

const WIDTHS = ["92%", "78%", "86%", "64%", "81%"];

/** Shown while the document is being analyzed: a marker scanning a form, line by line. */
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
        gsap.to("[data-scan-icon]", { y: -3, duration: 0.6, ease: "sine.inOut", repeat: -1, yoyo: true });
      });
      return () => mm.revert();
    },
    { scope: rootRef },
  );

  return (
    <div ref={rootRef} role="status" className="border-2 border-ink bg-sheet p-6 shadow-[6px_6px_0_0_var(--ink)] sm:p-8">
      <div className="flex items-center gap-3">
        <span data-scan-icon className="flex size-10 items-center justify-center bg-ballpoint text-white">
          <ScanText className="size-5" aria-hidden />
        </span>
        <p className="condensed text-3xl font-extrabold text-ink">Reading your document</p>
      </div>
      <p className="mt-3 text-ink-soft">
        Finding every requirement, then checking each quote against your text. This usually takes 10 to 20 seconds.
      </p>
      <div aria-hidden className="mt-6 space-y-3">
        {WIDTHS.map((width) => (
          <div key={width} className="relative h-3.5 overflow-hidden bg-form-deep" style={{ width }}>
            <div data-scan className="absolute inset-0 origin-left bg-highlight motion-reduce:hidden" />
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";

import { useRef, useState } from "react";
import { Check, ChevronDown, CircleCheck, Clock, TriangleAlert } from "lucide-react";
import { gsap, MOTION_OK, useGSAP } from "@/lib/motion";
import type { ResultItem } from "@/lib/schemas";

type Props = {
  item: ResultItem;
  done: boolean;
  onToggle: (id: string) => void;
};

export function ChecklistItem({ item, done, onToggle }: Props) {
  const [open, setOpen] = useState(false);
  const rowRef = useRef<HTMLLIElement>(null);
  const evidenceRef = useRef<HTMLDivElement>(null);
  const wasDone = useRef(done);
  const panelId = `${item.id}-evidence`;

  // Ticking answers the user: the box pops and a line is drawn through the words.
  useGSAP(
    () => {
      const justTicked = done && !wasDone.current;
      wasDone.current = done;
      if (!justTicked) return;
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.fromTo("[data-box]", { scale: 0.7 }, { scale: 1, duration: 0.35, ease: "back.out(3)" });
        gsap.fromTo(
          "[data-title]",
          { backgroundSize: "0% 1.5px" },
          { backgroundSize: "100% 1.5px", duration: 0.4, ease: "power2.out" },
        );
      });
      return () => mm.revert();
    },
    { dependencies: [done], scope: rowRef },
  );

  // The signature moment: when the evidence opens, a marker sweeps across the quote.
  useGSAP(
    () => {
      if (!open || !evidenceRef.current) return;
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.from(evidenceRef.current, { autoAlpha: 0, y: -4, duration: 0.2, ease: "power1.out" });
        gsap.fromTo(
          evidenceRef.current!.querySelector(".evidence-mark"),
          { backgroundSize: "0% 100%" },
          { backgroundSize: "100% 100%", duration: 0.6, delay: 0.08, ease: "power2.out" },
        );
      });
      return () => mm.revert();
    },
    { dependencies: [open], scope: rowRef },
  );

  return (
    <li ref={rowRef} data-reveal-item className="py-3.5">
      <div className="flex items-start gap-1">
        <button
          type="button"
          role="checkbox"
          aria-checked={done}
          aria-label={item.title}
          onClick={() => onToggle(item.id)}
          className="group/box -m-2.5 flex size-11 shrink-0 items-center justify-center rounded-lg focus-visible:outline-none"
        >
          <span
            data-box
            className={
              done
                ? "flex size-5.5 items-center justify-center rounded-[6px] bg-accent-ink text-white group-focus-visible/box:ring-4 group-focus-visible/box:ring-ring/30"
                : "flex size-5.5 items-center justify-center rounded-[6px] border-[1.5px] border-[#b9b1a2] bg-sheet group-hover/box:border-accent-ink group-focus-visible/box:ring-4 group-focus-visible/box:ring-ring/30"
            }
          >
            {done && <Check className="size-3.5" strokeWidth={3} aria-hidden />}
          </span>
        </button>

        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((o) => !o)}
          className="group flex min-h-6 flex-1 items-start justify-between gap-3 rounded-md text-left focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <span>
            <span
              data-title
              className={
                done ? "strike text-[1.0625rem] text-muted-ink" : "text-[1.0625rem] text-ink group-hover:text-accent-ink"
              }
            >
              {item.title}
            </span>
            {item.deadline && (
              <span className="mt-1 flex items-center gap-1 text-sm text-accent-ink">
                <Clock className="size-3.5" aria-hidden />
                {item.deadline}
              </span>
            )}
          </span>
          <span className="mt-0.5 flex shrink-0 items-center gap-1 text-sm text-muted-ink group-hover:text-accent-ink">
            {item.evidence === "not_found" && <TriangleAlert className="size-4 text-warn" aria-label="Quote not found" />}
            <span className="hidden sm:inline">{open ? "Hide source" : "Show source"}</span>
            <ChevronDown className={open ? "size-4 rotate-180 transition-transform" : "size-4 transition-transform"} aria-hidden />
          </span>
        </button>
      </div>

      {open && (
        <div ref={evidenceRef} id={panelId} className="mt-3 ml-9 space-y-2 border-l-2 border-highlight-strong pl-4">
          <blockquote className="font-serif text-[1.0625rem] leading-relaxed">
            <span className="evidence-mark">“{item.sourceExcerpt}”</span>
          </blockquote>
          {item.evidence === "found" ? (
            <p className="flex items-center gap-1.5 text-sm font-medium text-found">
              <CircleCheck className="size-4" aria-hidden />
              Found in document
            </p>
          ) : (
            <p className="flex items-center gap-1.5 text-sm font-medium text-warn">
              <TriangleAlert className="size-4" aria-hidden />
              Not found in document. Check the original.
            </p>
          )}
          <p className="text-sm text-muted-ink">{item.whyItMatters}</p>
        </div>
      )}
    </li>
  );
}

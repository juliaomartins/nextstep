"use client";

import { useRef, useState } from "react";
import { ChevronDown, Clock, Quote } from "lucide-react";
import { gsap, MOTION_OK, thump, useGSAP } from "@/lib/motion";
import type { ResultItem } from "@/lib/schemas";
import { Stamp } from "./stamp";

type Props = {
  item: ResultItem;
  done: boolean;
  onToggle: (id: string) => void;
  lang?: string;
};

/** Each row's stamp lands at a slightly different angle, like real ones do. */
function stampAngle(id: string) {
  const n = [...id].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return ((n % 7) - 3) * 1.5;
}

export function ChecklistItem({ item, done, onToggle, lang }: Props) {
  const [open, setOpen] = useState(false);
  const rowRef = useRef<HTMLLIElement>(null);
  const evidenceRef = useRef<HTMLDivElement>(null);
  const wasDone = useRef(done);
  const panelId = `${item.id}-evidence`;
  const found = item.evidence === "found";

  // Ticking answers the user: a ballpoint tick is drawn and a line goes through the words.
  useGSAP(
    () => {
      const justTicked = done && !wasDone.current;
      wasDone.current = done;
      if (!justTicked) return;
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.fromTo("[data-tick]", { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.3, ease: "power2.out" });
        gsap.fromTo(
          "[data-title]",
          { backgroundSize: "0% 2px" },
          { backgroundSize: "100% 2px", duration: 0.4, delay: 0.1, ease: "power2.out" },
        );
      });
      return () => mm.revert();
    },
    { dependencies: [done], scope: rowRef },
  );

  // Opening the source: the highlighter sweeps the quote, then the verdict is stamped.
  useGSAP(
    () => {
      if (!open || !evidenceRef.current) return;
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap
          .timeline()
          .from(evidenceRef.current, { autoAlpha: 0, y: -4, duration: 0.18, ease: "power1.out" })
          .fromTo(
            evidenceRef.current!.querySelector(".evidence-mark"),
            { backgroundSize: "0% 100%" },
            { backgroundSize: "100% 100%", duration: 0.55, ease: "power2.out" },
          )
          .add(thump(evidenceRef.current!.querySelector("[data-verdict]"), evidenceRef.current));
      });
      return () => mm.revert();
    },
    { dependencies: [open], scope: rowRef },
  );

  return (
    <li ref={rowRef} data-reveal-item className="py-3.5">
      <div className="flex items-start gap-2">
        <button
          type="button"
          role="checkbox"
          aria-checked={done}
          aria-label={item.title}
          onClick={() => onToggle(item.id)}
          className="group/box -m-2 flex size-11 shrink-0 items-center justify-center focus-visible:outline-none"
        >
          <span
            className={
              (done ? "border-ballpoint bg-ballpoint/8 " : "border-ink bg-sheet group-hover/box:border-ballpoint ") +
              "flex size-6 items-center justify-center border-2 group-focus-visible/box:ring-4 group-focus-visible/box:ring-ring/30"
            }
          >
            {done && (
              <svg viewBox="0 0 24 24" className="size-5 text-ballpoint" aria-hidden>
                <path
                  data-tick
                  d="M4 13.5 9.5 19 20 5"
                  pathLength={1}
                  strokeDasharray={1}
                  strokeDashoffset={0}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </span>
        </button>

        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((o) => !o)}
          className="group flex min-h-7 flex-1 items-start justify-between gap-3 text-left focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <span>
            <span
              data-title
              lang={lang}
              className={
                done
                  ? "strike text-[1.0625rem] text-muted-ink"
                  : "text-[1.0625rem] font-medium text-ink group-hover:text-ballpoint"
              }
            >
              {item.title}
            </span>
            {item.deadline && (
              <span className="mt-1 flex items-center gap-1 text-sm font-medium text-ballpoint">
                <Clock className="size-3.5" aria-hidden />
                {item.deadline}
              </span>
            )}
          </span>
          <span className="mt-0.5 flex shrink-0 items-center gap-3">
            <Stamp tone={found ? "found" : "check"} rotate={stampAngle(item.id)} className="text-[0.65rem]">
              {found ? "Found" : "Not found"}
            </Stamp>
            <span className="press flex items-center gap-1 text-sm font-medium text-ink-soft group-hover:text-ballpoint">
              <Quote className="size-4" aria-hidden />
              <span className="hidden sm:inline">{open ? "Hide source" : "Show source"}</span>
              <ChevronDown className={open ? "size-4 rotate-180 transition-transform" : "size-4 transition-transform"} aria-hidden />
            </span>
          </span>
        </button>
      </div>

      {open && (
        <div ref={evidenceRef} id={panelId} className="mt-3 ml-11 space-y-3 border-l-4 border-highlight bg-form/70 py-3 pr-4 pl-4">
          <blockquote className="text-[1.0625rem] leading-relaxed">
            <span className="evidence-mark">“{item.sourceExcerpt}”</span>
          </blockquote>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span data-verdict className="inline-block">
              <Stamp tone={found ? "found" : "check"} rotate={-4} className="text-xs">
                {found ? "Found in document" : "Not found in document. Check the original."}
              </Stamp>
            </span>
            <p lang={lang} className="text-sm text-ink-soft">
              {item.whyItMatters}
            </p>
          </div>
        </div>
      )}
    </li>
  );
}

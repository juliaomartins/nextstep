"use client";

import { useRef } from "react";
import { FileCheck2, SearchCheck, Sparkles, type LucideIcon } from "lucide-react";
import { gsap, MOTION_OK, thump, useGSAP } from "@/lib/motion";
import type { Group, ResultItem } from "@/lib/schemas";
import { ChecklistItem } from "./checklist-item";
import { Stamp } from "./stamp";

const GROUPS: { group: Group; label: string; hint: string; Icon: LucideIcon; iconClass: string }[] = [
  {
    group: "required",
    label: "Required",
    hint: "The document says these are a must.",
    Icon: FileCheck2,
    iconClass: "bg-ballpoint text-white",
  },
  {
    group: "recommended",
    label: "Recommended",
    hint: "Preferred or optional, according to the document.",
    Icon: Sparkles,
    iconClass: "bg-sheet text-ink",
  },
  {
    group: "needs_check",
    label: "Needs your check",
    hint: "Vague, conditional, or not found word for word.",
    Icon: SearchCheck,
    iconClass: "bg-stamp-red text-white",
  },
];

type Props = {
  items: ResultItem[];
  completedIds: Set<string>;
  onToggle: (id: string) => void;
  /** Language of the titles and reasons (quotes stay in the document's own language). */
  lang?: string;
};

/** When every required step is ticked, the slip gets a READY stamp. */
function RequiredDone() {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        thump(ref.current!.querySelector("[data-stamp]"), ref.current);
      });
      return () => mm.revert();
    },
    { scope: ref },
  );
  return (
    <div ref={ref} role="status" className="mt-4 flex flex-wrap items-center gap-4">
      <Stamp tone="ready" rotate={-7} className="text-2xl">
        Ready
      </Stamp>
      <span className="font-semibold text-stamp-green">Every required step is ticked off.</span>
    </div>
  );
}

export function Checklist({ items, completedIds, onToggle, lang }: Props) {
  return (
    <div className="space-y-10">
      {GROUPS.map(({ group, label, hint, Icon, iconClass }) => {
        const groupItems = items.filter((item) => item.group === group);
        if (groupItems.length === 0) return null;
        const done = groupItems.filter((item) => completedIds.has(item.id)).length;
        const headingId = `group-${group}`;

        return (
          <section key={group} aria-labelledby={headingId}>
            <div data-reveal className="flex items-end justify-between gap-4 border-b-2 border-ink pb-2">
              <div className="flex items-center gap-3">
                <span className={`flex size-9 shrink-0 items-center justify-center border-2 border-ink ${iconClass}`}>
                  <Icon className="size-5" aria-hidden />
                </span>
                <div>
                  <h3 id={headingId} className="condensed text-2xl leading-none font-extrabold text-ink">
                    {label}
                  </h3>
                  <p className="mt-1 text-sm text-muted-ink">{hint}</p>
                </div>
              </div>
              <p className="shrink-0 text-sm font-semibold text-ink-soft tabular-nums">
                {done} of {groupItems.length} done
              </p>
            </div>
            <ul className="divide-y divide-dashed divide-rule">
              {groupItems.map((item) => (
                <ChecklistItem key={item.id} item={item} done={completedIds.has(item.id)} onToggle={onToggle} lang={lang} />
              ))}
            </ul>
            {group === "required" && done === groupItems.length && <RequiredDone />}
          </section>
        );
      })}
    </div>
  );
}

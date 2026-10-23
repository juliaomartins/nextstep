"use client";

import { useRef } from "react";
import { PartyPopper, TriangleAlert } from "lucide-react";
import { gsap, MOTION_OK, useGSAP } from "@/lib/motion";
import type { Group, ResultItem } from "@/lib/schemas";
import { ChecklistItem } from "./checklist-item";

const GROUPS: { group: Group; label: string; hint: string }[] = [
  { group: "required", label: "Required", hint: "The document says these are a must." },
  { group: "recommended", label: "Recommended", hint: "Preferred or optional, according to the document." },
  { group: "needs_check", label: "Needs your check", hint: "Vague, conditional, or not found word for word." },
];

type Props = {
  items: ResultItem[];
  completedIds: Set<string>;
  onToggle: (id: string) => void;
};

function RequiredDone() {
  const ref = useRef<HTMLParagraphElement>(null);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.from(ref.current, { autoAlpha: 0, y: 6, duration: 0.3, ease: "power2.out" });
        gsap.fromTo(
          ref.current!.querySelector(".evidence-mark"),
          { backgroundSize: "0% 100%" },
          { backgroundSize: "100% 100%", duration: 0.6, delay: 0.1, ease: "power2.out" },
        );
      });
      return () => mm.revert();
    },
    { scope: ref },
  );
  return (
    <p ref={ref} role="status" className="mt-3 flex items-center gap-2 text-found">
      <PartyPopper className="size-4 shrink-0" aria-hidden />
      <span className="evidence-mark font-medium">Every required step is ticked off.</span>
    </p>
  );
}

export function Checklist({ items, completedIds, onToggle }: Props) {
  return (
    <div className="space-y-10">
      {GROUPS.map(({ group, label, hint }) => {
        const groupItems = items.filter((item) => item.group === group);
        if (groupItems.length === 0) return null;
        const done = groupItems.filter((item) => completedIds.has(item.id)).length;
        const headingId = `group-${group}`;

        return (
          <section key={group} aria-labelledby={headingId}>
            <div data-reveal className="flex items-baseline justify-between gap-4 border-b border-ink/15 pb-2">
              <div>
                <h3 id={headingId} className="flex items-center gap-2 font-serif text-xl font-semibold text-ink">
                  {group === "needs_check" && <TriangleAlert className="size-4 text-warn" aria-hidden />}
                  {label}
                </h3>
                <p className="text-sm text-muted-ink">{hint}</p>
              </div>
              <p className="shrink-0 text-sm text-muted-ink tabular-nums">
                {done} of {groupItems.length} done
              </p>
            </div>
            <ul className="divide-y divide-rule">
              {groupItems.map((item) => (
                <ChecklistItem key={item.id} item={item} done={completedIds.has(item.id)} onToggle={onToggle} />
              ))}
            </ul>
            {group === "required" && done === groupItems.length && <RequiredDone />}
          </section>
        );
      })}
    </div>
  );
}

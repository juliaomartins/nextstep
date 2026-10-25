"use client";

import { useRef } from "react";
import { CalendarX2, CornerDownRight, FileText, RotateCcw } from "lucide-react";
import { gsap, MOTION_OK, thump, useGSAP } from "@/lib/motion";
import { Stamp, type StampTone } from "./stamp";

/* A fictional job abroad, read by someone whose first language is Spanish: the product's own proof.
   Each original sentence is highlighted and stamped with what its wording makes it, the step appears in
   the reader's language, and a request for money is flagged, as NextStep does with payment requests. */
const STEP_LANGUAGE = { code: "es", label: "Español" };

const LINES: { quote: string; step: string; stamp: string; tone: StampTone; rotate: number }[] = [
  {
    quote: "Applicants must hold a valid work permit for the country.",
    step: "Confirma que tienes un permiso de trabajo válido.",
    stamp: "Required",
    tone: "required",
    rotate: -4,
  },
  {
    quote: "Please send your CV and a copy of your passport photo page.",
    step: "Envía tu CV y una copia de la página de foto de tu pasaporte.",
    stamp: "Required",
    tone: "required",
    rotate: 3,
  },
  {
    quote: "Basic English is an advantage.",
    step: "Menciona tu nivel básico de inglés si lo tienes.",
    stamp: "Recommended",
    tone: "recommended",
    rotate: -2,
  },
  {
    quote: "Pay a USD 150 processing fee to reserve your interview.",
    step: "Ten cuidado: piden dinero para una entrevista.",
    stamp: "Be careful",
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
          )
            .add(thump(`[data-demo='stamp-${i}']`, "[data-demo='sheet']"), "-=0.05")
            .fromTo(`[data-demo='step-${i}']`, { autoAlpha: 0, y: 4 }, { autoAlpha: 1, y: 0, duration: 0.3 }, "-=0.1");
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
            Warehouse assistant · work abroad
          </p>
          <p className="text-xs text-muted-ink">Fictional example · steps in {STEP_LANGUAGE.label}</p>
        </div>

        <ol className="divide-y divide-dashed divide-rule">
          {LINES.map((line, i) => (
            <li key={line.quote} className="flex items-start gap-4 px-5 py-4">
              <span aria-hidden className="condensed mt-0.5 w-5 shrink-0 text-sm font-bold text-muted-ink">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="flex-1">
                <p className="text-[0.975rem] leading-relaxed text-ink-soft">
                  <span data-demo={`mark-${i}`} className="evidence-mark">
                    {line.quote}
                  </span>
                </p>
                <p
                  data-demo={`step-${i}`}
                  data-demo-reveal
                  lang={STEP_LANGUAGE.code}
                  className="mt-1.5 flex items-start gap-1.5 text-sm font-semibold text-ballpoint"
                >
                  <CornerDownRight className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                  {line.step}
                </p>
              </div>
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

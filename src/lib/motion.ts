"use client";

import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

/** Every NextStep animation runs only inside this query, so reduced-motion users get none. */
export const MOTION_OK = "(prefers-reduced-motion: no-preference)";

/**
 * The signature stamp "thump": the stamp drops from above the paper, lands at its own
 * rotation, and the paper gives a tiny shake. Returns a timeline so callers can sequence it.
 */
export function thump(targets: gsap.TweenTarget, paper?: gsap.TweenTarget, stagger = 0) {
  const tl = gsap.timeline();
  tl.fromTo(
    targets,
    { autoAlpha: 0, scale: 1.9 },
    { autoAlpha: 1, scale: 1, duration: 0.24, ease: "power4.in", stagger },
  );
  if (paper) tl.fromTo(paper, { x: 0 }, { x: 1.5, duration: 0.05, repeat: 3, yoyo: true, ease: "none" }, "-=0.02");
  return tl;
}

export { gsap, useGSAP };

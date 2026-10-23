import type { CSSProperties, ReactNode } from "react";

export type StampTone = "found" | "check" | "required" | "recommended" | "ready" | "ink";

const TONES: Record<StampTone, string> = {
  found: "text-stamp-green",
  check: "text-stamp-red",
  required: "text-ballpoint",
  recommended: "text-ink-soft",
  ready: "text-stamp-green",
  ink: "text-ink",
};

type Props = {
  tone: StampTone;
  children: ReactNode;
  /** Degrees; real stamps never land perfectly straight. */
  rotate?: number;
  className?: string;
};

/** A rubber-stamp mark. GSAP "thumps" elements carrying `data-stamp` into place. */
export function Stamp({ tone, children, rotate = -3, className = "" }: Props) {
  const style: CSSProperties = { transform: `rotate(${rotate}deg)` };
  return (
    <span data-stamp className={`stamp ${TONES[tone]} ${className}`} style={style}>
      {children}
    </span>
  );
}

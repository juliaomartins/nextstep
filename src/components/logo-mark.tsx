/**
 * The NextStep mark: a highlighter-yellow stamped check on form ink.
 * Same artwork as src/app/icon.svg (the browser-tab and home-screen icon), so the brand reads as one.
 */
export function LogoMark({ className = "size-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden focusable="false">
      <rect width="64" height="64" rx="12" fill="var(--ink)" />
      <g transform="rotate(-8 32 32)">
        <rect x="12" y="15" width="40" height="34" rx="4" fill="none" stroke="var(--highlight)" strokeWidth="4.5" />
        <path
          d="M21 32.5 28.5 40 43 24"
          fill="none"
          stroke="var(--highlight)"
          strokeWidth="5.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

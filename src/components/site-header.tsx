import Link from "next/link";
import { UserRoundX } from "lucide-react";
import { LogoMark } from "./logo-mark";

export function SiteHeader() {
  return (
    <nav aria-label="NextStep" className="flex items-center justify-between border-b-2 border-ink py-4">
      <Link href="/" className="flex items-center gap-2.5 focus-visible:ring-4 focus-visible:ring-ring/30 focus-visible:outline-none">
        <LogoMark className="size-10" />
        <span className="condensed text-2xl font-black text-ink uppercase">NextStep</span>
      </Link>
      <span className="flex items-center gap-1.5 text-sm font-medium text-ink-soft">
        <UserRoundX className="size-4" aria-hidden />
        No account needed
      </span>
    </nav>
  );
}

import Link from "next/link";
import { FileLock2, LockKeyhole, PanelTop, Scale } from "lucide-react";
import { LogoMark } from "./logo-mark";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t-2 border-ink pt-10 pb-12">
      <div className="grid gap-8 sm:grid-cols-[1fr_1.5fr]">
        <div>
          <p className="flex items-center gap-3">
            <LogoMark className="size-11" />
            <span className="condensed text-3xl font-black text-ink uppercase">NextStep</span>
          </p>
          <p className="mt-2 text-ink-soft">From confusing documents to clear next steps.</p>
          <nav aria-label="More" className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold">
            <Link href="/extension" className="inline-flex items-center gap-1.5 text-ballpoint underline-offset-4 hover:underline">
              <PanelTop className="size-4" aria-hidden />
              Chrome extension
            </Link>
            <Link href="/privacy" className="inline-flex items-center gap-1.5 text-ballpoint underline-offset-4 hover:underline">
              <LockKeyhole className="size-4" aria-hidden />
              Privacy policy
            </Link>
          </nav>
        </div>
        <ul className="space-y-3 text-sm leading-relaxed text-ink-soft">
          <li className="flex gap-2.5">
            <FileLock2 className="mt-0.5 size-4 shrink-0 text-ballpoint" aria-hidden />
            <span>Files you upload are read in your browser and never uploaded.</span>
          </li>
          <li className="flex gap-2.5">
            <LockKeyhole className="mt-0.5 size-4 shrink-0 text-ballpoint" aria-hidden />
            <span>
              When you make a checklist, the text is sent to an AI service (OpenAI) to be analyzed. NextStep does not
              store your document, checklist progress stays in this browser, and no account is needed.
            </span>
          </li>
          <li className="flex gap-2.5">
            <Scale className="mt-0.5 size-4 shrink-0 text-ballpoint" aria-hidden />
            <span>
              NextStep is a reading aid, not legal, financial, or official advice. Always check important details
              against the original document.
            </span>
          </li>
        </ul>
      </div>
    </footer>
  );
}

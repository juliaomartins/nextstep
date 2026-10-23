import { FileLock2, LockKeyhole, Scale } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t-2 border-ink pt-10 pb-12">
      <div className="grid gap-8 sm:grid-cols-[1fr_1.5fr]">
        <div>
          <p className="condensed text-3xl font-black text-ink uppercase">NextStep</p>
          <p className="mt-1 text-ink-soft">From confusing documents to clear next steps.</p>
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

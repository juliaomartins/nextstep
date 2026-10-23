import { LockKeyhole } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-rule pt-10 pb-12">
      <div className="grid gap-8 sm:grid-cols-[1fr_1.4fr]">
        <div>
          <p className="display text-2xl font-semibold text-ink">NextStep</p>
          <p className="mt-1 text-muted-ink">From confusing documents to clear next steps.</p>
        </div>
        <div className="space-y-3 text-sm leading-relaxed text-ink-soft">
          <p className="flex gap-2">
            <LockKeyhole className="mt-0.5 size-4 shrink-0 text-accent-ink" aria-hidden />
            <span>
              Your text is sent to an AI service (OpenAI) to be analyzed. NextStep does not store your document,
              checklist progress stays in this browser, and no account is needed.
            </span>
          </p>
          <p>
            NextStep is a reading aid, not legal, financial, or official advice. Always check important details
            against the original document.
          </p>
        </div>
      </div>
    </footer>
  );
}

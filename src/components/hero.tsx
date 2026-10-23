import { HeroDemo } from "./hero-demo";

type Props = {
  onStart: () => void;
  onSample: () => void;
};

export function Hero({ onStart, onSample }: Props) {
  return (
    <section aria-labelledby="hero-heading" className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
      <div>
        <h1 id="hero-heading" className="display text-[2.75rem] leading-[1.05] font-semibold text-ink sm:text-6xl lg:text-[4.25rem]">
          Turn confusing documents into clear next steps.
        </h1>
        <p className="mt-6 max-w-[34rem] text-lg leading-relaxed text-ink-soft sm:text-xl">
          Paste the instructions you have been given: a job posting, an application notice, course requirements, or
          a form&apos;s small print. NextStep turns them into a checklist where every item is backed by a quote from
          the document, and anything unclear is flagged rather than guessed.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
          <button
            type="button"
            onClick={onStart}
            className="inline-flex h-12 items-center rounded-lg bg-accent-ink px-6 text-base font-semibold text-white shadow-[0_1px_0_rgba(255,255,255,0.15)_inset,0_8px_20px_-10px_rgba(31,58,95,0.7)] transition-colors hover:bg-accent-ink-deep focus-visible:ring-4 focus-visible:ring-ring/40 focus-visible:outline-none"
          >
            Paste a document
          </button>
          <button
            type="button"
            onClick={onSample}
            className="rounded-sm text-base font-medium text-accent-ink underline decoration-accent-ink/35 decoration-2 underline-offset-[6px] hover:decoration-accent-ink focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            Try a sample job posting
          </button>
        </div>
        <p className="mt-6 text-sm text-muted-ink">No account needed. Your document is not stored.</p>
      </div>

      <HeroDemo />
    </section>
  );
}

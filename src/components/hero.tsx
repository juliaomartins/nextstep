import { ClipboardPaste, FileSearch, LockKeyhole, ShieldCheck, UserRoundX } from "lucide-react";
import { HeroDemo } from "./hero-demo";

type Props = {
  onStart: () => void;
  onSample: () => void;
};

const PROMISES = [
  { Icon: ShieldCheck, text: "Every quote checked by code" },
  { Icon: LockKeyhole, text: "Your document is not stored" },
  { Icon: UserRoundX, text: "No account needed" },
];

export function Hero({ onStart, onSample }: Props) {
  return (
    <section aria-labelledby="hero-heading" className="grid items-center gap-14 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
      <div className="min-w-0">
        <h1
          id="hero-heading"
          className="condensed text-[clamp(2.25rem,10.5vw,3.4rem)] leading-[0.9] font-black text-ink uppercase sm:text-7xl lg:text-[5.6rem]"
        >
          Turn confusing documents into clear next steps.
        </h1>
        <p className="mt-7 max-w-[34rem] text-lg leading-relaxed text-ink-soft">
          Paste or upload the instructions you have been given: a job posting, an application notice, course
          requirements, or a form&apos;s small print. NextStep turns them into a checklist where every item is backed
          by a quote from the document, and anything unclear is flagged rather than guessed.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onStart}
            className="press inline-flex h-12 items-center gap-2 border-2 border-ink bg-ballpoint px-5 text-base font-bold text-white shadow-[4px_4px_0_0_var(--ink)] hover:bg-ballpoint-deep hover:shadow-[5px_5px_0_0_var(--ink)] focus-visible:ring-4 focus-visible:ring-ring/40 focus-visible:outline-none"
          >
            <ClipboardPaste className="size-5" aria-hidden />
            Paste a document
          </button>
          <button
            type="button"
            onClick={onSample}
            className="press inline-flex h-12 items-center gap-2 border-2 border-ink bg-sheet px-5 text-base font-bold text-ink shadow-[4px_4px_0_0_var(--ink)] hover:bg-highlight focus-visible:ring-4 focus-visible:ring-ring/40 focus-visible:outline-none"
          >
            <FileSearch className="size-5" aria-hidden />
            Try a sample job posting
          </button>
        </div>

        <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-soft">
          {PROMISES.map(({ Icon, text }) => (
            <li key={text} className="flex items-center gap-1.5">
              <Icon className="size-4 text-stamp-green" aria-hidden />
              {text}
            </li>
          ))}
        </ul>
      </div>

      <div className="min-w-0">
        <HeroDemo />
      </div>
    </section>
  );
}

import { ClipboardPaste, ListChecks, Stamp as StampIcon } from "lucide-react";

const STEPS = [
  {
    Icon: ClipboardPaste,
    title: "Hand over the document",
    body: "Paste it, or upload a PDF, a Word file, or a photo. Files are read in your browser and become text you can check.",
  },
  {
    Icon: ListChecks,
    title: "Get your checklist",
    body: "Every requirement becomes a step to tick off, sorted by what the document itself says: required, recommended, or unclear.",
  },
  {
    Icon: StampIcon,
    title: "See the proof",
    body: "Each step is stamped with the exact sentence it came from. If a quote can't be found in your text, it's stamped for you to check.",
  },
];

export function HowItWorks() {
  return (
    <section aria-labelledby="how-heading" className="border-2 border-ink bg-sheet">
      <h2
        id="how-heading"
        className="condensed border-b-2 border-ink px-5 py-2.5 text-sm font-bold tracking-wide text-ink uppercase"
      >
        How it works
      </h2>
      <ol className="grid divide-y-2 divide-ink sm:grid-cols-3 sm:divide-x-2 sm:divide-y-0">
        {STEPS.map(({ Icon, title, body }, i) => (
          <li key={title} className="p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <span
                aria-hidden
                className="condensed flex size-9 items-center justify-center border-2 border-ink text-lg font-black text-ink"
              >
                {i + 1}
              </span>
              <Icon className="size-6 text-ballpoint" aria-hidden />
            </div>
            <h3 className="condensed mt-4 text-2xl font-extrabold text-ink">{title}</h3>
            <p className="mt-2 leading-relaxed text-ink-soft">{body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

const STEPS = [
  {
    title: "Paste the document",
    body: "Copy the text of anything with instructions or requirements: a job posting, an application notice, a course handbook, a form.",
  },
  {
    title: "Get a checklist",
    body: "Each requirement becomes a step you can tick off, grouped by what the document itself says: required, recommended, or unclear.",
  },
  {
    title: "Check the source",
    body: "Open any step to see the exact sentence it came from. If a quote cannot be found in your text, NextStep tells you instead of hiding it.",
  },
];

export function HowItWorks() {
  return (
    <section aria-labelledby="how-heading" className="border-y border-rule py-12">
      <h2 id="how-heading" className="sr-only">
        How it works
      </h2>
      <ol className="grid gap-10 sm:grid-cols-3 sm:gap-8">
        {STEPS.map((step, i) => (
          <li key={step.title} className="flex gap-4 sm:block">
            <span aria-hidden className="display block text-4xl leading-none font-semibold text-accent-ink/25 sm:text-5xl">
              {i + 1}
            </span>
            <div className="sm:mt-4">
              <h3 className="font-serif text-xl font-semibold text-ink">{step.title}</h3>
              <p className="mt-2 leading-relaxed text-ink-soft">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

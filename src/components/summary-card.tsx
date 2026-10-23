export function SummaryCard({ summary }: { summary: string }) {
  return (
    <section aria-labelledby="summary-heading" data-reveal>
      <h3 id="summary-heading" className="text-sm font-semibold text-muted-ink">
        In short
      </h3>
      <p className="mt-2 max-w-prose font-serif text-xl leading-relaxed text-ink">{summary}</p>
    </section>
  );
}

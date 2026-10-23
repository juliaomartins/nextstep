import { NotebookText } from "lucide-react";

export function SummaryCard({ summary }: { summary: string }) {
  return (
    <section aria-labelledby="summary-heading" data-reveal>
      <h3 id="summary-heading" className="flex items-center gap-1.5 text-sm font-semibold text-muted-ink">
        <NotebookText className="size-4" aria-hidden />
        In short
      </h3>
      <p className="mt-2 max-w-prose text-xl leading-relaxed text-ink">{summary}</p>
    </section>
  );
}

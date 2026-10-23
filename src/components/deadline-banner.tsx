import { CalendarCheck2, CalendarClock, CalendarSearch, CalendarX2 } from "lucide-react";
import type { Deadline } from "@/lib/schemas";
import { Stamp } from "./stamp";

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${iso}T00:00:00Z`),
  );
}

function content(deadline: Deadline) {
  switch (deadline.status) {
    case "stated":
      return {
        Icon: CalendarCheck2,
        tone: "found" as const,
        stamp: "Stated in document",
        title: deadline.date ? formatDate(deadline.date) : (deadline.wording ?? "Deadline stated"),
        note: deadline.wording && deadline.date ? `“${deadline.wording}”` : null,
      };
    case "relative":
      return {
        Icon: CalendarClock,
        tone: "required" as const,
        stamp: "Depends on a step",
        title: deadline.wording ?? "Depends on another step",
        note: "No fixed date, so it counts from another step.",
      };
    case "unclear":
      return {
        Icon: CalendarSearch,
        tone: "check" as const,
        stamp: "Check this",
        title: "Deadline unclear",
        note: deadline.wording ? `The document says “${deadline.wording}”. Check the original.` : "Check the original.",
      };
    case "not_stated":
      return {
        Icon: CalendarX2,
        tone: "check" as const,
        stamp: "Not stated",
        title: "No deadline stated in this document",
        note: "Nothing was invented. Check with the organisation if timing matters.",
      };
  }
}

export function DeadlineBanner({ deadline }: { deadline: Deadline }) {
  const { Icon, tone, stamp, title, note } = content(deadline);
  return (
    <section
      aria-label="Deadline"
      data-reveal
      className="flex flex-wrap items-center justify-between gap-4 border-2 border-ink bg-form px-5 py-4"
    >
      <div className="flex items-center gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center border-2 border-ink bg-sheet">
          <Icon className="size-5 text-ink" aria-hidden />
        </span>
        <div>
          <p className="text-xs font-semibold tracking-wide text-muted-ink">Deadline</p>
          <p className="condensed text-2xl leading-tight font-extrabold text-ink">{title}</p>
          {note && <p className="text-sm text-ink-soft">{note}</p>}
        </div>
      </div>
      <Stamp tone={tone} rotate={-6} className="text-base">
        {stamp}
      </Stamp>
    </section>
  );
}

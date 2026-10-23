import { CalendarCheck, CalendarClock, CalendarX, CircleHelp } from "lucide-react";
import type { Deadline } from "@/lib/schemas";

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${iso}T00:00:00Z`),
  );
}

function content(deadline: Deadline) {
  switch (deadline.status) {
    case "stated":
      return {
        Icon: CalendarCheck,
        tone: "calm" as const,
        title: deadline.date ? formatDate(deadline.date) : (deadline.wording ?? "Deadline stated"),
        note: "Stated in the document",
      };
    case "relative":
      return {
        Icon: CalendarClock,
        tone: "calm" as const,
        title: deadline.wording ?? "Depends on another step",
        note: "Depends on another step, so no fixed date",
      };
    case "unclear":
      return {
        Icon: CircleHelp,
        tone: "warn" as const,
        title: "Deadline unclear",
        note: deadline.wording ? `The document says “${deadline.wording}”. Check the original.` : "Check the original.",
      };
    case "not_stated":
      return {
        Icon: CalendarX,
        tone: "warn" as const,
        title: "No deadline stated in this document",
        note: "Nothing was invented. Check with the organisation if timing matters.",
      };
  }
}

export function DeadlineBanner({ deadline }: { deadline: Deadline }) {
  const { Icon, tone, title, note } = content(deadline);
  return (
    <section
      aria-label="Deadline"
      data-reveal
      className={
        tone === "warn"
          ? "flex gap-3 rounded-lg bg-warn-bg px-4 py-3 text-warn"
          : "flex gap-3 rounded-lg border border-rule bg-paper px-4 py-3 text-accent-ink"
      }
    >
      <Icon className="mt-0.5 size-5 shrink-0" aria-hidden />
      <div>
        <p className="font-semibold">
          <span className="sr-only">Deadline: </span>
          {title}
        </p>
        <p className={tone === "warn" ? "text-sm text-warn" : "text-sm text-muted-ink"}>{note}</p>
      </div>
    </section>
  );
}

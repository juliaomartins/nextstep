import type { LucideIcon } from "lucide-react";

type Props = {
  number: number;
  id: string;
  title: string;
  Icon: LucideIcon;
  aside?: React.ReactNode;
};

/** A numbered form-section bar. The number sits outside the heading so its accessible name stays plain. */
export function SectionHeading({ number, id, title, Icon, aside }: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-ink bg-ink px-5 py-3 text-sheet">
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className="condensed flex size-8 items-center justify-center bg-sheet text-lg font-black text-ink"
        >
          {number}
        </span>
        <Icon className="size-5" aria-hidden />
        <h2 id={id} className="condensed text-2xl font-extrabold">
          {title}
        </h2>
      </div>
      {aside}
    </div>
  );
}

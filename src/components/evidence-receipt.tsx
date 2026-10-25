import { ShieldCheck } from "lucide-react";
import { evidenceReceipt } from "@/lib/evidence-receipt";
import type { ResultItem } from "@/lib/schemas";

/** The kernel, made visible: how many quotes the code found word for word in the document. */
export function EvidenceReceipt({ items }: { items: ResultItem[] }) {
  const receipt = evidenceReceipt(items);
  if (!receipt) return null;
  return (
    <p
      data-reveal
      className="flex items-start gap-2 border-l-4 border-stamp-green bg-stamp-green/5 px-4 py-2.5 text-sm font-semibold text-stamp-green"
    >
      <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>{receipt}</span>
    </p>
  );
}

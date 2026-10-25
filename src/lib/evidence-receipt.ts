import type { ResultItem } from "./schemas";

/**
 * One line saying what the code check found, so the proof is visible, not implied.
 * Shared by the results view and both downloads. Null when there are no steps.
 */
export function evidenceReceipt(items: Pick<ResultItem, "evidence">[]): string | null {
  const total = items.length;
  if (total === 0) return null;
  const found = items.filter((item) => item.evidence === "found").length;
  const missing = total - found;
  const receipt = `Checked by code: ${found} of ${total} ${total === 1 ? "quote" : "quotes"} found word for word in your document.`;
  return missing === 0 ? receipt : `${receipt} ${missing} moved to Needs your check.`;
}

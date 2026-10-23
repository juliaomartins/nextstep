import { z } from "zod";
import { AnalysisResultSchema } from "./schemas";
import { sha256Hex } from "./sha256";

export const STORAGE_KEY = "nextstep:v1";

const SavedStateSchema = z.object({
  version: z.literal(1),
  savedAt: z.string(),
  textHash: z.string(),
  result: AnalysisResultSchema,
  completedIds: z.array(z.string()),
});

/** Saved in this browser only. Holds the result and ticks, plus a hash of the text, never the text itself. */
export type SavedState = z.infer<typeof SavedStateSchema>;

function browserStorage(): Storage | undefined {
  try {
    return typeof window === "undefined" ? undefined : window.localStorage;
  } catch {
    return undefined;
  }
}

export function loadSaved(storage: Storage | undefined = browserStorage()): SavedState | null {
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = SavedStateSchema.safeParse(JSON.parse(raw));
    if (parsed.success) return parsed.data;
  } catch {
    // Corrupt JSON or storage unavailable: fall through and discard.
  }
  clearSaved(storage);
  return null;
}

export function save(state: SavedState, storage: Storage | undefined = browserStorage()): void {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or disabled: the checklist still works, it just won't survive a reload.
  }
}

export function clearSaved(storage: Storage | undefined = browserStorage()): void {
  try {
    storage?.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to clear if storage is unavailable.
  }
}

/** SHA-256 of the cleaned text, so an identical document can reuse its result without an AI call. */
export async function hashText(text: string): Promise<string> {
  // crypto.subtle only exists on secure pages (https:// or localhost); fall back to plain JS elsewhere.
  if (!globalThis.crypto?.subtle) return sha256Hex(text);
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

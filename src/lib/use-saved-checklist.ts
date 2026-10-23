"use client";

import { useCallback, useEffect, useState } from "react";
import type { AnalysisResult } from "./schemas";
import { clearSaved, loadSaved, save } from "./storage";

/**
 * The checklist currently on screen, kept in sync with this browser's saved copy:
 * restored after mount, saved on every change of result or ticks (only the result, ticks, and a text hash).
 * Shared by the home page and the /results page so both behave the same.
 */
export function useSavedChecklist() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [textHash, setTextHash] = useState<string | null>(null);

  // Restore after mount, so the server-rendered HTML matches the first browser render.
  useEffect(() => {
    const saved = loadSaved();
    if (!saved) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time sync from browser storage
    setResult(saved.result);
    setCompletedIds(new Set(saved.completedIds));
    setTextHash(saved.textHash);
  }, []);

  useEffect(() => {
    if (!result || !textHash) return;
    save({ version: 1, savedAt: new Date().toISOString(), textHash, result, completedIds: [...completedIds] });
  }, [result, completedIds, textHash]);

  /** Show a result. A null hash means "don't save it" (used when nothing actionable was found). */
  const show = useCallback((next: AnalysisResult, hash: string | null, ticked: string[] = []) => {
    setResult(next);
    setCompletedIds(new Set(ticked));
    setTextHash(hash);
  }, []);

  const toggle = useCallback((id: string) => {
    setCompletedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    clearSaved();
    setResult(null);
    setCompletedIds(new Set());
    setTextHash(null);
  }, []);

  return { result, completedIds, textHash, show, toggle, clear };
}

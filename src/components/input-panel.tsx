"use client";

import { forwardRef, useState } from "react";
import { FileCheck2, FileSearch, ListChecks, LoaderCircle, TextCursorInput } from "lucide-react";
import { MAX_CHARS } from "@/lib/schemas";
import { SectionHeading } from "./section-heading";
import { UploadControl } from "./upload-control";

type Props = {
  text: string;
  loading: boolean;
  reading: string | null;
  sourceNote: string | null;
  error: string | null;
  onTextChange: (text: string) => void;
  onSample: () => void;
  onAnalyze: () => void;
  onFile: (file: File) => void;
};

export const InputPanel = forwardRef<HTMLTextAreaElement, Props>(function InputPanel(
  { text, loading, reading, sourceNote, error, onTextChange, onSample, onAnalyze, onFile },
  textareaRef,
) {
  const [dragging, setDragging] = useState(false);
  const busy = loading || reading !== null;
  const count = text.trim().length;
  const nearLimit = count > MAX_CHARS * 0.8;
  const canAnalyze = count > 0 && !busy;

  return (
    <section aria-labelledby="input-heading" className="border-2 border-ink bg-sheet shadow-[6px_6px_0_0_var(--ink)]">
      <SectionHeading
        number={1}
        id="input-heading"
        title="Your document"
        Icon={TextCursorInput}
        aside={
          <button
            type="button"
            onClick={onSample}
            disabled={busy}
            className="press inline-flex items-center gap-1.5 text-sm font-semibold text-sheet underline decoration-sheet/40 underline-offset-4 hover:decoration-highlight focus-visible:ring-3 focus-visible:ring-highlight focus-visible:outline-none disabled:opacity-50"
          >
            <FileSearch className="size-4" aria-hidden />
            Use the sample job posting
          </button>
        }
      />

      <div className="space-y-4 p-5 sm:p-7">
        <p className="text-ink-soft">Paste the full text, or upload the file. The more NextStep can read, the better.</p>

        <UploadControl disabled={busy} reading={reading} onFile={onFile} />

        <label htmlFor="document" className="sr-only">
          Document text
        </label>
        <textarea
          ref={textareaRef}
          id="document"
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          onDragOver={(e) => {
            if (busy || !e.dataTransfer.types.includes("Files")) return;
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            setDragging(false);
            const file = e.dataTransfer.files[0];
            if (!file || busy) return;
            e.preventDefault();
            onFile(file);
          }}
          placeholder="For example, a job posting, an application notice, course requirements, or a form's instructions. You can also drop a PDF, Word file, or photo here."
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "input-error" : "input-hint"}
          spellCheck={false}
          className={
            (dragging ? "border-ballpoint bg-highlight/20 " : "border-ink bg-sheet ") +
            "paper-lines block h-72 w-full resize-y border-2 pt-3 pr-4 pb-3 pl-14 text-[1.0625rem] text-ink placeholder:text-muted-ink focus-visible:border-ballpoint focus-visible:ring-4 focus-visible:ring-ring/20 focus-visible:outline-none aria-invalid:border-stamp-red"
          }
        />

        {sourceNote && (
          <p className="flex items-start gap-2 border-l-4 border-ballpoint bg-ballpoint/5 px-3 py-2 text-sm text-ballpoint">
            <FileCheck2 className="mt-0.5 size-4 shrink-0" aria-hidden />
            {sourceNote}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
          <p
            id="input-hint"
            className={nearLimit ? "text-sm font-medium text-stamp-red tabular-nums" : "text-sm text-muted-ink tabular-nums"}
            aria-live="polite"
          >
            {count === 0
              ? "Nothing pasted yet."
              : `${count.toLocaleString("en-GB")} of ${MAX_CHARS.toLocaleString("en-GB")} characters`}
          </p>
          <button
            type="button"
            onClick={onAnalyze}
            disabled={!canAnalyze}
            className="press inline-flex h-12 items-center gap-2 border-2 border-ink bg-ballpoint px-6 text-base font-bold text-white shadow-[4px_4px_0_0_var(--ink)] hover:bg-ballpoint-deep hover:shadow-[5px_5px_0_0_var(--ink)] focus-visible:ring-4 focus-visible:ring-ring/40 focus-visible:outline-none disabled:cursor-not-allowed disabled:border-input disabled:bg-form-deep disabled:text-muted-ink disabled:shadow-none"
          >
            {loading ? (
              <LoaderCircle className="size-5 animate-spin motion-reduce:animate-none" aria-hidden />
            ) : (
              <ListChecks className="size-5" aria-hidden />
            )}
            {loading ? "Reading…" : "Make my checklist"}
          </button>
        </div>

        {error && (
          <p
            id="input-error"
            role="alert"
            className="border-2 border-stamp-red bg-stamp-red-bg px-4 py-3 text-sm font-semibold text-stamp-red"
          >
            {error}
          </p>
        )}
      </div>
    </section>
  );
});

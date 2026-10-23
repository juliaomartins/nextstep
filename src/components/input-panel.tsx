"use client";

import { forwardRef, useState } from "react";
import { FileText } from "lucide-react";
import { MAX_CHARS } from "@/lib/schemas";
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
    <section aria-labelledby="input-heading" className="rounded-2xl border border-rule bg-sheet p-5 sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div>
          <h2 id="input-heading" className="display text-3xl font-semibold text-ink">
            Your document
          </h2>
          <p className="mt-1 text-ink-soft">Paste the full text, or upload the file. The more NextStep can read, the better.</p>
        </div>
        <button
          type="button"
          onClick={onSample}
          disabled={busy}
          className="rounded-sm text-sm font-medium text-accent-ink underline decoration-accent-ink/35 underline-offset-4 hover:decoration-accent-ink focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:opacity-50"
        >
          Use the sample job posting
        </button>
      </div>

      <div className="mt-5">
        <UploadControl disabled={busy} reading={reading} onFile={onFile} />
      </div>

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
        placeholder="For example, a job posting, an application notice, course requirements, or a form's instructions. You can also drop a PDF or Word file here."
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? "input-error" : "input-hint"}
        spellCheck={false}
        className={
          (dragging ? "border-accent-ink ring-4 ring-ring/20 " : "border-input ") +
          "paper-lines mt-4 block h-72 w-full resize-y rounded-xl border bg-paper px-4 pt-3 pb-3 text-[1.0625rem] text-ink placeholder:text-muted-ink/80 focus-visible:border-accent-ink focus-visible:ring-4 focus-visible:ring-ring/15 focus-visible:outline-none aria-invalid:border-error"
        }
      />

      {sourceNote && (
        <p className="mt-3 flex items-start gap-2 text-sm text-accent-ink">
          <FileText className="mt-0.5 size-4 shrink-0" aria-hidden />
          {sourceNote}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <p id="input-hint" className={nearLimit ? "text-sm text-warn" : "text-sm text-muted-ink"} aria-live="polite">
          {count === 0
            ? "Nothing pasted yet."
            : `${count.toLocaleString("en-GB")} of ${MAX_CHARS.toLocaleString("en-GB")} characters`}
        </p>
        <button
          type="button"
          onClick={onAnalyze}
          disabled={!canAnalyze}
          className="inline-flex h-12 items-center rounded-lg bg-accent-ink px-7 text-base font-semibold text-white shadow-[0_8px_20px_-10px_rgba(31,58,95,0.7)] transition-colors hover:bg-accent-ink-deep focus-visible:ring-4 focus-visible:ring-ring/40 focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-[#c9cfd8] disabled:shadow-none"
        >
          {loading ? "Reading…" : "Make my checklist"}
        </button>
      </div>

      {error && (
        <p id="input-error" role="alert" className="mt-4 rounded-lg bg-[#fdecea] px-4 py-3 text-sm font-medium text-error">
          {error}
        </p>
      )}
    </section>
  );
});

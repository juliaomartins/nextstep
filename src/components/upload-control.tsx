"use client";

import { useRef } from "react";
import { FileImage, FileText, FileType2, LoaderCircle, Upload } from "lucide-react";

type Props = {
  disabled: boolean;
  reading: string | null;
  onFile: (file: File) => void;
};

export const ACCEPTED_FILES = ".pdf,.docx,.png,.jpg,.jpeg,.webp";

const KINDS = [
  { Icon: FileText, label: "PDF" },
  { Icon: FileType2, label: "Word" },
  { Icon: FileImage, label: "Photo" },
];

export function UploadControl({ disabled, reading, onFile }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-3 border-2 border-dashed border-input bg-form/60 px-4 py-3">
      <label
        htmlFor="upload"
        className="press inline-flex h-10 cursor-pointer items-center gap-2 border-2 border-ink bg-sheet px-4 text-sm font-bold text-ink shadow-[3px_3px_0_0_var(--ink)] hover:bg-highlight has-disabled:cursor-not-allowed has-disabled:opacity-50 has-focus-visible:ring-4 has-focus-visible:ring-ring/30"
      >
        <Upload className="size-4" aria-hidden />
        Upload a file
        <input
          ref={inputRef}
          id="upload"
          type="file"
          accept={ACCEPTED_FILES}
          disabled={disabled}
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFile(file);
            // Allow choosing the same file again later.
            if (inputRef.current) inputRef.current.value = "";
          }}
        />
      </label>

      {reading ? (
        <span role="status" className="inline-flex items-center gap-2 text-sm font-medium text-ballpoint">
          <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" aria-hidden />
          {reading}
        </span>
      ) : (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-soft">
          <ul className="flex items-center gap-3" aria-label="Accepted files">
            {KINDS.map(({ Icon, label }) => (
              <li key={label} className="flex items-center gap-1">
                <Icon className="size-4 text-ballpoint" aria-hidden />
                {label}
              </li>
            ))}
          </ul>
          <span className="text-muted-ink">Up to 5 MB, or drop it on the box.</span>
        </div>
      )}
    </div>
  );
}

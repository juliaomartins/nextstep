"use client";

import { useRef } from "react";
import { FileUp, LoaderCircle } from "lucide-react";

type Props = {
  disabled: boolean;
  reading: string | null;
  onFile: (file: File) => void;
};

export const ACCEPTED_FILES = ".pdf,.docx,.png,.jpg,.jpeg,.webp";

export function UploadControl({ disabled, reading, onFile }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <label
        htmlFor="upload"
        className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-input bg-sheet px-4 text-sm font-medium text-ink transition-colors hover:border-accent-ink hover:text-accent-ink has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50 has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-ring/20"
      >
        <FileUp className="size-4" aria-hidden />
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
        <span role="status" className="inline-flex items-center gap-2 text-sm text-accent-ink">
          <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" aria-hidden />
          {reading}
        </span>
      ) : (
        <span className="text-sm text-muted-ink">PDF, Word, or a photo of the document, up to 5 MB. You can also drop it on the box.</span>
      )}
    </div>
  );
}

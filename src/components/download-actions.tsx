"use client";

import { useState } from "react";
import { CircleCheck, FileDown, FileType2, LoaderCircle } from "lucide-react";
import { saveBlob } from "@/lib/download";
import { buildExportModel, exportFileName } from "@/lib/export-model";
import type { AnalysisResult } from "@/lib/schemas";

type Kind = "docx" | "pdf";

type Props = {
  result: AnalysisResult;
  completedIds: Set<string>;
};

/** Builds the Word or PDF file in the browser (libraries load only on click) and saves it to the device. */
export function DownloadActions({ result, completedIds }: Props) {
  const [busy, setBusy] = useState<Kind | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function download(kind: Kind) {
    setBusy(kind);
    setMessage(null);
    const madeAt = new Date();
    const fileName = exportFileName(madeAt, kind);
    try {
      const model = buildExportModel(result, completedIds, madeAt);
      let blob: Blob;
      if (kind === "docx") {
        const [{ Packer }, { createDocx }] = await Promise.all([import("docx"), import("@/lib/export-docx")]);
        blob = await Packer.toBlob(createDocx(model));
      } else {
        const [{ jsPDF }, { createPdf }] = await Promise.all([import("jspdf"), import("@/lib/export-pdf")]);
        blob = createPdf(model, jsPDF).output("blob");
      }
      saveBlob(blob, fileName);
      setMessage({ ok: true, text: `Saved ${fileName}` });
    } catch (error) {
      console.error("[download] failed:", error);
      setMessage({ ok: false, text: "We couldn't create the file. Please try again." });
    } finally {
      setBusy(null);
    }
  }

  const button =
    "press inline-flex h-11 items-center gap-2 border-2 border-ink bg-sheet px-4 text-sm font-bold text-ink shadow-[3px_3px_0_0_var(--ink)] hover:bg-highlight focus-visible:ring-4 focus-visible:ring-ring/30 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <section aria-labelledby="keep-heading" className="border-t-2 border-ink bg-form/60 px-5 py-5 sm:px-9">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className="condensed flex size-8 items-center justify-center bg-ink text-lg font-black text-sheet"
          >
            3
          </span>
          <div>
            <h3 id="keep-heading" className="condensed text-2xl leading-none font-extrabold text-ink">
              Keep a copy
            </h3>
            <p className="mt-1 text-sm text-ink-soft">Made on your device, with your ticks and every quote.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={() => download("docx")} disabled={busy !== null} className={button}>
            {busy === "docx" ? (
              <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" aria-hidden />
            ) : (
              <FileType2 className="size-4 text-ballpoint" aria-hidden />
            )}
            Download as Word
          </button>
          <button type="button" onClick={() => download("pdf")} disabled={busy !== null} className={button}>
            {busy === "pdf" ? (
              <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" aria-hidden />
            ) : (
              <FileDown className="size-4 text-stamp-red" aria-hidden />
            )}
            Download as PDF
          </button>
        </div>
      </div>
      <p
        aria-live="polite"
        className={message?.ok === false ? "mt-3 text-sm font-semibold text-stamp-red" : "mt-3 text-sm text-stamp-green"}
      >
        {message && (
          <span className="inline-flex items-center gap-1.5">
            {message.ok && <CircleCheck className="size-4" aria-hidden />}
            {message.text}
          </span>
        )}
      </p>
    </section>
  );
}

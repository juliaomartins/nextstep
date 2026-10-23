import { cleanText } from "./clean-text";

/**
 * Turns an uploaded file into plain text in the browser: no upload, no AI, no tokens.
 * The libraries are passed in (and loaded lazily by `readFile`), so the same extraction code
 * runs in the browser and in Node tests.
 */

export const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MIN_TEXT_CHARS = 20;

export type FileKind = "pdf" | "docx" | "image";
export type ReadFileErrorCode = "unsupported" | "too_large" | "no_text" | "read_failed" | "ocr_unavailable";

export class ReadFileError extends Error {
  constructor(public code: ReadFileErrorCode) {
    super(code);
    this.name = "ReadFileError";
  }
}

const KIND_BY_EXTENSION: Record<string, FileKind> = {
  pdf: "pdf",
  docx: "docx",
  png: "image",
  jpg: "image",
  jpeg: "image",
  webp: "image",
};

export function checkFile(file: { name: string; type: string; size: number }):
  | { ok: true; kind: FileKind }
  | { ok: false; code: "unsupported" | "too_large" } {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  const kind = KIND_BY_EXTENSION[extension];
  if (!kind) return { ok: false, code: "unsupported" };
  if (file.size > MAX_FILE_BYTES) return { ok: false, code: "too_large" };
  return { ok: true, kind };
}

/* ---------- Minimal shapes of the libraries we use ---------- */

// Text items carry `str`; marked-content items (structure markers) don't.
type PdfPage = { getTextContent(): Promise<{ items: object[] }> };
type PdfDocument = { numPages: number; getPage(n: number): Promise<PdfPage> };
export type PdfJs = {
  getDocument(src: { data: Uint8Array }): { promise: Promise<PdfDocument>; destroy(): Promise<void> };
};

export type Mammoth = {
  extractRawText(input: { arrayBuffer: ArrayBuffer; buffer: ArrayBuffer }): Promise<{ value: string }>;
};

function requireText(raw: string): string {
  const text = cleanText(raw);
  if (text.length < MIN_TEXT_CHARS) throw new ReadFileError("no_text");
  return text;
}

export async function extractPdfText(data: Uint8Array, pdfjs: PdfJs): Promise<string> {
  const task = pdfjs.getDocument({ data });
  try {
    let doc: PdfDocument;
    try {
      doc = await task.promise;
    } catch {
      throw new ReadFileError("read_failed");
    }
    const pages: string[] = [];
    for (let n = 1; n <= doc.numPages; n++) {
      const { items } = await (await doc.getPage(n)).getTextContent();
      pages.push(
        items
          .map((item) => ("str" in item ? `${item.str}${"hasEOL" in item && item.hasEOL ? "\n" : ""}` : ""))
          .join(""),
      );
    }
    return requireText(pages.join("\n\n"));
  } finally {
    await task.destroy();
  }
}

const MESSAGES: Record<ReadFileErrorCode, string> = {
  unsupported: "NextStep can read PDF, Word (.docx), and pictures (PNG, JPG, WebP). Try one of those, or paste the text.",
  too_large: "This file is too large (over 5 MB). Try a smaller file, or paste the relevant section.",
  no_text:
    "This PDF has no readable text. It's probably a scan. Upload a photo or screenshot of the pages instead, or paste the text.",
  read_failed:
    "We couldn't open this file. It may be damaged or password-protected. Try another file, or paste the text.",
  ocr_unavailable: "We couldn't load the picture reader. Check your internet connection, or paste the text.",
};

export function fileErrorMessage(error: unknown, kind?: FileKind): string {
  const code = error instanceof ReadFileError ? error.code : "read_failed";
  if (code === "no_text" && kind === "image") {
    return "We couldn't read any text in this picture. Try a sharper, well-lit photo, or paste the text.";
  }
  if (code === "no_text" && kind === "docx") {
    return "We couldn't find any text in this Word file. Check it isn't empty, or paste the text.";
  }
  return MESSAGES[code];
}

/** Browser entry point: checks the file, loads only the library it needs, and returns cleaned text. */
export async function readFile(
  file: File,
  onProgress?: (fraction: number) => void,
): Promise<{ text: string; kind: FileKind }> {
  const check = checkFile(file);
  if (!check.ok) throw new ReadFileError(check.code);
  const data = await file.arrayBuffer();

  switch (check.kind) {
    case "pdf": {
      // The legacy build supports older browsers; the standard build needs very recent JS features.
      const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
      // Copied from the installed pdfjs-dist by scripts/copy-pdf-worker.mjs, so versions always match.
      pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
      return { kind: "pdf", text: await extractPdfText(new Uint8Array(data), pdfjs) };
    }
    case "docx": {
      const mammoth = (await import("mammoth")).default;
      return { kind: "docx", text: await extractDocxText(data, mammoth) };
    }
    case "image": {
      // Tesseract downloads its English model from a CDN on first use; the picture itself stays here.
      const tesseract = (await import("tesseract.js")).default;
      return { kind: "image", text: await extractImageText(file, tesseract, onProgress) };
    }
  }
}

export async function extractDocxText(data: ArrayBuffer, mammoth: Mammoth): Promise<string> {
  let raw: string;
  try {
    // The browser build reads `arrayBuffer`, the Node build reads `buffer`; both accept an ArrayBuffer.
    raw = (await mammoth.extractRawText({ arrayBuffer: data, buffer: data })).value;
  } catch {
    throw new ReadFileError("read_failed");
  }
  return requireText(raw);
}

type OcrWorker = {
  recognize(image: Blob | Buffer): Promise<{ data: { text: string } }>;
  terminate(): Promise<unknown>;
};
export type Tesseract = {
  createWorker(
    langs: string,
    oem?: number,
    options?: { logger?: (message: { status: string; progress: number }) => void; cachePath?: string },
  ): Promise<OcrWorker>;
};

/** OCR in the browser (or Node in tests) with Tesseract: the picture never leaves the device. */
export async function extractImageText(
  image: Blob | Buffer,
  tesseract: Tesseract,
  onProgress?: (fraction: number) => void,
  options: { cachePath?: string } = {},
): Promise<string> {
  let reported = 0;
  let worker: OcrWorker;
  try {
    // Downloads the OCR engine and English model on first use; fails when offline or the CDN is blocked.
    worker = await tesseract.createWorker("eng", undefined, {
      ...options,
      // Only the recognition phase counts; model loading has its own 0..1 progress.
      logger: ({ status, progress }) => {
        if (status === "recognizing text" && progress > reported && progress < 1) {
          reported = progress;
          onProgress?.(progress);
        }
      },
    });
  } catch {
    throw new ReadFileError("ocr_unavailable");
  }
  try {
    const { data } = await worker.recognize(image);
    onProgress?.(1);
    return requireText(data.text);
  } catch (error) {
    if (error instanceof ReadFileError) throw error;
    throw new ReadFileError("read_failed");
  } finally {
    await worker.terminate();
  }
}

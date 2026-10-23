import { readFileSync } from "node:fs";
import mammoth from "mammoth";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import { describe, expect, test } from "vitest";
import { checkFile, extractDocxText, extractPdfText, MAX_FILE_BYTES, ReadFileError } from "@/lib/read-file";

function fixture(name: string): ArrayBuffer {
  const buf = readFileSync(new URL(`./fixtures/${name}`, import.meta.url));
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
}

const flat = (s: string) => s.replace(/\s+/g, " ").trim();

const KEY_SENTENCES = [
  "You must have at least 1 year of experience in an administrative, logistics, or customer-service role.",
  "A valid right to work in the country is required; we are unable to offer visa sponsorship.",
  "Experience with an inventory or order-management system is preferred.",
  "References may be requested at a later stage.",
];

describe("checkFile", () => {
  test.each([
    ["posting.pdf", "application/pdf", "pdf"],
    ["posting.PDF", "", "pdf"],
    ["posting.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "docx"],
    ["photo.jpg", "image/jpeg", "image"],
    ["photo.jpeg", "image/jpeg", "image"],
    ["screenshot.png", "image/png", "image"],
    ["scan.webp", "image/webp", "image"],
  ])("accepts %s as %s", (name, type, kind) => {
    expect(checkFile({ name, type, size: 1000 })).toEqual({ ok: true, kind });
  });

  test.each([["notes.txt"], ["old.doc"], ["sheet.xlsx"], ["animation.gif"]])("rejects %s as unsupported", (name) => {
    expect(checkFile({ name, type: "", size: 1000 })).toEqual({ ok: false, code: "unsupported" });
  });

  test("rejects files over 5 MB as too large", () => {
    expect(MAX_FILE_BYTES).toBe(5 * 1024 * 1024);
    expect(checkFile({ name: "big.pdf", type: "application/pdf", size: MAX_FILE_BYTES + 1 })).toEqual({
      ok: false,
      code: "too_large",
    });
  });
});

describe("extractPdfText", () => {
  test("reads every page of a text-based PDF", async () => {
    const text = await extractPdfText(new Uint8Array(fixture("sample.pdf")), pdfjs);
    for (const sentence of KEY_SENTENCES) expect(flat(text)).toContain(sentence);
  });

  test("returns cleaned text without runs of blank lines", async () => {
    const text = await extractPdfText(new Uint8Array(fixture("sample.pdf")), pdfjs);
    expect(text).not.toMatch(/\n{3,}/);
    expect(text).toBe(text.trim());
  });

  test("throws no_text for a PDF without a text layer (a scan)", async () => {
    await expect(extractPdfText(new Uint8Array(fixture("scanned.pdf")), pdfjs)).rejects.toMatchObject({
      code: "no_text",
    });
    await expect(extractPdfText(new Uint8Array(fixture("scanned.pdf")), pdfjs)).rejects.toBeInstanceOf(ReadFileError);
  });
});

describe("extractDocxText", () => {
  test("reads the text of a Word document", async () => {
    const text = await extractDocxText(fixture("sample.docx"), mammoth);
    for (const sentence of KEY_SENTENCES) expect(flat(text)).toContain(sentence);
  });

  test("throws read_failed for a file that is not really a .docx", async () => {
    await expect(extractDocxText(fixture("sample.pdf"), mammoth)).rejects.toMatchObject({ code: "read_failed" });
  });
});

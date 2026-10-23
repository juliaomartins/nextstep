import { mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import Tesseract from "tesseract.js";
import { describe, expect, test } from "vitest";
import { extractImageText } from "@/lib/read-file";

// Real OCR. The first run downloads the English model (a few MB); later runs use this cache.
const cachePath = join(process.cwd(), "node_modules", ".cache", "tesseract");
mkdirSync(cachePath, { recursive: true });

const fixture = (name: string) => readFileSync(join(process.cwd(), "tests", "fixtures", name));
const flat = (s: string) => s.toLowerCase().replace(/\s+/g, " ");

describe("extractImageText (real Tesseract OCR)", () => {
  test("reads the key sentences from a screenshot of the posting", { timeout: 120_000 }, async () => {
    const text = await extractImageText(fixture("sample.png"), Tesseract, undefined, { cachePath });
    for (const phrase of [
      "a valid right to work in the country is required",
      "please submit your cv in pdf format",
      "references may be requested at a later stage",
      "experience with an inventory or order-management system is preferred",
    ]) {
      expect(flat(text)).toContain(phrase);
    }
  });

  test("reports progress from 0 up to 1 while reading", { timeout: 120_000 }, async () => {
    const seen: number[] = [];
    await extractImageText(fixture("sample.png"), Tesseract, (fraction) => seen.push(fraction), { cachePath });
    expect(seen.length).toBeGreaterThan(1);
    expect(seen.at(-1)).toBe(1);
    expect(seen.every((value, i) => i === 0 || value >= seen[i - 1])).toBe(true);
  });

  test("throws no_text for a picture without text", { timeout: 120_000 }, async () => {
    await expect(extractImageText(fixture("blank.png"), Tesseract, undefined, { cachePath })).rejects.toMatchObject({
      code: "no_text",
    });
  });
});

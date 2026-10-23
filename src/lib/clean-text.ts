/**
 * Whitespace cleanup shared by the browser and the server. Pasted, PDF, and OCR text is
 * full of stray spaces and blank lines; removing them costs nothing and saves tokens.
 * The evidence check already ignores whitespace differences, so quotes still match.
 */
export function cleanText(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t\f\v ]+/g, " ")
    .replace(/^ +| +$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

import { describe, expect, test } from "vitest";
import { cleanText } from "@/lib/clean-text";

describe("cleanText", () => {
  test("turns Windows line endings into plain newlines", () => {
    expect(cleanText("one\r\ntwo\rthree")).toBe("one\ntwo\nthree");
  });

  test("collapses runs of spaces and tabs into one space", () => {
    expect(cleanText("Apply\t\tby   15 November")).toBe("Apply by 15 November");
  });

  test("removes spaces at the start and end of lines", () => {
    expect(cleanText("  Requirements  \n   - CV in PDF  ")).toBe("Requirements\n- CV in PDF");
  });

  test("collapses three or more newlines into one blank line", () => {
    expect(cleanText("Title\n\n\n\n\nBody\n \n \nEnd")).toBe("Title\n\nBody\n\nEnd");
  });

  test("keeps single blank lines between paragraphs", () => {
    expect(cleanText("First paragraph.\n\nSecond paragraph.")).toBe("First paragraph.\n\nSecond paragraph.");
  });
});

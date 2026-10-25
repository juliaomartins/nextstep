import { describe, expect, test } from "vitest";
import { toPdfSafe } from "@/lib/export-model";
import { DEFAULT_LANGUAGE, LANGUAGES } from "@/lib/languages";
import { languageRule } from "@/lib/prompt";

describe("checklist languages", () => {
  test("English is the default", () => {
    expect(DEFAULT_LANGUAGE).toBe("en");
    expect(LANGUAGES[0].code).toBe("en");
  });

  // The PDF download uses built-in fonts; a language whose letters they can't draw would print "?".
  test.each(LANGUAGES.map((l) => [l.label, l.sample]))("%s can be drawn in the PDF download", (label, sample) => {
    expect(toPdfSafe(label)).toBe(label);
    expect(toPdfSafe(sample)).toBe(sample);
  });
});

describe("languageRule", () => {
  test("asks for the chosen language and keeps quotes, deadline wording, and dates as written", () => {
    const rule = languageRule("es");
    expect(rule).toContain("Spanish");
    expect(rule).toMatch(/summary, every title, and every whyItMatters/);
    expect(rule).toMatch(/sourceExcerpt[\s\S]*exactly as written in the document/);
    expect(rule).toMatch(/never translate/i);
  });

  test("names English for the default", () => {
    expect(languageRule("en")).toContain("English");
  });
});

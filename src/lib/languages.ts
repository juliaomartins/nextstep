import { z } from "zod";

/**
 * Languages the checklist can be written in. Quotes are never translated: they stay in the document's own
 * words so the code can check them. Latin-script languages only, because the PDF download uses jsPDF's
 * built-in fonts; `sample` holds letters typical of each language and is tested against `toPdfSafe`.
 * A language is listed only after a real run shows the configured model writes it reliably (Tetun was
 * tried and dropped: gpt-4o-mini left most step titles in English).
 */
export const LANGUAGES = [
  { code: "en", name: "English", label: "English", sample: "Submit your CV by the deadline." },
  { code: "es", name: "Spanish", label: "Español", sample: "Envía tu currículum según la convocatoria: ¿Año? Señal." },
  { code: "pt", name: "Portuguese", label: "Português", sample: "Envie a candidatura até à data indicada; ação, informação." },
  { code: "fr", name: "French", label: "Français", sample: "Préparez une lettre de motivation ; œuvre, être, façon." },
  { code: "id", name: "Indonesian", label: "Bahasa Indonesia", sample: "Siapkan CV dalam format PDF sebelum batas waktu." },
  { code: "fil", name: "Filipino (Tagalog)", label: "Filipino", sample: "Ihanda ang iyong CV bago ang takdang petsa; Señora." },
  { code: "sw", name: "Swahili", label: "Kiswahili", sample: "Andaa wasifu wako kabla ya tarehe ya mwisho." },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]["code"];

export const DEFAULT_LANGUAGE: LanguageCode = "en";

export const LanguageSchema = z.enum(LANGUAGES.map((l) => l.code) as [LanguageCode, ...LanguageCode[]]);

export function languageName(code: LanguageCode): string {
  return LANGUAGES.find((l) => l.code === code)?.name ?? "English";
}

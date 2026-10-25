import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Privacy policy — NextStep",
  description: "How NextStep and the NextStep Chrome extension handle the text you analyze.",
};

const SECTIONS: { heading: string; body: string[] }[] = [
  {
    heading: "What NextStep handles",
    body: [
      "The text you choose to analyze: text you paste, text read from a file you upload, or the main text of a web page you analyze with the Chrome extension. You can review and edit it before anything is sent.",
      "When you use the extension, the title and address of the page you analyzed, so your checklist can say where it came from.",
    ],
  },
  {
    heading: "Where it goes",
    body: [
      "Files you upload are read in your browser and are never uploaded.",
      "When you press Make my checklist, the text is sent to the NextStep server, which sends it to OpenAI's API to create the checklist and returns the result. OpenAI processes it under its API data policies.",
      "When the extension opens your checklist on the NextStep results page, the checklist (not your text) is sent back to the NextStep server once, to confirm NextStep made it. It is not stored.",
      "The NextStep server does not store your text. Its logs record only technical details, such as the AI model used and the number of tokens, never your text.",
    ],
  },
  {
    heading: "What stays on your device",
    body: [
      "Your latest checklist, your ticks, and a fingerprint (hash) of the analyzed text are saved in your browser's local storage, so you can come back to them. The text itself is not saved.",
      "Clear saved data removes them at any time.",
      "Downloads (Word and PDF) are created on your device.",
    ],
  },
  {
    heading: "What NextStep does not do",
    body: [
      "No accounts, no advertising, no analytics or tracking, and no selling or sharing of your data.",
      "The extension only reads the page you are on, and only after you click Analyze this page. It never reads pages in the background or your browsing history.",
    ],
  },
  {
    heading: "A reading aid, not advice",
    body: [
      "NextStep helps you read a document; it doesn't replace it. It is not legal, financial, or official advice. Always check important details against the original document.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
      <SiteHeader />
      <main className="mx-auto mt-12 max-w-3xl pb-8 sm:mt-16">
        <h1 className="condensed text-5xl font-black text-ink uppercase">Privacy policy</h1>
        <p className="mt-3 text-muted-ink">Applies to the NextStep website and the NextStep Chrome extension. Last updated 25 October 2026.</p>
        <div className="mt-10 space-y-9">
          {SECTIONS.map(({ heading, body }) => (
            <section key={heading} aria-labelledby={heading}>
              <h2 id={heading} className="condensed text-2xl font-extrabold text-ink">
                {heading}
              </h2>
              <ul className="mt-3 space-y-2">
                {body.map((line) => (
                  <li key={line} className="flex gap-3 leading-relaxed text-ink-soft">
                    <span aria-hidden className="mt-2.5 size-1.5 shrink-0 bg-ballpoint" />
                    {line}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

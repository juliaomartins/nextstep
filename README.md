# NextStep

**From confusing documents to clear next steps.**

Paste a job posting, an application notice, course requirements, or a form's instructions. NextStep turns the document into a checklist in which **every item is backed by a quote from the document**, and anything unclear is flagged rather than guessed. No account needed.

Built for Devpost's *Build With AI: Basics* hackathon.

## What makes it different

AI summaries sound confident even when they are wrong. NextStep doesn't ask you to trust the model:

- **Every quote is checked by code.** After the AI answers, the server searches your text for each quoted excerpt. A quote that can't be found is labelled *Not found in document* and moved to **Needs your check**.
- **Deadlines are never invented.** A deadline is *Stated*, *Relative*, *Unclear*, or *Not stated*. A date whose quote can't be found, or that isn't a real calendar date, is downgraded to *Unclear*.
- **Groups follow the document's own wording:** *Required* (must, required), *Recommended* (preferred, a plus), and *Needs your check* (may, vague, or unsupported).
- **The document is data, not instructions.** Text such as "ignore previous instructions" is ignored, and anything that slipped through would still have to quote your document to count as *Found*.

## Features

- Paste a document, try the built-in fictional sample job posting, or **upload a PDF, a Word (.docx) file, or a photo or screenshot of the document**. Files are read in your browser (pictures with Tesseract OCR, no AI tokens) and become editable text before anything is analyzed.
- Summary, deadline banner, and a grouped checklist with progress counts.
- Open any step to see its source quote, highlighted.
- Ticks are saved in your browser and survive a reload. *Clear saved data* removes them.
- Analyzing the same text again reuses the saved result, with **no second AI call**.
- **Download your checklist as Word or PDF**, made on your device: summary, deadline, every step with its tick state, quote, and Found / Not found stamp. The Word file stays editable; the PDF uses the same stamp style as the app.
- Clear messages for text that is too short, too long, has nothing actionable, or when the AI service fails. Your text is always kept.

## Run it locally

You need **Node.js 22.13 or newer** (required by pdf.js; developed on Node 24) and an **OpenAI API key**.

```bash
git clone https://github.com/<your-account>/nextstep.git   # replace with this repository's URL
cd nextstep
npm install                  # also copies the pdf.js worker into public/
cp .env.example .env.local   # then fill in the values
npm run dev
```

Open **http://localhost:3000**. Use `localhost` rather than your network address: Next.js 16 blocks its development resources for other hostnames by default.

`.env.local`:

| Variable | Required | Meaning |
|---|---|---|
| `OPENAI_API_KEY` | yes | Your OpenAI key. Read only on the server, never sent to the browser. |
| `OPENAI_MODEL` | no | A model that supports structured output, for example `gpt-4o-mini`. Defaults to `gpt-4.1-mini`. |

## Tests and checks

```bash
npm test         # Vitest: evidence check, input limits, text cleanup, storage, file reading, OCR, and page behavior
                 # (the first run downloads Tesseract's English model into node_modules/.cache)
npm run lint
npm run build && npm start   # production build on http://localhost:3000
```

## How it works

```
Browser (Next.js page)                         Server (/api/analyze)                  OpenAI
paste or sample → Make my checklist ─ text ─▶  clean whitespace, check 200–20,000 chars
                                               prompt + <document> ────────────────▶ structured
                                               ◀──────────────────── JSON (Zod) ───── answer
                                               verify every quote against the text
◀────────── checklist with Found / Not found labels ─────
save result + ticks + a hash of the text in localStorage
```

- **Stack:** Next.js 16 (App Router, TypeScript), LangChain JS with `@langchain/openai`, Zod 4, Tailwind CSS 4, Lucide icons, GSAP for motion (skipped when your system asks for reduced motion).
- **The kernel:** [`src/lib/verify-evidence.ts`](src/lib/verify-evidence.ts), with tests in [`tests/verify-evidence.test.ts`](tests/verify-evidence.test.ts).

## Token use

OpenAI is used for exactly one thing: turning text into the checklist. Reading files and pictures, checking quotes, and making downloads use no tokens. With `gpt-4o-mini`, one analysis of a typical job posting uses roughly **1,300–1,700 tokens**. The server logs the real count of each call (`[analyze] … tokens: … in + … out`). Whitespace is trimmed before sending, and identical text reuses the saved result instead of calling the AI again.

## Privacy

- Uploaded files are read in your browser and never uploaded. For pictures, Tesseract downloads its English language model from a public CDN (jsDelivr) the first time; the picture itself stays on your device. Only the text you choose to analyze is sent to OpenAI. NextStep does not store your document.
- Checklist progress is saved only in your browser, as the result, your ticks, and a SHA-256 hash of the text (never the text itself).
- The server logs errors and token counts, never document text.

NextStep is a reading aid, not legal, financial, or official advice. Always check important details against the original document.

## How it was built

NextStep was planned and built during the *Build With AI: Basics* submission period with the [Devpost Learn Skill Pack](https://github.com/challengepost/learn-ai-basics) in Claude Code. The plan came first, through an AI interview, and the code followed it in small, tested steps:

- [`devpost/scope.md`](devpost/scope.md): the idea, the unique kernel, and the proof-of-concept boundary
- [`devpost/prd.md`](devpost/prd.md): what the product does, screen by screen, with checkable criteria
- [`devpost/spec.md`](devpost/spec.md): the technical blueprint
- [`devpost/checklist.md`](devpost/checklist.md): the build steps, and a *Revisions* log of every change of plan and why

## Credits and third-party code

All application code in this repository was written for this project. It builds on these open libraries and assets, used under their licenses:

- [Next.js](https://nextjs.org), [React](https://react.dev), [Tailwind CSS](https://tailwindcss.com), [Zod](https://zod.dev), [LangChain JS](https://js.langchain.com) (MIT); [Lucide](https://lucide.dev) icons (ISC)
- [GSAP](https://gsap.com) and `@gsap/react` for animation, under GSAP's [standard no-charge license](https://gsap.com/standard-license)
- [pdf.js](https://mozilla.github.io/pdf.js/) and [Tesseract.js](https://tesseract.projectnaptha.com) (Apache-2.0); [mammoth](https://github.com/mwilliamson/mammoth.js) (BSD-2-Clause); [docx](https://docx.js.org) and [jsPDF](https://github.com/parallax/jsPDF) (MIT)
- The [Archivo](https://fonts.google.com/specimen/Archivo) typeface (SIL Open Font License), served through `next/font`
- The OpenAI API, used with the developer's own key under OpenAI's terms

The sample job posting and every example in the app are fictional.

## License

[MIT](LICENSE)

# NextStep for Chrome

A small Chrome extension (Manifest V3, TypeScript) that turns the job posting or notice **you're reading** into a NextStep checklist. It uses the same `/api/analyze` route, the same LangChain + OpenAI workflow, and the same evidence check as the website. Every step is backed by a quote from the page, and nothing is invented.

```
Popup: "Analyze this page"  →  reads the page's main text (only after your click)
       →  you review and edit the text  →  "Make my checklist"
       →  POST /api/analyze on your NextStep server (the OpenAI key stays there)
       →  opens  <NextStep>/results  with your checklist: ticks, downloads, "Read from …"
```

## Build

From the project root:

```bash
npm install
npm run build:extension                                   # for http://localhost:3000
NEXTSTEP_URL=https://your-nextstep.example npm run build:extension   # for a deployed site (https only)
```

The output is `extension/dist/`. `NEXTSTEP_URL` decides which server the extension talks to, and it is also the **only** host the extension is allowed to reach.

## Load it in Chrome

1. Start NextStep: `npm run dev` (or `npm run build && npm start`) on http://localhost:3000.
2. Open `chrome://extensions`, turn on **Developer mode**, click **Load unpacked**, and choose `extension/dist`.
3. Pin **NextStep** from the puzzle-piece menu.

After rebuilding, click the reload icon on the extension's card.

## Try it

1. Open a job posting or application notice (any normal `https://` page).
2. Click the NextStep icon, then **Analyze this page**.
3. Check the text: remove anything private or unrelated. The counter shows the 20,000-character limit.
4. Click **Make my checklist**. A new tab opens on `/results` with the checklist.

Things to try on purpose:

| Situation | What you should see |
|---|---|
| `chrome://extensions`, the Chrome Web Store, a new tab | "NextStep can't read this kind of page…", with the button disabled |
| A page with no readable text | "This page has no readable text to analyze…" |
| NextStep server stopped | "We couldn't reach NextStep at http://localhost:3000…" (your text stays in the box) |
| Very long page | The counter turns red and the button is disabled until you trim it |
| Text too short, or an AI failure | The website's own message, shown in the popup |

## Permissions, and why

| Permission | Why |
|---|---|
| `activeTab` | Read the current tab **only after you click** the extension. No access to other tabs or browsing history. |
| `scripting` | Run the text extractor in that tab, once, on your click. |
| Host access to your NextStep server only | Send the reviewed text to its `/api/analyze` route. |

There is no background script, no `tabs` permission, no `<all_urls>`, no analytics, and nothing is read or sent without your click. The OpenAI API key never reaches the extension: it lives only in the server's `.env.local`.

## How it's built

| File | Role |
|---|---|
| `src/popup.html`, `src/popup.css` | The popup, in the website's "stamp office" style (same colour tokens) |
| `src/popup.ts` | The only file that uses Chrome APIs: tabs, scripting, and opening the results tab |
| `src/extract.ts` | Finds the main content (`main`, `article`, or the body) and skips navigation, sidebars, footers, cookie banners, ads, share bars, hidden elements, and link-heavy blocks (site menus written as plain lists). Chrome injects it by its source text, so it is fully self-contained. |
| `src/api.ts` | Supported-page check, the call to `/api/analyze` (validated with the app's Zod schema), clear error messages, and the hand-off |
| `../scripts/build-extension.mjs` | esbuild bundle + manifest (host permission derived from `NEXTSTEP_URL`) + icons |

The extension reuses the website's code rather than copying it: `cleanText`, the SHA-256 text hash, the result schema, and the results hand-off all come from `src/lib`.

**The hand-off to the website:** the result travels in the URL fragment (`/results#data=…`). Browsers never send the fragment to any server. The page validates it with the same schema as the API, saves it in your browser like any checklist (so the same page analyzed again keeps its ticks), and removes it from the address bar.

## Checks

```bash
npm run typecheck:extension   # strict TypeScript, with Chrome's types
npm test                      # includes tests/extension-*.test.ts and tests/page-results.test.tsx
```

## Download it from your deployed site

Every deploy builds the extension for that site and publishes it at `/downloads/nextstep-extension.zip`, offered on the site's `/extension` page with install steps (unzip → `chrome://extensions` → Developer mode → *Load unpacked*). To build the same zip locally: `NEXTSTEP_URL=https://your-site npm run pack:extension -- --public`.

## Publish to the Chrome Web Store

`NEXTSTEP_URL=https://your-site npm run pack:extension` builds the upload zip for your public site. The listing text, permission justifications, data-usage answers, and step-by-step publishing guide are in [`STORE.md`](STORE.md). The website links "Add to Chrome" to the listing once `NEXT_PUBLIC_EXTENSION_URL` is set.

## Limits

- Pages whose text is inside images, canvases, PDFs in Chrome's viewer, or cross-origin iframes can't be read. Use the website's upload (PDF, Word, photo) instead.
- The extension talks to one NextStep server, fixed at build time.
- Chrome's own pages and the Chrome Web Store can't be read by any extension.

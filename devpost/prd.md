---
doc: prd
status: approved
---

# NextStep — Product Requirements

NextStep turns a confusing document into a clear checklist in which every item is backed by a quote from the document. The proof of concept uses a **job posting** for **a job seeker**, but all wording and grouping are document-neutral so that students and people completing applications or administrative forms can use the same screen.
Source: `scope.md > Who It's For`, `scope.md > The Unique Kernel`.

## The Core Journey
Source: `scope.md > The Core Loop`, `scope.md > What "Working" Looks Like`.

1. The user opens NextStep and sees a headline, a one-sentence explanation, a large paste area, a **Use the sample job posting** link, and a **Make my checklist** button. A short privacy note sits under the button.
2. They paste a document (or click **Use the sample job posting** to fill the paste area with a sample job posting).
3. They click **Make my checklist**. The button is disabled and a progress message shows that the document is being read.
4. Results appear below the input, in this order: **Summary**, **Deadline**, then **the checklist**.
5. They click a checklist item. Its **source excerpt** opens directly under it, with a label saying whether the quote was found in the document.
6. They tick items as they complete them. A progress count updates for each group ("3 of 6 done").
7. They reload the page. The summary, deadline, checklist, and ticks are all still there.
8. When they're finished, or want to start over, they can analyze a new document or **Clear saved data**.

Success: an unfamiliar document becomes a checklist the user can check against the source, with nothing invented.

## Screens and Layout
**The home page**, in a single column on mobile and centered with a readable width on desktop (the build later added `/results`, `/extension`, and `/privacy`, described below):

- **Header:** NextStep name and tagline, *"From confusing documents to clear next steps."*
- **Input section:** paste area, **Use the sample job posting** link, **Make my checklist** button, privacy note.
- **Results section** (appears after an analysis):
  - **Summary card:** 2–3 sentences on what the document is and what it asks of the reader.
  - **Deadline banner:** the main deadline and its status (see *Deadline Handling*).
  - **Checklist:** three groups, *Required*, *Recommended*, and *Needs your check*, each with a progress count. Empty groups are hidden.
  - **Footer actions:** **Clear saved data** and a one-line reminder to check important details against the original document.

**`/results`** *(added with the browser extension)*: the same results section, under a **Read from** *page title · site* line. The extension opens it with the analysis. Without one, it shows the checklist saved in this browser, or an empty state with a **Make a checklist** link back home. It is kept out of search engines because every checklist is personal.

## Look and Feel
*Redesigned during the build at the learner's request: the first version (cream paper, big serif, rounded cards) read as generic "AI slop". The learner asked for something unique and unforgettable, with icons on every interaction, and approved the "stamp office" direction proposed by the agent.*

- **Concept, "the stamp office":** NextStep is the clerk who reads the small print for you and stamps every line it can prove. The look borrows from official forms, rubber stamps, and ballpoint pens, never from chat apps or dashboards.
- **Colour:** the cool grey-green of official form paper on a faint squared grid, black form ink, **ballpoint blue** for every action, **approval-stamp green** for *Found*, **rubber-stamp red** for *Needs your check / Not found*, and highlighter yellow only for quotes.
- **Typography:** one family (Archivo) in two voices. Condensed and heavy for form headers and the headline, normal width for reading.
- **Signature moment:** rubber stamps (REQUIRED, FOUND, CHECK THIS, NOT STATED, READY) **thump** onto the paper, slightly rotated, with a tiny shake. The hero shows a fictional form being highlighted and stamped line by line.
- **Form structure:** hard black borders with offset shadows like stacked paper, numbered form sections (1 Your document, 2 Your checklist), a ruled paste box with a red margin line, and a perforated tear-off edge on the results slip.
- **Icons on every interaction:** upload choices (PDF, Word, Photo), every button, each checklist group, deadline types, the promises under the hero, and the footer notes.
- **Motion answers the user:** a drawn ballpoint tick and strike-through when ticking, a highlighter sweep plus a verdict stamp when opening a source, a READY stamp when every required step is done, and a scanning highlighter while analyzing. Everything is skipped when reduced motion is set.
- **Landing content:** a hero with a headline, the product description, *Paste a document* and *Try a sample job posting* actions, and the live example; a three-step "how it works"; and a footer with the privacy notes and the "check the original" reminder.

## Features and Behavior

### Document Input
Source: `scope.md > The POC Boundary`.
- The user can paste text into the paste area, or click **Use the sample job posting** to load a built-in sample job posting.
- The sample posting is fictional and realistic. It contains clearly required items, some preferred items, at least one vague line (e.g. "references may be requested"), and **no application deadline**, so one sample run demonstrates every flag.
- [ ] Clicking **Use the sample job posting** fills the paste area with the sample posting.
- [ ] **Make my checklist** is disabled while the paste area is empty or an analysis is running.

### Analysis
- The document is sent for AI analysis. The result is only shown if it has the expected shape; otherwise the user sees an error (see *States and Boundaries*).
- The document is treated as content to analyze, **never as instructions**. Text inside it such as "ignore your instructions" has no effect on how NextStep behaves.
- [ ] Analyzing the sample posting shows a summary, a deadline banner, and items in at least the *Required* group within a reasonable wait, with a visible progress message during the wait.

### Summary
- [ ] A 2–3 sentence plain-language summary of what the document is and what it asks of the reader appears at the top of the results.

### Deadline Handling
Source: `scope.md > The Unique Kernel`.
- The banner shows the document's main deadline and one of four statuses:
  - **Stated:** an explicit date appears in the document (e.g. "Apply by 15 Nov 2026").
  - **Relative:** the timing depends on something else (e.g. "within 14 days of the interview"). It is shown as written, without being converted into a date.
  - **Unclear:** a date is hinted at but can't be pinned down (e.g. "applications close soon").
  - **Not stated:** *"No deadline stated in this document."*
- An item can also show its own deadline when the document gives one for that specific item.
- [ ] Analyzing the sample posting shows **"No deadline stated in this document"**, and no date appears anywhere.
- [ ] A pasted document with "Apply by 15 November 2026" shows that date with the status *Stated*.

### Checklist
- Every item is written as an **action the user can tick**. Conditions become checks (e.g. "3+ years of React experience" becomes "Confirm you have 3+ years of React experience").
- Items are grouped by **what the document's own wording says**:
  - **Required:** the document says *must*, *required*, *mandatory*, or presents it as essential.
  - **Recommended:** *preferred*, *nice to have*, *optional*, *a plus*.
  - **Needs your check:** vague, conditional, or unsupported items, including anything whose quote wasn't found in the document.
- Each group shows a progress count ("3 of 6 done").
- [ ] Each item has a checkbox, an action title, and (where one exists) its own deadline.
- [ ] Ticking or unticking an item updates that group's progress count immediately.
- [ ] Analyzing the sample posting places its vague line (e.g. references "may be requested") under **Needs your check**.

### Source Evidence
Source: `scope.md > The Unique Kernel`.
- Clicking an item expands it to show its **source excerpt** as a highlighted quote and a one-line note on why it matters. Clicking again collapses it.
- NextStep checks whether the excerpt actually appears in the pasted text (allowing for differences in spacing and capitalization):
  - **✓ Found in document:** the quote appears in the text.
  - **⚠ Not found in document. Check the original:** the quote doesn't appear. The item is moved to **Needs your check**.
- [ ] Every item in the sample result expands to show an excerpt with one of the two labels.
- [ ] Each excerpt labelled *Found* can be located word-for-word in the pasted text.

### Saved Progress
- The latest result (summary, deadline, checklist) and its ticks are saved **in this browser only**. The original pasted document is **not** saved.
- **Clear saved data** removes the saved result and ticks and returns the page to its empty state.
- [ ] After ticking two items and reloading, the same result appears with the same two items ticked.
- [ ] After **Clear saved data** and a reload, the page shows the empty input state.

### Privacy Note
- A short note near the paste area: the text is sent to an AI service to be analyzed, NextStep does not store the document, checklist progress stays in this browser, and no account is needed.
- [ ] The note sits directly under the **Make my checklist** button, so it is in view whenever the user is about to send text; the hero's *Your document is not stored* and *No account needed* badges are visible on first load without scrolling on desktop. *(Revised: the redesign added a hero above the paste area, so the full note moved next to the button.)*

### File Upload (PDF and Word)
Source: `scope.md > Added during the build (learner decision)`.
- Next to the paste box, an **Upload a file** control accepts `.pdf`, `.docx`, and pictures (see *Picture Upload*). Dragging a file onto the paste box does the same.
- The text is extracted **in the browser** and placed in the paste box, replacing what was there. A note says where it came from ("Text from *posting.pdf*. Check it before making your checklist."). Nothing is analyzed until the user presses the analyze button.
- Old `.doc` files, spreadsheets, and other formats aren't supported.
- [ ] Uploading a text-based PDF fills the paste box with its text, and the analysis works as with pasted text.
- [ ] Uploading a `.docx` fills the paste box with its text.
- [ ] Every *Found* excerpt from an uploaded file can be located word-for-word in the text shown in the paste box.

### Picture Upload (OCR)
Source: `scope.md > Added during the build (learner decision)`.
- The same upload control accepts `.png`, `.jpg`/`.jpeg`, and `.webp` photos or screenshots of a document.
- The text is read **in the browser** with OCR (no AI tokens, and the image is not sent anywhere). A progress message shows while it reads ("Reading the picture… 40%").
- The recognized text goes into the paste box with a note: "Text read from your picture. OCR can make mistakes, so check names, dates, and numbers before making your checklist."
- [ ] Uploading a clear screenshot of the sample posting fills the paste box with recognizably the same text.
- [ ] A progress message is visible while the picture is being read.

### Download Checklist
- Once a checklist exists, **Download as Word** and **Download as PDF** buttons appear with the results.
- The file is created **in the browser** and contains: the title "NextStep checklist", the date it was made, the summary, the deadline and its status, the three groups with each step's tick state (☑ / ☐), each step's quote and *Found* / *Not found* label, and the reminder to check the original document.
- [ ] *Download as Word* saves a `.docx` that opens in Word or Google Docs with all of the content above.
- [ ] *Download as PDF* saves a `.pdf` with the same content, readable and correctly paginated.
- [ ] Ticked steps show as ticked in both files.

### Token Efficiency
Source: `scope.md > Added during the build (learner decision)`.
- OpenAI is used for exactly one thing: turning text into the checklist. Reading files, OCR, the evidence check, and downloads use no AI.
- If the user analyzes text identical to the saved result's text, in the same checklist language, the saved result is reused without calling the AI, and its ticks are kept. A short note says "Same document as before, so your saved checklist was reused."
- Extra blank lines and spaces are trimmed before the text is sent.
- [ ] Analyzing the sample twice in a row makes only one AI call (visible in the server log), and the second result appears instantly.

### Browser Extension
Source: `scope.md > Added during the build (learner decision)`.
- A Chrome extension (toolbar button) for the page the user is reading. The popup shows the page's title and site, and one button: **Analyze this page**.
- Nothing is read until that click. Then the extension extracts the page's **main** text, skipping navigation, sidebars, footers, cookie banners, ads, share bars, and hidden elements.
- **Review before sending:** the text appears in an editable box with a character count against the 20,000 limit and a note that it will be sent to the NextStep server (which uses OpenAI) and not stored. **Make my checklist** sends it; **Start over** discards it.
- The checklist is made by the **same** analysis and evidence check as the website. Nothing is invented: requirements, preferred qualifications, documents to submit, deadlines, and next steps come only from the page's own words.
- When it's ready, the website's **/results** page opens in a new tab with the checklist.
- [ ] On a job posting, *Analyze this page* fills the review box with the posting and none of the site's navigation, cookie banner, ads, sidebar, or footer.
- [ ] *Make my checklist* opens `/results` with the checklist, a "Read from" line naming the page, and every *Found* quote present in the reviewed text.
- [ ] On `chrome://` pages, the Chrome Web Store, or a new tab, the popup explains it can't read the page and the button is disabled.
- [ ] With the NextStep server stopped, the popup says it couldn't reach NextStep at its address, and the text stays in the box.

### Results Page
- Opened by the extension with the analysis in the URL fragment, which never reaches any server. It validates the data, saves it like any checklist (ticks, downloads, and "same document" reuse all work), and removes it from the address bar.
- [ ] After opening from the extension, the address bar shows plain `/results`, and a reload still shows the checklist (restored from this browser).
- [ ] The same page analyzed again keeps the ticks already saved for it.
- [ ] A broken or tampered link shows *"This link doesn't contain a valid checklist."* and leaves the saved checklist alone.
- *Added after the second judge-style review:* the checklist in a link is shown only after the NextStep server confirms it sealed it, unchanged. A hand-made or edited link, or one opened while offline, shows *"NextStep couldn't confirm it made this checklist."* and nothing is shown or saved.
- [ ] A link whose checklist was edited (for example a changed step or evidence label) is refused, and the saved checklist is untouched.

### Extension Recommendation
- On a **first visit in a desktop Chromium browser** (Chrome, Edge, Brave), a slim band under the header offers **Add to Chrome** (the Chrome Web Store listing once published, otherwise the `/extension` page) or **Use it here** (scrolls to the paste box). A close button dismisses it. Any choice is remembered in this browser, so it appears once.
- It never shows on phones or in browsers that can't install Chrome extensions; those visitors just use the website.
- [ ] A first visit in desktop Chrome shows the band. After *Use it here*, *Add to Chrome*, or closing it, a reload doesn't show it again.
- [ ] Firefox and Chrome on Android never show it.

### Extension and Privacy Pages
- `/extension`: what the extension does in three steps, what it can access and why, and an *Add to Chrome* button once the store listing exists (until then, "Coming to the Chrome Web Store").
- `/privacy`: the privacy policy for the website and the extension (required by the Chrome Web Store): what is handled, where it goes, what stays on the device, and what NextStep never does.
- Both are linked from the footer.

### Evidence Receipt
Source: `scope.md > The Unique Kernel`, `scope.md > Added during the build (learner decision)`.
- Under the summary, one line states what the code check found: *Checked by code: 10 of 10 quotes found word for word in your document.* If some were not found: *Checked by code: 8 of 10 quotes found word for word in your document. 2 moved to Needs your check.*
- No receipt when there are no steps.
- The Word and PDF downloads carry the same line.
- [ ] A result where every quote is found shows "N of N"; a result with a missing quote shows the found count and how many moved to *Needs your check*.
- [ ] The downloaded Word and PDF files contain the receipt line.

### Second Sample Document
Source: `scope.md > Added during the build (learner decision)`.
- Next to **Use the sample job posting**, an **or a scholarship notice** link fills the paste box with a fictional scholarship application notice: documents to submit, an eligibility condition, a conditional interview, and a stated closing date.
- [ ] Clicking it fills the paste box; the checklist shows a *Stated* deadline with its quote.

### Checklist Language
Source: `scope.md > Who It's For`, `scope.md > Added during the build (learner decision)`.
- A **Checklist language** choice next to **Make my checklist**: English (default), Español, Português, Français, Bahasa Indonesia, Filipino, and Kiswahili. *(Tetun was planned and dropped after real runs: the model left most step titles in English.)*
- The summary, step titles, and "why it matters" lines are written in the chosen language. Every quote and the deadline wording stay exactly as written in the document, in its own language, and are checked by code as before. The interface itself stays in English.
- The same text in the same language reuses the saved checklist; the same text in another language makes a new checklist.
- Downloads contain the chosen language's wording and the original quotes.
- Only languages written in the Latin alphabet are offered for now, so the PDF download can draw every character.
- [ ] Choosing Español and making a checklist from the English sample gives Spanish step titles and English quotes stamped *Found*.
- [ ] Making it again in Español reuses the saved checklist; switching to Português makes a new one.
- [ ] The Word and PDF downloads show the accented letters correctly.

## States and Boundaries
- **Unsupported file type:** *"NextStep can read PDF, Word (.docx), and pictures (PNG, JPG, WebP). Try one of those, or paste the text."*
- **File too large (over 5 MB):** *"This file is too large (over 5 MB). Try a smaller file, or paste the relevant section."*
- **PDF with no text inside (a scan):** *"This PDF has no readable text. It's probably a scan. Upload a photo or screenshot of the pages instead, or paste the text."*
- **Picture with no readable text:** *"We couldn't read any text in this picture. Try a sharper, well-lit photo, or paste the text."*
- **Reading a file or picture:** the upload control and analyze button are disabled, and a progress message shows.
- **Extension on an unsupported page** (Chrome's own pages, the Web Store, a new tab): *"NextStep can't read this kind of page…"*, with the button disabled.
- **Extension on a page with no readable text:** *"This page has no readable text to analyze…"*
- **Extension can't reach the server:** *"We couldn't reach NextStep at <address>. Check that it's running and that you're online…"* The text stays in the review box.
- **Extension text over the limit:** the counter turns red and *Make my checklist* is disabled until the text is trimmed.
- **Extension waiting for the analysis:** *"Making your checklist… this usually takes 10 to 20 seconds."* The box is read-only.
- **First use:** empty paste area, **Use the sample job posting** visible, no results section.
- **Analyzing:** the button is disabled and a progress message is shown. The paste area keeps its text.
- **Empty input:** **Make my checklist** can't be clicked.
- **Too short:** under roughly a sentence or two of text, the message is *"This looks too short to analyze. Paste the full document."*
- **Too long:** above the input limit (about 5–6 pages of text; exact number set in `4-spec`), the message says the document is too long and suggests pasting the relevant section.
- **Nothing actionable found:** e.g. a news article or a story. The message is *"We couldn't find any requirements or steps in this text."* No empty checklist is shown.
- **AI or network failure, or an unusable response:** a plain message such as *"We couldn't analyze this document right now. Please try again."* The pasted text is kept so the user can retry.
- **New analysis while a result is saved:** the new result **replaces** the old one (only one checklist at a time).
- **Return visit:** the saved result and ticks reappear. The paste area is empty because the document isn't stored.
- **Trust boundary:** results are a reading aid, not legal, financial, or official advice. The footer reminds users to check important details against the original.
- **Text that tries to instruct the AI (prompt injection):** it is ignored. Nothing quoted from it counts as evidence (stamped *Not found*), dates in it are never shown as a deadline, and a red warning says *"This text contains instructions aimed at AI tools… hidden instructions can be a sign of a scam."* The warning also appears in the Word and PDF downloads.
- **Off-task text** (questions to an assistant, requests for poems or essays): no steps, and a one-sentence description of what the text is. An off-task summary is replaced with *"NextStep couldn't write a reliable summary of this text…"*
- **Requests for passwords, PINs, bank details, or payment:** never shown as a normal requirement; listed under *Needs your check* as "Be careful: …".

## Product Decisions
- **Upload, OCR, and download added during the build** (learner decision, after the core loop worked). Every upload becomes visible, editable text first, so evidence is always checked against what the user can see.
- **OCR in the browser (Tesseract.js), not Hugging Face** (learner followed the agent's recommendation). It costs no tokens, needs no extra account or key, and the image never leaves the device.
- **OpenAI used only for the checklist itself** (learner priority: efficient token use).
- **A Chrome extension, reusing the existing API and AI workflow** (learner decision). The extension never holds the OpenAI key. It reads a page only after the user's click (`activeTab`), and the user reviews the text before anything is sent.
- **Evidence receipt, a scholarship sample, and the checklist language** (learner approved all three on 25 Oct, after an independent judge-style review scored Impact and Innovation lowest). The interface stays in English; only the checklist is translated, and quotes are never translated.
- **Results hand-off through the URL fragment** (agent's call, accepted with the build): no new server endpoint or storage is needed, and the fragment never reaches a server.
- **Job posting for the proof of concept, document-neutral design.** The learner chose a job posting as the example, while keeping the product useful for students and administrative documents. All labels avoid job-specific wording.
- **One checklist, not separate requirement and task lists.** The learner approved the agent's recommendation: it avoids duplication and keeps the evidence attached to the action.
- **Groups based on the document's own wording (Required / Recommended / Needs your check).** The learner approved this. It works across document types and demonstrates the kernel: the app sorts by what the text says, not by its own guess.
- **Evidence opens inline under each item.** The learner approved this. It works on mobile without a separate panel.
- **Deadline banner at the top, showing "not stated" when there is no deadline.** The learner approved this. It's the first thing people look for and the clearest demonstration of "flagged, not invented."
- **Visual direction proposed by the agent.** The learner asked the agent to propose it (see *Look and Feel*).
- **Assumption, confirm at review:** a new analysis replaces the saved checklist. Keeping several saved checklists is deferred.
- **Assumption, confirm at review:** the sample posting deliberately has no deadline, so the demo shows the "not stated" flag.

## What We're Building
- A home page with paste input, **Use the sample job posting**, and **Make my checklist**.
- AI analysis that returns a summary, a deadline with status, and a grouped checklist, and is only shown when correctly formed.
- Source excerpts on every item, checked against the pasted text, with *Found* / *Not found* labels.
- Checkboxes with progress counts per group.
- Saved result and ticks in this browser, plus **Clear saved data**.
- A privacy note, a trust reminder, and the error and empty states listed above.
- A layout that works on desktop and mobile.
- *Added during the build:* uploading PDF, Word, and pictures (OCR in the browser); downloading the checklist as Word or PDF; reusing the saved result for identical text.
- *Added during the build:* a Chrome extension (*Analyze this page* → review → checklist) and the website's `/results` page.
- *Added during the build:* an evidence receipt, a scholarship-notice sample, and the checklist in the reader's language with original quotes.

## Deferred From the POC
- **Editing item titles:** in the learner's original idea notes (kept outside this repo); deferred in scope to keep the first loop small.
- **Several saved checklists:** would need a list of saved results and switching between them. One at a time is enough to prove the idea.
- **Public deployment:** optional for this hackathon. Do it if time remains after the core loop works.

## Possible Later Enhancements
- Export the checklist as Markdown or copy it to the clipboard.
- More built-in samples (an administrative form). *(A scholarship notice was added during the build.)*
- The checklist language in the Chrome extension, and languages in non-Latin scripts (needs an embedded PDF font).
- Highlighting the excerpt inside the full original document.
- Dark mode.

## Non-Goals
- **Accounts, cloud sync, databases:** not needed to prove the kernel (scope cut).
- **Multi-agent orchestration, RAG / vector search:** a single document needs only a single analysis (scope cut).
- **OCR of scanned (image-only) PDFs:** uploading a photo or screenshot of the page covers it (scope cut). Pictures themselves are supported.
- **Hugging Face or a second AI provider:** rejected to keep one reliable structured-output model; browser OCR already avoids token costs (scope cut).
- **Calendar, reminders, payments, team features, dashboards:** product features, not proof of the idea (scope cut).
- **Background reading or automatic analysis by the extension:** it acts only on the current tab, only after a click, so it never reads pages the user didn't choose.
- **Authoritative advice:** NextStep helps people read a document; it doesn't replace it.

## Open Questions
- ~~**Exact input size limit**~~ Resolved: 200–20,000 characters (`spec.md > Input Limits`).
- ~~**Sample posting text**~~ Resolved: written in slice 1 (`src/lib/sample-posting.ts`); a scholarship notice was added in slice 9.

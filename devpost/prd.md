---
doc: prd
status: approved
---

# NextStep — Product Requirements

NextStep turns a confusing document into a clear checklist in which every item is backed by a quote from the document. The proof of concept uses a **job posting** for **a job seeker**, but all wording and grouping are document-neutral so that students and people completing applications or administrative forms can use the same screen.
Source: `scope.md > Who It's For`, `scope.md > The Unique Kernel`.

## The Core Journey
Source: `scope.md > The Core Loop`, `scope.md > What "Working" Looks Like`.

1. The user opens NextStep and sees a headline, a one-sentence explanation, a large paste area, a **Try a sample** link, and an **Analyze** button. A short privacy note sits under the paste area.
2. They paste a document (or click **Try a sample** to fill the paste area with a sample job posting).
3. They click **Analyze**. The button is disabled and a progress message shows that the document is being read.
4. Results appear below the input, in this order: **Summary**, **Deadline**, then **the checklist**.
5. They click a checklist item. Its **source excerpt** opens directly under it, with a label saying whether the quote was found in the document.
6. They tick items as they complete them. A progress count updates for each group ("3 of 6 done").
7. They reload the page. The summary, deadline, checklist, and ticks are all still there.
8. When they're finished, or want to start over, they can analyze a new document or **Clear saved data**.

Success: an unfamiliar document becomes a checklist the user can check against the source, with nothing invented.

## Screens and Layout
**One page**, in a single column on mobile and centered with a readable width on desktop:

- **Header:** NextStep name and tagline, *"From confusing documents to clear next steps."*
- **Input section:** paste area, **Try a sample** link, **Analyze** button, privacy note.
- **Results section** (appears after an analysis):
  - **Summary card:** 2–3 sentences on what the document is and what it asks of the reader.
  - **Deadline banner:** the main deadline and its status (see *Deadline Handling*).
  - **Checklist:** three groups, *Required*, *Recommended*, and *Needs your check*, each with a progress count. Empty groups are hidden.
  - **Footer actions:** **Clear saved data** and a one-line reminder to check important details against the original document.

There are no other screens.

## Look and Feel
*The learner asked the agent to propose the visual direction, building on `prd.md` (root) §11. This is the agent's proposal and becomes the direction when this PRD is approved.*

- **Overall feel:** calm, document-like, and trustworthy, like a well-organized notebook rather than a chatbot or a dashboard. No chat bubbles, no decorative charts, and no unnecessary animation.
- **Typography:** a confident **serif for headings** (it echoes "documents") paired with a clean, highly readable **sans-serif for body and UI**. Clear hierarchy, generous line height.
- **Color:** warm off-white "paper" background, near-black ink text, and **one deep ink-blue accent** for primary actions and focus. Status colors are used sparingly and always with text or an icon, never color alone: green for *found in document*, amber for *unclear / missing / needs your check*, and red only for errors.
- **Signature detail:** source excerpts look like **highlighted passages in a document**: a soft highlighter-yellow background behind the quoted text, set in quotation style. This makes the evidence kernel visible at a glance.
- **Components:** simple rounded cards, clear checkboxes with large tap targets, consistent icons, and visible keyboard focus.

## Features and Behavior

### Document Input
Source: `scope.md > The POC Boundary`.
- The user can paste text into the paste area, or click **Try a sample** to load a built-in sample job posting.
- The sample posting is fictional and realistic. It contains clearly required items, some preferred items, at least one vague line (e.g. "references may be requested"), and **no application deadline**, so one sample run demonstrates every flag.
- [ ] Clicking **Try a sample** fills the paste area with the sample posting.
- [ ] **Analyze** is disabled while the paste area is empty or an analysis is running.

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
- [ ] The note is visible on first load without scrolling on desktop.

## States and Boundaries
- **First use:** empty paste area, **Try a sample** visible, no results section.
- **Analyzing:** the button is disabled and a progress message is shown. The paste area keeps its text.
- **Empty input:** **Analyze** can't be clicked.
- **Too short:** under roughly a sentence or two of text, the message is *"This looks too short to analyze. Paste the full document."*
- **Too long:** above the input limit (about 5–6 pages of text; exact number set in `4-spec`), the message says the document is too long and suggests pasting the relevant section.
- **Nothing actionable found:** e.g. a recipe or a news article. The message is *"We couldn't find any requirements or steps in this text."* No empty checklist is shown.
- **AI or network failure, or an unusable response:** a plain message such as *"We couldn't analyze this document right now. Please try again."* The pasted text is kept so the user can retry.
- **New analysis while a result is saved:** the new result **replaces** the old one (only one checklist at a time).
- **Return visit:** the saved result and ticks reappear. The paste area is empty because the document isn't stored.
- **Trust boundary:** results are a reading aid, not legal, financial, or official advice. The footer reminds users to check important details against the original.

## Product Decisions
- **Job posting for the proof of concept, document-neutral design.** The learner chose a job posting as the example, while keeping the product useful for students and administrative documents. All labels avoid job-specific wording.
- **One checklist, not separate requirement and task lists.** The learner approved the agent's recommendation: it avoids duplication and keeps the evidence attached to the action.
- **Groups based on the document's own wording (Required / Recommended / Needs your check).** The learner approved this. It works across document types and demonstrates the kernel: the app sorts by what the text says, not by its own guess.
- **Evidence opens inline under each item.** The learner approved this. It works on mobile without a separate panel.
- **Deadline banner at the top, showing "not stated" when there is no deadline.** The learner approved this. It's the first thing people look for and the clearest demonstration of "flagged, not invented."
- **Visual direction proposed by the agent.** The learner asked the agent to propose it (see *Look and Feel*).
- **Assumption, confirm at review:** a new analysis replaces the saved checklist. Keeping several saved checklists is deferred.
- **Assumption, confirm at review:** the sample posting deliberately has no deadline, so the demo shows the "not stated" flag.

## What We're Building
- One page with paste input, **Try a sample**, and **Analyze**.
- AI analysis that returns a summary, a deadline with status, and a grouped checklist, and is only shown when correctly formed.
- Source excerpts on every item, checked against the pasted text, with *Found* / *Not found* labels.
- Checkboxes with progress counts per group.
- Saved result and ticks in this browser, plus **Clear saved data**.
- A privacy note, a trust reminder, and the error and empty states listed above.
- A layout that works on desktop and mobile.

## Deferred From the POC
- **Editing item titles:** in the original PRD (FR-08); deferred in scope to keep the first loop small.
- **Several saved checklists:** would need a list of saved results and switching between them. One at a time is enough to prove the idea.
- **PDF / file upload:** pasting text proves the kernel; file parsing adds its own failure cases.
- **Public deployment:** optional for this hackathon. Do it if time remains after the core loop works.

## Possible Later Enhancements
- Export the checklist as Markdown or copy it to the clipboard.
- More built-in samples (a university application notice, an administrative form).
- Highlighting the excerpt inside the full original document.
- Dark mode.

## Non-Goals
- **Accounts, cloud sync, databases:** not needed to prove the kernel (scope cut).
- **Multi-agent orchestration, RAG / vector search:** a single document needs only a single analysis (scope cut).
- **OCR for scanned documents:** a separate hard problem (scope cut).
- **Calendar, reminders, payments, team features, dashboards:** product features, not proof of the idea (scope cut).
- **Authoritative advice:** NextStep helps people read a document; it doesn't replace it.

## Open Questions
- **Exact input size limit:** decide in `4-spec` (does not block approval).
- **Sample posting text:** to be written during the build, following the description in *Document Input* (does not block approval).

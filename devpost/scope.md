---
doc: scope
status: approved
---

# NextStep

From confusing documents to clear next steps: paste a job posting and get a prioritized checklist in which every requirement is backed by a quote from the posting.

## The Unique Kernel
NextStep does more than summarize. **Every requirement it extracts links to an excerpt from the source text**, and anything it can't support is flagged instead of invented. That includes deadlines: they are labelled explicit, relative, ambiguous, or missing, and dates are never made up. The output is something you can check against the document, not something you have to take on trust.

## Who It's For
For the proof of concept: **a job seeker who has a long job posting in front of them.** They want to know what they actually need to do and send to apply, and by when. Today they reread the posting, pick out requirements by hand, and risk missing a required document or a deadline.

The wider vision stays open: application notices, academic requirements, and administrative documents should fit the same model later without a rewrite.

## The Core Loop
1. Paste a job posting.
2. Get a short summary, a prioritized checklist of requirements and tasks, and a deadline status.
3. Select a requirement to see the exact excerpt from the posting that supports it.
4. Tick off tasks as they're done. Progress is still there after a reload.

They come back to tick things off as they work through the application, or to paste the next posting.

## Inspiration & Identity
It should feel like a polished productivity app, not a chatbot. That means strong typography and hierarchy, a restrained color palette, consistent components, readable and accessible text, and no decorative dashboards or unnecessary animation. *(From the learner's original idea notes (kept outside this repo).)*

## Why This Matters to the Learner
Not shared beyond the product goal: *"Turn information overload into actionable progress."*

## What "Working" Looks Like
The learner opens the app, pastes a sample job posting, and clicks Analyze. A checklist appears with a summary, prioritized requirements, and a deadline status. They click a requirement and see the matching sentence from the posting. **The "oh, that's cool" moment:** a requirement that isn't clearly stated, or a deadline the posting never gives, is visibly flagged as uncertain or missing instead of being invented. They tick off two tasks, reload, and those tasks are still ticked.

This needs to be demonstrable in about a minute in the demo video, running locally or deployed.

## The POC Boundary
- Pasting text into a text area (no file upload).
- A sample job posting to load with one click, for first use and the demo.
- Server-side AI extraction into a fixed structure that the app validates before showing anything. The API key stays on the server.
- Requirements with source excerpts. An excerpt that can't be found in the pasted text is shown as unsupported.
- Deadline status (explicit / relative / ambiguous / missing) and uncertainty flags.
- A checklist with priorities. Tasks can be checked and unchecked.
- Checklist progress saved in the browser, plus a "clear saved data" action.
- Clear messages for empty or oversized input and for AI/API failures.
- A layout that works on desktop and mobile, and a short note on how the data is processed.

### Added during the build (learner decision)
The learner approved these after the core loop was working. They come **after** the original boundary is complete (slices 1–4), so a demo-ready app exists even if time runs short.
- **Upload a PDF or Word (.docx) file**: text extracted in the browser.
- **Upload a picture of a document**: OCR in the browser with Tesseract.js.
- **Every upload becomes text in the paste box first**, so the user can check or fix what was read before analyzing. Quotes are always verified against exactly that text, which protects the kernel.
- **Download the checklist as Word or PDF**: generated in the browser.
- **Efficient OpenAI token use**: OpenAI is used only for the one call that turns text into the checklist. Reading files, OCR, the evidence check, and downloads cost no tokens. Re-analyzing identical text reuses the saved result, and text is trimmed before sending.
- **A Chrome extension** (learner decision, late in the build): on a web page with a posting or notice, *Analyze this page* reads the main text only after the user's click. The user reviews and edits it, and the same API and evidence check produce the checklist on a new `/results` page of the website. It brings the kernel to where people actually read postings, with no copy-paste.

## Later
- Editing task titles *(from the learner's original idea notes (kept outside this repo); deferred to keep the first loop small. Bring it back if you want it in now)*.
- Export as Markdown and copy to clipboard.
- Public deployment on Vercel (optional for this hackathon; worth doing if time remains).
- Example walkthroughs for academic, application, and administrative documents.

## Explicitly Cut
- **Accounts, cloud sync, Supabase**: not needed to prove the kernel, and they cost hours.
- **Multi-agent orchestration, RAG/vector databases**: one well-instructed extraction call is enough for a single posting.
- **OCR of scanned (image-only) PDFs**: would mean rendering each PDF page to an image before OCR. Uploading a photo or screenshot of the page covers the need. *(Pictures are now in; see "Added during the build".)*
- **Hugging Face as an AI provider**: considered to save OpenAI tokens and rejected with the learner's agreement. One analysis costs a fraction of a cent, open models are less reliable at the strict structured output the kernel depends on, and browser OCR already avoids paying for image reading.
- **Calendar integrations, payments, team collaboration, dashboards**: product features, not proof of the idea.

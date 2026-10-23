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
It should feel like a polished productivity app, not a chatbot. That means strong typography and hierarchy, a restrained color palette, consistent components, readable and accessible text, and no decorative dashboards or unnecessary animation. *(From `prd.md` §11.)*

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

## Later
- Editing task titles *(FR-08 in `prd.md`; deferred to keep the first loop small. Bring it back if you want it in now)*.
- PDF upload.
- Export as Markdown and copy to clipboard.
- Public deployment on Vercel (optional for this hackathon; worth doing if time remains).
- Example walkthroughs for academic, application, and administrative documents.

## Explicitly Cut
- **Accounts, cloud sync, Supabase**: not needed to prove the kernel, and they cost hours.
- **Multi-agent orchestration, RAG/vector databases**: one well-instructed extraction call is enough for a single posting.
- **OCR for scanned documents**: a separate hard problem.
- **Calendar integrations, payments, team collaboration, dashboards**: product features, not proof of the idea.

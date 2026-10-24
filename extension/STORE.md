# Publishing NextStep to the Chrome Web Store

Everything Google asks for, ready to paste. A few steps need **you** (the account owner): creating the developer account, paying Google's one-time registration fee, and pressing *Submit*.

## Before you start

1. **Deploy the website** (e.g. Vercel) so it has a public `https://` address. A published extension can't use `localhost`. Every user's copy talks to that address.
2. **Check the site works there**: the sample analysis, `/results`, `/privacy`, and `/extension`.
3. **Protect your OpenAI budget**: set a monthly limit in your OpenAI account. A public extension means public traffic.

## Build the upload package

PowerShell:
```powershell
$env:NEXTSTEP_URL="https://YOUR-SITE.vercel.app"; npm run pack:extension
```
Git Bash:
```bash
NEXTSTEP_URL=https://YOUR-SITE.vercel.app npm run pack:extension
```
This creates `extension/nextstep-extension-0.1.0.zip`, with `manifest.json` at the zip's root, built for your site only. To publish an update later, raise `version` in `scripts/build-extension.mjs` and pack again.

## Create the listing (you)

1. Go to the **Chrome Web Store Developer Dashboard**, sign in with your Google account, and register as a developer (Google charges a one-time fee).
2. **New item** → upload the zip.
3. Fill in the tabs using the text below, then **Submit for review**. Review usually takes a few days, sometimes longer.
4. When it's approved, copy the listing URL into your site's environment variables as `NEXT_PUBLIC_EXTENSION_URL` (Vercel → Settings → Environment Variables) and redeploy. The website's "Add to Chrome" buttons then go straight to the store.

## Store listing text

**Name:** NextStep: checklist from this page

**Summary (≤ 132 characters):**
Turn the job posting or notice you're reading into a checklist where every step is backed by a quote from the page.

**Description:**
> Long job postings and official notices hide what you actually need to do. NextStep reads the page you're on, after you click, and turns it into a clear checklist: what's required, what's recommended, and what needs your check.
>
> Every step is stamped with the exact sentence it came from, so you can verify it. Anything NextStep can't find in the page is flagged, never invented. Deadlines are only shown when the page states them.
>
> How it works:
> 1. Open a job posting or notice and click the NextStep icon.
> 2. Check the page's text (remove anything private) and press Make my checklist.
> 3. Your checklist opens on the NextStep website, where you can tick steps off and download it as Word or PDF.
>
> Private by design: the page is read only when you click, you review the text before it's sent, there's no account, no tracking, and your text isn't stored.
>
> NextStep is a reading aid, not legal, financial, or official advice.

**Category:** Productivity
**Language:** English

**Graphics:**
- Icon: `extension/dist/icons/icon-128.png` (128×128)
- Screenshots (1280×800 or 640×400, at least one): the popup's *Check the text* view over a job posting, and the `/results` checklist with its stamps. Take them in Chrome at 1280×800, using the site's fictional sample or a public posting.

## Privacy practices tab

**Single purpose:**
Turn the web page the user is reading (a job posting or notice) into a checklist of requirements and next steps, each backed by a quote from the page.

**Permission justifications:**
| Permission | Justification |
|---|---|
| `activeTab` | Reads the current tab only after the user clicks the extension and presses *Analyze this page*. No access to other tabs or in the background. |
| `scripting` | Runs the text reader once on that tab, after the click, to collect the page's main text (menus, ads, and footers are skipped). |
| Host permission (your NextStep site only) | Sends the text the user reviewed and approved to the NextStep website's analysis endpoint, then opens the checklist there. |

**Remote code:** No. All code is bundled in the package.

**Data usage (what to declare):**
- **Website content**: yes. The page text the user chooses to analyze is sent to the NextStep server, which uses OpenAI's API to create the checklist. It is not stored.
- Not collected: personally identifiable information, health, financial, authentication information, personal communications, location, web history, user activity.
- Certify: not sold to third parties; not used or transferred for purposes unrelated to the single purpose; not used to determine creditworthiness or for lending.

**Privacy policy URL:** `https://YOUR-SITE.vercel.app/privacy`

**Website / homepage URL:** `https://YOUR-SITE.vercel.app/extension`

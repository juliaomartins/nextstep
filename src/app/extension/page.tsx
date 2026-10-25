import { existsSync } from "node:fs";
import { join } from "node:path";
import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardCheck, Download, LockKeyhole, MousePointerClick, PanelTop, ScanText, ShieldCheck } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "NextStep for Chrome",
  description:
    "The NextStep Chrome extension turns the job posting or notice you're reading into a checklist where every step is backed by a quote from the page.",
};

const STORE_URL = process.env.NEXT_PUBLIC_EXTENSION_URL;

// Built by scripts/prebuild.mjs during a deploy (for the site's own public address). Checked when the
// page is rendered at build time, so a local build without a public address simply shows no download.
const DOWNLOAD_HREF = "/downloads/nextstep-extension.zip";
const hasDownload = () => existsSync(join(process.cwd(), "public", "downloads", "nextstep-extension.zip"));

const INSTALL_STEPS = [
  "Download the zip and unzip it (right-click → Extract All).",
  "In Chrome, open chrome://extensions.",
  "Turn on Developer mode (top right).",
  "Click Load unpacked and choose the unzipped folder.",
  "Pin NextStep from the puzzle-piece menu, then open any job posting and click it.",
];

const STEPS = [
  { Icon: MousePointerClick, title: "Click the NextStep icon", body: "On any job posting or notice, then press Analyze this page." },
  {
    Icon: ScanText,
    title: "Check the text, choose a language",
    body: "Remove anything private, then pick the checklist language: English, Español, Português, Français, Bahasa Indonesia, Filipino, or Kiswahili.",
  },
  {
    Icon: ClipboardCheck,
    title: "Get your checklist",
    body: "Steps arrive in your language; quotes stay in the page's own words, each stamped Found by code. Nothing is invented.",
  },
  {
    Icon: ShieldCheck,
    title: "Spot the warning signs",
    body: "A posting that asks for money, passwords, or bank details gets a Be careful step instead of a normal one.",
  },
];

const PERMISSIONS = [
  ["Read the page you're on, after your click", "Only the current tab, only when you press Analyze this page. Never in the background."],
  ["Run its text reader on that page", "Once, to collect the main text: menus, ads, and footers are skipped."],
  ["Talk to the NextStep website", "To send the text you approved and open your checklist. Nothing else."],
];

export default function ExtensionPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
      <SiteHeader />
      <main className="mx-auto mt-12 max-w-3xl space-y-12 pb-8 sm:mt-16">
        <section>
          <h1 className="condensed text-5xl leading-[0.95] font-black text-ink uppercase sm:text-6xl">NextStep for Chrome</h1>
          <p className="mt-5 max-w-prose text-lg leading-relaxed text-ink-soft">
            Reading a job posting or an application notice in your browser? The extension turns it into the same
            evidence-checked checklist as this website, without copying and pasting.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            {STORE_URL ? (
              <a
                href={STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="press inline-flex h-12 items-center gap-2 border-2 border-ink bg-ballpoint px-5 font-bold text-white shadow-[4px_4px_0_0_var(--ink)] hover:bg-ballpoint-deep focus-visible:ring-4 focus-visible:ring-ring/40 focus-visible:outline-none"
              >
                <PanelTop className="size-5" aria-hidden />
                Add to Chrome
              </a>
            ) : (
              <p className="border-l-4 border-highlight bg-sheet px-4 py-3 text-ink-soft">
                <span className="font-bold text-ink">Coming to the Chrome Web Store.</span> Until then, developers can
                install it from the project&apos;s source code: see <code>extension/README.md</code> in the repository.
              </p>
            )}
            <Link
              href="/"
              className="press inline-flex h-12 items-center gap-2 border-2 border-ink bg-sheet px-5 font-bold text-ink hover:bg-highlight focus-visible:ring-4 focus-visible:ring-ring/40 focus-visible:outline-none"
            >
              <MousePointerClick className="size-5" aria-hidden />
              Use it on the website
            </Link>
          </div>
        </section>

        {hasDownload() && (
          <section aria-labelledby="download-heading" className="border-2 border-ink bg-sheet p-5 shadow-[6px_6px_0_0_var(--ink)] sm:p-7">
            <h2 id="download-heading" className="condensed flex items-center gap-2 text-3xl font-extrabold text-ink">
              <Download className="size-6 text-ballpoint" aria-hidden />
              Install it now
            </h2>
            <p className="mt-2 text-ink-soft">
              {STORE_URL
                ? "Prefer a manual install? Download it and add it yourself:"
                : "While the Chrome Web Store listing is in review, you can install it yourself in a minute:"}
            </p>
            <a
              href={DOWNLOAD_HREF}
              download
              className="press mt-5 inline-flex h-12 items-center gap-2 border-2 border-ink bg-ballpoint px-5 font-bold text-white shadow-[4px_4px_0_0_var(--ink)] hover:bg-ballpoint-deep focus-visible:ring-4 focus-visible:ring-ring/40 focus-visible:outline-none"
            >
              <Download className="size-5" aria-hidden />
              Download for Chrome (.zip)
            </a>
            <ol className="mt-6 space-y-2">
              {INSTALL_STEPS.map((step, i) => (
                <li key={step} className="flex gap-3 text-ink-soft">
                  <span
                    aria-hidden
                    className="condensed flex size-7 shrink-0 items-center justify-center border-2 border-ink text-sm font-black text-ink"
                  >
                    {i + 1}
                  </span>
                  <span className="pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
            <p className="mt-4 text-sm text-muted-ink">
              Chrome may remind you that a Developer-mode extension is on. That&apos;s normal for extensions installed
              this way.
            </p>
          </section>
        )}

        <section aria-labelledby="how-heading" className="border-2 border-ink bg-sheet">
          <h2 id="how-heading" className="condensed border-b-2 border-ink px-5 py-2.5 text-sm font-bold tracking-wide text-ink uppercase">
            How it works
          </h2>
          {/* The 2px gap over an ink background draws the ruled lines between the four steps. */}
          <ol className="grid gap-0.5 bg-ink sm:grid-cols-2">
            {STEPS.map(({ Icon, title, body }) => (
              <li key={title} className="bg-sheet p-5">
                <Icon className="size-6 text-ballpoint" aria-hidden />
                <h3 className="condensed mt-3 text-xl font-extrabold text-ink">{title}</h3>
                <p className="mt-1 text-ink-soft">{body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="permissions-heading">
          <h2 id="permissions-heading" className="condensed flex items-center gap-2 text-3xl font-extrabold text-ink">
            <ShieldCheck className="size-6 text-stamp-green" aria-hidden />
            What it can access, and why
          </h2>
          <ul className="mt-4 divide-y divide-dashed divide-rule border-y-2 border-ink">
            {PERMISSIONS.map(([what, why]) => (
              <li key={what} className="py-3">
                <p className="font-semibold text-ink">{what}</p>
                <p className="text-ink-soft">{why}</p>
              </li>
            ))}
          </ul>
          <p className="mt-4 flex items-start gap-2 text-sm text-ink-soft">
            <LockKeyhole className="mt-0.5 size-4 shrink-0 text-ballpoint" aria-hidden />
            <span>
              No account, no tracking, no history. Details are in the{" "}
              <Link href="/privacy" className="font-semibold text-ballpoint underline underline-offset-4">
                privacy policy
              </Link>
              .
            </span>
          </p>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

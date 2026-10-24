// Runs automatically before `npm run build` (npm's "prebuild" hook), including on Vercel.
// When the site has a public https address, it packs the Chrome extension for that address into
// public/downloads/nextstep-extension.zip, so the /extension page can offer it for download.
// It never fails the website's build: a problem here only means no download link this time.
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

// NEXTSTEP_URL wins if you set it in Vercel; otherwise use Vercel's own production domain.
const explicit = process.env.NEXTSTEP_URL;
const vercelDomain = process.env.VERCEL_PROJECT_PRODUCTION_URL;
const site = explicit?.startsWith("https://") ? explicit : vercelDomain ? `https://${vercelDomain}` : null;

if (!site) {
  console.log("[prebuild] No public https address (NEXTSTEP_URL or Vercel's production URL): skipping the extension download.");
  process.exit(0);
}

try {
  execFileSync(process.execPath, [fileURLToPath(new URL("pack-extension.mjs", import.meta.url)), "--public"], {
    stdio: "inherit",
    env: { ...process.env, NEXTSTEP_URL: site },
  });
} catch (error) {
  console.warn(`[prebuild] Couldn't pack the extension (${error.message}). The website build continues without the download.`);
}

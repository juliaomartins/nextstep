// Builds the NextStep Chrome extension (Manifest V3) into extension/dist.
// Usage:  npm run build:extension                     (talks to http://localhost:3000)
//         NEXTSTEP_URL=https://your-site npm run build:extension
import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createCanvas, Image } from "@napi-rs/canvas";
import { build } from "esbuild";

const root = new URL("../", import.meta.url);
const src = new URL("extension/src/", root);
const dist = new URL("extension/dist/", root);

// The extension may only talk to this one NextStep server (its host permission is derived from it).
let site;
try {
  site = new URL(process.env.NEXTSTEP_URL ?? "http://localhost:3000");
} catch {
  console.error(`NEXTSTEP_URL is not a valid URL: ${process.env.NEXTSTEP_URL}`);
  process.exit(1);
}
if (site.protocol !== "https:" && !["localhost", "127.0.0.1"].includes(site.hostname)) {
  console.error("NEXTSTEP_URL must use https:// (plain http is only allowed for localhost).");
  process.exit(1);
}

rmSync(dist, { recursive: true, force: true });
mkdirSync(new URL("icons/", dist), { recursive: true });

await build({
  entryPoints: [new URL("popup.ts", src).pathname.replace(/^\/([A-Za-z]:)/, "$1")],
  outfile: new URL("popup.js", dist).pathname.replace(/^\/([A-Za-z]:)/, "$1"),
  bundle: true,
  format: "iife",
  target: "chrome120",
  // Readable output: reviewers (and the Chrome Web Store) can see exactly what runs.
  minify: false,
  // No keepNames: extractMainText is injected by its source text and must stay self-contained.
  keepNames: false,
  define: { NEXTSTEP_URL: JSON.stringify(site.origin) },
  logLevel: "warning",
});

copyFileSync(new URL("popup.html", src), new URL("popup.html", dist));
copyFileSync(new URL("popup.css", src), new URL("popup.css", dist));

// Toolbar and store icons, rendered from the same artwork as the website's icon.
const svg = readFileSync(new URL("src/app/icon.svg", root));
const icons = {};
for (const size of [16, 32, 48, 128]) {
  const image = new Image();
  image.src = svg;
  const canvas = createCanvas(size, size);
  canvas.getContext("2d").drawImage(image, 0, 0, size, size);
  writeFileSync(new URL(`icons/icon-${size}.png`, dist), canvas.toBuffer("image/png"));
  icons[size] = `icons/icon-${size}.png`;
}

const manifest = {
  manifest_version: 3,
  name: "NextStep: checklist from this page",
  short_name: "NextStep",
  version: "0.2.0",
  description:
    "Turn the job posting or notice you're reading into a checklist, in your language, with every step backed by a quote from the page.",
  minimum_chrome_version: "120",
  action: { default_popup: "popup.html", default_title: "Analyze this page with NextStep", default_icon: icons },
  icons,
  // activeTab + scripting: the page is read only when the user clicks "Analyze this page".
  permissions: ["activeTab", "scripting"],
  // Only the NextStep server; needed so the popup can call its /api/analyze route.
  host_permissions: [`${site.origin}/*`],
};
writeFileSync(new URL("manifest.json", dist), `${JSON.stringify(manifest, null, 2)}\n`);

console.log(`Built extension/dist for ${site.origin}`);

// Packages the extension for the Chrome Web Store: builds it for your public NextStep site and zips
// extension/dist (manifest.json at the zip's root) into extension/nextstep-extension-<version>.zip.
// Usage: npm run pack:extension   (for the public site, https://getnextstep.vercel.app)
// Another public site: NEXTSTEP_URL=https://another-site npm run pack:extension
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import JSZip from "jszip";
import { PUBLIC_URL } from "./public-url.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const dist = join(root, "extension", "dist");

const site = process.env.NEXTSTEP_URL ?? PUBLIC_URL;
if (!site || !site.startsWith("https://")) {
  console.error(
    "Set NEXTSTEP_URL to your public NextStep site (https://…) first. A store extension can't use localhost: every user's copy talks to that address.",
  );
  process.exit(1);
}

execFileSync(process.execPath, [join(root, "scripts", "build-extension.mjs")], {
  stdio: "inherit",
  env: { ...process.env, NEXTSTEP_URL: site },
});

const zip = new JSZip();
const addFolder = (folder) => {
  for (const name of readdirSync(folder)) {
    const path = join(folder, name);
    if (statSync(path).isDirectory()) addFolder(path);
    else zip.file(relative(dist, path).replaceAll("\\", "/"), readFileSync(path));
  }
};
addFolder(dist);

const { version } = JSON.parse(readFileSync(join(dist, "manifest.json"), "utf8"));
const out = join(root, "extension", `nextstep-extension-${version}.zip`);
writeFileSync(out, await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
console.log(`\nStore package: ${relative(root, out)} (for ${new URL(site).origin})`);
console.log("Next: upload it in the Chrome Web Store Developer Dashboard. See extension/STORE.md.");

// --public: also publish it on the website as /downloads/nextstep-extension.zip (used by the deploy build).
if (process.argv.includes("--public")) {
  const downloads = join(root, "public", "downloads");
  mkdirSync(downloads, { recursive: true });
  copyFileSync(out, join(downloads, "nextstep-extension.zip"));
  console.log("Download copy: public/downloads/nextstep-extension.zip");
}

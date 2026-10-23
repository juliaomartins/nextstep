// Copies the legacy pdf.js worker (broad browser support) into public/ so the browser loads the exact version that is installed.
// Runs automatically after `npm install` (see "postinstall" in package.json).
import { copyFileSync, mkdirSync } from "node:fs";

mkdirSync(new URL("../public/", import.meta.url), { recursive: true });
copyFileSync(
  new URL("../node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs", import.meta.url),
  new URL("../public/pdf.worker.min.mjs", import.meta.url),
);
console.log("Copied pdf.worker.min.mjs to public/");

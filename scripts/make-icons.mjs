// Renders src/app/icon.svg into the raster icons browsers and phones still ask for:
// favicon.ico (32px PNG inside an ICO wrapper) and apple-icon.png (180px, home-screen icon).
// Run: node scripts/make-icons.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { createCanvas, Image } from "@napi-rs/canvas";

const svg = readFileSync(new URL("../src/app/icon.svg", import.meta.url));

function render(size) {
  const image = new Image();
  image.src = svg;
  const canvas = createCanvas(size, size);
  canvas.getContext("2d").drawImage(image, 0, 0, size, size);
  return canvas.toBuffer("image/png");
}

// ICO wrapper around one PNG image (supported by every current browser).
function ico(png, size) {
  const header = Buffer.alloc(22);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(1, 4); // one image
  header.writeUInt8(size, 6);
  header.writeUInt8(size, 7);
  header.writeUInt8(0, 8); // no palette
  header.writeUInt8(0, 9);
  header.writeUInt16LE(1, 10); // colour planes
  header.writeUInt16LE(32, 12); // bits per pixel
  header.writeUInt32LE(png.length, 14);
  header.writeUInt32LE(22, 18); // image data offset
  return Buffer.concat([header, png]);
}

writeFileSync(new URL("../src/app/favicon.ico", import.meta.url), ico(render(32), 32));
writeFileSync(new URL("../src/app/apple-icon.png", import.meta.url), render(180));
console.log("Wrote src/app/favicon.ico (32px) and src/app/apple-icon.png (180px)");

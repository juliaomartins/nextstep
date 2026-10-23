// Generates test fixtures from the fictional sample posting, so upload tests use real files
// without any personal documents. Run: node scripts/make-fixtures.mjs
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { Document, Packer, Paragraph } from "docx";
import { jsPDF } from "jspdf";

const OUT = new URL("../tests/fixtures/", import.meta.url);
mkdirSync(OUT, { recursive: true });

const source = readFileSync(new URL("../src/lib/sample-posting.ts", import.meta.url), "utf8");
const posting = source.slice(source.indexOf("`") + 1, source.lastIndexOf("`"));
const lines = posting.split("\n");

// Text-based PDF, wrapped to the page like a word-processor export, spilling onto a second page.
const pdf = new jsPDF({ unit: "pt", format: "a4" });
pdf.setFontSize(14);
let y = 60;
for (const line of lines) {
  for (const part of line === "" ? [""] : pdf.splitTextToSize(line, 470)) {
    if (y > 780) {
      pdf.addPage();
      y = 60;
    }
    pdf.text(part, 60, y);
    y += 22;
  }
}
writeFileSync(new URL("sample.pdf", OUT), Buffer.from(pdf.output("arraybuffer")));

// Word document, one paragraph per line.
const docx = new Document({ sections: [{ children: lines.map((text) => new Paragraph({ text })) }] });
writeFileSync(new URL("sample.docx", OUT), await Packer.toBuffer(docx));

// A "scan": a PDF with only drawn shapes and no text layer.
const scan = new jsPDF({ unit: "pt", format: "a4" });
scan.setFillColor(230, 230, 230);
for (let i = 0; i < 20; i++) scan.rect(60, 60 + i * 30, 400 - (i % 4) * 40, 12, "F");
writeFileSync(new URL("scanned.pdf", OUT), Buffer.from(scan.output("arraybuffer")));

console.log("Wrote sample.pdf, sample.docx, scanned.pdf to tests/fixtures/");

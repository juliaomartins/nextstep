import type { jsPDF as JsPdf } from "jspdf";
import { toPdfSafe, type ExportModel } from "./export-model";

type Rgb = [number, number, number];
const INK: Rgb = [21, 23, 28];
const MUTED: Rgb = [95, 102, 110];
const RULE: Rgb = [203, 211, 202];
const BALLPOINT: Rgb = [35, 56, 196];
const GREEN: Rgb = [28, 122, 75];
const RED: Rgb = [194, 53, 45];
const HIGHLIGHT: Rgb = [255, 228, 92];

const MARGIN = 48;

/** A printable PDF of the checklist in NextStep's stamp style, drawn with jsPDF's built-in fonts. */
export function createPdf(model: ExportModel, PdfClass: typeof JsPdf): JsPdf {
  const pdf = new PdfClass({ unit: "pt", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const contentWidth = pageWidth - MARGIN * 2;
  let y = MARGIN;

  const font = (style: "normal" | "bold" | "italic", size: number, color: Rgb = INK) => {
    pdf.setFont("helvetica", style);
    pdf.setFontSize(size);
    pdf.setTextColor(...color);
  };
  const ensureSpace = (height: number) => {
    if (y + height > pageHeight - MARGIN - 20) {
      pdf.addPage();
      y = MARGIN;
    }
  };
  const lines = (text: string, width: number): string[] => pdf.splitTextToSize(toPdfSafe(text), width);
  const paragraph = (text: string, x: number, width: number, lineHeight: number) => {
    for (const line of lines(text, width)) {
      ensureSpace(lineHeight);
      pdf.text(line, x, y);
      y += lineHeight;
    }
  };
  /** A rubber-stamp label: bordered, bold capitals, in the stamp's colour. Returns its width. */
  const stamp = (label: string, x: number, baseline: number, color: Rgb, alignRight = false) => {
    font("bold", 7.5, color);
    const text = toPdfSafe(label.toUpperCase());
    const width = pdf.getTextWidth(text) + 8;
    const left = alignRight ? x - width : x;
    pdf.setDrawColor(...color);
    pdf.setLineWidth(1.2);
    pdf.rect(left, baseline - 8, width, 11);
    pdf.text(text, left + 4, baseline);
    return width;
  };

  // Title band.
  pdf.setFillColor(...INK);
  pdf.rect(0, 0, pageWidth, 64, "F");
  font("bold", 22, [251, 252, 250]);
  pdf.text(toPdfSafe(model.title), MARGIN, 40);
  font("normal", 9, [225, 230, 223]);
  pdf.text(toPdfSafe(`Made on ${model.madeOn}`), pageWidth - MARGIN, 40, { align: "right" });
  y = 96;

  // Summary.
  font("bold", 9, MUTED);
  pdf.text("IN SHORT", MARGIN, y);
  y += 16;
  font("normal", 11.5);
  paragraph(model.summary, MARGIN, contentWidth, 16);
  if (model.receipt) {
    y += 4;
    font("bold", 9.5, GREEN);
    paragraph(model.receipt, MARGIN, contentWidth, 13);
  }
  if (model.warning) {
    y += 6;
    font("bold", 10, RED);
    paragraph(model.warning, MARGIN, contentWidth, 14);
  }
  y += 10;

  // Deadline box, sized to its (possibly long, quoted) label.
  font("bold", 13);
  const deadlineLines = lines(model.deadline.label, contentWidth - 170);
  const boxHeight = 30 + deadlineLines.length * 16;
  ensureSpace(boxHeight + 8);
  pdf.setDrawColor(...INK);
  pdf.setLineWidth(1.5);
  pdf.rect(MARGIN, y, contentWidth, boxHeight);
  font("bold", 8, MUTED);
  pdf.text("DEADLINE", MARGIN + 12, y + 16);
  font("bold", 13);
  deadlineLines.forEach((line, i) => pdf.text(line, MARGIN + 12, y + 33 + i * 16));
  const deadlineColor =
    model.deadline.status === "Stated in document"
      ? GREEN
      : model.deadline.status === "Not stated" || model.deadline.status === "Check the original"
        ? RED
        : BALLPOINT;
  stamp(model.deadline.status, MARGIN + contentWidth - 12, y + 26, deadlineColor, true);
  y += boxHeight + 26;

  model.groups.forEach((group, groupIndex) => {
    // Space between groups (not after the last one).
    if (groupIndex > 0) y += 8;
    // Group heading with a rule under it.
    ensureSpace(60);
    font("bold", 15);
    pdf.text(toPdfSafe(group.label), MARGIN, y);
    font("normal", 9.5, MUTED);
    pdf.text(`${group.done} of ${group.total} done`, MARGIN + contentWidth, y, { align: "right" });
    y += 7;
    pdf.setDrawColor(...INK);
    pdf.setLineWidth(1.5);
    pdf.line(MARGIN, y, MARGIN + contentWidth, y);
    y += 20;

    for (const item of group.items) {
      const textX = MARGIN + 22;
      const textWidth = contentWidth - 22 - 50;
      ensureSpace(64);

      // Tick box, ticked in ballpoint blue when done.
      pdf.setDrawColor(...INK);
      pdf.setLineWidth(1.2);
      pdf.rect(MARGIN, y - 9, 11, 11);
      if (item.done) {
        pdf.setDrawColor(...BALLPOINT);
        pdf.setLineWidth(2);
        pdf.lines([[3, 3], [6, -8]], MARGIN + 2, y - 3);
      }
      stamp(item.done ? "Done" : "To do", MARGIN + contentWidth, y, item.done ? GREEN : MUTED, true);

      font("bold", 11, item.done ? MUTED : INK);
      paragraph(item.title, textX, textWidth, 14);
      if (item.deadline) {
        font("normal", 9.5, BALLPOINT);
        paragraph(`Deadline: ${item.deadline}`, textX, textWidth, 13);
      }
      if (item.caution) {
        ensureSpace(16);
        y += 2;
        stamp("Be careful", textX, y, RED);
        y += 12;
      }

      // The quote, with a highlighter stroke behind every line.
      y += 3;
      font("italic", 10);
      for (const line of lines(`“${item.quote}”`, textWidth - 8)) {
        ensureSpace(14);
        pdf.setFillColor(...HIGHLIGHT);
        pdf.rect(textX - 2, y - 9.5, pdf.getTextWidth(line) + 4, 13, "F");
        font("italic", 10);
        pdf.text(line, textX, y);
        y += 14;
      }

      // Evidence verdict and why it matters.
      ensureSpace(16);
      y += 3;
      const found = item.evidence.startsWith("Found");
      const verdictWidth = stamp(found ? "Found" : "Not found", textX, y, found ? GREEN : RED);
      font("normal", 9, MUTED);
      const whyX = textX + verdictWidth + 8;
      const whyLines = lines(item.why, textWidth - verdictWidth - 8);
      whyLines.forEach((line, i) => {
        if (i > 0) {
          y += 12;
          ensureSpace(12);
        }
        pdf.text(line, whyX, y);
      });
      y += 14;

      // A dashed rule between steps.
      pdf.setDrawColor(...RULE);
      pdf.setLineWidth(0.8);
      pdf.setLineDashPattern([3, 3], 0);
      pdf.line(MARGIN, y, MARGIN + contentWidth, y);
      pdf.setLineDashPattern([], 0);
      y += 18;
    }
  });

  // Reminder (two short lines; only move to a new page if they really do not fit).
  ensureSpace(lines(model.reminder, contentWidth).length * 12);
  font("normal", 9, MUTED);
  paragraph(model.reminder, MARGIN, contentWidth, 12);

  // Page numbers on every page.
  const pages = pdf.getNumberOfPages();
  for (let n = 1; n <= pages; n++) {
    pdf.setPage(n);
    font("normal", 8, MUTED);
    pdf.text(`NextStep checklist, page ${n} of ${pages}`, pageWidth - MARGIN, pageHeight - 24, { align: "right" });
  }
  return pdf;
}

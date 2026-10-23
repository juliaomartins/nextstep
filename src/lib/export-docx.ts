import { Document, HeadingLevel, Paragraph, TextRun } from "docx";
import type { ExportModel } from "./export-model";

const INK = "15171C";
const MUTED = "5F666E";
const BALLPOINT = "2338C4";
const GREEN = "1C7A4B";
const RED = "C2352D";
const FONT = "Arial";

const run = (text: string, options: Partial<{ bold: boolean; italics: boolean; color: string; size: number }> = {}) =>
  new TextRun({ text, font: FONT, color: INK, size: 22, ...options });

/** An editable Word version of the checklist: real headings, ☑/☐ ticks, highlighted quotes, evidence labels. */
export function createDocx(model: ExportModel): Document {
  const children: Paragraph[] = [
    new Paragraph({ heading: HeadingLevel.TITLE, children: [run(model.title, { bold: true, size: 44 })] }),
    new Paragraph({ spacing: { after: 240 }, children: [run(`Made on ${model.madeOn}`, { color: MUTED })] }),

    new Paragraph({ heading: HeadingLevel.HEADING_2, children: [run("In short", { bold: true, size: 26 })] }),
    new Paragraph({ spacing: { after: 240 }, children: [run(model.summary)] }),

    new Paragraph({ heading: HeadingLevel.HEADING_2, children: [run("Deadline", { bold: true, size: 26 })] }),
    new Paragraph({
      spacing: { after: 240 },
      children: [run(model.deadline.label, { bold: true }), run(`  (${model.deadline.status})`, { color: MUTED })],
    }),
  ];

  for (const group of model.groups) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 240 },
        children: [
          run(group.label, { bold: true, size: 26 }),
          run(`  ${group.done} of ${group.total} done`, { color: MUTED, size: 20 }),
        ],
      }),
    );

    for (const item of group.items) {
      children.push(
        new Paragraph({
          spacing: { before: 160 },
          children: [
            run(item.done ? "☑ " : "☐ ", { color: BALLPOINT, size: 26 }),
            run(item.title, { bold: true }),
            ...(item.deadline ? [run(`  (${item.deadline})`, { color: BALLPOINT })] : []),
          ],
        }),
        new Paragraph({
          indent: { left: 400 },
          children: [
            new TextRun({ text: `“${item.quote}”`, font: FONT, size: 21, italics: true, color: INK, highlight: "yellow" }),
          ],
        }),
        new Paragraph({
          indent: { left: 400 },
          children: [
            run(item.evidence, { bold: true, size: 18, color: item.evidence.startsWith("Found") ? GREEN : RED }),
            run(`. ${item.why}`, { size: 18, color: MUTED }),
          ],
        }),
      );
    }
  }

  children.push(new Paragraph({ spacing: { before: 480 }, children: [run(model.reminder, { size: 18, color: MUTED })] }));

  return new Document({
    creator: "NextStep",
    title: model.title,
    description: "A checklist made by NextStep from a document.",
    sections: [{ children }],
  });
}

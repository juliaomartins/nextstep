// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import Home from "@/app/page";
import { setUpBrowser, stubApi } from "./helpers/browser";

// The real OCR engine is tested in tests/ocr.test.ts; here only the page wiring is under test.
let finishRecognizing: (text: string) => void = () => {};
vi.mock("tesseract.js", () => ({
  default: {
    createWorker: async (
      _lang: string,
      _oem: unknown,
      options: { logger?: (m: { status: string; progress: number }) => void },
    ) => ({
      recognize: () =>
        new Promise<{ data: { text: string } }>((resolve) => {
          options.logger?.({ status: "recognizing text", progress: 0.4 });
          finishRecognizing = (text) => resolve({ data: { text } });
        }),
      terminate: async () => {},
    }),
  },
}));

beforeEach(setUpBrowser);
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("uploading a picture", () => {
  test("shows OCR progress, then fills the box with the text and the OCR warning, without calling the API", async () => {
    const fetchMock = stubApi(async () => Response.json({}));
    render(<Home />);
    await userEvent.upload(
      screen.getByLabelText("Upload a file"),
      new File([new Uint8Array([137, 80, 78, 71])], "notice.png", { type: "image/png" }),
    );

    expect(await screen.findByText("Reading the picture… 40%")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Make my checklist" })).toHaveProperty("disabled", true);

    finishRecognizing("Applicants must submit a CV in PDF format.\nReferences may be requested.");
    expect(
      await screen.findByText(
        "Text read from your picture. OCR can make mistakes, so check names, dates, and numbers before making your checklist.",
      ),
    ).toBeTruthy();
    expect((screen.getByLabelText("Document text") as HTMLTextAreaElement).value).toBe(
      "Applicants must submit a CV in PDF format.\nReferences may be requested.",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("a picture with no readable text shows the picture-specific message", async () => {
    render(<Home />);
    await userEvent.upload(
      screen.getByLabelText("Upload a file"),
      new File([new Uint8Array([137, 80, 78, 71])], "blank.jpg", { type: "image/jpeg" }),
    );
    await screen.findByText("Reading the picture… 40%");
    finishRecognizing("   ");
    expect((await screen.findByRole("alert")).textContent).toBe(
      "We couldn't read any text in this picture. Try a sharper, well-lit photo, or paste the text.",
    );
  });
});

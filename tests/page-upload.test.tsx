// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import Home from "@/app/page";
import { MAX_FILE_BYTES } from "@/lib/read-file";
import { setUpBrowser, stubApi } from "./helpers/browser";

const DOCX_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

beforeEach(() => {
  setUpBrowser();
  stubApi(async () => Response.json({}));
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function fixtureFile(name: string, type: string) {
  return new File([readFileSync(join(process.cwd(), "tests", "fixtures", name))], name, { type });
}

const box = () => screen.getByLabelText("Document text") as HTMLTextAreaElement;

describe("uploading a file", () => {
  // The first import("mammoth") can take several seconds in a busy parallel run, beyond Vitest's 5 s default.
  test("a Word file fills the paste box with its text and a source note, without calling the API", { timeout: 20_000 }, async () => {
    const fetchMock = stubApi(async () => Response.json({}));
    render(<Home />);
    await userEvent.upload(screen.getByLabelText("Upload a file"), fixtureFile("sample.docx", DOCX_TYPE));

    // The first dynamic import("mammoth") can be slow in a busy parallel test run.
    expect(
      await screen.findByText(/Text from sample\.docx\. Check it before making your checklist\./, {}, { timeout: 15_000 }),
    ).toBeTruthy();
    expect(box().value).toContain("A valid right to work in the country is required");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("an unsupported file type shows the agreed message and leaves the box alone", async () => {
    render(<Home />);
    await userEvent.type(box(), "My own notes");
    await userEvent.upload(screen.getByLabelText("Upload a file"), new File(["hello"], "notes.txt", { type: "text/plain" }), {
      applyAccept: false,
    });

    expect((await screen.findByRole("alert")).textContent).toBe(
      "NextStep can read PDF, Word (.docx), and pictures (PNG, JPG, WebP). Try one of those, or paste the text.",
    );
    expect(box().value).toBe("My own notes");
  });

  test("a file over 5 MB is refused before reading", async () => {
    render(<Home />);
    const big = new File([new Uint8Array(MAX_FILE_BYTES + 1)], "huge.pdf", { type: "application/pdf" });
    await userEvent.upload(screen.getByLabelText("Upload a file"), big);

    expect((await screen.findByRole("alert")).textContent).toBe(
      "This file is too large (over 5 MB). Try a smaller file, or paste the relevant section.",
    );
  });
});

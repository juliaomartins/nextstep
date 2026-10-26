// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import Home from "@/app/page";
import type { AnalysisResult } from "@/lib/schemas";
import { setUpBrowser, stubApi } from "./helpers/browser";

const DOCUMENT = `Applicants must submit a CV in PDF format. ${"More detail about the role. ".repeat(10)}`;

const resultIn = (language: string): AnalysisResult => ({
  summary: `Summary in ${language}.`,
  deadline: { status: "not_stated", date: null, wording: null, sourceExcerpt: null },
  items: [
    {
      id: "item-1",
      title: `Step in ${language}`,
      group: "required",
      whyItMatters: "Because.",
      sourceExcerpt: "Applicants must submit a CV in PDF format.",
      deadline: null,
      evidence: "found",
    },
  ],
  language: language as AnalysisResult["language"],
});

let fetchMock: ReturnType<typeof stubApi>;

beforeEach(() => {
  setUpBrowser();
  fetchMock = stubApi(async (...args: unknown[]) => {
    const init = args[1] as RequestInit;
    const { language } = JSON.parse(init.body as string);
    return new Response(JSON.stringify(resultIn(language)), { status: 200 });
  });
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

async function makeChecklist(language: string) {
  await userEvent.selectOptions(screen.getByLabelText("Checklist language"), language);
  const box = screen.getByLabelText("Document text");
  await userEvent.clear(box);
  box.focus();
  await userEvent.paste(DOCUMENT);
  await userEvent.click(screen.getByRole("button", { name: "Make my checklist" }));
  await screen.findByRole("heading", { name: "Your checklist" });
}

const sentLanguages = () =>
  fetchMock.mock.calls.map((call) => JSON.parse(((call as unknown[])[1] as RequestInit).body as string).language);

describe("checklist language", () => {
  test("offers English first and sends the chosen language", async () => {
    render(<Home />);
    const select = screen.getByLabelText("Checklist language") as HTMLSelectElement;
    expect(select.value).toBe("en");
    await makeChecklist("es");
    expect(sentLanguages()).toEqual(["es"]);
    expect(await screen.findByText("Step in es")).toBeTruthy();
  });

  test("marks translated text with its language, so screen readers pronounce it correctly", async () => {
    render(<Home />);
    await makeChecklist("pt");
    expect((await screen.findByText("Summary in pt.")).closest("[lang]")?.getAttribute("lang")).toBe("pt");
    expect(screen.getByText("Step in pt").closest("[lang]")?.getAttribute("lang")).toBe("pt");
  });

  test("reuses the saved checklist only for the same text in the same language", async () => {
    render(<Home />);
    await makeChecklist("es");
    await makeChecklist("es");
    expect(sentLanguages()).toEqual(["es"]);
    expect(screen.getByText(/saved checklist was reused/)).toBeTruthy();

    await makeChecklist("pt");
    expect(sentLanguages()).toEqual(["es", "pt"]);
    expect(await screen.findByText("Step in pt")).toBeTruthy();
    // Three simulated pastes and analyses: about 2 s alone, more when the whole suite runs in parallel.
  }, 15_000);
});

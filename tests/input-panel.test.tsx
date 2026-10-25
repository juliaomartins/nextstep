// @vitest-environment jsdom
import { useState } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test, vi } from "vitest";
import { InputPanel } from "@/components/input-panel";

afterEach(cleanup);

function Harness({
  onAnalyze = () => {},
  onSample = () => {},
}: {
  onAnalyze?: () => void;
  onSample?: (sample: "job" | "scholarship") => void;
}) {
  const [text, setText] = useState("");
  return (
    <InputPanel
      text={text}
      loading={false}
      reading={null}
      sourceNote={null}
      error={null}
      language="en"
      onLanguageChange={() => {}}
      onFile={() => {}}
      onTextChange={setText}
      onSample={(sample) => {
        onSample(sample);
        setText(`Sample ${sample} text`);
      }}
      onAnalyze={onAnalyze}
    />
  );
}

describe("InputPanel", () => {
  test("says, next to the button, that the text is sent to OpenAI and not stored", () => {
    render(<Harness />);
    expect(screen.getByText(/sent to OpenAI to make your checklist/)).toBeTruthy();
    expect(screen.getByText(/NextStep doesn't store it/)).toBeTruthy();
  });

  test("offers two samples: the job posting and a scholarship notice", async () => {
    const onSample = vi.fn();
    render(<Harness onSample={onSample} />);
    await userEvent.click(screen.getByRole("button", { name: "Use the sample job posting" }));
    await userEvent.click(screen.getByRole("button", { name: "or a scholarship notice" }));
    expect(onSample.mock.calls).toEqual([["job"], ["scholarship"]]);
  });

  test("the analyze button is disabled while the box is empty", () => {
    render(<Harness />);
    expect(screen.getByRole("button", { name: "Make my checklist" })).toHaveProperty("disabled", true);
  });

  test("typing into the box enables the analyze button and clicking it analyzes", async () => {
    const onAnalyze = vi.fn();
    render(<Harness onAnalyze={onAnalyze} />);
    await userEvent.type(screen.getByLabelText("Document text"), "Applicants must submit a CV.");
    const button = screen.getByRole("button", { name: "Make my checklist" });
    expect(button).toHaveProperty("disabled", false);
    await userEvent.click(button);
    expect(onAnalyze).toHaveBeenCalledOnce();
  });

  test("pasting into the box enables the analyze button", async () => {
    render(<Harness />);
    const box = screen.getByLabelText("Document text");
    box.focus();
    await userEvent.paste("Vaga Servisu - Senior IT Officer - CARE in Timor-Leste");
    expect(screen.getByRole("button", { name: "Make my checklist" })).toHaveProperty("disabled", false);
  });
});

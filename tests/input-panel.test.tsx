// @vitest-environment jsdom
import { useState } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test, vi } from "vitest";
import { InputPanel } from "@/components/input-panel";

afterEach(cleanup);

function Harness({ onAnalyze = () => {} }: { onAnalyze?: () => void }) {
  const [text, setText] = useState("");
  return (
    <InputPanel
      text={text}
      loading={false}
      error={null}
      onTextChange={setText}
      onSample={() => setText("Sample posting text")}
      onAnalyze={onAnalyze}
    />
  );
}

describe("InputPanel", () => {
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

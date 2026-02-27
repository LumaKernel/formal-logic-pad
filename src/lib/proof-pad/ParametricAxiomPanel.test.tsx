/**
 * ParametricAxiomPanel コンポーネントのテスト。
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ParametricAxiomPanel } from "./ParametricAxiomPanel";

// --- A4 パネルテスト ---

describe("ParametricAxiomPanel - A4", () => {
  it("renders A4 panel with input and disabled confirm button", () => {
    render(
      <ParametricAxiomPanel
        axiomId="A4"
        onConfirm={() => {}}
        onCancel={() => {}}
        testId="a4-panel"
      />,
    );
    expect(
      screen.getByText("A4 (Universal Instantiation)"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("a4-panel-universal-input")).toBeInTheDocument();
    expect(screen.getByTestId("a4-panel-confirm")).toBeDisabled();
  });

  it("shows preview after entering valid universal formula", async () => {
    const user = userEvent.setup();
    render(
      <ParametricAxiomPanel
        axiomId="A4"
        onConfirm={() => {}}
        onCancel={() => {}}
        testId="a4-panel"
      />,
    );

    const input = screen.getByTestId("a4-panel-universal-input");
    await user.type(input, "all x. x + 0 = x");

    await waitFor(() => {
      const preview = screen.getByTestId("a4-panel-preview");
      expect(preview.textContent).toContain("τ");
      expect(preview.textContent).toContain("→");
    });

    expect(screen.getByTestId("a4-panel-confirm")).not.toBeDisabled();
  });

  it("shows error for non-universal formula", async () => {
    const user = userEvent.setup();
    render(
      <ParametricAxiomPanel
        axiomId="A4"
        onConfirm={() => {}}
        onCancel={() => {}}
        testId="a4-panel"
      />,
    );

    const input = screen.getByTestId("a4-panel-universal-input");
    await user.type(input, "phi -> psi");

    await waitFor(() => {
      expect(screen.getByTestId("a4-panel-error")).toBeInTheDocument();
    });

    expect(screen.getByTestId("a4-panel-confirm")).toBeDisabled();
  });

  it("calls onConfirm with generated dslText", async () => {
    const user = userEvent.setup();
    const handleConfirm = vi.fn();
    render(
      <ParametricAxiomPanel
        axiomId="A4"
        onConfirm={handleConfirm}
        onCancel={() => {}}
        testId="a4-panel"
      />,
    );

    const input = screen.getByTestId("a4-panel-universal-input");
    await user.type(input, "all x. x + 0 = x");

    await waitFor(() => {
      expect(screen.getByTestId("a4-panel-confirm")).not.toBeDisabled();
    });

    await user.click(screen.getByTestId("a4-panel-confirm"));

    expect(handleConfirm).toHaveBeenCalledOnce();
    expect(handleConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        axiomDisplayName: "A4 (UI)",
        termMetaVariableName: "τ",
      }),
    );
    const callArg = handleConfirm.mock.calls[0]?.[0];
    expect(typeof callArg?.dslText).toBe("string");
    expect(callArg?.dslText).toContain("τ");
  });

  it("calls onCancel when cancel button clicked", async () => {
    const user = userEvent.setup();
    const handleCancel = vi.fn();
    render(
      <ParametricAxiomPanel
        axiomId="A4"
        onConfirm={() => {}}
        onCancel={handleCancel}
        testId="a4-panel"
      />,
    );

    await user.click(screen.getByTestId("a4-panel-cancel"));
    expect(handleCancel).toHaveBeenCalledOnce();
  });

  it("calls onConfirm on Enter key when valid", async () => {
    const user = userEvent.setup();
    const handleConfirm = vi.fn();
    render(
      <ParametricAxiomPanel
        axiomId="A4"
        onConfirm={handleConfirm}
        onCancel={() => {}}
        testId="a4-panel"
      />,
    );

    const input = screen.getByTestId("a4-panel-universal-input");
    await user.type(input, "all x. x + 0 = x");
    await waitFor(() => {
      expect(screen.getByTestId("a4-panel-confirm")).not.toBeDisabled();
    });
    await user.keyboard("{Enter}");

    expect(handleConfirm).toHaveBeenCalledOnce();
  });

  it("calls onCancel on Escape key", async () => {
    const user = userEvent.setup();
    const handleCancel = vi.fn();
    render(
      <ParametricAxiomPanel
        axiomId="A4"
        onConfirm={() => {}}
        onCancel={handleCancel}
        testId="a4-panel"
      />,
    );

    const input = screen.getByTestId("a4-panel-universal-input");
    await user.click(input);
    await user.keyboard("{Escape}");

    expect(handleCancel).toHaveBeenCalledOnce();
  });

  it("shows bound variable info when formula is valid", async () => {
    const user = userEvent.setup();
    render(
      <ParametricAxiomPanel
        axiomId="A4"
        onConfirm={() => {}}
        onCancel={() => {}}
        testId="a4-panel"
      />,
    );

    const input = screen.getByTestId("a4-panel-universal-input");
    await user.type(input, "all y. P(y)");

    await waitFor(() => {
      expect(screen.getByText("y")).toBeInTheDocument();
    });
  });
});

// --- A5 パネルテスト ---

describe("ParametricAxiomPanel - A5", () => {
  it("renders A5 panel with three inputs", () => {
    render(
      <ParametricAxiomPanel
        axiomId="A5"
        onConfirm={() => {}}
        onCancel={() => {}}
        testId="a5-panel"
      />,
    );
    expect(screen.getByText("A5 (Universal Distribution)")).toBeInTheDocument();
    expect(screen.getByTestId("a5-panel-variable-input")).toBeInTheDocument();
    expect(screen.getByTestId("a5-panel-antecedent-input")).toBeInTheDocument();
    expect(screen.getByTestId("a5-panel-consequent-input")).toBeInTheDocument();
    expect(screen.getByTestId("a5-panel-confirm")).toBeDisabled();
  });

  it("shows preview after entering valid inputs", async () => {
    const user = userEvent.setup();
    render(
      <ParametricAxiomPanel
        axiomId="A5"
        onConfirm={() => {}}
        onCancel={() => {}}
        testId="a5-panel"
      />,
    );

    await user.type(screen.getByTestId("a5-panel-variable-input"), "x");
    await user.type(screen.getByTestId("a5-panel-antecedent-input"), "P(a)");
    await user.type(screen.getByTestId("a5-panel-consequent-input"), "Q(x)");

    await waitFor(() => {
      const preview = screen.getByTestId("a5-panel-preview");
      expect(preview.textContent).toContain("→");
      expect(preview.textContent).toContain("∀");
    });

    expect(screen.getByTestId("a5-panel-confirm")).not.toBeDisabled();
  });

  it("shows error when variable is free in antecedent", async () => {
    const user = userEvent.setup();
    render(
      <ParametricAxiomPanel
        axiomId="A5"
        onConfirm={() => {}}
        onCancel={() => {}}
        testId="a5-panel"
      />,
    );

    await user.type(screen.getByTestId("a5-panel-variable-input"), "x");
    await user.type(screen.getByTestId("a5-panel-antecedent-input"), "P(x)");

    await waitFor(() => {
      expect(
        screen.getByTestId("a5-panel-antecedent-error"),
      ).toBeInTheDocument();
    });
  });

  it("calls onConfirm with generated dslText", async () => {
    const user = userEvent.setup();
    const handleConfirm = vi.fn();
    render(
      <ParametricAxiomPanel
        axiomId="A5"
        onConfirm={handleConfirm}
        onCancel={() => {}}
        testId="a5-panel"
      />,
    );

    await user.type(screen.getByTestId("a5-panel-variable-input"), "x");
    await user.type(screen.getByTestId("a5-panel-antecedent-input"), "P(a)");
    await user.type(screen.getByTestId("a5-panel-consequent-input"), "Q(x)");

    await waitFor(() => {
      expect(screen.getByTestId("a5-panel-confirm")).not.toBeDisabled();
    });

    await user.click(screen.getByTestId("a5-panel-confirm"));

    expect(handleConfirm).toHaveBeenCalledOnce();
    expect(handleConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        axiomDisplayName: "A5 (∀-Dist)",
      }),
    );
  });

  it("calls onCancel when cancel button clicked", async () => {
    const user = userEvent.setup();
    const handleCancel = vi.fn();
    render(
      <ParametricAxiomPanel
        axiomId="A5"
        onConfirm={() => {}}
        onCancel={handleCancel}
        testId="a5-panel"
      />,
    );

    await user.click(screen.getByTestId("a5-panel-cancel"));
    expect(handleCancel).toHaveBeenCalledOnce();
  });

  it("calls onConfirm on Enter key when valid", async () => {
    const user = userEvent.setup();
    const handleConfirm = vi.fn();
    render(
      <ParametricAxiomPanel
        axiomId="A5"
        onConfirm={handleConfirm}
        onCancel={() => {}}
        testId="a5-panel"
      />,
    );

    await user.type(screen.getByTestId("a5-panel-variable-input"), "x");
    await user.type(screen.getByTestId("a5-panel-antecedent-input"), "P(a)");
    const consequentInput = screen.getByTestId("a5-panel-consequent-input");
    await user.type(consequentInput, "Q(x)");
    await waitFor(() => {
      expect(screen.getByTestId("a5-panel-confirm")).not.toBeDisabled();
    });
    await user.keyboard("{Enter}");

    expect(handleConfirm).toHaveBeenCalledOnce();
  });

  it("calls onCancel on Escape key", async () => {
    const user = userEvent.setup();
    const handleCancel = vi.fn();
    render(
      <ParametricAxiomPanel
        axiomId="A5"
        onConfirm={() => {}}
        onCancel={handleCancel}
        testId="a5-panel"
      />,
    );

    const input = screen.getByTestId("a5-panel-variable-input");
    await user.click(input);
    await user.keyboard("{Escape}");

    expect(handleCancel).toHaveBeenCalledOnce();
  });

  it("shows antecedent parse error for invalid syntax", async () => {
    const user = userEvent.setup();
    render(
      <ParametricAxiomPanel
        axiomId="A5"
        onConfirm={() => {}}
        onCancel={() => {}}
        testId="a5-panel"
      />,
    );

    await user.type(screen.getByTestId("a5-panel-variable-input"), "x");
    await user.type(
      screen.getByTestId("a5-panel-antecedent-input"),
      "@@@ invalid",
    );

    await waitFor(() => {
      expect(
        screen.getByTestId("a5-panel-antecedent-error"),
      ).toBeInTheDocument();
    });
  });
});

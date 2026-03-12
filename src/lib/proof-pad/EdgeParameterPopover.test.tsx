import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EdgeParameterPopover } from "./EdgeParameterPopover";
import type { EdgeBadgeEditState } from "./edgeBadgeEditLogic";

describe("EdgeParameterPopover", () => {
  describe("Gen popover", () => {
    const genEditState: EdgeBadgeEditState = {
      _tag: "gen",
      conclusionNodeId: "node-2",
      variableName: "x",
    };

    it("renders with current variable name", () => {
      render(
        <EdgeParameterPopover
          editState={genEditState}
          onCancel={() => {}}
          testId="popover"
        />,
      );
      const input = screen.getByTestId("popover-gen-input");
      expect(input).toHaveValue("x");
    });

    it("calls onConfirmGen with new variable name", async () => {
      const user = userEvent.setup();
      const onConfirmGen = vi.fn();
      render(
        <EdgeParameterPopover
          editState={genEditState}
          onConfirmGen={onConfirmGen}
          onCancel={() => {}}
          testId="popover"
        />,
      );
      const input = screen.getByTestId("popover-gen-input");
      await user.clear(input);
      await user.type(input, "y");
      await user.click(screen.getByTestId("popover-confirm"));
      expect(onConfirmGen).toHaveBeenCalledWith("node-2", "y");
    });

    it("calls onConfirmGen on Enter key", async () => {
      const user = userEvent.setup();
      const onConfirmGen = vi.fn();
      render(
        <EdgeParameterPopover
          editState={genEditState}
          onConfirmGen={onConfirmGen}
          onCancel={() => {}}
          testId="popover"
        />,
      );
      const input = screen.getByTestId("popover-gen-input");
      await user.clear(input);
      await user.type(input, "z{Enter}");
      expect(onConfirmGen).toHaveBeenCalledWith("node-2", "z");
    });

    it("calls onCancel on Escape key", async () => {
      const user = userEvent.setup();
      const onCancel = vi.fn();
      render(
        <EdgeParameterPopover
          editState={genEditState}
          onCancel={onCancel}
          testId="popover"
        />,
      );
      const input = screen.getByTestId("popover-gen-input");
      await user.type(input, "{Escape}");
      expect(onCancel).toHaveBeenCalledOnce();
    });

    it("calls onCancel on Cancel button click", async () => {
      const user = userEvent.setup();
      const onCancel = vi.fn();
      render(
        <EdgeParameterPopover
          editState={genEditState}
          onCancel={onCancel}
          testId="popover"
        />,
      );
      await user.click(screen.getByTestId("popover-cancel"));
      expect(onCancel).toHaveBeenCalledOnce();
    });

    it("disables confirm when variable name is empty", async () => {
      const user = userEvent.setup();
      render(
        <EdgeParameterPopover
          editState={{ ...genEditState, variableName: "" }}
          onCancel={() => {}}
          testId="popover"
        />,
      );
      const confirmBtn = screen.getByTestId("popover-confirm");
      expect(confirmBtn).toBeDisabled();
      const input = screen.getByTestId("popover-gen-input");
      await user.type(input, "x");
      expect(confirmBtn).not.toBeDisabled();
    });
  });

  describe("Substitution popover", () => {
    const substEditState: EdgeBadgeEditState = {
      _tag: "substitution",
      conclusionNodeId: "node-2",
      entries: [
        {
          _tag: "FormulaSubstitution",
          metaVariableName: "φ",
          formulaText: "alpha",
        },
      ],
      premiseFormulaText: undefined,
    };

    /**
     * ヘルパー: FormulaEditor/TermEditor内の<input>要素を取得する。
     * forceEditMode=true なので常に edit モードで開始される。
     * testId チェーン: popover-value-N → -input (FormulaInput) → -input (<input>)
     */
    const getValueInput = (valueTestId: string) =>
      screen.getByTestId(`${valueTestId satisfies string}-input-input`);

    it("renders with current entries in edit mode (read-only metaVar and kind)", async () => {
      render(
        <EdgeParameterPopover
          editState={substEditState}
          onCancel={() => {}}
          testId="popover"
        />,
      );
      // metaVar is displayed as read-only text
      const metaVarLabel = screen.getByTestId("popover-metavar-0");
      expect(metaVarLabel).toHaveTextContent("φ");
      // kind is displayed as read-only text
      const kindLabel = screen.getByTestId("popover-kind-0");
      expect(kindLabel).toHaveTextContent("Formula");
      // FormulaEditor with forceEditMode=true: always in edit mode
      await waitFor(() => {
        expect(screen.getByTestId("popover-value-0-edit")).toBeInTheDocument();
      });
      expect(getValueInput("popover-value-0")).toHaveValue("alpha");
    });

    it("calls onConfirmSubstitution with updated value", async () => {
      const user = userEvent.setup();
      const onConfirm = vi.fn();
      render(
        <EdgeParameterPopover
          editState={substEditState}
          onConfirmSubstitution={onConfirm}
          onCancel={() => {}}
          testId="popover"
        />,
      );
      await waitFor(() => {
        expect(screen.getByTestId("popover-value-0-edit")).toBeInTheDocument();
      });
      const valueInput = getValueInput("popover-value-0");
      await user.clear(valueInput);
      await user.type(valueInput, "beta");
      await user.click(screen.getByTestId("popover-confirm"));
      expect(onConfirm).toHaveBeenCalledWith("node-2", [
        {
          _tag: "FormulaSubstitution",
          metaVariableName: "φ",
          formulaText: "beta",
        },
      ]);
    });

    it("does not have add or remove buttons", () => {
      render(
        <EdgeParameterPopover
          editState={substEditState}
          onCancel={() => {}}
          testId="popover"
        />,
      );
      expect(screen.queryByTestId("popover-add-entry")).not.toBeInTheDocument();
      expect(screen.queryByTestId("popover-remove-0")).not.toBeInTheDocument();
    });

    it("auto-extracts meta-variables from premiseFormulaText", async () => {
      const stateWithPremise: EdgeBadgeEditState = {
        _tag: "substitution",
        conclusionNodeId: "node-2",
        entries: [
          {
            _tag: "FormulaSubstitution",
            metaVariableName: "φ",
            formulaText: "alpha",
          },
        ],
        premiseFormulaText: "phi -> (psi -> phi)",
      };
      render(
        <EdgeParameterPopover
          editState={stateWithPremise}
          onCancel={() => {}}
          testId="popover"
        />,
      );
      // Two entries should be rendered (φ and ψ)
      expect(screen.getByTestId("popover-metavar-0")).toHaveTextContent("φ");
      expect(screen.getByTestId("popover-metavar-1")).toHaveTextContent("ψ");
      // Both entries in edit mode (forceEditMode=true)
      await waitFor(() => {
        expect(screen.getByTestId("popover-value-0-edit")).toBeInTheDocument();
        expect(screen.getByTestId("popover-value-1-edit")).toBeInTheDocument();
      });
      // φ entry should have existing value merged
      expect(getValueInput("popover-value-0")).toHaveValue("alpha");
      // ψ entry should be empty (no existing value)
      expect(getValueInput("popover-value-1")).toHaveValue("");
    });

    it("calls onCancel on Cancel button", async () => {
      const user = userEvent.setup();
      const onCancel = vi.fn();
      render(
        <EdgeParameterPopover
          editState={substEditState}
          onCancel={onCancel}
          testId="popover"
        />,
      );
      await user.click(screen.getByTestId("popover-cancel"));
      expect(onCancel).toHaveBeenCalledOnce();
    });

    it("calls onCancel on Escape key from popover", () => {
      const onCancel = vi.fn();
      render(
        <EdgeParameterPopover
          editState={substEditState}
          onCancel={onCancel}
          testId="popover"
        />,
      );
      const popover = screen.getByTestId("popover");
      fireEvent.keyDown(popover, { key: "Escape" });
      expect(onCancel).toHaveBeenCalledOnce();
    });

    it("disables confirm when no valid entries", () => {
      const emptySubstState: EdgeBadgeEditState = {
        _tag: "substitution",
        conclusionNodeId: "node-2",
        entries: [],
        premiseFormulaText: undefined,
      };
      render(
        <EdgeParameterPopover
          editState={emptySubstState}
          onCancel={() => {}}
          testId="popover"
        />,
      );
      const confirmBtn = screen.getByTestId("popover-confirm");
      expect(confirmBtn).toBeDisabled();
    });

    it("shows per-field syntax help button in edit mode when onOpenSyntaxHelp is provided", async () => {
      const onOpenSyntaxHelp = vi.fn();
      render(
        <EdgeParameterPopover
          editState={substEditState}
          onCancel={() => {}}
          onOpenSyntaxHelp={onOpenSyntaxHelp}
          testId="popover"
        />,
      );
      await waitFor(() => {
        expect(screen.getByTestId("popover-value-0-edit")).toBeInTheDocument();
      });
      const helpButton = screen.getByTestId("popover-value-0-syntax-help");
      expect(helpButton).toBeInTheDocument();
    });

    it("does not show syntax help button when onOpenSyntaxHelp is not provided", async () => {
      render(
        <EdgeParameterPopover
          editState={substEditState}
          onCancel={() => {}}
          testId="popover"
        />,
      );
      await waitFor(() => {
        expect(screen.getByTestId("popover-value-0-edit")).toBeInTheDocument();
      });
      expect(
        screen.queryByTestId("popover-value-0-syntax-help"),
      ).not.toBeInTheDocument();
    });

    it("calls onOpenSyntaxHelp when per-field syntax help button is clicked", async () => {
      const onOpenSyntaxHelp = vi.fn();
      render(
        <EdgeParameterPopover
          editState={substEditState}
          onCancel={() => {}}
          onOpenSyntaxHelp={onOpenSyntaxHelp}
          testId="popover"
        />,
      );
      await waitFor(() => {
        expect(screen.getByTestId("popover-value-0-edit")).toBeInTheDocument();
      });
      const helpButton = screen.getByTestId("popover-value-0-syntax-help");
      fireEvent.click(helpButton);
      expect(onOpenSyntaxHelp).toHaveBeenCalledOnce();
    });

    it("renders term entry kind label correctly in edit mode", async () => {
      const termSubstState: EdgeBadgeEditState = {
        _tag: "substitution",
        conclusionNodeId: "node-2",
        entries: [
          {
            _tag: "TermSubstitution",
            metaVariableName: "τ",
            termText: "S(0)",
          },
        ],
        premiseFormulaText: undefined,
      };
      render(
        <EdgeParameterPopover
          editState={termSubstState}
          onCancel={() => {}}
          testId="popover"
        />,
      );
      const kindLabel = screen.getByTestId("popover-kind-0");
      expect(kindLabel).toHaveTextContent("Term");
      await waitFor(() => {
        expect(screen.getByTestId("popover-value-0-edit")).toBeInTheDocument();
      });
      expect(getValueInput("popover-value-0")).toHaveValue("S(0)");
    });

    it("calls onConfirmSubstitution when term value is changed and confirmed", async () => {
      const onConfirmSubstitution = vi.fn();
      const user = userEvent.setup();
      const termSubstState: EdgeBadgeEditState = {
        _tag: "substitution",
        conclusionNodeId: "node-2",
        entries: [
          {
            _tag: "TermSubstitution",
            metaVariableName: "τ",
            termText: "S(0)",
          },
        ],
        premiseFormulaText: undefined,
      };
      render(
        <EdgeParameterPopover
          editState={termSubstState}
          onConfirmSubstitution={onConfirmSubstitution}
          onCancel={() => {}}
          testId="popover"
        />,
      );
      await waitFor(() => {
        expect(screen.getByTestId("popover-value-0-edit")).toBeInTheDocument();
      });
      const input = getValueInput("popover-value-0");
      await user.clear(input);
      await user.type(input, "S(S(0))");
      const confirmButton = screen.getByTestId("popover-confirm");
      await user.click(confirmButton);
      expect(onConfirmSubstitution).toHaveBeenCalledOnce();
    });

    it("renders without testId (uses default data-testid values)", () => {
      render(
        <EdgeParameterPopover editState={substEditState} onCancel={() => {}} />,
      );
      expect(screen.getByTestId("edge-popover-cancel")).toBeInTheDocument();
      expect(screen.getByTestId("edge-popover-confirm")).toBeInTheDocument();
    });

    it("renders gen popover without testId", () => {
      const genState: EdgeBadgeEditState = {
        _tag: "gen",
        conclusionNodeId: "node-2",
        variableName: "x",
      };
      render(<EdgeParameterPopover editState={genState} onCancel={() => {}} />);
      expect(screen.getByTestId("edge-popover-cancel")).toBeInTheDocument();
      expect(screen.getByTestId("edge-popover-confirm")).toBeInTheDocument();
    });

    it("uses no-op for onConfirmSubstitution when not provided", async () => {
      const user = userEvent.setup();
      render(
        <EdgeParameterPopover
          editState={substEditState}
          onCancel={() => {}}
          testId="popover"
        />,
      );
      await user.click(screen.getByTestId("popover-confirm"));
    });

    it("does not show syntax help button for gen popover", () => {
      const genState: EdgeBadgeEditState = {
        _tag: "gen",
        conclusionNodeId: "node-2",
        variableName: "x",
      };
      const onOpenSyntaxHelp = vi.fn();
      render(
        <EdgeParameterPopover
          editState={genState}
          onCancel={() => {}}
          onOpenSyntaxHelp={onOpenSyntaxHelp}
          testId="popover"
        />,
      );
      expect(
        screen.queryByTestId("popover-syntax-help"),
      ).not.toBeInTheDocument();
    });
  });
});

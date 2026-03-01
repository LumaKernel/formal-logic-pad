import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
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
      // Type something to enable
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

    it("renders with current entries (read-only metaVar and kind)", () => {
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
      // value is editable
      const valueInput = screen.getByTestId("popover-value-0");
      expect(valueInput).toHaveValue("alpha");
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
      const valueInput = screen.getByTestId("popover-value-0");
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
      // No add/remove buttons exist
      expect(screen.queryByTestId("popover-add-entry")).not.toBeInTheDocument();
      expect(screen.queryByTestId("popover-remove-0")).not.toBeInTheDocument();
    });

    it("auto-extracts meta-variables from premiseFormulaText", () => {
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
      // φ entry should have existing value merged
      expect(screen.getByTestId("popover-value-0")).toHaveValue("alpha");
      // ψ entry should be empty (no existing value)
      expect(screen.getByTestId("popover-value-1")).toHaveValue("");
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

    it("calls onCancel on Escape from value input", async () => {
      const user = userEvent.setup();
      const onCancel = vi.fn();
      render(
        <EdgeParameterPopover
          editState={substEditState}
          onCancel={onCancel}
          testId="popover"
        />,
      );
      const input = screen.getByTestId("popover-value-0");
      await user.type(input, "{Escape}");
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

    it("shows syntax help button when onOpenSyntaxHelp is provided", () => {
      const onOpenSyntaxHelp = vi.fn();
      render(
        <EdgeParameterPopover
          editState={substEditState}
          onCancel={() => {}}
          onOpenSyntaxHelp={onOpenSyntaxHelp}
          testId="popover"
        />,
      );
      const helpButton = screen.getByTestId("popover-syntax-help");
      expect(helpButton).toBeInTheDocument();
    });

    it("does not show syntax help button when onOpenSyntaxHelp is not provided", () => {
      render(
        <EdgeParameterPopover
          editState={substEditState}
          onCancel={() => {}}
          testId="popover"
        />,
      );
      expect(
        screen.queryByTestId("popover-syntax-help"),
      ).not.toBeInTheDocument();
    });

    it("calls onOpenSyntaxHelp when syntax help button is clicked", async () => {
      const user = userEvent.setup();
      const onOpenSyntaxHelp = vi.fn();
      render(
        <EdgeParameterPopover
          editState={substEditState}
          onCancel={() => {}}
          onOpenSyntaxHelp={onOpenSyntaxHelp}
          testId="popover"
        />,
      );
      const helpButton = screen.getByTestId("popover-syntax-help");
      await user.click(helpButton);
      expect(onOpenSyntaxHelp).toHaveBeenCalledOnce();
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

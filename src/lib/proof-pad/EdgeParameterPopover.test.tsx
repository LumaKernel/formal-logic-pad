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
    };

    it("renders with current entries", () => {
      render(
        <EdgeParameterPopover
          editState={substEditState}
          onCancel={() => {}}
          testId="popover"
        />,
      );
      const metaVarInput = screen.getByTestId("popover-metavar-0");
      const valueInput = screen.getByTestId("popover-value-0");
      expect(metaVarInput).toHaveValue("φ");
      expect(valueInput).toHaveValue("alpha");
    });

    it("calls onConfirmSubstitution with updated entries", async () => {
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

    it("can add and remove entries", async () => {
      const user = userEvent.setup();
      render(
        <EdgeParameterPopover
          editState={substEditState}
          onCancel={() => {}}
          testId="popover"
        />,
      );
      // Add an entry
      await user.click(screen.getByTestId("popover-add-entry"));
      expect(screen.getByTestId("popover-metavar-1")).toBeInTheDocument();
      // Remove the added entry
      await user.click(screen.getByTestId("popover-remove-1"));
      expect(screen.queryByTestId("popover-metavar-1")).not.toBeInTheDocument();
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

    it("can change kind select from formula to term", async () => {
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
      const kindSelect = screen.getByTestId("popover-kind-0");
      await user.selectOptions(kindSelect, "term");
      // Confirm with the updated kind
      await user.click(screen.getByTestId("popover-confirm"));
      expect(onConfirm).toHaveBeenCalledWith("node-2", [
        {
          _tag: "TermSubstitution",
          metaVariableName: "φ",
          termText: "alpha",
        },
      ]);
    });

    it("can change metaVar input", async () => {
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
      const metaVarInput = screen.getByTestId("popover-metavar-0");
      await user.clear(metaVarInput);
      await user.type(metaVarInput, "ψ");
      await user.click(screen.getByTestId("popover-confirm"));
      expect(onConfirm).toHaveBeenCalledWith("node-2", [
        {
          _tag: "FormulaSubstitution",
          metaVariableName: "ψ",
          formulaText: "alpha",
        },
      ]);
    });

    it("disables confirm when no valid entries", () => {
      const emptySubstState: EdgeBadgeEditState = {
        _tag: "substitution",
        conclusionNodeId: "node-2",
        entries: [],
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
  });
});

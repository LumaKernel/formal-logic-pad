import { useState, useCallback } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  lukasiewiczSystem,
  predicateLogicSystem,
  equalityLogicSystem,
} from "../logic-core/inferenceRule";
import type { Formula } from "../logic-core/formula";
import { ProofWorkspace } from "./ProofWorkspace";
import type { WorkspaceState } from "./workspaceState";
import {
  createEmptyWorkspace,
  createQuestWorkspace,
  addNode,
  addConnection,
  updateGoalFormulaText,
  updateNodeGenVariableName,
  applyMPAndConnect,
  applyGenAndConnect,
} from "./workspaceState";

// --- 状態管理ラッパー（インタラクションテスト用） ---

function StatefulWorkspace({
  initialWorkspace,
  onFormulaParsed,
}: {
  readonly initialWorkspace: WorkspaceState;
  readonly onFormulaParsed?: (nodeId: string, formula: Formula) => void;
}) {
  const [workspace, setWorkspace] = useState(initialWorkspace);
  const handleChange = useCallback((ws: WorkspaceState) => {
    setWorkspace(ws);
  }, []);

  return (
    <ProofWorkspace
      system={initialWorkspace.system}
      workspace={workspace}
      onWorkspaceChange={handleChange}
      onFormulaParsed={onFormulaParsed}
      testId="workspace"
    />
  );
}

describe("ProofWorkspace", () => {
  describe("empty workspace", () => {
    it("renders with Łukasiewicz system", () => {
      render(<ProofWorkspace system={lukasiewiczSystem} testId="workspace" />);
      expect(screen.getByTestId("workspace")).toBeInTheDocument();
      expect(screen.getByTestId("workspace-system")).toHaveTextContent(
        "Łukasiewicz",
      );
    });

    it("renders with predicate logic system", () => {
      render(
        <ProofWorkspace system={predicateLogicSystem} testId="workspace" />,
      );
      expect(screen.getByTestId("workspace-system")).toHaveTextContent(
        "Predicate Logic",
      );
    });

    it("renders with equality logic system", () => {
      render(
        <ProofWorkspace system={equalityLogicSystem} testId="workspace" />,
      );
      expect(screen.getByTestId("workspace-system")).toHaveTextContent(
        "Predicate Logic with Equality",
      );
    });

    it("renders InfiniteCanvas", () => {
      render(<ProofWorkspace system={lukasiewiczSystem} testId="workspace" />);
      expect(screen.getByTestId("infinite-canvas")).toBeInTheDocument();
    });

    it("shows system label in header", () => {
      render(<ProofWorkspace system={lukasiewiczSystem} testId="workspace" />);
      expect(screen.getByTestId("workspace-header")).toHaveTextContent(
        "Logic System:",
      );
    });
  });

  describe("with external workspace state", () => {
    it("renders nodes from external state", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 }, "phi -> (psi -> phi)");
      ws = addNode(ws, "axiom", "A2", { x: 200, y: 0 }, "phi -> phi");

      render(
        <ProofWorkspace
          system={lukasiewiczSystem}
          workspace={ws}
          testId="workspace"
        />,
      );

      expect(screen.getByTestId("proof-node-node-1")).toBeInTheDocument();
      expect(screen.getByTestId("proof-node-node-2")).toBeInTheDocument();
    });

    it("renders with connections", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 });
      ws = addNode(ws, "axiom", "A2", { x: 200, y: 0 });
      ws = addNode(ws, "mp", "MP", { x: 100, y: 150 });
      ws = addConnection(ws, "node-1", "out", "node-3", "premise-left");
      ws = addConnection(ws, "node-2", "out", "node-3", "premise-right");

      render(
        <ProofWorkspace
          system={lukasiewiczSystem}
          workspace={ws}
          testId="workspace"
        />,
      );

      expect(screen.getByTestId("proof-node-node-1")).toBeInTheDocument();
      expect(screen.getByTestId("proof-node-node-2")).toBeInTheDocument();
      expect(screen.getByTestId("proof-node-node-3")).toBeInTheDocument();
    });

    it("accepts onWorkspaceChange callback", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 });

      const onWorkspaceChange = vi.fn();

      render(
        <ProofWorkspace
          system={lukasiewiczSystem}
          workspace={ws}
          onWorkspaceChange={onWorkspaceChange}
          testId="workspace"
        />,
      );

      expect(screen.getByTestId("proof-node-node-1")).toBeInTheDocument();
    });
  });

  describe("without external state (internal)", () => {
    it("manages state internally when no workspace prop", () => {
      render(<ProofWorkspace system={lukasiewiczSystem} testId="workspace" />);

      expect(screen.getByTestId("workspace")).toBeInTheDocument();
      expect(screen.getByTestId("infinite-canvas")).toBeInTheDocument();
    });
  });

  describe("system display", () => {
    it("displays system name from workspace over props", () => {
      const ws = createEmptyWorkspace(predicateLogicSystem);
      render(
        <ProofWorkspace
          system={lukasiewiczSystem}
          workspace={ws}
          testId="workspace"
        />,
      );
      // workspace.system takes precedence over props.system
      expect(screen.getByTestId("workspace-system")).toHaveTextContent(
        "Predicate Logic",
      );
    });
  });

  describe("axiom palette", () => {
    it("renders axiom palette with available axioms for Łukasiewicz", () => {
      render(<ProofWorkspace system={lukasiewiczSystem} testId="workspace" />);
      expect(screen.getByTestId("workspace-axiom-palette")).toBeInTheDocument();
      expect(
        screen.getByTestId("workspace-axiom-palette-item-A1"),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("workspace-axiom-palette-item-A2"),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("workspace-axiom-palette-item-A3"),
      ).toBeInTheDocument();
    });

    it("renders axiom palette for predicate logic (includes A4, A5)", () => {
      render(
        <ProofWorkspace system={predicateLogicSystem} testId="workspace" />,
      );
      expect(
        screen.getByTestId("workspace-axiom-palette-item-A4"),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("workspace-axiom-palette-item-A5"),
      ).toBeInTheDocument();
    });

    it("adds axiom node when palette item is clicked (external state)", async () => {
      const user = userEvent.setup();
      const onWorkspaceChange = vi.fn();
      const ws = createEmptyWorkspace(lukasiewiczSystem);

      render(
        <ProofWorkspace
          system={lukasiewiczSystem}
          workspace={ws}
          onWorkspaceChange={onWorkspaceChange}
          testId="workspace"
        />,
      );

      await user.click(screen.getByTestId("workspace-axiom-palette-item-A1"));
      expect(onWorkspaceChange).toHaveBeenCalledTimes(1);
      const newState = onWorkspaceChange.mock.calls[0][0] as WorkspaceState;
      expect(newState.nodes).toHaveLength(1);
      expect(newState.nodes[0].kind).toBe("axiom");
      expect(newState.nodes[0].label).toBe("A1 (K)");
      expect(newState.nodes[0].formulaText).toBe("phi -> (psi -> phi)");
    });

    it("adds axiom node when palette item is clicked (internal state)", async () => {
      const user = userEvent.setup();

      render(<ProofWorkspace system={lukasiewiczSystem} testId="workspace" />);

      // No nodes initially
      expect(screen.queryByTestId("proof-node-node-1")).not.toBeInTheDocument();

      // Click A1 to add
      await user.click(screen.getByTestId("workspace-axiom-palette-item-A1"));

      // Node should appear
      await waitFor(() => {
        expect(screen.getByTestId("proof-node-node-1")).toBeInTheDocument();
      });
    });

    it("adds multiple axiom nodes with distinct ids", async () => {
      const user = userEvent.setup();

      render(<ProofWorkspace system={lukasiewiczSystem} testId="workspace" />);

      await user.click(screen.getByTestId("workspace-axiom-palette-item-A1"));
      await user.click(screen.getByTestId("workspace-axiom-palette-item-A2"));

      await waitFor(() => {
        expect(screen.getByTestId("proof-node-node-1")).toBeInTheDocument();
        expect(screen.getByTestId("proof-node-node-2")).toBeInTheDocument();
      });
    });

    it("sets correct dslText for equality axioms", async () => {
      const user = userEvent.setup();
      const onWorkspaceChange = vi.fn();
      const ws = createEmptyWorkspace(equalityLogicSystem);

      render(
        <ProofWorkspace
          system={equalityLogicSystem}
          workspace={ws}
          onWorkspaceChange={onWorkspaceChange}
          testId="workspace"
        />,
      );

      await user.click(screen.getByTestId("workspace-axiom-palette-item-E1"));
      const newState = onWorkspaceChange.mock.calls[0][0] as WorkspaceState;
      expect(newState.nodes[0].formulaText).toBe("all x. x = x");
    });
  });

  describe("node interaction callbacks", () => {
    it("updates formula text when user types in a node", async () => {
      const user = userEvent.setup();
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 }, "");

      render(<StatefulWorkspace initialWorkspace={ws} />);

      // Click the formula display to enter edit mode
      const display = screen.getByTestId("proof-node-node-1-editor-display");
      await user.click(display);

      // Type into the actual <input> element (triggers handleFormulaTextChange)
      const input = screen.getByTestId("proof-node-node-1-editor-input-input");
      await user.type(input, "p");

      // Verify the input value updated (state propagated correctly)
      expect(input).toHaveValue("p");
    });

    it("calls onFormulaParsed when editing a valid formula", async () => {
      const user = userEvent.setup();
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 }, "");

      const onFormulaParsed = vi.fn();

      render(
        <StatefulWorkspace
          initialWorkspace={ws}
          onFormulaParsed={onFormulaParsed}
        />,
      );

      // Click the formula display to enter edit mode
      await user.click(screen.getByTestId("proof-node-node-1-editor-display"));

      // Type a valid Greek letter formula (same as EditableProofNode test)
      const input = screen.getByTestId("proof-node-node-1-editor-input-input");
      await user.type(input, "φ");

      // onFormulaParsed should be called when FormulaInput parses a valid formula
      await waitFor(() => {
        expect(onFormulaParsed).toHaveBeenCalled();
      });
    });

    it("enters editing mode when formula display is clicked", async () => {
      const user = userEvent.setup();
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 }, "");

      render(<StatefulWorkspace initialWorkspace={ws} />);

      // Initially in display mode
      expect(screen.getByTestId("proof-node-node-1")).toBeInTheDocument();
      expect(
        screen.getByTestId("proof-node-node-1-editor-display"),
      ).toBeInTheDocument();

      // Click to enter edit mode (triggers handleModeChange with "editing")
      await user.click(screen.getByTestId("proof-node-node-1-editor-display"));

      // Should now be in editing mode - edit container should be visible
      expect(
        screen.getByTestId("proof-node-node-1-editor-edit"),
      ).toBeInTheDocument();
    });

    it("exits editing mode on Escape and tracks mode change", async () => {
      const user = userEvent.setup();
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      // Need a valid formula so Escape can exit edit mode
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 }, "φ");

      render(<StatefulWorkspace initialWorkspace={ws} />);

      // Enter edit mode
      await user.click(screen.getByTestId("proof-node-node-1-editor-display"));
      expect(
        screen.getByTestId("proof-node-node-1-editor-edit"),
      ).toBeInTheDocument();

      // Press Escape to exit edit mode (triggers handleModeChange with "display")
      await user.keyboard("{Escape}");

      // Should return to display mode
      await waitFor(() => {
        expect(
          screen.getByTestId("proof-node-node-1-editor-display"),
        ).toBeInTheDocument();
      });
    });

    it("manages state internally when editing without onWorkspaceChange", () => {
      // Uncontrolled mode: no workspace/onWorkspaceChange props
      render(<ProofWorkspace system={lukasiewiczSystem} testId="workspace" />);

      // The component renders fine with internal state
      expect(screen.getByTestId("workspace")).toBeInTheDocument();
      expect(screen.getByTestId("infinite-canvas")).toBeInTheDocument();
    });
  });

  describe("MP button and selection", () => {
    it("renders Apply MP button in header", () => {
      render(<ProofWorkspace system={lukasiewiczSystem} testId="workspace" />);
      expect(screen.getByTestId("workspace-mp-button")).toBeInTheDocument();
      expect(screen.getByTestId("workspace-mp-button")).toHaveTextContent(
        "Apply MP",
      );
    });

    it("enters selection mode when MP button is clicked", async () => {
      const user = userEvent.setup();
      render(<ProofWorkspace system={lukasiewiczSystem} testId="workspace" />);

      await user.click(screen.getByTestId("workspace-mp-button"));

      // Banner should appear
      expect(screen.getByTestId("workspace-mp-banner")).toBeInTheDocument();
      expect(screen.getByTestId("workspace-mp-banner")).toHaveTextContent(
        "Click the left premise",
      );

      // Button should say "Cancel MP"
      expect(screen.getByTestId("workspace-mp-button")).toHaveTextContent(
        "Cancel MP",
      );
    });

    it("cancels selection mode when Cancel MP is clicked", async () => {
      const user = userEvent.setup();
      render(<ProofWorkspace system={lukasiewiczSystem} testId="workspace" />);

      await user.click(screen.getByTestId("workspace-mp-button"));
      expect(screen.getByTestId("workspace-mp-banner")).toBeInTheDocument();

      // Click Cancel MP
      await user.click(screen.getByTestId("workspace-mp-button"));
      expect(
        screen.queryByTestId("workspace-mp-banner"),
      ).not.toBeInTheDocument();
      expect(screen.getByTestId("workspace-mp-button")).toHaveTextContent(
        "Apply MP",
      );
    });

    it("creates MP node when two nodes are selected in sequence", async () => {
      const user = userEvent.setup();

      render(
        <StatefulWorkspace
          initialWorkspace={(() => {
            let ws = createEmptyWorkspace(lukasiewiczSystem);
            ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 }, "phi");
            ws = addNode(ws, "axiom", "A2", { x: 200, y: 0 }, "phi -> psi");
            return ws;
          })()}
        />,
      );

      // Enter MP selection mode
      await user.click(screen.getByTestId("workspace-mp-button"));
      expect(screen.getByTestId("workspace-mp-banner")).toHaveTextContent(
        "Click the left premise",
      );

      // Click left premise
      await user.click(screen.getByTestId("proof-node-node-1"));
      expect(screen.getByTestId("workspace-mp-banner")).toHaveTextContent(
        "Click the right premise",
      );

      // Click right premise
      await user.click(screen.getByTestId("proof-node-node-2"));

      // Banner should disappear
      await waitFor(() => {
        expect(
          screen.queryByTestId("workspace-mp-banner"),
        ).not.toBeInTheDocument();
      });

      // MP node should be created
      await waitFor(() => {
        expect(screen.getByTestId("proof-node-node-3")).toBeInTheDocument();
      });
    });

    it("shows success status on valid MP application", async () => {
      const user = userEvent.setup();

      render(
        <StatefulWorkspace
          initialWorkspace={(() => {
            let ws = createEmptyWorkspace(lukasiewiczSystem);
            ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 }, "phi");
            ws = addNode(ws, "axiom", "A2", { x: 200, y: 0 }, "phi -> psi");
            return ws;
          })()}
        />,
      );

      // Apply MP
      await user.click(screen.getByTestId("workspace-mp-button"));
      await user.click(screen.getByTestId("proof-node-node-1"));
      await user.click(screen.getByTestId("proof-node-node-2"));

      // MP node should show success status
      await waitFor(() => {
        expect(
          screen.getByTestId("proof-node-node-3-status"),
        ).toBeInTheDocument();
        expect(
          screen.getByTestId("proof-node-node-3-status"),
        ).toHaveTextContent("MP applied");
      });
    });

    it("shows error status on invalid MP application", async () => {
      const user = userEvent.setup();

      render(
        <StatefulWorkspace
          initialWorkspace={(() => {
            let ws = createEmptyWorkspace(lukasiewiczSystem);
            ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 }, "phi");
            ws = addNode(ws, "axiom", "A2", { x: 200, y: 0 }, "psi");
            return ws;
          })()}
        />,
      );

      // Apply MP (will fail - right premise is not an implication)
      await user.click(screen.getByTestId("workspace-mp-button"));
      await user.click(screen.getByTestId("proof-node-node-1"));
      await user.click(screen.getByTestId("proof-node-node-2"));

      // MP node should show error status
      await waitFor(() => {
        expect(
          screen.getByTestId("proof-node-node-3-status"),
        ).toBeInTheDocument();
        expect(
          screen.getByTestId("proof-node-node-3-status"),
        ).toHaveTextContent("Right premise must be an implication");
      });
    });

    it("applies MP via onWorkspaceChange (external state)", async () => {
      const user = userEvent.setup();
      const onWorkspaceChange = vi.fn();

      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "axiom", "A2", { x: 200, y: 0 }, "phi -> psi");

      render(
        <ProofWorkspace
          system={lukasiewiczSystem}
          workspace={ws}
          onWorkspaceChange={onWorkspaceChange}
          testId="workspace"
        />,
      );

      // Apply MP
      await user.click(screen.getByTestId("workspace-mp-button"));
      await user.click(screen.getByTestId("proof-node-node-1"));
      await user.click(screen.getByTestId("proof-node-node-2"));

      expect(onWorkspaceChange).toHaveBeenCalled();
      const newState = onWorkspaceChange.mock.calls[0][0] as WorkspaceState;
      expect(newState.nodes).toHaveLength(3);
      expect(newState.nodes[2].kind).toBe("mp");
      expect(newState.nodes[2].formulaText).toBe("ψ");
      expect(newState.connections).toHaveLength(2);
    });
  });

  describe("MP validation display", () => {
    it("shows error status for MP node with premise mismatch", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "axiom", "A2", { x: 200, y: 0 }, "psi -> chi");
      ws = addNode(ws, "mp", "MP", { x: 100, y: 150 });
      ws = addConnection(ws, "node-1", "out", "node-3", "premise-left");
      ws = addConnection(ws, "node-2", "out", "node-3", "premise-right");

      render(
        <ProofWorkspace
          system={lukasiewiczSystem}
          workspace={ws}
          testId="workspace"
        />,
      );

      expect(
        screen.getByTestId("proof-node-node-3-status"),
      ).toBeInTheDocument();
      expect(screen.getByTestId("proof-node-node-3-status")).toHaveTextContent(
        "Left premise does not match",
      );
    });

    it("shows success status for valid MP node", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "axiom", "A2", { x: 200, y: 0 }, "phi -> psi");
      ws = addNode(ws, "mp", "MP", { x: 100, y: 150 }, "psi");
      ws = addConnection(ws, "node-1", "out", "node-3", "premise-left");
      ws = addConnection(ws, "node-2", "out", "node-3", "premise-right");

      render(
        <ProofWorkspace
          system={lukasiewiczSystem}
          workspace={ws}
          testId="workspace"
        />,
      );

      expect(
        screen.getByTestId("proof-node-node-3-status"),
      ).toBeInTheDocument();
      expect(screen.getByTestId("proof-node-node-3-status")).toHaveTextContent(
        "MP applied",
      );
    });

    it("does not show status for MP node without connections", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "mp", "MP", { x: 100, y: 150 });

      render(
        <ProofWorkspace
          system={lukasiewiczSystem}
          workspace={ws}
          testId="workspace"
        />,
      );

      expect(
        screen.queryByTestId("proof-node-node-1-status"),
      ).not.toBeInTheDocument();
    });

    it("does not show status for axiom nodes", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 }, "phi");

      render(
        <ProofWorkspace
          system={lukasiewiczSystem}
          workspace={ws}
          testId="workspace"
        />,
      );

      expect(
        screen.queryByTestId("proof-node-node-1-status"),
      ).not.toBeInTheDocument();
    });
  });

  describe("goal setting and completion", () => {
    it("renders goal input area", () => {
      render(<ProofWorkspace system={lukasiewiczSystem} testId="workspace" />);
      expect(screen.getByTestId("workspace-goal")).toBeInTheDocument();
      expect(screen.getByTestId("workspace-goal-input")).toBeInTheDocument();
    });

    it("shows empty goal input initially", () => {
      render(<ProofWorkspace system={lukasiewiczSystem} testId="workspace" />);
      const goalInput = screen.getByTestId("workspace-goal-input");
      expect(goalInput).toHaveValue("");
    });

    it("updates goal text from external state", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = updateGoalFormulaText(ws, "phi -> phi");

      render(
        <ProofWorkspace
          system={lukasiewiczSystem}
          workspace={ws}
          testId="workspace"
        />,
      );

      expect(screen.getByTestId("workspace-goal-input")).toHaveValue(
        "phi -> phi",
      );
    });

    it("calls onWorkspaceChange when goal text changes", async () => {
      const user = userEvent.setup();
      const onWorkspaceChange = vi.fn();
      const ws = createEmptyWorkspace(lukasiewiczSystem);

      render(
        <ProofWorkspace
          system={lukasiewiczSystem}
          workspace={ws}
          onWorkspaceChange={onWorkspaceChange}
          testId="workspace"
        />,
      );

      await user.type(screen.getByTestId("workspace-goal-input"), "p");
      expect(onWorkspaceChange).toHaveBeenCalled();
      const newState = onWorkspaceChange.mock.calls[0][0] as WorkspaceState;
      expect(newState.goalFormulaText).toBe("p");
    });

    it("shows 'Not yet' when goal is set but not achieved", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = updateGoalFormulaText(ws, "phi -> phi");

      render(
        <ProofWorkspace
          system={lukasiewiczSystem}
          workspace={ws}
          testId="workspace"
        />,
      );

      expect(
        screen.getByTestId("workspace-goal-not-achieved"),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("workspace-goal-not-achieved"),
      ).toHaveTextContent("Not yet");
    });

    it("shows 'Proved!' when goal formula matches a workspace node", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 }, "phi");
      ws = updateGoalFormulaText(ws, "phi");

      render(
        <ProofWorkspace
          system={lukasiewiczSystem}
          workspace={ws}
          testId="workspace"
        />,
      );

      expect(screen.getByTestId("workspace-goal-achieved")).toBeInTheDocument();
      expect(screen.getByTestId("workspace-goal-achieved")).toHaveTextContent(
        "Proved!",
      );
    });

    it("shows proof complete banner when goal is achieved", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 }, "phi");
      ws = updateGoalFormulaText(ws, "phi");

      render(
        <ProofWorkspace
          system={lukasiewiczSystem}
          workspace={ws}
          testId="workspace"
        />,
      );

      expect(
        screen.getByTestId("workspace-proof-complete-banner"),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("workspace-proof-complete-banner"),
      ).toHaveTextContent("Proof Complete!");
    });

    it("does not show banner when goal is not set", () => {
      render(<ProofWorkspace system={lukasiewiczSystem} testId="workspace" />);
      expect(
        screen.queryByTestId("workspace-proof-complete-banner"),
      ).not.toBeInTheDocument();
    });

    it("does not show banner when goal is not achieved", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = updateGoalFormulaText(ws, "phi -> phi");

      render(
        <ProofWorkspace
          system={lukasiewiczSystem}
          workspace={ws}
          testId="workspace"
        />,
      );

      expect(
        screen.queryByTestId("workspace-proof-complete-banner"),
      ).not.toBeInTheDocument();
    });

    it("shows 'Invalid formula' for unparseable goal", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = updateGoalFormulaText(ws, "-> ->");

      render(
        <ProofWorkspace
          system={lukasiewiczSystem}
          workspace={ws}
          testId="workspace"
        />,
      );

      expect(
        screen.getByTestId("workspace-goal-parse-error"),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("workspace-goal-parse-error"),
      ).toHaveTextContent("Invalid formula");
    });

    it("shows banner when MP application completes the goal", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "axiom", "A2", { x: 200, y: 0 }, "phi -> psi");
      const result = applyMPAndConnect(ws, "node-1", "node-2", {
        x: 100,
        y: 150,
      });
      ws = updateGoalFormulaText(result.workspace, "psi");

      render(
        <ProofWorkspace
          system={lukasiewiczSystem}
          workspace={ws}
          testId="workspace"
        />,
      );

      expect(screen.getByTestId("workspace-goal-achieved")).toBeInTheDocument();
      expect(
        screen.getByTestId("workspace-proof-complete-banner"),
      ).toBeInTheDocument();
    });

    it("updates goal text via typing (internal state)", async () => {
      const user = userEvent.setup();

      render(<ProofWorkspace system={lukasiewiczSystem} testId="workspace" />);

      const goalInput = screen.getByTestId("workspace-goal-input");
      await user.type(goalInput, "phi");

      await waitFor(() => {
        expect(goalInput).toHaveValue("phi");
      });
    });

    it("achieves goal via typing after adding matching axiom (internal state)", async () => {
      const user = userEvent.setup();

      render(<ProofWorkspace system={lukasiewiczSystem} testId="workspace" />);

      // Add A1 axiom (phi -> (psi -> phi))
      await user.click(screen.getByTestId("workspace-axiom-palette-item-A1"));

      // Set goal
      const goalInput = screen.getByTestId("workspace-goal-input");
      await user.type(goalInput, "phi -> (psi -> phi)");

      // Should show goal achieved
      await waitFor(() => {
        expect(
          screen.getByTestId("workspace-goal-achieved"),
        ).toBeInTheDocument();
      });
    });
  });

  describe("Gen button and selection (predicate logic)", () => {
    it("renders Gen button and variable input for predicate logic system", () => {
      render(
        <ProofWorkspace system={predicateLogicSystem} testId="workspace" />,
      );
      expect(screen.getByTestId("workspace-gen-button")).toBeInTheDocument();
      expect(screen.getByTestId("workspace-gen-button")).toHaveTextContent(
        "Apply Gen",
      );
      expect(
        screen.getByTestId("workspace-gen-variable-input"),
      ).toBeInTheDocument();
    });

    it("does not render Gen button for propositional logic system", () => {
      render(<ProofWorkspace system={lukasiewiczSystem} testId="workspace" />);
      expect(
        screen.queryByTestId("workspace-gen-button"),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("workspace-gen-variable-input"),
      ).not.toBeInTheDocument();
    });

    it("does not enter Gen selection when variable is empty", async () => {
      const user = userEvent.setup();
      render(
        <ProofWorkspace system={predicateLogicSystem} testId="workspace" />,
      );

      // Click Gen without typing variable name
      await user.click(screen.getByTestId("workspace-gen-button"));

      // Banner should NOT appear
      expect(
        screen.queryByTestId("workspace-gen-banner"),
      ).not.toBeInTheDocument();
    });

    it("enters Gen selection mode when variable is set and Gen is clicked", async () => {
      const user = userEvent.setup();
      render(
        <ProofWorkspace system={predicateLogicSystem} testId="workspace" />,
      );

      // Type variable name
      await user.type(screen.getByTestId("workspace-gen-variable-input"), "x");

      // Click Gen button
      await user.click(screen.getByTestId("workspace-gen-button"));

      // Banner should appear
      expect(screen.getByTestId("workspace-gen-banner")).toBeInTheDocument();
      expect(screen.getByTestId("workspace-gen-banner")).toHaveTextContent(
        "Click the premise",
      );
      expect(screen.getByTestId("workspace-gen-banner")).toHaveTextContent("x");

      // Button should say "Cancel Gen"
      expect(screen.getByTestId("workspace-gen-button")).toHaveTextContent(
        "Cancel Gen",
      );
    });

    it("cancels Gen selection mode", async () => {
      const user = userEvent.setup();
      render(
        <ProofWorkspace system={predicateLogicSystem} testId="workspace" />,
      );

      await user.type(screen.getByTestId("workspace-gen-variable-input"), "x");
      await user.click(screen.getByTestId("workspace-gen-button"));
      expect(screen.getByTestId("workspace-gen-banner")).toBeInTheDocument();

      // Click Cancel Gen
      await user.click(screen.getByTestId("workspace-gen-button"));
      expect(
        screen.queryByTestId("workspace-gen-banner"),
      ).not.toBeInTheDocument();
      expect(screen.getByTestId("workspace-gen-button")).toHaveTextContent(
        "Apply Gen",
      );
    });

    it("creates Gen node when premise is selected", async () => {
      const user = userEvent.setup();

      render(
        <StatefulWorkspace
          initialWorkspace={(() => {
            let ws = createEmptyWorkspace(predicateLogicSystem);
            ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 }, "phi");
            return ws;
          })()}
        />,
      );

      // Type variable name and start Gen selection
      await user.type(screen.getByTestId("workspace-gen-variable-input"), "x");
      await user.click(screen.getByTestId("workspace-gen-button"));

      // Click premise node
      await user.click(screen.getByTestId("proof-node-node-1"));

      // Banner should disappear
      await waitFor(() => {
        expect(
          screen.queryByTestId("workspace-gen-banner"),
        ).not.toBeInTheDocument();
      });

      // Gen node should be created
      await waitFor(() => {
        expect(screen.getByTestId("proof-node-node-2")).toBeInTheDocument();
      });
    });

    it("shows success status on valid Gen application", async () => {
      const user = userEvent.setup();

      render(
        <StatefulWorkspace
          initialWorkspace={(() => {
            let ws = createEmptyWorkspace(predicateLogicSystem);
            ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 }, "phi");
            return ws;
          })()}
        />,
      );

      // Apply Gen
      await user.type(screen.getByTestId("workspace-gen-variable-input"), "x");
      await user.click(screen.getByTestId("workspace-gen-button"));
      await user.click(screen.getByTestId("proof-node-node-1"));

      // Gen node should show success status
      await waitFor(() => {
        expect(
          screen.getByTestId("proof-node-node-2-status"),
        ).toBeInTheDocument();
        expect(
          screen.getByTestId("proof-node-node-2-status"),
        ).toHaveTextContent("Gen applied");
      });
    });

    it("MP selection cancels Gen selection and vice versa", async () => {
      const user = userEvent.setup();
      render(
        <ProofWorkspace system={predicateLogicSystem} testId="workspace" />,
      );

      // Start Gen selection
      await user.type(screen.getByTestId("workspace-gen-variable-input"), "x");
      await user.click(screen.getByTestId("workspace-gen-button"));
      expect(screen.getByTestId("workspace-gen-banner")).toBeInTheDocument();

      // Click MP button - should cancel Gen
      await user.click(screen.getByTestId("workspace-mp-button"));
      expect(
        screen.queryByTestId("workspace-gen-banner"),
      ).not.toBeInTheDocument();
      expect(screen.getByTestId("workspace-mp-banner")).toBeInTheDocument();
    });
  });

  describe("Gen validation display", () => {
    it("shows success status for valid Gen node", () => {
      let ws = createEmptyWorkspace(predicateLogicSystem);
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 }, "phi");
      const result = applyGenAndConnect(ws, "node-1", "x", {
        x: 0,
        y: 150,
      });

      render(
        <ProofWorkspace
          system={predicateLogicSystem}
          workspace={result.workspace}
          testId="workspace"
        />,
      );

      expect(
        screen.getByTestId("proof-node-node-2-status"),
      ).toBeInTheDocument();
      expect(screen.getByTestId("proof-node-node-2-status")).toHaveTextContent(
        "Gen applied",
      );
    });

    it("does not show status for Gen node without connections", () => {
      let ws = createEmptyWorkspace(predicateLogicSystem);
      ws = addNode(ws, "gen", "Gen", { x: 0, y: 0 });
      ws = updateNodeGenVariableName(ws, "node-1", "x");

      render(
        <ProofWorkspace
          system={predicateLogicSystem}
          workspace={ws}
          testId="workspace"
        />,
      );

      // PremiseMissing is excluded from display (same as BothPremisesMissing for MP)
      expect(
        screen.queryByTestId("proof-node-node-1-status"),
      ).not.toBeInTheDocument();
    });

    it("shows error status for Gen node with empty variable name", () => {
      let ws = createEmptyWorkspace(predicateLogicSystem);
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "gen", "Gen", { x: 0, y: 150 });
      // No genVariableName set (defaults to "")
      ws = addConnection(ws, "node-1", "out", "node-2", "premise");

      render(
        <ProofWorkspace
          system={predicateLogicSystem}
          workspace={ws}
          testId="workspace"
        />,
      );

      expect(
        screen.getByTestId("proof-node-node-2-status"),
      ).toBeInTheDocument();
      expect(screen.getByTestId("proof-node-node-2-status")).toHaveTextContent(
        "Enter a variable name",
      );
    });
  });

  describe("node role badges", () => {
    it("axiom nodes show role badge", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 }, "phi");
      render(
        <ProofWorkspace
          system={lukasiewiczSystem}
          workspace={ws}
          testId="workspace"
        />,
      );
      const badge = screen.getByTestId("proof-node-node-1-role-badge");
      expect(badge).toBeInTheDocument();
      // Root node without explicit role shows "ROOT"
      expect(badge).toHaveTextContent("ROOT");
    });

    it("derived (MP) nodes show DERIVED badge", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "axiom", "A2", { x: 200, y: 0 }, "phi -> psi");
      const result = applyMPAndConnect(ws, "node-1", "node-2", {
        x: 100,
        y: 150,
      });
      render(
        <ProofWorkspace
          system={lukasiewiczSystem}
          workspace={result.workspace}
          testId="workspace"
        />,
      );
      const mpBadge = screen.getByTestId("proof-node-node-3-role-badge");
      expect(mpBadge).toHaveTextContent("DERIVED");
    });

    it("clicking role badge cycles role (external state)", async () => {
      const user = userEvent.setup();
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 }, "phi");

      const onWorkspaceChange = vi.fn();
      render(
        <ProofWorkspace
          system={lukasiewiczSystem}
          workspace={ws}
          onWorkspaceChange={onWorkspaceChange}
          testId="workspace"
        />,
      );
      const badge = screen.getByTestId("proof-node-node-1-role-badge");
      expect(badge).toHaveTextContent("ROOT");

      // Click to cycle: ROOT -> AXIOM
      await user.click(badge);
      expect(onWorkspaceChange).toHaveBeenCalled();
      const updatedWs = onWorkspaceChange.mock.calls[0]![0] as WorkspaceState;
      expect(updatedWs.nodes[0]!.role).toBe("axiom");
    });

    it("cycles through all roles (internal state)", async () => {
      const user = userEvent.setup();
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 }, "phi");

      render(<StatefulWorkspace initialWorkspace={ws} />);

      const badge = screen.getByTestId("proof-node-node-1-role-badge");

      // Initial: ROOT
      expect(badge).toHaveTextContent("ROOT");

      // Click: ROOT -> AXIOM
      await user.click(badge);
      expect(badge).toHaveTextContent("AXIOM");

      // Click: AXIOM -> GOAL
      await user.click(badge);
      expect(badge).toHaveTextContent("GOAL");

      // Click: GOAL -> ROOT
      await user.click(badge);
      expect(badge).toHaveTextContent("ROOT");
    });
  });

  describe("testIdなしのレンダリング", () => {
    it("testIdなしでも正常にレンダリングされる", () => {
      const ws = createEmptyWorkspace(lukasiewiczSystem);
      const { container } = render(
        <ProofWorkspace system={lukasiewiczSystem} workspace={ws} />,
      );
      expect(container.querySelector("input")).toBeInTheDocument();
    });

    it("testIdなしでゴール達成バナーが表示される", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = updateGoalFormulaText(ws, "φ → φ");
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 }, "φ → φ");
      const { container } = render(
        <ProofWorkspace system={lukasiewiczSystem} workspace={ws} />,
      );
      expect(container.textContent).toContain("Proof Complete!");
    });
  });

  describe("quest mode", () => {
    it("displays Quest badge in quest mode", () => {
      const ws = createQuestWorkspace(lukasiewiczSystem, [
        { formulaText: "phi -> phi", position: { x: 0, y: 0 } },
      ]);
      render(
        <ProofWorkspace
          system={lukasiewiczSystem}
          workspace={ws}
          testId="workspace"
        />,
      );
      expect(screen.getByTestId("workspace-quest-badge")).toBeInTheDocument();
      expect(screen.getByTestId("workspace-quest-badge")).toHaveTextContent(
        "Quest",
      );
    });

    it("does not display Quest badge in free mode", () => {
      const ws = createEmptyWorkspace(lukasiewiczSystem);
      render(
        <ProofWorkspace
          system={lukasiewiczSystem}
          workspace={ws}
          testId="workspace"
        />,
      );
      expect(
        screen.queryByTestId("workspace-quest-badge"),
      ).not.toBeInTheDocument();
    });

    it("displays Convert to Free button in quest mode", () => {
      const ws = createQuestWorkspace(lukasiewiczSystem, [
        { formulaText: "phi", position: { x: 0, y: 0 } },
      ]);
      render(
        <ProofWorkspace
          system={lukasiewiczSystem}
          workspace={ws}
          testId="workspace"
        />,
      );
      expect(
        screen.getByTestId("workspace-convert-free-button"),
      ).toBeInTheDocument();
    });

    it("quest goal nodes show QUEST badge", () => {
      const ws = createQuestWorkspace(lukasiewiczSystem, [
        { formulaText: "phi", position: { x: 0, y: 0 } },
      ]);
      render(
        <ProofWorkspace
          system={lukasiewiczSystem}
          workspace={ws}
          testId="workspace"
        />,
      );
      expect(
        screen.getByTestId("proof-node-node-1-protected-badge"),
      ).toHaveTextContent("QUEST");
    });

    it("converts to free mode when Convert to Free button is clicked", async () => {
      const user = userEvent.setup();
      const ws = createQuestWorkspace(lukasiewiczSystem, [
        { formulaText: "phi", position: { x: 0, y: 0 } },
      ]);
      const onWorkspaceChange = vi.fn();
      render(
        <ProofWorkspace
          system={lukasiewiczSystem}
          workspace={ws}
          onWorkspaceChange={onWorkspaceChange}
          testId="workspace"
        />,
      );

      await user.click(screen.getByTestId("workspace-convert-free-button"));
      expect(onWorkspaceChange).toHaveBeenCalled();
      const updated = onWorkspaceChange.mock.calls[0]![0] as WorkspaceState;
      expect(updated.mode).toBe("free");
      expect(updated.nodes[0]!.protection).toBeUndefined();
    });

    it("quest mode conversion works with internal state", async () => {
      const user = userEvent.setup();
      const ws = createQuestWorkspace(lukasiewiczSystem, [
        { formulaText: "phi", position: { x: 0, y: 0 } },
      ]);

      render(<StatefulWorkspace initialWorkspace={ws} />);

      // Quest badge should be visible
      expect(screen.getByTestId("workspace-quest-badge")).toBeInTheDocument();

      // Click Convert to Free
      await user.click(screen.getByTestId("workspace-convert-free-button"));

      // Quest badge should disappear
      await waitFor(() => {
        expect(
          screen.queryByTestId("workspace-quest-badge"),
        ).not.toBeInTheDocument();
      });

      // Protected badge should also disappear
      expect(
        screen.queryByTestId("proof-node-node-1-protected-badge"),
      ).not.toBeInTheDocument();
    });
  });

  describe("axiom name auto-identification", () => {
    it("shows axiom name badge for A1 instance", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(
        ws,
        "axiom",
        "A1",
        { x: 0, y: 0 },
        "phi -> (psi -> phi)",
      );

      render(
        <ProofWorkspace
          system={lukasiewiczSystem}
          workspace={ws}
          testId="workspace"
        />,
      );

      expect(
        screen.getByTestId("proof-node-node-1-axiom-name"),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("proof-node-node-1-axiom-name"),
      ).toHaveTextContent("A1 (K)");
    });

    it("shows axiom name badge for A2 instance", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(
        ws,
        "axiom",
        "Axiom",
        { x: 0, y: 0 },
        "(phi -> (psi -> chi)) -> ((phi -> psi) -> (phi -> chi))",
      );

      render(
        <ProofWorkspace
          system={lukasiewiczSystem}
          workspace={ws}
          testId="workspace"
        />,
      );

      expect(
        screen.getByTestId("proof-node-node-1-axiom-name"),
      ).toHaveTextContent("A2 (S)");
    });

    it("shows axiom name badge for A3 instance", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(
        ws,
        "axiom",
        "Axiom",
        { x: 0, y: 0 },
        "(~phi -> ~psi) -> (psi -> phi)",
      );

      render(
        <ProofWorkspace
          system={lukasiewiczSystem}
          workspace={ws}
          testId="workspace"
        />,
      );

      expect(
        screen.getByTestId("proof-node-node-1-axiom-name"),
      ).toHaveTextContent("A3");
    });

    it("does not show axiom name badge for non-axiom formula", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Custom", { x: 0, y: 0 }, "phi -> psi");

      render(
        <ProofWorkspace
          system={lukasiewiczSystem}
          workspace={ws}
          testId="workspace"
        />,
      );

      expect(
        screen.queryByTestId("proof-node-node-1-axiom-name"),
      ).not.toBeInTheDocument();
    });

    it("does not show axiom name badge for empty formula", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 }, "");

      render(
        <ProofWorkspace
          system={lukasiewiczSystem}
          workspace={ws}
          testId="workspace"
        />,
      );

      expect(
        screen.queryByTestId("proof-node-node-1-axiom-name"),
      ).not.toBeInTheDocument();
    });

    it("does not show axiom name badge for parse-error formula", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 }, "-> ->");

      render(
        <ProofWorkspace
          system={lukasiewiczSystem}
          workspace={ws}
          testId="workspace"
        />,
      );

      expect(
        screen.queryByTestId("proof-node-node-1-axiom-name"),
      ).not.toBeInTheDocument();
    });

    it("shows axiom name for MP conclusion that matches an axiom pattern", () => {
      // MP conclusion phi -> (psi -> phi) is also A1
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A", { x: 0, y: 0 }, "alpha");
      ws = addNode(
        ws,
        "axiom",
        "B",
        { x: 200, y: 0 },
        "alpha -> (phi -> (psi -> phi))",
      );
      const result = applyMPAndConnect(ws, "node-1", "node-2", {
        x: 100,
        y: 150,
      });

      render(
        <ProofWorkspace
          system={lukasiewiczSystem}
          workspace={result.workspace}
          testId="workspace"
        />,
      );

      // MP node (node-3) conclusion = phi -> (psi -> phi) = A1
      expect(
        screen.getByTestId("proof-node-node-3-axiom-name"),
      ).toHaveTextContent("A1 (K)");
    });
  });

  describe("selection and copy-paste", () => {
    it("shows selection banner when node is clicked", async () => {
      const user = userEvent.setup();
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 100, y: 100 }, "phi -> psi");

      render(
        <StatefulWorkspace initialWorkspace={ws} testId="workspace" />,
      );

      // Click on the node
      const node = screen.getByTestId("proof-node-node-1");
      await user.click(node);

      // Selection banner should appear
      await waitFor(() => {
        expect(
          screen.getByTestId("workspace-selection-banner"),
        ).toHaveTextContent("1 node selected");
      });
    });

    it("selects multiple nodes with Ctrl+click", async () => {
      const user = userEvent.setup();
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 100, y: 100 }, "phi");
      ws = addNode(ws, "axiom", "A2", { x: 300, y: 100 }, "psi");

      render(
        <StatefulWorkspace initialWorkspace={ws} testId="workspace" />,
      );

      // Click first node
      const node1 = screen.getByTestId("proof-node-node-1");
      await user.click(node1);

      // Ctrl+click second node
      const node2 = screen.getByTestId("proof-node-node-2");
      await user.keyboard("{Control>}");
      await user.click(node2);
      await user.keyboard("{/Control}");

      await waitFor(() => {
        expect(
          screen.getByTestId("workspace-selection-banner"),
        ).toHaveTextContent("2 nodes selected");
      });
    });

    it("clears selection when canvas is clicked", async () => {
      const user = userEvent.setup();
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 100, y: 100 }, "phi");

      render(
        <StatefulWorkspace initialWorkspace={ws} testId="workspace" />,
      );

      // Click the node to select
      const node = screen.getByTestId("proof-node-node-1");
      await user.click(node);

      await waitFor(() => {
        expect(
          screen.getByTestId("workspace-selection-banner"),
        ).toBeInTheDocument();
      });

      // Click the container to clear selection
      const container = screen.getByTestId("workspace");
      await user.click(container);

      await waitFor(() => {
        expect(
          screen.queryByTestId("workspace-selection-banner"),
        ).not.toBeInTheDocument();
      });
    });

    it("deletes selected nodes via delete button", async () => {
      const user = userEvent.setup();
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 100, y: 100 }, "phi");
      ws = addNode(ws, "axiom", "A2", { x: 300, y: 100 }, "psi");

      render(
        <StatefulWorkspace initialWorkspace={ws} testId="workspace" />,
      );

      // Select node-1
      const node1 = screen.getByTestId("proof-node-node-1");
      await user.click(node1);

      // Click delete button
      const deleteButton = screen.getByTestId("workspace-delete-button");
      await user.click(deleteButton);

      // node-1 should be gone, node-2 should remain
      await waitFor(() => {
        expect(
          screen.queryByTestId("proof-node-node-1"),
        ).not.toBeInTheDocument();
        expect(
          screen.getByTestId("proof-node-node-2"),
        ).toBeInTheDocument();
      });
    });

    it("copy and paste creates new nodes", async () => {
      const user = userEvent.setup();
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 100, y: 100 }, "phi");

      render(
        <StatefulWorkspace initialWorkspace={ws} testId="workspace" />,
      );

      // Select node
      const node = screen.getByTestId("proof-node-node-1");
      await user.click(node);

      // Click copy button
      const copyButton = screen.getByTestId("workspace-copy-button");
      await user.click(copyButton);

      // Click paste button
      const pasteButton = screen.getByTestId("workspace-paste-button");
      await user.click(pasteButton);

      // New node should appear (node-2)
      await waitFor(() => {
        expect(
          screen.getByTestId("proof-node-node-2"),
        ).toBeInTheDocument();
      });
    });

    it("does not delete protected nodes in quest mode", async () => {
      const user = userEvent.setup();
      const ws = createQuestWorkspace(lukasiewiczSystem, [
        { formulaText: "phi", position: { x: 100, y: 100 } },
      ]);

      render(
        <StatefulWorkspace initialWorkspace={ws} testId="workspace" />,
      );

      // Select the protected node
      const node = screen.getByTestId("proof-node-node-1");
      await user.click(node);

      // Click delete button
      const deleteButton = screen.getByTestId("workspace-delete-button");
      await user.click(deleteButton);

      // Protected node should remain
      expect(
        screen.getByTestId("proof-node-node-1"),
      ).toBeInTheDocument();
    });
  });
});

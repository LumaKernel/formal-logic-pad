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
  addNode,
  addConnection,
  updateGoalFormulaText,
  applyMPAndConnect,
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
});

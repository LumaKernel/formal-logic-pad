import { useState, useCallback } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  lukasiewiczSystem,
  predicateLogicSystem,
  equalityLogicSystem,
} from "../logic-core/inferenceRule";
import { allReferenceEntries } from "../reference/referenceContent";
import type { Formula } from "../logic-core/formula";
import { ProofWorkspace } from "./ProofWorkspace";
import type { WorkspaceState } from "./workspaceState";
import {
  createEmptyWorkspace,
  createQuestWorkspace,
  addNode,
  addConnection,
  updateNodeRole,
  updateNodeGenVariableName,
  applyMPAndConnect,
  applyGenAndConnect,
  applySubstitutionAndConnect,
  duplicateNode,
} from "./workspaceState";

// --- 状態管理ラッパー（インタラクションテスト用） ---

function StatefulWorkspace({
  initialWorkspace,
  onFormulaParsed,
  onGoalAchieved,
  showDependencies,
  testId = "workspace",
}: {
  readonly initialWorkspace: WorkspaceState;
  readonly onFormulaParsed?: (nodeId: string, formula: Formula) => void;
  readonly onGoalAchieved?: (info: {
    readonly matchingNodeId: string;
    readonly stepCount: number;
  }) => void;
  readonly showDependencies?: boolean;
  readonly testId?: string;
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
      onGoalAchieved={onGoalAchieved}
      showDependencies={showDependencies}
      testId={testId}
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

    it("opens parametric axiom panel when A4 palette item is clicked", async () => {
      const user = userEvent.setup();
      render(
        <ProofWorkspace system={predicateLogicSystem} testId="workspace" />,
      );
      await user.click(screen.getByTestId("workspace-axiom-palette-item-A4"));
      expect(
        screen.getByTestId("workspace-parametric-axiom-panel"),
      ).toBeInTheDocument();
    });

    it("opens parametric axiom panel when A5 palette item is clicked", async () => {
      const user = userEvent.setup();
      render(
        <ProofWorkspace system={predicateLogicSystem} testId="workspace" />,
      );
      await user.click(screen.getByTestId("workspace-axiom-palette-item-A5"));
      expect(
        screen.getByTestId("workspace-parametric-axiom-panel"),
      ).toBeInTheDocument();
    });

    it("closes parametric axiom panel on cancel", async () => {
      const user = userEvent.setup();
      render(
        <ProofWorkspace system={predicateLogicSystem} testId="workspace" />,
      );
      await user.click(screen.getByTestId("workspace-axiom-palette-item-A4"));
      expect(
        screen.getByTestId("workspace-parametric-axiom-panel"),
      ).toBeInTheDocument();
      await user.click(
        screen.getByTestId("workspace-parametric-axiom-panel-cancel"),
      );
      expect(
        screen.queryByTestId("workspace-parametric-axiom-panel"),
      ).not.toBeInTheDocument();
    });

    it("adds axiom node via parametric panel A4 confirm", async () => {
      const user = userEvent.setup();
      const onWorkspaceChange = vi.fn();
      const ws = createEmptyWorkspace(predicateLogicSystem);
      render(
        <ProofWorkspace
          system={predicateLogicSystem}
          workspace={ws}
          onWorkspaceChange={onWorkspaceChange}
          testId="workspace"
        />,
      );
      await user.click(screen.getByTestId("workspace-axiom-palette-item-A4"));
      const input = screen.getByTestId(
        "workspace-parametric-axiom-panel-universal-input",
      );
      await user.type(input, "all x. x + 0 = x");
      await user.click(
        screen.getByTestId("workspace-parametric-axiom-panel-confirm"),
      );
      expect(onWorkspaceChange).toHaveBeenCalled();
      const lastCall =
        onWorkspaceChange.mock.calls[onWorkspaceChange.mock.calls.length - 1];
      const updatedWs = lastCall?.[0] as WorkspaceState;
      expect(updatedWs.nodes.length).toBeGreaterThan(0);
      const addedNode = updatedWs.nodes[updatedWs.nodes.length - 1];
      expect(addedNode?.formulaText).toContain("τ");
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
      expect(newState.nodes[0].label).toBe("Axiom");
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

    it("shows axiom dependencies on derived MP node", async () => {
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

      // MP node should show dependencies on axiom nodes
      await waitFor(() => {
        expect(
          screen.getByTestId("proof-node-node-3-dependencies"),
        ).toBeInTheDocument();
        expect(
          screen.getByTestId("proof-node-node-3-dependencies"),
        ).toHaveTextContent("Depends on:");
      });
    });

    it("hides axiom dependencies when showDependencies=false", async () => {
      const user = userEvent.setup();

      render(
        <StatefulWorkspace
          initialWorkspace={(() => {
            let ws = createEmptyWorkspace(lukasiewiczSystem);
            ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 }, "phi");
            ws = addNode(ws, "axiom", "A2", { x: 200, y: 0 }, "phi -> psi");
            return ws;
          })()}
          showDependencies={false}
        />,
      );

      // Apply MP
      await user.click(screen.getByTestId("workspace-mp-button"));
      await user.click(screen.getByTestId("proof-node-node-1"));
      await user.click(screen.getByTestId("proof-node-node-2"));

      // MP node should exist but dependencies should be hidden
      await waitFor(() => {
        expect(screen.getByTestId("proof-node-node-3")).toBeInTheDocument();
      });
      expect(
        screen.queryByTestId("proof-node-node-3-dependencies"),
      ).not.toBeInTheDocument();
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
      expect(newState.nodes[2].kind).toBe("derived");
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

  describe("MP compatible node highlighting", () => {
    it("dims incompatible nodes after left premise is selected", async () => {
      const user = userEvent.setup();

      render(
        <StatefulWorkspace
          initialWorkspace={(() => {
            let ws = createEmptyWorkspace(lukasiewiczSystem);
            // node-1: left premise "phi"
            ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 }, "phi");
            // node-2: compatible right premise "phi -> psi"
            ws = addNode(ws, "axiom", "A2", { x: 200, y: 0 }, "phi -> psi");
            // node-3: incompatible (not an implication) "psi"
            ws = addNode(ws, "axiom", "A3", { x: 400, y: 0 }, "psi");
            return ws;
          })()}
        />,
      );

      // Enter MP selection mode and select left premise
      await user.click(screen.getByTestId("workspace-mp-button"));
      await user.click(screen.getByTestId("proof-node-node-1"));

      // Now in "selecting-right" phase
      expect(screen.getByTestId("workspace-mp-banner")).toHaveTextContent(
        "Click the right premise",
      );

      // Compatible node (node-2) should NOT be dimmed
      const compatibleWrapper =
        screen.getByTestId("proof-node-node-2").parentElement!;
      expect(compatibleWrapper.style.opacity).not.toBe("0.35");

      // Incompatible node (node-3) should be dimmed
      const incompatibleWrapper =
        screen.getByTestId("proof-node-node-3").parentElement!;
      expect(incompatibleWrapper.style.opacity).toBe("0.35");
    });

    it("does not dim nodes during selecting-left phase", async () => {
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

      // Enter MP selection mode (selecting-left phase)
      await user.click(screen.getByTestId("workspace-mp-button"));
      expect(screen.getByTestId("workspace-mp-banner")).toHaveTextContent(
        "Click the left premise",
      );

      // No nodes should be dimmed
      const node1Wrapper =
        screen.getByTestId("proof-node-node-1").parentElement!;
      const node2Wrapper =
        screen.getByTestId("proof-node-node-2").parentElement!;
      expect(node1Wrapper.style.opacity).not.toBe("0.35");
      expect(node2Wrapper.style.opacity).not.toBe("0.35");
    });

    it("gives compatible nodes a solid outline in selecting-right phase", async () => {
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

      await user.click(screen.getByTestId("workspace-mp-button"));
      await user.click(screen.getByTestId("proof-node-node-1"));

      // Compatible node should have solid outline (not dashed)
      const compatibleWrapper =
        screen.getByTestId("proof-node-node-2").parentElement!;
      expect(compatibleWrapper.style.outline).toContain("solid");
      expect(compatibleWrapper.style.outline).not.toContain("dashed");
    });

    it("selects node when clicking on label area (not formula) during MP selection", async () => {
      const user = userEvent.setup();

      render(
        <StatefulWorkspace
          initialWorkspace={(() => {
            let ws = createEmptyWorkspace(lukasiewiczSystem);
            ws = addNode(ws, "axiom", "Left", { x: 0, y: 0 }, "phi");
            ws = addNode(ws, "axiom", "Right", { x: 200, y: 0 }, "phi -> psi");
            return ws;
          })()}
          testId="workspace"
        />,
      );

      // Enter MP selection mode
      await user.click(screen.getByTestId("workspace-mp-button"));

      // Click on the node container (not the formula editor area)
      // This simulates clicking on the label/badge area of the node card
      const nodeContainer = screen.getByTestId("proof-node-node-1");
      await user.click(nodeContainer);

      // Should advance to selecting-right phase
      await waitFor(() => {
        expect(screen.getByTestId("workspace-mp-banner")).toHaveTextContent(
          "Click the right premise",
        );
      });
    });
  });

  describe("goal setting and completion", () => {
    it("shows proof complete banner when goal is achieved", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "axiom", "Goal", { x: 400, y: 0 }, "phi");
      ws = updateNodeRole(ws, "node-2", "goal");
      // ゴールノードへの接続がなければ達成にならない
      ws = addConnection(ws, "node-1", "output", "node-2", "input");

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
      ws = addNode(ws, "axiom", "Goal", { x: 400, y: 0 }, "phi -> phi");
      ws = updateNodeRole(ws, "node-1", "goal");

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

    it("shows banner when MP application completes the goal", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "axiom", "A2", { x: 200, y: 0 }, "phi -> psi");
      const result = applyMPAndConnect(ws, "node-1", "node-2", {
        x: 100,
        y: 150,
      });
      ws = addNode(result.workspace, "axiom", "Goal", { x: 400, y: 0 }, "psi");
      ws = updateNodeRole(ws, "node-4", "goal");
      // MP結果ノードからゴールノードへの接続が必要
      ws = addConnection(ws, "node-3", "output", "node-4", "input");

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
    });

    it("calls onGoalAchieved when goal is achieved (external state)", () => {
      const onGoalAchieved = vi.fn();
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "axiom", "Goal", { x: 400, y: 0 }, "phi");
      ws = updateNodeRole(ws, "node-2", "goal");
      // ゴールノードへの接続が必要
      ws = addConnection(ws, "node-1", "output", "node-2", "input");

      render(
        <ProofWorkspace
          system={lukasiewiczSystem}
          workspace={ws}
          onGoalAchieved={onGoalAchieved}
          testId="workspace"
        />,
      );

      expect(onGoalAchieved).toHaveBeenCalledTimes(1);
      expect(onGoalAchieved).toHaveBeenCalledWith({
        matchingNodeId: "node-1",
        stepCount: 1,
      });
    });

    it("does not call onGoalAchieved when goal is not set", () => {
      const onGoalAchieved = vi.fn();
      render(
        <ProofWorkspace
          system={lukasiewiczSystem}
          onGoalAchieved={onGoalAchieved}
          testId="workspace"
        />,
      );
      expect(onGoalAchieved).not.toHaveBeenCalled();
    });

    it("does not call onGoalAchieved when goal is not yet achieved", () => {
      const onGoalAchieved = vi.fn();
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Goal", { x: 400, y: 0 }, "phi -> phi");
      ws = updateNodeRole(ws, "node-1", "goal");

      render(
        <ProofWorkspace
          system={lukasiewiczSystem}
          workspace={ws}
          onGoalAchieved={onGoalAchieved}
          testId="workspace"
        />,
      );
      expect(onGoalAchieved).not.toHaveBeenCalled();
    });

    it("calls onGoalAchieved when quest goal is achieved (quest mode)", () => {
      const onGoalAchieved = vi.fn();
      // Create quest workspace with a goal
      let ws = createQuestWorkspace(lukasiewiczSystem, [
        {
          formulaText: "phi -> (psi -> phi)",
          label: "Goal",
          position: { x: 0, y: 0 },
        },
      ]);
      // Add an axiom node that matches the goal (A1)
      ws = addNode(ws, "axiom", "A1", { x: 200, y: 0 }, "phi -> (psi -> phi)");

      render(
        <ProofWorkspace
          system={lukasiewiczSystem}
          workspace={ws}
          onGoalAchieved={onGoalAchieved}
          testId="workspace"
        />,
      );

      expect(onGoalAchieved).toHaveBeenCalledTimes(1);
      expect(onGoalAchieved).toHaveBeenCalledWith({
        matchingNodeId: "",
        stepCount: 1,
      });
    });

    it("does not call onGoalAchieved when quest goal is not achieved", () => {
      const onGoalAchieved = vi.fn();
      let ws = createQuestWorkspace(lukasiewiczSystem, [
        {
          formulaText: "phi -> phi",
          label: "Goal",
          position: { x: 0, y: 0 },
        },
      ]);
      // Add an axiom that does NOT match the goal
      ws = addNode(ws, "axiom", "A1", { x: 200, y: 0 }, "phi -> (psi -> phi)");

      render(
        <ProofWorkspace
          system={lukasiewiczSystem}
          workspace={ws}
          onGoalAchieved={onGoalAchieved}
          testId="workspace"
        />,
      );

      expect(onGoalAchieved).not.toHaveBeenCalled();
    });

    it("shows proof complete banner when quest goal is achieved", () => {
      let ws = createQuestWorkspace(lukasiewiczSystem, [
        {
          formulaText: "phi -> (psi -> phi)",
          label: "Goal",
          position: { x: 0, y: 0 },
        },
      ]);
      ws = addNode(ws, "axiom", "A1", { x: 200, y: 0 }, "phi -> (psi -> phi)");

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
      expect(container.firstChild).toBeInTheDocument();
    });

    it("testIdなしでゴール達成バナーが表示される", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 }, "φ → φ");
      ws = addNode(ws, "axiom", "Goal", { x: 400, y: 0 }, "φ → φ");
      ws = updateNodeRole(ws, "node-2", "goal");
      // ゴールノードへの接続が必要
      ws = addConnection(ws, "node-1", "output", "node-2", "input");
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
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 }, "phi -> (psi -> phi)");

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

  describe("axiom non-trivial substitution warning", () => {
    it("shows warning for non-trivial axiom instance", () => {
      // phi -> (phi -> phi) is A1 with psi:=phi (non-trivial: same meta-var for different slots)
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "phi -> (phi -> phi)");

      render(
        <ProofWorkspace
          system={lukasiewiczSystem}
          workspace={ws}
          testId="workspace"
        />,
      );

      expect(screen.getByTestId("proof-node-node-1-status")).toHaveTextContent(
        "Needs substitution step",
      );
    });

    it("does not show warning for trivial axiom instance", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "phi -> (psi -> phi)");

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

    it("does not show warning for derived nodes", () => {
      // MP conclusion might match an axiom pattern but it's derived, not root-axiom
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A", { x: 0, y: 0 }, "alpha");
      ws = addNode(
        ws,
        "axiom",
        "B",
        { x: 200, y: 0 },
        "alpha -> (phi -> (phi -> phi))",
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

      // MP node (node-3) conclusion = phi -> (phi -> phi) matches A1 non-trivially,
      // but it's a derived node so no warning should be shown
      expect(
        screen.queryByTestId("proof-node-node-3-status"),
      ).toHaveTextContent("MP applied");
    });
  });

  describe("selection and copy-paste", () => {
    it("shows selection banner when node is clicked", async () => {
      const user = userEvent.setup();
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 100, y: 100 }, "phi -> psi");

      render(<StatefulWorkspace initialWorkspace={ws} testId="workspace" />);

      // Click on the node
      const node = screen.getByTestId("proof-node-node-1");
      await user.click(node);

      // Selection banner should appear
      await waitFor(() => {
        expect(
          screen.getByTestId("workspace-selection-banner"),
        ).toHaveTextContent("1 node(s) selected");
      });
    });

    it("selects multiple nodes with Ctrl+click", async () => {
      const user = userEvent.setup();
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 100, y: 100 }, "phi");
      ws = addNode(ws, "axiom", "A2", { x: 300, y: 100 }, "psi");

      render(<StatefulWorkspace initialWorkspace={ws} testId="workspace" />);

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
        ).toHaveTextContent("2 node(s) selected");
      });
    });

    it("clears selection when canvas is clicked", async () => {
      const user = userEvent.setup();
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 100, y: 100 }, "phi");

      render(<StatefulWorkspace initialWorkspace={ws} testId="workspace" />);

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

      render(<StatefulWorkspace initialWorkspace={ws} testId="workspace" />);

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
        expect(screen.getByTestId("proof-node-node-2")).toBeInTheDocument();
      });
    });

    it("copy and paste creates new nodes", async () => {
      const user = userEvent.setup();
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 100, y: 100 }, "phi");

      render(<StatefulWorkspace initialWorkspace={ws} testId="workspace" />);

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
        expect(screen.getByTestId("proof-node-node-2")).toBeInTheDocument();
      });
    });

    it("duplicate creates new nodes with offset", async () => {
      const user = userEvent.setup();
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 100, y: 100 }, "phi");

      render(<StatefulWorkspace initialWorkspace={ws} testId="workspace" />);

      // Select node
      const node = screen.getByTestId("proof-node-node-1");
      await user.click(node);

      // Click duplicate button
      const duplicateButton = screen.getByTestId("workspace-duplicate-button");
      await user.click(duplicateButton);

      // New node should appear (node-2)
      await waitFor(() => {
        expect(screen.getByTestId("proof-node-node-2")).toBeInTheDocument();
      });
    });

    it("cut removes nodes and allows paste", async () => {
      const user = userEvent.setup();
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 100, y: 100 }, "phi");
      ws = addNode(ws, "axiom", "A2", { x: 200, y: 200 }, "psi");

      render(<StatefulWorkspace initialWorkspace={ws} testId="workspace" />);

      // Select node-1
      const node = screen.getByTestId("proof-node-node-1");
      await user.click(node);

      // Click cut button
      const cutButton = screen.getByTestId("workspace-cut-button");
      await user.click(cutButton);

      // node-1 should be removed
      await waitFor(() => {
        expect(
          screen.queryByTestId("proof-node-node-1"),
        ).not.toBeInTheDocument();
      });

      // node-2 should remain
      expect(screen.getByTestId("proof-node-node-2")).toBeInTheDocument();
    });

    it("does not delete protected nodes in quest mode", async () => {
      const user = userEvent.setup();
      const ws = createQuestWorkspace(lukasiewiczSystem, [
        { formulaText: "phi", position: { x: 100, y: 100 } },
      ]);

      render(<StatefulWorkspace initialWorkspace={ws} testId="workspace" />);

      // Select the protected node
      const node = screen.getByTestId("proof-node-node-1");
      await user.click(node);

      // Click delete button
      const deleteButton = screen.getByTestId("workspace-delete-button");
      await user.click(deleteButton);

      // Protected node should remain
      expect(screen.getByTestId("proof-node-node-1")).toBeInTheDocument();
    });
  });

  describe("node context menu - select subtree", () => {
    it("right-click on node opens context menu with Select Subtree", async () => {
      const user = userEvent.setup();
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 }, "phi -> phi");

      render(<StatefulWorkspace initialWorkspace={ws} testId="workspace" />);

      const node = screen.getByTestId("proof-node-node-1");
      await user.pointer({ keys: "[MouseRight]", target: node });

      expect(
        screen.getByTestId("workspace-select-subtree"),
      ).toBeInTheDocument();
    });

    it("Select Subtree selects node and all descendants via connections", async () => {
      const user = userEvent.setup();
      // axiom-1(node-1) → mp(node-3) ← axiom-2(node-2)
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "axiom", "A2", { x: 200, y: 0 }, "phi -> psi");
      ws = addNode(ws, "mp", "MP", { x: 100, y: 100 }, "psi");
      ws = addConnection(ws, "node-1", "out", "node-3", "premise-left");
      ws = addConnection(ws, "node-2", "out", "node-3", "premise-right");

      render(<StatefulWorkspace initialWorkspace={ws} testId="workspace" />);

      // Right-click on node-1 (axiom with descendant mp node)
      const node1 = screen.getByTestId("proof-node-node-1");
      await user.pointer({ keys: "[MouseRight]", target: node1 });

      // Click Select Subtree
      const selectSubtreeBtn = screen.getByTestId("workspace-select-subtree");
      await user.click(selectSubtreeBtn);

      // Context menu should be closed
      expect(
        screen.queryByTestId("workspace-node-context-menu"),
      ).not.toBeInTheDocument();

      // Selection banner should show 2 nodes (node-1 and node-3)
      await waitFor(() => {
        expect(
          screen.getByTestId("workspace-selection-banner"),
        ).toHaveTextContent("2 node(s) selected");
      });
    });

    it("Select Subtree on leaf node selects only that node", async () => {
      const user = userEvent.setup();
      // axiom(node-1) → mp(node-2) (node-2 is leaf in subtree direction)
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "mp", "MP", { x: 100, y: 100 }, "psi");
      ws = addConnection(ws, "node-1", "out", "node-2", "premise-left");

      render(<StatefulWorkspace initialWorkspace={ws} testId="workspace" />);

      // Right-click on mp node (no further children)
      const mpNode = screen.getByTestId("proof-node-node-2");
      await user.pointer({ keys: "[MouseRight]", target: mpNode });

      const selectSubtreeBtn = screen.getByTestId("workspace-select-subtree");
      await user.click(selectSubtreeBtn);

      await waitFor(() => {
        expect(
          screen.getByTestId("workspace-selection-banner"),
        ).toHaveTextContent("1 node(s) selected");
      });
    });

    it("context menu closes when clicking canvas", async () => {
      const user = userEvent.setup();
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 }, "phi");

      render(<StatefulWorkspace initialWorkspace={ws} testId="workspace" />);

      // Open context menu
      const node = screen.getByTestId("proof-node-node-1");
      await user.pointer({ keys: "[MouseRight]", target: node });
      expect(
        screen.getByTestId("workspace-node-context-menu"),
      ).toBeInTheDocument();

      // Click on the workspace (canvas area)
      const canvas = screen.getByTestId("workspace");
      await user.click(canvas);

      // Context menu should be closed
      expect(
        screen.queryByTestId("workspace-node-context-menu"),
      ).not.toBeInTheDocument();
    });
  });

  describe("node context menu - MP/Gen actions", () => {
    it("shows Use as MP Left and Use as MP Right items in context menu", async () => {
      const user = userEvent.setup();
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 }, "phi -> psi");

      render(<StatefulWorkspace initialWorkspace={ws} testId="workspace" />);

      const node = screen.getByTestId("proof-node-node-1");
      await user.pointer({ keys: "[MouseRight]", target: node });

      expect(
        screen.getByTestId("workspace-use-as-mp-left"),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("workspace-use-as-mp-right"),
      ).toBeInTheDocument();
    });

    it("Use as MP Right is disabled when node formula is not an implication", async () => {
      const user = userEvent.setup();
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 }, "phi");

      render(<StatefulWorkspace initialWorkspace={ws} testId="workspace" />);

      const node = screen.getByTestId("proof-node-node-1");
      await user.pointer({ keys: "[MouseRight]", target: node });

      const mpRightBtn = screen.getByTestId("workspace-use-as-mp-right");
      expect(mpRightBtn).toBeDisabled();
    });

    it("Use as MP Right is enabled when node formula is an implication", async () => {
      const user = userEvent.setup();
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 }, "phi -> psi");

      render(<StatefulWorkspace initialWorkspace={ws} testId="workspace" />);

      const node = screen.getByTestId("proof-node-node-1");
      await user.pointer({ keys: "[MouseRight]", target: node });

      const mpRightBtn = screen.getByTestId("workspace-use-as-mp-right");
      expect(mpRightBtn).not.toBeDisabled();
    });

    it("Use as MP Left starts MP selection in selecting-right phase with banner", async () => {
      const user = userEvent.setup();
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 }, "phi");

      render(<StatefulWorkspace initialWorkspace={ws} testId="workspace" />);

      const node = screen.getByTestId("proof-node-node-1");
      await user.pointer({ keys: "[MouseRight]", target: node });

      const mpLeftBtn = screen.getByTestId("workspace-use-as-mp-left");
      await user.click(mpLeftBtn);

      // Context menu should be closed
      expect(
        screen.queryByTestId("workspace-node-context-menu"),
      ).not.toBeInTheDocument();

      // MP selection banner should be visible (asking for right premise)
      expect(screen.getByTestId("workspace-mp-banner")).toHaveTextContent(
        "Click the right premise",
      );
    });

    it("Use as MP Right starts selecting-left-for-right phase with banner", async () => {
      const user = userEvent.setup();
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 }, "phi -> psi");

      render(<StatefulWorkspace initialWorkspace={ws} testId="workspace" />);

      const node = screen.getByTestId("proof-node-node-1");
      await user.pointer({ keys: "[MouseRight]", target: node });

      const mpRightBtn = screen.getByTestId("workspace-use-as-mp-right");
      await user.click(mpRightBtn);

      // Context menu should be closed
      expect(
        screen.queryByTestId("workspace-node-context-menu"),
      ).not.toBeInTheDocument();

      // MP selection banner should be visible (asking for left premise)
      expect(screen.getByTestId("workspace-mp-banner")).toHaveTextContent(
        "Click the left premise",
      );
    });

    it("Use as MP Left then clicking right premise applies MP", async () => {
      const user = userEvent.setup();
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Left", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "axiom", "Right", { x: 200, y: 0 }, "phi -> psi");

      render(<StatefulWorkspace initialWorkspace={ws} testId="workspace" />);

      // Right-click on left premise and use as MP left
      const leftNode = screen.getByTestId("proof-node-node-1");
      await user.pointer({ keys: "[MouseRight]", target: leftNode });
      await user.click(screen.getByTestId("workspace-use-as-mp-left"));

      // Click right premise to apply MP
      const rightNode = screen.getByTestId("proof-node-node-2");
      await user.click(rightNode);

      // MP should be applied - new MP node should be created
      await waitFor(() => {
        expect(screen.getByTestId("proof-node-node-3")).toBeInTheDocument();
      });

      // Banner should be gone
      expect(
        screen.queryByTestId("workspace-mp-banner"),
      ).not.toBeInTheDocument();
    });

    it("Use as MP Right then clicking left premise applies MP", async () => {
      const user = userEvent.setup();
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Left", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "axiom", "Right", { x: 200, y: 0 }, "phi -> psi");

      render(<StatefulWorkspace initialWorkspace={ws} testId="workspace" />);

      // Right-click on right premise (implication) and use as MP right
      const rightNode = screen.getByTestId("proof-node-node-2");
      await user.pointer({ keys: "[MouseRight]", target: rightNode });
      await user.click(screen.getByTestId("workspace-use-as-mp-right"));

      // Click left premise to apply MP
      const leftNode = screen.getByTestId("proof-node-node-1");
      await user.click(leftNode);

      // MP should be applied - new MP node should be created
      await waitFor(() => {
        expect(screen.getByTestId("proof-node-node-3")).toBeInTheDocument();
      });

      // Banner should be gone
      expect(
        screen.queryByTestId("workspace-mp-banner"),
      ).not.toBeInTheDocument();
    });

    it("does not show Apply Gen in context menu when Gen is not enabled", async () => {
      const user = userEvent.setup();
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 }, "phi");

      render(<StatefulWorkspace initialWorkspace={ws} testId="workspace" />);

      const node = screen.getByTestId("proof-node-node-1");
      await user.pointer({ keys: "[MouseRight]", target: node });

      expect(
        screen.queryByTestId("workspace-apply-gen-to-node"),
      ).not.toBeInTheDocument();
    });

    it("shows Apply Gen in context menu when Gen is enabled (predicate logic)", async () => {
      const user = userEvent.setup();
      let ws = createEmptyWorkspace(predicateLogicSystem);
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 }, "phi");

      render(<StatefulWorkspace initialWorkspace={ws} testId="workspace" />);

      const node = screen.getByTestId("proof-node-node-1");
      await user.pointer({ keys: "[MouseRight]", target: node });

      expect(
        screen.getByTestId("workspace-apply-gen-to-node"),
      ).toBeInTheDocument();
    });

    it("Apply Gen opens variable name prompt, entering name and confirming applies Gen", async () => {
      const user = userEvent.setup();
      let ws = createEmptyWorkspace(predicateLogicSystem);
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 }, "phi");

      render(<StatefulWorkspace initialWorkspace={ws} testId="workspace" />);

      // Right-click and select Apply Gen
      const node = screen.getByTestId("proof-node-node-1");
      await user.pointer({ keys: "[MouseRight]", target: node });
      await user.click(screen.getByTestId("workspace-apply-gen-to-node"));

      // Prompt should appear
      const input = screen.getByTestId("workspace-gen-prompt-input");
      expect(input).toBeInTheDocument();

      // Type variable name and confirm
      await user.type(input, "x");
      const confirmBtn = screen.getByTestId("workspace-gen-prompt-confirm");
      await user.click(confirmBtn);

      // Gen should be applied - new Gen node should be created
      await waitFor(() => {
        expect(screen.getByTestId("proof-node-node-2")).toBeInTheDocument();
      });

      // Prompt should be gone
      expect(
        screen.queryByTestId("workspace-gen-prompt-banner"),
      ).not.toBeInTheDocument();
    });

    it("Gen prompt confirms with Enter key", async () => {
      const user = userEvent.setup();
      let ws = createEmptyWorkspace(predicateLogicSystem);
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 }, "phi");

      render(<StatefulWorkspace initialWorkspace={ws} testId="workspace" />);

      // Right-click and select Apply Gen
      const node = screen.getByTestId("proof-node-node-1");
      await user.pointer({ keys: "[MouseRight]", target: node });
      await user.click(screen.getByTestId("workspace-apply-gen-to-node"));

      // Type variable name and press Enter
      const input = screen.getByTestId("workspace-gen-prompt-input");
      await user.type(input, "x{Enter}");

      // Gen should be applied - new Gen node should be created
      await waitFor(() => {
        expect(screen.getByTestId("proof-node-node-2")).toBeInTheDocument();
      });

      // Prompt should be gone
      expect(
        screen.queryByTestId("workspace-gen-prompt-banner"),
      ).not.toBeInTheDocument();
    });

    it("Gen prompt can be cancelled", async () => {
      const user = userEvent.setup();
      let ws = createEmptyWorkspace(predicateLogicSystem);
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 }, "phi");

      render(<StatefulWorkspace initialWorkspace={ws} testId="workspace" />);

      // Right-click and select Apply Gen
      const node = screen.getByTestId("proof-node-node-1");
      await user.pointer({ keys: "[MouseRight]", target: node });
      await user.click(screen.getByTestId("workspace-apply-gen-to-node"));

      // Prompt should appear
      expect(
        screen.getByTestId("workspace-gen-prompt-banner"),
      ).toBeInTheDocument();

      // Press Escape to cancel
      const input = screen.getByTestId("workspace-gen-prompt-input");
      await user.type(input, "{Escape}");

      // Prompt should be gone
      expect(
        screen.queryByTestId("workspace-gen-prompt-banner"),
      ).not.toBeInTheDocument();
    });
  });

  describe("auto layout toggle", () => {
    it("shows auto layout toggle in header", () => {
      render(<ProofWorkspace system={lukasiewiczSystem} testId="workspace" />);
      expect(
        screen.getByTestId("workspace-auto-layout-toggle"),
      ).toBeInTheDocument();
    });

    it("direction selector appears when auto layout is enabled", async () => {
      const user = userEvent.setup();
      render(<ProofWorkspace system={lukasiewiczSystem} testId="workspace" />);

      expect(
        screen.queryByTestId("workspace-auto-layout-direction"),
      ).not.toBeInTheDocument();

      const toggle = screen.getByTestId("workspace-auto-layout-toggle");
      await user.click(toggle);

      expect(
        screen.getByTestId("workspace-auto-layout-direction"),
      ).toBeInTheDocument();
    });

    it("applies incremental layout when axiom is added with auto layout enabled", async () => {
      const user = userEvent.setup();
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 100, y: 100 }, "phi");

      render(<StatefulWorkspace initialWorkspace={ws} testId="workspace" />);

      // Enable auto layout
      const toggle = screen.getByTestId("workspace-auto-layout-toggle");
      await user.click(toggle);

      // The toggle should be checked
      expect(toggle).toBeChecked();

      // Add an axiom by clicking the first palette item
      const paletteItems = screen.getAllByRole("button", { name: /A1/i });
      if (paletteItems.length > 0) {
        await user.click(paletteItems[0]!);
      }
    });
  });

  describe("推論規則リファレンスポップオーバー統合", () => {
    it("referenceEntries指定時にMPボタン横に(?)が表示される", () => {
      render(
        <ProofWorkspace
          system={lukasiewiczSystem}
          referenceEntries={allReferenceEntries}
          locale="ja"
          testId="workspace"
        />,
      );
      const trigger = screen.getByTestId("workspace-mp-ref-trigger");
      expect(trigger).toBeInTheDocument();
      expect(trigger.textContent).toBe("?");
    });

    it("referenceEntries指定時にGenボタン横に(?)が表示される（述語論理体系）", () => {
      render(
        <ProofWorkspace
          system={predicateLogicSystem}
          referenceEntries={allReferenceEntries}
          locale="ja"
          testId="workspace"
        />,
      );
      const trigger = screen.getByTestId("workspace-gen-ref-trigger");
      expect(trigger).toBeInTheDocument();
      expect(trigger.textContent).toBe("?");
    });

    it("命題論理体系ではGenリファレンスが非表示", () => {
      render(
        <ProofWorkspace
          system={lukasiewiczSystem}
          referenceEntries={allReferenceEntries}
          locale="ja"
          testId="workspace"
        />,
      );
      expect(screen.queryByTestId("workspace-gen-ref-trigger")).toBeNull();
    });

    it("referenceEntries未指定時はMP(?)が非表示", () => {
      render(<ProofWorkspace system={lukasiewiczSystem} testId="workspace" />);
      expect(screen.queryByTestId("workspace-mp-ref-trigger")).toBeNull();
    });

    it("(?)クリックでポップオーバーが開く（MP選択モードに入らない）", async () => {
      const user = userEvent.setup();
      render(
        <ProofWorkspace
          system={lukasiewiczSystem}
          referenceEntries={allReferenceEntries}
          locale="ja"
          testId="workspace"
        />,
      );
      await user.click(screen.getByTestId("workspace-mp-ref-trigger"));
      // ポップオーバーが表示される
      expect(
        screen.getByTestId("workspace-mp-ref-popover"),
      ).toBeInTheDocument();
      // MP選択モードに入っていない（MPボタンのテキストがApplyのまま）
      expect(screen.getByTestId("workspace-mp-button")).toHaveTextContent("MP");
    });

    it("onOpenReferenceDetailが呼ばれる", async () => {
      const user = userEvent.setup();
      const handleDetail = vi.fn();
      render(
        <ProofWorkspace
          system={lukasiewiczSystem}
          referenceEntries={allReferenceEntries}
          locale="ja"
          onOpenReferenceDetail={handleDetail}
          testId="workspace"
        />,
      );
      // ポップオーバーを開く
      await user.click(screen.getByTestId("workspace-mp-ref-trigger"));
      // 「詳しく見る」ボタンをクリック
      const detailBtn = screen.getByTestId("workspace-mp-ref-detail-btn");
      await user.click(detailBtn);
      expect(handleDetail).toHaveBeenCalledWith("rule-mp");
    });

    it("英語ロケールでもリファレンスが表示される", () => {
      render(
        <ProofWorkspace
          system={lukasiewiczSystem}
          referenceEntries={allReferenceEntries}
          locale="en"
          testId="workspace"
        />,
      );
      expect(
        screen.getByTestId("workspace-mp-ref-trigger"),
      ).toBeInTheDocument();
    });
  });

  describe("構文ヘルプ伝播", () => {
    it("onOpenSyntaxHelp指定時、ノード編集モードでヘルプボタンが表示される", async () => {
      const user = userEvent.setup();
      const handleSyntaxHelp = vi.fn();
      const ws = addNode(
        createEmptyWorkspace(lukasiewiczSystem),
        "axiom",
        "A1",
        { x: 0, y: 0 },
        "φ → (ψ → φ)",
      );
      render(
        <ProofWorkspace
          system={lukasiewiczSystem}
          workspace={ws}
          onOpenSyntaxHelp={handleSyntaxHelp}
          testId="workspace"
        />,
      );
      // ノードの表示モードをクリックして編集モードに入る
      const nodeDisplay = screen.getByTestId(
        `proof-node-${ws.nodes[0]!.id satisfies string}-editor-display`,
      );
      await user.click(nodeDisplay);
      await waitFor(() => {
        expect(
          screen.getByTestId(
            `proof-node-${ws.nodes[0]!.id satisfies string}-editor-syntax-help`,
          ),
        ).toBeInTheDocument();
      });
    });

    it("onOpenSyntaxHelp未指定時はヘルプボタンが表示されない", async () => {
      const user = userEvent.setup();
      const ws = addNode(
        createEmptyWorkspace(lukasiewiczSystem),
        "axiom",
        "A1",
        { x: 0, y: 0 },
        "φ → (ψ → φ)",
      );
      render(
        <ProofWorkspace
          system={lukasiewiczSystem}
          workspace={ws}
          testId="workspace"
        />,
      );
      // ノードの表示モードをクリックして編集モードに入る
      const nodeDisplay = screen.getByTestId(
        `proof-node-${ws.nodes[0]!.id satisfies string}-editor-display`,
      );
      await user.click(nodeDisplay);
      await waitFor(() => {
        expect(
          screen.getByTestId(
            `proof-node-${ws.nodes[0]!.id satisfies string}-editor-edit`,
          ),
        ).toBeInTheDocument();
      });
      expect(
        screen.queryByTestId(
          `proof-node-${ws.nodes[0]!.id satisfies string}-editor-syntax-help`,
        ),
      ).not.toBeInTheDocument();
    });
  });

  describe("workspace menu (export/import)", () => {
    it("shows menu button and opens dropdown on click", async () => {
      const user = userEvent.setup();
      const ws = createEmptyWorkspace(lukasiewiczSystem);
      render(<StatefulWorkspace initialWorkspace={ws} testId="workspace" />);

      // メニューボタンが存在する
      const menuButton = screen.getByTestId("workspace-workspace-menu-button");
      expect(menuButton).toBeInTheDocument();

      // ドロップダウンは閉じている
      expect(
        screen.queryByTestId("workspace-workspace-menu"),
      ).not.toBeInTheDocument();

      // クリックで開く
      await user.click(menuButton);
      expect(
        screen.getByTestId("workspace-workspace-menu"),
      ).toBeInTheDocument();

      // Export/Import ボタンがメニュー内に存在する
      expect(
        screen.getByTestId("workspace-export-json-button"),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("workspace-export-svg-button"),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("workspace-export-png-button"),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("workspace-import-json-button"),
      ).toBeInTheDocument();
    });

    it("closes menu on second click of menu button", async () => {
      const user = userEvent.setup();
      const ws = createEmptyWorkspace(lukasiewiczSystem);
      render(<StatefulWorkspace initialWorkspace={ws} testId="workspace" />);

      const menuButton = screen.getByTestId("workspace-workspace-menu-button");

      // 開く
      await user.click(menuButton);
      expect(
        screen.getByTestId("workspace-workspace-menu"),
      ).toBeInTheDocument();

      // 再クリックで閉じる
      await user.click(menuButton);
      expect(
        screen.queryByTestId("workspace-workspace-menu"),
      ).not.toBeInTheDocument();
    });

    it("closes menu after clicking a menu item", async () => {
      const user = userEvent.setup();
      const ws = createEmptyWorkspace(lukasiewiczSystem);
      render(<StatefulWorkspace initialWorkspace={ws} testId="workspace" />);

      const menuButton = screen.getByTestId("workspace-workspace-menu-button");

      // メニューを開く
      await user.click(menuButton);
      expect(
        screen.getByTestId("workspace-workspace-menu"),
      ).toBeInTheDocument();

      // Import JSONをクリック（ファイル選択ダイアログはJSDOMではスキップ）
      await user.click(screen.getByTestId("workspace-import-json-button"));

      // メニューが閉じる
      expect(
        screen.queryByTestId("workspace-workspace-menu"),
      ).not.toBeInTheDocument();
    });

    it("does not show export/import buttons inline in header", () => {
      const ws = createEmptyWorkspace(lukasiewiczSystem);
      render(<StatefulWorkspace initialWorkspace={ws} testId="workspace" />);

      // メニューが閉じた状態では export/import ボタンは表示されない
      expect(
        screen.queryByTestId("workspace-export-json-button"),
      ).not.toBeInTheDocument();
    });
  });

  describe("canvas context menu (right-click on empty area)", () => {
    it("shows context menu on right-click of canvas", async () => {
      const ws = createEmptyWorkspace(lukasiewiczSystem);
      const { container } = render(
        <StatefulWorkspace initialWorkspace={ws} testId="workspace" />,
      );

      // コンテキストメニューは閉じている
      expect(
        screen.queryByTestId("workspace-canvas-context-menu"),
      ).not.toBeInTheDocument();

      // キャンバスコンテナ上で右クリック
      const canvas = container.querySelector("[data-testid='workspace']")!;
      await userEvent.pointer({
        target: canvas,
        keys: "[MouseRight]",
        coords: { clientX: 300, clientY: 200 },
      });

      // コンテキストメニューが開く
      expect(
        screen.getByTestId("workspace-canvas-context-menu"),
      ).toBeInTheDocument();

      // メニュー項目が表示される
      expect(
        screen.getByTestId("workspace-canvas-menu-add-axiom"),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("workspace-canvas-menu-add-goal"),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("workspace-canvas-menu-add-node"),
      ).toBeInTheDocument();
    });

    it("adds axiom node when 'Add Axiom Node' is clicked", async () => {
      const ws = createEmptyWorkspace(lukasiewiczSystem);
      const { container } = render(
        <StatefulWorkspace initialWorkspace={ws} testId="workspace" />,
      );

      // 右クリックでメニューを開く
      const canvas = container.querySelector("[data-testid='workspace']")!;
      await userEvent.pointer({
        target: canvas,
        keys: "[MouseRight]",
        coords: { clientX: 300, clientY: 200 },
      });

      // 「Add Axiom Node」をクリック
      await userEvent.click(
        screen.getByTestId("workspace-canvas-menu-add-axiom"),
      );

      // メニューが閉じる
      expect(
        screen.queryByTestId("workspace-canvas-context-menu"),
      ).not.toBeInTheDocument();

      // 新しいノードが追加されている
      expect(
        screen.getByTestId(`proof-node-${"node-1" satisfies string}`),
      ).toBeInTheDocument();
    });

    it("adds goal node when 'Add Goal Node' is clicked", async () => {
      const ws = createEmptyWorkspace(lukasiewiczSystem);
      const { container } = render(
        <StatefulWorkspace initialWorkspace={ws} testId="workspace" />,
      );

      // 右クリックでメニューを開く
      const canvas = container.querySelector("[data-testid='workspace']")!;
      await userEvent.pointer({
        target: canvas,
        keys: "[MouseRight]",
        coords: { clientX: 300, clientY: 200 },
      });

      // 「Add Goal Node」をクリック
      await userEvent.click(
        screen.getByTestId("workspace-canvas-menu-add-goal"),
      );

      // メニューが閉じる
      expect(
        screen.queryByTestId("workspace-canvas-context-menu"),
      ).not.toBeInTheDocument();

      // 新しいゴールノードが追加されている
      expect(
        screen.getByTestId(`proof-node-${"node-1" satisfies string}`),
      ).toBeInTheDocument();
    });

    it("adds plain node when 'Add Node' is clicked", async () => {
      const ws = createEmptyWorkspace(lukasiewiczSystem);
      const { container } = render(
        <StatefulWorkspace initialWorkspace={ws} testId="workspace" />,
      );

      // 右クリックでメニューを開く
      const canvas = container.querySelector("[data-testid='workspace']")!;
      await userEvent.pointer({
        target: canvas,
        keys: "[MouseRight]",
        coords: { clientX: 300, clientY: 200 },
      });

      // 「Add Node」をクリック
      await userEvent.click(
        screen.getByTestId("workspace-canvas-menu-add-node"),
      );

      // メニューが閉じる
      expect(
        screen.queryByTestId("workspace-canvas-context-menu"),
      ).not.toBeInTheDocument();

      // 新しいノードが追加されている
      expect(
        screen.getByTestId(`proof-node-${"node-1" satisfies string}`),
      ).toBeInTheDocument();
    });
  });

  describe("node context menu - delete node", () => {
    it("shows Delete Node item in context menu", async () => {
      const user = userEvent.setup();
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 }, "phi");

      render(<StatefulWorkspace initialWorkspace={ws} testId="workspace" />);

      const node = screen.getByTestId("proof-node-node-1");
      await user.pointer({ keys: "[MouseRight]", target: node });

      expect(screen.getByTestId("workspace-delete-node")).toBeInTheDocument();
    });

    it("deletes node when Delete Node is clicked", async () => {
      const user = userEvent.setup();
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "axiom", "A2", { x: 200, y: 0 }, "psi");

      render(<StatefulWorkspace initialWorkspace={ws} testId="workspace" />);

      // Right-click on node-1
      const node = screen.getByTestId("proof-node-node-1");
      await user.pointer({ keys: "[MouseRight]", target: node });

      // Click Delete Node
      await user.click(screen.getByTestId("workspace-delete-node"));

      // Context menu should be closed
      expect(
        screen.queryByTestId("workspace-node-context-menu"),
      ).not.toBeInTheDocument();

      // Node-1 should be removed
      await waitFor(() => {
        expect(
          screen.queryByTestId("proof-node-node-1"),
        ).not.toBeInTheDocument();
      });

      // Node-2 should remain
      expect(screen.getByTestId("proof-node-node-2")).toBeInTheDocument();
    });

    it("deletes node and removes related connections", async () => {
      const user = userEvent.setup();
      // axiom-1(node-1) → mp(node-3) ← axiom-2(node-2)
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "axiom", "A2", { x: 200, y: 0 }, "phi -> psi");
      ws = addNode(ws, "mp", "MP", { x: 100, y: 100 }, "psi");
      ws = addConnection(ws, "node-1", "out", "node-3", "premise-left");
      ws = addConnection(ws, "node-2", "out", "node-3", "premise-right");

      render(<StatefulWorkspace initialWorkspace={ws} testId="workspace" />);

      // Right-click on node-1 and delete
      const node1 = screen.getByTestId("proof-node-node-1");
      await user.pointer({ keys: "[MouseRight]", target: node1 });
      await user.click(screen.getByTestId("workspace-delete-node"));

      // Node-1 should be removed
      await waitFor(() => {
        expect(
          screen.queryByTestId("proof-node-node-1"),
        ).not.toBeInTheDocument();
      });

      // Node-2 and node-3 should remain
      expect(screen.getByTestId("proof-node-node-2")).toBeInTheDocument();
      expect(screen.getByTestId("proof-node-node-3")).toBeInTheDocument();
    });

    it("disables Delete Node for protected quest goal nodes", async () => {
      const user = userEvent.setup();
      const ws = createQuestWorkspace(lukasiewiczSystem, [
        { formulaText: "phi", position: { x: 0, y: 0 } },
      ]);

      render(<StatefulWorkspace initialWorkspace={ws} testId="workspace" />);

      // Right-click on the protected goal node
      const node = screen.getByTestId("proof-node-node-1");
      await user.pointer({ keys: "[MouseRight]", target: node });

      // Delete Node should be disabled
      const deleteBtn = screen.getByTestId("workspace-delete-node");
      expect(deleteBtn).toBeDisabled();
    });

    it("does not delete protected quest goal node even if clicked", async () => {
      const user = userEvent.setup();
      const ws = createQuestWorkspace(lukasiewiczSystem, [
        { formulaText: "phi", position: { x: 0, y: 0 } },
      ]);

      render(<StatefulWorkspace initialWorkspace={ws} testId="workspace" />);

      // Right-click on the protected goal node
      const node = screen.getByTestId("proof-node-node-1");
      await user.pointer({ keys: "[MouseRight]", target: node });

      // Click Delete Node (disabled)
      await user.click(screen.getByTestId("workspace-delete-node"));

      // Protected node should remain
      expect(screen.getByTestId("proof-node-node-1")).toBeInTheDocument();
    });
  });

  describe("node context menu - duplicate node", () => {
    it("shows Duplicate Node item in context menu", async () => {
      const user = userEvent.setup();
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 }, "phi");

      render(<StatefulWorkspace initialWorkspace={ws} testId="workspace" />);

      const node = screen.getByTestId("proof-node-node-1");
      await user.pointer({ keys: "[MouseRight]", target: node });

      expect(
        screen.getByTestId("workspace-duplicate-node"),
      ).toBeInTheDocument();
    });

    it("duplicates node when Duplicate Node is clicked", async () => {
      const user = userEvent.setup();
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 }, "phi");

      render(<StatefulWorkspace initialWorkspace={ws} testId="workspace" />);

      // Right-click on node-1
      const node = screen.getByTestId("proof-node-node-1");
      await user.pointer({ keys: "[MouseRight]", target: node });

      // Click Duplicate Node
      await user.click(screen.getByTestId("workspace-duplicate-node"));

      // Context menu should be closed
      expect(
        screen.queryByTestId("workspace-node-context-menu"),
      ).not.toBeInTheDocument();

      // New duplicated node should appear
      await waitFor(() => {
        expect(screen.getByTestId("proof-node-node-2")).toBeInTheDocument();
      });

      // Original node should remain
      expect(screen.getByTestId("proof-node-node-1")).toBeInTheDocument();
    });

    it("duplicated goal node loses goal role (pure logic test)", () => {
      // ゴールroleクリアは純粋ロジック側でテスト済み（workspaceState.test.ts）
      // UIテストでは単にduplicateが動作することを確認
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "G1", { x: 0, y: 0 }, "phi -> phi");
      ws = updateNodeRole(ws, "node-1", "goal");

      const result = duplicateNode(ws, "node-1");
      const newNode = result.workspace.nodes.find((n) =>
        result.newNodeIds.has(n.id),
      );
      expect(newNode).toBeDefined();
      expect(newNode!.role).toBeUndefined();
    });
  });

  // --- 代入操作 ---

  describe("substitution application", () => {
    it("shows substitution applied message for valid substitution node", async () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 }, "phi -> (psi -> phi)");
      const result = applySubstitutionAndConnect(
        ws,
        "node-1",
        [
          {
            _tag: "FormulaSubstitution",
            metaVariableName: "φ",
            formulaText: "alpha",
          },
        ],
        { x: 0, y: 150 },
      );
      ws = result.workspace;

      render(<StatefulWorkspace initialWorkspace={ws} />);
      const substNode = screen.getByTestId("proof-node-node-2");
      expect(substNode).toBeInTheDocument();
      expect(substNode).toHaveTextContent("Substitution applied");
    });

    it("shows substitution entries on the node", async () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 }, "phi -> (psi -> phi)");
      const result = applySubstitutionAndConnect(
        ws,
        "node-1",
        [
          {
            _tag: "FormulaSubstitution",
            metaVariableName: "φ",
            formulaText: "alpha -> beta",
          },
          {
            _tag: "FormulaSubstitution",
            metaVariableName: "ψ",
            formulaText: "gamma",
          },
        ],
        { x: 0, y: 150 },
      );
      ws = result.workspace;

      render(<StatefulWorkspace initialWorkspace={ws} />);
      const entriesEl = screen.getByTestId("proof-node-node-2-subst-entries");
      expect(entriesEl).toBeInTheDocument();
      expect(entriesEl).toHaveTextContent("φ := alpha -> beta");
      expect(entriesEl).toHaveTextContent("ψ := gamma");
    });

    it("substitution node is not editable (formula is auto-generated)", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 }, "phi -> (psi -> phi)");
      const result = applySubstitutionAndConnect(
        ws,
        "node-1",
        [
          {
            _tag: "FormulaSubstitution",
            metaVariableName: "φ",
            formulaText: "alpha",
          },
        ],
        { x: 0, y: 150 },
      );
      ws = result.workspace;

      render(<StatefulWorkspace initialWorkspace={ws} />);
      // substitution node should display formula but not in editor mode
      const substNode = screen.getByTestId("proof-node-node-2");
      expect(substNode).toBeInTheDocument();
      // No editor input should be present (not editable)
      const editorInput = substNode.querySelector("input");
      expect(editorInput).toBeNull();
    });

    it("context menu shows Apply Substitution option", async () => {
      const user = userEvent.setup();
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 }, "phi -> phi");

      render(<StatefulWorkspace initialWorkspace={ws} />);

      const node = screen.getByTestId("proof-node-node-1");
      await user.pointer({ keys: "[MouseRight]", target: node });

      const menuItem = screen.getByTestId(
        "workspace-apply-substitution-to-node",
      );
      expect(menuItem).toBeInTheDocument();
      expect(menuItem).toHaveTextContent("Apply Substitution");
    });

    it("clicking Apply Substitution opens the prompt banner", async () => {
      const user = userEvent.setup();
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 }, "phi -> phi");

      render(<StatefulWorkspace initialWorkspace={ws} />);

      const node = screen.getByTestId("proof-node-node-1");
      await user.pointer({ keys: "[MouseRight]", target: node });

      const menuItem = screen.getByTestId(
        "workspace-apply-substitution-to-node",
      );
      await user.click(menuItem);

      const banner = screen.getByTestId("workspace-subst-prompt-banner");
      expect(banner).toBeInTheDocument();
    });

    it("can fill substitution form, add entry, remove entry, and confirm", async () => {
      const user = userEvent.setup();
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 }, "phi -> (psi -> phi)");

      render(<StatefulWorkspace initialWorkspace={ws} />);

      // Open context menu and click Apply Substitution
      const node = screen.getByTestId("proof-node-node-1");
      await user.pointer({ keys: "[MouseRight]", target: node });
      await user.click(
        screen.getByTestId("workspace-apply-substitution-to-node"),
      );

      // Banner should appear with auto-extracted entries (φ and ψ)
      expect(
        screen.getByTestId("workspace-subst-prompt-banner"),
      ).toBeInTheDocument();

      // Auto-extracted: φ and ψ are pre-filled as metaVar names
      const metaVarInput0 = screen.getByTestId("workspace-subst-metavar-0");
      const metaVarInput1 = screen.getByTestId("workspace-subst-metavar-1");
      expect(metaVarInput0).toHaveValue("φ");
      expect(metaVarInput1).toHaveValue("ψ");

      // Fill in values for the pre-populated entries
      const valueInput0 = screen.getByTestId("workspace-subst-value-0");
      const valueInput1 = screen.getByTestId("workspace-subst-value-1");
      await user.type(valueInput0, "alpha");
      await user.type(valueInput1, "beta");

      // Add a third entry
      await user.click(screen.getByTestId("workspace-subst-add-entry"));

      // With 3 entries, remove buttons should appear — remove the third entry
      const removeButtons = screen
        .getAllByRole("button")
        .filter((btn) => btn.textContent === "Remove");
      expect(removeButtons.length).toBe(3);
      await user.click(removeButtons[2]!);

      // Only two entries remain
      expect(screen.queryByTestId("workspace-subst-metavar-2")).toBeNull();

      // Confirm substitution
      await user.click(screen.getByTestId("workspace-subst-prompt-confirm"));

      // Banner should disappear
      await waitFor(() => {
        expect(
          screen.queryByTestId("workspace-subst-prompt-banner"),
        ).toBeNull();
      });

      // A substitution node should have been created
      const substNode = screen.getByTestId("proof-node-node-2");
      expect(substNode).toBeInTheDocument();
    });

    it("Escape key cancels the substitution prompt", async () => {
      const user = userEvent.setup();
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 }, "phi -> phi");

      render(<StatefulWorkspace initialWorkspace={ws} />);

      // Open context menu and click Apply Substitution
      const node = screen.getByTestId("proof-node-node-1");
      await user.pointer({ keys: "[MouseRight]", target: node });
      await user.click(
        screen.getByTestId("workspace-apply-substitution-to-node"),
      );

      // Banner should appear
      expect(
        screen.getByTestId("workspace-subst-prompt-banner"),
      ).toBeInTheDocument();

      // Press Escape in the value input
      const valueInput = screen.getByTestId("workspace-subst-value-0");
      await user.click(valueInput);
      await user.keyboard("{Escape}");

      // Banner should disappear
      await waitFor(() => {
        expect(
          screen.queryByTestId("workspace-subst-prompt-banner"),
        ).toBeNull();
      });
    });

    it("can change entry kind between formula and term", async () => {
      const user = userEvent.setup();
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 }, "phi -> phi");

      render(<StatefulWorkspace initialWorkspace={ws} />);

      // Open context menu and click Apply Substitution
      const node = screen.getByTestId("proof-node-node-1");
      await user.pointer({ keys: "[MouseRight]", target: node });
      await user.click(
        screen.getByTestId("workspace-apply-substitution-to-node"),
      );

      // Change kind to term
      const kindSelect = screen.getByTestId("workspace-subst-kind-0");
      await user.selectOptions(kindSelect, "term");
      expect(kindSelect).toHaveValue("term");
    });
  });
});

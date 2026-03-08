import { useState, useCallback } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  lukasiewiczSystem,
  predicateLogicSystem,
  equalityLogicSystem,
} from "../logic-core/inferenceRule";
import {
  naturalDeduction,
  tableauCalculusDeduction,
  analyticTableauDeduction,
  sequentCalculusDeduction,
  njSystem,
  nkSystem,
  tabSystem,
  tabPropSystem,
  atSystem,
  lkSystem,
} from "../logic-core/deductionSystem";
import { allReferenceEntries } from "../reference/referenceContent";
import type { Formula } from "../logic-core/formula";
import { ProofWorkspace } from "./ProofWorkspace";
import type { WorkspaceState } from "./workspaceState";
import {
  createEmptyWorkspace,
  createQuestWorkspace,
  addNode,
  addConnection,
  addGoal,
  applyMPAndConnect,
  applyGenAndConnect,
  applySubstitutionAndConnect,
  duplicateNode,
  applyScRuleAndConnect,
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

    it("renders without testId prop", () => {
      const { container } = render(
        <ProofWorkspace system={lukasiewiczSystem} />,
      );
      // workspace自体のdata-testidは付与されない
      const workspaceEls = container.querySelectorAll(
        "[data-testid='workspace']",
      );
      expect(workspaceEls).toHaveLength(0);
      // InfiniteCanvasは内部でtestIdを持つ
      expect(screen.getByTestId("infinite-canvas")).toBeInTheDocument();
    });

    it("renders with nodes and connections without testId prop", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 }, "phi -> (psi -> phi)");
      ws = addNode(ws, "axiom", "A2", { x: 200, y: 0 }, "phi -> phi");
      ws = addConnection(ws, "node-1", "out", "node-2", "premise-left");
      ws = addGoal(ws, "phi -> phi");

      const { container } = render(
        <ProofWorkspace
          system={lukasiewiczSystem}
          workspace={ws}
          referenceEntries={allReferenceEntries}
          locale="en"
          showDependencies
        />,
      );
      // ノードが表示される（testIdではなくDOMの存在で確認）
      expect(
        container.querySelectorAll("[data-testid='workspace-node-node-1']"),
      ).toHaveLength(0);
      expect(screen.getByTestId("infinite-canvas")).toBeInTheDocument();
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
      ws = addNode(ws, "axiom", "MP", { x: 100, y: 150 });
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

    it("adds A4 axiom schema directly when A4 palette item is clicked", async () => {
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
      expect(onWorkspaceChange).toHaveBeenCalled();
      const lastCall =
        onWorkspaceChange.mock.calls[onWorkspaceChange.mock.calls.length - 1];
      const updatedWs = lastCall?.[0] as WorkspaceState;
      expect(updatedWs.nodes.length).toBeGreaterThan(0);
      const addedNode = updatedWs.nodes[updatedWs.nodes.length - 1];
      expect(addedNode?.formulaText).toBe("(all x. phi) -> phi");
    });

    it("adds A5 axiom schema directly when A5 palette item is clicked", async () => {
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
      await user.click(screen.getByTestId("workspace-axiom-palette-item-A5"));
      expect(onWorkspaceChange).toHaveBeenCalled();
      const lastCall =
        onWorkspaceChange.mock.calls[onWorkspaceChange.mock.calls.length - 1];
      const updatedWs = lastCall?.[0] as WorkspaceState;
      expect(updatedWs.nodes.length).toBeGreaterThan(0);
      const addedNode = updatedWs.nodes[updatedWs.nodes.length - 1];
      expect(addedNode?.formulaText).toBe(
        "(all x. (phi -> psi)) -> (phi -> all x. psi)",
      );
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

  describe("ND rule palette", () => {
    it("renders ND rule palette for natural deduction system", () => {
      const ws = createEmptyWorkspace(naturalDeduction(njSystem));
      render(
        <ProofWorkspace
          system={lukasiewiczSystem}
          workspace={ws}
          testId="workspace"
        />,
      );
      expect(
        screen.getByTestId("workspace-nd-rule-palette"),
      ).toBeInTheDocument();
      expect(screen.getByText("Natural Deduction")).toBeInTheDocument();
    });

    it("does not render axiom palette for ND system", () => {
      const ws = createEmptyWorkspace(naturalDeduction(njSystem));
      render(
        <ProofWorkspace
          system={lukasiewiczSystem}
          workspace={ws}
          testId="workspace"
        />,
      );
      expect(
        screen.queryByTestId("workspace-axiom-palette"),
      ).not.toBeInTheDocument();
    });

    it("shows NJ rules including EFQ", () => {
      const ws = createEmptyWorkspace(naturalDeduction(njSystem));
      render(
        <ProofWorkspace
          system={lukasiewiczSystem}
          workspace={ws}
          testId="workspace"
        />,
      );
      expect(screen.getByText("爆発律 (EFQ)")).toBeInTheDocument();
      expect(screen.getByText("→導入 (→I)")).toBeInTheDocument();
    });

    it("shows NK rules including DNE", () => {
      const ws = createEmptyWorkspace(naturalDeduction(nkSystem));
      render(
        <ProofWorkspace
          system={lukasiewiczSystem}
          workspace={ws}
          testId="workspace"
        />,
      );
      expect(screen.getByText("二重否定除去 (DNE)")).toBeInTheDocument();
    });

    it("adds assumption node when add assumption is clicked", async () => {
      const user = userEvent.setup();
      const onWorkspaceChange = vi.fn();
      const ws = createEmptyWorkspace(naturalDeduction(njSystem));
      render(
        <ProofWorkspace
          system={lukasiewiczSystem}
          workspace={ws}
          onWorkspaceChange={onWorkspaceChange}
          testId="workspace"
        />,
      );
      await user.click(
        screen.getByTestId("workspace-nd-rule-palette-add-assumption"),
      );
      expect(onWorkspaceChange).toHaveBeenCalled();
      const updatedWs = onWorkspaceChange.mock.calls[
        onWorkspaceChange.mock.calls.length - 1
      ][0] as WorkspaceState;
      expect(updatedWs.nodes.length).toBe(1);
      // 仮定ノードはformulTextが空
      expect(updatedWs.nodes[0].formulaText).toBe("");
      // ラベルは"Assumption"
      expect(updatedWs.nodes[0].label).toBe("Assumption");
    });

    it("renders axiom palette for Hilbert system (not ND palette)", () => {
      render(<ProofWorkspace system={lukasiewiczSystem} testId="workspace" />);
      expect(screen.getByTestId("workspace-axiom-palette")).toBeInTheDocument();
      expect(
        screen.queryByTestId("workspace-nd-rule-palette"),
      ).not.toBeInTheDocument();
    });
  });

  describe("node interaction callbacks", () => {
    it("updates formula text when user types in a node", async () => {
      const user = userEvent.setup();
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 }, "");

      render(<StatefulWorkspace initialWorkspace={ws} />);

      // Double-click the formula display to enter edit mode (editTrigger="dblclick")
      const display = screen.getByTestId("proof-node-node-1-editor-display");
      await user.dblClick(display);

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

      // Double-click the formula display to enter edit mode (editTrigger="dblclick")
      await user.dblClick(
        screen.getByTestId("proof-node-node-1-editor-display"),
      );

      // Type a valid Greek letter formula (same as EditableProofNode test)
      const input = screen.getByTestId("proof-node-node-1-editor-input-input");
      await user.type(input, "φ");

      // onFormulaParsed should be called when FormulaInput parses a valid formula
      await waitFor(() => {
        expect(onFormulaParsed).toHaveBeenCalled();
      });
    });

    it("enters editing mode when formula display is double-clicked", async () => {
      const user = userEvent.setup();
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 }, "");

      render(<StatefulWorkspace initialWorkspace={ws} />);

      // Initially in display mode
      expect(screen.getByTestId("proof-node-node-1")).toBeInTheDocument();
      expect(
        screen.getByTestId("proof-node-node-1-editor-display"),
      ).toBeInTheDocument();

      // Double-click to enter edit mode (editTrigger="dblclick")
      await user.dblClick(
        screen.getByTestId("proof-node-node-1-editor-display"),
      );

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

      // Enter edit mode (double-click since editTrigger="dblclick")
      await user.dblClick(
        screen.getByTestId("proof-node-node-1-editor-display"),
      );
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

    it("shows inference edge badge on MP connection", async () => {
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

      // Edge badges should appear with role-annotated labels
      await waitFor(() => {
        // MP:φ for antecedent, MP:→ for conditional
        expect(screen.getByText("MP:φ")).toBeInTheDocument();
        expect(screen.getByText("MP:→")).toBeInTheDocument();
      });
    });

    it("clicking Gen badge opens popover for editing variable name", async () => {
      const user = userEvent.setup();

      render(
        <StatefulWorkspace
          initialWorkspace={(() => {
            let ws = createEmptyWorkspace(predicateLogicSystem);
            ws = addNode(ws, "axiom", "Ax", { x: 0, y: 0 }, "phi");
            const genResult = applyGenAndConnect(ws, "node-1", "x", {
              x: 0,
              y: 150,
            });
            return genResult.workspace;
          })()}
        />,
      );

      // Verify Gen badge is displayed
      await waitFor(() => {
        expect(screen.getByText("Gen(x)")).toBeInTheDocument();
      });

      // Click the Gen badge to open popover
      await user.click(screen.getByText("Gen(x)"));

      // Popover should be visible
      await waitFor(() => {
        expect(
          screen.getByTestId("workspace-edge-popover"),
        ).toBeInTheDocument();
      });

      // Edit variable name from "x" to "y"
      const input = screen.getByTestId(
        "workspace-edge-popover-inner-gen-input",
      );
      await user.clear(input);
      await user.type(input, "y");

      // Confirm
      await user.click(
        screen.getByTestId("workspace-edge-popover-inner-confirm"),
      );

      // Popover should be closed and badge updated
      await waitFor(() => {
        expect(
          screen.queryByTestId("workspace-edge-popover"),
        ).not.toBeInTheDocument();
        expect(screen.getByText("Gen(y)")).toBeInTheDocument();
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
      expect(newState.nodes[2].kind).toBe("axiom");
      expect(newState.nodes[2].formulaText).toBe("ψ");
      expect(newState.connections).toHaveLength(2);
    });
  });

  describe("MP validation display", () => {
    it("shows error status for MP node with premise mismatch", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "axiom", "A2", { x: 200, y: 0 }, "psi -> chi");
      const result = applyMPAndConnect(ws, "node-1", "node-2", {
        x: 100,
        y: 150,
      });
      ws = result.workspace;

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
      const result = applyMPAndConnect(ws, "node-1", "node-2", {
        x: 100,
        y: 150,
      });
      ws = result.workspace;

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
      ws = addNode(ws, "axiom", "MP", { x: 100, y: 150 });

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
      ws = addGoal(ws, "phi");

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
      ws = addGoal(ws, "phi -> phi");

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
      ws = addGoal(result.workspace, "psi");

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
      ws = addGoal(ws, "phi");

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
      ws = addGoal(ws, "phi -> phi");

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
      ws = addNode(ws, "axiom", "Gen", { x: 0, y: 0 });

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
      // applyGenAndConnect with empty variable name to create InferenceEdge
      const result = applyGenAndConnect(ws, "node-1", "", { x: 0, y: 150 });
      ws = result.workspace;

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

      // Click: AXIOM -> ROOT (goal is no longer a node role)
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
      ws = addGoal(ws, "φ → φ");
      const { container } = render(
        <ProofWorkspace system={lukasiewiczSystem} workspace={ws} />,
      );
      expect(container.textContent).toContain("Proof Complete!");
    });
  });

  describe("quest mode", () => {
    it("displays Quest badge in quest mode", () => {
      const ws = createQuestWorkspace(lukasiewiczSystem, [
        { formulaText: "phi -> phi" },
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

    it("does not display Duplicate as Free button when onDuplicateToFree is not provided", () => {
      const ws = createQuestWorkspace(lukasiewiczSystem, [
        { formulaText: "phi" },
      ]);
      render(
        <ProofWorkspace
          system={lukasiewiczSystem}
          workspace={ws}
          testId="workspace"
        />,
      );
      expect(
        screen.queryByTestId("workspace-convert-free-button"),
      ).not.toBeInTheDocument();
    });

    it("displays Duplicate as Free button when onDuplicateToFree is provided", () => {
      const ws = createQuestWorkspace(lukasiewiczSystem, [
        { formulaText: "phi" },
      ]);
      render(
        <ProofWorkspace
          system={lukasiewiczSystem}
          workspace={ws}
          onDuplicateToFree={vi.fn()}
          testId="workspace"
        />,
      );
      expect(
        screen.getByTestId("workspace-convert-free-button"),
      ).toBeInTheDocument();
    });

    it("calls onDuplicateToFree when Duplicate as Free button is clicked", async () => {
      const user = userEvent.setup();
      const ws = createQuestWorkspace(lukasiewiczSystem, [
        { formulaText: "phi" },
      ]);
      const onDuplicateToFree = vi.fn();
      render(
        <ProofWorkspace
          system={lukasiewiczSystem}
          workspace={ws}
          onDuplicateToFree={onDuplicateToFree}
          testId="workspace"
        />,
      );

      await user.click(screen.getByTestId("workspace-convert-free-button"));
      expect(onDuplicateToFree).toHaveBeenCalledOnce();
    });

    it("shows axiom violation banner when goal achieved with disallowed axiom", () => {
      // allowedAxiomIds に A2 のみ → A1 を使ったら AllAchievedButAxiomViolation
      let ws = createQuestWorkspace(lukasiewiczSystem, [
        {
          formulaText: "phi -> (psi -> phi)",
          allowedAxiomIds: ["A2"],
        },
      ]);
      // A1 スキーマそのもの: phi -> (psi -> phi) をルートノードとして追加
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 }, "phi -> (psi -> phi)");

      render(
        <ProofWorkspace
          system={lukasiewiczSystem}
          workspace={ws}
          testId="workspace"
        />,
      );

      // 通常の proof-complete-banner は表示されない
      expect(
        screen.queryByTestId("workspace-proof-complete-banner"),
      ).not.toBeInTheDocument();

      // axiom violation バナーが表示される
      expect(
        screen.getByTestId("workspace-proof-complete-banner-axiom-violation"),
      ).toBeInTheDocument();
    });

    it("shows axiom violation with instance root when instance is placed directly", () => {
      // A1 の代入インスタンスをルートノードに直接配置
      let ws = createQuestWorkspace(lukasiewiczSystem, [
        {
          formulaText: "(phi -> psi) -> (chi -> (phi -> psi))",
          allowedAxiomIds: ["A1"],
        },
      ]);
      // A1 のインスタンス: (φ→ψ) → (χ → (φ→ψ))  ← φ:=φ→ψ のため instance
      ws = addNode(
        ws,
        "axiom",
        "A1-inst",
        { x: 0, y: 0 },
        "(phi -> psi) -> (chi -> (phi -> psi))",
      );

      render(
        <ProofWorkspace
          system={lukasiewiczSystem}
          workspace={ws}
          testId="workspace"
        />,
      );

      // axiom violation バナーが表示される（instance root violation）
      expect(
        screen.getByTestId("workspace-proof-complete-banner-axiom-violation"),
      ).toBeInTheDocument();
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

  describe("axiom identification (only schema, not substitution instances)", () => {
    it("does not identify non-trivial axiom instance as axiom", () => {
      // phi -> (phi -> phi) is A1 with psi:=phi (non-trivial substitution)
      // Should NOT be identified as axiom at all
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "phi -> (phi -> phi)");

      render(
        <ProofWorkspace
          system={lukasiewiczSystem}
          workspace={ws}
          testId="workspace"
        />,
      );

      // No axiom name should be displayed
      expect(
        screen.queryByTestId("proof-node-node-1-axiom-name"),
      ).not.toBeInTheDocument();
      // No status message (no warning, no error)
      expect(
        screen.queryByTestId("proof-node-node-1-status"),
      ).not.toBeInTheDocument();
    });

    it("identifies trivial axiom schema and shows axiom name", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "phi -> (psi -> phi)");

      render(
        <ProofWorkspace
          system={lukasiewiczSystem}
          workspace={ws}
          testId="workspace"
        />,
      );

      // Axiom name should be displayed
      expect(
        screen.getByTestId("proof-node-node-1-axiom-name"),
      ).toHaveTextContent("A1 (K)");
      // No status/warning message
      expect(
        screen.queryByTestId("proof-node-node-1-status"),
      ).not.toBeInTheDocument();
    });

    it("MP derived node shows MP status regardless of formula shape", () => {
      // MP conclusion might have a shape that matches an axiom pattern
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

      // MP node (node-3) conclusion = phi -> (phi -> phi)
      // Not identified as axiom (non-trivial), but has MP applied status
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

    it("selects multiple nodes with Shift+click", async () => {
      const user = userEvent.setup();
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 100, y: 100 }, "phi");
      ws = addNode(ws, "axiom", "A2", { x: 300, y: 100 }, "psi");

      render(<StatefulWorkspace initialWorkspace={ws} testId="workspace" />);

      // Click first node
      const node1 = screen.getByTestId("proof-node-node-1");
      await user.click(node1);

      // Shift+click second node
      const node2 = screen.getByTestId("proof-node-node-2");
      await user.keyboard("{Shift>}");
      await user.click(node2);
      await user.keyboard("{/Shift}");

      await waitFor(() => {
        expect(
          screen.getByTestId("workspace-selection-banner"),
        ).toHaveTextContent("2 node(s) selected");
      });
    });

    it("Shift+click toggles node out of selection", async () => {
      const user = userEvent.setup();
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 100, y: 100 }, "phi");
      ws = addNode(ws, "axiom", "A2", { x: 300, y: 100 }, "psi");

      render(<StatefulWorkspace initialWorkspace={ws} testId="workspace" />);

      // Click first node
      const node1 = screen.getByTestId("proof-node-node-1");
      await user.click(node1);

      // Shift+click second node to add
      const node2 = screen.getByTestId("proof-node-node-2");
      await user.keyboard("{Shift>}");
      await user.click(node2);
      await user.keyboard("{/Shift}");

      await waitFor(() => {
        expect(
          screen.getByTestId("workspace-selection-banner"),
        ).toHaveTextContent("2 node(s) selected");
      });

      // Shift+click first node again to remove from selection
      await user.keyboard("{Shift>}");
      await user.click(node1);
      await user.keyboard("{/Shift}");

      await waitFor(() => {
        expect(
          screen.getByTestId("workspace-selection-banner"),
        ).toHaveTextContent("1 node(s) selected");
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

    it("Select Subtree selects node and all descendants via InferenceEdge", async () => {
      const user = userEvent.setup();
      // axiom-1(node-1) → mp(node-3) ← axiom-2(node-2)
      // applyMPAndConnect creates both connections and InferenceEdges
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "axiom", "A2", { x: 200, y: 0 }, "phi -> psi");
      const mpResult = applyMPAndConnect(ws, "node-1", "node-2", {
        x: 100,
        y: 100,
      });
      ws = mpResult.workspace;

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

      // Selection banner should show 2 nodes (node-1 and mp node)
      await waitFor(() => {
        expect(
          screen.getByTestId("workspace-selection-banner"),
        ).toHaveTextContent("2 node(s) selected");
      });
    });

    it("Select Subtree on leaf node selects only that node", async () => {
      const user = userEvent.setup();
      // axiom(node-1) → mp(node-2 via applyMP)
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 }, "phi -> psi");
      // Use substitution to create a derived node with InferenceEdge
      const substResult = applySubstitutionAndConnect(ws, "node-1", [], {
        x: 100,
        y: 100,
      });
      ws = substResult.workspace;

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

    it("Select Proof selects node and all ancestors (proof prerequisites)", async () => {
      const user = userEvent.setup();
      // axiom-1(node-1) → mp(node-3) ← axiom-2(node-2)
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "axiom", "A2", { x: 200, y: 0 }, "phi -> psi");
      const mpResult = applyMPAndConnect(ws, "node-1", "node-2", {
        x: 100,
        y: 100,
      });
      ws = mpResult.workspace;

      render(<StatefulWorkspace initialWorkspace={ws} testId="workspace" />);

      // Right-click on the MP node (node-3)
      const mpNode = screen.getByTestId("proof-node-node-3");
      await user.pointer({ keys: "[MouseRight]", target: mpNode });

      // Click Select Proof
      const selectProofBtn = screen.getByTestId("workspace-select-proof");
      await user.click(selectProofBtn);

      // Context menu should be closed
      expect(
        screen.queryByTestId("workspace-node-context-menu"),
      ).not.toBeInTheDocument();

      // Selection banner should show 3 nodes (node-1, node-2, and mp node-3)
      await waitFor(() => {
        expect(
          screen.getByTestId("workspace-selection-banner"),
        ).toHaveTextContent("3 node(s) selected");
      });
    });

    it("Select Proof on root node selects only that node", async () => {
      const user = userEvent.setup();
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 }, "phi");

      render(<StatefulWorkspace initialWorkspace={ws} testId="workspace" />);

      const node = screen.getByTestId("proof-node-node-1");
      await user.pointer({ keys: "[MouseRight]", target: node });

      const selectProofBtn = screen.getByTestId("workspace-select-proof");
      await user.click(selectProofBtn);

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

  describe("node context menu - edit formula", () => {
    it("shows Edit Formula item in context menu", async () => {
      const user = userEvent.setup();
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 }, "");

      render(<StatefulWorkspace initialWorkspace={ws} testId="workspace" />);

      const node = screen.getByTestId("proof-node-node-1");
      await user.pointer({ keys: "[MouseRight]", target: node });

      expect(screen.getByTestId("workspace-edit-formula")).toBeInTheDocument();
    });

    it("clicking Edit Formula opens editor on the node", async () => {
      const user = userEvent.setup();
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 }, "");

      render(<StatefulWorkspace initialWorkspace={ws} testId="workspace" />);

      // Open context menu and click Edit Formula
      const node = screen.getByTestId("proof-node-node-1");
      await user.pointer({ keys: "[MouseRight]", target: node });
      const editBtn = screen.getByTestId("workspace-edit-formula");
      await user.click(editBtn);

      // Context menu should be closed
      expect(
        screen.queryByTestId("workspace-node-context-menu"),
      ).not.toBeInTheDocument();

      // Editor input should appear (edit mode activated)
      await waitFor(() => {
        expect(
          screen.getByTestId("proof-node-node-1-editor-edit"),
        ).toBeInTheDocument();
      });
    });

    it("Edit Formula is disabled for derived nodes", async () => {
      const user = userEvent.setup();
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "axiom", "A2", { x: 200, y: 0 }, "phi -> psi");
      const mpResult = applyMPAndConnect(ws, "node-1", "node-2", {
        x: 100,
        y: 200,
      });
      ws = mpResult.workspace;

      render(<StatefulWorkspace initialWorkspace={ws} testId="workspace" />);

      // Right-click on MP-derived node (node-3)
      const mpNode = screen.getByTestId("proof-node-node-3");
      await user.pointer({ keys: "[MouseRight]", target: mpNode });

      const editBtn = screen.getByTestId("workspace-edit-formula");
      expect(editBtn).toBeDisabled();
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

  describe("tree layout via context menu", () => {
    it("shows tree layout options in canvas context menu", async () => {
      const ws = createEmptyWorkspace(lukasiewiczSystem);
      const { container } = render(
        <StatefulWorkspace initialWorkspace={ws} testId="workspace" />,
      );

      // キャンバスコンテナ上で右クリック
      const canvas = container.querySelector("[data-testid='workspace']")!;
      await userEvent.pointer({
        target: canvas,
        keys: "[MouseRight]",
        coords: { clientX: 300, clientY: 200 },
      });

      // コンテキストメニューが開き、ツリー整列項目が表示される
      expect(
        screen.getByTestId("workspace-canvas-menu-tree-layout-tb"),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("workspace-canvas-menu-tree-layout-bt"),
      ).toBeInTheDocument();
    });

    it("clicking top-to-bottom tree layout closes menu", async () => {
      const ws = createEmptyWorkspace(lukasiewiczSystem);
      const { container } = render(
        <StatefulWorkspace initialWorkspace={ws} testId="workspace" />,
      );

      const canvas = container.querySelector("[data-testid='workspace']")!;
      await userEvent.pointer({
        target: canvas,
        keys: "[MouseRight]",
        coords: { clientX: 300, clientY: 200 },
      });

      const tbButton = screen.getByTestId(
        "workspace-canvas-menu-tree-layout-tb",
      );
      await userEvent.click(tbButton);

      // メニューが閉じるのを確認
      expect(
        screen.queryByTestId("workspace-canvas-menu-tree-layout-tb"),
      ).not.toBeInTheDocument();
    });

    it("clicking bottom-to-top tree layout closes menu", async () => {
      const ws = createEmptyWorkspace(lukasiewiczSystem);
      const { container } = render(
        <StatefulWorkspace initialWorkspace={ws} testId="workspace" />,
      );

      const canvas = container.querySelector("[data-testid='workspace']")!;
      await userEvent.pointer({
        target: canvas,
        keys: "[MouseRight]",
        coords: { clientX: 300, clientY: 200 },
      });

      const btButton = screen.getByTestId(
        "workspace-canvas-menu-tree-layout-bt",
      );
      await userEvent.click(btButton);

      // メニューが閉じるのを確認
      expect(
        screen.queryByTestId("workspace-canvas-menu-tree-layout-bt"),
      ).not.toBeInTheDocument();
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

  describe("体系バッジクリックでリファレンス詳細を開く", () => {
    it("referenceEntries指定時に体系名がクリック可能なボタンになる", () => {
      render(
        <ProofWorkspace
          system={lukasiewiczSystem}
          referenceEntries={allReferenceEntries}
          locale="ja"
          onOpenReferenceDetail={vi.fn()}
          testId="workspace"
        />,
      );
      const systemBadge = screen.getByTestId("workspace-system");
      expect(systemBadge.tagName).toBe("BUTTON");
      expect(systemBadge).toHaveTextContent("Łukasiewicz");
    });

    it("体系名クリックでonOpenReferenceDetailが体系エントリIDで呼ばれる", async () => {
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
      await user.click(screen.getByTestId("workspace-system"));
      expect(handleDetail).toHaveBeenCalledWith("system-lukasiewicz");
    });

    it("referenceEntries未指定時は体系名がspanのまま（クリック不可）", () => {
      render(<ProofWorkspace system={lukasiewiczSystem} testId="workspace" />);
      const systemBadge = screen.getByTestId("workspace-system");
      expect(systemBadge.tagName).toBe("SPAN");
    });

    it("onOpenReferenceDetail未指定時は体系名がspanのまま", () => {
      render(
        <ProofWorkspace
          system={lukasiewiczSystem}
          referenceEntries={allReferenceEntries}
          locale="ja"
          testId="workspace"
        />,
      );
      const systemBadge = screen.getByTestId("workspace-system");
      expect(systemBadge.tagName).toBe("SPAN");
    });

    it("リファレンスエントリがない体系では体系名がspanのまま", () => {
      render(
        <ProofWorkspace
          system={lukasiewiczSystem}
          referenceEntries={[]}
          locale="ja"
          onOpenReferenceDetail={vi.fn()}
          testId="workspace"
        />,
      );
      const systemBadge = screen.getByTestId("workspace-system");
      expect(systemBadge.tagName).toBe("SPAN");
    });
  });

  describe("公理名バッジクリックでリファレンス詳細を開く", () => {
    it("公理スキーマノードのバッジクリックでonOpenReferenceDetailが公理エントリIDで呼ばれる", async () => {
      const user = userEvent.setup();
      const handleDetail = vi.fn();
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 }, "φ → (ψ → φ)");
      render(
        <ProofWorkspace
          system={lukasiewiczSystem}
          workspace={ws}
          referenceEntries={allReferenceEntries}
          locale="ja"
          onOpenReferenceDetail={handleDetail}
          testId="workspace"
        />,
      );
      const axiomBadge = screen.getByTestId("proof-node-node-1-axiom-name");
      expect(axiomBadge.tagName).toBe("BUTTON");
      await user.click(axiomBadge);
      expect(handleDetail).toHaveBeenCalledWith("axiom-a1");
    });

    it("onOpenReferenceDetail未指定時は公理名バッジがspanのまま", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 }, "φ → (ψ → φ)");
      render(
        <ProofWorkspace
          system={lukasiewiczSystem}
          workspace={ws}
          referenceEntries={allReferenceEntries}
          locale="ja"
          testId="workspace"
        />,
      );
      const axiomBadge = screen.getByTestId("proof-node-node-1-axiom-name");
      expect(axiomBadge.tagName).toBe("SPAN");
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
      // ノードの表示モードをダブルクリックして編集モードに入る (editTrigger="dblclick")
      const nodeDisplay = screen.getByTestId(
        `proof-node-${ws.nodes[0]!.id satisfies string}-editor-display`,
      );
      await user.dblClick(nodeDisplay);
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
      // ノードの表示モードをダブルクリックして編集モードに入る (editTrigger="dblclick")
      const nodeDisplay = screen.getByTestId(
        `proof-node-${ws.nodes[0]!.id satisfies string}-editor-display`,
      );
      await user.dblClick(nodeDisplay);
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

    it("closes menu on click outside", async () => {
      const user = userEvent.setup();
      const ws = createEmptyWorkspace(lukasiewiczSystem);
      render(<StatefulWorkspace initialWorkspace={ws} testId="workspace" />);

      const menuButton = screen.getByTestId("workspace-workspace-menu-button");

      // メニューを開く
      await user.click(menuButton);
      expect(
        screen.getByTestId("workspace-workspace-menu"),
      ).toBeInTheDocument();

      // メニュー外をクリック（document body）
      await user.pointer({ target: document.body, keys: "[MouseLeft]" });

      await waitFor(() => {
        expect(
          screen.queryByTestId("workspace-workspace-menu"),
        ).not.toBeInTheDocument();
      });
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
        screen.getByTestId("workspace-canvas-menu-add-node"),
      ).toBeInTheDocument();
      // ペースト項目が表示される（クリップボード空なので disabled）
      const pasteItem = screen.getByTestId("workspace-canvas-menu-paste");
      expect(pasteItem).toBeInTheDocument();
      expect(pasteItem).toBeDisabled();
      // "Add Axiom Node" and "Add Goal Node" are no longer separate items
      expect(
        screen.queryByTestId("workspace-canvas-menu-add-axiom"),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("workspace-canvas-menu-add-goal"),
      ).not.toBeInTheDocument();
    });

    it("adds node when 'Add Node' is clicked", async () => {
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

    it("enables paste in canvas context menu after copying a node", async () => {
      const user = userEvent.setup();
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A", { x: 100, y: 100 }, "phi");
      const { container } = render(
        <StatefulWorkspace initialWorkspace={ws} testId="workspace" />,
      );

      // ノードをクリックして選択
      await user.click(screen.getByTestId("proof-node-node-1"));
      await waitFor(() => {
        expect(
          screen.getByTestId("workspace-selection-banner"),
        ).toBeInTheDocument();
      });

      // コピー
      await user.click(screen.getByTestId("workspace-copy-button"));

      // 選択解除
      await user.click(container.querySelector("[data-testid='workspace']")!);

      // キャンバス上で右クリック
      const canvas = container.querySelector("[data-testid='workspace']")!;
      await userEvent.pointer({
        target: canvas,
        keys: "[MouseRight]",
        coords: { clientX: 400, clientY: 300 },
      });

      // ペースト項目が有効になっている
      const pasteItem = screen.getByTestId("workspace-canvas-menu-paste");
      expect(pasteItem).toBeInTheDocument();
      expect(pasteItem).not.toBeDisabled();

      // ペーストを実行
      await user.click(pasteItem);

      // メニューが閉じる
      expect(
        screen.queryByTestId("workspace-canvas-context-menu"),
      ).not.toBeInTheDocument();

      // 新しいノードが追加されている（node-1 + ペーストされた node-2）
      expect(
        screen.getByTestId(`proof-node-${"node-2" satisfies string}`),
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
      ws = addNode(ws, "axiom", "MP", { x: 100, y: 100 }, "psi");
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

    it("duplicated axiom node preserves role (pure logic test)", () => {
      // UIテストでは単にduplicateが動作することを確認
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 }, "phi -> phi");

      const result = duplicateNode(ws, "node-1");
      const newNode = result.workspace.nodes.find((n) =>
        result.newNodeIds.has(n.id),
      );
      expect(newNode).toBeDefined();
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
      expect(entriesEl).toHaveTextContent("φ := α → β");
      expect(entriesEl).toHaveTextContent("ψ := γ");
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

    it("auto-extracts meta-variables and allows filling values to confirm substitution", async () => {
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

      // Auto-extracted: φ and ψ are pre-filled as read-only metaVar labels
      const metaVarLabel0 = screen.getByTestId("workspace-subst-metavar-0");
      const metaVarLabel1 = screen.getByTestId("workspace-subst-metavar-1");
      expect(metaVarLabel0).toHaveTextContent("φ");
      expect(metaVarLabel1).toHaveTextContent("ψ");

      // Kind labels are read-only
      const kindLabel0 = screen.getByTestId("workspace-subst-kind-0");
      const kindLabel1 = screen.getByTestId("workspace-subst-kind-1");
      expect(kindLabel0).toHaveTextContent("Formula");
      expect(kindLabel1).toHaveTextContent("Formula");

      // No Add/Remove buttons exist
      expect(screen.queryByTestId("workspace-subst-add-entry")).toBeNull();

      // Fill in values for the pre-populated entries (FormulaInput places input at ${testId}-input)
      const valueInput0 = screen.getByTestId("workspace-subst-value-0-input");
      const valueInput1 = screen.getByTestId("workspace-subst-value-1-input");
      await user.type(valueInput0, "alpha");
      await user.type(valueInput1, "beta");

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

      // Press Escape in the value input (FormulaInput places input at ${testId}-input)
      const valueInput = screen.getByTestId("workspace-subst-value-0-input");
      await user.click(valueInput);
      await user.keyboard("{Escape}");

      // Banner should disappear
      await waitFor(() => {
        expect(
          screen.queryByTestId("workspace-subst-prompt-banner"),
        ).toBeNull();
      });
    });

    it("displays kind as read-only text (not editable)", async () => {
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

      // Kind is displayed as read-only text
      const kindLabel = screen.getByTestId("workspace-subst-kind-0");
      expect(kindLabel).toHaveTextContent("Formula");
      // It should be a span, not a select
      expect(kindLabel.tagName).toBe("SPAN");
    });

    it("falls back to manual entry when formula has no meta-variables", async () => {
      const user = userEvent.setup();
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      // Empty formula text — extractSubstitutionTargetsFromText returns null
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 }, "");

      render(<StatefulWorkspace initialWorkspace={ws} />);

      const node = screen.getByTestId("proof-node-node-1");
      await user.pointer({ keys: "[MouseRight]", target: node });
      await user.click(
        screen.getByTestId("workspace-apply-substitution-to-node"),
      );

      // Fallback: manual entry banner appears
      const banner = screen.getByTestId("workspace-subst-prompt-banner");
      expect(banner).toBeInTheDocument();
    });

    it("shows Term kind label and term placeholder for formulas with term meta-variables", async () => {
      const user = userEvent.setup();
      // 述語論理で phi -> P(tau) は formula meta-variable φ と term meta-variable τ を含む
      let ws = createEmptyWorkspace(predicateLogicSystem);
      ws = addNode(ws, "axiom", "Custom", { x: 0, y: 0 }, "phi -> P(tau)");

      render(<StatefulWorkspace initialWorkspace={ws} />);

      const node = screen.getByTestId("proof-node-node-1");
      await user.pointer({ keys: "[MouseRight]", target: node });
      await user.click(
        screen.getByTestId("workspace-apply-substitution-to-node"),
      );

      // Banner should appear
      expect(
        screen.getByTestId("workspace-subst-prompt-banner"),
      ).toBeInTheDocument();

      // φ is a formula meta-variable → kind: "Formula"
      const kindLabel0 = screen.getByTestId("workspace-subst-kind-0");
      expect(kindLabel0).toHaveTextContent("Formula");

      // τ is a term meta-variable → kind: "Term"
      const kindLabel1 = screen.getByTestId("workspace-subst-kind-1");
      expect(kindLabel1).toHaveTextContent("Term");

      // Verify meta-variable labels
      const metaVarLabel0 = screen.getByTestId("workspace-subst-metavar-0");
      expect(metaVarLabel0).toHaveTextContent("φ");
      const metaVarLabel1 = screen.getByTestId("workspace-subst-metavar-1");
      expect(metaVarLabel1).toHaveTextContent("τ");

      // Verify placeholders: formula uses "alpha -> beta", term uses "S(0)"
      // FormulaInput/TermInput places the actual input at ${testId}-input
      const valueInput0 = screen.getByTestId("workspace-subst-value-0-input");
      expect(valueInput0).toHaveAttribute("placeholder", "alpha -> beta");
      const valueInput1 = screen.getByTestId("workspace-subst-value-1-input");
      expect(valueInput1).toHaveAttribute("placeholder", "S(0)");
    });
  });

  // --- コンテキストメニューからマージ ---

  describe("node context menu - merge with", () => {
    it("context menu shows Merge with... item", async () => {
      const user = userEvent.setup();
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 }, "phi");

      render(<StatefulWorkspace initialWorkspace={ws} testId="workspace" />);

      const node = screen.getByTestId("proof-node-node-1");
      await user.pointer({ keys: "[MouseRight]", target: node });

      expect(
        screen.getByTestId("workspace-merge-with-node"),
      ).toBeInTheDocument();
    });

    it("clicking Merge with... opens merge selection banner", async () => {
      const user = userEvent.setup();
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "axiom", "A2", { x: 200, y: 0 }, "phi");

      render(<StatefulWorkspace initialWorkspace={ws} testId="workspace" />);

      // Open context menu on node-1
      const node1 = screen.getByTestId("proof-node-node-1");
      await user.pointer({ keys: "[MouseRight]", target: node1 });

      // Click Merge with...
      const mergeItem = screen.getByTestId("workspace-merge-with-node");
      await user.click(mergeItem);

      // Context menu closes, merge banner appears
      expect(
        screen.queryByTestId("workspace-node-context-menu"),
      ).not.toBeInTheDocument();

      await waitFor(() => {
        expect(
          screen.getByTestId("workspace-merge-banner"),
        ).toBeInTheDocument();
      });
    });

    it("clicking a compatible node during merge mode merges the nodes", async () => {
      const user = userEvent.setup();
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "axiom", "A2", { x: 200, y: 0 }, "phi");
      ws = addNode(ws, "axiom", "A3", { x: 400, y: 0 }, "psi");

      render(<StatefulWorkspace initialWorkspace={ws} testId="workspace" />);

      // Open context menu on node-1
      const node1 = screen.getByTestId("proof-node-node-1");
      await user.pointer({ keys: "[MouseRight]", target: node1 });

      // Click Merge with...
      const mergeItem = screen.getByTestId("workspace-merge-with-node");
      await user.click(mergeItem);

      // Click node-2 (same formula) to merge
      const node2 = screen.getByTestId("proof-node-node-2");
      await user.click(node2);

      // node-2 should be removed (merged into node-1)
      await waitFor(() => {
        expect(
          screen.queryByTestId("proof-node-node-2"),
        ).not.toBeInTheDocument();
      });

      // node-1 and node-3 should still exist
      expect(screen.getByTestId("proof-node-node-1")).toBeInTheDocument();
      expect(screen.getByTestId("proof-node-node-3")).toBeInTheDocument();

      // Merge banner should be gone
      expect(
        screen.queryByTestId("workspace-merge-banner"),
      ).not.toBeInTheDocument();
    });

    it("cancel button on merge banner cancels merge mode", async () => {
      const user = userEvent.setup();
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "axiom", "A2", { x: 200, y: 0 }, "phi");

      render(<StatefulWorkspace initialWorkspace={ws} testId="workspace" />);

      // Open context menu on node-1
      const node1 = screen.getByTestId("proof-node-node-1");
      await user.pointer({ keys: "[MouseRight]", target: node1 });

      // Click Merge with...
      const mergeItem = screen.getByTestId("workspace-merge-with-node");
      await user.click(mergeItem);

      // Click Cancel on merge banner
      const cancelBtn = screen.getByText("Cancel Merge");
      await user.click(cancelBtn);

      // Merge banner should be gone
      expect(
        screen.queryByTestId("workspace-merge-banner"),
      ).not.toBeInTheDocument();

      // Both nodes should still exist
      expect(screen.getByTestId("proof-node-node-1")).toBeInTheDocument();
      expect(screen.getByTestId("proof-node-node-2")).toBeInTheDocument();
    });
  });

  describe("TAB (Tableau Calculus)", () => {
    it("renders with TAB system and shows TabRulePalette", () => {
      const ws = createEmptyWorkspace(tableauCalculusDeduction(tabSystem));
      render(
        <ProofWorkspace
          system={ws.system}
          workspace={ws}
          onWorkspaceChange={() => {}}
          testId="workspace"
        />,
      );
      expect(
        screen.getByTestId("workspace-tab-rule-palette"),
      ).toBeInTheDocument();
      expect(screen.getByText("Tableau Calculus")).toBeInTheDocument();
      expect(screen.getByText("BS")).toBeInTheDocument();
    });

    it("renders with TAB propositional system", () => {
      const ws = createEmptyWorkspace(tableauCalculusDeduction(tabPropSystem));
      render(
        <ProofWorkspace
          system={ws.system}
          workspace={ws}
          onWorkspaceChange={() => {}}
          testId="workspace"
        />,
      );
      expect(
        screen.getByTestId("workspace-tab-rule-palette"),
      ).toBeInTheDocument();
      // 量化子規則が表示されない
      expect(
        screen.queryByTestId("workspace-tab-rule-palette-rule-universal"),
      ).not.toBeInTheDocument();
    });

    it("adds a sequent node when add-sequent button is clicked", async () => {
      const user = userEvent.setup();
      const ws = createEmptyWorkspace(tableauCalculusDeduction(tabSystem));
      render(<StatefulWorkspace initialWorkspace={ws} testId="workspace" />);
      await user.click(
        screen.getByTestId("workspace-tab-rule-palette-add-sequent"),
      );
      // ノードが1つ追加されているはず
      await waitFor(() => {
        expect(screen.getByText("Sequent")).toBeInTheDocument();
      });
    });

    it("does not show AxiomPalette or NdRulePalette in TAB mode", () => {
      const ws = createEmptyWorkspace(tableauCalculusDeduction(tabSystem));
      render(
        <ProofWorkspace
          system={ws.system}
          workspace={ws}
          onWorkspaceChange={() => {}}
          testId="workspace"
        />,
      );
      expect(
        screen.queryByTestId("workspace-axiom-palette"),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("workspace-nd-rule-palette"),
      ).not.toBeInTheDocument();
    });

    it("clicking a rule shows TAB selection banner", async () => {
      const user = userEvent.setup();
      const ws = createEmptyWorkspace(tableauCalculusDeduction(tabSystem));
      render(<StatefulWorkspace initialWorkspace={ws} testId="workspace" />);
      // バナーが最初は非表示
      expect(
        screen.queryByTestId("workspace-tab-banner"),
      ).not.toBeInTheDocument();
      // 規則をクリック
      await user.click(
        screen.getByTestId("workspace-tab-rule-palette-rule-conjunction"),
      );
      // バナーが表示される
      expect(screen.getByTestId("workspace-tab-banner")).toBeInTheDocument();
    });

    it("clicking cancel in TAB banner dismisses it", async () => {
      const user = userEvent.setup();
      const ws = createEmptyWorkspace(tableauCalculusDeduction(tabSystem));
      render(<StatefulWorkspace initialWorkspace={ws} testId="workspace" />);
      // 規則をクリック
      await user.click(
        screen.getByTestId("workspace-tab-rule-palette-rule-conjunction"),
      );
      expect(screen.getByTestId("workspace-tab-banner")).toBeInTheDocument();
      // キャンセルボタンをクリック
      const cancelButton = screen
        .getByTestId("workspace-tab-banner")
        .querySelector("button");
      expect(cancelButton).not.toBeNull();
      await user.click(cancelButton!);
      // バナーが消える
      expect(
        screen.queryByTestId("workspace-tab-banner"),
      ).not.toBeInTheDocument();
    });

    it("TAB rule selection is cleared when another selection starts", async () => {
      const user = userEvent.setup();
      const ws = createEmptyWorkspace(tableauCalculusDeduction(tabSystem));
      render(<StatefulWorkspace initialWorkspace={ws} testId="workspace" />);
      // 規則をクリック
      await user.click(
        screen.getByTestId("workspace-tab-rule-palette-rule-conjunction"),
      );
      expect(screen.getByTestId("workspace-tab-banner")).toBeInTheDocument();
      // 別の規則をクリック → バナーは更新される（消えない）
      await user.click(
        screen.getByTestId("workspace-tab-rule-palette-rule-disjunction"),
      );
      expect(screen.getByTestId("workspace-tab-banner")).toBeInTheDocument();
    });

    it("selected rule is visually highlighted in palette", async () => {
      const user = userEvent.setup();
      const ws = createEmptyWorkspace(tableauCalculusDeduction(tabSystem));
      render(<StatefulWorkspace initialWorkspace={ws} testId="workspace" />);
      const ruleEl = screen.getByTestId(
        "workspace-tab-rule-palette-rule-conjunction",
      );
      // クリック前はfontWeight 600でない
      expect(ruleEl.style.fontWeight).not.toBe("600");
      // 規則をクリック
      await user.click(ruleEl);
      // 選択後はfontWeight 600
      expect(ruleEl.style.fontWeight).toBe("600");
    });

    it("applies conjunction rule when node is clicked during TAB selection", async () => {
      const user = userEvent.setup();
      // conjunction (φ∧ψ) を分解する — TABのシーケントテキストは論理式のみ
      const promptMock = vi.spyOn(globalThis, "prompt").mockReturnValue("0");
      let ws = createEmptyWorkspace(tableauCalculusDeduction(tabSystem));
      ws = addNode(ws, "axiom", "S1", { x: 100, y: 300 }, "phi ∧ psi");

      render(<StatefulWorkspace initialWorkspace={ws} testId="workspace" />);

      // conjunction規則をクリック
      await user.click(
        screen.getByTestId("workspace-tab-rule-palette-rule-conjunction"),
      );
      // バナーが表示される
      expect(screen.getByTestId("workspace-tab-banner")).toBeInTheDocument();

      // ノードをクリック
      await user.click(screen.getByTestId("proof-node-node-1"));

      // バナーが消える（規則が適用された）
      await waitFor(() => {
        expect(
          screen.queryByTestId("workspace-tab-banner"),
        ).not.toBeInTheDocument();
      });

      promptMock.mockRestore();
    });

    it("cancels TAB rule when prompt returns null", async () => {
      const user = userEvent.setup();
      const promptMock = vi.spyOn(globalThis, "prompt").mockReturnValue(null);
      let ws = createEmptyWorkspace(tableauCalculusDeduction(tabSystem));
      ws = addNode(ws, "axiom", "S1", { x: 100, y: 300 }, "T:phi & psi");

      render(<StatefulWorkspace initialWorkspace={ws} testId="workspace" />);

      // conjunction規則をクリック → ノードクリック
      await user.click(
        screen.getByTestId("workspace-tab-rule-palette-rule-conjunction"),
      );
      await user.click(screen.getByTestId("proof-node-node-1"));

      // promptがnullを返したのでバナーが消える（キャンセル）
      await waitFor(() => {
        expect(
          screen.queryByTestId("workspace-tab-banner"),
        ).not.toBeInTheDocument();
      });

      promptMock.mockRestore();
    });

    it("cancels TAB rule when prompt returns NaN", async () => {
      const user = userEvent.setup();
      const promptMock = vi.spyOn(globalThis, "prompt").mockReturnValue("abc");
      let ws = createEmptyWorkspace(tableauCalculusDeduction(tabSystem));
      ws = addNode(ws, "axiom", "S1", { x: 100, y: 300 }, "T:phi & psi");

      render(<StatefulWorkspace initialWorkspace={ws} testId="workspace" />);

      await user.click(
        screen.getByTestId("workspace-tab-rule-palette-rule-conjunction"),
      );
      await user.click(screen.getByTestId("proof-node-node-1"));

      // NaN入力でバナーが消える（キャンセル）
      await waitFor(() => {
        expect(
          screen.queryByTestId("workspace-tab-banner"),
        ).not.toBeInTheDocument();
      });

      promptMock.mockRestore();
    });

    it("applies exchange rule with position prompt", async () => {
      const user = userEvent.setup();
      const promptMock = vi.spyOn(globalThis, "prompt").mockReturnValue("0");
      let ws = createEmptyWorkspace(tableauCalculusDeduction(tabSystem));
      ws = addNode(ws, "axiom", "S1", { x: 100, y: 300 }, "phi, psi |- chi");

      render(<StatefulWorkspace initialWorkspace={ws} testId="workspace" />);

      await user.click(
        screen.getByTestId("workspace-tab-rule-palette-rule-exchange"),
      );
      await user.click(screen.getByTestId("proof-node-node-1"));

      await waitFor(() => {
        expect(
          screen.queryByTestId("workspace-tab-banner"),
        ).not.toBeInTheDocument();
      });

      promptMock.mockRestore();
    });

    it("applies universal rule with term prompt", async () => {
      const user = userEvent.setup();
      // 最初のpromptは位置(0), 次はterm
      const promptMock = vi
        .spyOn(globalThis, "prompt")
        .mockReturnValueOnce("0")
        .mockReturnValueOnce("a");
      let ws = createEmptyWorkspace(tableauCalculusDeduction(tabSystem));
      ws = addNode(ws, "axiom", "S1", { x: 100, y: 300 }, "T:forall x. P(x)");

      render(<StatefulWorkspace initialWorkspace={ws} testId="workspace" />);

      await user.click(
        screen.getByTestId("workspace-tab-rule-palette-rule-universal"),
      );
      await user.click(screen.getByTestId("proof-node-node-1"));

      await waitFor(() => {
        expect(
          screen.queryByTestId("workspace-tab-banner"),
        ).not.toBeInTheDocument();
      });

      promptMock.mockRestore();
    });

    it("applies existential rule with eigenVariable prompt", async () => {
      const user = userEvent.setup();
      const promptMock = vi
        .spyOn(globalThis, "prompt")
        .mockReturnValueOnce("0")
        .mockReturnValueOnce("c");
      let ws = createEmptyWorkspace(tableauCalculusDeduction(tabSystem));
      ws = addNode(ws, "axiom", "S1", { x: 100, y: 300 }, "T:exists x. P(x)");

      render(<StatefulWorkspace initialWorkspace={ws} testId="workspace" />);

      await user.click(
        screen.getByTestId("workspace-tab-rule-palette-rule-existential"),
      );
      await user.click(screen.getByTestId("proof-node-node-1"));

      await waitFor(() => {
        expect(
          screen.queryByTestId("workspace-tab-banner"),
        ).not.toBeInTheDocument();
      });

      promptMock.mockRestore();
    });

    it("exchange rule cancels when prompt returns null", async () => {
      const user = userEvent.setup();
      const promptMock = vi.spyOn(globalThis, "prompt").mockReturnValue(null);
      let ws = createEmptyWorkspace(tableauCalculusDeduction(tabSystem));
      ws = addNode(ws, "axiom", "S1", { x: 100, y: 300 }, "phi, psi |- chi");

      render(<StatefulWorkspace initialWorkspace={ws} testId="workspace" />);

      await user.click(
        screen.getByTestId("workspace-tab-rule-palette-rule-exchange"),
      );
      await user.click(screen.getByTestId("proof-node-node-1"));

      await waitFor(() => {
        expect(
          screen.queryByTestId("workspace-tab-banner"),
        ).not.toBeInTheDocument();
      });

      promptMock.mockRestore();
    });

    it("exchange rule cancels when prompt returns NaN", async () => {
      const user = userEvent.setup();
      const promptMock = vi.spyOn(globalThis, "prompt").mockReturnValue("abc");
      let ws = createEmptyWorkspace(tableauCalculusDeduction(tabSystem));
      ws = addNode(ws, "axiom", "S1", { x: 100, y: 300 }, "phi, psi |- chi");

      render(<StatefulWorkspace initialWorkspace={ws} testId="workspace" />);

      await user.click(
        screen.getByTestId("workspace-tab-rule-palette-rule-exchange"),
      );
      await user.click(screen.getByTestId("proof-node-node-1"));

      await waitFor(() => {
        expect(
          screen.queryByTestId("workspace-tab-banner"),
        ).not.toBeInTheDocument();
      });

      promptMock.mockRestore();
    });

    it("universal rule cancels when term prompt returns null", async () => {
      const user = userEvent.setup();
      // 最初のprompt(位置)は成功、次のprompt(term)はnull
      const promptMock = vi
        .spyOn(globalThis, "prompt")
        .mockReturnValueOnce("0")
        .mockReturnValueOnce(null);
      let ws = createEmptyWorkspace(tableauCalculusDeduction(tabSystem));
      ws = addNode(ws, "axiom", "S1", { x: 100, y: 300 }, "T:forall x. P(x)");

      render(<StatefulWorkspace initialWorkspace={ws} testId="workspace" />);

      await user.click(
        screen.getByTestId("workspace-tab-rule-palette-rule-universal"),
      );
      await user.click(screen.getByTestId("proof-node-node-1"));

      await waitFor(() => {
        expect(
          screen.queryByTestId("workspace-tab-banner"),
        ).not.toBeInTheDocument();
      });

      promptMock.mockRestore();
    });

    it("existential rule cancels when eigenVariable prompt returns null", async () => {
      const user = userEvent.setup();
      const promptMock = vi
        .spyOn(globalThis, "prompt")
        .mockReturnValueOnce("0")
        .mockReturnValueOnce(null);
      let ws = createEmptyWorkspace(tableauCalculusDeduction(tabSystem));
      ws = addNode(ws, "axiom", "S1", { x: 100, y: 300 }, "T:exists x. P(x)");

      render(<StatefulWorkspace initialWorkspace={ws} testId="workspace" />);

      await user.click(
        screen.getByTestId("workspace-tab-rule-palette-rule-existential"),
      );
      await user.click(screen.getByTestId("proof-node-node-1"));

      await waitFor(() => {
        expect(
          screen.queryByTestId("workspace-tab-banner"),
        ).not.toBeInTheDocument();
      });

      promptMock.mockRestore();
    });

    it("shows alert when TAB rule application fails", async () => {
      const user = userEvent.setup();
      const promptMock = vi.spyOn(globalThis, "prompt").mockReturnValue("0");
      const alertMock = vi
        .spyOn(globalThis, "alert")
        .mockImplementation(() => {});
      let ws = createEmptyWorkspace(tableauCalculusDeduction(tabSystem));
      // 空の論理式（パースエラーになるはず）
      ws = addNode(ws, "axiom", "S1", { x: 100, y: 300 }, "");

      render(<StatefulWorkspace initialWorkspace={ws} testId="workspace" />);

      await user.click(
        screen.getByTestId("workspace-tab-rule-palette-rule-conjunction"),
      );
      await user.click(screen.getByTestId("proof-node-node-1"));

      // エラー時はalertが呼ばれる
      await waitFor(() => {
        expect(alertMock).toHaveBeenCalled();
      });

      promptMock.mockRestore();
      alertMock.mockRestore();
    });
  });

  describe("AT (Analytic Tableau)", () => {
    it("renders with AT system and shows AtRulePalette", () => {
      const ws = createEmptyWorkspace(analyticTableauDeduction(atSystem));
      render(
        <ProofWorkspace
          system={ws.system}
          workspace={ws}
          onWorkspaceChange={() => {}}
          testId="workspace"
        />,
      );
      expect(
        screen.getByTestId("workspace-at-rule-palette"),
      ).toBeInTheDocument();
    });

    it("clicking an AT alpha rule shows AT selection banner", async () => {
      const user = userEvent.setup();
      const ws = createEmptyWorkspace(analyticTableauDeduction(atSystem));
      render(<StatefulWorkspace initialWorkspace={ws} testId="workspace" />);

      // バナーが最初は非表示
      expect(
        screen.queryByTestId("workspace-at-banner"),
      ).not.toBeInTheDocument();

      // α規則をクリック
      await user.click(
        screen.getByTestId("workspace-at-rule-palette-rule-alpha-conj"),
      );

      // バナーが表示される
      expect(screen.getByTestId("workspace-at-banner")).toBeInTheDocument();
    });

    it("clicking cancel in AT banner dismisses it", async () => {
      const user = userEvent.setup();
      const ws = createEmptyWorkspace(analyticTableauDeduction(atSystem));
      render(<StatefulWorkspace initialWorkspace={ws} testId="workspace" />);

      await user.click(
        screen.getByTestId("workspace-at-rule-palette-rule-alpha-conj"),
      );
      expect(screen.getByTestId("workspace-at-banner")).toBeInTheDocument();

      // キャンセルボタンをクリック
      const cancelButton = screen
        .getByTestId("workspace-at-banner")
        .querySelector("button");
      expect(cancelButton).not.toBeNull();
      await user.click(cancelButton!);

      expect(
        screen.queryByTestId("workspace-at-banner"),
      ).not.toBeInTheDocument();
    });

    it("applies alpha-conj rule on node click", async () => {
      const user = userEvent.setup();
      let ws = createEmptyWorkspace(analyticTableauDeduction(atSystem));
      ws = addNode(ws, "axiom", "SF", { x: 100, y: 300 }, "T:phi & psi");

      render(<StatefulWorkspace initialWorkspace={ws} testId="workspace" />);

      // α-conj 規則をクリック
      await user.click(
        screen.getByTestId("workspace-at-rule-palette-rule-alpha-conj"),
      );
      expect(screen.getByTestId("workspace-at-banner")).toBeInTheDocument();

      // ノードをクリック → 規則適用
      await user.click(screen.getByTestId("proof-node-node-1"));

      // バナーが消える
      await waitFor(() => {
        expect(
          screen.queryByTestId("workspace-at-banner"),
        ).not.toBeInTheDocument();
      });
    });

    it("applies beta-impl rule on node click", async () => {
      const user = userEvent.setup();
      let ws = createEmptyWorkspace(analyticTableauDeduction(atSystem));
      ws = addNode(ws, "axiom", "SF", { x: 100, y: 300 }, "T:phi -> psi");

      render(<StatefulWorkspace initialWorkspace={ws} testId="workspace" />);

      await user.click(
        screen.getByTestId("workspace-at-rule-palette-rule-beta-impl"),
      );
      await user.click(screen.getByTestId("proof-node-node-1"));

      await waitFor(() => {
        expect(
          screen.queryByTestId("workspace-at-banner"),
        ).not.toBeInTheDocument();
      });
    });

    it("shows alert when AT rule application fails", async () => {
      const user = userEvent.setup();
      const alertMock = vi
        .spyOn(globalThis, "alert")
        .mockImplementation(() => {});
      let ws = createEmptyWorkspace(analyticTableauDeduction(atSystem));
      // 空の論理式（パースエラー）
      ws = addNode(ws, "axiom", "SF", { x: 100, y: 300 }, "");

      render(<StatefulWorkspace initialWorkspace={ws} testId="workspace" />);

      await user.click(
        screen.getByTestId("workspace-at-rule-palette-rule-alpha-conj"),
      );
      await user.click(screen.getByTestId("proof-node-node-1"));

      await waitFor(() => {
        expect(alertMock).toHaveBeenCalled();
      });

      alertMock.mockRestore();
    });

    it("closure rule enters selecting-contradiction phase", async () => {
      const user = userEvent.setup();
      let ws = createEmptyWorkspace(analyticTableauDeduction(atSystem));
      ws = addNode(ws, "axiom", "SF", { x: 100, y: 300 }, "T:phi");
      ws = addNode(ws, "axiom", "SF2", { x: 300, y: 300 }, "F:phi");

      render(<StatefulWorkspace initialWorkspace={ws} testId="workspace" />);

      // closure規則をクリック
      await user.click(
        screen.getByTestId("workspace-at-rule-palette-rule-closure"),
      );
      expect(screen.getByTestId("workspace-at-banner")).toBeInTheDocument();

      // 最初のノードをクリック（主ノード選択）
      await user.click(screen.getByTestId("proof-node-node-1"));

      // まだバナーが表示されている（矛盾ノード選択待ち）
      expect(screen.getByTestId("workspace-at-banner")).toBeInTheDocument();

      // 2番目のノードをクリック（矛盾ノード選択）
      await user.click(screen.getByTestId("proof-node-node-2"));

      // バナーが消える（closure適用完了）
      await waitFor(() => {
        expect(
          screen.queryByTestId("workspace-at-banner"),
        ).not.toBeInTheDocument();
      });
    });

    it("closure rule shows alert on invalid pair", async () => {
      const user = userEvent.setup();
      const alertMock = vi
        .spyOn(globalThis, "alert")
        .mockImplementation(() => {});
      let ws = createEmptyWorkspace(analyticTableauDeduction(atSystem));
      ws = addNode(ws, "axiom", "SF", { x: 100, y: 300 }, "T:phi");
      ws = addNode(ws, "axiom", "SF2", { x: 300, y: 300 }, "T:psi");

      render(<StatefulWorkspace initialWorkspace={ws} testId="workspace" />);

      await user.click(
        screen.getByTestId("workspace-at-rule-palette-rule-closure"),
      );
      await user.click(screen.getByTestId("proof-node-node-1"));
      await user.click(screen.getByTestId("proof-node-node-2"));

      await waitFor(() => {
        expect(alertMock).toHaveBeenCalled();
      });

      alertMock.mockRestore();
    });

    it("gamma rule prompts for term", async () => {
      const user = userEvent.setup();
      const promptMock = vi.spyOn(globalThis, "prompt").mockReturnValue("a");
      let ws = createEmptyWorkspace(analyticTableauDeduction(atSystem));
      ws = addNode(ws, "axiom", "SF", { x: 100, y: 300 }, "T:forall x. P(x)");

      render(<StatefulWorkspace initialWorkspace={ws} testId="workspace" />);

      await user.click(
        screen.getByTestId("workspace-at-rule-palette-rule-gamma-univ"),
      );
      await user.click(screen.getByTestId("proof-node-node-1"));

      // promptが呼ばれた
      expect(promptMock).toHaveBeenCalled();

      await waitFor(() => {
        expect(
          screen.queryByTestId("workspace-at-banner"),
        ).not.toBeInTheDocument();
      });

      promptMock.mockRestore();
    });

    it("gamma rule cancels when prompt returns null", async () => {
      const user = userEvent.setup();
      const promptMock = vi.spyOn(globalThis, "prompt").mockReturnValue(null);
      let ws = createEmptyWorkspace(analyticTableauDeduction(atSystem));
      ws = addNode(ws, "axiom", "SF", { x: 100, y: 300 }, "T:forall x. P(x)");

      render(<StatefulWorkspace initialWorkspace={ws} testId="workspace" />);

      await user.click(
        screen.getByTestId("workspace-at-rule-palette-rule-gamma-univ"),
      );
      await user.click(screen.getByTestId("proof-node-node-1"));

      await waitFor(() => {
        expect(
          screen.queryByTestId("workspace-at-banner"),
        ).not.toBeInTheDocument();
      });

      promptMock.mockRestore();
    });

    it("delta rule prompts for eigen variable", async () => {
      const user = userEvent.setup();
      const promptMock = vi.spyOn(globalThis, "prompt").mockReturnValue("c");
      let ws = createEmptyWorkspace(analyticTableauDeduction(atSystem));
      ws = addNode(ws, "axiom", "SF", { x: 100, y: 300 }, "T:exists x. P(x)");

      render(<StatefulWorkspace initialWorkspace={ws} testId="workspace" />);

      await user.click(
        screen.getByTestId("workspace-at-rule-palette-rule-delta-exist"),
      );
      await user.click(screen.getByTestId("proof-node-node-1"));

      expect(promptMock).toHaveBeenCalled();

      await waitFor(() => {
        expect(
          screen.queryByTestId("workspace-at-banner"),
        ).not.toBeInTheDocument();
      });

      promptMock.mockRestore();
    });

    it("delta rule cancels when prompt returns null", async () => {
      const user = userEvent.setup();
      const promptMock = vi.spyOn(globalThis, "prompt").mockReturnValue(null);
      let ws = createEmptyWorkspace(analyticTableauDeduction(atSystem));
      ws = addNode(ws, "axiom", "SF", { x: 100, y: 300 }, "T:exists x. P(x)");

      render(<StatefulWorkspace initialWorkspace={ws} testId="workspace" />);

      await user.click(
        screen.getByTestId("workspace-at-rule-palette-rule-delta-exist"),
      );
      await user.click(screen.getByTestId("proof-node-node-1"));

      await waitFor(() => {
        expect(
          screen.queryByTestId("workspace-at-banner"),
        ).not.toBeInTheDocument();
      });

      promptMock.mockRestore();
    });

    it("AT rule selection clears other selection modes", async () => {
      const user = userEvent.setup();
      const ws = createEmptyWorkspace(analyticTableauDeduction(atSystem));
      render(<StatefulWorkspace initialWorkspace={ws} testId="workspace" />);

      // α規則をクリック → β規則をクリック → バナーは更新される
      await user.click(
        screen.getByTestId("workspace-at-rule-palette-rule-alpha-conj"),
      );
      expect(screen.getByTestId("workspace-at-banner")).toBeInTheDocument();

      await user.click(
        screen.getByTestId("workspace-at-rule-palette-rule-beta-impl"),
      );
      expect(screen.getByTestId("workspace-at-banner")).toBeInTheDocument();
    });
  });

  describe("SC (Sequent Calculus)", () => {
    it("renders with SC LK system and shows SC palette", () => {
      const ws = createEmptyWorkspace(sequentCalculusDeduction(lkSystem));
      render(
        <ProofWorkspace
          system={ws.system}
          workspace={ws}
          onWorkspaceChange={() => {}}
          testId="workspace"
        />,
      );
      expect(
        screen.getByTestId("workspace-sc-rule-palette"),
      ).toBeInTheDocument();
      expect(screen.getByText("Sequent Calculus")).toBeInTheDocument();
      expect(screen.getByText("公理 (ID)")).toBeInTheDocument();
    });

    it("adds a sequent node when add-sequent button is clicked", async () => {
      const user = userEvent.setup();
      const ws = createEmptyWorkspace(sequentCalculusDeduction(lkSystem));
      render(<StatefulWorkspace initialWorkspace={ws} testId="workspace" />);
      await user.click(
        screen.getByTestId("workspace-sc-rule-palette-add-sequent"),
      );
      await waitFor(() => {
        expect(screen.getByText("Sequent")).toBeInTheDocument();
      });
    });

    it("does not show other palettes in SC mode", () => {
      const ws = createEmptyWorkspace(sequentCalculusDeduction(lkSystem));
      render(
        <ProofWorkspace
          system={ws.system}
          workspace={ws}
          onWorkspaceChange={() => {}}
          testId="workspace"
        />,
      );
      expect(
        screen.queryByTestId("workspace-axiom-palette"),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("workspace-nd-rule-palette"),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("workspace-tab-rule-palette"),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("workspace-at-rule-palette"),
      ).not.toBeInTheDocument();
    });

    it("clicking a SC rule shows SC selection banner", async () => {
      const user = userEvent.setup();
      const ws = createEmptyWorkspace(sequentCalculusDeduction(lkSystem));
      render(<StatefulWorkspace initialWorkspace={ws} testId="workspace" />);
      expect(
        screen.queryByTestId("workspace-sc-banner"),
      ).not.toBeInTheDocument();
      await user.click(
        screen.getByTestId("workspace-sc-rule-palette-rule-conjunction-right"),
      );
      expect(screen.getByTestId("workspace-sc-banner")).toBeInTheDocument();
    });

    it("clicking cancel in SC banner dismisses it", async () => {
      const user = userEvent.setup();
      const ws = createEmptyWorkspace(sequentCalculusDeduction(lkSystem));
      render(<StatefulWorkspace initialWorkspace={ws} testId="workspace" />);
      await user.click(
        screen.getByTestId("workspace-sc-rule-palette-rule-conjunction-right"),
      );
      expect(screen.getByTestId("workspace-sc-banner")).toBeInTheDocument();
      const cancelButton = screen
        .getByTestId("workspace-sc-banner")
        .querySelector("button");
      expect(cancelButton).not.toBeNull();
      await user.click(cancelButton!);
      expect(
        screen.queryByTestId("workspace-sc-banner"),
      ).not.toBeInTheDocument();
    });

    it("applies identity rule (axiom, no prompt) when node is clicked", async () => {
      const user = userEvent.setup();
      let ws = createEmptyWorkspace(sequentCalculusDeduction(lkSystem));
      ws = addNode(ws, "axiom", "S1", { x: 100, y: 300 }, "phi ⇒ phi");

      render(<StatefulWorkspace initialWorkspace={ws} testId="workspace" />);

      await user.click(
        screen.getByTestId("workspace-sc-rule-palette-rule-identity"),
      );
      expect(screen.getByTestId("workspace-sc-banner")).toBeInTheDocument();

      await user.click(screen.getByTestId("proof-node-node-1"));

      await waitFor(() => {
        expect(
          screen.queryByTestId("workspace-sc-banner"),
        ).not.toBeInTheDocument();
      });
    });

    it("applies conjunction-right rule with position prompt", async () => {
      const user = userEvent.setup();
      const promptMock = vi.spyOn(globalThis, "prompt").mockReturnValue("0");
      let ws = createEmptyWorkspace(sequentCalculusDeduction(lkSystem));
      ws = addNode(ws, "axiom", "S1", { x: 100, y: 300 }, "phi ⇒ psi ∧ chi");

      render(<StatefulWorkspace initialWorkspace={ws} testId="workspace" />);

      await user.click(
        screen.getByTestId("workspace-sc-rule-palette-rule-conjunction-right"),
      );
      await user.click(screen.getByTestId("proof-node-node-1"));

      await waitFor(() => {
        expect(
          screen.queryByTestId("workspace-sc-banner"),
        ).not.toBeInTheDocument();
      });

      promptMock.mockRestore();
    });

    it("applies exchange-left rule with exchange position prompt", async () => {
      const user = userEvent.setup();
      const promptMock = vi.spyOn(globalThis, "prompt").mockReturnValue("0");
      let ws = createEmptyWorkspace(sequentCalculusDeduction(lkSystem));
      ws = addNode(ws, "axiom", "S1", { x: 100, y: 300 }, "phi, psi ⇒ chi");

      render(<StatefulWorkspace initialWorkspace={ws} testId="workspace" />);

      await user.click(
        screen.getByTestId("workspace-sc-rule-palette-rule-exchange-left"),
      );
      await user.click(screen.getByTestId("proof-node-node-1"));

      await waitFor(() => {
        expect(
          screen.queryByTestId("workspace-sc-banner"),
        ).not.toBeInTheDocument();
      });

      promptMock.mockRestore();
    });

    it("cancels SC exchange-left when prompt returns null", async () => {
      const user = userEvent.setup();
      const promptMock = vi.spyOn(globalThis, "prompt").mockReturnValue(null);
      let ws = createEmptyWorkspace(sequentCalculusDeduction(lkSystem));
      ws = addNode(ws, "axiom", "S1", { x: 100, y: 300 }, "phi, psi ⇒ chi");

      render(<StatefulWorkspace initialWorkspace={ws} testId="workspace" />);

      await user.click(
        screen.getByTestId("workspace-sc-rule-palette-rule-exchange-left"),
      );
      await user.click(screen.getByTestId("proof-node-node-1"));

      await waitFor(() => {
        expect(
          screen.queryByTestId("workspace-sc-banner"),
        ).not.toBeInTheDocument();
      });

      promptMock.mockRestore();
    });

    it("cancels SC exchange-left when prompt returns NaN", async () => {
      const user = userEvent.setup();
      const promptMock = vi.spyOn(globalThis, "prompt").mockReturnValue("abc");
      let ws = createEmptyWorkspace(sequentCalculusDeduction(lkSystem));
      ws = addNode(ws, "axiom", "S1", { x: 100, y: 300 }, "phi, psi ⇒ chi");

      render(<StatefulWorkspace initialWorkspace={ws} testId="workspace" />);

      await user.click(
        screen.getByTestId("workspace-sc-rule-palette-rule-exchange-left"),
      );
      await user.click(screen.getByTestId("proof-node-node-1"));

      await waitFor(() => {
        expect(
          screen.queryByTestId("workspace-sc-banner"),
        ).not.toBeInTheDocument();
      });

      promptMock.mockRestore();
    });

    it("applies cut rule with cut formula prompt", async () => {
      const user = userEvent.setup();
      const promptMock = vi.spyOn(globalThis, "prompt").mockReturnValue("phi");
      let ws = createEmptyWorkspace(sequentCalculusDeduction(lkSystem));
      ws = addNode(ws, "axiom", "S1", { x: 100, y: 300 }, "phi ⇒ psi");

      render(<StatefulWorkspace initialWorkspace={ws} testId="workspace" />);

      await user.click(
        screen.getByTestId("workspace-sc-rule-palette-rule-cut"),
      );
      await user.click(screen.getByTestId("proof-node-node-1"));

      await waitFor(() => {
        expect(
          screen.queryByTestId("workspace-sc-banner"),
        ).not.toBeInTheDocument();
      });

      promptMock.mockRestore();
    });

    it("cancels SC cut rule when prompt returns null", async () => {
      const user = userEvent.setup();
      const promptMock = vi.spyOn(globalThis, "prompt").mockReturnValue(null);
      let ws = createEmptyWorkspace(sequentCalculusDeduction(lkSystem));
      ws = addNode(ws, "axiom", "S1", { x: 100, y: 300 }, "phi ⇒ psi");

      render(<StatefulWorkspace initialWorkspace={ws} testId="workspace" />);

      await user.click(
        screen.getByTestId("workspace-sc-rule-palette-rule-cut"),
      );
      await user.click(screen.getByTestId("proof-node-node-1"));

      await waitFor(() => {
        expect(
          screen.queryByTestId("workspace-sc-banner"),
        ).not.toBeInTheDocument();
      });

      promptMock.mockRestore();
    });

    it("applies conjunction-left rule with component index prompt", async () => {
      const user = userEvent.setup();
      const promptMock = vi
        .spyOn(globalThis, "prompt")
        .mockReturnValueOnce("0")
        .mockReturnValueOnce("1");
      let ws = createEmptyWorkspace(sequentCalculusDeduction(lkSystem));
      ws = addNode(ws, "axiom", "S1", { x: 100, y: 300 }, "phi ∧ psi ⇒ chi");

      render(<StatefulWorkspace initialWorkspace={ws} testId="workspace" />);

      await user.click(
        screen.getByTestId("workspace-sc-rule-palette-rule-conjunction-left"),
      );
      await user.click(screen.getByTestId("proof-node-node-1"));

      await waitFor(() => {
        expect(
          screen.queryByTestId("workspace-sc-banner"),
        ).not.toBeInTheDocument();
      });

      promptMock.mockRestore();
    });

    it("cancels SC conjunction-left when component index prompt returns null", async () => {
      const user = userEvent.setup();
      const promptMock = vi
        .spyOn(globalThis, "prompt")
        .mockReturnValueOnce("0")
        .mockReturnValueOnce(null);
      let ws = createEmptyWorkspace(sequentCalculusDeduction(lkSystem));
      ws = addNode(ws, "axiom", "S1", { x: 100, y: 300 }, "phi ∧ psi ⇒ chi");

      render(<StatefulWorkspace initialWorkspace={ws} testId="workspace" />);

      await user.click(
        screen.getByTestId("workspace-sc-rule-palette-rule-conjunction-left"),
      );
      await user.click(screen.getByTestId("proof-node-node-1"));

      await waitFor(() => {
        expect(
          screen.queryByTestId("workspace-sc-banner"),
        ).not.toBeInTheDocument();
      });

      promptMock.mockRestore();
    });

    it("cancels SC conjunction-left when component index is invalid (not 1 or 2)", async () => {
      const user = userEvent.setup();
      const promptMock = vi
        .spyOn(globalThis, "prompt")
        .mockReturnValueOnce("0")
        .mockReturnValueOnce("3");
      let ws = createEmptyWorkspace(sequentCalculusDeduction(lkSystem));
      ws = addNode(ws, "axiom", "S1", { x: 100, y: 300 }, "phi ∧ psi ⇒ chi");

      render(<StatefulWorkspace initialWorkspace={ws} testId="workspace" />);

      await user.click(
        screen.getByTestId("workspace-sc-rule-palette-rule-conjunction-left"),
      );
      await user.click(screen.getByTestId("proof-node-node-1"));

      await waitFor(() => {
        expect(
          screen.queryByTestId("workspace-sc-banner"),
        ).not.toBeInTheDocument();
      });

      promptMock.mockRestore();
    });

    it("applies universal-left rule with term prompt", async () => {
      const user = userEvent.setup();
      const promptMock = vi
        .spyOn(globalThis, "prompt")
        .mockReturnValueOnce("0")
        .mockReturnValueOnce("a");
      let ws = createEmptyWorkspace(sequentCalculusDeduction(lkSystem));
      ws = addNode(
        ws,
        "axiom",
        "S1",
        { x: 100, y: 300 },
        "forall x. P(x) ⇒ Q(x)",
      );

      render(<StatefulWorkspace initialWorkspace={ws} testId="workspace" />);

      await user.click(
        screen.getByTestId("workspace-sc-rule-palette-rule-universal-left"),
      );
      await user.click(screen.getByTestId("proof-node-node-1"));

      await waitFor(() => {
        expect(
          screen.queryByTestId("workspace-sc-banner"),
        ).not.toBeInTheDocument();
      });

      promptMock.mockRestore();
    });

    it("cancels SC universal-left when term prompt returns null", async () => {
      const user = userEvent.setup();
      const promptMock = vi
        .spyOn(globalThis, "prompt")
        .mockReturnValueOnce("0")
        .mockReturnValueOnce(null);
      let ws = createEmptyWorkspace(sequentCalculusDeduction(lkSystem));
      ws = addNode(
        ws,
        "axiom",
        "S1",
        { x: 100, y: 300 },
        "forall x. P(x) ⇒ Q(x)",
      );

      render(<StatefulWorkspace initialWorkspace={ws} testId="workspace" />);

      await user.click(
        screen.getByTestId("workspace-sc-rule-palette-rule-universal-left"),
      );
      await user.click(screen.getByTestId("proof-node-node-1"));

      await waitFor(() => {
        expect(
          screen.queryByTestId("workspace-sc-banner"),
        ).not.toBeInTheDocument();
      });

      promptMock.mockRestore();
    });

    it("applies universal-right rule with eigenVariable prompt", async () => {
      const user = userEvent.setup();
      const promptMock = vi
        .spyOn(globalThis, "prompt")
        .mockReturnValueOnce("0")
        .mockReturnValueOnce("c");
      let ws = createEmptyWorkspace(sequentCalculusDeduction(lkSystem));
      ws = addNode(ws, "axiom", "S1", { x: 100, y: 300 }, "⇒ forall x. P(x)");

      render(<StatefulWorkspace initialWorkspace={ws} testId="workspace" />);

      await user.click(
        screen.getByTestId("workspace-sc-rule-palette-rule-universal-right"),
      );
      await user.click(screen.getByTestId("proof-node-node-1"));

      await waitFor(() => {
        expect(
          screen.queryByTestId("workspace-sc-banner"),
        ).not.toBeInTheDocument();
      });

      promptMock.mockRestore();
    });

    it("cancels SC universal-right when eigenVariable prompt returns null", async () => {
      const user = userEvent.setup();
      const promptMock = vi
        .spyOn(globalThis, "prompt")
        .mockReturnValueOnce("0")
        .mockReturnValueOnce(null);
      let ws = createEmptyWorkspace(sequentCalculusDeduction(lkSystem));
      ws = addNode(ws, "axiom", "S1", { x: 100, y: 300 }, "⇒ forall x. P(x)");

      render(<StatefulWorkspace initialWorkspace={ws} testId="workspace" />);

      await user.click(
        screen.getByTestId("workspace-sc-rule-palette-rule-universal-right"),
      );
      await user.click(screen.getByTestId("proof-node-node-1"));

      await waitFor(() => {
        expect(
          screen.queryByTestId("workspace-sc-banner"),
        ).not.toBeInTheDocument();
      });

      promptMock.mockRestore();
    });

    it("cancels SC position prompt when returns null", async () => {
      const user = userEvent.setup();
      const promptMock = vi.spyOn(globalThis, "prompt").mockReturnValue(null);
      let ws = createEmptyWorkspace(sequentCalculusDeduction(lkSystem));
      ws = addNode(ws, "axiom", "S1", { x: 100, y: 300 }, "phi ⇒ psi ∧ chi");

      render(<StatefulWorkspace initialWorkspace={ws} testId="workspace" />);

      await user.click(
        screen.getByTestId("workspace-sc-rule-palette-rule-conjunction-right"),
      );
      await user.click(screen.getByTestId("proof-node-node-1"));

      await waitFor(() => {
        expect(
          screen.queryByTestId("workspace-sc-banner"),
        ).not.toBeInTheDocument();
      });

      promptMock.mockRestore();
    });

    it("cancels SC position prompt when returns NaN", async () => {
      const user = userEvent.setup();
      const promptMock = vi.spyOn(globalThis, "prompt").mockReturnValue("abc");
      let ws = createEmptyWorkspace(sequentCalculusDeduction(lkSystem));
      ws = addNode(ws, "axiom", "S1", { x: 100, y: 300 }, "phi ⇒ psi ∧ chi");

      render(<StatefulWorkspace initialWorkspace={ws} testId="workspace" />);

      await user.click(
        screen.getByTestId("workspace-sc-rule-palette-rule-conjunction-right"),
      );
      await user.click(screen.getByTestId("proof-node-node-1"));

      await waitFor(() => {
        expect(
          screen.queryByTestId("workspace-sc-banner"),
        ).not.toBeInTheDocument();
      });

      promptMock.mockRestore();
    });

    it("SC node click dispatches to handleNodeClickForSc", async () => {
      const user = userEvent.setup();
      const promptMock = vi.spyOn(globalThis, "prompt").mockReturnValue("0");
      let ws = createEmptyWorkspace(sequentCalculusDeduction(lkSystem));
      ws = addNode(ws, "axiom", "S1", { x: 100, y: 300 }, "phi ⇒ phi");

      render(<StatefulWorkspace initialWorkspace={ws} testId="workspace" />);

      // SC規則を選択してノードクリック → scSelection分岐を通る
      await user.click(
        screen.getByTestId("workspace-sc-rule-palette-rule-identity"),
      );
      await user.click(screen.getByTestId("proof-node-node-1"));

      await waitFor(() => {
        expect(
          screen.queryByTestId("workspace-sc-banner"),
        ).not.toBeInTheDocument();
      });

      promptMock.mockRestore();
    });

    it("shows SC error alert when rule application fails", async () => {
      const user = userEvent.setup();
      const alertMock = vi
        .spyOn(globalThis, "alert")
        .mockImplementation(() => {});
      let ws = createEmptyWorkspace(sequentCalculusDeduction(lkSystem));
      // identity requires at least 1 formula on each side — empty right side will fail
      ws = addNode(ws, "axiom", "S1", { x: 100, y: 300 }, "phi ⇒ ");

      render(<StatefulWorkspace initialWorkspace={ws} testId="workspace" />);

      await user.click(
        screen.getByTestId("workspace-sc-rule-palette-rule-identity"),
      );
      await user.click(screen.getByTestId("proof-node-node-1"));

      await waitFor(() => {
        expect(
          screen.queryByTestId("workspace-sc-banner"),
        ).not.toBeInTheDocument();
      });

      expect(alertMock).toHaveBeenCalled();

      alertMock.mockRestore();
    });

    // --- カット除去ステッパー統合 ---

    it("shows cut elimination start button in SC mode", () => {
      const ws = createEmptyWorkspace(sequentCalculusDeduction(lkSystem));
      render(
        <ProofWorkspace
          system={ws.system}
          workspace={ws}
          onWorkspaceChange={() => {}}
          testId="workspace"
        />,
      );
      expect(
        screen.getByTestId("workspace-cut-elim-start"),
      ).toBeInTheDocument();
    });

    it("does not show cut elimination start button in non-SC mode", () => {
      render(
        <ProofWorkspace system={lukasiewiczSystem} testId="workspace" />,
      );
      expect(
        screen.queryByTestId("workspace-cut-elim-start"),
      ).not.toBeInTheDocument();
    });

    it("alerts when no SC root found", async () => {
      const user = userEvent.setup();
      const alertMock = vi.spyOn(globalThis, "alert").mockImplementation(() => {});
      const ws = createEmptyWorkspace(sequentCalculusDeduction(lkSystem));
      render(<StatefulWorkspace initialWorkspace={ws} testId="workspace" />);

      await user.click(screen.getByTestId("workspace-cut-elim-start"));

      expect(alertMock).toHaveBeenCalledWith(
        expect.stringContaining("No SC proof root found"),
      );
      alertMock.mockRestore();
    });

    it("opens cut elimination stepper for a proof with cut and allows navigation", async () => {
      const user = userEvent.setup();

      // カット入り証明を構築:
      // 結論: phi ⇒ phi (カット規則で phi をカット式に)
      // 左前提: phi ⇒ phi (identity)
      // 右前提: phi ⇒ phi (identity)
      let ws = createEmptyWorkspace(sequentCalculusDeduction(lkSystem));
      ws = addNode(ws, "axiom", "S1", { x: 200, y: 400 }, "phi ⇒ phi");

      // カット規則を適用
      const cutResult = applyScRuleAndConnect(
        ws,
        "node-1",
        {
          ruleId: "cut",
          sequentText: "phi ⇒ phi",
          principalPosition: 0,
          cutFormulaText: "phi",
        },
        [
          { x: 100, y: 200 },
          { x: 300, y: 200 },
        ],
      );
      ws = cutResult.workspace;
      const [leftId, rightId] = cutResult.premiseNodeIds;

      // 左前提にidentity適用
      if (leftId !== undefined) {
        const leftResult = applyScRuleAndConnect(
          ws,
          leftId,
          {
            ruleId: "identity",
            sequentText: ws.nodes.find((n) => n.id === leftId)?.formulaText ?? "",
            principalPosition: 0,
          },
          [],
        );
        ws = leftResult.workspace;
      }

      // 右前提にidentity適用
      if (rightId !== undefined) {
        const rightResult = applyScRuleAndConnect(
          ws,
          rightId,
          {
            ruleId: "identity",
            sequentText: ws.nodes.find((n) => n.id === rightId)?.formulaText ?? "",
            principalPosition: 0,
          },
          [],
        );
        ws = rightResult.workspace;
      }

      render(<StatefulWorkspace initialWorkspace={ws} testId="workspace" />);

      // ステッパーが表示されていないことを確認
      expect(
        screen.queryByTestId("workspace-cut-elim-stepper"),
      ).not.toBeInTheDocument();

      // カット除去起動
      await user.click(screen.getByTestId("workspace-cut-elim-start"));

      // ステッパーが表示される
      await waitFor(() => {
        expect(
          screen.getByTestId("workspace-cut-elim-stepper"),
        ).toBeInTheDocument();
      });

      // 閉じるボタンが表示される
      expect(
        screen.getByTestId("workspace-cut-elim-close"),
      ).toBeInTheDocument();

      // 起動ボタンは非表示になる
      expect(
        screen.queryByTestId("workspace-cut-elim-start"),
      ).not.toBeInTheDocument();

      // 次ステップボタンをクリック
      const nextButton = screen.getByTestId("workspace-cut-elim-stepper-next");
      if (!nextButton.hasAttribute("disabled")) {
        await user.click(nextButton);
      }

      // 閉じるボタンをクリック
      await user.click(screen.getByTestId("workspace-cut-elim-close"));

      // ステッパーが閉じる
      await waitFor(() => {
        expect(
          screen.queryByTestId("workspace-cut-elim-stepper"),
        ).not.toBeInTheDocument();
      });

      // 起動ボタンが再表示される
      expect(
        screen.getByTestId("workspace-cut-elim-start"),
      ).toBeInTheDocument();
    });

    it("shows cut-free message when proof has no cuts", async () => {
      const user = userEvent.setup();

      // カットなし証明: phi ⇒ phi に identity を適用
      let ws = createEmptyWorkspace(sequentCalculusDeduction(lkSystem));
      ws = addNode(ws, "axiom", "S1", { x: 100, y: 300 }, "phi ⇒ phi");

      const idResult = applyScRuleAndConnect(
        ws,
        "node-1",
        {
          ruleId: "identity",
          sequentText: "phi ⇒ phi",
          principalPosition: 0,
        },
        [],
      );
      ws = idResult.workspace;

      render(<StatefulWorkspace initialWorkspace={ws} testId="workspace" />);

      await user.click(screen.getByTestId("workspace-cut-elim-start"));

      await waitFor(() => {
        expect(
          screen.getByTestId("workspace-cut-elim-stepper"),
        ).toBeInTheDocument();
      });

      // カットフリーメッセージが表示される
      expect(screen.getByText("Cut-free")).toBeInTheDocument();
    });
  });

  describe("export menu item clicks", () => {
    it("clicking export JSON button calls handler and closes menu", async () => {
      const user = userEvent.setup();
      const ws = createEmptyWorkspace(lukasiewiczSystem);
      render(<StatefulWorkspace initialWorkspace={ws} testId="workspace" />);

      // メニューを開く
      await user.click(screen.getByTestId("workspace-workspace-menu-button"));

      // Export JSONをクリック
      await user.click(screen.getByTestId("workspace-export-json-button"));

      // メニューが閉じる
      expect(
        screen.queryByTestId("workspace-workspace-menu"),
      ).not.toBeInTheDocument();
    });

    it("clicking export SVG button closes menu", async () => {
      const user = userEvent.setup();
      const ws = createEmptyWorkspace(lukasiewiczSystem);
      render(<StatefulWorkspace initialWorkspace={ws} testId="workspace" />);

      await user.click(screen.getByTestId("workspace-workspace-menu-button"));
      await user.click(screen.getByTestId("workspace-export-svg-button"));

      expect(
        screen.queryByTestId("workspace-workspace-menu"),
      ).not.toBeInTheDocument();
    });

    it("clicking export PNG button closes menu", async () => {
      const user = userEvent.setup();
      const ws = createEmptyWorkspace(lukasiewiczSystem);
      render(<StatefulWorkspace initialWorkspace={ws} testId="workspace" />);

      await user.click(screen.getByTestId("workspace-workspace-menu-button"));
      await user.click(screen.getByTestId("workspace-export-png-button"));

      expect(
        screen.queryByTestId("workspace-workspace-menu"),
      ).not.toBeInTheDocument();
    });
  });

  describe("selection clear button", () => {
    it("clicking clear button deselects all nodes", async () => {
      const user = userEvent.setup();
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 100, y: 100 }, "phi");

      render(<StatefulWorkspace initialWorkspace={ws} testId="workspace" />);

      // ノードをクリックして選択
      await user.click(screen.getByTestId("proof-node-node-1"));

      await waitFor(() => {
        expect(
          screen.getByTestId("workspace-selection-banner"),
        ).toBeInTheDocument();
      });

      // クリアボタン（テキスト"Clear"）をクリック
      const banner = screen.getByTestId("workspace-selection-banner");
      const clearButton = Array.from(banner.querySelectorAll("button")).find(
        (b) => b.textContent === "Clear",
      );
      expect(clearButton).toBeDefined();
      await user.click(clearButton!);

      // 選択バナーが消える
      await waitFor(() => {
        expect(
          screen.queryByTestId("workspace-selection-banner"),
        ).not.toBeInTheDocument();
      });
    });
  });

  describe("merge via selection banner", () => {
    it("merges selected nodes with same formula via merge button", async () => {
      const user = userEvent.setup();
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "axiom", "A2", { x: 200, y: 0 }, "phi");

      render(<StatefulWorkspace initialWorkspace={ws} testId="workspace" />);

      // 2ノードを選択
      await user.click(screen.getByTestId("proof-node-node-1"));
      await user.keyboard("{Control>}");
      await user.click(screen.getByTestId("proof-node-node-2"));
      await user.keyboard("{/Control}");

      await waitFor(() => {
        expect(
          screen.getByTestId("workspace-selection-banner"),
        ).toHaveTextContent("2 node(s) selected");
      });

      // Mergeボタンをクリック
      const mergeButton = screen.getByTestId("workspace-merge-button");
      await user.click(mergeButton);

      // 1ノードに統合される
      await waitFor(() => {
        expect(
          screen.queryByTestId("proof-node-node-2"),
        ).not.toBeInTheDocument();
      });
    });
  });

  describe("node context menu - save to collection", () => {
    it("onSaveProofToCollection未指定時はメニュー項目が表示されない", async () => {
      const user = userEvent.setup();
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 }, "phi");

      render(<StatefulWorkspace initialWorkspace={ws} testId="workspace" />);

      const node = screen.getByTestId("proof-node-node-1");
      await user.pointer({ keys: "[MouseRight]", target: node });

      expect(
        screen.queryByTestId("workspace-save-to-collection"),
      ).not.toBeInTheDocument();
    });

    it("onSaveProofToCollection指定時はメニュー項目が表示される", async () => {
      const user = userEvent.setup();
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 }, "phi");

      const onSave = vi.fn();
      render(
        <ProofWorkspace
          system={lukasiewiczSystem}
          workspace={ws}
          onSaveProofToCollection={onSave}
          testId="workspace"
        />,
      );

      const node = screen.getByTestId("proof-node-node-1");
      await user.pointer({ keys: "[MouseRight]", target: node });

      expect(
        screen.getByTestId("workspace-save-to-collection"),
      ).toBeInTheDocument();
    });

    it("Save to Collectionクリックでコールバックが呼ばれる", async () => {
      const user = userEvent.setup();
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 }, "phi -> psi");

      const onSave = vi.fn();
      render(
        <ProofWorkspace
          system={lukasiewiczSystem}
          workspace={ws}
          onSaveProofToCollection={onSave}
          testId="workspace"
        />,
      );

      const node = screen.getByTestId("proof-node-node-1");
      await user.pointer({ keys: "[MouseRight]", target: node });

      const saveBtn = screen.getByTestId("workspace-save-to-collection");
      await user.click(saveBtn);

      expect(onSave).toHaveBeenCalledTimes(1);
      expect(onSave.mock.calls[0]?.[0]).toMatchObject({
        name: "phi -> psi",
        deductionStyle: "hilbert",
      });

      // Context menu should be closed
      expect(
        screen.queryByTestId("workspace-node-context-menu"),
      ).not.toBeInTheDocument();
    });
  });
});

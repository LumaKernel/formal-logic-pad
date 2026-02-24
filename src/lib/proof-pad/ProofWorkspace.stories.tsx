/**
 * ProofWorkspace ストーリー。
 *
 * 証明ワークスペース（InfiniteCanvas + 証明ノード）のデモ。
 * 各論理体系での空のワークスペースとノード付きワークスペースを表示。
 * MP適用のインタラクションテスト含む。
 */

import { useState, useCallback } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within, userEvent } from "storybook/test";
import {
  lukasiewiczSystem,
  predicateLogicSystem,
  equalityLogicSystem,
} from "../logic-core/inferenceRule";
import { ProofWorkspace } from "./ProofWorkspace";
import {
  createEmptyWorkspace,
  addNode,
  addConnection,
  applyMPAndConnect,
  updateGoalFormulaText,
} from "./workspaceState";
import type { WorkspaceState } from "./workspaceState";

// --- ステートフルラッパー ---

function LukasiewiczWorkspace() {
  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <ProofWorkspace system={lukasiewiczSystem} testId="workspace" />
    </div>
  );
}

function PredicateLogicWorkspace() {
  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <ProofWorkspace system={predicateLogicSystem} testId="workspace" />
    </div>
  );
}

function EqualityLogicWorkspace() {
  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <ProofWorkspace system={equalityLogicSystem} testId="workspace" />
    </div>
  );
}

function WorkspaceWithNodes() {
  const initial = (() => {
    let ws = createEmptyWorkspace(lukasiewiczSystem);
    ws = addNode(ws, "axiom", "A1 (K)", { x: 50, y: 50 }, "φ → (ψ → φ)");
    ws = addNode(
      ws,
      "axiom",
      "A2 (S)",
      { x: 350, y: 50 },
      "(φ → (ψ → χ)) → ((φ → ψ) → (φ → χ))",
    );
    ws = addNode(ws, "mp", "MP", { x: 200, y: 200 });
    ws = addConnection(ws, "node-1", "out", "node-3", "premise-left");
    ws = addConnection(ws, "node-2", "out", "node-3", "premise-right");
    return ws;
  })();

  const [workspace, setWorkspace] = useState<WorkspaceState>(initial);
  const handleChange = useCallback((ws: WorkspaceState) => {
    setWorkspace(ws);
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <ProofWorkspace
        system={lukasiewiczSystem}
        workspace={workspace}
        onWorkspaceChange={handleChange}
        testId="workspace"
      />
    </div>
  );
}

function WorkspaceWithValidMP() {
  const initial = (() => {
    let ws = createEmptyWorkspace(lukasiewiczSystem);
    ws = addNode(ws, "axiom", "A1", { x: 50, y: 50 }, "phi");
    ws = addNode(ws, "axiom", "A2", { x: 350, y: 50 }, "phi -> psi");
    const result = applyMPAndConnect(ws, "node-1", "node-2", {
      x: 200,
      y: 250,
    });
    return result.workspace;
  })();

  const [workspace, setWorkspace] = useState<WorkspaceState>(initial);
  const handleChange = useCallback((ws: WorkspaceState) => {
    setWorkspace(ws);
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <ProofWorkspace
        system={lukasiewiczSystem}
        workspace={workspace}
        onWorkspaceChange={handleChange}
        testId="workspace"
      />
    </div>
  );
}

function WorkspaceWithInvalidMP() {
  const initial = (() => {
    let ws = createEmptyWorkspace(lukasiewiczSystem);
    ws = addNode(ws, "axiom", "A1", { x: 50, y: 50 }, "phi");
    ws = addNode(ws, "axiom", "A2", { x: 350, y: 50 }, "psi -> chi");
    const result = applyMPAndConnect(ws, "node-1", "node-2", {
      x: 200,
      y: 250,
    });
    return result.workspace;
  })();

  const [workspace, setWorkspace] = useState<WorkspaceState>(initial);
  const handleChange = useCallback((ws: WorkspaceState) => {
    setWorkspace(ws);
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <ProofWorkspace
        system={lukasiewiczSystem}
        workspace={workspace}
        onWorkspaceChange={handleChange}
        testId="workspace"
      />
    </div>
  );
}

// --- Meta ---

const meta = {
  title: "ProofPad/ProofWorkspace",
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** 空のŁukasiewicz体系ワークスペース */
export const EmptyLukasiewicz: Story = {
  render: () => <LukasiewiczWorkspace />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("workspace")).toBeInTheDocument();
    await expect(canvas.getByTestId("workspace-system")).toHaveTextContent(
      "Łukasiewicz",
    );
    await expect(canvas.getByTestId("infinite-canvas")).toBeInTheDocument();
    // Axiom palette should be visible with A1, A2, A3
    await expect(
      canvas.getByTestId("workspace-axiom-palette"),
    ).toBeInTheDocument();
    await expect(
      canvas.getByTestId("workspace-axiom-palette-item-A1"),
    ).toBeInTheDocument();
    // MP button should be visible
    await expect(canvas.getByTestId("workspace-mp-button")).toBeInTheDocument();
  },
};

/** 空の述語論理体系ワークスペース */
export const EmptyPredicateLogic: Story = {
  render: () => <PredicateLogicWorkspace />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("workspace-system")).toHaveTextContent(
      "Predicate Logic",
    );
  },
};

/** 空の等号付き論理体系ワークスペース */
export const EmptyEqualityLogic: Story = {
  render: () => <EqualityLogicWorkspace />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("workspace-system")).toHaveTextContent(
      "Predicate Logic with Equality",
    );
  },
};

/** 公理パレットから公理を追加するインタラクション */
export const AddAxiomFromPalette: Story = {
  render: () => <LukasiewiczWorkspace />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Palette should be visible
    await expect(
      canvas.getByTestId("workspace-axiom-palette"),
    ).toBeInTheDocument();

    // Click A1 to add axiom node
    const a1Item = canvas.getByTestId("workspace-axiom-palette-item-A1");
    await userEvent.click(a1Item);

    // Node should appear on canvas
    await expect(canvas.getByTestId("proof-node-node-1")).toBeInTheDocument();

    // Click A2 to add another axiom node
    const a2Item = canvas.getByTestId("workspace-axiom-palette-item-A2");
    await userEvent.click(a2Item);

    // Second node should also appear
    await expect(canvas.getByTestId("proof-node-node-2")).toBeInTheDocument();
  },
};

/** ノードと接続線付きのワークスペース */
export const WithNodes: Story = {
  render: () => <WorkspaceWithNodes />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("workspace")).toBeInTheDocument();
    await expect(canvas.getByTestId("proof-node-node-1")).toBeInTheDocument();
    await expect(canvas.getByTestId("proof-node-node-2")).toBeInTheDocument();
    await expect(canvas.getByTestId("proof-node-node-3")).toBeInTheDocument();
  },
};

/** 有効なMP適用（φとφ→ψからψを導出） */
export const ValidMPApplication: Story = {
  render: () => <WorkspaceWithValidMP />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("workspace")).toBeInTheDocument();
    // Axiom nodes
    await expect(canvas.getByTestId("proof-node-node-1")).toBeInTheDocument();
    await expect(canvas.getByTestId("proof-node-node-2")).toBeInTheDocument();
    // MP node with success status
    await expect(canvas.getByTestId("proof-node-node-3")).toBeInTheDocument();
    await expect(
      canvas.getByTestId("proof-node-node-3-status"),
    ).toHaveTextContent("MP applied");
  },
};

/** 無効なMP適用（前提不一致） */
export const InvalidMPApplication: Story = {
  render: () => <WorkspaceWithInvalidMP />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("workspace")).toBeInTheDocument();
    // MP node with error status
    await expect(canvas.getByTestId("proof-node-node-3")).toBeInTheDocument();
    await expect(
      canvas.getByTestId("proof-node-node-3-status"),
    ).toHaveTextContent("Left premise does not match");
  },
};

/** MP選択モードのインタラクション */
export const MPSelectionFlow: Story = {
  render: () => <LukasiewiczWorkspace />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Add two axioms
    await userEvent.click(
      canvas.getByTestId("workspace-axiom-palette-item-A1"),
    );
    await userEvent.click(
      canvas.getByTestId("workspace-axiom-palette-item-A2"),
    );

    // Both nodes should be on canvas
    await expect(canvas.getByTestId("proof-node-node-1")).toBeInTheDocument();
    await expect(canvas.getByTestId("proof-node-node-2")).toBeInTheDocument();

    // Start MP selection
    await userEvent.click(canvas.getByTestId("workspace-mp-button"));
    await expect(canvas.getByTestId("workspace-mp-banner")).toHaveTextContent(
      "Click the left premise",
    );

    // Select left premise
    await userEvent.click(canvas.getByTestId("proof-node-node-1"));
    await expect(canvas.getByTestId("workspace-mp-banner")).toHaveTextContent(
      "Click the right premise",
    );

    // Select right premise
    await userEvent.click(canvas.getByTestId("proof-node-node-2"));

    // MP node should be created
    await expect(canvas.getByTestId("proof-node-node-3")).toBeInTheDocument();
  },
};

// --- ゴール設定・証明完了デモ ---

function WorkspaceWithGoalAchieved() {
  const initial = (() => {
    let ws = createEmptyWorkspace(lukasiewiczSystem);
    ws = addNode(ws, "axiom", "A1", { x: 50, y: 50 }, "phi");
    ws = addNode(ws, "axiom", "A2", { x: 350, y: 50 }, "phi -> psi");
    const result = applyMPAndConnect(ws, "node-1", "node-2", {
      x: 200,
      y: 250,
    });
    ws = updateGoalFormulaText(result.workspace, "psi");
    return ws;
  })();

  const [workspace, setWorkspace] = useState<WorkspaceState>(initial);
  const handleChange = useCallback((ws: WorkspaceState) => {
    setWorkspace(ws);
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <ProofWorkspace
        system={lukasiewiczSystem}
        workspace={workspace}
        onWorkspaceChange={handleChange}
        testId="workspace"
      />
    </div>
  );
}

function WorkspaceWithGoalNotAchieved() {
  const initial = (() => {
    let ws = createEmptyWorkspace(lukasiewiczSystem);
    ws = addNode(ws, "axiom", "A1", { x: 50, y: 50 }, "phi");
    ws = updateGoalFormulaText(ws, "phi -> phi");
    return ws;
  })();

  const [workspace, setWorkspace] = useState<WorkspaceState>(initial);
  const handleChange = useCallback((ws: WorkspaceState) => {
    setWorkspace(ws);
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <ProofWorkspace
        system={lukasiewiczSystem}
        workspace={workspace}
        onWorkspaceChange={handleChange}
        testId="workspace"
      />
    </div>
  );
}

/** ゴール達成: MP適用でψを導出し、ゴール "psi" を達成 */
export const GoalAchieved: Story = {
  render: () => <WorkspaceWithGoalAchieved />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("workspace")).toBeInTheDocument();
    // Goal input should have "psi"
    await expect(canvas.getByTestId("workspace-goal-input")).toHaveValue("psi");
    // Should show achieved
    await expect(
      canvas.getByTestId("workspace-goal-achieved"),
    ).toBeInTheDocument();
    // Should show proof complete banner
    await expect(
      canvas.getByTestId("workspace-proof-complete-banner"),
    ).toBeInTheDocument();
  },
};

/** ゴール未達成: φのみ存在し、ゴール "phi -> phi" は未達成 */
export const GoalNotAchieved: Story = {
  render: () => <WorkspaceWithGoalNotAchieved />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("workspace")).toBeInTheDocument();
    // Goal input should have "phi -> phi"
    await expect(canvas.getByTestId("workspace-goal-input")).toHaveValue(
      "phi -> phi",
    );
    // Should show not achieved
    await expect(
      canvas.getByTestId("workspace-goal-not-achieved"),
    ).toBeInTheDocument();
    // Should NOT show proof complete banner
    await expect(
      canvas.queryByTestId("workspace-proof-complete-banner"),
    ).not.toBeInTheDocument();
  },
};

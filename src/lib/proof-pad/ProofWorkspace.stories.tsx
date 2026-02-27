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
import { allReferenceEntries } from "../reference/referenceContent";
import { ProofWorkspace } from "./ProofWorkspace";
import {
  createEmptyWorkspace,
  createQuestWorkspace,
  addNode,
  addConnection,
  applyMPAndConnect,
  updateNodeRole,
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
    ws = addNode(result.workspace, "axiom", "Goal", { x: 400, y: 250 }, "psi");
    ws = updateNodeRole(ws, "node-4", "goal");
    // MP結果ノードからゴールノードへ接続して達成
    ws = addConnection(ws, "node-3", "output", "node-4", "input");
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
    ws = addNode(ws, "axiom", "Goal", { x: 300, y: 0 }, "phi -> phi");
    ws = updateNodeRole(ws, "node-2", "goal");
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
    // Should NOT show proof complete banner
    await expect(
      canvas.queryByTestId("workspace-proof-complete-banner"),
    ).not.toBeInTheDocument();
  },
};

// --- クエストモードデモ ---

function QuestModeWorkspace() {
  const initial = createQuestWorkspace(lukasiewiczSystem, [
    {
      formulaText: "phi -> (psi -> phi)",
      label: "Quest: K axiom",
      position: { x: 100, y: 300 },
    },
    {
      formulaText: "phi -> phi",
      label: "Quest: Identity",
      position: { x: 400, y: 300 },
    },
  ]);

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

/** クエストモード: 保護されたゴールノード付きワークスペース */
export const QuestMode: Story = {
  render: () => <QuestModeWorkspace />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("workspace")).toBeInTheDocument();
    // Quest badge in header
    await expect(
      canvas.getByTestId("workspace-quest-badge"),
    ).toBeInTheDocument();
    // Convert to Free button
    await expect(
      canvas.getByTestId("workspace-convert-free-button"),
    ).toBeInTheDocument();
    // Quest goal nodes with QUEST badge
    await expect(
      canvas.getByTestId("proof-node-node-1-protected-badge"),
    ).toHaveTextContent("QUEST");
    await expect(
      canvas.getByTestId("proof-node-node-2-protected-badge"),
    ).toHaveTextContent("QUEST");
  },
};

// --- サブツリー選択デモ ---

function SubtreeSelectionWorkspace() {
  const initial = (() => {
    let ws = createEmptyWorkspace(lukasiewiczSystem);
    // 2段のMPチェーン: axiom-1,axiom-2 → mp-1, axiom-3 → mp-2
    ws = addNode(ws, "axiom", "A1", { x: 50, y: 50 }, "phi");
    ws = addNode(ws, "axiom", "A2", { x: 350, y: 50 }, "phi -> psi");
    const mp1 = applyMPAndConnect(ws, "node-1", "node-2", {
      x: 200,
      y: 200,
    });
    ws = mp1.workspace;
    ws = addNode(ws, "axiom", "A3", { x: 500, y: 200 }, "psi -> chi");
    const mp2 = applyMPAndConnect(ws, "node-3", "node-4", {
      x: 350,
      y: 350,
    });
    ws = mp2.workspace;
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

// --- リファレンスポップオーバー統合デモ ---

function WorkspaceWithReference() {
  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <ProofWorkspace
        system={lukasiewiczSystem}
        referenceEntries={allReferenceEntries}
        locale="ja"
        testId="workspace"
      />
    </div>
  );
}

/** 公理パレットにリファレンスポップオーバー(?)付き */
export const WithReferencePopover: Story = {
  render: () => <WorkspaceWithReference />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("workspace")).toBeInTheDocument();
    // Reference (?) buttons should be visible on each axiom
    await expect(
      canvas.getByTestId("workspace-axiom-palette-item-A1-ref-trigger"),
    ).toBeInTheDocument();
    await expect(
      canvas.getByTestId("workspace-axiom-palette-item-A2-ref-trigger"),
    ).toBeInTheDocument();
    await expect(
      canvas.getByTestId("workspace-axiom-palette-item-A3-ref-trigger"),
    ).toBeInTheDocument();

    // MP reference (?) should be visible
    await expect(
      canvas.getByTestId("workspace-mp-ref-trigger"),
    ).toBeInTheDocument();

    // Click MP (?) to open popover
    await userEvent.click(canvas.getByTestId("workspace-mp-ref-trigger"));
    // Popover should be visible
    await expect(
      canvas.getByTestId("workspace-mp-ref-popover"),
    ).toBeInTheDocument();
  },
};

// --- 述語論理体系でのリファレンスポップオーバー（MP+Gen） ---

function WorkspaceWithPredicateReference() {
  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <ProofWorkspace
        system={predicateLogicSystem}
        referenceEntries={allReferenceEntries}
        locale="ja"
        testId="workspace"
      />
    </div>
  );
}

/** 述語論理体系でMP+Gen両方のリファレンスポップオーバー(?)付き */
export const WithPredicateReferencePopover: Story = {
  render: () => <WorkspaceWithPredicateReference />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("workspace")).toBeInTheDocument();

    // MP reference (?) should be visible
    await expect(
      canvas.getByTestId("workspace-mp-ref-trigger"),
    ).toBeInTheDocument();

    // Gen reference (?) should be visible
    await expect(
      canvas.getByTestId("workspace-gen-ref-trigger"),
    ).toBeInTheDocument();

    // Click Gen (?) to open popover
    await userEvent.click(canvas.getByTestId("workspace-gen-ref-trigger"));
    // Popover should be visible
    await expect(
      canvas.getByTestId("workspace-gen-ref-popover"),
    ).toBeInTheDocument();
  },
};

/** サブツリー選択: 右クリック→Select Subtreeでサブツリーを一括選択 */
export const SubtreeSelection: Story = {
  render: () => <SubtreeSelectionWorkspace />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("workspace")).toBeInTheDocument();

    // ノードが表示されている
    await expect(canvas.getByTestId("proof-node-node-1")).toBeInTheDocument();
    await expect(canvas.getByTestId("proof-node-node-5")).toBeInTheDocument();

    // node-1を右クリック → コンテキストメニュー表示
    const node1 = canvas.getByTestId("proof-node-node-1");
    await userEvent.pointer({ keys: "[MouseRight]", target: node1 });

    // Select Subtreeメニュー項目が表示される
    await expect(
      canvas.getByTestId("workspace-select-subtree"),
    ).toBeInTheDocument();

    // Select Subtreeをクリック
    await userEvent.click(canvas.getByTestId("workspace-select-subtree"));

    // node-1からの子孫: node-1 → node-3 → node-5 = 3ノード
    await expect(
      canvas.getByTestId("workspace-selection-banner"),
    ).toHaveTextContent("3 node(s) selected");
  },
};

// --- ノード削除デモ ---

function NodeDeleteWorkspace() {
  const initial = (() => {
    let ws = createEmptyWorkspace(lukasiewiczSystem);
    ws = addNode(ws, "axiom", "A1", { x: 50, y: 50 }, "phi");
    ws = addNode(ws, "axiom", "A2", { x: 350, y: 50 }, "phi -> psi");
    const mp1 = applyMPAndConnect(ws, "node-1", "node-2", {
      x: 200,
      y: 200,
    });
    ws = mp1.workspace;
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

/** ノード削除: 右クリック→Delete Nodeでノードを削除 */
export const NodeDelete: Story = {
  render: () => <NodeDeleteWorkspace />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("workspace")).toBeInTheDocument();

    // 3ノード(A1, A2, MP)が表示されている
    await expect(canvas.getByTestId("proof-node-node-1")).toBeInTheDocument();
    await expect(canvas.getByTestId("proof-node-node-2")).toBeInTheDocument();
    await expect(canvas.getByTestId("proof-node-node-3")).toBeInTheDocument();

    // node-1を右クリック → コンテキストメニュー表示
    const node1 = canvas.getByTestId("proof-node-node-1");
    await userEvent.pointer({ keys: "[MouseRight]", target: node1 });

    // Delete Nodeメニュー項目が表示される
    await expect(
      canvas.getByTestId("workspace-delete-node"),
    ).toBeInTheDocument();

    // Delete Nodeをクリック
    await userEvent.click(canvas.getByTestId("workspace-delete-node"));

    // node-1が削除される
    await expect(
      canvas.queryByTestId("proof-node-node-1"),
    ).not.toBeInTheDocument();

    // node-2とnode-3は残る
    await expect(canvas.getByTestId("proof-node-node-2")).toBeInTheDocument();
    await expect(canvas.getByTestId("proof-node-node-3")).toBeInTheDocument();
  },
};

// --- クエストモードでゴールノード削除不可デモ ---

function QuestNodeDeleteWorkspace() {
  const initial = (() => {
    let ws = createQuestWorkspace(lukasiewiczSystem, [
      { formulaText: "phi -> phi", position: { x: 200, y: 200 } },
    ]);
    ws = addNode(ws, "axiom", "A1", { x: 50, y: 50 }, "phi -> phi");
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

/** クエストモード: ゴールノードはDelete Nodeが無効化される */
export const QuestGoalDeleteDisabled: Story = {
  render: () => <QuestNodeDeleteWorkspace />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("workspace")).toBeInTheDocument();

    // ゴールノード(node-1)を右クリック
    const goalNode = canvas.getByTestId("proof-node-node-1");
    await userEvent.pointer({ keys: "[MouseRight]", target: goalNode });

    // Delete Nodeが無効化されている
    const deleteBtn = canvas.getByTestId("workspace-delete-node");
    await expect(deleteBtn).toBeDisabled();

    // 通常ノード(node-2)を右クリックすると削除可能
    await userEvent.click(document.body); // メニューを閉じる
    const normalNode = canvas.getByTestId("proof-node-node-2");
    await userEvent.pointer({ keys: "[MouseRight]", target: normalNode });

    const deleteBtn2 = canvas.getByTestId("workspace-delete-node");
    await expect(deleteBtn2).not.toBeDisabled();
  },
};

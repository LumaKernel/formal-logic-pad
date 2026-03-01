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
import {
  naturalDeduction,
  njSystem,
  tableauCalculusDeduction,
  tabSystem,
  analyticTableauDeduction,
  atSystem,
} from "../logic-core/deductionSystem";
import { allReferenceEntries } from "../reference/referenceContent";
import { ProofWorkspace } from "./ProofWorkspace";
import {
  createEmptyWorkspace,
  createQuestWorkspace,
  addNode,
  addConnection,
  addGoal,
  applyMPAndConnect,
  applySubstitutionAndConnect,
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
    ws = addNode(ws, "axiom", "Axiom", { x: 50, y: 50 }, "φ → (ψ → φ)");
    ws = addNode(
      ws,
      "axiom",
      "Axiom",
      { x: 350, y: 50 },
      "(φ → (ψ → χ)) → ((φ → ψ) → (φ → χ))",
    );
    ws = addNode(ws, "axiom", "MP", { x: 200, y: 200 });
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
    ws = addNode(ws, "axiom", "Axiom", { x: 50, y: 50 }, "phi");
    ws = addNode(ws, "axiom", "Axiom", { x: 350, y: 50 }, "phi -> psi");
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
    ws = addNode(ws, "axiom", "Axiom", { x: 50, y: 50 }, "phi");
    ws = addNode(ws, "axiom", "Axiom", { x: 350, y: 50 }, "psi -> chi");
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
    ws = addNode(ws, "axiom", "Axiom", { x: 50, y: 50 }, "phi");
    ws = addNode(ws, "axiom", "Axiom", { x: 350, y: 50 }, "phi -> psi");
    const result = applyMPAndConnect(ws, "node-1", "node-2", {
      x: 200,
      y: 250,
    });
    ws = addGoal(result.workspace, "psi");
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
    ws = addNode(ws, "axiom", "Axiom", { x: 50, y: 50 }, "phi");
    ws = addGoal(ws, "phi -> phi");
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
    },
    {
      formulaText: "phi -> phi",
      label: "Quest: Identity",
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

/** クエストモード: ゴールはWorkspaceState.goalsで管理（ノードとしてキャンバスには配置しない） */
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
    // ゴールはノードとしてキャンバスに配置されないため、
    // proof-node は存在しない（キャンバスは空）
    await expect(
      canvas.queryByTestId("proof-node-node-1"),
    ).not.toBeInTheDocument();
  },
};

// --- サブツリー選択デモ ---

function SubtreeSelectionWorkspace() {
  const initial = (() => {
    let ws = createEmptyWorkspace(lukasiewiczSystem);
    // 2段のMPチェーン: axiom-1,axiom-2 → mp-1, axiom-3 → mp-2
    ws = addNode(ws, "axiom", "Axiom", { x: 50, y: 50 }, "phi");
    ws = addNode(ws, "axiom", "Axiom", { x: 350, y: 50 }, "phi -> psi");
    const mp1 = applyMPAndConnect(ws, "node-1", "node-2", {
      x: 200,
      y: 200,
    });
    ws = mp1.workspace;
    ws = addNode(ws, "axiom", "Axiom", { x: 500, y: 200 }, "psi -> chi");
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
    ws = addNode(ws, "axiom", "Axiom", { x: 50, y: 50 }, "phi");
    ws = addNode(ws, "axiom", "Axiom", { x: 350, y: 50 }, "phi -> psi");
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

// --- クエストモードでノード削除デモ ---

function QuestNodeDeleteWorkspace() {
  const initial = (() => {
    let ws = createQuestWorkspace(lukasiewiczSystem, [
      { formulaText: "phi -> phi" },
    ]);
    ws = addNode(ws, "axiom", "Axiom", { x: 50, y: 50 }, "phi -> phi");
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

/** クエストモード: ゴールはノードではないため、公理ノードは通常通り削除可能 */
export const QuestGoalDeleteDisabled: Story = {
  render: () => <QuestNodeDeleteWorkspace />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("workspace")).toBeInTheDocument();

    // クエストモードのバッジが表示されている
    await expect(
      canvas.getByTestId("workspace-quest-badge"),
    ).toBeInTheDocument();

    // 公理ノード(node-1)が存在する（ゴールはノードとしては存在しない）
    const axiomNode = canvas.getByTestId("proof-node-node-1");
    await expect(axiomNode).toBeInTheDocument();

    // node-1を右クリック → 削除可能（ゴールがノードから分離されたため保護なし）
    await userEvent.pointer({ keys: "[MouseRight]", target: axiomNode });

    const deleteBtn = canvas.getByTestId("workspace-delete-node");
    await expect(deleteBtn).not.toBeDisabled();
  },
};

// --- 公理自動判別デモ ---

function AxiomAutoIdentifyWorkspace() {
  const initial = (() => {
    // 空の公理ノードを1つ配置（formulaText: ""）
    let ws = createEmptyWorkspace(lukasiewiczSystem);
    ws = addNode(ws, "axiom", "", { x: 200, y: 150 });
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

/**
 * 公理自動判別: 空ノードにwell-known公理の式を入力すると自動判別バッジが表示される。
 *
 * 空の公理ノードをクリックして A1 (K公理) の式 `phi -> (psi -> phi)` を入力し、
 * 編集を確定すると「A1 (K)」のaxiomNameバッジが自動的に表示されることを検証。
 */
export const AxiomAutoIdentifyFromBlank: Story = {
  render: () => <AxiomAutoIdentifyWorkspace />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("workspace")).toBeInTheDocument();

    // 空の公理ノードが表示されている
    await expect(canvas.getByTestId("proof-node-node-1")).toBeInTheDocument();

    // 初期状態: axiomNameバッジは表示されない（空の式では判別不能）
    await expect(
      canvas.queryByTestId("proof-node-node-1-axiom-name"),
    ).not.toBeInTheDocument();

    // ノードをダブルクリックして編集モードに入る（editTrigger="dblclick"）
    const display = canvas.getByTestId("proof-node-node-1-editor-display");
    await userEvent.dblClick(display);

    // A1 (K公理) の式を入力: φ → (ψ → φ)
    const input = canvas.getByTestId("proof-node-node-1-editor-input-input");
    await userEvent.type(input, "phi -> (psi -> phi)");

    // 編集確定（tabでblur）
    await userEvent.tab();

    // 自動判別: A1 (K) バッジが表示される
    await expect(
      canvas.getByTestId("proof-node-node-1-axiom-name"),
    ).toHaveTextContent("A1 (K)");
  },
};

function AxiomReidentifyWorkspace() {
  const initial = (() => {
    // A1 (K公理) の式が入った公理ノードを配置
    let ws = createEmptyWorkspace(lukasiewiczSystem);
    ws = addNode(ws, "axiom", "", { x: 200, y: 150 }, "phi -> (psi -> phi)");
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

/**
 * 公理再判別: 既存の公理を別のwell-known公理に書き換えると、判別結果も自動更新される。
 *
 * A1 (K公理) の式を A2 (S公理) の式に書き換え、
 * axiomNameバッジが「A1 (K)」から「A2 (S)」に自動更新されることを検証。
 * IDではなく式の形で判別する仕組みの一貫性を確認する。
 */
export const AxiomReidentifyOnEdit: Story = {
  render: () => <AxiomReidentifyWorkspace />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("workspace")).toBeInTheDocument();

    // 初期状態: A1 (K) として判別されている
    await expect(
      canvas.getByTestId("proof-node-node-1-axiom-name"),
    ).toHaveTextContent("A1 (K)");

    // ノードをダブルクリックして編集モードに入る（editTrigger="dblclick"）
    const display = canvas.getByTestId("proof-node-node-1-editor-display");
    await userEvent.dblClick(display);

    // 式をA2 (S公理) に書き換え
    const input = canvas.getByTestId("proof-node-node-1-editor-input-input");
    await userEvent.clear(input);
    await userEvent.type(
      input,
      "(phi -> (psi -> chi)) -> ((phi -> psi) -> (phi -> chi))",
    );

    // 編集確定（tabでblur）
    await userEvent.tab();

    // 自動再判別: A2 (S) バッジに更新される
    await expect(
      canvas.getByTestId("proof-node-node-1-axiom-name"),
    ).toHaveTextContent("A2 (S)");
  },
};

// --- 接続削除デモ ---

function ConnectionDeleteWorkspace() {
  const initial = (() => {
    let ws = createEmptyWorkspace(lukasiewiczSystem);
    ws = addNode(ws, "axiom", "Axiom", { x: 50, y: 50 }, "phi");
    ws = addNode(ws, "axiom", "Axiom", { x: 350, y: 50 }, "phi -> psi");
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

/** 接続削除: 接続線を右クリック→Delete Connectionで接続を削除 */
export const ConnectionDelete: Story = {
  render: () => <ConnectionDeleteWorkspace />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("workspace")).toBeInTheDocument();

    // 3ノード(A1, A2, MP)と2接続が表示されている
    await expect(canvas.getByTestId("proof-node-node-1")).toBeInTheDocument();
    await expect(canvas.getByTestId("proof-node-node-2")).toBeInTheDocument();
    await expect(canvas.getByTestId("proof-node-node-3")).toBeInTheDocument();

    // 接続線の hit area を見つけて右クリック
    const connectionSvg = canvas.getByTestId(
      "workspace-connection-conn-node-1-out-node-3-premise-left",
    );
    const hitArea = connectionSvg.querySelector(
      '[data-testid="port-connection-hit-area"]',
    );
    await expect(hitArea).toBeTruthy();

    await userEvent.pointer({
      keys: "[MouseRight]",
      target: hitArea!,
    });

    // 接続線コンテキストメニューが表示される
    await expect(
      canvas.getByTestId("workspace-line-context-menu"),
    ).toBeInTheDocument();

    // Delete Connectionメニュー項目が表示される
    await expect(
      canvas.getByTestId("workspace-delete-connection"),
    ).toBeInTheDocument();

    // Delete Connectionをクリック
    await userEvent.click(canvas.getByTestId("workspace-delete-connection"));

    // 接続線が削除される（SVG要素が消える）
    await expect(
      canvas.queryByTestId(
        "workspace-connection-conn-node-1-out-node-3-premise-left",
      ),
    ).not.toBeInTheDocument();

    // ノードは残る
    await expect(canvas.getByTestId("proof-node-node-1")).toBeInTheDocument();
    await expect(canvas.getByTestId("proof-node-node-2")).toBeInTheDocument();
    await expect(canvas.getByTestId("proof-node-node-3")).toBeInTheDocument();
  },
};

// --- ノード複製デモ ---

function NodeDuplicateWorkspace() {
  const initial = (() => {
    let ws = createEmptyWorkspace(lukasiewiczSystem);
    ws = addNode(
      ws,
      "axiom",
      "Axiom",
      { x: 100, y: 100 },
      "phi -> (psi -> phi)",
    );
    ws = addGoal(ws, "phi -> phi");
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

/** ノード複製: 右クリック→Duplicate Nodeでノードを複製 */
export const NodeDuplicate: Story = {
  render: () => <NodeDuplicateWorkspace />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("workspace")).toBeInTheDocument();

    // 1ノード(A1)のみ表示されている（ゴールはノードではない）
    await expect(canvas.getByTestId("proof-node-node-1")).toBeInTheDocument();

    // node-1（公理）を右クリック → コンテキストメニュー表示
    const node1 = canvas.getByTestId("proof-node-node-1");
    await userEvent.pointer({ keys: "[MouseRight]", target: node1 });

    // Duplicate Nodeメニュー項目が表示される
    await expect(
      canvas.getByTestId("workspace-duplicate-node"),
    ).toBeInTheDocument();

    // Duplicate Nodeをクリック
    await userEvent.click(canvas.getByTestId("workspace-duplicate-node"));

    // 複製されたノード(node-2)が表示される
    await expect(canvas.getByTestId("proof-node-node-2")).toBeInTheDocument();

    // 元のノードも残っている
    await expect(canvas.getByTestId("proof-node-node-1")).toBeInTheDocument();
  },
};

// --- Marquee Selection ---

function MarqueeSelectionWorkspace() {
  const initial = (() => {
    let ws = createEmptyWorkspace(lukasiewiczSystem);
    ws = addNode(ws, "axiom", "Axiom", { x: 50, y: 50 }, "φ → (ψ → φ)");
    ws = addNode(ws, "axiom", "Axiom", { x: 250, y: 50 }, "ψ → φ");
    ws = addNode(ws, "axiom", "Axiom", { x: 450, y: 50 }, "χ → ψ");
    ws = addNode(ws, "axiom", "Axiom", { x: 50, y: 250 }, "φ → χ");
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

/** マーキー矩形選択: 空白部分をドラッグして矩形範囲内のノードを選択。スペースキー押下中はパンモード */
export const MarqueeSelection: Story = {
  render: () => <MarqueeSelectionWorkspace />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("workspace")).toBeInTheDocument();

    // 4ノードが表示されている
    await expect(canvas.getByTestId("proof-node-node-1")).toBeInTheDocument();
    await expect(canvas.getByTestId("proof-node-node-2")).toBeInTheDocument();
    await expect(canvas.getByTestId("proof-node-node-3")).toBeInTheDocument();
    await expect(canvas.getByTestId("proof-node-node-4")).toBeInTheDocument();

    // 選択バナーは表示されていない
    const bannerQuery = canvasElement.querySelector(
      "[data-testid='workspace-selection-banner']",
    );
    expect(bannerQuery).toBeNull();
  },
};

// --- 代入操作（Substitution Application）---

function SubstitutionAppliedWorkspace() {
  const initial = (() => {
    let ws = createEmptyWorkspace(lukasiewiczSystem);

    // 公理 A1: φ → (ψ → φ)
    ws = addNode(
      ws,
      "axiom",
      "Axiom",
      { x: 200, y: 50 },
      "phi -> (psi -> phi)",
    );

    // 代入操作: φ := α → β, ψ := γ
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
      { x: 200, y: 250 },
    );
    ws = result.workspace;

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

export const SubstitutionApplied: Story = {
  render: () => <SubstitutionAppliedWorkspace />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("workspace")).toBeInTheDocument();

    // 公理A1ノードが表示
    await expect(canvas.getByTestId("proof-node-node-1")).toBeInTheDocument();
    // 代入ノードが表示
    await expect(canvas.getByTestId("proof-node-node-2")).toBeInTheDocument();

    // 代入ノードの結論式が表示されている
    const substNode = canvas.getByTestId("proof-node-node-2");
    await expect(substNode).toHaveTextContent("Substitution applied");

    // 代入エントリが表示されている
    const substEntries = canvas.getByTestId("proof-node-node-2-subst-entries");
    await expect(substEntries).toBeInTheDocument();
    await expect(substEntries).toHaveTextContent("φ := alpha -> beta");
    await expect(substEntries).toHaveTextContent("ψ := gamma");
  },
};

// --- 代入操作のコンテキストメニュー経由テスト ---

export const SubstitutionContextMenu: Story = {
  render: () => {
    const [workspace, setWorkspace] = useState<WorkspaceState>(() => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(
        ws,
        "axiom",
        "Axiom",
        { x: 200, y: 100 },
        "phi -> (psi -> phi)",
      );
      return ws;
    });
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
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("workspace")).toBeInTheDocument();

    // ノードを右クリック
    const node = canvas.getByTestId("proof-node-node-1");
    await userEvent.pointer({ keys: "[MouseRight]", target: node });

    // コンテキストメニューに「Apply Substitution」があること
    const menuItem = await canvas.findByTestId(
      "workspace-apply-substitution-to-node",
    );
    await expect(menuItem).toBeInTheDocument();
    await expect(menuItem).toHaveTextContent("Apply Substitution");

    // クリックしてプロンプトバナーが表示
    await userEvent.click(menuItem);
    const banner = await canvas.findByTestId("workspace-subst-prompt-banner");
    await expect(banner).toBeInTheDocument();

    // メタ変数は自動抽出され読み取り専用で表示される
    const metaVarLabel = canvas.getByTestId("workspace-subst-metavar-0");
    await expect(metaVarLabel).toHaveTextContent("φ");

    // 値を入力
    const valueInput = canvas.getByTestId("workspace-subst-value-0");
    await userEvent.type(valueInput, "alpha");

    // 確定ボタンをクリック
    const confirmBtn = canvas.getByTestId("workspace-subst-prompt-confirm");
    await userEvent.click(confirmBtn);

    // 代入ノードが作成されている
    await expect(canvas.getByTestId("proof-node-node-2")).toBeInTheDocument();
  },
};

// --- 自然演繹デモ ---

function NdWorkspace() {
  const initial = createEmptyWorkspace(naturalDeduction(njSystem));
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

/** 自然演繹(NJ)の空ワークスペース - NDルールパレット表示 */
export const EmptyNaturalDeduction: Story = {
  render: () => <NdWorkspace />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("workspace")).toBeInTheDocument();
    await expect(canvas.getByTestId("workspace-system")).toHaveTextContent(
      "Natural Deduction NJ",
    );
    // ND rule palette should be visible (not axiom palette)
    await expect(
      canvas.getByTestId("workspace-nd-rule-palette"),
    ).toBeInTheDocument();
    await expect(
      canvas.queryByTestId("workspace-axiom-palette"),
    ).not.toBeInTheDocument();
    // "仮定を追加" button should exist
    await expect(
      canvas.getByTestId("workspace-nd-rule-palette-add-assumption"),
    ).toBeInTheDocument();
    // Add assumption
    await userEvent.click(
      canvas.getByTestId("workspace-nd-rule-palette-add-assumption"),
    );
    // Node should appear
    await expect(canvas.getByTestId("proof-node-node-1")).toBeInTheDocument();
  },
};

// --- TAB（タブロー式シーケント計算）ストーリー ---

function TableauWorkspace() {
  const initial = createEmptyWorkspace(tableauCalculusDeduction(tabSystem));
  const [workspace, setWorkspace] = useState<WorkspaceState>(initial);
  const handleChange = useCallback((ws: WorkspaceState) => {
    setWorkspace(ws);
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <ProofWorkspace
        system={workspace.system}
        workspace={workspace}
        onWorkspaceChange={handleChange}
        testId="workspace"
      />
    </div>
  );
}

export const EmptyTableau: StoryObj<typeof meta> = {
  render: () => <TableauWorkspace />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // TABパレットが表示される
    await expect(
      canvas.getByTestId("workspace-tab-rule-palette"),
    ).toBeInTheDocument();
    await expect(canvas.getByText("Tableau Calculus")).toBeInTheDocument();

    // TAB規則が表示される
    await expect(canvas.getByText("BS")).toBeInTheDocument();
    await expect(canvas.getByText("¬¬")).toBeInTheDocument();
    await expect(canvas.getByText("∧")).toBeInTheDocument();
    await expect(canvas.getByText("¬∧")).toBeInTheDocument();
    await expect(canvas.getByText("∨")).toBeInTheDocument();
    await expect(canvas.getByText("→")).toBeInTheDocument();

    // 分岐バッジが表示される
    const negConjRule = canvas.getByTestId(
      "workspace-tab-rule-palette-rule-neg-conjunction",
    );
    await expect(negConjRule.textContent).toContain("分岐");

    // Hilbertパレット・NDパレットは非表示
    await expect(
      canvas.queryByTestId("workspace-axiom-palette"),
    ).not.toBeInTheDocument();
    await expect(
      canvas.queryByTestId("workspace-nd-rule-palette"),
    ).not.toBeInTheDocument();

    // シーケント追加
    await userEvent.click(
      canvas.getByTestId("workspace-tab-rule-palette-add-sequent"),
    );
    await expect(canvas.getByTestId("proof-node-node-1")).toBeInTheDocument();
  },
};

// --- AT（分析的タブロー）ストーリー ---

function AnalyticTableauWorkspace() {
  const initial = createEmptyWorkspace(analyticTableauDeduction(atSystem));
  const [workspace, setWorkspace] = useState<WorkspaceState>(initial);
  const handleChange = useCallback((ws: WorkspaceState) => {
    setWorkspace(ws);
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <ProofWorkspace
        system={workspace.system}
        workspace={workspace}
        onWorkspaceChange={handleChange}
        testId="workspace"
      />
    </div>
  );
}

export const EmptyAnalyticTableau: StoryObj<typeof meta> = {
  render: () => <AnalyticTableauWorkspace />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // ATパレットが表示される
    await expect(
      canvas.getByTestId("workspace-at-rule-palette"),
    ).toBeInTheDocument();
    // ヘッダーとパレット両方に "Analytic Tableau" テキストがあるため getAllByText を使う
    const atTexts = canvas.getAllByText("Analytic Tableau");
    await expect(atTexts.length).toBeGreaterThanOrEqual(2);

    // AT規則が表示される
    await expect(canvas.getByText("T(∧)")).toBeInTheDocument();
    await expect(canvas.getByText("F(∨)")).toBeInTheDocument();
    await expect(canvas.getByText("×")).toBeInTheDocument();

    // セクションヘッダーが表示される
    await expect(canvas.getByText("α (non-branching)")).toBeInTheDocument();
    await expect(canvas.getByText("β (branching)")).toBeInTheDocument();
    await expect(canvas.getByText("Closure")).toBeInTheDocument();

    // 分岐バッジが表示される
    const betaDisjRule = canvas.getByTestId(
      "workspace-at-rule-palette-rule-beta-disj",
    );
    await expect(betaDisjRule.textContent).toContain("分岐");

    // Hilbertパレット・NDパレット・TABパレットは非表示
    await expect(
      canvas.queryByTestId("workspace-axiom-palette"),
    ).not.toBeInTheDocument();
    await expect(
      canvas.queryByTestId("workspace-nd-rule-palette"),
    ).not.toBeInTheDocument();
    await expect(
      canvas.queryByTestId("workspace-tab-rule-palette"),
    ).not.toBeInTheDocument();

    // 署名付き論理式ノード追加
    await userEvent.click(
      canvas.getByTestId("workspace-at-rule-palette-add-formula"),
    );
    await expect(canvas.getByTestId("proof-node-node-1")).toBeInTheDocument();
  },
};

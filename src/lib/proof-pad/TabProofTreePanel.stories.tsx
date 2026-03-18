import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { TabProofTreePanel } from "./TabProofTreePanel";
import type { InferenceEdge } from "./inferenceEdge";
import type { WorkspaceNode } from "./workspaceState";

// --- テスト用ヘルパー ---

function mkNode(id: string, formulaText: string, x = 0, y = 0): WorkspaceNode {
  return {
    id,
    kind: "axiom",
    label: "",
    formulaText,
    position: { x, y },
  };
}

// --- ストーリーデータ ---

/** 単一公理（BS）— 閉じた枝 */
function makeAxiomOnlyData(): {
  readonly nodes: readonly WorkspaceNode[];
  readonly inferenceEdges: readonly InferenceEdge[];
} {
  return {
    nodes: [mkNode("n1", "¬P, P")],
    inferenceEdges: [
      {
        _tag: "tab-axiom",
        ruleId: "bs",
        conclusionNodeId: "n1",
        conclusionText: "¬P, P",
      },
    ],
  };
}

/** 単項規則チェーン: ¬¬ → ∧ → BS */
function makeSinglePremiseChainData(): {
  readonly nodes: readonly WorkspaceNode[];
  readonly inferenceEdges: readonly InferenceEdge[];
} {
  return {
    nodes: [
      mkNode("n1", "¬¬(P ∧ Q)"),
      mkNode("n2", "P ∧ Q, ¬¬(P ∧ Q)"),
      mkNode("n3", "P, Q, P ∧ Q, ¬¬(P ∧ Q)"),
    ],
    inferenceEdges: [
      {
        _tag: "tab-single",
        ruleId: "double-negation",
        conclusionNodeId: "n1",
        premiseNodeId: "n2",
        conclusionText: "P ∧ Q, ¬¬(P ∧ Q)",
      },
      {
        _tag: "tab-single",
        ruleId: "conjunction",
        conclusionNodeId: "n2",
        premiseNodeId: "n3",
        conclusionText: "P, Q, P ∧ Q, ¬¬(P ∧ Q)",
      },
    ],
  };
}

/** 分岐ツリー: ∨規則で2枝 → 片方BS、片方open */
function makeBranchingData(): {
  readonly nodes: readonly WorkspaceNode[];
  readonly inferenceEdges: readonly InferenceEdge[];
} {
  return {
    nodes: [
      mkNode("n1", "¬P, P ∨ Q"),
      mkNode("n2", "¬P, P, P ∨ Q"),
      mkNode("n3", "¬P, Q, P ∨ Q"),
    ],
    inferenceEdges: [
      {
        _tag: "tab-branching",
        ruleId: "disjunction",
        conclusionNodeId: "n1",
        leftPremiseNodeId: "n2",
        rightPremiseNodeId: "n3",
        leftConclusionText: "¬P, P, P ∨ Q",
        rightConclusionText: "¬P, Q, P ∨ Q",
        conclusionText: "¬P, P ∨ Q",
      },
      {
        _tag: "tab-axiom",
        ruleId: "bs",
        conclusionNodeId: "n2",
        conclusionText: "¬P, P, P ∨ Q",
      },
    ],
  };
}

/** 完全な証明: ¬∨ → BS (両枝閉鎖) */
function makeCompleteProofData(): {
  readonly nodes: readonly WorkspaceNode[];
  readonly inferenceEdges: readonly InferenceEdge[];
} {
  return {
    nodes: [
      mkNode("n1", "P → Q, ¬Q, P"),
      mkNode("n2", "¬P, ¬Q, P, P → Q"),
      mkNode("n3", "Q, ¬Q, P, P → Q"),
    ],
    inferenceEdges: [
      {
        _tag: "tab-branching",
        ruleId: "implication",
        conclusionNodeId: "n1",
        leftPremiseNodeId: "n2",
        rightPremiseNodeId: "n3",
        leftConclusionText: "¬P, ¬Q, P, P → Q",
        rightConclusionText: "Q, ¬Q, P, P → Q",
        conclusionText: "P → Q, ¬Q, P",
      },
      {
        _tag: "tab-axiom",
        ruleId: "bs",
        conclusionNodeId: "n2",
        conclusionText: "¬P, ¬Q, P, P → Q",
      },
      {
        _tag: "tab-axiom",
        ruleId: "bs",
        conclusionNodeId: "n3",
        conclusionText: "Q, ¬Q, P, P → Q",
      },
    ],
  };
}

/** 空の状態（TABエッジなし） */
function makeEmptyData(): {
  readonly nodes: readonly WorkspaceNode[];
  readonly inferenceEdges: readonly InferenceEdge[];
} {
  return {
    nodes: [mkNode("n1", "P")],
    inferenceEdges: [],
  };
}

// --- Meta ---

const meta: Meta<typeof TabProofTreePanel> = {
  title: "proof-pad/TabProofTreePanel",
  component: TabProofTreePanel,
  parameters: {
    layout: "padded",
  },
};
export default meta;

type Story = StoryObj<typeof TabProofTreePanel>;

// --- ストーリー ---

export const AxiomOnly: Story = {
  args: {
    ...makeAxiomOnlyData(),
    testId: "tab-tree",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // パネルが表示される
    expect(canvas.getByTestId("tab-tree")).toBeInTheDocument();
    // 閉じた枝マーカー（×）が表示される
    const closedMarker = canvasElement.querySelector(
      '[data-testid^="tab-tree-closed-"]',
    );
    expect(closedMarker).toBeInTheDocument();
    expect(closedMarker?.textContent).toBe("×");
  },
};

export const SinglePremiseChain: Story = {
  args: {
    ...makeSinglePremiseChainData(),
    testId: "tab-tree",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByTestId("tab-tree")).toBeInTheDocument();
    // 3ノード存在
    const seqElements = canvasElement.querySelectorAll(
      '[data-testid^="tab-tree-seq-"]',
    );
    expect(seqElements.length).toBe(3);
    // 開いた枝マーカー（○）が葉に表示される
    const openMarker = canvasElement.querySelector(
      '[data-testid^="tab-tree-open-"]',
    );
    expect(openMarker).toBeInTheDocument();
    expect(openMarker?.textContent).toBe("○");
  },
};

export const BranchingTree: Story = {
  args: {
    ...makeBranchingData(),
    testId: "tab-tree",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByTestId("tab-tree")).toBeInTheDocument();
    // 3ノード存在
    const seqElements = canvasElement.querySelectorAll(
      '[data-testid^="tab-tree-seq-"]',
    );
    expect(seqElements.length).toBe(3);
    // 閉じた枝と開いた枝の両方が存在
    const closedMarker = canvasElement.querySelector(
      '[data-testid^="tab-tree-closed-"]',
    );
    expect(closedMarker).toBeInTheDocument();
    const openMarker = canvasElement.querySelector(
      '[data-testid^="tab-tree-open-"]',
    );
    expect(openMarker).toBeInTheDocument();
  },
};

export const CompleteProof: Story = {
  args: {
    ...makeCompleteProofData(),
    testId: "tab-tree",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByTestId("tab-tree")).toBeInTheDocument();
    // 全枝閉鎖: × マーカーが2つ
    const closedMarkers = canvasElement.querySelectorAll(
      '[data-testid^="tab-tree-closed-"]',
    );
    expect(closedMarkers.length).toBe(2);
    // 開いた枝なし
    const openMarkers = canvasElement.querySelectorAll(
      '[data-testid^="tab-tree-open-"]',
    );
    expect(openMarkers.length).toBe(0);
  },
};

export const Empty: Story = {
  args: {
    ...makeEmptyData(),
    testId: "tab-tree",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByTestId("tab-tree")).toBeInTheDocument();
    // 空メッセージ表示
    expect(
      canvas.getByText(
        "No tableau rules applied yet. Apply rules to build a tableau tree.",
      ),
    ).toBeInTheDocument();
  },
};

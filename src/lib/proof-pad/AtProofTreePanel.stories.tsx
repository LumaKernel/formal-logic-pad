import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { AtProofTreePanel } from "./AtProofTreePanel";
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

/** 単一closure — 閉じた枝 */
function makeClosureOnlyData(): {
  readonly nodes: readonly WorkspaceNode[];
  readonly inferenceEdges: readonly InferenceEdge[];
} {
  return {
    nodes: [mkNode("n1", "T:phi")],
    inferenceEdges: [
      {
        _tag: "at-closed",
        ruleId: "closure",
        conclusionNodeId: "n1",
        contradictionNodeId: "n2",
        conclusionText: "T:phi",
      },
    ],
  };
}

/** α規則チェーン: T(¬¬φ) → T(φ) → T(φ∧ψ) → T(φ), T(ψ) */
function makeAlphaChainData(): {
  readonly nodes: readonly WorkspaceNode[];
  readonly inferenceEdges: readonly InferenceEdge[];
} {
  return {
    nodes: [
      mkNode("n1", "T:¬¬phi"),
      mkNode("n2", "T:phi"),
      mkNode("n3", "T:phi ∧ psi"),
    ],
    inferenceEdges: [
      {
        _tag: "at-alpha",
        ruleId: "alpha-double-neg-t",
        conclusionNodeId: "n1",
        resultNodeId: "n2",
        secondResultNodeId: undefined,
        conclusionText: "T:¬¬phi",
        resultText: "T:phi",
        secondResultText: undefined,
      },
      {
        _tag: "at-alpha",
        ruleId: "alpha-conj",
        conclusionNodeId: "n2",
        resultNodeId: "n3",
        secondResultNodeId: undefined,
        conclusionText: "T:phi",
        resultText: "T:phi ∧ psi",
        secondResultText: undefined,
      },
    ],
  };
}

/** β分岐: T(φ∨ψ) → T(φ) | T(ψ)、片枝closed、片枝open */
function makeBetaBranchingData(): {
  readonly nodes: readonly WorkspaceNode[];
  readonly inferenceEdges: readonly InferenceEdge[];
} {
  return {
    nodes: [
      mkNode("n1", "T:phi ∨ psi"),
      mkNode("n2", "T:phi"),
      mkNode("n3", "T:psi"),
    ],
    inferenceEdges: [
      {
        _tag: "at-beta",
        ruleId: "beta-disj",
        conclusionNodeId: "n1",
        leftResultNodeId: "n2",
        rightResultNodeId: "n3",
        conclusionText: "T:phi ∨ psi",
        leftResultText: "T:phi",
        rightResultText: "T:psi",
      },
      {
        _tag: "at-closed",
        ruleId: "closure",
        conclusionNodeId: "n2",
        contradictionNodeId: "n4",
        conclusionText: "T:phi",
      },
    ],
  };
}

/** 完全証明: F(φ→φ) → β → 両枝closed */
function makeCompleteProofData(): {
  readonly nodes: readonly WorkspaceNode[];
  readonly inferenceEdges: readonly InferenceEdge[];
} {
  return {
    nodes: [
      mkNode("n1", "F:phi → phi"),
      mkNode("n2", "T:phi"),
      mkNode("n3", "F:phi"),
    ],
    inferenceEdges: [
      {
        _tag: "at-beta",
        ruleId: "beta-impl",
        conclusionNodeId: "n1",
        leftResultNodeId: "n2",
        rightResultNodeId: "n3",
        conclusionText: "F:phi → phi",
        leftResultText: "T:phi",
        rightResultText: "F:phi",
      },
      {
        _tag: "at-closed",
        ruleId: "closure",
        conclusionNodeId: "n2",
        contradictionNodeId: "n3",
        conclusionText: "T:phi",
      },
      {
        _tag: "at-closed",
        ruleId: "closure",
        conclusionNodeId: "n3",
        contradictionNodeId: "n2",
        conclusionText: "F:phi",
      },
    ],
  };
}

/** 空の状態（ATエッジなし） */
function makeEmptyData(): {
  readonly nodes: readonly WorkspaceNode[];
  readonly inferenceEdges: readonly InferenceEdge[];
} {
  return {
    nodes: [mkNode("n1", "T:phi")],
    inferenceEdges: [],
  };
}

// --- Meta ---

const meta: Meta<typeof AtProofTreePanel> = {
  title: "proof-pad/AtProofTreePanel",
  component: AtProofTreePanel,
  parameters: {
    layout: "padded",
  },
};
export default meta;

type Story = StoryObj<typeof AtProofTreePanel>;

// --- ストーリー ---

export const ClosureOnly: Story = {
  args: {
    ...makeClosureOnlyData(),
    testId: "at-tree",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByTestId("at-tree")).toBeInTheDocument();
    // 閉じた枝マーカー（×）が表示される
    const closedMarker = canvasElement.querySelector(
      '[data-testid^="at-tree-closed-"]',
    );
    expect(closedMarker).toBeInTheDocument();
    expect(closedMarker?.textContent).toBe("×");
  },
};

export const AlphaChain: Story = {
  args: {
    ...makeAlphaChainData(),
    testId: "at-tree",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByTestId("at-tree")).toBeInTheDocument();
    // 3ノード存在
    const seqElements = canvasElement.querySelectorAll(
      '[data-testid^="at-tree-seq-"]',
    );
    expect(seqElements.length).toBe(3);
    // 開いた枝マーカー（○）が葉に表示される
    const openMarker = canvasElement.querySelector(
      '[data-testid^="at-tree-open-"]',
    );
    expect(openMarker).toBeInTheDocument();
    expect(openMarker?.textContent).toBe("○");
  },
};

export const BetaBranching: Story = {
  args: {
    ...makeBetaBranchingData(),
    testId: "at-tree",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByTestId("at-tree")).toBeInTheDocument();
    // 3ノード存在
    const seqElements = canvasElement.querySelectorAll(
      '[data-testid^="at-tree-seq-"]',
    );
    expect(seqElements.length).toBe(3);
    // 閉じた枝と開いた枝の両方が存在
    const closedMarker = canvasElement.querySelector(
      '[data-testid^="at-tree-closed-"]',
    );
    expect(closedMarker).toBeInTheDocument();
    const openMarker = canvasElement.querySelector(
      '[data-testid^="at-tree-open-"]',
    );
    expect(openMarker).toBeInTheDocument();
  },
};

export const CompleteProof: Story = {
  args: {
    ...makeCompleteProofData(),
    testId: "at-tree",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByTestId("at-tree")).toBeInTheDocument();
    // 全枝閉鎖: × マーカーが2つ
    const closedMarkers = canvasElement.querySelectorAll(
      '[data-testid^="at-tree-closed-"]',
    );
    expect(closedMarkers.length).toBe(2);
    // 開いた枝なし
    const openMarkers = canvasElement.querySelectorAll(
      '[data-testid^="at-tree-open-"]',
    );
    expect(openMarkers.length).toBe(0);
  },
};

/** 複数ルート: 2つの独立した証明木 */
function makeMultipleRootsData(): {
  readonly nodes: readonly WorkspaceNode[];
  readonly inferenceEdges: readonly InferenceEdge[];
} {
  return {
    nodes: [mkNode("r1", "T:phi"), mkNode("r2", "F:psi")],
    inferenceEdges: [
      {
        _tag: "at-closed",
        ruleId: "closure",
        conclusionNodeId: "r1",
        contradictionNodeId: "r3",
        conclusionText: "T:phi",
      },
      {
        _tag: "at-closed",
        ruleId: "closure",
        conclusionNodeId: "r2",
        contradictionNodeId: "r4",
        conclusionText: "F:psi",
      },
    ],
  };
}

export const MultipleRoots: Story = {
  args: {
    ...makeMultipleRootsData(),
    testId: "at-tree",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByTestId("at-tree")).toBeInTheDocument();
    // ルート切替ボタンが表示される（roots.length > 1）
    const cycleBtn = canvas.getByTestId("at-tree-cycle-root");
    expect(cycleBtn).toBeInTheDocument();
    expect(cycleBtn.textContent).toBe("1/2");
    // クリックでルートが切り替わる
    await userEvent.click(cycleBtn);
    expect(cycleBtn.textContent).toBe("2/2");
  },
};

/** 署名なし論理式: T:/F: 接頭辞なしのノード */
function makeNonSignedData(): {
  readonly nodes: readonly WorkspaceNode[];
  readonly inferenceEdges: readonly InferenceEdge[];
} {
  return {
    nodes: [mkNode("n1", "phi → psi")],
    inferenceEdges: [
      {
        _tag: "at-closed",
        ruleId: "closure",
        conclusionNodeId: "n1",
        contradictionNodeId: "n2",
        conclusionText: "phi → psi",
      },
    ],
  };
}

export const NonSignedFormula: Story = {
  args: {
    ...makeNonSignedData(),
    testId: "at-tree",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByTestId("at-tree")).toBeInTheDocument();
    // 署名なしのためプレーンテキスト表示（SignedFormulaDisplay ではない）
    // ツリーレンダラーは独自ID（attree-N）を生成する
    const seqEl = canvas.getByTestId("at-tree-seq-attree-0");
    expect(seqEl.textContent).toBe("phi → psi");
  },
};

export const Empty: Story = {
  args: {
    ...makeEmptyData(),
    testId: "at-tree",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByTestId("at-tree")).toBeInTheDocument();
    // 空メッセージ表示
    expect(
      canvas.getByText(
        "No analytic tableau rules applied yet. Apply rules to build a tableau tree.",
      ),
    ).toBeInTheDocument();
  },
};

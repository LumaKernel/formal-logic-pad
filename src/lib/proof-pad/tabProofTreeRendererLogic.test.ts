/**
 * tabProofTreeRendererLogic のテスト。
 *
 * ワークスペースグラフ → タブロースタイル証明木表示データ変換ロジックを検証する。
 */

import { describe, expect, it } from "vitest";
import type { InferenceEdge } from "./inferenceEdge";
import type { WorkspaceNode } from "./workspaceState";
import {
  convertTabWorkspaceToTreeDisplay,
  convertTabWorkspaceToTreeDisplayAuto,
  findTabTreeRoots,
  computeTabTreeStats,
} from "./tabProofTreeRendererLogic";

// ── テストヘルパー ──────────────────────────────────────────

function mkNode(id: string, formulaText: string): WorkspaceNode {
  return {
    id,
    kind: "axiom",
    label: "",
    formulaText,
    position: { x: 0, y: 0 },
  };
}

// ── convertTabWorkspaceToTreeDisplay ────────────────────────────

describe("convertTabWorkspaceToTreeDisplay", () => {
  it("単一ノード（エッジなし）を変換する — 開いた枝", () => {
    const nodes = [mkNode("n1", "¬P, P")];
    const edges: readonly InferenceEdge[] = [];
    const result = convertTabWorkspaceToTreeDisplay(nodes, edges, "n1");

    expect(result.nodes.size).toBe(1);
    const root = result.nodes.get(result.rootId);
    expect(root).toBeDefined();
    expect(root?.sequentText).toBe("¬P, P");
    expect(root?.ruleLabel).toBeUndefined();
    expect(root?.childIds).toEqual([]);
    expect(root?.branchStatus).toBe("open");
    expect(root?.depth).toBe(0);
    expect(root?.workspaceNodeId).toBe("n1");
  });

  it("公理ノード（tab-axiom BS）を変換する — 閉じた枝", () => {
    const nodes = [mkNode("n1", "¬P, P")];
    const edges: readonly InferenceEdge[] = [
      {
        _tag: "tab-axiom",
        ruleId: "bs",
        conclusionNodeId: "n1",
        conclusionText: "¬P, P",
      },
    ];
    const result = convertTabWorkspaceToTreeDisplay(nodes, edges, "n1");

    expect(result.nodes.size).toBe(1);
    const root = result.nodes.get(result.rootId);
    expect(root?.branchStatus).toBe("closed");
    expect(root?.childIds).toEqual([]);
    expect(root?.ruleLabel).toBeUndefined(); // ルートノードには規則ラベルなし
  });

  it("単項規則（tab-single ∧）で1子ノードを持つツリーを変換する", () => {
    const nodes = [mkNode("n1", "P ∧ Q"), mkNode("n2", "P, Q, P ∧ Q")];
    const edges: readonly InferenceEdge[] = [
      {
        _tag: "tab-single",
        ruleId: "conjunction",
        conclusionNodeId: "n1",
        premiseNodeId: "n2",
        conclusionText: "P, Q, P ∧ Q",
      },
    ];
    const result = convertTabWorkspaceToTreeDisplay(nodes, edges, "n1");

    expect(result.nodes.size).toBe(2);

    // ルートノード
    const root = result.nodes.get(result.rootId);
    expect(root?.sequentText).toBe("P ∧ Q");
    expect(root?.childIds).toHaveLength(1);
    expect(root?.branchStatus).toBeUndefined();
    expect(root?.depth).toBe(0);

    // 子ノード
    expect(root).toBeDefined();
    const childId = root!.childIds[0];
    expect(childId).toBeDefined();
    const child = result.nodes.get(childId!);
    expect(child?.sequentText).toBe("P, Q, P ∧ Q");
    expect(child?.ruleLabel).toBe("∧"); // getTabRuleDisplayName("conjunction")
    expect(child?.branchStatus).toBe("open"); // まだ閉じていない
    expect(child?.depth).toBe(1);
  });

  it("分岐規則（tab-branching ∨）で2子ノードを持つツリーを変換する", () => {
    const nodes = [
      mkNode("n1", "P ∨ Q"),
      mkNode("n2", "P, P ∨ Q"),
      mkNode("n3", "Q, P ∨ Q"),
    ];
    const edges: readonly InferenceEdge[] = [
      {
        _tag: "tab-branching",
        ruleId: "disjunction",
        conclusionNodeId: "n1",
        leftPremiseNodeId: "n2",
        rightPremiseNodeId: "n3",
        leftConclusionText: "P, P ∨ Q",
        rightConclusionText: "Q, P ∨ Q",
        conclusionText: "P ∨ Q",
      },
    ];
    const result = convertTabWorkspaceToTreeDisplay(nodes, edges, "n1");

    expect(result.nodes.size).toBe(3);

    // ルートノード
    const root = result.nodes.get(result.rootId);
    expect(root?.childIds).toHaveLength(2);
    expect(root?.branchStatus).toBeUndefined();

    // 左枝
    expect(root).toBeDefined();
    const leftChildId = root!.childIds[0];
    expect(leftChildId).toBeDefined();
    const leftChild = result.nodes.get(leftChildId!);
    expect(leftChild?.sequentText).toBe("P, P ∨ Q");
    expect(leftChild?.ruleLabel).toBe("∨");
    expect(leftChild?.branchStatus).toBe("open");

    // 右枝
    const rightChildId = root!.childIds[1];
    expect(rightChildId).toBeDefined();
    const rightChild = result.nodes.get(rightChildId!);
    expect(rightChild?.sequentText).toBe("Q, P ∨ Q");
    expect(rightChild?.ruleLabel).toBe("∨");
    expect(rightChild?.branchStatus).toBe("open");
  });

  it("分岐 + 両枝閉鎖の完全な証明を変換する", () => {
    // P ∨ ¬P を証明（背理法的）
    // root: ¬(P ∨ ¬P)
    //   → ¬P, ¬¬P (¬∨ で展開)
    //     → BS で閉じる
    const nodes = [
      mkNode("n1", "¬(P ∨ ¬P)"),
      mkNode("n2", "¬P, ¬¬P, ¬(P ∨ ¬P)"),
    ];
    const edges: readonly InferenceEdge[] = [
      {
        _tag: "tab-single",
        ruleId: "neg-disjunction",
        conclusionNodeId: "n1",
        premiseNodeId: "n2",
        conclusionText: "¬P, ¬¬P, ¬(P ∨ ¬P)",
      },
      {
        _tag: "tab-axiom",
        ruleId: "bs",
        conclusionNodeId: "n2",
        conclusionText: "¬P, ¬¬P, ¬(P ∨ ¬P)",
      },
    ];
    const result = convertTabWorkspaceToTreeDisplay(nodes, edges, "n1");

    expect(result.nodes.size).toBe(2);

    const root = result.nodes.get(result.rootId);
    expect(root?.childIds).toHaveLength(1);
    expect(root?.branchStatus).toBeUndefined();

    expect(root).toBeDefined();
    const childId2 = root!.childIds[0];
    expect(childId2).toBeDefined();
    const child = result.nodes.get(childId2!);
    expect(child?.branchStatus).toBe("closed");
    expect(child?.ruleLabel).toBe("¬∨");
  });

  it("分岐規則で片方のpremiseNodeIdがundefinedの場合", () => {
    const nodes = [mkNode("n1", "P ∨ Q"), mkNode("n2", "P, P ∨ Q")];
    const edges: readonly InferenceEdge[] = [
      {
        _tag: "tab-branching",
        ruleId: "disjunction",
        conclusionNodeId: "n1",
        leftPremiseNodeId: "n2",
        rightPremiseNodeId: undefined,
        leftConclusionText: "P, P ∨ Q",
        rightConclusionText: "Q, P ∨ Q",
        conclusionText: "P ∨ Q",
      },
    ];
    const result = convertTabWorkspaceToTreeDisplay(nodes, edges, "n1");

    expect(result.nodes.size).toBe(2);
    const root = result.nodes.get(result.rootId);
    expect(root?.childIds).toHaveLength(1); // rightがundefinedなので1つだけ
  });

  it("深い単項規則チェーンを変換する", () => {
    const nodes = [
      mkNode("n1", "¬¬P"),
      mkNode("n2", "P, ¬¬P"),
      mkNode("n3", "¬¬P, P, ¬¬P"),
    ];
    const edges: readonly InferenceEdge[] = [
      {
        _tag: "tab-single",
        ruleId: "double-negation",
        conclusionNodeId: "n1",
        premiseNodeId: "n2",
        conclusionText: "P, ¬¬P",
      },
      {
        _tag: "tab-single",
        ruleId: "double-negation",
        conclusionNodeId: "n2",
        premiseNodeId: "n3",
        conclusionText: "¬¬P, P, ¬¬P",
      },
    ];
    const result = convertTabWorkspaceToTreeDisplay(nodes, edges, "n1");

    expect(result.nodes.size).toBe(3);
    const root = result.nodes.get(result.rootId);
    expect(root?.depth).toBe(0);

    expect(root).toBeDefined();
    const midId = root!.childIds[0];
    expect(midId).toBeDefined();
    const mid = result.nodes.get(midId!);
    expect(mid?.depth).toBe(1);
    expect(mid?.ruleLabel).toBe("¬¬");

    expect(mid).toBeDefined();
    const leafId = mid!.childIds[0];
    expect(leafId).toBeDefined();
    const leaf = result.nodes.get(leafId!);
    expect(leaf?.depth).toBe(2);
    expect(leaf?.branchStatus).toBe("open");
  });

  it("非TABエッジは無視される", () => {
    const nodes = [mkNode("n1", "φ"), mkNode("n2", "ψ")];
    const edges: readonly InferenceEdge[] = [
      {
        _tag: "nd-implication-elim",
        conclusionNodeId: "n2",
        leftPremiseNodeId: "n1",
        rightPremiseNodeId: undefined,
        conclusionText: "ψ",
      },
    ];
    const result = convertTabWorkspaceToTreeDisplay(nodes, edges, "n1");

    expect(result.nodes.size).toBe(1);
    const root = result.nodes.get(result.rootId);
    expect(root?.branchStatus).toBe("open");
  });

  it("存在しないノードIDを指定した場合はIDをテキストとして表示する", () => {
    const nodes: readonly WorkspaceNode[] = [];
    const edges: readonly InferenceEdge[] = [];
    const result = convertTabWorkspaceToTreeDisplay(nodes, edges, "unknown");

    expect(result.nodes.size).toBe(1);
    const root = result.nodes.get(result.rootId);
    expect(root?.sequentText).toBe("unknown");
  });
});

// ── convertTabWorkspaceToTreeDisplayAuto ────────────────────────

describe("convertTabWorkspaceToTreeDisplayAuto", () => {
  it("TABエッジがない場合はnullを返す", () => {
    const nodes = [mkNode("n1", "P")];
    const result = convertTabWorkspaceToTreeDisplayAuto(nodes, []);
    expect(result).toBeNull();
  });

  it("単一のルートを自動検出する", () => {
    const nodes = [mkNode("n1", "P ∧ Q"), mkNode("n2", "P, Q, P ∧ Q")];
    const edges: readonly InferenceEdge[] = [
      {
        _tag: "tab-single",
        ruleId: "conjunction",
        conclusionNodeId: "n1",
        premiseNodeId: "n2",
        conclusionText: "P, Q, P ∧ Q",
      },
    ];
    const result = convertTabWorkspaceToTreeDisplayAuto(nodes, edges);

    expect(result).not.toBeNull();
    const root = result!.nodes.get(result!.rootId);
    expect(root?.sequentText).toBe("P ∧ Q");
  });
});

// ── findTabTreeRoots ──────────────────────────────────────────

describe("findTabTreeRoots", () => {
  it("TABエッジがない場合は空配列を返す", () => {
    const result = findTabTreeRoots([mkNode("n1", "P")], []);
    expect(result).toEqual([]);
  });

  it("単一ルートを検出する", () => {
    const nodes = [mkNode("n1", "P"), mkNode("n2", "Q")];
    const edges: readonly InferenceEdge[] = [
      {
        _tag: "tab-single",
        ruleId: "double-negation",
        conclusionNodeId: "n1",
        premiseNodeId: "n2",
        conclusionText: "Q",
      },
    ];
    const result = findTabTreeRoots(nodes, edges);
    expect(result).toEqual(["n1"]);
  });

  it("分岐ツリーのルートを検出する", () => {
    const nodes = [mkNode("n1", "P ∨ Q"), mkNode("n2", "P"), mkNode("n3", "Q")];
    const edges: readonly InferenceEdge[] = [
      {
        _tag: "tab-branching",
        ruleId: "disjunction",
        conclusionNodeId: "n1",
        leftPremiseNodeId: "n2",
        rightPremiseNodeId: "n3",
        leftConclusionText: "P",
        rightConclusionText: "Q",
        conclusionText: "P ∨ Q",
      },
    ];
    const result = findTabTreeRoots(nodes, edges);
    expect(result).toEqual(["n1"]);
  });
});

// ── computeTabTreeStats ──────────────────────────────────────

describe("computeTabTreeStats", () => {
  it("単一閉鎖枝の統計を計算する", () => {
    const nodes = [mkNode("n1", "¬P, P")];
    const edges: readonly InferenceEdge[] = [
      {
        _tag: "tab-axiom",
        ruleId: "bs",
        conclusionNodeId: "n1",
        conclusionText: "¬P, P",
      },
    ];
    const data = convertTabWorkspaceToTreeDisplay(nodes, edges, "n1");
    const stats = computeTabTreeStats(data);

    expect(stats.totalNodes).toBe(1);
    expect(stats.maxDepth).toBe(0);
    expect(stats.closedBranches).toBe(1);
    expect(stats.openBranches).toBe(0);
    expect(stats.usedRules).toEqual([]);
  });

  it("分岐ツリーの統計を計算する", () => {
    const nodes = [
      mkNode("n1", "P ∨ Q"),
      mkNode("n2", "P, P ∨ Q"),
      mkNode("n3", "Q, P ∨ Q"),
    ];
    const edges: readonly InferenceEdge[] = [
      {
        _tag: "tab-branching",
        ruleId: "disjunction",
        conclusionNodeId: "n1",
        leftPremiseNodeId: "n2",
        rightPremiseNodeId: "n3",
        leftConclusionText: "P, P ∨ Q",
        rightConclusionText: "Q, P ∨ Q",
        conclusionText: "P ∨ Q",
      },
    ];
    const data = convertTabWorkspaceToTreeDisplay(nodes, edges, "n1");
    const stats = computeTabTreeStats(data);

    expect(stats.totalNodes).toBe(3);
    expect(stats.maxDepth).toBe(1);
    expect(stats.closedBranches).toBe(0);
    expect(stats.openBranches).toBe(2);
    expect(stats.usedRules).toEqual(["∨"]);
  });

  it("複数の規則を使ったツリーの統計を計算する", () => {
    const nodes = [mkNode("n1", "¬(P ∨ Q)"), mkNode("n2", "¬P, ¬Q, ¬(P ∨ Q)")];
    const edges: readonly InferenceEdge[] = [
      {
        _tag: "tab-single",
        ruleId: "neg-disjunction",
        conclusionNodeId: "n1",
        premiseNodeId: "n2",
        conclusionText: "¬P, ¬Q, ¬(P ∨ Q)",
      },
      {
        _tag: "tab-axiom",
        ruleId: "bs",
        conclusionNodeId: "n2",
        conclusionText: "¬P, ¬Q, ¬(P ∨ Q)",
      },
    ];
    const data = convertTabWorkspaceToTreeDisplay(nodes, edges, "n1");
    const stats = computeTabTreeStats(data);

    expect(stats.totalNodes).toBe(2);
    expect(stats.maxDepth).toBe(1);
    expect(stats.closedBranches).toBe(1);
    expect(stats.openBranches).toBe(0);
    expect(stats.usedRules).toEqual(["¬∨"]);
  });
});

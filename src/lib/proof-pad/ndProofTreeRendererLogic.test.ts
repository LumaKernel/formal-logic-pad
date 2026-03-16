/**
 * ndProofTreeRendererLogic のテスト。
 *
 * ワークスペースグラフ → Gentzenスタイル証明木表示データ変換ロジックを検証する。
 */

import { describe, expect, it } from "vitest";
import type { InferenceEdge } from "./inferenceEdge";
import type { WorkspaceNode } from "./workspaceState";
import {
  convertNdWorkspaceToProofTree,
  convertNdWorkspaceToProofTreeAuto,
  findNdProofTreeRoots,
  computeProofTreeStats,
} from "./ndProofTreeRendererLogic";

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

// ── convertNdWorkspaceToProofTree ────────────────────────────

describe("convertNdWorkspaceToProofTree", () => {
  it("仮定ノードのみ（エッジなし）を変換する", () => {
    const nodes = [mkNode("n1", "φ")];
    const edges: readonly InferenceEdge[] = [];
    const result = convertNdWorkspaceToProofTree(nodes, edges, "n1");

    expect(result.nodes.size).toBe(1);
    const root = result.nodes.get(result.rootId);
    expect(root).toBeDefined();
    expect(root?.ruleLabel).toBe("Asm");
    expect(root?.conclusionText).toBe("φ");
    expect(root?.premiseIds).toEqual([]);
    expect(root?.depth).toBe(0);
  });

  it("→E（1前提から結論）を変換する", () => {
    const nodes = [mkNode("n1", "φ"), mkNode("n2", "φ → ψ"), mkNode("n3", "ψ")];
    const edges: readonly InferenceEdge[] = [
      {
        _tag: "nd-implication-elim",
        conclusionNodeId: "n3",
        leftPremiseNodeId: "n1",
        rightPremiseNodeId: "n2",
        conclusionText: "ψ",
      },
    ];
    const result = convertNdWorkspaceToProofTree(nodes, edges, "n3");

    expect(result.nodes.size).toBe(3);
    const root = result.nodes.get(result.rootId);
    expect(root?.ruleLabel).toBe("→E");
    expect(root?.conclusionText).toBe("ψ");
    expect(root?.premiseIds).toHaveLength(2);
    expect(root?.depth).toBe(0);

    // 前提ノードは仮定
    for (const pid of root!.premiseIds) {
      const premNode = result.nodes.get(pid);
      expect(premNode?.ruleLabel).toBe("Asm");
      expect(premNode?.depth).toBe(1);
    }
  });

  it("→I（discharged仮定付き）を変換する", () => {
    const nodes = [mkNode("n1", "φ"), mkNode("n2", "φ → φ")];
    const edges: readonly InferenceEdge[] = [
      {
        _tag: "nd-implication-intro",
        conclusionNodeId: "n2",
        premiseNodeId: "n1",
        dischargedFormulaText: "φ",
        dischargedAssumptionId: 1,
        conclusionText: "φ → φ",
      },
    ];
    const result = convertNdWorkspaceToProofTree(nodes, edges, "n2");

    expect(result.nodes.size).toBe(2);
    const root = result.nodes.get(result.rootId);
    expect(root?.ruleLabel).toBe("→I [1]");
    expect(root?.premiseIds).toHaveLength(1);
  });

  it("∧I（2前提）を変換する", () => {
    const nodes = [mkNode("n1", "φ"), mkNode("n2", "ψ"), mkNode("n3", "φ ∧ ψ")];
    const edges: readonly InferenceEdge[] = [
      {
        _tag: "nd-conjunction-intro",
        conclusionNodeId: "n3",
        leftPremiseNodeId: "n1",
        rightPremiseNodeId: "n2",
        conclusionText: "φ ∧ ψ",
      },
    ];
    const result = convertNdWorkspaceToProofTree(nodes, edges, "n3");

    expect(result.nodes.size).toBe(3);
    const root = result.nodes.get(result.rootId);
    expect(root?.ruleLabel).toBe("∧I");
    expect(root?.premiseIds).toHaveLength(2);
  });

  it("∧E_L（1前提）を変換する", () => {
    const nodes = [mkNode("n1", "φ ∧ ψ"), mkNode("n2", "φ")];
    const edges: readonly InferenceEdge[] = [
      {
        _tag: "nd-conjunction-elim-left",
        conclusionNodeId: "n2",
        premiseNodeId: "n1",
        conclusionText: "φ",
      },
    ];
    const result = convertNdWorkspaceToProofTree(nodes, edges, "n2");

    const root = result.nodes.get(result.rootId);
    expect(root?.ruleLabel).toBe("∧E_L");
    expect(root?.premiseIds).toHaveLength(1);
  });

  it("∧E_R（1前提）を変換する", () => {
    const nodes = [mkNode("n1", "φ ∧ ψ"), mkNode("n2", "ψ")];
    const edges: readonly InferenceEdge[] = [
      {
        _tag: "nd-conjunction-elim-right",
        conclusionNodeId: "n2",
        premiseNodeId: "n1",
        conclusionText: "ψ",
      },
    ];
    const result = convertNdWorkspaceToProofTree(nodes, edges, "n2");

    const root = result.nodes.get(result.rootId);
    expect(root?.ruleLabel).toBe("∧E_R");
  });

  it("∨I_L を変換する", () => {
    const nodes = [mkNode("n1", "φ"), mkNode("n2", "φ ∨ ψ")];
    const edges: readonly InferenceEdge[] = [
      {
        _tag: "nd-disjunction-intro-left",
        conclusionNodeId: "n2",
        premiseNodeId: "n1",
        addedRightText: "ψ",
        conclusionText: "φ ∨ ψ",
      },
    ];
    const result = convertNdWorkspaceToProofTree(nodes, edges, "n2");

    const root = result.nodes.get(result.rootId);
    expect(root?.ruleLabel).toBe("∨I_L");
    expect(root?.premiseIds).toHaveLength(1);
  });

  it("∨I_R を変換する", () => {
    const nodes = [mkNode("n1", "ψ"), mkNode("n2", "φ ∨ ψ")];
    const edges: readonly InferenceEdge[] = [
      {
        _tag: "nd-disjunction-intro-right",
        conclusionNodeId: "n2",
        premiseNodeId: "n1",
        addedLeftText: "φ",
        conclusionText: "φ ∨ ψ",
      },
    ];
    const result = convertNdWorkspaceToProofTree(nodes, edges, "n2");

    const root = result.nodes.get(result.rootId);
    expect(root?.ruleLabel).toBe("∨I_R");
  });

  it("∨E（3前提 + discharged仮定）を変換する", () => {
    const nodes = [
      mkNode("n1", "φ ∨ ψ"),
      mkNode("n2", "χ"),
      mkNode("n3", "χ"),
      mkNode("n4", "χ"),
    ];
    const edges: readonly InferenceEdge[] = [
      {
        _tag: "nd-disjunction-elim",
        conclusionNodeId: "n4",
        disjunctionPremiseNodeId: "n1",
        leftCasePremiseNodeId: "n2",
        leftDischargedAssumptionId: 1,
        rightCasePremiseNodeId: "n3",
        rightDischargedAssumptionId: 2,
        conclusionText: "χ",
      },
    ];
    const result = convertNdWorkspaceToProofTree(nodes, edges, "n4");

    expect(result.nodes.size).toBe(4);
    const root = result.nodes.get(result.rootId);
    expect(root?.ruleLabel).toBe("∨E [1,2]");
    expect(root?.premiseIds).toHaveLength(3);
  });

  it("弱化 (w) を変換する", () => {
    const nodes = [mkNode("n1", "φ"), mkNode("n2", "ψ"), mkNode("n3", "φ")];
    const edges: readonly InferenceEdge[] = [
      {
        _tag: "nd-weakening",
        conclusionNodeId: "n3",
        keptPremiseNodeId: "n1",
        discardedPremiseNodeId: "n2",
        conclusionText: "φ",
      },
    ];
    const result = convertNdWorkspaceToProofTree(nodes, edges, "n3");

    const root = result.nodes.get(result.rootId);
    expect(root?.ruleLabel).toBe("w");
    expect(root?.premiseIds).toHaveLength(2);
  });

  it("EFQ を変換する", () => {
    const nodes = [mkNode("n1", "⊥"), mkNode("n2", "φ")];
    const edges: readonly InferenceEdge[] = [
      {
        _tag: "nd-efq",
        conclusionNodeId: "n2",
        premiseNodeId: "n1",
        conclusionText: "φ",
      },
    ];
    const result = convertNdWorkspaceToProofTree(nodes, edges, "n2");

    const root = result.nodes.get(result.rootId);
    expect(root?.ruleLabel).toBe("EFQ");
  });

  it("DNE を変換する", () => {
    const nodes = [mkNode("n1", "¬¬φ"), mkNode("n2", "φ")];
    const edges: readonly InferenceEdge[] = [
      {
        _tag: "nd-dne",
        conclusionNodeId: "n2",
        premiseNodeId: "n1",
        conclusionText: "φ",
      },
    ];
    const result = convertNdWorkspaceToProofTree(nodes, edges, "n2");

    const root = result.nodes.get(result.rootId);
    expect(root?.ruleLabel).toBe("DNE");
  });

  it("∀I を変換する", () => {
    const nodes = [mkNode("n1", "φ"), mkNode("n2", "∀x.φ")];
    const edges: readonly InferenceEdge[] = [
      {
        _tag: "nd-universal-intro",
        conclusionNodeId: "n2",
        premiseNodeId: "n1",
        variableName: "x",
        conclusionText: "∀x.φ",
      },
    ];
    const result = convertNdWorkspaceToProofTree(nodes, edges, "n2");

    const root = result.nodes.get(result.rootId);
    expect(root?.ruleLabel).toBe("∀I(x)");
  });

  it("∀E を変換する", () => {
    const nodes = [mkNode("n1", "∀x.φ"), mkNode("n2", "φ[t/x]")];
    const edges: readonly InferenceEdge[] = [
      {
        _tag: "nd-universal-elim",
        conclusionNodeId: "n2",
        premiseNodeId: "n1",
        termText: "t",
        conclusionText: "φ[t/x]",
      },
    ];
    const result = convertNdWorkspaceToProofTree(nodes, edges, "n2");

    const root = result.nodes.get(result.rootId);
    expect(root?.ruleLabel).toBe("∀E(t)");
  });

  it("∃I を変換する", () => {
    const nodes = [mkNode("n1", "φ[t/x]"), mkNode("n2", "∃x.φ")];
    const edges: readonly InferenceEdge[] = [
      {
        _tag: "nd-existential-intro",
        conclusionNodeId: "n2",
        premiseNodeId: "n1",
        variableName: "x",
        termText: "t",
        conclusionText: "∃x.φ",
      },
    ];
    const result = convertNdWorkspaceToProofTree(nodes, edges, "n2");

    const root = result.nodes.get(result.rootId);
    expect(root?.ruleLabel).toBe("∃I(x)");
  });

  it("∃E を変換する", () => {
    const nodes = [mkNode("n1", "∃x.φ"), mkNode("n2", "χ"), mkNode("n3", "χ")];
    const edges: readonly InferenceEdge[] = [
      {
        _tag: "nd-existential-elim",
        conclusionNodeId: "n3",
        existentialPremiseNodeId: "n1",
        casePremiseNodeId: "n2",
        dischargedAssumptionId: 1,
        dischargedFormulaText: "φ",
        conclusionText: "χ",
      },
    ];
    const result = convertNdWorkspaceToProofTree(nodes, edges, "n3");

    const root = result.nodes.get(result.rootId);
    expect(root?.ruleLabel).toBe("∃E [1]");
    expect(root?.premiseIds).toHaveLength(2);
  });

  it("深いツリーの深さが正しく計算される", () => {
    // n1(Asm) →I n2(φ→φ) →E(with n3(Asm)) → n4
    const nodes = [
      mkNode("n1", "φ"),
      mkNode("n2", "φ → φ"),
      mkNode("n3", "φ"),
      mkNode("n4", "φ"),
    ];
    const edges: readonly InferenceEdge[] = [
      {
        _tag: "nd-implication-intro",
        conclusionNodeId: "n2",
        premiseNodeId: "n1",
        dischargedFormulaText: "φ",
        dischargedAssumptionId: 1,
        conclusionText: "φ → φ",
      },
      {
        _tag: "nd-implication-elim",
        conclusionNodeId: "n4",
        leftPremiseNodeId: "n3",
        rightPremiseNodeId: "n2",
        conclusionText: "φ",
      },
    ];
    const result = convertNdWorkspaceToProofTree(nodes, edges, "n4");

    expect(result.nodes.size).toBe(4);
    const root = result.nodes.get(result.rootId);
    expect(root?.depth).toBe(0);

    // →E has 2 premises at depth 1
    const premises = root!.premiseIds.map((pid) => result.nodes.get(pid)!);
    expect(premises.every((p) => p.depth === 1)).toBe(true);

    // →I premise (n2) should have n1 at depth 2
    const implIntroNode = premises.find((p) => p.ruleLabel === "→I [1]");
    expect(implIntroNode).toBeDefined();
    const deepPremise = result.nodes.get(implIntroNode!.premiseIds[0]!);
    expect(deepPremise?.depth).toBe(2);
  });

  it("IDがユニークである", () => {
    const nodes = [mkNode("n1", "φ"), mkNode("n2", "ψ"), mkNode("n3", "φ ∧ ψ")];
    const edges: readonly InferenceEdge[] = [
      {
        _tag: "nd-conjunction-intro",
        conclusionNodeId: "n3",
        leftPremiseNodeId: "n1",
        rightPremiseNodeId: "n2",
        conclusionText: "φ ∧ ψ",
      },
    ];
    const result = convertNdWorkspaceToProofTree(nodes, edges, "n3");

    const ids = [...result.nodes.keys()];
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("存在しないノードIDでも安全に動作する", () => {
    const nodes: readonly WorkspaceNode[] = [];
    const edges: readonly InferenceEdge[] = [];
    const result = convertNdWorkspaceToProofTree(nodes, edges, "nonexistent");

    expect(result.nodes.size).toBe(1);
    const root = result.nodes.get(result.rootId);
    expect(root?.ruleLabel).toBe("Asm");
    expect(root?.conclusionText).toBe("nonexistent"); // fallback to nodeId
  });

  it("循環参照がある場合安全に停止する", () => {
    // n1 →I→ n2, n2 →E(with n2)→ n1 — 循環
    const nodes = [mkNode("n1", "φ"), mkNode("n2", "φ → φ")];
    const edges: readonly InferenceEdge[] = [
      {
        _tag: "nd-implication-intro",
        conclusionNodeId: "n2",
        premiseNodeId: "n1",
        dischargedFormulaText: "φ",
        dischargedAssumptionId: 1,
        conclusionText: "φ → φ",
      },
      {
        _tag: "nd-implication-elim",
        conclusionNodeId: "n1",
        leftPremiseNodeId: "n2",
        rightPremiseNodeId: undefined,
        conclusionText: "φ",
      },
    ];
    // Should not throw or infinite loop
    const result = convertNdWorkspaceToProofTree(nodes, edges, "n1");

    // Should have nodes but terminate
    expect(result.nodes.size).toBeGreaterThan(0);
    // 循環ノードには "…" ラベル
    const circularNode = [...result.nodes.values()].find(
      (n) => n.ruleLabel === "…",
    );
    expect(circularNode).toBeDefined();
  });

  it("非NDエッジは無視される", () => {
    const nodes = [mkNode("n1", "φ"), mkNode("n2", "ψ")];
    const edges: readonly InferenceEdge[] = [
      {
        _tag: "mp",
        conclusionNodeId: "n2",
        leftPremiseNodeId: "n1",
        rightPremiseNodeId: undefined,
        conclusionText: "ψ",
      },
    ];
    const result = convertNdWorkspaceToProofTree(nodes, edges, "n2");

    // MP edge is not ND, so n2 is treated as assumption
    const root = result.nodes.get(result.rootId);
    expect(root?.ruleLabel).toBe("Asm");
  });
});

// ── convertNdWorkspaceToProofTreeAuto ─────────────────────

describe("convertNdWorkspaceToProofTreeAuto", () => {
  it("NDエッジがない場合nullを返す", () => {
    const nodes = [mkNode("n1", "φ")];
    const edges: readonly InferenceEdge[] = [];
    const result = convertNdWorkspaceToProofTreeAuto(nodes, edges);

    expect(result).toBeNull();
  });

  it("自動的にリーフノードをルートとして選択する", () => {
    const nodes = [mkNode("n1", "φ"), mkNode("n2", "φ → φ")];
    const edges: readonly InferenceEdge[] = [
      {
        _tag: "nd-implication-intro",
        conclusionNodeId: "n2",
        premiseNodeId: "n1",
        dischargedFormulaText: "φ",
        dischargedAssumptionId: 1,
        conclusionText: "φ → φ",
      },
    ];
    const result = convertNdWorkspaceToProofTreeAuto(nodes, edges);

    expect(result).not.toBeNull();
    const root = result!.nodes.get(result!.rootId);
    expect(root?.conclusionText).toBe("φ → φ");
    expect(root?.ruleLabel).toBe("→I [1]");
  });

  it("複数のリーフがある場合最初のものを選択する", () => {
    const nodes = [
      mkNode("n1", "φ"),
      mkNode("n2", "φ → φ"),
      mkNode("n3", "ψ"),
      mkNode("n4", "ψ → ψ"),
    ];
    const edges: readonly InferenceEdge[] = [
      {
        _tag: "nd-implication-intro",
        conclusionNodeId: "n2",
        premiseNodeId: "n1",
        dischargedFormulaText: "φ",
        dischargedAssumptionId: 1,
        conclusionText: "φ → φ",
      },
      {
        _tag: "nd-implication-intro",
        conclusionNodeId: "n4",
        premiseNodeId: "n3",
        dischargedFormulaText: "ψ",
        dischargedAssumptionId: 2,
        conclusionText: "ψ → ψ",
      },
    ];
    const result = convertNdWorkspaceToProofTreeAuto(nodes, edges);

    expect(result).not.toBeNull();
    // Should be one of the two leaf nodes
    const root = result!.nodes.get(result!.rootId);
    expect(root?.ruleLabel).toBe("→I [1]");
  });
});

// ── findNdProofTreeRoots ──────────────────────────────────

describe("findNdProofTreeRoots", () => {
  it("NDエッジがない場合空配列を返す", () => {
    const nodes = [mkNode("n1", "φ")];
    const edges: readonly InferenceEdge[] = [];
    const result = findNdProofTreeRoots(nodes, edges);

    expect(result).toEqual([]);
  });

  it("1つのリーフノードを検出する", () => {
    const nodes = [mkNode("n1", "φ"), mkNode("n2", "φ → φ")];
    const edges: readonly InferenceEdge[] = [
      {
        _tag: "nd-implication-intro",
        conclusionNodeId: "n2",
        premiseNodeId: "n1",
        dischargedFormulaText: "φ",
        dischargedAssumptionId: 1,
        conclusionText: "φ → φ",
      },
    ];
    const result = findNdProofTreeRoots(nodes, edges);

    expect(result).toEqual(["n2"]);
  });

  it("チェーンの末端ノードを検出する", () => {
    const nodes = [
      mkNode("n1", "φ"),
      mkNode("n2", "φ → φ"),
      mkNode("n3", "φ"),
      mkNode("n4", "φ"),
    ];
    const edges: readonly InferenceEdge[] = [
      {
        _tag: "nd-implication-intro",
        conclusionNodeId: "n2",
        premiseNodeId: "n1",
        dischargedFormulaText: "φ",
        dischargedAssumptionId: 1,
        conclusionText: "φ → φ",
      },
      {
        _tag: "nd-implication-elim",
        conclusionNodeId: "n4",
        leftPremiseNodeId: "n3",
        rightPremiseNodeId: "n2",
        conclusionText: "φ",
      },
    ];
    const result = findNdProofTreeRoots(nodes, edges);

    expect(result).toEqual(["n4"]);
  });

  it("複数の独立したリーフを検出する", () => {
    const nodes = [
      mkNode("n1", "φ"),
      mkNode("n2", "φ → φ"),
      mkNode("n3", "ψ"),
      mkNode("n4", "ψ → ψ"),
    ];
    const edges: readonly InferenceEdge[] = [
      {
        _tag: "nd-implication-intro",
        conclusionNodeId: "n2",
        premiseNodeId: "n1",
        dischargedFormulaText: "φ",
        dischargedAssumptionId: 1,
        conclusionText: "φ → φ",
      },
      {
        _tag: "nd-implication-intro",
        conclusionNodeId: "n4",
        premiseNodeId: "n3",
        dischargedFormulaText: "ψ",
        dischargedAssumptionId: 2,
        conclusionText: "ψ → ψ",
      },
    ];
    const result = findNdProofTreeRoots(nodes, edges);

    expect(result).toHaveLength(2);
    expect(result).toContain("n2");
    expect(result).toContain("n4");
  });
});

// ── computeProofTreeStats (ND経由) ──────────────────────────

describe("computeProofTreeStats (ND)", () => {
  it("仮定ノード1つの統計", () => {
    const nodes = [mkNode("n1", "φ")];
    const edges: readonly InferenceEdge[] = [
      {
        _tag: "nd-implication-intro",
        conclusionNodeId: "n1",
        premiseNodeId: undefined,
        dischargedFormulaText: "",
        dischargedAssumptionId: 0,
        conclusionText: "φ",
      },
    ];
    const data = convertNdWorkspaceToProofTree(nodes, edges, "n1");
    const stats = computeProofTreeStats(data);

    expect(stats.totalNodes).toBe(1);
    expect(stats.maxDepth).toBe(0);
  });

  it("複数規則の統計", () => {
    const nodes = [
      mkNode("n1", "φ"),
      mkNode("n2", "φ → φ"),
      mkNode("n3", "φ"),
      mkNode("n4", "φ"),
    ];
    const edges: readonly InferenceEdge[] = [
      {
        _tag: "nd-implication-intro",
        conclusionNodeId: "n2",
        premiseNodeId: "n1",
        dischargedFormulaText: "φ",
        dischargedAssumptionId: 1,
        conclusionText: "φ → φ",
      },
      {
        _tag: "nd-implication-elim",
        conclusionNodeId: "n4",
        leftPremiseNodeId: "n3",
        rightPremiseNodeId: "n2",
        conclusionText: "φ",
      },
    ];
    const data = convertNdWorkspaceToProofTree(nodes, edges, "n4");
    const stats = computeProofTreeStats(data);

    expect(stats.totalNodes).toBe(4);
    expect(stats.maxDepth).toBe(2);
    expect(stats.usedRules).toContain("→E");
    expect(stats.usedRules).toContain("→I [1]");
    expect(stats.usedRules).toContain("Asm");
  });
});

import { describe, expect, it } from "vitest";
import type { InferenceEdge } from "./inferenceEdge";
import type { WorkspaceNode } from "./workspaceState";
import {
  convertAtWorkspaceToTreeDisplay,
  convertAtWorkspaceToTreeDisplayAuto,
  findAtTreeRoots,
  computeAtTreeStats,
} from "./atProofTreeRendererLogic";

// --- ヘルパー ---

function mkNode(id: string, formulaText: string, x = 0, y = 0): WorkspaceNode {
  return {
    id,
    kind: "axiom",
    label: "",
    formulaText,
    position: { x, y },
  };
}

// --- テスト ---

describe("convertAtWorkspaceToTreeDisplay", () => {
  it("should create a single open leaf node when no edges", () => {
    const nodes = [mkNode("n1", "T:phi")];
    const edges: readonly InferenceEdge[] = [];
    const result = convertAtWorkspaceToTreeDisplay(nodes, edges, "n1");

    expect(result.nodes.size).toBe(1);
    const root = result.nodes.get(result.rootId);
    expect(root).toBeDefined();
    expect(root!.formulaText).toBe("T:phi");
    expect(root!.branchStatus).toBe("open");
    expect(root!.childIds).toEqual([]);
    expect(root!.depth).toBe(0);
  });

  it("should handle closure (at-closed) as closed branch", () => {
    const nodes = [mkNode("n1", "T:phi")];
    const edges: readonly InferenceEdge[] = [
      {
        _tag: "at-closed",
        ruleId: "closure",
        conclusionNodeId: "n1",
        contradictionNodeId: "n2",
        conclusionText: "T:phi",
      },
    ];
    const result = convertAtWorkspaceToTreeDisplay(nodes, edges, "n1");

    const root = result.nodes.get(result.rootId);
    expect(root).toBeDefined();
    expect(root!.branchStatus).toBe("closed");
    expect(root!.childIds).toEqual([]);
  });

  it("should handle alpha rule with one result", () => {
    const nodes = [mkNode("n1", "T:¬¬phi"), mkNode("n2", "T:phi")];
    const edges: readonly InferenceEdge[] = [
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
    ];
    const result = convertAtWorkspaceToTreeDisplay(nodes, edges, "n1");

    expect(result.nodes.size).toBe(2);
    const root = result.nodes.get(result.rootId);
    expect(root).toBeDefined();
    expect(root!.childIds.length).toBe(1);
    expect(root!.branchStatus).toBeUndefined();

    const child = result.nodes.get(root!.childIds[0]!);
    expect(child).toBeDefined();
    expect(child!.formulaText).toBe("T:phi");
    expect(child!.branchStatus).toBe("open");
  });

  it("should handle alpha rule with two results (same branch)", () => {
    const nodes = [
      mkNode("n1", "T:phi ∧ psi"),
      mkNode("n2", "T:phi"),
      mkNode("n3", "T:psi"),
    ];
    const edges: readonly InferenceEdge[] = [
      {
        _tag: "at-alpha",
        ruleId: "alpha-conj",
        conclusionNodeId: "n1",
        resultNodeId: "n2",
        secondResultNodeId: "n3",
        conclusionText: "T:phi ∧ psi",
        resultText: "T:phi",
        secondResultText: "T:psi",
      },
    ];
    const result = convertAtWorkspaceToTreeDisplay(nodes, edges, "n1");

    expect(result.nodes.size).toBe(3);
    const root = result.nodes.get(result.rootId);
    expect(root).toBeDefined();
    // α規則の2結論は同一枝上の子ノード（分岐ではない）
    expect(root!.childIds.length).toBe(2);
  });

  it("should handle beta rule (branching)", () => {
    const nodes = [
      mkNode("n1", "T:phi ∨ psi"),
      mkNode("n2", "T:phi"),
      mkNode("n3", "T:psi"),
    ];
    const edges: readonly InferenceEdge[] = [
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
    ];
    const result = convertAtWorkspaceToTreeDisplay(nodes, edges, "n1");

    expect(result.nodes.size).toBe(3);
    const root = result.nodes.get(result.rootId);
    expect(root).toBeDefined();
    expect(root!.childIds.length).toBe(2);
  });

  it("should handle gamma rule (universal quantifier)", () => {
    const nodes = [mkNode("n1", "T:(all x. P(x))"), mkNode("n2", "T:P(a)")];
    const edges: readonly InferenceEdge[] = [
      {
        _tag: "at-gamma",
        ruleId: "gamma-univ",
        conclusionNodeId: "n1",
        resultNodeId: "n2",
        conclusionText: "T:(all x. P(x))",
        resultText: "T:P(a)",
        termText: "a",
      },
    ];
    const result = convertAtWorkspaceToTreeDisplay(nodes, edges, "n1");

    expect(result.nodes.size).toBe(2);
    const root = result.nodes.get(result.rootId);
    expect(root).toBeDefined();
    expect(root!.childIds.length).toBe(1);
  });

  it("should handle delta rule (existential quantifier)", () => {
    const nodes = [mkNode("n1", "T:(ex x. P(x))"), mkNode("n2", "T:P(c)")];
    const edges: readonly InferenceEdge[] = [
      {
        _tag: "at-delta",
        ruleId: "delta-exist",
        conclusionNodeId: "n1",
        resultNodeId: "n2",
        conclusionText: "T:(ex x. P(x))",
        resultText: "T:P(c)",
        eigenVariable: "c",
      },
    ];
    const result = convertAtWorkspaceToTreeDisplay(nodes, edges, "n1");

    expect(result.nodes.size).toBe(2);
    const root = result.nodes.get(result.rootId);
    expect(root).toBeDefined();
    expect(root!.childIds.length).toBe(1);
  });

  it("should handle complete proof (all branches closed)", () => {
    const nodes = [
      mkNode("n1", "F:phi → phi"),
      mkNode("n2", "T:phi"),
      mkNode("n3", "F:phi"),
    ];
    const edges: readonly InferenceEdge[] = [
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
      // 注意: beta-impl は F(φ→ψ) → T(φ), F(ψ) だが、ここでは簡略テスト
      // n2 closed: T:phi は枝上に矛盾がある想定
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
    ];
    const result = convertAtWorkspaceToTreeDisplay(nodes, edges, "n1");

    expect(result.nodes.size).toBe(3);
    // Both leaves should be closed
    let closedCount = 0;
    for (const node of result.nodes.values()) {
      if (node.branchStatus === "closed") closedCount++;
    }
    expect(closedCount).toBe(2);
  });

  it("should ignore non-AT edges", () => {
    const nodes = [mkNode("n1", "T:phi")];
    const edges: readonly InferenceEdge[] = [
      {
        _tag: "tab-axiom",
        ruleId: "bs",
        conclusionNodeId: "n1",
        conclusionText: "¬P, P",
      },
    ];
    const result = convertAtWorkspaceToTreeDisplay(nodes, edges, "n1");
    const root = result.nodes.get(result.rootId);
    expect(root).toBeDefined();
    expect(root!.branchStatus).toBe("open");
  });

  it("should handle circular references without infinite loop", () => {
    const nodes = [mkNode("n1", "T:phi"), mkNode("n2", "T:psi")];
    const edges: readonly InferenceEdge[] = [
      {
        _tag: "at-alpha",
        ruleId: "alpha-neg-t",
        conclusionNodeId: "n1",
        resultNodeId: "n2",
        secondResultNodeId: undefined,
        conclusionText: "T:phi",
        resultText: "T:psi",
        secondResultText: undefined,
      },
      {
        _tag: "at-alpha",
        ruleId: "alpha-neg-t",
        conclusionNodeId: "n2",
        resultNodeId: "n1",
        secondResultNodeId: undefined,
        conclusionText: "T:psi",
        resultText: "T:phi",
        secondResultText: undefined,
      },
    ];
    // Should not throw / infinite loop
    const result = convertAtWorkspaceToTreeDisplay(nodes, edges, "n1");
    expect(result.nodes.size).toBeGreaterThanOrEqual(2);
  });
});

describe("convertAtWorkspaceToTreeDisplayAuto", () => {
  it("should return null when no AT edges exist", () => {
    const nodes = [mkNode("n1", "T:phi")];
    const result = convertAtWorkspaceToTreeDisplayAuto(nodes, []);
    expect(result).toBeNull();
  });

  it("should auto-detect root and build tree", () => {
    const nodes = [mkNode("n1", "T:phi"), mkNode("n2", "T:psi")];
    const edges: readonly InferenceEdge[] = [
      {
        _tag: "at-alpha",
        ruleId: "alpha-double-neg-t",
        conclusionNodeId: "n1",
        resultNodeId: "n2",
        secondResultNodeId: undefined,
        conclusionText: "T:phi",
        resultText: "T:psi",
        secondResultText: undefined,
      },
    ];
    const result = convertAtWorkspaceToTreeDisplayAuto(nodes, edges);
    expect(result).not.toBeNull();
    expect(result!.nodes.size).toBe(2);
  });
});

describe("findAtTreeRoots", () => {
  it("should find root nodes", () => {
    const nodes = [
      mkNode("n1", "T:phi"),
      mkNode("n2", "T:psi"),
      mkNode("n3", "T:chi"),
    ];
    const edges: readonly InferenceEdge[] = [
      {
        _tag: "at-alpha",
        ruleId: "alpha-double-neg-t",
        conclusionNodeId: "n1",
        resultNodeId: "n2",
        secondResultNodeId: undefined,
        conclusionText: "T:phi",
        resultText: "T:psi",
        secondResultText: undefined,
      },
      {
        _tag: "at-alpha",
        ruleId: "alpha-double-neg-t",
        conclusionNodeId: "n2",
        resultNodeId: "n3",
        secondResultNodeId: undefined,
        conclusionText: "T:psi",
        resultText: "T:chi",
        secondResultText: undefined,
      },
    ];
    const roots = findAtTreeRoots(nodes, edges);
    expect(roots).toEqual(["n1"]);
  });

  it("should return empty array when no AT edges", () => {
    const roots = findAtTreeRoots([mkNode("n1", "T:phi")], []);
    expect(roots).toEqual([]);
  });
});

describe("computeAtTreeStats", () => {
  it("should compute statistics for a tree", () => {
    const nodes = [
      mkNode("n1", "F:phi → phi"),
      mkNode("n2", "T:phi"),
      mkNode("n3", "F:phi"),
    ];
    const edges: readonly InferenceEdge[] = [
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
    ];
    const result = convertAtWorkspaceToTreeDisplay(nodes, edges, "n1");
    const stats = computeAtTreeStats(result);

    expect(stats.totalNodes).toBe(3);
    expect(stats.maxDepth).toBe(1);
    expect(stats.closedBranches).toBe(2);
    expect(stats.openBranches).toBe(0);
  });

  it("should include used rules", () => {
    const nodes = [mkNode("n1", "T:¬¬phi"), mkNode("n2", "T:phi")];
    const edges: readonly InferenceEdge[] = [
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
    ];
    const result = convertAtWorkspaceToTreeDisplay(nodes, edges, "n1");
    const stats = computeAtTreeStats(result);
    expect(stats.usedRules.length).toBeGreaterThan(0);
  });
});

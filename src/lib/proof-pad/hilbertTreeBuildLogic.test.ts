import { describe, it, expect } from "vitest";
import { Either } from "effect";
import {
  findHilbertRootNodeIds,
  buildHilbertProofTree,
} from "./hilbertTreeBuildLogic";
import type { WorkspaceNode } from "./workspaceState";
import type { InferenceEdge, MPEdge, GenEdge } from "./inferenceEdge";

// ── ヘルパー ──────────────────────────────────────────────

const mkNode = (id: string, formulaText: string): WorkspaceNode => ({
  id,
  kind: "axiom",
  label: "",
  formulaText,
  position: { x: 0, y: 0 },
});

describe("findHilbertRootNodeIds", () => {
  it("Hilbert エッジがない場合は空配列を返す", () => {
    const nodes = [mkNode("n1", "φ")];
    expect(findHilbertRootNodeIds(nodes, [])).toEqual([]);
  });

  it("MP エッジの結論ノードがルートになる", () => {
    const nodes = [mkNode("n1", "φ"), mkNode("n2", "φ → ψ"), mkNode("n3", "ψ")];
    const edges: readonly InferenceEdge[] = [
      {
        _tag: "mp",
        conclusionNodeId: "n3",
        leftPremiseNodeId: "n1",
        rightPremiseNodeId: "n2",
        conclusionText: "ψ",
      },
    ];
    expect(findHilbertRootNodeIds(nodes, edges)).toEqual(["n3"]);
  });

  it("チェーンMPで最終結論のみがルート", () => {
    const nodes = [
      mkNode("n1", "φ"),
      mkNode("n2", "φ → ψ"),
      mkNode("n3", "ψ"),
      mkNode("n4", "ψ → χ"),
      mkNode("n5", "χ"),
    ];
    const edges: readonly InferenceEdge[] = [
      {
        _tag: "mp",
        conclusionNodeId: "n3",
        leftPremiseNodeId: "n1",
        rightPremiseNodeId: "n2",
        conclusionText: "ψ",
      },
      {
        _tag: "mp",
        conclusionNodeId: "n5",
        leftPremiseNodeId: "n3",
        rightPremiseNodeId: "n4",
        conclusionText: "χ",
      },
    ];
    expect(findHilbertRootNodeIds(nodes, edges)).toEqual(["n5"]);
  });

  it("Gen エッジのルート検出", () => {
    const nodes = [mkNode("n1", "P(x)"), mkNode("n2", "∀x. P(x)")];
    const edges: readonly InferenceEdge[] = [
      {
        _tag: "gen",
        conclusionNodeId: "n2",
        premiseNodeId: "n1",
        variableName: "x",
        conclusionText: "∀x. P(x)",
      },
    ];
    expect(findHilbertRootNodeIds(nodes, edges)).toEqual(["n2"]);
  });
});

describe("buildHilbertProofTree", () => {
  it("葉ノードからAxiomNodeを構築する", () => {
    const nodes = [mkNode("n1", "φ → (ψ → φ)")];
    const result = buildHilbertProofTree("n1", nodes, []);

    expect(Either.isRight(result)).toBe(true);
    if (!Either.isRight(result)) return;

    expect(result.right._tag).toBe("AxiomNode");
    expect(result.right.formula._tag).toBe("Implication");
  });

  it("MPエッジからModusPonensNodeを構築する", () => {
    const nodes = [mkNode("n1", "φ"), mkNode("n2", "φ → ψ"), mkNode("n3", "ψ")];
    const edges: readonly InferenceEdge[] = [
      {
        _tag: "mp",
        conclusionNodeId: "n3",
        leftPremiseNodeId: "n1",
        rightPremiseNodeId: "n2",
        conclusionText: "ψ",
      } satisfies MPEdge,
    ];
    const result = buildHilbertProofTree("n3", nodes, edges);

    expect(Either.isRight(result)).toBe(true);
    if (!Either.isRight(result)) return;

    expect(result.right._tag).toBe("ModusPonensNode");
    if (result.right._tag !== "ModusPonensNode") return;
    expect(result.right.antecedent._tag).toBe("AxiomNode");
    expect(result.right.conditional._tag).toBe("AxiomNode");
  });

  it("GenエッジからGeneralizationNodeを構築する", () => {
    const nodes = [mkNode("n1", "P(x)"), mkNode("n2", "∀x. P(x)")];
    const edges: readonly InferenceEdge[] = [
      {
        _tag: "gen",
        conclusionNodeId: "n2",
        premiseNodeId: "n1",
        variableName: "x",
        conclusionText: "∀x. P(x)",
      } satisfies GenEdge,
    ];
    const result = buildHilbertProofTree("n2", nodes, edges);

    expect(Either.isRight(result)).toBe(true);
    if (!Either.isRight(result)) return;

    expect(result.right._tag).toBe("GeneralizationNode");
    if (result.right._tag !== "GeneralizationNode") return;
    expect(result.right.variable.name).toBe("x");
    expect(result.right.premise._tag).toBe("AxiomNode");
  });

  it("存在しないノードIDでエラーを返す", () => {
    const result = buildHilbertProofTree("n999", [], []);

    expect(Either.isLeft(result)).toBe(true);
    if (!Either.isLeft(result)) return;
    expect(result.left._tag).toBe("HilbertTreeNodeNotFound");
  });

  it("パース失敗でエラーを返す", () => {
    const nodes = [mkNode("n1", "invalid formula !!!!")];
    const result = buildHilbertProofTree("n1", nodes, []);

    expect(Either.isLeft(result)).toBe(true);
    if (!Either.isLeft(result)) return;
    expect(result.left._tag).toBe("HilbertTreeFormulaParseError");
  });

  it("不完全なMPエッジでエラーを返す", () => {
    const nodes = [mkNode("n1", "φ"), mkNode("n3", "ψ")];
    const edges: readonly InferenceEdge[] = [
      {
        _tag: "mp",
        conclusionNodeId: "n3",
        leftPremiseNodeId: "n1",
        rightPremiseNodeId: undefined,
        conclusionText: "ψ",
      } satisfies MPEdge,
    ];
    const result = buildHilbertProofTree("n3", nodes, edges);

    expect(Either.isLeft(result)).toBe(true);
    if (!Either.isLeft(result)) return;
    expect(result.left._tag).toBe("HilbertTreeIncompleteProof");
  });

  it("不完全なGenエッジでエラーを返す", () => {
    const nodes = [mkNode("n2", "∀x. P(x)")];
    const edges: readonly InferenceEdge[] = [
      {
        _tag: "gen",
        conclusionNodeId: "n2",
        premiseNodeId: undefined,
        variableName: "x",
        conclusionText: "∀x. P(x)",
      } satisfies GenEdge,
    ];
    const result = buildHilbertProofTree("n2", nodes, edges);

    expect(Either.isLeft(result)).toBe(true);
    if (!Either.isLeft(result)) return;
    expect(result.left._tag).toBe("HilbertTreeIncompleteProof");
  });

  it("SubstitutionエッジはAxiomNodeとして扱う", () => {
    const nodes = [
      mkNode("n1", "φ → (ψ → φ)"),
      mkNode("n2", "P(x) → (Q(y) → P(x))"),
    ];
    const edges: readonly InferenceEdge[] = [
      {
        _tag: "substitution",
        conclusionNodeId: "n2",
        premiseNodeId: "n1",
        entries: [],
        conclusionText: "P(x) → (Q(y) → P(x))",
      },
    ];
    const result = buildHilbertProofTree("n2", nodes, edges);

    expect(Either.isRight(result)).toBe(true);
    if (!Either.isRight(result)) return;
    // Substitution結果はAxiomNode（公理インスタンス）として扱われる
    expect(result.right._tag).toBe("AxiomNode");
  });

  it("チェーンMP証明木を正しく構築する", () => {
    const nodes = [
      mkNode("n1", "φ"),
      mkNode("n2", "φ → ψ"),
      mkNode("n3", "ψ"),
      mkNode("n4", "ψ → χ"),
      mkNode("n5", "χ"),
    ];
    const edges: readonly InferenceEdge[] = [
      {
        _tag: "mp",
        conclusionNodeId: "n3",
        leftPremiseNodeId: "n1",
        rightPremiseNodeId: "n2",
        conclusionText: "ψ",
      } satisfies MPEdge,
      {
        _tag: "mp",
        conclusionNodeId: "n5",
        leftPremiseNodeId: "n3",
        rightPremiseNodeId: "n4",
        conclusionText: "χ",
      } satisfies MPEdge,
    ];
    const result = buildHilbertProofTree("n5", nodes, edges);

    expect(Either.isRight(result)).toBe(true);
    if (!Either.isRight(result)) return;

    expect(result.right._tag).toBe("ModusPonensNode");
    if (result.right._tag !== "ModusPonensNode") return;
    // 左前提はMP結果
    expect(result.right.antecedent._tag).toBe("ModusPonensNode");
    // 右前提はAxiom
    expect(result.right.conditional._tag).toBe("AxiomNode");
  });
});

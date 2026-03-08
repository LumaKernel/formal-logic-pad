/**
 * scTreeBuildLogic のテスト。
 *
 * ワークスペースグラフから ScProofNode ツリーを構築するロジックを検証する。
 */

import { describe, expect, it } from "vitest";
import { Either } from "effect";
import type { Formula } from "../logic-core/formula";
import { MetaVariable } from "../logic-core/formula";
import type {
  ScAxiomEdge,
  ScSinglePremiseEdge,
  ScBranchingEdge,
  InferenceEdge,
} from "./inferenceEdge";
import type { WorkspaceNode } from "./workspaceState";
import {
  buildScProofTree,
  findScRootNodeIds,
  recoverWeakenedFormula,
  recoverContractedFormula,
  recoverCutFormula,
} from "./scTreeBuildLogic";

// ── テストヘルパー ──────────────────────────────────────────

const phi: Formula = new MetaVariable({ name: "φ" });
const psi: Formula = new MetaVariable({ name: "ψ" });

function makeNode(
  id: string,
  formulaText: string,
  kind: "axiom" | "conclusion" = "axiom",
): WorkspaceNode {
  return {
    id,
    kind,
    label: "",
    formulaText,
    position: { x: 0, y: 0 },
  };
}

// ── recoverWeakenedFormula ────────────────────────────────────

describe("recoverWeakenedFormula", () => {
  it("1つの論理式が追加された場合に復元できる", () => {
    const conclusion = [phi, psi]; // phi は弱化で追加
    const premise = [psi];
    const result = recoverWeakenedFormula(conclusion, premise);
    expect(result).not.toBeUndefined();
    expect(result?._tag).toBe("MetaVariable");
    expect((result as typeof phi).name).toBe("φ");
  });

  it("末尾に追加された場合にも復元できる", () => {
    const conclusion = [phi, psi]; // psi は弱化で追加
    const premise = [phi];
    const result = recoverWeakenedFormula(conclusion, premise);
    expect(result).not.toBeUndefined();
    expect((result as typeof psi).name).toBe("ψ");
  });

  it("サイズが合わない場合はundefinedを返す", () => {
    expect(recoverWeakenedFormula([phi], [phi])).toBeUndefined();
    expect(recoverWeakenedFormula([], [phi])).toBeUndefined();
  });

  it("空の前提からの弱化", () => {
    const result = recoverWeakenedFormula([phi], []);
    expect(result).not.toBeUndefined();
    expect((result as typeof phi).name).toBe("φ");
  });
});

// ── recoverContractedFormula ─────────────────────────────────

describe("recoverContractedFormula", () => {
  it("重複した論理式が除かれた場合に復元できる", () => {
    const conclusion = [phi]; // phi が1つ残る
    const premise = [phi, phi]; // phi が2つ
    const result = recoverContractedFormula(conclusion, premise);
    expect(result).not.toBeUndefined();
    expect((result as typeof phi).name).toBe("φ");
  });

  it("サイズが合わない場合はundefinedを返す", () => {
    expect(recoverContractedFormula([phi], [phi])).toBeUndefined();
    expect(recoverContractedFormula([phi, psi], [phi])).toBeUndefined();
  });

  it("サイズは合うが論理式が一致しない場合はundefinedを返す", () => {
    // 前提 [phi, psi] から1つ除いても結論 [phi] と一致しない
    // phi, psi → 除いてpsiだけ残す → phiとは不一致
    // phi, psi → 除いてphiだけ残す → phiと一致するので実はマッチする
    // より確実なケース: 結論と前提で全く異なる論理式
    const chi: Formula = new MetaVariable({ name: "χ" });
    expect(recoverContractedFormula([chi], [phi, psi])).toBeUndefined();
  });
});

// ── recoverCutFormula ────────────────────────────────────────

describe("recoverCutFormula", () => {
  it("左前提テキストの唯一のsuccedentを返す", () => {
    const result = recoverCutFormula("⇒ phi");
    expect(result).not.toBeUndefined();
    expect(result?._tag).toBe("MetaVariable");
  });

  it("succedentが複数ある場合はundefinedを返す", () => {
    expect(recoverCutFormula("⇒ phi, psi")).toBeUndefined();
  });

  it("パースに失敗する場合はundefinedを返す", () => {
    expect(recoverCutFormula("invalid %%")).toBeUndefined();
  });

  it("空のテキストはundefinedを返す", () => {
    expect(recoverCutFormula("")).toBeUndefined();
  });
});

// ── findScRootNodeIds ────────────────────────────────────────

describe("findScRootNodeIds", () => {
  it("SCエッジがない場合は空配列を返す", () => {
    const nodes = [makeNode("n1", "phi ⇒ phi")];
    expect(findScRootNodeIds(nodes, [])).toEqual([]);
  });

  it("単一の公理ノードをルートとして返す", () => {
    const nodes = [makeNode("n1", "phi ⇒ phi")];
    const edges: InferenceEdge[] = [
      {
        _tag: "sc-axiom",
        ruleId: "identity",
        conclusionNodeId: "n1",
        conclusionText: "phi ⇒ phi",
      } satisfies ScAxiomEdge,
    ];
    expect(findScRootNodeIds(nodes, edges)).toEqual(["n1"]);
  });

  it("前提として参照されているノードはルートにならない", () => {
    const nodes = [makeNode("n1", "phi ⇒ phi"), makeNode("n2", "⇒ phi")];
    const edges: InferenceEdge[] = [
      {
        _tag: "sc-axiom",
        ruleId: "identity",
        conclusionNodeId: "n2",
        conclusionText: "phi ⇒ phi",
      } satisfies ScAxiomEdge,
      {
        _tag: "sc-single",
        ruleId: "weakening-left",
        conclusionNodeId: "n1",
        premiseNodeId: "n2",
        conclusionText: "phi ⇒ phi",
      } satisfies ScSinglePremiseEdge,
    ];
    expect(findScRootNodeIds(nodes, edges)).toEqual(["n1"]);
  });

  it("非SCエッジは無視する", () => {
    const nodes = [makeNode("n1", "phi ⇒ phi")];
    const edges: InferenceEdge[] = [
      {
        _tag: "mp",
        conclusionNodeId: "n1",
        leftPremiseNodeId: "p1",
        rightPremiseNodeId: "p2",
        conclusionText: "",
      },
    ];
    expect(findScRootNodeIds(nodes, edges)).toEqual([]);
  });

  it("分岐エッジの前提ノードはルートにならない", () => {
    const nodes = [
      makeNode("n1", "⇒ ψ"),
      makeNode("n2", "⇒ φ"),
      makeNode("n3", "φ ⇒ ψ"),
    ];
    const edges: InferenceEdge[] = [
      {
        _tag: "sc-axiom",
        ruleId: "identity",
        conclusionNodeId: "n2",
        conclusionText: "⇒ φ",
      } satisfies ScAxiomEdge,
      {
        _tag: "sc-axiom",
        ruleId: "identity",
        conclusionNodeId: "n3",
        conclusionText: "φ ⇒ ψ",
      } satisfies ScAxiomEdge,
      {
        _tag: "sc-branching",
        ruleId: "cut",
        conclusionNodeId: "n1",
        leftPremiseNodeId: "n2",
        rightPremiseNodeId: "n3",
        leftConclusionText: "⇒ φ",
        rightConclusionText: "φ ⇒ ψ",
        conclusionText: "⇒ ψ",
      } satisfies ScBranchingEdge,
    ];
    // n1がルート、n2・n3は前提として参照されるのでルートではない
    expect(findScRootNodeIds(nodes, edges)).toEqual(["n1"]);
  });

  it("分岐エッジの前提がundefinedの場合も正しく処理する", () => {
    const nodes = [makeNode("n1", "⇒ ψ")];
    const edges: InferenceEdge[] = [
      {
        _tag: "sc-branching",
        ruleId: "cut",
        conclusionNodeId: "n1",
        leftPremiseNodeId: undefined,
        rightPremiseNodeId: undefined,
        leftConclusionText: "⇒ φ",
        rightConclusionText: "φ ⇒ ψ",
        conclusionText: "⇒ ψ",
      } satisfies ScBranchingEdge,
    ];
    expect(findScRootNodeIds(nodes, edges)).toEqual(["n1"]);
  });
});

// ── buildScProofTree ─────────────────────────────────────────

describe("buildScProofTree", () => {
  describe("公理ノード", () => {
    it("identity公理を構築できる", () => {
      const nodes = [makeNode("n1", "φ ⇒ φ")];
      const edges: InferenceEdge[] = [
        {
          _tag: "sc-axiom",
          ruleId: "identity",
          conclusionNodeId: "n1",
          conclusionText: "φ ⇒ φ",
        } satisfies ScAxiomEdge,
      ];
      const result = buildScProofTree("n1", nodes, edges);
      expect(Either.isRight(result)).toBe(true);
      if (Either.isRight(result)) {
        expect(result.right._tag).toBe("ScIdentity");
        expect(result.right.conclusion.antecedents).toHaveLength(1);
        expect(result.right.conclusion.succedents).toHaveLength(1);
      }
    });

    it("bottom-left公理を構築できる", () => {
      const nodes = [makeNode("n1", "⊥ ⇒")];
      const edges: InferenceEdge[] = [
        {
          _tag: "sc-axiom",
          ruleId: "bottom-left",
          conclusionNodeId: "n1",
          conclusionText: "⊥ ⇒",
        } satisfies ScAxiomEdge,
      ];
      const result = buildScProofTree("n1", nodes, edges);
      expect(Either.isRight(result)).toBe(true);
      if (Either.isRight(result)) {
        expect(result.right._tag).toBe("ScBottomLeft");
      }
    });
  });

  describe("1前提規則", () => {
    it("implication-rightを構築できる", () => {
      const nodes = [makeNode("n1", "⇒ φ → ψ"), makeNode("n2", "φ ⇒ ψ")];
      const edges: InferenceEdge[] = [
        {
          _tag: "sc-axiom",
          ruleId: "identity",
          conclusionNodeId: "n2",
          conclusionText: "φ ⇒ ψ",
        } satisfies ScAxiomEdge,
        {
          _tag: "sc-single",
          ruleId: "implication-right",
          conclusionNodeId: "n1",
          premiseNodeId: "n2",
          conclusionText: "⇒ φ → ψ",
        } satisfies ScSinglePremiseEdge,
      ];
      const result = buildScProofTree("n1", nodes, edges);
      expect(Either.isRight(result)).toBe(true);
      if (Either.isRight(result)) {
        expect(result.right._tag).toBe("ScImplicationRight");
      }
    });

    it("weakening-leftを構築できる（論理式復元）", () => {
      const nodes = [makeNode("n1", "φ, ψ ⇒ ψ"), makeNode("n2", "ψ ⇒ ψ")];
      const edges: InferenceEdge[] = [
        {
          _tag: "sc-axiom",
          ruleId: "identity",
          conclusionNodeId: "n2",
          conclusionText: "ψ ⇒ ψ",
        } satisfies ScAxiomEdge,
        {
          _tag: "sc-single",
          ruleId: "weakening-left",
          conclusionNodeId: "n1",
          premiseNodeId: "n2",
          conclusionText: "φ, ψ ⇒ ψ",
        } satisfies ScSinglePremiseEdge,
      ];
      const result = buildScProofTree("n1", nodes, edges);
      expect(Either.isRight(result)).toBe(true);
      if (Either.isRight(result)) {
        expect(result.right._tag).toBe("ScWeakeningLeft");
        if (result.right._tag === "ScWeakeningLeft") {
          expect(result.right.weakenedFormula._tag).toBe("MetaVariable");
        }
      }
    });

    it("exchange-leftを構築できる（位置パラメータ使用）", () => {
      const nodes = [makeNode("n1", "ψ, φ ⇒ χ"), makeNode("n2", "φ, ψ ⇒ χ")];
      const edges: InferenceEdge[] = [
        {
          _tag: "sc-axiom",
          ruleId: "identity",
          conclusionNodeId: "n2",
          conclusionText: "φ, ψ ⇒ χ",
        } satisfies ScAxiomEdge,
        {
          _tag: "sc-single",
          ruleId: "exchange-left",
          conclusionNodeId: "n1",
          premiseNodeId: "n2",
          conclusionText: "ψ, φ ⇒ χ",
          exchangePosition: 0,
        } satisfies ScSinglePremiseEdge,
      ];
      const result = buildScProofTree("n1", nodes, edges);
      expect(Either.isRight(result)).toBe(true);
      if (Either.isRight(result)) {
        expect(result.right._tag).toBe("ScExchangeLeft");
        if (result.right._tag === "ScExchangeLeft") {
          expect(result.right.position).toBe(0);
        }
      }
    });

    it("conjunction-leftを構築できる（componentIndex使用）", () => {
      const nodes = [makeNode("n1", "φ ∧ ψ ⇒ χ"), makeNode("n2", "φ ⇒ χ")];
      const edges: InferenceEdge[] = [
        {
          _tag: "sc-axiom",
          ruleId: "identity",
          conclusionNodeId: "n2",
          conclusionText: "φ ⇒ χ",
        } satisfies ScAxiomEdge,
        {
          _tag: "sc-single",
          ruleId: "conjunction-left",
          conclusionNodeId: "n1",
          premiseNodeId: "n2",
          conclusionText: "φ ∧ ψ ⇒ χ",
          componentIndex: 1,
        } satisfies ScSinglePremiseEdge,
      ];
      const result = buildScProofTree("n1", nodes, edges);
      expect(Either.isRight(result)).toBe(true);
      if (Either.isRight(result)) {
        expect(result.right._tag).toBe("ScConjunctionLeft");
        if (result.right._tag === "ScConjunctionLeft") {
          expect(result.right.componentIndex).toBe(1);
        }
      }
    });

    it("contraction-leftを構築できる（論理式復元）", () => {
      const nodes = [makeNode("n1", "φ ⇒ ψ"), makeNode("n2", "φ, φ ⇒ ψ")];
      const edges: InferenceEdge[] = [
        {
          _tag: "sc-axiom",
          ruleId: "identity",
          conclusionNodeId: "n2",
          conclusionText: "φ, φ ⇒ ψ",
        } satisfies ScAxiomEdge,
        {
          _tag: "sc-single",
          ruleId: "contraction-left",
          conclusionNodeId: "n1",
          premiseNodeId: "n2",
          conclusionText: "φ ⇒ ψ",
        } satisfies ScSinglePremiseEdge,
      ];
      const result = buildScProofTree("n1", nodes, edges);
      expect(Either.isRight(result)).toBe(true);
      if (Either.isRight(result)) {
        expect(result.right._tag).toBe("ScContractionLeft");
      }
    });
  });

  describe("2前提（分岐）規則", () => {
    it("cutを構築できる（カット式復元）", () => {
      const nodes = [
        makeNode("n1", "⇒ ψ"),
        makeNode("n2", "⇒ φ"),
        makeNode("n3", "φ ⇒ ψ"),
      ];
      const edges: InferenceEdge[] = [
        {
          _tag: "sc-axiom",
          ruleId: "identity",
          conclusionNodeId: "n2",
          conclusionText: "⇒ φ",
        } satisfies ScAxiomEdge,
        {
          _tag: "sc-axiom",
          ruleId: "identity",
          conclusionNodeId: "n3",
          conclusionText: "φ ⇒ ψ",
        } satisfies ScAxiomEdge,
        {
          _tag: "sc-branching",
          ruleId: "cut",
          conclusionNodeId: "n1",
          leftPremiseNodeId: "n2",
          rightPremiseNodeId: "n3",
          leftConclusionText: "⇒ φ",
          rightConclusionText: "φ ⇒ ψ",
          conclusionText: "⇒ ψ",
        } satisfies ScBranchingEdge,
      ];
      const result = buildScProofTree("n1", nodes, edges);
      expect(Either.isRight(result)).toBe(true);
      if (Either.isRight(result)) {
        expect(result.right._tag).toBe("ScCut");
        if (result.right._tag === "ScCut") {
          expect(result.right.cutFormula._tag).toBe("MetaVariable");
        }
      }
    });

    it("implication-leftを構築できる", () => {
      const nodes = [
        makeNode("n1", "φ → ψ ⇒ χ"),
        makeNode("n2", "⇒ φ"),
        makeNode("n3", "ψ ⇒ χ"),
      ];
      const edges: InferenceEdge[] = [
        {
          _tag: "sc-axiom",
          ruleId: "identity",
          conclusionNodeId: "n2",
          conclusionText: "⇒ φ",
        } satisfies ScAxiomEdge,
        {
          _tag: "sc-axiom",
          ruleId: "identity",
          conclusionNodeId: "n3",
          conclusionText: "ψ ⇒ χ",
        } satisfies ScAxiomEdge,
        {
          _tag: "sc-branching",
          ruleId: "implication-left",
          conclusionNodeId: "n1",
          leftPremiseNodeId: "n2",
          rightPremiseNodeId: "n3",
          leftConclusionText: "⇒ φ",
          rightConclusionText: "ψ ⇒ χ",
          conclusionText: "φ → ψ ⇒ χ",
        } satisfies ScBranchingEdge,
      ];
      const result = buildScProofTree("n1", nodes, edges);
      expect(Either.isRight(result)).toBe(true);
      if (Either.isRight(result)) {
        expect(result.right._tag).toBe("ScImplicationLeft");
      }
    });
  });

  describe("エラーハンドリング", () => {
    it("ノードが存在しない場合はエラーを返す", () => {
      const result = buildScProofTree("nonexistent", [], []);
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("ScTreeNodeNotFound");
      }
    });

    it("エッジがないノードはIncompleteProofエラーを返す", () => {
      const nodes = [makeNode("n1", "φ ⇒ φ")];
      const result = buildScProofTree("n1", nodes, []);
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("ScTreeIncompleteProof");
      }
    });

    it("前提が未接続の場合はIncompleteProofエラーを返す", () => {
      const nodes = [makeNode("n1", "φ ⇒ φ")];
      const edges: InferenceEdge[] = [
        {
          _tag: "sc-single",
          ruleId: "weakening-left",
          conclusionNodeId: "n1",
          premiseNodeId: undefined,
          conclusionText: "φ ⇒ φ",
        } satisfies ScSinglePremiseEdge,
      ];
      const result = buildScProofTree("n1", nodes, edges);
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("ScTreeIncompleteProof");
      }
    });

    it("分岐規則で左前提が未接続の場合はIncompleteProofエラー", () => {
      const nodes = [makeNode("n1", "⇒ ψ")];
      const edges: InferenceEdge[] = [
        {
          _tag: "sc-branching",
          ruleId: "cut",
          conclusionNodeId: "n1",
          leftPremiseNodeId: undefined,
          rightPremiseNodeId: "n2",
          leftConclusionText: "⇒ φ",
          rightConclusionText: "φ ⇒ ψ",
          conclusionText: "⇒ ψ",
        } satisfies ScBranchingEdge,
      ];
      const result = buildScProofTree("n1", nodes, edges);
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("ScTreeIncompleteProof");
      }
    });

    it("シーケントパースエラーの場合はSequentParseErrorを返す", () => {
      const nodes = [makeNode("n1", "invalid %%")];
      const edges: InferenceEdge[] = [
        {
          _tag: "sc-axiom",
          ruleId: "identity",
          conclusionNodeId: "n1",
          conclusionText: "invalid %%",
        } satisfies ScAxiomEdge,
      ];
      const result = buildScProofTree("n1", nodes, edges);
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("ScTreeSequentParseError");
      }
    });
  });

  describe("複合的な証明ツリー", () => {
    it("2段階の証明（identity → weakening → conclusion）を構築できる", () => {
      const nodes = [makeNode("root", "φ, ψ ⇒ ψ"), makeNode("mid", "ψ ⇒ ψ")];
      const edges: InferenceEdge[] = [
        {
          _tag: "sc-axiom",
          ruleId: "identity",
          conclusionNodeId: "mid",
          conclusionText: "ψ ⇒ ψ",
        } satisfies ScAxiomEdge,
        {
          _tag: "sc-single",
          ruleId: "weakening-left",
          conclusionNodeId: "root",
          premiseNodeId: "mid",
          conclusionText: "φ, ψ ⇒ ψ",
        } satisfies ScSinglePremiseEdge,
      ];
      const result = buildScProofTree("root", nodes, edges);
      expect(Either.isRight(result)).toBe(true);
      if (Either.isRight(result)) {
        const tree = result.right;
        expect(tree._tag).toBe("ScWeakeningLeft");
        if (tree._tag === "ScWeakeningLeft") {
          expect(tree.premise._tag).toBe("ScIdentity");
        }
      }
    });

    it("カット除去ステッパーに渡せるカット入り証明を構築できる", () => {
      // φ ⇒ φ (identity)   φ ⇒ φ (identity)
      // ────────────────────────────────── (cut, cutFormula=φ)
      //                  ⇒ φ             ... wait, this doesn't work
      // Let's use a simpler cut:
      // ⇒ φ (identity-like)   φ ⇒ φ (identity)
      // ──────────────────────────────────────── (cut)
      //                ⇒ φ

      // Actually, for a valid cut with identity premises:
      // φ ⇒ φ (identity, left premise)
      // φ ⇒ φ (identity, right premise)
      // ───────────────────────────────── (cut, cutFormula = φ)
      // φ ⇒ φ (conclusion)
      const nodes = [
        makeNode("root", "φ ⇒ φ"),
        makeNode("left", "φ ⇒ φ"),
        makeNode("right", "φ ⇒ φ"),
      ];
      const edges: InferenceEdge[] = [
        {
          _tag: "sc-axiom",
          ruleId: "identity",
          conclusionNodeId: "left",
          conclusionText: "φ ⇒ φ",
        } satisfies ScAxiomEdge,
        {
          _tag: "sc-axiom",
          ruleId: "identity",
          conclusionNodeId: "right",
          conclusionText: "φ ⇒ φ",
        } satisfies ScAxiomEdge,
        {
          _tag: "sc-branching",
          ruleId: "cut",
          conclusionNodeId: "root",
          leftPremiseNodeId: "left",
          rightPremiseNodeId: "right",
          leftConclusionText: "φ ⇒ φ",
          rightConclusionText: "φ ⇒ φ",
          conclusionText: "φ ⇒ φ",
        } satisfies ScBranchingEdge,
      ];
      const result = buildScProofTree("root", nodes, edges);
      expect(Either.isRight(result)).toBe(true);
      if (Either.isRight(result)) {
        const tree = result.right;
        expect(tree._tag).toBe("ScCut");
      }
    });
  });

  describe("追加の1前提規則", () => {
    it("weakening-rightを構築できる", () => {
      const nodes = [makeNode("n1", "φ ⇒ φ, ψ"), makeNode("n2", "φ ⇒ φ")];
      const edges: InferenceEdge[] = [
        {
          _tag: "sc-axiom",
          ruleId: "identity",
          conclusionNodeId: "n2",
          conclusionText: "φ ⇒ φ",
        } satisfies ScAxiomEdge,
        {
          _tag: "sc-single",
          ruleId: "weakening-right",
          conclusionNodeId: "n1",
          premiseNodeId: "n2",
          conclusionText: "φ ⇒ φ, ψ",
        } satisfies ScSinglePremiseEdge,
      ];
      const result = buildScProofTree("n1", nodes, edges);
      expect(Either.isRight(result)).toBe(true);
      if (Either.isRight(result)) {
        expect(result.right._tag).toBe("ScWeakeningRight");
      }
    });

    it("contraction-rightを構築できる", () => {
      const nodes = [makeNode("n1", "φ ⇒ ψ"), makeNode("n2", "φ ⇒ ψ, ψ")];
      const edges: InferenceEdge[] = [
        {
          _tag: "sc-axiom",
          ruleId: "identity",
          conclusionNodeId: "n2",
          conclusionText: "φ ⇒ ψ, ψ",
        } satisfies ScAxiomEdge,
        {
          _tag: "sc-single",
          ruleId: "contraction-right",
          conclusionNodeId: "n1",
          premiseNodeId: "n2",
          conclusionText: "φ ⇒ ψ",
        } satisfies ScSinglePremiseEdge,
      ];
      const result = buildScProofTree("n1", nodes, edges);
      expect(Either.isRight(result)).toBe(true);
      if (Either.isRight(result)) {
        expect(result.right._tag).toBe("ScContractionRight");
      }
    });

    it("exchange-rightを構築できる", () => {
      const nodes = [makeNode("n1", "φ ⇒ χ, ψ"), makeNode("n2", "φ ⇒ ψ, χ")];
      const edges: InferenceEdge[] = [
        {
          _tag: "sc-axiom",
          ruleId: "identity",
          conclusionNodeId: "n2",
          conclusionText: "φ ⇒ ψ, χ",
        } satisfies ScAxiomEdge,
        {
          _tag: "sc-single",
          ruleId: "exchange-right",
          conclusionNodeId: "n1",
          premiseNodeId: "n2",
          conclusionText: "φ ⇒ χ, ψ",
          exchangePosition: 0,
        } satisfies ScSinglePremiseEdge,
      ];
      const result = buildScProofTree("n1", nodes, edges);
      expect(Either.isRight(result)).toBe(true);
      if (Either.isRight(result)) {
        expect(result.right._tag).toBe("ScExchangeRight");
      }
    });

    it("disjunction-rightを構築できる", () => {
      const nodes = [makeNode("n1", "⇒ φ ∨ ψ"), makeNode("n2", "⇒ φ")];
      const edges: InferenceEdge[] = [
        {
          _tag: "sc-axiom",
          ruleId: "identity",
          conclusionNodeId: "n2",
          conclusionText: "⇒ φ",
        } satisfies ScAxiomEdge,
        {
          _tag: "sc-single",
          ruleId: "disjunction-right",
          conclusionNodeId: "n1",
          premiseNodeId: "n2",
          conclusionText: "⇒ φ ∨ ψ",
          componentIndex: 1,
        } satisfies ScSinglePremiseEdge,
      ];
      const result = buildScProofTree("n1", nodes, edges);
      expect(Either.isRight(result)).toBe(true);
      if (Either.isRight(result)) {
        expect(result.right._tag).toBe("ScDisjunctionRight");
      }
    });

    it("universal-leftを構築できる", () => {
      const nodes = [makeNode("n1", "∀p.phi ⇒ ψ"), makeNode("n2", "phi ⇒ ψ")];
      const edges: InferenceEdge[] = [
        {
          _tag: "sc-axiom",
          ruleId: "identity",
          conclusionNodeId: "n2",
          conclusionText: "phi ⇒ ψ",
        } satisfies ScAxiomEdge,
        {
          _tag: "sc-single",
          ruleId: "universal-left",
          conclusionNodeId: "n1",
          premiseNodeId: "n2",
          conclusionText: "∀p.phi ⇒ ψ",
          termText: "p",
        } satisfies ScSinglePremiseEdge,
      ];
      const result = buildScProofTree("n1", nodes, edges);
      expect(Either.isRight(result)).toBe(true);
      if (Either.isRight(result)) {
        expect(result.right._tag).toBe("ScUniversalLeft");
      }
    });

    it("universal-rightを構築できる", () => {
      const nodes = [makeNode("n1", "⇒ ∀p.phi"), makeNode("n2", "⇒ phi")];
      const edges: InferenceEdge[] = [
        {
          _tag: "sc-axiom",
          ruleId: "identity",
          conclusionNodeId: "n2",
          conclusionText: "⇒ phi",
        } satisfies ScAxiomEdge,
        {
          _tag: "sc-single",
          ruleId: "universal-right",
          conclusionNodeId: "n1",
          premiseNodeId: "n2",
          conclusionText: "⇒ ∀p.phi",
          termText: "p",
        } satisfies ScSinglePremiseEdge,
      ];
      const result = buildScProofTree("n1", nodes, edges);
      expect(Either.isRight(result)).toBe(true);
      if (Either.isRight(result)) {
        expect(result.right._tag).toBe("ScUniversalRight");
      }
    });

    it("existential-leftを構築できる", () => {
      const nodes = [makeNode("n1", "∃p.phi ⇒ ψ"), makeNode("n2", "phi ⇒ ψ")];
      const edges: InferenceEdge[] = [
        {
          _tag: "sc-axiom",
          ruleId: "identity",
          conclusionNodeId: "n2",
          conclusionText: "phi ⇒ ψ",
        } satisfies ScAxiomEdge,
        {
          _tag: "sc-single",
          ruleId: "existential-left",
          conclusionNodeId: "n1",
          premiseNodeId: "n2",
          conclusionText: "∃p.phi ⇒ ψ",
          termText: "p",
        } satisfies ScSinglePremiseEdge,
      ];
      const result = buildScProofTree("n1", nodes, edges);
      expect(Either.isRight(result)).toBe(true);
      if (Either.isRight(result)) {
        expect(result.right._tag).toBe("ScExistentialLeft");
      }
    });

    it("existential-rightを構築できる", () => {
      const nodes = [makeNode("n1", "⇒ ∃p.phi"), makeNode("n2", "⇒ phi")];
      const edges: InferenceEdge[] = [
        {
          _tag: "sc-axiom",
          ruleId: "identity",
          conclusionNodeId: "n2",
          conclusionText: "⇒ phi",
        } satisfies ScAxiomEdge,
        {
          _tag: "sc-single",
          ruleId: "existential-right",
          conclusionNodeId: "n1",
          premiseNodeId: "n2",
          conclusionText: "⇒ ∃p.phi",
          termText: "p",
        } satisfies ScSinglePremiseEdge,
      ];
      const result = buildScProofTree("n1", nodes, edges);
      expect(Either.isRight(result)).toBe(true);
      if (Either.isRight(result)) {
        expect(result.right._tag).toBe("ScExistentialRight");
      }
    });
  });

  describe("追加の分岐規則", () => {
    it("conjunction-rightを構築できる", () => {
      const nodes = [
        makeNode("n1", "⇒ φ ∧ ψ"),
        makeNode("n2", "⇒ φ"),
        makeNode("n3", "⇒ ψ"),
      ];
      const edges: InferenceEdge[] = [
        {
          _tag: "sc-axiom",
          ruleId: "identity",
          conclusionNodeId: "n2",
          conclusionText: "⇒ φ",
        } satisfies ScAxiomEdge,
        {
          _tag: "sc-axiom",
          ruleId: "identity",
          conclusionNodeId: "n3",
          conclusionText: "⇒ ψ",
        } satisfies ScAxiomEdge,
        {
          _tag: "sc-branching",
          ruleId: "conjunction-right",
          conclusionNodeId: "n1",
          leftPremiseNodeId: "n2",
          rightPremiseNodeId: "n3",
          leftConclusionText: "⇒ φ",
          rightConclusionText: "⇒ ψ",
          conclusionText: "⇒ φ ∧ ψ",
        } satisfies ScBranchingEdge,
      ];
      const result = buildScProofTree("n1", nodes, edges);
      expect(Either.isRight(result)).toBe(true);
      if (Either.isRight(result)) {
        expect(result.right._tag).toBe("ScConjunctionRight");
      }
    });

    it("disjunction-leftを構築できる", () => {
      const nodes = [
        makeNode("n1", "φ ∨ ψ ⇒ χ"),
        makeNode("n2", "φ ⇒ χ"),
        makeNode("n3", "ψ ⇒ χ"),
      ];
      const edges: InferenceEdge[] = [
        {
          _tag: "sc-axiom",
          ruleId: "identity",
          conclusionNodeId: "n2",
          conclusionText: "φ ⇒ χ",
        } satisfies ScAxiomEdge,
        {
          _tag: "sc-axiom",
          ruleId: "identity",
          conclusionNodeId: "n3",
          conclusionText: "ψ ⇒ χ",
        } satisfies ScAxiomEdge,
        {
          _tag: "sc-branching",
          ruleId: "disjunction-left",
          conclusionNodeId: "n1",
          leftPremiseNodeId: "n2",
          rightPremiseNodeId: "n3",
          leftConclusionText: "φ ⇒ χ",
          rightConclusionText: "ψ ⇒ χ",
          conclusionText: "φ ∨ ψ ⇒ χ",
        } satisfies ScBranchingEdge,
      ];
      const result = buildScProofTree("n1", nodes, edges);
      expect(Either.isRight(result)).toBe(true);
      if (Either.isRight(result)) {
        expect(result.right._tag).toBe("ScDisjunctionLeft");
      }
    });
  });

  describe("論理式復元失敗エラー", () => {
    it("weakening-rightで論理式復元が失敗するとFormulaRecoveryFailedエラーを返す", () => {
      // 前提と結論のsuccedent数が同じ（弱化ではない）→ 復元失敗
      const nodes = [makeNode("n1", "φ ⇒ φ"), makeNode("n2", "φ ⇒ φ")];
      const edges: InferenceEdge[] = [
        {
          _tag: "sc-axiom",
          ruleId: "identity",
          conclusionNodeId: "n2",
          conclusionText: "φ ⇒ φ",
        } satisfies ScAxiomEdge,
        {
          _tag: "sc-single",
          ruleId: "weakening-right",
          conclusionNodeId: "n1",
          premiseNodeId: "n2",
          conclusionText: "φ ⇒ φ",
        } satisfies ScSinglePremiseEdge,
      ];
      const result = buildScProofTree("n1", nodes, edges);
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("ScTreeFormulaRecoveryFailed");
        if (result.left._tag === "ScTreeFormulaRecoveryFailed") {
          expect(result.left.ruleId).toBe("weakening-right");
        }
      }
    });

    it("contraction-leftで論理式復元が失敗するとFormulaRecoveryFailedエラーを返す", () => {
      // 前提と結論のantecedent数が同じ（縮約ではない）→ 復元失敗
      const nodes = [makeNode("n1", "φ ⇒ ψ"), makeNode("n2", "φ ⇒ ψ")];
      const edges: InferenceEdge[] = [
        {
          _tag: "sc-axiom",
          ruleId: "identity",
          conclusionNodeId: "n2",
          conclusionText: "φ ⇒ ψ",
        } satisfies ScAxiomEdge,
        {
          _tag: "sc-single",
          ruleId: "contraction-left",
          conclusionNodeId: "n1",
          premiseNodeId: "n2",
          conclusionText: "φ ⇒ ψ",
        } satisfies ScSinglePremiseEdge,
      ];
      const result = buildScProofTree("n1", nodes, edges);
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("ScTreeFormulaRecoveryFailed");
        if (result.left._tag === "ScTreeFormulaRecoveryFailed") {
          expect(result.left.ruleId).toBe("contraction-left");
        }
      }
    });

    it("contraction-rightで論理式復元が失敗するとFormulaRecoveryFailedエラーを返す", () => {
      // 前提と結論のsuccedent数が同じ（縮約ではない）→ 復元失敗
      const nodes = [makeNode("n1", "φ ⇒ ψ"), makeNode("n2", "φ ⇒ ψ")];
      const edges: InferenceEdge[] = [
        {
          _tag: "sc-axiom",
          ruleId: "identity",
          conclusionNodeId: "n2",
          conclusionText: "φ ⇒ ψ",
        } satisfies ScAxiomEdge,
        {
          _tag: "sc-single",
          ruleId: "contraction-right",
          conclusionNodeId: "n1",
          premiseNodeId: "n2",
          conclusionText: "φ ⇒ ψ",
        } satisfies ScSinglePremiseEdge,
      ];
      const result = buildScProofTree("n1", nodes, edges);
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("ScTreeFormulaRecoveryFailed");
        if (result.left._tag === "ScTreeFormulaRecoveryFailed") {
          expect(result.left.ruleId).toBe("contraction-right");
        }
      }
    });

    it("cutでカット式復元が失敗するとFormulaRecoveryFailedエラーを返す", () => {
      // 左前提テキストのsuccedentが複数 → カット式復元失敗
      const nodes = [
        makeNode("n1", "⇒ ψ"),
        makeNode("n2", "⇒ φ, ψ"),
        makeNode("n3", "φ ⇒ ψ"),
      ];
      const edges: InferenceEdge[] = [
        {
          _tag: "sc-axiom",
          ruleId: "identity",
          conclusionNodeId: "n2",
          conclusionText: "⇒ φ, ψ",
        } satisfies ScAxiomEdge,
        {
          _tag: "sc-axiom",
          ruleId: "identity",
          conclusionNodeId: "n3",
          conclusionText: "φ ⇒ ψ",
        } satisfies ScAxiomEdge,
        {
          _tag: "sc-branching",
          ruleId: "cut",
          conclusionNodeId: "n1",
          leftPremiseNodeId: "n2",
          rightPremiseNodeId: "n3",
          leftConclusionText: "⇒ φ, ψ",
          rightConclusionText: "φ ⇒ ψ",
          conclusionText: "⇒ ψ",
        } satisfies ScBranchingEdge,
      ];
      const result = buildScProofTree("n1", nodes, edges);
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("ScTreeFormulaRecoveryFailed");
        if (result.left._tag === "ScTreeFormulaRecoveryFailed") {
          expect(result.left.ruleId).toBe("cut");
        }
      }
    });

    it("前提テキストがパース不能な場合はFormulaRecoveryFailedエラーを返す", () => {
      // 前提ノードの formulaText がパース不能 → premiseParsed === undefined
      // エッジの conclusionText は有効（公理ノード構築に使用）だが
      // 前提ノードの formulaText は無効（パラメータ復元に使用）
      const nodes = [makeNode("n1", "φ, ψ ⇒ ψ"), makeNode("n2", "invalid %%")];
      const edges: InferenceEdge[] = [
        {
          _tag: "sc-axiom",
          ruleId: "identity",
          conclusionNodeId: "n2",
          conclusionText: "ψ ⇒ ψ",
        } satisfies ScAxiomEdge,
        {
          _tag: "sc-single",
          ruleId: "weakening-left",
          conclusionNodeId: "n1",
          premiseNodeId: "n2",
          conclusionText: "φ, ψ ⇒ ψ",
        } satisfies ScSinglePremiseEdge,
      ];
      const result = buildScProofTree("n1", nodes, edges);
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("ScTreeFormulaRecoveryFailed");
        if (result.left._tag === "ScTreeFormulaRecoveryFailed") {
          expect(result.left.ruleId).toBe("weakening-left");
        }
      }
    });
  });

  describe("サイクル検出", () => {
    it("グラフにサイクルがある場合はCycleDetectedエラーを返す", () => {
      // n1 → n2 → n1 のサイクル
      const nodes = [makeNode("n1", "φ ⇒ ψ"), makeNode("n2", "ψ ⇒ φ")];
      const edges: InferenceEdge[] = [
        {
          _tag: "sc-single",
          ruleId: "exchange-left",
          conclusionNodeId: "n2",
          premiseNodeId: "n1",
          conclusionText: "ψ ⇒ φ",
          exchangePosition: 0,
        } satisfies ScSinglePremiseEdge,
        {
          _tag: "sc-single",
          ruleId: "exchange-left",
          conclusionNodeId: "n1",
          premiseNodeId: "n2",
          conclusionText: "φ ⇒ ψ",
          exchangePosition: 0,
        } satisfies ScSinglePremiseEdge,
      ];
      const result = buildScProofTree("n1", nodes, edges);
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("ScTreeCycleDetected");
      }
    });
  });

  describe("weakening-left論理式復元失敗", () => {
    it("weakening-leftで論理式復元が失敗するとFormulaRecoveryFailedエラーを返す", () => {
      // 結論と前提のantecedent数が同じ（弱化ではない）→ 復元失敗
      const nodes = [makeNode("n1", "φ ⇒ ψ"), makeNode("n2", "φ ⇒ ψ")];
      const edges: InferenceEdge[] = [
        {
          _tag: "sc-axiom",
          ruleId: "identity",
          conclusionNodeId: "n2",
          conclusionText: "φ ⇒ ψ",
        } satisfies ScAxiomEdge,
        {
          _tag: "sc-single",
          ruleId: "weakening-left",
          conclusionNodeId: "n1",
          premiseNodeId: "n2",
          conclusionText: "φ ⇒ ψ",
        } satisfies ScSinglePremiseEdge,
      ];
      const result = buildScProofTree("n1", nodes, edges);
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("ScTreeFormulaRecoveryFailed");
        if (result.left._tag === "ScTreeFormulaRecoveryFailed") {
          expect(result.left.ruleId).toBe("weakening-left");
        }
      }
    });
  });
});

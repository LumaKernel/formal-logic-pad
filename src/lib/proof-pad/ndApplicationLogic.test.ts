import { describe, expect, it } from "vitest";
import { Either } from "effect";
import { naturalDeduction, njSystem } from "../logic-core/deductionSystem";
import { createEmptyWorkspace, addNode } from "./workspaceState";
import type { NdInferenceEdge } from "./inferenceEdge";
import {
  validateNdApplication,
  getNdErrorMessage,
  isNdEfqValidResult,
  type NdApplicationError,
} from "./ndApplicationLogic";

// --- ヘルパー ---

/** ND用の空ワークスペースを作成する */
function createNdWorkspace() {
  return createEmptyWorkspace(naturalDeduction(njSystem));
}

/** NDエッジをワークスペースに追加するヘルパー */
function addNdEdge(
  ws: ReturnType<typeof createNdWorkspace>,
  edge: NdInferenceEdge,
): ReturnType<typeof createNdWorkspace> {
  return {
    ...ws,
    inferenceEdges: [...ws.inferenceEdges, edge],
  };
}

// --- →I (Implication Intro) ---

describe("ndApplicationLogic", () => {
  describe("→I (Implication Intro)", () => {
    it("前提φの下でψが証明されたとき φ→ψ を導出する", () => {
      let ws = createNdWorkspace();
      ws = addNode(ws, "axiom", "premise", { x: 0, y: 0 }, "psi");
      ws = addNode(ws, "axiom", "conclusion", { x: 100, y: 100 });
      ws = addNdEdge(ws, {
        _tag: "nd-implication-intro",
        conclusionNodeId: "node-2",
        premiseNodeId: "node-1",
        dischargedFormulaText: "phi",
        dischargedAssumptionId: 1,
        conclusionText: "",
      });
      const result = validateNdApplication(
        ws,
        ws.inferenceEdges[0] as NdInferenceEdge,
      );
      expect(Either.isRight(result)).toBe(true);
      if (Either.isRight(result) && result.right._tag === "nd-success") {
        expect(result.right.conclusionText).toBe("φ → ψ");
      }
    });

    it("前提が未接続の場合エラー", () => {
      let ws = createNdWorkspace();
      ws = addNode(ws, "axiom", "conclusion", { x: 100, y: 100 });
      ws = addNdEdge(ws, {
        _tag: "nd-implication-intro",
        conclusionNodeId: "node-1",
        premiseNodeId: undefined,
        dischargedFormulaText: "phi",
        dischargedAssumptionId: 1,
        conclusionText: "",
      });
      const result = validateNdApplication(
        ws,
        ws.inferenceEdges[0] as NdInferenceEdge,
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("NdPremiseMissing");
      }
    });

    it("前提のパースエラーの場合エラー", () => {
      let ws = createNdWorkspace();
      ws = addNode(ws, "axiom", "premise", { x: 0, y: 0 }, "invalid???");
      ws = addNode(ws, "axiom", "conclusion", { x: 100, y: 100 });
      ws = addNdEdge(ws, {
        _tag: "nd-implication-intro",
        conclusionNodeId: "node-2",
        premiseNodeId: "node-1",
        dischargedFormulaText: "phi",
        dischargedAssumptionId: 1,
        conclusionText: "",
      });
      const result = validateNdApplication(
        ws,
        ws.inferenceEdges[0] as NdInferenceEdge,
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("NdPremiseParseError");
      }
    });

    it("打ち消し仮定のパースエラーの場合エラー", () => {
      let ws = createNdWorkspace();
      ws = addNode(ws, "axiom", "premise", { x: 0, y: 0 }, "psi");
      ws = addNode(ws, "axiom", "conclusion", { x: 100, y: 100 });
      ws = addNdEdge(ws, {
        _tag: "nd-implication-intro",
        conclusionNodeId: "node-2",
        premiseNodeId: "node-1",
        dischargedFormulaText: "",
        dischargedAssumptionId: 1,
        conclusionText: "",
      });
      const result = validateNdApplication(
        ws,
        ws.inferenceEdges[0] as NdInferenceEdge,
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("NdDischargedFormulaParseError");
      }
    });

    it("打ち消し仮定が不正な論理式（パース失敗）の場合エラー", () => {
      let ws = createNdWorkspace();
      ws = addNode(ws, "axiom", "premise", { x: 0, y: 0 }, "psi");
      ws = addNode(ws, "axiom", "conclusion", { x: 100, y: 100 });
      ws = addNdEdge(ws, {
        _tag: "nd-implication-intro",
        conclusionNodeId: "node-2",
        premiseNodeId: "node-1",
        dischargedFormulaText: "∧∧invalid",
        dischargedAssumptionId: 1,
        conclusionText: "",
      });
      const result = validateNdApplication(
        ws,
        ws.inferenceEdges[0] as NdInferenceEdge,
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("NdDischargedFormulaParseError");
      }
    });

    it("前提が⊥の場合、¬φ（Negation）を生成する", () => {
      let ws = createNdWorkspace();
      ws = addNode(ws, "axiom", "premise", { x: 0, y: 0 }, "⊥");
      ws = addNode(ws, "axiom", "conclusion", { x: 100, y: 100 });
      ws = addNdEdge(ws, {
        _tag: "nd-implication-intro",
        conclusionNodeId: "node-2",
        premiseNodeId: "node-1",
        dischargedFormulaText: "phi",
        dischargedAssumptionId: 1,
        conclusionText: "",
      });
      const result = validateNdApplication(
        ws,
        ws.inferenceEdges[0] as NdInferenceEdge,
      );
      expect(Either.isRight(result)).toBe(true);
      if (Either.isRight(result) && result.right._tag === "nd-success") {
        expect(result.right.conclusionText).toBe("¬φ");
      }
    });
  });

  // --- →E (Implication Elim) ---

  describe("→E (Implication Elim)", () => {
    it("φ と φ→ψ から ψ を導出する", () => {
      let ws = createNdWorkspace();
      ws = addNode(ws, "axiom", "left", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "axiom", "right", { x: 200, y: 0 }, "phi -> psi");
      ws = addNode(ws, "axiom", "conclusion", { x: 100, y: 100 });
      ws = addNdEdge(ws, {
        _tag: "nd-implication-elim",
        conclusionNodeId: "node-3",
        leftPremiseNodeId: "node-1",
        rightPremiseNodeId: "node-2",
        conclusionText: "",
      });
      const result = validateNdApplication(
        ws,
        ws.inferenceEdges[0] as NdInferenceEdge,
      );
      expect(Either.isRight(result)).toBe(true);
      if (Either.isRight(result) && result.right._tag === "nd-success") {
        expect(result.right.conclusionText).toBe("ψ");
      }
    });

    it("右前提がImplicationでない場合エラー", () => {
      let ws = createNdWorkspace();
      ws = addNode(ws, "axiom", "left", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "axiom", "right", { x: 200, y: 0 }, "psi");
      ws = addNode(ws, "axiom", "conclusion", { x: 100, y: 100 });
      ws = addNdEdge(ws, {
        _tag: "nd-implication-elim",
        conclusionNodeId: "node-3",
        leftPremiseNodeId: "node-1",
        rightPremiseNodeId: "node-2",
        conclusionText: "",
      });
      const result = validateNdApplication(
        ws,
        ws.inferenceEdges[0] as NdInferenceEdge,
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("NdStructuralError");
      }
    });

    it("左前提が右前提のantecedentと一致しない場合エラー", () => {
      let ws = createNdWorkspace();
      ws = addNode(ws, "axiom", "left", { x: 0, y: 0 }, "chi");
      ws = addNode(ws, "axiom", "right", { x: 200, y: 0 }, "phi -> psi");
      ws = addNode(ws, "axiom", "conclusion", { x: 100, y: 100 });
      ws = addNdEdge(ws, {
        _tag: "nd-implication-elim",
        conclusionNodeId: "node-3",
        leftPremiseNodeId: "node-1",
        rightPremiseNodeId: "node-2",
        conclusionText: "",
      });
      const result = validateNdApplication(
        ws,
        ws.inferenceEdges[0] as NdInferenceEdge,
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("NdStructuralError");
      }
    });

    it("左前提が未接続の場合エラー", () => {
      let ws = createNdWorkspace();
      ws = addNode(ws, "axiom", "right", { x: 200, y: 0 }, "phi -> psi");
      ws = addNode(ws, "axiom", "conclusion", { x: 100, y: 100 });
      ws = addNdEdge(ws, {
        _tag: "nd-implication-elim",
        conclusionNodeId: "node-2",
        leftPremiseNodeId: undefined,
        rightPremiseNodeId: "node-1",
        conclusionText: "",
      });
      const result = validateNdApplication(
        ws,
        ws.inferenceEdges[0] as NdInferenceEdge,
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("NdPremiseMissing");
      }
    });

    it("右前提が未接続の場合エラー", () => {
      let ws = createNdWorkspace();
      ws = addNode(ws, "axiom", "left", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "axiom", "conclusion", { x: 100, y: 100 });
      ws = addNdEdge(ws, {
        _tag: "nd-implication-elim",
        conclusionNodeId: "node-2",
        leftPremiseNodeId: "node-1",
        rightPremiseNodeId: undefined,
        conclusionText: "",
      });
      const result = validateNdApplication(
        ws,
        ws.inferenceEdges[0] as NdInferenceEdge,
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("NdPremiseMissing");
      }
    });

    it("φ と ¬φ（Negation）から ⊥ を導出する", () => {
      let ws = createNdWorkspace();
      ws = addNode(ws, "axiom", "left", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "axiom", "right", { x: 200, y: 0 }, "~phi");
      ws = addNode(ws, "axiom", "conclusion", { x: 100, y: 100 });
      ws = addNdEdge(ws, {
        _tag: "nd-implication-elim",
        conclusionNodeId: "node-3",
        leftPremiseNodeId: "node-1",
        rightPremiseNodeId: "node-2",
        conclusionText: "",
      });
      const result = validateNdApplication(
        ws,
        ws.inferenceEdges[0] as NdInferenceEdge,
      );
      expect(Either.isRight(result)).toBe(true);
      if (Either.isRight(result) && result.right._tag === "nd-success") {
        expect(result.right.conclusionText).toBe("⊥");
      }
    });

    it("φ と ¬ψ（不一致Negation）の場合エラー", () => {
      let ws = createNdWorkspace();
      ws = addNode(ws, "axiom", "left", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "axiom", "right", { x: 200, y: 0 }, "~psi");
      ws = addNode(ws, "axiom", "conclusion", { x: 100, y: 100 });
      ws = addNdEdge(ws, {
        _tag: "nd-implication-elim",
        conclusionNodeId: "node-3",
        leftPremiseNodeId: "node-1",
        rightPremiseNodeId: "node-2",
        conclusionText: "",
      });
      const result = validateNdApplication(
        ws,
        ws.inferenceEdges[0] as NdInferenceEdge,
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("NdStructuralError");
      }
    });
  });

  // --- ∧I (Conjunction Intro) ---

  describe("∧I (Conjunction Intro)", () => {
    it("φ と ψ から φ∧ψ を導出する", () => {
      let ws = createNdWorkspace();
      ws = addNode(ws, "axiom", "left", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "axiom", "right", { x: 200, y: 0 }, "psi");
      ws = addNode(ws, "axiom", "conclusion", { x: 100, y: 100 });
      ws = addNdEdge(ws, {
        _tag: "nd-conjunction-intro",
        conclusionNodeId: "node-3",
        leftPremiseNodeId: "node-1",
        rightPremiseNodeId: "node-2",
        conclusionText: "",
      });
      const result = validateNdApplication(
        ws,
        ws.inferenceEdges[0] as NdInferenceEdge,
      );
      expect(Either.isRight(result)).toBe(true);
      if (Either.isRight(result) && result.right._tag === "nd-success") {
        expect(result.right.conclusionText).toBe("φ ∧ ψ");
      }
    });

    it("左前提が未接続の場合エラー", () => {
      let ws = createNdWorkspace();
      ws = addNode(ws, "axiom", "right", { x: 200, y: 0 }, "psi");
      ws = addNode(ws, "axiom", "conclusion", { x: 100, y: 100 });
      ws = addNdEdge(ws, {
        _tag: "nd-conjunction-intro",
        conclusionNodeId: "node-2",
        leftPremiseNodeId: undefined,
        rightPremiseNodeId: "node-1",
        conclusionText: "",
      });
      const result = validateNdApplication(
        ws,
        ws.inferenceEdges[0] as NdInferenceEdge,
      );
      expect(Either.isLeft(result)).toBe(true);
    });
  });

  // --- ∧E_L (Conjunction Elim Left) ---

  describe("∧E_L (Conjunction Elim Left)", () => {
    it("φ∧ψ から φ を導出する", () => {
      let ws = createNdWorkspace();
      ws = addNode(ws, "axiom", "premise", { x: 0, y: 0 }, "phi /\\ psi");
      ws = addNode(ws, "axiom", "conclusion", { x: 100, y: 100 });
      ws = addNdEdge(ws, {
        _tag: "nd-conjunction-elim-left",
        conclusionNodeId: "node-2",
        premiseNodeId: "node-1",
        conclusionText: "",
      });
      const result = validateNdApplication(
        ws,
        ws.inferenceEdges[0] as NdInferenceEdge,
      );
      expect(Either.isRight(result)).toBe(true);
      if (Either.isRight(result) && result.right._tag === "nd-success") {
        expect(result.right.conclusionText).toBe("φ");
      }
    });

    it("前提がConjunctionでない場合エラー", () => {
      let ws = createNdWorkspace();
      ws = addNode(ws, "axiom", "premise", { x: 0, y: 0 }, "phi -> psi");
      ws = addNode(ws, "axiom", "conclusion", { x: 100, y: 100 });
      ws = addNdEdge(ws, {
        _tag: "nd-conjunction-elim-left",
        conclusionNodeId: "node-2",
        premiseNodeId: "node-1",
        conclusionText: "",
      });
      const result = validateNdApplication(
        ws,
        ws.inferenceEdges[0] as NdInferenceEdge,
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("NdStructuralError");
      }
    });

    it("前提が未接続の場合エラー", () => {
      let ws = createNdWorkspace();
      ws = addNode(ws, "axiom", "conclusion", { x: 100, y: 100 });
      ws = addNdEdge(ws, {
        _tag: "nd-conjunction-elim-left",
        conclusionNodeId: "node-1",
        premiseNodeId: undefined,
        conclusionText: "",
      });
      const result = validateNdApplication(
        ws,
        ws.inferenceEdges[0] as NdInferenceEdge,
      );
      expect(Either.isLeft(result)).toBe(true);
    });
  });

  // --- ∧E_R (Conjunction Elim Right) ---

  describe("∧E_R (Conjunction Elim Right)", () => {
    it("φ∧ψ から ψ を導出する", () => {
      let ws = createNdWorkspace();
      ws = addNode(ws, "axiom", "premise", { x: 0, y: 0 }, "phi /\\ psi");
      ws = addNode(ws, "axiom", "conclusion", { x: 100, y: 100 });
      ws = addNdEdge(ws, {
        _tag: "nd-conjunction-elim-right",
        conclusionNodeId: "node-2",
        premiseNodeId: "node-1",
        conclusionText: "",
      });
      const result = validateNdApplication(
        ws,
        ws.inferenceEdges[0] as NdInferenceEdge,
      );
      expect(Either.isRight(result)).toBe(true);
      if (Either.isRight(result) && result.right._tag === "nd-success") {
        expect(result.right.conclusionText).toBe("ψ");
      }
    });

    it("前提がConjunctionでない場合エラー", () => {
      let ws = createNdWorkspace();
      ws = addNode(ws, "axiom", "premise", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "axiom", "conclusion", { x: 100, y: 100 });
      ws = addNdEdge(ws, {
        _tag: "nd-conjunction-elim-right",
        conclusionNodeId: "node-2",
        premiseNodeId: "node-1",
        conclusionText: "",
      });
      const result = validateNdApplication(
        ws,
        ws.inferenceEdges[0] as NdInferenceEdge,
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("NdStructuralError");
      }
    });
  });

  // --- ∨I_L (Disjunction Intro Left) ---

  describe("∨I_L (Disjunction Intro Left)", () => {
    it("φ から φ∨ψ を導出する", () => {
      let ws = createNdWorkspace();
      ws = addNode(ws, "axiom", "premise", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "axiom", "conclusion", { x: 100, y: 100 });
      ws = addNdEdge(ws, {
        _tag: "nd-disjunction-intro-left",
        conclusionNodeId: "node-2",
        premiseNodeId: "node-1",
        addedRightText: "psi",
        conclusionText: "",
      });
      const result = validateNdApplication(
        ws,
        ws.inferenceEdges[0] as NdInferenceEdge,
      );
      expect(Either.isRight(result)).toBe(true);
      if (Either.isRight(result) && result.right._tag === "nd-success") {
        expect(result.right.conclusionText).toBe("φ ∨ ψ");
      }
    });

    it("追加式がパースエラーの場合エラー", () => {
      let ws = createNdWorkspace();
      ws = addNode(ws, "axiom", "premise", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "axiom", "conclusion", { x: 100, y: 100 });
      ws = addNdEdge(ws, {
        _tag: "nd-disjunction-intro-left",
        conclusionNodeId: "node-2",
        premiseNodeId: "node-1",
        addedRightText: "",
        conclusionText: "",
      });
      const result = validateNdApplication(
        ws,
        ws.inferenceEdges[0] as NdInferenceEdge,
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("NdAdditionalFormulaParseError");
      }
    });

    it("前提が未接続の場合エラー", () => {
      let ws = createNdWorkspace();
      ws = addNode(ws, "axiom", "conclusion", { x: 100, y: 100 });
      ws = addNdEdge(ws, {
        _tag: "nd-disjunction-intro-left",
        conclusionNodeId: "node-1",
        premiseNodeId: undefined,
        addedRightText: "psi",
        conclusionText: "",
      });
      const result = validateNdApplication(
        ws,
        ws.inferenceEdges[0] as NdInferenceEdge,
      );
      expect(Either.isLeft(result)).toBe(true);
    });
  });

  // --- ∨I_R (Disjunction Intro Right) ---

  describe("∨I_R (Disjunction Intro Right)", () => {
    it("ψ から φ∨ψ を導出する", () => {
      let ws = createNdWorkspace();
      ws = addNode(ws, "axiom", "premise", { x: 0, y: 0 }, "psi");
      ws = addNode(ws, "axiom", "conclusion", { x: 100, y: 100 });
      ws = addNdEdge(ws, {
        _tag: "nd-disjunction-intro-right",
        conclusionNodeId: "node-2",
        premiseNodeId: "node-1",
        addedLeftText: "phi",
        conclusionText: "",
      });
      const result = validateNdApplication(
        ws,
        ws.inferenceEdges[0] as NdInferenceEdge,
      );
      expect(Either.isRight(result)).toBe(true);
      if (Either.isRight(result) && result.right._tag === "nd-success") {
        expect(result.right.conclusionText).toBe("φ ∨ ψ");
      }
    });

    it("追加式がパースエラーの場合エラー", () => {
      let ws = createNdWorkspace();
      ws = addNode(ws, "axiom", "premise", { x: 0, y: 0 }, "psi");
      ws = addNode(ws, "axiom", "conclusion", { x: 100, y: 100 });
      ws = addNdEdge(ws, {
        _tag: "nd-disjunction-intro-right",
        conclusionNodeId: "node-2",
        premiseNodeId: "node-1",
        addedLeftText: "",
        conclusionText: "",
      });
      const result = validateNdApplication(
        ws,
        ws.inferenceEdges[0] as NdInferenceEdge,
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("NdAdditionalFormulaParseError");
      }
    });
  });

  // --- ∨E (Disjunction Elim) ---

  describe("∨E (Disjunction Elim)", () => {
    it("φ∨ψ と両ケースの証明から χ を導出する", () => {
      let ws = createNdWorkspace();
      ws = addNode(ws, "axiom", "disj", { x: 0, y: 0 }, "phi \\/ psi");
      ws = addNode(ws, "axiom", "leftCase", { x: -100, y: 100 }, "chi");
      ws = addNode(ws, "axiom", "rightCase", { x: 100, y: 100 }, "chi");
      ws = addNode(ws, "axiom", "conclusion", { x: 0, y: 200 });
      ws = addNdEdge(ws, {
        _tag: "nd-disjunction-elim",
        conclusionNodeId: "node-4",
        disjunctionPremiseNodeId: "node-1",
        leftCasePremiseNodeId: "node-2",
        leftDischargedAssumptionId: 1,
        rightCasePremiseNodeId: "node-3",
        rightDischargedAssumptionId: 2,
        conclusionText: "",
      });
      const result = validateNdApplication(
        ws,
        ws.inferenceEdges[0] as NdInferenceEdge,
      );
      expect(Either.isRight(result)).toBe(true);
      if (Either.isRight(result) && result.right._tag === "nd-success") {
        expect(result.right.conclusionText).toBe("χ");
      }
    });

    it("disjunction前提がDisjunctionでない場合エラー", () => {
      let ws = createNdWorkspace();
      ws = addNode(ws, "axiom", "disj", { x: 0, y: 0 }, "phi -> psi");
      ws = addNode(ws, "axiom", "leftCase", { x: -100, y: 100 }, "chi");
      ws = addNode(ws, "axiom", "rightCase", { x: 100, y: 100 }, "chi");
      ws = addNode(ws, "axiom", "conclusion", { x: 0, y: 200 });
      ws = addNdEdge(ws, {
        _tag: "nd-disjunction-elim",
        conclusionNodeId: "node-4",
        disjunctionPremiseNodeId: "node-1",
        leftCasePremiseNodeId: "node-2",
        leftDischargedAssumptionId: 1,
        rightCasePremiseNodeId: "node-3",
        rightDischargedAssumptionId: 2,
        conclusionText: "",
      });
      const result = validateNdApplication(
        ws,
        ws.inferenceEdges[0] as NdInferenceEdge,
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("NdStructuralError");
      }
    });

    it("左右のケースの結論が一致しない場合エラー", () => {
      let ws = createNdWorkspace();
      ws = addNode(ws, "axiom", "disj", { x: 0, y: 0 }, "phi \\/ psi");
      ws = addNode(ws, "axiom", "leftCase", { x: -100, y: 100 }, "chi");
      ws = addNode(ws, "axiom", "rightCase", { x: 100, y: 100 }, "phi");
      ws = addNode(ws, "axiom", "conclusion", { x: 0, y: 200 });
      ws = addNdEdge(ws, {
        _tag: "nd-disjunction-elim",
        conclusionNodeId: "node-4",
        disjunctionPremiseNodeId: "node-1",
        leftCasePremiseNodeId: "node-2",
        leftDischargedAssumptionId: 1,
        rightCasePremiseNodeId: "node-3",
        rightDischargedAssumptionId: 2,
        conclusionText: "",
      });
      const result = validateNdApplication(
        ws,
        ws.inferenceEdges[0] as NdInferenceEdge,
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("NdCaseConclusionMismatch");
      }
    });

    it("disjunction前提が未接続の場合エラー", () => {
      let ws = createNdWorkspace();
      ws = addNode(ws, "axiom", "leftCase", { x: -100, y: 100 }, "chi");
      ws = addNode(ws, "axiom", "rightCase", { x: 100, y: 100 }, "chi");
      ws = addNode(ws, "axiom", "conclusion", { x: 0, y: 200 });
      ws = addNdEdge(ws, {
        _tag: "nd-disjunction-elim",
        conclusionNodeId: "node-3",
        disjunctionPremiseNodeId: undefined,
        leftCasePremiseNodeId: "node-1",
        leftDischargedAssumptionId: 1,
        rightCasePremiseNodeId: "node-2",
        rightDischargedAssumptionId: 2,
        conclusionText: "",
      });
      const result = validateNdApplication(
        ws,
        ws.inferenceEdges[0] as NdInferenceEdge,
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("NdPremiseMissing");
      }
    });
  });

  // --- w (Weakening) ---

  describe("w (Weakening)", () => {
    it("φ と ψ から φ を導出する（ψを捨てる）", () => {
      let ws = createNdWorkspace();
      ws = addNode(ws, "axiom", "kept", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "axiom", "discarded", { x: 200, y: 0 }, "psi");
      ws = addNode(ws, "axiom", "conclusion", { x: 100, y: 100 });
      ws = addNdEdge(ws, {
        _tag: "nd-weakening",
        conclusionNodeId: "node-3",
        keptPremiseNodeId: "node-1",
        discardedPremiseNodeId: "node-2",
        conclusionText: "",
      });
      const result = validateNdApplication(
        ws,
        ws.inferenceEdges[0] as NdInferenceEdge,
      );
      expect(Either.isRight(result)).toBe(true);
      if (Either.isRight(result) && result.right._tag === "nd-success") {
        expect(result.right.conclusionText).toBe("φ");
      }
    });

    it("kept前提が未接続の場合エラー", () => {
      let ws = createNdWorkspace();
      ws = addNode(ws, "axiom", "discarded", { x: 200, y: 0 }, "psi");
      ws = addNode(ws, "axiom", "conclusion", { x: 100, y: 100 });
      ws = addNdEdge(ws, {
        _tag: "nd-weakening",
        conclusionNodeId: "node-2",
        keptPremiseNodeId: undefined,
        discardedPremiseNodeId: "node-1",
        conclusionText: "",
      });
      const result = validateNdApplication(
        ws,
        ws.inferenceEdges[0] as NdInferenceEdge,
      );
      expect(Either.isLeft(result)).toBe(true);
    });

    it("discarded前提が未接続の場合エラー", () => {
      let ws = createNdWorkspace();
      ws = addNode(ws, "axiom", "kept", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "axiom", "conclusion", { x: 100, y: 100 });
      ws = addNdEdge(ws, {
        _tag: "nd-weakening",
        conclusionNodeId: "node-2",
        keptPremiseNodeId: "node-1",
        discardedPremiseNodeId: undefined,
        conclusionText: "",
      });
      const result = validateNdApplication(
        ws,
        ws.inferenceEdges[0] as NdInferenceEdge,
      );
      expect(Either.isLeft(result)).toBe(true);
    });
  });

  // --- EFQ ---

  describe("EFQ", () => {
    it("前提が接続されていれば検証成功（efq-valid）", () => {
      let ws = createNdWorkspace();
      ws = addNode(ws, "axiom", "premise", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "axiom", "conclusion", { x: 100, y: 100 });
      ws = addNdEdge(ws, {
        _tag: "nd-efq",
        conclusionNodeId: "node-2",
        premiseNodeId: "node-1",
        conclusionText: "",
      });
      const result = validateNdApplication(
        ws,
        ws.inferenceEdges[0] as NdInferenceEdge,
      );
      expect(Either.isRight(result)).toBe(true);
      if (Either.isRight(result)) {
        expect(isNdEfqValidResult(result.right)).toBe(true);
      }
    });

    it("前提が未接続の場合エラー", () => {
      let ws = createNdWorkspace();
      ws = addNode(ws, "axiom", "conclusion", { x: 100, y: 100 });
      ws = addNdEdge(ws, {
        _tag: "nd-efq",
        conclusionNodeId: "node-1",
        premiseNodeId: undefined,
        conclusionText: "",
      });
      const result = validateNdApplication(
        ws,
        ws.inferenceEdges[0] as NdInferenceEdge,
      );
      expect(Either.isLeft(result)).toBe(true);
    });

    it("前提のパースエラーの場合エラー", () => {
      let ws = createNdWorkspace();
      ws = addNode(ws, "axiom", "premise", { x: 0, y: 0 }, "???");
      ws = addNode(ws, "axiom", "conclusion", { x: 100, y: 100 });
      ws = addNdEdge(ws, {
        _tag: "nd-efq",
        conclusionNodeId: "node-2",
        premiseNodeId: "node-1",
        conclusionText: "",
      });
      const result = validateNdApplication(
        ws,
        ws.inferenceEdges[0] as NdInferenceEdge,
      );
      expect(Either.isLeft(result)).toBe(true);
    });
  });

  // --- DNE ---

  describe("DNE", () => {
    it("¬¬φ から φ を導出する", () => {
      let ws = createNdWorkspace();
      ws = addNode(ws, "axiom", "premise", { x: 0, y: 0 }, "not not phi");
      ws = addNode(ws, "axiom", "conclusion", { x: 100, y: 100 });
      ws = addNdEdge(ws, {
        _tag: "nd-dne",
        conclusionNodeId: "node-2",
        premiseNodeId: "node-1",
        conclusionText: "",
      });
      const result = validateNdApplication(
        ws,
        ws.inferenceEdges[0] as NdInferenceEdge,
      );
      expect(Either.isRight(result)).toBe(true);
      if (Either.isRight(result) && result.right._tag === "nd-success") {
        expect(result.right.conclusionText).toBe("φ");
      }
    });

    it("前提が二重否定でない場合エラー", () => {
      let ws = createNdWorkspace();
      ws = addNode(ws, "axiom", "premise", { x: 0, y: 0 }, "not phi");
      ws = addNode(ws, "axiom", "conclusion", { x: 100, y: 100 });
      ws = addNdEdge(ws, {
        _tag: "nd-dne",
        conclusionNodeId: "node-2",
        premiseNodeId: "node-1",
        conclusionText: "",
      });
      const result = validateNdApplication(
        ws,
        ws.inferenceEdges[0] as NdInferenceEdge,
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("NdStructuralError");
      }
    });

    it("前提が否定ですらない場合エラー", () => {
      let ws = createNdWorkspace();
      ws = addNode(ws, "axiom", "premise", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "axiom", "conclusion", { x: 100, y: 100 });
      ws = addNdEdge(ws, {
        _tag: "nd-dne",
        conclusionNodeId: "node-2",
        premiseNodeId: "node-1",
        conclusionText: "",
      });
      const result = validateNdApplication(
        ws,
        ws.inferenceEdges[0] as NdInferenceEdge,
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("NdStructuralError");
      }
    });

    it("前提が未接続の場合エラー", () => {
      let ws = createNdWorkspace();
      ws = addNode(ws, "axiom", "conclusion", { x: 100, y: 100 });
      ws = addNdEdge(ws, {
        _tag: "nd-dne",
        conclusionNodeId: "node-1",
        premiseNodeId: undefined,
        conclusionText: "",
      });
      const result = validateNdApplication(
        ws,
        ws.inferenceEdges[0] as NdInferenceEdge,
      );
      expect(Either.isLeft(result)).toBe(true);
    });
  });

  // --- getNdErrorMessage ---

  describe("getNdErrorMessage", () => {
    it("NdPremiseMissing のメッセージ", () => {
      const msg = getNdErrorMessage({
        _tag: "NdPremiseMissing",
        premiseLabel: "left premise",
      } as NdApplicationError);
      expect(msg).toBe("Connect left premise");
    });

    it("NdPremiseParseError のメッセージ", () => {
      const msg = getNdErrorMessage({
        _tag: "NdPremiseParseError",
        premiseLabel: "premise (φ)",
        nodeId: "node-1",
      } as NdApplicationError);
      expect(msg).toBe("premise (φ) has invalid formula");
    });

    it("NdAdditionalFormulaParseError のメッセージ", () => {
      const msg = getNdErrorMessage({
        _tag: "NdAdditionalFormulaParseError",
        label: "right disjunct (ψ)",
      } as NdApplicationError);
      expect(msg).toBe("Enter valid formula for right disjunct (ψ)");
    });

    it("NdStructuralError のメッセージ", () => {
      const msg = getNdErrorMessage({
        _tag: "NdStructuralError",
        message: "Premise must be a conjunction",
      } as NdApplicationError);
      expect(msg).toBe("Premise must be a conjunction");
    });

    it("NdDischargedFormulaParseError のメッセージ", () => {
      const msg = getNdErrorMessage({
        _tag: "NdDischargedFormulaParseError",
      } as NdApplicationError);
      expect(msg).toBe("Enter valid discharged assumption formula");
    });

    it("NdCaseConclusionMismatch のメッセージ", () => {
      const msg = getNdErrorMessage({
        _tag: "NdCaseConclusionMismatch",
        leftConclusionText: "φ",
        rightConclusionText: "ψ",
      } as NdApplicationError);
      expect(msg).toContain("Left case (φ)");
      expect(msg).toContain("right case (ψ)");
      expect(msg).toContain("must match");
    });
  });

  // --- isNdEfqValidResult ---

  describe("isNdEfqValidResult", () => {
    it("efq-valid の場合 true", () => {
      expect(isNdEfqValidResult({ _tag: "efq-valid" })).toBe(true);
    });

    it("通常の成功結果の場合 false", () => {
      const result = {
        _tag: "nd-success" as const,
        conclusion: {} as never,
        conclusionText: "φ",
      };
      expect(isNdEfqValidResult(result)).toBe(false);
    });
  });

  // --- 複合的な式のテスト ---

  describe("複合式のテスト", () => {
    it("→I: ネストした含意 (φ→ψ)→χ の下で結論を導出", () => {
      let ws = createNdWorkspace();
      ws = addNode(ws, "axiom", "premise", { x: 0, y: 0 }, "chi");
      ws = addNode(ws, "axiom", "conclusion", { x: 100, y: 100 });
      ws = addNdEdge(ws, {
        _tag: "nd-implication-intro",
        conclusionNodeId: "node-2",
        premiseNodeId: "node-1",
        dischargedFormulaText: "phi -> psi",
        dischargedAssumptionId: 1,
        conclusionText: "",
      });
      const result = validateNdApplication(
        ws,
        ws.inferenceEdges[0] as NdInferenceEdge,
      );
      expect(Either.isRight(result)).toBe(true);
      if (Either.isRight(result) && result.right._tag === "nd-success") {
        expect(result.right.conclusionText).toBe("(φ → ψ) → χ");
      }
    });

    it("∧E_L + ∨I_L: 複合式からの分解と構築", () => {
      // φ∧ψ → φ (∧E_L)
      let ws = createNdWorkspace();
      ws = addNode(
        ws,
        "axiom",
        "premise",
        { x: 0, y: 0 },
        "(phi /\\ psi) /\\ chi",
      );
      ws = addNode(ws, "axiom", "conclusion", { x: 100, y: 100 });
      ws = addNdEdge(ws, {
        _tag: "nd-conjunction-elim-left",
        conclusionNodeId: "node-2",
        premiseNodeId: "node-1",
        conclusionText: "",
      });
      const result = validateNdApplication(
        ws,
        ws.inferenceEdges[0] as NdInferenceEdge,
      );
      expect(Either.isRight(result)).toBe(true);
      if (Either.isRight(result) && result.right._tag === "nd-success") {
        expect(result.right.conclusionText).toBe("φ ∧ ψ");
      }
    });

    it("→E: ネストした含意の解消", () => {
      let ws = createNdWorkspace();
      ws = addNode(ws, "axiom", "left", { x: 0, y: 0 }, "phi -> psi");
      ws = addNode(
        ws,
        "axiom",
        "right",
        { x: 200, y: 0 },
        "(phi -> psi) -> chi",
      );
      ws = addNode(ws, "axiom", "conclusion", { x: 100, y: 100 });
      ws = addNdEdge(ws, {
        _tag: "nd-implication-elim",
        conclusionNodeId: "node-3",
        leftPremiseNodeId: "node-1",
        rightPremiseNodeId: "node-2",
        conclusionText: "",
      });
      const result = validateNdApplication(
        ws,
        ws.inferenceEdges[0] as NdInferenceEdge,
      );
      expect(Either.isRight(result)).toBe(true);
      if (Either.isRight(result) && result.right._tag === "nd-success") {
        expect(result.right.conclusionText).toBe("χ");
      }
    });
  });

  // --- ∀I (Universal Intro) ---

  describe("∀I (Universal Intro)", () => {
    it("前提φから∀x.φを導出する", () => {
      let ws = createNdWorkspace();
      ws = addNode(ws, "axiom", "premise", { x: 0, y: 0 }, "P(x)");
      ws = addNode(ws, "axiom", "conclusion", { x: 100, y: 100 });
      ws = addNdEdge(ws, {
        _tag: "nd-universal-intro",
        conclusionNodeId: "node-2",
        premiseNodeId: "node-1",
        variableName: "x",
        conclusionText: "",
      });
      const result = validateNdApplication(
        ws,
        ws.inferenceEdges[0] as NdInferenceEdge,
      );
      expect(Either.isRight(result)).toBe(true);
      if (Either.isRight(result) && result.right._tag === "nd-success") {
        expect(result.right.conclusionText).toBe("∀x.P(x)");
      }
    });

    it("前提が未接続の場合エラー", () => {
      let ws = createNdWorkspace();
      ws = addNode(ws, "axiom", "conclusion", { x: 100, y: 100 });
      ws = addNdEdge(ws, {
        _tag: "nd-universal-intro",
        conclusionNodeId: "node-1",
        premiseNodeId: undefined,
        variableName: "x",
        conclusionText: "",
      });
      const result = validateNdApplication(
        ws,
        ws.inferenceEdges[0] as NdInferenceEdge,
      );
      expect(Either.isLeft(result)).toBe(true);
    });

    it("変数名が空の場合エラー", () => {
      let ws = createNdWorkspace();
      ws = addNode(ws, "axiom", "premise", { x: 0, y: 0 }, "P(x)");
      ws = addNode(ws, "axiom", "conclusion", { x: 100, y: 100 });
      ws = addNdEdge(ws, {
        _tag: "nd-universal-intro",
        conclusionNodeId: "node-2",
        premiseNodeId: "node-1",
        variableName: "",
        conclusionText: "",
      });
      const result = validateNdApplication(
        ws,
        ws.inferenceEdges[0] as NdInferenceEdge,
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("NdStructuralError");
      }
    });

    it("含意式に対しても∀I適用可能", () => {
      let ws = createNdWorkspace();
      ws = addNode(ws, "axiom", "premise", { x: 0, y: 0 }, "P(x) -> Q(x)");
      ws = addNode(ws, "axiom", "conclusion", { x: 100, y: 100 });
      ws = addNdEdge(ws, {
        _tag: "nd-universal-intro",
        conclusionNodeId: "node-2",
        premiseNodeId: "node-1",
        variableName: "x",
        conclusionText: "",
      });
      const result = validateNdApplication(
        ws,
        ws.inferenceEdges[0] as NdInferenceEdge,
      );
      expect(Either.isRight(result)).toBe(true);
      if (Either.isRight(result) && result.right._tag === "nd-success") {
        expect(result.right.conclusionText).toBe("∀x.P(x) → Q(x)");
      }
    });
  });

  // --- ∀E (Universal Elim) ---

  describe("∀E (Universal Elim)", () => {
    it("∀x.φから φ[t/x] を導出する", () => {
      let ws = createNdWorkspace();
      ws = addNode(ws, "axiom", "premise", { x: 0, y: 0 }, "all x. P(x)");
      ws = addNode(ws, "axiom", "conclusion", { x: 100, y: 100 });
      ws = addNdEdge(ws, {
        _tag: "nd-universal-elim",
        conclusionNodeId: "node-2",
        premiseNodeId: "node-1",
        termText: "x",
        conclusionText: "",
      });
      const result = validateNdApplication(
        ws,
        ws.inferenceEdges[0] as NdInferenceEdge,
      );
      expect(Either.isRight(result)).toBe(true);
      if (Either.isRight(result) && result.right._tag === "nd-success") {
        expect(result.right.conclusionText).toBe("P(x)");
      }
    });

    it("異なる変数で代入できる", () => {
      let ws = createNdWorkspace();
      ws = addNode(ws, "axiom", "premise", { x: 0, y: 0 }, "all x. P(x)");
      ws = addNode(ws, "axiom", "conclusion", { x: 100, y: 100 });
      ws = addNdEdge(ws, {
        _tag: "nd-universal-elim",
        conclusionNodeId: "node-2",
        premiseNodeId: "node-1",
        termText: "y",
        conclusionText: "",
      });
      const result = validateNdApplication(
        ws,
        ws.inferenceEdges[0] as NdInferenceEdge,
      );
      expect(Either.isRight(result)).toBe(true);
      if (Either.isRight(result) && result.right._tag === "nd-success") {
        expect(result.right.conclusionText).toBe("P(y)");
      }
    });

    it("前提が∀でない場合エラー", () => {
      let ws = createNdWorkspace();
      ws = addNode(ws, "axiom", "premise", { x: 0, y: 0 }, "P(x)");
      ws = addNode(ws, "axiom", "conclusion", { x: 100, y: 100 });
      ws = addNdEdge(ws, {
        _tag: "nd-universal-elim",
        conclusionNodeId: "node-2",
        premiseNodeId: "node-1",
        termText: "x",
        conclusionText: "",
      });
      const result = validateNdApplication(
        ws,
        ws.inferenceEdges[0] as NdInferenceEdge,
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("NdStructuralError");
      }
    });

    it("項テキストが空の場合エラー", () => {
      let ws = createNdWorkspace();
      ws = addNode(ws, "axiom", "premise", { x: 0, y: 0 }, "all x. P(x)");
      ws = addNode(ws, "axiom", "conclusion", { x: 100, y: 100 });
      ws = addNdEdge(ws, {
        _tag: "nd-universal-elim",
        conclusionNodeId: "node-2",
        premiseNodeId: "node-1",
        termText: "",
        conclusionText: "",
      });
      const result = validateNdApplication(
        ws,
        ws.inferenceEdges[0] as NdInferenceEdge,
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("NdTermParseError");
      }
    });

    it("前提が未接続の場合エラー", () => {
      let ws = createNdWorkspace();
      ws = addNode(ws, "axiom", "conclusion", { x: 100, y: 100 });
      ws = addNdEdge(ws, {
        _tag: "nd-universal-elim",
        conclusionNodeId: "node-1",
        premiseNodeId: undefined,
        termText: "x",
        conclusionText: "",
      });
      const result = validateNdApplication(
        ws,
        ws.inferenceEdges[0] as NdInferenceEdge,
      );
      expect(Either.isLeft(result)).toBe(true);
    });

    it("項テキストがパース不能な場合エラー", () => {
      let ws = createNdWorkspace();
      ws = addNode(ws, "axiom", "premise", { x: 0, y: 0 }, "all x. P(x)");
      ws = addNode(ws, "axiom", "conclusion", { x: 100, y: 100 });
      ws = addNdEdge(ws, {
        _tag: "nd-universal-elim",
        conclusionNodeId: "node-2",
        premiseNodeId: "node-1",
        termText: "!!!invalid",
        conclusionText: "",
      });
      const result = validateNdApplication(
        ws,
        ws.inferenceEdges[0] as NdInferenceEdge,
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("NdTermParseError");
      }
    });

    it("代入可能性条件(free-for)違反の場合エラー", () => {
      // ∀x.∀y.P(x,y) に対して y を代入
      // body = ∀y.P(x,y) で、y は x に対して free-for でない
      let ws = createNdWorkspace();
      ws = addNode(
        ws,
        "axiom",
        "premise",
        { x: 0, y: 0 },
        "all x. all y. P(x, y)",
      );
      ws = addNode(ws, "axiom", "conclusion", { x: 100, y: 100 });
      ws = addNdEdge(ws, {
        _tag: "nd-universal-elim",
        conclusionNodeId: "node-2",
        premiseNodeId: "node-1",
        termText: "y",
        conclusionText: "",
      });
      const result = validateNdApplication(
        ws,
        ws.inferenceEdges[0] as NdInferenceEdge,
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("NdEigenvariableViolation");
      }
    });
  });

  // --- ∃I (Existential Intro) ---

  describe("∃I (Existential Intro)", () => {
    it("φ[t/x] から ∃x.φ を導出する", () => {
      let ws = createNdWorkspace();
      ws = addNode(ws, "axiom", "premise", { x: 0, y: 0 }, "P(y)");
      ws = addNode(ws, "axiom", "conclusion", { x: 100, y: 100 });
      ws = addNdEdge(ws, {
        _tag: "nd-existential-intro",
        conclusionNodeId: "node-2",
        premiseNodeId: "node-1",
        variableName: "x",
        termText: "y",
        conclusionText: "",
      });
      const result = validateNdApplication(
        ws,
        ws.inferenceEdges[0] as NdInferenceEdge,
      );
      expect(Either.isRight(result)).toBe(true);
      if (Either.isRight(result) && result.right._tag === "nd-success") {
        expect(result.right.conclusionText).toBe("∃x.P(x)");
      }
    });

    it("同じ変数でwit=var の場合も動作する", () => {
      let ws = createNdWorkspace();
      ws = addNode(ws, "axiom", "premise", { x: 0, y: 0 }, "P(x)");
      ws = addNode(ws, "axiom", "conclusion", { x: 100, y: 100 });
      ws = addNdEdge(ws, {
        _tag: "nd-existential-intro",
        conclusionNodeId: "node-2",
        premiseNodeId: "node-1",
        variableName: "y",
        termText: "x",
        conclusionText: "",
      });
      const result = validateNdApplication(
        ws,
        ws.inferenceEdges[0] as NdInferenceEdge,
      );
      expect(Either.isRight(result)).toBe(true);
      if (Either.isRight(result) && result.right._tag === "nd-success") {
        expect(result.right.conclusionText).toBe("∃y.P(y)");
      }
    });

    it("変数名が空の場合エラー", () => {
      let ws = createNdWorkspace();
      ws = addNode(ws, "axiom", "premise", { x: 0, y: 0 }, "P(x)");
      ws = addNode(ws, "axiom", "conclusion", { x: 100, y: 100 });
      ws = addNdEdge(ws, {
        _tag: "nd-existential-intro",
        conclusionNodeId: "node-2",
        premiseNodeId: "node-1",
        variableName: "",
        termText: "x",
        conclusionText: "",
      });
      const result = validateNdApplication(
        ws,
        ws.inferenceEdges[0] as NdInferenceEdge,
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("NdStructuralError");
      }
    });

    it("項テキストが空の場合エラー", () => {
      let ws = createNdWorkspace();
      ws = addNode(ws, "axiom", "premise", { x: 0, y: 0 }, "P(x)");
      ws = addNode(ws, "axiom", "conclusion", { x: 100, y: 100 });
      ws = addNdEdge(ws, {
        _tag: "nd-existential-intro",
        conclusionNodeId: "node-2",
        premiseNodeId: "node-1",
        variableName: "x",
        termText: "",
        conclusionText: "",
      });
      const result = validateNdApplication(
        ws,
        ws.inferenceEdges[0] as NdInferenceEdge,
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("NdTermParseError");
      }
    });

    it("前提が未接続の場合エラー", () => {
      let ws = createNdWorkspace();
      ws = addNode(ws, "axiom", "conclusion", { x: 100, y: 100 });
      ws = addNdEdge(ws, {
        _tag: "nd-existential-intro",
        conclusionNodeId: "node-1",
        premiseNodeId: undefined,
        variableName: "x",
        termText: "y",
        conclusionText: "",
      });
      const result = validateNdApplication(
        ws,
        ws.inferenceEdges[0] as NdInferenceEdge,
      );
      expect(Either.isLeft(result)).toBe(true);
    });

    it("termTextが不正な構文の場合NdTermParseError", () => {
      let ws = createNdWorkspace();
      ws = addNode(ws, "axiom", "premise", { x: 0, y: 0 }, "ex x. P(x)");
      ws = addNode(ws, "axiom", "conclusion", { x: 100, y: 100 });
      ws = addNdEdge(ws, {
        _tag: "nd-existential-intro",
        conclusionNodeId: "node-2",
        premiseNodeId: "node-1",
        variableName: "x",
        termText: "!!!invalid",
        conclusionText: "",
      });
      const result = validateNdApplication(
        ws,
        ws.inferenceEdges[0] as NdInferenceEdge,
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("NdTermParseError");
      }
    });

    it("termTextが変数でない場合（関数適用）エラー", () => {
      let ws = createNdWorkspace();
      ws = addNode(ws, "axiom", "premise", { x: 0, y: 0 }, "P(x)");
      ws = addNode(ws, "axiom", "conclusion", { x: 100, y: 100 });
      ws = addNdEdge(ws, {
        _tag: "nd-existential-intro",
        conclusionNodeId: "node-2",
        premiseNodeId: "node-1",
        variableName: "x",
        termText: "S(x)",
        conclusionText: "",
      });
      const result = validateNdApplication(
        ws,
        ws.inferenceEdges[0] as NdInferenceEdge,
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("NdStructuralError");
      }
    });
  });

  // --- ∃E (Existential Elim) ---

  describe("∃E (Existential Elim)", () => {
    it("∃x.φ と ケース前提χ から χ を導出する", () => {
      let ws = createNdWorkspace();
      ws = addNode(ws, "axiom", "existential", { x: 0, y: 0 }, "ex x. P(x)");
      ws = addNode(ws, "axiom", "case", { x: 200, y: 0 }, "Q");
      ws = addNode(ws, "axiom", "conclusion", { x: 100, y: 100 });
      ws = addNdEdge(ws, {
        _tag: "nd-existential-elim",
        conclusionNodeId: "node-3",
        existentialPremiseNodeId: "node-1",
        casePremiseNodeId: "node-2",
        dischargedAssumptionId: 1,
        dischargedFormulaText: "P(x)",
        conclusionText: "",
      });
      const result = validateNdApplication(
        ws,
        ws.inferenceEdges[0] as NdInferenceEdge,
      );
      expect(Either.isRight(result)).toBe(true);
      if (Either.isRight(result) && result.right._tag === "nd-success") {
        expect(result.right.conclusionText).toBe("Q");
      }
    });

    it("存在量化前提が∃でない場合エラー", () => {
      let ws = createNdWorkspace();
      ws = addNode(ws, "axiom", "notexist", { x: 0, y: 0 }, "P(x)");
      ws = addNode(ws, "axiom", "case", { x: 200, y: 0 }, "Q");
      ws = addNode(ws, "axiom", "conclusion", { x: 100, y: 100 });
      ws = addNdEdge(ws, {
        _tag: "nd-existential-elim",
        conclusionNodeId: "node-3",
        existentialPremiseNodeId: "node-1",
        casePremiseNodeId: "node-2",
        dischargedAssumptionId: 1,
        dischargedFormulaText: "P(x)",
        conclusionText: "",
      });
      const result = validateNdApplication(
        ws,
        ws.inferenceEdges[0] as NdInferenceEdge,
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("NdStructuralError");
      }
    });

    it("存在量化前提が未接続の場合エラー", () => {
      let ws = createNdWorkspace();
      ws = addNode(ws, "axiom", "case", { x: 200, y: 0 }, "Q");
      ws = addNode(ws, "axiom", "conclusion", { x: 100, y: 100 });
      ws = addNdEdge(ws, {
        _tag: "nd-existential-elim",
        conclusionNodeId: "node-2",
        existentialPremiseNodeId: undefined,
        casePremiseNodeId: "node-1",
        dischargedAssumptionId: 1,
        dischargedFormulaText: "P(x)",
        conclusionText: "",
      });
      const result = validateNdApplication(
        ws,
        ws.inferenceEdges[0] as NdInferenceEdge,
      );
      expect(Either.isLeft(result)).toBe(true);
    });

    it("ケース前提が未接続の場合エラー", () => {
      let ws = createNdWorkspace();
      ws = addNode(ws, "axiom", "existential", { x: 0, y: 0 }, "ex x. P(x)");
      ws = addNode(ws, "axiom", "conclusion", { x: 100, y: 100 });
      ws = addNdEdge(ws, {
        _tag: "nd-existential-elim",
        conclusionNodeId: "node-2",
        existentialPremiseNodeId: "node-1",
        casePremiseNodeId: undefined,
        dischargedAssumptionId: 1,
        dischargedFormulaText: "P(x)",
        conclusionText: "",
      });
      const result = validateNdApplication(
        ws,
        ws.inferenceEdges[0] as NdInferenceEdge,
      );
      expect(Either.isLeft(result)).toBe(true);
    });
  });

  // --- getNdErrorMessage: 量化子規則のエラーメッセージ ---

  describe("getNdErrorMessage (量化子)", () => {
    it("NdEigenvariableViolation のメッセージ", () => {
      const err: NdApplicationError = {
        _tag: "NdEigenvariableViolation",
        variableName: "x",
        message: "Term is not free for x in the formula body",
      } as NdApplicationError;
      expect(getNdErrorMessage(err)).toBe(
        "Term is not free for x in the formula body",
      );
    });

    it("NdTermParseError のメッセージ", () => {
      const err: NdApplicationError = {
        _tag: "NdTermParseError",
        label: "substitution term (t)",
      } as NdApplicationError;
      expect(getNdErrorMessage(err)).toBe(
        "Enter valid term for substitution term (t)",
      );
    });
  });
});

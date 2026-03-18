import { describe, it, expect } from "vitest";
import { Either } from "effect";
import { applyDeductionTheorem } from "./deductionTheorem";
import {
  axiomNode,
  modusPonensNode,
  generalizationNode,
  validateProof,
  countNodes,
} from "./proofTree";
import type { ProofNode } from "./proofTree";
import { implication, metaVariable, universal, predicate } from "./formula";
import { termVariable } from "./term";
import { equalFormula } from "./equality";
import { lukasiewiczSystem } from "./inferenceRule";

// ── ヘルパー ──────────────────────────────────────────────

const phi = metaVariable("φ");
const psi = metaVariable("ψ");
const chi = metaVariable("χ");
const xVar = termVariable("x");

/** 結論が期待される論理式と一致するか検証 */
const expectConclusion = (
  proof: ProofNode,
  expected: ReturnType<typeof implication>,
): void => {
  expect(equalFormula(proof.formula, expected)).toBe(true);
};

/** 証明木が有効か検証 */
const expectValid = (
  proof: ProofNode,
  system: typeof lukasiewiczSystem,
): void => {
  const result = validateProof(proof, system);
  expect(result._tag).toBe("Valid");
};

describe("deductionTheorem", () => {
  describe("AxiomNode(hypothesis) → A→A", () => {
    it("仮定Aに対してA→Aの有効な証明を構築する", () => {
      // 仮定 φ から φ を証明（自明）
      const proof = axiomNode(phi);
      const result = applyDeductionTheorem(proof, phi);

      expect(Either.isRight(result)).toBe(true);
      if (!Either.isRight(result)) return;

      const transformed = result.right;
      // 結論: φ → φ
      expectConclusion(transformed, implication(phi, phi));
      // 有効な証明であること
      expectValid(transformed, lukasiewiczSystem);
    });

    it("複合的な仮定に対しても正しく動作する", () => {
      const hypothesis = implication(phi, psi);
      const proof = axiomNode(hypothesis);
      const result = applyDeductionTheorem(proof, hypothesis);

      expect(Either.isRight(result)).toBe(true);
      if (!Either.isRight(result)) return;

      const transformed = result.right;
      expectConclusion(transformed, implication(hypothesis, hypothesis));
      expectValid(transformed, lukasiewiczSystem);
    });
  });

  describe("AxiomNode(other) → A→C", () => {
    it("公理CからA→Cの有効な証明を構築する", () => {
      // 仮定 φ の下で公理 ψ→(χ→ψ)（A1インスタンス）を使う
      const hypothesis = phi;
      const axiomFormula = implication(psi, implication(chi, psi)); // A1
      const proof = axiomNode(axiomFormula);
      const result = applyDeductionTheorem(proof, hypothesis);

      expect(Either.isRight(result)).toBe(true);
      if (!Either.isRight(result)) return;

      const transformed = result.right;
      // 結論: φ → (ψ → (χ → ψ))
      expectConclusion(transformed, implication(hypothesis, axiomFormula));
      expectValid(transformed, lukasiewiczSystem);
    });
  });

  describe("ModusPonensNode → A2利用の変換", () => {
    it("MPを含む証明を正しく変換する（純粋公理のみ）", () => {
      // 仮定 φ の下で:
      //   φ（仮定）と φ→(ψ→φ)（A1インスタンス）から ψ→φ をMP
      const hypothesis = phi;
      const a1Formula = implication(phi, implication(psi, phi)); // A1(φ,ψ)
      const antecedent = axiomNode(hypothesis); // 仮定
      const conditional = axiomNode(a1Formula); // A1
      const conclusion = implication(psi, phi);
      const mpNode = modusPonensNode(conclusion, antecedent, conditional);

      const result = applyDeductionTheorem(mpNode, hypothesis);

      expect(Either.isRight(result)).toBe(true);
      if (!Either.isRight(result)) return;

      const transformed = result.right;
      // 結論: φ → (ψ → φ)
      expectConclusion(transformed, implication(hypothesis, conclusion));
      // A1は真の公理インスタンスなので検証可能
      expectValid(transformed, lukasiewiczSystem);
    });

    it("連鎖MPを正しく変換する", () => {
      // 仮定 φ の下で:
      //   φ→ψ（仮定Γの一部）、ψ→χ（仮定Γの一部）からχを導出
      // ※ φ→ψ, ψ→χ は公理インスタンスではなくΓの仮定
      const hypothesis = phi;
      const phiImplPsi = implication(phi, psi);
      const psiImplChi = implication(psi, chi);

      // φ（仮定）とφ→ψ（Γ）からψ
      const step1 = axiomNode(hypothesis);
      const step2 = axiomNode(phiImplPsi);
      const step3 = modusPonensNode(psi, step1, step2);

      // ψ と ψ→χ からχ
      const step4 = axiomNode(psiImplChi);
      const step5 = modusPonensNode(chi, step3, step4);

      const result = applyDeductionTheorem(step5, hypothesis);

      expect(Either.isRight(result)).toBe(true);
      if (!Either.isRight(result)) return;

      const transformed = result.right;
      // 結論: φ → χ
      expectConclusion(transformed, implication(hypothesis, chi));
      // Γの仮定が残るためvalidateProofは使わず、構造のみ検証
      expect(transformed._tag).toBe("ModusPonensNode");
    });
  });

  describe("GeneralizationNode → Gen+A5の変換", () => {
    it("xがAに自由でない場合、正しく変換する", () => {
      // 仮定 φ（メタ変数、xは自由でない）の下で:
      //   P(x)（Γの仮定）から ∀x.P(x) を汎化
      const hypothesis = phi; // xは自由でない
      const px = predicate("P", [xVar]);
      const forallXPx = universal(xVar, px);

      const premiseNode = axiomNode(px);
      const genNode = generalizationNode(forallXPx, xVar, premiseNode);

      const result = applyDeductionTheorem(genNode, hypothesis);

      expect(Either.isRight(result)).toBe(true);
      if (!Either.isRight(result)) return;

      const transformed = result.right;
      // 結論: φ → ∀x.P(x)
      expectConclusion(transformed, implication(hypothesis, forallXPx));
      // P(x)はΓの仮定のため構造のみ検証（A5 + Gen + MP）
      expect(transformed._tag).toBe("ModusPonensNode");
    });
  });

  describe("GeneralizationNode with free variable error", () => {
    it("xが仮定Aに自由に出現する場合、エラーを返す", () => {
      // 仮定 P(x)（xが自由）の下で ∀x.P(x)
      const hypothesis = predicate("P", [xVar]);
      const forallXPx = universal(xVar, hypothesis);

      const premiseNode = axiomNode(hypothesis);
      const genNode = generalizationNode(forallXPx, xVar, premiseNode);

      const result = applyDeductionTheorem(genNode, hypothesis);

      expect(Either.isLeft(result)).toBe(true);
      if (!Either.isLeft(result)) return;

      expect(result.left._tag).toBe("DeductionTheoremFreeVariableError");
      if (result.left._tag !== "DeductionTheoremFreeVariableError") return;
      expect(result.left.variable).toBe("x");
    });
  });

  describe("複合証明の変換", () => {
    it("identity proof φ→φ に対する演繹定理の適用", () => {
      // φ→φ の証明（仮定なし、純粋な公理のみ）
      // A2(φ, ψ→φ, φ) を使った標準構成
      const a2Formula = implication(
        implication(phi, implication(implication(psi, phi), phi)),
        implication(
          implication(phi, implication(psi, phi)),
          implication(phi, phi),
        ),
      );
      const a1Formula1 = implication(
        phi,
        implication(implication(psi, phi), phi),
      );
      const a1Formula2 = implication(phi, implication(psi, phi));

      const step1 = axiomNode(a2Formula);
      const step2 = axiomNode(a1Formula1);
      const step3Result = implication(
        implication(phi, implication(psi, phi)),
        implication(phi, phi),
      );
      const step3 = modusPonensNode(step3Result, step2, step1);
      const step4 = axiomNode(a1Formula2);
      const step5 = modusPonensNode(implication(phi, phi), step4, step3);

      // 仮定 χ の下でこの証明を変換
      const hypothesis = chi;
      const result = applyDeductionTheorem(step5, hypothesis);

      expect(Either.isRight(result)).toBe(true);
      if (!Either.isRight(result)) return;

      const transformed = result.right;
      // 結論: χ → (φ → φ)
      expectConclusion(
        transformed,
        implication(hypothesis, implication(phi, phi)),
      );
      expectValid(transformed, lukasiewiczSystem);
    });

    it("変換後の証明木はノード数が増加する", () => {
      // 単純なMP証明
      const hypothesis = phi;
      const phiImplPsi = implication(phi, psi);
      const mpProof = modusPonensNode(
        psi,
        axiomNode(hypothesis),
        axiomNode(phiImplPsi),
      );

      const originalCount = countNodes(mpProof);
      const result = applyDeductionTheorem(mpProof, hypothesis);

      expect(Either.isRight(result)).toBe(true);
      if (!Either.isRight(result)) return;

      const transformedCount = countNodes(result.right);
      // 演繹定理の変換はノード数を増やす
      expect(transformedCount).toBeGreaterThan(originalCount);
    });
  });
});

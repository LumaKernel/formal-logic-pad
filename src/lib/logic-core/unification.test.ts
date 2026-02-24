import { describe, it, expect } from "vitest";
import {
  metaVariable,
  implication,
  negation,
  conjunction,
  disjunction,
  biconditional,
  universal,
  existential,
  predicate,
  equality,
  termVariable,
  termMetaVariable,
  constant,
  functionApplication,
  binaryOperation,
} from "./index";
import { metaVariableKey, termMetaVariableKey } from "./metaVariable";
import { equalFormula, equalTerm } from "./equality";
import {
  substituteFormulaMetaVariables,
  substituteTermMetaVariablesInFormula,
  substituteTermMetaVariablesInTerm,
} from "./substitution";
import { unifyFormulas, unifyTerms } from "./unification";
import type { UnificationResult } from "./unification";

// ── ヘルパー ──────────────────────────────────────────────

const expectOk = (result: UnificationResult) => {
  expect(result._tag).toBe("Ok");
  if (result._tag !== "Ok") throw new Error("Expected Ok");
  return result;
};

const expectError = (result: UnificationResult) => {
  expect(result._tag).toBe("Error");
  if (result._tag !== "Error") throw new Error("Expected Error");
  return result;
};

/**
 * ユニフィケーション結果の代入を適用して、source と target が等しくなることを検証。
 */
const verifyFormulaUnification = (
  result: UnificationResult,
  source: Parameters<typeof equalFormula>[0],
  target: Parameters<typeof equalFormula>[0],
) => {
  const ok = expectOk(result);
  // source に代入を適用
  let sourceApplied = substituteFormulaMetaVariables(
    source,
    ok.formulaSubstitution,
  );
  sourceApplied = substituteTermMetaVariablesInFormula(
    sourceApplied,
    ok.termSubstitution,
  );
  // target に代入を適用
  let targetApplied = substituteFormulaMetaVariables(
    target,
    ok.formulaSubstitution,
  );
  targetApplied = substituteTermMetaVariablesInFormula(
    targetApplied,
    ok.termSubstitution,
  );
  expect(equalFormula(sourceApplied, targetApplied)).toBe(true);
};

// ── ファクトリ短縮 ──────────────────────────────────────────

const phi = metaVariable("φ");
const psi = metaVariable("ψ");
const chi = metaVariable("χ");
const alpha = metaVariable("α");
const x = termVariable("x");
const y = termVariable("y");
const tau = termMetaVariable("τ");
const sigma = termMetaVariable("σ");

describe("unifyFormulas", () => {
  describe("Delete: 同一式", () => {
    it("同一のメタ変数同士", () => {
      const result = unifyFormulas(phi, phi);
      const ok = expectOk(result);
      expect(ok.formulaSubstitution.size).toBe(0);
      expect(ok.termSubstitution.size).toBe(0);
    });

    it("同一の複合式同士", () => {
      const expr = implication(phi, psi);
      const result = unifyFormulas(expr, expr);
      const ok = expectOk(result);
      expect(ok.formulaSubstitution.size).toBe(0);
    });

    it("同一の述語同士", () => {
      const p = predicate("P", [x, y]);
      const result = unifyFormulas(p, p);
      const ok = expectOk(result);
      expect(ok.formulaSubstitution.size).toBe(0);
    });
  });

  describe("Eliminate: メタ変数への代入", () => {
    it("メタ変数 ← 述語", () => {
      const target = predicate("P", [x]);
      const result = unifyFormulas(phi, target);
      const ok = expectOk(result);
      expect(ok.formulaSubstitution.size).toBe(1);
      const bound = ok.formulaSubstitution.get(metaVariableKey(phi));
      expect(bound).toBeDefined();
      expect(equalFormula(bound!, target)).toBe(true);
    });

    it("述語 ← メタ変数 (Orient)", () => {
      const target = predicate("P", [x]);
      const result = unifyFormulas(target, phi);
      const ok = expectOk(result);
      expect(ok.formulaSubstitution.size).toBe(1);
      const bound = ok.formulaSubstitution.get(metaVariableKey(phi));
      expect(bound).toBeDefined();
      expect(equalFormula(bound!, target)).toBe(true);
    });

    it("メタ変数 ← 複合式", () => {
      const target = implication(predicate("P", [x]), predicate("Q", [y]));
      const result = unifyFormulas(phi, target);
      const ok = expectOk(result);
      expect(ok.formulaSubstitution.get(metaVariableKey(phi))).toBeDefined();
      verifyFormulaUnification(result, phi, target);
    });

    it("メタ変数同士（異なる名前）", () => {
      const result = unifyFormulas(phi, psi);
      const ok = expectOk(result);
      // φ → ψ または ψ → φ のどちらかが代入される
      expect(ok.formulaSubstitution.size).toBe(1);
    });
  });

  describe("Decompose: 構造の分解", () => {
    it("含意の分解", () => {
      const source = implication(phi, psi);
      const target = implication(predicate("P", [x]), predicate("Q", [y]));
      const result = unifyFormulas(source, target);
      const ok = expectOk(result);
      verifyFormulaUnification(result, source, target);
      expect(
        equalFormula(
          ok.formulaSubstitution.get(metaVariableKey(phi))!,
          predicate("P", [x]),
        ),
      ).toBe(true);
      expect(
        equalFormula(
          ok.formulaSubstitution.get(metaVariableKey(psi))!,
          predicate("Q", [y]),
        ),
      ).toBe(true);
    });

    it("否定の分解", () => {
      const source = negation(phi);
      const target = negation(predicate("P", [x]));
      const result = unifyFormulas(source, target);
      verifyFormulaUnification(result, source, target);
    });

    it("連言の分解", () => {
      const source = conjunction(phi, psi);
      const target = conjunction(predicate("P", [x]), predicate("Q", [y]));
      const result = unifyFormulas(source, target);
      verifyFormulaUnification(result, source, target);
    });

    it("選言の分解", () => {
      const source = disjunction(phi, psi);
      const target = disjunction(predicate("P", [x]), predicate("Q", [y]));
      const result = unifyFormulas(source, target);
      verifyFormulaUnification(result, source, target);
    });

    it("双条件の分解", () => {
      const source = biconditional(phi, psi);
      const target = biconditional(predicate("P", [x]), predicate("Q", [y]));
      const result = unifyFormulas(source, target);
      verifyFormulaUnification(result, source, target);
    });

    it("全称量化の分解", () => {
      const source = universal(x, phi);
      const target = universal(x, predicate("P", [x]));
      const result = unifyFormulas(source, target);
      verifyFormulaUnification(result, source, target);
    });

    it("存在量化の分解", () => {
      const source = existential(x, phi);
      const target = existential(x, predicate("P", [x]));
      const result = unifyFormulas(source, target);
      verifyFormulaUnification(result, source, target);
    });

    it("等号の分解", () => {
      const source = equality(tau, sigma);
      const target = equality(x, y);
      const result = unifyFormulas(source, target);
      const ok = expectOk(result);
      expect(
        equalTerm(ok.termSubstitution.get(termMetaVariableKey(tau))!, x),
      ).toBe(true);
      expect(
        equalTerm(ok.termSubstitution.get(termMetaVariableKey(sigma))!, y),
      ).toBe(true);
    });

    it("述語の分解（同名・同アリティ）", () => {
      const source = predicate("P", [tau, sigma]);
      const target = predicate("P", [x, y]);
      const result = unifyFormulas(source, target);
      const ok = expectOk(result);
      expect(
        equalTerm(ok.termSubstitution.get(termMetaVariableKey(tau))!, x),
      ).toBe(true);
      expect(
        equalTerm(ok.termSubstitution.get(termMetaVariableKey(sigma))!, y),
      ).toBe(true);
    });
  });

  describe("リファレンス例題 (04-substitution-and-unification.md)", () => {
    it("例1: K公理スキーマのマッチング", () => {
      // source: φ → (ψ → φ)
      // target: P(x) → (Q(y) → P(x))
      const source = implication(phi, implication(psi, phi));
      const target = implication(
        predicate("P", [x]),
        implication(predicate("Q", [y]), predicate("P", [x])),
      );
      const result = unifyFormulas(source, target);
      const ok = expectOk(result);
      verifyFormulaUnification(result, source, target);
      expect(
        equalFormula(
          ok.formulaSubstitution.get(metaVariableKey(phi))!,
          predicate("P", [x]),
        ),
      ).toBe(true);
      expect(
        equalFormula(
          ok.formulaSubstitution.get(metaVariableKey(psi))!,
          predicate("Q", [y]),
        ),
      ).toBe(true);
    });

    it("例2: 変数が複数箇所に出現 (φ→φ = P(x)→P(x))", () => {
      const source = implication(phi, phi);
      const target = implication(predicate("P", [x]), predicate("P", [x]));
      const result = unifyFormulas(source, target);
      const ok = expectOk(result);
      verifyFormulaUnification(result, source, target);
      expect(
        equalFormula(
          ok.formulaSubstitution.get(metaVariableKey(phi))!,
          predicate("P", [x]),
        ),
      ).toBe(true);
    });

    it("例3: 失敗（構造不一致 φ→φ vs P(x)→Q(y)）", () => {
      const source = implication(phi, phi);
      const target = implication(predicate("P", [x]), predicate("Q", [y]));
      const result = unifyFormulas(source, target);
      const error = expectError(result);
      expect(error.error._tag).toBe("StructureMismatch");
    });

    it("例4: 失敗（occurs check: φ = φ→ψ）", () => {
      const source = phi;
      const target = implication(phi, psi);
      const result = unifyFormulas(source, target);
      const error = expectError(result);
      expect(error.error._tag).toBe("OccursCheck");
    });

    it("例5: S公理スキーマのマッチング", () => {
      // S公理: (φ→(ψ→χ)) → ((φ→ψ) → (φ→χ))
      const source = implication(
        implication(phi, implication(psi, chi)),
        implication(implication(phi, psi), implication(phi, chi)),
      );
      const Px = predicate("P", [x]);
      const PxToPx = implication(Px, Px);
      // target: (P(x)→((P(x)→P(x))→P(x))) → ((P(x)→(P(x)→P(x))) → (P(x)→P(x)))
      const target = implication(
        implication(Px, implication(PxToPx, Px)),
        implication(implication(Px, PxToPx), implication(Px, Px)),
      );
      const result = unifyFormulas(source, target);
      const ok = expectOk(result);
      verifyFormulaUnification(result, source, target);
      expect(
        equalFormula(ok.formulaSubstitution.get(metaVariableKey(phi))!, Px),
      ).toBe(true);
      expect(
        equalFormula(ok.formulaSubstitution.get(metaVariableKey(psi))!, PxToPx),
      ).toBe(true);
      expect(
        equalFormula(ok.formulaSubstitution.get(metaVariableKey(chi))!, Px),
      ).toBe(true);
    });
  });

  describe("双方向ユニフィケーション", () => {
    it("両辺にメタ変数がある場合", () => {
      // φ→ψ = χ→α
      const source = implication(phi, psi);
      const target = implication(chi, alpha);
      const result = unifyFormulas(source, target);
      verifyFormulaUnification(result, source, target);
    });

    it("重複メタ変数を含む双方向", () => {
      // φ→φ = ψ→ψ
      const source = implication(phi, phi);
      const target = implication(psi, psi);
      const result = unifyFormulas(source, target);
      verifyFormulaUnification(result, source, target);
    });

    it("メタ変数の連鎖的な解決", () => {
      // φ = ψ, ψ = P(x)
      // つまり φ→P(x) = ψ→ψ （ψ=P(x)が導かれ、φ=ψ=P(x)）
      const Px = predicate("P", [x]);
      const source = implication(phi, Px);
      const target = implication(psi, psi);
      const result = unifyFormulas(source, target);
      verifyFormulaUnification(result, source, target);
    });
  });

  describe("Occurs Check", () => {
    it("直接的なoccurs check: φ = ¬φ", () => {
      const result = unifyFormulas(phi, negation(phi));
      const error = expectError(result);
      expect(error.error._tag).toBe("OccursCheck");
    });

    it("間接的なoccurs check: φ = φ∧ψ", () => {
      const result = unifyFormulas(phi, conjunction(phi, psi));
      const error = expectError(result);
      expect(error.error._tag).toBe("OccursCheck");
    });

    it("入れ子のoccurs check: φ = (ψ→φ)→χ", () => {
      const result = unifyFormulas(
        phi,
        implication(implication(psi, phi), chi),
      );
      const error = expectError(result);
      expect(error.error._tag).toBe("OccursCheck");
    });

    it("量化子内のoccurs check: φ = ∀x.φ", () => {
      const result = unifyFormulas(phi, universal(x, phi));
      const error = expectError(result);
      expect(error.error._tag).toBe("OccursCheck");
    });

    it("存在量化子内のoccurs check: φ = ∃x.φ", () => {
      const result = unifyFormulas(phi, existential(x, phi));
      const error = expectError(result);
      expect(error.error._tag).toBe("OccursCheck");
    });
  });

  describe("構造不一致", () => {
    it("異なるタグ: 含意 vs 連言", () => {
      const result = unifyFormulas(
        implication(predicate("P", [x]), predicate("Q", [y])),
        conjunction(predicate("P", [x]), predicate("Q", [y])),
      );
      const error = expectError(result);
      expect(error.error._tag).toBe("StructureMismatch");
    });

    it("異なる述語名", () => {
      const result = unifyFormulas(predicate("P", [x]), predicate("Q", [x]));
      const error = expectError(result);
      expect(error.error._tag).toBe("StructureMismatch");
    });

    it("述語の引数数不一致", () => {
      const result = unifyFormulas(predicate("P", [x]), predicate("P", [x, y]));
      const error = expectError(result);
      expect(error.error._tag).toBe("StructureMismatch");
    });

    it("量化子の束縛変数不一致", () => {
      const result = unifyFormulas(
        universal(x, predicate("P", [x])),
        universal(y, predicate("P", [y])),
      );
      // 束縛変数が異なる → 変数名の不一致
      const error = expectError(result);
      expect(error.error._tag).toBe("StructureMismatch");
    });
  });

  describe("添字付きメタ変数", () => {
    it("φ1 と φ は異なるメタ変数として扱われる", () => {
      const phi1 = metaVariable("φ", "1");
      // φ1→φ = P(x)→Q(y)
      const source = implication(phi1, phi);
      const target = implication(predicate("P", [x]), predicate("Q", [y]));
      const result = unifyFormulas(source, target);
      const ok = expectOk(result);
      expect(
        equalFormula(
          ok.formulaSubstitution.get(metaVariableKey(phi1))!,
          predicate("P", [x]),
        ),
      ).toBe(true);
      expect(
        equalFormula(
          ok.formulaSubstitution.get(metaVariableKey(phi))!,
          predicate("Q", [y]),
        ),
      ).toBe(true);
    });

    it("φ1 と φ01 は異なるメタ変数として扱われる", () => {
      const phi1 = metaVariable("φ", "1");
      const phi01 = metaVariable("φ", "01");
      const source = implication(phi1, phi01);
      const target = implication(predicate("P", [x]), predicate("Q", [y]));
      const result = unifyFormulas(source, target);
      const ok = expectOk(result);
      expect(
        equalFormula(
          ok.formulaSubstitution.get(metaVariableKey(phi1))!,
          predicate("P", [x]),
        ),
      ).toBe(true);
      expect(
        equalFormula(
          ok.formulaSubstitution.get(metaVariableKey(phi01))!,
          predicate("Q", [y]),
        ),
      ).toBe(true);
    });
  });

  describe("項メタ変数を含むユニフィケーション", () => {
    it("項メタ変数 ← 項変数", () => {
      const source = predicate("P", [tau]);
      const target = predicate("P", [x]);
      const result = unifyFormulas(source, target);
      const ok = expectOk(result);
      expect(
        equalTerm(ok.termSubstitution.get(termMetaVariableKey(tau))!, x),
      ).toBe(true);
    });

    it("項メタ変数 ← 定数", () => {
      const c = constant("0");
      const source = predicate("P", [tau]);
      const target = predicate("P", [c]);
      const result = unifyFormulas(source, target);
      const ok = expectOk(result);
      expect(
        equalTerm(ok.termSubstitution.get(termMetaVariableKey(tau))!, c),
      ).toBe(true);
    });

    it("項メタ変数 ← 関数適用", () => {
      const fx = functionApplication("f", [x]);
      const source = predicate("P", [tau]);
      const target = predicate("P", [fx]);
      const result = unifyFormulas(source, target);
      const ok = expectOk(result);
      expect(
        equalTerm(ok.termSubstitution.get(termMetaVariableKey(tau))!, fx),
      ).toBe(true);
    });

    it("項メタ変数 ← 二項演算", () => {
      const xPlusY = binaryOperation("+", x, y);
      const source = predicate("P", [tau]);
      const target = predicate("P", [xPlusY]);
      const result = unifyFormulas(source, target);
      const ok = expectOk(result);
      expect(
        equalTerm(ok.termSubstitution.get(termMetaVariableKey(tau))!, xPlusY),
      ).toBe(true);
    });

    it("複数の項メタ変数", () => {
      const source = equality(tau, sigma);
      const target = equality(x, functionApplication("f", [y]));
      const result = unifyFormulas(source, target);
      const ok = expectOk(result);
      expect(
        equalTerm(ok.termSubstitution.get(termMetaVariableKey(tau))!, x),
      ).toBe(true);
      expect(
        equalTerm(
          ok.termSubstitution.get(termMetaVariableKey(sigma))!,
          functionApplication("f", [y]),
        ),
      ).toBe(true);
    });

    it("項メタ変数の occurs check (項レベル)", () => {
      // τ = f(τ) → 失敗
      const result = unifyTerms(tau, functionApplication("f", [tau]));
      const error = expectError(result);
      expect(error.error._tag).toBe("OccursCheck");
    });
  });

  describe("論理式と項メタ変数の混合", () => {
    it("論理式メタ変数と項メタ変数の同時解決", () => {
      // φ→P(τ) = Q(x)→P(y)
      const source = implication(phi, predicate("P", [tau]));
      const target = implication(predicate("Q", [x]), predicate("P", [y]));
      const result = unifyFormulas(source, target);
      const ok = expectOk(result);
      verifyFormulaUnification(result, source, target);
      expect(
        equalFormula(
          ok.formulaSubstitution.get(metaVariableKey(phi))!,
          predicate("Q", [x]),
        ),
      ).toBe(true);
      expect(
        equalTerm(ok.termSubstitution.get(termMetaVariableKey(tau))!, y),
      ).toBe(true);
    });

    it("論理式メタ変数Eliminateの際に残存する項方程式がスキップされる", () => {
      // P(τ) ∧ φ = P(x) ∧ Q(y)
      // Decompose Conjunction → [P(τ)=P(x), φ=Q(y)]
      // Decompose Predicate P(τ)=P(x) → [φ=Q(y), τ=x]
      // Eliminate φ → applyFormulaSubstToEquations on [τ=x] → 項方程式なのでそのまま返す (line 166)
      const source = conjunction(predicate("P", [tau]), phi);
      const target = conjunction(predicate("P", [x]), predicate("Q", [y]));
      const result = unifyFormulas(source, target);
      verifyFormulaUnification(result, source, target);
    });

    it("項メタ変数Eliminateの際に残存する論理式方程式に代入が適用される", () => {
      // P(τ) → (φ → ψ) = P(x) → (Q(y) → R(z))
      // 処理順:
      //   Decompose Implication → [P(τ)=P(x), (φ→ψ)=(Q(y)→R(z))]
      //   Decompose Predicate  → [(φ→ψ)=(Q(y)→R(z)), τ=x]
      //   Decompose Implication → [τ=x, φ=Q(y), ψ=R(z)]
      //   Eliminate τ → applyTermSubstToEquations on [φ=Q(y), ψ=R(z)] → 論理式方程式に適用 (line 181)
      const z = termVariable("z");
      const source = implication(predicate("P", [tau]), implication(phi, psi));
      const target = implication(
        predicate("P", [x]),
        implication(predicate("Q", [y]), predicate("R", [z])),
      );
      const result = unifyFormulas(source, target);
      verifyFormulaUnification(result, source, target);
    });
  });
});

describe("unifyTerms", () => {
  describe("Delete: 同一項", () => {
    it("同一変数", () => {
      const result = unifyTerms(x, x);
      const ok = expectOk(result);
      expect(ok.termSubstitution.size).toBe(0);
    });

    it("同一定数", () => {
      const c = constant("0");
      const result = unifyTerms(c, c);
      const ok = expectOk(result);
      expect(ok.termSubstitution.size).toBe(0);
    });
  });

  describe("Eliminate: 項メタ変数への代入", () => {
    it("項メタ変数 ← 変数", () => {
      const result = unifyTerms(tau, x);
      const ok = expectOk(result);
      expect(
        equalTerm(ok.termSubstitution.get(termMetaVariableKey(tau))!, x),
      ).toBe(true);
    });

    it("変数 ← 項メタ変数 (Orient)", () => {
      const result = unifyTerms(x, tau);
      // TermVariable は MetaVariable ではないので、decompose で不一致になるはず
      // 実際には TermVariable と TermMetaVariable は異なる _tag なので、
      // Orient ルールが適用されて τ ← x になる
      const ok = expectOk(result);
      expect(
        equalTerm(ok.termSubstitution.get(termMetaVariableKey(tau))!, x),
      ).toBe(true);
    });

    it("項メタ変数同士", () => {
      const result = unifyTerms(tau, sigma);
      const ok = expectOk(result);
      expect(ok.termSubstitution.size).toBe(1);
    });
  });

  describe("Decompose: 項の分解", () => {
    it("関数適用の分解", () => {
      const source = functionApplication("f", [tau, sigma]);
      const target = functionApplication("f", [x, y]);
      const result = unifyTerms(source, target);
      const ok = expectOk(result);
      expect(
        equalTerm(ok.termSubstitution.get(termMetaVariableKey(tau))!, x),
      ).toBe(true);
      expect(
        equalTerm(ok.termSubstitution.get(termMetaVariableKey(sigma))!, y),
      ).toBe(true);
    });

    it("二項演算の分解", () => {
      const source = binaryOperation("+", tau, sigma);
      const target = binaryOperation("+", x, y);
      const result = unifyTerms(source, target);
      const ok = expectOk(result);
      expect(
        equalTerm(ok.termSubstitution.get(termMetaVariableKey(tau))!, x),
      ).toBe(true);
      expect(
        equalTerm(ok.termSubstitution.get(termMetaVariableKey(sigma))!, y),
      ).toBe(true);
    });

    it("入れ子の関数適用", () => {
      const source = functionApplication("f", [
        functionApplication("g", [tau]),
      ]);
      const target = functionApplication("f", [functionApplication("g", [x])]);
      const result = unifyTerms(source, target);
      const ok = expectOk(result);
      expect(
        equalTerm(ok.termSubstitution.get(termMetaVariableKey(tau))!, x),
      ).toBe(true);
    });
  });

  describe("Occurs Check", () => {
    it("τ = f(τ)", () => {
      const result = unifyTerms(tau, functionApplication("f", [tau]));
      const error = expectError(result);
      expect(error.error._tag).toBe("OccursCheck");
    });

    it("τ = τ + σ", () => {
      const result = unifyTerms(tau, binaryOperation("+", tau, sigma));
      const error = expectError(result);
      expect(error.error._tag).toBe("OccursCheck");
    });
  });

  describe("構造不一致", () => {
    it("異なる変数名", () => {
      const result = unifyTerms(x, y);
      const error = expectError(result);
      expect(error.error._tag).toBe("StructureMismatch");
    });

    it("異なる定数名", () => {
      const result = unifyTerms(constant("0"), constant("1"));
      const error = expectError(result);
      expect(error.error._tag).toBe("StructureMismatch");
    });

    it("異なる関数名", () => {
      const result = unifyTerms(
        functionApplication("f", [x]),
        functionApplication("g", [x]),
      );
      const error = expectError(result);
      expect(error.error._tag).toBe("StructureMismatch");
    });

    it("異なる引数数", () => {
      const result = unifyTerms(
        functionApplication("f", [x]),
        functionApplication("f", [x, y]),
      );
      const error = expectError(result);
      expect(error.error._tag).toBe("StructureMismatch");
    });

    it("異なる二項演算子", () => {
      const result = unifyTerms(
        binaryOperation("+", x, y),
        binaryOperation("*", x, y),
      );
      const error = expectError(result);
      expect(error.error._tag).toBe("StructureMismatch");
    });

    it("異なるタグ: 変数 vs 定数", () => {
      const result = unifyTerms(x, constant("a"));
      const error = expectError(result);
      expect(error.error._tag).toBe("StructureMismatch");
    });

    it("異なるタグ: 変数 vs 関数適用", () => {
      const result = unifyTerms(x, functionApplication("f", [y]));
      const error = expectError(result);
      expect(error.error._tag).toBe("StructureMismatch");
    });
  });

  describe("項メタ変数の添字付き", () => {
    it("τ1 と τ は異なるメタ変数", () => {
      const tau1 = termMetaVariable("τ", "1");
      const source = functionApplication("f", [tau1, tau]);
      const target = functionApplication("f", [x, y]);
      const result = unifyTerms(source, target);
      const ok = expectOk(result);
      expect(
        equalTerm(ok.termSubstitution.get(termMetaVariableKey(tau1))!, x),
      ).toBe(true);
      expect(
        equalTerm(ok.termSubstitution.get(termMetaVariableKey(tau))!, y),
      ).toBe(true);
    });
  });

  describe("複数回出現する項メタ変数", () => {
    it("τ が複数箇所に出現して一貫性チェック（成功）", () => {
      // f(τ, τ) = f(x, x)
      const source = functionApplication("f", [tau, tau]);
      const target = functionApplication("f", [x, x]);
      const result = unifyTerms(source, target);
      const ok = expectOk(result);
      expect(
        equalTerm(ok.termSubstitution.get(termMetaVariableKey(tau))!, x),
      ).toBe(true);
    });

    it("τ が複数箇所に出現して一貫性チェック（失敗）", () => {
      // f(τ, τ) = f(x, y) where x ≠ y
      const source = functionApplication("f", [tau, tau]);
      const target = functionApplication("f", [x, y]);
      const result = unifyTerms(source, target);
      const error = expectError(result);
      expect(error.error._tag).toBe("StructureMismatch");
    });
  });

  describe("双方向の項ユニフィケーション", () => {
    it("両辺に項メタ変数", () => {
      // f(τ, x) = f(y, σ)
      const source = functionApplication("f", [tau, x]);
      const target = functionApplication("f", [y, sigma]);
      const result = unifyTerms(source, target);
      const ok = expectOk(result);
      // τ → y, σ → x
      expect(
        equalTerm(ok.termSubstitution.get(termMetaVariableKey(tau))!, y),
      ).toBe(true);
      expect(
        equalTerm(ok.termSubstitution.get(termMetaVariableKey(sigma))!, x),
      ).toBe(true);
    });

    it("連鎖的な解決: τ = σ, σ = x", () => {
      // f(τ, x) = f(σ, σ)
      const source = functionApplication("f", [tau, x]);
      const target = functionApplication("f", [sigma, sigma]);
      const result = unifyTerms(source, target);
      const ok = expectOk(result);

      // 代入を適用して等しくなることを確認
      const sourceApplied = substituteTermMetaVariablesInTerm(
        source,
        ok.termSubstitution,
      );
      const targetApplied = substituteTermMetaVariablesInTerm(
        target,
        ok.termSubstitution,
      );
      expect(equalTerm(sourceApplied, targetApplied)).toBe(true);
    });
  });
});

/**
 * 演繹定理モジュール。
 *
 * Hilbert系の演繹定理の構成的証明を実装する。
 * Γ ∪ {A} ⊢ B の証明木を Γ ⊢ A → B の証明木に変換する。
 *
 * 変換アルゴリズム:
 * - AxiomNode(A) [仮定]: A → A の証明を構築（A1 + A2 + MP）
 * - AxiomNode(C) [公理/他の仮定]: A1(C, A) + MP で A → C を構築
 * - ModusPonensNode(E) from D, D→E: A2 + MP + MP で A → E を構築
 * - GeneralizationNode(∀x.D) from D: Gen + A5 + MP で A → ∀x.D を構築
 *
 * 変更時は deductionTheorem.test.ts, index.ts も同期すること。
 *
 * @see dev/logic-reference/02-propositional-logic.md
 */

import { Data, Either, Effect } from "effect";
import { type Formula, implication, universal } from "./formula";
import type { TermVariable } from "./term";
import { equalFormula } from "./equality";
import {
  substituteFormulaMetaVariables,
  type FormulaSubstitutionMap,
} from "./substitution";
import { freeVariablesInFormula } from "./freeVariables";
import { axiomA1Template, axiomA2Template } from "./inferenceRule";
import { metaVariableKey } from "./metaVariable";
import { type MetaVariable, metaVariable } from "./formula";
import {
  type ProofNode,
  axiomNode,
  modusPonensNode,
  generalizationNode,
} from "./proofTree";

// ── メタ変数ヘルパー（A1/A2インスタンス構築用） ──────────────

const phi: MetaVariable = metaVariable("φ");
const psi: MetaVariable = metaVariable("ψ");
const chi: MetaVariable = metaVariable("χ");

/**
 * A1 インスタンスを構築: p → (q → p)
 */
const a1Instance = (p: Formula, q: Formula): Formula => {
  const subst: FormulaSubstitutionMap = new Map([
    [metaVariableKey(phi), p],
    [metaVariableKey(psi), q],
  ]);
  return substituteFormulaMetaVariables(axiomA1Template, subst);
};

/**
 * A2 インスタンスを構築: (p → (q → r)) → ((p → q) → (p → r))
 */
const a2Instance = (p: Formula, q: Formula, r: Formula): Formula => {
  const subst: FormulaSubstitutionMap = new Map([
    [metaVariableKey(phi), p],
    [metaVariableKey(psi), q],
    [metaVariableKey(chi), r],
  ]);
  return substituteFormulaMetaVariables(axiomA2Template, subst);
};

// ── エラー型 ────────────────────────────────────────────────

/**
 * 汎化で束縛する変数が仮定 A に自由に出現するエラー。
 * 演繹定理の前提条件違反。
 */
export class DeductionTheoremFreeVariableError extends Data.TaggedError(
  "DeductionTheoremFreeVariableError",
)<{
  readonly variable: string;
  readonly hypothesis: Formula;
}> {}

export type DeductionTheoremError = DeductionTheoremFreeVariableError;

// ── A → A 証明構築 ──────────────────────────────────────────

/**
 * A → A の証明木を構築する。
 *
 * 構成:
 *   1. A2(A, B→A, A): (A→((B→A)→A)) → ((A→(B→A)) → (A→A))
 *   2. A1(A, B→A): A → ((B→A) → A)
 *   3. MP(2, 1): (A→(B→A)) → (A→A)
 *   4. A1(A, B): A → (B→A)
 *   5. MP(4, 3): A→A
 *
 * B は任意。ここでは A を使う。
 */
const buildIdentityProof = (a: Formula): ProofNode => {
  // B = A（任意の選択）
  const b = a;

  // A → (B → A) = A1(A, B)
  const bImplA = implication(b, a);

  // step 1: A2(A, B→A, A) = (A→((B→A)→A)) → ((A→(B→A)) → (A→A))
  const a2Formula = a2Instance(a, bImplA, a);
  const step1 = axiomNode(a2Formula);

  // step 2: A1(A, B→A) = A → ((B→A) → A)
  const a1Formula1 = a1Instance(a, bImplA);
  const step2 = axiomNode(a1Formula1);

  // step 3: MP(step2, step1) = (A→(B→A)) → (A→A)
  const step3Result = implication(implication(a, bImplA), implication(a, a));
  const step3 = modusPonensNode(step3Result, step2, step1);

  // step 4: A1(A, B) = A → (B→A)
  const a1Formula2 = a1Instance(a, b);
  const step4 = axiomNode(a1Formula2);

  // step 5: MP(step4, step3) = A→A
  const step5Result = implication(a, a);
  const step5 = modusPonensNode(step5Result, step4, step3);

  return step5;
};

// ── メイン変換ロジック ──────────────────────────────────────

/**
 * 演繹定理の変換を再帰的に適用する（Effect版）。
 *
 * 入力の証明木の各ノードの結論 C を A → C に変換する。
 */
const applyDeductionTheoremEffect = (
  proof: ProofNode,
  hypothesis: Formula,
): Effect.Effect<ProofNode, DeductionTheoremError> =>
  Effect.gen(function* () {
    switch (proof._tag) {
      case "AxiomNode": {
        if (equalFormula(proof.formula, hypothesis)) {
          // 仮定 A → A → A の証明を構築
          return buildIdentityProof(hypothesis);
        }
        // 公理 C → A → C の証明を構築
        // A1(C, A): C → (A → C)
        const c = proof.formula;
        const a1Formula = a1Instance(c, hypothesis);
        const a1Node = axiomNode(a1Formula);
        // C は公理（元のAxiomNode）
        const cNode = axiomNode(c);
        // MP(C, C→(A→C)): A → C
        const result = implication(hypothesis, c);
        return modusPonensNode(result, cNode, a1Node);
      }
      case "ModusPonensNode": {
        // 元: D と D→E から E
        // 再帰で A→D と A→(D→E) を得る
        const d = proof.antecedent.formula;
        const dImplE = proof.conditional.formula;
        const e = proof.formula;

        const aImplD = yield* applyDeductionTheoremEffect(
          proof.antecedent,
          hypothesis,
        );
        const aImplDImplE = yield* applyDeductionTheoremEffect(
          proof.conditional,
          hypothesis,
        );

        // A2(A, D, E): (A→(D→E)) → ((A→D) → (A→E))
        const a2Formula = a2Instance(hypothesis, d, e);
        const a2Node = axiomNode(a2Formula);

        // MP(A→(D→E), A2): (A→D) → (A→E)
        const aImplDToAImplE = implication(
          implication(hypothesis, d),
          implication(hypothesis, e),
        );
        const mp1 = modusPonensNode(aImplDToAImplE, aImplDImplE, a2Node);

        // MP(A→D, (A→D)→(A→E)): A→E
        const aImplE = implication(hypothesis, e);
        const mp2 = modusPonensNode(aImplE, aImplD, mp1);

        return mp2;
      }
      case "GeneralizationNode": {
        // 元: D から ∀x.D
        // 再帰で A→D を得る
        const x = proof.variable;
        const d = proof.premise.formula;

        // x が A に自由に出現する場合はエラー
        if (freeVariablesInFormula(hypothesis).has(x.name)) {
          return yield* Effect.fail(
            new DeductionTheoremFreeVariableError({
              variable: x.name,
              hypothesis,
            }),
          );
        }

        const aImplD = yield* applyDeductionTheoremEffect(
          proof.premise,
          hypothesis,
        );

        // Gen(x, A→D): ∀x.(A→D)
        const forallAImplD = universal(x, implication(hypothesis, d));
        const genNode = generalizationNode(forallAImplD, x, aImplD);

        // A5: ∀x.(A→D) → (A→∀x.D)
        const forallXD = universal(x, d);
        const a5Formula = implication(
          forallAImplD,
          implication(hypothesis, forallXD),
        );
        const a5Node = axiomNode(a5Formula);

        // MP(∀x.(A→D), A5): A→∀x.D
        const aImplForallXD = implication(hypothesis, forallXD);
        const mp = modusPonensNode(aImplForallXD, genNode, a5Node);

        return mp;
      }
    }
    /* v8 ignore start */
    proof satisfies never;
    return proof;
    /* v8 ignore stop */
  });

// ── 公開API ─────────────────────────────────────────────────

/**
 * 演繹定理を適用する。
 *
 * Γ ∪ {A} ⊢ B の証明木を受け取り、Γ ⊢ A → B の証明木を返す。
 * 仮定 A と一致する AxiomNode が仮定として扱われ、それ以外は公理として扱われる。
 *
 * @param proof 元の証明木（B の証明）
 * @param hypothesis 除去する仮定 A
 * @returns Either: Right = 変換後の証明木（A → B の証明）, Left = エラー
 */
export const applyDeductionTheorem = (
  proof: ProofNode,
  hypothesis: Formula,
): Either.Either<ProofNode, DeductionTheoremError> =>
  Effect.runSync(
    Effect.either(applyDeductionTheoremEffect(proof, hypothesis)),
  );

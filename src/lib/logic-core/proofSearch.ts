/**
 * 命題論理シーケント計算（LK）の自動証明探索モジュール。
 *
 * カットなし後方探索（backward proof search）により、
 * 与えられたシーケントが証明可能かどうかを判定し、
 * 証明可能な場合はシーケント計算の証明木を構築する。
 *
 * 命題論理のLKでは全ての論理規則が可逆（invertible）であるため、
 * バックトラッキングなしの決定手続きとなる。
 *
 * ∧⇒ と ⇒∨ は成分選択型の規則だが、可逆性により両成分を
 * 同時に展開し、構造規則（縮約 + 交換）で元の形に戻す。
 *
 * 変更時に同期すべきもの:
 * - index.ts のエクスポート
 * - proofSearch.test.ts のテスト
 */

import { Data, Effect, Either } from "effect";
import type { Formula } from "./formula";
import { equalFormula } from "./equality";
import type { Sequent, ScProofNode } from "./sequentCalculus";
import {
  sequent,
  scIdentity,
  scBottomLeft,
  scWeakeningLeft,
  scWeakeningRight,
  scContractionLeft,
  scContractionRight,
  scExchangeLeft,
  scExchangeRight,
  scNegationLeft,
  scNegationRight,
  scImplicationLeft,
  scImplicationRight,
  scConjunctionLeft,
  scConjunctionRight,
  scDisjunctionLeft,
  scDisjunctionRight,
  getScConclusion,
} from "./sequentCalculus";

// ── エラー型 ──────────────────────────────────────────────

/** 証明不可能（シーケントが妥当でない） */
export class NotProvable extends Data.TaggedError("NotProvable")<
  Record<string, never>
> {}

/** ステップ数制限超過 */
export class StepLimitExceeded extends Data.TaggedError(
  "StepLimitExceeded",
)<{
  readonly stepsUsed: number;
}> {}

/** 証明探索エラーの統合型 */
export type ProofSearchError = NotProvable | StepLimitExceeded;

// ── 定数 ──────────────────────────────────────────────────

/** デフォルトの最大ステップ数 */
export const DEFAULT_SEARCH_STEP_LIMIT = 10000;

/** ⊥ の述語名 */
const BOTTOM_PREDICATE_NAME = "⊥";

// ── ユーティリティ ──────────────────────────────────────────

/** 論理式が ⊥ (Predicate("⊥", [])) かどうかを判定する */
const isBottom = (f: Formula): boolean =>
  f._tag === "Predicate" &&
  f.name === BOTTOM_PREDICATE_NAME &&
  f.args.length === 0;

/** 論理式が命題論理の複合式かどうかを判定する */
const isPropositionalCompound = (f: Formula): boolean =>
  f._tag === "Negation" ||
  f._tag === "Implication" ||
  f._tag === "Conjunction" ||
  f._tag === "Disjunction";

/** 配列から指定インデックスの要素を除いた新しい配列を返す */
const removeAt = <T>(arr: readonly T[], index: number): readonly T[] => [
  ...arr.slice(0, index),
  ...arr.slice(index + 1),
];

// ── 公理証明の構築 ──────────────────────────────────────────

/**
 * 恒等公理 φ ⇒ φ に弱化を追加して Γ ⇒ Δ の証明を構築する。
 */
const buildAxiomProof = (
  ant: readonly Formula[],
  suc: readonly Formula[],
  matchAnt: number,
  matchSuc: number,
): ScProofNode => {
  const formula = ant[matchAnt];
  let proof: ScProofNode = scIdentity(sequent([formula], [formula]));

  for (let i = ant.length - 1; i >= 0; i--) {
    if (i === matchAnt) continue;
    const c = getScConclusion(proof);
    proof = scWeakeningLeft(
      proof,
      ant[i],
      sequent([ant[i], ...c.antecedents], c.succedents),
    );
  }

  for (let j = 0; j < suc.length; j++) {
    if (j === matchSuc) continue;
    const c = getScConclusion(proof);
    proof = scWeakeningRight(
      proof,
      suc[j],
      sequent(c.antecedents, [...c.succedents, suc[j]]),
    );
  }

  return proof;
};

/**
 * ⊥公理 ⊥ ⇒ に弱化を追加して Γ ⇒ Δ の証明を構築する。
 */
const buildBottomProof = (
  ant: readonly Formula[],
  suc: readonly Formula[],
  bottomIndex: number,
): ScProofNode => {
  const bottomFormula = ant[bottomIndex];
  let proof: ScProofNode = scBottomLeft(sequent([bottomFormula], []));

  for (let i = ant.length - 1; i >= 0; i--) {
    if (i === bottomIndex) continue;
    const c = getScConclusion(proof);
    proof = scWeakeningLeft(
      proof,
      ant[i],
      sequent([ant[i], ...c.antecedents], c.succedents),
    );
  }

  for (let j = 0; j < suc.length; j++) {
    const c = getScConclusion(proof);
    proof = scWeakeningRight(
      proof,
      suc[j],
      sequent(c.antecedents, [...c.succedents, suc[j]]),
    );
  }

  return proof;
};

// ── ∧⇒ の両成分展開 ────────────────────────────────────────

/**
 * ∧⇒ 規則の可逆性を利用して両成分を追加する証明を構築する。
 *
 * innerProof: [φ₁, φ₂, ...otherAnt] ⇒ suc
 * → goal: [φ₁∧φ₂, ...otherAnt] ⇒ suc
 *
 * 証明構造 (top-down / leaf→root):
 *   innerProof: [φ₁, φ₂, ...otherAnt] ⇒ suc
 *   ∧⇒(i=1): [φ₁∧φ₂, φ₂, ...otherAnt] ⇒ suc
 *   e⇒(0):   [φ₂, φ₁∧φ₂, ...otherAnt] ⇒ suc
 *   ∧⇒(i=2): [φ₁∧φ₂, φ₁∧φ₂, ...otherAnt] ⇒ suc
 *   c⇒:      [φ₁∧φ₂, ...otherAnt] ⇒ suc
 */
const buildConjunctionLeftBoth = (
  innerProof: ScProofNode,
  conjFormula: Formula,
  left: Formula,
  right: Formula,
  otherAnt: readonly Formula[],
  suc: readonly Formula[],
): ScProofNode => {
  const goal = sequent([conjFormula, ...otherAnt], suc);

  // ∧⇒(i=1): φ₁ at pos 0 → φ₁∧φ₂
  const step1 = scConjunctionLeft(
    innerProof,
    1,
    sequent([conjFormula, right, ...otherAnt], suc),
  );

  // e⇒(0): swap pos 0,1 → [right, conjFormula, ...otherAnt]
  const step2 = scExchangeLeft(
    step1,
    0,
    sequent([right, conjFormula, ...otherAnt], suc),
  );

  // ∧⇒(i=2): right at pos 0 → φ₁∧φ₂
  const step3 = scConjunctionLeft(
    step2,
    2,
    sequent([conjFormula, conjFormula, ...otherAnt], suc),
  );

  // c⇒: contraction on conjFormula
  return scContractionLeft(step3, conjFormula, goal);
};

// ── ⇒∨ の両成分展開 ────────────────────────────────────────

/**
 * ⇒∨ 規則の可逆性を利用して両成分を追加する証明を構築する。
 *
 * innerProof: ant ⇒ [...otherSuc, φ₁, φ₂]
 * → goal: ant ⇒ [...otherSuc, φ₁∨φ₂]
 *
 * 証明構造 (top-down / leaf→root):
 *   innerProof: ant ⇒ [...otherSuc, φ₁, φ₂]
 *   ⇒∨₂:      ant ⇒ [...otherSuc, φ₁, φ₁∨φ₂]
 *   ⇒e(n):    ant ⇒ [...otherSuc, φ₁∨φ₂, φ₁]
 *   ⇒∨₁:      ant ⇒ [...otherSuc, φ₁∨φ₂, φ₁∨φ₂]
 *   ⇒c:       ant ⇒ [...otherSuc, φ₁∨φ₂]
 */
const buildDisjunctionRightBoth = (
  innerProof: ScProofNode,
  disjFormula: Formula,
  left: Formula,
  right: Formula,
  ant: readonly Formula[],
  otherSuc: readonly Formula[],
): ScProofNode => {
  const goal = sequent(ant, [...otherSuc, disjFormula]);
  const n = otherSuc.length;

  // ⇒∨₂: right (last) → disjFormula
  const step1 = scDisjunctionRight(
    innerProof,
    2,
    sequent(ant, [...otherSuc, left, disjFormula]),
  );

  // ⇒e(n): swap left and disjFormula
  const step2 = scExchangeRight(
    step1,
    n,
    sequent(ant, [...otherSuc, disjFormula, left]),
  );

  // ⇒∨₁: left (last) → disjFormula
  const step3 = scDisjunctionRight(
    step2,
    1,
    sequent(ant, [...otherSuc, disjFormula, disjFormula]),
  );

  // ⇒c: contraction on disjFormula
  return scContractionRight(step3, disjFormula, goal);
};

// ── 内部探索 Effect ─────────────────────────────────────────

const searchEffect = (
  ant: readonly Formula[],
  suc: readonly Formula[],
  steps: { value: number },
  limit: number,
): Effect.Effect<ScProofNode, ProofSearchError> =>
  Effect.gen(function* () {
    steps.value++;
    if (steps.value > limit) {
      return yield* Effect.fail(
        new StepLimitExceeded({ stepsUsed: steps.value }),
      );
    }

    const goal = sequent(ant, suc);

    // 1. 公理チェック: 左辺と右辺に共通の論理式があれば恒等公理
    for (let i = 0; i < ant.length; i++) {
      for (let j = 0; j < suc.length; j++) {
        if (equalFormula(ant[i], suc[j])) {
          return buildAxiomProof(ant, suc, i, j);
        }
      }
    }

    // 2. ⊥チェック: 左辺に⊥があれば⊥公理
    for (let i = 0; i < ant.length; i++) {
      if (isBottom(ant[i])) {
        return buildBottomProof(ant, suc, i);
      }
    }

    // 3. 右分解: 後件の複合式を分解（可逆規則を優先）
    for (let j = 0; j < suc.length; j++) {
      const f = suc[j];
      if (!isPropositionalCompound(f)) continue;
      const otherSuc = removeAt(suc, j);

      switch (f._tag) {
        case "Negation": {
          const premiseProof = yield* searchEffect(
            [...ant, f.formula],
            otherSuc,
            steps,
            limit,
          );
          return scNegationRight(premiseProof, goal);
        }
        case "Implication": {
          const premiseProof = yield* searchEffect(
            [...ant, f.left],
            [...otherSuc, f.right],
            steps,
            limit,
          );
          return scImplicationRight(premiseProof, goal);
        }
        case "Conjunction": {
          const leftProof = yield* searchEffect(
            ant,
            [...otherSuc, f.left],
            steps,
            limit,
          );
          const rightProof = yield* searchEffect(
            ant,
            [...otherSuc, f.right],
            steps,
            limit,
          );
          return scConjunctionRight(leftProof, rightProof, goal);
        }
        case "Disjunction": {
          const innerProof = yield* searchEffect(
            ant,
            [...otherSuc, f.left, f.right],
            steps,
            limit,
          );
          return buildDisjunctionRightBoth(
            innerProof,
            f,
            f.left,
            f.right,
            ant,
            otherSuc,
          );
        }
      }
    }

    // 4. 左分解: 前件の複合式を分解
    for (let i = 0; i < ant.length; i++) {
      const f = ant[i];
      if (!isPropositionalCompound(f)) continue;
      const otherAnt = removeAt(ant, i);

      switch (f._tag) {
        case "Negation": {
          const premiseProof = yield* searchEffect(
            otherAnt,
            [...suc, f.formula],
            steps,
            limit,
          );
          return scNegationLeft(premiseProof, goal);
        }
        case "Implication": {
          const leftProof = yield* searchEffect(
            otherAnt,
            [...suc, f.left],
            steps,
            limit,
          );
          const rightProof = yield* searchEffect(
            [...otherAnt, f.right],
            suc,
            steps,
            limit,
          );
          return scImplicationLeft(leftProof, rightProof, goal);
        }
        case "Conjunction": {
          const innerProof = yield* searchEffect(
            [...otherAnt, f.left, f.right],
            suc,
            steps,
            limit,
          );
          return buildConjunctionLeftBoth(
            innerProof,
            f,
            f.left,
            f.right,
            otherAnt,
            suc,
          );
        }
        case "Disjunction": {
          const leftProof = yield* searchEffect(
            [...otherAnt, f.left],
            suc,
            steps,
            limit,
          );
          const rightProof = yield* searchEffect(
            [...otherAnt, f.right],
            suc,
            steps,
            limit,
          );
          return scDisjunctionLeft(leftProof, rightProof, goal);
        }
      }
    }

    // 5. すべて原子式で公理条件を満たさない → 証明不可能
    return yield* Effect.fail(new NotProvable({}));
  });

// ── 公開 API ──────────────────────────────────────────────

/**
 * 命題論理シーケント計算（LK）の自動証明探索。
 *
 * 与えられたシーケントに対してカットなし後方探索を行い、
 * 証明可能な場合は ScProofNode を返し、
 * 証明不可能な場合は NotProvable エラーを返す。
 *
 * @param goal - 証明するシーケント
 * @param options - オプション（ステップ数制限）
 * @returns Either<ScProofNode, ProofSearchError>
 */
export const proveSequentLK = (
  goal: Sequent,
  options?: { readonly stepLimit?: number },
): Either.Either<ScProofNode, ProofSearchError> => {
  const limit = options?.stepLimit ?? DEFAULT_SEARCH_STEP_LIMIT;
  const steps = { value: 0 };
  return Effect.runSync(
    Effect.either(
      searchEffect(goal.antecedents, goal.succedents, steps, limit),
    ),
  );
};

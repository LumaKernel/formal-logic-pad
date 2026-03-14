/**
 * ユニフィケーションモジュール。
 *
 * Martelli-Montanari アルゴリズムに基づく双方向ユニフィケーション。
 * 論理式メタ変数と項メタ変数の両方を統一的に処理する。
 *
 * 内部は Effect.gen でエラー伝搬を行い、公開APIでは Either を返す。
 *
 * @see dev/logic-reference/04-substitution-and-unification.md セクション6
 */

import { Data, Effect, Either } from "effect";
import type { Formula } from "./formula";
import type { Term } from "./term";
import { equalFormula, equalTerm } from "./equality";
import { metaVariableKey, termMetaVariableKey } from "./metaVariable";
import {
  substituteFormulaMetaVariables,
  substituteTermMetaVariablesInTerm,
  substituteTermMetaVariablesInFormula,
  type FormulaSubstitutionMap,
  type TermMetaSubstitutionMap,
} from "./substitution";

// ── ユニフィケーションエラー型 ──────────────────────────────

/**
 * 構造不一致エラー。
 */
export class StructureMismatch extends Data.TaggedError("StructureMismatch")<{
  readonly left: Formula | Term;
  readonly right: Formula | Term;
}> {}

/**
 * Occurs check エラー。
 */
export class OccursCheck extends Data.TaggedError("OccursCheck")<{
  readonly variable: string;
  readonly inExpression: Formula | Term;
}> {}

/**
 * タグ不一致エラー。
 */
export class TagMismatch extends Data.TaggedError("TagMismatch")<{
  readonly leftTag: string;
  readonly rightTag: string;
}> {}

/**
 * ユニフィケーションエラーの種類。
 */
export type UnificationError = StructureMismatch | OccursCheck | TagMismatch;

/**
 * ユニフィケーション成功時の値。
 */
export type UnificationSuccess = {
  readonly formulaSubstitution: FormulaSubstitutionMap;
  readonly termSubstitution: TermMetaSubstitutionMap;
};

/**
 * ユニフィケーション結果。
 * Right = 成功（UnificationSuccess）、Left = 失敗（UnificationError）
 */
export type UnificationResult = Either.Either<
  UnificationSuccess,
  UnificationError
>;

// ── 方程式の型 ──────────────────────────────────────────────

type FormulaEquation = {
  readonly _kind: "formula";
  readonly left: Formula;
  readonly right: Formula;
};

type TermEquation = {
  readonly _kind: "term";
  readonly left: Term;
  readonly right: Term;
};

type Equation = FormulaEquation | TermEquation;

const formulaEquation = (left: Formula, right: Formula): FormulaEquation => ({
  _kind: "formula",
  left,
  right,
});

const termEquation = (left: Term, right: Term): TermEquation => ({
  _kind: "term",
  left,
  right,
});

// ── Occurs Check ────────────────────────────────────────────

/**
 * 論理式メタ変数のキーが Formula 中に出現するかをチェック。
 */
const occursInFormula = (mvKey: string, f: Formula): boolean => {
  switch (f._tag) {
    case "MetaVariable":
      return metaVariableKey(f) === mvKey;
    case "Negation":
      return occursInFormula(mvKey, f.formula);
    case "Implication":
    case "Conjunction":
    case "Disjunction":
    case "Biconditional":
      return occursInFormula(mvKey, f.left) || occursInFormula(mvKey, f.right);
    case "Universal":
    case "Existential":
      return occursInFormula(mvKey, f.formula);
    case "Predicate":
    case "Equality":
      return false;
    case "FormulaSubstitution":
    case "FreeVariableAbsence":
      return occursInFormula(mvKey, f.formula);
  }
  /* v8 ignore start */
  f satisfies never;
  return false;
  /* v8 ignore stop */
};

/**
 * 項メタ変数のキーが Term 中に出現するかをチェック。
 */
const occursInTerm = (tmvKey: string, t: Term): boolean => {
  switch (t._tag) {
    case "TermVariable":
    case "Constant":
      return false;
    case "TermMetaVariable":
      return termMetaVariableKey(t) === tmvKey;
    case "FunctionApplication":
      return t.args.some((arg) => occursInTerm(tmvKey, arg));
    case "BinaryOperation":
      return occursInTerm(tmvKey, t.left) || occursInTerm(tmvKey, t.right);
  }
  /* v8 ignore start */
  t satisfies never;
  return false;
  /* v8 ignore stop */
};

// ── 代入適用（方程式リスト全体に適用） ─────────────────────

/**
 * 論理式メタ変数代入を方程式リスト全体に適用。
 */
const applyFormulaSubstToEquations = (
  equations: readonly Equation[],
  key: string,
  replacement: Formula,
): readonly Equation[] => {
  const subst: FormulaSubstitutionMap = new Map([[key, replacement]]);
  return equations.map((eq) => {
    if (eq._kind === "formula") {
      return formulaEquation(
        substituteFormulaMetaVariables(eq.left, subst),
        substituteFormulaMetaVariables(eq.right, subst),
      );
    }
    // Term equation は論理式メタ変数を含まないのでそのまま
    return eq;
  });
};

/**
 * 項メタ変数代入を方程式リスト全体に適用。
 */
const applyTermSubstToEquations = (
  equations: readonly Equation[],
  key: string,
  replacement: Term,
): readonly Equation[] => {
  const subst: TermMetaSubstitutionMap = new Map([[key, replacement]]);
  return equations.map((eq) => {
    if (eq._kind === "formula") {
      return formulaEquation(
        substituteTermMetaVariablesInFormula(eq.left, subst),
        substituteTermMetaVariablesInFormula(eq.right, subst),
      );
    }
    return termEquation(
      substituteTermMetaVariablesInTerm(eq.left, subst),
      substituteTermMetaVariablesInTerm(eq.right, subst),
    );
  });
};

// ── Decompose ヘルパー ─────────────────────────────────────

/**
 * Formula を分解して子方程式を生成。
 * 同じ _tag を持つことが前提。
 */
const decomposeFormula = (
  a: Formula,
  b: Formula,
): readonly Equation[] | null => {
  // a._tag === b._tag が前提
  /* v8 ignore start -- MetaVariable 同士はDecomposeではなくDelete/Eliminateで処理（到達しない） */
  if (a._tag === "MetaVariable") {
    return null;
  }
  /* v8 ignore stop */
  if (a._tag === "Negation") {
    return [formulaEquation(a.formula, (b as typeof a).formula)];
  }
  if (
    a._tag === "Implication" ||
    a._tag === "Conjunction" ||
    a._tag === "Disjunction" ||
    a._tag === "Biconditional"
  ) {
    const bBin = b as typeof a;
    return [
      formulaEquation(a.left, bBin.left),
      formulaEquation(a.right, bBin.right),
    ];
  }
  if (a._tag === "Universal" || a._tag === "Existential") {
    const bQuant = b as typeof a;
    return [
      termEquation(a.variable, bQuant.variable),
      formulaEquation(a.formula, bQuant.formula),
    ];
  }
  if (a._tag === "Predicate") {
    const bPred = b as typeof a;
    if (a.name !== bPred.name || a.args.length !== bPred.args.length) {
      return null;
    }
    return a.args.map((arg, i) => termEquation(arg, bPred.args[i]));
  }
  if (a._tag === "Equality") {
    const bEq = b as typeof a;
    return [termEquation(a.left, bEq.left), termEquation(a.right, bEq.right)];
  }
  if (a._tag === "FormulaSubstitution") {
    const bSub = b as typeof a;
    return [
      formulaEquation(a.formula, bSub.formula),
      termEquation(a.term, bSub.term),
      termEquation(a.variable, bSub.variable),
    ];
  }
  // FreeVariableAbsence — fall-through for exhaustive narrowing
  const bAbs = b as typeof a;
  return [
    formulaEquation(a.formula, bAbs.formula),
    termEquation(a.variable, bAbs.variable),
  ];
};

/**
 * Term を分解して子方程式を生成。
 */
const decomposeTerm = (a: Term, b: Term): readonly Equation[] | null => {
  /* v8 ignore start -- TermVariable/TermMetaVariable/Constant 同士はDelete/Eliminateで先に処理される（到達しない） */
  if (a._tag === "TermVariable") {
    const bVar = b as typeof a;
    if (a.name !== bVar.name) return null;
    return [];
  }
  if (a._tag === "TermMetaVariable") {
    return null;
  }
  if (a._tag === "Constant") {
    const bConst = b as typeof a;
    if (a.name !== bConst.name) return null;
    return [];
  }
  /* v8 ignore stop */
  if (a._tag === "FunctionApplication") {
    const bFunc = b as typeof a;
    if (a.name !== bFunc.name || a.args.length !== bFunc.args.length) {
      return null;
    }
    return a.args.map((arg, i) => termEquation(arg, bFunc.args[i]));
  }
  // BinaryOperation — fall-through for exhaustive narrowing
  const bBin = b as typeof a;
  if (a.operator !== bBin.operator) return null;
  return [termEquation(a.left, bBin.left), termEquation(a.right, bBin.right)];
};

// ── Effect ベースの内部処理関数 ──────────────────────────────

/**
 * ミュータブルな作業状態。
 * solve 内部でのみ使用される。
 */
type SolveState = {
  readonly equations: Equation[];
  readonly formulaSub: Map<string, Formula>;
  readonly termSub: Map<string, Term>;
};

/**
 * 論理式方程式を処理。
 * 正常処理は void を返し、エラー時は UnificationError で失敗する。
 */
const processFormulaEquationEffect = (
  left: Formula,
  right: Formula,
  state: SolveState,
): Effect.Effect<void, UnificationError> =>
  Effect.gen(function* () {
    // 1. Delete: 同一式
    if (equalFormula(left, right)) {
      return;
    }

    // 2. Orient + Eliminate: 右辺がメタ変数で左辺がメタ変数でない場合、入れ替え
    if (left._tag !== "MetaVariable" && right._tag === "MetaVariable") {
      yield* processFormulaEquationEffect(right, left, state);
      return;
    }

    // 3. Eliminate: 左辺がメタ変数
    if (left._tag === "MetaVariable") {
      const key = metaVariableKey(left);

      // Occurs check
      if (right._tag !== "MetaVariable" && occursInFormula(key, right)) {
        yield* Effect.fail(
          new OccursCheck({ variable: key, inExpression: right }),
        );
      }

      // 防御的チェック: 即時代入適用により通常は到達しない
      /* v8 ignore start */
      const existing = state.formulaSub.get(key);
      if (existing !== undefined) {
        state.equations.push(formulaEquation(existing, right));
        return;
      }
      /* v8 ignore stop */

      // 代入を記録し、残りの方程式に適用
      state.formulaSub.set(key, right);
      const updated = applyFormulaSubstToEquations(state.equations, key, right);
      state.equations.length = 0;
      state.equations.push(...updated);

      // 既存の代入マップ内の値にも適用
      const singleSubst: FormulaSubstitutionMap = new Map([[key, right]]);
      for (const [k, v] of state.formulaSub) {
        if (k !== key) {
          state.formulaSub.set(
            k,
            substituteFormulaMetaVariables(v, singleSubst),
          );
        }
      }

      return;
    }

    // 4. Decompose: 同じ _tag
    if (left._tag === right._tag) {
      const subEquations = decomposeFormula(left, right);
      if (subEquations !== null) {
        state.equations.push(...subEquations);
        return;
      }
    }

    // 5. 構造不一致
    yield* Effect.fail(new StructureMismatch({ left, right }));
  });

/**
 * 項方程式を処理。
 * 正常処理は void を返し、エラー時は UnificationError で失敗する。
 */
const processTermEquationEffect = (
  left: Term,
  right: Term,
  state: SolveState,
): Effect.Effect<void, UnificationError> =>
  Effect.gen(function* () {
    // 1. Delete: 同一項
    if (equalTerm(left, right)) {
      return;
    }

    // 2. Orient: 右辺がメタ変数で左辺がメタ変数でない
    if (left._tag !== "TermMetaVariable" && right._tag === "TermMetaVariable") {
      yield* processTermEquationEffect(right, left, state);
      return;
    }

    // 3. Eliminate: 左辺が項メタ変数
    if (left._tag === "TermMetaVariable") {
      const key = termMetaVariableKey(left);

      // Occurs check
      if (right._tag !== "TermMetaVariable" && occursInTerm(key, right)) {
        yield* Effect.fail(
          new OccursCheck({ variable: key, inExpression: right }),
        );
      }

      // 防御的チェック: 即時代入適用により通常は到達しない
      /* v8 ignore start */
      const existing = state.termSub.get(key);
      if (existing !== undefined) {
        state.equations.push(termEquation(existing, right));
        return;
      }
      /* v8 ignore stop */

      // 代入を記録し、残りの方程式に適用
      state.termSub.set(key, right);
      const updated = applyTermSubstToEquations(state.equations, key, right);
      state.equations.length = 0;
      state.equations.push(...updated);

      // 既存の代入マップ内の値にも適用
      const singleSubst: TermMetaSubstitutionMap = new Map([[key, right]]);
      for (const [k, v] of state.termSub) {
        if (k !== key) {
          state.termSub.set(
            k,
            substituteTermMetaVariablesInTerm(v, singleSubst),
          );
        }
      }
      // FormulaSubの値にも項メタ変数代入を適用
      for (const [k, v] of state.formulaSub) {
        state.formulaSub.set(
          k,
          substituteTermMetaVariablesInFormula(v, singleSubst),
        );
      }

      return;
    }

    // 4. Decompose: 同じ _tag
    if (left._tag === right._tag) {
      const subEquations = decomposeTerm(left, right);
      if (subEquations !== null) {
        state.equations.push(...subEquations);
        return;
      }
      // decompose が null = 名前不一致等
      yield* Effect.fail(new StructureMismatch({ left, right }));
    }

    // 5. タグ不一致
    yield* Effect.fail(new StructureMismatch({ left, right }));
  });

// ── メインアルゴリズム（Effect版） ──────────────────────────

/**
 * Martelli-Montanari アルゴリズムのメインループ（Effect版）。
 *
 * 方程式リストを処理し、代入マップを構築する。
 * エラー時は yield* Effect.fail で短絡する。
 */
const solveEffect = (
  initialEquations: readonly Equation[],
  initialFormulaSub: Map<string, Formula>,
  initialTermSub: Map<string, Term>,
): Effect.Effect<UnificationSuccess, UnificationError> =>
  Effect.gen(function* () {
    const state: SolveState = {
      equations: [...initialEquations],
      formulaSub: new Map(initialFormulaSub),
      termSub: new Map(initialTermSub),
    };

    while (state.equations.length > 0) {
      const eq = state.equations.shift();
      // 防御的チェック: while条件でlength>0を確認済みのため到達しない
      /* v8 ignore start */
      if (eq === undefined) break;
      /* v8 ignore stop */

      if (eq._kind === "formula") {
        yield* processFormulaEquationEffect(eq.left, eq.right, state);
      } else {
        yield* processTermEquationEffect(eq.left, eq.right, state);
      }
    }

    return {
      formulaSubstitution: state.formulaSub,
      termSubstitution: state.termSub,
    };
  });

// ── 公開API（Effect版） ─────────────────────────────────────

/**
 * 2つの論理式をユニフィケーションする（Effect版）。
 *
 * Martelli-Montanari アルゴリズムに基づく。
 * 双方向ユニフィケーション: 両辺のメタ変数が代入対象になる。
 *
 * @returns Effect<UnificationSuccess, UnificationError>
 */
export const unifyFormulasEffect = (
  source: Formula,
  target: Formula,
): Effect.Effect<UnificationSuccess, UnificationError> => {
  return solveEffect([formulaEquation(source, target)], new Map(), new Map());
};

/**
 * 2つの項をユニフィケーションする（Effect版）。
 */
export const unifyTermsEffect = (
  source: Term,
  target: Term,
): Effect.Effect<UnificationSuccess, UnificationError> => {
  return solveEffect([termEquation(source, target)], new Map(), new Map());
};

// ── 公開API（互換ラッパー: Either を返す同期版） ────────────

/**
 * 2つの論理式をユニフィケーションする。
 *
 * Martelli-Montanari アルゴリズムに基づく。
 * 双方向ユニフィケーション: 両辺のメタ変数が代入対象になる。
 *
 * @returns 成功時は FormulaSubstitutionMap と TermMetaSubstitutionMap のペア。
 *          失敗時は UnificationError。
 */
export const unifyFormulas = (
  source: Formula,
  target: Formula,
): UnificationResult => {
  return Effect.runSync(Effect.either(unifyFormulasEffect(source, target)));
};

/**
 * 2つの項をユニフィケーションする。
 */
export const unifyTerms = (source: Term, target: Term): UnificationResult => {
  return Effect.runSync(Effect.either(unifyTermsEffect(source, target)));
};

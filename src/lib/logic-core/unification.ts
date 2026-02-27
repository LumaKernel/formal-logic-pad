/**
 * ユニフィケーションモジュール。
 *
 * Martelli-Montanari アルゴリズムに基づく双方向ユニフィケーション。
 * 論理式メタ変数と項メタ変数の両方を統一的に処理する。
 *
 * @see dev/logic-reference/04-substitution-and-unification.md セクション6
 */

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

// ── ユニフィケーション結果型 ──────────────────────────────

/**
 * ユニフィケーションエラーの種類。
 */
export type UnificationError =
  | {
      readonly _tag: "StructureMismatch";
      readonly left: Formula | Term;
      readonly right: Formula | Term;
    }
  | {
      readonly _tag: "OccursCheck";
      readonly variable: string;
      readonly inExpression: Formula | Term;
    }
  | {
      readonly _tag: "TagMismatch";
      readonly leftTag: string;
      readonly rightTag: string;
    };

/**
 * ユニフィケーション結果。
 */
export type UnificationResult =
  | {
      readonly _tag: "Ok";
      readonly formulaSubstitution: FormulaSubstitutionMap;
      readonly termSubstitution: TermMetaSubstitutionMap;
    }
  | { readonly _tag: "Error"; readonly error: UnificationError };

const okResult = (
  formulaSubstitution: FormulaSubstitutionMap,
  termSubstitution: TermMetaSubstitutionMap,
): UnificationResult => ({
  _tag: "Ok",
  formulaSubstitution,
  termSubstitution,
});

const errResult = (error: UnificationError): UnificationResult => ({
  _tag: "Error",
  error,
});

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
  switch (a._tag) {
    // MetaVariable 同士はDecomposeではなくDelete/Eliminateで処理（到達しない）
    /* v8 ignore start */
    case "MetaVariable":
      return null;
    /* v8 ignore stop */
    case "Negation":
      return [formulaEquation(a.formula, (b as typeof a).formula)];
    case "Implication":
    case "Conjunction":
    case "Disjunction":
    case "Biconditional": {
      const bBin = b as typeof a;
      return [
        formulaEquation(a.left, bBin.left),
        formulaEquation(a.right, bBin.right),
      ];
    }
    case "Universal":
    case "Existential": {
      const bQuant = b as typeof a;
      return [
        termEquation(a.variable, bQuant.variable),
        formulaEquation(a.formula, bQuant.formula),
      ];
    }
    case "Predicate": {
      const bPred = b as typeof a;
      if (a.name !== bPred.name || a.args.length !== bPred.args.length) {
        return null;
      }
      return a.args.map((arg, i) => termEquation(arg, bPred.args[i]));
    }
    case "Equality": {
      const bEq = b as typeof a;
      return [termEquation(a.left, bEq.left), termEquation(a.right, bEq.right)];
    }
    case "FormulaSubstitution": {
      const bSub = b as typeof a;
      return [
        formulaEquation(a.formula, bSub.formula),
        termEquation(a.term, bSub.term),
        termEquation(a.variable, bSub.variable),
      ];
    }
  }
  /* v8 ignore start */
  a satisfies never;
  return null;
  /* v8 ignore stop */
};

/**
 * Term を分解して子方程式を生成。
 */
const decomposeTerm = (a: Term, b: Term): readonly Equation[] | null => {
  switch (a._tag) {
    // TermVariable/TermMetaVariable/Constant 同士はDelete/Eliminateで先に処理される（到達しない）
    /* v8 ignore start */
    case "TermVariable": {
      const bVar = b as typeof a;
      if (a.name !== bVar.name) return null;
      return [];
    }
    case "TermMetaVariable":
      return null;
    case "Constant": {
      const bConst = b as typeof a;
      if (a.name !== bConst.name) return null;
      return [];
    }
    /* v8 ignore stop */
    case "FunctionApplication": {
      const bFunc = b as typeof a;
      if (a.name !== bFunc.name || a.args.length !== bFunc.args.length) {
        return null;
      }
      return a.args.map((arg, i) => termEquation(arg, bFunc.args[i]));
    }
    case "BinaryOperation": {
      const bBin = b as typeof a;
      if (a.operator !== bBin.operator) return null;
      return [
        termEquation(a.left, bBin.left),
        termEquation(a.right, bBin.right),
      ];
    }
  }
  /* v8 ignore start */
  a satisfies never;
  return null;
  /* v8 ignore stop */
};

// ── メインアルゴリズム ─────────────────────────────────────

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
  return solve([formulaEquation(source, target)], new Map(), new Map());
};

/**
 * 2つの項をユニフィケーションする。
 */
export const unifyTerms = (source: Term, target: Term): UnificationResult => {
  return solve([termEquation(source, target)], new Map(), new Map());
};

/**
 * Martelli-Montanari アルゴリズムのメインループ。
 *
 * 方程式リストを処理し、代入マップを構築する。
 */
const solve = (
  initialEquations: readonly Equation[],
  initialFormulaSub: Map<string, Formula>,
  initialTermSub: Map<string, Term>,
): UnificationResult => {
  // ミュータブルなワークリスト
  const equations: Equation[] = [...initialEquations];
  const formulaSub = new Map(initialFormulaSub);
  const termSub = new Map(initialTermSub);

  while (equations.length > 0) {
    const eq = equations.shift();
    // 防御的チェック: while条件でlength>0を確認済みのため到達しない
    /* v8 ignore start */
    if (eq === undefined) break;
    /* v8 ignore stop */

    if (eq._kind === "formula") {
      const result = processFormulaEquation(
        eq.left,
        eq.right,
        equations,
        formulaSub,
        termSub,
      );
      if (result !== null) return result;
    } else {
      const result = processTermEquation(
        eq.left,
        eq.right,
        equations,
        formulaSub,
        termSub,
      );
      if (result !== null) return result;
    }
  }

  return okResult(formulaSub, termSub);
};

/**
 * 論理式方程式を処理。
 * エラーを返す場合はUnificationResult、正常処理はnull（ループ継続）。
 */
const processFormulaEquation = (
  left: Formula,
  right: Formula,
  equations: Equation[],
  formulaSub: Map<string, Formula>,
  termSub: Map<string, Term>,
): UnificationResult | null => {
  // 1. Delete: 同一式
  if (equalFormula(left, right)) {
    return null;
  }

  // 2. Orient + Eliminate: 右辺がメタ変数で左辺がメタ変数でない場合、入れ替え
  if (left._tag !== "MetaVariable" && right._tag === "MetaVariable") {
    return processFormulaEquation(right, left, equations, formulaSub, termSub);
  }

  // 3. Eliminate: 左辺がメタ変数
  if (left._tag === "MetaVariable") {
    const key = metaVariableKey(left);

    // Occurs check
    if (right._tag !== "MetaVariable" && occursInFormula(key, right)) {
      return errResult({
        _tag: "OccursCheck",
        variable: key,
        inExpression: right,
      });
    }

    // 防御的チェック: 即時代入適用により通常は到達しない
    /* v8 ignore start */
    const existing = formulaSub.get(key);
    if (existing !== undefined) {
      equations.push(formulaEquation(existing, right));
      return null;
    }
    /* v8 ignore stop */

    // 代入を記録し、残りの方程式に適用
    formulaSub.set(key, right);
    const updated = applyFormulaSubstToEquations(equations, key, right);
    equations.length = 0;
    equations.push(...updated);

    // 既存の代入マップ内の値にも適用
    const singleSubst: FormulaSubstitutionMap = new Map([[key, right]]);
    for (const [k, v] of formulaSub) {
      if (k !== key) {
        formulaSub.set(k, substituteFormulaMetaVariables(v, singleSubst));
      }
    }

    return null;
  }

  // 4. Decompose: 同じ _tag
  if (left._tag === right._tag) {
    const subEquations = decomposeFormula(left, right);
    if (subEquations !== null) {
      equations.push(...subEquations);
      return null;
    }
  }

  // 5. 構造不一致
  return errResult({
    _tag: "StructureMismatch",
    left,
    right,
  });
};

/**
 * 項方程式を処理。
 */
const processTermEquation = (
  left: Term,
  right: Term,
  equations: Equation[],
  formulaSub: Map<string, Formula>,
  termSub: Map<string, Term>,
): UnificationResult | null => {
  // 1. Delete: 同一項
  if (equalTerm(left, right)) {
    return null;
  }

  // 2. Orient: 右辺がメタ変数で左辺がメタ変数でない
  if (left._tag !== "TermMetaVariable" && right._tag === "TermMetaVariable") {
    return processTermEquation(right, left, equations, formulaSub, termSub);
  }

  // 3. Eliminate: 左辺が項メタ変数
  if (left._tag === "TermMetaVariable") {
    const key = termMetaVariableKey(left);

    // Occurs check
    if (right._tag !== "TermMetaVariable" && occursInTerm(key, right)) {
      return errResult({
        _tag: "OccursCheck",
        variable: key,
        inExpression: right,
      });
    }

    // 防御的チェック: 即時代入適用により通常は到達しない
    /* v8 ignore start */
    const existing = termSub.get(key);
    if (existing !== undefined) {
      equations.push(termEquation(existing, right));
      return null;
    }
    /* v8 ignore stop */

    // 代入を記録し、残りの方程式に適用
    termSub.set(key, right);
    const updated = applyTermSubstToEquations(equations, key, right);
    equations.length = 0;
    equations.push(...updated);

    // 既存の代入マップ内の値にも適用
    const singleSubst: TermMetaSubstitutionMap = new Map([[key, right]]);
    for (const [k, v] of termSub) {
      if (k !== key) {
        termSub.set(k, substituteTermMetaVariablesInTerm(v, singleSubst));
      }
    }
    // FormulaSubの値にも項メタ変数代入を適用
    for (const [k, v] of formulaSub) {
      formulaSub.set(k, substituteTermMetaVariablesInFormula(v, singleSubst));
    }

    return null;
  }

  // 4. Decompose: 同じ _tag
  if (left._tag === right._tag) {
    const subEquations = decomposeTerm(left, right);
    if (subEquations !== null) {
      equations.push(...subEquations);
      return null;
    }
    // decompose が null = 名前不一致等
    return errResult({
      _tag: "StructureMismatch",
      left,
      right,
    });
  }

  // 5. タグ不一致
  return errResult({
    _tag: "StructureMismatch",
    left,
    right,
  });
};

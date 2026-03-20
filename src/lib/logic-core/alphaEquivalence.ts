/**
 * α等価性（alpha-equivalence）と整理等価性の判定。
 *
 * - alphaEqualFormula: 束縛変数のリネーム（α変換）を許容した構造的等価判定
 * - areSimplificationEquivalent: 置換解決 + α等価の複合判定（「整理」関係）
 *
 * 変更時は alphaEquivalence.test.ts, index.ts も同期すること。
 */

import type { Formula } from "./formula";
import type { Term } from "./term";
import { normalizeFormula } from "./substitution";

// --- α等価性（Term） ---

/**
 * 2つの項がα等価かどうかを判定する。
 *
 * 束縛変数はde Bruijnレベルで比較し、自由変数は名前で比較する。
 *
 * @param a 左辺の項
 * @param b 右辺の項
 * @param envA 左辺の束縛変数環境（変数名 → de Bruijnレベル）
 * @param envB 右辺の束縛変数環境（変数名 → de Bruijnレベル）
 */
const alphaEqualTerm = (
  a: Term,
  b: Term,
  envA: ReadonlyMap<string, number>,
  envB: ReadonlyMap<string, number>,
): boolean => {
  if (a._tag !== b._tag) return false;
  switch (a._tag) {
    case "TermVariable": {
      const bVar = b as typeof a;
      const levelA = envA.get(a.name);
      const levelB = envB.get(bVar.name);
      if (levelA !== undefined && levelB !== undefined) {
        // 両方が束縛変数 → de Bruijnレベルが一致すればα等価
        return levelA === levelB;
      }
      if (levelA === undefined && levelB === undefined) {
        // 両方が自由変数 → 名前が一致すれば等価
        return a.name === bVar.name;
      }
      // 片方が束縛・片方が自由 → 等価でない
      return false;
    }
    case "TermMetaVariable":
      return (
        a.name === (b as typeof a).name &&
        a.subscript === (b as typeof a).subscript
      );
    case "Constant":
      return a.name === (b as typeof a).name;
    case "FunctionApplication": {
      const bFunc = b as typeof a;
      return (
        a.name === bFunc.name &&
        a.args.length === bFunc.args.length &&
        a.args.every((arg, i) => alphaEqualTerm(arg, bFunc.args[i], envA, envB))
      );
    }
    case "BinaryOperation": {
      const bBin = b as typeof a;
      return (
        a.operator === bBin.operator &&
        alphaEqualTerm(a.left, bBin.left, envA, envB) &&
        alphaEqualTerm(a.right, bBin.right, envA, envB)
      );
    }
    case "TermSubstitution": {
      const bSub = b as typeof a;
      return (
        a.variable.name === bSub.variable.name &&
        alphaEqualTerm(a.term, bSub.term, envA, envB) &&
        alphaEqualTerm(a.replacement, bSub.replacement, envA, envB)
      );
    }
  }
  /* v8 ignore start */
  a satisfies never;
  return false;
  /* v8 ignore stop */
};

// --- α等価性（Formula） ---

/**
 * 2つの論理式がα等価かどうかを判定する。
 *
 * 束縛変数のリネームのみを許容し、自由変数・構造は完全一致を要求する。
 * 例: ∀x.P(x) ≡α ∀y.P(y) だが、P(x) ≢α P(y)
 *
 * @param a 左辺の論理式
 * @param b 右辺の論理式
 * @param envA 左辺の束縛変数環境
 * @param envB 右辺の束縛変数環境
 * @param depth 現在のde Bruijnレベル
 */
const alphaEqualFormulaImpl = (
  a: Formula,
  b: Formula,
  envA: ReadonlyMap<string, number>,
  envB: ReadonlyMap<string, number>,
  depth: number,
): boolean => {
  if (a._tag !== b._tag) return false;
  switch (a._tag) {
    case "MetaVariable":
      return (
        a.name === (b as typeof a).name &&
        a.subscript === (b as typeof a).subscript
      );
    case "Negation":
      return alphaEqualFormulaImpl(
        a.formula,
        (b as typeof a).formula,
        envA,
        envB,
        depth,
      );
    case "Implication":
    case "Conjunction":
    case "Disjunction":
    case "Biconditional": {
      const bBin = b as typeof a;
      return (
        alphaEqualFormulaImpl(a.left, bBin.left, envA, envB, depth) &&
        alphaEqualFormulaImpl(a.right, bBin.right, envA, envB, depth)
      );
    }
    case "Universal":
    case "Existential": {
      const bQuant = b as typeof a;
      const newDepth = depth + 1;
      // 束縛変数を新しいレベルにマッピング（シャドーイングも自動的に処理）
      const newEnvA = new Map(envA);
      newEnvA.set(a.variable.name, newDepth);
      const newEnvB = new Map(envB);
      newEnvB.set(bQuant.variable.name, newDepth);
      return alphaEqualFormulaImpl(
        a.formula,
        bQuant.formula,
        newEnvA,
        newEnvB,
        newDepth,
      );
    }
    case "Predicate": {
      const bPred = b as typeof a;
      return (
        a.name === bPred.name &&
        a.args.length === bPred.args.length &&
        a.args.every((arg, i) => alphaEqualTerm(arg, bPred.args[i], envA, envB))
      );
    }
    case "Equality": {
      const bEq = b as typeof a;
      return (
        alphaEqualTerm(a.left, bEq.left, envA, envB) &&
        alphaEqualTerm(a.right, bEq.right, envA, envB)
      );
    }
    case "FormulaSubstitution": {
      const bSub = b as typeof a;
      return (
        alphaEqualFormulaImpl(a.formula, bSub.formula, envA, envB, depth) &&
        alphaEqualTerm(a.term, bSub.term, envA, envB) &&
        alphaEqualTerm(a.variable, bSub.variable, envA, envB)
      );
    }
    case "FreeVariableAbsence": {
      const bAbs = b as typeof a;
      return (
        alphaEqualFormulaImpl(a.formula, bAbs.formula, envA, envB, depth) &&
        alphaEqualTerm(a.variable, bAbs.variable, envA, envB)
      );
    }
  }
  /* v8 ignore start */
  a satisfies never;
  return false;
  /* v8 ignore stop */
};

/**
 * 2つの論理式がα等価かどうかを判定する（公開API）。
 *
 * 束縛変数のリネームのみを許容した構造的等価判定。
 * 置換の解決は行わない（FormulaSubstitution は構造的に比較される）。
 *
 * @example
 * alphaEqualFormula(∀x.P(x), ∀y.P(y)) === true
 * alphaEqualFormula(P(x), P(y)) === false  // 自由変数は名前一致が必要
 */
/* v8 ignore start -- V8集約アーティファクト */
export const alphaEqualFormula = (a: Formula, b: Formula): boolean => {
  /* v8 ignore stop */
  return alphaEqualFormulaImpl(a, b, new Map(), new Map(), 0);
};

// --- 整理等価性 ---

/**
 * 2つの論理式が「整理」関係にあるかを判定する。
 *
 * 以下の変換を許容した等価判定:
 * 1. 置換の解決: φ[τ/x] → 代入結果 （normalizeFormula による）
 * 2. FreeVariableAbsence の簡約: φ[/x] → φ （x が自由でない場合）
 * 3. α等価性: 束縛変数のリネーム ∀x.φ ≡ ∀y.φ[y/x]
 *
 * この関係は対称的（a≡b ⟺ b≡a）。
 *
 * @example
 * areSimplificationEquivalent(∀x.P(x), ∀y.P(y)) === true  // α等価
 * areSimplificationEquivalent(P(x)[a/x], P(a)) === true    // 置換解決
 * areSimplificationEquivalent(P(y)[/x], P(y)) === true     // 不要な[/x]除去
 */
/* v8 ignore start -- V8集約アーティファクト */
export const areSimplificationEquivalent = (
  a: Formula,
  b: Formula,
): boolean => {
  /* v8 ignore stop */
  const normalizedA = normalizeFormula(a);
  const normalizedB = normalizeFormula(b);
  return alphaEqualFormula(normalizedA, normalizedB);
};

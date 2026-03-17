/**
 * 項変数マッチング: ソース論理式の自由項変数をターゲットに合わせて代入できるかを判定する。
 *
 * source[σ] ≡α target となる項変数代入 σ を見つける。
 * 束縛変数はα等価性で扱い、自由項変数のみがパターン変数として代入対象になる。
 *
 * 用途: 「置換した先として繋ぐ」機能で、2つのノードの論理式が
 * 項変数代入の関係にあるかを判定する。
 *
 * 変更時は termVariableMatching.test.ts, index.ts も同期すること。
 */

import type { Formula } from "./formula";
import type { Term } from "./term";
import { equalTerm } from "./equality";
import { normalizeFormula } from "./substitution";

// ── 内部マッチング（Term） ──────────────────────────────────────

/**
 * ターゲット項が現在のスコープの束縛変数を含むかを判定する。
 * 自由変数→束縛変数への代入（変数捕獲）を防ぐために使用。
 */
const termContainsBoundVariable = (
  t: Term,
  envT: ReadonlyMap<string, number>,
): boolean => {
  switch (t._tag) {
    case "TermVariable":
      return envT.has(t.name);
    case "TermMetaVariable":
    case "Constant":
      return false;
    case "FunctionApplication":
      return t.args.some((arg) => termContainsBoundVariable(arg, envT));
    case "BinaryOperation":
      return (
        termContainsBoundVariable(t.left, envT) ||
        termContainsBoundVariable(t.right, envT)
      );
  }
  /* v8 ignore start */
  t satisfies never;
  return false;
  /* v8 ignore stop */
};

/**
 * ソース項とターゲット項のマッチング。
 *
 * ソース側の自由TermVariableはパターン変数として扱い、
 * ターゲット側の対応する項に束縛する。
 * 束縛変数はde Bruijnレベルで比較する（α等価性）。
 */
const matchTermImpl = (
  s: Term,
  t: Term,
  envS: ReadonlyMap<string, number>,
  envT: ReadonlyMap<string, number>,
  termSub: Map<string, Term>,
): boolean => {
  if (s._tag === "TermVariable") {
    const levelS = envS.get(s.name);
    if (levelS !== undefined) {
      // ソース側が束縛変数 → ターゲットも同レベルの束縛変数であること
      if (t._tag !== "TermVariable") return false;
      const levelT = envT.get(t.name);
      return levelT !== undefined && levelS === levelT;
    }
    // ソース側が自由変数 → パターン変数として扱う
    // ターゲット項が束縛変数を含む場合は変数捕獲のため拒否
    if (termContainsBoundVariable(t, envT)) return false;

    const existing = termSub.get(s.name);
    if (existing !== undefined) {
      // 同じ変数の既存束縛と一致するか確認
      return equalTerm(existing, t);
    }
    termSub.set(s.name, t);
    return true;
  }

  // 非変数項は構造的にマッチ
  if (s._tag !== t._tag) return false;
  switch (s._tag) {
    case "TermMetaVariable":
      return (
        s.name === (t as typeof s).name &&
        s.subscript === (t as typeof s).subscript
      );
    case "Constant":
      return s.name === (t as typeof s).name;
    case "FunctionApplication": {
      const tFunc = t as typeof s;
      return (
        s.name === tFunc.name &&
        s.args.length === tFunc.args.length &&
        s.args.every((arg, i) =>
          matchTermImpl(arg, tFunc.args[i], envS, envT, termSub),
        )
      );
    }
    case "BinaryOperation": {
      const tBin = t as typeof s;
      return (
        s.operator === tBin.operator &&
        matchTermImpl(s.left, tBin.left, envS, envT, termSub) &&
        matchTermImpl(s.right, tBin.right, envS, envT, termSub)
      );
    }
  }
  /* v8 ignore start */
  s satisfies never;
  return false;
  /* v8 ignore stop */
};

// ── 内部マッチング（Formula） ──────────────────────────────────

/**
 * ソース論理式とターゲット論理式のマッチング。
 *
 * 構造的に並行走査し、ソース側の自由項変数をパターン変数として
 * ターゲット側に束縛する。量化子ではde Bruijn環境を拡張。
 */
const matchFormulaImpl = (
  s: Formula,
  t: Formula,
  envS: ReadonlyMap<string, number>,
  envT: ReadonlyMap<string, number>,
  depth: number,
  termSub: Map<string, Term>,
): boolean => {
  if (s._tag !== t._tag) return false;
  switch (s._tag) {
    case "MetaVariable":
      return (
        s.name === (t as typeof s).name &&
        s.subscript === (t as typeof s).subscript
      );
    case "Negation":
      return matchFormulaImpl(
        s.formula,
        (t as typeof s).formula,
        envS,
        envT,
        depth,
        termSub,
      );
    case "Implication":
    case "Conjunction":
    case "Disjunction":
    case "Biconditional": {
      const tBin = t as typeof s;
      return (
        matchFormulaImpl(s.left, tBin.left, envS, envT, depth, termSub) &&
        matchFormulaImpl(s.right, tBin.right, envS, envT, depth, termSub)
      );
    }
    case "Universal":
    case "Existential": {
      const tQuant = t as typeof s;
      const newDepth = depth + 1;
      const newEnvS = new Map(envS);
      newEnvS.set(s.variable.name, newDepth);
      const newEnvT = new Map(envT);
      newEnvT.set(tQuant.variable.name, newDepth);
      return matchFormulaImpl(
        s.formula,
        tQuant.formula,
        newEnvS,
        newEnvT,
        newDepth,
        termSub,
      );
    }
    case "Predicate": {
      const tPred = t as typeof s;
      return (
        s.name === tPred.name &&
        s.args.length === tPred.args.length &&
        s.args.every((arg, i) =>
          matchTermImpl(arg, tPred.args[i], envS, envT, termSub),
        )
      );
    }
    case "Equality": {
      const tEq = t as typeof s;
      return (
        matchTermImpl(s.left, tEq.left, envS, envT, termSub) &&
        matchTermImpl(s.right, tEq.right, envS, envT, termSub)
      );
    }
    case "FormulaSubstitution": {
      // 正規化後に残る場合（MetaVariableベース）: 構造的マッチ
      const tSub = t as typeof s;
      return (
        matchFormulaImpl(s.formula, tSub.formula, envS, envT, depth, termSub) &&
        matchTermImpl(s.term, tSub.term, envS, envT, termSub) &&
        matchTermImpl(s.variable, tSub.variable, envS, envT, termSub)
      );
    }
    case "FreeVariableAbsence": {
      const tAbs = t as typeof s;
      return (
        matchFormulaImpl(s.formula, tAbs.formula, envS, envT, depth, termSub) &&
        matchTermImpl(s.variable, tAbs.variable, envS, envT, termSub)
      );
    }
  }
  /* v8 ignore start */
  s satisfies never;
  return false;
  /* v8 ignore stop */
};

// ── 公開API ──────────────────────────────────────────────────

/**
 * ソース論理式の自由項変数をターゲットに合わせて代入するマッチングを試みる。
 *
 * source[σ] ≡α target となる項変数代入 σ を探す。
 * 正規化（FormulaSubstitution解決）後にマッチングを行う。
 *
 * @returns 成功時は代入マッピング（変数名 → 項）、失敗時はundefined。
 *          空マップ = 代入なしでα等価（simplificationと同等）。
 *
 * @example
 * findTermVariableSubstitution(P(x), P(a)) → Map { "x" → a }
 * findTermVariableSubstitution(P(x) → Q(x), P(a) → Q(a)) → Map { "x" → a }
 * findTermVariableSubstitution(∀y.P(x,y), ∀z.P(a,z)) → Map { "x" → a }
 * findTermVariableSubstitution(P(x), Q(y)) → undefined
 */
export const findTermVariableSubstitution = (
  source: Formula,
  target: Formula,
): ReadonlyMap<string, Term> | undefined => {
  const normalizedSource = normalizeFormula(source);
  const normalizedTarget = normalizeFormula(target);

  const termSub = new Map<string, Term>();

  if (
    matchFormulaImpl(
      normalizedSource,
      normalizedTarget,
      new Map(),
      new Map(),
      0,
      termSub,
    )
  ) {
    return termSub;
  }
  return undefined;
};

/**
 * ソースからターゲットへの非自明な項変数代入が存在するかを判定する。
 *
 * findTermVariableSubstitution の結果に、恒等でない代入（x → t, x ≠ t）が
 * 少なくとも1つ含まれる場合にtrue。
 * 空の代入や恒等代入のみ（α等価）はfalseを返す — そのケースは整理（simplification）で扱う。
 */
export const isNonTrivialSubstitutionResult = (
  source: Formula,
  target: Formula,
): boolean => {
  const sub = findTermVariableSubstitution(source, target);
  if (sub === undefined) return false;
  // 恒等代入（x → x）を除外し、実質的な代入があるか確認
  for (const [varName, term] of sub) {
    if (term._tag !== "TermVariable" || term.name !== varName) {
      return true;
    }
  }
  return false;
};

/**
 * 双方向の項変数代入関係を判定する。
 *
 * source→target または target→source の少なくとも一方で
 * 非自明な項変数代入が存在する場合にtrue。
 */
export const areSubstitutionConnectable = (a: Formula, b: Formula): boolean => {
  return (
    isNonTrivialSubstitutionResult(a, b) || isNonTrivialSubstitutionResult(b, a)
  );
};

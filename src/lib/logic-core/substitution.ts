/**
 * 代入操作モジュール。
 *
 * 3種類の代入を提供:
 * 1. 論理式メタ変数代入 (substituteFormulaMetaVariables)
 * 2. 項メタ変数代入 (substituteTermMetaVariables)
 * 3. 項変数代入 (substituteTermVariable) — 変数捕獲チェック付き
 *
 * また代入の合成もサポート。
 *
 * @see dev/logic-reference/04-substitution-and-unification.md
 */

import {
  type Formula,
  type MetaVariable,
  Negation,
  Implication,
  Conjunction,
  Disjunction,
  Biconditional,
  Universal,
  Existential,
  Predicate,
  Equality,
  FormulaSubstitution,
} from "./formula";
import {
  type Term,
  type TermMetaVariable,
  TermVariable,
  FunctionApplication,
  BinaryOperation,
} from "./term";
import { metaVariableKey, termMetaVariableKey } from "./metaVariable";
import {
  freeVariablesInTerm,
  freeVariablesInFormula,
  allVariableNamesInFormula,
  allVariableNamesInTerm,
} from "./freeVariables";

// ── 代入マップの型定義 ──────────────────────────────────────

/**
 * 論理式メタ変数代入マップ。
 * key: metaVariableKey(mv), value: 代入先の Formula。
 */
export type FormulaSubstitutionMap = ReadonlyMap<string, Formula>;

/**
 * 項メタ変数代入マップ。
 * key: termMetaVariableKey(tmv), value: 代入先の Term。
 */
export type TermMetaSubstitutionMap = ReadonlyMap<string, Term>;

/**
 * 項変数代入マップ。
 * key: TermVariable.name, value: 代入先の Term。
 */
export type TermVariableSubstitutionMap = ReadonlyMap<string, Term>;

// ── ヘルパー: 新鮮な変数名生成 ────────────────────────────────

/**
 * 使用済み変数名の集合から衝突しない新鮮な変数名を生成する。
 * base名にプライム記号(')を追加していく。
 */
export const freshVariableName = (
  base: string,
  usedNames: ReadonlySet<string>,
): string => {
  let candidate = `${base satisfies string}'`;
  while (usedNames.has(candidate)) {
    candidate = `${candidate satisfies string}'`;
  }
  return candidate;
};

// ── 1. 論理式メタ変数代入 ────────────────────────────────────

/**
 * 論理式メタ変数代入: 論理式スキーマ中のメタ変数をFormulaに同時置換する。
 *
 * メタ変数代入は量化子のスコープを素通りする（変数捕獲は発生しない）。
 * 代入は同時適用（逐次適用ではない）。
 */
export const substituteFormulaMetaVariables = (
  formula: Formula,
  subst: FormulaSubstitutionMap,
): Formula => {
  if (subst.size === 0) return formula;
  return substituteFormulaMetaVariablesRec(formula, subst);
};

const substituteFormulaMetaVariablesRec = (
  f: Formula,
  subst: FormulaSubstitutionMap,
): Formula => {
  switch (f._tag) {
    case "MetaVariable": {
      const key = metaVariableKey(f);
      const replacement = subst.get(key);
      return replacement !== undefined ? replacement : f;
    }
    case "Negation":
      return new Negation({
        formula: substituteFormulaMetaVariablesRec(f.formula, subst),
      });
    case "Implication":
      return new Implication({
        left: substituteFormulaMetaVariablesRec(f.left, subst),
        right: substituteFormulaMetaVariablesRec(f.right, subst),
      });
    case "Conjunction":
      return new Conjunction({
        left: substituteFormulaMetaVariablesRec(f.left, subst),
        right: substituteFormulaMetaVariablesRec(f.right, subst),
      });
    case "Disjunction":
      return new Disjunction({
        left: substituteFormulaMetaVariablesRec(f.left, subst),
        right: substituteFormulaMetaVariablesRec(f.right, subst),
      });
    case "Biconditional":
      return new Biconditional({
        left: substituteFormulaMetaVariablesRec(f.left, subst),
        right: substituteFormulaMetaVariablesRec(f.right, subst),
      });
    case "Universal":
      return new Universal({
        variable: f.variable,
        formula: substituteFormulaMetaVariablesRec(f.formula, subst),
      });
    case "Existential":
      return new Existential({
        variable: f.variable,
        formula: substituteFormulaMetaVariablesRec(f.formula, subst),
      });
    case "Predicate":
      // 述語の項には論理式メタ変数がない
      return f;
    case "Equality":
      // 等号の項には論理式メタ変数がない
      return f;
    case "FormulaSubstitution":
      return new FormulaSubstitution({
        formula: substituteFormulaMetaVariablesRec(f.formula, subst),
        term: f.term,
        variable: f.variable,
      });
  }
  /* v8 ignore start */
  f satisfies never;
  return f;
  /* v8 ignore stop */
};

// ── 2. 項メタ変数代入 ──────────────────────────────────────

/**
 * 項メタ変数代入: 項中の項メタ変数をTermに同時置換する。
 *
 * 論理式中の項にも再帰的に適用する。
 * 変数捕獲は発生しない。
 */
export const substituteTermMetaVariablesInTerm = (
  term: Term,
  subst: TermMetaSubstitutionMap,
): Term => {
  if (subst.size === 0) return term;
  return substituteTermMetaVariablesInTermRec(term, subst);
};

const substituteTermMetaVariablesInTermRec = (
  t: Term,
  subst: TermMetaSubstitutionMap,
): Term => {
  switch (t._tag) {
    case "TermVariable":
    case "Constant":
      return t;
    case "TermMetaVariable": {
      const key = termMetaVariableKey(t);
      const replacement = subst.get(key);
      return replacement !== undefined ? replacement : t;
    }
    case "FunctionApplication":
      return new FunctionApplication({
        name: t.name,
        args: t.args.map((arg) =>
          substituteTermMetaVariablesInTermRec(arg, subst),
        ),
      });
    case "BinaryOperation":
      return new BinaryOperation({
        operator: t.operator,
        left: substituteTermMetaVariablesInTermRec(t.left, subst),
        right: substituteTermMetaVariablesInTermRec(t.right, subst),
      });
  }
  /* v8 ignore start */
  t satisfies never;
  return t;
  /* v8 ignore stop */
};

/**
 * 論理式中の項メタ変数をTermに同時置換する。
 */
export const substituteTermMetaVariablesInFormula = (
  formula: Formula,
  subst: TermMetaSubstitutionMap,
): Formula => {
  if (subst.size === 0) return formula;
  return substituteTermMetaVariablesInFormulaRec(formula, subst);
};

const substituteTermMetaVariablesInFormulaRec = (
  f: Formula,
  subst: TermMetaSubstitutionMap,
): Formula => {
  switch (f._tag) {
    case "MetaVariable":
      return f;
    case "Negation":
      return new Negation({
        formula: substituteTermMetaVariablesInFormulaRec(f.formula, subst),
      });
    case "Implication":
      return new Implication({
        left: substituteTermMetaVariablesInFormulaRec(f.left, subst),
        right: substituteTermMetaVariablesInFormulaRec(f.right, subst),
      });
    case "Conjunction":
      return new Conjunction({
        left: substituteTermMetaVariablesInFormulaRec(f.left, subst),
        right: substituteTermMetaVariablesInFormulaRec(f.right, subst),
      });
    case "Disjunction":
      return new Disjunction({
        left: substituteTermMetaVariablesInFormulaRec(f.left, subst),
        right: substituteTermMetaVariablesInFormulaRec(f.right, subst),
      });
    case "Biconditional":
      return new Biconditional({
        left: substituteTermMetaVariablesInFormulaRec(f.left, subst),
        right: substituteTermMetaVariablesInFormulaRec(f.right, subst),
      });
    case "Universal":
      // 量化子の束縛変数は TermVariable（項変数）であり、項メタ変数ではないのでそのまま
      return new Universal({
        variable: f.variable,
        formula: substituteTermMetaVariablesInFormulaRec(f.formula, subst),
      });
    case "Existential":
      return new Existential({
        variable: f.variable,
        formula: substituteTermMetaVariablesInFormulaRec(f.formula, subst),
      });
    case "Predicate":
      return new Predicate({
        name: f.name,
        args: f.args.map((arg) =>
          substituteTermMetaVariablesInTermRec(arg, subst),
        ),
      });
    case "Equality":
      return new Equality({
        left: substituteTermMetaVariablesInTermRec(f.left, subst),
        right: substituteTermMetaVariablesInTermRec(f.right, subst),
      });
    case "FormulaSubstitution":
      return new FormulaSubstitution({
        formula: substituteTermMetaVariablesInFormulaRec(f.formula, subst),
        term: substituteTermMetaVariablesInTermRec(f.term, subst),
        variable: f.variable,
      });
  }
  /* v8 ignore start */
  f satisfies never;
  return f;
  /* v8 ignore stop */
};

// ── 3. 代入可能性チェック ─────────────────────────────────────

/**
 * 項tが論理式φ中の項変数xに対して自由に代入可能かを判定する。
 *
 * tの自由変数が量化子に捕獲されないことを確認する。
 *
 * @see dev/logic-reference/04-substitution-and-unification.md セクション4.2
 */
export const isFreeFor = (
  term: Term,
  variable: TermVariable,
  formula: Formula,
): boolean => {
  return isFreeForRec(term, variable, formula);
};

const isFreeForRec = (t: Term, x: TermVariable, f: Formula): boolean => {
  switch (f._tag) {
    case "Predicate":
    case "Equality":
    case "MetaVariable":
      // 原子論理式・メタ変数: 常に代入可能
      return true;
    case "Negation":
      return isFreeForRec(t, x, f.formula);
    case "Implication":
    case "Conjunction":
    case "Disjunction":
    case "Biconditional":
      return isFreeForRec(t, x, f.left) && isFreeForRec(t, x, f.right);
    case "Universal":
    case "Existential": {
      // x が φ 中の自由変数でなければ代入は起きない → 常に OK
      if (!freeVariablesInFormula(f).has(x.name)) {
        return true;
      }
      // 量化子の束縛変数 y が t の自由変数に含まれていたら捕獲
      if (freeVariablesInTerm(t).has(f.variable.name)) {
        return false;
      }
      return isFreeForRec(t, x, f.formula);
    }
    case "FormulaSubstitution": {
      // φ[τ/y] に対する x への代入可能性:
      // y が x と同じなら φ 中の x は束縛される → φ 部分は代入不要、τ 部分のみチェック
      if (f.variable.name === x.name) {
        return true;
      }
      // y が t の自由変数に含まれていたら捕獲
      if (freeVariablesInTerm(t).has(f.variable.name)) {
        // x が φ で自由に出現しない場合は問題ない
        if (!freeVariablesInFormula(f.formula).has(x.name)) {
          return isFreeForRec(t, x, f.formula);
        }
        return false;
      }
      return isFreeForRec(t, x, f.formula);
    }
  }
  /* v8 ignore start */
  f satisfies never;
  return true;
  /* v8 ignore stop */
};

// ── 4. 項変数代入 ──────────────────────────────────────────

/**
 * 項変数代入エラーの種類。
 */
export type SubstitutionError =
  | {
      readonly _tag: "VariableCapture";
      readonly variable: string;
      readonly capturedBy: string;
    }
  | {
      readonly _tag: "NotFreeFor";
      readonly term: Term;
      readonly variable: string;
      readonly formula: Formula;
    };

/**
 * 項変数代入の結果型。
 */
export type SubstitutionResult<T> =
  | { readonly _tag: "Ok"; readonly value: T }
  | { readonly _tag: "Error"; readonly error: SubstitutionError };

const ok = <T>(value: T): SubstitutionResult<T> => ({
  _tag: "Ok",
  value,
});

const err = <T>(error: SubstitutionError): SubstitutionResult<T> => ({
  _tag: "Error",
  error,
});

/**
 * 項中の項変数を項に置換する。
 * 項の中に量化子はないので、変数捕獲は起きない。
 */
export const substituteTermVariableInTerm = (
  term: Term,
  variable: TermVariable,
  replacement: Term,
): Term => {
  return substituteTermVariableInTermRec(term, variable, replacement);
};

const substituteTermVariableInTermRec = (
  t: Term,
  x: TermVariable,
  s: Term,
): Term => {
  switch (t._tag) {
    case "TermVariable":
      return t.name === x.name ? s : t;
    case "TermMetaVariable":
    case "Constant":
      return t;
    case "FunctionApplication":
      return new FunctionApplication({
        name: t.name,
        args: t.args.map((arg) => substituteTermVariableInTermRec(arg, x, s)),
      });
    case "BinaryOperation":
      return new BinaryOperation({
        operator: t.operator,
        left: substituteTermVariableInTermRec(t.left, x, s),
        right: substituteTermVariableInTermRec(t.right, x, s),
      });
  }
  /* v8 ignore start */
  t satisfies never;
  return t;
  /* v8 ignore stop */
};

/**
 * 論理式中の項変数xの自由な出現を項sに置換する。
 *
 * 変数捕獲が発生する場合はα変換を自動的に実行する。
 * 手動でisFreeForを呼ぶ必要はなく、安全に代入を実行する。
 */
export const substituteTermVariableInFormula = (
  formula: Formula,
  variable: TermVariable,
  replacement: Term,
): Formula => {
  return substituteTermVariableInFormulaRec(formula, variable, replacement);
};

const substituteTermVariableInFormulaRec = (
  f: Formula,
  x: TermVariable,
  s: Term,
): Formula => {
  switch (f._tag) {
    case "MetaVariable":
      // 論理式メタ変数は項変数代入の対象外
      return f;
    case "Negation":
      return new Negation({
        formula: substituteTermVariableInFormulaRec(f.formula, x, s),
      });
    case "Implication":
      return new Implication({
        left: substituteTermVariableInFormulaRec(f.left, x, s),
        right: substituteTermVariableInFormulaRec(f.right, x, s),
      });
    case "Conjunction":
      return new Conjunction({
        left: substituteTermVariableInFormulaRec(f.left, x, s),
        right: substituteTermVariableInFormulaRec(f.right, x, s),
      });
    case "Disjunction":
      return new Disjunction({
        left: substituteTermVariableInFormulaRec(f.left, x, s),
        right: substituteTermVariableInFormulaRec(f.right, x, s),
      });
    case "Biconditional":
      return new Biconditional({
        left: substituteTermVariableInFormulaRec(f.left, x, s),
        right: substituteTermVariableInFormulaRec(f.right, x, s),
      });
    case "Universal":
    case "Existential": {
      const boundVar = f.variable;
      // 束縛変数と代入対象が同じ → 代入しない
      if (boundVar.name === x.name) {
        return f;
      }
      // x がこの量化式の本体で自由に出現しない → 代入不要
      if (!freeVariablesInFormula(f).has(x.name)) {
        return f;
      }
      // 束縛変数が代入項の自由変数に含まれる → α変換
      const freeInS = freeVariablesInTerm(s);
      if (freeInS.has(boundVar.name)) {
        // α変換: 束縛変数を新鮮な変数にリネーム
        const usedNames = new Set<string>();
        for (const v of allVariableNamesInFormula(f.formula)) {
          usedNames.add(v);
        }
        for (const v of allVariableNamesInTerm(s)) {
          usedNames.add(v);
        }
        usedNames.add(x.name);
        const freshName = freshVariableName(boundVar.name, usedNames);
        const freshVar = new TermVariable({ name: freshName });

        // 束縛変数を新鮮な変数にリネーム
        const renamedBody = substituteTermVariableInFormulaRec(
          f.formula,
          boundVar,
          freshVar,
        );

        // リネーム後の本体に元の代入を適用
        const substitutedBody = substituteTermVariableInFormulaRec(
          renamedBody,
          x,
          s,
        );

        if (f._tag === "Universal") {
          return new Universal({
            variable: freshVar,
            formula: substitutedBody,
          });
        }
        return new Existential({
          variable: freshVar,
          formula: substitutedBody,
        });
      }
      // 捕獲の心配なし → 本体に再帰的に代入
      if (f._tag === "Universal") {
        return new Universal({
          variable: f.variable,
          formula: substituteTermVariableInFormulaRec(f.formula, x, s),
        });
      }
      return new Existential({
        variable: f.variable,
        formula: substituteTermVariableInFormulaRec(f.formula, x, s),
      });
    }
    case "Predicate":
      return new Predicate({
        name: f.name,
        args: f.args.map((arg) => substituteTermVariableInTermRec(arg, x, s)),
      });
    case "Equality":
      return new Equality({
        left: substituteTermVariableInTermRec(f.left, x, s),
        right: substituteTermVariableInTermRec(f.right, x, s),
      });
    case "FormulaSubstitution": {
      // φ[τ/y] に対する x の代入:
      // y == x → φ 中の x は [τ/y] で束縛されるため代入しない。τ 中は代入する
      if (f.variable.name === x.name) {
        return new FormulaSubstitution({
          formula: f.formula,
          term: substituteTermVariableInTermRec(f.term, x, s),
          variable: f.variable,
        });
      }
      // y ≠ x → formula と term 両方に再帰
      // ただし s の自由変数に y が含まれる場合は α変換が必要
      const freeInS = freeVariablesInTerm(s);
      if (freeInS.has(f.variable.name) && freeVariablesInFormula(f.formula).has(x.name)) {
        // α変換: [τ/y] の y を新鮮な変数に
        const usedNames = new Set<string>();
        for (const v of allVariableNamesInFormula(f.formula)) {
          usedNames.add(v);
        }
        for (const v of allVariableNamesInTerm(f.term)) {
          usedNames.add(v);
        }
        for (const v of allVariableNamesInTerm(s)) {
          usedNames.add(v);
        }
        usedNames.add(x.name);
        const freshName = freshVariableName(f.variable.name, usedNames);
        const freshVar = new TermVariable({ name: freshName });

        // y を新鮮な変数にリネーム（formula 内のみ）
        const renamedFormula = substituteTermVariableInFormulaRec(
          f.formula,
          f.variable,
          freshVar,
        );
        // リネーム後の formula に x → s 代入を適用
        const substitutedFormula = substituteTermVariableInFormulaRec(
          renamedFormula,
          x,
          s,
        );
        return new FormulaSubstitution({
          formula: substitutedFormula,
          term: substituteTermVariableInTermRec(f.term, x, s),
          variable: freshVar,
        });
      }
      return new FormulaSubstitution({
        formula: substituteTermVariableInFormulaRec(f.formula, x, s),
        term: substituteTermVariableInTermRec(f.term, x, s),
        variable: f.variable,
      });
    }
  }
  /* v8 ignore start */
  f satisfies never;
  return f;
  /* v8 ignore stop */
};

// ── 5. 代入の合成 ─────────────────────────────────────────────

/**
 * 論理式メタ変数代入の合成: σ1 ∘ σ2
 *
 * (σ1 ∘ σ2)(φ) = σ1(σ2(φ))
 *
 * 構成:
 * - σ2のマッピング {βj → σ1(χj)} (βj → βjは除外)
 * - σ1のうちσ2のdomainに含まれないマッピング {αi → ψi}
 */
export const composeFormulaSubstitution = (
  sigma1: FormulaSubstitutionMap,
  sigma2: FormulaSubstitutionMap,
): FormulaSubstitutionMap => {
  const result = new Map<string, Formula>();

  // σ2のマッピングにσ1を適用
  for (const [key, value] of sigma2) {
    const applied = substituteFormulaMetaVariables(value, sigma1);
    // βj → βj (identity) は除外: keyに対応するメタ変数と結果が同じ場合
    // ただし applied がメタ変数でkeyが一致する場合のみ
    if (applied._tag === "MetaVariable" && metaVariableKey(applied) === key) {
      continue;
    }
    result.set(key, applied);
  }

  // σ1のうちσ2のdomainに含まれないマッピングを追加
  for (const [key, value] of sigma1) {
    if (!sigma2.has(key)) {
      result.set(key, value);
    }
  }

  return result;
};

/**
 * 項メタ変数代入の合成: σ1 ∘ σ2
 */
export const composeTermMetaSubstitution = (
  sigma1: TermMetaSubstitutionMap,
  sigma2: TermMetaSubstitutionMap,
): TermMetaSubstitutionMap => {
  const result = new Map<string, Term>();

  // σ2のマッピングにσ1を適用
  for (const [key, value] of sigma2) {
    const applied = substituteTermMetaVariablesInTerm(value, sigma1);
    if (
      applied._tag === "TermMetaVariable" &&
      termMetaVariableKey(applied) === key
    ) {
      continue;
    }
    result.set(key, applied);
  }

  // σ1のうちσ2のdomainに含まれないマッピングを追加
  for (const [key, value] of sigma1) {
    if (!sigma2.has(key)) {
      result.set(key, value);
    }
  }

  return result;
};

// ── ヘルパー: 代入マップ構築 ───────────────────────────────────

/**
 * MetaVariable の配列と Formula の配列からFormulaSubstitutionMapを構築する。
 */
export const buildFormulaSubstitutionMap = (
  entries: ReadonlyArray<readonly [MetaVariable, Formula]>,
): FormulaSubstitutionMap => {
  const map = new Map<string, Formula>();
  for (const [mv, f] of entries) {
    map.set(metaVariableKey(mv), f);
  }
  return map;
};

/**
 * TermMetaVariable の配列と Term の配列からTermMetaSubstitutionMapを構築する。
 */
export const buildTermMetaSubstitutionMap = (
  entries: ReadonlyArray<readonly [TermMetaVariable, Term]>,
): TermMetaSubstitutionMap => {
  const map = new Map<string, Term>();
  for (const [tmv, t] of entries) {
    map.set(termMetaVariableKey(tmv), t);
  }
  return map;
};

// ── 6. 検証付き項変数代入 ──────────────────────────────────────

/**
 * 項変数代入（代入可能性チェック付き）: エラーを返す版。
 *
 * α変換を行わず、代入不可能な場合はエラーを返す。
 * 証明検証器で使用する。
 */
export const substituteTermVariableChecked = (
  formula: Formula,
  variable: TermVariable,
  replacement: Term,
): SubstitutionResult<Formula> => {
  if (!isFreeFor(replacement, variable, formula)) {
    return err({
      _tag: "NotFreeFor",
      term: replacement,
      variable: variable.name,
      formula,
    });
  }
  return ok(substituteTermVariableInFormula(formula, variable, replacement));
};

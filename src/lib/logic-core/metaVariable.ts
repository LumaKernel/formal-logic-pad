import type { GreekLetter } from "./greekLetters";
import type { Formula, MetaVariable } from "./formula";
import type { Term, TermMetaVariable } from "./term";

/**
 * Formula が MetaVariable かどうかを判定する。
 */
export const isFormulaMetaVariable = (f: Formula) => f._tag === "MetaVariable";

/**
 * Term が TermMetaVariable かどうかを判定する。
 */
export const isTermMetaVariable = (t: Term) => t._tag === "TermMetaVariable";

/**
 * MetaVariable の識別子（name + subscript）を文字列キーとして返す。
 * 等価性比較やMapのキーとして使用する。
 */
export const metaVariableKey = (mv: MetaVariable): string =>
  mv.subscript !== undefined
    ? `${mv.name satisfies string}_${mv.subscript satisfies string}`
    : `${mv.name satisfies string}`;

/**
 * TermMetaVariable の識別子（name + subscript）を文字列キーとして返す。
 */
export const termMetaVariableKey = (tmv: TermMetaVariable): string =>
  tmv.subscript !== undefined
    ? `${tmv.name satisfies string}_${tmv.subscript satisfies string}`
    : `${tmv.name satisfies string}`;

/**
 * 2つの MetaVariable が等しいかを判定する。
 * name と subscript の一致を確認。
 */
export const equalMetaVariable = (a: MetaVariable, b: MetaVariable): boolean =>
  a.name === b.name && a.subscript === b.subscript;

/**
 * 2つの TermMetaVariable が等しいかを判定する。
 */
export const equalTermMetaVariable = (
  a: TermMetaVariable,
  b: TermMetaVariable,
): boolean => a.name === b.name && a.subscript === b.subscript;

/**
 * MetaVariable が指定された名前と添字を持つかを判定する。
 */
export const matchesMetaVariable = (
  mv: MetaVariable,
  name: GreekLetter,
  subscript?: string,
): boolean => mv.name === name && mv.subscript === subscript;

/**
 * TermMetaVariable が指定された名前と添字を持つかを判定する。
 */
export const matchesTermMetaVariable = (
  tmv: TermMetaVariable,
  name: GreekLetter,
  subscript?: string,
): boolean => tmv.name === name && tmv.subscript === subscript;

/**
 * Formula 内のすべての MetaVariable を収集する（重複あり）。
 */
export const collectFormulaMetaVariables = (
  f: Formula,
): readonly MetaVariable[] => {
  switch (f._tag) {
    case "MetaVariable":
      return [f];
    case "Negation":
      return collectFormulaMetaVariables(f.formula);
    case "Implication":
    case "Conjunction":
    case "Disjunction":
    case "Biconditional":
      return [
        ...collectFormulaMetaVariables(f.left),
        ...collectFormulaMetaVariables(f.right),
      ];
    case "Universal":
    case "Existential":
      return collectFormulaMetaVariables(f.formula);
    case "Predicate":
    case "Equality":
      // Term にはFormulaのMetaVariableは含まれない
      return [];
  }
  /* v8 ignore start */
  f satisfies never;
  return [];
  /* v8 ignore stop */
};

/**
 * Term 内のすべての TermMetaVariable を収集する（重複あり）。
 */
export const collectTermMetaVariables = (
  t: Term,
): readonly TermMetaVariable[] => {
  switch (t._tag) {
    case "TermVariable":
    case "Constant":
      return [];
    case "TermMetaVariable":
      return [t];
    case "FunctionApplication":
      return t.args.flatMap(collectTermMetaVariables);
    case "BinaryOperation":
      return [
        ...collectTermMetaVariables(t.left),
        ...collectTermMetaVariables(t.right),
      ];
  }
  /* v8 ignore start */
  t satisfies never;
  return [];
  /* v8 ignore stop */
};

/**
 * Formula 内（Term部分含む）のすべての TermMetaVariable を収集する（重複あり）。
 */
export const collectTermMetaVariablesInFormula = (
  f: Formula,
): readonly TermMetaVariable[] => {
  switch (f._tag) {
    case "MetaVariable":
      return [];
    case "Negation":
      return collectTermMetaVariablesInFormula(f.formula);
    case "Implication":
    case "Conjunction":
    case "Disjunction":
    case "Biconditional":
      return [
        ...collectTermMetaVariablesInFormula(f.left),
        ...collectTermMetaVariablesInFormula(f.right),
      ];
    case "Universal":
    case "Existential":
      return collectTermMetaVariablesInFormula(f.formula);
    case "Predicate":
      return f.args.flatMap(collectTermMetaVariables);
    case "Equality":
      return [
        ...collectTermMetaVariables(f.left),
        ...collectTermMetaVariables(f.right),
      ];
  }
  /* v8 ignore start */
  f satisfies never;
  return [];
  /* v8 ignore stop */
};

/**
 * Formula 内のユニークな MetaVariable を収集する。
 * metaVariableKey で重複を排除。
 */
export const collectUniqueFormulaMetaVariables = (
  f: Formula,
): readonly MetaVariable[] => {
  const all = collectFormulaMetaVariables(f);
  const seen = new Set<string>();
  const result: MetaVariable[] = [];
  for (const mv of all) {
    const key = metaVariableKey(mv);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(mv);
    }
  }
  return result;
};

/**
 * Formula 内（Term部分含む）のユニークな TermMetaVariable を収集する。
 * termMetaVariableKey で重複を排除。
 */
export const collectUniqueTermMetaVariablesInFormula = (
  f: Formula,
): readonly TermMetaVariable[] => {
  const all = collectTermMetaVariablesInFormula(f);
  const seen = new Set<string>();
  const result: TermMetaVariable[] = [];
  for (const tmv of all) {
    const key = termMetaVariableKey(tmv);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(tmv);
    }
  }
  return result;
};

/**
 * Term 内のユニークな TermMetaVariable を収集する。
 * termMetaVariableKey で重複を排除。
 */
export const collectUniqueTermMetaVariables = (
  t: Term,
): readonly TermMetaVariable[] => {
  const all = collectTermMetaVariables(t);
  const seen = new Set<string>();
  const result: TermMetaVariable[] = [];
  for (const tmv of all) {
    const key = termMetaVariableKey(tmv);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(tmv);
    }
  }
  return result;
};

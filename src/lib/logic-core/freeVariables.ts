import type { Formula } from "./formula";
import type { Term, TermVariable } from "./term";

/**
 * 項（Term）中の自由な項変数をすべて収集する。
 * 項の中に量化子はないので、すべての TermVariable が自由。
 */
export const freeVariablesInTerm = (t: Term): ReadonlySet<string> => {
  switch (t._tag) {
    case "TermVariable":
      return new Set([t.name]);
    case "TermMetaVariable":
    case "Constant":
      return new Set();
    case "FunctionApplication": {
      const result = new Set<string>();
      for (const arg of t.args) {
        for (const v of freeVariablesInTerm(arg)) {
          result.add(v);
        }
      }
      return result;
    }
    case "BinaryOperation": {
      const result = new Set<string>();
      for (const v of freeVariablesInTerm(t.left)) {
        result.add(v);
      }
      for (const v of freeVariablesInTerm(t.right)) {
        result.add(v);
      }
      return result;
    }
  }
  /* v8 ignore start */
  t satisfies never;
  return new Set();
  /* v8 ignore stop */
};

/**
 * 論理式（Formula）中の自由な項変数をすべて収集する。
 * 量化子（∀x, ∃x）で束縛された変数は除外する。
 */
export const freeVariablesInFormula = (f: Formula): ReadonlySet<string> => {
  switch (f._tag) {
    case "MetaVariable":
      return new Set();
    case "Negation":
      return freeVariablesInFormula(f.formula);
    case "Implication":
    case "Conjunction":
    case "Disjunction":
    case "Biconditional": {
      const result = new Set<string>();
      for (const v of freeVariablesInFormula(f.left)) {
        result.add(v);
      }
      for (const v of freeVariablesInFormula(f.right)) {
        result.add(v);
      }
      return result;
    }
    case "Universal":
    case "Existential": {
      const inner = freeVariablesInFormula(f.formula);
      const result = new Set(inner);
      result.delete(f.variable.name);
      return result;
    }
    case "Predicate": {
      const result = new Set<string>();
      for (const arg of f.args) {
        for (const v of freeVariablesInTerm(arg)) {
          result.add(v);
        }
      }
      return result;
    }
    case "Equality": {
      const result = new Set<string>();
      for (const v of freeVariablesInTerm(f.left)) {
        result.add(v);
      }
      for (const v of freeVariablesInTerm(f.right)) {
        result.add(v);
      }
      return result;
    }
    case "FormulaSubstitution": {
      // φ[τ/x] の自由変数 = (φの自由変数 \ {x}) ∪ (xがφで自由なら τの自由変数)
      const innerFree = freeVariablesInFormula(f.formula);
      const result = new Set(innerFree);
      const xFreeInFormula = result.delete(f.variable.name);
      if (xFreeInFormula) {
        for (const v of freeVariablesInTerm(f.term)) {
          result.add(v);
        }
      }
      return result;
    }
    case "FreeVariableAbsence": {
      // φ[/x] の自由変数 = φの自由変数 \ {x}（xが自由でないことをアサートしているため）
      const innerFree = freeVariablesInFormula(f.formula);
      const result = new Set(innerFree);
      result.delete(f.variable.name);
      return result;
    }
  }
  /* v8 ignore start */
  f satisfies never;
  return new Set();
  /* v8 ignore stop */
};

/**
 * 論理式中で項変数 x が自由に出現するかを判定する。
 */
export const isFreeInFormula = (
  variable: TermVariable,
  f: Formula,
): boolean => {
  return freeVariablesInFormula(f).has(variable.name);
};

/**
 * 式全体（Formula + Term部分）に出現するすべての項変数名を収集する（束縛・自由の区別なし）。
 * α変換で新鮮な変数を生成する際に使用。
 */
export const allVariableNamesInFormula = (f: Formula): ReadonlySet<string> => {
  switch (f._tag) {
    case "MetaVariable":
      return new Set();
    case "Negation":
      return allVariableNamesInFormula(f.formula);
    case "Implication":
    case "Conjunction":
    case "Disjunction":
    case "Biconditional": {
      const result = new Set<string>();
      for (const v of allVariableNamesInFormula(f.left)) {
        result.add(v);
      }
      for (const v of allVariableNamesInFormula(f.right)) {
        result.add(v);
      }
      return result;
    }
    case "Universal":
    case "Existential": {
      const result = new Set<string>();
      result.add(f.variable.name);
      for (const v of allVariableNamesInFormula(f.formula)) {
        result.add(v);
      }
      return result;
    }
    case "Predicate": {
      const result = new Set<string>();
      for (const arg of f.args) {
        for (const v of allVariableNamesInTerm(arg)) {
          result.add(v);
        }
      }
      return result;
    }
    case "Equality": {
      const result = new Set<string>();
      for (const v of allVariableNamesInTerm(f.left)) {
        result.add(v);
      }
      for (const v of allVariableNamesInTerm(f.right)) {
        result.add(v);
      }
      return result;
    }
    case "FormulaSubstitution": {
      const result = new Set<string>();
      result.add(f.variable.name);
      for (const v of allVariableNamesInFormula(f.formula)) {
        result.add(v);
      }
      for (const v of allVariableNamesInTerm(f.term)) {
        result.add(v);
      }
      return result;
    }
    case "FreeVariableAbsence": {
      const result = new Set<string>();
      result.add(f.variable.name);
      for (const v of allVariableNamesInFormula(f.formula)) {
        result.add(v);
      }
      return result;
    }
  }
  /* v8 ignore start */
  f satisfies never;
  return new Set();
  /* v8 ignore stop */
};

/**
 * 項に出現するすべての項変数名を収集する。
 */
export const allVariableNamesInTerm = (t: Term): ReadonlySet<string> => {
  switch (t._tag) {
    case "TermVariable":
      return new Set([t.name]);
    case "TermMetaVariable":
    case "Constant":
      return new Set();
    case "FunctionApplication": {
      const result = new Set<string>();
      for (const arg of t.args) {
        for (const v of allVariableNamesInTerm(arg)) {
          result.add(v);
        }
      }
      return result;
    }
    case "BinaryOperation": {
      const result = new Set<string>();
      for (const v of allVariableNamesInTerm(t.left)) {
        result.add(v);
      }
      for (const v of allVariableNamesInTerm(t.right)) {
        result.add(v);
      }
      return result;
    }
  }
  /* v8 ignore start */
  t satisfies never;
  return new Set();
  /* v8 ignore stop */
};

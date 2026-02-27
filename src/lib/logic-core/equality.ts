import type { Formula } from "./formula";
import type { Term } from "./term";

/**
 * 2つの項（Term）が構造的に等しいかを判定する。
 * name + subscript + 再帰的な子ノードの一致を確認。
 */
export const equalTerm = (a: Term, b: Term): boolean => {
  if (a._tag !== b._tag) return false;
  switch (a._tag) {
    case "TermVariable":
      return a.name === (b as typeof a).name;
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
        a.args.every((arg, i) => equalTerm(arg, bFunc.args[i]))
      );
    }
    case "BinaryOperation": {
      const bBin = b as typeof a;
      return (
        a.operator === bBin.operator &&
        equalTerm(a.left, bBin.left) &&
        equalTerm(a.right, bBin.right)
      );
    }
  }
  /* v8 ignore start */
  a satisfies never;
  return false;
  /* v8 ignore stop */
};

/**
 * 2つの論理式（Formula）が構造的に等しいかを判定する。
 * _tag + フィールドの再帰的一致を確認。
 */
export const equalFormula = (a: Formula, b: Formula): boolean => {
  if (a._tag !== b._tag) return false;
  switch (a._tag) {
    case "MetaVariable":
      return (
        a.name === (b as typeof a).name &&
        a.subscript === (b as typeof a).subscript
      );
    case "Negation":
      return equalFormula(a.formula, (b as typeof a).formula);
    case "Implication":
    case "Conjunction":
    case "Disjunction":
    case "Biconditional": {
      const bBin = b as typeof a;
      return (
        equalFormula(a.left, bBin.left) && equalFormula(a.right, bBin.right)
      );
    }
    case "Universal":
    case "Existential": {
      const bQuant = b as typeof a;
      return (
        equalTerm(a.variable, bQuant.variable) &&
        equalFormula(a.formula, bQuant.formula)
      );
    }
    case "Predicate": {
      const bPred = b as typeof a;
      return (
        a.name === bPred.name &&
        a.args.length === bPred.args.length &&
        a.args.every((arg, i) => equalTerm(arg, bPred.args[i]))
      );
    }
    case "Equality": {
      const bEq = b as typeof a;
      return equalTerm(a.left, bEq.left) && equalTerm(a.right, bEq.right);
    }
    case "FormulaSubstitution": {
      const bSub = b as typeof a;
      return (
        equalFormula(a.formula, bSub.formula) &&
        equalTerm(a.term, bSub.term) &&
        equalTerm(a.variable, bSub.variable)
      );
    }
  }
  /* v8 ignore start */
  a satisfies never;
  return false;
  /* v8 ignore stop */
};

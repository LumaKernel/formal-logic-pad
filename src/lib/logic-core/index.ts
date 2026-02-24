// ── Greek Letters ────────────────────────────────────────
export {
  greekLetters,
  greekLetterNames,
  isGreekLetter,
  isValidSubscript,
  GreekLetter,
  Subscript,
} from "./greekLetters";
export type { GreekLetter as GreekLetterType } from "./greekLetters";

// ── Term AST ─────────────────────────────────────────────
export {
  TermVariable,
  TermMetaVariable,
  Constant,
  FunctionApplication,
  BinaryOperation,
  BinaryOperator,
  binaryOperators,
  Term,
  termVariable,
  termMetaVariable,
  constant,
  functionApplication,
  binaryOperation,
} from "./term";
export type {
  Term as TermType,
  BinaryOperator as BinaryOperatorType,
} from "./term";

// ── Formula AST ──────────────────────────────────────────
export {
  MetaVariable,
  Negation,
  Implication,
  Conjunction,
  Disjunction,
  Biconditional,
  Universal,
  Existential,
  Predicate,
  Equality,
  Formula,
  metaVariable,
  negation,
  implication,
  conjunction,
  disjunction,
  biconditional,
  universal,
  existential,
  predicate,
  equality,
} from "./formula";
export type { Formula as FormulaType } from "./formula";

// ── Equality (structural) ───────────────────────────────
export { equalTerm, equalFormula } from "./equality";

// ── MetaVariable utilities ──────────────────────────────
export {
  isFormulaMetaVariable,
  isTermMetaVariable,
  metaVariableKey,
  termMetaVariableKey,
  equalMetaVariable,
  equalTermMetaVariable,
  matchesMetaVariable,
  matchesTermMetaVariable,
  collectFormulaMetaVariables,
  collectTermMetaVariables,
  collectTermMetaVariablesInFormula,
  collectUniqueFormulaMetaVariables,
  collectUniqueTermMetaVariables,
} from "./metaVariable";

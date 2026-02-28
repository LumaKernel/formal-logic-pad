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
  FormulaSubstitution,
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
  formulaSubstitution,
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

// ── Free Variables ──────────────────────────────────────────
export {
  freeVariablesInTerm,
  freeVariablesInFormula,
  isFreeInFormula,
  allVariableNamesInFormula,
  allVariableNamesInTerm,
} from "./freeVariables";

// ── Substitution ────────────────────────────────────────────
export {
  substituteFormulaMetaVariables,
  substituteTermMetaVariablesInTerm,
  substituteTermMetaVariablesInFormula,
  substituteTermVariableInTerm,
  substituteTermVariableInFormula,
  substituteTermVariableChecked,
  resolveFormulaSubstitution,
  isFreeFor,
  composeFormulaSubstitution,
  composeTermMetaSubstitution,
  buildFormulaSubstitutionMap,
  buildTermMetaSubstitutionMap,
  freshVariableName,
} from "./substitution";
export type {
  FormulaSubstitutionMap,
  TermMetaSubstitutionMap,
  TermVariableSubstitutionMap,
  SubstitutionError,
  SubstitutionResult,
} from "./substitution";

// ── Unification ─────────────────────────────────────────────
export { unifyFormulas, unifyTerms } from "./unification";
export type { UnificationResult, UnificationError } from "./unification";

// ── Inference Rules ─────────────────────────────────────────
export {
  applyModusPonens,
  applyGeneralization,
  applySubstitution,
  matchPropositionalAxiom,
  matchAxiomA4,
  matchAxiomA5,
  matchEqualityAxiom,
  matchTheoryAxiom,
  identifyAxiom,
  axiomA1Template,
  axiomA2Template,
  axiomA3Template,
  axiomE1Template,
  axiomE2Template,
  axiomE3Template,
  axiomPA1Template,
  axiomPA2Template,
  axiomPA3Template,
  axiomPA4Template,
  axiomPA5Template,
  axiomPA6Template,
  peanoFixedAxioms,
  robinsonAxioms,
  axiomQ7Template,
  lukasiewiczSystem,
  predicateLogicSystem,
  equalityLogicSystem,
  peanoArithmeticSystem,
  robinsonArithmeticSystem,
  peanoArithmeticHKSystem,
  peanoArithmeticMendelsonSystem,
  heytingArithmeticSystem,
  axiomG1Template,
  axiomG2LTemplate,
  axiomG2RTemplate,
  axiomG3LTemplate,
  axiomG3RTemplate,
  axiomG4CommTemplate,
  groupLeftAxioms,
  groupFullAxioms,
  abelianGroupAxioms,
  groupTheoryLeftSystem,
  groupTheoryFullSystem,
  abelianGroupSystem,
  skSystem,
  minimalLogicSystem,
  intuitionisticSystem,
  classicalLogicSystem,
  mendelsonSystem,
} from "./inferenceRule";
export type {
  PropositionalAxiomId,
  PredicateAxiomId,
  EqualityAxiomId,
  AxiomId,
  TheoryAxiom,
  LogicSystem,
  RuleApplicationError,
  RuleApplicationResult,
  AxiomMatchResult,
  AxiomIdentificationResult,
} from "./inferenceRule";

// ── Proof Tree ──────────────────────────────────────────────
export {
  axiomNode,
  modusPonensNode,
  generalizationNode,
  getConclusion,
  countNodes,
  proofDepth,
  collectAxiomNodes,
  validateProof,
  toVisualizationData,
} from "./proofTree";
export type {
  AxiomNode,
  ModusPonensNode,
  GeneralizationNode,
  ProofNode,
  PathSegment,
  ProofValidationError,
  ProofValidationResult,
  ProofNodeVisualization,
} from "./proofTree";

// ── Natural Deduction (自然演繹) ────────────────────────────
export {
  assumption,
  weakening,
  implicationIntro,
  implicationElim,
  conjunctionIntro,
  conjunctionElimLeft,
  conjunctionElimRight,
  disjunctionIntroLeft,
  disjunctionIntroRight,
  disjunctionElim,
  efqRule,
  dneRule,
  getNdConclusion,
  getOpenAssumptions,
  countNdNodes,
  ndProofDepth,
  validateNdProof,
} from "./naturalDeduction";
export type {
  AssumptionId,
  NdAssumption,
  NdWeakening,
  NdImplicationIntro,
  NdImplicationElim,
  NdConjunctionIntro,
  NdConjunctionElimLeft,
  NdConjunctionElimRight,
  NdDisjunctionIntroLeft,
  NdDisjunctionIntroRight,
  NdDisjunctionElim,
  NdEfq,
  NdDne,
  NdProofNode,
  NdValidationError,
  NdValidationResult,
} from "./naturalDeduction";

// ── Deduction System (統一体系管理) ─────────────────────────
export {
  nmSystem,
  njSystem,
  nkSystem,
  hilbertDeduction,
  naturalDeduction,
  getDeductionSystemName,
  getDeductionStyleLabel,
  isNdRuleEnabled,
  allNdRuleIds,
  getNdRuleDisplayName,
} from "./deductionSystem";
export type {
  DeductionStyle,
  NdRuleId,
  NaturalDeductionSystem,
  DeductionSystem,
} from "./deductionSystem";

// ── Evaluation (命題論理の真理値評価) ─────────────────────
export {
  evaluateFormula,
  collectPropositionalVariables,
  isTautology,
  isSatisfiable,
  isContradiction,
  generateTruthTable,
} from "./evaluation";
export type {
  TruthAssignment,
  TruthTableRow,
  TruthTable,
} from "./evaluation";

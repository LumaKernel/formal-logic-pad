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
export {
  unifyFormulas,
  unifyTerms,
  unifyFormulasEffect,
  unifyTermsEffect,
  StructureMismatch,
  OccursCheck,
  TagMismatch,
} from "./unification";
export type {
  UnificationResult,
  UnificationError,
  UnificationSuccess,
} from "./unification";

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
  NotAnImplication,
  PremiseMismatch,
  NotAnAxiomInstance,
  AxiomNotEnabled,
  GeneralizationNotEnabled,
  SubstitutionNotFreeFor,
  VariableNotFreeInPremise,
  EqualityNotEnabled,
  NotAUniversal,
  A5VariableFreeInAntecedent,
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
  RuleApplicationSuccess,
  AxiomMatchResult,
  AxiomMatchSuccess,
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
  tabSystem,
  tabPropSystem,
  hilbertDeduction,
  naturalDeduction,
  tableauCalculusDeduction,
  getDeductionSystemName,
  getDeductionStyleLabel,
  isNdRuleEnabled,
  allNdRuleIds,
  getNdRuleDisplayName,
  isTabRuleEnabled,
} from "./deductionSystem";
export type {
  DeductionStyle,
  NdRuleId,
  NaturalDeductionSystem,
  TableauCalculusSystem,
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
export type { TruthAssignment, TruthTableRow, TruthTable } from "./evaluation";

// ── Normal Forms (標準形変換) ───────────────────────────────
export {
  toNNF,
  toCNF,
  toDNF,
  isNNF,
  isCNF,
  isDNF,
  toPredicateNNF,
  toPNF,
  isPNF,
} from "./normalForm";

// ── Tableau Calculus (タブロー式シーケント計算) ──────────────
export {
  tabSequent,
  tabBasicSequent,
  tabBottom,
  tabExchange,
  tabDoubleNegation,
  tabConjunction,
  tabNegConjunction,
  tabDisjunction,
  tabNegDisjunction,
  tabImplication,
  tabNegImplication,
  tabUniversal,
  tabNegUniversal,
  tabExistential,
  tabNegExistential,
  getTabConclusion,
  countTabNodes,
  tabProofDepth,
  validateTabProof,
  allTabRuleIds,
  getTabRuleDisplayName,
  tabNodeToRuleId,
  isTabBranchingRule,
  hasTabEigenVariableCondition,
} from "./tableauCalculus";
export type {
  TabSequent,
  TabBasicSequent,
  TabBottom,
  TabExchange,
  TabDoubleNegation,
  TabConjunction,
  TabNegConjunction,
  TabDisjunction,
  TabNegDisjunction,
  TabImplication,
  TabNegImplication,
  TabUniversal,
  TabNegUniversal,
  TabExistential,
  TabNegExistential,
  TabProofNode,
  TabValidationError,
  TabValidationResult,
  TabRuleId,
} from "./tableauCalculus";

// ── Analytic Tableau (分析的タブロー) ─────────────────────────
export {
  signedFormula,
  allAtRuleIds,
  isAlphaRule,
  isBetaRule,
  isGammaRule,
  isDeltaRule,
  isClosureRule,
  getAtRuleDisplayName,
  applyAlphaRule,
  applyBetaRule,
  applyGammaRule,
  applyDeltaRule,
  classifySignedFormula,
  checkBranchClosure,
  checkEigenVariableCondition,
  canApplyRule,
} from "./analyticTableau";
export type {
  Sign,
  SignedFormula,
  AtRuleId,
  AlphaResult,
  BetaResult,
  GammaResult,
  DeltaResult,
  AtRuleResult,
  BranchClosureResult,
} from "./analyticTableau";

// ── Cut Elimination (カット除去) ─────────────────────────────
export {
  formulaDepth,
  removeAllOccurrences,
  removeFirstOccurrence,
  containsFormula,
  countOccurrences,
  rightRank,
  leftRank,
  mixRank,
  getScChildren,
  eliminateCuts,
  eliminateCutsWithSteps,
  isCutFree,
  countCuts,
  sequentEqual,
  DEFAULT_MAX_STEPS,
} from "./cutElimination";
export type {
  CutEliminationResult,
  CutEliminationStep,
  CutEliminationOptions,
} from "./cutElimination";

// ── Serialization (Schema decode/encode) ─────────────────────
export {
  decodeFormula,
  encodeFormula,
  decodeTerm,
  encodeTerm,
} from "./serialization";

/**
 * 推論規則モジュール。
 *
 * Hilbert系の推論規則・公理スキーマ・体系設定を定義し、
 * 規則適用の検証関数を提供する。
 *
 * @see dev/logic-reference/02-propositional-logic.md
 * @see dev/logic-reference/03-predicate-logic.md
 * @see dev/logic-reference/05-equality-logic.md
 * @see dev/logic-reference/07-axiom-systems-survey.md
 */

import {
  type Formula,
  implication,
  negation,
  metaVariable,
  universal,
  equality,
} from "./formula";
import { type Term, TermVariable, termVariable } from "./term";
import { equalFormula, equalTerm } from "./equality";
import { metaVariableKey, termMetaVariableKey } from "./metaVariable";
import {
  substituteFormulaMetaVariables,
  substituteTermMetaVariablesInFormula,
  substituteTermVariableInFormula,
  isFreeFor,
  type FormulaSubstitutionMap,
  type TermMetaSubstitutionMap,
} from "./substitution";
import { freeVariablesInFormula } from "./freeVariables";

// ── 公理スキーマ定義 ──────────────────────────────────────

/**
 * 命題論理の公理スキーマID。
 *
 * - A1 (K公理): φ → (ψ → φ) — 全体系共通
 * - A2 (S公理): (φ → (ψ → χ)) → ((φ → ψ) → (φ → χ)) — 全体系共通
 * - A3 (対偶): (¬φ → ¬ψ) → (ψ → φ) — Łukasiewicz体系
 * - M3 (背理法): (¬φ → ¬ψ) → ((¬φ → ψ) → φ) — Mendelson体系
 *
 * 新しい命題論理公理を追加する場合:
 *   1. ここに ID を追加
 *   2. テンプレートを追加 (axiomXXTemplate)
 *   3. getPropositionalAxiomTemplate の switch に追加
 *   4. axiomNameLogic.ts の axiomDisplayNames に追加
 *   5. axiomPaletteLogic.ts の propositionalAxiomMetas に追加
 *   6. notebookSerialization.ts の VALID_AXIOM_IDS に追加
 */
export type PropositionalAxiomId = "A1" | "A2" | "A3" | "M3";

/**
 * 述語論理の追加公理スキーマID。
 */
export type PredicateAxiomId = "A4" | "A5";

/**
 * 等号公理スキーマID。
 */
export type EqualityAxiomId = "E1" | "E2" | "E3" | "E4" | "E5";

/**
 * すべての公理スキーマID。
 */
export type AxiomId = PropositionalAxiomId | PredicateAxiomId | EqualityAxiomId;

// ── 公理スキーマのテンプレート ─────────────────────────────

// メタ変数ヘルパー（内部使用）
const phi = metaVariable("φ");
const psi = metaVariable("ψ");
const chi = metaVariable("χ");
const xVar = termVariable("x");
const yVar = termVariable("y");
const zVar = termVariable("z");

/**
 * A1: K公理 φ → (ψ → φ)
 */
export const axiomA1Template: Formula = implication(phi, implication(psi, phi));

/**
 * A2: S公理 (φ → (ψ → χ)) → ((φ → ψ) → (φ → χ))
 */
export const axiomA2Template: Formula = implication(
  implication(phi, implication(psi, chi)),
  implication(implication(phi, psi), implication(phi, chi)),
);

/**
 * A3: 対偶公理 (¬φ → ¬ψ) → (ψ → φ)
 * Łukasiewicz体系で使用
 */
export const axiomA3Template: Formula = implication(
  implication(negation(phi), negation(psi)),
  implication(psi, phi),
);

/**
 * M3: 背理法 (¬φ → ¬ψ) → ((¬φ → ψ) → φ)
 * Mendelson体系で使用
 * @see dev/logic-reference/07-axiom-systems-survey.md §3.2
 */
export const axiomM3Template: Formula = implication(
  implication(negation(phi), negation(psi)),
  implication(implication(negation(phi), psi), phi),
);

/**
 * E1: 反射律 ∀x. x = x
 */
export const axiomE1Template: Formula = universal(xVar, equality(xVar, xVar));

/**
 * E2: 対称律 ∀x.∀y. x = y → y = x
 */
export const axiomE2Template: Formula = universal(
  xVar,
  universal(yVar, implication(equality(xVar, yVar), equality(yVar, xVar))),
);

/**
 * E3: 推移律 ∀x.∀y.∀z. x = y → (y = z → x = z)
 */
export const axiomE3Template: Formula = universal(
  xVar,
  universal(
    yVar,
    universal(
      zVar,
      implication(
        equality(xVar, yVar),
        implication(equality(yVar, zVar), equality(xVar, zVar)),
      ),
    ),
  ),
);

// E4, E5 はシグネチャ依存（関数記号・述語記号ごとに生成）のため、テンプレートではなく
// 検証関数内で動的に処理する。

// ── 体系設定 ──────────────────────────────────────────────

/**
 * 論理体系の設定。
 *
 * どの公理・推論規則を有効にするかを指定する。
 * 段階的実装: Phase 1 Łukasiewicz → Phase 2 他の体系追加
 */
export type LogicSystem = {
  /** 体系名 */
  readonly name: string;
  /** 有効な命題論理公理 */
  readonly propositionalAxioms: ReadonlySet<PropositionalAxiomId>;
  /** 述語論理公理の有効/無効 */
  readonly predicateLogic: boolean;
  /** 等号付き論理の有効/無効 */
  readonly equalityLogic: boolean;
  /** 汎化規則（Gen）の有効/無効 */
  readonly generalization: boolean;
};

/**
 * 最小論理（Minimal Logic / HM）: A1, A2 + MP
 * 否定に関する公理を含まない。含意のみで閉じた体系。
 * 直観主義論理・古典論理の共通部分。
 * @see dev/logic-reference/07-axiom-systems-survey.md
 */
export const minimalLogicSystem: LogicSystem = {
  name: "Minimal Logic",
  propositionalAxioms: new Set(["A1", "A2"]),
  predicateLogic: false,
  equalityLogic: false,
  generalization: false,
};

/**
 * Łukasiewicz体系（デフォルト）: A1, A2, A3 + MP
 */
export const lukasiewiczSystem: LogicSystem = {
  name: "Łukasiewicz",
  propositionalAxioms: new Set(["A1", "A2", "A3"]),
  predicateLogic: false,
  equalityLogic: false,
  generalization: false,
};

/**
 * Mendelson体系: A1, A2, M3 + MP
 * A1, A2 はŁukasiewiczと共通。M3（背理法）はA3（対偶）の代替。
 * 古典命題論理として等価だが、公理の形が異なる。
 * @see dev/logic-reference/07-axiom-systems-survey.md §3.2
 */
export const mendelsonSystem: LogicSystem = {
  name: "Mendelson",
  propositionalAxioms: new Set(["A1", "A2", "M3"]),
  predicateLogic: false,
  equalityLogic: false,
  generalization: false,
};

/**
 * 述語論理体系（Łukasiewicz基盤）: A1-A5 + MP + Gen
 */
export const predicateLogicSystem: LogicSystem = {
  name: "Predicate Logic",
  propositionalAxioms: new Set(["A1", "A2", "A3"]),
  predicateLogic: true,
  equalityLogic: false,
  generalization: true,
};

/**
 * 等号付き述語論理体系: A1-A5 + E1-E5 + MP + Gen
 */
export const equalityLogicSystem: LogicSystem = {
  name: "Predicate Logic with Equality",
  propositionalAxioms: new Set(["A1", "A2", "A3"]),
  predicateLogic: true,
  equalityLogic: true,
  generalization: true,
};

// ── 推論規則の適用結果 ───────────────────────────────────

/**
 * 規則適用エラーの種類。
 */
export type RuleApplicationError =
  | { readonly _tag: "NotAnImplication"; readonly formula: Formula }
  | {
      readonly _tag: "PremiseMismatch";
      readonly expected: Formula;
      readonly actual: Formula;
    }
  | {
      readonly _tag: "NotAnAxiomInstance";
      readonly axiomId: AxiomId;
      readonly formula: Formula;
    }
  | { readonly _tag: "AxiomNotEnabled"; readonly axiomId: AxiomId }
  | { readonly _tag: "GeneralizationNotEnabled" }
  | {
      readonly _tag: "SubstitutionNotFreeFor";
      readonly variable: string;
      readonly formula: Formula;
    }
  | { readonly _tag: "VariableNotFreeInPremise"; readonly variable: string }
  | { readonly _tag: "EqualityNotEnabled" }
  | { readonly _tag: "NotAUniversal"; readonly formula: Formula }
  | {
      readonly _tag: "A5VariableFreeInAntecedent";
      readonly variable: string;
      readonly antecedent: Formula;
    };

/**
 * 規則適用の結果型。
 */
export type RuleApplicationResult =
  | { readonly _tag: "Ok"; readonly conclusion: Formula }
  | { readonly _tag: "Error"; readonly error: RuleApplicationError };

const ok = (conclusion: Formula): RuleApplicationResult => ({
  _tag: "Ok",
  conclusion,
});

const err = (error: RuleApplicationError): RuleApplicationResult => ({
  _tag: "Error",
  error,
});

// ── Modus Ponens ──────────────────────────────────────────

/**
 * Modus Ponens: φ と φ→ψ から ψ を導出。
 *
 * @param antecedent 前提 φ
 * @param conditional 条件 φ→ψ
 * @returns 結論 ψ、または不一致エラー
 */
export const applyModusPonens = (
  antecedent: Formula,
  conditional: Formula,
): RuleApplicationResult => {
  if (conditional._tag !== "Implication") {
    return err({ _tag: "NotAnImplication", formula: conditional });
  }
  if (!equalFormula(antecedent, conditional.left)) {
    return err({
      _tag: "PremiseMismatch",
      expected: conditional.left,
      actual: antecedent,
    });
  }
  return ok(conditional.right);
};

// ── 汎化規則 (Generalization) ─────────────────────────────

/**
 * 汎化規則（Gen）: φ から ∀x.φ を導出。
 *
 * @param formula 前提 φ
 * @param variable 量化する項変数 x
 * @param system 論理体系設定
 * @returns 結論 ∀x.φ、または無効エラー
 */
export const applyGeneralization = (
  formula: Formula,
  variable: TermVariable,
  system: LogicSystem,
): RuleApplicationResult => {
  if (!system.generalization) {
    return err({ _tag: "GeneralizationNotEnabled" });
  }
  return ok(universal(variable, formula));
};

// ── 一方向パターンマッチング ──────────────────────────────

/**
 * テンプレート（パターン）と候補式の一方向マッチング。
 *
 * テンプレート中の MetaVariable / TermMetaVariable のみがパターン変数。
 * 候補式は完全に具体的な値として扱われる（候補中のMetaVariableはパターン変数ではない）。
 *
 * 成功時: テンプレートのパターン変数 → 候補式の部分式 へのマッピングを返す。
 * 失敗時: undefined を返す。
 */
export const matchFormulaPattern = (
  template: Formula,
  candidate: Formula,
):
  | {
      readonly formulaSub: Map<string, Formula>;
      readonly termSub: Map<string, Term>;
    }
  | undefined => {
  const formulaSub = new Map<string, Formula>();
  const termSub = new Map<string, Term>();

  const matchFormula = (t: Formula, c: Formula): boolean => {
    // テンプレート側がMetaVariableなら、パターン変数として扱う
    if (t._tag === "MetaVariable") {
      const key = metaVariableKey(t);
      const existing = formulaSub.get(key);
      if (existing !== undefined) {
        return equalFormula(existing, c);
      }
      formulaSub.set(key, c);
      return true;
    }

    // テンプレート側が非MetaVariable → 候補も同じ構造であること
    if (t._tag !== c._tag) return false;

    switch (t._tag) {
      case "Negation":
        return matchFormula(t.formula, (c as typeof t).formula);
      case "Implication":
      case "Conjunction":
      case "Disjunction":
      case "Biconditional": {
        const cBin = c as typeof t;
        return (
          matchFormula(t.left, cBin.left) && matchFormula(t.right, cBin.right)
        );
      }
      case "Universal":
      case "Existential": {
        const cQuant = c as typeof t;
        return (
          matchTerm(t.variable, cQuant.variable) &&
          matchFormula(t.formula, cQuant.formula)
        );
      }
      case "Predicate": {
        const cPred = c as typeof t;
        if (t.name !== cPred.name || t.args.length !== cPred.args.length)
          return false;
        return t.args.every((arg, i) => matchTerm(arg, cPred.args[i]));
      }
      case "Equality": {
        const cEq = c as typeof t;
        return matchTerm(t.left, cEq.left) && matchTerm(t.right, cEq.right);
      }
    }
    /* v8 ignore start */
    t satisfies never;
    return false;
    /* v8 ignore stop */
  };

  const matchTerm = (t: Term, c: Term): boolean => {
    // テンプレート側がTermMetaVariableなら、パターン変数
    if (t._tag === "TermMetaVariable") {
      const key = termMetaVariableKey(t);
      const existing = termSub.get(key);
      if (existing !== undefined) {
        return equalTerm(existing, c);
      }
      termSub.set(key, c);
      return true;
    }

    if (t._tag !== c._tag) return false;

    switch (t._tag) {
      case "TermVariable":
        return t.name === (c as typeof t).name;
      case "Constant":
        return t.name === (c as typeof t).name;
      case "FunctionApplication": {
        const cFunc = c as typeof t;
        if (t.name !== cFunc.name || t.args.length !== cFunc.args.length)
          return false;
        return t.args.every((arg, i) => matchTerm(arg, cFunc.args[i]));
      }
      case "BinaryOperation": {
        const cBin = c as typeof t;
        if (t.operator !== cBin.operator) return false;
        return matchTerm(t.left, cBin.left) && matchTerm(t.right, cBin.right);
      }
    }
    /* v8 ignore start */
    t satisfies never;
    return false;
    /* v8 ignore stop */
  };

  if (matchFormula(template, candidate)) {
    return { formulaSub, termSub };
  }
  return undefined;
};

// ── 公理スキーマの検証 ───────────────────────────────────

/**
 * 論理式が指定された公理スキーマのインスタンスかどうかを判定する。
 *
 * 一方向パターンマッチングを使ってテンプレートの MetaVariable を候補式にバインドする。
 * マッチした場合、使用された代入を返す。
 */
export type AxiomMatchResult =
  | {
      readonly _tag: "Ok";
      readonly formulaSubstitution: FormulaSubstitutionMap;
      readonly termSubstitution: TermMetaSubstitutionMap;
    }
  | { readonly _tag: "Error"; readonly error: RuleApplicationError };

const axiomMatchOk = (
  formulaSubstitution: FormulaSubstitutionMap,
  termSubstitution: TermMetaSubstitutionMap,
): AxiomMatchResult => ({
  _tag: "Ok",
  formulaSubstitution,
  termSubstitution,
});

const axiomMatchErr = (error: RuleApplicationError): AxiomMatchResult => ({
  _tag: "Error",
  error,
});

/**
 * 命題論理公理 (A1, A2, A3, M3) のインスタンスか判定。
 */
export const matchPropositionalAxiom = (
  axiomId: PropositionalAxiomId,
  formula: Formula,
): AxiomMatchResult => {
  const template = getPropositionalAxiomTemplate(axiomId);
  const result = matchFormulaPattern(template, formula);
  if (result === undefined) {
    return axiomMatchErr({ _tag: "NotAnAxiomInstance", axiomId, formula });
  }
  return axiomMatchOk(result.formulaSub, result.termSub);
};

const getPropositionalAxiomTemplate = (
  axiomId: PropositionalAxiomId,
): Formula => {
  switch (axiomId) {
    case "A1":
      return axiomA1Template;
    case "A2":
      return axiomA2Template;
    case "A3":
      return axiomA3Template;
    case "M3":
      return axiomM3Template;
  }
  /* v8 ignore start */
  axiomId satisfies never;
  return axiomA1Template;
  /* v8 ignore stop */
};

/**
 * A4のインスタンスか判定: ∀x.φ → φ[t/x]
 *
 * 論理式が ∀x.φ → ψ の形であり、ψ = φ[t/x] となる t が存在するかチェック。
 * A4は項代入を含むため、パターンマッチだけでは判定できず、専用ロジックが必要。
 */
export const matchAxiomA4 = (formula: Formula): AxiomMatchResult => {
  // A4: ∀x.φ → φ[t/x] の形をチェック
  if (formula._tag !== "Implication") {
    return axiomMatchErr({
      _tag: "NotAnAxiomInstance",
      axiomId: "A4",
      formula,
    });
  }
  if (formula.left._tag !== "Universal") {
    return axiomMatchErr({
      _tag: "NotAnAxiomInstance",
      axiomId: "A4",
      formula,
    });
  }

  const boundVar = formula.left.variable;
  const body = formula.left.formula;
  const conclusion = formula.right;

  // body 中で x の自由出現がない場合は body = conclusion であるべき
  const freeVars = freeVariablesInFormula(body);
  if (!freeVars.has(boundVar.name)) {
    if (equalFormula(body, conclusion)) {
      return axiomMatchOk(new Map(), new Map());
    }
    return axiomMatchErr({
      _tag: "NotAnAxiomInstance",
      axiomId: "A4",
      formula,
    });
  }

  // body と conclusion を走査して t（boundVarへの代入先）を推論
  const replacementTerm = inferTermReplacement(body, conclusion, boundVar);
  if (replacementTerm === undefined) {
    return axiomMatchErr({
      _tag: "NotAnAxiomInstance",
      axiomId: "A4",
      formula,
    });
  }

  // t が φ 中の x に対して自由に代入可能かチェック
  if (!isFreeFor(replacementTerm, boundVar, body)) {
    return axiomMatchErr({
      _tag: "SubstitutionNotFreeFor",
      variable: boundVar.name,
      formula: body,
    });
  }

  // 実際に代入して一致するか最終確認
  const substituted = substituteTermVariableInFormula(
    body,
    boundVar,
    replacementTerm,
  );
  // 防御的チェック: inferTermReplacement が正しく動作していれば到達しない
  /* v8 ignore start */
  if (!equalFormula(substituted, conclusion)) {
    return axiomMatchErr({
      _tag: "NotAnAxiomInstance",
      axiomId: "A4",
      formula,
    });
  }
  /* v8 ignore stop */

  return axiomMatchOk(new Map(), new Map());
};

/**
 * A5のインスタンスか判定: ∀x.(φ→ψ) → (φ → ∀x.ψ)
 * 制約: x ∉ FV(φ)
 */
export const matchAxiomA5 = (formula: Formula): AxiomMatchResult => {
  if (formula._tag !== "Implication") {
    return axiomMatchErr({
      _tag: "NotAnAxiomInstance",
      axiomId: "A5",
      formula,
    });
  }
  if (formula.left._tag !== "Universal") {
    return axiomMatchErr({
      _tag: "NotAnAxiomInstance",
      axiomId: "A5",
      formula,
    });
  }

  const xv = formula.left.variable;
  const innerBody = formula.left.formula;

  if (innerBody._tag !== "Implication") {
    return axiomMatchErr({
      _tag: "NotAnAxiomInstance",
      axiomId: "A5",
      formula,
    });
  }

  const antecedent = innerBody.left;
  const consequent = innerBody.right;

  if (formula.right._tag !== "Implication") {
    return axiomMatchErr({
      _tag: "NotAnAxiomInstance",
      axiomId: "A5",
      formula,
    });
  }

  const rightAntecedent = formula.right.left;
  const rightConsequent = formula.right.right;

  if (!equalFormula(antecedent, rightAntecedent)) {
    return axiomMatchErr({
      _tag: "NotAnAxiomInstance",
      axiomId: "A5",
      formula,
    });
  }

  if (rightConsequent._tag !== "Universal") {
    return axiomMatchErr({
      _tag: "NotAnAxiomInstance",
      axiomId: "A5",
      formula,
    });
  }

  if (!equalTerm(xv, rightConsequent.variable)) {
    return axiomMatchErr({
      _tag: "NotAnAxiomInstance",
      axiomId: "A5",
      formula,
    });
  }

  if (!equalFormula(consequent, rightConsequent.formula)) {
    return axiomMatchErr({
      _tag: "NotAnAxiomInstance",
      axiomId: "A5",
      formula,
    });
  }

  // 制約: x ∉ FV(φ)
  if (freeVariablesInFormula(antecedent).has(xv.name)) {
    return axiomMatchErr({
      _tag: "A5VariableFreeInAntecedent",
      variable: xv.name,
      antecedent,
    });
  }

  return axiomMatchOk(new Map(), new Map());
};

/**
 * 等号公理 (E1, E2, E3) のインスタンスか判定。
 * 一方向パターンマッチングを使用。
 * E4, E5 はシグネチャ依存のため将来的に別途実装。
 */
export const matchEqualityAxiom = (
  axiomId: "E1" | "E2" | "E3",
  formula: Formula,
): AxiomMatchResult => {
  const template = getEqualityAxiomTemplate(axiomId);
  const result = matchFormulaPattern(template, formula);
  if (result === undefined) {
    return axiomMatchErr({ _tag: "NotAnAxiomInstance", axiomId, formula });
  }
  return axiomMatchOk(result.formulaSub, result.termSub);
};

const getEqualityAxiomTemplate = (axiomId: "E1" | "E2" | "E3"): Formula => {
  switch (axiomId) {
    case "E1":
      return axiomE1Template;
    case "E2":
      return axiomE2Template;
    case "E3":
      return axiomE3Template;
  }
  /* v8 ignore start */
  axiomId satisfies never;
  return axiomE1Template;
  /* v8 ignore stop */
};

// ── 代入の適用 ────────────────────────────────────────────

/**
 * メタ変数代入を適用して結果を返す。
 *
 * @param schema 元のスキーマ
 * @param formulaSubst 論理式メタ変数代入
 * @param termSubst 項メタ変数代入
 * @returns 代入結果の論理式
 */
export const applySubstitution = (
  schema: Formula,
  formulaSubst: FormulaSubstitutionMap,
  termSubst: TermMetaSubstitutionMap,
): Formula => {
  const afterFormula = substituteFormulaMetaVariables(schema, formulaSubst);
  return substituteTermMetaVariablesInFormula(afterFormula, termSubst);
};

// ── 総合的な公理インスタンス判定 ─────────────────────────

/**
 * 論理式がシステムで有効な公理のいずれかのインスタンスかを判定する。
 *
 * マッチした場合、公理IDと代入を返す。
 */
export type AxiomIdentificationResult =
  | {
      readonly _tag: "Ok";
      readonly axiomId: AxiomId;
      readonly formulaSubstitution: FormulaSubstitutionMap;
      readonly termSubstitution: TermMetaSubstitutionMap;
    }
  | { readonly _tag: "Error" };

export const identifyAxiom = (
  formula: Formula,
  system: LogicSystem,
): AxiomIdentificationResult => {
  const propAxiomIds: readonly PropositionalAxiomId[] = [
    "A1",
    "A2",
    "A3",
    "M3",
  ];
  for (const axiomId of propAxiomIds) {
    if (system.propositionalAxioms.has(axiomId)) {
      const result = matchPropositionalAxiom(axiomId, formula);
      if (result._tag === "Ok") {
        return {
          _tag: "Ok",
          axiomId,
          formulaSubstitution: result.formulaSubstitution,
          termSubstitution: result.termSubstitution,
        };
      }
    }
  }

  if (system.predicateLogic) {
    const a4Result = matchAxiomA4(formula);
    if (a4Result._tag === "Ok") {
      return {
        _tag: "Ok",
        axiomId: "A4",
        formulaSubstitution: a4Result.formulaSubstitution,
        termSubstitution: a4Result.termSubstitution,
      };
    }

    const a5Result = matchAxiomA5(formula);
    if (a5Result._tag === "Ok") {
      return {
        _tag: "Ok",
        axiomId: "A5",
        formulaSubstitution: a5Result.formulaSubstitution,
        termSubstitution: a5Result.termSubstitution,
      };
    }
  }

  if (system.equalityLogic) {
    const eqAxiomIds: readonly ("E1" | "E2" | "E3")[] = ["E1", "E2", "E3"];
    for (const axiomId of eqAxiomIds) {
      const result = matchEqualityAxiom(axiomId, formula);
      if (result._tag === "Ok") {
        return {
          _tag: "Ok",
          axiomId,
          formulaSubstitution: result.formulaSubstitution,
          termSubstitution: result.termSubstitution,
        };
      }
    }
  }

  return { _tag: "Error" };
};

// ── ヘルパー: 項変数代入の推論 ─────────────────────────────

/**
 * body[t/variable] = target となる t を推論する。
 *
 * body と target を比較し、variable の出現位置で target が持つ項を抽出する。
 * すべての出現位置で同じ項が得られれば、その項を返す。
 */
const inferTermReplacement = (
  body: Formula,
  target: Formula,
  variable: TermVariable,
): Term | undefined => {
  let found: Term | undefined;

  const checkConsistent = (t: Term): boolean => {
    if (found === undefined) {
      found = t;
      return true;
    }
    return equalTerm(found, t);
  };

  const matchFormula = (b: Formula, t: Formula): boolean => {
    if (b._tag !== t._tag) return false;
    switch (b._tag) {
      case "MetaVariable":
        return (
          b.name === (t as typeof b).name &&
          b.subscript === (t as typeof b).subscript
        );
      case "Negation":
        return matchFormula(b.formula, (t as typeof b).formula);
      case "Implication":
      case "Conjunction":
      case "Disjunction":
      case "Biconditional": {
        const tBin = t as typeof b;
        return (
          matchFormula(b.left, tBin.left) && matchFormula(b.right, tBin.right)
        );
      }
      case "Universal":
      case "Existential": {
        const tQuant = t as typeof b;
        if (!equalTerm(b.variable, tQuant.variable)) return false;
        // 束縛変数がvariableと同じ場合、このスコープ内ではvariableは束縛されている
        if (b.variable.name === variable.name) {
          return equalFormula(b.formula, tQuant.formula);
        }
        return matchFormula(b.formula, tQuant.formula);
      }
      case "Predicate": {
        const tPred = t as typeof b;
        if (b.name !== tPred.name) return false;
        if (b.args.length !== tPred.args.length) return false;
        return b.args.every((arg, i) => matchTerm(arg, tPred.args[i]));
      }
      case "Equality": {
        const tEq = t as typeof b;
        return matchTerm(b.left, tEq.left) && matchTerm(b.right, tEq.right);
      }
    }
    /* v8 ignore start */
    b satisfies never;
    return false;
    /* v8 ignore stop */
  };

  const matchTerm = (b: Term, t: Term): boolean => {
    switch (b._tag) {
      case "TermVariable":
        if (b.name === variable.name) {
          return checkConsistent(t);
        }
        return b._tag === t._tag && b.name === (t as typeof b).name;
      case "TermMetaVariable":
        return (
          b._tag === t._tag &&
          b.name === (t as typeof b).name &&
          b.subscript === (t as typeof b).subscript
        );
      case "Constant":
        return b._tag === t._tag && b.name === (t as typeof b).name;
      case "FunctionApplication": {
        if (t._tag !== "FunctionApplication") return false;
        if (b.name !== t.name) return false;
        if (b.args.length !== t.args.length) return false;
        return b.args.every((arg, i) => matchTerm(arg, t.args[i]));
      }
      case "BinaryOperation": {
        if (t._tag !== "BinaryOperation") return false;
        if (b.operator !== t.operator) return false;
        return matchTerm(b.left, t.left) && matchTerm(b.right, t.right);
      }
    }
    /* v8 ignore start */
    b satisfies never;
    return false;
    /* v8 ignore stop */
  };

  if (matchFormula(body, target)) {
    // 防御的フォールバック: matchAxiomA4 が事前に freeVariablesInFormula で
    // 変数の自由出現を確認しているため、matchFormula が成功すれば found は常にセットされる
    /* v8 ignore next */
    return found ?? variable;
  }
  return undefined;
};

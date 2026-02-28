import type { Formula } from "./formula";
import {
  Conjunction,
  Disjunction,
  Universal,
  Existential,
  conjunction,
  disjunction,
  negation,
  universal,
  existential,
} from "./formula";
import { TermVariable } from "./term";
import {
  freeVariablesInFormula,
  allVariableNamesInFormula,
} from "./freeVariables";
import { substituteTermVariableInFormula } from "./substitution";

// ── 否定標準形 (NNF: Negation Normal Form) ──────────────

/**
 * 命題論理式を否定標準形 (NNF) に変換する。
 *
 * NNF では:
 * - `→` と `↔` が除去される
 * - `¬` は原子命題（MetaVariable）の直前にのみ現れる
 * - 使われる結合子は `¬`, `∧`, `∨` のみ
 *
 * 命題論理のノード（MetaVariable, Negation, Implication, Conjunction, Disjunction, Biconditional）
 * のみ対象。量化子・述語・等号・FormulaSubstitution が含まれている場合はエラー。
 *
 * @throws 命題論理以外のノードが含まれている場合
 */
export const toNNF = (formula: Formula): Formula => {
  switch (formula._tag) {
    case "MetaVariable":
      return formula;
    case "Negation":
      return pushNegation(formula.formula);
    case "Implication":
      // A → B  ≡  ¬A ∨ B
      return toNNF(disjunction(negation(formula.left), formula.right));
    case "Conjunction":
      return conjunction(toNNF(formula.left), toNNF(formula.right));
    case "Disjunction":
      return disjunction(toNNF(formula.left), toNNF(formula.right));
    case "Biconditional":
      // A ↔ B  ≡  (A ∧ B) ∨ (¬A ∧ ¬B)
      return toNNF(
        disjunction(
          conjunction(formula.left, formula.right),
          conjunction(negation(formula.left), negation(formula.right)),
        ),
      );
    case "Universal":
    case "Existential":
    case "Predicate":
    case "Equality":
    case "FormulaSubstitution":
      throw new Error(
        `Cannot convert non-propositional formula node to NNF: ${formula._tag satisfies string}. Only propositional logic formulas are supported.`,
      );
  }
  /* v8 ignore start */
  formula satisfies never;
  throw new Error("Unreachable");
  /* v8 ignore stop */
};

/**
 * ¬φ の φ を受け取り、¬φ の NNF を返す。
 * De Morgan 則と二重否定除去を適用する。
 */
const pushNegation = (formula: Formula): Formula => {
  switch (formula._tag) {
    case "MetaVariable":
      // ¬p はそのまま（原子命題の否定は NNF で許容）
      return negation(formula);
    case "Negation":
      // ¬¬A  ≡  A
      return toNNF(formula.formula);
    case "Implication":
      // ¬(A → B)  ≡  ¬(¬A ∨ B)  ≡  A ∧ ¬B
      return conjunction(toNNF(formula.left), pushNegation(formula.right));
    case "Conjunction":
      // ¬(A ∧ B)  ≡  ¬A ∨ ¬B  (De Morgan)
      return disjunction(
        pushNegation(formula.left),
        pushNegation(formula.right),
      );
    case "Disjunction":
      // ¬(A ∨ B)  ≡  ¬A ∧ ¬B  (De Morgan)
      return conjunction(
        pushNegation(formula.left),
        pushNegation(formula.right),
      );
    case "Biconditional":
      // ¬(A ↔ B)  ≡  (A ∧ ¬B) ∨ (¬A ∧ B)
      return toNNF(
        disjunction(
          conjunction(formula.left, negation(formula.right)),
          conjunction(negation(formula.left), formula.right),
        ),
      );
    case "Universal":
    case "Existential":
    case "Predicate":
    case "Equality":
    case "FormulaSubstitution":
      throw new Error(
        `Cannot convert non-propositional formula node to NNF: ${formula._tag satisfies string}. Only propositional logic formulas are supported.`,
      );
  }
  /* v8 ignore start */
  formula satisfies never;
  throw new Error("Unreachable");
  /* v8 ignore stop */
};

// ── 連言標準形 (CNF: Conjunctive Normal Form) ──────────

/**
 * 命題論理式を連言標準形 (CNF) に変換する。
 *
 * CNF では論理式は節（clause）の連言:
 *   (L₁ ∨ L₂ ∨ ...) ∧ (L₃ ∨ L₄ ∨ ...) ∧ ...
 * 各リテラルは原子命題またはその否定。
 *
 * まず NNF に変換した後、∨ を ∧ の上に分配する。
 *
 * @throws 命題論理以外のノードが含まれている場合
 */
export const toCNF = (formula: Formula): Formula => {
  const nnf = toNNF(formula);
  return distributeCNF(nnf);
};

/**
 * NNF の論理式に対し、∨ を ∧ の上に分配して CNF を得る。
 * A ∨ (B ∧ C) → (A ∨ B) ∧ (A ∨ C)
 */
const distributeCNF = (formula: Formula): Formula => {
  switch (formula._tag) {
    case "MetaVariable":
    case "Negation":
      // リテラル（NNF なので ¬MetaVariable のみ）
      return formula;
    case "Conjunction":
      return conjunction(
        distributeCNF(formula.left),
        distributeCNF(formula.right),
      );
    case "Disjunction":
      return distributeOrOverAnd(
        distributeCNF(formula.left),
        distributeCNF(formula.right),
      );
    /* v8 ignore start */
    // NNF 変換後は →, ↔ は出現しない（防御的エラー）
    case "Implication":
    case "Biconditional":
    case "Universal":
    case "Existential":
    case "Predicate":
    case "Equality":
    case "FormulaSubstitution":
      throw new Error(
        `Unexpected formula node in CNF distribution: ${formula._tag satisfies string}. Input must be in NNF.`,
      );
  }
  formula satisfies never;
  throw new Error("Unreachable");
  /* v8 ignore stop */
};

/**
 * A ∨ B を受け取り、B（or A）に ∧ が含まれていれば分配する。
 * A ∨ (B₁ ∧ B₂) → (A ∨ B₁) ∧ (A ∨ B₂)
 * (A₁ ∧ A₂) ∨ B → (A₁ ∨ B) ∧ (A₂ ∨ B)
 */
const distributeOrOverAnd = (left: Formula, right: Formula): Formula => {
  if (right instanceof Conjunction) {
    return conjunction(
      distributeOrOverAnd(left, right.left),
      distributeOrOverAnd(left, right.right),
    );
  }
  if (left instanceof Conjunction) {
    return conjunction(
      distributeOrOverAnd(left.left, right),
      distributeOrOverAnd(left.right, right),
    );
  }
  return disjunction(left, right);
};

// ── 選言標準形 (DNF: Disjunctive Normal Form) ──────────

/**
 * 命題論理式を選言標準形 (DNF) に変換する。
 *
 * DNF では論理式は項（term）の選言:
 *   (L₁ ∧ L₂ ∧ ...) ∨ (L₃ ∧ L₄ ∧ ...) ∨ ...
 * 各リテラルは原子命題またはその否定。
 *
 * まず NNF に変換した後、∧ を ∨ の上に分配する。
 *
 * @throws 命題論理以外のノードが含まれている場合
 */
export const toDNF = (formula: Formula): Formula => {
  const nnf = toNNF(formula);
  return distributeDNF(nnf);
};

/**
 * NNF の論理式に対し、∧ を ∨ の上に分配して DNF を得る。
 * A ∧ (B ∨ C) → (A ∧ B) ∨ (A ∧ C)
 */
const distributeDNF = (formula: Formula): Formula => {
  switch (formula._tag) {
    case "MetaVariable":
    case "Negation":
      // リテラル
      return formula;
    case "Disjunction":
      return disjunction(
        distributeDNF(formula.left),
        distributeDNF(formula.right),
      );
    case "Conjunction":
      return distributeAndOverOr(
        distributeDNF(formula.left),
        distributeDNF(formula.right),
      );
    /* v8 ignore start */
    // NNF 変換後は →, ↔ は出現しない（防御的エラー）
    case "Implication":
    case "Biconditional":
    case "Universal":
    case "Existential":
    case "Predicate":
    case "Equality":
    case "FormulaSubstitution":
      throw new Error(
        `Unexpected formula node in DNF distribution: ${formula._tag satisfies string}. Input must be in NNF.`,
      );
  }
  formula satisfies never;
  throw new Error("Unreachable");
  /* v8 ignore stop */
};

/**
 * A ∧ B を受け取り、B（or A）に ∨ が含まれていれば分配する。
 * A ∧ (B₁ ∨ B₂) → (A ∧ B₁) ∨ (A ∧ B₂)
 * (A₁ ∨ A₂) ∧ B → (A₁ ∧ B) ∨ (A₂ ∧ B)
 */
const distributeAndOverOr = (left: Formula, right: Formula): Formula => {
  if (right instanceof Disjunction) {
    return disjunction(
      distributeAndOverOr(left, right.left),
      distributeAndOverOr(left, right.right),
    );
  }
  if (left instanceof Disjunction) {
    return disjunction(
      distributeAndOverOr(left.left, right),
      distributeAndOverOr(left.right, right),
    );
  }
  return conjunction(left, right);
};

// ── NNF 判定関数 ────────────────────────────────────────

/**
 * 命題論理式が NNF (否定標準形) であるかを判定する。
 *
 * NNF の条件:
 * - →, ↔ が出現しない
 * - ¬ は原子命題（MetaVariable）の直前にのみ現れる
 *
 * @throws 命題論理以外のノードが含まれている場合
 */
export const isNNF = (formula: Formula): boolean => {
  switch (formula._tag) {
    case "MetaVariable":
      return true;
    case "Negation":
      // ¬ の直下は MetaVariable のみ許容
      return formula.formula._tag === "MetaVariable";
    case "Conjunction":
    case "Disjunction":
      return isNNF(formula.left) && isNNF(formula.right);
    case "Implication":
    case "Biconditional":
      // → と ↔ は NNF では許容されない
      return false;
    case "Universal":
    case "Existential":
    case "Predicate":
    case "Equality":
    case "FormulaSubstitution":
      throw new Error(
        `Cannot check NNF for non-propositional formula node: ${formula._tag satisfies string}. Only propositional logic formulas are supported.`,
      );
  }
  /* v8 ignore start */
  formula satisfies never;
  return false;
  /* v8 ignore stop */
};

// ── CNF 判定関数 ────────────────────────────────────────

/**
 * 命題論理式が CNF (連言標準形) であるかを判定する。
 *
 * CNF の条件:
 * - 最外層は連言（∧）の列
 * - 各節（clause）はリテラルの選言（∨）
 * - リテラルは原子命題または原子命題の否定
 *
 * @throws 命題論理以外のノードが含まれている場合
 */
export const isCNF = (formula: Formula): boolean => {
  return isCNFConjunction(formula);
};

/** CNF の最外層: ∧ の列またはクローズ */
const isCNFConjunction = (formula: Formula): boolean => {
  if (formula._tag === "Conjunction") {
    return isCNFConjunction(formula.left) && isCNFConjunction(formula.right);
  }
  return isCNFClause(formula);
};

/** CNF のクローズ: ∨ の列またはリテラル */
const isCNFClause = (formula: Formula): boolean => {
  if (formula._tag === "Disjunction") {
    return isCNFClause(formula.left) && isCNFClause(formula.right);
  }
  return isLiteral(formula);
};

// ── DNF 判定関数 ────────────────────────────────────────

/**
 * 命題論理式が DNF (選言標準形) であるかを判定する。
 *
 * DNF の条件:
 * - 最外層は選言（∨）の列
 * - 各項（term）はリテラルの連言（∧）
 * - リテラルは原子命題または原子命題の否定
 *
 * @throws 命題論理以外のノードが含まれている場合
 */
export const isDNF = (formula: Formula): boolean => {
  return isDNFDisjunction(formula);
};

/** DNF の最外層: ∨ の列または連言項 */
const isDNFDisjunction = (formula: Formula): boolean => {
  if (formula._tag === "Disjunction") {
    return isDNFDisjunction(formula.left) && isDNFDisjunction(formula.right);
  }
  return isDNFTerm(formula);
};

/** DNF の連言項: ∧ の列またはリテラル */
const isDNFTerm = (formula: Formula): boolean => {
  if (formula._tag === "Conjunction") {
    return isDNFTerm(formula.left) && isDNFTerm(formula.right);
  }
  return isLiteral(formula);
};

// ── 共通ヘルパー ────────────────────────────────────────

/** リテラルかどうか: 原子命題または原子命題の否定 */
const isLiteral = (formula: Formula): boolean => {
  if (formula._tag === "MetaVariable") return true;
  if (formula._tag === "Negation" && formula.formula._tag === "MetaVariable")
    return true;
  return false;
};

// ── 述語論理の否定標準形 (Predicate NNF) ────────────────

/**
 * 述語論理式を否定標準形 (NNF) に変換する。
 *
 * 命題論理の NNF に加え、量化子の扱いを含む:
 * - `¬∀x.φ ≡ ∃x.¬φ`
 * - `¬∃x.φ ≡ ∀x.¬φ`
 * - `→` と `↔` が除去される
 * - `¬` は原子命題（MetaVariable）、述語（Predicate）、等号（Equality）の直前にのみ現れる
 *
 * FormulaSubstitution が含まれている場合はエラー。
 */
export const toPredicateNNF = (formula: Formula): Formula => {
  switch (formula._tag) {
    case "MetaVariable":
    case "Predicate":
    case "Equality":
      return formula;
    case "Negation":
      return pushPredicateNegation(formula.formula);
    case "Implication":
      // A → B  ≡  ¬A ∨ B
      return toPredicateNNF(
        disjunction(negation(formula.left), formula.right),
      );
    case "Conjunction":
      return conjunction(
        toPredicateNNF(formula.left),
        toPredicateNNF(formula.right),
      );
    case "Disjunction":
      return disjunction(
        toPredicateNNF(formula.left),
        toPredicateNNF(formula.right),
      );
    case "Biconditional":
      // A ↔ B  ≡  (A ∧ B) ∨ (¬A ∧ ¬B)
      return toPredicateNNF(
        disjunction(
          conjunction(formula.left, formula.right),
          conjunction(negation(formula.left), negation(formula.right)),
        ),
      );
    case "Universal":
      return universal(formula.variable, toPredicateNNF(formula.formula));
    case "Existential":
      return existential(formula.variable, toPredicateNNF(formula.formula));
    case "FormulaSubstitution":
      throw new Error(
        `Cannot convert FormulaSubstitution node to predicate NNF: ${formula._tag satisfies string}. Resolve substitutions first.`,
      );
  }
  /* v8 ignore start */
  formula satisfies never;
  throw new Error("Unreachable");
  /* v8 ignore stop */
};

/**
 * ¬φ の φ を受け取り、¬φ の述語論理 NNF を返す。
 * De Morgan 則、二重否定除去、量化子の否定を適用する。
 */
const pushPredicateNegation = (formula: Formula): Formula => {
  switch (formula._tag) {
    case "MetaVariable":
    case "Predicate":
    case "Equality":
      // ¬p, ¬P(...), ¬(t=s) はそのまま
      return negation(formula);
    case "Negation":
      // ¬¬A ≡ A
      return toPredicateNNF(formula.formula);
    case "Implication":
      // ¬(A → B) ≡ A ∧ ¬B
      return conjunction(
        toPredicateNNF(formula.left),
        pushPredicateNegation(formula.right),
      );
    case "Conjunction":
      // ¬(A ∧ B) ≡ ¬A ∨ ¬B (De Morgan)
      return disjunction(
        pushPredicateNegation(formula.left),
        pushPredicateNegation(formula.right),
      );
    case "Disjunction":
      // ¬(A ∨ B) ≡ ¬A ∧ ¬B (De Morgan)
      return conjunction(
        pushPredicateNegation(formula.left),
        pushPredicateNegation(formula.right),
      );
    case "Biconditional":
      // ¬(A ↔ B) ≡ (A ∧ ¬B) ∨ (¬A ∧ B)
      return toPredicateNNF(
        disjunction(
          conjunction(formula.left, negation(formula.right)),
          conjunction(negation(formula.left), formula.right),
        ),
      );
    case "Universal":
      // ¬∀x.φ ≡ ∃x.¬φ
      return existential(
        formula.variable,
        pushPredicateNegation(formula.formula),
      );
    case "Existential":
      // ¬∃x.φ ≡ ∀x.¬φ
      return universal(
        formula.variable,
        pushPredicateNegation(formula.formula),
      );
    case "FormulaSubstitution":
      throw new Error(
        `Cannot convert FormulaSubstitution node to predicate NNF: ${formula._tag satisfies string}. Resolve substitutions first.`,
      );
  }
  /* v8 ignore start */
  formula satisfies never;
  throw new Error("Unreachable");
  /* v8 ignore stop */
};

// ── 冠頭標準形 (PNF: Prenex Normal Form) ────────────────

/**
 * 述語論理式を冠頭標準形 (PNF: Prenex Normal Form) に変換する。
 *
 * PNF では量化子がすべて式の先頭に集まる:
 *   Q₁x₁.Q₂x₂....Qₙxₙ.φ  (φ は量化子を含まない)
 *
 * 手順:
 * 1. 述語論理の NNF に変換（→, ↔ 除去、¬ を内側に押し込み）
 * 2. 量化子を外側に持ち上げる（必要に応じてα変換）
 *
 * FormulaSubstitution が含まれている場合はエラー。
 */
export const toPNF = (formula: Formula): Formula => {
  const nnf = toPredicateNNF(formula);
  return pullQuantifiers(nnf);
};

/**
 * NNF の述語論理式から量化子を外側に持ち上げる。
 *
 * - ∀x.φ, ∃x.φ: 本体を再帰的に処理
 * - φ ∧ ψ, φ ∨ ψ: 両辺を処理した後、量化子を持ち上げる
 * - 原子式・否定原子式: そのまま
 */
const pullQuantifiers = (formula: Formula): Formula => {
  switch (formula._tag) {
    case "MetaVariable":
    case "Predicate":
    case "Equality":
    case "Negation":
      // 原子式（NNFなので¬の直下は原子式）
      return formula;
    case "Universal":
      return universal(formula.variable, pullQuantifiers(formula.formula));
    case "Existential":
      return existential(formula.variable, pullQuantifiers(formula.formula));
    case "Conjunction": {
      const left = pullQuantifiers(formula.left);
      const right = pullQuantifiers(formula.right);
      return liftQuantifiersFromBinary(left, right, "conjunction");
    }
    case "Disjunction": {
      const left = pullQuantifiers(formula.left);
      const right = pullQuantifiers(formula.right);
      return liftQuantifiersFromBinary(left, right, "disjunction");
    }
    /* v8 ignore start */
    // NNF 変換後は →, ↔ は出現しない
    case "Implication":
    case "Biconditional":
    case "FormulaSubstitution":
      throw new Error(
        `Unexpected formula node in PNF quantifier lifting: ${formula._tag satisfies string}. Input must be in predicate NNF.`,
      );
  }
  formula satisfies never;
  throw new Error("Unreachable");
  /* v8 ignore stop */
};

/**
 * 二項結合子（∧ or ∨）の両辺から量化子を持ち上げる。
 *
 * 例: (∀x.φ) ∧ ψ → ∀x'.(φ[x'/x] ∧ ψ)  (x が ψ で自由なら α変換)
 *     φ ∧ (∃y.ψ) → ∃y'.(φ ∧ ψ[y'/y])  (y が φ で自由なら α変換)
 */
const liftQuantifiersFromBinary = (
  left: Formula,
  right: Formula,
  op: "conjunction" | "disjunction",
): Formula => {
  const combine = op === "conjunction" ? conjunction : disjunction;

  // 左辺が量化子の場合: (Qx.φ) op ψ → Qx'.(φ' op ψ)
  if (left instanceof Universal || left instanceof Existential) {
    const { renamedBody, renamedVar } = renameIfNeeded(
      left.variable,
      left.formula,
      right,
    );
    const makeQuantifier =
      left instanceof Universal ? universal : existential;
    return makeQuantifier(
      renamedVar,
      liftQuantifiersFromBinary(renamedBody, right, op),
    );
  }

  // 右辺が量化子の場合: φ op (Qy.ψ) → Qy'.(φ op ψ')
  if (right instanceof Universal || right instanceof Existential) {
    const { renamedBody, renamedVar } = renameIfNeeded(
      right.variable,
      right.formula,
      left,
    );
    const makeQuantifier =
      right instanceof Universal ? universal : existential;
    return makeQuantifier(
      renamedVar,
      liftQuantifiersFromBinary(left, renamedBody, op),
    );
  }

  // 両辺とも量化子でない場合: そのまま結合
  return combine(left, right);
};

/**
 * 量化子 Qx.body を other と組み合わせる際、x が other で自由なら α変換する。
 *
 * @returns renamedBody: α変換後の body, renamedVar: 使用する変数
 */
const renameIfNeeded = (
  variable: TermVariable,
  body: Formula,
  other: Formula,
): { readonly renamedBody: Formula; readonly renamedVar: TermVariable } => {
  const otherFree = freeVariablesInFormula(other);
  if (!otherFree.has(variable.name)) {
    return { renamedBody: body, renamedVar: variable };
  }
  // α変換が必要: 衝突しない新鮮な変数名を生成
  const allNames = new Set<string>();
  for (const v of allVariableNamesInFormula(body)) {
    allNames.add(v);
  }
  for (const v of allVariableNamesInFormula(other)) {
    allNames.add(v);
  }
  const freshName = generateFreshName(variable.name, allNames);
  const freshVar = new TermVariable({ name: freshName });
  const renamedBody = substituteTermVariableInFormula(
    body,
    variable,
    freshVar,
  );
  return { renamedBody, renamedVar: freshVar };
};

/**
 * base 名に ' を追加して使用済み名と衝突しない名前を生成する。
 */
const generateFreshName = (
  base: string,
  usedNames: ReadonlySet<string>,
): string => {
  let candidate = `${base satisfies string}'`;
  while (usedNames.has(candidate)) {
    candidate = `${candidate satisfies string}'`;
  }
  return candidate;
};

// ── PNF 判定関数 ────────────────────────────────────────

/**
 * 述語論理式が冠頭標準形 (PNF) であるかを判定する。
 *
 * PNF の条件:
 * - 量化子はすべて式の先頭に集まっている
 * - 量化子部分の後の行列（matrix）には量化子が含まれない
 *
 * FormulaSubstitution が含まれている場合はエラー。
 */
export const isPNF = (formula: Formula): boolean => {
  // 先頭の量化子列をスキップ
  let current = formula;
  while (
    current._tag === "Universal" ||
    current._tag === "Existential"
  ) {
    current = current.formula;
  }
  // 行列部分に量化子が含まれていないことを確認
  return isQuantifierFree(current);
};

/**
 * 論理式に量化子が含まれていないことを判定する。
 */
const isQuantifierFree = (formula: Formula): boolean => {
  switch (formula._tag) {
    case "MetaVariable":
    case "Predicate":
    case "Equality":
      return true;
    case "Negation":
      return isQuantifierFree(formula.formula);
    case "Implication":
    case "Conjunction":
    case "Disjunction":
    case "Biconditional":
      return isQuantifierFree(formula.left) && isQuantifierFree(formula.right);
    case "Universal":
    case "Existential":
      return false;
    case "FormulaSubstitution":
      throw new Error(
        `Cannot check PNF for FormulaSubstitution node: ${formula._tag satisfies string}. Resolve substitutions first.`,
      );
  }
  /* v8 ignore start */
  formula satisfies never;
  return false;
  /* v8 ignore stop */
};

import type { Formula } from "./formula";
import {
  Conjunction,
  Disjunction,
  conjunction,
  disjunction,
  negation,
} from "./formula";

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

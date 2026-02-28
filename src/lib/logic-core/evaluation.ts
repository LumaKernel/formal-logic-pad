import type { Formula } from "./formula";
import { metaVariableKey } from "./metaVariable";

// ── 型定義 ───────────────────────────────────────────────

/**
 * 真理値割当: メタ変数キー → 真理値
 * キーは metaVariableKey() で生成された文字列（例: "φ", "φ_1"）
 */
export type TruthAssignment = ReadonlyMap<string, boolean>;

/**
 * 真理値表の1行
 */
export interface TruthTableRow {
  readonly assignment: TruthAssignment;
  readonly result: boolean;
}

/**
 * 真理値表
 */
export interface TruthTable {
  readonly variables: readonly string[];
  readonly rows: readonly TruthTableRow[];
}

// ── 評価エンジン ─────────────────────────────────────────

/**
 * 命題論理式を与えられた真理値割当のもとで評価する。
 *
 * 命題論理のノード（MetaVariable, Negation, Implication, Conjunction, Disjunction, Biconditional）
 * のみ対象。量化子・述語・等号・FormulaSubstitution が含まれている場合はエラー。
 *
 * @throws 命題論理以外のノードが含まれている場合
 * @throws 割当にメタ変数が存在しない場合
 */
export const evaluateFormula = (
  formula: Formula,
  assignment: TruthAssignment,
): boolean => {
  switch (formula._tag) {
    case "MetaVariable": {
      const key = metaVariableKey(formula);
      const value = assignment.get(key);
      if (value === undefined) {
        throw new Error(
          `Truth assignment missing for meta-variable: ${key satisfies string}`,
        );
      }
      return value;
    }
    case "Negation":
      return !evaluateFormula(formula.formula, assignment);
    case "Implication":
      return (
        !evaluateFormula(formula.left, assignment) ||
        evaluateFormula(formula.right, assignment)
      );
    case "Conjunction":
      return (
        evaluateFormula(formula.left, assignment) &&
        evaluateFormula(formula.right, assignment)
      );
    case "Disjunction":
      return (
        evaluateFormula(formula.left, assignment) ||
        evaluateFormula(formula.right, assignment)
      );
    case "Biconditional": {
      const left = evaluateFormula(formula.left, assignment);
      const right = evaluateFormula(formula.right, assignment);
      return left === right;
    }
    case "Universal":
    case "Existential":
    case "Predicate":
    case "Equality":
    case "FormulaSubstitution":
      throw new Error(
        `Cannot evaluate non-propositional formula node: ${formula._tag satisfies string}. Only propositional logic formulas are supported.`,
      );
  }
  /* v8 ignore start */
  formula satisfies never;
  throw new Error("Unreachable");
  /* v8 ignore stop */
};

// ── 命題変数の収集 ───────────────────────────────────────

/**
 * 命題論理式中のすべてのメタ変数（命題変数）をキー文字列として収集する。
 *
 * 命題論理のノードのみ対象。量化子等が含まれている場合はエラー。
 *
 * @throws 命題論理以外のノードが含まれている場合
 */
export const collectPropositionalVariables = (
  formula: Formula,
): ReadonlySet<string> => {
  const result = new Set<string>();
  collectVarsRecursive(formula, result);
  return result;
};

const collectVarsRecursive = (formula: Formula, result: Set<string>): void => {
  switch (formula._tag) {
    case "MetaVariable":
      result.add(metaVariableKey(formula));
      return;
    case "Negation":
      collectVarsRecursive(formula.formula, result);
      return;
    case "Implication":
    case "Conjunction":
    case "Disjunction":
    case "Biconditional":
      collectVarsRecursive(formula.left, result);
      collectVarsRecursive(formula.right, result);
      return;
    case "Universal":
    case "Existential":
    case "Predicate":
    case "Equality":
    case "FormulaSubstitution":
      throw new Error(
        `Cannot collect propositional variables from non-propositional formula node: ${formula._tag satisfies string}. Only propositional logic formulas are supported.`,
      );
  }
  /* v8 ignore start */
  formula satisfies never;
  /* v8 ignore stop */
};

// ── すべての真理値割当を列挙 ─────────────────────────────

/**
 * n個の変数に対するすべての真理値割当を辞書順で生成する。
 * 各変数は false → true の順。
 */
const generateAllAssignments = (
  variables: readonly string[],
): readonly TruthAssignment[] => {
  const n = variables.length;
  const total = 1 << n; // 2^n
  const assignments: TruthAssignment[] = [];
  for (let i = 0; i < total; i++) {
    const map = new Map<string, boolean>();
    for (let j = 0; j < n; j++) {
      // 上位ビットから順に割り当て（辞書順になるよう）
      map.set(variables[j]!, ((i >> (n - 1 - j)) & 1) === 1);
    }
    assignments.push(map);
  }
  return assignments;
};

// ── 恒真・充足可能・矛盾の判定 ──────────────────────────

/**
 * 命題論理式が恒真（トートロジー）かどうかを判定する。
 * すべての真理値割当で真になる場合に true を返す。
 */
export const isTautology = (formula: Formula): boolean => {
  const variables = [...collectPropositionalVariables(formula)].sort();
  const assignments = generateAllAssignments(variables);
  return assignments.every((a) => evaluateFormula(formula, a));
};

/**
 * 命題論理式が充足可能かどうかを判定する。
 * 少なくとも1つの真理値割当で真になる場合に true を返す。
 */
export const isSatisfiable = (formula: Formula): boolean => {
  const variables = [...collectPropositionalVariables(formula)].sort();
  const assignments = generateAllAssignments(variables);
  return assignments.some((a) => evaluateFormula(formula, a));
};

/**
 * 命題論理式が矛盾（充足不可能）かどうかを判定する。
 * すべての真理値割当で偽になる場合に true を返す。
 */
export const isContradiction = (formula: Formula): boolean => {
  return !isSatisfiable(formula);
};

// ── 真理値表の生成 ──────────────────────────────────────

/**
 * 命題論理式の真理値表を生成する。
 * 変数は名前の辞書順でソートされ、割り当ては false→true の順で列挙される。
 */
export const generateTruthTable = (formula: Formula): TruthTable => {
  const variables = [...collectPropositionalVariables(formula)].sort();
  const assignments = generateAllAssignments(variables);
  const rows: TruthTableRow[] = assignments.map((a) => ({
    assignment: a,
    result: evaluateFormula(formula, a),
  }));
  return { variables, rows };
};

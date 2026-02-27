/**
 * Unicode フォーマッター。
 *
 * AST (Formula / Term) を Unicode 文字列に変換する。
 * DSL仕様（dev/logic-reference/06-dsl-specification.md）セクション7に準拠。
 *
 * 最小限の括弧のみ出力する（優先順位と結合性を考慮）。
 *
 * 変更時は formatUnicode.test.ts, index.ts も同期すること。
 */

import type { Formula } from "../logic-core/formula";
import type { BinaryOperator, Term } from "../logic-core/term";

// ── 添字変換 ──────────────────────────────────────────────

const subscriptDigits: readonly string[] = [
  "₀",
  "₁",
  "₂",
  "₃",
  "₄",
  "₅",
  "₆",
  "₇",
  "₈",
  "₉",
];

const toSubscript = (s: string): string =>
  [...s]
    .map((ch) => {
      const n = ch.charCodeAt(0) - 48; // '0' = 48
      return n >= 0 && n <= 9 ? (subscriptDigits[n] ?? ch) : ch;
    })
    .join("");

// ── 演算子の Unicode 記号 ──────────────────────────────────

const binaryOpUnicode: Readonly<Record<BinaryOperator, string>> = {
  "+": "+",
  "-": "−", // U+2212
  "*": "×", // U+00D7
  "/": "÷", // U+00F7
  "^": "^",
};

// ── 優先順位（数値が大きいほど強い） ──────────────────────

/**
 * 論理式の binding power。
 * Pratt parser と同じ数値体系。
 * leftBP: 左側のコンテキストで要求されるBP
 * rightBP: 右側のコンテキストで要求されるBP
 */
type FormulaTag =
  | "Implication"
  | "Biconditional"
  | "Conjunction"
  | "Disjunction";

const formulaBP: Readonly<
  Record<FormulaTag, { readonly leftBP: number; readonly rightBP: number }>
> = {
  Biconditional: { leftBP: 2, rightBP: 1 }, // 右結合
  Implication: { leftBP: 4, rightBP: 3 }, // 右結合
  Disjunction: { leftBP: 5, rightBP: 6 }, // 左結合
  Conjunction: { leftBP: 7, rightBP: 8 }, // 左結合
};

/**
 * 項の binding power。
 */
const termBP: Readonly<
  Record<BinaryOperator, { readonly leftBP: number; readonly rightBP: number }>
> = {
  "+": { leftBP: 1, rightBP: 2 }, // 左結合
  "-": { leftBP: 1, rightBP: 2 }, // 左結合
  "*": { leftBP: 3, rightBP: 4 }, // 左結合
  "/": { leftBP: 3, rightBP: 4 }, // 左結合
  "^": { leftBP: 6, rightBP: 5 }, // 右結合
};

// ── 論理式のフォーマット ──────────────────────────────────

/**
 * 論理式の binding power ペアを返す。
 * 二項演算子: そのまま { leftBP, rightBP }
 * atom/¬/述語/等号: { leftBP: 100, rightBP: 100 }（十分に高い）
 * 量化子: { leftBP: 0, rightBP: 0 }（最低）
 */
const formulaChildBP = (
  f: Formula,
): { readonly leftBP: number; readonly rightBP: number } => {
  switch (f._tag) {
    case "Implication":
    case "Biconditional":
    case "Conjunction":
    case "Disjunction":
      return formulaBP[f._tag];
    case "Negation":
    case "MetaVariable":
    case "Predicate":
    case "Equality":
    case "FormulaSubstitution":
      return { leftBP: 100, rightBP: 100 };
    case "Universal":
    case "Existential":
      return { leftBP: 0, rightBP: 0 };
    /* v8 ignore next 5 */
    default: {
      const _exhaustive: never = f;
      throw new Error(
        `Unknown formula tag: ${(_exhaustive as { readonly _tag: string })._tag satisfies string}`,
      );
    }
  }
};

/**
 * 親二項演算子の左辺に子を置くとき、括弧が必要か判定する。
 *
 * Pratt parser の挙動:
 *   左辺は先にパースされ、その後親演算子が消費される。
 *   子が二項演算なら、子の右辺と親演算子の leftBP が競合する。
 *   parent.leftBP > child.rightBP なら、パーサーは子の右辺を親に奪われるため括弧が必要。
 */
const needsParensLeft = (parentLeftBP: number, child: Formula): boolean => {
  const childBP = formulaChildBP(child);
  return parentLeftBP > childBP.rightBP;
};

/**
 * 親二項演算子の右辺に子を置くとき、括弧が必要か判定する。
 *
 * Pratt parser の挙動:
 *   右辺は parent.rightBP を minBP としてパースされる。
 *   子が二項演算なら、子の leftBP が parent.rightBP を超える必要がある。
 *   child.leftBP <= parent.rightBP なら括弧が必要。
 */
const needsParensRight = (parentRightBP: number, child: Formula): boolean => {
  const childBP = formulaChildBP(child);
  return childBP.leftBP <= parentRightBP;
};

/**
 * 論理式を文字列にフォーマットする。
 * parentBP: 親が要求する最低 binding power（量化子の括弧判定用）。
 */
const formatFormulaInner = (f: Formula, parentBP: number): string => {
  switch (f._tag) {
    case "MetaVariable": {
      const sub = f.subscript !== undefined ? toSubscript(f.subscript) : "";
      return `${f.name satisfies string}${sub satisfies string}`;
    }

    case "Negation": {
      // ¬ の内部が複合式（二項演算子・量化子）なら括弧が必要
      const inner = f.formula;
      const needsParens =
        inner._tag === "Implication" ||
        inner._tag === "Biconditional" ||
        inner._tag === "Conjunction" ||
        inner._tag === "Disjunction" ||
        inner._tag === "Universal" ||
        inner._tag === "Existential";
      const innerStr = needsParens
        ? `(${formatFormulaInner(inner, 0) satisfies string})`
        : formatFormulaInner(inner, 0);
      return `¬${innerStr satisfies string}`;
    }

    case "Implication":
    case "Biconditional":
    case "Conjunction":
    case "Disjunction": {
      const bp = formulaBP[f._tag];
      const op =
        f._tag === "Implication"
          ? "→"
          : f._tag === "Biconditional"
            ? "↔"
            : f._tag === "Conjunction"
              ? "∧"
              : "∨";
      const leftNeedsParens = needsParensLeft(bp.leftBP, f.left);
      const rightNeedsParens = needsParensRight(bp.rightBP, f.right);
      const leftStr = leftNeedsParens
        ? `(${formatFormulaInner(f.left, 0) satisfies string})`
        : formatFormulaInner(f.left, bp.leftBP);
      const rightStr = rightNeedsParens
        ? `(${formatFormulaInner(f.right, 0) satisfies string})`
        : formatFormulaInner(f.right, bp.rightBP);
      return `${leftStr satisfies string} ${op satisfies string} ${rightStr satisfies string}`;
    }

    case "Universal":
    case "Existential": {
      const sym = f._tag === "Universal" ? "∀" : "∃";
      const varName = f.variable.name;
      const bodyStr = formatFormulaInner(f.formula, 0);
      const result = `${sym satisfies string}${varName satisfies string}.${bodyStr satisfies string}`;
      // 量化子が二項演算子の子になるときは括弧が必要
      return parentBP > 0 ? `(${result satisfies string})` : result;
    }

    case "Predicate": {
      if (f.args.length === 0) {
        return f.name;
      }
      const argsStr = f.args.map((a) => formatTermInner(a)).join(", ");
      return `${f.name satisfies string}(${argsStr satisfies string})`;
    }

    case "Equality": {
      const leftStr = formatTermInner(f.left);
      const rightStr = formatTermInner(f.right);
      return `${leftStr satisfies string} = ${rightStr satisfies string}`;
    }

    case "FormulaSubstitution": {
      const formulaStr = formatFormulaInner(f.formula, 0);
      const termStr = formatTermInner(f.term);
      const varStr = f.variable.name;
      // φ が複合式（二項演算子・量化子）なら括弧が必要
      const needsParens =
        f.formula._tag === "Implication" ||
        f.formula._tag === "Biconditional" ||
        f.formula._tag === "Conjunction" ||
        f.formula._tag === "Disjunction" ||
        f.formula._tag === "Universal" ||
        f.formula._tag === "Existential" ||
        f.formula._tag === "Negation";
      const wrappedFormula = needsParens
        ? `(${formulaStr satisfies string})`
        : formulaStr;
      return `${wrappedFormula satisfies string}[${termStr satisfies string}/${varStr satisfies string}]`;
    }

    /* v8 ignore next 5 */
    default: {
      const _exhaustive: never = f;
      throw new Error(
        `Unknown formula tag: ${(_exhaustive as { readonly _tag: string })._tag satisfies string}`,
      );
    }
  }
};

/**
 * 項の binding power ペアを返す。
 */
const termChildBP = (
  t: Term,
): { readonly leftBP: number; readonly rightBP: number } => {
  switch (t._tag) {
    case "BinaryOperation":
      return termBP[t.operator];
    case "TermVariable":
    case "TermMetaVariable":
    case "Constant":
    case "FunctionApplication":
      return { leftBP: 100, rightBP: 100 };
    /* v8 ignore next 5 */
    default: {
      const _exhaustive: never = t;
      throw new Error(
        `Unknown term tag: ${(_exhaustive as { readonly _tag: string })._tag satisfies string}`,
      );
    }
  }
};

/**
 * 親二項演算子の左辺に項を置くとき、括弧が必要か判定する。
 */
const termNeedsParensLeft = (parentLeftBP: number, child: Term): boolean => {
  const childBP = termChildBP(child);
  return parentLeftBP > childBP.rightBP;
};

/**
 * 親二項演算子の右辺に項を置くとき、括弧が必要か判定する。
 */
const termNeedsParensRight = (parentRightBP: number, child: Term): boolean => {
  const childBP = termChildBP(child);
  return childBP.leftBP <= parentRightBP;
};

/**
 * 項を文字列にフォーマットする。
 */
const formatTermInner = (t: Term): string => {
  switch (t._tag) {
    case "TermVariable":
      return t.name;

    case "TermMetaVariable": {
      const sub = t.subscript !== undefined ? toSubscript(t.subscript) : "";
      return `${t.name satisfies string}${sub satisfies string}`;
    }

    case "Constant":
      return t.name;

    case "FunctionApplication": {
      const argsStr = t.args.map((a) => formatTermInner(a)).join(", ");
      return `${t.name satisfies string}(${argsStr satisfies string})`;
    }

    case "BinaryOperation": {
      const bp = termBP[t.operator];
      const opStr = binaryOpUnicode[t.operator];
      const leftParens = termNeedsParensLeft(bp.leftBP, t.left);
      const rightParens = termNeedsParensRight(bp.rightBP, t.right);
      const leftStr = leftParens
        ? `(${formatTermInner(t.left) satisfies string})`
        : formatTermInner(t.left);
      const rightStr = rightParens
        ? `(${formatTermInner(t.right) satisfies string})`
        : formatTermInner(t.right);
      return `${leftStr satisfies string} ${opStr satisfies string} ${rightStr satisfies string}`;
    }

    /* v8 ignore next 5 */
    default: {
      const _exhaustive: never = t;
      throw new Error(
        `Unknown term tag: ${(_exhaustive as { readonly _tag: string })._tag satisfies string}`,
      );
    }
  }
};

// ── 公開API ───────────────────────────────────────────────

/**
 * Formula AST を Unicode 文字列にフォーマットする。
 * 最小限の括弧のみ出力する。
 */
export const formatFormula = (formula: Formula): string =>
  formatFormulaInner(formula, 0);

/**
 * Term AST を Unicode 文字列にフォーマットする。
 * 最小限の括弧のみ出力する。
 */
export const formatTerm = (term: Term): string => formatTermInner(term);

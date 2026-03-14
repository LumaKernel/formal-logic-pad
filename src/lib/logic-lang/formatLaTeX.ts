/**
 * LaTeX フォーマッター。
 *
 * AST (Formula / Term) を LaTeX 文字列に変換する。
 * DSL仕様（dev/logic-reference/06-dsl-specification.md）セクション8に準拠。
 *
 * 最小限の括弧のみ出力する（優先順位と結合性を考慮）。
 * 括弧は \left( \right) で出力する。
 *
 * 変更時は formatLaTeX.test.ts, index.ts も同期すること。
 */

import type { GreekLetter } from "../logic-core/greekLetters";
import type { Formula } from "../logic-core/formula";
import type { BinaryOperator, Term } from "../logic-core/term";

// ── ギリシャ文字 → LaTeX コマンド対応表 ──────────────────────

const greekLetterLaTeX: Readonly<Record<GreekLetter, string>> = {
  α: "\\alpha",
  β: "\\beta",
  γ: "\\gamma",
  δ: "\\delta",
  ε: "\\varepsilon",
  ζ: "\\zeta",
  η: "\\eta",
  θ: "\\theta",
  ι: "\\iota",
  κ: "\\kappa",
  λ: "\\lambda",
  μ: "\\mu",
  ν: "\\nu",
  ξ: "\\xi",
  π: "\\pi",
  ρ: "\\rho",
  σ: "\\sigma",
  τ: "\\tau",
  υ: "\\upsilon",
  φ: "\\varphi",
  χ: "\\chi",
  ψ: "\\psi",
  ω: "\\omega",
};

// ── 演算子の LaTeX 記号 ──────────────────────────────────────

const binaryOpLaTeX: Readonly<Record<BinaryOperator, string>> = {
  "+": "+",
  "-": "-",
  "*": "\\times",
  "/": "\\div",
  "^": "^",
};

// ── 優先順位（formatUnicode.ts と同一の数値体系） ────────────

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

const termBP: Readonly<
  Record<BinaryOperator, { readonly leftBP: number; readonly rightBP: number }>
> = {
  "+": { leftBP: 1, rightBP: 2 }, // 左結合
  "-": { leftBP: 1, rightBP: 2 }, // 左結合
  "*": { leftBP: 3, rightBP: 4 }, // 左結合
  "/": { leftBP: 3, rightBP: 4 }, // 左結合
  "^": { leftBP: 6, rightBP: 5 }, // 右結合
};

// ── 括弧判定 ─────────────────────────────────────────────────

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
    case "FreeVariableAbsence":
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

const needsParensLeft = (parentLeftBP: number, child: Formula): boolean => {
  const childBP = formulaChildBP(child);
  return parentLeftBP > childBP.rightBP;
};

const needsParensRight = (parentRightBP: number, child: Formula): boolean => {
  const childBP = formulaChildBP(child);
  return childBP.leftBP <= parentRightBP;
};

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

const termNeedsParensLeft = (parentLeftBP: number, child: Term): boolean => {
  const childBP = termChildBP(child);
  return parentLeftBP > childBP.rightBP;
};

const termNeedsParensRight = (parentRightBP: number, child: Term): boolean => {
  const childBP = termChildBP(child);
  return childBP.leftBP <= parentRightBP;
};

// ── ヘルパー ─────────────────────────────────────────────────

const formatGreekLetter = (
  name: string,
  subscript: string | undefined,
): string => {
  /* v8 ignore start -- greekLetterLaTeXは全ギリシャ文字をカバーしており、??は型安全のための防御的コード */
  const cmd = greekLetterLaTeX[name as GreekLetter] ?? name;
  /* v8 ignore stop */
  const sub = subscript !== undefined ? `_{${subscript satisfies string}}` : "";
  return `${cmd satisfies string}${sub satisfies string}`;
};

const wrapParens = (inner: string): string =>
  `\\left(${inner satisfies string}\\right)`;

// ── 論理式のフォーマット ──────────────────────────────────────

const formatFormulaInner = (f: Formula, parentBP: number): string => {
  switch (f._tag) {
    case "MetaVariable":
      return formatGreekLetter(f.name, f.subscript);

    case "Negation": {
      const inner = f.formula;
      const needsParens =
        inner._tag === "Implication" ||
        inner._tag === "Biconditional" ||
        inner._tag === "Conjunction" ||
        inner._tag === "Disjunction" ||
        inner._tag === "Universal" ||
        inner._tag === "Existential";
      const innerStr = needsParens
        ? wrapParens(formatFormulaInner(inner, 0))
        : formatFormulaInner(inner, 0);
      return `\\lnot ${innerStr satisfies string}`;
    }

    case "Implication":
    case "Biconditional":
    case "Conjunction":
    case "Disjunction": {
      const bp = formulaBP[f._tag];
      const op =
        f._tag === "Implication"
          ? "\\to"
          : f._tag === "Biconditional"
            ? "\\leftrightarrow"
            : f._tag === "Conjunction"
              ? "\\land"
              : "\\lor";
      const leftNeedsParens = needsParensLeft(bp.leftBP, f.left);
      const rightNeedsParens = needsParensRight(bp.rightBP, f.right);
      const leftStr = leftNeedsParens
        ? wrapParens(formatFormulaInner(f.left, 0))
        : formatFormulaInner(f.left, bp.leftBP);
      const rightStr = rightNeedsParens
        ? wrapParens(formatFormulaInner(f.right, 0))
        : formatFormulaInner(f.right, bp.rightBP);
      return `${leftStr satisfies string} ${op satisfies string} ${rightStr satisfies string}`;
    }

    case "Universal":
    case "Existential": {
      const sym = f._tag === "Universal" ? "\\forall" : "\\exists";
      const varName = f.variable.name;
      const bodyStr = formatFormulaInner(f.formula, 0);
      const result = `${sym satisfies string} ${varName satisfies string} . ${bodyStr satisfies string}`;
      // 防御的コード: 量化子のchildBPは{0,0}なので、親の二項演算子は常にneedsParens=trueとなり
      // parentBP=0で呼ばれる。parentBP>0は到達不能だが安全のために残す。
      /* v8 ignore start */
      return parentBP > 0 ? wrapParens(result) : result;
      /* v8 ignore stop */
    }

    case "Predicate": {
      if (f.args.length === 0) {
        return f.name;
      }
      const argsStr = f.args.map((a) => formatTermInner(a)).join(", ");
      return `${f.name satisfies string}\\left(${argsStr satisfies string}\\right)`;
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
      // φ が複合式なら括弧で囲む
      const needsParens =
        f.formula._tag === "Implication" ||
        f.formula._tag === "Biconditional" ||
        f.formula._tag === "Conjunction" ||
        f.formula._tag === "Disjunction" ||
        f.formula._tag === "Universal" ||
        f.formula._tag === "Existential" ||
        f.formula._tag === "Negation";
      const wrappedFormula = needsParens
        ? `\\left(${formulaStr satisfies string}\\right)`
        : formulaStr;
      return `${wrappedFormula satisfies string}[${termStr satisfies string}/${varStr satisfies string}]`;
    }

    case "FreeVariableAbsence": {
      const formulaStr = formatFormulaInner(f.formula, 0);
      const varStr = f.variable.name;
      // φ が複合式なら括弧で囲む
      const needsParens =
        f.formula._tag === "Implication" ||
        f.formula._tag === "Biconditional" ||
        f.formula._tag === "Conjunction" ||
        f.formula._tag === "Disjunction" ||
        f.formula._tag === "Universal" ||
        f.formula._tag === "Existential" ||
        f.formula._tag === "Negation";
      const wrappedFormula = needsParens
        ? `\\left(${formulaStr satisfies string}\\right)`
        : formulaStr;
      return `${wrappedFormula satisfies string}[/${varStr satisfies string}]`;
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

// ── 項のフォーマット ──────────────────────────────────────────

const formatTermInner = (t: Term): string => {
  switch (t._tag) {
    case "TermVariable":
      return t.name;

    case "TermMetaVariable":
      return formatGreekLetter(t.name, t.subscript);

    case "Constant":
      return t.name;

    case "FunctionApplication": {
      const argsStr = t.args.map((a) => formatTermInner(a)).join(", ");
      return `${t.name satisfies string}\\left(${argsStr satisfies string}\\right)`;
    }

    case "BinaryOperation": {
      const bp = termBP[t.operator];
      // ^ は LaTeX の上付き記号として特別扱い
      if (t.operator === "^") {
        const leftParens = termNeedsParensLeft(bp.leftBP, t.left);
        const leftStr = leftParens
          ? wrapParens(formatTermInner(t.left))
          : formatTermInner(t.left);
        // 右辺は常に {} で囲む（LaTeX のべき乗構文）
        const rightStr = formatTermInner(t.right);
        return `${leftStr satisfies string}^{${rightStr satisfies string}}`;
      }
      const opStr = binaryOpLaTeX[t.operator];
      const leftParens = termNeedsParensLeft(bp.leftBP, t.left);
      const rightParens = termNeedsParensRight(bp.rightBP, t.right);
      const leftStr = leftParens
        ? wrapParens(formatTermInner(t.left))
        : formatTermInner(t.left);
      const rightStr = rightParens
        ? wrapParens(formatTermInner(t.right))
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

// ── 公開API ───────────────────────────────────────────────────

/**
 * Formula AST を LaTeX 文字列にフォーマットする。
 * 最小限の括弧のみ出力する。
 * 括弧は \left( \right) で出力する。
 */
export const formatFormulaLaTeX = (formula: Formula): string =>
  formatFormulaInner(formula, 0);

/**
 * Term AST を LaTeX 文字列にフォーマットする。
 * 最小限の括弧のみ出力する。
 * 括弧は \left( \right) で出力する。
 */
export const formatTermLaTeX = (term: Term): string => formatTermInner(term);

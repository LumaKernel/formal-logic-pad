/**
 * 論理式シンタックスハイライト用トークナイザー。
 *
 * Formula / Term AST をトークン配列に変換する。
 * 各トークンはテキストと種別（色分け用）を持つ。
 * formatUnicode.ts と同じ括弧判定ロジックを使用。
 *
 * 変更時は formulaHighlight.test.ts, index.ts も同期すること。
 */

import { Either } from "effect";
import type { Formula } from "../logic-core/formula";
import type { BinaryOperator, Term } from "../logic-core/term";
import { lex } from "./lexer";
import type { TokenKind } from "./token";

// ── トークン種別 ──────────────────────────────────────────

/**
 * シンタックスハイライトのトークン種別。
 * CSS変数 `--color-syntax-<kind>` と対応する。
 */
export type FormulaTokenKind =
  | "connective"
  | "quantifier"
  | "variable"
  | "metaVariable"
  | "predicate"
  | "function"
  | "constant"
  | "subscript"
  | "equality"
  | "punctuation"
  | "negation"
  | "substitution";

/**
 * シンタックスハイライト用トークン。
 */
export interface FormulaToken {
  readonly text: string;
  readonly kind: FormulaTokenKind;
}

// ── 添字変換（formatUnicode.tsと同一） ────────────────────

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
      const n = ch.charCodeAt(0) - 48;
      /* v8 ignore start */
      if (n >= 0 && n <= 9) {
        /* v8 ignore stop */
        /* v8 ignore start */
        return subscriptDigits[n] ?? ch;
        /* v8 ignore stop */
      }
      /* v8 ignore start */
      return ch;
      /* v8 ignore stop */
    })
    .join("");

// ── 演算子の Unicode 記号（formatUnicode.tsと同一） ────────

const binaryOpUnicode: Readonly<Record<BinaryOperator, string>> = {
  "+": "+",
  "-": "−",
  "*": "×",
  "/": "÷",
  "^": "^",
};

// ── 優先順位（formatUnicode.tsと同一） ────────────────────

type FormulaTag =
  | "Implication"
  | "Biconditional"
  | "Conjunction"
  | "Disjunction";

const formulaBP: Readonly<
  Record<FormulaTag, { readonly leftBP: number; readonly rightBP: number }>
> = {
  Biconditional: { leftBP: 2, rightBP: 1 },
  Implication: { leftBP: 4, rightBP: 3 },
  Disjunction: { leftBP: 5, rightBP: 6 },
  Conjunction: { leftBP: 7, rightBP: 8 },
};

const termBP: Readonly<
  Record<BinaryOperator, { readonly leftBP: number; readonly rightBP: number }>
> = {
  "+": { leftBP: 1, rightBP: 2 },
  "-": { leftBP: 1, rightBP: 2 },
  "*": { leftBP: 3, rightBP: 4 },
  "/": { leftBP: 3, rightBP: 4 },
  "^": { leftBP: 6, rightBP: 5 },
};

// ── 括弧判定（formatUnicode.tsと同一） ────────────────────

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

// ── ヘルパー ──────────────────────────────────────────────

const punc = (text: string): FormulaToken => ({
  text,
  kind: "punctuation",
});

const wrapParens = (tokens: readonly FormulaToken[]): readonly FormulaToken[] =>
  [punc("("), ...tokens, punc(")")] as const;

// ── 項のトークナイズ ──────────────────────────────────────

const tokenizeTermInner = (t: Term): readonly FormulaToken[] => {
  switch (t._tag) {
    case "TermVariable":
      return [{ text: t.name, kind: "variable" }];

    case "TermMetaVariable": {
      const tokens: FormulaToken[] = [{ text: t.name, kind: "metaVariable" }];
      if (t.subscript !== undefined) {
        tokens.push({ text: toSubscript(t.subscript), kind: "subscript" });
      }
      return tokens;
    }

    case "Constant":
      return [{ text: t.name, kind: "constant" }];

    case "FunctionApplication": {
      const tokens: FormulaToken[] = [{ text: t.name, kind: "function" }];
      tokens.push(punc("("));
      t.args.forEach((arg, i) => {
        if (i > 0) {
          tokens.push(punc(", "));
        }
        tokens.push(...tokenizeTermInner(arg));
      });
      tokens.push(punc(")"));
      return tokens;
    }

    case "BinaryOperation": {
      const bp = termBP[t.operator];
      const opStr = binaryOpUnicode[t.operator];
      const leftParens = termNeedsParensLeft(bp.leftBP, t.left);
      const rightParens = termNeedsParensRight(bp.rightBP, t.right);
      const leftTokens = tokenizeTermInner(t.left);
      const rightTokens = tokenizeTermInner(t.right);
      const tokens: FormulaToken[] = [];
      tokens.push(...(leftParens ? wrapParens(leftTokens) : leftTokens));
      tokens.push(punc(" "));
      tokens.push({ text: opStr, kind: "connective" });
      tokens.push(punc(" "));
      tokens.push(...(rightParens ? wrapParens(rightTokens) : rightTokens));
      return tokens;
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

// ── 論理式のトークナイズ ──────────────────────────────────

const tokenizeFormulaInner = (
  f: Formula,
  parentBP: number,
): readonly FormulaToken[] => {
  switch (f._tag) {
    case "MetaVariable": {
      const tokens: FormulaToken[] = [{ text: f.name, kind: "metaVariable" }];
      if (f.subscript !== undefined) {
        tokens.push({ text: toSubscript(f.subscript), kind: "subscript" });
      }
      return tokens;
    }

    case "Negation": {
      const inner = f.formula;
      const needsParens =
        inner._tag === "Implication" ||
        inner._tag === "Biconditional" ||
        inner._tag === "Conjunction" ||
        inner._tag === "Disjunction" ||
        inner._tag === "Universal" ||
        inner._tag === "Existential";
      const innerTokens = tokenizeFormulaInner(inner, 0);
      const tokens: FormulaToken[] = [{ text: "¬", kind: "negation" }];
      tokens.push(...(needsParens ? wrapParens(innerTokens) : innerTokens));
      return tokens;
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
      const leftTokens = leftNeedsParens
        ? wrapParens(tokenizeFormulaInner(f.left, 0))
        : tokenizeFormulaInner(f.left, bp.leftBP);
      const rightTokens = rightNeedsParens
        ? wrapParens(tokenizeFormulaInner(f.right, 0))
        : tokenizeFormulaInner(f.right, bp.rightBP);
      const tokens: FormulaToken[] = [];
      tokens.push(...leftTokens);
      tokens.push(punc(" "));
      tokens.push({ text: op, kind: "connective" });
      tokens.push(punc(" "));
      tokens.push(...rightTokens);
      return tokens;
    }

    case "Universal":
    case "Existential": {
      const sym = f._tag === "Universal" ? "∀" : "∃";
      const tokens: FormulaToken[] = [
        { text: sym, kind: "quantifier" },
        { text: f.variable.name, kind: "variable" },
        punc("."),
      ];
      tokens.push(...tokenizeFormulaInner(f.formula, 0));
      const result = tokens;
      /* v8 ignore start */
      if (parentBP > 0) {
        return wrapParens(result);
      }
      /* v8 ignore stop */
      return result;
    }

    case "Predicate": {
      if (f.args.length === 0) {
        return [{ text: f.name, kind: "predicate" }];
      }
      const tokens: FormulaToken[] = [{ text: f.name, kind: "predicate" }];
      tokens.push(punc("("));
      f.args.forEach((arg, i) => {
        if (i > 0) {
          tokens.push(punc(", "));
        }
        tokens.push(...tokenizeTermInner(arg));
      });
      tokens.push(punc(")"));
      return tokens;
    }

    case "Equality": {
      const tokens: FormulaToken[] = [];
      tokens.push(...tokenizeTermInner(f.left));
      tokens.push(punc(" "));
      tokens.push({ text: "=", kind: "equality" });
      tokens.push(punc(" "));
      tokens.push(...tokenizeTermInner(f.right));
      return tokens;
    }

    case "FormulaSubstitution": {
      const innerNeedsParens =
        f.formula._tag === "Implication" ||
        f.formula._tag === "Biconditional" ||
        f.formula._tag === "Conjunction" ||
        f.formula._tag === "Disjunction" ||
        f.formula._tag === "Universal" ||
        f.formula._tag === "Existential" ||
        f.formula._tag === "Negation";
      const formulaTokens = tokenizeFormulaInner(f.formula, 0);
      const tokens: FormulaToken[] = [];
      tokens.push(
        ...(innerNeedsParens ? wrapParens(formulaTokens) : formulaTokens),
      );
      tokens.push({ text: "[", kind: "substitution" });
      tokens.push(...tokenizeTermInner(f.term));
      tokens.push({ text: "/", kind: "substitution" });
      tokens.push({ text: f.variable.name, kind: "variable" });
      tokens.push({ text: "]", kind: "substitution" });
      return tokens;
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

// ── 公開API ───────────────────────────────────────────────

/**
 * Formula AST をシンタックスハイライト用トークン配列に変換する。
 * formatFormula() と同じ括弧ルール・Unicode記号を使用。
 */
export const tokenizeFormula = (formula: Formula): readonly FormulaToken[] =>
  tokenizeFormulaInner(formula, 0);

/**
 * Term AST をシンタックスハイライト用トークン配列に変換する。
 */
export const tokenizeTerm = (term: Term): readonly FormulaToken[] =>
  tokenizeTermInner(term);

/**
 * トークン配列をプレーンテキストに結合する。
 * formatFormula() と同じ結果になることを検証用に使用。
 */
export const tokensToText = (tokens: readonly FormulaToken[]): string =>
  tokens.map((t) => t.text).join("");

// ── DSL入力テキスト用トークナイザー ──────────────────────────

/**
 * TokenKind → FormulaTokenKind の対応表。
 * lexer のトークン種別をシンタックスハイライトの色分けカテゴリに変換する。
 */
const tokenKindMapping: Readonly<Record<TokenKind, FormulaTokenKind>> = {
  // 論理演算子
  NOT: "negation",
  AND: "connective",
  OR: "connective",
  IMPLIES: "connective",
  IFF: "connective",
  // 量化子
  FORALL: "quantifier",
  EXISTS: "quantifier",
  // 等号
  EQUALS: "equality",
  // 項の二項演算子
  PLUS: "connective",
  MINUS: "connective",
  TIMES: "connective",
  DIVIDE: "connective",
  POWER: "connective",
  // 区切り文字
  LPAREN: "punctuation",
  RPAREN: "punctuation",
  LBRACKET: "substitution",
  RBRACKET: "substitution",
  DOT: "punctuation",
  COMMA: "punctuation",
  // 識別子
  META_VARIABLE: "metaVariable",
  UPPER_IDENT: "predicate",
  LOWER_IDENT: "variable",
  // リテラル
  NUMBER: "constant",
  // 特殊
  BOTTOM: "connective",
  EOF: "punctuation",
};

/**
 * Position (1-indexed line/column) → 0-indexed offset 変換。
 * 1行のみの入力を前提とする（FormulaInput は <input type="text"> で単一行）。
 */
const positionToOffset = (
  input: string,
  pos: { readonly line: number; readonly column: number },
): number => {
  const lines = input.split("\n");
  let offset = 0;
  for (let i = 0; i < pos.line - 1 && i < lines.length; i++) {
    /* v8 ignore start -- defensive: lines[i] is always defined within loop bounds */
    offset += (lines[i] ?? "").length + 1;
    /* v8 ignore stop */
  }
  return offset + pos.column - 1;
};

/**
 * DSL入力テキストをシンタックスハイライト用トークン配列に変換する。
 * lexer のトークン位置情報を使い、入力テキスト中の各部分を色分けカテゴリに分類する。
 *
 * lexer がエラーを返した場合は null を返す（エラー時はハイライトしない）。
 * 空入力の場合も null を返す。
 *
 * 結果のトークンを結合すると元の入力テキストと同じ文字列になる
 * （空白もトークンとして含まれる）。
 */
export const tokenizeDslInput = (
  input: string,
): readonly FormulaToken[] | null => {
  if (input.trim() === "") return null;

  const lexResult = lex(input);
  if (Either.isLeft(lexResult)) return null;

  const tokens = lexResult.right;
  const result: FormulaToken[] = [];
  let currentOffset = 0;

  for (const token of tokens) {
    if (token.kind === "EOF") break;

    const tokenStart = positionToOffset(input, token.span.start);
    const tokenEnd = positionToOffset(input, token.span.end);

    // トークン間の空白を punctuation として追加
    if (currentOffset < tokenStart) {
      result.push({
        text: input.slice(currentOffset, tokenStart),
        kind: "punctuation",
      });
    }

    // トークン本体
    const tokenText = input.slice(tokenStart, tokenEnd);
    if (tokenText.length > 0) {
      result.push({
        text: tokenText,
        kind: tokenKindMapping[token.kind],
      });
    }

    currentOffset = tokenEnd;
  }

  // 末尾の空白
  if (currentOffset < input.length) {
    result.push({
      text: input.slice(currentOffset),
      kind: "punctuation",
    });
  }

  return result;
};

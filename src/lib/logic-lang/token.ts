/**
 * Logic Schema Language のトークン定義。
 *
 * 変更時は lexer.ts のトークン化ロジックと lexer.test.ts も同期すること。
 */

import { Data } from "effect";
import type { Either } from "effect";

// --- トークン種別 ---

export const TOKEN_KINDS = [
  // 論理演算子
  "NOT",
  "AND",
  "OR",
  "IMPLIES",
  "IFF",
  // 量化子
  "FORALL",
  "EXISTS",
  // 等号
  "EQUALS",
  // 項の二項演算子
  "PLUS",
  "MINUS",
  "TIMES",
  "DIVIDE",
  "POWER",
  // 区切り文字
  "LPAREN",
  "RPAREN",
  "LBRACKET",
  "RBRACKET",
  "DOT",
  "COMMA",
  // 識別子
  "META_VARIABLE",
  "UPPER_IDENT",
  "LOWER_IDENT",
  // リテラル
  "NUMBER",
  // 特殊
  "BOTTOM",
  "EOF",
] as const;

export type TokenKind = (typeof TOKEN_KINDS)[number];

// --- 位置情報 ---

export interface Position {
  readonly line: number; // 1-indexed
  readonly column: number; // 1-indexed
}

export interface Span {
  readonly start: Position;
  readonly end: Position;
}

// --- トークン ---

export interface Token {
  readonly kind: TokenKind;
  readonly span: Span;
  readonly value?: string;
}

// --- Lexerエラー ---

export class LexerError extends Data.TaggedError("LexerError")<{
  readonly message: string;
  readonly span: Span;
}> {}

// --- Lexer結果 ---
// Right = 成功 (tokens), Left = 失敗 (errors)

export type LexResult = Either.Either<readonly Token[], readonly LexerError[]>;

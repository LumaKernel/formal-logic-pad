/**
 * Logic Schema Language のトークン定義。
 *
 * 変更時は lexer.ts のトークン化ロジックと lexer.test.ts も同期すること。
 */

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

export interface LexerError {
  readonly message: string;
  readonly span: Span;
}

// --- Lexer結果 ---

export type LexResult =
  | { readonly ok: true; readonly tokens: readonly Token[] }
  | { readonly ok: false; readonly errors: readonly LexerError[] };

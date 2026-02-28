/**
 * Logic Schema Language の Lexer。
 *
 * DSL仕様（dev/logic-reference/06-dsl-specification.md）に準拠。
 * logic-core の greekLetters.ts からギリシャ文字定義を再利用。
 *
 * 変更時は token.ts のトークン型と lexer.test.ts も同期すること。
 */

import { Either } from "effect";
import {
  greekLetters,
  greekLetterNames,
  isValidSubscript,
} from "../logic-core/greekLetters";
import { LexerError } from "./token";
import type { LexResult, Position, Span, Token, TokenKind } from "./token";

// --- Unicode記号 → トークン種別 マッピング ---

const UNICODE_SINGLE_CHAR: ReadonlyMap<string, TokenKind> = new Map([
  // 論理演算子
  ["¬", "NOT"],
  ["∧", "AND"],
  ["∨", "OR"],
  ["→", "IMPLIES"],
  ["↔", "IFF"],
  // 量化子
  ["∀", "FORALL"],
  ["∃", "EXISTS"],
  // 等号
  ["=", "EQUALS"],
  // 項二項演算子
  ["+", "PLUS"],
  ["\u2212", "MINUS"], // U+2212 MINUS SIGN
  ["\u00D7", "TIMES"], // ×
  ["\u00F7", "DIVIDE"], // ÷
  ["^", "POWER"],
  // 区切り文字
  ["(", "LPAREN"],
  [")", "RPAREN"],
  ["[", "LBRACKET"],
  ["]", "RBRACKET"],
  [".", "DOT"],
  [",", "COMMA"],
]);

// ASCII の `-` もMINUSとして扱う（項演算子として）
// ただし `->` (IMPLIES) との競合があるため、lexer内で先読み判定する

// --- キーワード → トークン種別 マッピング ---

const KEYWORDS: ReadonlyMap<string, TokenKind> = new Map([
  ["not", "NOT"],
  ["and", "AND"],
  ["or", "OR"],
  ["implies", "IMPLIES"],
  ["iff", "IFF"],
  ["all", "FORALL"],
  ["forall", "FORALL"],
  ["ex", "EXISTS"],
  ["exists", "EXISTS"],
]);

// --- ギリシャ文字 Unicode（U+03B1〜U+03C9、ο除外）のセット ---

const GREEK_UNICODE_SET: ReadonlySet<string> = new Set(
  greekLetters as readonly string[],
);

// --- Unicode下付き数字 → 通常数字 ---

const UNICODE_SUBSCRIPT_DIGITS: ReadonlyMap<string, string> = new Map([
  ["\u2080", "0"],
  ["\u2081", "1"],
  ["\u2082", "2"],
  ["\u2083", "3"],
  ["\u2084", "4"],
  ["\u2085", "5"],
  ["\u2086", "6"],
  ["\u2087", "7"],
  ["\u2088", "8"],
  ["\u2089", "9"],
]);

// --- ヘルパー関数 ---

const posStr = (p: Position): string =>
  `${String(p.line) satisfies string}:${String(p.column) satisfies string}`;

const isWhitespace = (ch: string): boolean =>
  ch === " " || ch === "\t" || ch === "\r" || ch === "\n";

const isDigit = (ch: string): boolean => ch >= "0" && ch <= "9";

const isUpperLetter = (ch: string): boolean => ch >= "A" && ch <= "Z";

const isLowerLetter = (ch: string): boolean => ch >= "a" && ch <= "z";

const isLetter = (ch: string): boolean =>
  isUpperLetter(ch) || isLowerLetter(ch);

const isAlphanumOrUnderscore = (ch: string): boolean =>
  isLetter(ch) || isDigit(ch) || ch === "_";

const isUnicodeSubscriptDigit = (ch: string): boolean =>
  UNICODE_SUBSCRIPT_DIGITS.has(ch);

// --- Lexer本体 ---

export const lex = (input: string): LexResult => {
  const tokens: Token[] = [];
  const errors: LexerError[] = [];
  let pos = 0;
  let line = 1;
  let column = 1;

  const currentPos = (): Position => ({ line, column });

  const advance = (): string => {
    const ch = input[pos]!;
    pos++;
    if (ch === "\n") {
      line++;
      column = 1;
    } else {
      column++;
    }
    return ch;
  };

  const peek = (): string | undefined => input[pos];

  const peekAt = (offset: number): string | undefined => input[pos + offset];

  const makeSpan = (start: Position, end: Position): Span => ({ start, end });

  const addToken = (kind: TokenKind, span: Span, value?: string): void => {
    tokens.push(value !== undefined ? { kind, span, value } : { kind, span });
  };

  const addError = (message: string, span: Span): void => {
    errors.push(new LexerError({ message, span }));
  };

  // Unicode下付き数字列を読み取る
  const readUnicodeSubscript = (): string => {
    let subscript = "";
    while (pos < input.length) {
      const ch = input[pos]!;
      const digit = UNICODE_SUBSCRIPT_DIGITS.get(ch);
      if (digit === undefined) break;
      subscript += digit;
      advance();
    }
    return subscript;
  };

  // 通常数字の添字を読み取る（アンダースコア区切りオプション）
  const readAsciiSubscript = (): string => {
    let subscript = "";
    while (pos < input.length && isDigit(input[pos]!)) {
      subscript += advance();
    }
    return subscript;
  };

  // メタ変数の添字処理（Unicode直接入力後 or ASCII名後）
  const readSubscript = (
    startPos: Position,
  ): { readonly subscript: string | undefined; readonly error: boolean } => {
    const ch = peek();

    // Unicode下付き数字
    if (ch !== undefined && isUnicodeSubscriptDigit(ch)) {
      const subscript = readUnicodeSubscript();
      if (!isValidSubscript(subscript)) {
        const endPos = currentPos();
        addError(
          `Subscript too long at ${posStr(startPos) satisfies string}: maximum 3 digits allowed`,
          makeSpan(startPos, endPos),
        );
        return { subscript: undefined, error: true };
      }
      return { subscript, error: false };
    }

    // 通常数字（ASCII入力後）
    if (ch !== undefined && isDigit(ch)) {
      const subscript = readAsciiSubscript();
      if (!isValidSubscript(subscript)) {
        const endPos = currentPos();
        addError(
          `Subscript too long at ${posStr(startPos) satisfies string}: maximum 3 digits allowed`,
          makeSpan(startPos, endPos),
        );
        return { subscript: undefined, error: true };
      }
      return { subscript, error: false };
    }

    return { subscript: undefined, error: false };
  };

  // ギリシャ文字のUnicode直接入力をトークン化
  const lexUnicodeGreek = (start: Position, greekChar: string): void => {
    advance(); // ギリシャ文字を消費

    // 添字チェック
    const subscriptStart = currentPos();
    const { subscript, error } = readSubscript(subscriptStart);
    if (error) return;

    const end = currentPos();
    const value =
      subscript !== undefined
        ? `${greekChar satisfies string}_${subscript satisfies string}`
        : greekChar;
    addToken("META_VARIABLE", makeSpan(start, end), value);
  };

  // 英字で始まる識別子をトークン化
  const lexIdentifier = (start: Position): void => {
    let ident = "";
    while (pos < input.length && isAlphanumOrUnderscore(input[pos]!)) {
      ident += advance();
    }

    // キーワード判定
    const keyword = KEYWORDS.get(ident);
    if (keyword !== undefined) {
      addToken(keyword, makeSpan(start, currentPos()));
      return;
    }

    // ギリシャ文字ASCII名判定
    // 添字が `_数字` または直後の数字で分離
    // 例: phi1 → φ + subscript "1", phi_01 → φ + subscript "01"
    const greekResult = tryParseGreekAsciiName(ident, start);
    if (greekResult !== undefined) {
      const { greekChar, subscript, error } = greekResult;
      if (error) return;
      const end = currentPos();
      const value =
        subscript !== undefined
          ? `${greekChar satisfies string}_${subscript satisfies string}`
          : greekChar;
      addToken("META_VARIABLE", makeSpan(start, end), value);
      return;
    }

    // 大文字で始まる → 述語(UPPER_IDENT)
    if (isUpperLetter(ident[0]!)) {
      addToken("UPPER_IDENT", makeSpan(start, currentPos()), ident);
      return;
    }

    // 小文字で始まる → 変数/関数(LOWER_IDENT)
    addToken("LOWER_IDENT", makeSpan(start, currentPos()), ident);
  };

  // ギリシャ文字ASCII名の解析を試みる
  const tryParseGreekAsciiName = (
    ident: string,
    start: Position,
  ):
    | {
        readonly greekChar: string;
        readonly subscript: string | undefined;
        readonly error: boolean;
      }
    | undefined => {
    // 完全一致チェック
    const exactMatch = greekLetterNames.get(ident);
    if (exactMatch !== undefined) {
      // 直後に数字がある場合は添字として読む
      const subscriptStart = currentPos();
      const ch = peek();
      if (ch !== undefined && (isDigit(ch) || isUnicodeSubscriptDigit(ch))) {
        const { subscript, error } = readSubscript(subscriptStart);
        return { greekChar: exactMatch, subscript, error };
      }
      return { greekChar: exactMatch, subscript: undefined, error: false };
    }

    // プレフィックスマッチ: 識別子全体をギリシャ文字名+添字に分解
    // 例: "phi1" → "phi" + "1", "phi01" → "phi" + "01"
    for (const [name, letter] of greekLetterNames) {
      if (ident.startsWith(name)) {
        const rest = ident.slice(name.length);
        // rest === "" は完全一致パスで先に処理されるためここには到達しない
        const subscriptPart = rest.startsWith("_") ? rest.slice(1) : rest;
        if (subscriptPart.length > 0 && /^\d+$/.test(subscriptPart)) {
          if (!isValidSubscript(subscriptPart)) {
            const endPos = currentPos();
            addError(
              `Subscript too long at ${posStr(start) satisfies string}: maximum 3 digits allowed`,
              makeSpan(start, endPos),
            );
            return { greekChar: letter, subscript: undefined, error: true };
          }
          return { greekChar: letter, subscript: subscriptPart, error: false };
        }
        // rest が数字以外を含む場合、これはギリシャ文字名として扱わない
        // 例: "phid" → LOWER_IDENT "phid"（"phi" + "d" とは分解しない）
      }
    }

    return undefined;
  };

  // 数字リテラルをトークン化
  const lexNumber = (start: Position): void => {
    let num = "";
    while (pos < input.length && isDigit(input[pos]!)) {
      num += advance();
    }
    addToken("NUMBER", makeSpan(start, currentPos()), num);
  };

  // --- メインループ ---

  while (pos < input.length) {
    const ch = input[pos]!;

    // 空白のスキップ
    if (isWhitespace(ch)) {
      advance();
      continue;
    }

    const start = currentPos();

    // 複数文字 ASCII 演算子（単一文字より先に判定）
    if (ch === "-" && peekAt(1) === ">") {
      advance();
      advance();
      addToken("IMPLIES", makeSpan(start, currentPos()));
      continue;
    }
    if (ch === "<" && peekAt(1) === "-" && peekAt(2) === ">") {
      advance();
      advance();
      advance();
      addToken("IFF", makeSpan(start, currentPos()));
      continue;
    }
    if (ch === "/" && peekAt(1) === "\\") {
      advance();
      advance();
      addToken("AND", makeSpan(start, currentPos()));
      continue;
    }
    if (ch === "\\" && peekAt(1) === "/") {
      advance();
      advance();
      addToken("OR", makeSpan(start, currentPos()));
      continue;
    }
    if (ch === "~") {
      advance();
      addToken("NOT", makeSpan(start, currentPos()));
      continue;
    }

    // ASCII の `-` 単体は MINUS（`->` は上で先に処理済み）
    if (ch === "-") {
      advance();
      addToken("MINUS", makeSpan(start, currentPos()));
      continue;
    }

    // ASCII の `*` は TIMES
    if (ch === "*") {
      advance();
      addToken("TIMES", makeSpan(start, currentPos()));
      continue;
    }

    // ASCII の `/` 単体は DIVIDE（`/\` は上で先に処理済み）
    if (ch === "/") {
      advance();
      addToken("DIVIDE", makeSpan(start, currentPos()));
      continue;
    }

    // Unicode単一文字記号
    const unicodeKind = UNICODE_SINGLE_CHAR.get(ch);
    if (unicodeKind !== undefined) {
      advance();
      addToken(unicodeKind, makeSpan(start, currentPos()));
      continue;
    }

    // ギリシャ文字 Unicode 直接入力
    if (GREEK_UNICODE_SET.has(ch)) {
      lexUnicodeGreek(start, ch);
      continue;
    }

    // 英字で始まる識別子
    if (isLetter(ch)) {
      lexIdentifier(start);
      continue;
    }

    // 数字で始まるリテラル
    if (isDigit(ch)) {
      lexNumber(start);
      continue;
    }

    // 不正な文字
    advance();
    addError(
      `Unexpected character '${ch satisfies string}' at ${posStr(start) satisfies string}`,
      makeSpan(start, currentPos()),
    );
  }

  // EOF トークンを追加
  const eofPos = currentPos();
  addToken("EOF", makeSpan(eofPos, eofPos));

  if (errors.length > 0) {
    return Either.left(errors);
  }
  return Either.right(tokens);
};

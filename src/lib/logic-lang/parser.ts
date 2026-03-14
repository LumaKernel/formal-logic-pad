/**
 * Logic Schema Language の Parser。
 *
 * DSL仕様（dev/logic-reference/06-dsl-specification.md）に準拠。
 * Pratt parser + 再帰下降のハイブリッド。
 *
 * 出力: logic-core の Formula / Term 型。
 *
 * 変更時は token.ts, lexer.ts, parser.test.ts も同期すること。
 */

import { Data, Either } from "effect";
import type { GreekLetter } from "../logic-core/greekLetters";
import {
  metaVariable,
  negation,
  implication,
  conjunction,
  disjunction,
  biconditional,
  universal,
  existential,
  predicate,
  equality,
  formulaSubstitution,
  freeVariableAbsence,
} from "../logic-core/formula";
import type { Formula } from "../logic-core/formula";
import {
  termVariable,
  termMetaVariable,
  constant,
  functionApplication,
  binaryOperation,
} from "../logic-core/term";
import type { BinaryOperator, Term } from "../logic-core/term";
import type { Token, TokenKind, Span, Position } from "./token";

// --- パーサーエラー ---

export class ParseError extends Data.TaggedError("ParseError")<{
  readonly message: string;
  readonly span: Span;
}> {}

// --- パース結果 ---
// Right = 成功, Left = 失敗 (errors)

export type ParseResult = Either.Either<Formula, readonly ParseError[]>;

export type TermParseResult = Either.Either<Term, readonly ParseError[]>;

// --- メタ変数の value パース ---

const parseMetaVariableValue = (
  value: string,
): { readonly name: GreekLetter; readonly subscript: string | undefined } => {
  const underscoreIdx = value.indexOf("_");
  if (underscoreIdx === -1) {
    return { name: value as GreekLetter, subscript: undefined };
  }
  return {
    name: value.slice(0, underscoreIdx) as GreekLetter,
    subscript: value.slice(underscoreIdx + 1),
  };
};

// --- 論理式の binding power ---

const formulaInfixBP = (
  kind: TokenKind,
): { readonly leftBP: number; readonly rightBP: number } | undefined => {
  switch (kind) {
    case "IFF":
      return { leftBP: 2, rightBP: 1 }; // 右結合
    case "IMPLIES":
      return { leftBP: 4, rightBP: 3 }; // 右結合
    case "OR":
      return { leftBP: 5, rightBP: 6 }; // 左結合
    case "AND":
      return { leftBP: 7, rightBP: 8 }; // 左結合
    default:
      return undefined;
  }
};

// --- 項の binding power ---

const termInfixBP = (
  kind: TokenKind,
): { readonly leftBP: number; readonly rightBP: number } | undefined => {
  switch (kind) {
    case "PLUS":
    case "MINUS":
      return { leftBP: 1, rightBP: 2 }; // 左結合
    case "TIMES":
    case "DIVIDE":
      return { leftBP: 3, rightBP: 4 }; // 左結合
    case "POWER":
      return { leftBP: 6, rightBP: 5 }; // 右結合
    default:
      return undefined;
  }
};

// --- トークン種別 → 二項演算子 ---

const tokenToBinaryOperator = (kind: TokenKind): BinaryOperator | undefined => {
  switch (kind) {
    case "PLUS":
      return "+";
    case "MINUS":
      return "-";
    case "TIMES":
      return "*";
    case "DIVIDE":
      return "/";
    case "POWER":
      return "^";
    // 防御的: termInfixBP が事前にフィルタするため到達しない
    /* v8 ignore next 2 */
    default:
      return undefined;
  }
};

// --- パーサー本体 ---

export const parse = (tokens: readonly Token[]): ParseResult => {
  const errors: ParseError[] = [];
  let pos = 0;

  // 束縛変数の追跡（ギリシャ文字が量化子で束縛されている場合にTermVariableとして解釈するため）
  const boundVariables: Set<string> = new Set();

  /* v8 ignore start -- 防御的フォールバック: pos は常に有効範囲内で ?? の右辺には到達しない */
  const peek = (): Token => tokens[pos] ?? tokens[tokens.length - 1]!;
  /* v8 ignore stop */

  const advance = (): Token => {
    const token = peek();
    // 防御的: 最後のトークン（EOF）を超えない安全ガード
    /* v8 ignore start */
    if (pos < tokens.length - 1) pos++;
    /* v8 ignore stop */
    return token;
  };

  const expect = (kind: TokenKind): Token | undefined => {
    const token = peek();
    if (token.kind === kind) {
      return advance();
    }
    addError(
      `Expected '${kindToString(kind) satisfies string}' at ${posStr(token.span.start) satisfies string}`,
      token.span,
    );
    return undefined;
  };

  const addError = (message: string, span: Span): void => {
    errors.push(new ParseError({ message, span }));
  };

  const posStr = (p: Position): string =>
    `${String(p.line) satisfies string}:${String(p.column) satisfies string}`;

  const kindToString = (kind: TokenKind): string => {
    switch (kind) {
      case "RPAREN":
        return ")";
      case "LPAREN":
        return "(";
      case "RBRACKET":
        return "]";
      // 防御的: LBRACKET は parseSubstitutionPostfix で peek() チェックされるため expect() されない
      /* v8 ignore next 2 */
      case "LBRACKET":
        return "[";
      case "DIVIDE":
        return "/";
      case "DOT":
        return ".";
      case "COMMA":
        return ",";
      case "EOF":
        return "end of input";
      default:
        return kind;
    }
  };

  // --- 論理式パース (Pratt parser) ---

  const parseFormula = (minBP: number): Formula | undefined => {
    // prefix
    let lhs = parseFormulaPrefix();
    if (lhs === undefined) return undefined;

    // postfix: 置換 [term/variable]（最高優先度、infixより先に適用）
    lhs = parseSubstitutionPostfix(lhs);

    // infix
    while (true) {
      const token = peek();

      // 等号チェック: 論理式レベルでは等号は出現しない（項レベルで処理済み）
      // ただし atom_formula → equality のパスで処理される

      const bp = formulaInfixBP(token.kind);
      if (bp === undefined) break;
      if (bp.leftBP < minBP) break;

      advance();

      const rhs = parseFormula(bp.rightBP);
      if (rhs === undefined) return undefined;

      switch (token.kind) {
        case "AND":
          lhs = conjunction(lhs, rhs);
          break;
        case "OR":
          lhs = disjunction(lhs, rhs);
          break;
        case "IMPLIES":
          lhs = implication(lhs, rhs);
          break;
        case "IFF":
          lhs = biconditional(lhs, rhs);
          break;
        // 防御的: infixBP が事前にフィルタするため到達しない
        /* v8 ignore next 2 */
        default:
          break;
      }

      // 右辺の後にも置換が続く可能性（例: (φ → ψ)[τ/x] ではなく φ → ψ[τ/x]）
      // ただし lhs 全体に対する置換は括弧が必要なので、ここでは右辺には適用しない
    }

    return lhs;
  };

  // --- 置換の postfix パース ---
  // φ[τ/x] 形式の置換をチェーン可能にパースする

  const STOP_AT_DIVIDE: ReadonlySet<TokenKind> = new Set(["DIVIDE"]);

  const parseSubstitutionPostfix = (formula: Formula): Formula => {
    let result = formula;
    while (peek().kind === "LBRACKET") {
      advance(); // LBRACKET を消費

      // [/x] パターン: LBRACKET の直後に DIVIDE → FreeVariableAbsence
      if (peek().kind === "DIVIDE") {
        advance(); // DIVIDE を消費

        // 変数をパース（LOWER_IDENT または META_VARIABLE）
        const varToken = peek();
        let varName: string;
        if (varToken.kind === "LOWER_IDENT") {
          advance();
          varName = varToken.value!;
        } else if (varToken.kind === "META_VARIABLE") {
          advance();
          varName = varToken.value!;
        } else {
          addError(
            `Expected variable after '/' in free variable absence at ${posStr(varToken.span.start) satisfies string}`,
            varToken.span,
          );
          return result;
        }

        // `]` を期待
        if (expect("RBRACKET") === undefined) return result;

        result = freeVariableAbsence(result, termVariable(varName));
        continue;
      }

      // [τ/x] パターン: 通常の置換
      // 置換項をパース（DIVIDE を項の二項演算子として消費しない）
      const term = parseTerm(0, STOP_AT_DIVIDE);
      if (term === undefined) return result;

      // `/` (DIVIDE) を期待
      if (expect("DIVIDE") === undefined) return result;

      // 置換変数をパース（LOWER_IDENT または META_VARIABLE）
      const varToken = peek();
      let varName: string;
      if (varToken.kind === "LOWER_IDENT") {
        advance();
        varName = varToken.value!;
      } else if (varToken.kind === "META_VARIABLE") {
        advance();
        varName = varToken.value!;
      } else {
        addError(
          `Expected variable after '/' in substitution at ${posStr(varToken.span.start) satisfies string}`,
          varToken.span,
        );
        return result;
      }

      // `]` を期待
      if (expect("RBRACKET") === undefined) return result;

      result = formulaSubstitution(result, term, termVariable(varName));
    }
    return result;
  };

  // --- 論理式の prefix パース ---

  const parseFormulaPrefix = (): Formula | undefined => {
    const token = peek();

    // ¬ (NOT)
    if (token.kind === "NOT") {
      advance();
      const inner = parseFormulaPrefix();
      if (inner === undefined) return undefined;
      return negation(inner);
    }

    // ∀ / ∃
    if (token.kind === "FORALL" || token.kind === "EXISTS") {
      return parseQuantified();
    }

    // atom_formula (メタ変数、述語、括弧) - 等号もここで処理
    return parseAtomFormula();
  };

  // --- 量化子 ---

  const parseQuantified = (): Formula | undefined => {
    const quantToken = advance(); // FORALL or EXISTS
    const varToken = peek();

    // 量化変数: LOWER_IDENT または META_VARIABLE（ギリシャ文字を変数として使う場合）
    let varName: string;
    if (varToken.kind === "LOWER_IDENT") {
      advance();
      varName = varToken.value!;
    } else if (varToken.kind === "META_VARIABLE") {
      // ギリシャ文字を束縛変数として使う場合（∀ζ.P(ζ)）
      advance();
      varName = varToken.value!;
      // 添字付きの場合はvalue全体を変数名として使う（"ζ_1"等）
    } else {
      addError(
        `Expected variable after '${(quantToken.kind === "FORALL" ? "∀" : "∃") satisfies string}' at ${posStr(varToken.span.start) satisfies string}`,
        varToken.span,
      );
      return undefined;
    }

    if (expect("DOT") === undefined) return undefined;

    // 束縛変数として登録してからbodyをパース
    const wasBound = boundVariables.has(varName);
    boundVariables.add(varName);

    const body = parseFormula(0);

    // 束縛変数を復元
    if (!wasBound) {
      boundVariables.delete(varName);
    }

    if (body === undefined) return undefined;

    const tv = termVariable(varName);
    return quantToken.kind === "FORALL"
      ? universal(tv, body)
      : existential(tv, body);
  };

  // --- atom_formula ---
  // メタ変数、述語、括弧、等号（項から始まる場合）

  const parseAtomFormula = (): Formula | undefined => {
    const token = peek();

    // ⊥ (falsum/bottom)
    if (token.kind === "BOTTOM") {
      advance();
      return predicate("⊥", []);
    }

    // メタ変数
    if (token.kind === "META_VARIABLE") {
      // 先読み: 項の二項演算子や等号が続く場合は等号式の可能性
      // まず項としてパースを試みる
      return parseEqualityOrMetaVariable();
    }

    // 大文字識別子 → 述語 or 等号式の左辺（項関数適用, 例: S(x) = 0）
    // バックトラッキングで述語を先に試し、等号/項演算子が続く場合は項として再パース
    if (token.kind === "UPPER_IDENT") {
      const savedPos = pos;
      const savedErrors = errors.length;

      const pred = parsePredicate();
      if (pred !== undefined) {
        const afterPred = peek();
        if (
          termInfixBP(afterPred.kind) !== undefined ||
          afterPred.kind === "EQUALS"
        ) {
          // 述語の後に等号/項演算子 → 項として再パース
          pos = savedPos;
          errors.length = savedErrors;
          return parseEqualityOrTerm();
        }
        return pred;
      }

      // 述語パースに失敗 → 項として試行
      pos = savedPos;
      errors.length = savedErrors;
      return parseEqualityOrTerm();
    }

    // 小文字識別子 or 数字 → 等号式の左辺（項）の可能性
    if (token.kind === "LOWER_IDENT" || token.kind === "NUMBER") {
      return parseEqualityOrTerm();
    }

    // 括弧
    // 括弧の中身が論理式か項かを判定する必要がある
    // (x + y) * z = x のような場合、括弧内は項式
    // (φ → ψ) のような場合、括弧内は論理式
    // バックトラッキングで対応する
    if (token.kind === "LPAREN") {
      const savedPos = pos;
      const savedErrors = errors.length;

      advance(); // LPAREN を消費
      const inner = parseFormula(0);
      if (inner !== undefined && peek().kind === "RPAREN") {
        advance(); // RPAREN を消費

        // 括弧の後ろに項演算子や等号が続く場合は、項として再パース
        const afterParen = peek();
        if (
          termInfixBP(afterParen.kind) !== undefined ||
          afterParen.kind === "EQUALS"
        ) {
          // バックトラック: 項としてパースし直す
          pos = savedPos;
          errors.length = savedErrors;
          return parseEqualityOrTerm();
        }

        return inner;
      }

      // 論理式としてのパースに失敗した場合、項としてのパースを試みる
      pos = savedPos;
      errors.length = savedErrors;

      // 項式としてパースを試みる（等号を含む）
      return parseEqualityOrTerm();
    }

    // エラー
    addError(
      `Unexpected ${kindToString(token.kind) satisfies string} at ${posStr(token.span.start) satisfies string}: expected formula`,
      token.span,
    );
    return undefined;
  };

  // --- 等号またはメタ変数 ---
  // メタ変数が出現した位置で、後続に等号や項演算子があれば等号式として扱う

  const parseEqualityOrMetaVariable = (): Formula | undefined => {
    // メタ変数を項としてパースし、後続に等号があるか確認
    const savedPos = pos;
    const term = parseTerm(0);
    // 防御的フォールバック: META_VARIABLE はparseTermAtomで処理されるため到達しない
    /* v8 ignore start */
    if (term === undefined) {
      pos = savedPos;
      // フォールバック: 単純なメタ変数として
      const token = advance();
      const { name, subscript } = parseMetaVariableValue(token.value!);
      return metaVariable(name, subscript);
    }
    /* v8 ignore stop */

    // 等号が続くか？
    if (peek().kind === "EQUALS") {
      advance();
      const rhs = parseTerm(0);
      if (rhs === undefined) return undefined;
      // 等号の連鎖チェック
      if (peek().kind === "EQUALS") {
        const eqToken = peek();
        addError(
          `Chained equality is not allowed at ${posStr(eqToken.span.start) satisfies string}`,
          eqToken.span,
        );
        return undefined;
      }
      return equality(term, rhs);
    }

    // 項演算子が続く場合は既にtermに含まれているはず
    // 等号がない場合: 項がTermMetaVariableならMetaVariableに変換
    if (term._tag === "TermMetaVariable") {
      return metaVariable(term.name, term.subscript);
    }

    // 束縛変数がTermVariableとして解釈された場合で、元がMETA_VARIABLEだった場合
    // → 論理式位置ではMetaVariableとして扱う
    if (term._tag === "TermVariable" && boundVariables.has(term.name)) {
      const { name, subscript } = parseMetaVariableValue(term.name);
      return metaVariable(name, subscript);
    }

    // 項が複合的な場合（TermMetaVariable + 二項演算等）→ 等号が必要だったはず
    addError(
      `Expected '=' or logical operator at ${posStr(peek().span.start) satisfies string}`,
      peek().span,
    );
    return undefined;
  };

  // --- 等号または項（小文字識別子/数字から始まる場合）---

  const parseEqualityOrTerm = (): Formula | undefined => {
    const term = parseTerm(0);
    if (term === undefined) return undefined;

    // 等号が続くか？
    if (peek().kind === "EQUALS") {
      advance();
      const rhs = parseTerm(0);
      if (rhs === undefined) return undefined;
      // 等号の連鎖チェック
      if (peek().kind === "EQUALS") {
        const eqToken = peek();
        addError(
          `Chained equality is not allowed at ${posStr(eqToken.span.start) satisfies string}`,
          eqToken.span,
        );
        return undefined;
      }
      return equality(term, rhs);
    }

    // 等号がなければ、単純な項だけでは論理式にならない
    // TermVariable のみの場合 → エラー
    addError(
      `Expected '=' after term at ${posStr(peek().span.start) satisfies string}`,
      peek().span,
    );
    return undefined;
  };

  // --- 述語パース ---

  const parsePredicate = (): Formula | undefined => {
    const nameToken = advance();
    const name = nameToken.value!;

    // 引数リスト（オプション）
    if (peek().kind === "LPAREN") {
      advance();
      const args = parseTermList();
      if (args === undefined) return undefined;
      if (expect("RPAREN") === undefined) return undefined;
      return predicate(name, args);
    }

    // 引数なし述語
    return predicate(name, []);
  };

  // --- 項パース (Pratt parser) ---
  // stopBefore: 指定されたトークン種別が来たらinfix演算子として消費しない（置換の `/` 区切り用）

  const parseTerm = (
    minBP: number,
    stopBefore?: ReadonlySet<TokenKind>,
  ): Term | undefined => {
    let lhs = parseTermAtom();
    if (lhs === undefined) return undefined;

    while (true) {
      const token = peek();
      if (stopBefore !== undefined && stopBefore.has(token.kind)) break;
      const bp = termInfixBP(token.kind);
      if (bp === undefined) break;
      if (bp.leftBP < minBP) break;

      advance();
      const op = tokenToBinaryOperator(token.kind)!;

      const rhs = parseTerm(bp.rightBP, stopBefore);
      if (rhs === undefined) return undefined;

      lhs = binaryOperation(op, lhs, rhs);
    }

    return lhs;
  };

  // --- 項のアトム ---

  const parseTermAtom = (): Term | undefined => {
    const token = peek();

    // メタ変数 → 束縛変数ならTermVariable、それ以外はTermMetaVariable
    if (token.kind === "META_VARIABLE") {
      advance();
      if (boundVariables.has(token.value!)) {
        return termVariable(token.value!);
      }
      const { name, subscript } = parseMetaVariableValue(token.value!);
      return termMetaVariable(name, subscript);
    }

    // 小文字識別子 → 変数 or 関数
    if (token.kind === "LOWER_IDENT") {
      advance();
      const name = token.value!;

      // 関数適用?
      if (peek().kind === "LPAREN") {
        advance();
        const args = parseTermList();
        if (args === undefined) return undefined;
        if (expect("RPAREN") === undefined) return undefined;
        return functionApplication(name, args);
      }

      return termVariable(name);
    }

    // 大文字識別子 → 項コンテキストでは関数適用 or 定数（例: S(x), O）
    if (token.kind === "UPPER_IDENT") {
      advance();
      const name = token.value!;

      if (peek().kind === "LPAREN") {
        advance();
        const args = parseTermList();
        if (args === undefined) return undefined;
        if (expect("RPAREN") === undefined) return undefined;
        return functionApplication(name, args);
      }

      return constant(name);
    }

    // 数字 → 定数
    if (token.kind === "NUMBER") {
      advance();
      return constant(token.value!);
    }

    // 括弧
    if (token.kind === "LPAREN") {
      advance();
      const inner = parseTerm(0);
      if (inner === undefined) return undefined;
      if (expect("RPAREN") === undefined) return undefined;
      return inner;
    }

    addError(
      `Unexpected ${kindToString(token.kind) satisfies string} at ${posStr(token.span.start) satisfies string}: expected term`,
      token.span,
    );
    return undefined;
  };

  // --- 項リスト（カンマ区切り） ---

  const parseTermList = (): readonly Term[] | undefined => {
    // 空リスト
    if (peek().kind === "RPAREN") {
      return [];
    }

    const terms: Term[] = [];
    const first = parseTerm(0);
    if (first === undefined) return undefined;
    terms.push(first);

    while (peek().kind === "COMMA") {
      advance();
      const next = parseTerm(0);
      if (next === undefined) return undefined;
      terms.push(next);
    }

    return terms;
  };

  // --- メインのパース ---

  const formula = parseFormula(0);
  if (formula === undefined) {
    // 防御的: parseFormulaAtom が常にエラーを追加してから undefined を返すため到達しない
    /* v8 ignore start */
    if (errors.length === 0) {
      const eof = peek();
      addError(
        `Unexpected end of input at ${posStr(eof.span.start) satisfies string}`,
        eof.span,
      );
    }
    /* v8 ignore stop */
    return Either.left(errors);
  }

  // 入力の残りチェック
  if (peek().kind !== "EOF") {
    const remaining = peek();
    addError(
      `Unexpected ${kindToString(remaining.kind) satisfies string} at ${posStr(remaining.span.start) satisfies string}: expected end of input`,
      remaining.span,
    );
    return Either.left(errors);
  }

  // 防御的: 正常パース後にエラーが残る状況は通常発生しない
  /* v8 ignore start */
  if (errors.length > 0) {
    return Either.left(errors);
  }
  /* v8 ignore stop */

  return Either.right(formula);
};

// --- 項パーサー（トークン列から） ---

export const parseTokensAsTerm = (
  tokens: readonly Token[],
): TermParseResult => {
  const errors: ParseError[] = [];
  let pos = 0;

  /* v8 ignore start -- 防御的フォールバック: pos は常に有効範囲内で ?? の右辺には到達しない */
  const peek = (): Token => tokens[pos] ?? tokens[tokens.length - 1]!;
  /* v8 ignore stop */

  const advance = (): Token => {
    const token = peek();
    // 防御的: 最後のトークン（EOF）を超えない安全ガード
    /* v8 ignore start */
    if (pos < tokens.length - 1) pos++;
    /* v8 ignore stop */
    return token;
  };

  const expect = (kind: TokenKind): Token | undefined => {
    const token = peek();
    if (token.kind === kind) {
      return advance();
    }
    addError(
      `Expected '${kindToString(kind) satisfies string}' at ${posStr(token.span.start) satisfies string}`,
      token.span,
    );
    return undefined;
  };

  const addError = (message: string, span: Span): void => {
    errors.push(new ParseError({ message, span }));
  };

  const posStr = (p: Position): string =>
    `${String(p.line) satisfies string}:${String(p.column) satisfies string}`;

  const kindToString = (kind: TokenKind): string => {
    switch (kind) {
      case "RPAREN":
        return ")";
      // 防御的: LPAREN は parseTermAtom で処理されるためエラーメッセージに出現しない
      /* v8 ignore next 2 */
      case "LPAREN":
        return "(";
      case "DOT":
        return ".";
      case "COMMA":
        return ",";
      case "EOF":
        return "end of input";
      default:
        return kind;
    }
  };

  // --- 項パース (Pratt parser) ---

  const parseTerm = (minBP: number): Term | undefined => {
    let lhs = parseTermAtom();
    if (lhs === undefined) return undefined;

    while (true) {
      const token = peek();
      const bp = termInfixBP(token.kind);
      if (bp === undefined) break;
      if (bp.leftBP < minBP) break;

      advance();
      const op = tokenToBinaryOperator(token.kind)!;

      const rhs = parseTerm(bp.rightBP);
      if (rhs === undefined) return undefined;

      lhs = binaryOperation(op, lhs, rhs);
    }

    return lhs;
  };

  // --- 項のアトム ---

  const parseTermAtom = (): Term | undefined => {
    const token = peek();

    // メタ変数 → TermMetaVariable（項パースモードでは束縛変数の追跡なし）
    if (token.kind === "META_VARIABLE") {
      advance();
      const { name, subscript } = parseMetaVariableValue(token.value!);
      return termMetaVariable(name, subscript);
    }

    // 小文字識別子 → 変数 or 関数
    if (token.kind === "LOWER_IDENT") {
      advance();
      const name = token.value!;

      // 関数適用?
      if (peek().kind === "LPAREN") {
        advance();
        const args = parseTermList();
        if (args === undefined) return undefined;
        if (expect("RPAREN") === undefined) return undefined;
        return functionApplication(name, args);
      }

      return termVariable(name);
    }

    // 大文字識別子 → 項コンテキストでは関数適用 or 定数（例: S(x), O）
    if (token.kind === "UPPER_IDENT") {
      advance();
      const name = token.value!;

      if (peek().kind === "LPAREN") {
        advance();
        const args = parseTermList();
        if (args === undefined) return undefined;
        if (expect("RPAREN") === undefined) return undefined;
        return functionApplication(name, args);
      }

      return constant(name);
    }

    // 数字 → 定数
    if (token.kind === "NUMBER") {
      advance();
      return constant(token.value!);
    }

    // 括弧
    if (token.kind === "LPAREN") {
      advance();
      const inner = parseTerm(0);
      if (inner === undefined) return undefined;
      if (expect("RPAREN") === undefined) return undefined;
      return inner;
    }

    addError(
      `Unexpected ${kindToString(token.kind) satisfies string} at ${posStr(token.span.start) satisfies string}: expected term`,
      token.span,
    );
    return undefined;
  };

  // --- 項リスト（カンマ区切り） ---

  const parseTermList = (): readonly Term[] | undefined => {
    if (peek().kind === "RPAREN") {
      return [];
    }

    const terms: Term[] = [];
    const first = parseTerm(0);
    if (first === undefined) return undefined;
    terms.push(first);

    while (peek().kind === "COMMA") {
      advance();
      const next = parseTerm(0);
      if (next === undefined) return undefined;
      terms.push(next);
    }

    return terms;
  };

  // --- メインの項パース ---

  const term = parseTerm(0);
  if (term === undefined) {
    // 防御的: parseTermAtom が常にエラーを追加してから undefined を返すため到達しない
    /* v8 ignore start */
    if (errors.length === 0) {
      const eof = peek();
      addError(
        `Unexpected end of input at ${posStr(eof.span.start) satisfies string}`,
        eof.span,
      );
    }
    /* v8 ignore stop */
    return Either.left(errors);
  }

  // 入力の残りチェック
  if (peek().kind !== "EOF") {
    const remaining = peek();
    addError(
      `Unexpected ${kindToString(remaining.kind) satisfies string} at ${posStr(remaining.span.start) satisfies string}: expected end of input`,
      remaining.span,
    );
    return Either.left(errors);
  }

  // 防御的: 正常パース後にエラーが残る状況は通常発生しない
  /* v8 ignore start */
  if (errors.length > 0) {
    return Either.left(errors);
  }
  /* v8 ignore stop */

  return Either.right(term);
};

// --- 便利関数: 文字列から直接パース ---

import { lex } from "./lexer";

export const parseString = (input: string): ParseResult => {
  const lexResult = lex(input);
  if (Either.isLeft(lexResult)) {
    return Either.left(
      lexResult.left.map(
        (e) => new ParseError({ message: e.message, span: e.span }),
      ),
    );
  }
  return parse(lexResult.right);
};

export const parseTermString = (input: string): TermParseResult => {
  const lexResult = lex(input);
  if (Either.isLeft(lexResult)) {
    return Either.left(
      lexResult.left.map(
        (e) => new ParseError({ message: e.message, span: e.span }),
      ),
    );
  }
  return parseTokensAsTerm(lexResult.right);
};

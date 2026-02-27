import { describe, expect, it } from "vitest";
import { lex } from "./lexer";
import type { Token, TokenKind } from "./token";

// ヘルパー: 成功結果からトークン列を取得
const lexOk = (input: string): readonly Token[] => {
  const result = lex(input);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error("Expected ok");
  return result.tokens;
};

// ヘルパー: トークンのkindとvalueのペア列を取得（EOF除く）
const kinds = (
  tokens: readonly Token[],
): readonly { readonly kind: TokenKind; readonly value?: string }[] =>
  tokens
    .filter((t) => t.kind !== "EOF")
    .map((t) =>
      t.value !== undefined
        ? { kind: t.kind, value: t.value }
        : { kind: t.kind },
    );

// ヘルパー: エラー結果を取得
const lexErr = (input: string) => {
  const result = lex(input);
  expect(result.ok).toBe(false);
  if (result.ok) throw new Error("Expected error");
  return result.errors;
};

describe("Lexer", () => {
  // --- 空入力・空白 ---

  describe("empty and whitespace", () => {
    it("should produce only EOF for empty input", () => {
      const tokens = lexOk("");
      expect(tokens).toHaveLength(1);
      expect(tokens[0]!.kind).toBe("EOF");
    });

    it("should skip whitespace", () => {
      const tokens = lexOk("   \t\n  ");
      expect(tokens).toHaveLength(1);
      expect(tokens[0]!.kind).toBe("EOF");
    });
  });

  // --- Unicode論理演算子 ---

  describe("Unicode logical operators", () => {
    it("should lex ¬", () => {
      expect(kinds(lexOk("¬"))).toEqual([{ kind: "NOT" }]);
    });

    it("should lex ∧", () => {
      expect(kinds(lexOk("∧"))).toEqual([{ kind: "AND" }]);
    });

    it("should lex ∨", () => {
      expect(kinds(lexOk("∨"))).toEqual([{ kind: "OR" }]);
    });

    it("should lex →", () => {
      expect(kinds(lexOk("→"))).toEqual([{ kind: "IMPLIES" }]);
    });

    it("should lex ↔", () => {
      expect(kinds(lexOk("↔"))).toEqual([{ kind: "IFF" }]);
    });
  });

  // --- ASCII論理演算子 ---

  describe("ASCII logical operators", () => {
    it("should lex ~", () => {
      expect(kinds(lexOk("~"))).toEqual([{ kind: "NOT" }]);
    });

    it("should lex /\\", () => {
      expect(kinds(lexOk("/\\"))).toEqual([{ kind: "AND" }]);
    });

    it("should lex \\/", () => {
      expect(kinds(lexOk("\\/"))).toEqual([{ kind: "OR" }]);
    });

    it("should lex ->", () => {
      expect(kinds(lexOk("->"))).toEqual([{ kind: "IMPLIES" }]);
    });

    it("should lex <->", () => {
      expect(kinds(lexOk("<->"))).toEqual([{ kind: "IFF" }]);
    });

    it("should lex keyword not", () => {
      expect(kinds(lexOk("not"))).toEqual([{ kind: "NOT" }]);
    });

    it("should lex keyword and", () => {
      expect(kinds(lexOk("and"))).toEqual([{ kind: "AND" }]);
    });

    it("should lex keyword or", () => {
      expect(kinds(lexOk("or"))).toEqual([{ kind: "OR" }]);
    });

    it("should lex keyword implies", () => {
      expect(kinds(lexOk("implies"))).toEqual([{ kind: "IMPLIES" }]);
    });

    it("should lex keyword iff", () => {
      expect(kinds(lexOk("iff"))).toEqual([{ kind: "IFF" }]);
    });
  });

  // --- 量化子 ---

  describe("quantifiers", () => {
    it("should lex ∀", () => {
      expect(kinds(lexOk("∀"))).toEqual([{ kind: "FORALL" }]);
    });

    it("should lex ∃", () => {
      expect(kinds(lexOk("∃"))).toEqual([{ kind: "EXISTS" }]);
    });

    it("should lex keyword all", () => {
      expect(kinds(lexOk("all"))).toEqual([{ kind: "FORALL" }]);
    });

    it("should lex keyword forall", () => {
      expect(kinds(lexOk("forall"))).toEqual([{ kind: "FORALL" }]);
    });

    it("should lex keyword ex", () => {
      expect(kinds(lexOk("ex"))).toEqual([{ kind: "EXISTS" }]);
    });

    it("should lex keyword exists", () => {
      expect(kinds(lexOk("exists"))).toEqual([{ kind: "EXISTS" }]);
    });
  });

  // --- 等号 ---

  describe("equals", () => {
    it("should lex =", () => {
      expect(kinds(lexOk("="))).toEqual([{ kind: "EQUALS" }]);
    });
  });

  // --- 項の二項演算子 ---

  describe("term binary operators", () => {
    it("should lex +", () => {
      expect(kinds(lexOk("+"))).toEqual([{ kind: "PLUS" }]);
    });

    it("should lex ASCII -", () => {
      expect(kinds(lexOk("-"))).toEqual([{ kind: "MINUS" }]);
    });

    it("should lex Unicode − (U+2212)", () => {
      expect(kinds(lexOk("\u2212"))).toEqual([{ kind: "MINUS" }]);
    });

    it("should lex ASCII *", () => {
      expect(kinds(lexOk("*"))).toEqual([{ kind: "TIMES" }]);
    });

    it("should lex Unicode × (U+00D7)", () => {
      expect(kinds(lexOk("\u00D7"))).toEqual([{ kind: "TIMES" }]);
    });

    it("should lex ASCII / (without following \\)", () => {
      expect(kinds(lexOk("/ "))).toEqual([{ kind: "DIVIDE" }]);
    });

    it("should lex Unicode ÷ (U+00F7)", () => {
      expect(kinds(lexOk("\u00F7"))).toEqual([{ kind: "DIVIDE" }]);
    });

    it("should lex ^", () => {
      expect(kinds(lexOk("^"))).toEqual([{ kind: "POWER" }]);
    });
  });

  // --- 区切り文字 ---

  describe("delimiters", () => {
    it("should lex (", () => {
      expect(kinds(lexOk("("))).toEqual([{ kind: "LPAREN" }]);
    });

    it("should lex )", () => {
      expect(kinds(lexOk(")"))).toEqual([{ kind: "RPAREN" }]);
    });

    it("should lex [", () => {
      expect(kinds(lexOk("["))).toEqual([{ kind: "LBRACKET" }]);
    });

    it("should lex ]", () => {
      expect(kinds(lexOk("]"))).toEqual([{ kind: "RBRACKET" }]);
    });

    it("should lex .", () => {
      expect(kinds(lexOk("."))).toEqual([{ kind: "DOT" }]);
    });

    it("should lex ,", () => {
      expect(kinds(lexOk(","))).toEqual([{ kind: "COMMA" }]);
    });
  });

  // --- メタ変数 (Unicode直接入力) ---

  describe("meta variables (Unicode)", () => {
    it("should lex φ", () => {
      expect(kinds(lexOk("φ"))).toEqual([
        { kind: "META_VARIABLE", value: "φ" },
      ]);
    });

    it("should lex ψ", () => {
      expect(kinds(lexOk("ψ"))).toEqual([
        { kind: "META_VARIABLE", value: "ψ" },
      ]);
    });

    it("should lex χ", () => {
      expect(kinds(lexOk("χ"))).toEqual([
        { kind: "META_VARIABLE", value: "χ" },
      ]);
    });

    it("should lex all greek letters", () => {
      const greeks = [
        "α",
        "β",
        "γ",
        "δ",
        "ε",
        "ζ",
        "η",
        "θ",
        "ι",
        "κ",
        "λ",
        "μ",
        "ν",
        "ξ",
        "π",
        "ρ",
        "σ",
        "τ",
        "υ",
        "φ",
        "χ",
        "ψ",
        "ω",
      ];
      for (const g of greeks) {
        const tokens = lexOk(g);
        expect(kinds(tokens)).toEqual([{ kind: "META_VARIABLE", value: g }]);
      }
    });

    it("should lex φ with digit subscript", () => {
      expect(kinds(lexOk("φ1"))).toEqual([
        { kind: "META_VARIABLE", value: "φ_1" },
      ]);
    });

    it("should lex φ with 2-digit subscript", () => {
      expect(kinds(lexOk("φ01"))).toEqual([
        { kind: "META_VARIABLE", value: "φ_01" },
      ]);
    });

    it("should lex φ with 3-digit subscript", () => {
      expect(kinds(lexOk("φ123"))).toEqual([
        { kind: "META_VARIABLE", value: "φ_123" },
      ]);
    });

    it("should lex φ with Unicode subscript digits", () => {
      expect(kinds(lexOk("φ₁"))).toEqual([
        { kind: "META_VARIABLE", value: "φ_1" },
      ]);
    });

    it("should lex φ with multi-digit Unicode subscript", () => {
      expect(kinds(lexOk("φ₀₁"))).toEqual([
        { kind: "META_VARIABLE", value: "φ_01" },
      ]);
    });

    it("should distinguish φ1 and φ01", () => {
      const t1 = lexOk("φ1");
      const t2 = lexOk("φ01");
      expect(kinds(t1)[0]!.value).toBe("φ_1");
      expect(kinds(t2)[0]!.value).toBe("φ_01");
      expect(kinds(t1)[0]!.value).not.toBe(kinds(t2)[0]!.value);
    });
  });

  // --- メタ変数 (ASCII名入力) ---

  describe("meta variables (ASCII name)", () => {
    it("should lex phi", () => {
      expect(kinds(lexOk("phi"))).toEqual([
        { kind: "META_VARIABLE", value: "φ" },
      ]);
    });

    it("should lex psi", () => {
      expect(kinds(lexOk("psi"))).toEqual([
        { kind: "META_VARIABLE", value: "ψ" },
      ]);
    });

    it("should lex chi", () => {
      expect(kinds(lexOk("chi"))).toEqual([
        { kind: "META_VARIABLE", value: "χ" },
      ]);
    });

    it("should lex phi1", () => {
      expect(kinds(lexOk("phi1"))).toEqual([
        { kind: "META_VARIABLE", value: "φ_1" },
      ]);
    });

    it("should lex phi_1", () => {
      expect(kinds(lexOk("phi_1"))).toEqual([
        { kind: "META_VARIABLE", value: "φ_1" },
      ]);
    });

    it("should lex phi01", () => {
      expect(kinds(lexOk("phi01"))).toEqual([
        { kind: "META_VARIABLE", value: "φ_01" },
      ]);
    });

    it("should lex phi_01", () => {
      expect(kinds(lexOk("phi_01"))).toEqual([
        { kind: "META_VARIABLE", value: "φ_01" },
      ]);
    });

    it("phi1 and phi_1 should be the same", () => {
      const t1 = lexOk("phi1");
      const t2 = lexOk("phi_1");
      expect(kinds(t1)[0]!.value).toBe(kinds(t2)[0]!.value);
    });

    it("phi1 and phi01 should be different", () => {
      const t1 = lexOk("phi1");
      const t2 = lexOk("phi01");
      expect(kinds(t1)[0]!.value).not.toBe(kinds(t2)[0]!.value);
    });

    it("should lex all greek letter ASCII names", () => {
      const names = [
        "alpha",
        "beta",
        "gamma",
        "delta",
        "epsilon",
        "zeta",
        "eta",
        "theta",
        "iota",
        "kappa",
        "lambda",
        "mu",
        "nu",
        "xi",
        "pi",
        "rho",
        "sigma",
        "tau",
        "upsilon",
        "phi",
        "chi",
        "psi",
        "omega",
      ];
      const expected = [
        "α",
        "β",
        "γ",
        "δ",
        "ε",
        "ζ",
        "η",
        "θ",
        "ι",
        "κ",
        "λ",
        "μ",
        "ν",
        "ξ",
        "π",
        "ρ",
        "σ",
        "τ",
        "υ",
        "φ",
        "χ",
        "ψ",
        "ω",
      ];
      for (let i = 0; i < names.length; i++) {
        expect(kinds(lexOk(names[i]!))[0]!.value).toBe(expected[i]);
      }
    });
  });

  // --- 識別子 ---

  describe("identifiers", () => {
    it("should lex uppercase identifier as UPPER_IDENT", () => {
      expect(kinds(lexOk("P"))).toEqual([{ kind: "UPPER_IDENT", value: "P" }]);
    });

    it("should lex multi-char uppercase identifier", () => {
      expect(kinds(lexOk("Rel"))).toEqual([
        { kind: "UPPER_IDENT", value: "Rel" },
      ]);
    });

    it("should lex lowercase identifier as LOWER_IDENT", () => {
      expect(kinds(lexOk("x"))).toEqual([{ kind: "LOWER_IDENT", value: "x" }]);
    });

    it("should lex multi-char lowercase identifier", () => {
      expect(kinds(lexOk("zero"))).toEqual([
        { kind: "LOWER_IDENT", value: "zero" },
      ]);
    });

    it("should lex identifier with digits", () => {
      expect(kinds(lexOk("x1"))).toEqual([
        { kind: "LOWER_IDENT", value: "x1" },
      ]);
    });

    it("should lex identifier with underscore", () => {
      expect(kinds(lexOk("my_var"))).toEqual([
        { kind: "LOWER_IDENT", value: "my_var" },
      ]);
    });

    it("should not confuse 'phid' with phi", () => {
      // "phid" はギリシャ文字名 "phi" + "d" として分解しない
      expect(kinds(lexOk("phid"))).toEqual([
        { kind: "LOWER_IDENT", value: "phid" },
      ]);
    });

    it("should not confuse 'existing' with 'ex'", () => {
      // "existing" は "ex" キーワードではなく LOWER_IDENT
      expect(kinds(lexOk("existing"))).toEqual([
        { kind: "LOWER_IDENT", value: "existing" },
      ]);
    });

    it("should not confuse 'notably' with 'not'", () => {
      expect(kinds(lexOk("notably"))).toEqual([
        { kind: "LOWER_IDENT", value: "notably" },
      ]);
    });

    it("should not confuse 'alloy' with 'all'", () => {
      expect(kinds(lexOk("alloy"))).toEqual([
        { kind: "LOWER_IDENT", value: "alloy" },
      ]);
    });

    it("should not confuse 'android' with 'and'", () => {
      expect(kinds(lexOk("android"))).toEqual([
        { kind: "LOWER_IDENT", value: "android" },
      ]);
    });

    it("should not confuse 'oracle' with 'or'", () => {
      expect(kinds(lexOk("oracle"))).toEqual([
        { kind: "LOWER_IDENT", value: "oracle" },
      ]);
    });
  });

  // --- 数字リテラル ---

  describe("number literals", () => {
    it("should lex single digit", () => {
      expect(kinds(lexOk("0"))).toEqual([{ kind: "NUMBER", value: "0" }]);
    });

    it("should lex multi-digit number", () => {
      expect(kinds(lexOk("42"))).toEqual([{ kind: "NUMBER", value: "42" }]);
    });

    it("should lex large number", () => {
      expect(kinds(lexOk("12345"))).toEqual([
        { kind: "NUMBER", value: "12345" },
      ]);
    });
  });

  // --- 位置情報 ---

  describe("position tracking", () => {
    it("should track single-line positions", () => {
      const tokens = lexOk("φ → ψ");
      expect(tokens[0]!.span.start).toEqual({ line: 1, column: 1 });
      expect(tokens[1]!.span.start).toEqual({ line: 1, column: 3 });
      expect(tokens[2]!.span.start).toEqual({ line: 1, column: 5 });
    });

    it("should track multi-line positions", () => {
      const tokens = lexOk("φ\n→\nψ");
      expect(tokens[0]!.span.start).toEqual({ line: 1, column: 1 });
      expect(tokens[1]!.span.start).toEqual({ line: 2, column: 1 });
      expect(tokens[2]!.span.start).toEqual({ line: 3, column: 1 });
    });

    it("should track positions with tabs", () => {
      const tokens = lexOk("\tφ");
      expect(tokens[0]!.span.start).toEqual({ line: 1, column: 2 });
    });
  });

  // --- 複合入力 ---

  describe("compound expressions", () => {
    it("should lex φ → φ", () => {
      expect(kinds(lexOk("φ → φ"))).toEqual([
        { kind: "META_VARIABLE", value: "φ" },
        { kind: "IMPLIES" },
        { kind: "META_VARIABLE", value: "φ" },
      ]);
    });

    it("should lex phi -> phi", () => {
      expect(kinds(lexOk("phi -> phi"))).toEqual([
        { kind: "META_VARIABLE", value: "φ" },
        { kind: "IMPLIES" },
        { kind: "META_VARIABLE", value: "φ" },
      ]);
    });

    it("should lex ∀x. P(x) → Q(x)", () => {
      expect(kinds(lexOk("∀x. P(x) → Q(x)"))).toEqual([
        { kind: "FORALL" },
        { kind: "LOWER_IDENT", value: "x" },
        { kind: "DOT" },
        { kind: "UPPER_IDENT", value: "P" },
        { kind: "LPAREN" },
        { kind: "LOWER_IDENT", value: "x" },
        { kind: "RPAREN" },
        { kind: "IMPLIES" },
        { kind: "UPPER_IDENT", value: "Q" },
        { kind: "LPAREN" },
        { kind: "LOWER_IDENT", value: "x" },
        { kind: "RPAREN" },
      ]);
    });

    it("should lex f(x) + g(y) = h(z)", () => {
      expect(kinds(lexOk("f(x) + g(y) = h(z)"))).toEqual([
        { kind: "LOWER_IDENT", value: "f" },
        { kind: "LPAREN" },
        { kind: "LOWER_IDENT", value: "x" },
        { kind: "RPAREN" },
        { kind: "PLUS" },
        { kind: "LOWER_IDENT", value: "g" },
        { kind: "LPAREN" },
        { kind: "LOWER_IDENT", value: "y" },
        { kind: "RPAREN" },
        { kind: "EQUALS" },
        { kind: "LOWER_IDENT", value: "h" },
        { kind: "LPAREN" },
        { kind: "LOWER_IDENT", value: "z" },
        { kind: "RPAREN" },
      ]);
    });

    it("should lex ∀x. x + 0 = x", () => {
      expect(kinds(lexOk("∀x. x + 0 = x"))).toEqual([
        { kind: "FORALL" },
        { kind: "LOWER_IDENT", value: "x" },
        { kind: "DOT" },
        { kind: "LOWER_IDENT", value: "x" },
        { kind: "PLUS" },
        { kind: "NUMBER", value: "0" },
        { kind: "EQUALS" },
        { kind: "LOWER_IDENT", value: "x" },
      ]);
    });

    it("should lex ¬P(x) ∨ Q(x, y)", () => {
      expect(kinds(lexOk("¬P(x) ∨ Q(x, y)"))).toEqual([
        { kind: "NOT" },
        { kind: "UPPER_IDENT", value: "P" },
        { kind: "LPAREN" },
        { kind: "LOWER_IDENT", value: "x" },
        { kind: "RPAREN" },
        { kind: "OR" },
        { kind: "UPPER_IDENT", value: "Q" },
        { kind: "LPAREN" },
        { kind: "LOWER_IDENT", value: "x" },
        { kind: "COMMA" },
        { kind: "LOWER_IDENT", value: "y" },
        { kind: "RPAREN" },
      ]);
    });

    it("should lex x ^ y ^ z", () => {
      expect(kinds(lexOk("x ^ y ^ z"))).toEqual([
        { kind: "LOWER_IDENT", value: "x" },
        { kind: "POWER" },
        { kind: "LOWER_IDENT", value: "y" },
        { kind: "POWER" },
        { kind: "LOWER_IDENT", value: "z" },
      ]);
    });

    it("should lex (φ → ψ) → (φ → χ) → (φ → (ψ → χ))", () => {
      const tokens = lexOk("(φ → ψ) → (φ → χ) → (φ → (ψ → χ))");
      const k = kinds(tokens);
      expect(k[0]).toEqual({ kind: "LPAREN" });
      expect(k[1]).toEqual({ kind: "META_VARIABLE", value: "φ" });
      expect(k[2]).toEqual({ kind: "IMPLIES" });
      expect(k[3]).toEqual({ kind: "META_VARIABLE", value: "ψ" });
      expect(k[4]).toEqual({ kind: "RPAREN" });
      expect(k[5]).toEqual({ kind: "IMPLIES" });
    });

    it("should lex P(f(x, g(y)), z)", () => {
      expect(kinds(lexOk("P(f(x, g(y)), z)"))).toEqual([
        { kind: "UPPER_IDENT", value: "P" },
        { kind: "LPAREN" },
        { kind: "LOWER_IDENT", value: "f" },
        { kind: "LPAREN" },
        { kind: "LOWER_IDENT", value: "x" },
        { kind: "COMMA" },
        { kind: "LOWER_IDENT", value: "g" },
        { kind: "LPAREN" },
        { kind: "LOWER_IDENT", value: "y" },
        { kind: "RPAREN" },
        { kind: "RPAREN" },
        { kind: "COMMA" },
        { kind: "LOWER_IDENT", value: "z" },
        { kind: "RPAREN" },
      ]);
    });

    it("should lex all x. P(x) and exists y. Q(y)", () => {
      expect(kinds(lexOk("all x. P(x) and exists y. Q(y)"))).toEqual([
        { kind: "FORALL" },
        { kind: "LOWER_IDENT", value: "x" },
        { kind: "DOT" },
        { kind: "UPPER_IDENT", value: "P" },
        { kind: "LPAREN" },
        { kind: "LOWER_IDENT", value: "x" },
        { kind: "RPAREN" },
        { kind: "AND" },
        { kind: "EXISTS" },
        { kind: "LOWER_IDENT", value: "y" },
        { kind: "DOT" },
        { kind: "UPPER_IDENT", value: "Q" },
        { kind: "LPAREN" },
        { kind: "LOWER_IDENT", value: "y" },
        { kind: "RPAREN" },
      ]);
    });

    it("should lex φ[τ/x] substitution syntax", () => {
      expect(kinds(lexOk("φ[τ/x]"))).toEqual([
        { kind: "META_VARIABLE", value: "φ" },
        { kind: "LBRACKET" },
        { kind: "META_VARIABLE", value: "τ" },
        { kind: "DIVIDE" },
        { kind: "LOWER_IDENT", value: "x" },
        { kind: "RBRACKET" },
      ]);
    });

    it("should lex mixed ASCII and Unicode operators", () => {
      expect(kinds(lexOk("~phi /\\ psi \\/ chi -> phi1 <-> phi_01"))).toEqual([
        { kind: "NOT" },
        { kind: "META_VARIABLE", value: "φ" },
        { kind: "AND" },
        { kind: "META_VARIABLE", value: "ψ" },
        { kind: "OR" },
        { kind: "META_VARIABLE", value: "χ" },
        { kind: "IMPLIES" },
        { kind: "META_VARIABLE", value: "φ_1" },
        { kind: "IFF" },
        { kind: "META_VARIABLE", value: "φ_01" },
      ]);
    });
  });

  // --- `-` と `->` の区別 ---

  describe("minus vs implies disambiguation", () => {
    it("should lex -> as IMPLIES", () => {
      expect(kinds(lexOk("->"))).toEqual([{ kind: "IMPLIES" }]);
    });

    it("should lex - followed by non-> as MINUS", () => {
      expect(kinds(lexOk("x - y"))).toEqual([
        { kind: "LOWER_IDENT", value: "x" },
        { kind: "MINUS" },
        { kind: "LOWER_IDENT", value: "y" },
      ]);
    });

    it("should lex - at end of input as MINUS", () => {
      const tokens = lexOk("x -");
      const k = kinds(tokens);
      expect(k[1]).toEqual({ kind: "MINUS" });
    });
  });

  // --- `/` と `/\\` の区別 ---

  describe("divide vs and disambiguation", () => {
    it("should lex /\\ as AND", () => {
      expect(kinds(lexOk("/\\"))).toEqual([{ kind: "AND" }]);
    });

    it("should lex / followed by non-\\ as DIVIDE", () => {
      expect(kinds(lexOk("x / y"))).toEqual([
        { kind: "LOWER_IDENT", value: "x" },
        { kind: "DIVIDE" },
        { kind: "LOWER_IDENT", value: "y" },
      ]);
    });
  });

  // --- エラーケース ---

  describe("error cases", () => {
    it("should report unexpected character", () => {
      const errors = lexErr("φ § ψ");
      expect(errors).toHaveLength(1);
      expect(errors[0]!.message).toContain("§");
      expect(errors[0]!.message).toContain("Unexpected character");
    });

    it("should report subscript too long for Unicode Greek", () => {
      const errors = lexErr("φ1234");
      expect(errors).toHaveLength(1);
      expect(errors[0]!.message).toContain("Subscript too long");
      expect(errors[0]!.message).toContain("maximum 3 digits");
    });

    it("should report subscript too long for ASCII Greek", () => {
      const errors = lexErr("phi1234");
      expect(errors).toHaveLength(1);
      expect(errors[0]!.message).toContain("Subscript too long");
      expect(errors[0]!.message).toContain("maximum 3 digits");
    });

    it("should report subscript too long for Unicode subscript digits", () => {
      const errors = lexErr("φ₁₂₃₄");
      expect(errors).toHaveLength(1);
      expect(errors[0]!.message).toContain("Subscript too long");
    });

    it("should report error position", () => {
      const errors = lexErr("φ § ψ");
      expect(errors[0]!.span.start.line).toBe(1);
      expect(errors[0]!.span.start.column).toBe(3);
    });

    it("should report multiple errors", () => {
      const errors = lexErr("§ £");
      expect(errors.length).toBeGreaterThanOrEqual(2);
    });
  });

  // --- EOF ---

  describe("EOF token", () => {
    it("should always have EOF at end", () => {
      const tokens = lexOk("φ");
      expect(tokens[tokens.length - 1]!.kind).toBe("EOF");
    });

    it("should have correct position for EOF", () => {
      const tokens = lexOk("φ");
      const eof = tokens[tokens.length - 1]!;
      expect(eof.span.start.line).toBe(1);
    });
  });

  // --- 量化変数の区別: ギリシャ文字をboundとして使うケース ---

  describe("greek letters as bound variables in quantifiers", () => {
    it("should lex ∀ζ. P(ζ) correctly", () => {
      // ζ は量化子の直後では LOWER_IDENT ではなく META_VARIABLE としてlexされる
      // パーサー側で文脈に応じてTermVariableとして扱う
      expect(kinds(lexOk("∀ζ. P(ζ)"))).toEqual([
        { kind: "FORALL" },
        { kind: "META_VARIABLE", value: "ζ" },
        { kind: "DOT" },
        { kind: "UPPER_IDENT", value: "P" },
        { kind: "LPAREN" },
        { kind: "META_VARIABLE", value: "ζ" },
        { kind: "RPAREN" },
      ]);
    });
  });

  // --- 追加の添字テスト ---

  describe("subscript edge cases", () => {
    it("should lex phi with trailing identifier after subscript as separate tokens", () => {
      // "phi1 x" → META_VARIABLE("φ_1") + LOWER_IDENT("x")
      expect(kinds(lexOk("phi1 x"))).toEqual([
        { kind: "META_VARIABLE", value: "φ_1" },
        { kind: "LOWER_IDENT", value: "x" },
      ]);
    });

    it("should lex phi_001 correctly", () => {
      expect(kinds(lexOk("phi_001"))).toEqual([
        { kind: "META_VARIABLE", value: "φ_001" },
      ]);
    });

    it("should lex φ₀ correctly", () => {
      expect(kinds(lexOk("φ₀"))).toEqual([
        { kind: "META_VARIABLE", value: "φ_0" },
      ]);
    });

    it("should lex multiple meta variables with subscripts", () => {
      expect(kinds(lexOk("φ1 → ψ2"))).toEqual([
        { kind: "META_VARIABLE", value: "φ_1" },
        { kind: "IMPLIES" },
        { kind: "META_VARIABLE", value: "ψ_2" },
      ]);
    });

    it("should lex ASCII greek name with trailing Unicode subscript (phi₁)", () => {
      // "phi" は完全一致で読み取られ、直後のUnicode下付き数字が添字になる
      expect(kinds(lexOk("phi₁"))).toEqual([
        { kind: "META_VARIABLE", value: "φ_1" },
      ]);
    });

    it("should lex ASCII greek name with trailing Unicode multi-digit subscript", () => {
      expect(kinds(lexOk("psi₀₁"))).toEqual([
        { kind: "META_VARIABLE", value: "ψ_01" },
      ]);
    });

    it("should treat phi_ (underscore only, no digits) as LOWER_IDENT", () => {
      expect(kinds(lexOk("phi_"))).toEqual([
        { kind: "LOWER_IDENT", value: "phi_" },
      ]);
    });

    it("should treat phi_a (underscore + non-digit) as LOWER_IDENT", () => {
      expect(kinds(lexOk("phi_a"))).toEqual([
        { kind: "LOWER_IDENT", value: "phi_a" },
      ]);
    });
  });
});

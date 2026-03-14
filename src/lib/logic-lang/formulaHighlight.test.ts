import { describe, expect, it } from "vitest";
import {
  biconditional,
  conjunction,
  disjunction,
  equality,
  existential,
  freeVariableAbsence,
  formulaSubstitution,
  implication,
  metaVariable,
  negation,
  predicate,
  universal,
} from "../logic-core/formula";
import {
  binaryOperation,
  constant,
  functionApplication,
  termMetaVariable,
  termVariable,
} from "../logic-core/term";
import { formatFormula, formatTerm } from "./formatUnicode";
import {
  tokenizeFormula,
  tokenizeTerm,
  tokenizeDslInput,
  tokensToText,
} from "./formulaHighlight";
import type { FormulaToken, FormulaTokenKind } from "./formulaHighlight";

/** トークン配列から種別だけ抽出 */
const kinds = (tokens: readonly FormulaToken[]): readonly FormulaTokenKind[] =>
  tokens.map((t) => t.kind);

describe("formulaHighlight", () => {
  describe("tokenizeFormula — テキスト一致検証", () => {
    it.each([
      ["メタ変数", metaVariable("φ")],
      ["添字付きメタ変数", metaVariable("φ", "1")],
      ["否定", negation(metaVariable("φ"))],
      ["含意", implication(metaVariable("φ"), metaVariable("ψ"))],
      ["連言", conjunction(metaVariable("φ"), metaVariable("ψ"))],
      ["選言", disjunction(metaVariable("φ"), metaVariable("ψ"))],
      ["双条件", biconditional(metaVariable("φ"), metaVariable("ψ"))],
      ["全称量化", universal(termVariable("x"), metaVariable("φ"))],
      ["存在量化", existential(termVariable("x"), metaVariable("φ"))],
      ["述語 P(x, y)", predicate("P", [termVariable("x"), termVariable("y")])],
      ["0引数述語 P", predicate("P", [])],
      ["等号 x = y", equality(termVariable("x"), termVariable("y"))],
      [
        "複合式 (φ → ψ) ∧ χ",
        conjunction(
          implication(metaVariable("φ"), metaVariable("ψ")),
          metaVariable("χ"),
        ),
      ],
      [
        "右結合含意 φ → ψ → χ",
        implication(
          metaVariable("φ"),
          implication(metaVariable("ψ"), metaVariable("χ")),
        ),
      ],
      [
        "量化子+連言 (∀ζ.P(ζ)) ∧ (∃ξ.Q(ξ))",
        conjunction(
          universal(termVariable("ζ"), predicate("P", [termVariable("ζ")])),
          existential(termVariable("ξ"), predicate("Q", [termVariable("ξ")])),
        ),
      ],
      [
        "否定+複合 ¬(φ → ψ)",
        negation(implication(metaVariable("φ"), metaVariable("ψ"))),
      ],
      [
        "等号+二項演算 f(x) + g(y) = h(z)",
        equality(
          binaryOperation(
            "+",
            functionApplication("f", [termVariable("x")]),
            functionApplication("g", [termVariable("y")]),
          ),
          functionApplication("h", [termVariable("z")]),
        ),
      ],
      [
        "全称量化+等号 ∀x.x + 0 = x",
        universal(
          termVariable("x"),
          equality(
            binaryOperation("+", termVariable("x"), constant("0")),
            termVariable("x"),
          ),
        ),
      ],
      [
        "論理式代入 φ[τ/x]",
        formulaSubstitution(
          metaVariable("φ"),
          termVariable("τ"),
          termVariable("x"),
        ),
      ],
      [
        "複合式代入 (φ → ψ)[τ/x]",
        formulaSubstitution(
          implication(metaVariable("φ"), metaVariable("ψ")),
          termVariable("τ"),
          termVariable("x"),
        ),
      ],
      [
        "自由変数不在 φ[/x]",
        freeVariableAbsence(metaVariable("φ"), termVariable("x")),
      ],
      [
        "チェイン自由変数不在 φ[/x][/y]",
        freeVariableAbsence(
          freeVariableAbsence(metaVariable("φ"), termVariable("x")),
          termVariable("y"),
        ),
      ],
    ] as const)("%s: tokensToText === formatFormula", (_name, formula) => {
      const tokens = tokenizeFormula(formula);
      expect(tokensToText(tokens)).toBe(formatFormula(formula));
    });
  });

  describe("tokenizeFormula — トークン種別", () => {
    it("メタ変数は metaVariable", () => {
      const tokens = tokenizeFormula(metaVariable("φ"));
      expect(kinds(tokens)).toEqual(["metaVariable"]);
    });

    it("添字付きメタ変数は metaVariable + subscript", () => {
      const tokens = tokenizeFormula(metaVariable("φ", "1"));
      expect(kinds(tokens)).toEqual(["metaVariable", "subscript"]);
    });

    it("否定は negation + inner", () => {
      const tokens = tokenizeFormula(negation(metaVariable("φ")));
      expect(kinds(tokens)).toEqual(["negation", "metaVariable"]);
    });

    it("含意は left + punctuation(space) + connective + punctuation(space) + right", () => {
      const tokens = tokenizeFormula(
        implication(metaVariable("φ"), metaVariable("ψ")),
      );
      expect(kinds(tokens)).toEqual([
        "metaVariable",
        "punctuation",
        "connective",
        "punctuation",
        "metaVariable",
      ]);
      expect(tokens[2]?.text).toBe("→");
    });

    it("連言のconnectiveは ∧", () => {
      const tokens = tokenizeFormula(
        conjunction(metaVariable("φ"), metaVariable("ψ")),
      );
      const connectives = tokens.filter((t) => t.kind === "connective");
      expect(connectives).toHaveLength(1);
      expect(connectives[0]?.text).toBe("∧");
    });

    it("選言のconnectiveは ∨", () => {
      const tokens = tokenizeFormula(
        disjunction(metaVariable("φ"), metaVariable("ψ")),
      );
      const connectives = tokens.filter((t) => t.kind === "connective");
      expect(connectives[0]?.text).toBe("∨");
    });

    it("双条件のconnectiveは ↔", () => {
      const tokens = tokenizeFormula(
        biconditional(metaVariable("φ"), metaVariable("ψ")),
      );
      const connectives = tokens.filter((t) => t.kind === "connective");
      expect(connectives[0]?.text).toBe("↔");
    });

    it("全称量化は quantifier + variable + punctuation(.) + body", () => {
      const tokens = tokenizeFormula(
        universal(termVariable("x"), metaVariable("φ")),
      );
      expect(kinds(tokens)).toEqual([
        "quantifier",
        "variable",
        "punctuation",
        "metaVariable",
      ]);
      expect(tokens[0]?.text).toBe("∀");
    });

    it("存在量化は quantifier + variable + punctuation(.) + body", () => {
      const tokens = tokenizeFormula(
        existential(termVariable("x"), metaVariable("φ")),
      );
      expect(tokens[0]?.text).toBe("∃");
      expect(tokens[0]?.kind).toBe("quantifier");
    });

    it("述語は predicate + punctuation + variable系 + punctuation", () => {
      const tokens = tokenizeFormula(
        predicate("P", [termVariable("x"), termVariable("y")]),
      );
      expect(tokens[0]).toEqual({ text: "P", kind: "predicate" });
      expect(tokens[1]).toEqual({ text: "(", kind: "punctuation" });
      expect(tokens[2]).toEqual({ text: "x", kind: "variable" });
      expect(tokens[3]).toEqual({ text: ", ", kind: "punctuation" });
      expect(tokens[4]).toEqual({ text: "y", kind: "variable" });
      expect(tokens[5]).toEqual({ text: ")", kind: "punctuation" });
    });

    it("0引数述語はpredicateのみ", () => {
      const tokens = tokenizeFormula(predicate("P", []));
      expect(tokens).toEqual([{ text: "P", kind: "predicate" }]);
    });

    it("等号は term + punctuation + equality + punctuation + term", () => {
      const tokens = tokenizeFormula(
        equality(termVariable("x"), termVariable("y")),
      );
      expect(kinds(tokens)).toEqual([
        "variable",
        "punctuation",
        "equality",
        "punctuation",
        "variable",
      ]);
      expect(tokens[2]?.text).toBe("=");
    });

    it("括弧が必要な式では punctuation で括弧が追加される", () => {
      // (φ → ψ) ∧ χ — 左辺に括弧が必要
      const tokens = tokenizeFormula(
        conjunction(
          implication(metaVariable("φ"), metaVariable("ψ")),
          metaVariable("χ"),
        ),
      );
      const punctuationTexts = tokens
        .filter((t) => t.kind === "punctuation")
        .map((t) => t.text);
      expect(punctuationTexts).toContain("(");
      expect(punctuationTexts).toContain(")");
    });

    it("論理式代入は substitution 種別のブラケットを含む", () => {
      const tokens = tokenizeFormula(
        formulaSubstitution(
          metaVariable("φ"),
          termVariable("τ"),
          termVariable("x"),
        ),
      );
      const subTokens = tokens.filter((t) => t.kind === "substitution");
      expect(subTokens.map((t) => t.text)).toEqual(["[", "/", "]"]);
    });

    it("否定+複合式では括弧が追加される", () => {
      // ¬(φ ∨ ψ)
      const tokens = tokenizeFormula(
        negation(disjunction(metaVariable("φ"), metaVariable("ψ"))),
      );
      expect(tokens[0]).toEqual({ text: "¬", kind: "negation" });
      expect(tokens[1]).toEqual({ text: "(", kind: "punctuation" });
    });

    it("否定+量化式では括弧が追加される", () => {
      // ¬(∀x.φ)
      const tokens = tokenizeFormula(
        negation(universal(termVariable("x"), metaVariable("φ"))),
      );
      expect(tokens[0]).toEqual({ text: "¬", kind: "negation" });
      expect(tokens[1]).toEqual({ text: "(", kind: "punctuation" });
    });

    it("否定+否定では括弧なし", () => {
      // ¬¬φ
      const tokens = tokenizeFormula(negation(negation(metaVariable("φ"))));
      expect(kinds(tokens)).toEqual(["negation", "negation", "metaVariable"]);
    });

    it("複合式代入 (φ → ψ)[τ/x] では formula 部分が括弧で囲まれる", () => {
      const tokens = tokenizeFormula(
        formulaSubstitution(
          implication(metaVariable("φ"), metaVariable("ψ")),
          termVariable("τ"),
          termVariable("x"),
        ),
      );
      // (φ → ψ)[τ/x] → punctuation"(" + ... + punctuation")" + substitution"[" + ...
      expect(tokens[0]).toEqual({ text: "(", kind: "punctuation" });
    });

    it("自由変数不在は substitution 種別のブラケットを含む", () => {
      const tokens = tokenizeFormula(
        freeVariableAbsence(metaVariable("φ"), termVariable("x")),
      );
      const subTokens = tokens.filter((t) => t.kind === "substitution");
      expect(subTokens.map((t) => t.text)).toEqual(["[", "/", "]"]);
    });

    it("否定の代入 (¬φ)[τ/x] では否定部分が括弧で囲まれる", () => {
      const tokens = tokenizeFormula(
        formulaSubstitution(
          negation(metaVariable("φ")),
          termVariable("τ"),
          termVariable("x"),
        ),
      );
      expect(tokens[0]).toEqual({ text: "(", kind: "punctuation" });
    });
  });

  describe("tokenizeTerm — テキスト一致検証", () => {
    it.each([
      ["変数", termVariable("x")],
      ["メタ変数", termMetaVariable("τ")],
      ["添字付きメタ変数", termMetaVariable("τ", "1")],
      ["定数", constant("0")],
      ["関数適用", functionApplication("f", [termVariable("x")])],
      ["二項演算", binaryOperation("+", termVariable("x"), termVariable("y"))],
      [
        "複合二項演算",
        binaryOperation(
          "+",
          binaryOperation("*", termVariable("x"), termVariable("y")),
          termVariable("z"),
        ),
      ],
    ] as const)("%s: tokensToText === formatTerm", (_name, term) => {
      const tokens = tokenizeTerm(term);
      expect(tokensToText(tokens)).toBe(formatTerm(term));
    });
  });

  describe("tokenizeTerm — トークン種別", () => {
    it("変数は variable", () => {
      expect(tokenizeTerm(termVariable("x"))).toEqual([
        { text: "x", kind: "variable" },
      ]);
    });

    it("メタ変数は metaVariable", () => {
      expect(tokenizeTerm(termMetaVariable("τ"))).toEqual([
        { text: "τ", kind: "metaVariable" },
      ]);
    });

    it("添字付きメタ変数は metaVariable + subscript", () => {
      const tokens = tokenizeTerm(termMetaVariable("τ", "1"));
      expect(kinds(tokens)).toEqual(["metaVariable", "subscript"]);
    });

    it("定数は constant", () => {
      expect(tokenizeTerm(constant("0"))).toEqual([
        { text: "0", kind: "constant" },
      ]);
    });

    it("関数適用は function + punctuation + args + punctuation", () => {
      const tokens = tokenizeTerm(
        functionApplication("f", [termVariable("x"), termVariable("y")]),
      );
      expect(tokens[0]).toEqual({ text: "f", kind: "function" });
      expect(tokens[1]).toEqual({ text: "(", kind: "punctuation" });
      expect(tokens[2]).toEqual({ text: "x", kind: "variable" });
      expect(tokens[3]).toEqual({ text: ", ", kind: "punctuation" });
      expect(tokens[4]).toEqual({ text: "y", kind: "variable" });
      expect(tokens[5]).toEqual({ text: ")", kind: "punctuation" });
    });

    it("二項演算の演算子は connective", () => {
      const tokens = tokenizeTerm(
        binaryOperation("+", termVariable("x"), termVariable("y")),
      );
      expect(kinds(tokens)).toEqual([
        "variable",
        "punctuation",
        "connective",
        "punctuation",
        "variable",
      ]);
      expect(tokens[2]?.text).toBe("+");
    });

    it("左辺に括弧が必要な二項演算", () => {
      // (x + y) * z — 左辺に括弧必要
      const tokens = tokenizeTerm(
        binaryOperation(
          "*",
          binaryOperation("+", termVariable("x"), termVariable("y")),
          termVariable("z"),
        ),
      );
      const punctuationTexts = tokens
        .filter((t) => t.kind === "punctuation")
        .map((t) => t.text);
      expect(punctuationTexts).toContain("(");
      expect(punctuationTexts).toContain(")");
    });

    it("右辺に括弧が必要な二項演算", () => {
      // x * (y + z) — 右辺に括弧必要
      const tokens = tokenizeTerm(
        binaryOperation(
          "*",
          termVariable("x"),
          binaryOperation("+", termVariable("y"), termVariable("z")),
        ),
      );
      const texts = tokens.map((t) => t.text);
      // x × (y + z) — 右辺に括弧がある
      expect(texts).toContain("(");
      expect(texts).toContain(")");
      expect(tokensToText(tokens)).toBe(
        formatTerm(
          binaryOperation(
            "*",
            termVariable("x"),
            binaryOperation("+", termVariable("y"), termVariable("z")),
          ),
        ),
      );
    });
  });

  describe("tokensToText", () => {
    it("空配列は空文字列", () => {
      expect(tokensToText([])).toBe("");
    });
  });

  describe("tokenizeDslInput", () => {
    describe("基本動作", () => {
      it("空入力は null を返す", () => {
        expect(tokenizeDslInput("")).toBeNull();
      });

      it("空白のみの入力は null を返す", () => {
        expect(tokenizeDslInput("   ")).toBeNull();
      });

      it("不正な入力（lexerエラー）は null を返す", () => {
        expect(tokenizeDslInput("@@@@")).toBeNull();
      });
    });

    describe("テキスト復元", () => {
      it.each([
        ["メタ変数", "phi"],
        ["含意", "phi -> psi"],
        ["否定", "~phi"],
        ["連言", "phi /\\ psi"],
        ["選言", "phi \\/ psi"],
        ["同値", "phi <-> psi"],
        ["述語", "P(x)"],
        ["等式", "x = y"],
        ["全称", "forall x. P(x)"],
        ["存在", "exists x. P(x)"],
        ["複合式", "phi -> (psi /\\ chi)"],
        ["Unicode記号", "φ → ψ"],
        ["添字付き", "phi1 -> psi2"],
        ["項演算子", "x + y = z"],
        ["数値リテラル", "x = 0"],
        ["角括弧（代入）", "phi[x]"],
      ] as const)("%s: トークン結合 === 元テキスト", (_name, input) => {
        const tokens = tokenizeDslInput(input);
        expect(tokens).not.toBeNull();
        expect(tokensToText(tokens!)).toBe(input);
      });
    });

    describe("トークン種別", () => {
      it("メタ変数は metaVariable", () => {
        const tokens = tokenizeDslInput("phi")!;
        expect(tokens).toEqual([{ text: "phi", kind: "metaVariable" }]);
      });

      it("含意の矢印は connective", () => {
        const tokens = tokenizeDslInput("phi -> psi")!;
        const arrowToken = tokens.find((t) => t.text === "->");
        expect(arrowToken?.kind).toBe("connective");
      });

      it("否定は negation", () => {
        const tokens = tokenizeDslInput("~phi")!;
        expect(tokens[0]).toEqual({ text: "~", kind: "negation" });
      });

      it("全称量化子は quantifier", () => {
        const tokens = tokenizeDslInput("forall x. P(x)")!;
        expect(tokens[0]).toEqual({ text: "forall", kind: "quantifier" });
      });

      it("存在量化子は quantifier", () => {
        const tokens = tokenizeDslInput("exists x. P(x)")!;
        expect(tokens[0]).toEqual({ text: "exists", kind: "quantifier" });
      });

      it("大文字識別子は predicate", () => {
        const tokens = tokenizeDslInput("P(x)")!;
        expect(tokens[0]).toEqual({ text: "P", kind: "predicate" });
      });

      it("小文字識別子は variable", () => {
        const tokens = tokenizeDslInput("forall x. P(x)")!;
        const xTokens = tokens.filter((t) => t.text === "x");
        expect(xTokens.every((t) => t.kind === "variable")).toBe(true);
      });

      it("等号は equality", () => {
        const tokens = tokenizeDslInput("x = y")!;
        const eqToken = tokens.find((t) => t.text === "=");
        expect(eqToken?.kind).toBe("equality");
      });

      it("括弧は punctuation", () => {
        const tokens = tokenizeDslInput("P(x)")!;
        const parenTokens = tokens.filter(
          (t) => t.text === "(" || t.text === ")",
        );
        expect(parenTokens.every((t) => t.kind === "punctuation")).toBe(true);
      });

      it("角括弧は substitution", () => {
        const tokens = tokenizeDslInput("phi[x]")!;
        const bracketTokens = tokens.filter(
          (t) => t.text === "[" || t.text === "]",
        );
        expect(bracketTokens.every((t) => t.kind === "substitution")).toBe(
          true,
        );
      });

      it("空白は punctuation として保持される", () => {
        const tokens = tokenizeDslInput("phi -> psi")!;
        const spaceTokens = tokens.filter((t) => t.text.trim() === "");
        expect(spaceTokens.length).toBeGreaterThan(0);
        expect(spaceTokens.every((t) => t.kind === "punctuation")).toBe(true);
      });

      it("数値は constant", () => {
        const tokens = tokenizeDslInput("x = 0")!;
        const numToken = tokens.find((t) => t.text === "0");
        expect(numToken?.kind).toBe("constant");
      });

      it("Unicode ¬ は negation", () => {
        const tokens = tokenizeDslInput("¬φ")!;
        expect(tokens[0]).toEqual({ text: "¬", kind: "negation" });
      });

      it("Unicode → は connective", () => {
        const tokens = tokenizeDslInput("φ → ψ")!;
        const arrowToken = tokens.find((t) => t.text === "→");
        expect(arrowToken?.kind).toBe("connective");
      });

      it("Unicode ∧ は connective", () => {
        const tokens = tokenizeDslInput("φ ∧ ψ")!;
        const andToken = tokens.find((t) => t.text === "∧");
        expect(andToken?.kind).toBe("connective");
      });

      it("Unicode ∨ は connective", () => {
        const tokens = tokenizeDslInput("φ ∨ ψ")!;
        const orToken = tokens.find((t) => t.text === "∨");
        expect(orToken?.kind).toBe("connective");
      });

      it("Unicode ∀ は quantifier", () => {
        const tokens = tokenizeDslInput("∀x.P(x)")!;
        expect(tokens[0]).toEqual({ text: "∀", kind: "quantifier" });
      });

      it("Unicode ∃ は quantifier", () => {
        const tokens = tokenizeDslInput("∃x.P(x)")!;
        expect(tokens[0]).toEqual({ text: "∃", kind: "quantifier" });
      });

      it("⊥ は connective", () => {
        const tokens = tokenizeDslInput("⊥")!;
        expect(tokens[0]).toEqual({ text: "⊥", kind: "connective" });
      });

      it("項演算子 +, -, *, / は connective", () => {
        const tokens = tokenizeDslInput("x + y")!;
        const plusToken = tokens.find((t) => t.text === "+");
        expect(plusToken?.kind).toBe("connective");
      });

      it("末尾空白もトークンとして保持される", () => {
        const tokens = tokenizeDslInput("phi ")!;
        expect(tokensToText(tokens)).toBe("phi ");
      });

      it("ドットは punctuation", () => {
        const tokens = tokenizeDslInput("forall x. P(x)")!;
        const dotToken = tokens.find((t) => t.text === ".");
        expect(dotToken?.kind).toBe("punctuation");
      });

      it("カンマは punctuation", () => {
        const tokens = tokenizeDslInput("P(x, y)")!;
        const commaToken = tokens.find((t) => t.text === ",");
        expect(commaToken?.kind).toBe("punctuation");
      });
    });
  });
});

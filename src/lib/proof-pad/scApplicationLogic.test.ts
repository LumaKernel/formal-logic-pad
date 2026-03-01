/**
 * scApplicationLogic.ts のテスト。
 *
 * SC（ゲンツェン流シーケント計算）規則適用ロジックの網羅テスト。
 * - シーケントテキストのパース/フォーマット
 * - 公理規則（identity, bottom-left）
 * - 構造規則（weakening, contraction, exchange）
 * - 論理規則（implication, conjunction, disjunction）
 * - 量化子規則（universal, existential）
 * - カット規則
 * - エッジ生成ヘルパー
 * - 規則分類ヘルパー
 * - エラーメッセージ
 */

import { describe, it, expect } from "vitest";
import { Either } from "effect";
import type { ScRuleApplicationParams } from "./scApplicationLogic";
import {
  splitSequentTextParts,
  parseSequentText,
  formatSequentTextFromFormulas,
  validateScApplication,
  createScEdgeFromResult,
  isScAxiomRule,
  isScSinglePremiseRule,
  isScBranchingRule,
  getScErrorMessage,
  ScSequentParseError,
  ScPrincipalPositionOutOfRange,
  ScPrincipalFormulaMismatch,
  ScEigenVariableError,
  ScTermParseError,
  ScExchangePositionError,
  ScComponentIndexError,
} from "./scApplicationLogic";
import { parseString } from "../logic-lang/parser";

// --- ヘルパー ---

function makeParams(
  overrides: Partial<ScRuleApplicationParams> & {
    readonly ruleId: ScRuleApplicationParams["ruleId"];
    readonly sequentText: ScRuleApplicationParams["sequentText"];
  },
): ScRuleApplicationParams {
  return {
    principalPosition: 0,
    ...overrides,
  };
}

describe("scApplicationLogic", () => {
  // --- シーケントテキスト操作 ---

  describe("splitSequentTextParts", () => {
    it("空文字列を空配列に分割する", () => {
      const result = splitSequentTextParts("");
      expect(result).toEqual({ antecedentTexts: [], succedentTexts: [] });
    });

    it("⇒ のないテキストを左辺のみとして扱う", () => {
      const result = splitSequentTextParts("φ, ψ");
      expect(result).toEqual({
        antecedentTexts: ["φ", "ψ"],
        succedentTexts: [],
      });
    });

    it("⇒ 区切りで左辺と右辺を分割する", () => {
      const result = splitSequentTextParts("φ, ψ ⇒ χ, δ");
      expect(result).toEqual({
        antecedentTexts: ["φ", "ψ"],
        succedentTexts: ["χ", "δ"],
      });
    });

    it("左辺が空のシーケントを扱う", () => {
      const result = splitSequentTextParts(" ⇒ φ");
      expect(result).toEqual({
        antecedentTexts: [],
        succedentTexts: ["φ"],
      });
    });

    it("右辺が空のシーケントを扱う", () => {
      const result = splitSequentTextParts("φ ⇒ ");
      expect(result).toEqual({
        antecedentTexts: ["φ"],
        succedentTexts: [],
      });
    });

    it("両辺とも空のシーケントを扱う", () => {
      const result = splitSequentTextParts(" ⇒ ");
      expect(result).toEqual({
        antecedentTexts: [],
        succedentTexts: [],
      });
    });
  });

  describe("parseSequentText", () => {
    it("有効なシーケントテキストをパースする", () => {
      const result = parseSequentText("P(x) ⇒ Q(x)");
      expect(result).not.toBeUndefined();
      expect(result!.antecedents).toHaveLength(1);
      expect(result!.succedents).toHaveLength(1);
    });

    it("無効な論理式テキストはundefinedを返す", () => {
      const result = parseSequentText("invalid!! ⇒ Q(x)");
      expect(result).toBeUndefined();
    });

    it("空のシーケントをパースする", () => {
      const result = parseSequentText(" ⇒ ");
      expect(result).not.toBeUndefined();
      expect(result!.antecedents).toHaveLength(0);
      expect(result!.succedents).toHaveLength(0);
    });
  });

  describe("formatSequentTextFromFormulas", () => {
    it("論理式配列からシーケントテキストを生成する", () => {
      const pResult = parseString("P(x)");
      const qResult = parseString("Q(x)");
      if (Either.isLeft(pResult) || Either.isLeft(qResult)) {
        throw new Error("Parse failed");
      }
      const text = formatSequentTextFromFormulas(
        [pResult.right],
        [qResult.right],
      );
      expect(text).toContain("⇒");
    });
  });

  // --- 公理規則 ---

  describe("identity", () => {
    it("両辺に論理式があれば成功する", () => {
      const result = validateScApplication(
        makeParams({ ruleId: "identity", sequentText: "P(x) ⇒ P(x)" }),
      );
      expect(Either.isRight(result)).toBe(true);
      if (Either.isRight(result)) {
        expect(result.right._tag).toBe("sc-axiom-result");
      }
    });

    it("左辺が空ならエラー", () => {
      const result = validateScApplication(
        makeParams({ ruleId: "identity", sequentText: " ⇒ P(x)" }),
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("ScPrincipalFormulaMismatch");
      }
    });

    it("右辺が空ならエラー", () => {
      const result = validateScApplication(
        makeParams({ ruleId: "identity", sequentText: "P(x) ⇒ " }),
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("ScPrincipalFormulaMismatch");
      }
    });
  });

  describe("bottom-left", () => {
    it("左辺に論理式があれば成功する（公理マーク）", () => {
      const result = validateScApplication(
        makeParams({ ruleId: "bottom-left", sequentText: "P(x) ⇒ Q(x)" }),
      );
      expect(Either.isRight(result)).toBe(true);
      if (Either.isRight(result)) {
        expect(result.right._tag).toBe("sc-axiom-result");
      }
    });

    it("左辺が空ならエラー", () => {
      const result = validateScApplication(
        makeParams({ ruleId: "bottom-left", sequentText: " ⇒ Q(x)" }),
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("ScPrincipalFormulaMismatch");
      }
    });

    it("右辺が空でも左辺があれば成功する", () => {
      const result = validateScApplication(
        makeParams({ ruleId: "bottom-left", sequentText: "P(x) ⇒ " }),
      );
      expect(Either.isRight(result)).toBe(true);
    });
  });

  // --- 構造規則 ---

  describe("weakening-left", () => {
    it("左辺の指定位置の論理式を除いた前提を返す", () => {
      const result = validateScApplication(
        makeParams({
          ruleId: "weakening-left",
          sequentText: "P(x), Q(x) ⇒ R(x)",
          principalPosition: 0,
        }),
      );
      expect(Either.isRight(result)).toBe(true);
      if (Either.isRight(result)) {
        expect(result.right._tag).toBe("sc-single-result");
        if (result.right._tag === "sc-single-result") {
          expect(result.right.premiseText).toContain("⇒");
          // P(x) を除いて Q(x) ⇒ R(x)
          expect(result.right.premiseText).not.toContain("P(x), Q(x)");
        }
      }
    });

    it("位置が範囲外ならエラー", () => {
      const result = validateScApplication(
        makeParams({
          ruleId: "weakening-left",
          sequentText: "P(x) ⇒ Q(x)",
          principalPosition: 5,
        }),
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("ScPrincipalPositionOutOfRange");
      }
    });

    it("左辺が空ならエラー", () => {
      const result = validateScApplication(
        makeParams({
          ruleId: "weakening-left",
          sequentText: " ⇒ P(x)",
          principalPosition: 0,
        }),
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("ScPrincipalFormulaMismatch");
      }
    });
  });

  describe("weakening-right", () => {
    it("右辺の指定位置の論理式を除いた前提を返す", () => {
      const result = validateScApplication(
        makeParams({
          ruleId: "weakening-right",
          sequentText: "P(x) ⇒ Q(x), R(x)",
          principalPosition: 1,
        }),
      );
      expect(Either.isRight(result)).toBe(true);
      if (Either.isRight(result)) {
        expect(result.right._tag).toBe("sc-single-result");
      }
    });

    it("右辺が空ならエラー", () => {
      const result = validateScApplication(
        makeParams({
          ruleId: "weakening-right",
          sequentText: "P(x) ⇒ ",
          principalPosition: 0,
        }),
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("ScPrincipalFormulaMismatch");
      }
    });

    it("位置が範囲外ならエラー", () => {
      const result = validateScApplication(
        makeParams({
          ruleId: "weakening-right",
          sequentText: "P(x) ⇒ Q(x)",
          principalPosition: 5,
        }),
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("ScPrincipalPositionOutOfRange");
      }
    });
  });

  describe("contraction-left", () => {
    it("指定位置の論理式を複製した前提を返す", () => {
      const result = validateScApplication(
        makeParams({
          ruleId: "contraction-left",
          sequentText: "P(x) ⇒ Q(x)",
          principalPosition: 0,
        }),
      );
      expect(Either.isRight(result)).toBe(true);
      if (Either.isRight(result)) {
        expect(result.right._tag).toBe("sc-single-result");
        if (result.right._tag === "sc-single-result") {
          // P(x) を複製: P(x), P(x) ⇒ Q(x)
          const parsed = parseSequentText(result.right.premiseText);
          expect(parsed).not.toBeUndefined();
          expect(parsed!.antecedents).toHaveLength(2);
        }
      }
    });

    it("左辺が空ならエラー", () => {
      const result = validateScApplication(
        makeParams({
          ruleId: "contraction-left",
          sequentText: " ⇒ Q(x)",
          principalPosition: 0,
        }),
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("ScPrincipalFormulaMismatch");
      }
    });

    it("位置が範囲外ならエラー", () => {
      const result = validateScApplication(
        makeParams({
          ruleId: "contraction-left",
          sequentText: "P(x) ⇒ Q(x)",
          principalPosition: 5,
        }),
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("ScPrincipalPositionOutOfRange");
      }
    });
  });

  describe("contraction-right", () => {
    it("指定位置の論理式を複製した前提を返す", () => {
      const result = validateScApplication(
        makeParams({
          ruleId: "contraction-right",
          sequentText: "P(x) ⇒ Q(x)",
          principalPosition: 0,
        }),
      );
      expect(Either.isRight(result)).toBe(true);
      if (Either.isRight(result)) {
        expect(result.right._tag).toBe("sc-single-result");
        if (result.right._tag === "sc-single-result") {
          const parsed = parseSequentText(result.right.premiseText);
          expect(parsed).not.toBeUndefined();
          expect(parsed!.succedents).toHaveLength(2);
        }
      }
    });

    it("右辺が空ならエラー", () => {
      const result = validateScApplication(
        makeParams({
          ruleId: "contraction-right",
          sequentText: "P(x) ⇒ ",
          principalPosition: 0,
        }),
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("ScPrincipalFormulaMismatch");
      }
    });

    it("位置が範囲外ならエラー", () => {
      const result = validateScApplication(
        makeParams({
          ruleId: "contraction-right",
          sequentText: "P(x) ⇒ Q(x)",
          principalPosition: 5,
        }),
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("ScPrincipalPositionOutOfRange");
      }
    });
  });

  describe("exchange-left", () => {
    it("左辺の隣接する2つの論理式を交換する", () => {
      const result = validateScApplication(
        makeParams({
          ruleId: "exchange-left",
          sequentText: "P(x), Q(x) ⇒ R(x)",
          exchangePosition: 0,
        }),
      );
      expect(Either.isRight(result)).toBe(true);
      if (Either.isRight(result)) {
        expect(result.right._tag).toBe("sc-single-result");
        if (result.right._tag === "sc-single-result") {
          // Q(x), P(x) ⇒ R(x)
          const parsed = parseSequentText(result.right.premiseText);
          expect(parsed).not.toBeUndefined();
          expect(parsed!.antecedents).toHaveLength(2);
        }
      }
    });

    it("交換位置が範囲外ならエラー", () => {
      const result = validateScApplication(
        makeParams({
          ruleId: "exchange-left",
          sequentText: "P(x) ⇒ Q(x)",
          exchangePosition: 0,
        }),
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("ScExchangePositionError");
      }
    });

    it("左辺に3つ以上の論理式がある場合に中間で交換できる", () => {
      const result = validateScApplication(
        makeParams({
          ruleId: "exchange-left",
          sequentText: "P(x), Q(x), R(x) ⇒ S(x)",
          exchangePosition: 1,
        }),
      );
      expect(Either.isRight(result)).toBe(true);
      if (Either.isRight(result)) {
        expect(result.right._tag).toBe("sc-single-result");
      }
    });
  });

  describe("exchange-right", () => {
    it("右辺の隣接する2つの論理式を交換する", () => {
      const result = validateScApplication(
        makeParams({
          ruleId: "exchange-right",
          sequentText: "P(x) ⇒ Q(x), R(x)",
          exchangePosition: 0,
        }),
      );
      expect(Either.isRight(result)).toBe(true);
      if (Either.isRight(result)) {
        expect(result.right._tag).toBe("sc-single-result");
      }
    });

    it("交換位置が範囲外ならエラー", () => {
      const result = validateScApplication(
        makeParams({
          ruleId: "exchange-right",
          sequentText: "P(x) ⇒ Q(x)",
          exchangePosition: 0,
        }),
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("ScExchangePositionError");
      }
    });
  });

  // --- カット規則 ---

  describe("cut", () => {
    it("カット式を指定して分岐結果を返す", () => {
      const result = validateScApplication(
        makeParams({
          ruleId: "cut",
          sequentText: "P(x) ⇒ Q(x)",
          cutFormulaText: "R(x)",
        }),
      );
      expect(Either.isRight(result)).toBe(true);
      if (Either.isRight(result)) {
        expect(result.right._tag).toBe("sc-branching-result");
        if (result.right._tag === "sc-branching-result") {
          // 左前提: P(x) ⇒ R(x)
          expect(result.right.leftPremiseText).toContain("⇒");
          // 右前提: R(x) ⇒ Q(x)
          expect(result.right.rightPremiseText).toContain("⇒");
        }
      }
    });

    it("カット式が空ならエラー", () => {
      const result = validateScApplication(
        makeParams({
          ruleId: "cut",
          sequentText: "P(x) ⇒ Q(x)",
          cutFormulaText: "",
        }),
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("ScPrincipalFormulaMismatch");
      }
    });

    it("カット式のパースに失敗したらエラー", () => {
      const result = validateScApplication(
        makeParams({
          ruleId: "cut",
          sequentText: "P(x) ⇒ Q(x)",
          cutFormulaText: "invalid!!",
        }),
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("ScSequentParseError");
      }
    });
  });

  // --- 論理規則 ---

  describe("implication-right", () => {
    it("右辺のφ→ψを分解して前提を返す", () => {
      const result = validateScApplication(
        makeParams({
          ruleId: "implication-right",
          sequentText: "P(x) ⇒ P(x) → Q(x)",
          principalPosition: 0,
        }),
      );
      expect(Either.isRight(result)).toBe(true);
      if (Either.isRight(result)) {
        expect(result.right._tag).toBe("sc-single-result");
        if (result.right._tag === "sc-single-result") {
          // 前提: P(x), P(x) ⇒ Q(x)
          const parsed = parseSequentText(result.right.premiseText);
          expect(parsed).not.toBeUndefined();
          // φ が左辺に追加、ψ が右辺に置き換わる
          expect(parsed!.antecedents.length).toBeGreaterThanOrEqual(1);
        }
      }
    });

    it("主論理式が含意でなければエラー", () => {
      const result = validateScApplication(
        makeParams({
          ruleId: "implication-right",
          sequentText: "P(x) ⇒ Q(x)",
          principalPosition: 0,
        }),
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("ScPrincipalFormulaMismatch");
      }
    });

    it("位置が範囲外ならエラー", () => {
      const result = validateScApplication(
        makeParams({
          ruleId: "implication-right",
          sequentText: "P(x) ⇒ Q(x)",
          principalPosition: 5,
        }),
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("ScPrincipalPositionOutOfRange");
      }
    });
  });

  describe("implication-left", () => {
    it("左辺のφ→ψを分岐で分解する", () => {
      const result = validateScApplication(
        makeParams({
          ruleId: "implication-left",
          sequentText: "P(x) → Q(x) ⇒ R(x)",
          principalPosition: 0,
        }),
      );
      expect(Either.isRight(result)).toBe(true);
      if (Either.isRight(result)) {
        expect(result.right._tag).toBe("sc-branching-result");
        if (result.right._tag === "sc-branching-result") {
          // 左前提: ⇒ φ  (Γ空の場合)
          // 右前提: ψ ⇒ R(x)
          expect(result.right.leftPremiseText).toContain("⇒");
          expect(result.right.rightPremiseText).toContain("⇒");
        }
      }
    });

    it("主論理式が含意でなければエラー", () => {
      const result = validateScApplication(
        makeParams({
          ruleId: "implication-left",
          sequentText: "P(x) ⇒ Q(x)",
          principalPosition: 0,
        }),
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("ScPrincipalFormulaMismatch");
      }
    });

    it("位置が範囲外ならエラー", () => {
      const result = validateScApplication(
        makeParams({
          ruleId: "implication-left",
          sequentText: "P(x) ⇒ Q(x)",
          principalPosition: 5,
        }),
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("ScPrincipalPositionOutOfRange");
      }
    });
  });

  describe("conjunction-left", () => {
    it("左成分を使って前提を生成する", () => {
      const result = validateScApplication(
        makeParams({
          ruleId: "conjunction-left",
          sequentText: "P(x) ∧ Q(x) ⇒ R(x)",
          principalPosition: 0,
          componentIndex: 1,
        }),
      );
      expect(Either.isRight(result)).toBe(true);
      if (Either.isRight(result)) {
        expect(result.right._tag).toBe("sc-single-result");
      }
    });

    it("右成分を使って前提を生成する", () => {
      const result = validateScApplication(
        makeParams({
          ruleId: "conjunction-left",
          sequentText: "P(x) ∧ Q(x) ⇒ R(x)",
          principalPosition: 0,
          componentIndex: 2,
        }),
      );
      expect(Either.isRight(result)).toBe(true);
      if (Either.isRight(result)) {
        expect(result.right._tag).toBe("sc-single-result");
      }
    });

    it("主論理式が連言でなければエラー", () => {
      const result = validateScApplication(
        makeParams({
          ruleId: "conjunction-left",
          sequentText: "P(x) ⇒ Q(x)",
          principalPosition: 0,
          componentIndex: 1,
        }),
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("ScPrincipalFormulaMismatch");
      }
    });

    it("位置が範囲外ならエラー", () => {
      const result = validateScApplication(
        makeParams({
          ruleId: "conjunction-left",
          sequentText: "P(x) ∧ Q(x) ⇒ R(x)",
          principalPosition: 5,
          componentIndex: 1,
        }),
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("ScPrincipalPositionOutOfRange");
      }
    });
  });

  describe("conjunction-right", () => {
    it("分岐して両方の成分を右辺に持つ前提を返す", () => {
      const result = validateScApplication(
        makeParams({
          ruleId: "conjunction-right",
          sequentText: "P(x) ⇒ Q(x) ∧ R(x)",
          principalPosition: 0,
        }),
      );
      expect(Either.isRight(result)).toBe(true);
      if (Either.isRight(result)) {
        expect(result.right._tag).toBe("sc-branching-result");
      }
    });

    it("主論理式が連言でなければエラー", () => {
      const result = validateScApplication(
        makeParams({
          ruleId: "conjunction-right",
          sequentText: "P(x) ⇒ Q(x)",
          principalPosition: 0,
        }),
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("ScPrincipalFormulaMismatch");
      }
    });

    it("位置が範囲外ならエラー", () => {
      const result = validateScApplication(
        makeParams({
          ruleId: "conjunction-right",
          sequentText: "P(x) ⇒ Q(x) ∧ R(x)",
          principalPosition: 5,
        }),
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("ScPrincipalPositionOutOfRange");
      }
    });
  });

  describe("disjunction-right", () => {
    it("左成分を使って前提を生成する", () => {
      const result = validateScApplication(
        makeParams({
          ruleId: "disjunction-right",
          sequentText: "P(x) ⇒ Q(x) ∨ R(x)",
          principalPosition: 0,
          componentIndex: 1,
        }),
      );
      expect(Either.isRight(result)).toBe(true);
      if (Either.isRight(result)) {
        expect(result.right._tag).toBe("sc-single-result");
      }
    });

    it("右成分を使って前提を生成する", () => {
      const result = validateScApplication(
        makeParams({
          ruleId: "disjunction-right",
          sequentText: "P(x) ⇒ Q(x) ∨ R(x)",
          principalPosition: 0,
          componentIndex: 2,
        }),
      );
      expect(Either.isRight(result)).toBe(true);
    });

    it("主論理式が選言でなければエラー", () => {
      const result = validateScApplication(
        makeParams({
          ruleId: "disjunction-right",
          sequentText: "P(x) ⇒ Q(x)",
          principalPosition: 0,
          componentIndex: 1,
        }),
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("ScPrincipalFormulaMismatch");
      }
    });

    it("位置が範囲外ならエラー", () => {
      const result = validateScApplication(
        makeParams({
          ruleId: "disjunction-right",
          sequentText: "P(x) ⇒ Q(x) ∨ R(x)",
          principalPosition: 5,
        }),
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("ScPrincipalPositionOutOfRange");
      }
    });
  });

  describe("disjunction-left", () => {
    it("分岐して各成分を左辺に持つ前提を返す", () => {
      const result = validateScApplication(
        makeParams({
          ruleId: "disjunction-left",
          sequentText: "P(x) ∨ Q(x) ⇒ R(x)",
          principalPosition: 0,
        }),
      );
      expect(Either.isRight(result)).toBe(true);
      if (Either.isRight(result)) {
        expect(result.right._tag).toBe("sc-branching-result");
      }
    });

    it("主論理式が選言でなければエラー", () => {
      const result = validateScApplication(
        makeParams({
          ruleId: "disjunction-left",
          sequentText: "P(x) ⇒ Q(x)",
          principalPosition: 0,
        }),
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("ScPrincipalFormulaMismatch");
      }
    });

    it("位置が範囲外ならエラー", () => {
      const result = validateScApplication(
        makeParams({
          ruleId: "disjunction-left",
          sequentText: "P(x) ∨ Q(x) ⇒ R(x)",
          principalPosition: 5,
        }),
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("ScPrincipalPositionOutOfRange");
      }
    });
  });

  // --- 量化子規則 ---

  describe("universal-left", () => {
    it("代入項で置換した前提を返す", () => {
      const result = validateScApplication(
        makeParams({
          ruleId: "universal-left",
          sequentText: "∀x.P(x) ⇒ Q(y)",
          principalPosition: 0,
          termText: "y",
        }),
      );
      expect(Either.isRight(result)).toBe(true);
      if (Either.isRight(result)) {
        expect(result.right._tag).toBe("sc-single-result");
      }
    });

    it("主論理式が全称でなければエラー", () => {
      const result = validateScApplication(
        makeParams({
          ruleId: "universal-left",
          sequentText: "P(x) ⇒ Q(x)",
          principalPosition: 0,
          termText: "y",
        }),
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("ScPrincipalFormulaMismatch");
      }
    });

    it("項テキストが空ならエラー", () => {
      const result = validateScApplication(
        makeParams({
          ruleId: "universal-left",
          sequentText: "∀x.P(x) ⇒ Q(y)",
          principalPosition: 0,
          termText: "",
        }),
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("ScTermParseError");
      }
    });

    it("項テキストのパースに失敗したらエラー", () => {
      const result = validateScApplication(
        makeParams({
          ruleId: "universal-left",
          sequentText: "∀x.P(x) ⇒ Q(y)",
          principalPosition: 0,
          termText: "invalid!!",
        }),
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("ScTermParseError");
      }
    });

    it("位置が範囲外ならエラー", () => {
      const result = validateScApplication(
        makeParams({
          ruleId: "universal-left",
          sequentText: "∀x.P(x) ⇒ Q(y)",
          principalPosition: 5,
          termText: "y",
        }),
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("ScPrincipalPositionOutOfRange");
      }
    });

    it("代入項が自由でない(isFreeFor失敗)ならエラー", () => {
      // body = ∀y.P(x) に対して term=y, xi=x で代入すると
      // P(x)中のxにyを代入→P(y) だがyが∀yに捕獲されるためisFreeFor=false
      const result = validateScApplication(
        makeParams({
          ruleId: "universal-left",
          sequentText: "∀x.∀y.P(x) ⇒ Q(z)",
          principalPosition: 0,
          termText: "y",
        }),
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("ScEigenVariableError");
        expect(result.left.message).toContain("not free for");
      }
    });
  });

  describe("universal-right", () => {
    it("固有変数で置換した前提を返す", () => {
      const result = validateScApplication(
        makeParams({
          ruleId: "universal-right",
          sequentText: " ⇒ ∀x.P(x)",
          principalPosition: 0,
          eigenVariable: "z",
        }),
      );
      expect(Either.isRight(result)).toBe(true);
      if (Either.isRight(result)) {
        expect(result.right._tag).toBe("sc-single-result");
      }
    });

    it("主論理式が全称でなければエラー", () => {
      const result = validateScApplication(
        makeParams({
          ruleId: "universal-right",
          sequentText: " ⇒ P(x)",
          principalPosition: 0,
          eigenVariable: "z",
        }),
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("ScPrincipalFormulaMismatch");
      }
    });

    it("固有変数名が空ならエラー", () => {
      const result = validateScApplication(
        makeParams({
          ruleId: "universal-right",
          sequentText: " ⇒ ∀x.P(x)",
          principalPosition: 0,
          eigenVariable: "",
        }),
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("ScEigenVariableError");
      }
    });

    it("固有変数がシーケントに自由出現するならエラー", () => {
      const result = validateScApplication(
        makeParams({
          ruleId: "universal-right",
          sequentText: "P(y) ⇒ ∀x.P(x)",
          principalPosition: 0,
          eigenVariable: "y",
        }),
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("ScEigenVariableError");
      }
    });

    it("固有変数が右辺のみに自由出現するならエラー", () => {
      // succedentsループ(line 934-938)のカバレッジ
      const result = validateScApplication(
        makeParams({
          ruleId: "universal-right",
          sequentText: " ⇒ Q(y), ∀x.P(x)",
          principalPosition: 1,
          eigenVariable: "y",
        }),
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("ScEigenVariableError");
        if (result.left._tag === "ScEigenVariableError") {
          expect(result.left.variableName).toBe("y");
        }
      }
    });

    it("位置が範囲外ならエラー", () => {
      const result = validateScApplication(
        makeParams({
          ruleId: "universal-right",
          sequentText: " ⇒ ∀x.P(x)",
          principalPosition: 5,
          eigenVariable: "z",
        }),
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("ScPrincipalPositionOutOfRange");
      }
    });
  });

  describe("existential-left", () => {
    it("固有変数で置換した前提を返す", () => {
      const result = validateScApplication(
        makeParams({
          ruleId: "existential-left",
          sequentText: "∃x.P(x) ⇒ Q(y)",
          principalPosition: 0,
          eigenVariable: "z",
        }),
      );
      expect(Either.isRight(result)).toBe(true);
      if (Either.isRight(result)) {
        expect(result.right._tag).toBe("sc-single-result");
      }
    });

    it("主論理式が存在でなければエラー", () => {
      const result = validateScApplication(
        makeParams({
          ruleId: "existential-left",
          sequentText: "P(x) ⇒ Q(x)",
          principalPosition: 0,
          eigenVariable: "z",
        }),
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("ScPrincipalFormulaMismatch");
      }
    });

    it("固有変数名が空ならエラー", () => {
      const result = validateScApplication(
        makeParams({
          ruleId: "existential-left",
          sequentText: "∃x.P(x) ⇒ Q(y)",
          principalPosition: 0,
          eigenVariable: "",
        }),
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("ScEigenVariableError");
      }
    });

    it("固有変数がシーケントに自由出現するならエラー", () => {
      const result = validateScApplication(
        makeParams({
          ruleId: "existential-left",
          sequentText: "∃x.P(x) ⇒ Q(y)",
          principalPosition: 0,
          eigenVariable: "y",
        }),
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("ScEigenVariableError");
      }
    });

    it("固有変数が左辺のみに自由出現するならエラー", () => {
      // antecedentsループ(line 1005-1009)のカバレッジ
      const result = validateScApplication(
        makeParams({
          ruleId: "existential-left",
          sequentText: "P(y), ∃x.P(x) ⇒ ",
          principalPosition: 1,
          eigenVariable: "y",
        }),
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("ScEigenVariableError");
        if (result.left._tag === "ScEigenVariableError") {
          expect(result.left.variableName).toBe("y");
        }
      }
    });

    it("位置が範囲外ならエラー", () => {
      const result = validateScApplication(
        makeParams({
          ruleId: "existential-left",
          sequentText: "∃x.P(x) ⇒ Q(y)",
          principalPosition: 5,
          eigenVariable: "z",
        }),
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("ScPrincipalPositionOutOfRange");
      }
    });
  });

  describe("existential-right", () => {
    it("代入項で置換した前提を返す", () => {
      const result = validateScApplication(
        makeParams({
          ruleId: "existential-right",
          sequentText: "P(y) ⇒ ∃x.P(x)",
          principalPosition: 0,
          termText: "y",
        }),
      );
      expect(Either.isRight(result)).toBe(true);
      if (Either.isRight(result)) {
        expect(result.right._tag).toBe("sc-single-result");
      }
    });

    it("主論理式が存在でなければエラー", () => {
      const result = validateScApplication(
        makeParams({
          ruleId: "existential-right",
          sequentText: "P(x) ⇒ Q(x)",
          principalPosition: 0,
          termText: "y",
        }),
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("ScPrincipalFormulaMismatch");
      }
    });

    it("項テキストが空ならエラー", () => {
      const result = validateScApplication(
        makeParams({
          ruleId: "existential-right",
          sequentText: "P(y) ⇒ ∃x.P(x)",
          principalPosition: 0,
          termText: "",
        }),
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("ScTermParseError");
      }
    });

    it("項テキストのパースに失敗したらエラー", () => {
      const result = validateScApplication(
        makeParams({
          ruleId: "existential-right",
          sequentText: "P(y) ⇒ ∃x.P(x)",
          principalPosition: 0,
          termText: "invalid!!",
        }),
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("ScTermParseError");
      }
    });

    it("代入項が自由でない(isFreeFor失敗)ならエラー", () => {
      // body = ∀y.P(x) に対して term=y, xi=x で代入すると
      // P(x)中のxにyを代入→P(y) だがyが∀yに捕獲されるためisFreeFor=false
      const result = validateScApplication(
        makeParams({
          ruleId: "existential-right",
          sequentText: " ⇒ ∃x.∀y.P(x)",
          principalPosition: 0,
          termText: "y",
        }),
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("ScEigenVariableError");
        expect(result.left.message).toContain("not free for");
      }
    });

    it("位置が範囲外ならエラー", () => {
      const result = validateScApplication(
        makeParams({
          ruleId: "existential-right",
          sequentText: "P(y) ⇒ ∃x.P(x)",
          principalPosition: 5,
          termText: "y",
        }),
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("ScPrincipalPositionOutOfRange");
      }
    });
  });

  // --- シーケントパースエラー ---

  describe("シーケントパースエラー", () => {
    it("パース不能なシーケントテキストはエラーを返す", () => {
      const result = validateScApplication(
        makeParams({
          ruleId: "identity",
          sequentText: "invalid!! ⇒ also invalid!!",
        }),
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("ScSequentParseError");
      }
    });
  });

  // --- エッジ生成ヘルパー ---

  describe("createScEdgeFromResult", () => {
    it("公理結果からScAxiomEdgeを生成する", () => {
      const params = makeParams({
        ruleId: "identity",
        sequentText: "P(x) ⇒ P(x)",
      });
      const result = { _tag: "sc-axiom-result" as const };
      const edge = createScEdgeFromResult(params, result, "node-1");
      expect(edge._tag).toBe("sc-axiom");
      if (edge._tag === "sc-axiom") {
        expect(edge.ruleId).toBe("identity");
        expect(edge.conclusionNodeId).toBe("node-1");
        expect(edge.conclusionText).toBe("P(x) ⇒ P(x)");
      }
    });

    it("1前提結果からScSinglePremiseEdgeを生成する", () => {
      const params = makeParams({
        ruleId: "weakening-left",
        sequentText: "P(x), Q(x) ⇒ R(x)",
        principalPosition: 0,
      });
      const result = {
        _tag: "sc-single-result" as const,
        premiseText: "Q(x) ⇒ R(x)",
      };
      const edge = createScEdgeFromResult(params, result, "node-1");
      expect(edge._tag).toBe("sc-single");
      if (edge._tag === "sc-single") {
        expect(edge.ruleId).toBe("weakening-left");
        expect(edge.conclusionNodeId).toBe("node-1");
        expect(edge.premiseNodeId).toBeUndefined();
      }
    });

    it("分岐結果からScBranchingEdgeを生成する", () => {
      const params = makeParams({
        ruleId: "cut",
        sequentText: "P(x) ⇒ Q(x)",
        cutFormulaText: "R(x)",
      });
      const result = {
        _tag: "sc-branching-result" as const,
        leftPremiseText: "P(x) ⇒ R(x)",
        rightPremiseText: "R(x) ⇒ Q(x)",
      };
      const edge = createScEdgeFromResult(params, result, "node-1");
      expect(edge._tag).toBe("sc-branching");
      if (edge._tag === "sc-branching") {
        expect(edge.ruleId).toBe("cut");
        expect(edge.conclusionNodeId).toBe("node-1");
        expect(edge.leftPremiseNodeId).toBeUndefined();
        expect(edge.rightPremiseNodeId).toBeUndefined();
        expect(edge.leftConclusionText).toBe("P(x) ⇒ R(x)");
        expect(edge.rightConclusionText).toBe("R(x) ⇒ Q(x)");
      }
    });
  });

  // --- 規則分類ヘルパー ---

  describe("isScAxiomRule", () => {
    it("identityは公理", () => {
      expect(isScAxiomRule("identity")).toBe(true);
    });

    it("bottom-leftは公理", () => {
      expect(isScAxiomRule("bottom-left")).toBe(true);
    });

    it("cutは公理でない", () => {
      expect(isScAxiomRule("cut")).toBe(false);
    });

    it("weakening-leftは公理でない", () => {
      expect(isScAxiomRule("weakening-left")).toBe(false);
    });
  });

  describe("isScSinglePremiseRule", () => {
    it("weakening-leftは1前提", () => {
      expect(isScSinglePremiseRule("weakening-left")).toBe(true);
    });

    it("implication-rightは1前提", () => {
      expect(isScSinglePremiseRule("implication-right")).toBe(true);
    });

    it("cutは1前提でない", () => {
      expect(isScSinglePremiseRule("cut")).toBe(false);
    });

    it("identityは1前提でない", () => {
      expect(isScSinglePremiseRule("identity")).toBe(false);
    });
  });

  describe("isScBranchingRule", () => {
    it("cutは分岐", () => {
      expect(isScBranchingRule("cut")).toBe(true);
    });

    it("implication-leftは分岐", () => {
      expect(isScBranchingRule("implication-left")).toBe(true);
    });

    it("conjunction-rightは分岐", () => {
      expect(isScBranchingRule("conjunction-right")).toBe(true);
    });

    it("disjunction-leftは分岐", () => {
      expect(isScBranchingRule("disjunction-left")).toBe(true);
    });

    it("weakening-leftは分岐でない", () => {
      expect(isScBranchingRule("weakening-left")).toBe(false);
    });
  });

  // --- エラーメッセージ ---

  describe("getScErrorMessage", () => {
    it("ScSequentParseErrorのメッセージ", () => {
      const msg = getScErrorMessage(
        new ScSequentParseError({ nodeId: "test" }),
      );
      expect(msg).toBe("Cannot parse sequent");
    });

    it("ScPrincipalPositionOutOfRangeのメッセージ", () => {
      const msg = getScErrorMessage(
        new ScPrincipalPositionOutOfRange({
          side: "left",
          position: 5,
          formulaCount: 2,
        }),
      );
      expect(msg).toContain("5");
      expect(msg).toContain("left");
    });

    it("ScPrincipalFormulaMismatchのメッセージ", () => {
      const msg = getScErrorMessage(
        new ScPrincipalFormulaMismatch({
          ruleId: "identity",
          message: "test message",
        }),
      );
      expect(msg).toBe("test message");
    });

    it("ScEigenVariableErrorのメッセージ", () => {
      const msg = getScErrorMessage(
        new ScEigenVariableError({
          variableName: "x",
          message: "test eigen error",
        }),
      );
      expect(msg).toBe("test eigen error");
    });

    it("ScTermParseErrorのメッセージ", () => {
      const msg = getScErrorMessage(new ScTermParseError({ label: "term τ" }));
      expect(msg).toContain("term τ");
    });

    it("ScExchangePositionErrorのメッセージ", () => {
      const msg = getScErrorMessage(
        new ScExchangePositionError({
          side: "right",
          position: 3,
          maxPosition: 1,
        }),
      );
      expect(msg).toContain("3");
      expect(msg).toContain("right");
    });

    it("ScComponentIndexErrorのメッセージ", () => {
      const msg = getScErrorMessage(
        new ScComponentIndexError({ message: "index error" }),
      );
      expect(msg).toBe("index error");
    });
  });
});

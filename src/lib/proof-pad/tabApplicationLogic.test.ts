import { describe, expect, it } from "vitest";
import { Either } from "effect";
import {
  splitSequentText,
  formatSequentText,
  parseSequentFormulas,
  validateTabApplication,
  createTabEdgeFromResult,
  isTabAxiomRule,
  isTabSinglePremiseRule,
  getTabErrorMessage,
  TabSequentParseError,
  TabPrincipalPositionOutOfRange,
  TabPrincipalFormulaMismatch,
  TabEigenVariableError,
  TabTermParseError,
  TabExchangePositionError,
} from "./tabApplicationLogic";
import type { TabRuleApplicationParams } from "./tabApplicationLogic";
import {
  tableauCalculusDeduction,
  tabSystem,
} from "../logic-core/deductionSystem";
import { createEmptyWorkspace, applyTabRuleAndConnect } from "./workspaceState";

const tabDeduction = tableauCalculusDeduction(tabSystem);

/**
 * パラメータのデフォルト付きショートカット
 */
function makeParams(
  overrides: Partial<TabRuleApplicationParams> & {
    readonly ruleId: TabRuleApplicationParams["ruleId"];
    readonly sequentText: TabRuleApplicationParams["sequentText"];
  },
): TabRuleApplicationParams {
  return {
    principalPosition: 0,
    ...overrides,
  };
}

describe("tabApplicationLogic", () => {
  // --- シーケントテキスト操作 ---

  describe("splitSequentText", () => {
    it("空文字列を空配列に分割する", () => {
      expect(splitSequentText("")).toEqual([]);
    });

    it("空白のみの文字列を空配列に分割する", () => {
      expect(splitSequentText("  ")).toEqual([]);
    });

    it("単一の論理式を1要素に分割する", () => {
      expect(splitSequentText("φ")).toEqual(["φ"]);
    });

    it("カンマ区切りの複数論理式を分割する", () => {
      expect(splitSequentText("φ, ψ, ¬φ")).toEqual(["φ", "ψ", "¬φ"]);
    });

    it("空白を除去する", () => {
      expect(splitSequentText("  φ ,  ψ  ")).toEqual(["φ", "ψ"]);
    });
  });

  describe("formatSequentText", () => {
    it("空配列を空文字列にフォーマットする", () => {
      expect(formatSequentText([])).toBe("");
    });

    it("単一論理式をフォーマットする", () => {
      const formulas = parseSequentFormulas("φ")!;
      expect(formatSequentText(formulas)).toBe("φ");
    });

    it("複数論理式をカンマ区切りでフォーマットする", () => {
      const formulas = parseSequentFormulas("φ, ψ")!;
      expect(formatSequentText(formulas)).toBe("φ, ψ");
    });
  });

  describe("parseSequentFormulas", () => {
    it("空文字列を空配列にパースする", () => {
      const result = parseSequentFormulas("");
      expect(result).toEqual([]);
    });

    it("単一論理式をパースする", () => {
      const result = parseSequentFormulas("φ");
      expect(result).toHaveLength(1);
      expect(result![0]!._tag).toBe("MetaVariable");
    });

    it("複数論理式をパースする", () => {
      const result = parseSequentFormulas("φ, ψ → φ");
      expect(result).toHaveLength(2);
      expect(result![0]!._tag).toBe("MetaVariable");
      expect(result![1]!._tag).toBe("Implication");
    });

    it("パース失敗時にundefinedを返す", () => {
      const result = parseSequentFormulas("φ, ∧∧∧");
      expect(result).toBeUndefined();
    });
  });

  // --- 公理規則 ---

  describe("BS (基本式公理)", () => {
    it("2つ以上の論理式があれば成功する", () => {
      const result = validateTabApplication(
        makeParams({ ruleId: "bs", sequentText: "¬φ, φ" }),
      );
      expect(Either.isRight(result)).toBe(true);
      if (Either.isRight(result)) {
        expect(result.right._tag).toBe("tab-axiom-result");
      }
    });

    it("1つの論理式ではエラーを返す", () => {
      const result = validateTabApplication(
        makeParams({ ruleId: "bs", sequentText: "φ" }),
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("TabPrincipalFormulaMismatch");
      }
    });
  });

  describe("⊥ (底公理)", () => {
    it("1つ以上の論理式があれば成功する", () => {
      const result = validateTabApplication(
        makeParams({ ruleId: "bottom", sequentText: "φ" }),
      );
      expect(Either.isRight(result)).toBe(true);
      if (Either.isRight(result)) {
        expect(result.right._tag).toBe("tab-axiom-result");
      }
    });

    it("空シーケントではエラーを返す", () => {
      const result = validateTabApplication(
        makeParams({ ruleId: "bottom", sequentText: "" }),
      );
      expect(Either.isLeft(result)).toBe(true);
    });
  });

  // --- 交換規則 ---

  describe("e (交換)", () => {
    it("2つの論理式の位置を入れ替える", () => {
      const result = validateTabApplication(
        makeParams({
          ruleId: "exchange",
          sequentText: "φ, ψ",
          exchangePosition: 0,
        }),
      );
      expect(Either.isRight(result)).toBe(true);
      if (Either.isRight(result)) {
        expect(result.right._tag).toBe("tab-single-result");
        if (result.right._tag === "tab-single-result") {
          expect(result.right.premiseText).toBe("ψ, φ");
        }
      }
    });

    it("3つの論理式の中間を入れ替える", () => {
      const result = validateTabApplication(
        makeParams({
          ruleId: "exchange",
          sequentText: "φ, ψ, ¬φ",
          exchangePosition: 1,
        }),
      );
      expect(Either.isRight(result)).toBe(true);
      if (Either.isRight(result)) {
        expect(result.right._tag).toBe("tab-single-result");
        if (result.right._tag === "tab-single-result") {
          expect(result.right.premiseText).toBe("φ, ¬φ, ψ");
        }
      }
    });

    it("範囲外の交換位置ではエラーを返す（位置が大きすぎる）", () => {
      const result = validateTabApplication(
        makeParams({
          ruleId: "exchange",
          sequentText: "φ, ψ",
          exchangePosition: 1,
        }),
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("TabExchangePositionError");
      }
    });

    it("範囲外の交換位置ではエラーを返す（負の位置）", () => {
      const result = validateTabApplication(
        makeParams({
          ruleId: "exchange",
          sequentText: "φ, ψ",
          exchangePosition: -1,
        }),
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("TabExchangePositionError");
      }
    });
  });

  // --- 二重否定規則 ---

  describe("¬¬ (二重否定)", () => {
    it("¬¬φ の主論理式からφを追加する", () => {
      const result = validateTabApplication(
        makeParams({
          ruleId: "double-negation",
          sequentText: "¬¬φ, ψ",
          principalPosition: 0,
        }),
      );
      expect(Either.isRight(result)).toBe(true);
      if (Either.isRight(result)) {
        expect(result.right._tag).toBe("tab-single-result");
        if (result.right._tag === "tab-single-result") {
          // φ, ¬¬φ, ψ
          expect(result.right.premiseText).toBe("φ, ¬¬φ, ψ");
        }
      }
    });

    it("主論理式が¬¬でない場合はエラー", () => {
      const result = validateTabApplication(
        makeParams({
          ruleId: "double-negation",
          sequentText: "¬φ, ψ",
          principalPosition: 0,
        }),
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("TabPrincipalFormulaMismatch");
      }
    });
  });

  // --- 連言規則 ---

  describe("∧ (連言)", () => {
    it("φ∧ψ の主論理式からφ, ψを追加する", () => {
      const result = validateTabApplication(
        makeParams({
          ruleId: "conjunction",
          sequentText: "φ ∧ ψ",
          principalPosition: 0,
        }),
      );
      expect(Either.isRight(result)).toBe(true);
      if (Either.isRight(result)) {
        expect(result.right._tag).toBe("tab-single-result");
        if (result.right._tag === "tab-single-result") {
          expect(result.right.premiseText).toBe("φ, ψ, φ ∧ ψ");
        }
      }
    });

    it("主論理式が連言でない場合はエラー", () => {
      const result = validateTabApplication(
        makeParams({
          ruleId: "conjunction",
          sequentText: "φ ∨ ψ",
          principalPosition: 0,
        }),
      );
      expect(Either.isLeft(result)).toBe(true);
    });
  });

  // --- 否定連言規則 ---

  describe("¬∧ (否定連言)", () => {
    it("¬(φ∧ψ) から分岐: ¬φ / ¬ψ", () => {
      const result = validateTabApplication(
        makeParams({
          ruleId: "neg-conjunction",
          sequentText: "¬(φ ∧ ψ)",
          principalPosition: 0,
        }),
      );
      expect(Either.isRight(result)).toBe(true);
      if (Either.isRight(result)) {
        expect(result.right._tag).toBe("tab-branching-result");
        if (result.right._tag === "tab-branching-result") {
          expect(result.right.leftPremiseText).toBe("¬φ, ¬(φ ∧ ψ)");
          expect(result.right.rightPremiseText).toBe("¬ψ, ¬(φ ∧ ψ)");
        }
      }
    });

    it("主論理式が¬(φ∧ψ)でない場合はエラー（内部が連言でない）", () => {
      const result = validateTabApplication(
        makeParams({
          ruleId: "neg-conjunction",
          sequentText: "¬(φ ∨ ψ)",
          principalPosition: 0,
        }),
      );
      expect(Either.isLeft(result)).toBe(true);
    });

    it("主論理式が否定でない場合はエラー", () => {
      const result = validateTabApplication(
        makeParams({
          ruleId: "neg-conjunction",
          sequentText: "φ ∧ ψ",
          principalPosition: 0,
        }),
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("TabPrincipalFormulaMismatch");
      }
    });
  });

  // --- 選言規則 ---

  describe("∨ (選言)", () => {
    it("主論理式が選言でない場合はエラー", () => {
      const result = validateTabApplication(
        makeParams({
          ruleId: "disjunction",
          sequentText: "φ ∧ ψ",
          principalPosition: 0,
        }),
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("TabPrincipalFormulaMismatch");
      }
    });

    it("φ∨ψ から分岐: φ / ψ", () => {
      const result = validateTabApplication(
        makeParams({
          ruleId: "disjunction",
          sequentText: "φ ∨ ψ",
          principalPosition: 0,
        }),
      );
      expect(Either.isRight(result)).toBe(true);
      if (Either.isRight(result)) {
        expect(result.right._tag).toBe("tab-branching-result");
        if (result.right._tag === "tab-branching-result") {
          expect(result.right.leftPremiseText).toBe("φ, φ ∨ ψ");
          expect(result.right.rightPremiseText).toBe("ψ, φ ∨ ψ");
        }
      }
    });
  });

  // --- 否定選言規則 ---

  describe("¬∨ (否定選言)", () => {
    it("主論理式が¬(φ∨ψ)でない場合はエラー（否定でない）", () => {
      const result = validateTabApplication(
        makeParams({
          ruleId: "neg-disjunction",
          sequentText: "φ ∨ ψ",
          principalPosition: 0,
        }),
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("TabPrincipalFormulaMismatch");
      }
    });

    it("主論理式が¬(φ∨ψ)でない場合はエラー（内部が選言でない）", () => {
      const result = validateTabApplication(
        makeParams({
          ruleId: "neg-disjunction",
          sequentText: "¬(φ ∧ ψ)",
          principalPosition: 0,
        }),
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("TabPrincipalFormulaMismatch");
      }
    });

    it("¬(φ∨ψ) から ¬φ, ¬ψ を追加する", () => {
      const result = validateTabApplication(
        makeParams({
          ruleId: "neg-disjunction",
          sequentText: "¬(φ ∨ ψ)",
          principalPosition: 0,
        }),
      );
      expect(Either.isRight(result)).toBe(true);
      if (Either.isRight(result)) {
        expect(result.right._tag).toBe("tab-single-result");
        if (result.right._tag === "tab-single-result") {
          expect(result.right.premiseText).toBe("¬φ, ¬ψ, ¬(φ ∨ ψ)");
        }
      }
    });
  });

  // --- 含意規則 ---

  describe("→ (含意)", () => {
    it("主論理式が含意でない場合はエラー", () => {
      const result = validateTabApplication(
        makeParams({
          ruleId: "implication",
          sequentText: "φ ∧ ψ",
          principalPosition: 0,
        }),
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("TabPrincipalFormulaMismatch");
      }
    });

    it("φ→ψ から分岐: ¬φ / ψ", () => {
      const result = validateTabApplication(
        makeParams({
          ruleId: "implication",
          sequentText: "φ → ψ",
          principalPosition: 0,
        }),
      );
      expect(Either.isRight(result)).toBe(true);
      if (Either.isRight(result)) {
        expect(result.right._tag).toBe("tab-branching-result");
        if (result.right._tag === "tab-branching-result") {
          expect(result.right.leftPremiseText).toBe("¬φ, φ → ψ");
          expect(result.right.rightPremiseText).toBe("ψ, φ → ψ");
        }
      }
    });
  });

  // --- 否定含意規則 ---

  describe("¬→ (否定含意)", () => {
    it("主論理式が¬(φ→ψ)でない場合はエラー（否定でない）", () => {
      const result = validateTabApplication(
        makeParams({
          ruleId: "neg-implication",
          sequentText: "φ → ψ",
          principalPosition: 0,
        }),
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("TabPrincipalFormulaMismatch");
      }
    });

    it("主論理式が¬(φ→ψ)でない場合はエラー（内部が含意でない）", () => {
      const result = validateTabApplication(
        makeParams({
          ruleId: "neg-implication",
          sequentText: "¬(φ ∧ ψ)",
          principalPosition: 0,
        }),
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("TabPrincipalFormulaMismatch");
      }
    });

    it("¬(φ→ψ) から φ, ¬ψ を追加する", () => {
      const result = validateTabApplication(
        makeParams({
          ruleId: "neg-implication",
          sequentText: "¬(φ → ψ)",
          principalPosition: 0,
        }),
      );
      expect(Either.isRight(result)).toBe(true);
      if (Either.isRight(result)) {
        expect(result.right._tag).toBe("tab-single-result");
        if (result.right._tag === "tab-single-result") {
          expect(result.right.premiseText).toBe("φ, ¬ψ, ¬(φ → ψ)");
        }
      }
    });
  });

  // --- 全称規則 ---

  describe("∀ (全称)", () => {
    it("∀x.P(x) から P(y) を追加する", () => {
      const result = validateTabApplication(
        makeParams({
          ruleId: "universal",
          sequentText: "∀x.P(x)",
          principalPosition: 0,
          termText: "y",
        }),
      );
      expect(Either.isRight(result)).toBe(true);
      if (Either.isRight(result)) {
        expect(result.right._tag).toBe("tab-single-result");
        if (result.right._tag === "tab-single-result") {
          expect(result.right.premiseText).toBe("P(y), ∀x.P(x)");
        }
      }
    });

    it("項テキストが空の場合はエラー", () => {
      const result = validateTabApplication(
        makeParams({
          ruleId: "universal",
          sequentText: "∀x.P(x)",
          principalPosition: 0,
          termText: "",
        }),
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("TabTermParseError");
      }
    });

    it("不正な項テキストではエラー", () => {
      const result = validateTabApplication(
        makeParams({
          ruleId: "universal",
          sequentText: "∀x.P(x)",
          principalPosition: 0,
          termText: "∧∧",
        }),
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("TabTermParseError");
      }
    });

    it("主論理式が全称でない場合はエラー", () => {
      const result = validateTabApplication(
        makeParams({
          ruleId: "universal",
          sequentText: "∃x.P(x)",
          principalPosition: 0,
          termText: "y",
        }),
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("TabPrincipalFormulaMismatch");
      }
    });

    it("代入項がfree forでない場合はエラー", () => {
      // ∀x.∀y.P(x) に対して y を代入すると、
      // ∀y.P(y) になり y が内側の ∀y に捕獲される
      const result = validateTabApplication(
        makeParams({
          ruleId: "universal",
          sequentText: "∀x.∀y.P(x)",
          principalPosition: 0,
          termText: "y",
        }),
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("TabEigenVariableError");
      }
    });
  });

  // --- 否定全称規則 ---

  describe("¬∀ (否定全称)", () => {
    it("¬∀x.P(x) から ¬P(z) を追加する（固有変数z）", () => {
      const result = validateTabApplication(
        makeParams({
          ruleId: "neg-universal",
          sequentText: "¬∀x.P(x)",
          principalPosition: 0,
          eigenVariable: "z",
        }),
      );
      expect(Either.isRight(result)).toBe(true);
      if (Either.isRight(result)) {
        expect(result.right._tag).toBe("tab-single-result");
        if (result.right._tag === "tab-single-result") {
          expect(result.right.premiseText).toBe("¬P(z), ¬(∀x.P(x))");
        }
      }
    });

    it("固有変数がシーケント中に自由出現する場合はエラー", () => {
      const result = validateTabApplication(
        makeParams({
          ruleId: "neg-universal",
          sequentText: "¬∀x.P(x), Q(z)",
          principalPosition: 0,
          eigenVariable: "z",
        }),
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("TabEigenVariableError");
      }
    });

    it("固有変数名が空の場合はエラー", () => {
      const result = validateTabApplication(
        makeParams({
          ruleId: "neg-universal",
          sequentText: "¬∀x.P(x)",
          principalPosition: 0,
          eigenVariable: "",
        }),
      );
      expect(Either.isLeft(result)).toBe(true);
    });

    it("主論理式が¬∀でない場合はエラー（否定でない）", () => {
      const result = validateTabApplication(
        makeParams({
          ruleId: "neg-universal",
          sequentText: "∀x.P(x)",
          principalPosition: 0,
          eigenVariable: "z",
        }),
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("TabPrincipalFormulaMismatch");
      }
    });

    it("主論理式が¬∀でない場合はエラー（内部が全称でない）", () => {
      const result = validateTabApplication(
        makeParams({
          ruleId: "neg-universal",
          sequentText: "¬∃x.P(x)",
          principalPosition: 0,
          eigenVariable: "z",
        }),
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("TabPrincipalFormulaMismatch");
      }
    });
  });

  // --- 存在規則 ---

  describe("∃ (存在)", () => {
    it("∃x.P(x) から P(z) を追加する（固有変数z）", () => {
      const result = validateTabApplication(
        makeParams({
          ruleId: "existential",
          sequentText: "∃x.P(x)",
          principalPosition: 0,
          eigenVariable: "z",
        }),
      );
      expect(Either.isRight(result)).toBe(true);
      if (Either.isRight(result)) {
        expect(result.right._tag).toBe("tab-single-result");
        if (result.right._tag === "tab-single-result") {
          expect(result.right.premiseText).toBe("P(z), ∃x.P(x)");
        }
      }
    });

    it("固有変数条件違反時はエラー", () => {
      const result = validateTabApplication(
        makeParams({
          ruleId: "existential",
          sequentText: "∃x.P(x), Q(z)",
          principalPosition: 0,
          eigenVariable: "z",
        }),
      );
      expect(Either.isLeft(result)).toBe(true);
    });

    it("主論理式が存在量化でない場合はエラー", () => {
      const result = validateTabApplication(
        makeParams({
          ruleId: "existential",
          sequentText: "∀x.P(x)",
          principalPosition: 0,
          eigenVariable: "z",
        }),
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("TabPrincipalFormulaMismatch");
      }
    });

    it("固有変数名が空の場合はエラー", () => {
      const result = validateTabApplication(
        makeParams({
          ruleId: "existential",
          sequentText: "∃x.P(x)",
          principalPosition: 0,
          eigenVariable: "",
        }),
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("TabEigenVariableError");
      }
    });
  });

  // --- 否定存在規則 ---

  describe("¬∃ (否定存在)", () => {
    it("¬∃x.P(x) から ¬P(y) を追加する", () => {
      const result = validateTabApplication(
        makeParams({
          ruleId: "neg-existential",
          sequentText: "¬∃x.P(x)",
          principalPosition: 0,
          termText: "y",
        }),
      );
      expect(Either.isRight(result)).toBe(true);
      if (Either.isRight(result)) {
        expect(result.right._tag).toBe("tab-single-result");
        if (result.right._tag === "tab-single-result") {
          expect(result.right.premiseText).toBe("¬P(y), ¬(∃x.P(x))");
        }
      }
    });

    it("主論理式が¬∃でない場合はエラー", () => {
      const result = validateTabApplication(
        makeParams({
          ruleId: "neg-existential",
          sequentText: "¬∀x.P(x)",
          principalPosition: 0,
          termText: "y",
        }),
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("TabPrincipalFormulaMismatch");
      }
    });

    it("項テキストが空の場合はエラー", () => {
      const result = validateTabApplication(
        makeParams({
          ruleId: "neg-existential",
          sequentText: "¬∃x.P(x)",
          principalPosition: 0,
          termText: "",
        }),
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("TabTermParseError");
      }
    });

    it("不正な項テキストではエラー", () => {
      const result = validateTabApplication(
        makeParams({
          ruleId: "neg-existential",
          sequentText: "¬∃x.P(x)",
          principalPosition: 0,
          termText: "∧∧",
        }),
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("TabTermParseError");
      }
    });

    it("代入項がfree forでない場合はエラー", () => {
      // ¬∃x.∀y.P(x) に対して y を代入すると、
      // ¬∀y.P(y) になり y が内側の ∀y に捕獲される
      const result = validateTabApplication(
        makeParams({
          ruleId: "neg-existential",
          sequentText: "¬∃x.∀y.P(x)",
          principalPosition: 0,
          termText: "y",
        }),
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("TabEigenVariableError");
      }
    });
  });

  // --- 位置範囲外エラー ---

  describe("principalPosition範囲外", () => {
    it("位置が負の場合はエラー", () => {
      const result = validateTabApplication(
        makeParams({
          ruleId: "double-negation",
          sequentText: "¬¬φ",
          principalPosition: -1,
        }),
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("TabPrincipalPositionOutOfRange");
      }
    });

    it("位置がformula数以上の場合はエラー", () => {
      const result = validateTabApplication(
        makeParams({
          ruleId: "conjunction",
          sequentText: "φ ∧ ψ",
          principalPosition: 1,
        }),
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("TabPrincipalPositionOutOfRange");
      }
    });
  });

  // --- パースエラー ---

  describe("シーケントパースエラー", () => {
    it("不正な構文のシーケントでエラー", () => {
      const result = validateTabApplication(
        makeParams({
          ruleId: "double-negation",
          sequentText: "∧∧∧",
        }),
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("TabSequentParseError");
      }
    });
  });

  // --- エッジ生成 ---

  describe("createTabEdgeFromResult", () => {
    it("公理結果からTabAxiomEdgeを生成する", () => {
      const params = makeParams({
        ruleId: "bs",
        sequentText: "¬φ, φ",
      });
      const edge = createTabEdgeFromResult(
        params,
        { _tag: "tab-axiom-result" },
        "node-1",
      );
      expect(edge._tag).toBe("tab-axiom");
      expect(edge.conclusionNodeId).toBe("node-1");
    });

    it("1前提結果からTabSinglePremiseEdgeを生成する", () => {
      const params = makeParams({
        ruleId: "double-negation",
        sequentText: "¬¬φ",
        eigenVariable: undefined,
        termText: undefined,
      });
      const edge = createTabEdgeFromResult(
        params,
        { _tag: "tab-single-result", premiseText: "φ, ¬¬φ" },
        "node-1",
      );
      expect(edge._tag).toBe("tab-single");
      expect(edge.conclusionNodeId).toBe("node-1");
      if (edge._tag === "tab-single") {
        expect(edge.premiseNodeId).toBeUndefined();
      }
    });

    it("分岐結果からTabBranchingEdgeを生成する", () => {
      const params = makeParams({
        ruleId: "neg-conjunction",
        sequentText: "¬(φ ∧ ψ)",
      });
      const edge = createTabEdgeFromResult(
        params,
        {
          _tag: "tab-branching-result",
          leftPremiseText: "¬φ, ¬(φ ∧ ψ)",
          rightPremiseText: "¬ψ, ¬(φ ∧ ψ)",
        },
        "node-1",
      );
      expect(edge._tag).toBe("tab-branching");
      if (edge._tag === "tab-branching") {
        expect(edge.leftPremiseNodeId).toBeUndefined();
        expect(edge.rightPremiseNodeId).toBeUndefined();
      }
    });
  });

  // --- 規則分類ヘルパー ---

  describe("isTabAxiomRule", () => {
    it("bs と bottom は公理", () => {
      expect(isTabAxiomRule("bs")).toBe(true);
      expect(isTabAxiomRule("bottom")).toBe(true);
    });

    it("他の規則は公理でない", () => {
      expect(isTabAxiomRule("exchange")).toBe(false);
      expect(isTabAxiomRule("conjunction")).toBe(false);
    });
  });

  describe("isTabSinglePremiseRule", () => {
    it("1前提規則を正しく判定する", () => {
      expect(isTabSinglePremiseRule("exchange")).toBe(true);
      expect(isTabSinglePremiseRule("double-negation")).toBe(true);
      expect(isTabSinglePremiseRule("conjunction")).toBe(true);
      expect(isTabSinglePremiseRule("neg-disjunction")).toBe(true);
    });

    it("公理は1前提でない", () => {
      expect(isTabSinglePremiseRule("bs")).toBe(false);
      expect(isTabSinglePremiseRule("bottom")).toBe(false);
    });

    it("分岐規則は1前提でない", () => {
      expect(isTabSinglePremiseRule("neg-conjunction")).toBe(false);
      expect(isTabSinglePremiseRule("disjunction")).toBe(false);
      expect(isTabSinglePremiseRule("implication")).toBe(false);
    });
  });

  // --- エラーメッセージ ---

  describe("getTabErrorMessage", () => {
    it("各エラー型のメッセージを返す", () => {
      expect(
        getTabErrorMessage(new TabSequentParseError({ nodeId: "x" })),
      ).toBe("Cannot parse sequent formulas");

      expect(
        getTabErrorMessage(
          new TabPrincipalPositionOutOfRange({
            position: 5,
            formulaCount: 3,
          }),
        ),
      ).toBe("Position 5 is out of range (3 formulas)");

      expect(
        getTabErrorMessage(
          new TabPrincipalFormulaMismatch({
            ruleId: "conjunction",
            message: "test message",
          }),
        ),
      ).toBe("test message");

      expect(
        getTabErrorMessage(
          new TabEigenVariableError({
            variableName: "z",
            message: "eigen error",
          }),
        ),
      ).toBe("eigen error");

      expect(
        getTabErrorMessage(new TabTermParseError({ label: "term (τ)" })),
      ).toBe("Enter valid term for term (τ)");

      expect(
        getTabErrorMessage(
          new TabExchangePositionError({ position: 3, maxPosition: 2 }),
        ),
      ).toBe("Exchange position 3 is out of range (max: 2)");
    });
  });

  // --- ワークスペース統合 ---

  describe("applyTabRuleAndConnect", () => {
    it("公理規則適用: 前提ノードなし、エッジのみ追加", () => {
      let ws = createEmptyWorkspace(tabDeduction);
      ws = {
        ...ws,
        nodes: [
          ...ws.nodes,
          {
            id: "node-1",
            kind: "axiom" as const,
            label: "",
            formulaText: "¬φ, φ",
            position: { x: 0, y: 0 },
          },
        ],
        nextNodeId: 2,
      };

      const result = applyTabRuleAndConnect(
        ws,
        "node-1",
        makeParams({ ruleId: "bs", sequentText: "¬φ, φ" }),
        [],
      );

      expect(Either.isRight(result.validation)).toBe(true);
      expect(result.premiseNodeIds).toHaveLength(0);
      expect(result.workspace.inferenceEdges).toHaveLength(1);
      expect(result.workspace.inferenceEdges[0]!._tag).toBe("tab-axiom");
    });

    it("1前提規則適用: 前提ノード1つ作成", () => {
      let ws = createEmptyWorkspace(tabDeduction);
      ws = {
        ...ws,
        nodes: [
          ...ws.nodes,
          {
            id: "node-1",
            kind: "axiom" as const,
            label: "",
            formulaText: "¬¬φ",
            position: { x: 0, y: 0 },
          },
        ],
        nextNodeId: 2,
      };

      const result = applyTabRuleAndConnect(
        ws,
        "node-1",
        makeParams({
          ruleId: "double-negation",
          sequentText: "¬¬φ",
          principalPosition: 0,
        }),
        [{ x: 0, y: 100 }],
      );

      expect(Either.isRight(result.validation)).toBe(true);
      expect(result.premiseNodeIds).toHaveLength(1);
      expect(result.premiseNodeIds[0]).toBe("node-2");

      const premiseNode = result.workspace.nodes.find((n) => n.id === "node-2");
      expect(premiseNode).toBeDefined();
      expect(premiseNode!.formulaText).toBe("φ, ¬¬φ");

      // エッジが前提ノードIDを持つ
      const edge = result.workspace.inferenceEdges.find(
        (e) => e._tag === "tab-single",
      );
      expect(edge).toBeDefined();
      if (edge?._tag === "tab-single") {
        expect(edge.premiseNodeId).toBe("node-2");
      }
    });

    it("分岐規則適用: 前提ノード2つ作成", () => {
      let ws = createEmptyWorkspace(tabDeduction);
      ws = {
        ...ws,
        nodes: [
          ...ws.nodes,
          {
            id: "node-1",
            kind: "axiom" as const,
            label: "",
            formulaText: "¬(φ ∧ ψ)",
            position: { x: 0, y: 0 },
          },
        ],
        nextNodeId: 2,
      };

      const result = applyTabRuleAndConnect(
        ws,
        "node-1",
        makeParams({
          ruleId: "neg-conjunction",
          sequentText: "¬(φ ∧ ψ)",
          principalPosition: 0,
        }),
        [
          { x: -100, y: 100 },
          { x: 100, y: 100 },
        ],
      );

      expect(Either.isRight(result.validation)).toBe(true);
      expect(result.premiseNodeIds).toHaveLength(2);
      expect(result.premiseNodeIds[0]).toBe("node-2");
      expect(result.premiseNodeIds[1]).toBe("node-3");

      const leftNode = result.workspace.nodes.find((n) => n.id === "node-2");
      const rightNode = result.workspace.nodes.find((n) => n.id === "node-3");
      expect(leftNode!.formulaText).toBe("¬φ, ¬(φ ∧ ψ)");
      expect(rightNode!.formulaText).toBe("¬ψ, ¬(φ ∧ ψ)");
    });

    it("バリデーションエラー時は状態を変更しない", () => {
      let ws = createEmptyWorkspace(tabDeduction);
      ws = {
        ...ws,
        nodes: [
          ...ws.nodes,
          {
            id: "node-1",
            kind: "axiom" as const,
            label: "",
            formulaText: "φ",
            position: { x: 0, y: 0 },
          },
        ],
        nextNodeId: 2,
      };

      const result = applyTabRuleAndConnect(
        ws,
        "node-1",
        makeParams({
          ruleId: "conjunction",
          sequentText: "φ",
          principalPosition: 0,
        }),
        [],
      );

      expect(Either.isLeft(result.validation)).toBe(true);
      expect(result.premiseNodeIds).toHaveLength(0);
      expect(result.workspace).toBe(ws);
    });
  });

  // --- 非先頭位置の主論理式 ---

  describe("非先頭位置の主論理式", () => {
    it("位置1の連言に規則を適用する", () => {
      const result = validateTabApplication(
        makeParams({
          ruleId: "conjunction",
          sequentText: "¬φ, φ ∧ ψ",
          principalPosition: 1,
        }),
      );
      expect(Either.isRight(result)).toBe(true);
      if (Either.isRight(result)) {
        expect(result.right._tag).toBe("tab-single-result");
        if (result.right._tag === "tab-single-result") {
          // φ, ψ, φ∧ψ, ¬φ（主論理式の位置にφ∧ψが残り、その前にφ,ψが追加）
          expect(result.right.premiseText).toBe("φ, ψ, φ ∧ ψ, ¬φ");
        }
      }
    });
  });
});

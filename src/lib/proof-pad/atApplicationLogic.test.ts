/**
 * 分析的タブロー（AT）規則適用ロジックのテスト。
 *
 * テスト計画:
 * 1. 署名付き論理式テキストのパース/フォーマット
 * 2. α規則の適用（7パターン: T(∧), F(∨), F(→), T(¬¬), F(¬¬), T(¬), F(¬)）
 * 3. β規則の適用（3パターン: F(∧), T(∨), T(→)）
 * 4. γ規則の適用（2パターン: T(∀), F(∃)）
 * 5. δ規則の適用（2パターン: F(∀), T(∃)）+ 固有変数条件チェック
 * 6. closure の適用（矛盾チェック）
 * 7. エラーケース（パースエラー、規則不一致、項パースエラー等）
 * 8. エッジ生成ヘルパー
 * 9. エラーメッセージ
 */

import { describe, it, expect } from "vitest";
import { Either } from "effect";
import {
  formatSignedFormulaText,
  parseSignedFormulaText,
  validateAtApplication,
  createAtEdgeFromResult,
  getAtErrorMessage,
  AtFormulaParseError,
  AtPrincipalFormulaMismatch,
  AtEigenVariableError,
  AtTermParseError,
  AtContradictionError,
  type AtRuleApplicationParams,
  type AtApplicationSuccess,
} from "./atApplicationLogic";
import { signedFormula } from "../logic-core/analyticTableau";
import { conjunction, predicate } from "../logic-core/formula";

// --- ヘルパー ---

/** バリデーション成功を期待して結果を取得する */
function expectSuccess(params: AtRuleApplicationParams): AtApplicationSuccess {
  const result = validateAtApplication(params);
  expect(Either.isRight(result)).toBe(true);
  if (Either.isLeft(result)) throw new Error("Expected success");
  return result.right;
}

/** バリデーション失敗を期待してエラータグを返す */
function expectErrorTag(params: AtRuleApplicationParams): string {
  const result = validateAtApplication(params);
  expect(Either.isLeft(result)).toBe(true);
  if (Either.isRight(result)) throw new Error("Expected error");
  return result.left._tag;
}

// --- テスト ---

describe("atApplicationLogic", () => {
  // ── 署名付き論理式テキストのパース/フォーマット ──

  describe("formatSignedFormulaText", () => {
    it("T(P) をフォーマットする", () => {
      const sf = signedFormula("T", predicate("P", []));
      expect(formatSignedFormulaText(sf)).toBe("T:P");
    });

    it("F(P∧Q) をフォーマットする", () => {
      const sf = signedFormula(
        "F",
        conjunction(predicate("P", []), predicate("Q", [])),
      );
      expect(formatSignedFormulaText(sf)).toBe("F:P ∧ Q");
    });
  });

  describe("parseSignedFormulaText", () => {
    it("T:P をパースする", () => {
      const result = parseSignedFormulaText("T:P");
      expect(result).not.toBeUndefined();
      expect(result?.sign).toBe("T");
      expect(result?.formula._tag).toBe("Predicate");
    });

    it("F:P→Q をパースする", () => {
      const result = parseSignedFormulaText("F:P→Q");
      expect(result).not.toBeUndefined();
      expect(result?.sign).toBe("F");
      expect(result?.formula._tag).toBe("Implication");
    });

    it("空文字列はundefined", () => {
      expect(parseSignedFormulaText("")).toBeUndefined();
    });

    it("プレフィックスなしはundefined", () => {
      expect(parseSignedFormulaText("P∧Q")).toBeUndefined();
    });

    it("T: のみ（論理式なし）はundefined", () => {
      expect(parseSignedFormulaText("T:")).toBeUndefined();
    });

    it("F: のみ（論理式なし）はundefined", () => {
      expect(parseSignedFormulaText("F:")).toBeUndefined();
    });

    it("不正な論理式はundefined", () => {
      expect(parseSignedFormulaText("T:∧∧")).toBeUndefined();
    });

    it("前後の空白を無視する", () => {
      const result = parseSignedFormulaText("  T: P ∧ Q  ");
      expect(result).not.toBeUndefined();
      expect(result?.sign).toBe("T");
    });
  });

  // ── α規則 ──

  describe("α規則", () => {
    it("T(P∧Q) → T(P), T(Q) [alpha-conj]", () => {
      const result = expectSuccess({
        ruleId: "alpha-conj",
        signedFormulaText: "T:P ∧ Q",
      });
      expect(result._tag).toBe("at-alpha-result");
      if (result._tag !== "at-alpha-result") return;
      expect(result.ruleId).toBe("alpha-conj");
      expect(result.resultText).toBe("T:P");
      expect(result.secondResultText).toBe("T:Q");
    });

    it("F(P∨Q) → F(P), F(Q) [alpha-neg-disj]", () => {
      const result = expectSuccess({
        ruleId: "alpha-neg-disj",
        signedFormulaText: "F:P ∨ Q",
      });
      expect(result._tag).toBe("at-alpha-result");
      if (result._tag !== "at-alpha-result") return;
      expect(result.ruleId).toBe("alpha-neg-disj");
      expect(result.resultText).toBe("F:P");
      expect(result.secondResultText).toBe("F:Q");
    });

    it("F(P→Q) → T(P), F(Q) [alpha-neg-impl]", () => {
      const result = expectSuccess({
        ruleId: "alpha-neg-impl",
        signedFormulaText: "F:P → Q",
      });
      expect(result._tag).toBe("at-alpha-result");
      if (result._tag !== "at-alpha-result") return;
      expect(result.ruleId).toBe("alpha-neg-impl");
      expect(result.resultText).toBe("T:P");
      expect(result.secondResultText).toBe("F:Q");
    });

    it("T(¬¬P) → T(P) [alpha-double-neg-t]", () => {
      const result = expectSuccess({
        ruleId: "alpha-double-neg-t",
        signedFormulaText: "T:¬¬P",
      });
      expect(result._tag).toBe("at-alpha-result");
      if (result._tag !== "at-alpha-result") return;
      expect(result.ruleId).toBe("alpha-double-neg-t");
      expect(result.resultText).toBe("T:P");
      expect(result.secondResultText).toBeUndefined();
    });

    it("F(¬¬P) → F(P) [alpha-double-neg-f]", () => {
      const result = expectSuccess({
        ruleId: "alpha-double-neg-f",
        signedFormulaText: "F:¬¬P",
      });
      expect(result._tag).toBe("at-alpha-result");
      if (result._tag !== "at-alpha-result") return;
      expect(result.ruleId).toBe("alpha-double-neg-f");
      expect(result.resultText).toBe("F:P");
      expect(result.secondResultText).toBeUndefined();
    });

    it("T(¬P) → F(P) [alpha-neg-t]", () => {
      const result = expectSuccess({
        ruleId: "alpha-neg-t",
        signedFormulaText: "T:¬P",
      });
      expect(result._tag).toBe("at-alpha-result");
      if (result._tag !== "at-alpha-result") return;
      expect(result.ruleId).toBe("alpha-neg-t");
      expect(result.resultText).toBe("F:P");
      expect(result.secondResultText).toBeUndefined();
    });

    it("F(¬P) → T(P) [alpha-neg-f]", () => {
      const result = expectSuccess({
        ruleId: "alpha-neg-f",
        signedFormulaText: "F:¬P",
      });
      expect(result._tag).toBe("at-alpha-result");
      if (result._tag !== "at-alpha-result") return;
      expect(result.ruleId).toBe("alpha-neg-f");
      expect(result.resultText).toBe("T:P");
      expect(result.secondResultText).toBeUndefined();
    });
  });

  // ── β規則 ──

  describe("β規則", () => {
    it("F(P∧Q) → [F(P) | F(Q)] [beta-neg-conj]", () => {
      const result = expectSuccess({
        ruleId: "beta-neg-conj",
        signedFormulaText: "F:P ∧ Q",
      });
      expect(result._tag).toBe("at-beta-result");
      if (result._tag !== "at-beta-result") return;
      expect(result.ruleId).toBe("beta-neg-conj");
      expect(result.leftResultText).toBe("F:P");
      expect(result.rightResultText).toBe("F:Q");
    });

    it("T(P∨Q) → [T(P) | T(Q)] [beta-disj]", () => {
      const result = expectSuccess({
        ruleId: "beta-disj",
        signedFormulaText: "T:P ∨ Q",
      });
      expect(result._tag).toBe("at-beta-result");
      if (result._tag !== "at-beta-result") return;
      expect(result.ruleId).toBe("beta-disj");
      expect(result.leftResultText).toBe("T:P");
      expect(result.rightResultText).toBe("T:Q");
    });

    it("T(P→Q) → [F(P) | T(Q)] [beta-impl]", () => {
      const result = expectSuccess({
        ruleId: "beta-impl",
        signedFormulaText: "T:P → Q",
      });
      expect(result._tag).toBe("at-beta-result");
      if (result._tag !== "at-beta-result") return;
      expect(result.ruleId).toBe("beta-impl");
      expect(result.leftResultText).toBe("F:P");
      expect(result.rightResultText).toBe("T:Q");
    });
  });

  // ── γ規則 ──

  describe("γ規則", () => {
    it("T(∀x.P(x)) with term y → T(P(y)) [gamma-univ]", () => {
      const result = expectSuccess({
        ruleId: "gamma-univ",
        signedFormulaText: "T:∀x.P(x)",
        termText: "y",
      });
      expect(result._tag).toBe("at-gamma-result");
      if (result._tag !== "at-gamma-result") return;
      expect(result.ruleId).toBe("gamma-univ");
      expect(result.resultText).toBe("T:P(y)");
      expect(result.termText).toBe("y");
    });

    it("F(∃x.P(x)) with term y → F(P(y)) [gamma-neg-exist]", () => {
      const result = expectSuccess({
        ruleId: "gamma-neg-exist",
        signedFormulaText: "F:∃x.P(x)",
        termText: "y",
      });
      expect(result._tag).toBe("at-gamma-result");
      if (result._tag !== "at-gamma-result") return;
      expect(result.ruleId).toBe("gamma-neg-exist");
      expect(result.resultText).toBe("F:P(y)");
      expect(result.termText).toBe("y");
    });

    it("空の項テキストでエラー", () => {
      const tag = expectErrorTag({
        ruleId: "gamma-univ",
        signedFormulaText: "T:∀x.P(x)",
        termText: "",
      });
      expect(tag).toBe("AtTermParseError");
    });

    it("不正な項テキストでエラー", () => {
      const tag = expectErrorTag({
        ruleId: "gamma-univ",
        signedFormulaText: "T:∀x.P(x)",
        termText: "∧∧",
      });
      expect(tag).toBe("AtTermParseError");
    });
  });

  // ── δ規則 ──

  describe("δ規則", () => {
    it("F(∀x.P(x)) with eigen z → F(P(z)) [delta-neg-univ]", () => {
      const result = expectSuccess({
        ruleId: "delta-neg-univ",
        signedFormulaText: "F:∀x.P(x)",
        eigenVariable: "z",
        branchFormulaTexts: [],
      });
      expect(result._tag).toBe("at-delta-result");
      if (result._tag !== "at-delta-result") return;
      expect(result.ruleId).toBe("delta-neg-univ");
      expect(result.resultText).toBe("F:P(z)");
      expect(result.eigenVariable).toBe("z");
    });

    it("T(∃x.P(x)) with eigen z → T(P(z)) [delta-exist]", () => {
      const result = expectSuccess({
        ruleId: "delta-exist",
        signedFormulaText: "T:∃x.P(x)",
        eigenVariable: "z",
        branchFormulaTexts: [],
      });
      expect(result._tag).toBe("at-delta-result");
      if (result._tag !== "at-delta-result") return;
      expect(result.ruleId).toBe("delta-exist");
      expect(result.resultText).toBe("T:P(z)");
      expect(result.eigenVariable).toBe("z");
    });

    it("空の固有変数名でエラー", () => {
      const tag = expectErrorTag({
        ruleId: "delta-neg-univ",
        signedFormulaText: "F:∀x.P(x)",
        eigenVariable: "",
        branchFormulaTexts: [],
      });
      expect(tag).toBe("AtEigenVariableError");
    });

    it("固有変数条件違反でエラー（枝上に自由変数として出現）", () => {
      const tag = expectErrorTag({
        ruleId: "delta-neg-univ",
        signedFormulaText: "F:∀x.P(x)",
        eigenVariable: "y",
        branchFormulaTexts: ["T:Q(y)"],
      });
      expect(tag).toBe("AtEigenVariableError");
    });

    it("固有変数が枝上に出現しない場合は成功", () => {
      const result = expectSuccess({
        ruleId: "delta-neg-univ",
        signedFormulaText: "F:∀x.P(x)",
        eigenVariable: "z",
        branchFormulaTexts: ["T:Q(y)", "F:R"],
      });
      expect(result._tag).toBe("at-delta-result");
    });

    it("枝上にパース不可能なテキストがあっても無視してバリデーション成功", () => {
      const result = expectSuccess({
        ruleId: "delta-neg-univ",
        signedFormulaText: "F:∀x.P(x)",
        eigenVariable: "z",
        branchFormulaTexts: ["T:Q(y)", "invalid-text", "F:R"],
      });
      expect(result._tag).toBe("at-delta-result");
    });
  });

  // ── closure ──

  describe("closure", () => {
    it("T(P) と F(P) で矛盾を検出", () => {
      const result = expectSuccess({
        ruleId: "closure",
        signedFormulaText: "T:P",
        contradictionFormulaText: "F:P",
      });
      expect(result._tag).toBe("at-closed-result");
    });

    it("F(P∧Q) と T(P∧Q) で矛盾を検出", () => {
      const result = expectSuccess({
        ruleId: "closure",
        signedFormulaText: "F:P ∧ Q",
        contradictionFormulaText: "T:P ∧ Q",
      });
      expect(result._tag).toBe("at-closed-result");
    });

    it("同じ符号同士はエラー（T(P) と T(P)）", () => {
      const tag = expectErrorTag({
        ruleId: "closure",
        signedFormulaText: "T:P",
        contradictionFormulaText: "T:P",
      });
      expect(tag).toBe("AtContradictionError");
    });

    it("異なる論理式はエラー（T(P) と F(Q)）", () => {
      const tag = expectErrorTag({
        ruleId: "closure",
        signedFormulaText: "T:P",
        contradictionFormulaText: "F:Q",
      });
      expect(tag).toBe("AtContradictionError");
    });

    it("矛盾テキスト未指定でエラー", () => {
      const tag = expectErrorTag({
        ruleId: "closure",
        signedFormulaText: "T:P",
      });
      expect(tag).toBe("AtContradictionError");
    });

    it("矛盾テキストが空文字列でエラー", () => {
      const tag = expectErrorTag({
        ruleId: "closure",
        signedFormulaText: "T:P",
        contradictionFormulaText: "",
      });
      expect(tag).toBe("AtContradictionError");
    });

    it("矛盾テキストが空白のみでエラー", () => {
      const tag = expectErrorTag({
        ruleId: "closure",
        signedFormulaText: "T:P",
        contradictionFormulaText: "  ",
      });
      expect(tag).toBe("AtContradictionError");
    });

    it("不正な矛盾テキストでエラー", () => {
      const tag = expectErrorTag({
        ruleId: "closure",
        signedFormulaText: "T:P",
        contradictionFormulaText: "invalid",
      });
      expect(tag).toBe("AtFormulaParseError");
    });
  });

  // ── エラーケース ──

  describe("エラーケース", () => {
    it("パースエラー: 不正なテキスト", () => {
      const tag = expectErrorTag({
        ruleId: "alpha-conj",
        signedFormulaText: "invalid",
      });
      expect(tag).toBe("AtFormulaParseError");
    });

    it("規則不一致: T(P∧Q) に beta-neg-conj を適用", () => {
      // T(P∧Q) は alpha-conj であり、beta-neg-conj ではない
      const tag = expectErrorTag({
        ruleId: "beta-neg-conj",
        signedFormulaText: "T:P ∧ Q",
      });
      expect(tag).toBe("AtPrincipalFormulaMismatch");
    });

    it("規則不一致: F(P∧Q) に alpha-conj を適用", () => {
      // F(P∧Q) は beta-neg-conj であり、alpha-conj ではない
      const tag = expectErrorTag({
        ruleId: "alpha-conj",
        signedFormulaText: "F:P ∧ Q",
      });
      expect(tag).toBe("AtPrincipalFormulaMismatch");
    });

    it("γ規則に termText なしでエラー", () => {
      const tag = expectErrorTag({
        ruleId: "gamma-univ",
        signedFormulaText: "T:∀x.P(x)",
      });
      expect(tag).toBe("AtTermParseError");
    });

    it("closure の signedFormulaText がパース不可", () => {
      const tag = expectErrorTag({
        ruleId: "closure",
        signedFormulaText: "ZZ:P",
        contradictionFormulaText: "F:P",
      });
      expect(tag).toBe("AtFormulaParseError");
    });
  });

  // ── エッジ生成 ──

  describe("createAtEdgeFromResult", () => {
    it("α規則の結果からエッジを生成", () => {
      const result = expectSuccess({
        ruleId: "alpha-conj",
        signedFormulaText: "T:P ∧ Q",
      });
      const edge = createAtEdgeFromResult(
        { ruleId: "alpha-conj", signedFormulaText: "T:P ∧ Q" },
        result,
        "node-1",
      );
      expect(edge._tag).toBe("at-alpha");
      expect(edge.conclusionNodeId).toBe("node-1");
      if (edge._tag !== "at-alpha") return;
      expect(edge.resultNodeId).toBeUndefined();
      expect(edge.secondResultNodeId).toBeUndefined();
      expect(edge.conclusionText).toBe("T:P ∧ Q");
      expect(edge.resultText).toBe("T:P");
      expect(edge.secondResultText).toBe("T:Q");
    });

    it("β規則の結果からエッジを生成", () => {
      const result = expectSuccess({
        ruleId: "beta-impl",
        signedFormulaText: "T:P → Q",
      });
      const edge = createAtEdgeFromResult(
        { ruleId: "beta-impl", signedFormulaText: "T:P → Q" },
        result,
        "node-1",
      );
      expect(edge._tag).toBe("at-beta");
      if (edge._tag !== "at-beta") return;
      expect(edge.leftResultText).toBe("F:P");
      expect(edge.rightResultText).toBe("T:Q");
    });

    it("γ規則の結果からエッジを生成", () => {
      const result = expectSuccess({
        ruleId: "gamma-univ",
        signedFormulaText: "T:∀x.P(x)",
        termText: "y",
      });
      const edge = createAtEdgeFromResult(
        { ruleId: "gamma-univ", signedFormulaText: "T:∀x.P(x)", termText: "y" },
        result,
        "node-1",
      );
      expect(edge._tag).toBe("at-gamma");
      if (edge._tag !== "at-gamma") return;
      expect(edge.resultText).toBe("T:P(y)");
      expect(edge.termText).toBe("y");
    });

    it("δ規則の結果からエッジを生成", () => {
      const result = expectSuccess({
        ruleId: "delta-exist",
        signedFormulaText: "T:∃x.P(x)",
        eigenVariable: "z",
        branchFormulaTexts: [],
      });
      const edge = createAtEdgeFromResult(
        {
          ruleId: "delta-exist",
          signedFormulaText: "T:∃x.P(x)",
          eigenVariable: "z",
        },
        result,
        "node-1",
      );
      expect(edge._tag).toBe("at-delta");
      if (edge._tag !== "at-delta") return;
      expect(edge.resultText).toBe("T:P(z)");
      expect(edge.eigenVariable).toBe("z");
    });

    it("closure の結果からエッジを生成", () => {
      const result = expectSuccess({
        ruleId: "closure",
        signedFormulaText: "T:P",
        contradictionFormulaText: "F:P",
      });
      const edge = createAtEdgeFromResult(
        {
          ruleId: "closure",
          signedFormulaText: "T:P",
          contradictionFormulaText: "F:P",
        },
        result,
        "node-1",
        "node-2",
      );
      expect(edge._tag).toBe("at-closed");
      if (edge._tag !== "at-closed") return;
      expect(edge.conclusionNodeId).toBe("node-1");
      expect(edge.contradictionNodeId).toBe("node-2");
      expect(edge.conclusionText).toBe("T:P");
    });
  });

  // ── エラーメッセージ ──

  describe("getAtErrorMessage", () => {
    it("AtFormulaParseError", () => {
      const msg = getAtErrorMessage(new AtFormulaParseError({ nodeId: "n1" }));
      expect(msg).toContain("parse");
    });

    it("AtPrincipalFormulaMismatch", () => {
      const msg = getAtErrorMessage(
        new AtPrincipalFormulaMismatch({
          ruleId: "alpha-conj",
          message: "test error",
        }),
      );
      expect(msg).toBe("test error");
    });

    it("AtEigenVariableError", () => {
      const msg = getAtErrorMessage(
        new AtEigenVariableError({
          variableName: "z",
          message: "eigen variable error",
        }),
      );
      expect(msg).toBe("eigen variable error");
    });

    it("AtTermParseError", () => {
      const msg = getAtErrorMessage(new AtTermParseError({ label: "term τ" }));
      expect(msg).toContain("term τ");
    });

    it("AtContradictionError", () => {
      const msg = getAtErrorMessage(
        new AtContradictionError({ message: "contradiction needed" }),
      );
      expect(msg).toBe("contradiction needed");
    });
  });
});

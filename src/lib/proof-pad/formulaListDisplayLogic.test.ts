/**
 * formulaListDisplayLogic のテスト。
 *
 * 論理式リスト表示データの変換ロジックを検証する。
 */

import { describe, expect, it } from "vitest";
import {
  formulaTextsToDisplayData,
  isFormulaListText,
} from "./formulaListDisplayLogic";

// ── isFormulaListText ──────────────────────────────────────

describe("isFormulaListText", () => {
  it("カンマを含むテキストはtrue", () => {
    expect(isFormulaListText("phi, psi")).toBe(true);
  });

  it("カンマを含まないテキストはfalse", () => {
    expect(isFormulaListText("phi")).toBe(false);
  });

  it("シーケント形式（⇒を含む）はfalse", () => {
    expect(isFormulaListText("phi, psi ⇒ chi")).toBe(false);
  });

  it("署名付き論理式形式（T:で始まる）はfalse", () => {
    expect(isFormulaListText("T:phi, psi")).toBe(false);
  });

  it("署名付き論理式形式（F:で始まる）はfalse", () => {
    expect(isFormulaListText("F:phi, psi")).toBe(false);
  });

  it("空文字列はfalse", () => {
    expect(isFormulaListText("")).toBe(false);
  });

  it("多引数関数P(x,y)のようなカンマもtrue", () => {
    expect(isFormulaListText("P(x,y)")).toBe(true);
  });
});

// ── formulaTextsToDisplayData ──────────────────────────────

describe("formulaTextsToDisplayData", () => {
  it("有効な論理式配列をparsedスロットに変換", () => {
    const result = formulaTextsToDisplayData(["phi", "psi"]);
    expect(result.formulas).toHaveLength(2);
    expect(result.formulas[0]?._tag).toBe("parsed");
    expect(result.formulas[1]?._tag).toBe("parsed");
  });

  it("空テキストはフィルタされる", () => {
    const result = formulaTextsToDisplayData(["phi", "", "  ", "psi"]);
    expect(result.formulas).toHaveLength(2);
  });

  it("パース失敗テキストはtextスロットになる", () => {
    const result = formulaTextsToDisplayData(["phi ->", "psi"]);
    expect(result.formulas[0]?._tag).toBe("text");
    expect(result.formulas[1]?._tag).toBe("parsed");
  });

  it("空配列は空のformulas", () => {
    const result = formulaTextsToDisplayData([]);
    expect(result.formulas).toHaveLength(0);
  });

  it("含意を含む有効な論理式もparsedに", () => {
    const result = formulaTextsToDisplayData(["phi -> psi"]);
    expect(result.formulas).toHaveLength(1);
    expect(result.formulas[0]?._tag).toBe("parsed");
  });
});

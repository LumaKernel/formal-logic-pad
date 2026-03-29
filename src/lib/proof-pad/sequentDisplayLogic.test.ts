/**
 * sequentDisplayLogic のテスト。
 *
 * シーケント表示データの変換ロジックを検証する。
 */

import { describe, expect, it } from "vitest";
import { MetaVariable, Implication } from "../logic-core/formula";
import type { Sequent } from "../logic-core/sequentCalculus";
import {
  textToFormulaSlot,
  parseSequentDisplayData,
  sequentToDisplayData,
  sequentTextsToDisplayData,
  isSequentText,
} from "./sequentDisplayLogic";

const phi = new MetaVariable({ name: "φ" });
const psi = new MetaVariable({ name: "ψ" });
const chi = new MetaVariable({ name: "χ" });

// ── isSequentText ──────────────────────────────────────────

describe("isSequentText", () => {
  it("⇒を含むテキストはtrue", () => {
    expect(isSequentText("φ ⇒ ψ")).toBe(true);
  });

  it("⇒を含まないテキストはfalse", () => {
    expect(isSequentText("φ → ψ")).toBe(false);
  });

  it("空文字列はfalse", () => {
    expect(isSequentText("")).toBe(false);
  });
});

// ── textToFormulaSlot ──────────────────────────────────────

describe("textToFormulaSlot", () => {
  it("パース可能な式はparsedスロットになる", () => {
    const slot = textToFormulaSlot("phi");
    expect(slot._tag).toBe("parsed");
    if (slot._tag === "parsed") {
      expect(slot.formula._tag).toBe("MetaVariable");
    }
  });

  it("パース不能な式はtextスロットになる", () => {
    const slot = textToFormulaSlot("not a formula !!!");
    expect(slot._tag).toBe("text");
    if (slot._tag === "text") {
      expect(slot.text).toBe("not a formula !!!");
    }
  });

  it("空文字列はtextスロット", () => {
    const slot = textToFormulaSlot("");
    expect(slot._tag).toBe("text");
  });

  it("前後の空白はトリムされる", () => {
    const slot = textToFormulaSlot("  phi  ");
    expect(slot._tag).toBe("parsed");
  });
});

// ── parseSequentDisplayData ────────────────────────────────

describe("parseSequentDisplayData", () => {
  it("前件と後件をパースする", () => {
    const data = parseSequentDisplayData("phi ⇒ psi");
    expect(data.antecedents).toHaveLength(1);
    expect(data.succedents).toHaveLength(1);
    expect(data.antecedents[0]?._tag).toBe("parsed");
    expect(data.succedents[0]?._tag).toBe("parsed");
  });

  it("複数の前件をパースする", () => {
    const data = parseSequentDisplayData("phi, psi ⇒ chi");
    expect(data.antecedents).toHaveLength(2);
    expect(data.succedents).toHaveLength(1);
  });

  it("複数の後件をパースする", () => {
    const data = parseSequentDisplayData("phi ⇒ psi, chi");
    expect(data.antecedents).toHaveLength(1);
    expect(data.succedents).toHaveLength(2);
  });

  it("前件が空の場合", () => {
    const data = parseSequentDisplayData("⇒ psi");
    expect(data.antecedents).toHaveLength(0);
    expect(data.succedents).toHaveLength(1);
  });

  it("後件が空の場合", () => {
    const data = parseSequentDisplayData("phi ⇒");
    expect(data.antecedents).toHaveLength(1);
    expect(data.succedents).toHaveLength(0);
  });

  it("両方が空の場合", () => {
    const data = parseSequentDisplayData("⇒");
    expect(data.antecedents).toHaveLength(0);
    expect(data.succedents).toHaveLength(0);
  });

  it("⇒がない場合は全体を前件とする", () => {
    const data = parseSequentDisplayData("phi, psi");
    expect(data.antecedents).toHaveLength(2);
    expect(data.succedents).toHaveLength(0);
  });

  it("空文字列の場合は空配列", () => {
    const data = parseSequentDisplayData("");
    expect(data.antecedents).toHaveLength(0);
    expect(data.succedents).toHaveLength(0);
  });
});

// ── sequentToDisplayData ───────────────────────────────────

describe("sequentToDisplayData", () => {
  it("Sequent型から表示データに変換する", () => {
    const seq: Sequent = {
      antecedents: [phi, psi],
      succedents: [chi],
    };
    const data = sequentToDisplayData(seq);
    expect(data.antecedents).toHaveLength(2);
    expect(data.succedents).toHaveLength(1);
    expect(data.antecedents[0]?._tag).toBe("parsed");
    expect(data.succedents[0]?._tag).toBe("parsed");
  });

  it("空のSequentを処理する", () => {
    const seq: Sequent = {
      antecedents: [],
      succedents: [],
    };
    const data = sequentToDisplayData(seq);
    expect(data.antecedents).toHaveLength(0);
    expect(data.succedents).toHaveLength(0);
  });

  it("複雑な式を含むSequentを変換する", () => {
    const impl = new Implication({ left: phi, right: psi });
    const seq: Sequent = {
      antecedents: [impl],
      succedents: [chi],
    };
    const data = sequentToDisplayData(seq);
    expect(data.antecedents).toHaveLength(1);
    if (data.antecedents[0]?._tag === "parsed") {
      expect(data.antecedents[0].formula._tag).toBe("Implication");
    }
  });
});

describe("sequentTextsToDisplayData", () => {
  it("構造化テキストからSequentDisplayDataを生成する", () => {
    const data = sequentTextsToDisplayData({
      antecedentTexts: ["phi", "psi"],
      succedentTexts: ["chi"],
    });
    expect(data.antecedents).toHaveLength(2);
    expect(data.succedents).toHaveLength(1);
    expect(data.antecedents[0]?._tag).toBe("parsed");
    expect(data.succedents[0]?._tag).toBe("parsed");
  });

  it("空配列の場合は空のDisplayDataを返す", () => {
    const data = sequentTextsToDisplayData({
      antecedentTexts: [],
      succedentTexts: [],
    });
    expect(data.antecedents).toHaveLength(0);
    expect(data.succedents).toHaveLength(0);
  });

  it("パース失敗のテキストはtextスロットになる", () => {
    const data = sequentTextsToDisplayData({
      antecedentTexts: ["-> ->"],
      succedentTexts: ["phi"],
    });
    expect(data.antecedents[0]?._tag).toBe("text");
    expect(data.succedents[0]?._tag).toBe("parsed");
  });

  it("空白のみのテキストはフィルタされる", () => {
    const data = sequentTextsToDisplayData({
      antecedentTexts: ["  ", "phi"],
      succedentTexts: [""],
    });
    expect(data.antecedents).toHaveLength(1);
    expect(data.succedents).toHaveLength(0);
  });
});

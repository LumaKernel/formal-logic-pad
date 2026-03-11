import { describe, expect, it } from "vitest";
import {
  addFormula,
  removeFormula,
  updateFormula,
  moveUp,
  moveDown,
  validateFormulaList,
  extractNonEmptyFormulas,
} from "./formulaListLogic";

describe("addFormula", () => {
  it("空リストに追加すると1要素になる", () => {
    expect(addFormula([])).toEqual([""]);
  });

  it("既存リストの末尾に追加する", () => {
    expect(addFormula(["A", "B"])).toEqual(["A", "B", ""]);
  });
});

describe("removeFormula", () => {
  it("指定インデックスの要素を削除する", () => {
    expect(removeFormula(["A", "B", "C"], 1)).toEqual(["A", "C"]);
  });

  it("先頭要素を削除する", () => {
    expect(removeFormula(["A", "B"], 0)).toEqual(["B"]);
  });

  it("末尾要素を削除する", () => {
    expect(removeFormula(["A", "B"], 1)).toEqual(["A"]);
  });

  it("範囲外インデックスでは変更しない", () => {
    const formulas = ["A", "B"];
    expect(removeFormula(formulas, -1)).toBe(formulas);
    expect(removeFormula(formulas, 2)).toBe(formulas);
  });
});

describe("updateFormula", () => {
  it("指定インデックスのテキストを更新する", () => {
    expect(updateFormula(["A", "B", "C"], 1, "D")).toEqual(["A", "D", "C"]);
  });

  it("範囲外インデックスでは変更しない", () => {
    const formulas = ["A"];
    expect(updateFormula(formulas, -1, "X")).toBe(formulas);
    expect(updateFormula(formulas, 1, "X")).toBe(formulas);
  });
});

describe("moveUp", () => {
  it("要素を1つ上に移動する", () => {
    expect(moveUp(["A", "B", "C"], 1)).toEqual(["B", "A", "C"]);
  });

  it("末尾を1つ上に移動する", () => {
    expect(moveUp(["A", "B", "C"], 2)).toEqual(["A", "C", "B"]);
  });

  it("先頭要素はそのまま", () => {
    const formulas = ["A", "B"];
    expect(moveUp(formulas, 0)).toBe(formulas);
  });

  it("範囲外インデックスではそのまま", () => {
    const formulas = ["A", "B"];
    expect(moveUp(formulas, -1)).toBe(formulas);
    expect(moveUp(formulas, 3)).toBe(formulas);
  });
});

describe("moveDown", () => {
  it("要素を1つ下に移動する", () => {
    expect(moveDown(["A", "B", "C"], 0)).toEqual(["B", "A", "C"]);
  });

  it("中間を1つ下に移動する", () => {
    expect(moveDown(["A", "B", "C"], 1)).toEqual(["A", "C", "B"]);
  });

  it("末尾要素はそのまま", () => {
    const formulas = ["A", "B"];
    expect(moveDown(formulas, 1)).toBe(formulas);
  });

  it("範囲外インデックスではそのまま", () => {
    const formulas = ["A", "B"];
    expect(moveDown(formulas, -1)).toBe(formulas);
    expect(moveDown(formulas, 3)).toBe(formulas);
  });
});

describe("validateFormulaList", () => {
  it("非空リストはvalid", () => {
    expect(validateFormulaList(["A → B"])).toEqual({ valid: true });
  });

  it("複数要素でもvalid", () => {
    expect(validateFormulaList(["A", "B"])).toEqual({ valid: true });
  });

  it("空リストはinvalid", () => {
    const result = validateFormulaList([]);
    expect(result.valid).toBe(false);
  });

  it("空文字列のみのリストはinvalid", () => {
    const result = validateFormulaList(["", "  ", "\t"]);
    expect(result.valid).toBe(false);
  });

  it("空白以外が1つでもあればvalid", () => {
    expect(validateFormulaList(["", "A", ""]).valid).toBe(true);
  });
});

describe("extractNonEmptyFormulas", () => {
  it("空文字列をフィルタする", () => {
    expect(extractNonEmptyFormulas(["A", "", "B"])).toEqual(["A", "B"]);
  });

  it("空白のみもフィルタする", () => {
    expect(extractNonEmptyFormulas(["  ", "A", " B "])).toEqual(["A", "B"]);
  });

  it("すべて空なら空配列", () => {
    expect(extractNonEmptyFormulas(["", "  "])).toEqual([]);
  });

  it("空リストなら空配列", () => {
    expect(extractNonEmptyFormulas([])).toEqual([]);
  });
});

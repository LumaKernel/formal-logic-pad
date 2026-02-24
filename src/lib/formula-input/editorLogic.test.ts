import { describe, expect, it } from "vitest";
import type { FormulaParseState } from "./FormulaInput";
import { canExitEditMode, computeExitAction } from "./editorLogic";

describe("canExitEditMode", () => {
  it("empty状態ではtrueを返す", () => {
    const state: FormulaParseState = { status: "empty" };
    expect(canExitEditMode(state)).toBe(true);
  });

  it("success状態ではtrueを返す", () => {
    // Formula ASTのモック
    const state: FormulaParseState = {
      status: "success",
      formula: { _tag: "PredicateFormula", name: "P", args: [] } as never,
    };
    expect(canExitEditMode(state)).toBe(true);
  });

  it("error状態ではfalseを返す", () => {
    const state: FormulaParseState = {
      status: "error",
      errors: [
        {
          message: "unexpected token",
          span: {
            start: { line: 1, column: 1 },
            end: { line: 1, column: 2 },
          },
        },
      ],
    };
    expect(canExitEditMode(state)).toBe(false);
  });
});

describe("computeExitAction", () => {
  it("success状態では'display'を返す", () => {
    const state: FormulaParseState = {
      status: "success",
      formula: { _tag: "PredicateFormula", name: "P", args: [] } as never,
    };
    expect(computeExitAction(state)).toBe("display");
  });

  it("empty状態では'display'を返す", () => {
    const state: FormulaParseState = { status: "empty" };
    expect(computeExitAction(state)).toBe("display");
  });

  it("error状態ではnullを返す", () => {
    const state: FormulaParseState = {
      status: "error",
      errors: [
        {
          message: "unexpected token",
          span: {
            start: { line: 1, column: 1 },
            end: { line: 1, column: 2 },
          },
        },
      ],
    };
    expect(computeExitAction(state)).toBeNull();
  });
});

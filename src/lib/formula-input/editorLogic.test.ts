import { describe, expect, it } from "vitest";
import { ParseError } from "../logic-lang/parser";
import type { FormulaParseState } from "./FormulaInput";
import type { TermParseState } from "./TermInput";
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
        new ParseError({
          message: "unexpected token",
          span: {
            start: { line: 1, column: 1 },
            end: { line: 1, column: 2 },
          },
        }),
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
        new ParseError({
          message: "unexpected token",
          span: {
            start: { line: 1, column: 1 },
            end: { line: 1, column: 2 },
          },
        }),
      ],
    };
    expect(computeExitAction(state)).toBeNull();
  });
});

describe("TermParseState との互換性", () => {
  it("canExitEditMode は TermParseState でも動作する", () => {
    const empty: TermParseState = { status: "empty" };
    expect(canExitEditMode(empty)).toBe(true);

    const success: TermParseState = {
      status: "success",
      term: { _tag: "Variable", name: "x" } as never,
    };
    expect(canExitEditMode(success)).toBe(true);

    const error: TermParseState = {
      status: "error",
      errors: [
        new ParseError({
          message: "unexpected token",
          span: {
            start: { line: 1, column: 1 },
            end: { line: 1, column: 2 },
          },
        }),
      ],
    };
    expect(canExitEditMode(error)).toBe(false);
  });

  it("computeExitAction は TermParseState でも動作する", () => {
    const success: TermParseState = {
      status: "success",
      term: { _tag: "Variable", name: "x" } as never,
    };
    expect(computeExitAction(success)).toBe("display");

    const error: TermParseState = {
      status: "error",
      errors: [
        new ParseError({
          message: "unexpected token",
          span: {
            start: { line: 1, column: 1 },
            end: { line: 1, column: 2 },
          },
        }),
      ],
    };
    expect(computeExitAction(error)).toBeNull();
  });
});

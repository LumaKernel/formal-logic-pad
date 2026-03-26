import { describe, expect, it } from "vitest";
import { Either } from "effect";
import {
  validateSimplifyFormula,
  getSimplifyFormulaErrorMessage,
  SimplifyFormulaParseError,
  SimplifyFormulaNoChange,
  SimplifyFormulaEmpty,
} from "./simplifyFormulaLogic";

describe("simplifyFormulaLogic", () => {
  describe("validateSimplifyFormula", () => {
    it("FormulaSubstitution P(x)[a/x] を P(a) に簡約", () => {
      const result = validateSimplifyFormula("P(x)[a/x]");
      expect(Either.isRight(result)).toBe(true);
      if (Either.isRight(result)) {
        expect(result.right.simplifiedText).toBe("P(a)");
      }
    });

    it("ネストした FormulaSubstitution を解決", () => {
      const result = validateSimplifyFormula("(P(x) -> Q(x))[a/x]");
      expect(Either.isRight(result)).toBe(true);
      if (Either.isRight(result)) {
        expect(result.right.simplifiedText).toBe("P(a) → Q(a)");
      }
    });

    it("変化なし（既に簡約済み）でエラー", () => {
      const result = validateSimplifyFormula("P(a)");
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("SimplifyFormulaNoChange");
      }
    });

    it("命題変数のみ（変化なし）でエラー", () => {
      const result = validateSimplifyFormula("phi -> psi");
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("SimplifyFormulaNoChange");
      }
    });

    it("パース不可でエラー", () => {
      const result = validateSimplifyFormula("invalid!!!");
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("SimplifyFormulaParseError");
      }
    });

    it("空文字列でエラー", () => {
      const result = validateSimplifyFormula("");
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("SimplifyFormulaEmpty");
      }
    });

    it("空白のみでエラー", () => {
      const result = validateSimplifyFormula("   ");
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("SimplifyFormulaEmpty");
      }
    });
  });

  describe("getSimplifyFormulaErrorMessage", () => {
    it("各エラー型に対してメッセージを返す", () => {
      expect(
        getSimplifyFormulaErrorMessage(new SimplifyFormulaParseError({})),
      ).toBe("Formula cannot be parsed");
      expect(
        getSimplifyFormulaErrorMessage(new SimplifyFormulaNoChange({})),
      ).toBe("Formula is already simplified");
      expect(getSimplifyFormulaErrorMessage(new SimplifyFormulaEmpty({}))).toBe(
        "Formula is empty",
      );
    });
  });
});

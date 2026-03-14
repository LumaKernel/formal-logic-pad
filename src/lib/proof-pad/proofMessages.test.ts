/**
 * proofMessages のテスト。
 *
 * メッセージキー変換の純粋ロジックと、プレースホルダー置換をテストする。
 */

import { describe, it, expect } from "vitest";
import { Either } from "effect";
import {
  defaultProofMessages,
  getMPErrorMessageKey,
  getGenErrorMessageKey,
  getSubstitutionErrorMessageKey,
  getNormalizeErrorMessageKey,
  processValidationResult,
  formatMessage,
  type ProofMessages,
} from "./proofMessages";
import type { MPApplicationError } from "./mpApplicationLogic";
import {
  BothPremisesMissing,
  LeftPremiseMissing,
  RightPremiseMissing,
  LeftParseError,
  RightParseError,
  MPRuleError,
} from "./mpApplicationLogic";
import type { GenApplicationError } from "./genApplicationLogic";
import {
  GenPremiseMissing,
  GenPremiseParseError,
  GenVariableNameEmpty,
  GenGeneralizationNotEnabled,
  GenRuleError,
} from "./genApplicationLogic";
import type { SubstitutionApplicationError } from "./substitutionApplicationLogic";
import {
  SubstPremiseMissing,
  SubstPremiseParseError,
  SubstNoEntries,
  SubstFormulaParseError,
  SubstTermParseError,
} from "./substitutionApplicationLogic";
import type { NormalizeApplicationError } from "./normalizeApplicationLogic";
import {
  NormalizeParseError,
  NormalizeNoChange,
  NormalizeEmptyFormula,
} from "./normalizeApplicationLogic";
import { metaVariable } from "../logic-core/formula";
import { NotAnImplication, PremiseMismatch } from "../logic-core/inferenceRule";

describe("defaultProofMessages", () => {
  it("should have non-empty string values for all keys", () => {
    const keys = Object.keys(defaultProofMessages) as ReadonlyArray<
      keyof ProofMessages
    >;
    for (const key of keys) {
      expect(defaultProofMessages[key]).toBeTruthy();
      expect(typeof defaultProofMessages[key]).toBe("string");
    }
  });

  it("should include placeholder in template messages", () => {
    expect(defaultProofMessages.genBannerSelectPremise).toContain(
      "{variableName}",
    );
    expect(defaultProofMessages.selectionCount).toContain("{count}");
    expect(defaultProofMessages.axiomIdentifiedTooltip).toContain(
      "{axiomName}",
    );
  });
});

describe("getMPErrorMessageKey", () => {
  it("should return mpErrorBothMissing for BothPremisesMissing", () => {
    const error: MPApplicationError = new BothPremisesMissing({});
    expect(getMPErrorMessageKey(error)).toBe("mpErrorBothMissing");
  });

  it("should return mpErrorLeftMissing for LeftPremiseMissing", () => {
    const error: MPApplicationError = new LeftPremiseMissing({});
    expect(getMPErrorMessageKey(error)).toBe("mpErrorLeftMissing");
  });

  it("should return mpErrorRightMissing for RightPremiseMissing", () => {
    const error: MPApplicationError = new RightPremiseMissing({});
    expect(getMPErrorMessageKey(error)).toBe("mpErrorRightMissing");
  });

  it("should return mpErrorLeftParse for LeftParseError", () => {
    const error: MPApplicationError = new LeftParseError({ nodeId: "test" });
    expect(getMPErrorMessageKey(error)).toBe("mpErrorLeftParse");
  });

  it("should return mpErrorRightParse for RightParseError", () => {
    const error: MPApplicationError = new RightParseError({ nodeId: "test" });
    expect(getMPErrorMessageKey(error)).toBe("mpErrorRightParse");
  });

  it("should return mpErrorNotImplication for NotAnImplication RuleError", () => {
    const phi = metaVariable("φ");
    const error: MPApplicationError = new MPRuleError({
      error: new NotAnImplication({ formula: phi }),
    });
    expect(getMPErrorMessageKey(error)).toBe("mpErrorNotImplication");
  });

  it("should return mpErrorPremiseMismatch for PremiseMismatch RuleError", () => {
    const phi = metaVariable("φ");
    const psi = metaVariable("ψ");
    const error: MPApplicationError = new MPRuleError({
      error: new PremiseMismatch({ expected: phi, actual: psi }),
    });
    expect(getMPErrorMessageKey(error)).toBe("mpErrorPremiseMismatch");
  });

  it("should return a valid key for all error types", () => {
    const phi = metaVariable("φ");
    const psi = metaVariable("ψ");
    const errors: readonly MPApplicationError[] = [
      new BothPremisesMissing({}),
      new LeftPremiseMissing({}),
      new RightPremiseMissing({}),
      new LeftParseError({ nodeId: "x" }),
      new RightParseError({ nodeId: "x" }),
      new MPRuleError({
        error: new NotAnImplication({ formula: phi }),
      }),
      new MPRuleError({
        error: new PremiseMismatch({ expected: phi, actual: psi }),
      }),
    ];

    for (const error of errors) {
      const key = getMPErrorMessageKey(error);
      expect(key in defaultProofMessages).toBe(true);
      expect(defaultProofMessages[key]).toBeTruthy();
    }
  });
});

describe("getGenErrorMessageKey", () => {
  it("should return genErrorPremiseMissing for GenPremiseMissing", () => {
    const error: GenApplicationError = new GenPremiseMissing({});
    expect(getGenErrorMessageKey(error)).toBe("genErrorPremiseMissing");
  });

  it("should return genErrorPremiseParse for GenPremiseParseError", () => {
    const error: GenApplicationError = new GenPremiseParseError({
      nodeId: "test",
    });
    expect(getGenErrorMessageKey(error)).toBe("genErrorPremiseParse");
  });

  it("should return genErrorVariableEmpty for GenVariableNameEmpty", () => {
    const error: GenApplicationError = new GenVariableNameEmpty({});
    expect(getGenErrorMessageKey(error)).toBe("genErrorVariableEmpty");
  });

  it("should return genErrorNotEnabled for GenGeneralizationNotEnabled", () => {
    const error: GenApplicationError = new GenGeneralizationNotEnabled({});
    expect(getGenErrorMessageKey(error)).toBe("genErrorNotEnabled");
  });

  it("should return genErrorGeneric for GenRuleError", () => {
    const error: GenApplicationError = new GenRuleError({
      message: "Something failed",
    });
    expect(getGenErrorMessageKey(error)).toBe("genErrorGeneric");
  });

  it("should return a valid key for all error types", () => {
    const errors: readonly GenApplicationError[] = [
      new GenPremiseMissing({}),
      new GenPremiseParseError({ nodeId: "x" }),
      new GenVariableNameEmpty({}),
      new GenGeneralizationNotEnabled({}),
      new GenRuleError({ message: "fail" }),
    ];

    for (const error of errors) {
      const key = getGenErrorMessageKey(error);
      expect(key in defaultProofMessages).toBe(true);
      expect(defaultProofMessages[key]).toBeTruthy();
    }
  });
});

describe("getSubstitutionErrorMessageKey", () => {
  it("should return substErrorPremiseMissing for SubstPremiseMissing", () => {
    const error: SubstitutionApplicationError = new SubstPremiseMissing({});
    expect(getSubstitutionErrorMessageKey(error)).toBe(
      "substErrorPremiseMissing",
    );
  });

  it("should return substErrorPremiseParse for SubstPremiseParseError", () => {
    const error: SubstitutionApplicationError = new SubstPremiseParseError({
      nodeId: "test",
    });
    expect(getSubstitutionErrorMessageKey(error)).toBe(
      "substErrorPremiseParse",
    );
  });

  it("should return substErrorNoEntries for SubstNoEntries", () => {
    const error: SubstitutionApplicationError = new SubstNoEntries({});
    expect(getSubstitutionErrorMessageKey(error)).toBe("substErrorNoEntries");
  });

  it("should return substErrorFormulaParse for SubstFormulaParseError", () => {
    const error: SubstitutionApplicationError = new SubstFormulaParseError({
      entryIndex: 0,
      formulaText: "bad",
    });
    expect(getSubstitutionErrorMessageKey(error)).toBe(
      "substErrorFormulaParse",
    );
  });

  it("should return substErrorTermParse for SubstTermParseError", () => {
    const error: SubstitutionApplicationError = new SubstTermParseError({
      entryIndex: 1,
      termText: "bad",
    });
    expect(getSubstitutionErrorMessageKey(error)).toBe("substErrorTermParse");
  });

  it("should return a valid key for all error types", () => {
    const errors: readonly SubstitutionApplicationError[] = [
      new SubstPremiseMissing({}),
      new SubstPremiseParseError({ nodeId: "x" }),
      new SubstNoEntries({}),
      new SubstFormulaParseError({ entryIndex: 0, formulaText: "bad" }),
      new SubstTermParseError({ entryIndex: 0, termText: "bad" }),
    ];

    for (const error of errors) {
      const key = getSubstitutionErrorMessageKey(error);
      expect(key in defaultProofMessages).toBe(true);
      expect(defaultProofMessages[key]).toBeTruthy();
    }
  });
});

describe("getNormalizeErrorMessageKey", () => {
  it("should return normalizeParseError for NormalizeParseError", () => {
    const error: NormalizeApplicationError = new NormalizeParseError({});
    expect(getNormalizeErrorMessageKey(error)).toBe("normalizeParseError");
  });

  it("should return normalizeNoChange for NormalizeNoChange", () => {
    const error: NormalizeApplicationError = new NormalizeNoChange({});
    expect(getNormalizeErrorMessageKey(error)).toBe("normalizeNoChange");
  });

  it("should return normalizeEmptyFormula for NormalizeEmptyFormula", () => {
    const error: NormalizeApplicationError = new NormalizeEmptyFormula({});
    expect(getNormalizeErrorMessageKey(error)).toBe("normalizeEmptyFormula");
  });

  it("should return a valid key for all error types", () => {
    const errors: readonly NormalizeApplicationError[] = [
      new NormalizeParseError({}),
      new NormalizeNoChange({}),
      new NormalizeEmptyFormula({}),
    ];

    for (const error of errors) {
      const key = getNormalizeErrorMessageKey(error);
      expect(key in defaultProofMessages).toBe(true);
      expect(defaultProofMessages[key]).toBeTruthy();
    }
  });
});

describe("processValidationResult", () => {
  it("成功時はsuccessメッセージを返す", () => {
    const result = Either.right({ conclusionText: "φ" });
    const display = processValidationResult(
      result,
      "MP applied",
      getMPErrorMessageKey,
      (e) => e._tag === "BothPremisesMissing",
      defaultProofMessages,
    );
    expect(display).toEqual({ message: "MP applied", type: "success" });
  });

  it("スキップ対象エラーの場合はundefinedを返す", () => {
    const result: Either.Either<
      { readonly conclusionText: string },
      MPApplicationError
    > = Either.left(new BothPremisesMissing({}));
    const display = processValidationResult(
      result,
      "MP applied",
      getMPErrorMessageKey,
      (e) => e._tag === "BothPremisesMissing",
      defaultProofMessages,
    );
    expect(display).toBeUndefined();
  });

  it("表示対象エラーの場合はエラーメッセージを返す", () => {
    const result: Either.Either<
      { readonly conclusionText: string },
      MPApplicationError
    > = Either.left(new LeftPremiseMissing({}));
    const display = processValidationResult(
      result,
      "MP applied",
      getMPErrorMessageKey,
      (e) => e._tag === "BothPremisesMissing",
      defaultProofMessages,
    );
    expect(display).toEqual({
      message: defaultProofMessages.mpErrorLeftMissing,
      type: "error",
    });
  });

  it("Gen エラーでも正しく動作する", () => {
    const result: Either.Either<unknown, GenApplicationError> = Either.left(
      new GenVariableNameEmpty({}),
    );
    const display = processValidationResult(
      result,
      "Gen applied",
      getGenErrorMessageKey,
      (e) => e._tag === "GenPremiseMissing",
      defaultProofMessages,
    );
    expect(display).toEqual({
      message: defaultProofMessages.genErrorVariableEmpty,
      type: "error",
    });
  });

  it("Substitution エラーでも正しく動作する", () => {
    const result: Either.Either<unknown, SubstitutionApplicationError> =
      Either.left(new SubstNoEntries({}));
    const display = processValidationResult(
      result,
      "Substitution applied",
      getSubstitutionErrorMessageKey,
      (e) => e._tag === "SubstPremiseMissing",
      defaultProofMessages,
    );
    expect(display).toEqual({
      message: defaultProofMessages.substErrorNoEntries,
      type: "error",
    });
  });

  it("shouldSkipError で外部変数による複合条件を使える", () => {
    // Substitutionの特殊ケース: SubstPremiseMissingでもentries.length > 0ならエラー表示
    const result: Either.Either<unknown, SubstitutionApplicationError> =
      Either.left(new SubstPremiseMissing({}));

    // entries が空 → スキップ
    const emptyEntries: readonly unknown[] = [];
    const display1 = processValidationResult(
      result,
      "Substitution applied",
      getSubstitutionErrorMessageKey,
      (e) => e._tag === "SubstPremiseMissing" && emptyEntries.length === 0,
      defaultProofMessages,
    );
    expect(display1).toBeUndefined();

    // entries がある → エラー表示
    const nonEmptyEntries: readonly unknown[] = [{ text: "x" }];
    const display2 = processValidationResult(
      result,
      "Substitution applied",
      getSubstitutionErrorMessageKey,
      (e) => e._tag === "SubstPremiseMissing" && nonEmptyEntries.length === 0,
      defaultProofMessages,
    );
    expect(display2).toEqual({
      message: defaultProofMessages.substErrorPremiseMissing,
      type: "error",
    });
  });
});

describe("formatMessage", () => {
  it("should replace a single placeholder", () => {
    expect(formatMessage("Hello {name}", { name: "World" })).toBe(
      "Hello World",
    );
  });

  it("should replace multiple placeholders", () => {
    expect(formatMessage("{a} and {b}", { a: "foo", b: "bar" })).toBe(
      "foo and bar",
    );
  });

  it("should return template unchanged if no matching placeholders", () => {
    expect(formatMessage("No placeholders", { key: "val" })).toBe(
      "No placeholders",
    );
  });

  it("should handle empty params", () => {
    expect(formatMessage("Template {x}", {})).toBe("Template {x}");
  });

  it("should format genBannerSelectPremise correctly", () => {
    const result = formatMessage(defaultProofMessages.genBannerSelectPremise, {
      variableName: "x",
    });
    expect(result).toContain("x");
    expect(result).not.toContain("{variableName}");
  });

  it("should format selectionCount correctly", () => {
    const result = formatMessage(defaultProofMessages.selectionCount, {
      count: "3",
    });
    expect(result).toContain("3");
    expect(result).not.toContain("{count}");
  });

  it("should format tabBannerSelectNode correctly", () => {
    const result = formatMessage(defaultProofMessages.tabBannerSelectNode, {
      ruleName: "∧",
    });
    expect(result).toContain("∧");
    expect(result).not.toContain("{ruleName}");
  });

  it("should format atBannerSelectNode correctly", () => {
    const result = formatMessage(defaultProofMessages.atBannerSelectNode, {
      ruleName: "T(∧)",
    });
    expect(result).toContain("T(∧)");
    expect(result).not.toContain("{ruleName}");
  });

  it("AT default messages are all non-empty strings", () => {
    expect(defaultProofMessages.atBannerSelectNode.length).toBeGreaterThan(0);
    expect(defaultProofMessages.atCancel.length).toBeGreaterThan(0);
    expect(defaultProofMessages.atApplied.length).toBeGreaterThan(0);
    expect(defaultProofMessages.atError.length).toBeGreaterThan(0);
    expect(defaultProofMessages.applyAtRuleToNode.length).toBeGreaterThan(0);
    expect(defaultProofMessages.atTermPrompt.length).toBeGreaterThan(0);
    expect(defaultProofMessages.atEigenVariablePrompt.length).toBeGreaterThan(
      0,
    );
    expect(
      defaultProofMessages.atClosureBannerSelectContradiction.length,
    ).toBeGreaterThan(0);
  });

  it("should format cutEliminationCuts correctly", () => {
    const result = formatMessage(defaultProofMessages.cutEliminationCuts, {
      cutCount: "3",
    });
    expect(result).toContain("3");
    expect(result).not.toContain("{cutCount}");
  });

  it("should format cutEliminationStepProgress correctly", () => {
    const result = formatMessage(
      defaultProofMessages.cutEliminationStepProgress,
      {
        current: "2",
        total: "5",
      },
    );
    expect(result).toContain("2");
    expect(result).toContain("5");
    expect(result).not.toContain("{current}");
    expect(result).not.toContain("{total}");
  });

  it("should format cutEliminationStepInfo correctly", () => {
    const result = formatMessage(defaultProofMessages.cutEliminationStepInfo, {
      depth: "3",
      rank: "1",
    });
    expect(result).toContain("3");
    expect(result).toContain("1");
    expect(result).not.toContain("{depth}");
    expect(result).not.toContain("{rank}");
  });

  it("Cut elimination default messages are all non-empty strings", () => {
    expect(defaultProofMessages.cutEliminationTitle.length).toBeGreaterThan(0);
    expect(defaultProofMessages.cutEliminationCutFree.length).toBeGreaterThan(
      0,
    );
    expect(
      defaultProofMessages.cutEliminationInitialState.length,
    ).toBeGreaterThan(0);
    expect(defaultProofMessages.cutEliminationSuccess.length).toBeGreaterThan(
      0,
    );
    expect(defaultProofMessages.cutEliminationFailure.length).toBeGreaterThan(
      0,
    );
    expect(defaultProofMessages.cutEliminationNoCuts.length).toBeGreaterThan(0);
  });
});

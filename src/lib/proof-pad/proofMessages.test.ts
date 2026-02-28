/**
 * proofMessages のテスト。
 *
 * メッセージキー変換の純粋ロジックと、プレースホルダー置換をテストする。
 */

import { describe, it, expect } from "vitest";
import {
  defaultProofMessages,
  getMPErrorMessageKey,
  getGenErrorMessageKey,
  getSubstitutionErrorMessageKey,
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
});

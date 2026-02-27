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
import type { GenApplicationError } from "./genApplicationLogic";
import type { SubstitutionApplicationError } from "./substitutionApplicationLogic";
import { metaVariable } from "../logic-core/formula";

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
    const error: MPApplicationError = { _tag: "BothPremisesMissing" };
    expect(getMPErrorMessageKey(error)).toBe("mpErrorBothMissing");
  });

  it("should return mpErrorLeftMissing for LeftPremiseMissing", () => {
    const error: MPApplicationError = { _tag: "LeftPremiseMissing" };
    expect(getMPErrorMessageKey(error)).toBe("mpErrorLeftMissing");
  });

  it("should return mpErrorRightMissing for RightPremiseMissing", () => {
    const error: MPApplicationError = { _tag: "RightPremiseMissing" };
    expect(getMPErrorMessageKey(error)).toBe("mpErrorRightMissing");
  });

  it("should return mpErrorLeftParse for LeftParseError", () => {
    const error: MPApplicationError = {
      _tag: "LeftParseError",
      nodeId: "test",
    };
    expect(getMPErrorMessageKey(error)).toBe("mpErrorLeftParse");
  });

  it("should return mpErrorRightParse for RightParseError", () => {
    const error: MPApplicationError = {
      _tag: "RightParseError",
      nodeId: "test",
    };
    expect(getMPErrorMessageKey(error)).toBe("mpErrorRightParse");
  });

  it("should return mpErrorNotImplication for NotAnImplication RuleError", () => {
    const phi = metaVariable("φ");
    const error: MPApplicationError = {
      _tag: "RuleError",
      error: { _tag: "NotAnImplication", formula: phi },
    };
    expect(getMPErrorMessageKey(error)).toBe("mpErrorNotImplication");
  });

  it("should return mpErrorPremiseMismatch for PremiseMismatch RuleError", () => {
    const phi = metaVariable("φ");
    const psi = metaVariable("ψ");
    const error: MPApplicationError = {
      _tag: "RuleError",
      error: {
        _tag: "PremiseMismatch",
        expected: phi,
        actual: psi,
      },
    };
    expect(getMPErrorMessageKey(error)).toBe("mpErrorPremiseMismatch");
  });

  it("should return a valid key for all error types", () => {
    const phi = metaVariable("φ");
    const psi = metaVariable("ψ");
    const errors: readonly MPApplicationError[] = [
      { _tag: "BothPremisesMissing" },
      { _tag: "LeftPremiseMissing" },
      { _tag: "RightPremiseMissing" },
      { _tag: "LeftParseError", nodeId: "x" },
      { _tag: "RightParseError", nodeId: "x" },
      {
        _tag: "RuleError",
        error: { _tag: "NotAnImplication", formula: phi },
      },
      {
        _tag: "RuleError",
        error: { _tag: "PremiseMismatch", expected: phi, actual: psi },
      },
    ];

    for (const error of errors) {
      const key = getMPErrorMessageKey(error);
      expect(key in defaultProofMessages).toBe(true);
      expect(defaultProofMessages[key]).toBeTruthy();
    }
  });
});

describe("getGenErrorMessageKey", () => {
  it("should return genErrorPremiseMissing for PremiseMissing", () => {
    const error: GenApplicationError = { _tag: "PremiseMissing" };
    expect(getGenErrorMessageKey(error)).toBe("genErrorPremiseMissing");
  });

  it("should return genErrorPremiseParse for PremiseParseError", () => {
    const error: GenApplicationError = {
      _tag: "PremiseParseError",
      nodeId: "test",
    };
    expect(getGenErrorMessageKey(error)).toBe("genErrorPremiseParse");
  });

  it("should return genErrorVariableEmpty for VariableNameEmpty", () => {
    const error: GenApplicationError = { _tag: "VariableNameEmpty" };
    expect(getGenErrorMessageKey(error)).toBe("genErrorVariableEmpty");
  });

  it("should return genErrorNotEnabled for GeneralizationNotEnabled", () => {
    const error: GenApplicationError = { _tag: "GeneralizationNotEnabled" };
    expect(getGenErrorMessageKey(error)).toBe("genErrorNotEnabled");
  });

  it("should return genErrorGeneric for RuleError", () => {
    const error: GenApplicationError = {
      _tag: "RuleError",
      message: "Something failed",
    };
    expect(getGenErrorMessageKey(error)).toBe("genErrorGeneric");
  });

  it("should return a valid key for all error types", () => {
    const errors: readonly GenApplicationError[] = [
      { _tag: "PremiseMissing" },
      { _tag: "PremiseParseError", nodeId: "x" },
      { _tag: "VariableNameEmpty" },
      { _tag: "GeneralizationNotEnabled" },
      { _tag: "RuleError", message: "fail" },
    ];

    for (const error of errors) {
      const key = getGenErrorMessageKey(error);
      expect(key in defaultProofMessages).toBe(true);
      expect(defaultProofMessages[key]).toBeTruthy();
    }
  });
});

describe("getSubstitutionErrorMessageKey", () => {
  it("should return substErrorPremiseMissing for PremiseMissing", () => {
    const error: SubstitutionApplicationError = { _tag: "PremiseMissing" };
    expect(getSubstitutionErrorMessageKey(error)).toBe(
      "substErrorPremiseMissing",
    );
  });

  it("should return substErrorPremiseParse for PremiseParseError", () => {
    const error: SubstitutionApplicationError = {
      _tag: "PremiseParseError",
      nodeId: "test",
    };
    expect(getSubstitutionErrorMessageKey(error)).toBe(
      "substErrorPremiseParse",
    );
  });

  it("should return substErrorNoEntries for NoSubstitutionEntries", () => {
    const error: SubstitutionApplicationError = {
      _tag: "NoSubstitutionEntries",
    };
    expect(getSubstitutionErrorMessageKey(error)).toBe("substErrorNoEntries");
  });

  it("should return substErrorFormulaParse for FormulaParseError", () => {
    const error: SubstitutionApplicationError = {
      _tag: "FormulaParseError",
      entryIndex: 0,
      formulaText: "bad",
    };
    expect(getSubstitutionErrorMessageKey(error)).toBe(
      "substErrorFormulaParse",
    );
  });

  it("should return substErrorTermParse for TermParseError", () => {
    const error: SubstitutionApplicationError = {
      _tag: "TermParseError",
      entryIndex: 1,
      termText: "bad",
    };
    expect(getSubstitutionErrorMessageKey(error)).toBe("substErrorTermParse");
  });

  it("should return a valid key for all error types", () => {
    const errors: readonly SubstitutionApplicationError[] = [
      { _tag: "PremiseMissing" },
      { _tag: "PremiseParseError", nodeId: "x" },
      { _tag: "NoSubstitutionEntries" },
      { _tag: "FormulaParseError", entryIndex: 0, formulaText: "bad" },
      { _tag: "TermParseError", entryIndex: 0, termText: "bad" },
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

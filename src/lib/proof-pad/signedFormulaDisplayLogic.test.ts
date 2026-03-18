import { describe, expect, it } from "vitest";
import {
  isSignedFormulaText,
  parseSignedFormulaDisplayData,
  signedFormulaToDisplayData,
} from "./signedFormulaDisplayLogic";

describe("isSignedFormulaText", () => {
  it("should return true for T: prefixed text", () => {
    expect(isSignedFormulaText("T:P")).toBe(true);
  });

  it("should return true for F: prefixed text", () => {
    expect(isSignedFormulaText("F:P ∧ Q")).toBe(true);
  });

  it("should handle leading/trailing whitespace", () => {
    expect(isSignedFormulaText("  T:P  ")).toBe(true);
  });

  it("should return false for plain formula text", () => {
    expect(isSignedFormulaText("P ∧ Q")).toBe(false);
  });

  it("should return false for sequent text", () => {
    expect(isSignedFormulaText("P ⇒ Q")).toBe(false);
  });

  it("should return false for empty text", () => {
    expect(isSignedFormulaText("")).toBe(false);
  });

  it("should return false for just prefix without formula", () => {
    expect(isSignedFormulaText("T:")).toBe(false);
  });

  it("should return false for single character", () => {
    expect(isSignedFormulaText("T")).toBe(false);
  });
});

describe("parseSignedFormulaDisplayData", () => {
  it("should parse T: prefix with valid formula", () => {
    const result = parseSignedFormulaDisplayData("T:phi");
    expect(result).toBeDefined();
    expect(result!.sign).toBe("T");
    expect(result!.formulaSlot._tag).toBe("parsed");
  });

  it("should parse F: prefix with valid formula", () => {
    const result = parseSignedFormulaDisplayData("F:phi → psi");
    expect(result).toBeDefined();
    expect(result!.sign).toBe("F");
    expect(result!.formulaSlot._tag).toBe("parsed");
  });

  it("should handle formula with connectives", () => {
    const result = parseSignedFormulaDisplayData("T:phi ∧ psi");
    expect(result).toBeDefined();
    expect(result!.sign).toBe("T");
    expect(result!.formulaSlot._tag).toBe("parsed");
  });

  it("should handle formula with quantifiers", () => {
    const result = parseSignedFormulaDisplayData("T:(all x. P(x))");
    expect(result).toBeDefined();
    expect(result!.sign).toBe("T");
    expect(result!.formulaSlot._tag).toBe("parsed");
  });

  it("should return text slot for unparseable formula", () => {
    const result = parseSignedFormulaDisplayData("T:???invalid");
    expect(result).toBeDefined();
    expect(result!.sign).toBe("T");
    expect(result!.formulaSlot._tag).toBe("text");
  });

  it("should return undefined for non-signed text", () => {
    expect(parseSignedFormulaDisplayData("P ∧ Q")).toBeUndefined();
  });

  it("should return undefined for empty text", () => {
    expect(parseSignedFormulaDisplayData("")).toBeUndefined();
  });

  it("should return undefined for T: with no formula (just whitespace)", () => {
    expect(parseSignedFormulaDisplayData("T: ")).toBeUndefined();
  });

  it("should handle whitespace around formula", () => {
    const result = parseSignedFormulaDisplayData("T:  phi  ");
    expect(result).toBeDefined();
    expect(result!.sign).toBe("T");
    expect(result!.formulaSlot._tag).toBe("parsed");
  });
});

describe("signedFormulaToDisplayData", () => {
  it("should create display data from sign and formula", () => {
    // Use a simple formula via parse
    const result = parseSignedFormulaDisplayData("T:phi");
    expect(result).toBeDefined();
    if (result!.formulaSlot._tag !== "parsed") {
      throw new Error("Expected parsed slot");
    }
    const direct = signedFormulaToDisplayData("T", result!.formulaSlot.formula);
    expect(direct.sign).toBe("T");
    expect(direct.formulaSlot._tag).toBe("parsed");
  });

  it("should create F-signed display data", () => {
    const result = parseSignedFormulaDisplayData("F:phi");
    expect(result).toBeDefined();
    if (result!.formulaSlot._tag !== "parsed") {
      throw new Error("Expected parsed slot");
    }
    const direct = signedFormulaToDisplayData("F", result!.formulaSlot.formula);
    expect(direct.sign).toBe("F");
    expect(direct.formulaSlot._tag).toBe("parsed");
  });
});

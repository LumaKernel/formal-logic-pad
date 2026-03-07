import { describe, it, expect } from "vitest";
import { getDeductionSystemReferenceEntryId } from "./deductionSystemReferenceLogic";

describe("getDeductionSystemReferenceEntryId", () => {
  // Hilbert系
  it("Łukasiewicz → system-lukasiewicz", () => {
    expect(getDeductionSystemReferenceEntryId("Łukasiewicz")).toBe(
      "system-lukasiewicz",
    );
  });

  it("Mendelson → system-mendelson", () => {
    expect(getDeductionSystemReferenceEntryId("Mendelson")).toBe(
      "system-mendelson",
    );
  });

  it("Minimal Logic → system-minimal", () => {
    expect(getDeductionSystemReferenceEntryId("Minimal Logic")).toBe(
      "system-minimal",
    );
  });

  it("Intuitionistic Logic → system-intuitionistic", () => {
    expect(getDeductionSystemReferenceEntryId("Intuitionistic Logic")).toBe(
      "system-intuitionistic",
    );
  });

  it("Classical Logic (HK) → system-classical", () => {
    expect(getDeductionSystemReferenceEntryId("Classical Logic (HK)")).toBe(
      "system-classical",
    );
  });

  it("Predicate Logic → system-predicate", () => {
    expect(getDeductionSystemReferenceEntryId("Predicate Logic")).toBe(
      "system-predicate",
    );
  });

  // 理論体系
  it("Peano Arithmetic → theory-peano", () => {
    expect(getDeductionSystemReferenceEntryId("Peano Arithmetic")).toBe(
      "theory-peano",
    );
  });

  it("Peano Arithmetic (HK) → theory-peano", () => {
    expect(getDeductionSystemReferenceEntryId("Peano Arithmetic (HK)")).toBe(
      "theory-peano",
    );
  });

  it("Group Theory (Left Axioms) → theory-group", () => {
    expect(
      getDeductionSystemReferenceEntryId("Group Theory (Left Axioms)"),
    ).toBe("theory-group");
  });

  it("Abelian Group → theory-group", () => {
    expect(getDeductionSystemReferenceEntryId("Abelian Group")).toBe(
      "theory-group",
    );
  });

  // 未知の名前
  it("未知の名前はundefined", () => {
    expect(
      getDeductionSystemReferenceEntryId("Unknown System"),
    ).toBeUndefined();
  });

  it("空文字列はundefined", () => {
    expect(getDeductionSystemReferenceEntryId("")).toBeUndefined();
  });

  // ND系（リファレンスエントリ未作成）
  it("Natural Deduction NM はundefined（リファレンスエントリ未作成）", () => {
    expect(
      getDeductionSystemReferenceEntryId("Natural Deduction NM"),
    ).toBeUndefined();
  });
});

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

  // 自然演繹
  it("Natural Deduction NM → guide-intro-natural-deduction", () => {
    expect(
      getDeductionSystemReferenceEntryId("Natural Deduction NM"),
    ).toBe("guide-intro-natural-deduction");
  });

  it("Natural Deduction NJ → guide-intro-natural-deduction", () => {
    expect(
      getDeductionSystemReferenceEntryId("Natural Deduction NJ"),
    ).toBe("guide-intro-natural-deduction");
  });

  it("Natural Deduction NK → guide-intro-natural-deduction", () => {
    expect(
      getDeductionSystemReferenceEntryId("Natural Deduction NK"),
    ).toBe("guide-intro-natural-deduction");
  });

  // シーケント計算
  it("Sequent Calculus LM → guide-intro-sequent-calculus", () => {
    expect(
      getDeductionSystemReferenceEntryId("Sequent Calculus LM"),
    ).toBe("guide-intro-sequent-calculus");
  });

  it("Sequent Calculus LJ → guide-intro-sequent-calculus", () => {
    expect(
      getDeductionSystemReferenceEntryId("Sequent Calculus LJ"),
    ).toBe("guide-intro-sequent-calculus");
  });

  it("Sequent Calculus LK → guide-intro-sequent-calculus", () => {
    expect(
      getDeductionSystemReferenceEntryId("Sequent Calculus LK"),
    ).toBe("guide-intro-sequent-calculus");
  });

  // タブロー
  it("Tableau Calculus TAB → guide-intro-tableau", () => {
    expect(
      getDeductionSystemReferenceEntryId("Tableau Calculus TAB"),
    ).toBe("guide-intro-tableau");
  });

  it("Tableau Calculus TAB (Propositional) → guide-intro-tableau", () => {
    expect(
      getDeductionSystemReferenceEntryId("Tableau Calculus TAB (Propositional)"),
    ).toBe("guide-intro-tableau");
  });

  // 分析タブロー
  it("Analytic Tableau → concept-analytic-tableau", () => {
    expect(
      getDeductionSystemReferenceEntryId("Analytic Tableau"),
    ).toBe("concept-analytic-tableau");
  });

  it("Analytic Tableau (Propositional) → concept-analytic-tableau", () => {
    expect(
      getDeductionSystemReferenceEntryId("Analytic Tableau (Propositional)"),
    ).toBe("concept-analytic-tableau");
  });
});

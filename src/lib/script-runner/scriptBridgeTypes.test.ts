import { describe, it, expect } from "vitest";
import { generateScriptBridgeTypeDefs } from "./scriptBridgeTypes";

describe("generateScriptBridgeTypeDefs", () => {
  const defs = generateScriptBridgeTypeDefs();

  it("FormulaJson ブランド型を宣言する", () => {
    expect(defs).toContain("declare type FormulaJson");
    expect(defs).toContain('__brand: "FormulaJson"');
  });

  it("TermJson ブランド型を宣言する", () => {
    expect(defs).toContain("declare type TermJson");
    expect(defs).toContain('__brand: "TermJson"');
  });

  it("SequentJson 型を宣言する（antecedents / succedents を含む）", () => {
    expect(defs).toContain("declare type SequentJson");
    expect(defs).toContain("antecedents");
    expect(defs).toContain("succedents");
  });

  it("ScProofNodeJson ブランド型を宣言する", () => {
    expect(defs).toContain("declare type ScProofNodeJson");
  });

  it("ProofNodeJson ブランド型を宣言する", () => {
    expect(defs).toContain("declare type ProofNodeJson");
  });

  it("LogicSystemJson 型を宣言する", () => {
    expect(defs).toContain("declare type LogicSystemJson");
    expect(defs).toContain("propositionalAxioms");
  });

  it("UnificationResult 型を宣言する", () => {
    expect(defs).toContain("declare type UnificationResult");
    expect(defs).toContain("formulaSubstitution");
  });

  it("TermUnificationResult 型を宣言する", () => {
    expect(defs).toContain("declare type TermUnificationResult");
    expect(defs).toContain("termSubstitution");
  });

  it("AxiomIdentificationResult を discriminated union として宣言する", () => {
    expect(defs).toContain("declare type AxiomIdentificationResult");
    expect(defs).toContain('"Ok"');
    expect(defs).toContain('"TheoryAxiom"');
    expect(defs).toContain('"Error"');
  });

  it("CutEliminationResultJson を discriminated union として宣言する", () => {
    expect(defs).toContain("declare type CutEliminationResultJson");
    expect(defs).toContain('"Success"');
    expect(defs).toContain('"StepLimitExceeded"');
  });

  it("CutEliminationStepJson 型を宣言する", () => {
    expect(defs).toContain("declare type CutEliminationStepJson");
    expect(defs).toContain("description");
    expect(defs).toContain("depth");
    expect(defs).toContain("rank");
  });
});

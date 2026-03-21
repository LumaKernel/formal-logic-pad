/**
 * builtin-api.d.ts の整合性テスト。
 *
 * 各ブリッジモジュールの API_DEFS 配列に定義された関数名が
 * builtin-api.d.ts 内に `declare function <name>` として存在することを検証する。
 * また、.d.ts ファイルの構文的な健全性も確認する。
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PROOF_BRIDGE_API_DEFS } from "./proofBridge";
import { WORKSPACE_BRIDGE_API_DEFS } from "./workspaceBridge";
import { CUT_ELIMINATION_BRIDGE_API_DEFS } from "./cutEliminationBridge";
import { HILBERT_PROOF_BRIDGE_API_DEFS } from "./hilbertProofBridge";

const builtinApiPath = resolve(__dirname, "builtin-api.d.ts");
const builtinApiContent = readFileSync(builtinApiPath, "utf-8");

describe("builtin-api.d.ts", () => {
  it("ファイルが存在し、内容がある", () => {
    expect(builtinApiContent.length).toBeGreaterThan(0);
  });

  // ── 基本型の存在確認 ────────────────────────────────────

  it("FormulaJson ブランド型を宣言する", () => {
    expect(builtinApiContent).toContain("declare type FormulaJson");
    expect(builtinApiContent).toContain('__brand: "FormulaJson"');
  });

  it("TermJson ブランド型を宣言する", () => {
    expect(builtinApiContent).toContain("declare type TermJson");
    expect(builtinApiContent).toContain('__brand: "TermJson"');
  });

  it("SequentJson 型を宣言する（antecedents / succedents を含む）", () => {
    expect(builtinApiContent).toContain("declare type SequentJson");
    expect(builtinApiContent).toContain("antecedents");
    expect(builtinApiContent).toContain("succedents");
  });

  it("ScProofNodeJson ブランド型を宣言する", () => {
    expect(builtinApiContent).toContain("declare type ScProofNodeJson");
  });

  it("ProofNodeJson ブランド型を宣言する", () => {
    expect(builtinApiContent).toContain("declare type ProofNodeJson");
  });

  it("LogicSystemJson 型を宣言する", () => {
    expect(builtinApiContent).toContain("declare type LogicSystemJson");
    expect(builtinApiContent).toContain("propositionalAxioms");
  });

  it("UnificationResult 型を宣言する", () => {
    expect(builtinApiContent).toContain("declare type UnificationResult");
    expect(builtinApiContent).toContain("formulaSubstitution");
  });

  it("TermUnificationResult 型を宣言する", () => {
    expect(builtinApiContent).toContain("declare type TermUnificationResult");
    expect(builtinApiContent).toContain("termSubstitution");
  });

  it("AxiomIdentificationResult を discriminated union として宣言する", () => {
    expect(builtinApiContent).toContain(
      "declare type AxiomIdentificationResult",
    );
    expect(builtinApiContent).toContain('"Ok"');
    expect(builtinApiContent).toContain('"TheoryAxiom"');
    expect(builtinApiContent).toContain('"Error"');
  });

  it("CutEliminationResultJson を discriminated union として宣言する", () => {
    expect(builtinApiContent).toContain(
      "declare type CutEliminationResultJson",
    );
    expect(builtinApiContent).toContain('"Success"');
    expect(builtinApiContent).toContain('"StepLimitExceeded"');
  });

  it("CutEliminationStepJson 型を宣言する", () => {
    expect(builtinApiContent).toContain("declare type CutEliminationStepJson");
    expect(builtinApiContent).toContain("description");
    expect(builtinApiContent).toContain("depth");
    expect(builtinApiContent).toContain("rank");
  });

  // ── 構文的健全性 ────────────────────────────────────────

  it("declare function の戻り値は : 構文を使う（=> は不正）", () => {
    // "declare function name(...) => " は不正な TS 構文で戻り値が any になる
    expect(builtinApiContent).not.toMatch(/declare function \w+\([^)]*\)\s*=>/);
  });

  it("console 型を宣言する", () => {
    expect(builtinApiContent).toContain("declare const console");
    expect(builtinApiContent).toContain("log(");
    expect(builtinApiContent).toContain("error(");
    expect(builtinApiContent).toContain("warn(");
  });

  // ── API_DEFS との同期テスト ─────────────────────────────

  describe("PROOF_BRIDGE_API_DEFS の全関数が宣言されている", () => {
    for (const def of PROOF_BRIDGE_API_DEFS) {
      it(`declare function ${def.name satisfies string}`, () => {
        expect(builtinApiContent).toContain(
          `declare function ${def.name satisfies string}`,
        );
      });
    }
  });

  describe("WORKSPACE_BRIDGE_API_DEFS の全関数が宣言されている", () => {
    for (const def of WORKSPACE_BRIDGE_API_DEFS) {
      it(`declare function ${def.name satisfies string}`, () => {
        expect(builtinApiContent).toContain(
          `declare function ${def.name satisfies string}`,
        );
      });
    }
  });

  describe("CUT_ELIMINATION_BRIDGE_API_DEFS の全関数が宣言されている", () => {
    for (const def of CUT_ELIMINATION_BRIDGE_API_DEFS) {
      it(`declare function ${def.name satisfies string}`, () => {
        expect(builtinApiContent).toContain(
          `declare function ${def.name satisfies string}`,
        );
      });
    }
  });

  describe("HILBERT_PROOF_BRIDGE_API_DEFS の全関数が宣言されている", () => {
    for (const def of HILBERT_PROOF_BRIDGE_API_DEFS) {
      it(`declare function ${def.name satisfies string}`, () => {
        expect(builtinApiContent).toContain(
          `declare function ${def.name satisfies string}`,
        );
      });
    }
  });
});

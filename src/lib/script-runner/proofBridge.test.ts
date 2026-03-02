import { describe, it, expect } from "vitest";
import {
  createProofBridges,
  PROOF_BRIDGE_API_DEFS,
  generateProofBridgeTypeDefs,
} from "./proofBridge";
import { createScriptRunner, isScriptRunResult } from "./scriptRunner";
import type { ScriptRunnerInstance, ScriptRunResult } from "./scriptRunner";

// ── ヘルパー ──────────────────────────────────────────────────

const getRunner = (
  result: ScriptRunResult | ScriptRunnerInstance,
): ScriptRunnerInstance => {
  if (isScriptRunResult(result)) {
    const json = JSON.stringify(result) satisfies string;
    throw new Error(
      `Expected runner instance, got result: ${json satisfies string}`,
    );
  }
  return result;
};

const runCode = (code: string): unknown => {
  const bridges = createProofBridges();
  const raw = createScriptRunner(code, { bridges, maxSteps: 100_000 });
  const runner = getRunner(raw);
  const result = runner.run();
  if (result._tag !== "Ok") {
    const json = JSON.stringify(result.error) satisfies string;
    throw new Error(`Execution failed: ${json satisfies string}`);
  }
  return result.value;
};

const runCodeError = (code: string): string => {
  const bridges = createProofBridges();
  const raw = createScriptRunner(code, { bridges, maxSteps: 100_000 });
  const runner = getRunner(raw);
  const result = runner.run();
  if (result._tag !== "Error") {
    throw new Error("Expected error but got Ok");
  }
  if (result.error._tag !== "RuntimeError") {
    throw new Error(
      `Expected RuntimeError, got ${result.error._tag satisfies string}`,
    );
  }
  return result.error.message;
};

// ── テスト ────────────────────────────────────────────────────

describe("createProofBridges", () => {
  it("ブリッジ関数一覧を返す", () => {
    const bridges = createProofBridges();
    expect(bridges.length).toBeGreaterThan(0);
    const names = bridges.map((b) => b.name);
    expect(names).toContain("parseFormula");
    expect(names).toContain("formatFormula");
    expect(names).toContain("applyMP");
    expect(names).toContain("applyGen");
    expect(names).toContain("unifyFormulas");
    expect(names).toContain("unifyTerms");
    expect(names).toContain("substituteFormula");
    expect(names).toContain("identifyAxiom");
    expect(names).toContain("equalFormula");
    expect(names).toContain("equalTerm");
    expect(names).toContain("formatTerm");
  });
});

describe("parseFormula ブリッジ", () => {
  it("テキストをパースして Formula JSON を返す", () => {
    const result = runCode("parseFormula('phi -> psi')");
    expect(result).toEqual(expect.objectContaining({ _tag: "Implication" }));
  });

  it("パース失敗時は例外をスロー", () => {
    const msg = runCodeError("parseFormula('-> ->')");
    expect(msg).toContain("Parse error");
  });

  it("非文字列引数で例外をスロー", () => {
    const msg = runCodeError("parseFormula(42)");
    expect(msg).toContain("expected string");
  });
});

describe("formatFormula ブリッジ", () => {
  it("Formula JSON をテキストに変換する", () => {
    const result = runCode(
      "var f = parseFormula('phi -> psi'); formatFormula(f);",
    );
    expect(result).toBe("φ → ψ");
  });

  it("不正な入力で例外をスロー", () => {
    const msg = runCodeError("formatFormula({_tag: 'Invalid'})");
    expect(msg).toContain("Invalid formula JSON");
  });
});

describe("formatTerm ブリッジ", () => {
  it("Term JSON をテキストに変換する", () => {
    // パーサーで項を直接パースする方法がないため、直接JSONを構築
    const result = runCode("formatTerm({_tag: 'TermVariable', name: 'x'})");
    expect(result).toBe("x");
  });

  it("不正なTerm JSONで例外をスロー", () => {
    const msg = runCodeError("formatTerm({_tag: 'Invalid'})");
    expect(msg).toContain("Invalid term JSON");
  });
});

describe("equalFormula ブリッジ", () => {
  it("同一構造のFormulaに対してtrueを返す", () => {
    const result = runCode(
      "var a = parseFormula('phi -> psi'); var b = parseFormula('phi -> psi'); equalFormula(a, b);",
    );
    expect(result).toBe(true);
  });

  it("異なるFormulaに対してfalseを返す", () => {
    const result = runCode(
      "var a = parseFormula('phi -> psi'); var b = parseFormula('psi -> phi'); equalFormula(a, b);",
    );
    expect(result).toBe(false);
  });
});

describe("equalTerm ブリッジ", () => {
  it("同一Termに対してtrueを返す", () => {
    const result = runCode(
      "equalTerm({_tag: 'TermVariable', name: 'x'}, {_tag: 'TermVariable', name: 'x'})",
    );
    expect(result).toBe(true);
  });

  it("異なるTermに対してfalseを返す", () => {
    const result = runCode(
      "equalTerm({_tag: 'TermVariable', name: 'x'}, {_tag: 'TermVariable', name: 'y'})",
    );
    expect(result).toBe(false);
  });
});

describe("applyMP ブリッジ", () => {
  it("Modus Ponensで結論を導出する", () => {
    const result = runCode(
      [
        "var phi = parseFormula('phi');",
        "var phiToPsi = parseFormula('phi -> psi');",
        "applyMP(phi, phiToPsi);",
      ].join("\n"),
    );
    expect(result).toEqual(expect.objectContaining({ _tag: "MetaVariable" }));
  });

  it("前提不一致時は例外をスロー", () => {
    const msg = runCodeError(
      [
        "var chi = parseFormula('chi');",
        "var phiToPsi = parseFormula('phi -> psi');",
        "applyMP(chi, phiToPsi);",
      ].join("\n"),
    );
    expect(msg).toContain("Modus Ponens failed");
  });

  it("非含意に対して例外をスロー", () => {
    const msg = runCodeError(
      [
        "var phi = parseFormula('phi');",
        "var psi = parseFormula('psi');",
        "applyMP(phi, psi);",
      ].join("\n"),
    );
    expect(msg).toContain("Modus Ponens failed");
  });
});

describe("applyGen ブリッジ", () => {
  it("汎化規則で∀x.φを導出する", () => {
    const result = runCode(
      [
        "var phi = parseFormula('phi');",
        "var system = { name: 'test', propositionalAxioms: ['A1', 'A2'], predicateLogic: true, equalityLogic: false, generalization: true };",
        "var genResult = applyGen(phi, 'x', system);",
        "formatFormula(genResult);",
      ].join("\n"),
    );
    expect(result).toBe("∀x.φ");
  });

  it("汎化無効の体系で例外をスロー", () => {
    const msg = runCodeError(
      [
        "var phi = parseFormula('phi');",
        "var system = { name: 'test', propositionalAxioms: ['A1'], predicateLogic: false, equalityLogic: false, generalization: false };",
        "applyGen(phi, 'x', system);",
      ].join("\n"),
    );
    expect(msg).toContain("Generalization failed");
  });

  it("変数名が文字列でない場合例外をスロー", () => {
    const msg = runCodeError(
      [
        "var phi = parseFormula('phi');",
        "var system = { name: 'test', propositionalAxioms: [], predicateLogic: true, equalityLogic: false, generalization: true };",
        "applyGen(phi, 42, system);",
      ].join("\n"),
    );
    expect(msg).toContain("variableName must be string");
  });
});

describe("unifyFormulas ブリッジ", () => {
  it("ユニフィケーション成功時に代入マップを返す", () => {
    const result = runCode(
      [
        "var a = parseFormula('phi -> psi');",
        "var b = parseFormula('phi -> psi');",
        "unifyFormulas(a, b);",
      ].join("\n"),
    ) as Record<string, unknown>;
    expect(result).toHaveProperty("formulaSubstitution");
    expect(result).toHaveProperty("termSubstitution");
  });

  it("メタ変数を含む式のユニフィケーションで代入を返す", () => {
    // phi -> psi と chi -> chi をユニファイ → φ→χ, ψ→χ
    const result = runCode(
      [
        "var a = parseFormula('phi -> psi');",
        "var b = parseFormula('chi -> chi');",
        "unifyFormulas(a, b);",
      ].join("\n"),
    ) as Record<string, unknown>;
    const formulaSub = result["formulaSubstitution"] as Record<string, unknown>;
    expect(Object.keys(formulaSub).length).toBeGreaterThan(0);
  });

  it("項メタ変数を含む式のユニフィケーションで項代入を返す", () => {
    // ∀x.P(x) と ∀x.P(x) のユニフィケーション — 項メタ変数の代入がなくても成功
    // P(#t) と P(x) — #t は TermMetaVariable
    // Formula JSON で直接構築して項メタ変数を含む式をテスト
    const result = runCode(
      [
        "var a = {_tag: 'Predicate', name: 'P', args: [{_tag: 'TermMetaVariable', name: 'φ'}]};",
        "var b = {_tag: 'Predicate', name: 'P', args: [{_tag: 'TermVariable', name: 'x'}]};",
        "unifyFormulas(a, b);",
      ].join("\n"),
    ) as Record<string, unknown>;
    const termSub = result["termSubstitution"] as Record<string, unknown>;
    expect(Object.keys(termSub).length).toBeGreaterThan(0);
  });

  it("構造不一致時は例外をスロー", () => {
    const msg = runCodeError(
      [
        "var a = parseFormula('phi -> psi');",
        "var b = parseFormula('~phi');",
        "unifyFormulas(a, b);",
      ].join("\n"),
    );
    expect(msg).toContain("Unification failed");
  });
});

describe("unifyTerms ブリッジ", () => {
  it("同一Termのユニフィケーション成功", () => {
    const result = runCode(
      "unifyTerms({_tag: 'TermVariable', name: 'x'}, {_tag: 'TermVariable', name: 'x'})",
    ) as Record<string, unknown>;
    expect(result).toHaveProperty("termSubstitution");
  });

  it("TermMetaVariableのユニフィケーションで代入マップを返す", () => {
    const result = runCode(
      [
        "var tmv = {_tag: 'TermMetaVariable', name: 'φ'};",
        "var tv = {_tag: 'TermVariable', name: 'x'};",
        "unifyTerms(tmv, tv);",
      ].join("\n"),
    ) as Record<string, unknown>;
    expect(result).toHaveProperty("termSubstitution");
    const termSub = result["termSubstitution"] as Record<string, unknown>;
    expect(Object.keys(termSub).length).toBeGreaterThan(0);
  });

  it("構造不一致時は例外をスロー", () => {
    const msg = runCodeError(
      [
        "var a = {_tag: 'Constant', name: 'a'};",
        "var b = {_tag: 'Constant', name: 'b'};",
        "unifyTerms(a, b);",
      ].join("\n"),
    );
    expect(msg).toContain("Term unification failed");
  });
});

describe("substituteFormula ブリッジ", () => {
  it("メタ変数代入を適用する", () => {
    const result = runCode(
      [
        "var template = parseFormula('phi -> psi');",
        "var phiVal = parseFormula('chi');",
        "var sub = {};",
        "sub['φ'] = phiVal;",
        "var result = substituteFormula(template, sub);",
        "formatFormula(result);",
      ].join("\n"),
    );
    expect(result).toBe("χ → ψ");
  });

  it("空の代入マップでも動作する", () => {
    const result = runCode(
      [
        "var f = parseFormula('phi');",
        "formatFormula(substituteFormula(f, {}));",
      ].join("\n"),
    );
    expect(result).toBe("φ");
  });

  it("非オブジェクトの代入マップで例外をスロー", () => {
    const msg = runCodeError(
      ["var f = parseFormula('phi');", "substituteFormula(f, 42);"].join("\n"),
    );
    expect(msg).toContain("substitutionMap must be an object");
  });
});

describe("identifyAxiom ブリッジ", () => {
  it("A1公理インスタンスを識別する", () => {
    const result = runCode(
      [
        "var f = parseFormula('phi -> (psi -> phi)');",
        "var system = { name: 'Lukasiewicz', propositionalAxioms: ['A1', 'A2', 'A3'], predicateLogic: false, equalityLogic: false, generalization: false };",
        "identifyAxiom(f, system);",
      ].join("\n"),
    ) as Record<string, unknown>;
    expect(result._tag).toBe("Ok");
  });

  it("公理でない式を判定する", () => {
    const result = runCode(
      [
        "var f = parseFormula('phi');",
        "var system = { name: 'Lukasiewicz', propositionalAxioms: ['A1', 'A2', 'A3'], predicateLogic: false, equalityLogic: false, generalization: false };",
        "identifyAxiom(f, system);",
      ].join("\n"),
    ) as Record<string, unknown>;
    expect(result._tag).toBe("Error");
  });

  it("システムが非オブジェクトの場合例外をスロー", () => {
    const msg = runCodeError(
      ["var f = parseFormula('phi');", "identifyAxiom(f, 42);"].join("\n"),
    );
    expect(msg).toContain("system must be an object");
  });

  it("プロパティが欠落したシステムオブジェクトでもデフォルト値で動作する", () => {
    const result = runCode(
      [
        "var f = parseFormula('phi -> (psi -> phi)');",
        "var system = {};",
        "identifyAxiom(f, system);",
      ].join("\n"),
    ) as Record<string, unknown>;
    // 空システムでは公理が有効でないためError
    expect(result._tag).toBe("Error");
  });
});

describe("サンドボックス統合テスト", () => {
  it("parseFormula → applyMP → formatFormula のパイプライン", () => {
    const result = runCode(
      [
        "var phi = parseFormula('phi');",
        "var phiToPsi = parseFormula('phi -> psi');",
        "var psi = applyMP(phi, phiToPsi);",
        "formatFormula(psi);",
      ].join("\n"),
    );
    expect(result).toBe("ψ");
  });

  it("ネイティブブリッジの例外はRuntimeErrorとして伝播する", () => {
    // JS-Interpreter ではネイティブ関数の例外はサンドボックス内の
    // try-catch で捕捉されず、RuntimeError として伝播する
    const msg = runCodeError("parseFormula('-> ->');");
    expect(msg).toContain("Parse error");
  });

  it("A1公理スキーマの代入とMP適用のフロー", () => {
    // φ→(ψ→φ) に φ=p, ψ=q を代入して p→(q→p) を得る
    // p と p→(q→p) に MP を適用して q→p を得る
    const result = runCode(
      [
        "var a1 = parseFormula('phi -> (psi -> phi)');",
        "var p = parseFormula('phi');",
        "var sub = {};",
        "sub['φ'] = p;",
        "var a1inst = substituteFormula(a1, sub);",
        "var conclusion = applyMP(p, a1inst);",
        "formatFormula(conclusion);",
      ].join("\n"),
    );
    // φ→(ψ→φ) に φ→φ を代入すると φ→(ψ→φ) のまま
    // MP(φ, φ→(ψ→φ)) = ψ→φ
    expect(result).toBe("ψ → φ");
  });
});

describe("PROOF_BRIDGE_API_DEFS", () => {
  it("全ブリッジ関数のAPI定義が存在する", () => {
    const bridges = createProofBridges();
    const defNames = PROOF_BRIDGE_API_DEFS.map((d) => d.name);
    for (const bridge of bridges) {
      expect(defNames).toContain(bridge.name);
    }
  });

  it("各API定義にsignatureとdescriptionがある", () => {
    for (const def of PROOF_BRIDGE_API_DEFS) {
      expect(def.signature.length).toBeGreaterThan(0);
      expect(def.description.length).toBeGreaterThan(0);
    }
  });
});

describe("generateProofBridgeTypeDefs", () => {
  it("TypeScript型定義テキストを生成する", () => {
    const typeDefs = generateProofBridgeTypeDefs();
    expect(typeDefs).toContain("declare function parseFormula");
    expect(typeDefs).toContain("declare function applyMP");
    expect(typeDefs).toContain("declare function identifyAxiom");
  });
});

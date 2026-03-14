import { describe, it, expect, vi } from "vitest";
import { BUILTIN_TEMPLATES, filterTemplatesByStyle } from "./templates";
import type { ScriptTemplate } from "./templates";
import { createScriptRunner } from "./scriptRunner";
import { createProofBridges } from "./proofBridge";
import { createCutEliminationBridges } from "./cutEliminationBridge";
import { createWorkspaceBridges } from "./workspaceBridge";
import type { WorkspaceCommandHandler } from "./workspaceBridge";
import type { NativeFunctionBridge } from "./scriptRunner";

describe("BUILTIN_TEMPLATES", () => {
  it("4つのテンプレートを含む", () => {
    expect(BUILTIN_TEMPLATES).toHaveLength(4);
  });

  it("各テンプレートが必須フィールドを持つ", () => {
    for (const tmpl of BUILTIN_TEMPLATES) {
      expect(tmpl.id).toBeTruthy();
      expect(tmpl.title).toBeTruthy();
      expect(tmpl.description).toBeTruthy();
      expect(tmpl.code).toBeTruthy();
    }
  });

  it("各テンプレートがcompatibleStylesを持つ", () => {
    for (const tmpl of BUILTIN_TEMPLATES) {
      // 全ビルトインテンプレートは特定の演繹スタイルに紐づく
      expect(tmpl.compatibleStyles).toBeDefined();
      expect(tmpl.compatibleStyles!.length).toBeGreaterThan(0);
    }
  });

  it("IDが一意", () => {
    const ids = BUILTIN_TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("テンプレート実行テスト", () => {
  const consoleLogs: string[] = [];
  const consoleBridges: readonly NativeFunctionBridge[] = [
    {
      name: "console_log",
      fn: (...args: readonly unknown[]) => {
        consoleLogs.push(args.map(String).join(" "));
      },
    },
    {
      name: "console_error",
      fn: (...args: readonly unknown[]) => {
        consoleLogs.push(
          `ERROR: ${args.map(String).join(" ") satisfies string}`,
        );
      },
    },
    {
      name: "console_warn",
      fn: (...args: readonly unknown[]) => {
        consoleLogs.push(
          `WARN: ${args.map(String).join(" ") satisfies string}`,
        );
      },
    },
  ];

  const consoleShim = `
    var console = {
      log: function() {
        var args = [];
        for (var i = 0; i < arguments.length; i++) { args.push(arguments[i]); }
        console_log.apply(null, args);
      },
      error: function() {
        var args = [];
        for (var i = 0; i < arguments.length; i++) { args.push(arguments[i]); }
        console_error.apply(null, args);
      },
      warn: function() {
        var args = [];
        for (var i = 0; i < arguments.length; i++) { args.push(arguments[i]); }
        console_warn.apply(null, args);
      }
    };
  `;

  const createMockHandler = (): WorkspaceCommandHandler => ({
    addNode: vi.fn().mockReturnValue("node-1"),
    setNodeFormula: vi.fn(),
    getNodes: vi.fn().mockReturnValue([]),
    connectMP: vi.fn().mockReturnValue("node-2"),
    addGoal: vi.fn(),
    removeNode: vi.fn(),
    setNodeRoleAxiom: vi.fn(),
    applyLayout: vi.fn(),
    clearWorkspace: vi.fn(),
    getSelectedNodeIds: vi.fn().mockReturnValue([]),
  });

  const runTemplate = (tmpl: ScriptTemplate) => {
    consoleLogs.length = 0;
    const handler = createMockHandler();
    const bridges = [
      ...createProofBridges(),
      ...createCutEliminationBridges(),
      ...createWorkspaceBridges(handler),
      ...consoleBridges,
    ];
    const code = consoleShim + tmpl.code;
    const runner = createScriptRunner(code, {
      bridges,
      maxSteps: 50000,
    });
    if ("run" in runner) {
      return runner.run();
    }
    return runner;
  };

  it("cut-elimination-simple: 正常に実行される", () => {
    const tmpl = BUILTIN_TEMPLATES.find(
      (t) => t.id === "cut-elimination-simple",
    )!;
    const result = runTemplate(tmpl);
    if (result._tag === "Error") {
      throw new Error(
        `Template failed: ${JSON.stringify(result.error) satisfies string}`,
      );
    }
    expect(result._tag).toBe("Ok");
    expect(consoleLogs.some((l) => l.includes("カット数"))).toBe(true);
    expect(consoleLogs.some((l) => l.includes("Success"))).toBe(true);
  });

  it("cut-elimination-implication: 正常に実行される", () => {
    const tmpl = BUILTIN_TEMPLATES.find(
      (t) => t.id === "cut-elimination-implication",
    )!;
    const result = runTemplate(tmpl);
    if (result._tag === "Error") {
      throw new Error(
        `Template failed: ${JSON.stringify(result.error) satisfies string}`,
      );
    }
    expect(result._tag).toBe("Ok");
    expect(consoleLogs.some((l) => l.includes("カット除去定理の実演"))).toBe(
      true,
    );
    expect(consoleLogs.some((l) => l.includes("Success"))).toBe(true);
  });

  it("build-identity-proof: 正常に実行される", () => {
    const tmpl = BUILTIN_TEMPLATES.find(
      (t) => t.id === "build-identity-proof",
    )!;
    const result = runTemplate(tmpl);
    if (result._tag === "Error") {
      throw new Error(
        `Template failed: ${JSON.stringify(result.error) satisfies string}`,
      );
    }
    expect(result._tag).toBe("Ok");
    expect(consoleLogs.some((l) => l.includes("Q.E.D."))).toBe(true);
  });

  it("auto-prove-lk: 正常に実行される", () => {
    const tmpl = BUILTIN_TEMPLATES.find((t) => t.id === "auto-prove-lk")!;
    const result = runTemplate(tmpl);
    if (result._tag === "Error") {
      throw new Error(
        `Template failed: ${JSON.stringify(result.error) satisfies string}`,
      );
    }
    expect(result._tag).toBe("Ok");
    expect(consoleLogs.some((l) => l.includes("自動証明探索"))).toBe(true);
    expect(consoleLogs.some((l) => l.includes("Q.E.D."))).toBe(true);
  });
});

describe("filterTemplatesByStyle", () => {
  const universalTemplate: ScriptTemplate = {
    id: "universal",
    title: "Universal",
    description: "Universal template",
    code: "// universal",
  };

  const hilbertTemplate: ScriptTemplate = {
    id: "hilbert-only",
    title: "Hilbert Only",
    description: "Hilbert only",
    code: "// hilbert",
    compatibleStyles: ["hilbert"],
  };

  const scTemplate: ScriptTemplate = {
    id: "sc-only",
    title: "SC Only",
    description: "SC only",
    code: "// sc",
    compatibleStyles: ["sequent-calculus"],
  };

  const multiTemplate: ScriptTemplate = {
    id: "multi",
    title: "Multi",
    description: "Multi",
    code: "// multi",
    compatibleStyles: ["hilbert", "natural-deduction"],
  };

  const allTemplates = [
    universalTemplate,
    hilbertTemplate,
    scTemplate,
    multiTemplate,
  ];

  it("style未指定時は全テンプレートを返す", () => {
    const result = filterTemplatesByStyle(allTemplates, undefined);
    expect(result).toHaveLength(4);
  });

  it("hilbert指定時はhilbert互換テンプレートのみ返す", () => {
    const result = filterTemplatesByStyle(allTemplates, "hilbert");
    expect(result.map((t) => t.id)).toEqual([
      "universal",
      "hilbert-only",
      "multi",
    ]);
  });

  it("sequent-calculus指定時はSC互換テンプレートのみ返す", () => {
    const result = filterTemplatesByStyle(allTemplates, "sequent-calculus");
    expect(result.map((t) => t.id)).toEqual(["universal", "sc-only"]);
  });

  it("natural-deduction指定時はND互換テンプレートのみ返す", () => {
    const result = filterTemplatesByStyle(allTemplates, "natural-deduction");
    expect(result.map((t) => t.id)).toEqual(["universal", "multi"]);
  });

  it("tableau-calculus指定時は汎用テンプレートのみ返す", () => {
    const result = filterTemplatesByStyle(allTemplates, "tableau-calculus");
    expect(result.map((t) => t.id)).toEqual(["universal"]);
  });

  it("analytic-tableau指定時は汎用テンプレートのみ返す", () => {
    const result = filterTemplatesByStyle(allTemplates, "analytic-tableau");
    expect(result.map((t) => t.id)).toEqual(["universal"]);
  });

  it("BUILTIN_TEMPLATESでhilbertフィルタ", () => {
    const result = filterTemplatesByStyle(BUILTIN_TEMPLATES, "hilbert");
    expect(result.every((t) => t.id === "build-identity-proof")).toBe(true);
    expect(result).toHaveLength(1);
  });

  it("BUILTIN_TEMPLATESでsequent-calculusフィルタ", () => {
    const result = filterTemplatesByStyle(
      BUILTIN_TEMPLATES,
      "sequent-calculus",
    );
    const ids = result.map((t) => t.id);
    expect(ids).toContain("cut-elimination-simple");
    expect(ids).toContain("cut-elimination-implication");
    expect(ids).toContain("auto-prove-lk");
    expect(result).toHaveLength(3);
  });

  it("空配列に対してフィルタしても空配列を返す", () => {
    const result = filterTemplatesByStyle([], "hilbert");
    expect(result).toHaveLength(0);
  });
});

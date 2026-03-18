import { describe, it, expect, vi } from "vitest";
import { BUILTIN_TEMPLATES, filterTemplatesByStyle } from "./templates";
import type { ScriptTemplate } from "./templates";
import { createScriptRunner } from "./scriptRunner";
import { createProofBridges } from "./proofBridge";
import { createCutEliminationBridges } from "./cutEliminationBridge";
import { createWorkspaceBridges } from "./workspaceBridge";
import { createHilbertProofBridges } from "./hilbertProofBridge";
import type { WorkspaceCommandHandler } from "./workspaceBridge";
import type { NativeFunctionBridge } from "./scriptRunner";

describe("BUILTIN_TEMPLATES", () => {
  it("19のテンプレートを含む", () => {
    expect(BUILTIN_TEMPLATES).toHaveLength(19);
  });

  it("各テンプレートが必須フィールドを持つ", () => {
    for (const tmpl of BUILTIN_TEMPLATES) {
      expect(tmpl.id).toBeTruthy();
      expect(tmpl.title).toBeTruthy();
      expect(tmpl.description).toBeTruthy();
      expect(tmpl.code).toBeTruthy();
    }
  });

  it("各テンプレートがcompatibleStylesを持つか、汎用テンプレートである", () => {
    for (const tmpl of BUILTIN_TEMPLATES) {
      // compatibleStyles が undefined → 汎用テンプレート（全スタイル共通）
      // compatibleStyles が配列 → 特定スタイルに紐づく
      if (tmpl.compatibleStyles !== undefined) {
        expect(tmpl.compatibleStyles.length).toBeGreaterThan(0);
      }
    }
  });

  it("汎用テンプレートが存在する", () => {
    const universal = BUILTIN_TEMPLATES.filter(
      (t) => t.compatibleStyles === undefined,
    );
    expect(universal.length).toBeGreaterThan(0);
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
    getDeductionSystemInfo: vi.fn().mockReturnValue({
      style: "hilbert",
      systemName: "Classical Propositional Logic",
      isHilbertStyle: true,
      rules: [],
    }),
    getLogicSystem: vi.fn().mockReturnValue({
      name: "Łukasiewicz",
      propositionalAxioms: ["A1", "A2", "A3", "CONJ-DEF", "DISJ-DEF"],
      predicateLogic: false,
      equalityLogic: false,
      generalization: false,
    }),
    extractScProof: vi.fn(),
    extractHilbertProof: vi.fn(),
  });

  const runTemplate = (tmpl: ScriptTemplate) => {
    consoleLogs.length = 0;
    const handler = createMockHandler();
    const bridges = [
      ...createProofBridges(),
      ...createCutEliminationBridges(),
      ...createWorkspaceBridges(handler),
      ...createHilbertProofBridges(handler),
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

  it("build-identity-proof-tree: 正常に実行され、ワークスペースに証明木が構築される", () => {
    const tmpl = BUILTIN_TEMPLATES.find(
      (t) => t.id === "build-identity-proof-tree",
    )!;
    consoleLogs.length = 0;
    const handler = createMockHandler();
    // addNode は呼び出しごとに異なるIDを返す
    let nodeCounter = 0;
    (handler.addNode as ReturnType<typeof vi.fn>).mockImplementation(() => {
      nodeCounter++;
      return `node-${String(nodeCounter) satisfies string}`;
    });
    // connectMP も呼び出しごとに異なるIDを返す
    let mpCounter = 100;
    (handler.connectMP as ReturnType<typeof vi.fn>).mockImplementation(() => {
      mpCounter++;
      return `mp-${String(mpCounter) satisfies string}`;
    });
    const bridges = [
      ...createProofBridges(),
      ...createCutEliminationBridges(),
      ...createWorkspaceBridges(handler),
      ...createHilbertProofBridges(handler),
      ...consoleBridges,
    ];
    const code = consoleShim + tmpl.code;
    const runner = createScriptRunner(code, {
      bridges,
      maxSteps: 50000,
    });
    const result = "run" in runner ? runner.run() : runner;
    if (result._tag === "Error") {
      throw new Error(
        `Template failed: ${JSON.stringify(result.error) satisfies string}`,
      );
    }
    expect(result._tag).toBe("Ok");
    // 体系チェックが通ること
    expect(handler.getDeductionSystemInfo).toHaveBeenCalled();
    // clearWorkspaceが呼ばれること
    expect(handler.clearWorkspace).toHaveBeenCalled();
    // 公理ノードが3つ追加されること
    expect(handler.addNode).toHaveBeenCalledTimes(3);
    // 公理設定が3つされること
    expect(handler.setNodeRoleAxiom).toHaveBeenCalledTimes(3);
    // MP接続が2回されること
    expect(handler.connectMP).toHaveBeenCalledTimes(2);
    // ゴール設定されること
    expect(handler.addGoal).toHaveBeenCalledWith("φ → φ");
    // レイアウトが適用されること
    expect(handler.applyLayout).toHaveBeenCalled();
    // コンソール出力の確認
    expect(consoleLogs.some((l) => l.includes("証明ツリーを構築"))).toBe(true);
    expect(consoleLogs.some((l) => l.includes("Q.E.D."))).toBe(true);
  });

  it("build-identity-proof-tree: ヒルベルト流以外ではエラー", () => {
    const tmpl = BUILTIN_TEMPLATES.find(
      (t) => t.id === "build-identity-proof-tree",
    )!;
    consoleLogs.length = 0;
    const handler = createMockHandler();
    // ND体系のモック
    (
      handler.getDeductionSystemInfo as ReturnType<typeof vi.fn>
    ).mockReturnValue({
      style: "natural-deduction",
      systemName: "Natural Deduction",
      isHilbertStyle: false,
      rules: [],
    });
    const bridges = [
      ...createProofBridges(),
      ...createCutEliminationBridges(),
      ...createWorkspaceBridges(handler),
      ...createHilbertProofBridges(handler),
      ...consoleBridges,
    ];
    const code = consoleShim + tmpl.code;
    const runner = createScriptRunner(code, {
      bridges,
      maxSteps: 50000,
    });
    const result = "run" in runner ? runner.run() : runner;
    // エラーで停止することを確認
    expect(result._tag).toBe("Error");
    // ワークスペースは操作されないこと
    expect(handler.clearWorkspace).not.toHaveBeenCalled();
    expect(handler.addNode).not.toHaveBeenCalled();
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

  it("cut-elimination-workspace: カット付き証明のカット除去が正常に実行される", () => {
    const tmpl = BUILTIN_TEMPLATES.find(
      (t) => t.id === "cut-elimination-workspace",
    )!;
    consoleLogs.length = 0;
    const handler = createMockHandler();
    // SC体系のモック
    (
      handler.getDeductionSystemInfo as ReturnType<typeof vi.fn>
    ).mockReturnValue({
      style: "sequent-calculus",
      systemName: "LK",
      isHilbertStyle: false,
      rules: ["identity", "cut"],
    });
    // extractScProofがカット付き証明を返すモック
    // Cut(φ): Identity(φ⇒φ) + Identity(φ⇒φ)
    const phi = { _tag: "MetaVariable", name: "φ" };
    const idPhi = {
      _tag: "ScIdentity",
      conclusion: { antecedents: [phi], succedents: [phi] },
    };
    (handler.extractScProof as ReturnType<typeof vi.fn>).mockReturnValue({
      _tag: "ScCut",
      conclusion: { antecedents: [phi], succedents: [phi] },
      left: idPhi,
      right: idPhi,
      cutFormula: phi,
    });
    const bridges = [
      ...createProofBridges(),
      ...createCutEliminationBridges(),
      ...createWorkspaceBridges(handler),
      ...createHilbertProofBridges(handler),
      ...consoleBridges,
    ];
    const code = consoleShim + tmpl.code;
    const runner = createScriptRunner(code, {
      bridges,
      maxSteps: 50000,
    });
    const result = "run" in runner ? runner.run() : runner;
    if (result._tag === "Error") {
      throw new Error(
        `Template failed: ${JSON.stringify(result.error) satisfies string}`,
      );
    }
    expect(result._tag).toBe("Ok");
    expect(handler.extractScProof).toHaveBeenCalled();
    expect(
      consoleLogs.some((l) => l.includes("ワークスペース証明のカット除去")),
    ).toBe(true);
    expect(consoleLogs.some((l) => l.includes("カット数: 1"))).toBe(true);
    expect(consoleLogs.some((l) => l.includes("Success"))).toBe(true);
    expect(handler.clearWorkspace).toHaveBeenCalled();
  });

  it("cut-elimination-workspace: 既にカットフリーの場合は変更なし", () => {
    const tmpl = BUILTIN_TEMPLATES.find(
      (t) => t.id === "cut-elimination-workspace",
    )!;
    consoleLogs.length = 0;
    const handler = createMockHandler();
    (
      handler.getDeductionSystemInfo as ReturnType<typeof vi.fn>
    ).mockReturnValue({
      style: "sequent-calculus",
      systemName: "LK",
      isHilbertStyle: false,
      rules: ["identity"],
    });
    // カットフリー証明（Identity のみ）
    const phi = { _tag: "MetaVariable", name: "φ" };
    (handler.extractScProof as ReturnType<typeof vi.fn>).mockReturnValue({
      _tag: "ScIdentity",
      conclusion: { antecedents: [phi], succedents: [phi] },
    });
    const bridges = [
      ...createProofBridges(),
      ...createCutEliminationBridges(),
      ...createWorkspaceBridges(handler),
      ...createHilbertProofBridges(handler),
      ...consoleBridges,
    ];
    const code = consoleShim + tmpl.code;
    const runner = createScriptRunner(code, {
      bridges,
      maxSteps: 50000,
    });
    const result = "run" in runner ? runner.run() : runner;
    if (result._tag === "Error") {
      throw new Error(
        `Template failed: ${JSON.stringify(result.error) satisfies string}`,
      );
    }
    expect(result._tag).toBe("Ok");
    expect(consoleLogs.some((l) => l.includes("既にカットフリー"))).toBe(true);
    // displayScProofは呼ばれない（変更なしのため）
    expect(handler.clearWorkspace).not.toHaveBeenCalled();
  });

  it("deduction-theorem-workspace: 正常に実行される", () => {
    const tmpl = BUILTIN_TEMPLATES.find(
      (t) => t.id === "deduction-theorem-workspace",
    )!;
    consoleLogs.length = 0;
    const handler = createMockHandler();
    // 選択ノードが1つある
    (handler.getSelectedNodeIds as ReturnType<typeof vi.fn>).mockReturnValue([
      "node-A",
    ]);
    // ノード一覧に選択ノードを含める
    (handler.getNodes as ReturnType<typeof vi.fn>).mockReturnValue([
      { id: "node-A", formulaText: "φ" },
    ]);
    // extractHilbertProofがAxiomNode(φ)を返す
    (handler.extractHilbertProof as ReturnType<typeof vi.fn>).mockReturnValue({
      _tag: "AxiomNode",
      formula: { _tag: "MetaVariable", name: "φ" },
    });
    const bridges = [
      ...createProofBridges(),
      ...createCutEliminationBridges(),
      ...createWorkspaceBridges(handler),
      ...createHilbertProofBridges(handler),
      ...consoleBridges,
    ];
    const code = consoleShim + tmpl.code;
    const runner = createScriptRunner(code, {
      bridges,
      maxSteps: 100000,
    });
    const result = "run" in runner ? runner.run() : runner;
    if (result._tag === "Error") {
      throw new Error(
        `Template failed: ${JSON.stringify(result.error) satisfies string}`,
      );
    }
    expect(result._tag).toBe("Ok");
    expect(handler.extractHilbertProof).toHaveBeenCalled();
    expect(consoleLogs.some((l) => l.includes("演繹定理の適用"))).toBe(true);
    expect(consoleLogs.some((l) => l.includes("演繹定理の適用が完了"))).toBe(
      true,
    );
    // 元のワークスペースはクリアされない
    expect(handler.clearWorkspace).not.toHaveBeenCalled();
  });

  it("deduction-theorem-workspace: ノード未選択でエラー", () => {
    const tmpl = BUILTIN_TEMPLATES.find(
      (t) => t.id === "deduction-theorem-workspace",
    )!;
    consoleLogs.length = 0;
    const handler = createMockHandler();
    // 選択ノードなし
    (handler.getSelectedNodeIds as ReturnType<typeof vi.fn>).mockReturnValue(
      [],
    );
    const bridges = [
      ...createProofBridges(),
      ...createCutEliminationBridges(),
      ...createWorkspaceBridges(handler),
      ...createHilbertProofBridges(handler),
      ...consoleBridges,
    ];
    const code = consoleShim + tmpl.code;
    const runner = createScriptRunner(code, {
      bridges,
      maxSteps: 50000,
    });
    const result = "run" in runner ? runner.run() : runner;
    expect(result._tag).toBe("Error");
    expect(handler.extractHilbertProof).not.toHaveBeenCalled();
  });

  it("deduction-theorem-workspace: ヒルベルト流以外ではエラー", () => {
    const tmpl = BUILTIN_TEMPLATES.find(
      (t) => t.id === "deduction-theorem-workspace",
    )!;
    consoleLogs.length = 0;
    const handler = createMockHandler();
    (
      handler.getDeductionSystemInfo as ReturnType<typeof vi.fn>
    ).mockReturnValue({
      style: "natural-deduction",
      systemName: "Natural Deduction",
      isHilbertStyle: false,
      rules: [],
    });
    const bridges = [
      ...createProofBridges(),
      ...createCutEliminationBridges(),
      ...createWorkspaceBridges(handler),
      ...createHilbertProofBridges(handler),
      ...consoleBridges,
    ];
    const code = consoleShim + tmpl.code;
    const runner = createScriptRunner(code, {
      bridges,
      maxSteps: 50000,
    });
    const result = "run" in runner ? runner.run() : runner;
    expect(result._tag).toBe("Error");
    expect(handler.extractHilbertProof).not.toHaveBeenCalled();
  });

  it("reverse-deduction-theorem-workspace: 正常に実行される", () => {
    const tmpl = BUILTIN_TEMPLATES.find(
      (t) => t.id === "reverse-deduction-theorem-workspace",
    )!;
    consoleLogs.length = 0;
    const handler = createMockHandler();
    // extractHilbertProofが φ→ψ の公理ノードを返す
    (handler.extractHilbertProof as ReturnType<typeof vi.fn>).mockReturnValue({
      _tag: "AxiomNode",
      formula: {
        _tag: "Implication",
        left: { _tag: "MetaVariable", name: "φ" },
        right: { _tag: "MetaVariable", name: "ψ" },
      },
    });
    const bridges = [
      ...createProofBridges(),
      ...createCutEliminationBridges(),
      ...createWorkspaceBridges(handler),
      ...createHilbertProofBridges(handler),
      ...consoleBridges,
    ];
    const code = consoleShim + tmpl.code;
    const runner = createScriptRunner(code, {
      bridges,
      maxSteps: 100000,
    });
    const result = "run" in runner ? runner.run() : runner;
    if (result._tag === "Error") {
      throw new Error(
        `Template failed: ${JSON.stringify(result.error) satisfies string}`,
      );
    }
    expect(result._tag).toBe("Ok");
    expect(handler.extractHilbertProof).toHaveBeenCalled();
    expect(consoleLogs.some((l) => l.includes("逆演繹定理の適用"))).toBe(true);
    expect(consoleLogs.some((l) => l.includes("逆演繹定理の適用が完了"))).toBe(
      true,
    );
    // 元のワークスペースはクリアされない
    expect(handler.clearWorkspace).not.toHaveBeenCalled();
  });

  it("reverse-deduction-theorem-workspace: ヒルベルト流以外ではエラー", () => {
    const tmpl = BUILTIN_TEMPLATES.find(
      (t) => t.id === "reverse-deduction-theorem-workspace",
    )!;
    consoleLogs.length = 0;
    const handler = createMockHandler();
    (
      handler.getDeductionSystemInfo as ReturnType<typeof vi.fn>
    ).mockReturnValue({
      style: "natural-deduction",
      systemName: "Natural Deduction",
      isHilbertStyle: false,
      rules: [],
    });
    const bridges = [
      ...createProofBridges(),
      ...createCutEliminationBridges(),
      ...createWorkspaceBridges(handler),
      ...createHilbertProofBridges(handler),
      ...consoleBridges,
    ];
    const code = consoleShim + tmpl.code;
    const runner = createScriptRunner(code, {
      bridges,
      maxSteps: 50000,
    });
    const result = "run" in runner ? runner.run() : runner;
    expect(result._tag).toBe("Error");
    expect(handler.extractHilbertProof).not.toHaveBeenCalled();
  });

  it("reverse-deduction-theorem-workspace: 結論が含意でない場合エラー", () => {
    const tmpl = BUILTIN_TEMPLATES.find(
      (t) => t.id === "reverse-deduction-theorem-workspace",
    )!;
    consoleLogs.length = 0;
    const handler = createMockHandler();
    // extractHilbertProofが φ（含意でない）の公理ノードを返す
    (handler.extractHilbertProof as ReturnType<typeof vi.fn>).mockReturnValue({
      _tag: "AxiomNode",
      formula: { _tag: "MetaVariable", name: "φ" },
    });
    const bridges = [
      ...createProofBridges(),
      ...createCutEliminationBridges(),
      ...createWorkspaceBridges(handler),
      ...createHilbertProofBridges(handler),
      ...consoleBridges,
    ];
    const code = consoleShim + tmpl.code;
    const runner = createScriptRunner(code, {
      bridges,
      maxSteps: 50000,
    });
    const result = "run" in runner ? runner.run() : runner;
    expect(result._tag).toBe("Error");
  });

  it.each([
    { id: "cut-elimination-step1", keyword: "段階1 完了" },
    { id: "cut-elimination-step2", keyword: "段階2 完了" },
    { id: "cut-elimination-step3", keyword: "段階3 完了" },
    { id: "cut-elimination-step4", keyword: "段階4 完了" },
    { id: "cut-elimination-step5", keyword: "段階5 完了" },
    { id: "cut-elimination-step6", keyword: "全6段階 完了" },
  ])("$id: 正常に実行される", ({ id, keyword }) => {
    const tmpl = BUILTIN_TEMPLATES.find((t) => t.id === id)!;
    const result = runTemplate(tmpl);
    if (result._tag === "Error") {
      throw new Error(
        `Template failed: ${JSON.stringify(result.error) satisfies string}`,
      );
    }
    expect(result._tag).toBe("Ok");
    expect(consoleLogs.some((l) => l.includes(keyword))).toBe(true);
  });

  // ── 汎用テンプレートのテスト ──

  it("formula-explorer: 正常に実行される", () => {
    const tmpl = BUILTIN_TEMPLATES.find((t) => t.id === "formula-explorer")!;
    const result = runTemplate(tmpl);
    if (result._tag === "Error") {
      throw new Error(
        `Template failed: ${JSON.stringify(result.error) satisfies string}`,
      );
    }
    expect(result._tag).toBe("Ok");
    expect(consoleLogs.some((l) => l.includes("論理式の探索"))).toBe(true);
    expect(consoleLogs.some((l) => l.includes("探索完了"))).toBe(true);
  });

  it("unification-demo: 正常に実行される", () => {
    const tmpl = BUILTIN_TEMPLATES.find((t) => t.id === "unification-demo")!;
    const result = runTemplate(tmpl);
    if (result._tag === "Error") {
      throw new Error(
        `Template failed: ${JSON.stringify(result.error) satisfies string}`,
      );
    }
    expect(result._tag).toBe("Ok");
    expect(consoleLogs.some((l) => l.includes("ユニフィケーション"))).toBe(
      true,
    );
    expect(consoleLogs.some((l) => l.includes("デモ完了"))).toBe(true);
  });

  // ── Hilbert追加テンプレートのテスト ──

  it("axiom-explorer: 正常に実行される", () => {
    const tmpl = BUILTIN_TEMPLATES.find((t) => t.id === "axiom-explorer")!;
    const result = runTemplate(tmpl);
    if (result._tag === "Error") {
      throw new Error(
        `Template failed: ${JSON.stringify(result.error) satisfies string}`,
      );
    }
    expect(result._tag).toBe("Ok");
    expect(consoleLogs.some((l) => l.includes("公理スキーマの探索"))).toBe(
      true,
    );
    expect(consoleLogs.some((l) => l.includes("探索完了"))).toBe(true);
  });

  it("axiom-explorer: Hilbert以外ではgetLogicSystemがエラー", () => {
    const tmpl = BUILTIN_TEMPLATES.find((t) => t.id === "axiom-explorer")!;
    consoleLogs.length = 0;
    const handler = createMockHandler();
    (handler.getLogicSystem as ReturnType<typeof vi.fn>).mockImplementation(
      () => {
        throw new Error("Hilbert体系でのみ使用可能です");
      },
    );
    const bridges = [
      ...createProofBridges(),
      ...createCutEliminationBridges(),
      ...createWorkspaceBridges(handler),
      ...createHilbertProofBridges(handler),
      ...consoleBridges,
    ];
    const code = consoleShim + tmpl.code;
    const runner = createScriptRunner(code, {
      bridges,
      maxSteps: 50000,
    });
    const result = "run" in runner ? runner.run() : runner;
    expect(result._tag).toBe("Error");
  });

  it("predicate-logic-proof: 述語論理体系で正常に実行される", () => {
    const tmpl = BUILTIN_TEMPLATES.find(
      (t) => t.id === "predicate-logic-proof",
    )!;
    consoleLogs.length = 0;
    const handler = createMockHandler();
    // 述語論理体系をモック
    (handler.getLogicSystem as ReturnType<typeof vi.fn>).mockReturnValue({
      name: "Predicate Logic",
      propositionalAxioms: ["A1", "A2", "A3", "A4", "A5"],
      predicateLogic: true,
      equalityLogic: false,
      generalization: true,
    });
    const bridges = [
      ...createProofBridges(),
      ...createCutEliminationBridges(),
      ...createWorkspaceBridges(handler),
      ...createHilbertProofBridges(handler),
      ...consoleBridges,
    ];
    const code = consoleShim + tmpl.code;
    const runner = createScriptRunner(code, {
      bridges,
      maxSteps: 50000,
    });
    const result = "run" in runner ? runner.run() : runner;
    if (result._tag === "Error") {
      throw new Error(
        `Template failed: ${JSON.stringify(result.error) satisfies string}`,
      );
    }
    expect(result._tag).toBe("Ok");
    expect(
      consoleLogs.some((l) => l.includes("述語論理: 汎化規則と全称例化")),
    ).toBe(true);
    expect(consoleLogs.some((l) => l.includes("Gen 適用後"))).toBe(true);
    expect(consoleLogs.some((l) => l.includes("探索完了"))).toBe(true);
  });

  it("predicate-logic-proof: 汎化無効な体系ではエラー", () => {
    const tmpl = BUILTIN_TEMPLATES.find(
      (t) => t.id === "predicate-logic-proof",
    )!;
    consoleLogs.length = 0;
    const handler = createMockHandler();
    // generalization: false の体系
    const bridges = [
      ...createProofBridges(),
      ...createCutEliminationBridges(),
      ...createWorkspaceBridges(handler),
      ...createHilbertProofBridges(handler),
      ...consoleBridges,
    ];
    const code = consoleShim + tmpl.code;
    const runner = createScriptRunner(code, {
      bridges,
      maxSteps: 50000,
    });
    const result = "run" in runner ? runner.run() : runner;
    expect(result._tag).toBe("Error");
  });

  it("syllogism-proof: 正常に実行される", () => {
    const tmpl = BUILTIN_TEMPLATES.find((t) => t.id === "syllogism-proof")!;
    consoleLogs.length = 0;
    const handler = createMockHandler();
    let nodeCounter = 0;
    (handler.addNode as ReturnType<typeof vi.fn>).mockImplementation(() => {
      nodeCounter++;
      return `node-${String(nodeCounter) satisfies string}`;
    });
    let mpCounter = 100;
    (handler.connectMP as ReturnType<typeof vi.fn>).mockImplementation(() => {
      mpCounter++;
      return `mp-${String(mpCounter) satisfies string}`;
    });
    // extractHilbertProofが仮定つき証明を返す
    (handler.extractHilbertProof as ReturnType<typeof vi.fn>).mockReturnValue({
      _tag: "ModusPonensNode",
      formula: { _tag: "MetaVariable", name: "χ" },
      antecedent: {
        _tag: "ModusPonensNode",
        formula: { _tag: "MetaVariable", name: "ψ" },
        antecedent: {
          _tag: "AxiomNode",
          formula: { _tag: "MetaVariable", name: "φ" },
        },
        conditional: {
          _tag: "AxiomNode",
          formula: {
            _tag: "Implication",
            left: { _tag: "MetaVariable", name: "φ" },
            right: { _tag: "MetaVariable", name: "ψ" },
          },
        },
      },
      conditional: {
        _tag: "AxiomNode",
        formula: {
          _tag: "Implication",
          left: { _tag: "MetaVariable", name: "ψ" },
          right: { _tag: "MetaVariable", name: "χ" },
        },
      },
    });
    const bridges = [
      ...createProofBridges(),
      ...createCutEliminationBridges(),
      ...createWorkspaceBridges(handler),
      ...createHilbertProofBridges(handler),
      ...consoleBridges,
    ];
    const code = consoleShim + tmpl.code;
    const runner = createScriptRunner(code, {
      bridges,
      maxSteps: 500000,
    });
    const result = "run" in runner ? runner.run() : runner;
    if (result._tag === "Error") {
      throw new Error(
        `Template failed: ${JSON.stringify(result.error) satisfies string}`,
      );
    }
    expect(result._tag).toBe("Ok");
    expect(handler.clearWorkspace).toHaveBeenCalled();
    // addNode: 3 (initial) + many from displayHilbertProof (deduction theorem output)
    expect(
      (handler.addNode as ReturnType<typeof vi.fn>).mock.calls.length,
    ).toBeGreaterThanOrEqual(3);
    // connectMP: 2 (initial) + many from displayHilbertProof
    expect(
      (handler.connectMP as ReturnType<typeof vi.fn>).mock.calls.length,
    ).toBeGreaterThanOrEqual(2);
    expect(consoleLogs.some((l) => l.includes("三段論法"))).toBe(true);
    expect(consoleLogs.some((l) => l.includes("Q.E.D."))).toBe(true);
  });

  it("syllogism-proof: ヒルベルト流以外ではエラー", () => {
    const tmpl = BUILTIN_TEMPLATES.find((t) => t.id === "syllogism-proof")!;
    consoleLogs.length = 0;
    const handler = createMockHandler();
    (
      handler.getDeductionSystemInfo as ReturnType<typeof vi.fn>
    ).mockReturnValue({
      style: "natural-deduction",
      systemName: "Natural Deduction",
      isHilbertStyle: false,
      rules: [],
    });
    const bridges = [
      ...createProofBridges(),
      ...createCutEliminationBridges(),
      ...createWorkspaceBridges(handler),
      ...createHilbertProofBridges(handler),
      ...consoleBridges,
    ];
    const code = consoleShim + tmpl.code;
    const runner = createScriptRunner(code, {
      bridges,
      maxSteps: 50000,
    });
    const result = "run" in runner ? runner.run() : runner;
    expect(result._tag).toBe("Error");
    expect(handler.clearWorkspace).not.toHaveBeenCalled();
  });

  it("cut-elimination-workspace: SC体系以外ではエラー", () => {
    const tmpl = BUILTIN_TEMPLATES.find(
      (t) => t.id === "cut-elimination-workspace",
    )!;
    consoleLogs.length = 0;
    const handler = createMockHandler();
    // Hilbert体系（デフォルトモック）のまま
    const bridges = [
      ...createProofBridges(),
      ...createCutEliminationBridges(),
      ...createWorkspaceBridges(handler),
      ...createHilbertProofBridges(handler),
      ...consoleBridges,
    ];
    const code = consoleShim + tmpl.code;
    const runner = createScriptRunner(code, {
      bridges,
      maxSteps: 50000,
    });
    const result = "run" in runner ? runner.run() : runner;
    expect(result._tag).toBe("Error");
    expect(handler.extractScProof).not.toHaveBeenCalled();
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
    const ids = result.map((t) => t.id);
    // 汎用テンプレート
    expect(ids).toContain("formula-explorer");
    expect(ids).toContain("unification-demo");
    // Hilbert固有
    expect(ids).toContain("build-identity-proof");
    expect(ids).toContain("build-identity-proof-tree");
    expect(ids).toContain("axiom-explorer");
    expect(ids).toContain("predicate-logic-proof");
    expect(ids).toContain("syllogism-proof");
    expect(ids).toContain("deduction-theorem-workspace");
    expect(ids).toContain("reverse-deduction-theorem-workspace");
    expect(result).toHaveLength(9);
  });

  it("BUILTIN_TEMPLATESでsequent-calculusフィルタ", () => {
    const result = filterTemplatesByStyle(
      BUILTIN_TEMPLATES,
      "sequent-calculus",
    );
    const ids = result.map((t) => t.id);
    // 汎用テンプレート
    expect(ids).toContain("formula-explorer");
    expect(ids).toContain("unification-demo");
    // SC固有
    expect(ids).toContain("cut-elimination-simple");
    expect(ids).toContain("cut-elimination-implication");
    expect(ids).toContain("cut-elimination-workspace");
    expect(ids).toContain("auto-prove-lk");
    // 段階的テンプレート (6段階)
    expect(ids).toContain("cut-elimination-step1");
    expect(ids).toContain("cut-elimination-step2");
    expect(ids).toContain("cut-elimination-step3");
    expect(ids).toContain("cut-elimination-step4");
    expect(ids).toContain("cut-elimination-step5");
    expect(ids).toContain("cut-elimination-step6");
    expect(result).toHaveLength(12);
  });

  it("空配列に対してフィルタしても空配列を返す", () => {
    const result = filterTemplatesByStyle([], "hilbert");
    expect(result).toHaveLength(0);
  });
});

import { describe, it, expect, vi } from "vitest";
import {
  createWorkspaceBridges,
  WORKSPACE_BRIDGE_API_DEFS,
  generateWorkspaceBridgeTypeDefs,
} from "./workspaceBridge";
import type { WorkspaceCommandHandler } from "./workspaceBridge";
import { createScriptRunner, isScriptRunResult } from "./scriptRunner";
import type { ScriptRunnerInstance, ScriptRunResult } from "./scriptRunner";

// ── ヘルパー ──────────────────────────────────────────────────

const createMockHandler = (): WorkspaceCommandHandler => ({
  addNode: vi.fn().mockReturnValue("node-1"),
  setNodeFormula: vi.fn(),
  getNodes: vi.fn().mockReturnValue([
    { id: "node-1", formulaText: "phi", label: "Axiom", x: 0, y: 0 },
  ]),
  connectMP: vi.fn().mockReturnValue("node-2"),
  addGoal: vi.fn(),
  removeNode: vi.fn(),
  setNodeRoleAxiom: vi.fn(),
  applyLayout: vi.fn(),
});

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

const runCode = (
  code: string,
  handler: WorkspaceCommandHandler,
): unknown => {
  const bridges = createWorkspaceBridges(handler);
  const raw = createScriptRunner(code, { bridges, maxSteps: 100_000 });
  const runner = getRunner(raw);
  const result = runner.run();
  if (result._tag !== "Ok") {
    const json = JSON.stringify(result.error) satisfies string;
    throw new Error(`Execution failed: ${json satisfies string}`);
  }
  return result.value;
};

const runCodeError = (
  code: string,
  handler: WorkspaceCommandHandler,
): string => {
  const bridges = createWorkspaceBridges(handler);
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

describe("createWorkspaceBridges", () => {
  it("ブリッジ関数一覧を返す", () => {
    const handler = createMockHandler();
    const bridges = createWorkspaceBridges(handler);
    expect(bridges.length).toBe(8);
    const names = bridges.map((b) => b.name);
    expect(names).toContain("addNode");
    expect(names).toContain("setNodeFormula");
    expect(names).toContain("getNodes");
    expect(names).toContain("connectMP");
    expect(names).toContain("addGoal");
    expect(names).toContain("removeNode");
    expect(names).toContain("setNodeRoleAxiom");
    expect(names).toContain("applyLayout");
  });
});

describe("addNode ブリッジ", () => {
  it("formulaTextを渡してノードIDを返す", () => {
    const handler = createMockHandler();
    const result = runCode(`addNode("phi -> psi")`, handler);
    expect(result).toBe("node-1");
    expect(handler.addNode).toHaveBeenCalledWith("phi -> psi");
  });

  it("文字列以外を渡すとエラー", () => {
    const handler = createMockHandler();
    const msg = runCodeError(`addNode(123)`, handler);
    expect(msg).toContain("addNode");
    expect(msg).toContain("string");
  });
});

describe("setNodeFormula ブリッジ", () => {
  it("nodeIdとformulaTextでハンドラーが呼ばれる", () => {
    const handler = createMockHandler();
    runCode(`setNodeFormula("node-1", "phi")`, handler);
    expect(handler.setNodeFormula).toHaveBeenCalledWith("node-1", "phi");
  });

  it("nodeIdが文字列でないとエラー", () => {
    const handler = createMockHandler();
    const msg = runCodeError(`setNodeFormula(1, "phi")`, handler);
    expect(msg).toContain("setNodeFormula");
    expect(msg).toContain("nodeId");
  });

  it("formulaTextが文字列でないとエラー", () => {
    const handler = createMockHandler();
    const msg = runCodeError(`setNodeFormula("node-1", 42)`, handler);
    expect(msg).toContain("setNodeFormula");
    expect(msg).toContain("formulaText");
  });
});

describe("getNodes ブリッジ", () => {
  it("全ノード一覧を返す", () => {
    const handler = createMockHandler();
    const result = runCode(`getNodes()`, handler);
    expect(result).toEqual([
      { id: "node-1", formulaText: "phi", label: "Axiom", x: 0, y: 0 },
    ]);
  });
});

describe("connectMP ブリッジ", () => {
  it("2ノードをMPで接続し結論ノードIDを返す", () => {
    const handler = createMockHandler();
    const result = runCode(
      `connectMP("node-1", "node-2")`,
      handler,
    );
    expect(result).toBe("node-2");
    expect(handler.connectMP).toHaveBeenCalledWith("node-1", "node-2");
  });

  it("antecedentIdが文字列でないとエラー", () => {
    const handler = createMockHandler();
    const msg = runCodeError(`connectMP(1, "node-2")`, handler);
    expect(msg).toContain("connectMP");
    expect(msg).toContain("antecedentId");
  });

  it("conditionalIdが文字列でないとエラー", () => {
    const handler = createMockHandler();
    const msg = runCodeError(`connectMP("node-1", 2)`, handler);
    expect(msg).toContain("connectMP");
    expect(msg).toContain("conditionalId");
  });
});

describe("addGoal ブリッジ", () => {
  it("ゴール式を設定する", () => {
    const handler = createMockHandler();
    runCode(`addGoal("phi -> phi")`, handler);
    expect(handler.addGoal).toHaveBeenCalledWith("phi -> phi");
  });

  it("文字列以外を渡すとエラー", () => {
    const handler = createMockHandler();
    const msg = runCodeError(`addGoal(true)`, handler);
    expect(msg).toContain("addGoal");
    expect(msg).toContain("string");
  });
});

describe("removeNode ブリッジ", () => {
  it("ノードを削除する", () => {
    const handler = createMockHandler();
    runCode(`removeNode("node-1")`, handler);
    expect(handler.removeNode).toHaveBeenCalledWith("node-1");
  });

  it("文字列以外を渡すとエラー", () => {
    const handler = createMockHandler();
    const msg = runCodeError(`removeNode(1)`, handler);
    expect(msg).toContain("removeNode");
    expect(msg).toContain("string");
  });
});

describe("setNodeRoleAxiom ブリッジ", () => {
  it("ノードの役割を公理に設定する", () => {
    const handler = createMockHandler();
    runCode(`setNodeRoleAxiom("node-1")`, handler);
    expect(handler.setNodeRoleAxiom).toHaveBeenCalledWith("node-1");
  });

  it("文字列以外を渡すとエラー", () => {
    const handler = createMockHandler();
    const msg = runCodeError(`setNodeRoleAxiom(1)`, handler);
    expect(msg).toContain("setNodeRoleAxiom");
    expect(msg).toContain("string");
  });
});

describe("applyLayout ブリッジ", () => {
  it("レイアウトを適用する", () => {
    const handler = createMockHandler();
    runCode(`applyLayout()`, handler);
    expect(handler.applyLayout).toHaveBeenCalled();
  });
});

// ── API定義 ──────────────────────────────────────────────────

describe("WORKSPACE_BRIDGE_API_DEFS", () => {
  it("全ブリッジ関数の定義が存在する", () => {
    const handler = createMockHandler();
    const bridges = createWorkspaceBridges(handler);
    const defNames = WORKSPACE_BRIDGE_API_DEFS.map((d) => d.name);
    for (const b of bridges) {
      expect(defNames).toContain(b.name);
    }
  });

  it("各定義にname, signature, descriptionがある", () => {
    for (const def of WORKSPACE_BRIDGE_API_DEFS) {
      expect(def.name).toBeTruthy();
      expect(def.signature).toBeTruthy();
      expect(def.description).toBeTruthy();
    }
  });
});

describe("generateWorkspaceBridgeTypeDefs", () => {
  it("TypeScript型定義テキストを生成する", () => {
    const typeDefs = generateWorkspaceBridgeTypeDefs();
    expect(typeDefs).toContain("declare function addNode");
    expect(typeDefs).toContain("declare function connectMP");
    expect(typeDefs).toContain("declare function applyLayout");
  });
});

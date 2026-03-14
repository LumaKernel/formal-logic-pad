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
  getNodes: vi
    .fn()
    .mockReturnValue([
      { id: "node-1", formulaText: "phi", label: "Axiom", x: 0, y: 0 },
    ]),
  connectMP: vi.fn().mockReturnValue("node-2"),
  addGoal: vi.fn(),
  removeNode: vi.fn(),
  setNodeRoleAxiom: vi.fn(),
  applyLayout: vi.fn(),
  clearWorkspace: vi.fn(),
  getSelectedNodeIds: vi.fn().mockReturnValue(["node-1"]),
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

const runCode = (code: string, handler: WorkspaceCommandHandler): unknown => {
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
    expect(bridges.length).toBe(11);
    const names = bridges.map((b) => b.name);
    expect(names).toContain("addNode");
    expect(names).toContain("setNodeFormula");
    expect(names).toContain("getNodes");
    expect(names).toContain("connectMP");
    expect(names).toContain("addGoal");
    expect(names).toContain("removeNode");
    expect(names).toContain("setNodeRoleAxiom");
    expect(names).toContain("applyLayout");
    expect(names).toContain("clearWorkspace");
    expect(names).toContain("displayScProof");
    expect(names).toContain("getSelectedNodeIds");
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
    const result = runCode(`connectMP("node-1", "node-2")`, handler);
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

describe("clearWorkspace ブリッジ", () => {
  it("全ノードを削除する", () => {
    const handler = createMockHandler();
    runCode(`clearWorkspace()`, handler);
    expect(handler.clearWorkspace).toHaveBeenCalled();
  });
});

describe("displayScProof ブリッジ", () => {
  it("SC証明木をワークスペースに展開する", () => {
    const handler = createMockHandler();
    // φ ⇒ φ (Identity) のみの証明
    const code = `
var phi = { _tag: "MetaVariable", name: "φ" };
var proof = {
  _tag: "ScIdentity",
  conclusion: { antecedents: [phi], succedents: [phi] }
};
displayScProof(proof);
`;
    runCode(code, handler);
    // clearWorkspace → addNode → applyLayout
    expect(handler.clearWorkspace).toHaveBeenCalledTimes(1);
    expect(handler.addNode).toHaveBeenCalledTimes(1);
    // ノードテキストは "φ ⇒ φ [ID]" 形式
    const addNodeCall = (handler.addNode as ReturnType<typeof vi.fn>).mock
      .calls[0];
    expect(addNodeCall[0]).toContain("φ ⇒ φ");
    expect(addNodeCall[0]).toContain("[ID]");
    expect(handler.applyLayout).toHaveBeenCalledTimes(1);
  });

  it("カットを含む証明木を展開する（複数ノード）", () => {
    const handler = createMockHandler();
    // Cut(φ): Identity(φ⇒φ) + Identity(φ⇒φ)
    const code = `
var phi = { _tag: "MetaVariable", name: "φ" };
var idPhi = {
  _tag: "ScIdentity",
  conclusion: { antecedents: [phi], succedents: [phi] }
};
var proof = {
  _tag: "ScCut",
  conclusion: { antecedents: [phi], succedents: [phi] },
  left: idPhi,
  right: idPhi,
  cutFormula: phi
};
displayScProof(proof);
`;
    runCode(code, handler);
    // 2つの前提ID + 1つのCutノード = 3ノード
    expect(handler.addNode).toHaveBeenCalledTimes(3);
    expect(handler.clearWorkspace).toHaveBeenCalledTimes(1);
    expect(handler.applyLayout).toHaveBeenCalledTimes(1);
  });

  it("BottomLeft（0前提）を展開する", () => {
    const handler = createMockHandler();
    const code = `
var phi = { _tag: "MetaVariable", name: "φ" };
var proof = {
  _tag: "ScBottomLeft",
  conclusion: { antecedents: [phi], succedents: [phi] }
};
displayScProof(proof);
`;
    runCode(code, handler);
    expect(handler.addNode).toHaveBeenCalledTimes(1);
    const call = (handler.addNode as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(call[0]).toContain("[⊥L]");
  });

  it("WeakeningLeft（単一前提・weakenedFormula）を展開する", () => {
    const handler = createMockHandler();
    const code = `
var phi = { _tag: "MetaVariable", name: "φ" };
var psi = { _tag: "MetaVariable", name: "ψ" };
var idPhi = {
  _tag: "ScIdentity",
  conclusion: { antecedents: [phi], succedents: [phi] }
};
var proof = {
  _tag: "ScWeakeningLeft",
  conclusion: { antecedents: [psi, phi], succedents: [phi] },
  premise: idPhi,
  weakenedFormula: psi
};
displayScProof(proof);
`;
    runCode(code, handler);
    expect(handler.addNode).toHaveBeenCalledTimes(2);
    const calls = (handler.addNode as ReturnType<typeof vi.fn>).mock.calls;
    expect(calls[0][0]).toContain("[ID]");
    expect(calls[1][0]).toContain("[WL]");
  });

  it("WeakeningRight を展開する", () => {
    const handler = createMockHandler();
    const code = `
var phi = { _tag: "MetaVariable", name: "φ" };
var psi = { _tag: "MetaVariable", name: "ψ" };
var idPhi = {
  _tag: "ScIdentity",
  conclusion: { antecedents: [phi], succedents: [phi] }
};
var proof = {
  _tag: "ScWeakeningRight",
  conclusion: { antecedents: [phi], succedents: [phi, psi] },
  premise: idPhi,
  weakenedFormula: psi
};
displayScProof(proof);
`;
    runCode(code, handler);
    const calls = (handler.addNode as ReturnType<typeof vi.fn>).mock.calls;
    expect(calls[1][0]).toContain("[WR]");
  });

  it("ContractionLeft/ContractionRight を展開する", () => {
    const handler = createMockHandler();
    const code = `
var phi = { _tag: "MetaVariable", name: "φ" };
var idPhi = {
  _tag: "ScIdentity",
  conclusion: { antecedents: [phi], succedents: [phi] }
};
var cl = {
  _tag: "ScContractionLeft",
  conclusion: { antecedents: [phi], succedents: [phi] },
  premise: idPhi,
  contractedFormula: phi
};
var cr = {
  _tag: "ScContractionRight",
  conclusion: { antecedents: [phi], succedents: [phi] },
  premise: cl,
  contractedFormula: phi
};
displayScProof(cr);
`;
    runCode(code, handler);
    const calls = (handler.addNode as ReturnType<typeof vi.fn>).mock.calls;
    expect(calls[0][0]).toContain("[ID]");
    expect(calls[1][0]).toContain("[CL]");
    expect(calls[2][0]).toContain("[CR]");
  });

  it("ExchangeLeft/ExchangeRight を展開する", () => {
    const handler = createMockHandler();
    const code = `
var phi = { _tag: "MetaVariable", name: "φ" };
var idPhi = {
  _tag: "ScIdentity",
  conclusion: { antecedents: [phi], succedents: [phi] }
};
var xl = {
  _tag: "ScExchangeLeft",
  conclusion: { antecedents: [phi], succedents: [phi] },
  premise: idPhi,
  position: 0
};
var xr = {
  _tag: "ScExchangeRight",
  conclusion: { antecedents: [phi], succedents: [phi] },
  premise: xl,
  position: 0
};
displayScProof(xr);
`;
    runCode(code, handler);
    const calls = (handler.addNode as ReturnType<typeof vi.fn>).mock.calls;
    expect(calls[0][0]).toContain("[ID]");
    expect(calls[1][0]).toContain("[XL]");
    expect(calls[2][0]).toContain("[XR]");
  });

  it("ImplicationLeft（2前提）を展開する", () => {
    const handler = createMockHandler();
    const code = `
var phi = { _tag: "MetaVariable", name: "φ" };
var idPhi = {
  _tag: "ScIdentity",
  conclusion: { antecedents: [phi], succedents: [phi] }
};
var proof = {
  _tag: "ScImplicationLeft",
  conclusion: { antecedents: [phi], succedents: [phi] },
  left: idPhi,
  right: idPhi
};
displayScProof(proof);
`;
    runCode(code, handler);
    const calls = (handler.addNode as ReturnType<typeof vi.fn>).mock.calls;
    expect(calls[2][0]).toContain("[→L]");
    expect(handler.addNode).toHaveBeenCalledTimes(3);
  });

  it("ImplicationRight（単一前提）を展開する", () => {
    const handler = createMockHandler();
    const code = `
var phi = { _tag: "MetaVariable", name: "φ" };
var idPhi = {
  _tag: "ScIdentity",
  conclusion: { antecedents: [phi], succedents: [phi] }
};
var proof = {
  _tag: "ScImplicationRight",
  conclusion: { antecedents: [], succedents: [phi] },
  premise: idPhi
};
displayScProof(proof);
`;
    runCode(code, handler);
    const calls = (handler.addNode as ReturnType<typeof vi.fn>).mock.calls;
    expect(calls[1][0]).toContain("[→R]");
  });

  it("ConjunctionLeft/ConjunctionRight を展開する", () => {
    const handler = createMockHandler();
    const code = `
var phi = { _tag: "MetaVariable", name: "φ" };
var idPhi = {
  _tag: "ScIdentity",
  conclusion: { antecedents: [phi], succedents: [phi] }
};
var conjL = {
  _tag: "ScConjunctionLeft",
  conclusion: { antecedents: [phi], succedents: [phi] },
  premise: idPhi,
  componentIndex: 1
};
var conjR = {
  _tag: "ScConjunctionRight",
  conclusion: { antecedents: [phi], succedents: [phi] },
  left: idPhi,
  right: conjL
};
displayScProof(conjR);
`;
    runCode(code, handler);
    const calls = (handler.addNode as ReturnType<typeof vi.fn>).mock.calls;
    // idPhi(left) → idPhi(conjL.premise) → conjL → conjR = 4 nodes
    expect(handler.addNode).toHaveBeenCalledTimes(4);
    expect(calls[2][0]).toContain("[∧L]");
    expect(calls[3][0]).toContain("[∧R]");
  });

  it("DisjunctionLeft/DisjunctionRight を展開する", () => {
    const handler = createMockHandler();
    const code = `
var phi = { _tag: "MetaVariable", name: "φ" };
var idPhi = {
  _tag: "ScIdentity",
  conclusion: { antecedents: [phi], succedents: [phi] }
};
var disjR = {
  _tag: "ScDisjunctionRight",
  conclusion: { antecedents: [phi], succedents: [phi] },
  premise: idPhi,
  componentIndex: 1
};
var disjL = {
  _tag: "ScDisjunctionLeft",
  conclusion: { antecedents: [phi], succedents: [phi] },
  left: idPhi,
  right: disjR
};
displayScProof(disjL);
`;
    runCode(code, handler);
    const calls = (handler.addNode as ReturnType<typeof vi.fn>).mock.calls;
    // idPhi(left) → idPhi(disjR.premise) → disjR → disjL = 4 nodes
    expect(handler.addNode).toHaveBeenCalledTimes(4);
    expect(calls[2][0]).toContain("[∨R]");
    expect(calls[3][0]).toContain("[∨L]");
  });

  it("UniversalLeft/UniversalRight を展開する", () => {
    const handler = createMockHandler();
    const code = `
var phi = { _tag: "MetaVariable", name: "φ" };
var idPhi = {
  _tag: "ScIdentity",
  conclusion: { antecedents: [phi], succedents: [phi] }
};
var uniL = {
  _tag: "ScUniversalLeft",
  conclusion: { antecedents: [phi], succedents: [phi] },
  premise: idPhi
};
var uniR = {
  _tag: "ScUniversalRight",
  conclusion: { antecedents: [phi], succedents: [phi] },
  premise: uniL
};
displayScProof(uniR);
`;
    runCode(code, handler);
    const calls = (handler.addNode as ReturnType<typeof vi.fn>).mock.calls;
    expect(calls[0][0]).toContain("[ID]");
    expect(calls[1][0]).toContain("[∀L]");
    expect(calls[2][0]).toContain("[∀R]");
  });

  it("ExistentialLeft/ExistentialRight を展開する", () => {
    const handler = createMockHandler();
    const code = `
var phi = { _tag: "MetaVariable", name: "φ" };
var idPhi = {
  _tag: "ScIdentity",
  conclusion: { antecedents: [phi], succedents: [phi] }
};
var exL = {
  _tag: "ScExistentialLeft",
  conclusion: { antecedents: [phi], succedents: [phi] },
  premise: idPhi
};
var exR = {
  _tag: "ScExistentialRight",
  conclusion: { antecedents: [phi], succedents: [phi] },
  premise: exL
};
displayScProof(exR);
`;
    runCode(code, handler);
    const calls = (handler.addNode as ReturnType<typeof vi.fn>).mock.calls;
    expect(calls[0][0]).toContain("[ID]");
    expect(calls[1][0]).toContain("[∃L]");
    expect(calls[2][0]).toContain("[∃R]");
  });

  it("不正な証明JSONでエラー", () => {
    const handler = createMockHandler();
    const msg = runCodeError(`displayScProof({ _tag: "Invalid" })`, handler);
    expect(msg).toContain("SC proof");
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

describe("getSelectedNodeIds ブリッジ", () => {
  it("選択中のノードID一覧を返す", () => {
    const handler = createMockHandler();
    const result = runCode(`getSelectedNodeIds()`, handler);
    expect(result).toEqual(["node-1"]);
    expect(handler.getSelectedNodeIds).toHaveBeenCalled();
  });

  it("選択なしの場合は空配列を返す", () => {
    const handler = createMockHandler();
    (handler.getSelectedNodeIds as ReturnType<typeof vi.fn>).mockReturnValue(
      [],
    );
    const result = runCode(`getSelectedNodeIds()`, handler);
    expect(result).toEqual([]);
  });
});

describe("generateWorkspaceBridgeTypeDefs", () => {
  it("TypeScript型定義テキストを生成する", () => {
    const typeDefs = generateWorkspaceBridgeTypeDefs();
    expect(typeDefs).toContain("declare function addNode");
    expect(typeDefs).toContain("declare function connectMP");
    expect(typeDefs).toContain("declare function applyLayout");
    expect(typeDefs).toContain("declare function clearWorkspace");
    expect(typeDefs).toContain("declare function displayScProof");
    expect(typeDefs).toContain("declare function getSelectedNodeIds");
  });
});

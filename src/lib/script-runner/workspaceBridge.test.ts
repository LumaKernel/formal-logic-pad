import { describe, it, expect, vi } from "vitest";
import {
  createWorkspaceBridges,
  WORKSPACE_BRIDGE_API_DEFS,
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
  extractScProof: vi.fn().mockReturnValue({
    _tag: "ScIdentity",
    conclusion: {
      antecedents: [{ _tag: "MetaVariable", name: "φ" }],
      succedents: [{ _tag: "MetaVariable", name: "φ" }],
    },
  }),
  extractHilbertProof: vi.fn().mockReturnValue({
    _tag: "AxiomNode",
    formula: { _tag: "MetaVariable", name: "φ" },
  }),
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
    expect(bridges.length).toBe(15);
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
    expect(names).toContain("getDeductionSystemInfo");
    expect(names).toContain("extractScProof");
    expect(names).toContain("extractHilbertProof");
    expect(names).toContain("getLogicSystem");
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

  it("ScNegationLeft/Right 表示", () => {
    const handler = createMockHandler();
    const code = `
var phi = { _tag: "MetaVariable", name: "φ" };
var idPhi = {
  _tag: "ScIdentity",
  conclusion: { antecedents: [phi], succedents: [phi] }
};
var negL = {
  _tag: "ScNegationLeft",
  conclusion: { antecedents: [phi], succedents: [phi] },
  premise: idPhi
};
var negR = {
  _tag: "ScNegationRight",
  conclusion: { antecedents: [phi], succedents: [phi] },
  premise: negL
};
displayScProof(negR);
`;
    runCode(code, handler);
    const calls = (handler.addNode as ReturnType<typeof vi.fn>).mock.calls;
    expect(calls[0][0]).toContain("[ID]");
    expect(calls[1][0]).toContain("[¬L]");
    expect(calls[2][0]).toContain("[¬R]");
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

describe("getDeductionSystemInfo ブリッジ", () => {
  it("Hilbert体系の情報を返す", () => {
    const handler = createMockHandler();
    const result = runCode(`getDeductionSystemInfo()`, handler);
    expect(result).toEqual({
      style: "hilbert",
      systemName: "Classical Propositional Logic",
      isHilbertStyle: true,
      rules: [],
    });
    expect(handler.getDeductionSystemInfo).toHaveBeenCalled();
  });

  it("ND体系の情報を返す", () => {
    const handler = createMockHandler();
    (
      handler.getDeductionSystemInfo as ReturnType<typeof vi.fn>
    ).mockReturnValue({
      style: "natural-deduction",
      systemName: "NJ",
      isHilbertStyle: false,
      rules: ["implication-intro", "implication-elim", "efq"],
    });
    const result = runCode(`getDeductionSystemInfo()`, handler);
    expect(result).toEqual({
      style: "natural-deduction",
      systemName: "NJ",
      isHilbertStyle: false,
      rules: ["implication-intro", "implication-elim", "efq"],
    });
  });

  it("SC体系の情報を返す", () => {
    const handler = createMockHandler();
    (
      handler.getDeductionSystemInfo as ReturnType<typeof vi.fn>
    ).mockReturnValue({
      style: "sequent-calculus",
      systemName: "LK",
      isHilbertStyle: false,
      rules: ["identity", "cut", "weakening-left"],
    });
    const result = runCode(`getDeductionSystemInfo()`, handler);
    expect(result).toEqual({
      style: "sequent-calculus",
      systemName: "LK",
      isHilbertStyle: false,
      rules: ["identity", "cut", "weakening-left"],
    });
  });

  it("スクリプト内でisHilbertStyleで分岐できる", () => {
    const handler = createMockHandler();
    const code = `
var info = getDeductionSystemInfo();
if (!info.isHilbertStyle) {
  throw new Error("Not a Hilbert system: " + info.style);
}
info.systemName;
`;
    const result = runCode(code, handler);
    expect(result).toBe("Classical Propositional Logic");
  });

  it("非Hilbert体系でスクリプトがガードできる", () => {
    const handler = createMockHandler();
    (
      handler.getDeductionSystemInfo as ReturnType<typeof vi.fn>
    ).mockReturnValue({
      style: "natural-deduction",
      systemName: "NJ",
      isHilbertStyle: false,
      rules: [],
    });
    const code = `
var info = getDeductionSystemInfo();
if (!info.isHilbertStyle) {
  throw new Error("Not a Hilbert system: " + info.style);
}
`;
    const msg = runCodeError(code, handler);
    expect(msg).toContain("Not a Hilbert system");
    expect(msg).toContain("natural-deduction");
  });
});

describe("getLogicSystem ブリッジ", () => {
  it("Hilbert体系のLogicSystem JSONを返す", () => {
    const handler = createMockHandler();
    const result = runCode(`getLogicSystem()`, handler);
    expect(result).toEqual({
      name: "Łukasiewicz",
      propositionalAxioms: ["A1", "A2", "A3", "CONJ-DEF", "DISJ-DEF"],
      predicateLogic: false,
      equalityLogic: false,
      generalization: false,
    });
    expect(handler.getLogicSystem).toHaveBeenCalled();
  });

  it("述語論理体系の情報を返す", () => {
    const handler = createMockHandler();
    (handler.getLogicSystem as ReturnType<typeof vi.fn>).mockReturnValue({
      name: "Predicate Logic",
      propositionalAxioms: ["A1", "A2", "A3", "A4", "A5"],
      predicateLogic: true,
      equalityLogic: false,
      generalization: true,
    });
    const result = runCode(`getLogicSystem()`, handler);
    expect(result).toEqual({
      name: "Predicate Logic",
      propositionalAxioms: ["A1", "A2", "A3", "A4", "A5"],
      predicateLogic: true,
      equalityLogic: false,
      generalization: true,
    });
  });

  it("スクリプト内でプロパティにアクセスできる", () => {
    const handler = createMockHandler();
    const code = `
var sys = getLogicSystem();
sys.name + "," + sys.generalization;
`;
    const result = runCode(code, handler);
    expect(result).toBe("Łukasiewicz,false");
  });

  it("ハンドラーのエラーが伝播する", () => {
    const handler = createMockHandler();
    (handler.getLogicSystem as ReturnType<typeof vi.fn>).mockImplementation(
      () => {
        throw new Error("Hilbert体系でのみ使用可能です");
      },
    );
    const msg = runCodeError(`getLogicSystem()`, handler);
    expect(msg).toContain("Hilbert体系でのみ使用可能です");
  });
});

describe("extractScProof ブリッジ", () => {
  it("引数なしでSC証明木を返す", () => {
    const handler = createMockHandler();
    const result = runCode(`extractScProof()`, handler);
    expect(handler.extractScProof).toHaveBeenCalledWith(undefined);
    expect(result).toEqual({
      _tag: "ScIdentity",
      conclusion: {
        antecedents: [{ _tag: "MetaVariable", name: "φ" }],
        succedents: [{ _tag: "MetaVariable", name: "φ" }],
      },
    });
  });

  it("rootNodeIdを指定してSC証明木を返す", () => {
    const handler = createMockHandler();
    runCode(`extractScProof("root-1")`, handler);
    expect(handler.extractScProof).toHaveBeenCalledWith("root-1");
  });

  it("rootNodeIdが文字列でない場合エラー", () => {
    const handler = createMockHandler();
    const msg = runCodeError(`extractScProof(123)`, handler);
    expect(msg).toContain("extractScProof");
    expect(msg).toContain("string");
  });

  it("ハンドラーがエラーをthrowした場合はランタイムエラー", () => {
    const handler = createMockHandler();
    (handler.extractScProof as ReturnType<typeof vi.fn>).mockImplementation(
      () => {
        throw new Error("SC体系でのみ使用可能です");
      },
    );
    const msg = runCodeError(`extractScProof()`, handler);
    expect(msg).toContain("SC体系でのみ使用可能です");
  });
});

describe("extractHilbertProof ブリッジ", () => {
  it("引数なしでHilbert証明木を返す", () => {
    const handler = createMockHandler();
    const result = runCode(`extractHilbertProof()`, handler);
    expect(handler.extractHilbertProof).toHaveBeenCalledWith(undefined);
    expect(result).toEqual({
      _tag: "AxiomNode",
      formula: { _tag: "MetaVariable", name: "φ" },
    });
  });

  it("rootNodeIdを指定できる", () => {
    const handler = createMockHandler();
    runCode(`extractHilbertProof("root-1")`, handler);
    expect(handler.extractHilbertProof).toHaveBeenCalledWith("root-1");
  });

  it("不正な引数型でエラー", () => {
    const handler = createMockHandler();
    const msg = runCodeError(`extractHilbertProof(123)`, handler);
    expect(msg).toContain("extractHilbertProof");
    expect(msg).toContain("string");
  });

  it("ハンドラーのエラーが伝播する", () => {
    const handler = createMockHandler();
    (
      handler.extractHilbertProof as ReturnType<typeof vi.fn>
    ).mockImplementation(() => {
      throw new Error("Hilbert系でのみ使用可能です");
    });
    const msg = runCodeError(`extractHilbertProof()`, handler);
    expect(msg).toContain("Hilbert系でのみ使用可能です");
  });
});


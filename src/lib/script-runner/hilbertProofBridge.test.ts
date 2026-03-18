import { describe, it, expect, vi } from "vitest";
import {
  encodeProofNode,
  decodeProofNode,
  createHilbertProofBridges,
  HILBERT_PROOF_BRIDGE_API_DEFS,
  generateHilbertProofBridgeTypeDefs,
} from "./hilbertProofBridge";
import type { ProofNode } from "../logic-core/proofTree";
import {
  axiomNode,
  modusPonensNode,
  generalizationNode,
} from "../logic-core/proofTree";
import { metaVariable, implication, universal } from "../logic-core/formula";
import { termVariable } from "../logic-core/term";
import type { WorkspaceCommandHandler } from "./workspaceBridge";

// ── テストデータ ─────────────────────────────────────────────

const phi = metaVariable("φ");
const psi = metaVariable("ψ");
const xVar = termVariable("x");

const axiom: ProofNode = axiomNode(phi);
const mpNode: ProofNode = modusPonensNode(
  psi,
  axiomNode(phi),
  axiomNode(implication(phi, psi)),
);
const genNode: ProofNode = generalizationNode(
  universal(xVar, phi),
  xVar,
  axiomNode(phi),
);

// ── encode/decode ────────────────────────────────────────────

describe("encodeProofNode / decodeProofNode", () => {
  it("AxiomNode の round-trip", () => {
    const encoded = encodeProofNode(axiom);
    const decoded = decodeProofNode(encoded);
    expect(decoded._tag).toBe("AxiomNode");
    expect(decoded.formula._tag).toBe("MetaVariable");
  });

  it("ModusPonensNode の round-trip", () => {
    const encoded = encodeProofNode(mpNode);
    const decoded = decodeProofNode(encoded);
    expect(decoded._tag).toBe("ModusPonensNode");
    if (decoded._tag !== "ModusPonensNode") return;
    expect(decoded.antecedent._tag).toBe("AxiomNode");
    expect(decoded.conditional._tag).toBe("AxiomNode");
  });

  it("GeneralizationNode の round-trip", () => {
    const encoded = encodeProofNode(genNode);
    const decoded = decodeProofNode(encoded);
    expect(decoded._tag).toBe("GeneralizationNode");
    if (decoded._tag !== "GeneralizationNode") return;
    expect(decoded.variable.name).toBe("x");
    expect(decoded.premise._tag).toBe("AxiomNode");
  });

  it("decodeProofNode: null入力でエラー", () => {
    expect(() => decodeProofNode(null)).toThrow("input must be an object");
  });

  it("decodeProofNode: _tagなしでエラー", () => {
    expect(() => decodeProofNode({})).toThrow("_tag must be a string");
  });

  it("decodeProofNode: 不明な_tagでエラー", () => {
    expect(() => decodeProofNode({ _tag: "Unknown" })).toThrow("unknown _tag");
  });

  it("decodeProofNode: AxiomNode formulaデコード失敗", () => {
    expect(() =>
      decodeProofNode({ _tag: "AxiomNode", formula: "invalid" }),
    ).toThrow("failed to decode AxiomNode formula");
  });

  it("decodeProofNode: ModusPonensNode formulaデコード失敗", () => {
    expect(() =>
      decodeProofNode({ _tag: "ModusPonensNode", formula: "invalid" }),
    ).toThrow("failed to decode ModusPonensNode formula");
  });

  it("decodeProofNode: GeneralizationNode formulaデコード失敗", () => {
    expect(() =>
      decodeProofNode({ _tag: "GeneralizationNode", formula: "invalid" }),
    ).toThrow("failed to decode GeneralizationNode formula");
  });

  it("decodeProofNode: GeneralizationNode variable.nameなしでエラー", () => {
    const encoded = encodeProofNode(genNode) as Record<string, unknown>;
    expect(() => decodeProofNode({ ...encoded, variable: {} })).toThrow(
      "variable.name must be a string",
    );
  });

  it("decodeProofNode: GeneralizationNode variableなしでエラー", () => {
    const encoded = encodeProofNode(genNode) as Record<string, unknown>;
    expect(() => decodeProofNode({ ...encoded, variable: undefined })).toThrow(
      "variable.name must be a string",
    );
  });

  it("decodeProofNode: 非オブジェクト入力でエラー", () => {
    expect(() => decodeProofNode(42)).toThrow("input must be an object");
    expect(() => decodeProofNode("string")).toThrow("input must be an object");
  });
});

// ── ブリッジ関数テスト ──────────────────────────────────────

describe("createHilbertProofBridges", () => {
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
      systemName: "Test",
      isHilbertStyle: true,
      rules: [],
    }),
    getLogicSystem: vi.fn().mockReturnValue({
      name: "Test",
      propositionalAxioms: [],
      predicateLogic: false,
      equalityLogic: false,
      generalization: false,
    }),
    extractScProof: vi.fn(),
    extractHilbertProof: vi.fn(),
  });

  it("3つのブリッジを返す", () => {
    const handler = createMockHandler();
    const bridges = createHilbertProofBridges(handler);
    expect(bridges).toHaveLength(3);
    expect(bridges.map((b) => b.name)).toEqual([
      "applyDeductionTheorem",
      "applyReverseDeductionTheorem",
      "displayHilbertProof",
    ]);
  });

  describe("applyDeductionTheorem bridge", () => {
    it("正常に演繹定理を適用する", () => {
      const handler = createMockHandler();
      const bridges = createHilbertProofBridges(handler);
      const applyDT = bridges.find((b) => b.name === "applyDeductionTheorem")!;
      const proofJson = encodeProofNode(axiomNode(phi));
      const result = applyDT.fn(proofJson, "φ");
      expect(result).toBeTruthy();
      // result should be an encoded ProofNode for φ→φ
      const decoded = decodeProofNode(result);
      expect(decoded.formula._tag).toBe("Implication");
    });

    it("hypothesisTextが文字列でない場合エラー", () => {
      const handler = createMockHandler();
      const bridges = createHilbertProofBridges(handler);
      const applyDT = bridges.find((b) => b.name === "applyDeductionTheorem")!;
      const proofJson = encodeProofNode(axiomNode(phi));
      expect(() => applyDT.fn(proofJson, 123)).toThrow(
        "hypothesisText must be string",
      );
    });

    it("仮定のパースに失敗した場合エラー", () => {
      const handler = createMockHandler();
      const bridges = createHilbertProofBridges(handler);
      const applyDT = bridges.find((b) => b.name === "applyDeductionTheorem")!;
      const proofJson = encodeProofNode(axiomNode(phi));
      expect(() => applyDT.fn(proofJson, "!!!invalid!!!")).toThrow(
        "仮定の論理式をパースできません",
      );
    });

    it("演繹定理の適用に失敗した場合エラー", () => {
      const handler = createMockHandler();
      const bridges = createHilbertProofBridges(handler);
      const applyDT = bridges.find((b) => b.name === "applyDeductionTheorem")!;
      // P(x) を仮定として ∀x.P(x) のGen証明に演繹定理を適用 → 自由変数エラー
      const px = {
        _tag: "Predicate",
        name: "P",
        args: [{ _tag: "TermVariable", name: "x" }],
      };
      const forallXPx = {
        _tag: "Universal",
        variable: { _tag: "TermVariable", name: "x" },
        formula: px,
      };
      const genProofJson = {
        _tag: "GeneralizationNode",
        formula: forallXPx,
        variable: { _tag: "TermVariable", name: "x" },
        premise: { _tag: "AxiomNode", formula: px },
      };
      expect(() => applyDT.fn(genProofJson, "P(x)")).toThrow(
        "変換に失敗しました",
      );
    });

    it("proofJsonが不正な場合エラー", () => {
      const handler = createMockHandler();
      const bridges = createHilbertProofBridges(handler);
      const applyDT = bridges.find((b) => b.name === "applyDeductionTheorem")!;
      expect(() => applyDT.fn("invalid", "φ")).toThrow(
        "input must be an object",
      );
    });
  });

  describe("displayHilbertProof bridge", () => {
    it("AxiomNodeをワークスペースに配置する", () => {
      const handler = createMockHandler();
      const bridges = createHilbertProofBridges(handler);
      const displayFn = bridges.find((b) => b.name === "displayHilbertProof")!;
      const proofJson = encodeProofNode(axiomNode(phi));
      displayFn.fn(proofJson);
      expect(handler.addNode).toHaveBeenCalledTimes(1);
      expect(handler.setNodeRoleAxiom).toHaveBeenCalledTimes(1);
      expect(handler.applyLayout).toHaveBeenCalledTimes(1);
    });

    it("ModusPonensNodeをワークスペースに配置する", () => {
      const handler = createMockHandler();
      const bridges = createHilbertProofBridges(handler);
      const displayFn = bridges.find((b) => b.name === "displayHilbertProof")!;
      const proofJson = encodeProofNode(mpNode);
      displayFn.fn(proofJson);
      // 2 axiom nodes + 1 MP connection
      expect(handler.addNode).toHaveBeenCalledTimes(2);
      expect(handler.setNodeRoleAxiom).toHaveBeenCalledTimes(2);
      expect(handler.connectMP).toHaveBeenCalledTimes(1);
      expect(handler.applyLayout).toHaveBeenCalledTimes(1);
    });

    it("GeneralizationNodeをワークスペースに配置する", () => {
      const handler = createMockHandler();
      const bridges = createHilbertProofBridges(handler);
      const displayFn = bridges.find((b) => b.name === "displayHilbertProof")!;
      const proofJson = encodeProofNode(genNode);
      displayFn.fn(proofJson);
      // premise axiom + gen conclusion node
      expect(handler.addNode).toHaveBeenCalledTimes(2);
      expect(handler.setNodeRoleAxiom).toHaveBeenCalledTimes(1);
      expect(handler.applyLayout).toHaveBeenCalledTimes(1);
    });

    it("不正な入力でエラー", () => {
      const handler = createMockHandler();
      const bridges = createHilbertProofBridges(handler);
      const displayFn = bridges.find((b) => b.name === "displayHilbertProof")!;
      expect(() => displayFn.fn("invalid")).toThrow("input must be an object");
    });
  });

  describe("applyReverseDeductionTheorem bridge", () => {
    it("正常に逆演繹定理を適用する", () => {
      const handler = createMockHandler();
      const bridges = createHilbertProofBridges(handler);
      const reverseDT = bridges.find(
        (b) => b.name === "applyReverseDeductionTheorem",
      )!;
      // φ→ψ の公理ノードを入力
      const proofJson = encodeProofNode(axiomNode(implication(phi, psi)));
      const result = reverseDT.fn(proofJson);
      expect(result).toBeTruthy();
      // result should be an encoded ProofNode for ψ
      const decoded = decodeProofNode(result);
      expect(decoded._tag).toBe("ModusPonensNode");
      expect(decoded.formula._tag).toBe("MetaVariable");
    });

    it("結論が含意でない場合エラー", () => {
      const handler = createMockHandler();
      const bridges = createHilbertProofBridges(handler);
      const reverseDT = bridges.find(
        (b) => b.name === "applyReverseDeductionTheorem",
      )!;
      const proofJson = encodeProofNode(axiomNode(phi));
      expect(() => reverseDT.fn(proofJson)).toThrow("変換に失敗しました");
    });

    it("不正な入力でエラー", () => {
      const handler = createMockHandler();
      const bridges = createHilbertProofBridges(handler);
      const reverseDT = bridges.find(
        (b) => b.name === "applyReverseDeductionTheorem",
      )!;
      expect(() => reverseDT.fn("invalid")).toThrow("input must be an object");
    });
  });
});

// ── API 定義テスト ──────────────────────────────────────────

describe("HILBERT_PROOF_BRIDGE_API_DEFS", () => {
  it("3つのAPI定義を含む", () => {
    expect(HILBERT_PROOF_BRIDGE_API_DEFS).toHaveLength(3);
  });

  it("各定義がname, signature, descriptionを持つ", () => {
    for (const def of HILBERT_PROOF_BRIDGE_API_DEFS) {
      expect(def.name).toBeTruthy();
      expect(def.signature).toBeTruthy();
      expect(def.description).toBeTruthy();
    }
  });
});

describe("generateHilbertProofBridgeTypeDefs", () => {
  it("型定義テキストを生成する", () => {
    const defs = generateHilbertProofBridgeTypeDefs();
    expect(defs).toContain("declare function applyDeductionTheorem");
    expect(defs).toContain("declare function applyReverseDeductionTheorem");
    expect(defs).toContain("declare function displayHilbertProof");
  });
});

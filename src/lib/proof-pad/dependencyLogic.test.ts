import { describe, it, expect } from "vitest";
import {
  getNodeDependencies,
  getAllNodeDependencies,
  getSubtreeNodeIds,
  getProofNodeIds,
  getNodeAxiomIds,
  getNodeInferenceRuleIds,
  getNodeScRuleIds,
  validateRootNodes,
  hasUnknownRoots,
  deduplicateDependencyInfos,
} from "./dependencyLogic";
import type { WorkspaceNode } from "./workspaceState";
import type { InferenceEdge } from "./inferenceEdge";
import type { LogicSystem } from "../logic-core/inferenceRule";
import {
  peanoArithmeticSystem,
  axiomA1Template,
} from "../logic-core/inferenceRule";
import type { TheoryAxiom } from "../logic-core/inferenceRule";

// --- ヘルパー ---

function makeNode(id: string, kind: "axiom" = "axiom"): WorkspaceNode {
  return {
    id,
    kind,
    label: id,
    formulaText: "",
    position: { x: 0, y: 0 },
  };
}

/**
 * MP推論エッジを作成するヘルパー。
 * leftPremiseNodeId と rightPremiseNodeId から conclusionNodeId への関係を表す。
 */
function makeMPEdge(
  conclusionNodeId: string,
  leftPremiseNodeId: string,
  rightPremiseNodeId: string,
): InferenceEdge {
  return {
    _tag: "mp",
    conclusionNodeId,
    leftPremiseNodeId,
    rightPremiseNodeId,
    conclusionText: "",
  };
}

/**
 * Gen推論エッジを作成するヘルパー。
 * premiseNodeId から conclusionNodeId への関係を表す。
 */
function makeGenEdge(
  conclusionNodeId: string,
  premiseNodeId: string,
): InferenceEdge {
  return {
    _tag: "gen",
    conclusionNodeId,
    premiseNodeId,
    variableName: "x",
    conclusionText: "",
  };
}

/**
 * 単一前提の推論エッジを作成するヘルパー（substitution）。
 */
function makeSubstEdge(
  conclusionNodeId: string,
  premiseNodeId: string,
): InferenceEdge {
  return {
    _tag: "substitution",
    conclusionNodeId,
    premiseNodeId,
    entries: [],
    conclusionText: "",
  };
}

describe("dependencyLogic", () => {
  describe("getNodeDependencies", () => {
    it("ルートノードは自分自身のみに依存する", () => {
      const nodes = [makeNode("node-1")];
      const edges: readonly InferenceEdge[] = [];

      const deps = getNodeDependencies("node-1", nodes, edges);
      expect(deps).toEqual(new Set(["node-1"]));
    });

    it("存在しないノードは空集合を返す", () => {
      const nodes = [makeNode("node-1")];
      const edges: readonly InferenceEdge[] = [];

      const deps = getNodeDependencies("node-999", nodes, edges);
      expect(deps).toEqual(new Set());
    });

    it("1つの前提を持つ導出ノードはその前提の公理に依存する", () => {
      // axiom-1 → mp-1 (substitution edge with single premise)
      const nodes = [makeNode("axiom-1"), makeNode("mp-1", "axiom")];
      const edges = [makeSubstEdge("mp-1", "axiom-1")];

      const deps = getNodeDependencies("mp-1", nodes, edges);
      expect(deps).toEqual(new Set(["axiom-1"]));
    });

    it("2つの前提を持つMPノードは両方の公理に依存する", () => {
      // axiom-1 → mp-1 ← axiom-2
      const nodes = [
        makeNode("axiom-1"),
        makeNode("axiom-2"),
        makeNode("mp-1", "axiom"),
      ];
      const edges = [makeMPEdge("mp-1", "axiom-1", "axiom-2")];

      const deps = getNodeDependencies("mp-1", nodes, edges);
      expect(deps).toEqual(new Set(["axiom-1", "axiom-2"]));
    });

    it("チェーン状の導出は最初の公理まで遡る", () => {
      // axiom-1, axiom-2 → mp-1
      // mp-1, axiom-2 → mp-2
      const nodes = [
        makeNode("axiom-1"),
        makeNode("axiom-2"),
        makeNode("mp-1", "axiom"),
        makeNode("mp-2", "axiom"),
      ];
      const edges = [
        makeMPEdge("mp-1", "axiom-1", "axiom-2"),
        makeMPEdge("mp-2", "mp-1", "axiom-2"),
      ];

      const deps = getNodeDependencies("mp-2", nodes, edges);
      expect(deps).toEqual(new Set(["axiom-1", "axiom-2"]));
    });

    it("ダイヤモンド形状の依存関係を正しく処理する", () => {
      // axiom-1, axiom-2 → mp-1
      // axiom-1, axiom-3 → mp-2
      // mp-1, mp-2 → mp-3
      const nodes = [
        makeNode("axiom-1"),
        makeNode("axiom-2"),
        makeNode("axiom-3"),
        makeNode("mp-1", "axiom"),
        makeNode("mp-2", "axiom"),
        makeNode("mp-3", "axiom"),
      ];
      const edges = [
        makeMPEdge("mp-1", "axiom-1", "axiom-2"),
        makeMPEdge("mp-2", "axiom-1", "axiom-3"),
        makeMPEdge("mp-3", "mp-1", "mp-2"),
      ];

      const deps = getNodeDependencies("mp-3", nodes, edges);
      expect(deps).toEqual(new Set(["axiom-1", "axiom-2", "axiom-3"]));
    });

    it("Genノードも正しく公理まで遡る", () => {
      // axiom-1 → gen-1
      const nodes = [makeNode("axiom-1"), makeNode("gen-1", "axiom")];
      const edges = [makeGenEdge("gen-1", "axiom-1")];

      const deps = getNodeDependencies("gen-1", nodes, edges);
      expect(deps).toEqual(new Set(["axiom-1"]));
    });

    it("複数のルートノードに依存する深いグラフを正しく処理する", () => {
      // axiom-1, axiom-2 → mp-1 → gen-1
      // axiom-3, axiom-4 → mp-2
      // gen-1, mp-2 → mp-3
      const nodes = [
        makeNode("axiom-1"),
        makeNode("axiom-2"),
        makeNode("axiom-3"),
        makeNode("axiom-4"),
        makeNode("mp-1", "axiom"),
        makeNode("mp-2", "axiom"),
        makeNode("gen-1", "axiom"),
        makeNode("mp-3", "axiom"),
      ];
      const edges = [
        makeMPEdge("mp-1", "axiom-1", "axiom-2"),
        makeGenEdge("gen-1", "mp-1"),
        makeMPEdge("mp-2", "axiom-3", "axiom-4"),
        makeMPEdge("mp-3", "gen-1", "mp-2"),
      ];

      const deps = getNodeDependencies("mp-3", nodes, edges);
      expect(deps).toEqual(
        new Set(["axiom-1", "axiom-2", "axiom-3", "axiom-4"]),
      );
    });

    it("InferenceEdgeがないノードはルートノードとして自身を返す", () => {
      const nodes = [makeNode("isolated")];
      const edges: readonly InferenceEdge[] = [];
      const deps = getNodeDependencies("isolated", nodes, edges);
      expect(deps).toEqual(new Set(["isolated"]));
    });

    it("前提が未設定のInferenceEdgeがあるノードはルートとして扱われる", () => {
      // MPEdgeでleft/rightがundefined → ルート扱い
      const nodes = [makeNode("mp-1", "axiom")];
      const edges: readonly InferenceEdge[] = [
        {
          _tag: "mp",
          conclusionNodeId: "mp-1",
          leftPremiseNodeId: undefined,
          rightPremiseNodeId: undefined,
          conclusionText: "",
        },
      ];
      const deps = getNodeDependencies("mp-1", nodes, edges);
      expect(deps).toEqual(new Set(["mp-1"]));
    });
  });

  describe("getAllNodeDependencies", () => {
    it("空のワークスペースでは空のMapを返す", () => {
      const deps = getAllNodeDependencies([], []);
      expect(deps.size).toBe(0);
    });

    it("ルートノードのみの場合、各ノードが自分自身に依存する", () => {
      const nodes = [makeNode("a"), makeNode("b")];
      const deps = getAllNodeDependencies(nodes, []);
      expect(deps.get("a")).toEqual(new Set(["a"]));
      expect(deps.get("b")).toEqual(new Set(["b"]));
    });

    it("全ノードの依存関係を一括計算する", () => {
      // axiom-1, axiom-2 → mp-1
      const nodes = [
        makeNode("axiom-1"),
        makeNode("axiom-2"),
        makeNode("mp-1", "axiom"),
      ];
      const edges = [makeMPEdge("mp-1", "axiom-1", "axiom-2")];

      const deps = getAllNodeDependencies(nodes, edges);
      expect(deps.size).toBe(3);
      expect(deps.get("axiom-1")).toEqual(new Set(["axiom-1"]));
      expect(deps.get("axiom-2")).toEqual(new Set(["axiom-2"]));
      expect(deps.get("mp-1")).toEqual(new Set(["axiom-1", "axiom-2"]));
    });
  });

  describe("getSubtreeNodeIds", () => {
    it("InferenceEdgeがないノードは自身のみを返す", () => {
      const edges: readonly InferenceEdge[] = [];
      const result = getSubtreeNodeIds("node-1", edges);
      expect(result).toEqual(new Set(["node-1"]));
    });

    it("1つの子を持つノードは自身と子を返す", () => {
      // axiom-1 → mp-1
      const edges = [makeSubstEdge("mp-1", "axiom-1")];
      const result = getSubtreeNodeIds("axiom-1", edges);
      expect(result).toEqual(new Set(["axiom-1", "mp-1"]));
    });

    it("子ノードから開始した場合は自身のみ（親方向には辿らない）", () => {
      // axiom-1 → mp-1
      const edges = [makeSubstEdge("mp-1", "axiom-1")];
      const result = getSubtreeNodeIds("mp-1", edges);
      expect(result).toEqual(new Set(["mp-1"]));
    });

    it("チェーン状のサブツリーを正しく返す", () => {
      // axiom-1 → mp-1 → mp-2 → mp-3
      const edges = [
        makeSubstEdge("mp-1", "axiom-1"),
        makeSubstEdge("mp-2", "mp-1"),
        makeSubstEdge("mp-3", "mp-2"),
      ];
      const result = getSubtreeNodeIds("axiom-1", edges);
      expect(result).toEqual(new Set(["axiom-1", "mp-1", "mp-2", "mp-3"]));
    });

    it("分岐するサブツリーを正しく返す", () => {
      // axiom-1 → mp-1 (subst edge using axiom-1)
      // axiom-1 → mp-2 (subst edge using axiom-1)
      const edges = [
        makeSubstEdge("mp-1", "axiom-1"),
        makeSubstEdge("mp-2", "axiom-1"),
      ];
      const result = getSubtreeNodeIds("axiom-1", edges);
      expect(result).toEqual(new Set(["axiom-1", "mp-1", "mp-2"]));
    });

    it("途中のノードから開始すると部分サブツリーのみ返す", () => {
      // axiom-1 → mp-1 → mp-2
      //                 → mp-3
      const edges = [
        makeSubstEdge("mp-1", "axiom-1"),
        makeSubstEdge("mp-2", "mp-1"),
        makeSubstEdge("mp-3", "mp-1"),
      ];
      const result = getSubtreeNodeIds("mp-1", edges);
      expect(result).toEqual(new Set(["mp-1", "mp-2", "mp-3"]));
    });

    it("ダイヤモンド形状のDAGを正しく処理する", () => {
      // axiom-1 → mp-1 → mp-3 (mp-3 uses both mp-1 and mp-2)
      // axiom-1 → mp-2 → mp-3
      const edges = [
        makeSubstEdge("mp-1", "axiom-1"),
        makeSubstEdge("mp-2", "axiom-1"),
        makeMPEdge("mp-3", "mp-1", "mp-2"),
      ];
      const result = getSubtreeNodeIds("axiom-1", edges);
      expect(result).toEqual(new Set(["axiom-1", "mp-1", "mp-2", "mp-3"]));
    });

    it("複雑なグラフで共有ノードを重複なく返す", () => {
      // axiom-1 → mp-1 → mp-3 (MP: mp-1, mp-2)
      //         → mp-2 → mp-3
      //                 → mp-4
      const edges = [
        makeSubstEdge("mp-1", "axiom-1"),
        makeSubstEdge("mp-2", "axiom-1"),
        makeMPEdge("mp-3", "mp-1", "mp-2"),
        makeSubstEdge("mp-4", "mp-2"),
      ];
      const result = getSubtreeNodeIds("axiom-1", edges);
      expect(result).toEqual(
        new Set(["axiom-1", "mp-1", "mp-2", "mp-3", "mp-4"]),
      );
    });

    it("存在しないノードIDでも自身のみを含む集合を返す", () => {
      const edges = [makeSubstEdge("mp-1", "axiom-1")];
      const result = getSubtreeNodeIds("nonexistent", edges);
      expect(result).toEqual(new Set(["nonexistent"]));
    });

    it("他のノードの子孫は含まない", () => {
      // axiom-1 → mp-1
      // axiom-2 → mp-2
      const edges = [
        makeSubstEdge("mp-1", "axiom-1"),
        makeSubstEdge("mp-2", "axiom-2"),
      ];
      const result = getSubtreeNodeIds("axiom-1", edges);
      expect(result).toEqual(new Set(["axiom-1", "mp-1"]));
    });
  });

  describe("getProofNodeIds", () => {
    it("InferenceEdgeがないノードは自身のみを返す", () => {
      const edges: readonly InferenceEdge[] = [];
      const result = getProofNodeIds("node-1", edges);
      expect(result).toEqual(new Set(["node-1"]));
    });

    it("1つの前提を持つ導出ノードは前提と自身を返す", () => {
      // axiom-1 → mp-1
      const edges = [makeSubstEdge("mp-1", "axiom-1")];
      const result = getProofNodeIds("mp-1", edges);
      expect(result).toEqual(new Set(["mp-1", "axiom-1"]));
    });

    it("ルートノードから開始した場合は自身のみ（子方向には辿らない）", () => {
      // axiom-1 → mp-1
      const edges = [makeSubstEdge("mp-1", "axiom-1")];
      const result = getProofNodeIds("axiom-1", edges);
      expect(result).toEqual(new Set(["axiom-1"]));
    });

    it("チェーン状の証明で中間ノードも含めた全ノードを返す", () => {
      // axiom-1 → mp-1 → mp-2 → mp-3
      const edges = [
        makeSubstEdge("mp-1", "axiom-1"),
        makeSubstEdge("mp-2", "mp-1"),
        makeSubstEdge("mp-3", "mp-2"),
      ];
      const result = getProofNodeIds("mp-3", edges);
      expect(result).toEqual(new Set(["mp-3", "mp-2", "mp-1", "axiom-1"]));
    });

    it("2つの前提を持つMPノードは両方の前提を含む", () => {
      // axiom-1, axiom-2 → mp-1
      const edges = [makeMPEdge("mp-1", "axiom-1", "axiom-2")];
      const result = getProofNodeIds("mp-1", edges);
      expect(result).toEqual(new Set(["mp-1", "axiom-1", "axiom-2"]));
    });

    it("ダイヤモンド形状のDAGで中間ノードも含む", () => {
      // axiom-1, axiom-2 → mp-1
      // axiom-1, axiom-3 → mp-2
      // mp-1, mp-2 → mp-3
      const edges = [
        makeMPEdge("mp-1", "axiom-1", "axiom-2"),
        makeMPEdge("mp-2", "axiom-1", "axiom-3"),
        makeMPEdge("mp-3", "mp-1", "mp-2"),
      ];
      const result = getProofNodeIds("mp-3", edges);
      expect(result).toEqual(
        new Set(["mp-3", "mp-1", "mp-2", "axiom-1", "axiom-2", "axiom-3"]),
      );
    });

    it("Genノードも正しく前提を辿る", () => {
      // axiom-1 → gen-1
      const edges = [makeGenEdge("gen-1", "axiom-1")];
      const result = getProofNodeIds("gen-1", edges);
      expect(result).toEqual(new Set(["gen-1", "axiom-1"]));
    });

    it("深いグラフで全ノードを含む", () => {
      // axiom-1, axiom-2 → mp-1 → gen-1
      // axiom-3, axiom-4 → mp-2
      // gen-1, mp-2 → mp-3
      const edges = [
        makeMPEdge("mp-1", "axiom-1", "axiom-2"),
        makeGenEdge("gen-1", "mp-1"),
        makeMPEdge("mp-2", "axiom-3", "axiom-4"),
        makeMPEdge("mp-3", "gen-1", "mp-2"),
      ];
      const result = getProofNodeIds("mp-3", edges);
      expect(result).toEqual(
        new Set([
          "mp-3",
          "gen-1",
          "mp-2",
          "mp-1",
          "axiom-1",
          "axiom-2",
          "axiom-3",
          "axiom-4",
        ]),
      );
    });

    it("存在しないノードIDでも自身のみを含む集合を返す", () => {
      const edges = [makeSubstEdge("mp-1", "axiom-1")];
      const result = getProofNodeIds("nonexistent", edges);
      expect(result).toEqual(new Set(["nonexistent"]));
    });

    it("他のノードの前提は含まない", () => {
      // axiom-1 → mp-1
      // axiom-2 → mp-2
      const edges = [
        makeSubstEdge("mp-1", "axiom-1"),
        makeSubstEdge("mp-2", "axiom-2"),
      ];
      const result = getProofNodeIds("mp-1", edges);
      expect(result).toEqual(new Set(["mp-1", "axiom-1"]));
    });

    it("前提が未設定のInferenceEdgeがあるノードは自身のみ返す", () => {
      const edges: readonly InferenceEdge[] = [
        {
          _tag: "mp",
          conclusionNodeId: "mp-1",
          leftPremiseNodeId: undefined,
          rightPremiseNodeId: undefined,
          conclusionText: "",
        },
      ];
      const result = getProofNodeIds("mp-1", edges);
      expect(result).toEqual(new Set(["mp-1"]));
    });

    it("途中のノードから開始すると部分証明のみ返す", () => {
      // axiom-1, axiom-2 → mp-1
      // mp-1, axiom-3 → mp-2
      const edges = [
        makeMPEdge("mp-1", "axiom-1", "axiom-2"),
        makeMPEdge("mp-2", "mp-1", "axiom-3"),
      ];
      // mp-1 から開始: mp-1の前提だけ
      const result = getProofNodeIds("mp-1", edges);
      expect(result).toEqual(new Set(["mp-1", "axiom-1", "axiom-2"]));
    });
  });

  describe("getNodeAxiomIds", () => {
    const lukasiewiczSystem: LogicSystem = {
      name: "Łukasiewicz",
      propositionalAxioms: new Set(["A1", "A2", "A3"]),
      predicateLogic: false,
      equalityLogic: false,
      generalization: false,
    };

    function makeAxiomNode(id: string, formulaText: string): WorkspaceNode {
      return {
        id,
        kind: "axiom",
        label: id,
        formulaText,
        position: { x: 0, y: 0 },
      };
    }

    it("A1公理インスタンスを含むルートノードを識別する", () => {
      // phi -> (psi -> phi) は A1のインスタンス
      const nodes = [makeAxiomNode("a1", "phi -> (psi -> phi)")];
      const edges: readonly InferenceEdge[] = [];

      const axiomIds = getNodeAxiomIds("a1", nodes, edges, lukasiewiczSystem);
      expect(axiomIds).toEqual(new Set(["A1"]));
    });

    it("A2公理インスタンスを含むルートノードを識別する", () => {
      // (phi -> (psi -> chi)) -> ((phi -> psi) -> (phi -> chi)) は A2のインスタンス
      const nodes = [
        makeAxiomNode(
          "a2",
          "(phi -> (psi -> chi)) -> ((phi -> psi) -> (phi -> chi))",
        ),
      ];
      const edges: readonly InferenceEdge[] = [];

      const axiomIds = getNodeAxiomIds("a2", nodes, edges, lukasiewiczSystem);
      expect(axiomIds).toEqual(new Set(["A2"]));
    });

    it("A3公理インスタンスを含むルートノードを識別する", () => {
      // (~phi -> ~psi) -> (psi -> phi) は A3のインスタンス
      const nodes = [makeAxiomNode("a3", "(~phi -> ~psi) -> (psi -> phi)")];
      const edges: readonly InferenceEdge[] = [];

      const axiomIds = getNodeAxiomIds("a3", nodes, edges, lukasiewiczSystem);
      expect(axiomIds).toEqual(new Set(["A3"]));
    });

    it("MP導出ノードは依存する公理すべてのIDを返す", () => {
      // a1: A1インスタンス  →  mp1 (derived)
      // a2: A2インスタンス  →
      const nodes = [
        makeAxiomNode("a1", "phi -> (psi -> phi)"),
        makeAxiomNode(
          "a2",
          "(phi -> (psi -> chi)) -> ((phi -> psi) -> (phi -> chi))",
        ),
        { ...makeNode("mp1", "axiom"), formulaText: "some derived formula" },
      ];
      const edges = [makeMPEdge("mp1", "a1", "a2")];

      const axiomIds = getNodeAxiomIds("mp1", nodes, edges, lukasiewiczSystem);
      expect(axiomIds).toEqual(new Set(["A1", "A2"]));
    });

    it("識別できない論理式のルートノードは結果に含まない", () => {
      const nodes = [
        makeAxiomNode("unknown", "phi"),
        makeAxiomNode("a1", "phi -> (psi -> phi)"),
        { ...makeNode("mp1", "axiom"), formulaText: "" },
      ];
      const edges = [makeMPEdge("mp1", "unknown", "a1")];

      const axiomIds = getNodeAxiomIds("mp1", nodes, edges, lukasiewiczSystem);
      expect(axiomIds).toEqual(new Set(["A1"]));
    });

    it("空の論理式テキストのルートノードは無視される", () => {
      const nodes = [makeAxiomNode("empty", "")];
      const edges: readonly InferenceEdge[] = [];

      const axiomIds = getNodeAxiomIds(
        "empty",
        nodes,
        edges,
        lukasiewiczSystem,
      );
      expect(axiomIds).toEqual(new Set());
    });

    it("パース不能な論理式のルートノードは無視される", () => {
      const nodes = [makeAxiomNode("bad", ">>>invalid<<<")];
      const edges: readonly InferenceEdge[] = [];

      const axiomIds = getNodeAxiomIds("bad", nodes, edges, lukasiewiczSystem);
      expect(axiomIds).toEqual(new Set());
    });

    it("存在しないノードIDは空集合を返す", () => {
      const nodes = [makeAxiomNode("a1", "phi -> (psi -> phi)")];
      const edges: readonly InferenceEdge[] = [];

      const axiomIds = getNodeAxiomIds(
        "nonexistent",
        nodes,
        edges,
        lukasiewiczSystem,
      );
      expect(axiomIds).toEqual(new Set());
    });

    it("ルートノードIDがノード配列に存在しない場合はスキップされる", () => {
      // mp1 の前提 "ghost" はノード配列に存在しない
      const nodes = [
        makeAxiomNode("a1", "phi -> (psi -> phi)"),
        { ...makeNode("mp1", "axiom"), formulaText: "" },
      ];
      const edges = [makeMPEdge("mp1", "ghost", "a1")];

      const axiomIds = getNodeAxiomIds("mp1", nodes, edges, lukasiewiczSystem);
      // ghost はスキップされ、a1 のみ
      expect(axiomIds).toEqual(new Set(["A1"]));
    });

    it("チェーン導出でも最初のルート公理のIDを返す", () => {
      // a1, a3 → mp1
      // mp1, a2 → mp2
      const nodes = [
        makeAxiomNode("a1", "phi -> (psi -> phi)"),
        makeAxiomNode("a3", "(~phi -> ~psi) -> (psi -> phi)"),
        makeAxiomNode(
          "a2",
          "(phi -> (psi -> chi)) -> ((phi -> psi) -> (phi -> chi))",
        ),
        { ...makeNode("mp1", "axiom"), formulaText: "" },
        { ...makeNode("mp2", "axiom"), formulaText: "" },
      ];
      const edges = [
        makeMPEdge("mp1", "a1", "a3"),
        makeMPEdge("mp2", "mp1", "a2"),
      ];

      const axiomIds = getNodeAxiomIds("mp2", nodes, edges, lukasiewiczSystem);
      expect(axiomIds).toEqual(new Set(["A1", "A2", "A3"]));
    });
  });

  describe("validateRootNodes", () => {
    const lukasiewiczSystem: LogicSystem = {
      name: "Łukasiewicz",
      propositionalAxioms: new Set(["A1", "A2", "A3"]),
      predicateLogic: false,
      equalityLogic: false,
      generalization: false,
    };

    function makeAxiomNode(id: string, formulaText: string): WorkspaceNode {
      return {
        id,
        kind: "axiom",
        label: id,
        formulaText,
        position: { x: 0, y: 0 },
      };
    }

    it("公理スキーマそのものはschemaとして識別する", () => {
      // φ → (ψ → φ) はA1スキーマそのもの
      const nodes = [makeAxiomNode("a1", "phi -> (psi -> phi)")];
      const edges: readonly InferenceEdge[] = [];

      const result = validateRootNodes("a1", nodes, edges, lukasiewiczSystem);
      expect(result).toEqual([{ _tag: "schema", nodeId: "a1", axiomId: "A1" }]);
    });

    it("公理インスタンス（代入済み）はinstanceとして識別する", () => {
      // phi -> ((phi -> phi) -> phi) はA1に φ:=phi, ψ:=(phi→phi) を代入したインスタンス
      // identifyAxiom でインスタンスとして認識される
      const nodes = [
        makeAxiomNode("a1-instance", "phi -> ((phi -> phi) -> phi)"),
      ];
      const edges: readonly InferenceEdge[] = [];

      const result = validateRootNodes(
        "a1-instance",
        nodes,
        edges,
        lukasiewiczSystem,
      );
      expect(result).toEqual([
        { _tag: "instance", nodeId: "a1-instance", axiomId: "A1" },
      ]);
    });

    it("識別不能な論理式はunknownとして識別する", () => {
      const nodes = [makeAxiomNode("unknown", "phi")];
      const edges: readonly InferenceEdge[] = [];

      const result = validateRootNodes(
        "unknown",
        nodes,
        edges,
        lukasiewiczSystem,
      );
      expect(result).toEqual([{ _tag: "unknown", nodeId: "unknown" }]);
    });

    it("空の論理式はunknownとして識別する", () => {
      const nodes = [makeAxiomNode("empty", "")];
      const edges: readonly InferenceEdge[] = [];

      const result = validateRootNodes(
        "empty",
        nodes,
        edges,
        lukasiewiczSystem,
      );
      expect(result).toEqual([{ _tag: "unknown", nodeId: "empty" }]);
    });

    it("パース不能な論理式はunknownとして識別する", () => {
      const nodes = [makeAxiomNode("bad", ">>>invalid<<<")];
      const edges: readonly InferenceEdge[] = [];

      const result = validateRootNodes("bad", nodes, edges, lukasiewiczSystem);
      expect(result).toEqual([{ _tag: "unknown", nodeId: "bad" }]);
    });

    it("MP導出ノードの依存ルートノードを正しく分類する", () => {
      // a1-schema: A1スキーマそのもの
      // a1-instance: A1の代入インスタンス（identifyAxiomでinstance認識）
      // → mp1 (derived)
      const nodes = [
        makeAxiomNode("a1-schema", "phi -> (psi -> phi)"),
        makeAxiomNode("a1-instance", "phi -> ((phi -> phi) -> phi)"),
        { ...makeNode("mp1", "axiom"), formulaText: "" },
      ];
      const edges = [makeMPEdge("mp1", "a1-schema", "a1-instance")];

      const result = validateRootNodes("mp1", nodes, edges, lukasiewiczSystem);
      expect(result).toHaveLength(2);
      expect(result).toContainEqual({
        _tag: "schema",
        nodeId: "a1-schema",
        axiomId: "A1",
      });
      expect(result).toContainEqual({
        _tag: "instance",
        nodeId: "a1-instance",
        axiomId: "A1",
      });
    });

    it("ルートノードIDがノード配列に存在しない場合はスキップされる", () => {
      const nodes = [
        makeAxiomNode("a1", "phi -> (psi -> phi)"),
        { ...makeNode("mp1", "axiom"), formulaText: "" },
      ];
      const edges = [makeMPEdge("mp1", "ghost", "a1")];

      const result = validateRootNodes("mp1", nodes, edges, lukasiewiczSystem);
      // ghost はスキップされ、a1 のみ
      expect(result).toHaveLength(1);
      expect(result).toContainEqual({
        _tag: "schema",
        nodeId: "a1",
        axiomId: "A1",
      });
    });

    it("理論公理スキーマはtheory-schemaとして識別する", () => {
      // PA1: all x. ~(S(x) = 0) はペアノ算術の理論公理スキーマそのもの
      const nodes = [makeAxiomNode("pa1", "all x. ~(S(x) = 0)")];
      const edges: readonly InferenceEdge[] = [];

      const result = validateRootNodes(
        "pa1",
        nodes,
        edges,
        peanoArithmeticSystem,
      );
      expect(result).toEqual([
        { _tag: "theory-schema", nodeId: "pa1", theoryAxiomId: "PA1" },
      ]);
    });

    it("理論公理の代入インスタンスはexactマッチモードではunknownとなる", () => {
      // PA3のexactマッチ: all x. x + 0 = x と完全一致のみ認識
      // 0 + 0 = 0 は代入インスタンスだがexactマッチでは認識されない
      const nodes = [makeAxiomNode("pa3-inst", "0 + 0 = 0")];
      const edges: readonly InferenceEdge[] = [];

      const result = validateRootNodes(
        "pa3-inst",
        nodes,
        edges,
        peanoArithmeticSystem,
      );
      expect(result).toEqual([{ _tag: "unknown", nodeId: "pa3-inst" }]);
    });

    it("パターンマッチ理論公理の代入インスタンスはunknownとして識別する（構造的一致のみ）", () => {
      // A1テンプレート(φ→(ψ→φ))をパターンマッチ理論公理として登録
      const patternTheoryAxiom: TheoryAxiom = {
        id: "T1",
        displayName: "T1 (test)",
        template: axiomA1Template,
        dslText: "phi -> (psi -> phi)",
        matchMode: "pattern",
      };
      const systemWithPatternTheory: LogicSystem = {
        name: "Test",
        propositionalAxioms: new Set([]), // A1を命題論理公理に含めない
        predicateLogic: false,
        equalityLogic: false,
        generalization: false,
        theoryAxioms: [patternTheoryAxiom],
      };
      // phi -> ((phi -> phi) -> phi) はA1の代入インスタンス
      // matchTheoryAxiomTemplateByEquality は完全一致のみ認めるため unknown
      const nodes = [makeAxiomNode("t1-inst", "phi -> ((phi -> phi) -> phi)")];
      const edges: readonly InferenceEdge[] = [];

      const result = validateRootNodes(
        "t1-inst",
        nodes,
        edges,
        systemWithPatternTheory,
      );
      expect(result).toEqual([{ _tag: "unknown", nodeId: "t1-inst" }]);
    });

    it("理論公理と命題論理公理が混在するルートノードを正しく分類する", () => {
      const nodes = [
        makeAxiomNode("a1", "phi -> (psi -> phi)"),
        makeAxiomNode("pa1", "all x. ~(S(x) = 0)"),
        { ...makeNode("mp1", "axiom"), formulaText: "" },
      ];
      const edges = [makeMPEdge("mp1", "a1", "pa1")];

      const result = validateRootNodes(
        "mp1",
        nodes,
        edges,
        peanoArithmeticSystem,
      );
      expect(result).toHaveLength(2);
      expect(result).toContainEqual({
        _tag: "schema",
        nodeId: "a1",
        axiomId: "A1",
      });
      expect(result).toContainEqual({
        _tag: "theory-schema",
        nodeId: "pa1",
        theoryAxiomId: "PA1",
      });
    });

    it("SubstitutionEdge経由の導出ではルートはスキーマ元を指す", () => {
      // a1-schema → [SubstitutionEdge] → a1-derived
      const nodes = [
        makeAxiomNode("a1-schema", "phi -> (psi -> phi)"),
        {
          ...makeNode("a1-derived", "axiom"),
          formulaText: "phi -> ((phi -> phi) -> phi)",
        },
      ];
      const edges = [makeSubstEdge("a1-derived", "a1-schema")];

      const result = validateRootNodes(
        "a1-derived",
        nodes,
        edges,
        lukasiewiczSystem,
      );
      // ルートはa1-schema（スキーマそのもの）
      expect(result).toEqual([
        { _tag: "schema", nodeId: "a1-schema", axiomId: "A1" },
      ]);
    });
  });

  describe("hasUnknownRoots", () => {
    it("unknownタグがあればtrueを返す", () => {
      const validations = [
        { _tag: "schema" as const, nodeId: "a1", axiomId: "A1" as const },
        { _tag: "unknown" as const, nodeId: "u1" },
      ];
      expect(hasUnknownRoots(validations)).toBe(true);
    });

    it("unknownタグがなければfalseを返す", () => {
      const validations = [
        { _tag: "schema" as const, nodeId: "a1", axiomId: "A1" as const },
        { _tag: "schema" as const, nodeId: "a2", axiomId: "A2" as const },
      ];
      expect(hasUnknownRoots(validations)).toBe(false);
    });

    it("theory-schemaのみではfalseを返す", () => {
      const validations = [
        {
          _tag: "theory-schema" as const,
          nodeId: "pa1",
          theoryAxiomId: "PA1",
        },
        {
          _tag: "theory-schema" as const,
          nodeId: "pa3",
          theoryAxiomId: "PA3",
        },
      ];
      expect(hasUnknownRoots(validations)).toBe(false);
    });

    it("空の配列ではfalseを返す", () => {
      expect(hasUnknownRoots([])).toBe(false);
    });
  });

  describe("deduplicateDependencyInfos", () => {
    it("空配列を返す", () => {
      expect(deduplicateDependencyInfos([])).toEqual([]);
    });

    it("重複のない配列はそのまま返す", () => {
      const deps = [
        { nodeId: "a1", displayName: "A1" },
        { nodeId: "a2", displayName: "A2" },
        { nodeId: "a3", displayName: "A3" },
      ];
      expect(deduplicateDependencyInfos(deps)).toEqual(deps);
    });

    it("同じdisplayNameの重複を除去する", () => {
      const deps = [
        { nodeId: "node-1", displayName: "A1" },
        { nodeId: "node-2", displayName: "A1" },
        { nodeId: "node-3", displayName: "A2" },
      ];
      expect(deduplicateDependencyInfos(deps)).toEqual([
        { nodeId: "node-1", displayName: "A1" },
        { nodeId: "node-3", displayName: "A2" },
      ]);
    });

    it("最初に出現したエントリを保持する", () => {
      const deps = [
        { nodeId: "first-a1", displayName: "A1" },
        { nodeId: "second-a1", displayName: "A1" },
        { nodeId: "third-a1", displayName: "A1" },
      ];
      expect(deduplicateDependencyInfos(deps)).toEqual([
        { nodeId: "first-a1", displayName: "A1" },
      ]);
    });

    it("異なるdisplayNameの要素はすべて保持する", () => {
      const deps = [
        { nodeId: "n1", displayName: "A1" },
        { nodeId: "n2", displayName: "A2" },
        { nodeId: "n3", displayName: "A1" },
        { nodeId: "n4", displayName: "A3" },
        { nodeId: "n5", displayName: "A2" },
      ];
      expect(deduplicateDependencyInfos(deps)).toEqual([
        { nodeId: "n1", displayName: "A1" },
        { nodeId: "n2", displayName: "A2" },
        { nodeId: "n4", displayName: "A3" },
      ]);
    });

    it("単一要素の配列はそのまま返す", () => {
      const deps = [{ nodeId: "a1", displayName: "A1" }];
      expect(deduplicateDependencyInfos(deps)).toEqual(deps);
    });
  });

  describe("getNodeInferenceRuleIds", () => {
    it("InferenceEdgeがないノードは空集合を返す", () => {
      const edges: readonly InferenceEdge[] = [];
      const result = getNodeInferenceRuleIds("node-1", edges);
      expect(result).toEqual(new Set());
    });

    it("MPエッジで導出されたノードは'mp'を含む", () => {
      const edges = [makeMPEdge("mp-1", "axiom-1", "axiom-2")];
      const result = getNodeInferenceRuleIds("mp-1", edges);
      expect(result).toEqual(new Set(["mp"]));
    });

    it("Genエッジで導出されたノードは'gen'を含む", () => {
      const edges = [makeGenEdge("gen-1", "axiom-1")];
      const result = getNodeInferenceRuleIds("gen-1", edges);
      expect(result).toEqual(new Set(["gen"]));
    });

    it("Substitutionエッジで導出されたノードは'substitution'を含む", () => {
      const edges = [makeSubstEdge("subst-1", "axiom-1")];
      const result = getNodeInferenceRuleIds("subst-1", edges);
      expect(result).toEqual(new Set(["substitution"]));
    });

    it("チェーン状の導出で複数の規則IDを収集する", () => {
      // axiom-1 → [subst] → subst-1 → [mp] → mp-1
      const edges: readonly InferenceEdge[] = [
        makeSubstEdge("subst-1", "axiom-1"),
        makeMPEdge("mp-1", "subst-1", "axiom-2"),
      ];
      const result = getNodeInferenceRuleIds("mp-1", edges);
      expect(result).toEqual(new Set(["mp", "substitution"]));
    });

    it("MP + Gen のチェーンで両方を収集する", () => {
      // axiom-1, axiom-2 → [mp] → mp-1 → [gen] → gen-1
      const edges: readonly InferenceEdge[] = [
        makeMPEdge("mp-1", "axiom-1", "axiom-2"),
        makeGenEdge("gen-1", "mp-1"),
      ];
      const result = getNodeInferenceRuleIds("gen-1", edges);
      expect(result).toEqual(new Set(["mp", "gen"]));
    });

    it("ダイヤモンド形状でも重複なく規則IDを収集する", () => {
      // axiom-1 → [subst] → s1
      // axiom-2 → [subst] → s2
      // s1, s2 → [mp] → mp-1
      const edges: readonly InferenceEdge[] = [
        makeSubstEdge("s1", "axiom-1"),
        makeSubstEdge("s2", "axiom-2"),
        makeMPEdge("mp-1", "s1", "s2"),
      ];
      const result = getNodeInferenceRuleIds("mp-1", edges);
      expect(result).toEqual(new Set(["mp", "substitution"]));
    });

    it("ルートノードからは空集合を返す（上流にエッジなし）", () => {
      const edges = [makeMPEdge("mp-1", "axiom-1", "axiom-2")];
      const result = getNodeInferenceRuleIds("axiom-1", edges);
      expect(result).toEqual(new Set());
    });

    it("存在しないノードIDは空集合を返す", () => {
      const edges = [makeMPEdge("mp-1", "axiom-1", "axiom-2")];
      const result = getNodeInferenceRuleIds("nonexistent", edges);
      expect(result).toEqual(new Set());
    });

    it("共通前提ノードへの複数パスで重複訪問をスキップする", () => {
      // axiom-1 → [subst] → s1
      // axiom-1, s1 → [mp] → mp-1
      // axiom-1 は mp-1 から直接参照 + s1 経由の2パスで到達可能
      const edges: readonly InferenceEdge[] = [
        makeSubstEdge("s1", "axiom-1"),
        makeMPEdge("mp-1", "axiom-1", "s1"),
      ];
      const result = getNodeInferenceRuleIds("mp-1", edges);
      expect(result).toEqual(new Set(["mp", "substitution"]));
    });

    it("深いチェーンで全規則を収集する", () => {
      // axiom-1 → [subst] → s1
      // s1, axiom-2 → [mp] → mp-1
      // mp-1 → [gen] → gen-1
      const edges: readonly InferenceEdge[] = [
        makeSubstEdge("s1", "axiom-1"),
        makeMPEdge("mp-1", "s1", "axiom-2"),
        makeGenEdge("gen-1", "mp-1"),
      ];
      const result = getNodeInferenceRuleIds("gen-1", edges);
      expect(result).toEqual(new Set(["substitution", "mp", "gen"]));
    });
  });

  describe("getNodeScRuleIds", () => {
    function makeScAxiomEdge(
      conclusionNodeId: string,
      ruleId: "identity" | "bottom-left",
    ): InferenceEdge {
      return {
        _tag: "sc-axiom",
        ruleId,
        conclusionNodeId,
        conclusionText: "",
      };
    }

    function makeScSingleEdge(
      conclusionNodeId: string,
      premiseNodeId: string,
      ruleId:
        | "weakening-left"
        | "weakening-right"
        | "implication-right"
        | "negation-left"
        | "negation-right",
    ): InferenceEdge {
      return {
        _tag: "sc-single",
        ruleId,
        conclusionNodeId,
        premiseNodeId,
        conclusionText: "",
      };
    }

    function makeScBranchingEdge(
      conclusionNodeId: string,
      leftPremiseNodeId: string,
      rightPremiseNodeId: string,
      ruleId:
        | "cut"
        | "implication-left"
        | "conjunction-right"
        | "disjunction-left",
    ): InferenceEdge {
      return {
        _tag: "sc-branching",
        ruleId,
        conclusionNodeId,
        leftPremiseNodeId,
        rightPremiseNodeId,
        leftConclusionText: "",
        rightConclusionText: "",
        conclusionText: "",
      };
    }

    it("エッジなしのノードは空集合を返す", () => {
      const result = getNodeScRuleIds("node-1", []);
      expect(result).toEqual(new Set());
    });

    it("SC公理エッジのruleIdを収集する", () => {
      const edges: readonly InferenceEdge[] = [
        makeScAxiomEdge("node-1", "identity"),
      ];
      const result = getNodeScRuleIds("node-1", edges);
      expect(result).toEqual(new Set(["identity"]));
    });

    it("SC単一前提エッジのruleIdを収集する", () => {
      // node-1 (identity) → [weakening-left] → node-2
      const edges: readonly InferenceEdge[] = [
        makeScAxiomEdge("node-1", "identity"),
        makeScSingleEdge("node-2", "node-1", "weakening-left"),
      ];
      const result = getNodeScRuleIds("node-2", edges);
      expect(result).toEqual(new Set(["identity", "weakening-left"]));
    });

    it("SC分岐エッジのruleIdを収集する（cut）", () => {
      // node-1 (identity), node-2 (identity) → [cut] → node-3
      const edges: readonly InferenceEdge[] = [
        makeScAxiomEdge("node-1", "identity"),
        makeScAxiomEdge("node-2", "identity"),
        makeScBranchingEdge("node-3", "node-1", "node-2", "cut"),
      ];
      const result = getNodeScRuleIds("node-3", edges);
      expect(result).toEqual(new Set(["identity", "cut"]));
    });

    it("深い証明チェーンで全SCルールを収集する", () => {
      // node-1 (identity) → [weakening-left] → node-2
      // node-3 (bottom-left)
      // node-2, node-3 → [cut] → node-4
      // node-4 → [implication-right] → node-5
      const edges: readonly InferenceEdge[] = [
        makeScAxiomEdge("node-1", "identity"),
        makeScSingleEdge("node-2", "node-1", "weakening-left"),
        makeScAxiomEdge("node-3", "bottom-left"),
        makeScBranchingEdge("node-4", "node-2", "node-3", "cut"),
        makeScSingleEdge("node-5", "node-4", "implication-right"),
      ];
      const result = getNodeScRuleIds("node-5", edges);
      expect(result).toEqual(
        new Set([
          "identity",
          "weakening-left",
          "bottom-left",
          "cut",
          "implication-right",
        ]),
      );
    });

    it("非SCエッジは無視する", () => {
      // Hilbert系のMPエッジとSCエッジが混在
      const edges: readonly InferenceEdge[] = [
        makeMPEdge("node-2", "node-1", "node-3"),
        makeScAxiomEdge("node-4", "identity"),
      ];
      // MPエッジでnode-2に到達するが、SCルールIDは収集されない
      const result = getNodeScRuleIds("node-2", edges);
      expect(result).toEqual(new Set());
    });

    it("SC公理エッジのみ（前提なし）で正しく収集する", () => {
      const edges: readonly InferenceEdge[] = [
        makeScAxiomEdge("node-1", "bottom-left"),
      ];
      const result = getNodeScRuleIds("node-1", edges);
      expect(result).toEqual(new Set(["bottom-left"]));
    });

    it("循環参照があっても無限ループしない", () => {
      // node-1 → [weakening-left] → node-2 → [weakening-right] → node-1 (循環)
      const edges: readonly InferenceEdge[] = [
        makeScSingleEdge("node-2", "node-1", "weakening-left"),
        makeScSingleEdge("node-1", "node-2", "weakening-right"),
      ];
      const result = getNodeScRuleIds("node-1", edges);
      expect(result).toEqual(new Set(["weakening-right", "weakening-left"]));
    });
  });
});

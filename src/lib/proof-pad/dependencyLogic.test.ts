import { describe, it, expect } from "vitest";
import {
  getNodeDependencies,
  getAllNodeDependencies,
  getSubtreeNodeIds,
  getNodeAxiomIds,
  validateRootNodes,
  getInstanceRootNodeIds,
  hasInstanceRoots,
  deduplicateDependencyInfos,
} from "./dependencyLogic";
import type { WorkspaceNode } from "./workspaceState";
import type { InferenceEdge } from "./inferenceEdge";
import type { LogicSystem } from "../logic-core/inferenceRule";

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
      // a1-instance: A1の代入インスタンス
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

  describe("getInstanceRootNodeIds", () => {
    it("instanceタグのノードIDのみを返す", () => {
      const validations = [
        { _tag: "schema" as const, nodeId: "a1", axiomId: "A1" as const },
        { _tag: "instance" as const, nodeId: "a2", axiomId: "A1" as const },
        { _tag: "unknown" as const, nodeId: "u1" },
      ];
      expect(getInstanceRootNodeIds(validations)).toEqual(["a2"]);
    });

    it("instanceがなければ空配列を返す", () => {
      const validations = [
        { _tag: "schema" as const, nodeId: "a1", axiomId: "A1" as const },
        { _tag: "unknown" as const, nodeId: "u1" },
      ];
      expect(getInstanceRootNodeIds(validations)).toEqual([]);
    });
  });

  describe("hasInstanceRoots", () => {
    it("instanceタグがあればtrueを返す", () => {
      const validations = [
        { _tag: "schema" as const, nodeId: "a1", axiomId: "A1" as const },
        { _tag: "instance" as const, nodeId: "a2", axiomId: "A1" as const },
      ];
      expect(hasInstanceRoots(validations)).toBe(true);
    });

    it("instanceタグがなければfalseを返す", () => {
      const validations = [
        { _tag: "schema" as const, nodeId: "a1", axiomId: "A1" as const },
        { _tag: "unknown" as const, nodeId: "u1" },
      ];
      expect(hasInstanceRoots(validations)).toBe(false);
    });

    it("空の配列ではfalseを返す", () => {
      expect(hasInstanceRoots([])).toBe(false);
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
});

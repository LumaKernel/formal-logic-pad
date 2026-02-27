import { describe, it, expect } from "vitest";
import {
  getNodeDependencies,
  getAllNodeDependencies,
  getSubtreeNodeIds,
  getNodeAxiomIds,
} from "./dependencyLogic";
import type { WorkspaceNode, WorkspaceConnection } from "./workspaceState";
import type { LogicSystem } from "../logic-core/inferenceRule";

// --- ヘルパー ---

function makeNode(
  id: string,
  kind: "axiom" | "derived" = "axiom",
): WorkspaceNode {
  return {
    id,
    kind,
    label: id,
    formulaText: "",
    position: { x: 0, y: 0 },
  };
}

function makeConnection(
  fromNodeId: string,
  toNodeId: string,
  toPortId: string = "premise-left",
): WorkspaceConnection {
  return {
    id: `conn-${fromNodeId satisfies string}-out-${toNodeId satisfies string}-${toPortId satisfies string}`,
    fromNodeId,
    fromPortId: "out",
    toNodeId,
    toPortId,
  };
}

describe("dependencyLogic", () => {
  describe("getNodeDependencies", () => {
    it("ルートノードは自分自身のみに依存する", () => {
      const nodes = [makeNode("node-1")];
      const connections: readonly WorkspaceConnection[] = [];

      const deps = getNodeDependencies("node-1", nodes, connections);
      expect(deps).toEqual(new Set(["node-1"]));
    });

    it("存在しないノードは空集合を返す", () => {
      const nodes = [makeNode("node-1")];
      const connections: readonly WorkspaceConnection[] = [];

      const deps = getNodeDependencies("node-999", nodes, connections);
      expect(deps).toEqual(new Set());
    });

    it("1つの前提を持つ導出ノードはその前提の公理に依存する", () => {
      // axiom-1 → mp-1
      const nodes = [makeNode("axiom-1"), makeNode("mp-1", "derived")];
      const connections = [makeConnection("axiom-1", "mp-1", "premise-left")];

      const deps = getNodeDependencies("mp-1", nodes, connections);
      expect(deps).toEqual(new Set(["axiom-1"]));
    });

    it("2つの前提を持つMPノードは両方の公理に依存する", () => {
      // axiom-1 → mp-1 ← axiom-2
      const nodes = [
        makeNode("axiom-1"),
        makeNode("axiom-2"),
        makeNode("mp-1", "derived"),
      ];
      const connections = [
        makeConnection("axiom-1", "mp-1", "premise-left"),
        makeConnection("axiom-2", "mp-1", "premise-right"),
      ];

      const deps = getNodeDependencies("mp-1", nodes, connections);
      expect(deps).toEqual(new Set(["axiom-1", "axiom-2"]));
    });

    it("チェーン状の導出は最初の公理まで遡る", () => {
      // axiom-1 → mp-1 → mp-2
      //                 ← axiom-2
      const nodes = [
        makeNode("axiom-1"),
        makeNode("axiom-2"),
        makeNode("mp-1", "derived"),
        makeNode("mp-2", "derived"),
      ];
      const connections = [
        makeConnection("axiom-1", "mp-1", "premise-left"),
        makeConnection("axiom-2", "mp-1", "premise-right"),
        makeConnection("mp-1", "mp-2", "premise-left"),
        makeConnection("axiom-2", "mp-2", "premise-right"),
      ];

      const deps = getNodeDependencies("mp-2", nodes, connections);
      expect(deps).toEqual(new Set(["axiom-1", "axiom-2"]));
    });

    it("ダイヤモンド形状の依存関係を正しく処理する", () => {
      // axiom-1 → mp-1 → mp-3
      // axiom-2 → mp-1
      // axiom-1 → mp-2 → mp-3
      // axiom-3 → mp-2
      const nodes = [
        makeNode("axiom-1"),
        makeNode("axiom-2"),
        makeNode("axiom-3"),
        makeNode("mp-1", "derived"),
        makeNode("mp-2", "derived"),
        makeNode("mp-3", "derived"),
      ];
      const connections = [
        makeConnection("axiom-1", "mp-1", "premise-left"),
        makeConnection("axiom-2", "mp-1", "premise-right"),
        makeConnection("axiom-1", "mp-2", "premise-left"),
        makeConnection("axiom-3", "mp-2", "premise-right"),
        makeConnection("mp-1", "mp-3", "premise-left"),
        makeConnection("mp-2", "mp-3", "premise-right"),
      ];

      const deps = getNodeDependencies("mp-3", nodes, connections);
      expect(deps).toEqual(new Set(["axiom-1", "axiom-2", "axiom-3"]));
    });

    it("Genノードも正しく公理まで遡る", () => {
      // axiom-1 → gen-1
      const nodes = [makeNode("axiom-1"), makeNode("gen-1", "derived")];
      const connections = [makeConnection("axiom-1", "gen-1", "premise")];

      const deps = getNodeDependencies("gen-1", nodes, connections);
      expect(deps).toEqual(new Set(["axiom-1"]));
    });

    it("複数のルートノードに依存する深いグラフを正しく処理する", () => {
      // axiom-1 → mp-1 → gen-1 → mp-3
      // axiom-2 → mp-1
      // axiom-3 → mp-2 → mp-3
      // axiom-4 → mp-2
      const nodes = [
        makeNode("axiom-1"),
        makeNode("axiom-2"),
        makeNode("axiom-3"),
        makeNode("axiom-4"),
        makeNode("mp-1", "derived"),
        makeNode("mp-2", "derived"),
        makeNode("gen-1", "derived"),
        makeNode("mp-3", "derived"),
      ];
      const connections = [
        makeConnection("axiom-1", "mp-1", "premise-left"),
        makeConnection("axiom-2", "mp-1", "premise-right"),
        makeConnection("mp-1", "gen-1", "premise"),
        makeConnection("axiom-3", "mp-2", "premise-left"),
        makeConnection("axiom-4", "mp-2", "premise-right"),
        makeConnection("gen-1", "mp-3", "premise-left"),
        makeConnection("mp-2", "mp-3", "premise-right"),
      ];

      const deps = getNodeDependencies("mp-3", nodes, connections);
      expect(deps).toEqual(
        new Set(["axiom-1", "axiom-2", "axiom-3", "axiom-4"]),
      );
    });

    it("接続のないノードは自分自身のみに依存する（ルートノード）", () => {
      const nodes = [makeNode("isolated"), makeNode("other")];
      const connections = [makeConnection("other", "isolated", "premise-left")];
      // isolatedは接続先になっているのでルートではない
      const deps = getNodeDependencies("isolated", nodes, connections);
      expect(deps).toEqual(new Set(["other"]));
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
      // axiom-1 → mp-1 ← axiom-2
      const nodes = [
        makeNode("axiom-1"),
        makeNode("axiom-2"),
        makeNode("mp-1", "derived"),
      ];
      const connections = [
        makeConnection("axiom-1", "mp-1", "premise-left"),
        makeConnection("axiom-2", "mp-1", "premise-right"),
      ];

      const deps = getAllNodeDependencies(nodes, connections);
      expect(deps.size).toBe(3);
      expect(deps.get("axiom-1")).toEqual(new Set(["axiom-1"]));
      expect(deps.get("axiom-2")).toEqual(new Set(["axiom-2"]));
      expect(deps.get("mp-1")).toEqual(new Set(["axiom-1", "axiom-2"]));
    });
  });

  describe("getSubtreeNodeIds", () => {
    it("接続のないノードは自身のみを返す", () => {
      const connections: readonly WorkspaceConnection[] = [];
      const result = getSubtreeNodeIds("node-1", connections);
      expect(result).toEqual(new Set(["node-1"]));
    });

    it("1つの子を持つノードは自身と子を返す", () => {
      // axiom-1 → mp-1
      const connections = [makeConnection("axiom-1", "mp-1", "premise-left")];
      const result = getSubtreeNodeIds("axiom-1", connections);
      expect(result).toEqual(new Set(["axiom-1", "mp-1"]));
    });

    it("子ノードから開始した場合は自身のみ（親方向には辿らない）", () => {
      // axiom-1 → mp-1
      const connections = [makeConnection("axiom-1", "mp-1", "premise-left")];
      const result = getSubtreeNodeIds("mp-1", connections);
      expect(result).toEqual(new Set(["mp-1"]));
    });

    it("チェーン状のサブツリーを正しく返す", () => {
      // axiom-1 → mp-1 → mp-2 → mp-3
      const connections = [
        makeConnection("axiom-1", "mp-1", "premise-left"),
        makeConnection("mp-1", "mp-2", "premise-left"),
        makeConnection("mp-2", "mp-3", "premise-left"),
      ];
      const result = getSubtreeNodeIds("axiom-1", connections);
      expect(result).toEqual(new Set(["axiom-1", "mp-1", "mp-2", "mp-3"]));
    });

    it("分岐するサブツリーを正しく返す", () => {
      // axiom-1 → mp-1
      // axiom-1 → mp-2
      const connections = [
        makeConnection("axiom-1", "mp-1", "premise-left"),
        makeConnection("axiom-1", "mp-2", "premise-left"),
      ];
      const result = getSubtreeNodeIds("axiom-1", connections);
      expect(result).toEqual(new Set(["axiom-1", "mp-1", "mp-2"]));
    });

    it("途中のノードから開始すると部分サブツリーのみ返す", () => {
      // axiom-1 → mp-1 → mp-2
      //                 → mp-3
      const connections = [
        makeConnection("axiom-1", "mp-1", "premise-left"),
        makeConnection("mp-1", "mp-2", "premise-left"),
        makeConnection("mp-1", "mp-3", "premise-left"),
      ];
      const result = getSubtreeNodeIds("mp-1", connections);
      expect(result).toEqual(new Set(["mp-1", "mp-2", "mp-3"]));
    });

    it("ダイヤモンド形状のDAGを正しく処理する", () => {
      // axiom-1 → mp-1 → mp-3
      // axiom-1 → mp-2 → mp-3
      const connections = [
        makeConnection("axiom-1", "mp-1", "premise-left"),
        makeConnection("axiom-1", "mp-2", "premise-right"),
        makeConnection("mp-1", "mp-3", "premise-left"),
        makeConnection("mp-2", "mp-3", "premise-right"),
      ];
      const result = getSubtreeNodeIds("axiom-1", connections);
      expect(result).toEqual(new Set(["axiom-1", "mp-1", "mp-2", "mp-3"]));
    });

    it("複雑なグラフで共有ノードを重複なく返す", () => {
      // axiom-1 → mp-1 → mp-3
      //         → mp-2 → mp-3
      //                 → mp-4
      const connections = [
        makeConnection("axiom-1", "mp-1", "premise-left"),
        makeConnection("axiom-1", "mp-2", "premise-right"),
        makeConnection("mp-1", "mp-3", "premise-left"),
        makeConnection("mp-2", "mp-3", "premise-right"),
        makeConnection("mp-2", "mp-4", "premise-left"),
      ];
      const result = getSubtreeNodeIds("axiom-1", connections);
      expect(result).toEqual(
        new Set(["axiom-1", "mp-1", "mp-2", "mp-3", "mp-4"]),
      );
    });

    it("存在しないノードIDでも自身のみを含む集合を返す", () => {
      const connections = [makeConnection("axiom-1", "mp-1", "premise-left")];
      const result = getSubtreeNodeIds("nonexistent", connections);
      expect(result).toEqual(new Set(["nonexistent"]));
    });

    it("他のノードの子孫は含まない", () => {
      // axiom-1 → mp-1
      // axiom-2 → mp-2
      const connections = [
        makeConnection("axiom-1", "mp-1", "premise-left"),
        makeConnection("axiom-2", "mp-2", "premise-left"),
      ];
      const result = getSubtreeNodeIds("axiom-1", connections);
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
      const connections: readonly WorkspaceConnection[] = [];

      const axiomIds = getNodeAxiomIds(
        "a1",
        nodes,
        connections,
        lukasiewiczSystem,
      );
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
      const connections: readonly WorkspaceConnection[] = [];

      const axiomIds = getNodeAxiomIds(
        "a2",
        nodes,
        connections,
        lukasiewiczSystem,
      );
      expect(axiomIds).toEqual(new Set(["A2"]));
    });

    it("A3公理インスタンスを含むルートノードを識別する", () => {
      // (~phi -> ~psi) -> (psi -> phi) は A3のインスタンス
      const nodes = [makeAxiomNode("a3", "(~phi -> ~psi) -> (psi -> phi)")];
      const connections: readonly WorkspaceConnection[] = [];

      const axiomIds = getNodeAxiomIds(
        "a3",
        nodes,
        connections,
        lukasiewiczSystem,
      );
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
        { ...makeNode("mp1", "derived"), formulaText: "some derived formula" },
      ];
      const connections = [
        makeConnection("a1", "mp1", "premise-left"),
        makeConnection("a2", "mp1", "premise-right"),
      ];

      const axiomIds = getNodeAxiomIds(
        "mp1",
        nodes,
        connections,
        lukasiewiczSystem,
      );
      expect(axiomIds).toEqual(new Set(["A1", "A2"]));
    });

    it("識別できない論理式のルートノードは結果に含まない", () => {
      const nodes = [
        makeAxiomNode("unknown", "phi"),
        makeAxiomNode("a1", "phi -> (psi -> phi)"),
        { ...makeNode("mp1", "derived"), formulaText: "" },
      ];
      const connections = [
        makeConnection("unknown", "mp1", "premise-left"),
        makeConnection("a1", "mp1", "premise-right"),
      ];

      const axiomIds = getNodeAxiomIds(
        "mp1",
        nodes,
        connections,
        lukasiewiczSystem,
      );
      expect(axiomIds).toEqual(new Set(["A1"]));
    });

    it("空の論理式テキストのルートノードは無視される", () => {
      const nodes = [makeAxiomNode("empty", "")];
      const connections: readonly WorkspaceConnection[] = [];

      const axiomIds = getNodeAxiomIds(
        "empty",
        nodes,
        connections,
        lukasiewiczSystem,
      );
      expect(axiomIds).toEqual(new Set());
    });

    it("パース不能な論理式のルートノードは無視される", () => {
      const nodes = [makeAxiomNode("bad", ">>>invalid<<<")];
      const connections: readonly WorkspaceConnection[] = [];

      const axiomIds = getNodeAxiomIds(
        "bad",
        nodes,
        connections,
        lukasiewiczSystem,
      );
      expect(axiomIds).toEqual(new Set());
    });

    it("存在しないノードIDは空集合を返す", () => {
      const nodes = [makeAxiomNode("a1", "phi -> (psi -> phi)")];
      const connections: readonly WorkspaceConnection[] = [];

      const axiomIds = getNodeAxiomIds(
        "nonexistent",
        nodes,
        connections,
        lukasiewiczSystem,
      );
      expect(axiomIds).toEqual(new Set());
    });

    it("チェーン導出でも最初のルート公理のIDを返す", () => {
      // a1 → mp1 → mp2
      // a3 → mp1
      // a2 → mp2
      const nodes = [
        makeAxiomNode("a1", "phi -> (psi -> phi)"),
        makeAxiomNode("a3", "(~phi -> ~psi) -> (psi -> phi)"),
        makeAxiomNode(
          "a2",
          "(phi -> (psi -> chi)) -> ((phi -> psi) -> (phi -> chi))",
        ),
        { ...makeNode("mp1", "derived"), formulaText: "" },
        { ...makeNode("mp2", "derived"), formulaText: "" },
      ];
      const connections = [
        makeConnection("a1", "mp1", "premise-left"),
        makeConnection("a3", "mp1", "premise-right"),
        makeConnection("mp1", "mp2", "premise-left"),
        makeConnection("a2", "mp2", "premise-right"),
      ];

      const axiomIds = getNodeAxiomIds(
        "mp2",
        nodes,
        connections,
        lukasiewiczSystem,
      );
      expect(axiomIds).toEqual(new Set(["A1", "A2", "A3"]));
    });
  });
});

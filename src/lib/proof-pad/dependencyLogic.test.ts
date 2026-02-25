import { describe, it, expect } from "vitest";
import {
  getNodeDependencies,
  getAllNodeDependencies,
} from "./dependencyLogic";
import type { WorkspaceNode, WorkspaceConnection } from "./workspaceState";

// --- ヘルパー ---

function makeNode(id: string, kind: "axiom" | "mp" | "gen" = "axiom"): WorkspaceNode {
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
      const nodes = [makeNode("axiom-1"), makeNode("mp-1", "mp")];
      const connections = [makeConnection("axiom-1", "mp-1", "premise-left")];

      const deps = getNodeDependencies("mp-1", nodes, connections);
      expect(deps).toEqual(new Set(["axiom-1"]));
    });

    it("2つの前提を持つMPノードは両方の公理に依存する", () => {
      // axiom-1 → mp-1 ← axiom-2
      const nodes = [
        makeNode("axiom-1"),
        makeNode("axiom-2"),
        makeNode("mp-1", "mp"),
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
        makeNode("mp-1", "mp"),
        makeNode("mp-2", "mp"),
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
        makeNode("mp-1", "mp"),
        makeNode("mp-2", "mp"),
        makeNode("mp-3", "mp"),
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
      const nodes = [makeNode("axiom-1"), makeNode("gen-1", "gen")];
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
        makeNode("mp-1", "mp"),
        makeNode("mp-2", "mp"),
        makeNode("gen-1", "gen"),
        makeNode("mp-3", "mp"),
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
        makeNode("mp-1", "mp"),
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
});

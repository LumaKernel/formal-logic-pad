import { describe, expect, it } from "vitest";
import {
  isRootNode,
  classifyNode,
  classifyAllNodes,
  getAxiomNodeIds,
} from "./nodeRoleLogic";
import type { WorkspaceNode, WorkspaceConnection } from "./workspaceState";

// --- ヘルパー ---

function makeNode(
  id: string,
  overrides?: Partial<WorkspaceNode>,
): WorkspaceNode {
  return {
    id,
    kind: "axiom",
    label: "test",
    formulaText: "",
    position: { x: 0, y: 0 },
    ...overrides,
  };
}

function makeConnection(
  fromNodeId: string,
  toNodeId: string,
  fromPortId = "out",
  toPortId = "premise-left",
): WorkspaceConnection {
  return {
    id: `conn-${fromNodeId satisfies string}-${fromPortId satisfies string}-${toNodeId satisfies string}-${toPortId satisfies string}`,
    fromNodeId,
    fromPortId,
    toNodeId,
    toPortId,
  };
}

describe("nodeRoleLogic", () => {
  describe("isRootNode", () => {
    it("returns true when no connections target the node", () => {
      const connections: readonly WorkspaceConnection[] = [];
      expect(isRootNode("node-1", connections)).toBe(true);
    });

    it("returns true when node is only a source of connections", () => {
      const connections = [makeConnection("node-1", "node-2")];
      expect(isRootNode("node-1", connections)).toBe(true);
    });

    it("returns false when node is a target of a connection", () => {
      const connections = [makeConnection("node-1", "node-2")];
      expect(isRootNode("node-2", connections)).toBe(false);
    });

    it("returns false when node has multiple incoming connections", () => {
      const connections = [
        makeConnection("node-1", "node-3", "out", "premise-left"),
        makeConnection("node-2", "node-3", "out", "premise-right"),
      ];
      expect(isRootNode("node-3", connections)).toBe(false);
    });

    it("returns true for a node unrelated to any connections", () => {
      const connections = [makeConnection("node-1", "node-2")];
      expect(isRootNode("node-3", connections)).toBe(true);
    });
  });

  describe("classifyNode", () => {
    it("returns 'derived' for a node with incoming connections", () => {
      const node = makeNode("node-2", { kind: "axiom" });
      const connections = [makeConnection("node-1", "node-2")];
      expect(classifyNode(node, connections)).toBe("derived");
    });

    it("returns 'root-axiom' for a root node explicitly marked as axiom", () => {
      const node = makeNode("node-1", { role: "axiom" });
      const connections: readonly WorkspaceConnection[] = [];
      expect(classifyNode(node, connections)).toBe("root-axiom");
    });

    it("returns 'root-unmarked' for a root node without role", () => {
      const node = makeNode("node-1");
      const connections: readonly WorkspaceConnection[] = [];
      expect(classifyNode(node, connections)).toBe("root-unmarked");
    });

    it("returns 'root-unmarked' for a root node with undefined role", () => {
      const node = makeNode("node-1", { role: undefined });
      const connections: readonly WorkspaceConnection[] = [];
      expect(classifyNode(node, connections)).toBe("root-unmarked");
    });

    it("returns 'derived' even if node has explicit role when it has incoming connections", () => {
      const node = makeNode("node-2", { role: "axiom" });
      const connections = [makeConnection("node-1", "node-2")];
      expect(classifyNode(node, connections)).toBe("derived");
    });

    it("returns 'note' for a note node regardless of connections", () => {
      const node = makeNode("note-1", { kind: "note" });
      const connections: readonly WorkspaceConnection[] = [];
      expect(classifyNode(node, connections)).toBe("note");
    });

    it("returns 'note' for a note node even with incoming connections", () => {
      const node = makeNode("note-1", { kind: "note" });
      const connections = [makeConnection("node-1", "note-1")];
      expect(classifyNode(node, connections)).toBe("note");
    });
  });

  describe("classifyAllNodes", () => {
    it("classifies all nodes in a workspace", () => {
      const nodes = [
        makeNode("node-1", { role: "axiom" }),
        makeNode("node-2"),
        makeNode("node-3", { kind: "axiom" }),
      ];
      const connections = [
        makeConnection("node-1", "node-3", "out", "premise-left"),
        makeConnection("node-2", "node-3", "out", "premise-right"),
      ];

      const result = classifyAllNodes(nodes, connections);
      expect(result.get("node-1")).toBe("root-axiom");
      expect(result.get("node-2")).toBe("root-unmarked");
      expect(result.get("node-3")).toBe("derived");
    });

    it("returns empty map for empty workspace", () => {
      const result = classifyAllNodes([], []);
      expect(result.size).toBe(0);
    });

    it("classifies multiple root nodes with different markings", () => {
      const nodes = [makeNode("node-1", { role: "axiom" }), makeNode("node-2")];
      const connections: readonly WorkspaceConnection[] = [];

      const result = classifyAllNodes(nodes, connections);
      expect(result.get("node-1")).toBe("root-axiom");
      expect(result.get("node-2")).toBe("root-unmarked");
    });

    it("classifies note nodes as 'note'", () => {
      const nodes = [
        makeNode("node-1", { role: "axiom" }),
        makeNode("note-1", { kind: "note" }),
      ];
      const connections: readonly WorkspaceConnection[] = [];

      const result = classifyAllNodes(nodes, connections);
      expect(result.get("node-1")).toBe("root-axiom");
      expect(result.get("note-1")).toBe("note");
    });
  });

  describe("getAxiomNodeIds", () => {
    it("returns IDs of explicitly axiom-marked root nodes", () => {
      const nodes = [makeNode("node-1", { role: "axiom" })];
      expect(getAxiomNodeIds(nodes, [])).toEqual(["node-1"]);
    });

    it("returns IDs of unmarked root nodes as implicit axioms", () => {
      const nodes = [makeNode("node-1")];
      expect(getAxiomNodeIds(nodes, [])).toEqual(["node-1"]);
    });

    it("excludes derived nodes", () => {
      const nodes = [makeNode("node-1"), makeNode("node-2", { kind: "axiom" })];
      const connections = [makeConnection("node-1", "node-2")];
      expect(getAxiomNodeIds(nodes, connections)).toEqual(["node-1"]);
    });

    it("returns empty array when all nodes are derived", () => {
      const nodes = [makeNode("node-2", { kind: "axiom" })];
      const connections = [makeConnection("node-1", "node-2")];
      expect(getAxiomNodeIds(nodes, connections)).toEqual([]);
    });

    it("excludes note nodes from axiom list", () => {
      const nodes = [
        makeNode("node-1", { role: "axiom" }),
        makeNode("note-1", { kind: "note" }),
      ];
      expect(getAxiomNodeIds(nodes, [])).toEqual(["node-1"]);
    });
  });
});

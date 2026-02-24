import { describe, expect, it } from "vitest";
import {
  lukasiewiczSystem,
  predicateLogicSystem,
  equalityLogicSystem,
} from "../logic-core/inferenceRule";
import {
  createEmptyWorkspace,
  addNode,
  updateNodePosition,
  updateNodeFormulaText,
  updateGoalFormulaText,
  findNode,
  removeNode,
  addConnection,
  removeConnection,
  changeSystem,
  applyMPAndConnect,
} from "./workspaceState";

describe("proofWorkspace", () => {
  describe("createEmptyWorkspace", () => {
    it("creates workspace with given system", () => {
      const ws = createEmptyWorkspace(lukasiewiczSystem);
      expect(ws.system).toBe(lukasiewiczSystem);
      expect(ws.nodes).toEqual([]);
      expect(ws.connections).toEqual([]);
      expect(ws.nextNodeId).toBe(1);
    });

    it("creates workspace with predicate logic system", () => {
      const ws = createEmptyWorkspace(predicateLogicSystem);
      expect(ws.system).toBe(predicateLogicSystem);
    });

    it("creates workspace with equality logic system", () => {
      const ws = createEmptyWorkspace(equalityLogicSystem);
      expect(ws.system).toBe(equalityLogicSystem);
    });
  });

  describe("addNode", () => {
    it("adds an axiom node", () => {
      const ws = createEmptyWorkspace(lukasiewiczSystem);
      const result = addNode(ws, "axiom", "A1", { x: 100, y: 200 });
      expect(result.nodes).toHaveLength(1);
      expect(result.nodes[0]).toEqual({
        id: "node-1",
        kind: "axiom",
        label: "A1",
        formulaText: "",
        position: { x: 100, y: 200 },
      });
      expect(result.nextNodeId).toBe(2);
    });

    it("adds a node with formula text", () => {
      const ws = createEmptyWorkspace(lukasiewiczSystem);
      const result = addNode(ws, "axiom", "A1", { x: 0, y: 0 }, "phi -> phi");
      expect(result.nodes[0]!.formulaText).toBe("phi -> phi");
    });

    it("adds an MP node", () => {
      const ws = createEmptyWorkspace(lukasiewiczSystem);
      const result = addNode(ws, "mp", "MP", { x: 50, y: 50 });
      expect(result.nodes[0]!.kind).toBe("mp");
      expect(result.nodes[0]!.label).toBe("MP");
    });

    it("adds a conclusion node", () => {
      const ws = createEmptyWorkspace(lukasiewiczSystem);
      const result = addNode(ws, "conclusion", "Goal", { x: 0, y: 300 });
      expect(result.nodes[0]!.kind).toBe("conclusion");
    });

    it("increments node IDs", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 });
      ws = addNode(ws, "axiom", "A2", { x: 100, y: 0 });
      ws = addNode(ws, "mp", "MP", { x: 50, y: 100 });
      expect(ws.nodes).toHaveLength(3);
      expect(ws.nodes[0]!.id).toBe("node-1");
      expect(ws.nodes[1]!.id).toBe("node-2");
      expect(ws.nodes[2]!.id).toBe("node-3");
      expect(ws.nextNodeId).toBe(4);
    });

    it("does not mutate original state", () => {
      const ws = createEmptyWorkspace(lukasiewiczSystem);
      addNode(ws, "axiom", "A1", { x: 0, y: 0 });
      expect(ws.nodes).toHaveLength(0);
      expect(ws.nextNodeId).toBe(1);
    });
  });

  describe("updateNodePosition", () => {
    it("updates position of existing node", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 });
      const result = updateNodePosition(ws, "node-1", { x: 50, y: 75 });
      expect(result.nodes[0]!.position).toEqual({ x: 50, y: 75 });
    });

    it("does not affect other nodes", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 });
      ws = addNode(ws, "axiom", "A2", { x: 100, y: 0 });
      const result = updateNodePosition(ws, "node-1", { x: 50, y: 75 });
      expect(result.nodes[1]!.position).toEqual({ x: 100, y: 0 });
    });

    it("returns unchanged state for non-existent node", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 });
      const result = updateNodePosition(ws, "non-existent", { x: 50, y: 75 });
      expect(result.nodes[0]!.position).toEqual({ x: 0, y: 0 });
    });
  });

  describe("updateNodeFormulaText", () => {
    it("updates formula text", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 });
      const result = updateNodeFormulaText(ws, "node-1", "phi -> psi");
      expect(result.nodes[0]!.formulaText).toBe("phi -> psi");
    });

    it("does not affect other nodes", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 }, "alpha");
      ws = addNode(ws, "axiom", "A2", { x: 100, y: 0 }, "beta");
      const result = updateNodeFormulaText(ws, "node-1", "phi -> psi");
      expect(result.nodes[1]!.formulaText).toBe("beta");
    });
  });

  describe("findNode", () => {
    it("finds existing node", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 }, "phi");
      const node = findNode(ws, "node-1");
      expect(node).toBeDefined();
      expect(node!.label).toBe("A1");
    });

    it("returns undefined for non-existent node", () => {
      const ws = createEmptyWorkspace(lukasiewiczSystem);
      const node = findNode(ws, "non-existent");
      expect(node).toBeUndefined();
    });
  });

  describe("removeNode", () => {
    it("removes a node", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 });
      ws = addNode(ws, "axiom", "A2", { x: 100, y: 0 });
      const result = removeNode(ws, "node-1");
      expect(result.nodes).toHaveLength(1);
      expect(result.nodes[0]!.id).toBe("node-2");
    });

    it("removes related connections", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 });
      ws = addNode(ws, "axiom", "A2", { x: 200, y: 0 });
      ws = addNode(ws, "mp", "MP", { x: 100, y: 150 });
      ws = addConnection(ws, "node-1", "out", "node-3", "premise-left");
      ws = addConnection(ws, "node-2", "out", "node-3", "premise-right");
      const result = removeNode(ws, "node-1");
      expect(result.connections).toHaveLength(1);
      expect(result.connections[0]!.fromNodeId).toBe("node-2");
    });

    it("removes connections where removed node is the target", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 });
      ws = addNode(ws, "axiom", "A2", { x: 200, y: 0 });
      ws = addNode(ws, "mp", "MP", { x: 100, y: 150 });
      ws = addConnection(ws, "node-1", "out", "node-3", "premise-left");
      ws = addConnection(ws, "node-2", "out", "node-3", "premise-right");
      // Remove node-3 (target of both connections)
      const result = removeNode(ws, "node-3");
      expect(result.nodes).toHaveLength(2);
      expect(result.connections).toHaveLength(0);
    });

    it("does not mutate original state", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 });
      removeNode(ws, "node-1");
      expect(ws.nodes).toHaveLength(1);
    });
  });

  describe("addConnection", () => {
    it("adds a connection between nodes", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 });
      ws = addNode(ws, "mp", "MP", { x: 100, y: 100 });
      const result = addConnection(
        ws,
        "node-1",
        "out",
        "node-2",
        "premise-left",
      );
      expect(result.connections).toHaveLength(1);
      expect(result.connections[0]).toEqual({
        id: "conn-node-1-out-node-2-premise-left",
        fromNodeId: "node-1",
        fromPortId: "out",
        toNodeId: "node-2",
        toPortId: "premise-left",
      });
    });

    it("does not mutate original state", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 });
      ws = addNode(ws, "mp", "MP", { x: 100, y: 100 });
      addConnection(ws, "node-1", "out", "node-2", "premise-left");
      expect(ws.connections).toHaveLength(0);
    });
  });

  describe("removeConnection", () => {
    it("removes a connection", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 });
      ws = addNode(ws, "mp", "MP", { x: 100, y: 100 });
      ws = addConnection(ws, "node-1", "out", "node-2", "premise-left");
      const result = removeConnection(
        ws,
        "conn-node-1-out-node-2-premise-left",
      );
      expect(result.connections).toHaveLength(0);
    });

    it("does not affect other connections", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 });
      ws = addNode(ws, "axiom", "A2", { x: 200, y: 0 });
      ws = addNode(ws, "mp", "MP", { x: 100, y: 150 });
      ws = addConnection(ws, "node-1", "out", "node-3", "premise-left");
      ws = addConnection(ws, "node-2", "out", "node-3", "premise-right");
      const result = removeConnection(
        ws,
        "conn-node-1-out-node-3-premise-left",
      );
      expect(result.connections).toHaveLength(1);
      expect(result.connections[0]!.fromNodeId).toBe("node-2");
    });
  });

  describe("changeSystem", () => {
    it("changes the logic system", () => {
      const ws = createEmptyWorkspace(lukasiewiczSystem);
      const result = changeSystem(ws, predicateLogicSystem);
      expect(result.system).toBe(predicateLogicSystem);
    });

    it("preserves nodes and connections", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 });
      ws = addNode(ws, "mp", "MP", { x: 100, y: 100 });
      ws = addConnection(ws, "node-1", "out", "node-2", "premise-left");
      const result = changeSystem(ws, equalityLogicSystem);
      expect(result.nodes).toHaveLength(2);
      expect(result.connections).toHaveLength(1);
      expect(result.system).toBe(equalityLogicSystem);
    });
  });

  describe("applyMPAndConnect", () => {
    it("creates MP node with connections and validates successfully", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "axiom", "A2", { x: 200, y: 0 }, "phi -> psi");

      const result = applyMPAndConnect(ws, "node-1", "node-2", {
        x: 100,
        y: 150,
      });

      expect(result.mpNodeId).toBe("node-3");
      expect(result.validation._tag).toBe("Success");
      expect(result.workspace.nodes).toHaveLength(3);
      expect(result.workspace.connections).toHaveLength(2);

      // MP node should have conclusion formula text set
      const mpNode = findNode(result.workspace, "node-3");
      expect(mpNode).toBeDefined();
      expect(mpNode!.kind).toBe("mp");
      expect(mpNode!.label).toBe("MP");
      expect(mpNode!.formulaText).toBe("ψ");
    });

    it("creates connections from source nodes to MP node", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "axiom", "A2", { x: 200, y: 0 }, "phi -> psi");

      const result = applyMPAndConnect(ws, "node-1", "node-2", {
        x: 100,
        y: 150,
      });

      const leftConn = result.workspace.connections.find(
        (c) => c.toPortId === "premise-left",
      );
      const rightConn = result.workspace.connections.find(
        (c) => c.toPortId === "premise-right",
      );
      expect(leftConn).toBeDefined();
      expect(leftConn!.fromNodeId).toBe("node-1");
      expect(rightConn).toBeDefined();
      expect(rightConn!.fromNodeId).toBe("node-2");
    });

    it("returns error when right premise is not an implication", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "axiom", "A2", { x: 200, y: 0 }, "psi");

      const result = applyMPAndConnect(ws, "node-1", "node-2", {
        x: 100,
        y: 150,
      });

      expect(result.validation._tag).toBe("RuleError");
      // Node should still be created but formula text should be empty
      const mpNode = findNode(result.workspace, "node-3");
      expect(mpNode).toBeDefined();
      expect(mpNode!.formulaText).toBe("");
    });

    it("returns error when premises do not match", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "axiom", "A2", { x: 200, y: 0 }, "psi -> chi");

      const result = applyMPAndConnect(ws, "node-1", "node-2", {
        x: 100,
        y: 150,
      });

      expect(result.validation._tag).toBe("RuleError");
    });

    it("returns error when left formula is empty", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 }, "");
      ws = addNode(ws, "axiom", "A2", { x: 200, y: 0 }, "phi -> psi");

      const result = applyMPAndConnect(ws, "node-1", "node-2", {
        x: 100,
        y: 150,
      });

      expect(result.validation._tag).toBe("LeftParseError");
    });

    it("does not mutate original state", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "axiom", "A2", { x: 200, y: 0 }, "phi -> psi");

      applyMPAndConnect(ws, "node-1", "node-2", { x: 100, y: 150 });

      expect(ws.nodes).toHaveLength(2);
      expect(ws.connections).toHaveLength(0);
    });
  });

  describe("goalFormulaText", () => {
    it("initializes with empty goal formula text", () => {
      const ws = createEmptyWorkspace(lukasiewiczSystem);
      expect(ws.goalFormulaText).toBe("");
    });

    it("updates goal formula text", () => {
      const ws = createEmptyWorkspace(lukasiewiczSystem);
      const result = updateGoalFormulaText(ws, "phi -> phi");
      expect(result.goalFormulaText).toBe("phi -> phi");
    });

    it("clears goal formula text", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = updateGoalFormulaText(ws, "phi -> phi");
      const result = updateGoalFormulaText(ws, "");
      expect(result.goalFormulaText).toBe("");
    });

    it("does not affect other fields", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 }, "phi");
      const result = updateGoalFormulaText(ws, "phi -> phi");
      expect(result.nodes).toHaveLength(1);
      expect(result.system).toBe(lukasiewiczSystem);
    });

    it("does not mutate original state", () => {
      const ws = createEmptyWorkspace(lukasiewiczSystem);
      updateGoalFormulaText(ws, "phi -> phi");
      expect(ws.goalFormulaText).toBe("");
    });
  });
});

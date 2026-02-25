import { describe, expect, it } from "vitest";
import {
  lukasiewiczSystem,
  predicateLogicSystem,
  equalityLogicSystem,
} from "../logic-core/inferenceRule";
import {
  createEmptyWorkspace,
  createQuestWorkspace,
  convertToFreeMode,
  isNodeProtected,
  addNode,
  updateNodePosition,
  updateNodeFormulaText,
  updateNodeGenVariableName,
  updateNodeRole,
  updateGoalFormulaText,
  findNode,
  removeNode,
  addConnection,
  removeConnection,
  changeSystem,
  applyMPAndConnect,
  applyGenAndConnect,
  copySelectedNodes,
  pasteNodes,
  removeSelectedNodes,
} from "./workspaceState";
import type { ClipboardData } from "./copyPasteLogic";

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

  describe("updateNodeGenVariableName", () => {
    it("updates gen variable name on a node", () => {
      let ws = createEmptyWorkspace(predicateLogicSystem);
      ws = addNode(ws, "gen", "Gen", { x: 0, y: 0 });
      const result = updateNodeGenVariableName(ws, "node-1", "x");
      expect(result.nodes[0]!.genVariableName).toBe("x");
    });

    it("does not affect other nodes", () => {
      let ws = createEmptyWorkspace(predicateLogicSystem);
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "gen", "Gen", { x: 100, y: 100 });
      const result = updateNodeGenVariableName(ws, "node-2", "x");
      expect(result.nodes[0]!.genVariableName).toBeUndefined();
      expect(result.nodes[1]!.genVariableName).toBe("x");
    });
  });

  describe("applyGenAndConnect", () => {
    it("creates Gen node with connection and validates successfully", () => {
      let ws = createEmptyWorkspace(predicateLogicSystem);
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 }, "phi");

      const result = applyGenAndConnect(ws, "node-1", "x", {
        x: 0,
        y: 150,
      });

      expect(result.genNodeId).toBe("node-2");
      expect(result.validation._tag).toBe("Success");
      expect(result.workspace.nodes).toHaveLength(2);
      expect(result.workspace.connections).toHaveLength(1);

      const genNode = findNode(result.workspace, "node-2");
      expect(genNode).toBeDefined();
      expect(genNode!.kind).toBe("gen");
      expect(genNode!.label).toBe("Gen");
      expect(genNode!.formulaText).toBe("∀x.φ");
      expect(genNode!.genVariableName).toBe("x");
    });

    it("creates connection from source to Gen node", () => {
      let ws = createEmptyWorkspace(predicateLogicSystem);
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 }, "phi");

      const result = applyGenAndConnect(ws, "node-1", "x", {
        x: 0,
        y: 150,
      });

      const conn = result.workspace.connections[0];
      expect(conn!.fromNodeId).toBe("node-1");
      expect(conn!.fromPortId).toBe("out");
      expect(conn!.toNodeId).toBe("node-2");
      expect(conn!.toPortId).toBe("premise");
    });

    it("returns error when Gen is not enabled", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 }, "phi");

      const result = applyGenAndConnect(ws, "node-1", "x", {
        x: 0,
        y: 150,
      });

      expect(result.validation._tag).toBe("GeneralizationNotEnabled");
      const genNode = findNode(result.workspace, "node-2");
      expect(genNode!.formulaText).toBe("");
    });

    it("returns error when premise is empty", () => {
      let ws = createEmptyWorkspace(predicateLogicSystem);
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 }, "");

      const result = applyGenAndConnect(ws, "node-1", "x", {
        x: 0,
        y: 150,
      });

      expect(result.validation._tag).toBe("PremiseParseError");
    });

    it("does not mutate original state", () => {
      let ws = createEmptyWorkspace(predicateLogicSystem);
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 }, "phi");

      applyGenAndConnect(ws, "node-1", "x", { x: 0, y: 150 });

      expect(ws.nodes).toHaveLength(1);
      expect(ws.connections).toHaveLength(0);
    });
  });

  describe("updateNodeRole", () => {
    it("sets role to 'axiom'", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 }, "phi");
      const result = updateNodeRole(ws, "node-1", "axiom");
      expect(result.nodes[0]!.role).toBe("axiom");
    });

    it("sets role to 'goal'", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 }, "phi");
      const result = updateNodeRole(ws, "node-1", "goal");
      expect(result.nodes[0]!.role).toBe("goal");
    });

    it("clears role by setting to undefined", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 }, "phi");
      ws = updateNodeRole(ws, "node-1", "axiom");
      const result = updateNodeRole(ws, "node-1", undefined);
      expect(result.nodes[0]!.role).toBeUndefined();
    });

    it("does not affect other nodes", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "axiom", "A2", { x: 100, y: 0 }, "psi");
      const result = updateNodeRole(ws, "node-1", "goal");
      expect(result.nodes[0]!.role).toBe("goal");
      expect(result.nodes[1]!.role).toBeUndefined();
    });

    it("does not mutate original state", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 }, "phi");
      updateNodeRole(ws, "node-1", "axiom");
      expect(ws.nodes[0]!.role).toBeUndefined();
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

  describe("workspace mode", () => {
    it("createEmptyWorkspace creates free mode workspace", () => {
      const ws = createEmptyWorkspace(lukasiewiczSystem);
      expect(ws.mode).toBe("free");
    });
  });

  describe("createQuestWorkspace", () => {
    it("creates quest mode workspace with goal nodes", () => {
      const ws = createQuestWorkspace(lukasiewiczSystem, [
        { formulaText: "phi -> phi", position: { x: 0, y: 0 } },
      ]);
      expect(ws.mode).toBe("quest");
      expect(ws.nodes).toHaveLength(1);
      expect(ws.nodes[0]!.formulaText).toBe("phi -> phi");
      expect(ws.nodes[0]!.role).toBe("goal");
      expect(ws.nodes[0]!.protection).toBe("quest-goal");
      expect(ws.nodes[0]!.kind).toBe("axiom");
    });

    it("creates multiple goal nodes", () => {
      const ws = createQuestWorkspace(lukasiewiczSystem, [
        { formulaText: "phi -> phi", position: { x: 0, y: 0 } },
        {
          formulaText: "psi -> phi -> psi",
          position: { x: 200, y: 0 },
          label: "Goal 2",
        },
      ]);
      expect(ws.nodes).toHaveLength(2);
      expect(ws.nodes[0]!.id).toBe("node-1");
      expect(ws.nodes[1]!.id).toBe("node-2");
      expect(ws.nodes[1]!.label).toBe("Goal 2");
      expect(ws.nextNodeId).toBe(3);
    });

    it("uses default label when not specified", () => {
      const ws = createQuestWorkspace(lukasiewiczSystem, [
        { formulaText: "phi", position: { x: 0, y: 0 } },
      ]);
      expect(ws.nodes[0]!.label).toBe("Quest Goal");
    });

    it("creates empty quest workspace with no goals", () => {
      const ws = createQuestWorkspace(lukasiewiczSystem, []);
      expect(ws.mode).toBe("quest");
      expect(ws.nodes).toHaveLength(0);
    });
  });

  describe("isNodeProtected", () => {
    it("returns false for free mode nodes", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 0, y: 0 });
      expect(isNodeProtected(ws, "node-1")).toBe(false);
    });

    it("returns true for quest-goal nodes in quest mode", () => {
      const ws = createQuestWorkspace(lukasiewiczSystem, [
        { formulaText: "phi", position: { x: 0, y: 0 } },
      ]);
      expect(isNodeProtected(ws, "node-1")).toBe(true);
    });

    it("returns false for non-protected nodes in quest mode", () => {
      let ws = createQuestWorkspace(lukasiewiczSystem, [
        { formulaText: "phi", position: { x: 0, y: 0 } },
      ]);
      ws = addNode(ws, "axiom", "A2", { x: 100, y: 0 });
      expect(isNodeProtected(ws, "node-2")).toBe(false);
    });

    it("returns false for non-existent node", () => {
      const ws = createQuestWorkspace(lukasiewiczSystem, [
        { formulaText: "phi", position: { x: 0, y: 0 } },
      ]);
      expect(isNodeProtected(ws, "non-existent")).toBe(false);
    });
  });

  describe("quest mode protection", () => {
    it("prevents removing protected nodes in quest mode", () => {
      const ws = createQuestWorkspace(lukasiewiczSystem, [
        { formulaText: "phi", position: { x: 0, y: 0 } },
      ]);
      const result = removeNode(ws, "node-1");
      expect(result.nodes).toHaveLength(1);
      expect(result).toBe(ws);
    });

    it("allows removing non-protected nodes in quest mode", () => {
      let ws = createQuestWorkspace(lukasiewiczSystem, [
        { formulaText: "phi", position: { x: 0, y: 0 } },
      ]);
      ws = addNode(ws, "axiom", "A2", { x: 100, y: 0 });
      const result = removeNode(ws, "node-2");
      expect(result.nodes).toHaveLength(1);
      expect(result.nodes[0]!.id).toBe("node-1");
    });

    it("prevents updating formula text of protected nodes", () => {
      const ws = createQuestWorkspace(lukasiewiczSystem, [
        { formulaText: "phi", position: { x: 0, y: 0 } },
      ]);
      const result = updateNodeFormulaText(ws, "node-1", "psi");
      expect(result.nodes[0]!.formulaText).toBe("phi");
      expect(result).toBe(ws);
    });

    it("allows updating formula text of non-protected nodes", () => {
      let ws = createQuestWorkspace(lukasiewiczSystem, [
        { formulaText: "phi", position: { x: 0, y: 0 } },
      ]);
      ws = addNode(ws, "axiom", "A2", { x: 100, y: 0 });
      const result = updateNodeFormulaText(ws, "node-2", "psi");
      expect(result.nodes[1]!.formulaText).toBe("psi");
    });

    it("prevents updating role of protected nodes", () => {
      const ws = createQuestWorkspace(lukasiewiczSystem, [
        { formulaText: "phi", position: { x: 0, y: 0 } },
      ]);
      const result = updateNodeRole(ws, "node-1", "axiom");
      expect(result.nodes[0]!.role).toBe("goal");
      expect(result).toBe(ws);
    });

    it("allows updating position of protected nodes (drag is allowed)", () => {
      const ws = createQuestWorkspace(lukasiewiczSystem, [
        { formulaText: "phi", position: { x: 0, y: 0 } },
      ]);
      const result = updateNodePosition(ws, "node-1", { x: 100, y: 100 });
      expect(result.nodes[0]!.position).toEqual({ x: 100, y: 100 });
    });
  });

  describe("convertToFreeMode", () => {
    it("converts quest mode to free mode", () => {
      const ws = createQuestWorkspace(lukasiewiczSystem, [
        { formulaText: "phi", position: { x: 0, y: 0 } },
      ]);
      const result = convertToFreeMode(ws);
      expect(result.mode).toBe("free");
    });

    it("removes protection from all nodes", () => {
      const ws = createQuestWorkspace(lukasiewiczSystem, [
        { formulaText: "phi", position: { x: 0, y: 0 } },
        { formulaText: "psi", position: { x: 200, y: 0 } },
      ]);
      const result = convertToFreeMode(ws);
      expect(result.nodes[0]!.protection).toBeUndefined();
      expect(result.nodes[1]!.protection).toBeUndefined();
    });

    it("preserves node data after conversion", () => {
      const ws = createQuestWorkspace(lukasiewiczSystem, [
        { formulaText: "phi -> phi", position: { x: 50, y: 100 } },
      ]);
      const result = convertToFreeMode(ws);
      expect(result.nodes[0]!.formulaText).toBe("phi -> phi");
      expect(result.nodes[0]!.position).toEqual({ x: 50, y: 100 });
      expect(result.nodes[0]!.role).toBe("goal");
    });

    it("allows editing after conversion", () => {
      const ws = createQuestWorkspace(lukasiewiczSystem, [
        { formulaText: "phi", position: { x: 0, y: 0 } },
      ]);
      let freeWs = convertToFreeMode(ws);
      freeWs = updateNodeFormulaText(freeWs, "node-1", "psi");
      expect(freeWs.nodes[0]!.formulaText).toBe("psi");
    });

    it("allows deletion after conversion", () => {
      const ws = createQuestWorkspace(lukasiewiczSystem, [
        { formulaText: "phi", position: { x: 0, y: 0 } },
      ]);
      let freeWs = convertToFreeMode(ws);
      freeWs = removeNode(freeWs, "node-1");
      expect(freeWs.nodes).toHaveLength(0);
    });

    it("returns same state if already free mode", () => {
      const ws = createEmptyWorkspace(lukasiewiczSystem);
      const result = convertToFreeMode(ws);
      expect(result).toBe(ws);
    });

    it("preserves non-protected nodes during conversion", () => {
      let ws = createQuestWorkspace(lukasiewiczSystem, [
        { formulaText: "phi", position: { x: 0, y: 0 } },
      ]);
      ws = addNode(ws, "axiom", "A2", { x: 100, y: 0 }, "psi");
      const result = convertToFreeMode(ws);
      expect(result.nodes).toHaveLength(2);
      // Protected node: protection cleared
      expect(result.nodes[0]!.protection).toBeUndefined();
      // Non-protected node: unchanged
      expect(result.nodes[1]!.formulaText).toBe("psi");
      expect(result.nodes[1]!.protection).toBeUndefined();
    });

    it("does not mutate original state", () => {
      const ws = createQuestWorkspace(lukasiewiczSystem, [
        { formulaText: "phi", position: { x: 0, y: 0 } },
      ]);
      convertToFreeMode(ws);
      expect(ws.mode).toBe("quest");
      expect(ws.nodes[0]!.protection).toBe("quest-goal");
    });
  });

  describe("copySelectedNodes", () => {
    it("copies selected nodes into clipboard data", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 100, y: 100 }, "phi -> psi");
      ws = addNode(ws, "axiom", "A2", { x: 300, y: 100 }, "phi");
      const clipboard = copySelectedNodes(ws, new Set(["node-1", "node-2"]));
      expect(clipboard._tag).toBe("ProofPadClipboard");
      expect(clipboard.nodes).toHaveLength(2);
    });

    it("includes connections between selected nodes only", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 100, y: 100 }, "phi");
      ws = addNode(ws, "axiom", "A2", { x: 300, y: 100 }, "phi -> psi");
      const mpResult = applyMPAndConnect(ws, "node-1", "node-2", {
        x: 200,
        y: 300,
      });
      ws = mpResult.workspace;

      // All 3 selected: both connections included
      const clipboard = copySelectedNodes(
        ws,
        new Set(["node-1", "node-2", "node-3"]),
      );
      expect(clipboard.connections).toHaveLength(2);

      // Only 2 selected: no connections (MP node not selected)
      const clipboardPartial = copySelectedNodes(
        ws,
        new Set(["node-1", "node-2"]),
      );
      expect(clipboardPartial.connections).toHaveLength(0);
    });
  });

  describe("pasteNodes", () => {
    it("pastes nodes with new IDs into workspace", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 100, y: 100 }, "phi");
      const clipboard = copySelectedNodes(ws, new Set(["node-1"]));
      const result = pasteNodes(ws, clipboard, { x: 500, y: 500 });
      expect(result.nodes).toHaveLength(2);
      expect(result.nodes[1]!.id).toBe("node-2");
      expect(result.nodes[1]!.formulaText).toBe("phi");
      expect(result.nextNodeId).toBe(3);
    });

    it("preserves connections between pasted nodes", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 100, y: 100 }, "phi");
      ws = addNode(
        ws,
        "axiom",
        "A2",
        { x: 300, y: 100 },
        "phi -> psi",
      );
      const mpResult = applyMPAndConnect(ws, "node-1", "node-2", {
        x: 200,
        y: 300,
      });
      ws = mpResult.workspace;

      const clipboard = copySelectedNodes(
        ws,
        new Set(["node-1", "node-2", "node-3"]),
      );
      const result = pasteNodes(ws, clipboard, { x: 600, y: 600 });

      // Original 3 nodes + 3 pasted = 6
      expect(result.nodes).toHaveLength(6);
      // Original 2 connections + 2 pasted = 4
      expect(result.connections).toHaveLength(4);
      // New connections reference new IDs
      const newConns = result.connections.filter(
        (c) => c.fromNodeId.startsWith("node-4") || c.fromNodeId.startsWith("node-5"),
      );
      expect(newConns.length).toBeGreaterThanOrEqual(1);
    });

    it("does not paste protection status", () => {
      const ws = createQuestWorkspace(lukasiewiczSystem, [
        { formulaText: "phi", position: { x: 0, y: 0 } },
      ]);
      const clipboard = copySelectedNodes(ws, new Set(["node-1"]));
      const result = pasteNodes(ws, clipboard, { x: 500, y: 500 });
      expect(result.nodes[1]!.protection).toBeUndefined();
    });

    it("handles empty clipboard data", () => {
      const ws = createEmptyWorkspace(lukasiewiczSystem);
      const emptyClipboard: ClipboardData = {
        _tag: "ProofPadClipboard",
        version: 1,
        nodes: [],
        connections: [],
      };
      const result = pasteNodes(ws, emptyClipboard, { x: 0, y: 0 });
      expect(result.nodes).toHaveLength(0);
      expect(result.connections).toHaveLength(0);
    });
  });

  describe("removeSelectedNodes", () => {
    it("removes selected nodes and their connections", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 100, y: 100 }, "phi");
      ws = addNode(ws, "axiom", "A2", { x: 300, y: 100 }, "phi -> psi");
      const mpResult = applyMPAndConnect(ws, "node-1", "node-2", {
        x: 200,
        y: 300,
      });
      ws = mpResult.workspace;

      // Remove node-1 and node-3
      const result = removeSelectedNodes(ws, new Set(["node-1", "node-3"]));
      expect(result.nodes).toHaveLength(1);
      expect(result.nodes[0]!.id).toBe("node-2");
      // All connections involving node-1 or node-3 should be removed
      expect(result.connections).toHaveLength(0);
    });

    it("skips protected nodes", () => {
      const ws = createQuestWorkspace(lukasiewiczSystem, [
        { formulaText: "phi", position: { x: 0, y: 0 } },
      ]);
      const result = removeSelectedNodes(ws, new Set(["node-1"]));
      // Protected node should not be removed
      expect(result.nodes).toHaveLength(1);
    });

    it("returns unchanged state when no removable nodes", () => {
      const ws = createQuestWorkspace(lukasiewiczSystem, [
        { formulaText: "phi", position: { x: 0, y: 0 } },
      ]);
      const result = removeSelectedNodes(ws, new Set(["node-1"]));
      expect(result).toBe(ws);
    });

    it("handles empty selection", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 100, y: 100 });
      const result = removeSelectedNodes(ws, new Set());
      expect(result).toBe(ws);
    });

    it("removes only selected, keeps unselected", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A1", { x: 100, y: 100 });
      ws = addNode(ws, "axiom", "A2", { x: 300, y: 100 });
      ws = addNode(ws, "axiom", "A3", { x: 500, y: 100 });
      const result = removeSelectedNodes(ws, new Set(["node-2"]));
      expect(result.nodes).toHaveLength(2);
      expect(result.nodes[0]!.id).toBe("node-1");
      expect(result.nodes[1]!.id).toBe("node-3");
    });
  });
});

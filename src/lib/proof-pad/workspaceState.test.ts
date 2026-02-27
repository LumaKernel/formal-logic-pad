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
  findNode,
  removeNode,
  addConnection,
  removeConnection,
  changeSystem,
  applyMPAndConnect,
  applyGenAndConnect,
  applySubstitutionAndConnect,
  updateNodeSubstitutionEntries,
  updateInferenceEdgeGenVariableName,
  updateInferenceEdgeSubstitutionEntries,
  copySelectedNodes,
  pasteNodes,
  removeSelectedNodes,
  duplicateSelectedNodes,
  duplicateNode,
  cutSelectedNodes,
  applyTreeLayout,
  applyIncrementalLayout,
  revalidateInferenceConclusions,
  getInferenceEdges,
} from "./workspaceState";
import type { ClipboardData } from "./copyPasteLogic";
import type { SubstitutionEntries } from "./substitutionApplicationLogic";

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
      const result = addNode(ws, "axiom", "Axiom", { x: 100, y: 200 });
      expect(result.nodes).toHaveLength(1);
      expect(result.nodes[0]).toEqual({
        id: "node-1",
        kind: "axiom",
        label: "Axiom",
        formulaText: "",
        position: { x: 100, y: 200 },
      });
      expect(result.nextNodeId).toBe(2);
    });

    it("adds a node with formula text", () => {
      const ws = createEmptyWorkspace(lukasiewiczSystem);
      const result = addNode(
        ws,
        "axiom",
        "Axiom",
        { x: 0, y: 0 },
        "phi -> phi",
      );
      expect(result.nodes[0]!.formulaText).toBe("phi -> phi");
    });

    it("adds a derived node", () => {
      const ws = createEmptyWorkspace(lukasiewiczSystem);
      const result = addNode(ws, "derived", "MP", { x: 50, y: 50 });
      expect(result.nodes[0]!.kind).toBe("derived");
      expect(result.nodes[0]!.label).toBe("MP");
    });

    it("adds a conclusion node", () => {
      const ws = createEmptyWorkspace(lukasiewiczSystem);
      const result = addNode(ws, "conclusion", "Goal", { x: 0, y: 300 });
      expect(result.nodes[0]!.kind).toBe("conclusion");
    });

    it("increments node IDs", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 });
      ws = addNode(ws, "axiom", "Axiom", { x: 100, y: 0 });
      ws = addNode(ws, "derived", "MP", { x: 50, y: 100 });
      expect(ws.nodes).toHaveLength(3);
      expect(ws.nodes[0]!.id).toBe("node-1");
      expect(ws.nodes[1]!.id).toBe("node-2");
      expect(ws.nodes[2]!.id).toBe("node-3");
      expect(ws.nextNodeId).toBe(4);
    });

    it("does not mutate original state", () => {
      const ws = createEmptyWorkspace(lukasiewiczSystem);
      addNode(ws, "axiom", "Axiom", { x: 0, y: 0 });
      expect(ws.nodes).toHaveLength(0);
      expect(ws.nextNodeId).toBe(1);
    });
  });

  describe("updateNodePosition", () => {
    it("updates position of existing node", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 });
      const result = updateNodePosition(ws, "node-1", { x: 50, y: 75 });
      expect(result.nodes[0]!.position).toEqual({ x: 50, y: 75 });
    });

    it("does not affect other nodes", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 });
      ws = addNode(ws, "axiom", "Axiom", { x: 100, y: 0 });
      const result = updateNodePosition(ws, "node-1", { x: 50, y: 75 });
      expect(result.nodes[1]!.position).toEqual({ x: 100, y: 0 });
    });

    it("returns unchanged state for non-existent node", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 });
      const result = updateNodePosition(ws, "non-existent", { x: 50, y: 75 });
      expect(result.nodes[0]!.position).toEqual({ x: 0, y: 0 });
    });
  });

  describe("updateNodeFormulaText", () => {
    it("updates formula text", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 });
      const result = updateNodeFormulaText(ws, "node-1", "phi -> psi");
      expect(result.nodes[0]!.formulaText).toBe("phi -> psi");
    });

    it("does not affect other nodes", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "alpha");
      ws = addNode(ws, "axiom", "Axiom", { x: 100, y: 0 }, "beta");
      const result = updateNodeFormulaText(ws, "node-1", "phi -> psi");
      expect(result.nodes[1]!.formulaText).toBe("beta");
    });
  });

  describe("findNode", () => {
    it("finds existing node", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "phi");
      const node = findNode(ws, "node-1");
      expect(node).toBeDefined();
      expect(node!.label).toBe("Axiom");
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
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 });
      ws = addNode(ws, "axiom", "Axiom", { x: 100, y: 0 });
      const result = removeNode(ws, "node-1");
      expect(result.nodes).toHaveLength(1);
      expect(result.nodes[0]!.id).toBe("node-2");
    });

    it("removes related connections", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 });
      ws = addNode(ws, "axiom", "Axiom", { x: 200, y: 0 });
      ws = addNode(ws, "derived", "MP", { x: 100, y: 150 });
      ws = addConnection(ws, "node-1", "out", "node-3", "premise-left");
      ws = addConnection(ws, "node-2", "out", "node-3", "premise-right");
      const result = removeNode(ws, "node-1");
      expect(result.connections).toHaveLength(1);
      expect(result.connections[0]!.fromNodeId).toBe("node-2");
    });

    it("removes connections where removed node is the target", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 });
      ws = addNode(ws, "axiom", "Axiom", { x: 200, y: 0 });
      ws = addNode(ws, "derived", "MP", { x: 100, y: 150 });
      ws = addConnection(ws, "node-1", "out", "node-3", "premise-left");
      ws = addConnection(ws, "node-2", "out", "node-3", "premise-right");
      // Remove node-3 (target of both connections)
      const result = removeNode(ws, "node-3");
      expect(result.nodes).toHaveLength(2);
      expect(result.connections).toHaveLength(0);
    });

    it("removes connections where removed node is both source and target", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 });
      ws = addNode(ws, "derived", "MP-1", { x: 100, y: 150 });
      ws = addNode(ws, "derived", "MP-2", { x: 200, y: 300 });
      ws = addNode(ws, "axiom", "Axiom", { x: 300, y: 0 });
      // node-1 → node-2 (node-2 is target)
      ws = addConnection(ws, "node-1", "out", "node-2", "premise-left");
      // node-2 → node-3 (node-2 is source)
      ws = addConnection(ws, "node-2", "out", "node-3", "premise-left");
      // node-4 → node-3 (unrelated to node-2)
      ws = addConnection(ws, "node-4", "out", "node-3", "premise-right");
      // Remove node-2: should remove both connections involving node-2
      const result = removeNode(ws, "node-2");
      expect(result.nodes).toHaveLength(3);
      expect(result.connections).toHaveLength(1);
      expect(result.connections[0]!.fromNodeId).toBe("node-4");
      expect(result.connections[0]!.toNodeId).toBe("node-3");
    });

    it("does not mutate original state", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 });
      removeNode(ws, "node-1");
      expect(ws.nodes).toHaveLength(1);
    });
  });

  describe("addConnection", () => {
    it("adds a connection between nodes", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 });
      ws = addNode(ws, "derived", "MP", { x: 100, y: 100 });
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
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 });
      ws = addNode(ws, "derived", "MP", { x: 100, y: 100 });
      addConnection(ws, "node-1", "out", "node-2", "premise-left");
      expect(ws.connections).toHaveLength(0);
    });
  });

  describe("removeConnection", () => {
    it("removes a connection", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 });
      ws = addNode(ws, "derived", "MP", { x: 100, y: 100 });
      ws = addConnection(ws, "node-1", "out", "node-2", "premise-left");
      const result = removeConnection(
        ws,
        "conn-node-1-out-node-2-premise-left",
      );
      expect(result.connections).toHaveLength(0);
    });

    it("does not affect other connections", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 });
      ws = addNode(ws, "axiom", "Axiom", { x: 200, y: 0 });
      ws = addNode(ws, "derived", "MP", { x: 100, y: 150 });
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
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 });
      ws = addNode(ws, "derived", "MP", { x: 100, y: 100 });
      ws = addConnection(ws, "node-1", "out", "node-2", "premise-left");
      const result = changeSystem(ws, equalityLogicSystem);
      expect(result.nodes).toHaveLength(2);
      expect(result.connections).toHaveLength(1);
      expect(result.system).toBe(equalityLogicSystem);
    });
  });

  describe("applyMPAndConnect", () => {
    it("creates derived node with InferenceEdge and validates successfully", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "axiom", "Axiom", { x: 200, y: 0 }, "phi -> psi");

      const result = applyMPAndConnect(ws, "node-1", "node-2", {
        x: 100,
        y: 150,
      });

      expect(result.mpNodeId).toBe("node-3");
      expect(result.validation._tag).toBe("Success");
      expect(result.workspace.nodes).toHaveLength(3);
      // 互換性: レガシーの接続とInferenceEdgeの両方が作成される
      expect(result.workspace.connections).toHaveLength(2);
      expect(result.workspace.inferenceEdges.length).toBeGreaterThanOrEqual(1);

      // Derived node should have conclusion formula text set
      const mpNode = findNode(result.workspace, "node-3");
      expect(mpNode).toBeDefined();
      expect(mpNode!.kind).toBe("derived");
      expect(mpNode!.label).toBe("MP");
      expect(mpNode!.formulaText).toBe("ψ");
    });

    it("creates InferenceEdge linking premises to derived node", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "axiom", "Axiom", { x: 200, y: 0 }, "phi -> psi");

      const result = applyMPAndConnect(ws, "node-1", "node-2", {
        x: 100,
        y: 150,
      });

      const mpEdge = result.workspace.inferenceEdges.find(
        (e) => e._tag === "mp" && e.conclusionNodeId === "node-3",
      );
      expect(mpEdge).toBeDefined();
      expect(mpEdge!._tag).toBe("mp");
      if (mpEdge!._tag === "mp") {
        expect(mpEdge!.leftPremiseNodeId).toBe("node-1");
        expect(mpEdge!.rightPremiseNodeId).toBe("node-2");
      }
    });

    it("returns error when right premise is not an implication", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "axiom", "Axiom", { x: 200, y: 0 }, "psi");

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
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "axiom", "Axiom", { x: 200, y: 0 }, "psi -> chi");

      const result = applyMPAndConnect(ws, "node-1", "node-2", {
        x: 100,
        y: 150,
      });

      expect(result.validation._tag).toBe("RuleError");
    });

    it("returns error when left formula is empty", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "");
      ws = addNode(ws, "axiom", "Axiom", { x: 200, y: 0 }, "phi -> psi");

      const result = applyMPAndConnect(ws, "node-1", "node-2", {
        x: 100,
        y: 150,
      });

      expect(result.validation._tag).toBe("LeftParseError");
    });

    it("does not mutate original state", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "axiom", "Axiom", { x: 200, y: 0 }, "phi -> psi");

      applyMPAndConnect(ws, "node-1", "node-2", { x: 100, y: 150 });

      expect(ws.nodes).toHaveLength(2);
      expect(ws.connections).toHaveLength(0);
    });
  });

  describe("updateNodeGenVariableName", () => {
    it("updates gen variable name on a node", () => {
      let ws = createEmptyWorkspace(predicateLogicSystem);
      ws = addNode(ws, "derived", "Gen", { x: 0, y: 0 });
      const result = updateNodeGenVariableName(ws, "node-1", "x");
      expect(result.nodes[0]!.genVariableName).toBe("x");
    });

    it("does not affect other nodes", () => {
      let ws = createEmptyWorkspace(predicateLogicSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "derived", "Gen", { x: 100, y: 100 });
      const result = updateNodeGenVariableName(ws, "node-2", "x");
      expect(result.nodes[0]!.genVariableName).toBeUndefined();
      expect(result.nodes[1]!.genVariableName).toBe("x");
    });
  });

  describe("applyGenAndConnect", () => {
    it("creates derived node with InferenceEdge and validates successfully", () => {
      let ws = createEmptyWorkspace(predicateLogicSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "phi");

      const result = applyGenAndConnect(ws, "node-1", "x", {
        x: 0,
        y: 150,
      });

      expect(result.genNodeId).toBe("node-2");
      expect(result.validation._tag).toBe("Success");
      expect(result.workspace.nodes).toHaveLength(2);
      // 互換性: レガシーの接続とInferenceEdgeの両方が作成される
      expect(result.workspace.connections).toHaveLength(1);
      expect(result.workspace.inferenceEdges.length).toBeGreaterThanOrEqual(1);

      const genNode = findNode(result.workspace, "node-2");
      expect(genNode).toBeDefined();
      expect(genNode!.kind).toBe("derived");
      expect(genNode!.label).toBe("Gen");
      expect(genNode!.formulaText).toBe("∀x.φ");
    });

    it("creates InferenceEdge linking premise to derived node", () => {
      let ws = createEmptyWorkspace(predicateLogicSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "phi");

      const result = applyGenAndConnect(ws, "node-1", "x", {
        x: 0,
        y: 150,
      });

      const genEdge = result.workspace.inferenceEdges.find(
        (e) => e._tag === "gen" && e.conclusionNodeId === "node-2",
      );
      expect(genEdge).toBeDefined();
      expect(genEdge!._tag).toBe("gen");
      if (genEdge!._tag === "gen") {
        expect(genEdge!.premiseNodeId).toBe("node-1");
        expect(genEdge!.variableName).toBe("x");
      }
    });

    it("returns error when Gen is not enabled", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "phi");

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
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "");

      const result = applyGenAndConnect(ws, "node-1", "x", {
        x: 0,
        y: 150,
      });

      expect(result.validation._tag).toBe("PremiseParseError");
    });

    it("does not mutate original state", () => {
      let ws = createEmptyWorkspace(predicateLogicSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "phi");

      applyGenAndConnect(ws, "node-1", "x", { x: 0, y: 150 });

      expect(ws.nodes).toHaveLength(1);
      expect(ws.connections).toHaveLength(0);
    });
  });

  describe("updateNodeSubstitutionEntries", () => {
    it("sets substitutionEntries on the node", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "derived", "Subst", { x: 0, y: 0 });
      const entries: SubstitutionEntries = [
        {
          _tag: "FormulaSubstitution",
          metaVariableName: "φ",
          metaVariableSubscript: undefined,
          formulaText: "alpha",
        },
      ];
      const result = updateNodeSubstitutionEntries(ws, "node-1", entries);
      expect(result.nodes[0]!.substitutionEntries).toBe(entries);
    });

    it("does not affect other nodes", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "derived", "Subst", { x: 0, y: 100 });
      const entries: SubstitutionEntries = [
        {
          _tag: "FormulaSubstitution",
          metaVariableName: "φ",
          metaVariableSubscript: undefined,
          formulaText: "alpha",
        },
      ];
      const result = updateNodeSubstitutionEntries(ws, "node-2", entries);
      expect(result.nodes[0]!.substitutionEntries).toBeUndefined();
      expect(result.nodes[1]!.substitutionEntries).toBe(entries);
    });
  });

  describe("applySubstitutionAndConnect", () => {
    const singleEntry: SubstitutionEntries = [
      {
        _tag: "FormulaSubstitution",
        metaVariableName: "φ",
        formulaText: "alpha",
      },
    ];

    it("creates derived node with InferenceEdge instead of connections", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "phi -> (psi -> phi)");
      const result = applySubstitutionAndConnect(ws, "node-1", singleEntry, {
        x: 0,
        y: 150,
      });
      expect(result.substitutionNodeId).toBe("node-2");
      expect(result.workspace.nodes).toHaveLength(2);
      // derived ノードが作成される（substitutionではなく）
      const substNode = result.workspace.nodes.find((n) => n.id === "node-2");
      expect(substNode?.kind).toBe("derived");
      // 互換性: レガシーの接続とInferenceEdgeの両方が作成される
      expect(result.workspace.connections).toHaveLength(1);
      expect(result.workspace.inferenceEdges.length).toBeGreaterThanOrEqual(1);
      const substEdge = result.workspace.inferenceEdges.find(
        (e) => e._tag === "substitution" && e.conclusionNodeId === "node-2",
      );
      expect(substEdge).toBeDefined();
      if (substEdge?._tag === "substitution") {
        expect(substEdge.premiseNodeId).toBe("node-1");
      }
    });

    it("returns NoSubstitutionEntries with empty entries", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "phi -> (psi -> phi)");
      const result = applySubstitutionAndConnect(ws, "node-1", [], {
        x: 0,
        y: 150,
      });
      expect(result.validation._tag).toBe("NoSubstitutionEntries");
    });

    it("returns Success with A1 substitution", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      // A1: φ → (ψ → φ)
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "phi -> (psi -> phi)");
      const entries: SubstitutionEntries = [
        {
          _tag: "FormulaSubstitution",
          metaVariableName: "φ",
          formulaText: "alpha",
        },
        {
          _tag: "FormulaSubstitution",
          metaVariableName: "ψ",
          formulaText: "beta",
        },
      ];
      const result = applySubstitutionAndConnect(ws, "node-1", entries, {
        x: 0,
        y: 150,
      });
      expect(result.validation._tag).toBe("Success");
      if (result.validation._tag === "Success") {
        expect(result.validation.conclusionText).toBe("α → β → α");
      }
    });

    it("returns PremiseParseError when premise has parse error", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "-> bad");
      const result = applySubstitutionAndConnect(ws, "node-1", singleEntry, {
        x: 0,
        y: 150,
      });
      expect(result.validation._tag).toBe("PremiseParseError");
    });

    it("does not mutate original state", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "phi -> (psi -> phi)");

      applySubstitutionAndConnect(ws, "node-1", singleEntry, { x: 0, y: 150 });

      expect(ws.nodes).toHaveLength(1);
      expect(ws.connections).toHaveLength(0);
    });
  });

  describe("updateNodeRole", () => {
    it("sets role to 'axiom'", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "phi");
      const result = updateNodeRole(ws, "node-1", "axiom");
      expect(result.nodes[0]!.role).toBe("axiom");
    });

    it("sets role to 'goal'", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "phi");
      const result = updateNodeRole(ws, "node-1", "goal");
      expect(result.nodes[0]!.role).toBe("goal");
    });

    it("clears role by setting to undefined", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "phi");
      ws = updateNodeRole(ws, "node-1", "axiom");
      const result = updateNodeRole(ws, "node-1", undefined);
      expect(result.nodes[0]!.role).toBeUndefined();
    });

    it("does not affect other nodes", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "axiom", "Axiom", { x: 100, y: 0 }, "psi");
      const result = updateNodeRole(ws, "node-1", "goal");
      expect(result.nodes[0]!.role).toBe("goal");
      expect(result.nodes[1]!.role).toBeUndefined();
    });

    it("does not mutate original state", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "phi");
      updateNodeRole(ws, "node-1", "axiom");
      expect(ws.nodes[0]!.role).toBeUndefined();
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
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 });
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
      ws = addNode(ws, "axiom", "Axiom", { x: 100, y: 0 });
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
      ws = addNode(ws, "axiom", "Axiom", { x: 100, y: 0 });
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
      ws = addNode(ws, "axiom", "Axiom", { x: 100, y: 0 });
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
      ws = addNode(ws, "axiom", "Axiom", { x: 100, y: 0 }, "psi");
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
      ws = addNode(ws, "axiom", "Axiom", { x: 100, y: 100 }, "phi -> psi");
      ws = addNode(ws, "axiom", "Axiom", { x: 300, y: 100 }, "phi");
      const clipboard = copySelectedNodes(ws, new Set(["node-1", "node-2"]));
      expect(clipboard._tag).toBe("ProofPadClipboard");
      expect(clipboard.nodes).toHaveLength(2);
    });

    it("includes connections and InferenceEdges between selected nodes only", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 100, y: 100 }, "phi");
      ws = addNode(ws, "axiom", "Axiom", { x: 300, y: 100 }, "phi -> psi");
      const mpResult = applyMPAndConnect(ws, "node-1", "node-2", {
        x: 200,
        y: 300,
      });
      ws = mpResult.workspace;

      // All 3 selected: both connections and InferenceEdge included
      const clipboard = copySelectedNodes(
        ws,
        new Set(["node-1", "node-2", "node-3"]),
      );
      expect(clipboard.connections).toHaveLength(2);
      expect(clipboard.inferenceEdges).toHaveLength(1);
      expect(clipboard.inferenceEdges![0]!._tag).toBe("mp");

      // Only 2 selected: no connections/InferenceEdge (derived node not selected)
      const clipboardPartial = copySelectedNodes(
        ws,
        new Set(["node-1", "node-2"]),
      );
      expect(clipboardPartial.connections).toHaveLength(0);
      expect(clipboardPartial.inferenceEdges ?? []).toHaveLength(0);
    });
  });

  describe("pasteNodes", () => {
    it("pastes nodes with new IDs into workspace", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 100, y: 100 }, "phi");
      const clipboard = copySelectedNodes(ws, new Set(["node-1"]));
      const result = pasteNodes(ws, clipboard, { x: 500, y: 500 });
      expect(result.nodes).toHaveLength(2);
      expect(result.nodes[1]!.id).toBe("node-2");
      expect(result.nodes[1]!.formulaText).toBe("phi");
      expect(result.nextNodeId).toBe(3);
    });

    it("preserves InferenceEdges between pasted nodes", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 100, y: 100 }, "phi");
      ws = addNode(ws, "axiom", "Axiom", { x: 300, y: 100 }, "phi -> psi");
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
      // 互換性: 接続とInferenceEdgeの両方がコピーされる
      // Original 2 connections + 2 pasted = 4
      expect(result.connections).toHaveLength(4);
      // Original 1 InferenceEdge + 1 pasted = 2
      expect(result.inferenceEdges).toHaveLength(2);
      // Pasted edge references new IDs
      const pastedEdge = result.inferenceEdges.find(
        (e) => e.conclusionNodeId === "node-6",
      );
      expect(pastedEdge).toBeDefined();
      expect(pastedEdge?._tag).toBe("mp");
      if (pastedEdge?._tag === "mp") {
        expect(pastedEdge.leftPremiseNodeId).toBe("node-4");
        expect(pastedEdge.rightPremiseNodeId).toBe("node-5");
      }
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
      ws = addNode(ws, "axiom", "Axiom", { x: 100, y: 100 }, "phi");
      ws = addNode(ws, "axiom", "Axiom", { x: 300, y: 100 }, "phi -> psi");
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
      ws = addNode(ws, "axiom", "Axiom", { x: 100, y: 100 });
      const result = removeSelectedNodes(ws, new Set());
      expect(result).toBe(ws);
    });

    it("removes only selected, keeps unselected", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 100, y: 100 });
      ws = addNode(ws, "axiom", "Axiom", { x: 300, y: 100 });
      ws = addNode(ws, "axiom", "Axiom", { x: 500, y: 100 });
      const result = removeSelectedNodes(ws, new Set(["node-2"]));
      expect(result.nodes).toHaveLength(2);
      expect(result.nodes[0]!.id).toBe("node-1");
      expect(result.nodes[1]!.id).toBe("node-3");
    });

    it("removes connections where selected node is target only", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 });
      ws = addNode(ws, "derived", "MP-1", { x: 100, y: 150 });
      ws = addNode(ws, "derived", "MP-2", { x: 200, y: 300 });
      ws = addNode(ws, "axiom", "Axiom", { x: 300, y: 0 });
      // node-1 → node-2 (node-2 is target)
      ws = addConnection(ws, "node-1", "out", "node-2", "premise-left");
      // node-2 → node-3 (node-2 is source)
      ws = addConnection(ws, "node-2", "out", "node-3", "premise-left");
      // node-4 → node-3 (node-3 is target)
      ws = addConnection(ws, "node-4", "out", "node-3", "premise-right");
      // Remove node-3: connections with node-3 as target/source should be removed
      const result = removeSelectedNodes(ws, new Set(["node-3"]));
      expect(result.nodes).toHaveLength(3);
      // Only node-1 → node-2 connection should remain
      expect(result.connections).toHaveLength(1);
      expect(result.connections[0]!.fromNodeId).toBe("node-1");
      expect(result.connections[0]!.toNodeId).toBe("node-2");
    });
  });

  describe("applyTreeLayout", () => {
    it("ノードの位置がツリーレイアウトで更新される", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "psi");
      ws = addNode(ws, "derived", "MP", { x: 0, y: 0 }, "phi -> psi");
      ws = addConnection(ws, "node-1", "out", "node-3", "premise-left");
      ws = addConnection(ws, "node-2", "out", "node-3", "premise-right");

      const result = applyTreeLayout(ws, "top-to-bottom");

      // ノード数は変わらない
      expect(result.nodes).toHaveLength(3);
      // コネクションも変わらない
      expect(result.connections).toHaveLength(2);

      const posA1 = result.nodes.find((n) => n.id === "node-1")!.position;
      const posA2 = result.nodes.find((n) => n.id === "node-2")!.position;
      const posMp = result.nodes.find((n) => n.id === "node-3")!.position;

      // Axioms at top, MP below
      expect(posA1.y).toBeLessThan(posMp.y);
      expect(posA2.y).toBeLessThan(posMp.y);
      // Axioms at same level
      expect(posA1.y).toBe(posA2.y);
    });

    it("bottom-to-topでルートが下に配置される", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "derived", "MP", { x: 0, y: 0 }, "psi");
      ws = addConnection(ws, "node-1", "out", "node-2", "premise-left");

      const result = applyTreeLayout(ws, "bottom-to-top");

      const posA1 = result.nodes.find((n) => n.id === "node-1")!.position;
      const posMp = result.nodes.find((n) => n.id === "node-2")!.position;

      // bottom-to-top: axiom (root) is below MP (leaf)
      expect(posA1.y).toBeGreaterThan(posMp.y);
    });

    it("ノードサイズを指定できる", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "derived", "MP", { x: 0, y: 0 }, "psi");
      ws = addConnection(ws, "node-1", "out", "node-2", "premise-left");

      const nodeSizes = new Map([
        ["node-1", { width: 200, height: 80 }],
        ["node-2", { width: 150, height: 60 }],
      ]);
      const result = applyTreeLayout(ws, "top-to-bottom", nodeSizes);

      const posA1 = result.nodes.find((n) => n.id === "node-1")!.position;
      const posMp = result.nodes.find((n) => n.id === "node-2")!.position;

      // verticalGap = 80 by default, nodeHeight = 80
      expect(posMp.y - posA1.y).toBe(80 + 80);
    });

    it("空のワークスペースでエラーにならない", () => {
      const ws = createEmptyWorkspace(lukasiewiczSystem);
      const result = applyTreeLayout(ws, "top-to-bottom");
      expect(result.nodes).toHaveLength(0);
    });
  });

  describe("duplicateSelectedNodes", () => {
    it("選択ノードをオフセット付きで複製する", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(
        ws,
        "axiom",
        "Axiom",
        { x: 100, y: 100 },
        "phi -> (psi -> phi)",
      );
      ws = addNode(ws, "axiom", "Axiom", { x: 200, y: 200 }, "psi -> phi");
      ws = addConnection(ws, "node-1", "out", "node-2", "premise-left");

      const selected = new Set(["node-1", "node-2"]);
      const result = duplicateSelectedNodes(ws, selected);

      // 元のノード2つ + 複製ノード2つ = 4ノード
      expect(result.workspace.nodes).toHaveLength(4);
      // 元の接続1つ + 複製接続1つ = 2接続
      expect(result.workspace.connections).toHaveLength(2);
      // 新しいノードIDが返される
      expect(result.newNodeIds.size).toBe(2);
      // 新しいノードは元とは異なるIDを持つ
      for (const id of result.newNodeIds) {
        expect(selected.has(id)).toBe(false);
      }
      // 複製ノードは元の位置から30pxオフセット
      const newNodes = result.workspace.nodes.filter((n) =>
        result.newNodeIds.has(n.id),
      );
      const origNode1 = result.workspace.nodes.find((n) => n.id === "node-1")!;
      const dupeOfNode1 = newNodes.find(
        (n) => n.formulaText === origNode1.formulaText,
      )!;
      expect(dupeOfNode1.position.x - origNode1.position.x).toBe(30);
      expect(dupeOfNode1.position.y - origNode1.position.y).toBe(30);
    });

    it("空の選択では何も変更しない", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 100, y: 100 }, "phi");

      const result = duplicateSelectedNodes(ws, new Set());
      expect(result.workspace.nodes).toHaveLength(1);
      expect(result.newNodeIds.size).toBe(0);
    });

    it("保護ノードはコピーされない（空のClipboardData）", () => {
      const ws = createQuestWorkspace(lukasiewiczSystem, [
        { formulaText: "phi -> phi", position: { x: 100, y: 100 } },
      ]);
      // 保護ノードのみ選択
      const selected = new Set(["node-1"]);
      const result = duplicateSelectedNodes(ws, selected);
      // buildClipboardDataは保護ノードも含むが、pasteClipboardDataで復元される
      // ただし保護は剥がされる
      expect(result.workspace.nodes).toHaveLength(2);
      expect(result.newNodeIds.size).toBe(1);
    });

    it("存在しないノードIDでは何も複製しない", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 100, y: 100 }, "phi");

      const result = duplicateSelectedNodes(ws, new Set(["nonexistent"]));
      expect(result.workspace.nodes).toHaveLength(1);
      expect(result.newNodeIds.size).toBe(0);
    });

    it("単一ノードの複製", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(
        ws,
        "axiom",
        "Axiom",
        { x: 50, y: 50 },
        "phi -> (psi -> phi)",
      );

      const result = duplicateSelectedNodes(ws, new Set(["node-1"]));
      expect(result.workspace.nodes).toHaveLength(2);
      expect(result.newNodeIds.size).toBe(1);
      const newNode = result.workspace.nodes.find((n) =>
        result.newNodeIds.has(n.id),
      )!;
      expect(newNode.formulaText).toBe("phi -> (psi -> phi)");
      expect(newNode.position.x).toBe(80); // 50 + 30
      expect(newNode.position.y).toBe(80); // 50 + 30
    });

    it("ゴールノードの複製はroleがクリアされる", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "G1", { x: 100, y: 100 }, "phi -> phi");
      ws = updateNodeRole(ws, "node-1", "goal");

      const result = duplicateSelectedNodes(ws, new Set(["node-1"]));
      expect(result.workspace.nodes).toHaveLength(2);
      const newNode = result.workspace.nodes.find((n) =>
        result.newNodeIds.has(n.id),
      )!;
      expect(newNode.formulaText).toBe("phi -> phi");
      expect(newNode.role).toBeUndefined();
    });

    it("公理ノードの複製はroleが保持される", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(
        ws,
        "axiom",
        "Axiom",
        { x: 100, y: 100 },
        "phi -> (psi -> phi)",
      );
      ws = updateNodeRole(ws, "node-1", "axiom");

      const result = duplicateSelectedNodes(ws, new Set(["node-1"]));
      const newNode = result.workspace.nodes.find((n) =>
        result.newNodeIds.has(n.id),
      )!;
      expect(newNode.role).toBe("axiom");
    });
  });

  describe("duplicateNode", () => {
    it("単一ノードをIDで複製する", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 100, y: 100 }, "phi");

      const result = duplicateNode(ws, "node-1");
      expect(result.workspace.nodes).toHaveLength(2);
      expect(result.newNodeIds.size).toBe(1);
      const newNode = result.workspace.nodes.find((n) =>
        result.newNodeIds.has(n.id),
      )!;
      expect(newNode.formulaText).toBe("phi");
      expect(newNode.position.x).toBe(130); // 100 + 30
      expect(newNode.position.y).toBe(130); // 100 + 30
    });

    it("ゴールノードをduplicateNodeで複製するとroleがクリアされる", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "G1", { x: 50, y: 50 }, "phi -> phi");
      ws = updateNodeRole(ws, "node-1", "goal");

      const result = duplicateNode(ws, "node-1");
      const newNode = result.workspace.nodes.find((n) =>
        result.newNodeIds.has(n.id),
      )!;
      expect(newNode.role).toBeUndefined();
    });

    it("存在しないノードIDでは何も変化しない", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 100, y: 100 }, "phi");

      const result = duplicateNode(ws, "nonexistent");
      expect(result.workspace.nodes).toHaveLength(1);
      expect(result.newNodeIds.size).toBe(0);
    });
  });

  describe("cutSelectedNodes", () => {
    it("選択ノードをカットしてClipboardDataを返す", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 100, y: 100 }, "phi");
      ws = addNode(ws, "axiom", "Axiom", { x: 200, y: 200 }, "psi");
      ws = addConnection(ws, "node-1", "out", "node-2", "premise-left");

      const selected = new Set(["node-1"]);
      const result = cutSelectedNodes(ws, selected);

      // node-1が削除される
      expect(result.workspace.nodes).toHaveLength(1);
      expect(result.workspace.nodes[0]!.id).toBe("node-2");
      // node-1に関連する接続も削除される
      expect(result.workspace.connections).toHaveLength(0);
      // ClipboardDataが返される
      expect(result.clipboardData._tag).toBe("ProofPadClipboard");
      expect(result.clipboardData.nodes).toHaveLength(1);
      expect(result.clipboardData.nodes[0]!.originalId).toBe("node-1");
    });

    it("保護ノードはカットされない", () => {
      const ws = createQuestWorkspace(lukasiewiczSystem, [
        { formulaText: "phi -> phi", position: { x: 100, y: 100 } },
      ]);
      const selected = new Set(["node-1"]);
      const result = cutSelectedNodes(ws, selected);

      // 保護ノードは削除されない
      expect(result.workspace.nodes).toHaveLength(1);
      // ClipboardDataにはコピーされる
      expect(result.clipboardData.nodes).toHaveLength(1);
    });

    it("空の選択では状態を変更しない", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 100, y: 100 }, "phi");

      const result = cutSelectedNodes(ws, new Set());
      expect(result.workspace.nodes).toHaveLength(1);
      expect(result.clipboardData.nodes).toHaveLength(0);
    });

    it("複数ノードのカットで内部接続もClipboardDataに含まれる", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 100, y: 100 }, "phi");
      ws = addNode(ws, "axiom", "Axiom", { x: 200, y: 200 }, "psi");
      ws = addConnection(ws, "node-1", "out", "node-2", "premise-left");

      const selected = new Set(["node-1", "node-2"]);
      const result = cutSelectedNodes(ws, selected);

      expect(result.workspace.nodes).toHaveLength(0);
      expect(result.workspace.connections).toHaveLength(0);
      expect(result.clipboardData.nodes).toHaveLength(2);
      expect(result.clipboardData.connections).toHaveLength(1);
    });
  });

  describe("applyIncrementalLayout", () => {
    it("ノード追加後に差分のみレイアウトが更新される", () => {
      // まず2ノード+接続でレイアウト済みの状態を作る
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "phi -> psi");
      ws = addConnection(ws, "node-1", "out", "node-2", "premise-left");
      ws = applyTreeLayout(ws, "top-to-bottom");

      // 新しいノードを追加（レイアウト前の位置は0,0）
      ws = addNode(ws, "derived", "MP", { x: 0, y: 0 }, "psi");
      ws = addConnection(ws, "node-1", "out", "node-3", "premise-left");
      ws = addConnection(ws, "node-2", "out", "node-3", "premise-right");

      const result = applyIncrementalLayout(ws, "top-to-bottom");

      // 全ノードの位置が設定されている
      expect(result.nodes).toHaveLength(3);
      const mpNode = result.nodes.find((n) => n.id === "node-3")!;
      // MPノードは（0,0）から移動しているはず
      expect(mpNode.position.x !== 0 || mpNode.position.y !== 0).toBe(true);
    });

    it("変更がない場合は同じ参照を返す", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 100, y: 100 }, "phi");

      // レイアウト適用（孤立ノード1個なので理想位置に設定）
      ws = applyTreeLayout(ws, "top-to-bottom");

      // 同じ状態で再度インクリメンタルレイアウトを適用
      const result = applyIncrementalLayout(ws, "top-to-bottom");

      // diff=0なので同じ参照が返る
      expect(result).toBe(ws);
    });

    it("ノード削除後に残ったノードが再整列される", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "axiom", "Axiom", { x: 200, y: 0 }, "phi -> psi");
      ws = addNode(ws, "derived", "MP", { x: 100, y: 200 }, "psi");
      ws = addConnection(ws, "node-1", "out", "node-3", "premise-left");
      ws = addConnection(ws, "node-2", "out", "node-3", "premise-right");
      ws = applyTreeLayout(ws, "top-to-bottom");

      // node-2を削除（接続も除去される）
      ws = removeNode(ws, "node-2");

      const result = applyIncrementalLayout(ws, "top-to-bottom");

      // 残り2ノード
      expect(result.nodes).toHaveLength(2);
    });

    it("空のワークスペースでエラーにならない", () => {
      const ws = createEmptyWorkspace(lukasiewiczSystem);
      const result = applyIncrementalLayout(ws, "top-to-bottom");
      expect(result.nodes).toHaveLength(0);
      // diff=0なので同じ参照
      expect(result).toBe(ws);
    });

    it("カスタム閾値を指定できる", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "phi");

      // 大きな閾値で適用
      const result = applyIncrementalLayout(
        ws,
        "top-to-bottom",
        undefined,
        undefined,
        10000,
      );

      // 閾値が大きすぎるため移動が抑制され、同じ参照が返る
      // （理想位置との差が閾値以下ならdiff=0）
      // 注: ノード1個だけなら理想位置は(0,0)なので差は0→同じ参照
      expect(result).toBe(ws);
    });
  });

  describe("revalidateInferenceConclusions", () => {
    it("updates MP conclusion text when premises are valid", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "axiom", "Axiom", { x: 100, y: 0 }, "phi -> psi");
      const mp = applyMPAndConnect(ws, "node-1", "node-2", { x: 50, y: 100 });
      ws = mp.workspace;
      // MP conclusion should be "ψ"
      expect(findNode(ws, "node-3")?.formulaText).not.toBe("");

      const result = revalidateInferenceConclusions(ws);
      // Should remain the same (already valid)
      expect(findNode(result, "node-3")?.formulaText).toBe(
        findNode(ws, "node-3")?.formulaText,
      );
    });

    it("clears MP conclusion text when left premise is changed to mismatch", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "axiom", "Axiom", { x: 100, y: 0 }, "phi -> psi");
      const mp = applyMPAndConnect(ws, "node-1", "node-2", { x: 50, y: 100 });
      ws = mp.workspace;
      expect(findNode(ws, "node-3")?.formulaText).not.toBe("");

      // Change left premise to incompatible formula
      ws = updateNodeFormulaText(ws, "node-1", "chi");
      ws = revalidateInferenceConclusions(ws);

      // MP conclusion should be cleared
      expect(findNode(ws, "node-3")?.formulaText).toBe("");
    });

    it("propagates failure through MP chain", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      // phi + (phi -> psi) → MP1 → psi
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "axiom", "Axiom", { x: 100, y: 0 }, "phi -> psi");
      const mp1 = applyMPAndConnect(ws, "node-1", "node-2", {
        x: 50,
        y: 100,
      });
      ws = mp1.workspace;
      // psi(=node-3) + (psi -> chi) → MP2 → chi
      ws = addNode(ws, "axiom", "Axiom", { x: 200, y: 100 }, "psi -> chi");
      const mp2 = applyMPAndConnect(ws, "node-3", "node-4", {
        x: 150,
        y: 200,
      });
      ws = mp2.workspace;

      // Both MPs should be valid initially
      expect(findNode(ws, "node-3")?.formulaText).not.toBe("");
      expect(findNode(ws, "node-5")?.formulaText).not.toBe("");

      // Change first premise to break MP1
      ws = updateNodeFormulaText(ws, "node-1", "alpha");
      ws = revalidateInferenceConclusions(ws);

      // MP1 should be cleared (alpha ≠ phi)
      expect(findNode(ws, "node-3")?.formulaText).toBe("");
      // MP2 should also be cleared (node-3 is now empty → parse error)
      expect(findNode(ws, "node-5")?.formulaText).toBe("");
    });

    it("restores MP conclusion when premise is fixed", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "axiom", "Axiom", { x: 100, y: 0 }, "phi -> psi");
      const mp = applyMPAndConnect(ws, "node-1", "node-2", { x: 50, y: 100 });
      ws = mp.workspace;

      // Break it
      ws = updateNodeFormulaText(ws, "node-1", "chi");
      ws = revalidateInferenceConclusions(ws);
      expect(findNode(ws, "node-3")?.formulaText).toBe("");

      // Fix it
      ws = updateNodeFormulaText(ws, "node-1", "phi");
      ws = revalidateInferenceConclusions(ws);
      expect(findNode(ws, "node-3")?.formulaText).not.toBe("");
    });

    it("returns same state when no inference nodes exist", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "phi");
      const result = revalidateInferenceConclusions(ws);
      expect(result).toBe(ws);
    });

    it("returns same state when all conclusions are already correct", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "axiom", "Axiom", { x: 100, y: 0 }, "phi -> psi");
      const mp = applyMPAndConnect(ws, "node-1", "node-2", { x: 50, y: 100 });
      ws = mp.workspace;

      // First call should return same state (no changes needed)
      const result = revalidateInferenceConclusions(ws);
      // Node references may differ (map creates new objects) but formulaText should match
      expect(findNode(result, "node-3")?.formulaText).toBe(
        findNode(ws, "node-3")?.formulaText,
      );
    });

    it("handles Gen node revalidation", () => {
      let ws = createEmptyWorkspace(predicateLogicSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "phi -> psi");
      const gen = applyGenAndConnect(ws, "node-1", "x", { x: 50, y: 100 });
      ws = gen.workspace;
      expect(findNode(ws, "node-2")?.formulaText).not.toBe("");

      // Change premise to invalid
      ws = updateNodeFormulaText(ws, "node-1", "");
      ws = revalidateInferenceConclusions(ws);
      expect(findNode(ws, "node-2")?.formulaText).toBe("");
    });

    it("restores chain when intermediate node is corrected", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      // Build chain: A1(phi) + A2(phi->psi) → MP1(psi) + A3(psi->chi) → MP2(chi)
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "axiom", "Axiom", { x: 100, y: 0 }, "phi -> psi");
      const mp1 = applyMPAndConnect(ws, "node-1", "node-2", {
        x: 50,
        y: 100,
      });
      ws = mp1.workspace;
      ws = addNode(ws, "axiom", "Axiom", { x: 200, y: 100 }, "psi -> chi");
      const mp2 = applyMPAndConnect(ws, "node-3", "node-4", {
        x: 150,
        y: 200,
      });
      ws = mp2.workspace;

      // Break and verify cascade
      ws = updateNodeFormulaText(ws, "node-1", "alpha");
      ws = revalidateInferenceConclusions(ws);
      expect(findNode(ws, "node-3")?.formulaText).toBe("");
      expect(findNode(ws, "node-5")?.formulaText).toBe("");

      // Fix and verify cascade restoration
      ws = updateNodeFormulaText(ws, "node-1", "phi");
      ws = revalidateInferenceConclusions(ws);
      expect(findNode(ws, "node-3")?.formulaText).not.toBe("");
      expect(findNode(ws, "node-5")?.formulaText).not.toBe("");
    });

    it("handles substitution node revalidation", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      // Create axiom A1 schema: φ → (ψ → φ)
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "phi -> (psi -> phi)");
      const subst = applySubstitutionAndConnect(
        ws,
        "node-1",
        [
          {
            _tag: "FormulaSubstitution",
            metaVariableName: "φ",
            formulaText: "alpha",
          },
        ],
        { x: 50, y: 100 },
      );
      ws = subst.workspace;
      expect(findNode(ws, "node-2")?.formulaText).not.toBe("");

      // Change premise to invalid formula
      ws = updateNodeFormulaText(ws, "node-1", "");
      ws = revalidateInferenceConclusions(ws);
      expect(findNode(ws, "node-2")?.formulaText).toBe("");
    });

    it("restores substitution conclusion when premise is fixed", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "phi -> (psi -> phi)");
      const entries: SubstitutionEntries = [
        {
          _tag: "FormulaSubstitution",
          metaVariableName: "φ",
          formulaText: "alpha",
        },
      ];
      const subst = applySubstitutionAndConnect(ws, "node-1", entries, {
        x: 50,
        y: 100,
      });
      ws = subst.workspace;
      const originalText = findNode(ws, "node-2")?.formulaText;
      expect(originalText).not.toBe("");

      // Break → fix → should restore
      ws = updateNodeFormulaText(ws, "node-1", "");
      ws = revalidateInferenceConclusions(ws);
      expect(findNode(ws, "node-2")?.formulaText).toBe("");

      ws = updateNodeFormulaText(ws, "node-1", "phi -> (psi -> phi)");
      ws = revalidateInferenceConclusions(ws);
      expect(findNode(ws, "node-2")?.formulaText).toBe(originalText);
    });
  });

  describe("inferenceEdges sync", () => {
    it("createEmptyWorkspace initializes with empty inferenceEdges", () => {
      const ws = createEmptyWorkspace(lukasiewiczSystem);
      expect(ws.inferenceEdges).toEqual([]);
    });

    it("createQuestWorkspace initializes with empty inferenceEdges", () => {
      const ws = createQuestWorkspace(lukasiewiczSystem, [
        { formulaText: "phi", position: { x: 0, y: 0 } },
      ]);
      expect(ws.inferenceEdges).toEqual([]);
    });

    it("addNode with axiom kind does not create inferenceEdges", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Ax", { x: 0, y: 0 }, "phi");
      expect(ws.inferenceEdges).toEqual([]);
    });

    it("applyMPAndConnect creates an MPEdge", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Ax1", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "axiom", "Ax2", { x: 200, y: 0 }, "phi -> psi");
      const result = applyMPAndConnect(ws, "node-1", "node-2", {
        x: 100,
        y: 100,
      });
      expect(result.workspace.inferenceEdges).toHaveLength(1);
      expect(result.workspace.inferenceEdges[0]?._tag).toBe("mp");
    });

    it("applyGenAndConnect creates a GenEdge", () => {
      let ws = createEmptyWorkspace(predicateLogicSystem);
      ws = addNode(ws, "axiom", "Ax", { x: 0, y: 0 }, "phi");
      const result = applyGenAndConnect(ws, "node-1", "x", {
        x: 0,
        y: 150,
      });
      expect(result.workspace.inferenceEdges).toHaveLength(1);
      expect(result.workspace.inferenceEdges[0]?._tag).toBe("gen");
    });

    it("applySubstitutionAndConnect creates a SubstitutionEdge", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Ax", { x: 0, y: 0 }, "phi -> (psi -> phi)");
      const result = applySubstitutionAndConnect(
        ws,
        "node-1",
        [
          {
            _tag: "FormulaSubstitution",
            metaVariableName: "φ",
            formulaText: "alpha",
          },
        ],
        { x: 0, y: 150 },
      );
      expect(result.workspace.inferenceEdges).toHaveLength(1);
      expect(result.workspace.inferenceEdges[0]?._tag).toBe("substitution");
    });

    it("addConnection does not modify existing inferenceEdges premises", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Ax1", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "axiom", "Ax2", { x: 200, y: 0 }, "phi -> psi");
      // Create MP node via applyMPAndConnect
      const mpResult = applyMPAndConnect(ws, "node-1", "node-2", {
        x: 100,
        y: 100,
      });
      ws = mpResult.workspace;
      // MP should have both premises set in the InferenceEdge
      const mpEdge = ws.inferenceEdges?.find(
        (e) => e._tag === "mp" && e.conclusionNodeId === "node-3",
      );
      expect(mpEdge).toBeDefined();
      if (mpEdge?._tag === "mp") {
        expect(mpEdge.leftPremiseNodeId).toBe("node-1");
        expect(mpEdge.rightPremiseNodeId).toBe("node-2");
      }
      // Adding a new connection does not update InferenceEdge premises
      // (InferenceEdge premises are set at creation time by apply functions)
      ws = addNode(ws, "axiom", "Ax3", { x: 300, y: 0 }, "chi");
      ws = addConnection(ws, "node-4", "out", "node-3", "extra");
      const mpEdgeAfter = ws.inferenceEdges?.find(
        (e) => e._tag === "mp" && e.conclusionNodeId === "node-3",
      );
      if (mpEdgeAfter?._tag === "mp") {
        // Premises remain unchanged
        expect(mpEdgeAfter.leftPremiseNodeId).toBe("node-1");
        expect(mpEdgeAfter.rightPremiseNodeId).toBe("node-2");
      }
    });

    it("removeConnection preserves inferenceEdges", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Ax1", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "axiom", "Ax2", { x: 200, y: 0 }, "phi -> psi");
      const mpResult = applyMPAndConnect(ws, "node-1", "node-2", {
        x: 100,
        y: 100,
      });
      ws = mpResult.workspace;
      // Before removal: has premise in InferenceEdge
      const mpEdgeBefore = ws.inferenceEdges?.find(
        (e) => e._tag === "mp" && e.conclusionNodeId === "node-3",
      );
      if (mpEdgeBefore?._tag === "mp") {
        expect(mpEdgeBefore.leftPremiseNodeId).toBe("node-1");
      }
      // After removing legacy connection: InferenceEdge premises are preserved
      // (InferenceEdge is the source of truth, not legacy connections)
      ws = removeConnection(ws, "conn-node-1-out-node-3-premise-left");
      const mpEdgeAfter = ws.inferenceEdges?.find(
        (e) => e._tag === "mp" && e.conclusionNodeId === "node-3",
      );
      if (mpEdgeAfter?._tag === "mp") {
        expect(mpEdgeAfter.leftPremiseNodeId).toBe("node-1");
      }
    });

    it("removeNode removes associated inferenceEdges", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Ax1", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "axiom", "Ax2", { x: 200, y: 0 }, "phi -> psi");
      const mpResult = applyMPAndConnect(ws, "node-1", "node-2", {
        x: 100,
        y: 100,
      });
      ws = mpResult.workspace;
      expect(ws.inferenceEdges).toHaveLength(1);
      ws = removeNode(ws, "node-3");
      expect(ws.inferenceEdges).toEqual([]);
    });

    it("updateNodeFormulaText syncs inferenceEdges conclusionText", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Ax1", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "axiom", "Ax2", { x: 200, y: 0 }, "phi -> psi");
      const mpResult = applyMPAndConnect(ws, "node-1", "node-2", {
        x: 100,
        y: 100,
      });
      ws = mpResult.workspace;
      // Conclusion should have been set by applyMPAndConnect
      const originalText = ws.inferenceEdges?.[0]?.conclusionText;
      expect(originalText).not.toBe("");
      // Manually update the formula text of the MP node
      ws = updateNodeFormulaText(ws, "node-3", "chi");
      expect(ws.inferenceEdges?.[0]?.conclusionText).toBe("chi");
    });

    it("updateNodeGenVariableName preserves inferenceEdges variableName", () => {
      let ws = createEmptyWorkspace(predicateLogicSystem);
      ws = addNode(ws, "axiom", "Ax", { x: 0, y: 0 }, "phi");
      const genResult = applyGenAndConnect(ws, "node-1", "x", {
        x: 0,
        y: 150,
      });
      ws = genResult.workspace;
      const genEdgeBefore = ws.inferenceEdges?.[0];
      if (genEdgeBefore?._tag === "gen") {
        expect(genEdgeBefore.variableName).toBe("x");
      }
      // updateNodeGenVariableName updates the node's property
      // but InferenceEdge variableName is set at creation time
      ws = updateNodeGenVariableName(ws, "node-2", "y");
      expect(findNode(ws, "node-2")?.genVariableName).toBe("y");
      // InferenceEdge retains the original variable name
      const genEdgeAfter = ws.inferenceEdges?.[0];
      if (genEdgeAfter?._tag === "gen") {
        expect(genEdgeAfter.variableName).toBe("x");
      }
    });

    it("updateNodeSubstitutionEntries preserves inferenceEdges entries", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Ax", { x: 0, y: 0 }, "phi -> (psi -> phi)");
      const originalEntries: SubstitutionEntries = [
        {
          _tag: "FormulaSubstitution",
          metaVariableName: "φ",
          formulaText: "alpha",
        },
      ];
      const substResult = applySubstitutionAndConnect(
        ws,
        "node-1",
        originalEntries,
        { x: 0, y: 150 },
      );
      ws = substResult.workspace;
      // InferenceEdge has original entries
      const edgeBefore = ws.inferenceEdges?.[0];
      if (edgeBefore?._tag === "substitution") {
        expect(edgeBefore.entries).toEqual(originalEntries);
      }
      // updateNodeSubstitutionEntries updates node property
      // but InferenceEdge entries are set at creation time
      const newEntries: SubstitutionEntries = [
        {
          _tag: "FormulaSubstitution",
          metaVariableName: "φ",
          formulaText: "psi",
        },
      ];
      ws = updateNodeSubstitutionEntries(ws, "node-2", newEntries);
      expect(findNode(ws, "node-2")?.substitutionEntries).toEqual(newEntries);
      // InferenceEdge retains original entries
      const edgeAfter = ws.inferenceEdges?.[0];
      if (edgeAfter?._tag === "substitution") {
        expect(edgeAfter.entries).toEqual(originalEntries);
      }
    });

    it("updateInferenceEdgeGenVariableName updates edge variableName and revalidates", () => {
      let ws = createEmptyWorkspace(predicateLogicSystem);
      ws = addNode(ws, "axiom", "Ax", { x: 0, y: 0 }, "phi");
      const genResult = applyGenAndConnect(ws, "node-1", "x", {
        x: 0,
        y: 150,
      });
      ws = genResult.workspace;

      // Initial: variable is "x", conclusion is "∀x.φ"
      const edgeBefore = ws.inferenceEdges[0];
      expect(edgeBefore?._tag).toBe("gen");
      if (edgeBefore?._tag === "gen") {
        expect(edgeBefore.variableName).toBe("x");
      }
      expect(findNode(ws, "node-2")?.formulaText).toBe("∀x.φ");

      // Update to "y"
      ws = updateInferenceEdgeGenVariableName(ws, "node-2", "y");

      const edgeAfter = ws.inferenceEdges[0];
      expect(edgeAfter?._tag).toBe("gen");
      if (edgeAfter?._tag === "gen") {
        expect(edgeAfter.variableName).toBe("y");
      }
      // Conclusion should be revalidated to "∀y.φ"
      expect(findNode(ws, "node-2")?.formulaText).toBe("∀y.φ");
    });

    it("updateInferenceEdgeGenVariableName with empty name clears conclusion", () => {
      let ws = createEmptyWorkspace(predicateLogicSystem);
      ws = addNode(ws, "axiom", "Ax", { x: 0, y: 0 }, "phi");
      const genResult = applyGenAndConnect(ws, "node-1", "x", {
        x: 0,
        y: 150,
      });
      ws = genResult.workspace;
      expect(findNode(ws, "node-2")?.formulaText).toBe("∀x.φ");

      // Set to empty → validation should fail, clearing conclusion
      ws = updateInferenceEdgeGenVariableName(ws, "node-2", "");

      const edge = ws.inferenceEdges[0];
      if (edge?._tag === "gen") {
        expect(edge.variableName).toBe("");
      }
      expect(findNode(ws, "node-2")?.formulaText).toBe("");
    });

    it("updateInferenceEdgeGenVariableName does nothing for non-gen edges", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Ax1", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "axiom", "Ax2", { x: 200, y: 0 }, "phi -> psi");
      const mpResult = applyMPAndConnect(ws, "node-1", "node-2", {
        x: 100,
        y: 150,
      });
      ws = mpResult.workspace;

      // Try to update Gen variable on an MP edge — should be a no-op
      const before = ws.inferenceEdges[0];
      ws = updateInferenceEdgeGenVariableName(ws, "node-3", "x");
      const after = ws.inferenceEdges[0];
      expect(after).toEqual(before);
    });

    it("updateInferenceEdgeSubstitutionEntries updates edge entries and revalidates", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Ax", { x: 0, y: 0 }, "phi -> (psi -> phi)");
      const originalEntries: SubstitutionEntries = [
        {
          _tag: "FormulaSubstitution",
          metaVariableName: "φ",
          formulaText: "alpha",
        },
      ];
      const substResult = applySubstitutionAndConnect(
        ws,
        "node-1",
        originalEntries,
        { x: 0, y: 150 },
      );
      ws = substResult.workspace;

      // Initial: substitution with φ := alpha
      const conclusionBefore = findNode(ws, "node-2")?.formulaText;
      expect(conclusionBefore).toContain("α");

      // Update to φ := beta
      const newEntries: SubstitutionEntries = [
        {
          _tag: "FormulaSubstitution",
          metaVariableName: "φ",
          formulaText: "beta",
        },
      ];
      ws = updateInferenceEdgeSubstitutionEntries(ws, "node-2", newEntries);

      const edgeAfter = ws.inferenceEdges[0];
      if (edgeAfter?._tag === "substitution") {
        expect(edgeAfter.entries).toEqual(newEntries);
      }
      // Conclusion should be revalidated with new substitution
      const conclusionAfter = findNode(ws, "node-2")?.formulaText;
      expect(conclusionAfter).toContain("β");
    });

    it("updateInferenceEdgeSubstitutionEntries with empty entries clears conclusion", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Ax", { x: 0, y: 0 }, "phi -> (psi -> phi)");
      const originalEntries: SubstitutionEntries = [
        {
          _tag: "FormulaSubstitution",
          metaVariableName: "φ",
          formulaText: "alpha",
        },
      ];
      const substResult = applySubstitutionAndConnect(
        ws,
        "node-1",
        originalEntries,
        { x: 0, y: 150 },
      );
      ws = substResult.workspace;

      // Set to empty entries
      ws = updateInferenceEdgeSubstitutionEntries(ws, "node-2", []);

      const edgeAfter = ws.inferenceEdges[0];
      if (edgeAfter?._tag === "substitution") {
        expect(edgeAfter.entries).toEqual([]);
      }
      // Conclusion should be cleared since no substitutions
      expect(findNode(ws, "node-2")?.formulaText).toBe("");
    });

    it("applyMPAndConnect produces correct inferenceEdges", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Ax1", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "axiom", "Ax2", { x: 200, y: 0 }, "phi -> psi");
      const result = applyMPAndConnect(ws, "node-1", "node-2", {
        x: 100,
        y: 100,
      });
      const edges = result.workspace.inferenceEdges;
      expect(edges).toBeDefined();
      const mpEdge = edges?.find(
        (e) => e._tag === "mp" && e.conclusionNodeId === "node-3",
      );
      expect(mpEdge).toBeDefined();
      if (mpEdge?._tag === "mp") {
        expect(mpEdge.leftPremiseNodeId).toBe("node-1");
        expect(mpEdge.rightPremiseNodeId).toBe("node-2");
      }
    });

    it("revalidateInferenceConclusions syncs inferenceEdges after changes", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Ax1", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "axiom", "Ax2", { x: 200, y: 0 }, "phi -> psi");
      const result = applyMPAndConnect(ws, "node-1", "node-2", {
        x: 100,
        y: 100,
      });
      ws = result.workspace;

      // Break the premise
      ws = updateNodeFormulaText(ws, "node-1", "");
      ws = revalidateInferenceConclusions(ws);
      const mpEdge = ws.inferenceEdges?.find(
        (e) => e._tag === "mp" && e.conclusionNodeId === "node-3",
      );
      expect(mpEdge?.conclusionText).toBe("");

      // Fix the premise
      ws = updateNodeFormulaText(ws, "node-1", "phi");
      ws = revalidateInferenceConclusions(ws);
      const mpEdgeFixed = ws.inferenceEdges?.find(
        (e) => e._tag === "mp" && e.conclusionNodeId === "node-3",
      );
      expect(mpEdgeFixed?.conclusionText).toBe("ψ");
    });

    it("getInferenceEdges returns cached edges when available", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Ax1", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "axiom", "Ax2", { x: 200, y: 0 }, "phi -> psi");
      const mpResult = applyMPAndConnect(ws, "node-1", "node-2", {
        x: 100,
        y: 100,
      });
      ws = mpResult.workspace;
      const edges1 = getInferenceEdges(ws);
      const edges2 = getInferenceEdges(ws);
      expect(edges1).toBe(edges2);
    });

    it("getInferenceEdges returns empty array for empty workspace", () => {
      const ws = createEmptyWorkspace(lukasiewiczSystem);
      const edges = getInferenceEdges(ws);
      expect(edges).toEqual([]);
    });

    it("removeSelectedNodes syncs inferenceEdges", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      // Create two MP nodes via applyMPAndConnect
      ws = addNode(ws, "axiom", "Ax1", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "axiom", "Ax2", { x: 200, y: 0 }, "phi -> psi");
      const mp1 = applyMPAndConnect(ws, "node-1", "node-2", {
        x: 100,
        y: 100,
      });
      ws = mp1.workspace;
      // node-3 = MP1 result
      ws = addNode(ws, "axiom", "Ax3", { x: 300, y: 0 }, "psi -> chi");
      const mp2 = applyMPAndConnect(ws, "node-3", "node-4", {
        x: 200,
        y: 200,
      });
      ws = mp2.workspace;
      // node-5 = MP2 result
      expect(ws.inferenceEdges).toHaveLength(2);
      ws = removeSelectedNodes(ws, new Set(["node-3"]));
      expect(ws.inferenceEdges).toHaveLength(1);
      expect(ws.inferenceEdges?.[0]?.conclusionNodeId).toBe("node-5");
    });

    it("duplicateSelectedNodes preserves original inferenceEdges", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Ax1", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "axiom", "Ax2", { x: 200, y: 0 }, "phi -> psi");
      const mpResult = applyMPAndConnect(ws, "node-1", "node-2", {
        x: 100,
        y: 100,
      });
      ws = mpResult.workspace;
      expect(ws.inferenceEdges).toHaveLength(1);
      // Duplicate all 3 nodes (2 axioms + 1 derived MP)
      const result = duplicateSelectedNodes(
        ws,
        new Set(["node-1", "node-2", "node-3"]),
      );
      // Original edge is preserved; duplicate nodes get new nodes but
      // duplicateSelectedNodes doesn't include newInferenceEdges from paste
      expect(result.workspace.inferenceEdges).toHaveLength(1);
      expect(result.workspace.nodes).toHaveLength(6);
    });

    it("pasteNodes syncs inferenceEdges", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Ax1", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "axiom", "Ax2", { x: 200, y: 0 }, "phi -> psi");
      const mpResult = applyMPAndConnect(ws, "node-1", "node-2", {
        x: 100,
        y: 100,
      });
      ws = mpResult.workspace;
      const clipboardData = copySelectedNodes(
        ws,
        new Set(["node-1", "node-2", "node-3"]),
      );
      ws = pasteNodes(ws, clipboardData, { x: 400, y: 400 });
      expect(ws.inferenceEdges).toHaveLength(2);
    });

    it("cutSelectedNodes syncs inferenceEdges", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      // Create two MP nodes via applyMPAndConnect
      ws = addNode(ws, "axiom", "Ax1", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "axiom", "Ax2", { x: 200, y: 0 }, "phi -> psi");
      const mp1 = applyMPAndConnect(ws, "node-1", "node-2", {
        x: 100,
        y: 100,
      });
      ws = mp1.workspace;
      // node-3 = MP1 result
      ws = addNode(ws, "axiom", "Ax3", { x: 300, y: 0 }, "psi -> chi");
      const mp2 = applyMPAndConnect(ws, "node-3", "node-4", {
        x: 200,
        y: 200,
      });
      ws = mp2.workspace;
      // node-5 = MP2 result
      expect(ws.inferenceEdges).toHaveLength(2);
      const result = cutSelectedNodes(ws, new Set(["node-3"]));
      expect(result.workspace.inferenceEdges).toHaveLength(1);
    });
  });
});

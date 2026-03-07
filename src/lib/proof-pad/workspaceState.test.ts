import { Either } from "effect";
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
  extractLogicSystem,
  emptyLogicSystem,
  isNodeProtected,
  addNode,
  updateNodePosition,
  updateMultipleNodePositions,
  updateNodeFormulaText,
  updateNodeRole,
  findNode,
  removeNode,
  addConnection,
  removeConnection,
  changeSystem,
  applyMPAndConnect,
  applyGenAndConnect,
  applySubstitutionAndConnect,
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
  addGoal,
  removeGoal,
  updateGoalFormulaText,
  type QuestGoalDefinition,
  mergeSelectedNodes,
  applyAtRuleAndConnect,
  applyTabRuleAndConnect,
  applyScRuleAndConnect,
  importProofFromCollection,
} from "./workspaceState";
import {
  hilbertDeduction,
  naturalDeduction,
  nmSystem,
  sequentCalculusDeduction,
  lkSystem,
} from "../logic-core/deductionSystem";
import type { ClipboardData } from "./copyPasteLogic";
import type { SubstitutionEntries } from "./substitutionApplicationLogic";
import type { ProofEntry } from "../proof-collection/proofCollectionState";

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

    it("creates workspace from DeductionSystem (hilbert)", () => {
      const ds = hilbertDeduction(lukasiewiczSystem);
      const ws = createEmptyWorkspace(ds);
      expect(ws.system).toBe(lukasiewiczSystem);
      expect(ws.deductionSystem).toBe(ds);
    });

    it("creates workspace from DeductionSystem (natural-deduction)", () => {
      const ds = naturalDeduction(nmSystem);
      const ws = createEmptyWorkspace(ds);
      expect(ws.system).toBe(emptyLogicSystem);
      expect(ws.deductionSystem).toBe(ds);
      expect(ws.deductionSystem.style).toBe("natural-deduction");
    });
  });

  describe("extractLogicSystem", () => {
    it("returns system from Hilbert deduction", () => {
      const ds = hilbertDeduction(lukasiewiczSystem);
      expect(extractLogicSystem(ds)).toBe(lukasiewiczSystem);
    });

    it("returns emptyLogicSystem from ND deduction", () => {
      const ds = naturalDeduction(nmSystem);
      expect(extractLogicSystem(ds)).toBe(emptyLogicSystem);
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
      const result = addNode(ws, "axiom", "MP", { x: 50, y: 50 });
      expect(result.nodes[0]!.kind).toBe("axiom");
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
      ws = addNode(ws, "axiom", "MP", { x: 50, y: 100 });
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

  describe("updateMultipleNodePositions", () => {
    it("updates positions of multiple nodes at once", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A", { x: 0, y: 0 });
      ws = addNode(ws, "axiom", "B", { x: 100, y: 0 });
      ws = addNode(ws, "axiom", "C", { x: 200, y: 0 });
      const positions = new Map([
        ["node-1", { x: 10, y: 20 }],
        ["node-2", { x: 110, y: 20 }],
      ]);
      const result = updateMultipleNodePositions(ws, positions);
      expect(result.nodes[0]!.position).toEqual({ x: 10, y: 20 });
      expect(result.nodes[1]!.position).toEqual({ x: 110, y: 20 });
      expect(result.nodes[2]!.position).toEqual({ x: 200, y: 0 });
    });

    it("does not modify unselected nodes", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A", { x: 50, y: 60 });
      ws = addNode(ws, "axiom", "B", { x: 150, y: 160 });
      const positions = new Map([["node-1", { x: 70, y: 80 }]]);
      const result = updateMultipleNodePositions(ws, positions);
      expect(result.nodes[0]!.position).toEqual({ x: 70, y: 80 });
      expect(result.nodes[1]!.position).toEqual({ x: 150, y: 160 });
    });

    it("returns same state when positions map is empty", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A", { x: 0, y: 0 });
      const positions = new Map<
        string,
        { readonly x: number; readonly y: number }
      >();
      const result = updateMultipleNodePositions(ws, positions);
      expect(result).toBe(ws);
    });

    it("ignores non-existent node IDs in positions map", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "A", { x: 0, y: 0 });
      const positions = new Map([
        ["node-1", { x: 10, y: 20 }],
        ["non-existent", { x: 999, y: 999 }],
      ]);
      const result = updateMultipleNodePositions(ws, positions);
      expect(result.nodes[0]!.position).toEqual({ x: 10, y: 20 });
      expect(result.nodes).toHaveLength(1);
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
      ws = addNode(ws, "axiom", "MP", { x: 100, y: 150 });
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
      ws = addNode(ws, "axiom", "MP", { x: 100, y: 150 });
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
      ws = addNode(ws, "axiom", "MP-1", { x: 100, y: 150 });
      ws = addNode(ws, "axiom", "MP-2", { x: 200, y: 300 });
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
      ws = addNode(ws, "axiom", "MP", { x: 100, y: 100 });
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
      ws = addNode(ws, "axiom", "MP", { x: 100, y: 100 });
      addConnection(ws, "node-1", "out", "node-2", "premise-left");
      expect(ws.connections).toHaveLength(0);
    });
  });

  describe("removeConnection", () => {
    it("removes a connection", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 });
      ws = addNode(ws, "axiom", "MP", { x: 100, y: 100 });
      ws = addConnection(ws, "node-1", "out", "node-2", "premise-left");
      const result = removeConnection(
        ws,
        "conn-node-1-out-node-2-premise-left",
      );
      expect(result.connections).toHaveLength(0);
    });

    it("does not affect connections to different nodes", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 });
      ws = addNode(ws, "axiom", "Axiom", { x: 200, y: 0 });
      ws = addNode(ws, "axiom", "Axiom", { x: 400, y: 0 });
      // InferenceEdge がない接続 → 単体だけ削除
      ws = addConnection(ws, "node-1", "out", "node-2", "premise-left");
      ws = addConnection(ws, "node-1", "out", "node-3", "premise-left");
      const result = removeConnection(
        ws,
        "conn-node-1-out-node-2-premise-left",
      );
      expect(result.connections).toHaveLength(1);
      expect(result.connections[0]!.toNodeId).toBe("node-3");
    });

    it("removes all connections to same conclusion node when InferenceEdge exists", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Ax1", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "axiom", "Ax2", { x: 200, y: 0 }, "phi -> psi");
      const mpResult = applyMPAndConnect(ws, "node-1", "node-2", {
        x: 100,
        y: 100,
      });
      ws = mpResult.workspace;
      // MP作成後: 2コネクション + 1 InferenceEdge
      expect(ws.connections).toHaveLength(2);
      expect(ws.inferenceEdges).toHaveLength(1);
      // 片方のコネクションを削除 → 両方消える + InferenceEdge も消える
      ws = removeConnection(ws, "conn-node-1-out-node-3-premise-left");
      expect(ws.connections).toHaveLength(0);
      expect(ws.inferenceEdges).toHaveLength(0);
    });

    it("node becomes root-unmarked after removing inference connections", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Ax1", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "axiom", "Ax2", { x: 200, y: 0 }, "phi -> psi");
      const mpResult = applyMPAndConnect(ws, "node-1", "node-2", {
        x: 100,
        y: 100,
      });
      ws = mpResult.workspace;
      // MP結論ノードは derived
      expect(ws.connections.some((c) => c.toNodeId === "node-3")).toBe(true);
      // コネクション削除後 → ルートノードになる
      ws = removeConnection(ws, "conn-node-2-out-node-3-premise-right");
      expect(ws.connections.some((c) => c.toNodeId === "node-3")).toBe(false);
    });

    it("returns unchanged state for non-existent connectionId", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 });
      const result = removeConnection(ws, "non-existent-id");
      expect(result).toBe(ws);
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
      ws = addNode(ws, "axiom", "MP", { x: 100, y: 100 });
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
      expect(Either.isRight(result.validation)).toBe(true);
      expect(result.workspace.nodes).toHaveLength(3);
      // 互換性: レガシーの接続とInferenceEdgeの両方が作成される
      expect(result.workspace.connections).toHaveLength(2);
      expect(result.workspace.inferenceEdges.length).toBeGreaterThanOrEqual(1);

      // Derived node should have conclusion formula text set
      const mpNode = findNode(result.workspace, "node-3");
      expect(mpNode).toBeDefined();
      expect(mpNode!.kind).toBe("axiom");
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

      expect(Either.isLeft(result.validation)).toBe(true);
      if (Either.isLeft(result.validation)) {
        expect(result.validation.left._tag).toBe("MPRuleError");
      }
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

      expect(Either.isLeft(result.validation)).toBe(true);
      if (Either.isLeft(result.validation)) {
        expect(result.validation.left._tag).toBe("MPRuleError");
      }
    });

    it("returns error when left formula is empty", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "");
      ws = addNode(ws, "axiom", "Axiom", { x: 200, y: 0 }, "phi -> psi");

      const result = applyMPAndConnect(ws, "node-1", "node-2", {
        x: 100,
        y: 150,
      });

      expect(Either.isLeft(result.validation)).toBe(true);
      if (Either.isLeft(result.validation)) {
        expect(result.validation.left._tag).toBe("LeftParseError");
      }
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

  describe("applyGenAndConnect", () => {
    it("creates derived node with InferenceEdge and validates successfully", () => {
      let ws = createEmptyWorkspace(predicateLogicSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "phi");

      const result = applyGenAndConnect(ws, "node-1", "x", {
        x: 0,
        y: 150,
      });

      expect(result.genNodeId).toBe("node-2");
      expect(Either.isRight(result.validation)).toBe(true);
      expect(result.workspace.nodes).toHaveLength(2);
      // 互換性: レガシーの接続とInferenceEdgeの両方が作成される
      expect(result.workspace.connections).toHaveLength(1);
      expect(result.workspace.inferenceEdges.length).toBeGreaterThanOrEqual(1);

      const genNode = findNode(result.workspace, "node-2");
      expect(genNode).toBeDefined();
      expect(genNode!.kind).toBe("axiom");
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

      expect(Either.isLeft(result.validation)).toBe(true);
      if (Either.isLeft(result.validation)) {
        expect(result.validation.left._tag).toBe("GenGeneralizationNotEnabled");
      }
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

      expect(Either.isLeft(result.validation)).toBe(true);
      if (Either.isLeft(result.validation)) {
        expect(result.validation.left._tag).toBe("GenPremiseParseError");
      }
    });

    it("does not mutate original state", () => {
      let ws = createEmptyWorkspace(predicateLogicSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "phi");

      applyGenAndConnect(ws, "node-1", "x", { x: 0, y: 150 });

      expect(ws.nodes).toHaveLength(1);
      expect(ws.connections).toHaveLength(0);
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
      expect(substNode?.kind).toBe("axiom");
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
      expect(Either.isLeft(result.validation)).toBe(true);
      if (Either.isLeft(result.validation)) {
        expect(result.validation.left._tag).toBe("SubstNoEntries");
      }
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
      expect(Either.isRight(result.validation)).toBe(true);
      if (Either.isRight(result.validation)) {
        expect(result.validation.right.conclusionText).toBe("α → β → α");
      }
    });

    it("returns PremiseParseError when premise has parse error", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "-> bad");
      const result = applySubstitutionAndConnect(ws, "node-1", singleEntry, {
        x: 0,
        y: 150,
      });
      expect(Either.isLeft(result.validation)).toBe(true);
      if (Either.isLeft(result.validation)) {
        expect(result.validation.left._tag).toBe("SubstPremiseParseError");
      }
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

    it("sets role to 'axiom' on a second node", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "axiom", "Axiom", { x: 100, y: 0 }, "psi");
      const result = updateNodeRole(ws, "node-2", "axiom");
      expect(result.nodes[1]!.role).toBe("axiom");
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
      const result = updateNodeRole(ws, "node-1", "axiom");
      expect(result.nodes[0]!.role).toBe("axiom");
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
    it("creates quest mode workspace with goals", () => {
      const ws = createQuestWorkspace(lukasiewiczSystem, [
        { formulaText: "phi -> phi" },
      ]);
      expect(ws.mode).toBe("quest");
      expect(ws.nodes).toHaveLength(0);
      expect(ws.goals).toHaveLength(1);
      expect(ws.goals[0]!.formulaText).toBe("phi -> phi");
      expect(ws.goals[0]!.id).toBe("goal-1");
    });

    it("creates multiple goals", () => {
      const ws = createQuestWorkspace(lukasiewiczSystem, [
        { formulaText: "phi -> phi" },
        {
          formulaText: "psi -> phi -> psi",
          label: "Goal 2",
        },
      ]);
      expect(ws.goals).toHaveLength(2);
      expect(ws.goals[0]!.id).toBe("goal-1");
      expect(ws.goals[1]!.id).toBe("goal-2");
      expect(ws.goals[1]!.label).toBe("Goal 2");
      expect(ws.nodes).toHaveLength(0);
    });

    it("uses undefined label when not specified", () => {
      const ws = createQuestWorkspace(lukasiewiczSystem, [
        { formulaText: "phi" },
      ]);
      expect(ws.goals[0]!.label).toBeUndefined();
    });

    it("creates empty quest workspace with no goals", () => {
      const ws = createQuestWorkspace(lukasiewiczSystem, []);
      expect(ws.mode).toBe("quest");
      expect(ws.goals).toHaveLength(0);
      expect(ws.nodes).toHaveLength(0);
    });

    it("passes allowedAxiomIds to goals", () => {
      const ws = createQuestWorkspace(lukasiewiczSystem, [
        { formulaText: "phi", allowedAxiomIds: ["A1", "A2"] },
      ]);
      expect(ws.goals[0]!.allowedAxiomIds).toEqual(["A1", "A2"]);
    });

    it("accepts DeductionSystem directly", () => {
      const ds = hilbertDeduction(lukasiewiczSystem);
      const ws = createQuestWorkspace(ds, [{ formulaText: "phi -> phi" }]);
      expect(ws.mode).toBe("quest");
      expect(ws.deductionSystem).toBe(ds);
      expect(ws.goals).toHaveLength(1);
    });
  });

  describe("addGoal", () => {
    it("adds a goal to the workspace", () => {
      const ws = createEmptyWorkspace(lukasiewiczSystem);
      const result = addGoal(ws, "phi -> phi");
      expect(result.goals).toHaveLength(1);
      expect(result.goals[0]!.formulaText).toBe("phi -> phi");
      expect(result.goals[0]!.id).toBe("goal-1");
    });

    it("adds a goal with label and allowedAxiomIds", () => {
      const ws = createEmptyWorkspace(lukasiewiczSystem);
      const result = addGoal(ws, "phi", {
        label: "Test Goal",
        allowedAxiomIds: ["A1"],
      });
      expect(result.goals[0]!.label).toBe("Test Goal");
      expect(result.goals[0]!.allowedAxiomIds).toEqual(["A1"]);
    });

    it("adds multiple goals with incrementing IDs", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addGoal(ws, "phi");
      ws = addGoal(ws, "psi");
      expect(ws.goals).toHaveLength(2);
      expect(ws.goals[0]!.id).toBe("goal-1");
      expect(ws.goals[1]!.id).toBe("goal-2");
    });

    it("does not mutate original state", () => {
      const ws = createEmptyWorkspace(lukasiewiczSystem);
      addGoal(ws, "phi");
      expect(ws.goals).toHaveLength(0);
    });
  });

  describe("removeGoal", () => {
    it("removes a goal by ID", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addGoal(ws, "phi");
      ws = addGoal(ws, "psi");
      const result = removeGoal(ws, "goal-1");
      expect(result.goals).toHaveLength(1);
      expect(result.goals[0]!.formulaText).toBe("psi");
    });

    it("returns unchanged state for non-existent goal ID", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addGoal(ws, "phi");
      const result = removeGoal(ws, "non-existent");
      expect(result.goals).toHaveLength(1);
    });

    it("does not mutate original state", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addGoal(ws, "phi");
      removeGoal(ws, "goal-1");
      expect(ws.goals).toHaveLength(1);
    });
  });

  describe("updateGoalFormulaText", () => {
    it("updates formula text of a goal", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addGoal(ws, "phi");
      const result = updateGoalFormulaText(ws, "goal-1", "psi -> phi");
      expect(result.goals[0]!.formulaText).toBe("psi -> phi");
    });

    it("does not affect other goals", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addGoal(ws, "phi");
      ws = addGoal(ws, "psi");
      const result = updateGoalFormulaText(ws, "goal-1", "chi");
      expect(result.goals[0]!.formulaText).toBe("chi");
      expect(result.goals[1]!.formulaText).toBe("psi");
    });

    it("does not mutate original state", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addGoal(ws, "phi");
      updateGoalFormulaText(ws, "goal-1", "psi");
      expect(ws.goals[0]!.formulaText).toBe("phi");
    });
  });

  describe("isNodeProtected", () => {
    it("returns false for free mode nodes", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 });
      expect(isNodeProtected(ws, "node-1")).toBe(false);
    });

    it("always returns false (goals are separate from nodes)", () => {
      const ws = createQuestWorkspace(lukasiewiczSystem, [
        { formulaText: "phi" },
      ]);
      // Even in quest mode, no nodes are protected because goals are separate
      expect(ws.nodes).toHaveLength(0);
    });

    it("returns false for nodes in quest mode", () => {
      let ws = createQuestWorkspace(lukasiewiczSystem, [
        { formulaText: "phi" },
      ]);
      ws = addNode(ws, "axiom", "Axiom", { x: 100, y: 0 });
      expect(isNodeProtected(ws, "node-1")).toBe(false);
    });

    it("returns false for non-existent node", () => {
      const ws = createQuestWorkspace(lukasiewiczSystem, [
        { formulaText: "phi" },
      ]);
      expect(isNodeProtected(ws, "non-existent")).toBe(false);
    });
  });

  describe("quest mode with goals", () => {
    it("quest mode has no protected nodes (goals are separate)", () => {
      const ws = createQuestWorkspace(lukasiewiczSystem, [
        { formulaText: "phi" },
      ]);
      // No nodes exist, goals are in ws.goals
      expect(ws.nodes).toHaveLength(0);
      expect(ws.goals).toHaveLength(1);
      expect(ws.goals[0]!.formulaText).toBe("phi");
    });

    it("allows removing nodes in quest mode (no protection)", () => {
      let ws = createQuestWorkspace(lukasiewiczSystem, [
        { formulaText: "phi" },
      ]);
      ws = addNode(ws, "axiom", "Axiom", { x: 100, y: 0 });
      const result = removeNode(ws, "node-1");
      expect(result.nodes).toHaveLength(0);
      // Goals remain unaffected
      expect(result.goals).toHaveLength(1);
    });

    it("allows updating formula text of nodes in quest mode", () => {
      let ws = createQuestWorkspace(lukasiewiczSystem, [
        { formulaText: "phi" },
      ]);
      ws = addNode(ws, "axiom", "Axiom", { x: 100, y: 0 });
      const result = updateNodeFormulaText(ws, "node-1", "psi");
      expect(result.nodes[0]!.formulaText).toBe("psi");
    });

    it("allows updating role of nodes in quest mode", () => {
      let ws = createQuestWorkspace(lukasiewiczSystem, [
        { formulaText: "phi" },
      ]);
      ws = addNode(ws, "axiom", "Axiom", { x: 100, y: 0 });
      const result = updateNodeRole(ws, "node-1", "axiom");
      expect(result.nodes[0]!.role).toBe("axiom");
    });

    it("goals persist when nodes are added/removed", () => {
      let ws = createQuestWorkspace(lukasiewiczSystem, [
        { formulaText: "phi" },
      ]);
      ws = addNode(ws, "axiom", "Axiom", { x: 100, y: 0 }, "phi");
      expect(ws.goals).toHaveLength(1);
      ws = removeNode(ws, "node-1");
      expect(ws.goals).toHaveLength(1);
      expect(ws.goals[0]!.formulaText).toBe("phi");
    });
  });

  describe("convertToFreeMode", () => {
    it("converts quest mode to free mode", () => {
      const ws = createQuestWorkspace(lukasiewiczSystem, [
        { formulaText: "phi" },
      ]);
      const result = convertToFreeMode(ws);
      expect(result.mode).toBe("free");
    });

    it("clears goals after conversion", () => {
      const ws = createQuestWorkspace(lukasiewiczSystem, [
        { formulaText: "phi" },
        { formulaText: "psi" },
      ]);
      const result = convertToFreeMode(ws);
      expect(result.goals).toHaveLength(0);
    });

    it("preserves node data after conversion", () => {
      let ws = createQuestWorkspace(lukasiewiczSystem, [
        { formulaText: "phi -> phi" },
      ]);
      ws = addNode(ws, "axiom", "Axiom", { x: 50, y: 100 }, "phi -> phi");
      const result = convertToFreeMode(ws);
      expect(result.nodes[0]!.formulaText).toBe("phi -> phi");
      expect(result.nodes[0]!.position).toEqual({ x: 50, y: 100 });
    });

    it("allows editing after conversion", () => {
      let ws = createQuestWorkspace(lukasiewiczSystem, [
        { formulaText: "phi" },
      ]);
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "phi");
      let freeWs = convertToFreeMode(ws);
      freeWs = updateNodeFormulaText(freeWs, "node-1", "psi");
      expect(freeWs.nodes[0]!.formulaText).toBe("psi");
    });

    it("allows deletion after conversion", () => {
      let ws = createQuestWorkspace(lukasiewiczSystem, [
        { formulaText: "phi" },
      ]);
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "phi");
      let freeWs = convertToFreeMode(ws);
      freeWs = removeNode(freeWs, "node-1");
      expect(freeWs.nodes).toHaveLength(0);
    });

    it("returns same state if already free mode", () => {
      const ws = createEmptyWorkspace(lukasiewiczSystem);
      const result = convertToFreeMode(ws);
      expect(result).toBe(ws);
    });

    it("preserves nodes during conversion", () => {
      let ws = createQuestWorkspace(lukasiewiczSystem, [
        { formulaText: "phi" },
      ]);
      ws = addNode(ws, "axiom", "Axiom", { x: 100, y: 0 }, "psi");
      const result = convertToFreeMode(ws);
      expect(result.nodes).toHaveLength(1);
      expect(result.nodes[0]!.formulaText).toBe("psi");
    });

    it("does not mutate original state", () => {
      const ws = createQuestWorkspace(lukasiewiczSystem, [
        { formulaText: "phi" },
      ]);
      convertToFreeMode(ws);
      expect(ws.mode).toBe("quest");
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

    it("pastes nodes without special properties", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "phi");
      ws = updateNodeRole(ws, "node-1", "axiom");
      const clipboard = copySelectedNodes(ws, new Set(["node-1"]));
      const result = pasteNodes(ws, clipboard, { x: 500, y: 500 });
      expect(result.nodes).toHaveLength(2);
      expect(result.nodes[1]!.formulaText).toBe("phi");
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

  describe("importProofFromCollection", () => {
    it("imports proof entry nodes into workspace with new IDs", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "phi");

      const entry: ProofEntry = {
        id: "proof-1",
        name: "Test",
        memo: "",
        folderId: undefined,
        createdAt: 1000,
        updatedAt: 1000,
        nodes: [
          {
            originalId: "old-1",
            kind: "axiom",
            label: "",
            formulaText: "psi -> psi",
            relativePosition: { x: 0, y: 0 },
          },
        ],
        connections: [],
        inferenceEdges: [],
        deductionStyle: "hilbert",
        usedAxiomIds: [],
      };

      const result = importProofFromCollection(ws, entry, { x: 300, y: 300 });
      expect(result.nodes).toHaveLength(2);
      expect(result.nodes[1]?.id).toBe("node-2");
      expect(result.nodes[1]?.formulaText).toBe("psi -> psi");
      expect(result.nodes[1]?.position).toEqual({ x: 300, y: 300 });
      expect(result.nextNodeId).toBe(3);
    });

    it("preserves InferenceEdges from imported proof entry", () => {
      const ws = createEmptyWorkspace(lukasiewiczSystem);

      const entry: ProofEntry = {
        id: "proof-1",
        name: "MP Proof",
        memo: "",
        folderId: undefined,
        createdAt: 1000,
        updatedAt: 1000,
        nodes: [
          {
            originalId: "old-1",
            kind: "axiom",
            label: "",
            formulaText: "phi",
            relativePosition: { x: -100, y: 0 },
          },
          {
            originalId: "old-2",
            kind: "axiom",
            label: "",
            formulaText: "phi -> psi",
            relativePosition: { x: 100, y: 0 },
          },
          {
            originalId: "old-3",
            kind: "conclusion",
            label: "",
            formulaText: "psi",
            relativePosition: { x: 0, y: 100 },
          },
        ],
        connections: [],
        inferenceEdges: [
          {
            _tag: "mp",
            conclusionNodeId: "old-3",
            leftPremiseNodeId: "old-1",
            rightPremiseNodeId: "old-2",
            conclusionText: "psi",
          },
        ],
        deductionStyle: "hilbert",
        usedAxiomIds: ["A1"],
      };

      const result = importProofFromCollection(ws, entry, { x: 200, y: 200 });
      expect(result.nodes).toHaveLength(3);
      expect(result.inferenceEdges).toHaveLength(1);
      const edge = result.inferenceEdges[0];
      expect(edge?.conclusionNodeId).toBe("node-3");
      if (edge?._tag === "mp") {
        expect(edge.leftPremiseNodeId).toBe("node-1");
        expect(edge.rightPremiseNodeId).toBe("node-2");
      }
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

    it("removes all selected nodes (no protection)", () => {
      let ws = createQuestWorkspace(lukasiewiczSystem, [
        { formulaText: "phi" },
      ]);
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "phi");
      const result = removeSelectedNodes(ws, new Set(["node-1"]));
      expect(result.nodes).toHaveLength(0);
      // Goals remain unaffected
      expect(result.goals).toHaveLength(1);
    });

    it("returns unchanged state when selecting non-existent nodes", () => {
      const ws = createQuestWorkspace(lukasiewiczSystem, [
        { formulaText: "phi" },
      ]);
      const result = removeSelectedNodes(ws, new Set(["non-existent"]));
      expect(result.nodes).toStrictEqual(ws.nodes);
      expect(result.connections).toStrictEqual(ws.connections);
      expect(result.goals).toStrictEqual(ws.goals);
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
      ws = addNode(ws, "axiom", "MP-1", { x: 100, y: 150 });
      ws = addNode(ws, "axiom", "MP-2", { x: 200, y: 300 });
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
      ws = addNode(ws, "axiom", "MP", { x: 0, y: 0 }, "phi -> psi");
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
      ws = addNode(ws, "axiom", "MP", { x: 0, y: 0 }, "psi");
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
      ws = addNode(ws, "axiom", "MP", { x: 0, y: 0 }, "psi");
      ws = addConnection(ws, "node-1", "out", "node-2", "premise-left");

      const nodeSizes = new Map([
        ["node-1", { width: 200, height: 80 }],
        ["node-2", { width: 150, height: 60 }],
      ]);
      const result = applyTreeLayout(ws, "top-to-bottom", nodeSizes);

      const posA1 = result.nodes.find((n) => n.id === "node-1")!.position;
      const posMp = result.nodes.find((n) => n.id === "node-2")!.position;

      // verticalGap = 120 by default, nodeHeight = 80
      expect(posMp.y - posA1.y).toBe(80 + 120);
    });

    it("空のワークスペースでエラーにならない", () => {
      const ws = createEmptyWorkspace(lukasiewiczSystem);
      const result = applyTreeLayout(ws, "top-to-bottom");
      expect(result.nodes).toHaveLength(0);
    });

    it("接続のないノードもレイアウトされる", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "axiom", "MP", { x: 0, y: 0 }, "psi");
      ws = addConnection(ws, "node-1", "out", "node-2", "premise-left");
      // node-3 は孤立ノード（接続なし）
      ws = addNode(ws, "axiom", "Axiom", { x: 500, y: 500 }, "chi");

      const result = applyTreeLayout(ws, "top-to-bottom");

      expect(result.nodes).toHaveLength(3);
      // 孤立ノードにもレイアウト位置が割り当てられる
      const isolatedNode = result.nodes.find((n) => n.id === "node-3")!;
      expect(isolatedNode.position).toBeDefined();
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

    it("クエストモードでもノードの複製は可能", () => {
      let ws = createQuestWorkspace(lukasiewiczSystem, [
        { formulaText: "phi -> phi" },
      ]);
      ws = addNode(ws, "axiom", "Axiom", { x: 100, y: 100 }, "phi -> phi");
      const selected = new Set(["node-1"]);
      const result = duplicateSelectedNodes(ws, selected);
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

    it("axiomノードの複製はroleが保持される（duplicateSelectedNodes）", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Ax1", { x: 100, y: 100 }, "phi -> phi");
      ws = updateNodeRole(ws, "node-1", "axiom");

      const result = duplicateSelectedNodes(ws, new Set(["node-1"]));
      expect(result.workspace.nodes).toHaveLength(2);
      const newNode = result.workspace.nodes.find((n) =>
        result.newNodeIds.has(n.id),
      )!;
      expect(newNode.formulaText).toBe("phi -> phi");
      expect(newNode.role).toBe("axiom");
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

    it("axiomノードをduplicateNodeで複製するとroleが保持される", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Ax1", { x: 50, y: 50 }, "phi -> phi");
      ws = updateNodeRole(ws, "node-1", "axiom");

      const result = duplicateNode(ws, "node-1");
      const newNode = result.workspace.nodes.find((n) =>
        result.newNodeIds.has(n.id),
      )!;
      expect(newNode.role).toBe("axiom");
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

    it("クエストモードでもノードはカットできる", () => {
      let ws = createQuestWorkspace(lukasiewiczSystem, [
        { formulaText: "phi -> phi" },
      ]);
      ws = addNode(ws, "axiom", "Axiom", { x: 100, y: 100 }, "phi -> phi");
      const selected = new Set(["node-1"]);
      const result = cutSelectedNodes(ws, selected);

      // ノードは削除される（保護なし）
      expect(result.workspace.nodes).toHaveLength(0);
      // ClipboardDataにはコピーされる
      expect(result.clipboardData.nodes).toHaveLength(1);
      // ゴールは残る
      expect(result.workspace.goals).toHaveLength(1);
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
      ws = addNode(ws, "axiom", "MP", { x: 0, y: 0 }, "psi");
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
      ws = addNode(ws, "axiom", "MP", { x: 100, y: 200 }, "psi");
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

    // --- ND バリデーション統合テスト ---

    it("updates ND →I conclusion text when premise is valid", () => {
      let ws = createEmptyWorkspace(naturalDeduction(nmSystem));
      ws = addNode(ws, "axiom", "premise", { x: 0, y: 0 }, "psi");
      ws = addNode(ws, "axiom", "conclusion", { x: 100, y: 100 });
      ws = {
        ...ws,
        inferenceEdges: [
          ...ws.inferenceEdges,
          {
            _tag: "nd-implication-intro" as const,
            conclusionNodeId: "node-2",
            premiseNodeId: "node-1",
            dischargedFormulaText: "phi",
            dischargedAssumptionId: 1,
            conclusionText: "",
          },
        ],
      };
      ws = revalidateInferenceConclusions(ws);
      expect(findNode(ws, "node-2")?.formulaText).toBe("φ → ψ");
    });

    it("updates ND →E conclusion text", () => {
      let ws = createEmptyWorkspace(naturalDeduction(nmSystem));
      ws = addNode(ws, "axiom", "left", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "axiom", "right", { x: 200, y: 0 }, "phi -> psi");
      ws = addNode(ws, "axiom", "conclusion", { x: 100, y: 100 });
      ws = {
        ...ws,
        inferenceEdges: [
          ...ws.inferenceEdges,
          {
            _tag: "nd-implication-elim" as const,
            conclusionNodeId: "node-3",
            leftPremiseNodeId: "node-1",
            rightPremiseNodeId: "node-2",
            conclusionText: "",
          },
        ],
      };
      ws = revalidateInferenceConclusions(ws);
      expect(findNode(ws, "node-3")?.formulaText).toBe("ψ");
    });

    it("updates ND ∧I conclusion text", () => {
      let ws = createEmptyWorkspace(naturalDeduction(nmSystem));
      ws = addNode(ws, "axiom", "left", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "axiom", "right", { x: 200, y: 0 }, "psi");
      ws = addNode(ws, "axiom", "conclusion", { x: 100, y: 100 });
      ws = {
        ...ws,
        inferenceEdges: [
          ...ws.inferenceEdges,
          {
            _tag: "nd-conjunction-intro" as const,
            conclusionNodeId: "node-3",
            leftPremiseNodeId: "node-1",
            rightPremiseNodeId: "node-2",
            conclusionText: "",
          },
        ],
      };
      ws = revalidateInferenceConclusions(ws);
      expect(findNode(ws, "node-3")?.formulaText).toBe("φ ∧ ψ");
    });

    it("updates ND ∧E_L conclusion text", () => {
      let ws = createEmptyWorkspace(naturalDeduction(nmSystem));
      ws = addNode(ws, "axiom", "premise", { x: 0, y: 0 }, "phi /\\ psi");
      ws = addNode(ws, "axiom", "conclusion", { x: 100, y: 100 });
      ws = {
        ...ws,
        inferenceEdges: [
          ...ws.inferenceEdges,
          {
            _tag: "nd-conjunction-elim-left" as const,
            conclusionNodeId: "node-2",
            premiseNodeId: "node-1",
            conclusionText: "",
          },
        ],
      };
      ws = revalidateInferenceConclusions(ws);
      expect(findNode(ws, "node-2")?.formulaText).toBe("φ");
    });

    it("updates ND ∧E_R conclusion text", () => {
      let ws = createEmptyWorkspace(naturalDeduction(nmSystem));
      ws = addNode(ws, "axiom", "premise", { x: 0, y: 0 }, "phi /\\ psi");
      ws = addNode(ws, "axiom", "conclusion", { x: 100, y: 100 });
      ws = {
        ...ws,
        inferenceEdges: [
          ...ws.inferenceEdges,
          {
            _tag: "nd-conjunction-elim-right" as const,
            conclusionNodeId: "node-2",
            premiseNodeId: "node-1",
            conclusionText: "",
          },
        ],
      };
      ws = revalidateInferenceConclusions(ws);
      expect(findNode(ws, "node-2")?.formulaText).toBe("ψ");
    });

    it("updates ND DNE conclusion text", () => {
      let ws = createEmptyWorkspace(naturalDeduction(nmSystem));
      ws = addNode(ws, "axiom", "premise", { x: 0, y: 0 }, "not not phi");
      ws = addNode(ws, "axiom", "conclusion", { x: 100, y: 100 });
      ws = {
        ...ws,
        inferenceEdges: [
          ...ws.inferenceEdges,
          {
            _tag: "nd-dne" as const,
            conclusionNodeId: "node-2",
            premiseNodeId: "node-1",
            conclusionText: "",
          },
        ],
      };
      ws = revalidateInferenceConclusions(ws);
      expect(findNode(ws, "node-2")?.formulaText).toBe("φ");
    });

    it("clears ND conclusion text on validation error", () => {
      let ws = createEmptyWorkspace(naturalDeduction(nmSystem));
      ws = addNode(ws, "axiom", "premise", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "axiom", "conclusion", { x: 100, y: 100 }, "old text");
      ws = {
        ...ws,
        inferenceEdges: [
          ...ws.inferenceEdges,
          {
            _tag: "nd-conjunction-elim-left" as const,
            conclusionNodeId: "node-2",
            premiseNodeId: "node-1",
            conclusionText: "",
          },
        ],
      };
      // phi is not a conjunction → validation error → clear
      ws = revalidateInferenceConclusions(ws);
      expect(findNode(ws, "node-2")?.formulaText).toBe("");
    });

    it("does not update EFQ conclusion text (preserves user input)", () => {
      let ws = createEmptyWorkspace(naturalDeduction(nmSystem));
      ws = addNode(ws, "axiom", "premise", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "axiom", "conclusion", { x: 100, y: 100 }, "user text");
      ws = {
        ...ws,
        inferenceEdges: [
          ...ws.inferenceEdges,
          {
            _tag: "nd-efq" as const,
            conclusionNodeId: "node-2",
            premiseNodeId: "node-1",
            conclusionText: "",
          },
        ],
      };
      ws = revalidateInferenceConclusions(ws);
      // EFQ should NOT change the conclusion text
      expect(findNode(ws, "node-2")?.formulaText).toBe("user text");
    });

    it("updates ND conclusion on premise change", () => {
      let ws = createEmptyWorkspace(naturalDeduction(nmSystem));
      ws = addNode(ws, "axiom", "premise", { x: 0, y: 0 }, "phi /\\ psi");
      ws = addNode(ws, "axiom", "conclusion", { x: 100, y: 100 });
      ws = {
        ...ws,
        inferenceEdges: [
          ...ws.inferenceEdges,
          {
            _tag: "nd-conjunction-elim-left" as const,
            conclusionNodeId: "node-2",
            premiseNodeId: "node-1",
            conclusionText: "",
          },
        ],
      };
      ws = revalidateInferenceConclusions(ws);
      expect(findNode(ws, "node-2")?.formulaText).toBe("φ");

      // Change premise
      ws = updateNodeFormulaText(ws, "node-1", "chi /\\ psi");
      ws = revalidateInferenceConclusions(ws);
      expect(findNode(ws, "node-2")?.formulaText).toBe("χ");
    });

    it("clears ND conclusion when premise becomes empty", () => {
      let ws = createEmptyWorkspace(naturalDeduction(nmSystem));
      ws = addNode(ws, "axiom", "premise", { x: 0, y: 0 }, "phi /\\ psi");
      ws = addNode(ws, "axiom", "conclusion", { x: 100, y: 100 });
      ws = {
        ...ws,
        inferenceEdges: [
          ...ws.inferenceEdges,
          {
            _tag: "nd-conjunction-elim-left" as const,
            conclusionNodeId: "node-2",
            premiseNodeId: "node-1",
            conclusionText: "",
          },
        ],
      };
      ws = revalidateInferenceConclusions(ws);
      expect(findNode(ws, "node-2")?.formulaText).toBe("φ");

      ws = updateNodeFormulaText(ws, "node-1", "");
      ws = revalidateInferenceConclusions(ws);
      expect(findNode(ws, "node-2")?.formulaText).toBe("");
    });

    it("TABエッジの前提ノードは revalidate で変更されない", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      // シーケント ¬φ, φ に bs (basic sequent) 公理を適用
      ws = addNode(ws, "axiom", "", { x: 0, y: 0 }, "¬φ, φ");
      const tabResult = applyTabRuleAndConnect(
        ws,
        "node-1",
        { ruleId: "bs", sequentText: "¬φ, φ", principalPosition: 0 },
        [],
      );
      ws = tabResult.workspace;
      const originalText = findNode(ws, "node-1")?.formulaText;

      // 前提を変更してから revalidate
      ws = updateNodeFormulaText(ws, "node-1", "¬ψ, ψ");
      ws = revalidateInferenceConclusions(ws);

      // TABエッジでは formulaText の自動計算を行わないため、変更後のテキストが保持される
      expect(findNode(ws, "node-1")?.formulaText).toBe("¬ψ, ψ");
      expect(findNode(ws, "node-1")?.formulaText).not.toBe(originalText);
    });

    it("ATエッジの結果ノードは revalidate で変更されない", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "", { x: 0, y: 0 }, "T:P ∧ Q");
      const atResult = applyAtRuleAndConnect(
        ws,
        "node-1",
        { ruleId: "alpha-conj", signedFormulaText: "T:P ∧ Q" },
        [
          { x: 100, y: 100 },
          { x: 200, y: 100 },
        ],
      );
      ws = atResult.workspace;
      const resultNode2Text = findNode(ws, "node-2")?.formulaText;
      const resultNode3Text = findNode(ws, "node-3")?.formulaText;

      // 結論ノードのテキストを変更してから revalidate
      ws = updateNodeFormulaText(ws, "node-1", "T:R ∧ S");
      ws = revalidateInferenceConclusions(ws);

      // ATエッジでは formulaText の自動計算を行わないため、結果ノードのテキストは変更されない
      expect(findNode(ws, "node-2")?.formulaText).toBe(resultNode2Text);
      expect(findNode(ws, "node-3")?.formulaText).toBe(resultNode3Text);
    });
  });

  describe("applyTabRuleAndConnect", () => {
    it("バリデーションエラー時は元の状態を返す", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "", { x: 0, y: 0 }, "invalid!!!");
      const result = applyTabRuleAndConnect(
        ws,
        "node-1",
        { ruleId: "bs", sequentText: "invalid!!!", principalPosition: 0 },
        [],
      );
      expect(result.workspace).toBe(ws);
      expect(result.premiseNodeIds).toEqual([]);
      expect(Either.isLeft(result.validation)).toBe(true);
    });

    it("tab-single-result: 連言規則で1前提ノードが作成される", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "", { x: 0, y: 0 }, "φ ∧ ψ");
      const result = applyTabRuleAndConnect(
        ws,
        "node-1",
        {
          ruleId: "conjunction",
          sequentText: "φ ∧ ψ",
          principalPosition: 0,
        },
        [{ x: 100, y: 100 }],
      );
      expect(Either.isRight(result.validation)).toBe(true);
      expect(result.premiseNodeIds).toHaveLength(1);
      // 前提ノードが作成されている
      const premiseNode = findNode(result.workspace, result.premiseNodeIds[0]!);
      expect(premiseNode).toBeDefined();
      // 接続が作成されている
      expect(result.workspace.connections).toHaveLength(1);
      expect(result.workspace.connections[0]!.fromNodeId).toBe("node-1");
      expect(result.workspace.connections[0]!.toNodeId).toBe(
        result.premiseNodeIds[0],
      );
    });

    it("tab-branching-result: 選言規則で2前提ノードが作成される", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "", { x: 0, y: 0 }, "φ ∨ ψ");
      const result = applyTabRuleAndConnect(
        ws,
        "node-1",
        {
          ruleId: "disjunction",
          sequentText: "φ ∨ ψ",
          principalPosition: 0,
        },
        [
          { x: 100, y: 100 },
          { x: 200, y: 100 },
        ],
      );
      expect(Either.isRight(result.validation)).toBe(true);
      expect(result.premiseNodeIds).toHaveLength(2);
      // 2つの前提ノードが作成されている
      const leftNode = findNode(result.workspace, result.premiseNodeIds[0]!);
      const rightNode = findNode(result.workspace, result.premiseNodeIds[1]!);
      expect(leftNode).toBeDefined();
      expect(rightNode).toBeDefined();
      // 2つの接続が作成されている
      expect(result.workspace.connections).toHaveLength(2);
    });
  });

  describe("inferenceEdges sync", () => {
    it("createEmptyWorkspace initializes with empty inferenceEdges", () => {
      const ws = createEmptyWorkspace(lukasiewiczSystem);
      expect(ws.inferenceEdges).toEqual([]);
    });

    it("createQuestWorkspace initializes with empty inferenceEdges", () => {
      const ws = createQuestWorkspace(lukasiewiczSystem, [
        { formulaText: "phi" } satisfies QuestGoalDefinition,
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

    it("removeConnection removes associated InferenceEdge and all connections to that node", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Ax1", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "axiom", "Ax2", { x: 200, y: 0 }, "phi -> psi");
      const mpResult = applyMPAndConnect(ws, "node-1", "node-2", {
        x: 100,
        y: 100,
      });
      ws = mpResult.workspace;
      // Before: 1 InferenceEdge, 2 connections
      expect(ws.inferenceEdges).toHaveLength(1);
      expect(ws.connections).toHaveLength(2);
      // After removing one connection: InferenceEdge is removed, both connections are removed
      ws = removeConnection(ws, "conn-node-1-out-node-3-premise-left");
      expect(ws.inferenceEdges).toHaveLength(0);
      expect(ws.connections).toHaveLength(0);
      // The conclusion node still exists but is no longer derived
      expect(ws.nodes.find((n) => n.id === "node-3")).toBeDefined();
    });

    it("removeConnection resets conclusion node label to default", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Ax1", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "axiom", "Ax2", { x: 200, y: 0 }, "phi -> psi");
      const mpResult = applyMPAndConnect(ws, "node-1", "node-2", {
        x: 100,
        y: 100,
      });
      ws = mpResult.workspace;
      // Before: node-3 has label "MP"
      expect(ws.nodes.find((n) => n.id === "node-3")?.label).toBe("MP");
      // After removing connection: label resets to "Axiom" (default for kind "axiom")
      ws = removeConnection(ws, "conn-node-1-out-node-3-premise-left");
      expect(ws.nodes.find((n) => n.id === "node-3")?.label).toBe("Axiom");
    });

    it("removeConnection resets Substitution node label to default", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Ax1", { x: 0, y: 0 }, "phi -> psi -> phi");
      const entries: SubstitutionEntries = [
        {
          _tag: "FormulaSubstitution",
          metaVariableName: "φ",
          formulaText: "chi",
        },
      ];
      const substResult = applySubstitutionAndConnect(ws, "node-1", entries, {
        x: 100,
        y: 100,
      });
      ws = substResult.workspace;
      // Before: conclusion node has label "Subst"
      expect(ws.nodes.find((n) => n.id === "node-2")?.label).toBe("Subst");
      // After removing connection: label resets
      ws = removeConnection(ws, ws.connections[0]!.id);
      expect(ws.nodes.find((n) => n.id === "node-2")?.label).toBe("Axiom");
    });

    it("removeConnection removes Gen InferenceEdge and connection", () => {
      let ws = createEmptyWorkspace(predicateLogicSystem);
      ws = addNode(ws, "axiom", "Ax1", { x: 0, y: 0 }, "phi");
      const genResult = applyGenAndConnect(ws, "node-1", "x", {
        x: 100,
        y: 100,
      });
      ws = genResult.workspace;
      expect(ws.inferenceEdges).toHaveLength(1);
      expect(ws.connections).toHaveLength(1);
      // コネクション削除 → Gen InferenceEdge も消える
      ws = removeConnection(ws, ws.connections[0]!.id);
      expect(ws.inferenceEdges).toHaveLength(0);
      expect(ws.connections).toHaveLength(0);
    });

    it("removeConnection removes Substitution InferenceEdge and connection", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Ax1", { x: 0, y: 0 }, "phi -> psi -> phi");
      const entries: SubstitutionEntries = [
        {
          _tag: "FormulaSubstitution",
          metaVariableName: "φ",
          formulaText: "chi",
        },
      ];
      const substResult = applySubstitutionAndConnect(ws, "node-1", entries, {
        x: 100,
        y: 100,
      });
      ws = substResult.workspace;
      expect(ws.inferenceEdges).toHaveLength(1);
      expect(ws.connections).toHaveLength(1);
      // コネクション削除 → Substitution InferenceEdge も消える
      ws = removeConnection(ws, ws.connections[0]!.id);
      expect(ws.inferenceEdges).toHaveLength(0);
      expect(ws.connections).toHaveLength(0);
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

    it("updateInferenceEdgeSubstitutionEntries preserves other edges", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      // MP edge: phi + (phi -> psi) → psi
      ws = addNode(ws, "axiom", "Ax", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "axiom", "Ax", { x: 200, y: 0 }, "phi -> psi");
      const mp = applyMPAndConnect(ws, "node-1", "node-2", { x: 100, y: 100 });
      ws = mp.workspace;
      // Substitution edge: psi -> (phi -> psi) → instance
      ws = addNode(ws, "axiom", "Ax", { x: 300, y: 0 }, "phi -> (psi -> phi)");
      const subst = applySubstitutionAndConnect(
        ws,
        "node-4",
        [
          {
            _tag: "FormulaSubstitution",
            metaVariableName: "φ",
            formulaText: "alpha",
          },
        ],
        { x: 300, y: 150 },
      );
      ws = subst.workspace;
      expect(ws.inferenceEdges).toHaveLength(2);

      // Update substitution entries — MP edge should be preserved
      ws = updateInferenceEdgeSubstitutionEntries(ws, "node-5", [
        {
          _tag: "FormulaSubstitution",
          metaVariableName: "φ",
          formulaText: "beta",
        },
      ]);
      // Both edges still exist
      expect(ws.inferenceEdges).toHaveLength(2);
      const mpEdge = ws.inferenceEdges.find((e) => e._tag === "mp");
      expect(mpEdge).toBeDefined();
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

  describe("mergeSelectedNodes", () => {
    it("同一formulaTextの2ノードをマージできる", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Ax1", { x: 0, y: 0 }, "phi -> phi");
      ws = addNode(ws, "axiom", "Ax2", { x: 100, y: 0 }, "phi -> phi");
      const result = mergeSelectedNodes(ws, "node-1", ["node-2"]);
      expect(result._tag).toBe("Success");
      if (result._tag !== "Success") return;
      expect(result.workspace.nodes).toHaveLength(1);
      expect(result.workspace.nodes[0].id).toBe("node-1");
      expect(result.leaderNodeId).toBe("node-1");
      expect(result.absorbedNodeIds).toEqual(["node-2"]);
    });

    it("吸収ノードの出力コネクションがリーダーに付替えられる", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "N1", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "axiom", "N2", { x: 100, y: 0 }, "phi");
      ws = addNode(ws, "axiom", "N3", { x: 200, y: 0 }, "psi");
      ws = addConnection(ws, "node-2", "out", "node-3", "premise-left");
      const result = mergeSelectedNodes(ws, "node-1", ["node-2"]);
      expect(result._tag).toBe("Success");
      if (result._tag !== "Success") return;
      const conn = result.workspace.connections.find(
        (c) => c.toNodeId === "node-3",
      );
      expect(conn?.fromNodeId).toBe("node-1");
    });

    it("MP前提が付替えられ、結論テキストが再検証される", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      // node-1: phi (leader)
      ws = addNode(ws, "axiom", "Ax1", { x: 0, y: 0 }, "phi");
      // node-2: phi (absorbed)
      ws = addNode(ws, "axiom", "Ax2", { x: 100, y: 0 }, "phi");
      // node-3: phi -> psi
      ws = addNode(ws, "axiom", "Ax3", { x: 200, y: 0 }, "phi -> psi");
      // MP: node-2 + node-3 → node-4
      const mp = applyMPAndConnect(ws, "node-2", "node-3", { x: 150, y: 100 });
      ws = mp.workspace;

      const result = mergeSelectedNodes(ws, "node-1", ["node-2"]);
      expect(result._tag).toBe("Success");
      if (result._tag !== "Success") return;
      // MPの前提がnode-1に付替え
      const mpEdge = result.workspace.inferenceEdges.find(
        (e) => e._tag === "mp",
      );
      expect(mpEdge).toBeDefined();
      if (mpEdge?._tag === "mp") {
        expect(mpEdge.leftPremiseNodeId).toBe("node-1");
      }
    });

    it("formulaTextが異なるとエラー", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Ax1", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "axiom", "Ax2", { x: 100, y: 0 }, "psi");
      const result = mergeSelectedNodes(ws, "node-1", ["node-2"]);
      expect(result._tag).toBe("Error");
      if (result._tag !== "Error") return;
      expect(result.error._tag).toBe("FormulaTextMismatch");
    });

    it("吸収対象が空の場合はエラー", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Ax1", { x: 0, y: 0 }, "phi");
      const result = mergeSelectedNodes(ws, "node-1", []);
      expect(result._tag).toBe("Error");
      if (result._tag !== "Error") return;
      expect(result.error._tag).toBe("NotEnoughNodes");
    });
  });

  // ── AT規則適用 ──

  describe("applyAtRuleAndConnect", () => {
    it("α規則(2結論): T(P∧Q) → T(P), T(Q)", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "", { x: 0, y: 0 }, "T:P ∧ Q");
      const result = applyAtRuleAndConnect(
        ws,
        "node-1",
        { ruleId: "alpha-conj", signedFormulaText: "T:P ∧ Q" },
        [
          { x: 100, y: 100 },
          { x: 200, y: 100 },
        ],
      );
      expect(Either.isRight(result.validation)).toBe(true);
      expect(result.resultNodeIds).toHaveLength(2);
      expect(result.workspace.nodes).toHaveLength(3);
      expect(result.workspace.inferenceEdges).toHaveLength(1);
      const edge = result.workspace.inferenceEdges[0]!;
      expect(edge._tag).toBe("at-alpha");
    });

    it("α規則(1結論): T(¬P) → F(P)", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "", { x: 0, y: 0 }, "T:¬P");
      const result = applyAtRuleAndConnect(
        ws,
        "node-1",
        { ruleId: "alpha-neg-t", signedFormulaText: "T:¬P" },
        [{ x: 100, y: 100 }],
      );
      expect(Either.isRight(result.validation)).toBe(true);
      expect(result.resultNodeIds).toHaveLength(1);
      expect(result.workspace.nodes).toHaveLength(2);
    });

    it("β規則: T(P→Q) → [F(P) | T(Q)]", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "", { x: 0, y: 0 }, "T:P → Q");
      const result = applyAtRuleAndConnect(
        ws,
        "node-1",
        { ruleId: "beta-impl", signedFormulaText: "T:P → Q" },
        [
          { x: -100, y: 100 },
          { x: 100, y: 100 },
        ],
      );
      expect(Either.isRight(result.validation)).toBe(true);
      expect(result.resultNodeIds).toHaveLength(2);
      expect(result.workspace.inferenceEdges).toHaveLength(1);
      const edge = result.workspace.inferenceEdges[0]!;
      expect(edge._tag).toBe("at-beta");
    });

    it("γ規則: T(∀x.P(x)) with y → T(P(y))", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "", { x: 0, y: 0 }, "T:∀x.P(x)");
      const result = applyAtRuleAndConnect(
        ws,
        "node-1",
        { ruleId: "gamma-univ", signedFormulaText: "T:∀x.P(x)", termText: "y" },
        [{ x: 100, y: 100 }],
      );
      expect(Either.isRight(result.validation)).toBe(true);
      expect(result.resultNodeIds).toHaveLength(1);
      const edge = result.workspace.inferenceEdges[0]!;
      expect(edge._tag).toBe("at-gamma");
    });

    it("δ規則: T(∃x.P(x)) with eigen z → T(P(z))", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "", { x: 0, y: 0 }, "T:∃x.P(x)");
      const result = applyAtRuleAndConnect(
        ws,
        "node-1",
        {
          ruleId: "delta-exist",
          signedFormulaText: "T:∃x.P(x)",
          eigenVariable: "z",
          branchFormulaTexts: [],
        },
        [{ x: 100, y: 100 }],
      );
      expect(Either.isRight(result.validation)).toBe(true);
      expect(result.resultNodeIds).toHaveLength(1);
      const edge = result.workspace.inferenceEdges[0]!;
      expect(edge._tag).toBe("at-delta");
    });

    it("closure: T(P) と F(P) で閉じる", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "", { x: 0, y: 0 }, "T:P");
      ws = addNode(ws, "axiom", "", { x: 100, y: 0 }, "F:P");
      const result = applyAtRuleAndConnect(
        ws,
        "node-1",
        {
          ruleId: "closure",
          signedFormulaText: "T:P",
          contradictionFormulaText: "F:P",
        },
        [],
        "node-2",
      );
      expect(Either.isRight(result.validation)).toBe(true);
      expect(result.resultNodeIds).toHaveLength(0);
      expect(result.workspace.inferenceEdges).toHaveLength(1);
      const edge = result.workspace.inferenceEdges[0]!;
      expect(edge._tag).toBe("at-closed");
    });

    it("バリデーション失敗時はワークスペースを変更しない", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "", { x: 0, y: 0 }, "T:P");
      const result = applyAtRuleAndConnect(
        ws,
        "node-1",
        { ruleId: "alpha-conj", signedFormulaText: "T:P" },
        [],
      );
      expect(Either.isLeft(result.validation)).toBe(true);
      expect(result.workspace).toBe(ws);
      expect(result.resultNodeIds).toHaveLength(0);
    });

    it("closure without contradictionNodeId creates edge without connection", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "", { x: 0, y: 0 }, "T:P");
      ws = addNode(ws, "axiom", "", { x: 100, y: 0 }, "F:P");
      const result = applyAtRuleAndConnect(
        ws,
        "node-1",
        {
          ruleId: "closure",
          signedFormulaText: "T:P",
          contradictionFormulaText: "F:P",
        },
        [],
        // No contradictionNodeId provided
      );
      expect(Either.isRight(result.validation)).toBe(true);
      expect(result.resultNodeIds).toHaveLength(0);
      // Edge created but no contradiction connection
      expect(result.workspace.inferenceEdges).toHaveLength(1);
      expect(result.workspace.connections).toHaveLength(0);
    });
  });

  describe("changeSystem with DeductionSystem", () => {
    it("changes system via DeductionSystem", () => {
      const ws = createEmptyWorkspace(lukasiewiczSystem);
      const ds = hilbertDeduction(predicateLogicSystem);
      const result = changeSystem(ws, ds);
      expect(result.system).toBe(predicateLogicSystem);
      expect(result.deductionSystem).toBe(ds);
    });
  });

  describe("applyTreeLayout - uncovered branches", () => {
    it("preserves nodes not present in layout positions map", () => {
      // ノードがコネクションを持たず孤立している場合も、
      // ツリーレイアウトで位置が割り当てられないことは通常ないが、
      // DAG→フォレスト変換で考慮される
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Ax1", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "axiom", "Ax2", { x: 200, y: 0 }, "psi");
      // No connections - all nodes should still get positions
      const result = applyTreeLayout(ws, "top-to-bottom");
      // Both nodes should be in the result
      expect(result.nodes).toHaveLength(2);
    });
  });

  describe("removeSelectedNodes - connection branch coverage", () => {
    it("removes connections where source is removable but target is not", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Source", { x: 0, y: 0 });
      ws = addNode(ws, "axiom", "Target", { x: 100, y: 100 });
      ws = addConnection(ws, "node-1", "out", "node-2", "premise-left");
      // Remove only the source node
      const result = removeSelectedNodes(ws, new Set(["node-1"]));
      expect(result.nodes).toHaveLength(1);
      expect(result.nodes[0]!.id).toBe("node-2");
      // Connection should be removed (source was removed)
      expect(result.connections).toHaveLength(0);
    });

    it("removes connections where target is removable but source is not", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Source", { x: 0, y: 0 });
      ws = addNode(ws, "axiom", "Target", { x: 100, y: 100 });
      ws = addConnection(ws, "node-1", "out", "node-2", "premise-left");
      // Remove only the target node
      const result = removeSelectedNodes(ws, new Set(["node-2"]));
      expect(result.nodes).toHaveLength(1);
      expect(result.nodes[0]!.id).toBe("node-1");
      // Connection should be removed (target was removed)
      expect(result.connections).toHaveLength(0);
    });
  });

  describe("revalidateInferenceConclusions - additional branches", () => {
    it("does not change ND conclusion when validation error and text is already empty", () => {
      let ws = createEmptyWorkspace(naturalDeduction(nmSystem));
      ws = addNode(ws, "axiom", "premise", { x: 0, y: 0 }, "phi");
      // Conclusion already empty - ND error should not trigger change
      ws = addNode(ws, "axiom", "conclusion", { x: 100, y: 100 }, "");
      ws = {
        ...ws,
        inferenceEdges: [
          ...ws.inferenceEdges,
          {
            _tag: "nd-conjunction-elim-left" as const,
            conclusionNodeId: "node-2",
            premiseNodeId: "node-1",
            conclusionText: "",
          },
        ],
      };
      // phi is not a conjunction → validation error → but text is already "" → no change
      const result = revalidateInferenceConclusions(ws);
      expect(findNode(result, "node-2")?.formulaText).toBe("");
      // State should not change since formulaText was already empty
    });

    it("does not change MP conclusion when text is already correct", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "axiom", "Axiom", { x: 100, y: 0 }, "phi -> psi");
      const mp = applyMPAndConnect(ws, "node-1", "node-2", { x: 50, y: 100 });
      ws = mp.workspace;
      const originalText = findNode(ws, "node-3")?.formulaText;
      expect(originalText).not.toBe("");
      // Revalidate without any changes - text should be same, no update needed
      const result = revalidateInferenceConclusions(ws);
      expect(findNode(result, "node-3")?.formulaText).toBe(originalText);
    });

    it("does not change Gen conclusion when text is already correct", () => {
      let ws = createEmptyWorkspace(predicateLogicSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "phi -> psi");
      const gen = applyGenAndConnect(ws, "node-1", "x", { x: 50, y: 100 });
      ws = gen.workspace;
      const originalText = findNode(ws, "node-2")?.formulaText;
      expect(originalText).not.toBe("");
      // Revalidate without changes
      const result = revalidateInferenceConclusions(ws);
      expect(findNode(result, "node-2")?.formulaText).toBe(originalText);
    });

    it("does not change Substitution conclusion when text is already correct", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
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
      const originalText = findNode(ws, "node-2")?.formulaText;
      expect(originalText).not.toBe("");
      // Revalidate without changes
      const result = revalidateInferenceConclusions(ws);
      expect(findNode(result, "node-2")?.formulaText).toBe(originalText);
    });

    it("does not change ND ∧E_L conclusion when text is already correct", () => {
      let ws = createEmptyWorkspace(naturalDeduction(nmSystem));
      ws = addNode(ws, "axiom", "premise", { x: 0, y: 0 }, "phi /\\ psi");
      ws = addNode(ws, "axiom", "conclusion", { x: 100, y: 100 });
      ws = {
        ...ws,
        inferenceEdges: [
          ...ws.inferenceEdges,
          {
            _tag: "nd-conjunction-elim-left" as const,
            conclusionNodeId: "node-2",
            premiseNodeId: "node-1",
            conclusionText: "",
          },
        ],
      };
      ws = revalidateInferenceConclusions(ws);
      const originalText = findNode(ws, "node-2")?.formulaText;
      expect(originalText).toBe("φ");
      // Revalidate again without changes - should not trigger update
      const result = revalidateInferenceConclusions(ws);
      expect(findNode(result, "node-2")?.formulaText).toBe(originalText);
    });

    it("updates Substitution conclusion text when premise formula changes", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
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
      const originalText = findNode(ws, "node-2")?.formulaText;
      expect(originalText).not.toBe("");
      // 前提ノードの数式を変更（代入結果が変わるはず）
      ws = updateNodeFormulaText(ws, "node-1", "psi -> (chi -> psi)");
      ws = revalidateInferenceConclusions(ws);
      // 結論テキストが新しい前提に基づいて再計算されている
      const newText = findNode(ws, "node-2")?.formulaText;
      expect(newText).not.toBe(originalText);
      expect(newText).not.toBe("");
    });

    it("clears Substitution conclusion text when validation fails", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
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
      const originalText = findNode(ws, "node-2")?.formulaText;
      expect(originalText).not.toBe("");
      // 前提ノードの数式を無効にする
      ws = updateNodeFormulaText(ws, "node-1", "");
      ws = revalidateInferenceConclusions(ws);
      // 検証失敗で結論テキストがクリアされる
      expect(findNode(ws, "node-2")?.formulaText).toBe("");
    });

    it("clears ND conclusion text when validation error and text was non-empty", () => {
      let ws = createEmptyWorkspace(naturalDeduction(nmSystem));
      ws = addNode(ws, "axiom", "premise", { x: 0, y: 0 }, "phi /\\ psi");
      ws = addNode(ws, "axiom", "conclusion", { x: 100, y: 100 });
      ws = {
        ...ws,
        inferenceEdges: [
          ...ws.inferenceEdges,
          {
            _tag: "nd-conjunction-elim-left" as const,
            conclusionNodeId: "node-2",
            premiseNodeId: "node-1",
            conclusionText: "",
          },
        ],
      };
      // まず有効な状態で結論テキストを計算
      ws = revalidateInferenceConclusions(ws);
      expect(findNode(ws, "node-2")?.formulaText).toBe("φ");
      // 前提を無効な数式に変更（結合ではない）
      ws = updateNodeFormulaText(ws, "node-1", "phi");
      ws = revalidateInferenceConclusions(ws);
      // バリデーションエラーでテキストがクリアされる
      expect(findNode(ws, "node-2")?.formulaText).toBe("");
    });

    it("does not change SC node when revalidating (SC premises are computed at rule application time)", () => {
      const scDeduction = sequentCalculusDeduction(lkSystem);
      let ws = createEmptyWorkspace(scDeduction);
      ws = addNode(ws, "axiom", "", { x: 0, y: 0 }, "φ, ψ ⇒ χ");
      // SC規則適用で前提ノードを作成
      const applied = applyScRuleAndConnect(
        ws,
        "node-1",
        {
          ruleId: "weakening-left",
          sequentText: "φ, ψ ⇒ χ",
          principalPosition: 0,
        },
        [{ x: 100, y: 100 }],
      );
      ws = applied.workspace;
      const premiseId = applied.premiseNodeIds[0]!;
      const originalText = findNode(ws, premiseId)?.formulaText;
      expect(originalText).toBeDefined();
      // revalidateしても前提ノードのテキストは変わらない
      const result = revalidateInferenceConclusions(ws);
      expect(findNode(result, premiseId)?.formulaText).toBe(originalText);
    });
  });

  describe("updateInferenceEdgeGenVariableName - edge not found", () => {
    it("handles non-existent gen edge gracefully", () => {
      let ws = createEmptyWorkspace(predicateLogicSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "phi");
      // No gen edge exists for node-1
      const result = updateInferenceEdgeGenVariableName(ws, "node-1", "y");
      // Should not crash; inferenceEdges remain empty
      expect(result.inferenceEdges).toHaveLength(0);
    });

    it("updates variable name on existing gen edge", () => {
      let ws = createEmptyWorkspace(predicateLogicSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "phi -> psi");
      const gen = applyGenAndConnect(ws, "node-1", "x", { x: 50, y: 100 });
      ws = gen.workspace;
      // Genエッジがある状態で変数名を変更
      const result = updateInferenceEdgeGenVariableName(ws, "node-2", "y");
      const genEdge = result.inferenceEdges.find(
        (e) => e._tag === "gen" && e.conclusionNodeId === "node-2",
      );
      expect(genEdge).toBeDefined();
      if (genEdge && genEdge._tag === "gen") {
        expect(genEdge.variableName).toBe("y");
      }
    });
  });

  describe("updateInferenceEdgeSubstitutionEntries - edge not found", () => {
    it("handles non-existent substitution edge gracefully", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "phi");
      // No substitution edge exists for node-1
      const result = updateInferenceEdgeSubstitutionEntries(ws, "node-1", []);
      // Should not crash; inferenceEdges remain empty
      expect(result.inferenceEdges).toHaveLength(0);
    });

    it("updates entries on existing substitution edge", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
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
      const newEntries: SubstitutionEntries = [
        {
          _tag: "FormulaSubstitution",
          metaVariableName: "φ",
          formulaText: "beta",
        },
      ];
      // Substitutionエッジがある状態でエントリを変更
      const result = updateInferenceEdgeSubstitutionEntries(
        ws,
        "node-2",
        newEntries,
      );
      const substEdge = result.inferenceEdges.find(
        (e) => e._tag === "substitution" && e.conclusionNodeId === "node-2",
      );
      expect(substEdge).toBeDefined();
      if (substEdge && substEdge._tag === "substitution") {
        expect(substEdge.entries).toEqual(newEntries);
      }
      // 結論テキストが再計算されている
      const node = findNode(result, "node-2");
      expect(node?.formulaText).not.toBe("");
    });
  });

  describe("applyScRuleAndConnect", () => {
    const scDeduction = sequentCalculusDeduction(lkSystem);

    it("バリデーションエラー時は元の状態を返す", () => {
      let ws = createEmptyWorkspace(scDeduction);
      ws = addNode(ws, "axiom", "", { x: 0, y: 0 }, "invalid!!!");
      const result = applyScRuleAndConnect(
        ws,
        "node-1",
        {
          ruleId: "weakening-left",
          sequentText: "invalid!!!",
          principalPosition: 0,
        },
        [],
      );
      expect(result.workspace).toBe(ws);
      expect(result.premiseNodeIds).toEqual([]);
      expect(Either.isLeft(result.validation)).toBe(true);
    });

    it("sc-axiom-result: identity公理で前提ノードなし", () => {
      let ws = createEmptyWorkspace(scDeduction);
      ws = addNode(ws, "axiom", "", { x: 0, y: 0 }, "φ ⇒ φ");
      const result = applyScRuleAndConnect(
        ws,
        "node-1",
        {
          ruleId: "identity",
          sequentText: "φ ⇒ φ",
          principalPosition: 0,
        },
        [],
      );
      expect(Either.isRight(result.validation)).toBe(true);
      expect(result.premiseNodeIds).toHaveLength(0);
      // エッジが追加されている
      expect(result.workspace.inferenceEdges).toHaveLength(1);
      expect(result.workspace.inferenceEdges[0]!._tag).toBe("sc-axiom");
      // 接続は作成されない（公理なので）
      expect(result.workspace.connections).toHaveLength(0);
    });

    it("sc-single-result: 左弱化規則で1前提ノードが作成される", () => {
      let ws = createEmptyWorkspace(scDeduction);
      ws = addNode(ws, "axiom", "", { x: 0, y: 0 }, "φ, ψ ⇒ χ");
      const result = applyScRuleAndConnect(
        ws,
        "node-1",
        {
          ruleId: "weakening-left",
          sequentText: "φ, ψ ⇒ χ",
          principalPosition: 0,
        },
        [{ x: 100, y: 100 }],
      );
      expect(Either.isRight(result.validation)).toBe(true);
      expect(result.premiseNodeIds).toHaveLength(1);
      // 前提ノードが作成されている
      const premiseNode = findNode(result.workspace, result.premiseNodeIds[0]!);
      expect(premiseNode).toBeDefined();
      // 接続が作成されている
      expect(result.workspace.connections).toHaveLength(1);
      expect(result.workspace.connections[0]!.fromNodeId).toBe("node-1");
      expect(result.workspace.connections[0]!.toNodeId).toBe(
        result.premiseNodeIds[0],
      );
    });

    it("sc-branching-result: カット規則で2前提ノードが作成される", () => {
      let ws = createEmptyWorkspace(scDeduction);
      ws = addNode(ws, "axiom", "", { x: 0, y: 0 }, "φ ⇒ ψ");
      const result = applyScRuleAndConnect(
        ws,
        "node-1",
        {
          ruleId: "cut",
          sequentText: "φ ⇒ ψ",
          principalPosition: 0,
          cutFormulaText: "χ",
        },
        [
          { x: 100, y: 100 },
          { x: 200, y: 100 },
        ],
      );
      expect(Either.isRight(result.validation)).toBe(true);
      expect(result.premiseNodeIds).toHaveLength(2);
      // 2つの前提ノードが作成されている
      const leftNode = findNode(result.workspace, result.premiseNodeIds[0]!);
      const rightNode = findNode(result.workspace, result.premiseNodeIds[1]!);
      expect(leftNode).toBeDefined();
      expect(rightNode).toBeDefined();
      // 2つの接続が作成されている
      expect(result.workspace.connections).toHaveLength(2);
    });

    it("sc-single-result: premisePositionsが空の場合、フォールバック位置を使う", () => {
      let ws = createEmptyWorkspace(scDeduction);
      ws = addNode(ws, "axiom", "", { x: 50, y: 50 }, "φ, ψ ⇒ χ");
      const result = applyScRuleAndConnect(
        ws,
        "node-1",
        {
          ruleId: "weakening-left",
          sequentText: "φ, ψ ⇒ χ",
          principalPosition: 0,
        },
        [], // 空の premisePositions
      );
      expect(Either.isRight(result.validation)).toBe(true);
      expect(result.premiseNodeIds).toHaveLength(1);
      // フォールバック位置 { x: 0, y: 0 } でノードが作成される
      const premiseNode = findNode(result.workspace, result.premiseNodeIds[0]!);
      expect(premiseNode).toBeDefined();
      expect(premiseNode!.position).toEqual({ x: 0, y: 0 });
    });

    it("sc-branching-result: premisePositionsが1つだけの場合、右側にフォールバック位置を使う", () => {
      let ws = createEmptyWorkspace(scDeduction);
      ws = addNode(ws, "axiom", "", { x: 50, y: 50 }, "φ ⇒ ψ");
      const result = applyScRuleAndConnect(
        ws,
        "node-1",
        {
          ruleId: "cut",
          sequentText: "φ ⇒ ψ",
          principalPosition: 0,
          cutFormulaText: "χ",
        },
        [{ x: 100, y: 100 }], // 1つだけ — 右側のフォールバックが使われる
      );
      expect(Either.isRight(result.validation)).toBe(true);
      expect(result.premiseNodeIds).toHaveLength(2);
      const leftNode = findNode(result.workspace, result.premiseNodeIds[0]!);
      const rightNode = findNode(result.workspace, result.premiseNodeIds[1]!);
      expect(leftNode).toBeDefined();
      expect(rightNode).toBeDefined();
      // 左は指定位置、右はフォールバック
      expect(leftNode!.position).toEqual({ x: 100, y: 100 });
      expect(rightNode!.position).toEqual({ x: 0, y: 0 });
    });
  });
});

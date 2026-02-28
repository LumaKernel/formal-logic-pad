import { describe, expect, it } from "vitest";
import { Effect, Either } from "effect";
import {
  lukasiewiczSystem,
  NotAnImplication,
  PremiseMismatch,
} from "../logic-core/inferenceRule";
import { metaVariable } from "../logic-core/formula";
import { createEmptyWorkspace, addNode, addConnection } from "./workspaceState";
import {
  getMPPremises,
  parseNodeFormula,
  validateMPApplicationEffect,
  validateMPApplication,
  getMPErrorMessage,
  computeMPCompatibleNodeIds,
  computeMPLeftCompatibleNodeIds,
  isNodeImplication,
  BothPremisesMissing,
  LeftPremiseMissing,
  RightPremiseMissing,
  LeftParseError,
  RightParseError,
  MPRuleError,
} from "./mpApplicationLogic";
import type { WorkspaceNode } from "./workspaceState";
import type { MPEdge } from "./inferenceEdge";

/** Helper to add an MP inference edge to a workspace state */
function addMPEdge(
  ws: ReturnType<typeof createEmptyWorkspace>,
  conclusionNodeId: string,
  leftPremiseNodeId: string | undefined,
  rightPremiseNodeId: string | undefined,
  conclusionText = "",
): ReturnType<typeof createEmptyWorkspace> {
  const edge: MPEdge = {
    _tag: "mp",
    conclusionNodeId,
    leftPremiseNodeId,
    rightPremiseNodeId,
    conclusionText,
  };
  return {
    ...ws,
    inferenceEdges: [...ws.inferenceEdges, edge],
  };
}

describe("mpApplicationLogic", () => {
  describe("getMPPremises", () => {
    it("returns undefined for both when no inference edge", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "MP", { x: 0, y: 0 });
      const premises = getMPPremises(ws, "node-1");
      expect(premises.leftNodeId).toBeUndefined();
      expect(premises.rightNodeId).toBeUndefined();
    });

    it("returns left premise node id", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "axiom", "MP", { x: 100, y: 100 });
      ws = addConnection(ws, "node-1", "out", "node-2", "premise-left");
      ws = addMPEdge(ws, "node-2", "node-1", undefined);
      const premises = getMPPremises(ws, "node-2");
      expect(premises.leftNodeId).toBe("node-1");
      expect(premises.rightNodeId).toBeUndefined();
    });

    it("returns right premise node id", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "phi -> psi");
      ws = addNode(ws, "axiom", "MP", { x: 100, y: 100 });
      ws = addConnection(ws, "node-1", "out", "node-2", "premise-right");
      ws = addMPEdge(ws, "node-2", undefined, "node-1");
      const premises = getMPPremises(ws, "node-2");
      expect(premises.leftNodeId).toBeUndefined();
      expect(premises.rightNodeId).toBe("node-1");
    });

    it("returns both premise node ids", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "axiom", "Axiom", { x: 200, y: 0 }, "phi -> psi");
      ws = addNode(ws, "axiom", "MP", { x: 100, y: 150 });
      ws = addConnection(ws, "node-1", "out", "node-3", "premise-left");
      ws = addConnection(ws, "node-2", "out", "node-3", "premise-right");
      ws = addMPEdge(ws, "node-3", "node-1", "node-2");
      const premises = getMPPremises(ws, "node-3");
      expect(premises.leftNodeId).toBe("node-1");
      expect(premises.rightNodeId).toBe("node-2");
    });

    it("ignores inference edges for other nodes", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "axiom", "MP-1", { x: 100, y: 100 });
      ws = addNode(ws, "axiom", "MP-2", { x: 200, y: 200 });
      ws = addConnection(ws, "node-1", "out", "node-2", "premise-left");
      ws = addMPEdge(ws, "node-2", "node-1", undefined);
      const premises = getMPPremises(ws, "node-3");
      expect(premises.leftNodeId).toBeUndefined();
      expect(premises.rightNodeId).toBeUndefined();
    });
  });

  describe("parseNodeFormula", () => {
    it("parses a valid formula", () => {
      const node: WorkspaceNode = {
        id: "node-1",
        kind: "axiom",
        label: "Axiom",
        formulaText: "phi -> psi",
        position: { x: 0, y: 0 },
      };
      const formula = parseNodeFormula(node);
      expect(formula).toBeDefined();
      expect(formula!._tag).toBe("Implication");
    });

    it("returns undefined for empty text", () => {
      const node: WorkspaceNode = {
        id: "node-1",
        kind: "axiom",
        label: "Axiom",
        formulaText: "",
        position: { x: 0, y: 0 },
      };
      expect(parseNodeFormula(node)).toBeUndefined();
    });

    it("returns undefined for whitespace-only text", () => {
      const node: WorkspaceNode = {
        id: "node-1",
        kind: "axiom",
        label: "Axiom",
        formulaText: "   ",
        position: { x: 0, y: 0 },
      };
      expect(parseNodeFormula(node)).toBeUndefined();
    });

    it("returns undefined for invalid formula text", () => {
      const node: WorkspaceNode = {
        id: "node-1",
        kind: "axiom",
        label: "Axiom",
        formulaText: "-> -> ->",
        position: { x: 0, y: 0 },
      };
      expect(parseNodeFormula(node)).toBeUndefined();
    });

    it("parses a meta variable", () => {
      const node: WorkspaceNode = {
        id: "node-1",
        kind: "axiom",
        label: "Axiom",
        formulaText: "phi",
        position: { x: 0, y: 0 },
      };
      const formula = parseNodeFormula(node);
      expect(formula).toBeDefined();
      expect(formula!._tag).toBe("MetaVariable");
    });
  });

  describe("validateMPApplication", () => {
    it("returns BothPremisesMissing when no inference edge", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "MP", { x: 0, y: 0 });
      const result = validateMPApplication(ws, "node-1");
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("BothPremisesMissing");
      }
    });

    it("returns LeftPremiseMissing when only right is connected", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "phi -> psi");
      ws = addNode(ws, "axiom", "MP", { x: 100, y: 100 });
      ws = addConnection(ws, "node-1", "out", "node-2", "premise-right");
      ws = addMPEdge(ws, "node-2", undefined, "node-1");
      const result = validateMPApplication(ws, "node-2");
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("LeftPremiseMissing");
      }
    });

    it("returns RightPremiseMissing when only left is connected", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "axiom", "MP", { x: 100, y: 100 });
      ws = addConnection(ws, "node-1", "out", "node-2", "premise-left");
      ws = addMPEdge(ws, "node-2", "node-1", undefined);
      const result = validateMPApplication(ws, "node-2");
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("RightPremiseMissing");
      }
    });

    it("returns LeftParseError when left formula is invalid", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "-> ->");
      ws = addNode(ws, "axiom", "Axiom", { x: 200, y: 0 }, "phi -> psi");
      ws = addNode(ws, "axiom", "MP", { x: 100, y: 150 });
      ws = addConnection(ws, "node-1", "out", "node-3", "premise-left");
      ws = addConnection(ws, "node-2", "out", "node-3", "premise-right");
      ws = addMPEdge(ws, "node-3", "node-1", "node-2");
      const result = validateMPApplication(ws, "node-3");
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("LeftParseError");
      }
    });

    it("returns LeftParseError when left formula is empty", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "");
      ws = addNode(ws, "axiom", "Axiom", { x: 200, y: 0 }, "phi -> psi");
      ws = addNode(ws, "axiom", "MP", { x: 100, y: 150 });
      ws = addConnection(ws, "node-1", "out", "node-3", "premise-left");
      ws = addConnection(ws, "node-2", "out", "node-3", "premise-right");
      ws = addMPEdge(ws, "node-3", "node-1", "node-2");
      const result = validateMPApplication(ws, "node-3");
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("LeftParseError");
      }
    });

    it("returns RightParseError when right formula is invalid", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "axiom", "Axiom", { x: 200, y: 0 }, "-> ->");
      ws = addNode(ws, "axiom", "MP", { x: 100, y: 150 });
      ws = addConnection(ws, "node-1", "out", "node-3", "premise-left");
      ws = addConnection(ws, "node-2", "out", "node-3", "premise-right");
      ws = addMPEdge(ws, "node-3", "node-1", "node-2");
      const result = validateMPApplication(ws, "node-3");
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("RightParseError");
      }
    });

    it("returns MPRuleError NotAnImplication when right is not an implication", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "axiom", "Axiom", { x: 200, y: 0 }, "psi");
      ws = addNode(ws, "axiom", "MP", { x: 100, y: 150 });
      ws = addConnection(ws, "node-1", "out", "node-3", "premise-left");
      ws = addConnection(ws, "node-2", "out", "node-3", "premise-right");
      ws = addMPEdge(ws, "node-3", "node-1", "node-2");
      const result = validateMPApplication(ws, "node-3");
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("MPRuleError");
        if (result.left._tag === "MPRuleError") {
          expect(result.left.error._tag).toBe("NotAnImplication");
        }
      }
    });

    it("returns MPRuleError PremiseMismatch when antecedent does not match", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "axiom", "Axiom", { x: 200, y: 0 }, "psi -> chi");
      ws = addNode(ws, "axiom", "MP", { x: 100, y: 150 });
      ws = addConnection(ws, "node-1", "out", "node-3", "premise-left");
      ws = addConnection(ws, "node-2", "out", "node-3", "premise-right");
      ws = addMPEdge(ws, "node-3", "node-1", "node-2");
      const result = validateMPApplication(ws, "node-3");
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("MPRuleError");
        if (result.left._tag === "MPRuleError") {
          expect(result.left.error._tag).toBe("PremiseMismatch");
        }
      }
    });

    it("returns Success with conclusion when MP is valid", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "axiom", "Axiom", { x: 200, y: 0 }, "phi -> psi");
      ws = addNode(ws, "axiom", "MP", { x: 100, y: 150 });
      ws = addConnection(ws, "node-1", "out", "node-3", "premise-left");
      ws = addConnection(ws, "node-2", "out", "node-3", "premise-right");
      ws = addMPEdge(ws, "node-3", "node-1", "node-2");
      const result = validateMPApplication(ws, "node-3");
      expect(Either.isRight(result)).toBe(true);
      if (Either.isRight(result)) {
        expect(result.right.conclusion._tag).toBe("MetaVariable");
        expect(result.right.conclusionText).toBe("ψ");
      }
    });

    it("handles complex MP application", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "phi -> (psi -> phi)");
      ws = addNode(
        ws,
        "axiom",
        "Axiom",
        { x: 200, y: 0 },
        "(phi -> (psi -> phi)) -> (chi -> (phi -> (psi -> phi)))",
      );
      ws = addNode(ws, "axiom", "MP", { x: 100, y: 150 });
      ws = addConnection(ws, "node-1", "out", "node-3", "premise-left");
      ws = addConnection(ws, "node-2", "out", "node-3", "premise-right");
      ws = addMPEdge(ws, "node-3", "node-1", "node-2");
      const result = validateMPApplication(ws, "node-3");
      expect(Either.isRight(result)).toBe(true);
      if (Either.isRight(result)) {
        expect(result.right.conclusionText).toBe("χ → φ → ψ → φ");
      }
    });

    it("handles chained MP (MP node output as input to another MP)", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      // First MP: phi, phi -> psi => psi
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "axiom", "Axiom", { x: 200, y: 0 }, "phi -> psi");
      ws = addNode(ws, "axiom", "MP-1", { x: 100, y: 150 }, "psi");
      ws = addConnection(ws, "node-1", "out", "node-3", "premise-left");
      ws = addConnection(ws, "node-2", "out", "node-3", "premise-right");
      ws = addMPEdge(ws, "node-3", "node-1", "node-2");
      // Second MP: psi, psi -> chi => chi
      ws = addNode(ws, "axiom", "Axiom", { x: 400, y: 0 }, "psi -> chi");
      ws = addNode(ws, "axiom", "MP-2", { x: 250, y: 300 });
      ws = addConnection(ws, "node-3", "out", "node-5", "premise-left");
      ws = addConnection(ws, "node-4", "out", "node-5", "premise-right");
      ws = addMPEdge(ws, "node-5", "node-3", "node-4");
      const result = validateMPApplication(ws, "node-5");
      expect(Either.isRight(result)).toBe(true);
      if (Either.isRight(result)) {
        expect(result.right.conclusionText).toBe("χ");
      }
    });
  });

  describe("computeMPCompatibleNodeIds", () => {
    it("returns empty set when leftNode not found", () => {
      const nodes: readonly WorkspaceNode[] = [];
      const result = computeMPCompatibleNodeIds(nodes, "nonexistent");
      expect(result.size).toBe(0);
    });

    it("returns empty set when left formula is unparseable", () => {
      const nodes: readonly WorkspaceNode[] = [
        {
          id: "n1",
          kind: "axiom",
          label: "",
          formulaText: "-> ->",
          position: { x: 0, y: 0 },
        },
        {
          id: "n2",
          kind: "axiom",
          label: "",
          formulaText: "phi -> psi",
          position: { x: 100, y: 0 },
        },
      ];
      const result = computeMPCompatibleNodeIds(nodes, "n1");
      expect(result.size).toBe(0);
    });

    it("returns compatible implication nodes with matching antecedent", () => {
      const nodes: readonly WorkspaceNode[] = [
        {
          id: "left",
          kind: "axiom",
          label: "",
          formulaText: "phi",
          position: { x: 0, y: 0 },
        },
        {
          id: "right-ok",
          kind: "axiom",
          label: "",
          formulaText: "phi -> psi",
          position: { x: 100, y: 0 },
        },
        {
          id: "right-mismatch",
          kind: "axiom",
          label: "",
          formulaText: "psi -> chi",
          position: { x: 200, y: 0 },
        },
        {
          id: "not-impl",
          kind: "axiom",
          label: "",
          formulaText: "psi",
          position: { x: 300, y: 0 },
        },
      ];
      const result = computeMPCompatibleNodeIds(nodes, "left");
      expect(result.size).toBe(1);
      expect(result.has("right-ok")).toBe(true);
      expect(result.has("right-mismatch")).toBe(false);
      expect(result.has("not-impl")).toBe(false);
    });

    it("excludes the left node itself from results", () => {
      const nodes: readonly WorkspaceNode[] = [
        {
          id: "n1",
          kind: "axiom",
          label: "",
          formulaText: "phi -> psi",
          position: { x: 0, y: 0 },
        },
        {
          id: "n2",
          kind: "axiom",
          label: "",
          formulaText: "(phi -> psi) -> chi",
          position: { x: 100, y: 0 },
        },
      ];
      const result = computeMPCompatibleNodeIds(nodes, "n1");
      expect(result.has("n1")).toBe(false);
      expect(result.has("n2")).toBe(true);
    });

    it("returns multiple compatible nodes", () => {
      const nodes: readonly WorkspaceNode[] = [
        {
          id: "left",
          kind: "axiom",
          label: "",
          formulaText: "phi",
          position: { x: 0, y: 0 },
        },
        {
          id: "r1",
          kind: "axiom",
          label: "",
          formulaText: "phi -> psi",
          position: { x: 100, y: 0 },
        },
        {
          id: "r2",
          kind: "axiom",
          label: "",
          formulaText: "phi -> chi",
          position: { x: 200, y: 0 },
        },
        {
          id: "r3",
          kind: "axiom",
          label: "",
          formulaText: "phi -> (psi -> chi)",
          position: { x: 300, y: 0 },
        },
      ];
      const result = computeMPCompatibleNodeIds(nodes, "left");
      expect(result.size).toBe(3);
      expect(result.has("r1")).toBe(true);
      expect(result.has("r2")).toBe(true);
      expect(result.has("r3")).toBe(true);
    });

    it("skips nodes with empty formula", () => {
      const nodes: readonly WorkspaceNode[] = [
        {
          id: "left",
          kind: "axiom",
          label: "",
          formulaText: "phi",
          position: { x: 0, y: 0 },
        },
        {
          id: "empty",
          kind: "axiom",
          label: "",
          formulaText: "",
          position: { x: 100, y: 0 },
        },
        {
          id: "ok",
          kind: "axiom",
          label: "",
          formulaText: "phi -> psi",
          position: { x: 200, y: 0 },
        },
      ];
      const result = computeMPCompatibleNodeIds(nodes, "left");
      expect(result.size).toBe(1);
      expect(result.has("ok")).toBe(true);
      expect(result.has("empty")).toBe(false);
    });

    it("handles complex formula as left premise", () => {
      const nodes: readonly WorkspaceNode[] = [
        {
          id: "left",
          kind: "axiom",
          label: "",
          formulaText: "phi -> psi",
          position: { x: 0, y: 0 },
        },
        {
          id: "ok",
          kind: "axiom",
          label: "",
          formulaText: "(phi -> psi) -> chi",
          position: { x: 100, y: 0 },
        },
        {
          id: "wrong",
          kind: "axiom",
          label: "",
          formulaText: "phi -> chi",
          position: { x: 200, y: 0 },
        },
      ];
      const result = computeMPCompatibleNodeIds(nodes, "left");
      expect(result.size).toBe(1);
      expect(result.has("ok")).toBe(true);
    });
  });

  describe("computeMPLeftCompatibleNodeIds", () => {
    it("returns empty set when rightNodeId does not exist", () => {
      const nodes: readonly WorkspaceNode[] = [];
      const result = computeMPLeftCompatibleNodeIds(nodes, "nonexistent");
      expect(result.size).toBe(0);
    });

    it("returns empty set when right node formula is not parseable", () => {
      const nodes: readonly WorkspaceNode[] = [
        {
          id: "n1",
          kind: "axiom",
          label: "",
          formulaText: "???",
          position: { x: 0, y: 0 },
        },
      ];
      const result = computeMPLeftCompatibleNodeIds(nodes, "n1");
      expect(result.size).toBe(0);
    });

    it("returns empty set when right node formula is not an implication", () => {
      const nodes: readonly WorkspaceNode[] = [
        {
          id: "right",
          kind: "axiom",
          label: "",
          formulaText: "phi",
          position: { x: 0, y: 0 },
        },
        {
          id: "n2",
          kind: "axiom",
          label: "",
          formulaText: "phi",
          position: { x: 100, y: 0 },
        },
      ];
      const result = computeMPLeftCompatibleNodeIds(nodes, "right");
      expect(result.size).toBe(0);
    });

    it("returns nodes whose formula matches the antecedent of the right premise", () => {
      const nodes: readonly WorkspaceNode[] = [
        {
          id: "right",
          kind: "axiom",
          label: "",
          formulaText: "phi -> psi",
          position: { x: 0, y: 0 },
        },
        {
          id: "match",
          kind: "axiom",
          label: "",
          formulaText: "phi",
          position: { x: 100, y: 0 },
        },
        {
          id: "nomatch",
          kind: "axiom",
          label: "",
          formulaText: "chi",
          position: { x: 200, y: 0 },
        },
      ];
      const result = computeMPLeftCompatibleNodeIds(nodes, "right");
      expect(result.size).toBe(1);
      expect(result.has("match")).toBe(true);
    });

    it("excludes the right node itself from results", () => {
      const nodes: readonly WorkspaceNode[] = [
        {
          id: "right",
          kind: "axiom",
          label: "",
          formulaText: "phi -> psi",
          position: { x: 0, y: 0 },
        },
      ];
      const result = computeMPLeftCompatibleNodeIds(nodes, "right");
      expect(result.has("right")).toBe(false);
    });

    it("handles nested implications", () => {
      const nodes: readonly WorkspaceNode[] = [
        {
          id: "right",
          kind: "axiom",
          label: "",
          formulaText: "(phi -> psi) -> chi",
          position: { x: 0, y: 0 },
        },
        {
          id: "match",
          kind: "axiom",
          label: "",
          formulaText: "phi -> psi",
          position: { x: 100, y: 0 },
        },
        {
          id: "nomatch",
          kind: "axiom",
          label: "",
          formulaText: "phi",
          position: { x: 200, y: 0 },
        },
      ];
      const result = computeMPLeftCompatibleNodeIds(nodes, "right");
      expect(result.size).toBe(1);
      expect(result.has("match")).toBe(true);
    });

    it("returns multiple compatible nodes", () => {
      const nodes: readonly WorkspaceNode[] = [
        {
          id: "right",
          kind: "axiom",
          label: "",
          formulaText: "phi -> psi",
          position: { x: 0, y: 0 },
        },
        {
          id: "n1",
          kind: "axiom",
          label: "",
          formulaText: "phi",
          position: { x: 100, y: 0 },
        },
        {
          id: "n2",
          kind: "axiom",
          label: "",
          formulaText: "phi",
          position: { x: 200, y: 0 },
        },
      ];
      const result = computeMPLeftCompatibleNodeIds(nodes, "right");
      expect(result.size).toBe(2);
      expect(result.has("n1")).toBe(true);
      expect(result.has("n2")).toBe(true);
    });
  });

  describe("isNodeImplication", () => {
    it("returns true for implication formula", () => {
      const node: WorkspaceNode = {
        id: "n1",
        kind: "axiom",
        label: "",
        formulaText: "phi -> psi",
        position: { x: 0, y: 0 },
      };
      expect(isNodeImplication(node)).toBe(true);
    });

    it("returns false for non-implication formula", () => {
      const node: WorkspaceNode = {
        id: "n1",
        kind: "axiom",
        label: "",
        formulaText: "phi",
        position: { x: 0, y: 0 },
      };
      expect(isNodeImplication(node)).toBe(false);
    });

    it("returns false for unparseable formula", () => {
      const node: WorkspaceNode = {
        id: "n1",
        kind: "axiom",
        label: "",
        formulaText: "???",
        position: { x: 0, y: 0 },
      };
      expect(isNodeImplication(node)).toBe(false);
    });

    it("returns false for empty formula", () => {
      const node: WorkspaceNode = {
        id: "n1",
        kind: "axiom",
        label: "",
        formulaText: "",
        position: { x: 0, y: 0 },
      };
      expect(isNodeImplication(node)).toBe(false);
    });

    it("returns true for nested implication", () => {
      const node: WorkspaceNode = {
        id: "n1",
        kind: "axiom",
        label: "",
        formulaText: "(phi -> psi) -> chi",
        position: { x: 0, y: 0 },
      };
      expect(isNodeImplication(node)).toBe(true);
    });
  });

  describe("validateMPApplicationEffect", () => {
    it("Effect版: 成功時はEffect.runSyncで値を取得できる", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "axiom", "Axiom", { x: 200, y: 0 }, "phi -> psi");
      ws = addNode(ws, "axiom", "MP", { x: 100, y: 150 });
      ws = addConnection(ws, "node-1", "out", "node-3", "premise-left");
      ws = addConnection(ws, "node-2", "out", "node-3", "premise-right");
      ws = addMPEdge(ws, "node-3", "node-1", "node-2");

      const result = Effect.runSync(
        Effect.either(validateMPApplicationEffect(ws, "node-3")),
      );
      expect(Either.isRight(result)).toBe(true);
      if (Either.isRight(result)) {
        expect(result.right.conclusionText).toBe("ψ");
      }
    });

    it("Effect版: エラー時はEffect.eitherでLeftを取得できる", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "MP", { x: 0, y: 0 });

      const result = Effect.runSync(
        Effect.either(validateMPApplicationEffect(ws, "node-1")),
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("BothPremisesMissing");
      }
    });

    it("Effect版: MPRuleErrorが正しく伝搬される", () => {
      let ws = createEmptyWorkspace(lukasiewiczSystem);
      ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, "phi");
      ws = addNode(ws, "axiom", "Axiom", { x: 200, y: 0 }, "psi");
      ws = addNode(ws, "axiom", "MP", { x: 100, y: 150 });
      ws = addConnection(ws, "node-1", "out", "node-3", "premise-left");
      ws = addConnection(ws, "node-2", "out", "node-3", "premise-right");
      ws = addMPEdge(ws, "node-3", "node-1", "node-2");

      const result = Effect.runSync(
        Effect.either(validateMPApplicationEffect(ws, "node-3")),
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("MPRuleError");
      }
    });
  });

  describe("getMPErrorMessage", () => {
    it("returns message for BothPremisesMissing", () => {
      expect(getMPErrorMessage(new BothPremisesMissing({}))).toBe(
        "Connect premises to apply MP",
      );
    });

    it("returns message for LeftPremiseMissing", () => {
      expect(getMPErrorMessage(new LeftPremiseMissing({}))).toBe(
        "Left premise (φ) not connected",
      );
    });

    it("returns message for RightPremiseMissing", () => {
      expect(getMPErrorMessage(new RightPremiseMissing({}))).toBe(
        "Right premise (φ→ψ) not connected",
      );
    });

    it("returns message for LeftParseError", () => {
      expect(getMPErrorMessage(new LeftParseError({ nodeId: "node-1" }))).toBe(
        "Left premise has invalid formula",
      );
    });

    it("returns message for RightParseError", () => {
      expect(getMPErrorMessage(new RightParseError({ nodeId: "node-2" }))).toBe(
        "Right premise has invalid formula",
      );
    });

    it("returns message for NotAnImplication", () => {
      expect(
        getMPErrorMessage(
          new MPRuleError({
            error: new NotAnImplication({ formula: metaVariable("φ") }),
          }),
        ),
      ).toBe("Right premise must be an implication (φ→ψ)");
    });

    it("returns message for PremiseMismatch", () => {
      expect(
        getMPErrorMessage(
          new MPRuleError({
            error: new PremiseMismatch({
              expected: metaVariable("φ"),
              actual: metaVariable("ψ"),
            }),
          }),
        ),
      ).toBe("Left premise does not match antecedent of right premise");
    });
  });
});

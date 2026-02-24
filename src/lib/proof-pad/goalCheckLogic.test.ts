import { describe, expect, it } from "vitest";
import {
  parseGoalFormula,
  checkGoal,
  type GoalCheckResult,
} from "./goalCheckLogic";
import type { WorkspaceNode } from "./workspaceState";

// --- ヘルパー ---

function makeNode(
  id: string,
  formulaText: string,
  kind: "axiom" | "mp" | "conclusion" = "axiom",
): WorkspaceNode {
  return {
    id,
    kind,
    label: "test",
    formulaText,
    position: { x: 0, y: 0 },
  };
}

describe("goalCheckLogic", () => {
  describe("parseGoalFormula", () => {
    it("returns undefined for empty string", () => {
      expect(parseGoalFormula("")).toBeUndefined();
    });

    it("returns undefined for whitespace-only string", () => {
      expect(parseGoalFormula("   ")).toBeUndefined();
    });

    it("returns undefined for invalid formula", () => {
      expect(parseGoalFormula("-> ->")).toBeUndefined();
    });

    it("parses a valid simple formula", () => {
      const result = parseGoalFormula("phi");
      expect(result).toBeDefined();
      expect(result!._tag).toBe("MetaVariable");
    });

    it("parses a valid implication", () => {
      const result = parseGoalFormula("phi -> phi");
      expect(result).toBeDefined();
      expect(result!._tag).toBe("Implication");
    });

    it("parses formula with leading/trailing spaces", () => {
      const result = parseGoalFormula("  phi -> psi  ");
      expect(result).toBeDefined();
      expect(result!._tag).toBe("Implication");
    });
  });

  describe("checkGoal", () => {
    it("returns GoalNotSet for empty goal text", () => {
      const result = checkGoal("", []);
      expect(result._tag).toBe("GoalNotSet");
    });

    it("returns GoalNotSet for whitespace-only goal text", () => {
      const result = checkGoal("   ", []);
      expect(result._tag).toBe("GoalNotSet");
    });

    it("returns GoalParseError for invalid goal formula", () => {
      const result = checkGoal("-> ->", []);
      expect(result._tag).toBe("GoalParseError");
    });

    it("returns GoalNotAchieved when no nodes exist", () => {
      const result = checkGoal("phi", []);
      expect(result._tag).toBe("GoalNotAchieved");
    });

    it("returns GoalNotAchieved when no node matches", () => {
      const nodes = [makeNode("node-1", "psi")];
      const result = checkGoal("phi", nodes);
      expect(result._tag).toBe("GoalNotAchieved");
    });

    it("returns GoalAchieved when a node matches exactly", () => {
      const nodes = [makeNode("node-1", "phi")];
      const result = checkGoal("phi", nodes);
      expect(result._tag).toBe("GoalAchieved");
      if (result._tag === "GoalAchieved") {
        expect(result.matchingNodeId).toBe("node-1");
      }
    });

    it("returns GoalAchieved matching the first matching node", () => {
      const nodes = [
        makeNode("node-1", "psi"),
        makeNode("node-2", "phi"),
        makeNode("node-3", "phi"),
      ];
      const result = checkGoal("phi", nodes);
      expect(result._tag).toBe("GoalAchieved");
      if (result._tag === "GoalAchieved") {
        expect(result.matchingNodeId).toBe("node-2");
      }
    });

    it("matches implication formula correctly", () => {
      const nodes = [makeNode("node-1", "phi -> psi")];
      const result = checkGoal("phi -> psi", nodes);
      expect(result._tag).toBe("GoalAchieved");
    });

    it("matches φ → φ style formula from Unicode input", () => {
      const nodes = [makeNode("node-1", "φ → φ")];
      const result = checkGoal("phi -> phi", nodes);
      expect(result._tag).toBe("GoalAchieved");
    });

    it("skips nodes with empty formula text", () => {
      const nodes = [makeNode("node-1", ""), makeNode("node-2", "phi")];
      const result = checkGoal("phi", nodes);
      expect(result._tag).toBe("GoalAchieved");
      if (result._tag === "GoalAchieved") {
        expect(result.matchingNodeId).toBe("node-2");
      }
    });

    it("skips nodes with unparseable formula text", () => {
      const nodes = [makeNode("node-1", "-> ->"), makeNode("node-2", "phi")];
      const result = checkGoal("phi", nodes);
      expect(result._tag).toBe("GoalAchieved");
      if (result._tag === "GoalAchieved") {
        expect(result.matchingNodeId).toBe("node-2");
      }
    });

    it("matches MP result node", () => {
      const nodes = [
        makeNode("node-1", "phi", "axiom"),
        makeNode("node-2", "phi -> psi", "axiom"),
        makeNode("node-3", "ψ", "mp"),
      ];
      const result = checkGoal("psi", nodes);
      expect(result._tag).toBe("GoalAchieved");
      if (result._tag === "GoalAchieved") {
        expect(result.matchingNodeId).toBe("node-3");
      }
    });

    it("does not match structurally different formulas", () => {
      const nodes = [makeNode("node-1", "phi -> psi")];
      const result = checkGoal("psi -> phi", nodes);
      expect(result._tag).toBe("GoalNotAchieved");
    });

    it("returns GoalNotAchieved for complex formula not in workspace", () => {
      const nodes = [
        makeNode("node-1", "phi"),
        makeNode("node-2", "phi -> psi"),
      ];
      const result = checkGoal("phi -> (psi -> phi)", nodes);
      expect(result._tag).toBe("GoalNotAchieved");
    });

    it("provides goalFormula in GoalNotAchieved result", () => {
      const result = checkGoal("phi -> phi", []) as Extract<
        GoalCheckResult,
        { readonly _tag: "GoalNotAchieved" }
      >;
      expect(result._tag).toBe("GoalNotAchieved");
      expect(result.goalFormula).toBeDefined();
      expect(result.goalFormula._tag).toBe("Implication");
    });

    it("provides goalFormula in GoalAchieved result", () => {
      const nodes = [makeNode("node-1", "phi")];
      const result = checkGoal("phi", nodes) as Extract<
        GoalCheckResult,
        { readonly _tag: "GoalAchieved" }
      >;
      expect(result._tag).toBe("GoalAchieved");
      expect(result.goalFormula).toBeDefined();
      expect(result.goalFormula._tag).toBe("MetaVariable");
    });
  });
});

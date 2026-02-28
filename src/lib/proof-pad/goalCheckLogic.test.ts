import { describe, expect, it } from "vitest";
import {
  parseGoalFormula,
  checkGoal,
  type GoalCheckResult,
} from "./goalCheckLogic";
import type { WorkspaceNode } from "./workspaceState";
import type { WorkspaceGoal } from "./workspaceState";

// --- ヘルパー ---

function makeNode(
  id: string,
  formulaText: string,
  kind: "axiom" | "conclusion" = "axiom",
): WorkspaceNode {
  return {
    id,
    kind,
    label: "test",
    formulaText,
    position: { x: 0, y: 0 },
  };
}

function makeGoal(id: string, formulaText: string): WorkspaceGoal {
  return {
    id,
    formulaText,
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

  describe("checkGoal (formula matching)", () => {
    it("returns GoalNotSet when no goals exist", () => {
      const result = checkGoal([], []);
      expect(result._tag).toBe("GoalNotSet");
    });

    it("returns GoalNotSet when goals array is empty", () => {
      const nodes = [makeNode("node-1", "phi")];
      const result = checkGoal([], nodes);
      expect(result._tag).toBe("GoalNotSet");
    });

    it("returns GoalPartiallyAchieved when goal exists but no nodes", () => {
      const goals = [makeGoal("goal-1", "phi")];
      const result = checkGoal(goals, []);
      expect(result._tag).toBe("GoalPartiallyAchieved");
      if (result._tag === "GoalPartiallyAchieved") {
        expect(result.achievedCount).toBe(0);
        expect(result.totalCount).toBe(1);
      }
    });

    it("returns GoalAllAchieved when matching node exists on canvas", () => {
      const goals = [makeGoal("goal-1", "phi")];
      const nodes = [makeNode("node-1", "phi")];
      const result = checkGoal(goals, nodes);
      expect(result._tag).toBe("GoalAllAchieved");
      if (result._tag === "GoalAllAchieved") {
        expect(result.achievedGoals).toHaveLength(1);
        expect(result.achievedGoals[0]!.matchingNodeId).toBe("node-1");
      }
    });

    it("returns GoalPartiallyAchieved when no matching node exists", () => {
      const goals = [makeGoal("goal-1", "phi")];
      const nodes = [makeNode("node-1", "psi")];
      const result = checkGoal(goals, nodes);
      expect(result._tag).toBe("GoalPartiallyAchieved");
      if (result._tag === "GoalPartiallyAchieved") {
        expect(result.achievedCount).toBe(0);
        expect(result.totalCount).toBe(1);
      }
    });

    it("matches implication formula correctly", () => {
      const goals = [makeGoal("goal-1", "phi -> psi")];
      const nodes = [makeNode("node-1", "phi -> psi")];
      const result = checkGoal(goals, nodes);
      expect(result._tag).toBe("GoalAllAchieved");
    });

    it("matches Unicode formula with DSL formula", () => {
      const goals = [makeGoal("goal-1", "phi -> phi")];
      const nodes = [makeNode("node-1", "\u03C6 \u2192 \u03C6")];
      const result = checkGoal(goals, nodes);
      expect(result._tag).toBe("GoalAllAchieved");
    });

    it("skips nodes with empty formula text", () => {
      const goals = [makeGoal("goal-1", "phi")];
      const nodes = [makeNode("node-1", ""), makeNode("node-2", "phi")];
      const result = checkGoal(goals, nodes);
      expect(result._tag).toBe("GoalAllAchieved");
      if (result._tag === "GoalAllAchieved") {
        expect(result.achievedGoals[0]!.matchingNodeId).toBe("node-2");
      }
    });

    it("skips nodes with unparseable formula text", () => {
      const goals = [makeGoal("goal-1", "phi")];
      const nodes = [makeNode("node-1", "-> ->"), makeNode("node-2", "phi")];
      const result = checkGoal(goals, nodes);
      expect(result._tag).toBe("GoalAllAchieved");
      if (result._tag === "GoalAllAchieved") {
        expect(result.achievedGoals[0]!.matchingNodeId).toBe("node-2");
      }
    });

    it("matches MP result node formula to goal", () => {
      const goals = [makeGoal("goal-1", "psi")];
      const nodes = [
        makeNode("node-1", "phi", "axiom"),
        makeNode("node-2", "phi -> psi", "axiom"),
        makeNode("node-3", "\u03C8", "axiom"),
      ];
      const result = checkGoal(goals, nodes);
      expect(result._tag).toBe("GoalAllAchieved");
      if (result._tag === "GoalAllAchieved") {
        expect(result.achievedGoals[0]!.matchingNodeId).toBe("node-3");
      }
    });

    it("does not match structurally different formulas", () => {
      const goals = [makeGoal("goal-1", "phi -> psi")];
      const nodes = [makeNode("node-1", "psi -> phi")];
      const result = checkGoal(goals, nodes);
      expect(result._tag).toBe("GoalPartiallyAchieved");
    });

    it("handles multiple goals - all achieved", () => {
      const goals = [makeGoal("goal-1", "phi"), makeGoal("goal-2", "psi")];
      const nodes = [makeNode("node-1", "phi"), makeNode("node-2", "psi")];
      const result = checkGoal(goals, nodes);
      expect(result._tag).toBe("GoalAllAchieved");
      if (result._tag === "GoalAllAchieved") {
        expect(result.achievedGoals).toHaveLength(2);
      }
    });

    it("handles multiple goals - partial achievement", () => {
      const goals = [makeGoal("goal-1", "phi"), makeGoal("goal-2", "psi")];
      const nodes = [makeNode("node-1", "phi")];
      const result = checkGoal(goals, nodes);
      expect(result._tag).toBe("GoalPartiallyAchieved");
      if (result._tag === "GoalPartiallyAchieved") {
        expect(result.achievedCount).toBe(1);
        expect(result.totalCount).toBe(2);
        expect(result.goalStatuses[0]!.achieved).toBe(true);
        expect(result.goalStatuses[1]!.achieved).toBe(false);
      }
    });

    it("handles goal with unparseable formula text", () => {
      const goals = [makeGoal("goal-1", "-> ->")];
      const result = checkGoal(goals, []);
      expect(result._tag).toBe("GoalPartiallyAchieved");
      if (result._tag === "GoalPartiallyAchieved") {
        expect(result.goalStatuses[0]!.goalFormula).toBeUndefined();
        expect(result.goalStatuses[0]!.achieved).toBe(false);
      }
    });

    it("handles goal with empty formula text", () => {
      const goals = [makeGoal("goal-1", "")];
      const result = checkGoal(goals, []);
      expect(result._tag).toBe("GoalPartiallyAchieved");
      if (result._tag === "GoalPartiallyAchieved") {
        expect(result.goalStatuses[0]!.goalFormula).toBeUndefined();
        expect(result.goalStatuses[0]!.achieved).toBe(false);
      }
    });

    it("uses goalId (not goalNodeId) in GoalStatus", () => {
      const goals = [makeGoal("goal-1", "phi")];
      const nodes = [makeNode("node-1", "phi")];
      const result = checkGoal(goals, nodes) as Extract<
        GoalCheckResult,
        { readonly _tag: "GoalAllAchieved" }
      >;
      expect(result.achievedGoals[0]!.goalId).toBe("goal-1");
    });

    it("uses goalId (not goalNodeId) in AchievedGoalInfo", () => {
      const goals = [makeGoal("goal-1", "phi")];
      const result = checkGoal(goals, []) as Extract<
        GoalCheckResult,
        { readonly _tag: "GoalPartiallyAchieved" }
      >;
      expect(result.goalStatuses[0]!.goalId).toBe("goal-1");
    });

    it("provides goalFormula in GoalAllAchieved result", () => {
      const goals = [makeGoal("goal-1", "phi")];
      const nodes = [makeNode("node-1", "phi")];
      const result = checkGoal(goals, nodes) as Extract<
        GoalCheckResult,
        { readonly _tag: "GoalAllAchieved" }
      >;
      expect(result.achievedGoals[0]!.goalFormula).toBeDefined();
      expect(result.achievedGoals[0]!.goalFormula._tag).toBe("MetaVariable");
    });

    it("provides goalStatuses in GoalPartiallyAchieved result", () => {
      const goals = [makeGoal("goal-1", "phi -> phi")];
      const nodes = [makeNode("node-1", "psi")];
      const result = checkGoal(goals, nodes) as Extract<
        GoalCheckResult,
        { readonly _tag: "GoalPartiallyAchieved" }
      >;
      expect(result.goalStatuses).toHaveLength(1);
      expect(result.goalStatuses[0]!.goalFormula).toBeDefined();
      expect(result.goalStatuses[0]!.goalFormula!._tag).toBe("Implication");
    });

    it("achieves goal when any node on canvas matches, regardless of node kind", () => {
      const goals = [makeGoal("goal-1", "phi")];
      const nodes = [makeNode("node-1", "phi", "conclusion")];
      const result = checkGoal(goals, nodes);
      expect(result._tag).toBe("GoalAllAchieved");
    });

    it("same formula on multiple nodes - uses first match", () => {
      const goals = [makeGoal("goal-1", "phi")];
      const nodes = [makeNode("node-1", "phi"), makeNode("node-2", "phi")];
      const result = checkGoal(goals, nodes);
      expect(result._tag).toBe("GoalAllAchieved");
      if (result._tag === "GoalAllAchieved") {
        expect(result.achievedGoals[0]!.matchingNodeId).toBe("node-1");
      }
    });
  });
});

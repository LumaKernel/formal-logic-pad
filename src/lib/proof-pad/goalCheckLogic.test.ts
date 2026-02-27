import { describe, expect, it } from "vitest";
import {
  parseGoalFormula,
  checkGoal,
  type GoalCheckResult,
} from "./goalCheckLogic";
import type { WorkspaceNode, WorkspaceConnection } from "./workspaceState";

// --- ヘルパー ---

function makeNode(
  id: string,
  formulaText: string,
  kind: "axiom" | "mp" | "conclusion" = "axiom",
  role?: "axiom" | "goal",
): WorkspaceNode {
  return {
    id,
    kind,
    label: "test",
    formulaText,
    position: { x: 0, y: 0 },
    role,
  };
}

function makeGoalNode(id: string, formulaText: string): WorkspaceNode {
  return makeNode(id, formulaText, "axiom", "goal");
}

function makeConnection(
  fromNodeId: string,
  toNodeId: string,
  id?: string,
): WorkspaceConnection {
  return {
    id: id ?? `${fromNodeId satisfies string}->${toNodeId satisfies string}`,
    fromNodeId,
    fromPortId: "output",
    toNodeId,
    toPortId: "input",
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
    it("returns GoalNotSet when no goal nodes exist", () => {
      const result = checkGoal([], []);
      expect(result._tag).toBe("GoalNotSet");
    });

    it("returns GoalNotSet when no nodes have role=goal", () => {
      const nodes = [makeNode("node-1", "phi")];
      const result = checkGoal(nodes, []);
      expect(result._tag).toBe("GoalNotSet");
    });

    it("returns GoalPartiallyAchieved when goal exists but no connections", () => {
      const nodes = [makeGoalNode("goal-1", "phi")];
      const result = checkGoal(nodes, []);
      expect(result._tag).toBe("GoalPartiallyAchieved");
      if (result._tag === "GoalPartiallyAchieved") {
        expect(result.achievedCount).toBe(0);
        expect(result.totalCount).toBe(1);
      }
    });

    it("returns GoalPartiallyAchieved when matching node exists but no connection to goal", () => {
      // 式は一致するが、ゴールノードへの接続がない → 未達成
      const nodes = [makeGoalNode("goal-1", "phi"), makeNode("node-1", "phi")];
      const result = checkGoal(nodes, []);
      expect(result._tag).toBe("GoalPartiallyAchieved");
      if (result._tag === "GoalPartiallyAchieved") {
        expect(result.achievedCount).toBe(0);
        expect(result.totalCount).toBe(1);
      }
    });

    it("returns GoalAllAchieved when connected node matches the goal", () => {
      const nodes = [makeGoalNode("goal-1", "phi"), makeNode("node-1", "phi")];
      const connections = [makeConnection("node-1", "goal-1")];
      const result = checkGoal(nodes, connections);
      expect(result._tag).toBe("GoalAllAchieved");
      if (result._tag === "GoalAllAchieved") {
        expect(result.achievedGoals).toHaveLength(1);
        expect(result.achievedGoals[0]!.matchingNodeId).toBe("node-1");
      }
    });

    it("matches implication formula correctly with connection", () => {
      const nodes = [
        makeGoalNode("goal-1", "phi -> psi"),
        makeNode("node-1", "phi -> psi"),
      ];
      const connections = [makeConnection("node-1", "goal-1")];
      const result = checkGoal(nodes, connections);
      expect(result._tag).toBe("GoalAllAchieved");
    });

    it("matches Unicode formula with DSL formula when connected", () => {
      const nodes = [
        makeGoalNode("goal-1", "phi -> phi"),
        makeNode("node-1", "φ → φ"),
      ];
      const connections = [makeConnection("node-1", "goal-1")];
      const result = checkGoal(nodes, connections);
      expect(result._tag).toBe("GoalAllAchieved");
    });

    it("skips connected nodes with empty formula text", () => {
      const nodes = [
        makeGoalNode("goal-1", "phi"),
        makeNode("node-1", ""),
        makeNode("node-2", "phi"),
      ];
      const connections = [
        makeConnection("node-1", "goal-1"),
        makeConnection("node-2", "goal-1"),
      ];
      const result = checkGoal(nodes, connections);
      expect(result._tag).toBe("GoalAllAchieved");
      if (result._tag === "GoalAllAchieved") {
        expect(result.achievedGoals[0]!.matchingNodeId).toBe("node-2");
      }
    });

    it("skips connected nodes with unparseable formula text", () => {
      const nodes = [
        makeGoalNode("goal-1", "phi"),
        makeNode("node-1", "-> ->"),
        makeNode("node-2", "phi"),
      ];
      const connections = [
        makeConnection("node-1", "goal-1"),
        makeConnection("node-2", "goal-1"),
      ];
      const result = checkGoal(nodes, connections);
      expect(result._tag).toBe("GoalAllAchieved");
      if (result._tag === "GoalAllAchieved") {
        expect(result.achievedGoals[0]!.matchingNodeId).toBe("node-2");
      }
    });

    it("matches connected MP result node to goal", () => {
      const nodes = [
        makeGoalNode("goal-1", "psi"),
        makeNode("node-1", "phi", "axiom"),
        makeNode("node-2", "phi -> psi", "axiom"),
        makeNode("node-3", "ψ", "mp"),
      ];
      // MP結果がゴールに接続されている
      const connections = [makeConnection("node-3", "goal-1")];
      const result = checkGoal(nodes, connections);
      expect(result._tag).toBe("GoalAllAchieved");
      if (result._tag === "GoalAllAchieved") {
        expect(result.achievedGoals[0]!.matchingNodeId).toBe("node-3");
      }
    });

    it("does not achieve goal when MP result exists but not connected to goal", () => {
      const nodes = [
        makeGoalNode("goal-1", "psi"),
        makeNode("node-1", "phi", "axiom"),
        makeNode("node-2", "phi -> psi", "axiom"),
        makeNode("node-3", "ψ", "mp"),
      ];
      // MPの前提接続はあるが、ゴールへの接続がない
      const connections = [
        makeConnection("node-1", "node-3"),
        makeConnection("node-2", "node-3"),
      ];
      const result = checkGoal(nodes, connections);
      expect(result._tag).toBe("GoalPartiallyAchieved");
    });

    it("does not match structurally different connected formulas", () => {
      const nodes = [
        makeGoalNode("goal-1", "phi -> psi"),
        makeNode("node-1", "psi -> phi"),
      ];
      const connections = [makeConnection("node-1", "goal-1")];
      const result = checkGoal(nodes, connections);
      expect(result._tag).toBe("GoalPartiallyAchieved");
    });

    it("handles multiple goals - all achieved with connections", () => {
      const nodes = [
        makeGoalNode("goal-1", "phi"),
        makeGoalNode("goal-2", "psi"),
        makeNode("node-1", "phi"),
        makeNode("node-2", "psi"),
      ];
      const connections = [
        makeConnection("node-1", "goal-1"),
        makeConnection("node-2", "goal-2"),
      ];
      const result = checkGoal(nodes, connections);
      expect(result._tag).toBe("GoalAllAchieved");
      if (result._tag === "GoalAllAchieved") {
        expect(result.achievedGoals).toHaveLength(2);
      }
    });

    it("handles multiple goals - partial achievement with connections", () => {
      const nodes = [
        makeGoalNode("goal-1", "phi"),
        makeGoalNode("goal-2", "psi"),
        makeNode("node-1", "phi"),
        makeNode("node-2", "psi"),
      ];
      // goal-1だけに接続あり
      const connections = [makeConnection("node-1", "goal-1")];
      const result = checkGoal(nodes, connections);
      expect(result._tag).toBe("GoalPartiallyAchieved");
      if (result._tag === "GoalPartiallyAchieved") {
        expect(result.achievedCount).toBe(1);
        expect(result.totalCount).toBe(2);
        expect(result.goalStatuses[0]!.achieved).toBe(true);
        expect(result.goalStatuses[1]!.achieved).toBe(false);
      }
    });

    it("handles goal with unparseable formula text", () => {
      const nodes = [makeGoalNode("goal-1", "-> ->")];
      const result = checkGoal(nodes, []);
      expect(result._tag).toBe("GoalPartiallyAchieved");
      if (result._tag === "GoalPartiallyAchieved") {
        expect(result.goalStatuses[0]!.goalFormula).toBeUndefined();
        expect(result.goalStatuses[0]!.achieved).toBe(false);
      }
    });

    it("handles goal with empty formula text", () => {
      const nodes = [makeGoalNode("goal-1", "")];
      const result = checkGoal(nodes, []);
      expect(result._tag).toBe("GoalPartiallyAchieved");
      if (result._tag === "GoalPartiallyAchieved") {
        expect(result.goalStatuses[0]!.goalFormula).toBeUndefined();
        expect(result.goalStatuses[0]!.achieved).toBe(false);
      }
    });

    it("does not match goal nodes against other goal nodes", () => {
      const nodes = [
        makeGoalNode("goal-1", "phi"),
        makeGoalNode("goal-2", "phi"),
      ];
      const result = checkGoal(nodes, []);
      expect(result._tag).toBe("GoalPartiallyAchieved");
      if (result._tag === "GoalPartiallyAchieved") {
        expect(result.achievedCount).toBe(0);
        expect(result.totalCount).toBe(2);
      }
    });

    it("provides goalFormula in GoalAllAchieved result", () => {
      const nodes = [makeGoalNode("goal-1", "phi"), makeNode("node-1", "phi")];
      const connections = [makeConnection("node-1", "goal-1")];
      const result = checkGoal(nodes, connections) as Extract<
        GoalCheckResult,
        { readonly _tag: "GoalAllAchieved" }
      >;
      expect(result.achievedGoals[0]!.goalFormula).toBeDefined();
      expect(result.achievedGoals[0]!.goalFormula._tag).toBe("MetaVariable");
    });

    it("provides goalStatuses in GoalPartiallyAchieved result", () => {
      const nodes = [
        makeGoalNode("goal-1", "phi -> phi"),
        makeNode("node-1", "psi"),
      ];
      // 接続はあるが式が不一致
      const connections = [makeConnection("node-1", "goal-1")];
      const result = checkGoal(nodes, connections) as Extract<
        GoalCheckResult,
        { readonly _tag: "GoalPartiallyAchieved" }
      >;
      expect(result.goalStatuses).toHaveLength(1);
      expect(result.goalStatuses[0]!.goalFormula).toBeDefined();
      expect(result.goalStatuses[0]!.goalFormula!._tag).toBe("Implication");
    });

    it("ignores role=axiom nodes as non-goal", () => {
      const nodes = [
        makeNode("node-1", "phi", "axiom", "axiom"),
        makeNode("node-2", "phi"),
      ];
      const result = checkGoal(nodes, []);
      expect(result._tag).toBe("GoalNotSet");
    });

    it("ignores connection from unknown node", () => {
      const nodes = [makeGoalNode("goal-1", "phi")];
      // 存在しないノードからの接続
      const connections = [makeConnection("unknown-node", "goal-1")];
      const result = checkGoal(nodes, connections);
      expect(result._tag).toBe("GoalPartiallyAchieved");
    });

    it("ignores connection to non-goal node", () => {
      // 接続がゴールノード以外に向いている場合、ゴールは未達成
      const nodes = [
        makeGoalNode("goal-1", "phi"),
        makeNode("node-1", "phi"),
        makeNode("node-2", "phi"),
      ];
      const connections = [makeConnection("node-1", "node-2")];
      const result = checkGoal(nodes, connections);
      expect(result._tag).toBe("GoalPartiallyAchieved");
    });
  });
});

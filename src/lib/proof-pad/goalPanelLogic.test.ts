import { describe, expect, it } from "vitest";
import {
  computeGoalPanelData,
  type GoalPanelData,
  type GoalPanelItemStatus,
} from "./goalPanelLogic";
import type { GoalCheckResult } from "./goalCheckLogic";
import type { WorkspaceGoal } from "./workspaceState";
import type { AxiomId } from "../logic-core/inferenceRule";

// --- ヘルパー ---

function makeGoal(
  id: string,
  formulaText: string,
  options?: {
    readonly label?: string;
    readonly allowedAxiomIds?: readonly AxiomId[];
  },
): WorkspaceGoal {
  return {
    id,
    formulaText,
    label: options?.label,
    allowedAxiomIds: options?.allowedAxiomIds,
  };
}

// --- テスト ---

describe("computeGoalPanelData", () => {
  describe("空のゴール", () => {
    it("ゴールが空の場合は空のデータを返す", () => {
      const result = computeGoalPanelData([], { _tag: "GoalNotSet" });
      expect(result).toEqual({
        items: [],
        achievedCount: 0,
        totalCount: 0,
      } satisfies GoalPanelData);
    });

    it("GoalNotSetの場合も空のデータを返す", () => {
      const goals = [makeGoal("g1", "phi -> phi")];
      // GoalNotSetはgoals.length === 0の時にcheckGoalが返す
      // ここではgoalsがある状態でGoalNotSetが来た場合（理論上はないが、防御的に）
      const result = computeGoalPanelData([], { _tag: "GoalNotSet" });
      expect(result.items).toHaveLength(0);
      // goalsを渡してもGoalNotSetなら空
      const result2 = computeGoalPanelData(goals, { _tag: "GoalNotSet" });
      expect(result2.items).toHaveLength(0);
    });
  });

  describe("すべて達成", () => {
    it("すべてのゴールが達成済みの場合", () => {
      const goals = [
        makeGoal("g1", "phi -> phi", { label: "Goal: φ → φ" }),
        makeGoal("g2", "psi -> psi"),
      ];
      const checkResult: GoalCheckResult = {
        _tag: "GoalAllAchieved",
        achievedGoals: [
          {
            goalId: "g1",
            goalFormula: {} as never,
            matchingNodeId: "n1",
          },
          {
            goalId: "g2",
            goalFormula: {} as never,
            matchingNodeId: "n2",
          },
        ],
      };

      const result = computeGoalPanelData(goals, checkResult);
      expect(result.achievedCount).toBe(2);
      expect(result.totalCount).toBe(2);
      expect(result.items).toHaveLength(2);
      expect(result.items[0]?.status).toBe(
        "achieved" satisfies GoalPanelItemStatus,
      );
      expect(result.items[0]?.label).toBe("Goal: φ → φ");
      expect(result.items[1]?.status).toBe(
        "achieved" satisfies GoalPanelItemStatus,
      );
    });
  });

  describe("部分達成", () => {
    it("一部のゴールが達成済み、一部が未達成の場合", () => {
      const goals = [
        makeGoal("g1", "phi -> phi"),
        makeGoal("g2", "psi -> psi"),
      ];
      const checkResult: GoalCheckResult = {
        _tag: "GoalPartiallyAchieved",
        achievedCount: 1,
        totalCount: 2,
        goalStatuses: [
          {
            goalId: "g1",
            goalFormula: {} as never,
            achieved: true,
            matchingNodeId: "n1",
          },
          {
            goalId: "g2",
            goalFormula: {} as never,
            achieved: false,
            matchingNodeId: undefined,
          },
        ],
      };

      const result = computeGoalPanelData(goals, checkResult);
      expect(result.achievedCount).toBe(1);
      expect(result.totalCount).toBe(2);
      expect(result.items[0]?.status).toBe(
        "achieved" satisfies GoalPanelItemStatus,
      );
      expect(result.items[1]?.status).toBe(
        "not-achieved" satisfies GoalPanelItemStatus,
      );
    });

    it("パースエラーのゴールがある場合", () => {
      const goals = [
        makeGoal("g1", "phi -> phi"),
        makeGoal("g2", "invalid formula !!!"),
      ];
      const checkResult: GoalCheckResult = {
        _tag: "GoalPartiallyAchieved",
        achievedCount: 1,
        totalCount: 2,
        goalStatuses: [
          {
            goalId: "g1",
            goalFormula: {} as never,
            achieved: true,
            matchingNodeId: "n1",
          },
          {
            goalId: "g2",
            goalFormula: undefined,
            achieved: false,
            matchingNodeId: undefined,
          },
        ],
      };

      const result = computeGoalPanelData(goals, checkResult);
      expect(result.items[1]?.status).toBe(
        "parse-error" satisfies GoalPanelItemStatus,
      );
    });
  });

  describe("allowedAxiomIds", () => {
    it("公理制限ありのゴールを正しく反映する", () => {
      const goals = [
        makeGoal("g1", "phi -> phi", {
          allowedAxiomIds: ["A1", "A2"],
        }),
        makeGoal("g2", "psi -> psi"),
      ];
      const checkResult: GoalCheckResult = {
        _tag: "GoalPartiallyAchieved",
        achievedCount: 0,
        totalCount: 2,
        goalStatuses: [
          {
            goalId: "g1",
            goalFormula: {} as never,
            achieved: false,
            matchingNodeId: undefined,
          },
          {
            goalId: "g2",
            goalFormula: {} as never,
            achieved: false,
            matchingNodeId: undefined,
          },
        ],
      };

      const result = computeGoalPanelData(goals, checkResult);
      expect(result.items[0]?.allowedAxiomIds).toEqual(["A1", "A2"]);
      expect(result.items[1]?.allowedAxiomIds).toBeUndefined();
    });
  });

  describe("フォールバック", () => {
    it("GoalStatusが見つからない場合でもフォールバックで動作する", () => {
      const goals = [
        makeGoal("g1", "phi -> phi"),
        makeGoal("g2", "psi -> psi"),
      ];
      // goalStatuses に g2 がない（理論上は発生しないが防御的に）
      const checkResult: GoalCheckResult = {
        _tag: "GoalPartiallyAchieved",
        achievedCount: 1,
        totalCount: 2,
        goalStatuses: [
          {
            goalId: "g1",
            goalFormula: {} as never,
            achieved: true,
            matchingNodeId: "n1",
          },
        ],
      };

      const result = computeGoalPanelData(goals, checkResult);
      expect(result.items[1]?.status).toBe(
        "not-achieved" satisfies GoalPanelItemStatus,
      );
    });

    it("フォールバックでパースエラーを検出する", () => {
      const goals = [makeGoal("g1", "invalid !!!")];
      const checkResult: GoalCheckResult = {
        _tag: "GoalPartiallyAchieved",
        achievedCount: 0,
        totalCount: 1,
        goalStatuses: [],
      };

      const result = computeGoalPanelData(goals, checkResult);
      expect(result.items[0]?.status).toBe(
        "parse-error" satisfies GoalPanelItemStatus,
      );
    });
  });

  describe("formulaText の保持", () => {
    it("ゴールのformulaTextがそのまま保持される", () => {
      const goals = [makeGoal("g1", "phi -> (psi -> phi)")];
      const checkResult: GoalCheckResult = {
        _tag: "GoalPartiallyAchieved",
        achievedCount: 0,
        totalCount: 1,
        goalStatuses: [
          {
            goalId: "g1",
            goalFormula: {} as never,
            achieved: false,
            matchingNodeId: undefined,
          },
        ],
      };

      const result = computeGoalPanelData(goals, checkResult);
      expect(result.items[0]?.formulaText).toBe("phi -> (psi -> phi)");
    });
  });
});

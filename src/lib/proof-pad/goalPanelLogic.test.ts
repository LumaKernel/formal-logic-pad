import { describe, expect, it } from "vitest";
import { Either } from "effect";
import {
  computeGoalPanelData,
  type GoalPanelData,
  type GoalPanelItemStatus,
  type GoalViolationInfo,
} from "./goalPanelLogic";
import type { GoalCheckResult } from "./goalCheckLogic";
import type { WorkspaceGoal } from "./workspaceState";
import type { AxiomId } from "../logic-core/inferenceRule";
import { parseString } from "../logic-lang/parser";
import type { Formula } from "../logic-core/formula";
import type { AxiomPaletteItem } from "./axiomPaletteLogic";

// --- ヘルパー ---

function parseFormula(text: string): Formula {
  const result = parseString(text);
  if (Either.isLeft(result))
    throw new Error(`Parse failed: ${text satisfies string}`);
  return result.right;
}

const phiImpliesPhi = parseFormula("phi -> phi");
const psiImpliesPsi = parseFormula("psi -> psi");
const a1Template = parseFormula("phi -> (psi -> phi)");
const a2Template = parseFormula(
  "(phi -> (psi -> chi)) -> ((phi -> psi) -> (phi -> chi))",
);

const sampleAxioms: readonly AxiomPaletteItem[] = [
  {
    id: "A1",
    displayName: "A1 (K)",
    template: a1Template,
    unicodeDisplay: "φ → (ψ → φ)",
    dslText: "phi -> (psi -> phi)",
  },
  {
    id: "A2",
    displayName: "A2 (S)",
    template: a2Template,
    unicodeDisplay: "(φ → (ψ → χ)) → ((φ → ψ) → (φ → χ))",
    dslText: "(phi -> (psi -> chi)) -> ((phi -> psi) -> (phi -> chi))",
  },
];

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
            goalFormula: phiImpliesPhi,
            matchingNodeId: "n1",
          },
          {
            goalId: "g2",
            goalFormula: psiImpliesPsi,
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
      expect(result.items[0]?.formula).toBe(phiImpliesPhi);
      expect(result.items[1]?.status).toBe(
        "achieved" satisfies GoalPanelItemStatus,
      );
      expect(result.items[1]?.formula).toBe(psiImpliesPsi);
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
            goalFormula: phiImpliesPhi,
            achieved: true,
            matchingNodeId: "n1",
          },
          {
            goalId: "g2",
            goalFormula: psiImpliesPsi,
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
      expect(result.items[0]?.formula).toBe(phiImpliesPhi);
      expect(result.items[1]?.status).toBe(
        "not-achieved" satisfies GoalPanelItemStatus,
      );
      expect(result.items[1]?.formula).toBe(psiImpliesPsi);
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
            goalFormula: phiImpliesPhi,
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
      expect(result.items[1]?.formula).toBeUndefined();
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
            goalFormula: phiImpliesPhi,
            achieved: false,
            matchingNodeId: undefined,
          },
          {
            goalId: "g2",
            goalFormula: psiImpliesPsi,
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

  describe("allowedAxiomDetails", () => {
    it("availableAxiomsを渡すとallowedAxiomDetailsが解決される", () => {
      const goals = [
        makeGoal("g1", "phi -> phi", {
          allowedAxiomIds: ["A1", "A2"],
        }),
      ];
      const checkResult: GoalCheckResult = {
        _tag: "GoalPartiallyAchieved",
        achievedCount: 0,
        totalCount: 1,
        goalStatuses: [
          {
            goalId: "g1",
            goalFormula: phiImpliesPhi,
            achieved: false,
            matchingNodeId: undefined,
          },
        ],
      };

      const result = computeGoalPanelData(goals, checkResult, sampleAxioms);
      expect(result.items[0]?.allowedAxiomDetails).toEqual([
        {
          id: "A1",
          displayName: "A1 (K)",
          formula: a1Template,
        },
        {
          id: "A2",
          displayName: "A2 (S)",
          formula: a2Template,
        },
      ]);
    });

    it("allowedAxiomIdsがundefinedの場合はallowedAxiomDetailsもundefined", () => {
      const goals = [makeGoal("g1", "phi -> phi")];
      const checkResult: GoalCheckResult = {
        _tag: "GoalPartiallyAchieved",
        achievedCount: 0,
        totalCount: 1,
        goalStatuses: [
          {
            goalId: "g1",
            goalFormula: phiImpliesPhi,
            achieved: false,
            matchingNodeId: undefined,
          },
        ],
      };

      const result = computeGoalPanelData(goals, checkResult, sampleAxioms);
      expect(result.items[0]?.allowedAxiomDetails).toBeUndefined();
    });

    it("availableAxiomsに含まれない公理IDは除外される", () => {
      const goals = [
        makeGoal("g1", "phi -> phi", {
          allowedAxiomIds: ["A1", "A3"],
        }),
      ];
      const checkResult: GoalCheckResult = {
        _tag: "GoalPartiallyAchieved",
        achievedCount: 0,
        totalCount: 1,
        goalStatuses: [
          {
            goalId: "g1",
            goalFormula: phiImpliesPhi,
            achieved: false,
            matchingNodeId: undefined,
          },
        ],
      };

      const result = computeGoalPanelData(goals, checkResult, sampleAxioms);
      expect(result.items[0]?.allowedAxiomDetails).toHaveLength(1);
      expect(result.items[0]?.allowedAxiomDetails?.[0]?.id).toBe("A1");
    });

    it("GoalAllAchievedでもallowedAxiomDetailsが解決される", () => {
      const goals = [
        makeGoal("g1", "phi -> phi", {
          allowedAxiomIds: ["A1"],
        }),
      ];
      const checkResult: GoalCheckResult = {
        _tag: "GoalAllAchieved",
        achievedGoals: [
          {
            goalId: "g1",
            goalFormula: phiImpliesPhi,
            matchingNodeId: "n1",
          },
        ],
      };

      const result = computeGoalPanelData(goals, checkResult, sampleAxioms);
      expect(result.items[0]?.allowedAxiomDetails).toEqual([
        {
          id: "A1",
          displayName: "A1 (K)",
          formula: a1Template,
        },
      ]);
    });

    it("availableAxiomsを渡さない場合は空配列として解決される", () => {
      const goals = [
        makeGoal("g1", "phi -> phi", {
          allowedAxiomIds: ["A1"],
        }),
      ];
      const checkResult: GoalCheckResult = {
        _tag: "GoalPartiallyAchieved",
        achievedCount: 0,
        totalCount: 1,
        goalStatuses: [
          {
            goalId: "g1",
            goalFormula: phiImpliesPhi,
            achieved: false,
            matchingNodeId: undefined,
          },
        ],
      };

      const result = computeGoalPanelData(goals, checkResult);
      expect(result.items[0]?.allowedAxiomDetails).toEqual([]);
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
            goalFormula: phiImpliesPhi,
            achieved: true,
            matchingNodeId: "n1",
          },
        ],
      };

      const result = computeGoalPanelData(goals, checkResult);
      expect(result.items[1]?.status).toBe(
        "not-achieved" satisfies GoalPanelItemStatus,
      );
      // フォールバック時もパースされた数式が含まれる
      expect(result.items[1]?.formula).toBeDefined();
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
      expect(result.items[0]?.formula).toBeUndefined();
    });
  });

  describe("formulaText の保持", () => {
    it("ゴールのformulaTextがそのまま保持される", () => {
      const goals = [makeGoal("g1", "phi -> (psi -> phi)")];
      const phiImpliesPsiImpliesPhi = parseFormula("phi -> (psi -> phi)");
      const checkResult: GoalCheckResult = {
        _tag: "GoalPartiallyAchieved",
        achievedCount: 0,
        totalCount: 1,
        goalStatuses: [
          {
            goalId: "g1",
            goalFormula: phiImpliesPsiImpliesPhi,
            achieved: false,
            matchingNodeId: undefined,
          },
        ],
      };

      const result = computeGoalPanelData(goals, checkResult);
      expect(result.items[0]?.formulaText).toBe("phi -> (psi -> phi)");
      expect(result.items[0]?.formula).toBe(phiImpliesPsiImpliesPhi);
    });
  });

  describe("制限違反オーバーライド", () => {
    it("GoalAllAchievedで公理違反がある場合、ステータスがachieved-but-axiom-violationになる", () => {
      const goals = [
        makeGoal("g1", "phi -> phi"),
        makeGoal("g2", "psi -> psi"),
      ];
      const checkResult: GoalCheckResult = {
        _tag: "GoalAllAchieved",
        achievedGoals: [
          {
            goalId: "g1",
            goalFormula: phiImpliesPhi,
            matchingNodeId: "n1",
          },
          {
            goalId: "g2",
            goalFormula: psiImpliesPsi,
            matchingNodeId: "n2",
          },
        ],
      };
      const violations: readonly GoalViolationInfo[] = [
        {
          goalId: "g1",
          hasAxiomViolation: true,
          hasRuleViolation: false,
          violatingAxiomIds: ["A3"],
        },
      ];

      const result = computeGoalPanelData(goals, checkResult, [], violations);
      expect(result.items[0]?.status).toBe(
        "achieved-but-axiom-violation" satisfies GoalPanelItemStatus,
      );
      // g2は違反なし → achieved のまま
      expect(result.items[1]?.status).toBe(
        "achieved" satisfies GoalPanelItemStatus,
      );
      // 違反ゴールはachievedCountに含まれない
      expect(result.achievedCount).toBe(1);
      expect(result.totalCount).toBe(2);
    });

    it("GoalAllAchievedで規則違反がある場合、ステータスがachieved-but-rule-violationになる", () => {
      const goals = [makeGoal("g1", "phi -> phi")];
      const checkResult: GoalCheckResult = {
        _tag: "GoalAllAchieved",
        achievedGoals: [
          {
            goalId: "g1",
            goalFormula: phiImpliesPhi,
            matchingNodeId: "n1",
          },
        ],
      };
      const violations: readonly GoalViolationInfo[] = [
        {
          goalId: "g1",
          hasAxiomViolation: false,
          hasRuleViolation: true,
          violatingAxiomIds: [],
        },
      ];

      const result = computeGoalPanelData(goals, checkResult, [], violations);
      expect(result.items[0]?.status).toBe(
        "achieved-but-rule-violation" satisfies GoalPanelItemStatus,
      );
      expect(result.achievedCount).toBe(0);
    });

    it("公理違反と規則違反の両方がある場合、公理違反が優先される", () => {
      const goals = [makeGoal("g1", "phi -> phi")];
      const checkResult: GoalCheckResult = {
        _tag: "GoalAllAchieved",
        achievedGoals: [
          {
            goalId: "g1",
            goalFormula: phiImpliesPhi,
            matchingNodeId: "n1",
          },
        ],
      };
      const violations: readonly GoalViolationInfo[] = [
        {
          goalId: "g1",
          hasAxiomViolation: true,
          hasRuleViolation: true,
          violatingAxiomIds: ["A3"],
        },
      ];

      const result = computeGoalPanelData(goals, checkResult, [], violations);
      expect(result.items[0]?.status).toBe(
        "achieved-but-axiom-violation" satisfies GoalPanelItemStatus,
      );
    });

    it("GoalPartiallyAchievedでも違反オーバーライドが適用される", () => {
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
            goalFormula: phiImpliesPhi,
            achieved: true,
            matchingNodeId: "n1",
          },
          {
            goalId: "g2",
            goalFormula: psiImpliesPsi,
            achieved: false,
            matchingNodeId: undefined,
          },
        ],
      };
      const violations: readonly GoalViolationInfo[] = [
        {
          goalId: "g1",
          hasAxiomViolation: true,
          hasRuleViolation: false,
          violatingAxiomIds: ["A3"],
        },
      ];

      const result = computeGoalPanelData(goals, checkResult, [], violations);
      expect(result.items[0]?.status).toBe(
        "achieved-but-axiom-violation" satisfies GoalPanelItemStatus,
      );
      expect(result.items[1]?.status).toBe(
        "not-achieved" satisfies GoalPanelItemStatus,
      );
    });

    it("未達成ゴールは違反情報があってもオーバーライドされない", () => {
      const goals = [makeGoal("g1", "phi -> phi")];
      const checkResult: GoalCheckResult = {
        _tag: "GoalPartiallyAchieved",
        achievedCount: 0,
        totalCount: 1,
        goalStatuses: [
          {
            goalId: "g1",
            goalFormula: phiImpliesPhi,
            achieved: false,
            matchingNodeId: undefined,
          },
        ],
      };
      const violations: readonly GoalViolationInfo[] = [
        {
          goalId: "g1",
          hasAxiomViolation: true,
          hasRuleViolation: false,
          violatingAxiomIds: ["A3"],
        },
      ];

      const result = computeGoalPanelData(goals, checkResult, [], violations);
      // not-achieved のまま（violationはachieved時のみオーバーライド）
      expect(result.items[0]?.status).toBe(
        "not-achieved" satisfies GoalPanelItemStatus,
      );
    });

    it("違反なし（hasAxiomViolation: false, hasRuleViolation: false）の場合はachievedのまま", () => {
      const goals = [makeGoal("g1", "phi -> phi")];
      const checkResult: GoalCheckResult = {
        _tag: "GoalAllAchieved",
        achievedGoals: [
          {
            goalId: "g1",
            goalFormula: phiImpliesPhi,
            matchingNodeId: "n1",
          },
        ],
      };
      const violations: readonly GoalViolationInfo[] = [
        {
          goalId: "g1",
          hasAxiomViolation: false,
          hasRuleViolation: false,
          violatingAxiomIds: [],
        },
      ];

      const result = computeGoalPanelData(goals, checkResult, [], violations);
      expect(result.items[0]?.status).toBe(
        "achieved" satisfies GoalPanelItemStatus,
      );
      expect(result.achievedCount).toBe(1);
    });

    it("violationsが空配列の場合は通常通りachieved", () => {
      const goals = [makeGoal("g1", "phi -> phi")];
      const checkResult: GoalCheckResult = {
        _tag: "GoalAllAchieved",
        achievedGoals: [
          {
            goalId: "g1",
            goalFormula: phiImpliesPhi,
            matchingNodeId: "n1",
          },
        ],
      };

      const result = computeGoalPanelData(goals, checkResult, [], []);
      expect(result.items[0]?.status).toBe(
        "achieved" satisfies GoalPanelItemStatus,
      );
      expect(result.achievedCount).toBe(1);
    });
  });

  describe("questInfo", () => {
    it("questInfoが渡されるとGoalPanelDataに含まれる", () => {
      const goals = [makeGoal("g1", "phi -> phi")];
      const checkResult: GoalCheckResult = {
        _tag: "GoalAllAchieved",
        achievedGoals: [
          {
            goalId: "g1",
            goalFormula: phiImpliesPhi,
            matchingNodeId: "n1",
          },
        ],
      };
      const questInfo = {
        description: "φ → φ を証明せよ。",
        hints: ["A1を使う", "A2を使う"],
        learningPoint: "SKK = I の対応",
      };

      const result = computeGoalPanelData(
        goals,
        checkResult,
        [],
        [],
        questInfo,
      );
      expect(result.questInfo).toBe(questInfo);
    });

    it("questInfo省略時はundefined", () => {
      const goals = [makeGoal("g1", "phi -> phi")];
      const checkResult: GoalCheckResult = {
        _tag: "GoalAllAchieved",
        achievedGoals: [
          {
            goalId: "g1",
            goalFormula: phiImpliesPhi,
            matchingNodeId: "n1",
          },
        ],
      };

      const result = computeGoalPanelData(goals, checkResult);
      expect(result.questInfo).toBeUndefined();
    });

    it("GoalNotSetでもquestInfoが保持される", () => {
      const questInfo = {
        description: "テスト",
        hints: [],
        learningPoint: "テスト",
      };
      const result = computeGoalPanelData(
        [],
        { _tag: "GoalNotSet" },
        [],
        [],
        questInfo,
      );
      expect(result.questInfo).toBe(questInfo);
    });

    it("GoalPartiallyAchievedでもquestInfoが保持される", () => {
      const goals = [makeGoal("g1", "phi -> phi")];
      const checkResult: GoalCheckResult = {
        _tag: "GoalPartiallyAchieved",
        achievedCount: 0,
        totalCount: 1,
        goalStatuses: [
          {
            goalId: "g1",
            goalFormula: phiImpliesPhi,
            achieved: false,
            matchingNodeId: undefined,
          },
        ],
      };
      const questInfo = {
        description: "テスト",
        hints: ["ヒント1"],
        learningPoint: "学習ポイント",
      };

      const result = computeGoalPanelData(
        goals,
        checkResult,
        [],
        [],
        questInfo,
      );
      expect(result.questInfo).toBe(questInfo);
    });
  });

  describe("violatingAxiomDetails", () => {
    it("公理違反時にviolatingAxiomDetailsが解決される", () => {
      const goals = [
        makeGoal("g1", "phi -> phi", {
          allowedAxiomIds: ["A1"],
        }),
      ];
      const checkResult: GoalCheckResult = {
        _tag: "GoalAllAchieved",
        achievedGoals: [
          {
            goalId: "g1",
            goalFormula: phiImpliesPhi,
            matchingNodeId: "n1",
          },
        ],
      };
      const violations: readonly GoalViolationInfo[] = [
        {
          goalId: "g1",
          hasAxiomViolation: true,
          hasRuleViolation: false,
          violatingAxiomIds: ["A2"],
        },
      ];

      const result = computeGoalPanelData(
        goals,
        checkResult,
        sampleAxioms,
        violations,
      );
      expect(result.items[0]?.violatingAxiomDetails).toEqual([
        {
          id: "A2",
          displayName: "A2 (S)",
          formula: a2Template,
        },
      ]);
    });

    it("公理違反なしの場合はviolatingAxiomDetailsがundefined", () => {
      const goals = [makeGoal("g1", "phi -> phi")];
      const checkResult: GoalCheckResult = {
        _tag: "GoalAllAchieved",
        achievedGoals: [
          {
            goalId: "g1",
            goalFormula: phiImpliesPhi,
            matchingNodeId: "n1",
          },
        ],
      };

      const result = computeGoalPanelData(goals, checkResult, sampleAxioms);
      expect(result.items[0]?.violatingAxiomDetails).toBeUndefined();
    });

    it("violatingAxiomIdsが空配列の場合もundefined", () => {
      const goals = [makeGoal("g1", "phi -> phi")];
      const checkResult: GoalCheckResult = {
        _tag: "GoalAllAchieved",
        achievedGoals: [
          {
            goalId: "g1",
            goalFormula: phiImpliesPhi,
            matchingNodeId: "n1",
          },
        ],
      };
      const violations: readonly GoalViolationInfo[] = [
        {
          goalId: "g1",
          hasAxiomViolation: true,
          hasRuleViolation: false,
          violatingAxiomIds: [],
        },
      ];

      const result = computeGoalPanelData(
        goals,
        checkResult,
        sampleAxioms,
        violations,
      );
      expect(result.items[0]?.violatingAxiomDetails).toBeUndefined();
    });

    it("GoalPartiallyAchievedでも違反公理の詳細が解決される", () => {
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
            goalFormula: phiImpliesPhi,
            achieved: true,
            matchingNodeId: "n1",
          },
          {
            goalId: "g2",
            goalFormula: psiImpliesPsi,
            achieved: false,
            matchingNodeId: undefined,
          },
        ],
      };
      const violations: readonly GoalViolationInfo[] = [
        {
          goalId: "g1",
          hasAxiomViolation: true,
          hasRuleViolation: false,
          violatingAxiomIds: ["A1"],
        },
      ];

      const result = computeGoalPanelData(
        goals,
        checkResult,
        sampleAxioms,
        violations,
      );
      expect(result.items[0]?.violatingAxiomDetails).toEqual([
        {
          id: "A1",
          displayName: "A1 (K)",
          formula: a1Template,
        },
      ]);
      // g2は違反なし
      expect(result.items[1]?.violatingAxiomDetails).toBeUndefined();
    });

    it("hasAxiomViolationがfalseだとviolatingAxiomIdsがあってもundefined", () => {
      const goals = [makeGoal("g1", "phi -> phi")];
      const checkResult: GoalCheckResult = {
        _tag: "GoalAllAchieved",
        achievedGoals: [
          {
            goalId: "g1",
            goalFormula: phiImpliesPhi,
            matchingNodeId: "n1",
          },
        ],
      };
      const violations: readonly GoalViolationInfo[] = [
        {
          goalId: "g1",
          hasAxiomViolation: false,
          hasRuleViolation: false,
          violatingAxiomIds: ["A2"],
        },
      ];

      const result = computeGoalPanelData(
        goals,
        checkResult,
        sampleAxioms,
        violations,
      );
      expect(result.items[0]?.violatingAxiomDetails).toBeUndefined();
    });
  });
});

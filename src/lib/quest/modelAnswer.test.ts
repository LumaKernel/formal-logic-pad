import { describe, it, expect } from "vitest";
import {
  buildModelAnswerWorkspace,
  validateModelAnswer,
  type ModelAnswer,
} from "./modelAnswer";
import type { QuestDefinition } from "./questDefinition";

// テスト用のクエスト定義
const testQuest: QuestDefinition = {
  id: "test-01",
  category: "propositional-basics",
  title: "Test: φ → φ",
  description: "φ → φ を証明せよ。",
  difficulty: 1,
  systemPresetId: "lukasiewicz",
  goals: [{ formulaText: "phi -> phi", label: "Goal" }],
  hints: [],
  estimatedSteps: 5,
  learningPoint: "test",
  order: 1,
  version: 1,
};

describe("buildModelAnswerWorkspace", () => {
  it("正しい模範解答からワークスペースを構築できる", () => {
    const answer: ModelAnswer = {
      questId: "test-01",
      steps: [
        {
          _tag: "axiom",
          formulaText:
            "(phi -> ((phi -> phi) -> phi)) -> ((phi -> (phi -> phi)) -> (phi -> phi))",
        },
        { _tag: "axiom", formulaText: "phi -> ((phi -> phi) -> phi)" },
        { _tag: "mp", leftIndex: 1, rightIndex: 0 },
        { _tag: "axiom", formulaText: "phi -> (phi -> phi)" },
        { _tag: "mp", leftIndex: 3, rightIndex: 2 },
      ],
    };

    const result = buildModelAnswerWorkspace(testQuest, answer);
    expect(result._tag).toBe("Ok");
    if (result._tag !== "Ok") return;
    // 公理インスタンスを直接配置するため AllAchievedButAxiomViolation になる
    expect(
      result.goalCheck._tag === "AllAchieved" ||
        result.goalCheck._tag === "AllAchievedButAxiomViolation",
    ).toBe(true);
  });

  it("不正なプリセットIDでPresetNotFoundを返す", () => {
    const badQuest: QuestDefinition = {
      ...testQuest,
      systemPresetId: "nonexistent" as QuestDefinition["systemPresetId"],
    };
    const answer: ModelAnswer = {
      questId: "test-01",
      steps: [{ _tag: "axiom", formulaText: "phi -> phi" }],
    };
    const result = buildModelAnswerWorkspace(badQuest, answer);
    expect(result._tag).toBe("PresetNotFound");
  });

  it("不正なMPインデックスでStepErrorを返す", () => {
    const answer: ModelAnswer = {
      questId: "test-01",
      steps: [
        { _tag: "axiom", formulaText: "phi" },
        { _tag: "mp", leftIndex: 0, rightIndex: 5 },
      ],
    };
    const result = buildModelAnswerWorkspace(testQuest, answer);
    expect(result._tag).toBe("StepError");
    if (result._tag !== "StepError") return;
    expect(result.stepIndex).toBe(1);
  });

  it("MPの検証失敗でStepErrorを返す", () => {
    const answer: ModelAnswer = {
      questId: "test-01",
      steps: [
        { _tag: "axiom", formulaText: "phi" },
        { _tag: "axiom", formulaText: "psi" },
        { _tag: "mp", leftIndex: 0, rightIndex: 1 },
      ],
    };
    const result = buildModelAnswerWorkspace(testQuest, answer);
    expect(result._tag).toBe("StepError");
    if (result._tag !== "StepError") return;
    expect(result.stepIndex).toBe(2);
    expect(result.reason).toContain("MP validation failed");
  });

  it("ゴール未達成の場合Okだがゴールチェックが失敗する", () => {
    const answer: ModelAnswer = {
      questId: "test-01",
      steps: [{ _tag: "axiom", formulaText: "phi -> (psi -> phi)" }],
    };
    const result = buildModelAnswerWorkspace(testQuest, answer);
    expect(result._tag).toBe("Ok");
    if (result._tag !== "Ok") return;
    expect(result.goalCheck._tag).not.toBe("AllAchieved");
  });

  it("applyTreeLayout が適用される（ノード位置が更新される）", () => {
    const answer: ModelAnswer = {
      questId: "test-01",
      steps: [
        {
          _tag: "axiom",
          formulaText:
            "(phi -> ((phi -> phi) -> phi)) -> ((phi -> (phi -> phi)) -> (phi -> phi))",
        },
        { _tag: "axiom", formulaText: "phi -> ((phi -> phi) -> phi)" },
        { _tag: "mp", leftIndex: 1, rightIndex: 0 },
        { _tag: "axiom", formulaText: "phi -> (phi -> phi)" },
        { _tag: "mp", leftIndex: 3, rightIndex: 2 },
      ],
    };
    const result = buildModelAnswerWorkspace(testQuest, answer);
    expect(result._tag).toBe("Ok");
    if (result._tag !== "Ok") return;

    // レイアウト後は少なくとも一部のノードが位置0,0でないはず
    const positions = result.workspace.nodes.map((n) => n.position);
    const hasNonZero = positions.some((p) => p.x !== 0 || p.y !== 0);
    expect(hasNonZero).toBe(true);
  });
});

// TAB テスト用のクエスト定義
const tabQuest: QuestDefinition = {
  id: "tab-test-01",
  category: "tab-basics",
  title: "Test TAB: φ → φ",
  description: "タブロー法で φ → φ を証明。",
  difficulty: 1,
  systemPresetId: "tab-prop",
  goals: [{ formulaText: "~(phi -> phi)", label: "Root" }],
  hints: [],
  estimatedSteps: 2,
  learningPoint: "test",
  order: 1,
  version: 1,
};

describe("buildModelAnswerWorkspace - TAB steps", () => {
  it("tab-root でルートノードを配置できる", () => {
    const answer: ModelAnswer = {
      questId: "tab-test-01",
      steps: [{ _tag: "tab-root", sequentText: "~(phi -> phi)" }],
    };
    const result = buildModelAnswerWorkspace(tabQuest, answer);
    expect(result._tag).toBe("Ok");
    if (result._tag !== "Ok") return;
    expect(result.workspace.nodes.length).toBe(1);
  });

  it("tab-rule で規則を適用できる", () => {
    const answer: ModelAnswer = {
      questId: "tab-test-01",
      steps: [
        { _tag: "tab-root", sequentText: "~(phi -> phi)" },
        {
          _tag: "tab-rule",
          conclusionIndex: 0,
          ruleId: "neg-implication",
          principalPosition: 0,
        },
        {
          _tag: "tab-rule",
          conclusionIndex: 1,
          ruleId: "bs",
          principalPosition: 0,
        },
      ],
    };
    const result = buildModelAnswerWorkspace(tabQuest, answer);
    expect(result._tag).toBe("Ok");
    if (result._tag !== "Ok") return;
    expect(result.goalCheck._tag).toBe("AllAchieved");
  });

  it("不正なconclusionIndexでStepErrorを返す", () => {
    const answer: ModelAnswer = {
      questId: "tab-test-01",
      steps: [
        { _tag: "tab-root", sequentText: "~(phi -> phi)" },
        {
          _tag: "tab-rule",
          conclusionIndex: 99,
          ruleId: "neg-implication",
          principalPosition: 0,
        },
      ],
    };
    const result = buildModelAnswerWorkspace(tabQuest, answer);
    expect(result._tag).toBe("StepError");
    if (result._tag !== "StepError") return;
    expect(result.stepIndex).toBe(1);
  });
});

describe("validateModelAnswer", () => {
  it("正しい模範解答はValidを返す", () => {
    const answer: ModelAnswer = {
      questId: "test-01",
      steps: [
        {
          _tag: "axiom",
          formulaText:
            "(phi -> ((phi -> phi) -> phi)) -> ((phi -> (phi -> phi)) -> (phi -> phi))",
        },
        { _tag: "axiom", formulaText: "phi -> ((phi -> phi) -> phi)" },
        { _tag: "mp", leftIndex: 1, rightIndex: 0 },
        { _tag: "axiom", formulaText: "phi -> (phi -> phi)" },
        { _tag: "mp", leftIndex: 3, rightIndex: 2 },
      ],
    };
    const result = validateModelAnswer(testQuest, answer);
    expect(result._tag).toBe("Valid");
  });

  it("ビルドエラーの場合BuildErrorを返す", () => {
    const answer: ModelAnswer = {
      questId: "test-01",
      steps: [{ _tag: "mp", leftIndex: 0, rightIndex: 1 }],
    };
    const result = validateModelAnswer(testQuest, answer);
    expect(result._tag).toBe("BuildError");
  });

  it("ゴール未達成の場合GoalNotAchievedを返す", () => {
    const answer: ModelAnswer = {
      questId: "test-01",
      steps: [{ _tag: "axiom", formulaText: "phi -> (psi -> phi)" }],
    };
    const result = validateModelAnswer(testQuest, answer);
    expect(result._tag).toBe("GoalNotAchieved");
  });
});

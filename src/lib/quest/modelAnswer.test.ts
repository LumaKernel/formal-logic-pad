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

  it("不正なMPインデックスでthrowする", () => {
    const answer: ModelAnswer = {
      questId: "test-01",
      steps: [
        { _tag: "axiom", formulaText: "phi" },
        { _tag: "mp", leftIndex: 0, rightIndex: 5 },
      ],
    };
    expect(() => buildModelAnswerWorkspace(testQuest, answer)).toThrow(
      /unsafeAssertDefined/,
    );
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

  it("不正なconclusionIndexでthrowする", () => {
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
    expect(() => buildModelAnswerWorkspace(tabQuest, answer)).toThrow(
      /unsafeAssertDefined/,
    );
  });
});

// SC テスト用のクエスト定義
const scQuest: QuestDefinition = {
  id: "sc-test-01",
  category: "sc-cut-elimination",
  title: "Test SC: φ → ((φ → ψ) → ψ)",
  description: "SCで φ → ((φ → ψ) → ψ) を証明。",
  difficulty: 2,
  systemPresetId: "sc-lk",
  goals: [{ formulaText: "phi -> ((phi -> psi) -> psi)", label: "Goal" }],
  hints: [],
  estimatedSteps: 6,
  learningPoint: "test",
  order: 1,
  version: 1,
};

describe("buildModelAnswerWorkspace - SC steps", () => {
  it("sc-root でルートシーケントノードを配置できる", () => {
    const answer: ModelAnswer = {
      questId: "sc-test-01",
      steps: [
        { _tag: "sc-root", sequentText: "⇒ phi -> ((phi -> psi) -> psi)" },
      ],
    };
    const result = buildModelAnswerWorkspace(scQuest, answer);
    expect(result._tag).toBe("Ok");
    if (result._tag !== "Ok") return;
    expect(result.workspace.nodes.length).toBe(1);
  });

  it("sc-rule で⇒→規則を適用できる", () => {
    const answer: ModelAnswer = {
      questId: "sc-test-01",
      steps: [
        { _tag: "sc-root", sequentText: "⇒ phi -> ((phi -> psi) -> psi)" },
        {
          _tag: "sc-rule",
          conclusionIndex: 0,
          ruleId: "implication-right",
          principalPosition: 0,
        },
      ],
    };
    const result = buildModelAnswerWorkspace(scQuest, answer);
    expect(result._tag).toBe("Ok");
    if (result._tag !== "Ok") return;
    // ルート + ⇒→で生成された前提 = 2ノード
    expect(result.workspace.nodes.length).toBe(2);
  });

  it("完全なSC証明でゴール達成する（sc-ce-02パターン）", () => {
    const answer: ModelAnswer = {
      questId: "sc-test-01",
      steps: [
        { _tag: "sc-root", sequentText: "⇒ phi -> ((phi -> psi) -> psi)" },
        {
          _tag: "sc-rule",
          conclusionIndex: 0,
          ruleId: "implication-right",
          principalPosition: 0,
        },
        {
          _tag: "sc-rule",
          conclusionIndex: 1,
          ruleId: "implication-right",
          principalPosition: 0,
        },
        {
          _tag: "sc-rule",
          conclusionIndex: 2,
          ruleId: "exchange-left",
          principalPosition: 0,
          exchangePosition: 0,
        },
        {
          _tag: "sc-rule",
          conclusionIndex: 3,
          ruleId: "implication-left",
          principalPosition: 1,
        },
        {
          _tag: "sc-rule",
          conclusionIndex: 4,
          ruleId: "identity",
          principalPosition: 0,
        },
        {
          _tag: "sc-rule",
          conclusionIndex: 5,
          ruleId: "identity",
          principalPosition: 0,
        },
      ],
    };
    const result = buildModelAnswerWorkspace(scQuest, answer);
    expect(result._tag).toBe("Ok");
    if (result._tag !== "Ok") return;
    expect(
      result.goalCheck._tag === "AllAchieved" ||
        result.goalCheck._tag === "AllAchievedButAxiomViolation",
    ).toBe(true);
  });

  it("不正なconclusionIndexでthrowする", () => {
    const answer: ModelAnswer = {
      questId: "sc-test-01",
      steps: [
        { _tag: "sc-root", sequentText: "⇒ phi -> psi" },
        {
          _tag: "sc-rule",
          conclusionIndex: 99,
          ruleId: "implication-right",
          principalPosition: 0,
        },
      ],
    };
    expect(() => buildModelAnswerWorkspace(scQuest, answer)).toThrow(
      /unsafeAssertDefined/,
    );
  });

  it("SC規則検証失敗でStepErrorを返す", () => {
    const answer: ModelAnswer = {
      questId: "sc-test-01",
      steps: [
        { _tag: "sc-root", sequentText: "⇒ phi" },
        {
          _tag: "sc-rule",
          conclusionIndex: 0,
          ruleId: "implication-right",
          principalPosition: 0,
        },
      ],
    };
    const result = buildModelAnswerWorkspace(scQuest, answer);
    expect(result._tag).toBe("StepError");
    if (result._tag !== "StepError") return;
    expect(result.reason).toContain("SC");
  });
});

// ND テスト用のクエスト定義
const ndQuest: QuestDefinition = {
  id: "nd-test-01",
  category: "nd-basics",
  title: "Test ND: φ → φ",
  description: "NDで φ → φ を証明。",
  difficulty: 1,
  systemPresetId: "nd-nm",
  goals: [{ formulaText: "phi -> phi", label: "Goal" }],
  hints: [],
  estimatedSteps: 2,
  learningPoint: "test",
  order: 1,
  version: 1,
};

describe("buildModelAnswerWorkspace - ND steps", () => {
  it("assumption + nd-implication-intro で φ→φ を証明できる", () => {
    const answer: ModelAnswer = {
      questId: "nd-test-01",
      steps: [
        { _tag: "assumption", formulaText: "phi" },
        { _tag: "nd-implication-intro", premiseIndex: 0, dischargedIndex: 0 },
      ],
    };
    const result = buildModelAnswerWorkspace(ndQuest, answer);
    expect(result._tag).toBe("Ok");
    if (result._tag !== "Ok") return;
    expect(
      result.goalCheck._tag === "AllAchieved" ||
        result.goalCheck._tag === "AllAchievedButAxiomViolation",
    ).toBe(true);
  });

  it("nd-implication-elim で→除去を適用できる", () => {
    const quest: QuestDefinition = {
      ...ndQuest,
      goals: [{ formulaText: "psi", label: "Goal" }],
    };
    const answer: ModelAnswer = {
      questId: "nd-test-01",
      steps: [
        { _tag: "assumption", formulaText: "phi" },
        { _tag: "assumption", formulaText: "phi -> psi" },
        { _tag: "nd-implication-elim", leftIndex: 0, rightIndex: 1 },
      ],
    };
    const result = buildModelAnswerWorkspace(quest, answer);
    expect(result._tag).toBe("Ok");
    if (result._tag !== "Ok") return;
    // ψ ノードが生成されているはず
    const psiNode = result.workspace.nodes.find(
      (n) => n.formulaText === "psi" || n.formulaText === "ψ",
    );
    expect(psiNode).toBeDefined();
  });

  it("nd-conjunction-intro / nd-conjunction-elim-left / nd-conjunction-elim-right で∧操作できる", () => {
    const quest: QuestDefinition = {
      ...ndQuest,
      goals: [{ formulaText: "(phi /\\ psi) -> (psi /\\ phi)", label: "Goal" }],
    };
    const answer: ModelAnswer = {
      questId: "nd-test-01",
      steps: [
        { _tag: "assumption", formulaText: "phi /\\ psi" },
        { _tag: "nd-conjunction-elim-right", premiseIndex: 0 },
        { _tag: "nd-conjunction-elim-left", premiseIndex: 0 },
        { _tag: "nd-conjunction-intro", leftIndex: 1, rightIndex: 2 },
        { _tag: "nd-implication-intro", premiseIndex: 3, dischargedIndex: 0 },
      ],
    };
    const result = buildModelAnswerWorkspace(quest, answer);
    expect(result._tag).toBe("Ok");
    if (result._tag !== "Ok") return;
    expect(
      result.goalCheck._tag === "AllAchieved" ||
        result.goalCheck._tag === "AllAchievedButAxiomViolation",
    ).toBe(true);
  });

  it("nd-disjunction-intro-left / nd-disjunction-intro-right / nd-disjunction-elim で∨操作できる", () => {
    const quest: QuestDefinition = {
      ...ndQuest,
      goals: [{ formulaText: "(phi \\/ psi) -> (psi \\/ phi)", label: "Goal" }],
    };
    const answer: ModelAnswer = {
      questId: "nd-test-01",
      steps: [
        { _tag: "assumption", formulaText: "phi \\/ psi" },
        { _tag: "assumption", formulaText: "phi" },
        {
          _tag: "nd-disjunction-intro-right",
          premiseIndex: 1,
          addedLeftText: "psi",
        },
        { _tag: "assumption", formulaText: "psi" },
        {
          _tag: "nd-disjunction-intro-left",
          premiseIndex: 3,
          addedRightText: "phi",
        },
        {
          _tag: "nd-disjunction-elim",
          disjunctionIndex: 0,
          leftCaseIndex: 2,
          leftDischargedIndex: 1,
          rightCaseIndex: 4,
          rightDischargedIndex: 3,
        },
        { _tag: "nd-implication-intro", premiseIndex: 5, dischargedIndex: 0 },
      ],
    };
    const result = buildModelAnswerWorkspace(quest, answer);
    expect(result._tag).toBe("Ok");
    if (result._tag !== "Ok") return;
    expect(
      result.goalCheck._tag === "AllAchieved" ||
        result.goalCheck._tag === "AllAchievedButAxiomViolation",
    ).toBe(true);
  });

  it("nd-efq でEFQを適用できる", () => {
    const quest: QuestDefinition = {
      ...ndQuest,
      systemPresetId: "nd-nj",
      goals: [{ formulaText: "(phi /\\ ~phi) -> psi", label: "Goal" }],
    };
    const answer: ModelAnswer = {
      questId: "nd-test-01",
      steps: [
        { _tag: "assumption", formulaText: "phi /\\ ~phi" },
        { _tag: "nd-conjunction-elim-left", premiseIndex: 0 },
        { _tag: "nd-conjunction-elim-right", premiseIndex: 0 },
        { _tag: "nd-implication-elim", leftIndex: 1, rightIndex: 2 },
        { _tag: "nd-efq", premiseIndex: 3, conclusionText: "psi" },
        { _tag: "nd-implication-intro", premiseIndex: 4, dischargedIndex: 0 },
      ],
    };
    const result = buildModelAnswerWorkspace(quest, answer);
    expect(result._tag).toBe("Ok");
    if (result._tag !== "Ok") return;
    expect(
      result.goalCheck._tag === "AllAchieved" ||
        result.goalCheck._tag === "AllAchievedButAxiomViolation",
    ).toBe(true);
  });

  it("nd-dne でDNEを適用できる", () => {
    const quest: QuestDefinition = {
      ...ndQuest,
      systemPresetId: "nd-nk",
      goals: [{ formulaText: "~~phi -> phi", label: "Goal" }],
    };
    const answer: ModelAnswer = {
      questId: "nd-test-01",
      steps: [
        { _tag: "assumption", formulaText: "~~phi" },
        { _tag: "nd-dne", premiseIndex: 0 },
        { _tag: "nd-implication-intro", premiseIndex: 1, dischargedIndex: 0 },
      ],
    };
    const result = buildModelAnswerWorkspace(quest, answer);
    expect(result._tag).toBe("Ok");
    if (result._tag !== "Ok") return;
    expect(
      result.goalCheck._tag === "AllAchieved" ||
        result.goalCheck._tag === "AllAchievedButAxiomViolation",
    ).toBe(true);
  });

  it("nd-universal-intro で∀導入を適用できる", () => {
    const quest: QuestDefinition = {
      ...ndQuest,
      goals: [{ formulaText: "all x. (P(x) -> P(x))", label: "Goal" }],
    };
    const answer: ModelAnswer = {
      questId: "nd-test-01",
      steps: [
        { _tag: "assumption", formulaText: "P(x)" },
        { _tag: "nd-implication-intro", premiseIndex: 0, dischargedIndex: 0 },
        { _tag: "nd-universal-intro", premiseIndex: 1, variableName: "x" },
      ],
    };
    const result = buildModelAnswerWorkspace(quest, answer);
    expect(result._tag).toBe("Ok");
    if (result._tag !== "Ok") return;
    expect(
      result.goalCheck._tag === "AllAchieved" ||
        result.goalCheck._tag === "AllAchievedButAxiomViolation",
    ).toBe(true);
  });

  it("nd-universal-elim で∀除去を適用できる", () => {
    const quest: QuestDefinition = {
      ...ndQuest,
      goals: [{ formulaText: "P(x)", label: "Goal" }],
    };
    const answer: ModelAnswer = {
      questId: "nd-test-01",
      steps: [
        { _tag: "assumption", formulaText: "all x. P(x)" },
        { _tag: "nd-universal-elim", premiseIndex: 0, termText: "x" },
      ],
    };
    const result = buildModelAnswerWorkspace(quest, answer);
    expect(result._tag).toBe("Ok");
    if (result._tag !== "Ok") return;
    // P(x)ノードが生成されているはず
    const hasTarget = result.workspace.nodes.some(
      (n) => n.formulaText === "P(x)",
    );
    expect(hasTarget).toBe(true);
  });

  it("nd-existential-intro で∃導入を適用できる", () => {
    const quest: QuestDefinition = {
      ...ndQuest,
      goals: [{ formulaText: "P(x) -> exists x. P(x)", label: "Goal" }],
    };
    const answer: ModelAnswer = {
      questId: "nd-test-01",
      steps: [
        { _tag: "assumption", formulaText: "P(x)" },
        {
          _tag: "nd-existential-intro",
          premiseIndex: 0,
          variableName: "x",
          termText: "x",
        },
        { _tag: "nd-implication-intro", premiseIndex: 1, dischargedIndex: 0 },
      ],
    };
    const result = buildModelAnswerWorkspace(quest, answer);
    expect(result._tag).toBe("Ok");
    if (result._tag !== "Ok") return;
    expect(
      result.goalCheck._tag === "AllAchieved" ||
        result.goalCheck._tag === "AllAchievedButAxiomViolation",
    ).toBe(true);
  });

  it("nd-existential-elim で∃除去を適用できる", () => {
    const quest: QuestDefinition = {
      ...ndQuest,
      goals: [
        {
          formulaText: "(exists x. P(x)) -> (exists x. P(x))",
          label: "Goal",
        },
      ],
    };
    const answer: ModelAnswer = {
      questId: "nd-test-01",
      steps: [
        { _tag: "assumption", formulaText: "exists x. P(x)" },
        { _tag: "assumption", formulaText: "P(x)" },
        {
          _tag: "nd-existential-intro",
          premiseIndex: 1,
          variableName: "x",
          termText: "x",
        },
        {
          _tag: "nd-existential-elim",
          existentialIndex: 0,
          caseIndex: 2,
          dischargedIndex: 1,
        },
        { _tag: "nd-implication-intro", premiseIndex: 3, dischargedIndex: 0 },
      ],
    };
    const result = buildModelAnswerWorkspace(quest, answer);
    expect(result._tag).toBe("Ok");
    if (result._tag !== "Ok") return;
    expect(
      result.goalCheck._tag === "AllAchieved" ||
        result.goalCheck._tag === "AllAchievedButAxiomViolation",
    ).toBe(true);
  });
});

describe("buildModelAnswerWorkspace - non-Hilbert axiom step", () => {
  it("ND系でaxiomステップを使うと単一ノードが生成される（expandAxiomStepIfNeeded非Hilbert分岐）", () => {
    const quest: QuestDefinition = {
      ...ndQuest,
      goals: [{ formulaText: "phi -> phi", label: "Goal" }],
    };
    const answer: ModelAnswer = {
      questId: "nd-test-01",
      steps: [
        // ND系でaxiomステップ: non-Hilbert branch (lines 533-542) をカバー
        { _tag: "axiom", formulaText: "phi -> phi" },
      ],
    };
    const result = buildModelAnswerWorkspace(quest, answer);
    expect(result._tag).toBe("Ok");
    if (result._tag !== "Ok") return;
    // Hilbert系と違い、公理展開（スキーマ+代入エッジ）は行われず、単一ノードになる
    // axiomノード + goalノード = 2ノード
    const axiomNodes = result.workspace.nodes.filter((n) => n.kind === "axiom");
    expect(axiomNodes.length).toBe(1);
    expect(axiomNodes[0]?.formulaText).toBe("phi -> phi");
  });
});

describe("buildModelAnswerWorkspace - note step", () => {
  it("ノートステップでノートノードが作成される", () => {
    const answer: ModelAnswer = {
      questId: "test-01",
      steps: [
        { _tag: "note", text: "この証明では A2 公理を使います。" },
        {
          _tag: "axiom",
          formulaText:
            "(phi -> ((phi -> phi) -> phi)) -> ((phi -> (phi -> phi)) -> (phi -> phi))",
        },
        { _tag: "axiom", formulaText: "phi -> ((phi -> phi) -> phi)" },
        { _tag: "mp", leftIndex: 2, rightIndex: 1 },
        { _tag: "axiom", formulaText: "phi -> (phi -> phi)" },
        { _tag: "mp", leftIndex: 4, rightIndex: 3 },
      ],
    };
    const result = buildModelAnswerWorkspace(testQuest, answer);
    expect(result._tag).toBe("Ok");
    if (result._tag !== "Ok") return;

    // ノートノードが存在する
    const noteNodes = result.workspace.nodes.filter((n) => n.kind === "note");
    expect(noteNodes.length).toBe(1);
    expect(noteNodes[0]?.formulaText).toBe("この証明では A2 公理を使います。");

    // ゴールは達成される（ノートはゴールチェックに影響しない）
    expect(
      result.goalCheck._tag === "AllAchieved" ||
        result.goalCheck._tag === "AllAchievedButAxiomViolation",
    ).toBe(true);
  });

  it("ノートステップのインデックスがstepNodeIdsに正しく反映される", () => {
    const answer: ModelAnswer = {
      questId: "test-01",
      steps: [
        { _tag: "axiom", formulaText: "phi -> (phi -> phi)" },
        { _tag: "note", text: "上の公理は A1 です。" },
        {
          _tag: "axiom",
          formulaText:
            "(phi -> ((phi -> phi) -> phi)) -> ((phi -> (phi -> phi)) -> (phi -> phi))",
        },
        { _tag: "note", text: "上の公理は A2 です。" },
        { _tag: "axiom", formulaText: "phi -> ((phi -> phi) -> phi)" },
        { _tag: "mp", leftIndex: 4, rightIndex: 2 },
        { _tag: "mp", leftIndex: 0, rightIndex: 5 },
      ],
    };
    const result = buildModelAnswerWorkspace(testQuest, answer);
    expect(result._tag).toBe("Ok");
    if (result._tag !== "Ok") return;

    // ノートノード2つ + 公理3つ + MP結論2つ + ゴール1つ = 8ノード
    const noteNodes = result.workspace.nodes.filter((n) => n.kind === "note");
    expect(noteNodes.length).toBe(2);

    // ゴールが達成される（ノートをスキップしてインデックスが正しく参照される）
    expect(
      result.goalCheck._tag === "AllAchieved" ||
        result.goalCheck._tag === "AllAchievedButAxiomViolation",
    ).toBe(true);
  });

  it("ノート付き模範解答のバリデーションがValidを返す", () => {
    const answer: ModelAnswer = {
      questId: "test-01",
      steps: [
        { _tag: "note", text: "# 証明の概要\nφ → φ を証明します。" },
        {
          _tag: "axiom",
          formulaText:
            "(phi -> ((phi -> phi) -> phi)) -> ((phi -> (phi -> phi)) -> (phi -> phi))",
        },
        { _tag: "axiom", formulaText: "phi -> ((phi -> phi) -> phi)" },
        { _tag: "mp", leftIndex: 2, rightIndex: 1 },
        { _tag: "axiom", formulaText: "phi -> (phi -> phi)" },
        { _tag: "mp", leftIndex: 4, rightIndex: 3 },
      ],
    };
    const result = validateModelAnswer(testQuest, answer);
    expect(result._tag).toBe("Valid");
  });
});

// Gen テスト用のクエスト定義
const genQuest: QuestDefinition = {
  id: "gen-test-01",
  category: "predicate-basics",
  title: "Test Gen: ∀x.(φ → φ)",
  description: "Genで ∀x.(φ → φ) を証明。",
  difficulty: 1,
  systemPresetId: "predicate",
  goals: [{ formulaText: "all x. (P(x) -> P(x))", label: "Goal" }],
  hints: [],
  estimatedSteps: 6,
  learningPoint: "test",
  order: 1,
  version: 1,
};

describe("buildModelAnswerWorkspace - Gen step", () => {
  it("gen でGen規則を適用できる", () => {
    const answer: ModelAnswer = {
      questId: "gen-test-01",
      steps: [
        {
          _tag: "axiom",
          formulaText:
            "(P(x) -> ((P(x) -> P(x)) -> P(x))) -> ((P(x) -> (P(x) -> P(x))) -> (P(x) -> P(x)))",
        },
        {
          _tag: "axiom",
          formulaText: "P(x) -> ((P(x) -> P(x)) -> P(x))",
        },
        { _tag: "mp", leftIndex: 1, rightIndex: 0 },
        { _tag: "axiom", formulaText: "P(x) -> (P(x) -> P(x))" },
        { _tag: "mp", leftIndex: 3, rightIndex: 2 },
        { _tag: "gen", premiseIndex: 4, variableName: "x" },
      ],
    };
    const result = buildModelAnswerWorkspace(genQuest, answer);
    expect(result._tag).toBe("Ok");
    if (result._tag !== "Ok") return;
    expect(
      result.goalCheck._tag === "AllAchieved" ||
        result.goalCheck._tag === "AllAchievedButAxiomViolation",
    ).toBe(true);
  });

  it("不正なGenインデックスでthrowする", () => {
    const answer: ModelAnswer = {
      questId: "gen-test-01",
      steps: [
        { _tag: "axiom", formulaText: "P(x) -> P(x)" },
        { _tag: "gen", premiseIndex: 99, variableName: "x" },
      ],
    };
    expect(() => buildModelAnswerWorkspace(genQuest, answer)).toThrow(
      /unsafeAssertDefined/,
    );
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

  it("ビルドエラーの場合throwする", () => {
    const answer: ModelAnswer = {
      questId: "test-01",
      steps: [{ _tag: "mp", leftIndex: 0, rightIndex: 1 }],
    };
    expect(() => validateModelAnswer(testQuest, answer)).toThrow(
      /unsafeAssertDefined/,
    );
  });

  it("ゴール未達成の場合GoalNotAchievedを返す", () => {
    const answer: ModelAnswer = {
      questId: "test-01",
      steps: [{ _tag: "axiom", formulaText: "phi -> (psi -> phi)" }],
    };
    const result = validateModelAnswer(testQuest, answer);
    expect(result._tag).toBe("GoalNotAchieved");
  });

  it("公理制約違反がある場合AxiomConstraintViolationを返す", () => {
    // A1のみ許可するクエストで、A2を使った模範解答
    const constrainedQuest: QuestDefinition = {
      id: "test-constrained",
      category: "propositional-basics",
      title: "Test: constrained",
      description: "A1のみで解く。",
      difficulty: 1,
      systemPresetId: "lukasiewicz",
      allowedAxiomIds: ["A1"],
      goals: [{ formulaText: "phi -> phi", label: "Goal" }],
      hints: [],
      estimatedSteps: 5,
      learningPoint: "test",
      order: 1,
      version: 1,
    };
    // A2 を使っている模範解答
    const answer: ModelAnswer = {
      questId: "test-constrained",
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
    const result = validateModelAnswer(constrainedQuest, answer);
    expect(result._tag).toBe("AxiomConstraintViolation");
    if (result._tag === "AxiomConstraintViolation") {
      const { goalCheck } = result;
      if (
        goalCheck._tag === "AllAchievedButAxiomViolation" ||
        goalCheck._tag === "AllAchievedButRuleViolation" ||
        goalCheck._tag === "AllAchieved"
      ) {
        const violations = goalCheck.goalResults.flatMap((r) => [
          ...r.violatingAxiomIds,
        ]);
        expect(violations.length).toBeGreaterThan(0);
      }
    }
  });

  it("公理インスタンスの模範解答はスキーマ+SubstitutionEdgeで構築されValidを返す", () => {
    // 公理インスタンスは buildAxiomStep で schema + SubstitutionEdge → instance に変換される
    // ルートは schema なので AllAchieved → Valid
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

  it("規則制約違反がある場合RuleConstraintViolationを返す", () => {
    // gen のみ許可でmpを禁止したクエスト
    const ruleConstrainedQuest: QuestDefinition = {
      id: "test-rule-constrained",
      category: "propositional-basics",
      title: "Test: rule constrained",
      description: "mp禁止で解く。",
      difficulty: 1,
      systemPresetId: "lukasiewicz",
      goals: [
        {
          formulaText: "phi -> phi",
          label: "Goal",
          allowedRuleIds: ["gen"],
        },
      ],
      hints: [],
      estimatedSteps: 5,
      learningPoint: "test",
      order: 1,
      version: 1,
    };
    // mp を使った模範解答
    const answer: ModelAnswer = {
      questId: "test-rule-constrained",
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
    const result = validateModelAnswer(ruleConstrainedQuest, answer);
    expect(result._tag).toBe("RuleConstraintViolation");
  });

  it("公理パターンに一致しない孤立ノードはゴール未達成", () => {
    // "phi /\\ psi" は公理パターンに一致しない孤立ノード → ゴール未達成
    const unknownQuest: QuestDefinition = {
      id: "test-unknown",
      category: "propositional-basics",
      title: "Test: unknown root",
      description: "test",
      difficulty: 1,
      systemPresetId: "lukasiewicz",
      goals: [{ formulaText: "phi /\\ psi", label: "Goal" }],
      hints: [],
      estimatedSteps: 1,
      learningPoint: "test",
      order: 1,
      version: 1,
    };
    const answer: ModelAnswer = {
      questId: "test-unknown",
      steps: [{ _tag: "axiom", formulaText: "phi /\\ psi" }],
    };
    const buildResult = buildModelAnswerWorkspace(unknownQuest, answer);
    expect(buildResult._tag).toBe("Ok");
    if (buildResult._tag !== "Ok") return;
    // 孤立ノード（エッジなし + 公理テンプレート不一致）はゴール未達成
    expect(buildResult.goalCheck._tag).toBe("NotAllAchieved");
  });
});

describe("buildModelAnswerWorkspace - script step", () => {
  it("スクリプトステップでスクリプトノードが作成される", () => {
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
        {
          _tag: "script",
          title: "カット除去デモ",
          code: "console.log('hello');",
        },
      ],
    };
    const result = buildModelAnswerWorkspace(testQuest, answer);
    expect(result._tag).toBe("Ok");
    if (result._tag !== "Ok") return;

    // スクリプトノードが存在する
    const scriptNodes = result.workspace.nodes.filter(
      (n) => n.kind === "script",
    );
    expect(scriptNodes.length).toBe(1);
    expect(scriptNodes[0]?.formulaText).toBe("console.log('hello');");

    // ゴールは達成される（スクリプトはゴールチェックに影響しない）
    expect(
      result.goalCheck._tag === "AllAchieved" ||
        result.goalCheck._tag === "AllAchievedButAxiomViolation",
    ).toBe(true);
  });

  it("スクリプトステップのインデックスがstepNodeIdsに正しく反映される", () => {
    const answer: ModelAnswer = {
      questId: "test-01",
      steps: [
        {
          _tag: "script",
          title: "前置スクリプト",
          code: "// setup",
        },
        {
          _tag: "axiom",
          formulaText:
            "(phi -> ((phi -> phi) -> phi)) -> ((phi -> (phi -> phi)) -> (phi -> phi))",
        },
        { _tag: "axiom", formulaText: "phi -> ((phi -> phi) -> phi)" },
        { _tag: "mp", leftIndex: 2, rightIndex: 1 },
        { _tag: "axiom", formulaText: "phi -> (phi -> phi)" },
        { _tag: "mp", leftIndex: 4, rightIndex: 3 },
      ],
    };
    const result = buildModelAnswerWorkspace(testQuest, answer);
    expect(result._tag).toBe("Ok");
    if (result._tag !== "Ok") return;

    // スクリプトノード1つ + 公理3つ + MP結論2つ + ゴール1つ = 7ノード
    const scriptNodes = result.workspace.nodes.filter(
      (n) => n.kind === "script",
    );
    expect(scriptNodes.length).toBe(1);

    // ゴールが達成される（スクリプトをスキップしてインデックスが正しく参照される）
    expect(
      result.goalCheck._tag === "AllAchieved" ||
        result.goalCheck._tag === "AllAchievedButAxiomViolation",
    ).toBe(true);
  });

  it("スクリプト付き模範解答のバリデーションがValidを返す", () => {
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
        {
          _tag: "script",
          title: "カット除去を体験",
          code: "var proof = {}; eliminateCutsWithSteps(proof);",
        },
      ],
    };
    const result = validateModelAnswer(testQuest, answer);
    expect(result._tag).toBe("Valid");
  });
});

describe("buildModelAnswerWorkspace - A4 axiom (term meta variable)", () => {
  const predicateQuest: QuestDefinition = {
    id: "test-pred",
    category: "predicate-basics",
    title: "Test: predicate A4",
    description: "述語論理A4公理テスト",
    difficulty: 1,
    systemPresetId: "predicate",
    goals: [{ formulaText: "(∀x. P(x)) -> P(a)", label: "Goal" }],
    hints: [],
    estimatedSteps: 1,
    learningPoint: "test",
    order: 1,
    version: 1,
  };

  it("A4公理インスタンスでterm meta variable代入が構築される", () => {
    const answer: ModelAnswer = {
      questId: "test-pred",
      steps: [
        {
          _tag: "axiom",
          formulaText: "(∀x. P(x)) -> P(a)",
        },
      ],
    };
    const result = buildModelAnswerWorkspace(predicateQuest, answer);
    expect(result._tag).toBe("Ok");
    if (result._tag !== "Ok") return;
    // A4は非自明代入（τ=a）なので schema + SubstitutionEdge → instance チェーン
    // buildSubstitutionEntriesFromMaps で termSub が処理される
    expect(result.workspace.nodes.length).toBeGreaterThanOrEqual(2);
  });
});

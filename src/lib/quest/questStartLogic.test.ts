import { describe, it, expect } from "vitest";
import {
  resolveSystemPreset,
  buildQuestStartParams,
  prepareQuestStart,
} from "./questStartLogic";
import type { QuestDefinition, SystemPresetId } from "./questDefinition";
import {
  skSystem,
  minimalLogicSystem,
  intuitionisticSystem,
  classicalLogicSystem,
  lukasiewiczSystem,
  mendelsonSystem,
  predicateLogicSystem,
  equalityLogicSystem,
  peanoArithmeticSystem,
  robinsonArithmeticSystem,
  peanoArithmeticHKSystem,
  peanoArithmeticMendelsonSystem,
  heytingArithmeticSystem,
  groupTheoryLeftSystem,
  groupTheoryFullSystem,
  abelianGroupSystem,
} from "../logic-core/inferenceRule";
import {
  nmSystem,
  njSystem,
  nkSystem,
  lmSystem,
  ljSystem,
  lkSystem,
  tabSystem,
  tabPropSystem,
  hilbertDeduction,
  naturalDeduction,
  tableauCalculusDeduction,
  sequentCalculusDeduction,
} from "../logic-core/deductionSystem";

// --- テスト用クエスト定義 ---

const testQuest: QuestDefinition = {
  id: "test-01",
  category: "propositional-basics",
  title: "テストクエスト",
  description: "テスト用",
  difficulty: 1,
  systemPresetId: "lukasiewicz",
  goals: [{ formulaText: "phi -> phi" }],
  hints: ["ヒント1"],
  estimatedSteps: 5,
  learningPoint: "基本",
  order: 1,
  version: 1,
};

const testQuests: readonly QuestDefinition[] = [
  testQuest,
  {
    ...testQuest,
    id: "test-02",
    title: "述語テスト",
    systemPresetId: "predicate",
  },
  {
    ...testQuest,
    id: "test-03",
    title: "等号テスト",
    systemPresetId: "equality",
  },
];

describe("resolveSystemPreset", () => {
  it("skプリセットを解決できる", () => {
    const result = resolveSystemPreset("sk");
    expect(result).toBeDefined();
    expect(result?.deductionSystem.system).toBe(skSystem);
  });

  it("minimalプリセットを解決できる", () => {
    const result = resolveSystemPreset("minimal");
    expect(result).toBeDefined();
    expect(result?.deductionSystem.system).toBe(minimalLogicSystem);
  });

  it("intuitionisticプリセットを解決できる", () => {
    const result = resolveSystemPreset("intuitionistic");
    expect(result).toBeDefined();
    expect(result?.deductionSystem.system).toBe(intuitionisticSystem);
  });

  it("classicalプリセットを解決できる", () => {
    const result = resolveSystemPreset("classical");
    expect(result).toBeDefined();
    expect(result?.deductionSystem.system).toBe(classicalLogicSystem);
  });

  it("lukasiewiczプリセットを解決できる", () => {
    const result = resolveSystemPreset("lukasiewicz");
    expect(result).toBeDefined();
    expect(result?.deductionSystem.system).toBe(lukasiewiczSystem);
  });

  it("mendelsonプリセットを解決できる", () => {
    const result = resolveSystemPreset("mendelson");
    expect(result).toBeDefined();
    expect(result?.deductionSystem.system).toBe(mendelsonSystem);
  });

  it("predicateプリセットを解決できる", () => {
    const result = resolveSystemPreset("predicate");
    expect(result).toBeDefined();
    expect(result?.deductionSystem.system).toBe(predicateLogicSystem);
  });

  it("equalityプリセットを解決できる", () => {
    const result = resolveSystemPreset("equality");
    expect(result).toBeDefined();
    expect(result?.deductionSystem.system).toBe(equalityLogicSystem);
  });

  it("peanoプリセットを解決できる", () => {
    const result = resolveSystemPreset("peano");
    expect(result).toBeDefined();
    expect(result?.deductionSystem.style).toBe("hilbert");
    expect(result?.deductionSystem.system).toBe(peanoArithmeticSystem);
  });

  it("nd-nmプリセットを解決できる", () => {
    const result = resolveSystemPreset("nd-nm");
    expect(result).toBeDefined();
    expect(result?.deductionSystem.style).toBe("natural-deduction");
    expect(result?.deductionSystem.system).toBe(nmSystem);
  });

  it("nd-njプリセットを解決できる", () => {
    const result = resolveSystemPreset("nd-nj");
    expect(result).toBeDefined();
    expect(result?.deductionSystem.style).toBe("natural-deduction");
    expect(result?.deductionSystem.system).toBe(njSystem);
  });

  it("nd-nkプリセットを解決できる", () => {
    const result = resolveSystemPreset("nd-nk");
    expect(result).toBeDefined();
    expect(result?.deductionSystem.style).toBe("natural-deduction");
    expect(result?.deductionSystem.system).toBe(nkSystem);
  });

  it("sc-lmプリセットを解決できる", () => {
    const result = resolveSystemPreset("sc-lm");
    expect(result).toBeDefined();
    expect(result?.deductionSystem.style).toBe("sequent-calculus");
    expect(result?.deductionSystem.system).toBe(lmSystem);
  });

  it("sc-ljプリセットを解決できる", () => {
    const result = resolveSystemPreset("sc-lj");
    expect(result).toBeDefined();
    expect(result?.deductionSystem.style).toBe("sequent-calculus");
    expect(result?.deductionSystem.system).toBe(ljSystem);
  });

  it("sc-lkプリセットを解決できる", () => {
    const result = resolveSystemPreset("sc-lk");
    expect(result).toBeDefined();
    expect(result?.deductionSystem.style).toBe("sequent-calculus");
    expect(result?.deductionSystem.system).toBe(lkSystem);
  });

  it("robinsonプリセットを解決できる", () => {
    const result = resolveSystemPreset("robinson");
    expect(result).toBeDefined();
    expect(result?.deductionSystem.style).toBe("hilbert");
    expect(result?.deductionSystem.system).toBe(robinsonArithmeticSystem);
  });

  it("peano-hkプリセットを解決できる", () => {
    const result = resolveSystemPreset("peano-hk");
    expect(result).toBeDefined();
    expect(result?.deductionSystem.style).toBe("hilbert");
    expect(result?.deductionSystem.system).toBe(peanoArithmeticHKSystem);
  });

  it("peano-mendelsonプリセットを解決できる", () => {
    const result = resolveSystemPreset("peano-mendelson");
    expect(result).toBeDefined();
    expect(result?.deductionSystem.style).toBe("hilbert");
    expect(result?.deductionSystem.system).toBe(peanoArithmeticMendelsonSystem);
  });

  it("heytingプリセットを解決できる", () => {
    const result = resolveSystemPreset("heyting");
    expect(result).toBeDefined();
    expect(result?.deductionSystem.style).toBe("hilbert");
    expect(result?.deductionSystem.system).toBe(heytingArithmeticSystem);
  });

  it("group-leftプリセットを解決できる", () => {
    const result = resolveSystemPreset("group-left");
    expect(result).toBeDefined();
    expect(result?.deductionSystem.style).toBe("hilbert");
    expect(result?.deductionSystem.system).toBe(groupTheoryLeftSystem);
  });

  it("group-fullプリセットを解決できる", () => {
    const result = resolveSystemPreset("group-full");
    expect(result).toBeDefined();
    expect(result?.deductionSystem.style).toBe("hilbert");
    expect(result?.deductionSystem.system).toBe(groupTheoryFullSystem);
  });

  it("abelian-groupプリセットを解決できる", () => {
    const result = resolveSystemPreset("abelian-group");
    expect(result).toBeDefined();
    expect(result?.deductionSystem.style).toBe("hilbert");
    expect(result?.deductionSystem.system).toBe(abelianGroupSystem);
  });

  it("tab-propプリセットを解決できる", () => {
    const result = resolveSystemPreset("tab-prop");
    expect(result).toBeDefined();
    expect(result?.deductionSystem.style).toBe("tableau-calculus");
    expect(result?.deductionSystem.system).toBe(tabPropSystem);
  });

  it("tabプリセットを解決できる", () => {
    const result = resolveSystemPreset("tab");
    expect(result).toBeDefined();
    expect(result?.deductionSystem.style).toBe("tableau-calculus");
    expect(result?.deductionSystem.system).toBe(tabSystem);
  });

  it("存在しないプリセットIDはundefinedを返す", () => {
    const result = resolveSystemPreset("nonexistent" as SystemPresetId);
    expect(result).toBeUndefined();
  });
});

describe("buildQuestStartParams", () => {
  it("クエスト定義からノートブック作成パラメータを生成する", () => {
    const result = buildQuestStartParams(testQuest);
    expect(result).toBeDefined();
    expect(result?.name).toBe("テストクエスト");
    expect(result?.deductionSystem).toStrictEqual(
      hilbertDeduction(lukasiewiczSystem),
    );
    expect(result?.goals).toEqual([{ formulaText: "phi -> phi" }]);
  });

  it("述語論理クエストでpredicateLogicSystemが返る", () => {
    const quest: QuestDefinition = {
      ...testQuest,
      systemPresetId: "predicate",
    };
    const result = buildQuestStartParams(quest);
    expect(result?.deductionSystem).toStrictEqual(
      hilbertDeduction(predicateLogicSystem),
    );
  });

  it("等号クエストでequalityLogicSystemが返る", () => {
    const quest: QuestDefinition = {
      ...testQuest,
      systemPresetId: "equality",
    };
    const result = buildQuestStartParams(quest);
    expect(result?.deductionSystem).toStrictEqual(
      hilbertDeduction(equalityLogicSystem),
    );
  });

  it("不正なプリセットIDの場合undefinedを返す", () => {
    const quest: QuestDefinition = {
      ...testQuest,
      systemPresetId: "invalid" as SystemPresetId,
    };
    const result = buildQuestStartParams(quest);
    expect(result).toBeUndefined();
  });

  it("自然演繹プリセットのクエストでND体系が返る", () => {
    const quest: QuestDefinition = {
      ...testQuest,
      systemPresetId: "nd-nm",
    };
    const result = buildQuestStartParams(quest);
    expect(result).toBeDefined();
    expect(result?.deductionSystem).toStrictEqual(naturalDeduction(nmSystem));
  });

  it("自然演繹NJプリセットのクエストでNJ体系が返る", () => {
    const quest: QuestDefinition = {
      ...testQuest,
      systemPresetId: "nd-nj",
    };
    const result = buildQuestStartParams(quest);
    expect(result).toBeDefined();
    expect(result?.deductionSystem).toStrictEqual(naturalDeduction(njSystem));
  });

  it("自然演繹NKプリセットのクエストでNK体系が返る", () => {
    const quest: QuestDefinition = {
      ...testQuest,
      systemPresetId: "nd-nk",
    };
    const result = buildQuestStartParams(quest);
    expect(result).toBeDefined();
    expect(result?.deductionSystem).toStrictEqual(naturalDeduction(nkSystem));
  });

  it("シーケント計算LMプリセットのクエストでSC体系が返る", () => {
    const quest: QuestDefinition = {
      ...testQuest,
      systemPresetId: "sc-lm",
    };
    const result = buildQuestStartParams(quest);
    expect(result).toBeDefined();
    expect(result?.deductionSystem).toStrictEqual(
      sequentCalculusDeduction(lmSystem),
    );
  });

  it("シーケント計算LJプリセットのクエストでSC体系が返る", () => {
    const quest: QuestDefinition = {
      ...testQuest,
      systemPresetId: "sc-lj",
    };
    const result = buildQuestStartParams(quest);
    expect(result).toBeDefined();
    expect(result?.deductionSystem).toStrictEqual(
      sequentCalculusDeduction(ljSystem),
    );
  });

  it("シーケント計算LKプリセットのクエストでSC体系が返る", () => {
    const quest: QuestDefinition = {
      ...testQuest,
      systemPresetId: "sc-lk",
    };
    const result = buildQuestStartParams(quest);
    expect(result).toBeDefined();
    expect(result?.deductionSystem).toStrictEqual(
      sequentCalculusDeduction(lkSystem),
    );
  });

  it("タブロー法プリセットのクエストでTAB体系が返る", () => {
    const quest: QuestDefinition = {
      ...testQuest,
      systemPresetId: "tab-prop",
    };
    const result = buildQuestStartParams(quest);
    expect(result).toBeDefined();
    expect(result?.deductionSystem).toStrictEqual(
      tableauCalculusDeduction(tabPropSystem),
    );
  });

  it("タブロー法tabプリセットのクエストでTAB体系が返る", () => {
    const quest: QuestDefinition = {
      ...testQuest,
      systemPresetId: "tab",
    };
    const result = buildQuestStartParams(quest);
    expect(result).toBeDefined();
    expect(result?.deductionSystem).toStrictEqual(
      tableauCalculusDeduction(tabSystem),
    );
  });

  it("複数ゴールのクエストでgoalsが正しく設定される", () => {
    const quest: QuestDefinition = {
      ...testQuest,
      goals: [
        { formulaText: "phi -> phi" },
        { formulaText: "phi -> psi -> phi" },
      ],
    };
    const result = buildQuestStartParams(quest);
    expect(result?.goals).toHaveLength(2);
  });

  it("クエストのallowedAxiomIdsがゴールに引き継がれる", () => {
    const quest: QuestDefinition = {
      ...testQuest,
      allowedAxiomIds: ["A1", "A2"],
    };
    const result = buildQuestStartParams(quest);
    expect(result?.goals[0]?.allowedAxiomIds).toEqual(["A1", "A2"]);
  });

  it("ゴール個別のallowedAxiomIdsがクエスト全体より優先される", () => {
    const quest: QuestDefinition = {
      ...testQuest,
      allowedAxiomIds: ["A1", "A2"],
      goals: [
        {
          formulaText: "phi -> phi",
          allowedAxiomIds: ["A1"],
        },
      ],
    };
    const result = buildQuestStartParams(quest);
    expect(result?.goals[0]?.allowedAxiomIds).toEqual(["A1"]);
  });

  it("クエストにallowedAxiomIdsがなければゴールのallowedAxiomIdsはそのまま", () => {
    const quest: QuestDefinition = {
      ...testQuest,
      goals: [
        {
          formulaText: "phi -> phi",
          allowedAxiomIds: ["A3"],
        },
      ],
    };
    const result = buildQuestStartParams(quest);
    expect(result?.goals[0]?.allowedAxiomIds).toEqual(["A3"]);
  });

  it("クエストにもゴールにもallowedAxiomIdsがなければundefined", () => {
    const result = buildQuestStartParams(testQuest);
    expect(result?.goals[0]?.allowedAxiomIds).toBeUndefined();
  });
});

describe("prepareQuestStart", () => {
  it("有効なクエストIDで開始パラメータを返す", () => {
    const result = prepareQuestStart(testQuests, "test-01");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.params.name).toBe("テストクエスト");
      expect(result.params.deductionSystem).toStrictEqual(
        hilbertDeduction(lukasiewiczSystem),
      );
    }
  });

  it("存在しないクエストIDでquest-not-foundエラー", () => {
    const result = prepareQuestStart(testQuests, "nonexistent");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("quest-not-found");
    }
  });

  it("不正なプリセットIDのクエストでpreset-not-foundエラー", () => {
    const quests: readonly QuestDefinition[] = [
      {
        ...testQuest,
        systemPresetId: "invalid" as SystemPresetId,
      },
    ];
    const result = prepareQuestStart(quests, "test-01");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("preset-not-found");
    }
  });

  it("述語論理クエストを正しく開始準備できる", () => {
    const result = prepareQuestStart(testQuests, "test-02");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.params.name).toBe("述語テスト");
      expect(result.params.deductionSystem).toStrictEqual(
        hilbertDeduction(predicateLogicSystem),
      );
    }
  });

  it("等号クエストを正しく開始準備できる", () => {
    const result = prepareQuestStart(testQuests, "test-03");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.params.name).toBe("等号テスト");
      expect(result.params.deductionSystem).toStrictEqual(
        hilbertDeduction(equalityLogicSystem),
      );
    }
  });

  it("空のクエスト配列でquest-not-foundエラー", () => {
    const result = prepareQuestStart([], "test-01");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("quest-not-found");
    }
  });
});

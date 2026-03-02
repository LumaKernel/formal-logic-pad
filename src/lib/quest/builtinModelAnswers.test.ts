/**
 * ビルトイン模範解答の検証テスト。
 *
 * 各模範解答がクエストのゴールを正しく達成することを純粋に検証する。
 *
 * 新カテゴリ追加時はカテゴリ別テストセクションも追加すること。
 */

import { describe, it, expect } from "vitest";
import { builtinModelAnswers } from "./builtinModelAnswers";
import { builtinQuests } from "./builtinQuests";
import { validateModelAnswer, buildModelAnswerWorkspace } from "./modelAnswer";
import type { QuestDefinition } from "./questDefinition";
import type { ModelAnswer } from "./modelAnswer";

/** クエストIDからクエスト定義を検索する */
function findQuest(questId: string): QuestDefinition {
  const quest = builtinQuests.find((q) => q.id === questId);
  if (quest === undefined) {
    throw new Error(`Quest not found: ${questId satisfies string}`);
  }
  return quest;
}

/** カテゴリでフィルタした模範解答を返す */
function filterByCategory(
  category: string,
): readonly (readonly [string, ModelAnswer])[] {
  return builtinModelAnswers
    .filter((a) => {
      const quest = builtinQuests.find((q) => q.id === a.questId);
      return quest?.category === category;
    })
    .map((a) => [a.questId, a] as const);
}

describe("builtinModelAnswers", () => {
  it("すべての模範解答がbuiltinQuestsに対応するクエストを持つ", () => {
    for (const answer of builtinModelAnswers) {
      const quest = builtinQuests.find((q) => q.id === answer.questId);
      expect(quest).toBeDefined();
    }
  });

  it("模範解答のquestIdが一意である", () => {
    const ids = builtinModelAnswers.map((a) => a.questId);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });
});

describe("propositional-basics 模範解答の検証", () => {
  const answers = filterByCategory("propositional-basics");

  it.each(answers)("%s: 模範解答がゴールを達成する", (questId, answer) => {
    const quest = findQuest(questId);
    const result = validateModelAnswer(quest, answer);
    if (result._tag !== "Valid") {
      const buildResult = buildModelAnswerWorkspace(quest, answer);
      throw new Error(
        `Model answer for ${questId satisfies string} is not valid: ${JSON.stringify(result, null, 2) satisfies string}\nBuild result: ${JSON.stringify(buildResult, null, 2) satisfies string}`,
      );
    }
    expect(result._tag).toBe("Valid");
  });

  it.each(answers)("%s: ワークスペース構築が成功する", (questId, answer) => {
    const quest = findQuest(questId);
    const result = buildModelAnswerWorkspace(quest, answer);
    expect(result._tag).toBe("Ok");
  });

  it.each(answers)("%s: 自動レイアウトが適用される", (questId, answer) => {
    const quest = findQuest(questId);
    const result = buildModelAnswerWorkspace(quest, answer);
    if (result._tag !== "Ok") return;
    if (answer.steps.length > 1) {
      const hasNonZero = result.workspace.nodes.some(
        (n) => n.position.x !== 0 || n.position.y !== 0,
      );
      expect(hasNonZero).toBe(true);
    }
  });
});

describe("propositional-intermediate 模範解答の検証", () => {
  const answers = filterByCategory("propositional-intermediate");

  it.each(answers)("%s: 模範解答がゴールを達成する", (questId, answer) => {
    const quest = findQuest(questId);
    const result = validateModelAnswer(quest, answer);
    if (result._tag !== "Valid") {
      const buildResult = buildModelAnswerWorkspace(quest, answer);
      throw new Error(
        `Model answer for ${questId satisfies string} is not valid: ${JSON.stringify(result, null, 2) satisfies string}\nBuild result: ${JSON.stringify(buildResult, null, 2) satisfies string}`,
      );
    }
    expect(result._tag).toBe("Valid");
  });

  it.each(answers)("%s: ワークスペース構築が成功する", (questId, answer) => {
    const quest = findQuest(questId);
    const result = buildModelAnswerWorkspace(quest, answer);
    expect(result._tag).toBe("Ok");
  });

  it.each(answers)("%s: 自動レイアウトが適用される", (questId, answer) => {
    const quest = findQuest(questId);
    const result = buildModelAnswerWorkspace(quest, answer);
    if (result._tag !== "Ok") return;
    if (answer.steps.length > 1) {
      const hasNonZero = result.workspace.nodes.some(
        (n) => n.position.x !== 0 || n.position.y !== 0,
      );
      expect(hasNonZero).toBe(true);
    }
  });
});

describe("propositional-negation 模範解答の検証", () => {
  const answers = filterByCategory("propositional-negation");

  it.each(answers)("%s: 模範解答がゴールを達成する", (questId, answer) => {
    const quest = findQuest(questId);
    const result = validateModelAnswer(quest, answer);
    if (result._tag !== "Valid") {
      const buildResult = buildModelAnswerWorkspace(quest, answer);
      throw new Error(
        `Model answer for ${questId satisfies string} is not valid: ${JSON.stringify(result, null, 2) satisfies string}\nBuild result: ${JSON.stringify(buildResult, null, 2) satisfies string}`,
      );
    }
    expect(result._tag).toBe("Valid");
  });

  it.each(answers)("%s: ワークスペース構築が成功する", (questId, answer) => {
    const quest = findQuest(questId);
    const result = buildModelAnswerWorkspace(quest, answer);
    expect(result._tag).toBe("Ok");
  });

  it.each(answers)("%s: 自動レイアウトが適用される", (questId, answer) => {
    const quest = findQuest(questId);
    const result = buildModelAnswerWorkspace(quest, answer);
    if (result._tag !== "Ok") return;
    if (answer.steps.length > 1) {
      const hasNonZero = result.workspace.nodes.some(
        (n) => n.position.x !== 0 || n.position.y !== 0,
      );
      expect(hasNonZero).toBe(true);
    }
  });
});

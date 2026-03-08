import { Either } from "effect";
import { describe, it, expect } from "vitest";
import { builtinQuests } from "./builtinQuests";
import { validateUniqueIds, questCategories } from "./questDefinition";
import { findPresetById } from "../notebook/notebookCreateLogic";
import { parseString } from "../logic-lang/parser";

describe("builtinQuests", () => {
  it("クエスト数が191個である", () => {
    expect(builtinQuests).toHaveLength(191);
  });

  it("全IDが一意である", () => {
    expect(validateUniqueIds(builtinQuests)).toBe(true);
  });

  it("各クエストのsystemPresetIdが有効なプリセットを参照している", () => {
    for (const quest of builtinQuests) {
      const preset = findPresetById(quest.systemPresetId);
      expect(preset).toBeDefined();
    }
  });

  it("各クエストのcategoryが有効なカテゴリである", () => {
    const validIds = new Set(questCategories.map((c) => c.id));
    for (const quest of builtinQuests) {
      expect(validIds.has(quest.category)).toBe(true);
    }
  });

  it("各クエストにゴールが1つ以上ある", () => {
    for (const quest of builtinQuests) {
      expect(quest.goals.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("各クエストにヒントが1つ以上ある", () => {
    for (const quest of builtinQuests) {
      expect(quest.hints.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("各クエストのゴール式テキストが空でない", () => {
    for (const quest of builtinQuests) {
      for (const goal of quest.goals) {
        expect(goal.formulaText.trim()).not.toBe("");
      }
    }
  });

  it("各クエストのゴール式テキストが正しくパースできる", () => {
    for (const quest of builtinQuests) {
      for (const goal of quest.goals) {
        const result = parseString(goal.formulaText);
        expect(
          Either.isRight(result),
          `${quest.id satisfies string}: "${goal.formulaText satisfies string}" のパースに失敗`,
        ).toBe(true);
      }
    }
  });

  it("各クエストの推定ステップ数が正の整数", () => {
    for (const quest of builtinQuests) {
      expect(quest.estimatedSteps).toBeGreaterThan(0);
      expect(Number.isInteger(quest.estimatedSteps)).toBe(true);
    }
  });

  it("各クエストの難易度が1-5の範囲内", () => {
    for (const quest of builtinQuests) {
      expect(quest.difficulty).toBeGreaterThanOrEqual(1);
      expect(quest.difficulty).toBeLessThanOrEqual(5);
    }
  });

  it("各クエストにtitleとdescriptionがある", () => {
    for (const quest of builtinQuests) {
      expect(quest.title.trim()).not.toBe("");
      expect(quest.description.trim()).not.toBe("");
    }
  });

  it("各クエストにlearningPointがある", () => {
    for (const quest of builtinQuests) {
      expect(quest.learningPoint.trim()).not.toBe("");
    }
  });

  it("同カテゴリ内のorderが一意である", () => {
    const ordersByCategory = new Map<string, number[]>();
    for (const quest of builtinQuests) {
      const orders = ordersByCategory.get(quest.category) ?? [];
      orders.push(quest.order);
      ordersByCategory.set(quest.category, orders);
    }
    for (const [, orders] of ordersByCategory) {
      const unique = new Set(orders);
      expect(unique.size).toBe(orders.length);
    }
  });

  it("同カテゴリ内でクエストがorder順に並んでいる", () => {
    const prevOrderByCategory = new Map<string, number>();
    for (const quest of builtinQuests) {
      const prevOrder = prevOrderByCategory.get(quest.category) ?? 0;
      expect(quest.order).toBeGreaterThanOrEqual(prevOrder);
      prevOrderByCategory.set(quest.category, quest.order);
    }
  });
});

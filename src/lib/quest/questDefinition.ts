/**
 * クエスト（証明問題）の定義型。
 *
 * クエストは「ゴール式を証明せよ」という問題で、
 * 使用する公理系、ヒント、難易度などのメタデータを持つ。
 *
 * 変更時は questDefinition.test.ts, builtinQuests.ts も同期すること。
 */

import type { AxiomId } from "../logic-core/inferenceRule";
import type { QuestGoalDefinition } from "../proof-pad/workspaceState";

// --- クエストID ---

/** クエストの一意識別子（例: "prop-01", "pred-01"） */
export type QuestId = string;

// --- 難易度 ---

/** クエストの難易度レベル（1-5） */
export type DifficultyLevel = 1 | 2 | 3 | 4 | 5;

// --- カテゴリ ---

/**
 * クエストのカテゴリ。
 * - "propositional-basics": 命題論理の基礎（Łukasiewicz体系）
 * - "propositional-intermediate": 命題論理の中級（推移律の活用、複合的な証明）
 * - "propositional-negation": 否定を含む命題論理
 * - "propositional-advanced": 命題論理の挑戦問題（連言・選言の定義展開）
 * - "predicate-basics": 述語論理の基礎
 * - "equality-basics": 等号付き述語論理の基礎
 * - "peano-basics": ペアノ算術の基礎（PA公理の直接利用）
 * - "peano-arithmetic": ペアノ算術の算術的推論（PA公理の組み合わせ）
 * - "group-basics": 群論の基礎（群公理の直接利用）
 * - "group-proofs": 群論の推論（群公理の組み合わせ）
 * - "nd-basics": 自然演繹の基礎（NM/NJ/NK）
 * - "tab-basics": タブロー法の基礎（TAB命題論理）
 * - "at-basics": 分析的タブローの基礎（AT命題論理）
 */
export type QuestCategory =
  | "propositional-basics"
  | "propositional-intermediate"
  | "propositional-negation"
  | "propositional-advanced"
  | "predicate-basics"
  | "equality-basics"
  | "peano-basics"
  | "peano-arithmetic"
  | "group-basics"
  | "group-proofs"
  | "nd-basics"
  | "tab-basics"
  | "at-basics";

/** カテゴリのメタデータ */
export type QuestCategoryMeta = {
  readonly id: QuestCategory;
  readonly label: string;
  readonly description: string;
  /** カテゴリ内の表示順 */
  readonly order: number;
};

/** 全カテゴリの定義 */
export const questCategories: readonly QuestCategoryMeta[] = [
  {
    id: "propositional-basics",
    label: "命題論理の基礎",
    description: "A1, A2, A3 + MP を使った基本的な証明。",
    order: 1,
  },
  {
    id: "propositional-intermediate",
    label: "命題論理の中級",
    description: "推移律の活用や複合的な証明技法。",
    order: 2,
  },
  {
    id: "propositional-negation",
    label: "否定を含む命題論理",
    description: "否定公理 A3 を活用する証明。",
    order: 3,
  },
  {
    id: "propositional-advanced",
    label: "命題論理の挑戦問題",
    description: "連言・選言の定義展開を含む高難度の証明。",
    order: 4,
  },
  {
    id: "predicate-basics",
    label: "述語論理の基礎",
    description: "量化子（∀, ∃）と Gen 規則を含む証明。",
    order: 5,
  },
  {
    id: "equality-basics",
    label: "等号付き述語論理",
    description: "等号公理を含む証明。",
    order: 6,
  },
  {
    id: "peano-basics",
    label: "ペアノ算術の基礎",
    description: "PA公理（PA1-PA6）を直接利用する基本的な証明。",
    order: 7,
  },
  {
    id: "peano-arithmetic",
    label: "ペアノ算術の推論",
    description: "PA公理を組み合わせた算術的性質の証明。",
    order: 8,
  },
  {
    id: "group-basics",
    label: "群論の基礎",
    description: "群公理（G1-G3）を直接利用する基本的な証明。",
    order: 9,
  },
  {
    id: "group-proofs",
    label: "群論の推論",
    description: "群公理を組み合わせた群の性質の証明。",
    order: 10,
  },
  {
    id: "nd-basics",
    label: "自然演繹の基礎",
    description: "自然演繹体系（NM/NJ/NK）での仮定の導入・解消による証明。",
    order: 11,
  },
  {
    id: "tab-basics",
    label: "タブロー法の基礎",
    description:
      "タブロー式シーケント計算（TAB）での反駁証明。否定して閉じたタブローを構築する。",
    order: 12,
  },
  {
    id: "at-basics",
    label: "分析的タブローの基礎",
    description:
      "分析的タブロー（Analytic Tableau）での反駁証明。署名付き論理式のα/β規則を適用し、全枝を閉じる。",
    order: 13,
  },
] as const;

/** カテゴリIDからカテゴリメタデータを検索する */
export function findCategoryById(
  id: QuestCategory,
): QuestCategoryMeta | undefined {
  return questCategories.find((c) => c.id === id);
}

// --- プリセット公理系ID ---

/**
 * クエストが使用する公理系のプリセットID。
 * notebookCreateLogic.ts の systemPresets と一致させる。
 */
export type SystemPresetId =
  | "sk"
  | "minimal"
  | "intuitionistic"
  | "classical"
  | "lukasiewicz"
  | "mendelson"
  | "predicate"
  | "equality"
  | "peano"
  | "robinson"
  | "peano-hk"
  | "peano-mendelson"
  | "heyting"
  | "group-left"
  | "group-full"
  | "abelian-group"
  | "nd-nm"
  | "nd-nj"
  | "nd-nk"
  | "sc-lm"
  | "sc-lj"
  | "sc-lk"
  | "tab-prop"
  | "tab"
  | "at-prop"
  | "at";

// --- クエスト定義 ---

/** クエストの定義（イミュータブル） */
export type QuestDefinition = {
  /** クエストの一意識別子 */
  readonly id: QuestId;
  /** カテゴリ */
  readonly category: QuestCategory;
  /** 表示名 */
  readonly title: string;
  /** 問題の説明 */
  readonly description: string;
  /** 難易度（1-5） */
  readonly difficulty: DifficultyLevel;
  /** 使用する公理系プリセットID */
  readonly systemPresetId: SystemPresetId;
  /** ゴール定義（ワークスペースに配置されるゴールノード） */
  readonly goals: readonly QuestGoalDefinition[];
  /** ヒントテキスト（段階的に表示可能） */
  readonly hints: readonly string[];
  /** 推定ステップ数（目安） */
  readonly estimatedSteps: number;
  /** 学習ポイント */
  readonly learningPoint: string;
  /** カテゴリ内の表示順 */
  readonly order: number;
  /**
   * このクエストで使ってよい公理スキーマIDのリスト。
   * undefined の場合はシステムの全公理を許可する。
   * ゴール個別の allowedAxiomIds が設定されている場合はそちらが優先される。
   */
  readonly allowedAxiomIds?: readonly AxiomId[];
  /**
   * クエスト定義のバージョン番号（正の整数）。
   * クエスト内容（ゴール、公理系、ヒント等）を変更した場合にインクリメントする。
   * ノートブック作成時にこのバージョンが記録され、
   * 最新バージョンと異なる場合にユーザーに警告を表示する。
   */
  readonly version: number;
};

// --- ユーティリティ ---

/** クエスト定義のIDが一意であるかを検証する */
export function validateUniqueIds(quests: readonly QuestDefinition[]): boolean {
  const ids = new Set(quests.map((q) => q.id));
  return ids.size === quests.length;
}

/** カテゴリでクエストをグループ化する */
export function groupByCategory(
  quests: readonly QuestDefinition[],
): ReadonlyMap<QuestCategory, readonly QuestDefinition[]> {
  const map = new Map<QuestCategory, QuestDefinition[]>();
  for (const quest of quests) {
    const existing = map.get(quest.category);
    if (existing !== undefined) {
      existing.push(quest);
    } else {
      map.set(quest.category, [quest]);
    }
  }
  return map;
}

/** クエストをカテゴリ順 → カテゴリ内order順にソートする */
export function sortQuests(
  quests: readonly QuestDefinition[],
): readonly QuestDefinition[] {
  const categoryOrder = new Map(questCategories.map((c) => [c.id, c.order]));
  return [...quests].sort((a, b) => {
    const catA = categoryOrder.get(a.category) ?? 999;
    const catB = categoryOrder.get(b.category) ?? 999;
    if (catA !== catB) return catA - catB;
    return a.order - b.order;
  });
}

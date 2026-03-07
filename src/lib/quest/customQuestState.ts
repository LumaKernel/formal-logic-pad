/**
 * 自作クエストの状態管理 - 純粋ロジック。
 *
 * ビルトインクエストとは別枠で、ユーザーが独自に作成・編集・削除できるクエストを管理する。
 * イミュータブルなデータ構造で、UIやストレージから独立。
 *
 * 変更時は customQuestState.test.ts, index.ts も同期すること。
 */

import type { AxiomId } from "../logic-core/inferenceRule";
import type { InferenceRuleId } from "../proof-pad/inferenceEdge";
import type { QuestGoalDefinition } from "../proof-pad/workspaceState";
import type {
  QuestDefinition,
  QuestId,
  QuestCategory,
  DifficultyLevel,
  SystemPresetId,
} from "./questDefinition";

// --- カスタムクエストID ---

/** カスタムクエストのIDプレフィックス */
export const CUSTOM_QUEST_ID_PREFIX = "custom-" as const;

/** IDがカスタムクエストかどうかを判定する */
export function isCustomQuestId(id: QuestId): boolean {
  return id.startsWith(CUSTOM_QUEST_ID_PREFIX);
}

/** カスタムクエスト用の新しいIDを生成する */
export function generateCustomQuestId(now: number): QuestId {
  return `${CUSTOM_QUEST_ID_PREFIX satisfies string}${`${now satisfies number}` satisfies string}`;
}

// --- 自作クエストコレクション ---

/** 自作クエストのコレクション状態 */
export type CustomQuestCollection = {
  readonly quests: ReadonlyMap<QuestId, QuestDefinition>;
};

/** 空の自作クエストコレクションを作成する */
export function createEmptyCustomQuestCollection(): CustomQuestCollection {
  return { quests: new Map() };
}

// --- クエスト作成パラメータ ---

/** 自作クエスト作成時の入力パラメータ */
export type CreateCustomQuestParams = {
  readonly title: string;
  readonly description: string;
  readonly category: QuestCategory;
  readonly difficulty: DifficultyLevel;
  readonly systemPresetId: SystemPresetId;
  readonly goals: readonly QuestGoalDefinition[];
  readonly hints: readonly string[];
  readonly estimatedSteps: number;
  readonly learningPoint: string;
};

// --- バリデーション ---

/** バリデーション結果 */
export type CustomQuestValidation =
  | { readonly _tag: "Valid" }
  | { readonly _tag: "EmptyTitle" }
  | { readonly _tag: "EmptyGoals" }
  | { readonly _tag: "DuplicateId"; readonly id: QuestId };

/** 作成パラメータのバリデーション */
export function validateCreateParams(
  params: CreateCustomQuestParams,
): CustomQuestValidation {
  if (params.title.trim() === "") {
    return { _tag: "EmptyTitle" };
  }
  if (params.goals.length === 0) {
    return { _tag: "EmptyGoals" };
  }
  return { _tag: "Valid" };
}

/** コレクション内のID重複チェック */
export function validateNoDuplicateId(
  collection: CustomQuestCollection,
  id: QuestId,
): CustomQuestValidation {
  if (collection.quests.has(id)) {
    return { _tag: "DuplicateId", id };
  }
  return { _tag: "Valid" };
}

// --- CRUD操作 ---

/** 結果型 */
export type CustomQuestResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly reason: CustomQuestValidation };

/**
 * 自作クエストを追加する。
 * IDは now パラメータから自動生成する。
 */
export function addCustomQuest(
  collection: CustomQuestCollection,
  params: CreateCustomQuestParams,
  now: number,
): CustomQuestResult<{
  readonly collection: CustomQuestCollection;
  readonly questId: QuestId;
}> {
  const validation = validateCreateParams(params);
  if (validation._tag !== "Valid") {
    return { ok: false, reason: validation };
  }

  const questId = generateCustomQuestId(now);
  const idValidation = validateNoDuplicateId(collection, questId);
  if (idValidation._tag !== "Valid") {
    return { ok: false, reason: idValidation };
  }

  const quest: QuestDefinition = {
    id: questId,
    category: params.category,
    title: params.title.trim(),
    description: params.description.trim(),
    difficulty: params.difficulty,
    systemPresetId: params.systemPresetId,
    goals: params.goals,
    hints: params.hints,
    estimatedSteps: params.estimatedSteps,
    learningPoint: params.learningPoint,
    order: 0,
    version: 1,
  };

  const newQuests = new Map(collection.quests);
  newQuests.set(questId, quest);

  return {
    ok: true,
    value: { collection: { quests: newQuests }, questId },
  };
}

/**
 * 自作クエストを更新する。
 * バージョンは自動インクリメントされる。
 */
export function updateCustomQuest(
  collection: CustomQuestCollection,
  questId: QuestId,
  params: CreateCustomQuestParams,
): CustomQuestResult<{ readonly collection: CustomQuestCollection }> {
  const existing = collection.quests.get(questId);
  if (existing === undefined) {
    return {
      ok: false,
      reason: { _tag: "DuplicateId", id: questId },
    };
  }

  const validation = validateCreateParams(params);
  if (validation._tag !== "Valid") {
    return { ok: false, reason: validation };
  }

  const updated: QuestDefinition = {
    ...existing,
    category: params.category,
    title: params.title.trim(),
    description: params.description.trim(),
    difficulty: params.difficulty,
    systemPresetId: params.systemPresetId,
    goals: params.goals,
    hints: params.hints,
    estimatedSteps: params.estimatedSteps,
    learningPoint: params.learningPoint,
    version: existing.version + 1,
  };

  const newQuests = new Map(collection.quests);
  newQuests.set(questId, updated);

  return {
    ok: true,
    value: { collection: { quests: newQuests } },
  };
}

/** 自作クエストを削除する */
export function removeCustomQuest(
  collection: CustomQuestCollection,
  questId: QuestId,
): CustomQuestCollection {
  if (!collection.quests.has(questId)) {
    return collection;
  }
  const newQuests = new Map(collection.quests);
  newQuests.delete(questId);
  return { quests: newQuests };
}

/**
 * ビルトインクエストを複製して自作クエストにする。
 * IDは新規生成し、バージョンは1にリセットする。
 */
export function duplicateAsCustomQuest(
  collection: CustomQuestCollection,
  source: QuestDefinition,
  now: number,
): CustomQuestResult<{
  readonly collection: CustomQuestCollection;
  readonly questId: QuestId;
}> {
  const questId = generateCustomQuestId(now);
  const idValidation = validateNoDuplicateId(collection, questId);
  if (idValidation._tag !== "Valid") {
    return { ok: false, reason: idValidation };
  }

  const duplicate: QuestDefinition = {
    ...source,
    id: questId,
    version: 1,
  };

  const newQuests = new Map(collection.quests);
  newQuests.set(questId, duplicate);

  return {
    ok: true,
    value: { collection: { quests: newQuests }, questId },
  };
}

// --- クエリ ---

/** IDで自作クエストを検索する */
export function findCustomQuestById(
  collection: CustomQuestCollection,
  questId: QuestId,
): QuestDefinition | undefined {
  return collection.quests.get(questId);
}

/** 自作クエストの一覧を取得する（作成順） */
export function listCustomQuests(
  collection: CustomQuestCollection,
): readonly QuestDefinition[] {
  return [...collection.quests.values()];
}

/** 自作クエストの数を取得する */
export function getCustomQuestCount(collection: CustomQuestCollection): number {
  return collection.quests.size;
}

// --- マージ ---

/**
 * ビルトインクエストと自作クエストを統合する。
 * ID衝突がないことを前提とする（カスタムIDプレフィックスで保証）。
 */
export function mergeWithBuiltinQuests(
  builtinQuests: readonly QuestDefinition[],
  customCollection: CustomQuestCollection,
): readonly QuestDefinition[] {
  return [...builtinQuests, ...listCustomQuests(customCollection)];
}

// --- シリアライゼーション ---

/** シリアライズ用の中間表現（JSON互換） */
export type SerializedCustomQuestCollection = {
  readonly quests: readonly SerializedCustomQuest[];
};

/** 単一の自作クエストのシリアライズ表現 */
export type SerializedCustomQuest = {
  readonly id: string;
  readonly category: string;
  readonly title: string;
  readonly description: string;
  readonly difficulty: number;
  readonly systemPresetId: string;
  readonly goals: readonly {
    readonly formulaText: string;
    readonly label?: string;
    readonly allowedAxiomIds?: readonly string[];
    readonly allowedRuleIds?: readonly string[];
  }[];
  readonly hints: readonly string[];
  readonly estimatedSteps: number;
  readonly learningPoint: string;
  readonly order: number;
  readonly version: number;
  readonly allowedAxiomIds?: readonly string[];
};

/** 自作クエストコレクションをJSON互換形式にシリアライズする */
export function serializeCustomQuestCollection(
  collection: CustomQuestCollection,
): SerializedCustomQuestCollection {
  return {
    quests: listCustomQuests(collection).map((q) => ({
      id: q.id,
      category: q.category,
      title: q.title,
      description: q.description,
      difficulty: q.difficulty,
      systemPresetId: q.systemPresetId,
      goals: q.goals.map((g) => ({
        formulaText: g.formulaText,
        ...(g.label !== undefined ? { label: g.label } : {}),
        ...(g.allowedAxiomIds !== undefined
          ? { allowedAxiomIds: [...g.allowedAxiomIds] }
          : {}),
        ...(g.allowedRuleIds !== undefined
          ? { allowedRuleIds: [...g.allowedRuleIds] }
          : {}),
      })),
      hints: [...q.hints],
      estimatedSteps: q.estimatedSteps,
      learningPoint: q.learningPoint,
      order: q.order,
      version: q.version,
      ...(q.allowedAxiomIds !== undefined
        ? { allowedAxiomIds: [...q.allowedAxiomIds] }
        : {}),
    })),
  };
}

/** JSON互換形式から自作クエストコレクションをデシリアライズする */
export function deserializeCustomQuestCollection(
  data: unknown,
): CustomQuestCollection {
  if (
    typeof data !== "object" ||
    data === null ||
    !("quests" in data) ||
    !Array.isArray((data as { readonly quests: unknown }).quests)
  ) {
    return createEmptyCustomQuestCollection();
  }

  const quests = new Map<QuestId, QuestDefinition>();

  for (const raw of (data as { readonly quests: readonly unknown[] }).quests) {
    const parsed = parseCustomQuestFromRaw(raw);
    if (parsed !== undefined) {
      quests.set(parsed.id, parsed);
    }
  }

  return { quests };
}

/** raw JSON からクエスト定義をパースする（不正データは undefined） */
function parseCustomQuestFromRaw(raw: unknown): QuestDefinition | undefined {
  if (typeof raw !== "object" || raw === null) return undefined;

  const obj = raw as Record<string, unknown>;

  if (typeof obj["id"] !== "string" || !isCustomQuestId(obj["id"])) {
    return undefined;
  }
  if (typeof obj["category"] !== "string") return undefined;
  if (typeof obj["title"] !== "string") return undefined;
  if (typeof obj["description"] !== "string") return undefined;
  if (typeof obj["difficulty"] !== "number") return undefined;
  if (typeof obj["systemPresetId"] !== "string") return undefined;
  if (!Array.isArray(obj["goals"])) return undefined;
  if (!Array.isArray(obj["hints"])) return undefined;
  if (typeof obj["estimatedSteps"] !== "number") return undefined;
  if (typeof obj["learningPoint"] !== "string") return undefined;
  if (typeof obj["version"] !== "number") return undefined;

  const goals = parseGoals(obj["goals"] as readonly unknown[]);
  if (goals === undefined) return undefined;

  const hints = parseStringArray(obj["hints"] as readonly unknown[]);
  if (hints === undefined) return undefined;

  const allowedAxiomIds = Array.isArray(obj["allowedAxiomIds"])
    ? (parseStringArray(obj["allowedAxiomIds"] as readonly unknown[]) as
        | readonly AxiomId[]
        | undefined)
    : undefined;

  return {
    id: obj["id"] as QuestId,
    category: obj["category"] as QuestCategory,
    title: obj["title"] as string,
    description: obj["description"] as string,
    difficulty: obj["difficulty"] as DifficultyLevel,
    systemPresetId: obj["systemPresetId"] as SystemPresetId,
    goals,
    hints: hints ?? [],
    estimatedSteps: obj["estimatedSteps"] as number,
    learningPoint: obj["learningPoint"] as string,
    order: typeof obj["order"] === "number" ? (obj["order"] as number) : 0,
    version: obj["version"] as number,
    ...(allowedAxiomIds !== undefined ? { allowedAxiomIds } : {}),
  };
}

function parseGoals(
  raw: readonly unknown[],
): readonly QuestGoalDefinition[] | undefined {
  const results: QuestGoalDefinition[] = [];
  for (const item of raw) {
    if (typeof item !== "object" || item === null) return undefined;
    const g = item as Record<string, unknown>;
    if (typeof g["formulaText"] !== "string") return undefined;

    const goal: QuestGoalDefinition = {
      formulaText: g["formulaText"] as string,
      ...(typeof g["label"] === "string"
        ? { label: g["label"] as string }
        : {}),
      ...(Array.isArray(g["allowedAxiomIds"])
        ? {
            allowedAxiomIds: parseStringArray(
              g["allowedAxiomIds"] as readonly unknown[],
            ) as readonly AxiomId[] | undefined,
          }
        : {}),
      ...(Array.isArray(g["allowedRuleIds"])
        ? {
            allowedRuleIds: parseStringArray(
              g["allowedRuleIds"] as readonly unknown[],
            ) as readonly InferenceRuleId[] | undefined,
          }
        : {}),
    };
    results.push(goal);
  }
  return results;
}

function parseStringArray(
  raw: readonly unknown[],
): readonly string[] | undefined {
  const results: string[] = [];
  for (const item of raw) {
    if (typeof item !== "string") return undefined;
    results.push(item);
  }
  return results;
}

/** ストレージキー */
export const CUSTOM_QUEST_STORAGE_KEY = "custom-quests";

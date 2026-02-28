/**
 * クエストバージョン比較の純粋ロジック。
 *
 * ノートブック作成時に記録されたクエストバージョンと、
 * 現在のクエスト定義のバージョンを比較し、
 * 警告が必要かどうかを判定する純粋関数を提供する。
 *
 * 変更時は questVersionLogic.test.ts も同期すること。
 */

import type { Notebook } from "../notebook/notebookState";
import type { QuestDefinition } from "./questDefinition";

// --- バージョン比較結果型 ---

/** バージョン警告の種別 */
export type QuestVersionStatus =
  | {
      /** ノートブックがクエストに紐付いていない（自由帳） */
      readonly _tag: "NotQuest";
    }
  | {
      /** クエスト定義が見つからない */
      readonly _tag: "QuestNotFound";
      readonly questId: string;
    }
  | {
      /** バージョン情報がノートブックに記録されていない（旧データ） */
      readonly _tag: "VersionUnknown";
      readonly questId: string;
      readonly currentVersion: number;
    }
  | {
      /** 最新バージョンで作成されている */
      readonly _tag: "UpToDate";
      readonly questId: string;
      readonly version: number;
    }
  | {
      /** ノートブックのバージョンが古い */
      readonly _tag: "Outdated";
      readonly questId: string;
      readonly notebookVersion: number;
      readonly currentVersion: number;
    };

/**
 * ノートブックのクエストバージョン状態を判定する。
 *
 * @param notebook ノートブック
 * @param quests クエスト定義一覧
 * @returns バージョン状態
 */
export function checkQuestVersion(
  notebook: Notebook,
  quests: readonly QuestDefinition[],
): QuestVersionStatus {
  const { questId } = notebook;
  if (questId === undefined) {
    return { _tag: "NotQuest" };
  }

  const quest = quests.find((q) => q.id === questId);
  if (quest === undefined) {
    return { _tag: "QuestNotFound", questId };
  }

  const { questVersion } = notebook;
  if (questVersion === undefined) {
    return {
      _tag: "VersionUnknown",
      questId,
      currentVersion: quest.version,
    };
  }

  if (questVersion < quest.version) {
    return {
      _tag: "Outdated",
      questId,
      notebookVersion: questVersion,
      currentVersion: quest.version,
    };
  }

  return {
    _tag: "UpToDate",
    questId,
    version: questVersion,
  };
}

/**
 * バージョン状態が警告を必要とするかどうかを判定する。
 *
 * Outdated と VersionUnknown の場合に警告が必要。
 *
 * @param status バージョン状態
 * @returns 警告が必要な場合 true
 */
export function needsVersionWarning(status: QuestVersionStatus): boolean {
  switch (status._tag) {
    case "NotQuest":
    case "QuestNotFound":
    case "UpToDate":
      return false;
    case "VersionUnknown":
    case "Outdated":
      return true;
  }
}

/**
 * バージョン状態に応じた警告メッセージを返す。
 *
 * 警告が不要な場合は undefined を返す。
 *
 * @param status バージョン状態
 * @returns 警告メッセージ（警告不要の場合 undefined）
 */
export function getVersionWarningMessage(
  status: QuestVersionStatus,
): string | undefined {
  switch (status._tag) {
    case "NotQuest":
    case "QuestNotFound":
    case "UpToDate":
      return undefined;
    case "VersionUnknown":
      return `このノートブックはバージョン情報が記録されていません。クエストの最新バージョンは v${String(status.currentVersion) satisfies string} です。`;
    case "Outdated":
      return `このノートブックは古いバージョン (v${String(status.notebookVersion) satisfies string}) のクエストから作成されました。最新バージョンは v${String(status.currentVersion) satisfies string} です。`;
  }
}

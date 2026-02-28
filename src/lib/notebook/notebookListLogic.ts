/**
 * ノートブック一覧表示の純粋ロジック。
 *
 * ノートブックの表示用データの計算を提供する。
 *
 * 変更時は notebookListLogic.test.ts も同期すること。
 */

import type { Notebook, NotebookMeta } from "./notebookState";

// --- 表示用データ ---

/** ノートブック一覧の各項目の表示用データ */
export type NotebookListItem = {
  readonly id: string;
  readonly name: string;
  readonly systemName: string;
  readonly mode: "free" | "quest";
  readonly updatedAtLabel: string;
  readonly createdAtLabel: string;
  /** クエストから作成された場合のクエストID（フィルタリング用） */
  readonly questId?: string;
};

/** 日時のフォーマット（相対表示） */
export function formatRelativeTime(now: number, timestamp: number): string {
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) {
    return "たった今";
  }
  if (minutes < 60) {
    return `${String(minutes) satisfies string}分前`;
  }
  if (hours < 24) {
    return `${String(hours) satisfies string}時間前`;
  }
  if (days < 30) {
    return `${String(days) satisfies string}日前`;
  }
  // 30日以上は日付表示（Intl.DateTimeFormatを使用しDate構築を回避）
  const formatter = new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
  return formatter.format(timestamp);
}

/** ノートブックを一覧表示用データに変換する */
export function toNotebookListItem(
  notebook: Notebook,
  now: number,
): NotebookListItem {
  return {
    id: notebook.meta.id,
    name: notebook.meta.name,
    systemName: notebook.workspace.system.name,
    mode: notebook.workspace.mode,
    updatedAtLabel: formatRelativeTime(now, notebook.meta.updatedAt),
    createdAtLabel: formatRelativeTime(now, notebook.meta.createdAt),
    questId: notebook.questId,
  };
}

/** クエストIDでノートブック一覧をフィルタする */
export function filterNotebooksByQuestId(
  items: readonly NotebookListItem[],
  questId: string,
): readonly NotebookListItem[] {
  return items.filter((item) => item.questId === questId);
}

/** ノートブック一覧を表示用データに変換する */
export function toNotebookListItems(
  notebooks: readonly Notebook[],
  now: number,
): readonly NotebookListItem[] {
  return notebooks.map((n) => toNotebookListItem(n, now));
}

/** 名前のバリデーション（空文字不可） */
export function validateNotebookName(
  name: string,
):
  | { readonly valid: true }
  | { readonly valid: false; readonly reason: string } {
  const trimmed = name.trim();
  if (trimmed === "") {
    return { valid: false, reason: "名前を入力してください" };
  }
  if (trimmed.length > 100) {
    return { valid: false, reason: "名前は100文字以内にしてください" };
  }
  return { valid: true };
}

/** 削除確認メッセージを生成する */
export function deleteConfirmMessage(meta: NotebookMeta): string {
  return `「${meta.name satisfies string}」を削除しますか？この操作は元に戻せません。`;
}

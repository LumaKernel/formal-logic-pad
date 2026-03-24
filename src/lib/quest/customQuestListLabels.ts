/**
 * 自作クエスト一覧UIのラベル純粋関数。
 *
 * CustomQuestListComponent で使用するすべてのUIテキストを
 * locale に応じて返す。
 *
 * 変更時は customQuestListLabels.test.ts, CustomQuestListComponent.tsx も同期すること。
 */

import type { Locale } from "../../i18n/config";

// --- セクションヘッダー ---

/** セクションタイトル */
export function sectionTitleLabel(locale: Locale): string {
  return locale === "ja" ? "自作クエスト" : "Custom Quests";
}

/** 新規作成ボタン */
export function createButtonLabel(
  isCreating: boolean,
  locale: Locale,
): string {
  if (isCreating) return locale === "ja" ? "閉じる" : "Close";
  return locale === "ja" ? "新規作成" : "Create New";
}

/** インポートボタン */
export function importToggleLabel(
  isImporting: boolean,
  locale: Locale,
): string {
  if (isImporting) return locale === "ja" ? "閉じる" : "Close";
  return locale === "ja" ? "インポート" : "Import";
}

/** 空状態メッセージ */
export function emptyStateLabel(locale: Locale): string {
  return locale === "ja"
    ? "自作クエストはまだありません。"
    : "No custom quests yet.";
}

// --- アイテムボタン ---

/** 編集ボタン */
export function editButtonLabel(locale: Locale): string {
  return locale === "ja" ? "編集" : "Edit";
}

/** 共有ボタン */
export function shareButtonLabel(locale: Locale): string {
  return locale === "ja" ? "共有" : "Share";
}

/** 複製ボタン */
export function duplicateButtonLabel(locale: Locale): string {
  return locale === "ja" ? "複製" : "Duplicate";
}

/** 削除ボタン */
export function deleteButtonLabel(locale: Locale): string {
  return locale === "ja" ? "削除" : "Delete";
}

// --- 削除確認 ---

/** 削除確認メッセージ */
export function deleteConfirmLabel(locale: Locale): string {
  return locale === "ja" ? "本当に削除しますか？" : "Are you sure you want to delete?";
}

/** 削除確認キャンセル */
export function cancelLabel(locale: Locale): string {
  return locale === "ja" ? "キャンセル" : "Cancel";
}

/** 削除確認の実行ボタン */
export function deleteConfirmActionLabel(locale: Locale): string {
  return locale === "ja" ? "削除する" : "Delete";
}

// --- 共有パネル ---

/** 共有パネルタイトル */
export function sharePanelTitleLabel(locale: Locale): string {
  return locale === "ja" ? "共有" : "Share";
}

/** JSONエクスポートボタン */
export function jsonExportLabel(locale: Locale): string {
  return locale === "ja" ? "JSONエクスポート" : "JSON Export";
}

/** URLコピーボタン */
export function urlCopyLabel(copied: boolean, locale: Locale): string {
  if (copied) return locale === "ja" ? "コピーしました!" : "Copied!";
  return locale === "ja" ? "URLをコピー" : "Copy URL";
}

/** 閉じるボタン */
export function closeLabel(locale: Locale): string {
  return locale === "ja" ? "閉じる" : "Close";
}

// --- フォームラベル ---

/** タイトルラベル */
export function titleFieldLabel(locale: Locale): string {
  return locale === "ja" ? "タイトル" : "Title";
}

/** 説明ラベル */
export function descriptionFieldLabel(locale: Locale): string {
  return locale === "ja" ? "説明" : "Description";
}

/** 難易度ラベル */
export function difficultyFieldLabel(locale: Locale): string {
  return locale === "ja" ? "難易度" : "Difficulty";
}

/** 体系ラベル */
export function systemFieldLabel(locale: Locale): string {
  return locale === "ja" ? "体系" : "System";
}

/** ゴール式ラベル */
export function goalFormulasFieldLabel(locale: Locale): string {
  return locale === "ja" ? "ゴール式" : "Goal Formulas";
}

/** ヒントラベル */
export function hintsFieldLabel(locale: Locale): string {
  return locale === "ja" ? "ヒント（1行に1つ、任意）" : "Hints (one per line, optional)";
}

/** 推定ステップ数ラベル */
export function estimatedStepsFieldLabel(locale: Locale): string {
  return locale === "ja" ? "推定ステップ数（任意）" : "Est. Steps (optional)";
}

/** 学習ポイントラベル */
export function learningPointFieldLabel(locale: Locale): string {
  return locale === "ja" ? "学習ポイント" : "Learning Point";
}

/** 推定ステップ数プレースホルダー */
export function stepsPlaceholder(locale: Locale): string {
  return locale === "ja" ? "未指定" : "N/A";
}

/** 保存ボタン */
export function saveButtonLabel(locale: Locale): string {
  return locale === "ja" ? "保存" : "Save";
}

/** 作成ボタン（フォーム送信） */
export function createSubmitLabel(locale: Locale): string {
  return locale === "ja" ? "作成" : "Create";
}

// --- インポートフォーム ---

/** JSONファイル選択ラベル */
export function importFileLabel(locale: Locale): string {
  return locale === "ja" ? "JSONファイルを選択" : "Select JSON file";
}

/** JSON貼り付けラベル */
export function importPasteLabel(locale: Locale): string {
  return locale === "ja" ? "またはJSONを貼り付け" : "Or paste JSON";
}

/** インポート送信ボタン */
export function importSubmitLabel(locale: Locale): string {
  return locale === "ja" ? "インポート" : "Import";
}

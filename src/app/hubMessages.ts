/**
 * ハブページのUI文字列定義（純粋ロジック）。
 *
 * HubPageView で表示されるすべてのユーザー向けメッセージのキーとデフォルト値を定義する。
 * i18n対応のため、純粋ロジック層はメッセージキーとデフォルト英語メッセージを提供し、
 * UI層（HubMessagesContext）がロケールに応じた翻訳を注入する。
 *
 * 変更時は hubMessages.test.ts, HubMessagesContext.tsx, messages/en.json, messages/ja.json,
 * HubPageView.tsx, HubContent.tsx (useHubMessagesFromIntl) も同期すること。
 * HubMessages に新しいキーを追加した場合、HubContent.tsx の useHubMessagesFromIntl が
 * コンパイルエラーになるので、そこも必ず更新する。
 */

/**
 * HubPageView のすべてのUI文字列。
 * キー名は英語で意味が明確な識別子。
 * 値は表示用テキスト（デフォルトは英語）。
 */
export type HubMessages = {
  readonly tabNotebooks: string;
  readonly tabQuests: string;
  readonly newNotebook: string;
  readonly emptyTitle: string;
  readonly emptyDescription: string;
  readonly questFilterCount: string;
  readonly questFilterClear: string;
  readonly questFilterEmpty: string;
};

/**
 * デフォルト英語メッセージ。
 * Storybook等、next-intl が利用不可な環境ではこのデフォルト値が使われる。
 */
export const defaultHubMessages: HubMessages = {
  tabNotebooks: "Notebooks",
  tabQuests: "Quests",
  newNotebook: "+ New Notebook",
  emptyTitle: "No notebooks yet",
  emptyDescription:
    "Create a new notebook to start building formal proofs, or try a quest to learn the basics.",
  questFilterCount: "Quest notebooks ({count})",
  questFilterClear: "Clear filter",
  questFilterEmpty: "No notebooks for this quest yet",
};

/** HubMessages の全キー一覧（網羅性チェック用） */
export const hubMessageKeys: readonly (keyof HubMessages)[] = [
  "tabNotebooks",
  "tabQuests",
  "newNotebook",
  "emptyTitle",
  "emptyDescription",
  "questFilterCount",
  "questFilterClear",
  "questFilterEmpty",
] as const;

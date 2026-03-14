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
  readonly tabCustomQuests: string;
  readonly tabCollection: string;
  readonly newNotebook: string;
  readonly importNotebook: string;
  readonly emptyTitle: string;
  readonly emptyDescription: string;
  readonly questFilterCount: string;
  readonly questFilterClear: string;
  readonly questFilterEmpty: string;
  readonly sharedQuestStart: string;
  readonly sharedQuestAddToCollection: string;
  readonly sharedQuestCancel: string;
  readonly sharedQuestMeta: string;
  readonly landingTitle: string;
  readonly landingSubtitle: string;
  readonly landingDescription: string;
  readonly landingStartFreeProof: string;
  readonly landingExploreQuests: string;
  readonly landingRecommendedQuests: string;
  // --- Reference ---
  readonly tabReference: string;
  readonly referenceSearchPlaceholder: string;
  readonly referenceEmpty: string;
  readonly referenceGuideTitle: string;
  readonly referenceGuideDescription: string;
  // --- Collection ---
  readonly collectionEmpty: string;
  readonly collectionEntryCount: string;
  readonly collectionDelete: string;
  readonly collectionMemoPlaceholder: string;
  readonly collectionCreateFolder: string;
  readonly collectionFolderNamePlaceholder: string;
  readonly collectionFolderDelete: string;
  readonly collectionFolderRename: string;
  readonly collectionMoveToFolder: string;
  readonly collectionMoveToRoot: string;
  readonly collectionRootEntries: string;
  readonly collectionFolderEntryCount: string;
};

/**
 * デフォルト英語メッセージ。
 * Storybook等、next-intl が利用不可な環境ではこのデフォルト値が使われる。
 */
export const defaultHubMessages: HubMessages = {
  tabNotebooks: "Notebooks",
  tabQuests: "Quests",
  tabCustomQuests: "Custom Quests",
  tabCollection: "Collection",
  newNotebook: "+ New Notebook",
  importNotebook: "Import",
  emptyTitle: "No notebooks yet",
  emptyDescription:
    "Create a new notebook to start building formal proofs, or try a quest to learn the basics.",
  questFilterCount: "Quest notebooks ({count})",
  questFilterClear: "Clear filter",
  questFilterEmpty: "No notebooks for this quest yet",
  sharedQuestStart: "Start Quest",
  sharedQuestAddToCollection: "Add to My Quests",
  sharedQuestCancel: "Cancel",
  sharedQuestMeta:
    "{systemPresetId} | {goalCount} goal(s) | est. {estimatedSteps} steps",
  landingTitle: "Formal Logic Pad",
  landingSubtitle: "Interactive Proof Assistant for Formal Logic",
  landingDescription:
    "Explore formal proof systems interactively. Build proofs in Hilbert-style, natural deduction, sequent calculus, and more.",
  landingStartFreeProof: "Start Free Proof",
  landingExploreQuests: "Explore Quests",
  landingRecommendedQuests: "Try a Quick Quest",
  // Reference
  tabReference: "Reference",
  referenceSearchPlaceholder: "Search reference…",
  referenceEmpty: "No matching entries found.",
  referenceGuideTitle: "Getting Started",
  referenceGuideDescription:
    "New to formal logic? Follow these guides in order.",
  // Collection
  collectionEmpty:
    "No saved proofs yet. Save proofs from your workspace to manage them here.",
  collectionEntryCount: "{count} proofs",
  collectionDelete: "Delete",
  collectionMemoPlaceholder: "Add a memo…",
  collectionCreateFolder: "+ New Folder",
  collectionFolderNamePlaceholder: "Folder name",
  collectionFolderDelete: "Delete Folder",
  collectionFolderRename: "Rename",
  collectionMoveToFolder: "Move to…",
  collectionMoveToRoot: "(Root)",
  collectionRootEntries: "Uncategorized",
  collectionFolderEntryCount: "{count}",
};

/** HubMessages の全キー一覧（網羅性チェック用） */
export const hubMessageKeys: readonly (keyof HubMessages)[] = [
  "tabNotebooks",
  "tabQuests",
  "tabCustomQuests",
  "tabCollection",
  "newNotebook",
  "importNotebook",
  "emptyTitle",
  "emptyDescription",
  "questFilterCount",
  "questFilterClear",
  "questFilterEmpty",
  "sharedQuestStart",
  "sharedQuestAddToCollection",
  "sharedQuestCancel",
  "sharedQuestMeta",
  "landingTitle",
  "landingSubtitle",
  "landingDescription",
  "landingStartFreeProof",
  "landingExploreQuests",
  "landingRecommendedQuests",
  "tabReference",
  "referenceSearchPlaceholder",
  "referenceEmpty",
  "referenceGuideTitle",
  "referenceGuideDescription",
  "collectionEmpty",
  "collectionEntryCount",
  "collectionDelete",
  "collectionMemoPlaceholder",
  "collectionCreateFolder",
  "collectionFolderNamePlaceholder",
  "collectionFolderDelete",
  "collectionFolderRename",
  "collectionMoveToFolder",
  "collectionMoveToRoot",
  "collectionRootEntries",
  "collectionFolderEntryCount",
] as const;

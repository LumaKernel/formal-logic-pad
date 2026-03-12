/**
 * ワークスペースページのUI文字列定義（純粋ロジック）。
 *
 * WorkspacePageView で表示されるページレベルのメッセージのキーとデフォルト値を定義する。
 * ProofMessages（証明パッド内部のメッセージ）とは分離されている。
 *
 * 変更時は WorkspaceContent.tsx, WorkspacePageView.tsx, WorkspacePageView.stories.tsx,
 * messages/en.json, messages/ja.json も同期すること。
 */

/**
 * WorkspacePageView のページレベルUI文字列。
 * 証明パッド内部のメッセージ（ProofMessages）とは別に管理。
 */
export type WorkspacePageMessages = {
  readonly back: string;
  readonly backToHub: string;
  readonly notebookNotFound: string;
  readonly duplicateToFree: string;
  readonly titleEditPlaceholder: string;
};

/**
 * デフォルト英語メッセージ。
 * Storybook等、next-intl が利用不可な環境ではこのデフォルト値が使われる。
 */
export const defaultWorkspacePageMessages: WorkspacePageMessages = {
  back: "Back",
  backToHub: "Back to Hub",
  notebookNotFound: "Notebook not found",
  duplicateToFree: "Duplicate as Free",
  titleEditPlaceholder: "Notebook name",
};

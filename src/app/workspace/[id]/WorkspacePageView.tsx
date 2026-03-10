/**
 * Workspace ページのプレゼンテーション層。
 *
 * ルーター・localStorage 等の不純な依存を持たず、
 * props で状態とコールバックを受け取る。
 * Storybook でモックデータを注入して各状態を表示・テスト可能。
 *
 * 変更時は WorkspaceContent.tsx, WorkspacePageView.stories.tsx も同期すること。
 */

import type { CSSProperties } from "react";
import { ProofWorkspace } from "../../../lib/proof-pad";
import type { GoalAchievedInfo } from "../../../lib/proof-pad";
import { ProofMessagesProvider } from "../../../lib/proof-pad";
import type { ProofMessages } from "../../../lib/proof-pad";
import type { WorkspaceState } from "../../../lib/proof-pad/workspaceState";
import type { GoalQuestInfo } from "../../../lib/proof-pad";
import type {
  ProofSaveParams,
  ProofEntry,
} from "../../../lib/proof-collection";
import type { ReferenceEntry } from "../../../lib/reference/referenceEntry";
import type { Locale } from "../../../lib/reference/referenceEntry";
import {
  ThemeToggle,
  type ThemeToggleLabels,
} from "../../../components/ThemeToggle/ThemeToggle";
import {
  LanguageToggle,
  type LanguageToggleProps,
} from "../../../components/LanguageToggle/LanguageToggle";
import type { WorkspacePageMessages } from "./workspacePageMessages";
import { defaultWorkspacePageMessages } from "./workspacePageMessages";

// --- Types ---

export type WorkspacePageViewProps = {
  /** 言語切り替え（指定時に LanguageToggle を表示） */
  readonly languageToggle?: LanguageToggleProps;
  /** ページレベルのi18nメッセージ */
  readonly pageMessages?: WorkspacePageMessages;
  /** テーマトグルのラベル */
  readonly themeLabels?: ThemeToggleLabels;
  /** テスト用ID（ProofWorkspaceに転送） */
  readonly workspaceTestId?: string;
} & (
  | {
      /** ノートブックが見つかった場合 */
      readonly found: true;
      /** ノートブック名 */
      readonly notebookName: string;
      /** ワークスペース状態 */
      readonly workspace: WorkspaceState;
      /** i18nメッセージ */
      readonly messages: ProofMessages;
      /** 戻るボタン押下 */
      readonly onBack: () => void;
      /** ワークスペース状態変更 */
      readonly onWorkspaceChange: (workspace: WorkspaceState) => void;
      /** ゴール達成時 */
      readonly onGoalAchieved: (info: GoalAchievedInfo) => void;
      /** 構文ヘルプを開くコールバック */
      readonly onOpenSyntaxHelp?: () => void;
      /** 自由帳として複製するコールバック */
      readonly onDuplicateToFree?: () => void;
      /** 証明をコレクションに保存するコールバック */
      readonly onSaveProofToCollection?: (params: ProofSaveParams) => void;
      /** コレクションエントリ一覧 */
      readonly collectionEntries?: readonly ProofEntry[];
      /** コレクションエントリ名変更 */
      readonly onRenameCollectionEntry?: (id: string, newName: string) => void;
      /** コレクションエントリメモ更新 */
      readonly onUpdateCollectionMemo?: (id: string, memo: string) => void;
      /** コレクションエントリ削除 */
      readonly onRemoveCollectionEntry?: (id: string) => void;
      /** コレクションフォルダ一覧 */
      readonly collectionFolders?: readonly import("../../../lib/proof-collection/proofCollectionState").ProofFolder[];
      /** コレクションエントリのフォルダ移動 */
      readonly onMoveCollectionEntry?: (
        id: string,
        folderId: string | undefined,
      ) => void;
      /** コレクションフォルダ作成 */
      readonly onCreateCollectionFolder?: (name: string) => void;
      /** コレクションフォルダ削除 */
      readonly onRemoveCollectionFolder?: (id: string) => void;
      /** コレクションフォルダ名変更 */
      readonly onRenameCollectionFolder?: (id: string, newName: string) => void;
      /** クエストバージョン警告メッセージ（表示不要なら undefined） */
      readonly questVersionWarning?: string;
      /** クエスト情報（ゴールパネルの詳細表示に使用） */
      readonly questInfo?: GoalQuestInfo;
      /** リファレンスエントリ一覧（公理・推論規則等の解説） */
      readonly referenceEntries?: readonly ReferenceEntry[];
      /** リファレンス詳細を開くコールバック */
      readonly onOpenReferenceDetail?: (entryId: string) => void;
      /** ロケール（リファレンス表示言語） */
      readonly locale?: Locale;
    }
  | {
      /** ノートブックが見つからない場合 */
      readonly found: false;
      /** 戻るボタン押下 */
      readonly onBack: () => void;
    }
);

// --- Styles ---

const pageStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  height: "100vh",
  background: "var(--color-bg-primary)",
  color: "var(--color-text-primary)",
  fontFamily: "var(--font-ui)",
};

const headerStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "8px 16px",
  borderBottom: "1px solid var(--color-border, #e0e0e0)",
  background: "var(--color-surface, #fff)",
  flexShrink: 0,
};

const backButtonStyle: CSSProperties = {
  padding: "6px 14px",
  fontSize: 13,
  fontWeight: 600,
  border: "1px solid var(--color-border, #e0e0e0)",
  borderRadius: 6,
  cursor: "pointer",
  background: "transparent",
  color: "var(--color-text-primary, #333)",
  transition: "background 0.15s",
};

const notebookNameStyle: CSSProperties = {
  fontSize: 16,
  fontWeight: 600,
  flex: 1,
  textAlign: "center",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  padding: "0 12px",
};

const headerActionsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const githubLinkStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 28,
  height: 28,
  borderRadius: 6,
  color: "var(--color-text-secondary, #666)",
  opacity: 0.6,
  transition: "opacity 0.15s",
};

const workspaceContainerStyle: CSSProperties = {
  flex: 1,
  position: "relative",
  overflow: "hidden",
};

const versionWarningStyle: CSSProperties = {
  padding: "6px 16px",
  fontSize: 13,
  fontWeight: 500,
  background: "var(--color-warning-bg, rgba(255,215,0,0.15))",
  color: "var(--color-warning, #b8860b)",
  borderBottom: "1px solid var(--color-warning-border, rgba(255,215,0,0.4))",
  textAlign: "center",
  flexShrink: 0,
};

const notFoundStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  height: "100vh",
  gap: 16,
  color: "var(--color-text-secondary, #666)",
};

// --- Component ---

export function WorkspacePageView(props: WorkspacePageViewProps) {
  const pm = props.pageMessages ?? defaultWorkspacePageMessages;

  if (!props.found) {
    return (
      <div style={notFoundStyle} data-testid="workspace-not-found">
        <div style={{ fontSize: 18, fontWeight: 600 }}>
          {pm.notebookNotFound}
        </div>
        <button type="button" style={backButtonStyle} onClick={props.onBack}>
          {pm.backToHub}
        </button>
      </div>
    );
  }

  return (
    <div style={pageStyle} data-testid="workspace-page">
      {/* Header */}
      <header style={headerStyle}>
        <button type="button" style={backButtonStyle} onClick={props.onBack}>
          {pm.back}
        </button>
        <span style={notebookNameStyle}>{props.notebookName}</span>
        <div style={headerActionsStyle}>
          {props.languageToggle ? (
            <LanguageToggle
              locale={props.languageToggle.locale}
              onLocaleChange={props.languageToggle.onLocaleChange}
            />
          ) : null}
          <ThemeToggle labels={props.themeLabels} />
          <a
            href="https://github.com/LumaKernel/formal-logic-pad"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            style={githubLinkStyle}
            data-testid="github-link"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12Z" />
            </svg>
          </a>
        </div>
      </header>

      {/* Quest version warning */}
      {props.questVersionWarning !== undefined ? (
        <div style={versionWarningStyle} data-testid="quest-version-warning">
          {props.questVersionWarning}
        </div>
      ) : null}

      {/* Workspace */}
      <div style={workspaceContainerStyle}>
        <ProofMessagesProvider messages={props.messages}>
          <ProofWorkspace
            system={props.workspace.system}
            workspace={props.workspace}
            onWorkspaceChange={props.onWorkspaceChange}
            onGoalAchieved={props.onGoalAchieved}
            onOpenSyntaxHelp={props.onOpenSyntaxHelp}
            testId={props.workspaceTestId}
            questInfo={props.questInfo}
            onDuplicateToFree={props.onDuplicateToFree}
            onSaveProofToCollection={props.onSaveProofToCollection}
            collectionEntries={props.collectionEntries}
            onRenameCollectionEntry={props.onRenameCollectionEntry}
            onUpdateCollectionMemo={props.onUpdateCollectionMemo}
            onRemoveCollectionEntry={props.onRemoveCollectionEntry}
            collectionFolders={props.collectionFolders}
            onMoveCollectionEntry={props.onMoveCollectionEntry}
            onCreateCollectionFolder={props.onCreateCollectionFolder}
            onRemoveCollectionFolder={props.onRemoveCollectionFolder}
            onRenameCollectionFolder={props.onRenameCollectionFolder}
            referenceEntries={props.referenceEntries}
            onOpenReferenceDetail={props.onOpenReferenceDetail}
            locale={props.locale}
          />
        </ProofMessagesProvider>
      </div>
    </div>
  );
}

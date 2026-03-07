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
import type {
  ProofSaveParams,
  ProofEntry,
} from "../../../lib/proof-collection";
import { ThemeToggle } from "../../../components/ThemeToggle/ThemeToggle";
import {
  LanguageToggle,
  type LanguageToggleProps,
} from "../../../components/LanguageToggle/LanguageToggle";

// --- Types ---

export type WorkspacePageViewProps = {
  /** 言語切り替え（指定時に LanguageToggle を表示） */
  readonly languageToggle?: LanguageToggleProps;
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
      /** クエストバージョン警告メッセージ（表示不要なら undefined） */
      readonly questVersionWarning?: string;
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
  if (!props.found) {
    return (
      <div style={notFoundStyle} data-testid="workspace-not-found">
        <div style={{ fontSize: 18, fontWeight: 600 }}>Notebook not found</div>
        <button type="button" style={backButtonStyle} onClick={props.onBack}>
          Back to Hub
        </button>
      </div>
    );
  }

  return (
    <div style={pageStyle} data-testid="workspace-page">
      {/* Header */}
      <header style={headerStyle}>
        <button type="button" style={backButtonStyle} onClick={props.onBack}>
          Back
        </button>
        <span style={notebookNameStyle}>{props.notebookName}</span>
        <div style={headerActionsStyle}>
          {props.languageToggle ? (
            <LanguageToggle
              locale={props.languageToggle.locale}
              onLocaleChange={props.languageToggle.onLocaleChange}
            />
          ) : null}
          <ThemeToggle />
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
            onDuplicateToFree={props.onDuplicateToFree}
            onSaveProofToCollection={props.onSaveProofToCollection}
            collectionEntries={props.collectionEntries}
            onRenameCollectionEntry={props.onRenameCollectionEntry}
            onUpdateCollectionMemo={props.onUpdateCollectionMemo}
            onRemoveCollectionEntry={props.onRemoveCollectionEntry}
          />
        </ProofMessagesProvider>
      </div>
    </div>
  );
}

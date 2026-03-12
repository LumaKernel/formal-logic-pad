/**
 * Workspace ページのプレゼンテーション層。
 *
 * ルーター・localStorage 等の不純な依存を持たず、
 * props で状態とコールバックを受け取る。
 * Storybook でモックデータを注入して各状態を表示・テスト可能。
 *
 * 変更時は WorkspaceContent.tsx, WorkspacePageView.stories.tsx も同期すること。
 */

import {
  useState,
  useCallback,
  useRef,
  useEffect,
  type CSSProperties,
} from "react";
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
import { validateNotebookName } from "../../../lib/notebook/notebookListLogic";
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
      /** ノートブック名変更コールバック */
      readonly onNotebookRename?: (newName: string) => void;
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
  cursor: "pointer",
  borderRadius: 4,
};

const notebookNameEditStyle: CSSProperties = {
  fontSize: 16,
  fontWeight: 600,
  flex: 1,
  textAlign: "center",
  padding: "2px 12px",
  border: "1px solid var(--color-primary, #4a90d9)",
  borderRadius: 4,
  outline: "none",
  background: "var(--color-bg-primary, #fff)",
  color: "var(--color-text-primary, #333)",
  fontFamily: "inherit",
};

const titleErrorStyle: CSSProperties = {
  position: "absolute",
  top: "100%",
  left: "50%",
  transform: "translateX(-50%)",
  fontSize: 11,
  color: "var(--color-error, #dc3545)",
  whiteSpace: "nowrap",
  marginTop: 2,
};

const titleContainerStyle: CSSProperties = {
  flex: 1,
  position: "relative",
  display: "flex",
  alignItems: "center",
  minWidth: 0,
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

const moreMenuButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 28,
  height: 28,
  borderRadius: 6,
  border: "none",
  background: "transparent",
  cursor: "pointer",
  color: "var(--color-text-secondary, #666)",
  fontSize: 18,
  lineHeight: 1,
  padding: 0,
};

const moreMenuDropdownStyle: CSSProperties = {
  position: "absolute",
  top: "100%",
  right: 0,
  marginTop: 4,
  background: "var(--color-surface, #fff)",
  border: "1px solid var(--color-border, #e0e0e0)",
  borderRadius: 6,
  boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
  zIndex: 100,
  minWidth: 180,
  padding: "4px 0",
};

const moreMenuItemStyle: CSSProperties = {
  display: "block",
  width: "100%",
  padding: "8px 16px",
  fontSize: 13,
  textAlign: "left",
  border: "none",
  background: "transparent",
  cursor: "pointer",
  color: "var(--color-text-primary, #333)",
  whiteSpace: "nowrap",
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

  return <WorkspacePageViewFound props={props} pm={pm} />;
}

function WorkspacePageViewFound({
  props,
  pm,
}: {
  readonly props: Extract<WorkspacePageViewProps, { readonly found: true }>;
  readonly pm: WorkspacePageMessages;
}) {
  const {
    notebookName,
    onNotebookRename,
    onDuplicateToFree,
    workspace,
    messages,
    onBack,
    onWorkspaceChange,
    onGoalAchieved,
    onOpenSyntaxHelp,
    onSaveProofToCollection,
    collectionEntries,
    onRenameCollectionEntry,
    onUpdateCollectionMemo,
    onRemoveCollectionEntry,
    collectionFolders,
    onMoveCollectionEntry,
    onCreateCollectionFolder,
    onRemoveCollectionFolder,
    onRenameCollectionFolder,
    questVersionWarning,
    questInfo,
    referenceEntries,
    onOpenReferenceDetail,
    locale,
    languageToggle,
    themeLabels,
    workspaceTestId,
  } = props;

  // --- Title editing state ---
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitleValue, setEditTitleValue] = useState("");
  const [titleError, setTitleError] = useState<string | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // --- More menu state ---
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  const handleTitleClick = useCallback(() => {
    if (onNotebookRename === undefined) return;
    setIsEditingTitle(true);
    setEditTitleValue(notebookName);
    setTitleError(null);
  }, [onNotebookRename, notebookName]);

  const handleTitleSubmit = useCallback(() => {
    const trimmed = editTitleValue.trim();
    const validation = validateNotebookName(trimmed);
    if (!validation.valid) {
      setTitleError(validation.reason);
      return;
    }
    if (trimmed !== notebookName) {
      onNotebookRename?.(trimmed);
    }
    setIsEditingTitle(false);
    setTitleError(null);
  }, [editTitleValue, notebookName, onNotebookRename]);

  const handleTitleCancel = useCallback(() => {
    setIsEditingTitle(false);
    setTitleError(null);
  }, []);

  const handleTitleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleTitleSubmit();
      }
      if (e.key === "Escape") {
        e.preventDefault();
        handleTitleCancel();
      }
    },
    [handleTitleSubmit, handleTitleCancel],
  );

  const handleTitleBlur = useCallback(() => {
    handleTitleSubmit();
  }, [handleTitleSubmit]);

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current !== null) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  // --- More menu handlers ---
  const handleMoreMenuToggle = useCallback(() => {
    setIsMoreMenuOpen((prev) => !prev);
  }, []);

  const handleDuplicateToFree = useCallback(() => {
    onDuplicateToFree?.();
    setIsMoreMenuOpen(false);
  }, [onDuplicateToFree]);

  // Close more menu on outside click
  useEffect(() => {
    if (!isMoreMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        moreMenuRef.current !== null &&
        !moreMenuRef.current.contains(e.target as Node)
      ) {
        setIsMoreMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMoreMenuOpen]);

  const hasMoreMenuItems = onDuplicateToFree !== undefined;

  return (
    <div style={pageStyle} data-testid="workspace-page">
      {/* Header */}
      <header style={headerStyle}>
        <button type="button" style={backButtonStyle} onClick={onBack}>
          {pm.back}
        </button>
        <div style={titleContainerStyle}>
          {isEditingTitle ? (
            <>
              <input
                ref={titleInputRef}
                type="text"
                value={editTitleValue}
                onChange={(e) => {
                  setEditTitleValue(e.target.value);
                  setTitleError(null);
                }}
                onKeyDown={handleTitleKeyDown}
                onBlur={handleTitleBlur}
                style={notebookNameEditStyle}
                placeholder={pm.titleEditPlaceholder}
                data-testid="notebook-title-input"
              />
              {titleError !== null ? (
                <span
                  style={titleErrorStyle}
                  data-testid="notebook-title-error"
                >
                  {titleError}
                </span>
              ) : null}
            </>
          ) : (
            <span
              style={notebookNameStyle}
              onClick={handleTitleClick}
              data-testid="notebook-title"
              role={onNotebookRename !== undefined ? "button" : undefined}
              tabIndex={onNotebookRename !== undefined ? 0 : undefined}
              onKeyDown={
                onNotebookRename !== undefined
                  ? (e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleTitleClick();
                      }
                    }
                  : undefined
              }
            >
              {notebookName}
            </span>
          )}
        </div>
        <div style={headerActionsStyle}>
          {hasMoreMenuItems ? (
            <div style={{ position: "relative" }} ref={moreMenuRef}>
              <button
                type="button"
                style={moreMenuButtonStyle}
                onClick={handleMoreMenuToggle}
                aria-label="More actions"
                data-testid="workspace-more-menu-button"
              >
                ⋮
              </button>
              {isMoreMenuOpen ? (
                <div
                  style={moreMenuDropdownStyle}
                  data-testid="workspace-more-menu-dropdown"
                >
                  {onDuplicateToFree !== undefined ? (
                    <button
                      type="button"
                      style={moreMenuItemStyle}
                      onClick={handleDuplicateToFree}
                      data-testid="workspace-more-menu-duplicate-free"
                    >
                      {pm.duplicateToFree}
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}
          {languageToggle !== undefined ? (
            <LanguageToggle
              locale={languageToggle.locale}
              onLocaleChange={languageToggle.onLocaleChange}
            />
          ) : null}
          <ThemeToggle labels={themeLabels} />
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
      {questVersionWarning !== undefined ? (
        <div style={versionWarningStyle} data-testid="quest-version-warning">
          {questVersionWarning}
        </div>
      ) : null}

      {/* Workspace */}
      <div style={workspaceContainerStyle}>
        <ProofMessagesProvider messages={messages}>
          <ProofWorkspace
            system={workspace.system}
            workspace={workspace}
            onWorkspaceChange={onWorkspaceChange}
            onGoalAchieved={onGoalAchieved}
            onOpenSyntaxHelp={onOpenSyntaxHelp}
            testId={workspaceTestId}
            questInfo={questInfo}
            onDuplicateToFree={onDuplicateToFree}
            onSaveProofToCollection={onSaveProofToCollection}
            collectionEntries={collectionEntries}
            onRenameCollectionEntry={onRenameCollectionEntry}
            onUpdateCollectionMemo={onUpdateCollectionMemo}
            onRemoveCollectionEntry={onRemoveCollectionEntry}
            collectionFolders={collectionFolders}
            onMoveCollectionEntry={onMoveCollectionEntry}
            onCreateCollectionFolder={onCreateCollectionFolder}
            onRemoveCollectionFolder={onRemoveCollectionFolder}
            onRenameCollectionFolder={onRenameCollectionFolder}
            referenceEntries={referenceEntries}
            onOpenReferenceDetail={onOpenReferenceDetail}
            locale={locale}
          />
        </ProofMessagesProvider>
      </div>
    </div>
  );
}

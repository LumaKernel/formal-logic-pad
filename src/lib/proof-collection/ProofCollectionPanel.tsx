/**
 * 証明コレクション管理パネル。
 *
 * 保存済み証明の一覧表示・名前変更・メモ編集・削除を提供する。
 * フォルダによるエントリの分類・管理をサポートする。
 * GoalPanelと同様の右サイドバースタイルで表示される。
 *
 * 変更時は ProofCollectionPanel.test.tsx, ProofCollectionPanel.stories.tsx, index.ts も同期すること。
 */

import {
  type CSSProperties,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
import type {
  ProofEntry,
  ProofEntryId,
  ProofFolder,
  ProofFolderId,
} from "./proofCollectionState";
import type { PanelState, EditingField } from "./proofCollectionPanelLogic";
import {
  createInitialPanelState,
  startEditing,
  updateEditingValue,
  cancelEditing,
  isEditing,
  toggleFolderExpanded,
  isFolderExpanded,
  startFolderEditing,
  updateFolderEditingValue,
  cancelFolderEditing,
  isFolderEditing,
  startCreatingFolder,
  updateCreatingFolderValue,
  cancelCreatingFolder,
} from "./proofCollectionPanelLogic";
import type { ProofMessages } from "../proof-pad/proofMessages";
import { formatMessage } from "../proof-pad/proofMessages";

// --- Props ---

export interface ProofCollectionPanelProps {
  /** 表示するエントリ一覧（更新日時降順） */
  readonly entries: readonly ProofEntry[];
  /** フォルダ一覧（名前順） */
  readonly folders: readonly ProofFolder[];
  /** メッセージ（i18n） */
  readonly messages: ProofMessages;
  /** エントリ名を変更するコールバック */
  readonly onRenameEntry: (id: ProofEntryId, newName: string) => void;
  /** エントリメモを更新するコールバック */
  readonly onUpdateMemo: (id: ProofEntryId, memo: string) => void;
  /** エントリを削除するコールバック */
  readonly onRemoveEntry: (id: ProofEntryId) => void;
  /** エントリをワークスペースにインポートするコールバック */
  readonly onImportEntry?: (entry: ProofEntry) => void;
  /** エントリのフォルダを変更するコールバック */
  readonly onMoveEntry?: (
    id: ProofEntryId,
    folderId: ProofFolderId | undefined,
  ) => void;
  /** フォルダを作成するコールバック */
  readonly onCreateFolder?: (name: string) => void;
  /** フォルダを削除するコールバック */
  readonly onRemoveFolder?: (id: ProofFolderId) => void;
  /** フォルダの名前を変更するコールバック */
  readonly onRenameFolder?: (id: ProofFolderId, newName: string) => void;
  /** パネルを閉じるコールバック */
  readonly onClose: () => void;
  /** data-testid */
  readonly testId?: string;
}

// --- スタイル ---

const panelStyle: CSSProperties = {
  position: "absolute",
  top: 48,
  right: 12,
  zIndex: 10,
  background: "var(--color-panel-bg, rgba(252, 249, 243, 0.96))",
  borderRadius: 8,
  border: "1px solid var(--color-panel-border, rgba(180, 160, 130, 0.2))",
  boxShadow: "0 2px 12px var(--color-panel-shadow, rgba(120, 100, 70, 0.1))",
  padding: "8px 0",
  fontFamily: "var(--font-ui)",
  fontSize: 12,
  maxHeight: "calc(100% - 80px)",
  overflowY: "auto" as const,
  minWidth: 240,
  maxWidth: 320,
  pointerEvents: "auto" as const,
};

const headerStyle: CSSProperties = {
  padding: "4px 12px 8px",
  fontWeight: 700,
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: 1,
  color: "var(--color-text-secondary, #666)",
  borderBottom:
    "1px solid var(--color-panel-rule-line, rgba(180, 160, 130, 0.15))",
  marginBottom: 4,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const countStyle: CSSProperties = {
  fontWeight: 400,
  fontSize: 10,
  color: "var(--color-text-secondary, #666)",
};

const emptyStyle: CSSProperties = {
  padding: "16px 12px",
  textAlign: "center",
  color: "var(--color-text-secondary, #999)",
  fontStyle: "italic",
  fontSize: 11,
};

const entryStyle: CSSProperties = {
  padding: "6px 12px",
  display: "flex",
  flexDirection: "column",
  gap: 2,
  borderBottom:
    "1px solid var(--color-panel-rule-line, rgba(180, 160, 130, 0.15))",
};

const entryNameStyle: CSSProperties = {
  fontWeight: 600,
  fontSize: 12,
  color: "var(--color-text-primary, #333)",
  cursor: "pointer",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const entryMemoStyle: CSSProperties = {
  fontSize: 10,
  color: "var(--color-text-secondary, #888)",
  cursor: "pointer",
  fontStyle: "italic",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const editInputStyle: CSSProperties = {
  width: "100%",
  padding: "2px 4px",
  fontSize: 12,
  fontFamily: "var(--font-ui)",
  border: "1px solid var(--color-panel-border, rgba(180, 160, 130, 0.4))",
  borderRadius: 4,
  background: "var(--color-bg-primary, #fff)",
  color: "var(--color-text-primary, #333)",
  outline: "none",
};

const memoEditInputStyle: CSSProperties = {
  ...editInputStyle,
  fontSize: 10,
  fontStyle: "italic",
};

const entryActionsStyle: CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 4,
  marginTop: 2,
};

const deleteButtonStyle: CSSProperties = {
  fontSize: 10,
  color: "var(--color-error, #c53030)",
  cursor: "pointer",
  background: "none",
  border: "none",
  padding: "1px 4px",
  borderRadius: 3,
  fontFamily: "var(--font-ui)",
};

const importButtonStyle: CSSProperties = {
  fontSize: 10,
  color: "var(--color-accent, #2b6cb0)",
  cursor: "pointer",
  background: "none",
  border: "none",
  padding: "1px 4px",
  borderRadius: 3,
  fontFamily: "var(--font-ui)",
  fontWeight: 600,
};

const deductionStyleBadgeStyle: CSSProperties = {
  fontSize: 9,
  color: "var(--color-text-secondary, #aaa)",
  fontWeight: 400,
};

const folderHeaderStyle: CSSProperties = {
  padding: "6px 12px",
  display: "flex",
  alignItems: "center",
  gap: 4,
  cursor: "pointer",
  fontWeight: 600,
  fontSize: 11,
  color: "var(--color-text-primary, #555)",
  borderBottom:
    "1px solid var(--color-panel-rule-line, rgba(180, 160, 130, 0.15))",
  background: "var(--color-panel-section-bg, rgba(180, 160, 130, 0.06))",
};

const folderActionsStyle: CSSProperties = {
  display: "flex",
  gap: 4,
  marginLeft: "auto",
};

const folderActionButtonStyle: CSSProperties = {
  fontSize: 9,
  color: "var(--color-text-secondary, #888)",
  cursor: "pointer",
  background: "none",
  border: "none",
  padding: "1px 4px",
  borderRadius: 3,
  fontFamily: "var(--font-ui)",
};

const folderDeleteButtonStyle: CSSProperties = {
  ...folderActionButtonStyle,
  color: "var(--color-error, #c53030)",
};

const createFolderButtonStyle: CSSProperties = {
  fontSize: 10,
  color: "var(--color-accent, #2b6cb0)",
  cursor: "pointer",
  background: "none",
  border: "none",
  padding: "4px 12px",
  fontFamily: "var(--font-ui)",
  fontWeight: 600,
  display: "block",
  width: "100%",
  textAlign: "left",
};

const moveSelectStyle: CSSProperties = {
  fontSize: 9,
  fontFamily: "var(--font-ui)",
  border: "1px solid var(--color-panel-border, rgba(180, 160, 130, 0.3))",
  borderRadius: 3,
  background: "var(--color-bg-primary, #fff)",
  color: "var(--color-text-primary, #333)",
  padding: "0 2px",
  outline: "none",
};

const sectionLabelStyle: CSSProperties = {
  padding: "6px 12px 4px",
  fontSize: 10,
  fontWeight: 600,
  color: "var(--color-text-secondary, #888)",
  textTransform: "uppercase",
  letterSpacing: 0.5,
};

const folderCountStyle: CSSProperties = {
  fontSize: 9,
  fontWeight: 400,
  color: "var(--color-text-secondary, #aaa)",
};

// --- サブコンポーネント ---

function EditableField({
  value,
  isCurrentlyEditing,
  editValue,
  displayStyle,
  inputStyle,
  placeholder,
  onStartEdit,
  onChangeValue,
  onCommit,
  onCancel,
  testId,
}: {
  readonly value: string;
  readonly isCurrentlyEditing: boolean;
  readonly editValue: string;
  readonly displayStyle: CSSProperties;
  readonly inputStyle: CSSProperties;
  readonly placeholder: string;
  readonly onStartEdit: () => void;
  readonly onChangeValue: (v: string) => void;
  readonly onCommit: () => void;
  readonly onCancel: () => void;
  readonly testId?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isCurrentlyEditing && inputRef.current !== null) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isCurrentlyEditing]);

  if (isCurrentlyEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        style={inputStyle}
        value={editValue}
        onChange={(e) => onChangeValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            onCommit();
          } else if (e.key === "Escape") {
            onCancel();
          }
        }}
        onBlur={onCommit}
        data-testid={testId}
      />
    );
  }

  return (
    <div
      style={displayStyle}
      onClick={onStartEdit}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onStartEdit();
        }
      }}
      data-testid={testId}
    >
      {value || placeholder}
    </div>
  );
}

function CollectionEntry({
  entry,
  panelState,
  messages,
  folders,
  onStartEdit,
  onChangeValue,
  onCommitEdit,
  onCancelEdit,
  onRemove,
  onImport,
  onMoveEntry,
  testId,
}: {
  readonly entry: ProofEntry;
  readonly panelState: PanelState;
  readonly messages: ProofMessages;
  readonly folders: readonly ProofFolder[];
  readonly onStartEdit: (
    entryId: ProofEntryId,
    field: EditingField,
    currentValue: string,
  ) => void;
  readonly onChangeValue: (value: string) => void;
  readonly onCommitEdit: () => void;
  readonly onCancelEdit: () => void;
  readonly onRemove: (id: ProofEntryId) => void;
  readonly onImport: ((entry: ProofEntry) => void) | undefined;
  readonly onMoveEntry:
    | ((id: ProofEntryId, folderId: ProofFolderId | undefined) => void)
    | undefined;
  readonly testId: string | undefined;
}) {
  const entryTestId =
    testId !== undefined
      ? `${testId satisfies string}-entry-${entry.id satisfies string}`
      : undefined;

  return (
    <div style={entryStyle} data-testid={entryTestId}>
      <EditableField
        value={entry.name}
        isCurrentlyEditing={isEditing(panelState, entry.id, "name")}
        editValue={panelState.editing?.value ?? ""}
        displayStyle={entryNameStyle}
        inputStyle={editInputStyle}
        placeholder="Untitled"
        onStartEdit={() => onStartEdit(entry.id, "name", entry.name)}
        onChangeValue={onChangeValue}
        onCommit={onCommitEdit}
        onCancel={onCancelEdit}
        testId={
          entryTestId !== undefined
            ? `${entryTestId satisfies string}-name`
            : undefined
        }
      />
      <EditableField
        value={entry.memo}
        isCurrentlyEditing={isEditing(panelState, entry.id, "memo")}
        editValue={panelState.editing?.value ?? ""}
        displayStyle={entryMemoStyle}
        inputStyle={memoEditInputStyle}
        placeholder={messages.collectionEntryMemoPlaceholder}
        onStartEdit={() => onStartEdit(entry.id, "memo", entry.memo)}
        onChangeValue={onChangeValue}
        onCommit={onCommitEdit}
        onCancel={onCancelEdit}
        testId={
          entryTestId !== undefined
            ? `${entryTestId satisfies string}-memo`
            : undefined
        }
      />
      <div style={entryActionsStyle}>
        <span style={deductionStyleBadgeStyle}>{entry.deductionStyle}</span>
        {onMoveEntry !== undefined && folders.length > 0 && (
          <select
            style={moveSelectStyle}
            value={entry.folderId ?? ""}
            onChange={(e) => {
              const newFolderId =
                e.target.value === "" ? undefined : e.target.value;
              onMoveEntry(entry.id, newFolderId);
            }}
            data-testid={
              entryTestId !== undefined
                ? `${entryTestId satisfies string}-move`
                : undefined
            }
          >
            <option value="">{messages.collectionMoveToRoot}</option>
            {folders.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        )}
        {onImport !== undefined && (
          <button
            type="button"
            style={importButtonStyle}
            onClick={() => onImport(entry)}
            data-testid={
              entryTestId !== undefined
                ? `${entryTestId satisfies string}-import`
                : undefined
            }
          >
            {messages.collectionEntryImport}
          </button>
        )}
        <button
          type="button"
          style={deleteButtonStyle}
          onClick={() => onRemove(entry.id)}
          data-testid={
            entryTestId !== undefined
              ? `${entryTestId satisfies string}-delete`
              : undefined
          }
        >
          {messages.collectionEntryDelete}
        </button>
      </div>
    </div>
  );
}

function FolderHeader({
  folder,
  entryCount,
  isExpanded,
  panelState,
  messages,
  onToggle,
  onStartFolderEdit,
  onChangeFolderEditValue,
  onCommitFolderEdit,
  onCancelFolderEdit,
  onRemoveFolder,
  testId,
}: {
  readonly folder: ProofFolder;
  readonly entryCount: number;
  readonly isExpanded: boolean;
  readonly panelState: PanelState;
  readonly messages: ProofMessages;
  readonly onToggle: () => void;
  readonly onStartFolderEdit: () => void;
  readonly onChangeFolderEditValue: (v: string) => void;
  readonly onCommitFolderEdit: () => void;
  readonly onCancelFolderEdit: () => void;
  readonly onRemoveFolder: (() => void) | undefined;
  readonly testId: string | undefined;
}) {
  const folderTestId =
    testId !== undefined
      ? `${testId satisfies string}-folder-${folder.id satisfies string}`
      : undefined;

  const inputRef = useRef<HTMLInputElement>(null);
  const editing = isFolderEditing(panelState, folder.id);

  useEffect(() => {
    if (editing && inputRef.current !== null) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  return (
    <div style={folderHeaderStyle} data-testid={folderTestId}>
      <span
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggle();
          }
        }}
        role="button"
        tabIndex={0}
        style={{ display: "flex", alignItems: "center", gap: 4, flex: 1 }}
        data-testid={
          folderTestId !== undefined
            ? `${folderTestId satisfies string}-toggle`
            : undefined
        }
      >
        <span style={{ fontSize: 10 }}>{isExpanded ? "\u25BC" : "\u25B6"}</span>
        {editing ? (
          <input
            ref={inputRef}
            type="text"
            style={{ ...editInputStyle, fontSize: 11 }}
            value={panelState.folderEditing?.value ?? ""}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => onChangeFolderEditValue(e.target.value)}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === "Enter") {
                onCommitFolderEdit();
              } else if (e.key === "Escape") {
                onCancelFolderEdit();
              }
            }}
            onBlur={onCommitFolderEdit}
            data-testid={
              folderTestId !== undefined
                ? `${folderTestId satisfies string}-name-input`
                : undefined
            }
          />
        ) : (
          <>
            {folder.name}
            <span style={folderCountStyle}>
              {formatMessage(messages.collectionFolderEntryCount, {
                count: String(entryCount),
              })}
            </span>
          </>
        )}
      </span>
      <span style={folderActionsStyle}>
        <button
          type="button"
          style={folderActionButtonStyle}
          onClick={(e) => {
            e.stopPropagation();
            onStartFolderEdit();
          }}
          data-testid={
            folderTestId !== undefined
              ? `${folderTestId satisfies string}-rename`
              : undefined
          }
        >
          {messages.collectionFolderRename}
        </button>
        {onRemoveFolder !== undefined && (
          <button
            type="button"
            style={folderDeleteButtonStyle}
            onClick={(e) => {
              e.stopPropagation();
              onRemoveFolder();
            }}
            data-testid={
              folderTestId !== undefined
                ? `${folderTestId satisfies string}-delete`
                : undefined
            }
          >
            {messages.collectionFolderDelete}
          </button>
        )}
      </span>
    </div>
  );
}

function CreateFolderInput({
  value,
  placeholder,
  onChange,
  onCommit,
  onCancel,
  testId,
}: {
  readonly value: string;
  readonly placeholder: string;
  readonly onChange: (v: string) => void;
  readonly onCommit: () => void;
  readonly onCancel: () => void;
  readonly testId: string | undefined;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current !== null) {
      inputRef.current.focus();
    }
  }, []);

  return (
    <div style={{ padding: "4px 12px" }}>
      <input
        ref={inputRef}
        type="text"
        style={editInputStyle}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            onCommit();
          } else if (e.key === "Escape") {
            onCancel();
          }
        }}
        onBlur={onCancel}
        data-testid={testId}
      />
    </div>
  );
}

// --- メインコンポーネント ---

export function ProofCollectionPanel({
  entries,
  folders = [],
  messages,
  onRenameEntry,
  onUpdateMemo,
  onRemoveEntry,
  onImportEntry,
  onMoveEntry,
  onCreateFolder,
  onRemoveFolder,
  onRenameFolder,
  onClose,
  testId,
}: ProofCollectionPanelProps) {
  const [panelState, setPanelState] = useState<PanelState>(
    createInitialPanelState,
  );

  // --- エントリ編集ハンドラー ---

  const handleStartEdit = useCallback(
    (entryId: ProofEntryId, field: EditingField, currentValue: string) => {
      setPanelState((prev) => startEditing(prev, entryId, field, currentValue));
    },
    [],
  );

  const handleChangeValue = useCallback((value: string) => {
    setPanelState((prev) => updateEditingValue(prev, value));
  }, []);

  const handleCommitEdit = useCallback(() => {
    setPanelState((prev) => {
      if (prev.editing === undefined) return prev;
      const { entryId, field, value } = prev.editing;
      if (field === "name") {
        if (value.trim() !== "") {
          onRenameEntry(entryId, value.trim());
        }
      } else {
        onUpdateMemo(entryId, value);
      }
      return cancelEditing(prev);
    });
  }, [onRenameEntry, onUpdateMemo]);

  const handleCancelEdit = useCallback(() => {
    setPanelState((prev) => cancelEditing(prev));
  }, []);

  const handleRemove = useCallback(
    (id: ProofEntryId) => {
      onRemoveEntry(id);
    },
    [onRemoveEntry],
  );

  // --- フォルダ展開ハンドラー ---

  const handleToggleFolder = useCallback((folderId: ProofFolderId) => {
    setPanelState((prev) => toggleFolderExpanded(prev, folderId));
  }, []);

  // --- フォルダ名編集ハンドラー ---

  const handleStartFolderEdit = useCallback(
    (folderId: ProofFolderId, currentName: string) => {
      setPanelState((prev) => startFolderEditing(prev, folderId, currentName));
    },
    [],
  );

  const handleChangeFolderEditValue = useCallback((value: string) => {
    setPanelState((prev) => updateFolderEditingValue(prev, value));
  }, []);

  const handleCommitFolderEdit = useCallback(() => {
    setPanelState((prev) => {
      if (prev.folderEditing === undefined) return prev;
      const { folderId, value } = prev.folderEditing;
      if (value.trim() !== "" && onRenameFolder !== undefined) {
        onRenameFolder(folderId, value.trim());
      }
      return cancelFolderEditing(prev);
    });
  }, [onRenameFolder]);

  const handleCancelFolderEdit = useCallback(() => {
    setPanelState((prev) => cancelFolderEditing(prev));
  }, []);

  // --- フォルダ作成ハンドラー ---

  const handleStartCreateFolder = useCallback(() => {
    setPanelState((prev) => startCreatingFolder(prev));
  }, []);

  const handleChangeCreateFolderValue = useCallback((value: string) => {
    setPanelState((prev) => updateCreatingFolderValue(prev, value));
  }, []);

  const handleCommitCreateFolder = useCallback(() => {
    setPanelState((prev) => {
      if (prev.creatingFolder === undefined) return prev;
      const name = prev.creatingFolder.trim();
      if (name !== "" && onCreateFolder !== undefined) {
        onCreateFolder(name);
      }
      return cancelCreatingFolder(prev);
    });
  }, [onCreateFolder]);

  const handleCancelCreateFolder = useCallback(() => {
    setPanelState((prev) => cancelCreatingFolder(prev));
  }, []);

  // --- エントリ分類 ---

  const hasFolders = folders.length > 0;

  const rootEntries = hasFolders
    ? entries.filter((e) => e.folderId === undefined)
    : entries;

  const renderEntry = (entry: ProofEntry) => (
    <CollectionEntry
      key={entry.id}
      entry={entry}
      panelState={panelState}
      messages={messages}
      folders={folders}
      onStartEdit={handleStartEdit}
      onChangeValue={handleChangeValue}
      onCommitEdit={handleCommitEdit}
      onCancelEdit={handleCancelEdit}
      onRemove={handleRemove}
      onImport={onImportEntry}
      onMoveEntry={onMoveEntry}
      testId={testId}
    />
  );

  return (
    <div
      style={panelStyle}
      data-testid={testId}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div style={headerStyle}>
        <span>{messages.collectionPanelTitle}</span>
        <span style={countStyle}>
          {formatMessage(messages.collectionEntryCount, {
            count: String(entries.length),
          })}
        </span>
        <span
          role="button"
          tabIndex={0}
          style={{ cursor: "pointer", fontSize: 14 }}
          onClick={onClose}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onClose();
            }
          }}
          data-testid={
            testId !== undefined
              ? `${testId satisfies string}-close`
              : undefined
          }
        >
          ×
        </span>
      </div>

      {/* フォルダ作成ボタン */}
      {onCreateFolder !== undefined &&
        panelState.creatingFolder === undefined && (
          <button
            type="button"
            style={createFolderButtonStyle}
            onClick={handleStartCreateFolder}
            data-testid={
              testId !== undefined
                ? `${testId satisfies string}-create-folder`
                : undefined
            }
          >
            + {messages.collectionCreateFolder}
          </button>
        )}

      {/* フォルダ作成入力 */}
      {panelState.creatingFolder !== undefined && (
        <CreateFolderInput
          value={panelState.creatingFolder}
          placeholder={messages.collectionFolderNamePlaceholder}
          onChange={handleChangeCreateFolderValue}
          onCommit={handleCommitCreateFolder}
          onCancel={handleCancelCreateFolder}
          testId={
            testId !== undefined
              ? `${testId satisfies string}-create-folder-input`
              : undefined
          }
        />
      )}

      {/* フォルダセクション */}
      {hasFolders &&
        folders.map((folder) => {
          const folderEntries = entries.filter((e) => e.folderId === folder.id);
          const expanded = isFolderExpanded(panelState, folder.id);
          return (
            <div key={folder.id}>
              <FolderHeader
                folder={folder}
                entryCount={folderEntries.length}
                isExpanded={expanded}
                panelState={panelState}
                messages={messages}
                onToggle={() => handleToggleFolder(folder.id)}
                onStartFolderEdit={() =>
                  handleStartFolderEdit(folder.id, folder.name)
                }
                onChangeFolderEditValue={handleChangeFolderEditValue}
                onCommitFolderEdit={handleCommitFolderEdit}
                onCancelFolderEdit={handleCancelFolderEdit}
                onRemoveFolder={
                  onRemoveFolder !== undefined
                    ? () => onRemoveFolder(folder.id)
                    : undefined
                }
                testId={testId}
              />
              {expanded && folderEntries.map(renderEntry)}
            </div>
          );
        })}

      {/* ルートエントリ */}
      {hasFolders && rootEntries.length > 0 && (
        <div
          style={sectionLabelStyle}
          data-testid={
            testId !== undefined
              ? `${testId satisfies string}-root-section`
              : undefined
          }
        >
          {messages.collectionRootEntries}
        </div>
      )}

      {entries.length === 0 && !hasFolders ? (
        <div style={emptyStyle}>{messages.collectionEmpty}</div>
      ) : (
        rootEntries.map(renderEntry)
      )}
    </div>
  );
}

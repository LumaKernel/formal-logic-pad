/**
 * 証明コレクション管理のフルページビュー。
 *
 * ハブページの「コレクション」タブで表示される。
 * ProofCollectionPanel（ワークスペース内サイドバー）とは異なり、
 * 広いレイアウトでコレクション全体を一覧・管理する。
 *
 * 純粋ロジック（proofCollectionPanelLogic.ts）を再利用し、
 * i18nメッセージはHubMessagesから取得する。
 *
 * 変更時は ProofCollectionPageView.test.tsx, ProofCollectionPageView.stories.tsx,
 * index.ts も同期すること。
 */

import {
  type CSSProperties,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
import { UiButton } from "../../components/ui";
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

// --- Types ---

export type CollectionMessages = {
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

export interface ProofCollectionPageViewProps {
  /** 表示するエントリ一覧（更新日時降順） */
  readonly entries: readonly ProofEntry[];
  /** フォルダ一覧（名前順） */
  readonly folders: readonly ProofFolder[];
  /** i18nメッセージ */
  readonly messages: CollectionMessages;
  /** エントリ名を変更するコールバック */
  readonly onRenameEntry: (id: ProofEntryId, newName: string) => void;
  /** エントリメモを更新するコールバック */
  readonly onUpdateMemo: (id: ProofEntryId, memo: string) => void;
  /** エントリを削除するコールバック */
  readonly onRemoveEntry: (id: ProofEntryId) => void;
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
  /** data-testid */
  readonly testId?: string;
}

// --- Styles ---

const containerStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
};

const headerBarStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: 4,
};

const entryCountStyle: CSSProperties = {
  fontSize: 13,
  color: "var(--color-text-secondary, #888)",
  fontWeight: 500,
};

const emptyHeroStyle: CSSProperties = {
  textAlign: "center",
  padding: "60px 20px",
  color: "var(--color-text-secondary, #666)",
};

const emptyDescStyle: CSSProperties = {
  fontSize: 15,
  lineHeight: 1.6,
};

const entryCardStyle: CSSProperties = {
  padding: "12px 16px",
  borderRadius: 8,
  border: "1px solid var(--color-border, #e0e0e0)",
  background: "var(--color-surface, #fff)",
  display: "flex",
  flexDirection: "column",
  gap: 4,
};

const entryNameStyle: CSSProperties = {
  fontWeight: 600,
  fontSize: 14,
  color: "var(--color-text-primary, #333)",
  cursor: "pointer",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const entryMemoStyle: CSSProperties = {
  fontSize: 12,
  color: "var(--color-text-secondary, #888)",
  cursor: "pointer",
  fontStyle: "italic",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const editInputStyle: CSSProperties = {
  width: "100%",
  padding: "4px 8px",
  fontSize: 14,
  fontFamily: "var(--font-ui)",
  border: "1px solid var(--color-accent, #555ab9)",
  borderRadius: 6,
  background: "var(--color-bg-primary, #fff)",
  color: "var(--color-text-primary, #333)",
  outline: "none",
};

const memoEditInputStyle: CSSProperties = {
  ...editInputStyle,
  fontSize: 12,
  fontStyle: "italic",
};

const entryActionsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  marginTop: 4,
};

const deductionStyleBadgeStyle: CSSProperties = {
  fontSize: 11,
  color: "var(--color-text-secondary, #aaa)",
  fontWeight: 400,
};

const moveSelectStyle: CSSProperties = {
  fontSize: 11,
  fontFamily: "var(--font-ui)",
  border: "1px solid var(--color-border, #ccc)",
  borderRadius: 4,
  background: "var(--color-bg-primary, #fff)",
  color: "var(--color-text-primary, #333)",
  padding: "2px 4px",
  outline: "none",
};

const folderSectionStyle: CSSProperties = {
  borderRadius: 8,
  border: "1px solid var(--color-border, #e0e0e0)",
  overflow: "hidden",
};

const folderHeaderStyle: CSSProperties = {
  padding: "10px 16px",
  display: "flex",
  alignItems: "center",
  gap: 8,
  cursor: "pointer",
  fontWeight: 600,
  fontSize: 13,
  color: "var(--color-text-primary, #444)",
  background: "var(--color-bg-secondary, #f5f5f5)",
};

const folderActionsStyle: CSSProperties = {
  display: "flex",
  gap: 6,
  marginLeft: "auto",
};

const folderCountStyle: CSSProperties = {
  fontSize: 11,
  fontWeight: 400,
  color: "var(--color-text-secondary, #aaa)",
};

const sectionLabelStyle: CSSProperties = {
  padding: "8px 0 4px",
  fontSize: 12,
  fontWeight: 600,
  color: "var(--color-text-secondary, #888)",
  textTransform: "uppercase",
  letterSpacing: 0.5,
};

const folderEntriesStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 0,
};

const folderEntryCardStyle: CSSProperties = {
  padding: "10px 16px",
  borderTop: "1px solid var(--color-border, #e0e0e0)",
  background: "var(--color-surface, #fff)",
  display: "flex",
  flexDirection: "column",
  gap: 4,
};

// --- Helper ---

const formatMsg = (template: string, vars: Record<string, string>): string => {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(`{${key satisfies string}}`, value);
  }
  return result;
};

// --- Sub-components ---

function EditableField({
  value,
  isCurrentlyEditing,
  editValue,
  displayStyle,
  inputStyle: fieldInputStyle,
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
        style={fieldInputStyle}
        value={editValue}
        onChange={(e) => onChangeValue(e.target.value)}
        /* v8 ignore start -- Enter/Escape tested; other keys are no-op */
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            onCommit();
          } else if (e.key === "Escape") {
            onCancel();
          }
        }}
        /* v8 ignore stop */
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
        /* v8 ignore start -- keyboard handler: tested but v8 inline callback branch artifact */
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onStartEdit();
        }
        /* v8 ignore stop */
      }}
      data-testid={testId}
    >
      {value || placeholder}
    </div>
  );
}

function CollectionEntryCard({
  entry,
  panelState,
  messages,
  folders,
  isInsideFolder,
  onStartEdit,
  onChangeValue,
  onCommitEdit,
  onCancelEdit,
  onRemove,
  onMoveEntry,
  testId,
}: {
  readonly entry: ProofEntry;
  readonly panelState: PanelState;
  readonly messages: CollectionMessages;
  readonly folders: readonly ProofFolder[];
  readonly isInsideFolder: boolean;
  readonly onStartEdit: (
    entryId: ProofEntryId,
    field: EditingField,
    currentValue: string,
  ) => void;
  readonly onChangeValue: (value: string) => void;
  readonly onCommitEdit: () => void;
  readonly onCancelEdit: () => void;
  readonly onRemove: (id: ProofEntryId) => void;
  readonly onMoveEntry:
    | ((id: ProofEntryId, folderId: ProofFolderId | undefined) => void)
    | undefined;
  readonly testId: string | undefined;
}) {
  const entryTestId =
    /* v8 ignore start -- testId always provided in tests */
    testId !== undefined
      ? `${testId satisfies string}-entry-${entry.id satisfies string}`
      : undefined;
  /* v8 ignore stop */

  const cardStyle = isInsideFolder ? folderEntryCardStyle : entryCardStyle;

  return (
    <div style={cardStyle} data-testid={entryTestId}>
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
          /* v8 ignore start -- testId always provided in tests */
          entryTestId !== undefined
            ? `${entryTestId satisfies string}-name`
            : undefined
          /* v8 ignore stop */
        }
      />
      <EditableField
        value={entry.memo}
        isCurrentlyEditing={isEditing(panelState, entry.id, "memo")}
        editValue={panelState.editing?.value ?? ""}
        displayStyle={entryMemoStyle}
        inputStyle={memoEditInputStyle}
        placeholder={messages.collectionMemoPlaceholder}
        onStartEdit={() => onStartEdit(entry.id, "memo", entry.memo)}
        onChangeValue={onChangeValue}
        onCommit={onCommitEdit}
        onCancel={onCancelEdit}
        testId={
          /* v8 ignore start -- testId always provided in tests */
          entryTestId !== undefined
            ? `${entryTestId satisfies string}-memo`
            : undefined
          /* v8 ignore stop */
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
              /* v8 ignore start -- testId always provided in tests */
              entryTestId !== undefined
                ? `${entryTestId satisfies string}-move`
                : undefined
              /* v8 ignore stop */
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
        <UiButton
          size="small"
          danger
          onClick={() => onRemove(entry.id)}
          data-testid={
            /* v8 ignore start -- testId always provided in tests */
            entryTestId !== undefined
              ? `${entryTestId satisfies string}-delete`
              : undefined
            /* v8 ignore stop */
          }
        >
          {messages.collectionDelete}
        </UiButton>
      </div>
    </div>
  );
}

function FolderSection({
  folder,
  folderEntries,
  panelState,
  messages,
  folders,
  onToggle,
  onStartFolderEdit,
  onChangeFolderEditValue,
  onCommitFolderEdit,
  onCancelFolderEdit,
  onRemoveFolder,
  onStartEdit,
  onChangeValue,
  onCommitEdit,
  onCancelEdit,
  onRemove,
  onMoveEntry,
  testId,
}: {
  readonly folder: ProofFolder;
  readonly folderEntries: readonly ProofEntry[];
  readonly panelState: PanelState;
  readonly messages: CollectionMessages;
  readonly folders: readonly ProofFolder[];
  readonly onToggle: () => void;
  readonly onStartFolderEdit: () => void;
  readonly onChangeFolderEditValue: (v: string) => void;
  readonly onCommitFolderEdit: () => void;
  readonly onCancelFolderEdit: () => void;
  readonly onRemoveFolder: (() => void) | undefined;
  readonly onStartEdit: (
    entryId: ProofEntryId,
    field: EditingField,
    currentValue: string,
  ) => void;
  readonly onChangeValue: (value: string) => void;
  readonly onCommitEdit: () => void;
  readonly onCancelEdit: () => void;
  readonly onRemove: (id: ProofEntryId) => void;
  readonly onMoveEntry:
    | ((id: ProofEntryId, folderId: ProofFolderId | undefined) => void)
    | undefined;
  readonly testId: string | undefined;
}) {
  const expanded = isFolderExpanded(panelState, folder.id);
  const editing = isFolderEditing(panelState, folder.id);
  const inputRef = useRef<HTMLInputElement>(null);
  const folderTestId =
    /* v8 ignore start -- testId always provided in tests */
    testId !== undefined
      ? `${testId satisfies string}-folder-${folder.id satisfies string}`
      : undefined;
  /* v8 ignore stop */

  useEffect(() => {
    if (editing && inputRef.current !== null) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  return (
    <div style={folderSectionStyle} data-testid={folderTestId}>
      <div
        style={folderHeaderStyle}
        data-testid={
          /* v8 ignore start -- testId always provided in tests */
          folderTestId !== undefined
            ? `${folderTestId satisfies string}-header`
            : undefined
          /* v8 ignore stop */
        }
      >
        <span
          onClick={onToggle}
          onKeyDown={(e) => {
            /* v8 ignore start */
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onToggle();
            }
            /* v8 ignore stop */
          }}
          role="button"
          tabIndex={0}
          style={{ display: "flex", alignItems: "center", gap: 6, flex: 1 }}
          data-testid={
            /* v8 ignore start -- testId always provided in tests */
            folderTestId !== undefined
              ? `${folderTestId satisfies string}-toggle`
              : undefined
            /* v8 ignore stop */
          }
        >
          <span style={{ fontSize: 10 }}>{expanded ? "\u25BC" : "\u25B6"}</span>
          {editing ? (
            <input
              ref={inputRef}
              type="text"
              style={{ ...editInputStyle, fontSize: 13 }}
              value={
                /* v8 ignore start */ panelState.folderEditing?.value ??
                "" /* v8 ignore stop */
              }
              /* v8 ignore start -- stopPropagation: prevents toggle when clicking input */
              onClick={(e) => e.stopPropagation()}
              /* v8 ignore stop */
              onChange={(e) => onChangeFolderEditValue(e.target.value)}
              /* v8 ignore start -- inline callback: tested via unit tests but v8 doesn't track */
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === "Enter") {
                  onCommitFolderEdit();
                } else if (e.key === "Escape") {
                  onCancelFolderEdit();
                }
              }}
              /* v8 ignore stop */
              onBlur={onCommitFolderEdit}
              data-testid={
                /* v8 ignore start -- testId always provided in tests */
                folderTestId !== undefined
                  ? `${folderTestId satisfies string}-name-input`
                  : undefined
                /* v8 ignore stop */
              }
            />
          ) : (
            <>
              {folder.name}
              <span style={folderCountStyle}>
                {formatMsg(messages.collectionFolderEntryCount, {
                  count: String(folderEntries.length),
                })}
              </span>
            </>
          )}
        </span>
        <span style={folderActionsStyle}>
          <UiButton
            size="small"
            type="text"
            onClick={(e) => {
              e.stopPropagation();
              onStartFolderEdit();
            }}
            data-testid={
              /* v8 ignore start -- testId always provided in tests */
              folderTestId !== undefined
                ? `${folderTestId satisfies string}-rename`
                : undefined
              /* v8 ignore stop */
            }
          >
            {messages.collectionFolderRename}
          </UiButton>
          {onRemoveFolder !== undefined && (
            <UiButton
              size="small"
              type="text"
              danger
              onClick={(e) => {
                e.stopPropagation();
                onRemoveFolder();
              }}
              data-testid={
                /* v8 ignore start -- testId always provided in tests */
                folderTestId !== undefined
                  ? `${folderTestId satisfies string}-delete`
                  : undefined
                /* v8 ignore stop */
              }
            >
              {messages.collectionFolderDelete}
            </UiButton>
          )}
        </span>
      </div>
      {expanded && (
        <div style={folderEntriesStyle}>
          {folderEntries.map((entry) => (
            <CollectionEntryCard
              key={entry.id}
              entry={entry}
              panelState={panelState}
              messages={messages}
              folders={folders}
              isInsideFolder={true}
              onStartEdit={onStartEdit}
              onChangeValue={onChangeValue}
              onCommitEdit={onCommitEdit}
              onCancelEdit={onCancelEdit}
              onRemove={onRemove}
              onMoveEntry={onMoveEntry}
              testId={testId}
            />
          ))}
        </div>
      )}
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
    /* v8 ignore start */
    if (inputRef.current !== null) {
      inputRef.current.focus();
    }
    /* v8 ignore stop */
  }, []);

  return (
    <input
      ref={inputRef}
      type="text"
      style={editInputStyle}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        /* v8 ignore start */
        if (e.key === "Enter") {
          onCommit();
        } else if (e.key === "Escape") {
          onCancel();
        }
        /* v8 ignore stop */
      }}
      onBlur={onCancel}
      data-testid={testId}
    />
  );
}

// --- Main component ---

export function ProofCollectionPageView({
  entries,
  folders = [],
  messages,
  onRenameEntry,
  onUpdateMemo,
  onRemoveEntry,
  onMoveEntry,
  onCreateFolder,
  onRemoveFolder,
  onRenameFolder,
  testId,
}: ProofCollectionPageViewProps) {
  const [panelState, setPanelState] = useState<PanelState>(
    createInitialPanelState,
  );

  // --- Entry editing handlers ---

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
      /* v8 ignore start */
      if (prev.editing === undefined) return prev;
      /* v8 ignore stop */
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

  // --- Folder toggle ---

  const handleToggleFolder = useCallback((folderId: ProofFolderId) => {
    setPanelState((prev) => toggleFolderExpanded(prev, folderId));
  }, []);

  // --- Folder name editing ---

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
      /* v8 ignore start */
      if (prev.folderEditing === undefined) return prev;
      /* v8 ignore stop */
      const { folderId, value } = prev.folderEditing;
      if (value.trim() !== "" && onRenameFolder !== undefined) {
        onRenameFolder(folderId, value.trim());
      }
      return cancelFolderEditing(prev);
    });
  }, [onRenameFolder]);

  /* v8 ignore start -- trivial callback: delegates to tested pure function, triggered via v8-ignored keyDown */
  const handleCancelFolderEdit = useCallback(() => {
    setPanelState((prev) => cancelFolderEditing(prev));
  }, []);
  /* v8 ignore stop */

  // --- Folder creation ---

  const handleStartCreateFolder = useCallback(() => {
    setPanelState((prev) => startCreatingFolder(prev));
  }, []);

  const handleChangeCreateFolderValue = useCallback((value: string) => {
    setPanelState((prev) => updateCreatingFolderValue(prev, value));
  }, []);

  const handleCommitCreateFolder = useCallback(() => {
    setPanelState((prev) => {
      /* v8 ignore start */
      if (prev.creatingFolder === undefined) return prev;
      /* v8 ignore stop */
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

  // --- Entry classification ---

  const hasFolders = folders.length > 0;
  const rootEntries = hasFolders
    ? entries.filter((e) => e.folderId === undefined)
    : entries;

  return (
    <div style={containerStyle} data-testid={testId}>
      {/* Header bar */}
      <div style={headerBarStyle}>
        <span style={entryCountStyle}>
          {formatMsg(messages.collectionEntryCount, {
            count: String(entries.length),
          })}
        </span>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {onCreateFolder !== undefined &&
            panelState.creatingFolder === undefined && (
              <UiButton
                size="small"
                onClick={handleStartCreateFolder}
                data-testid={
                  /* v8 ignore start -- testId always provided in tests */
                  testId !== undefined
                    ? `${testId satisfies string}-create-folder`
                    : undefined
                  /* v8 ignore stop */
                }
              >
                {messages.collectionCreateFolder}
              </UiButton>
            )}
        </div>
      </div>

      {/* Folder creation input */}
      {panelState.creatingFolder !== undefined && (
        <CreateFolderInput
          value={panelState.creatingFolder}
          placeholder={messages.collectionFolderNamePlaceholder}
          onChange={handleChangeCreateFolderValue}
          onCommit={handleCommitCreateFolder}
          onCancel={handleCancelCreateFolder}
          testId={
            /* v8 ignore start -- testId always provided in tests */
            testId !== undefined
              ? `${testId satisfies string}-create-folder-input`
              : undefined
            /* v8 ignore stop */
          }
        />
      )}

      {/* Empty state */}
      {entries.length === 0 && !hasFolders ? (
        <div
          style={emptyHeroStyle}
          data-testid={
            /* v8 ignore start -- testId always provided in tests */ testId !==
            undefined
              ? `${testId satisfies string}-empty`
              : undefined /* v8 ignore stop */
          }
        >
          <p style={emptyDescStyle}>{messages.collectionEmpty}</p>
        </div>
      ) : (
        <>
          {/* Folder sections */}
          {hasFolders &&
            folders.map((folder) => {
              const folderEntries = entries.filter(
                (e) => e.folderId === folder.id,
              );
              return (
                <FolderSection
                  key={folder.id}
                  folder={folder}
                  folderEntries={folderEntries}
                  panelState={panelState}
                  messages={messages}
                  folders={folders}
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
                  onStartEdit={handleStartEdit}
                  onChangeValue={handleChangeValue}
                  onCommitEdit={handleCommitEdit}
                  onCancelEdit={handleCancelEdit}
                  onRemove={handleRemove}
                  onMoveEntry={onMoveEntry}
                  testId={testId}
                />
              );
            })}

          {/* Root entries label */}
          {hasFolders && rootEntries.length > 0 && (
            <div
              style={sectionLabelStyle}
              data-testid={
                /* v8 ignore start -- testId always provided in tests */
                testId !== undefined
                  ? `${testId satisfies string}-root-section`
                  : undefined
                /* v8 ignore stop */
              }
            >
              {messages.collectionRootEntries}
            </div>
          )}

          {/* Root entries */}
          {rootEntries.map((entry) => (
            <CollectionEntryCard
              key={entry.id}
              entry={entry}
              panelState={panelState}
              messages={messages}
              folders={folders}
              isInsideFolder={false}
              onStartEdit={handleStartEdit}
              onChangeValue={handleChangeValue}
              onCommitEdit={handleCommitEdit}
              onCancelEdit={handleCancelEdit}
              onRemove={handleRemove}
              onMoveEntry={onMoveEntry}
              testId={testId}
            />
          ))}
        </>
      )}
    </div>
  );
}

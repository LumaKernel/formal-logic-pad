/**
 * 証明コレクション管理パネル。
 *
 * 保存済み証明の一覧表示・名前変更・メモ編集・削除を提供する。
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
import type { ProofEntry, ProofEntryId } from "./proofCollectionState";
import type { PanelState, EditingField } from "./proofCollectionPanelLogic";
import {
  createInitialPanelState,
  startEditing,
  updateEditingValue,
  cancelEditing,
  isEditing,
} from "./proofCollectionPanelLogic";
import type { ProofMessages } from "../proof-pad/proofMessages";
import { formatMessage } from "../proof-pad/proofMessages";

// --- Props ---

export interface ProofCollectionPanelProps {
  /** 表示するエントリ一覧（更新日時降順） */
  readonly entries: readonly ProofEntry[];
  /** メッセージ（i18n） */
  readonly messages: ProofMessages;
  /** エントリ名を変更するコールバック */
  readonly onRenameEntry: (id: ProofEntryId, newName: string) => void;
  /** エントリメモを更新するコールバック */
  readonly onUpdateMemo: (id: ProofEntryId, memo: string) => void;
  /** エントリを削除するコールバック */
  readonly onRemoveEntry: (id: ProofEntryId) => void;
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

const deductionStyleBadgeStyle: CSSProperties = {
  fontSize: 9,
  color: "var(--color-text-secondary, #aaa)",
  fontWeight: 400,
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
  onStartEdit,
  onChangeValue,
  onCommitEdit,
  onCancelEdit,
  onRemove,
  testId,
}: {
  readonly entry: ProofEntry;
  readonly panelState: PanelState;
  readonly messages: ProofMessages;
  readonly onStartEdit: (
    entryId: ProofEntryId,
    field: EditingField,
    currentValue: string,
  ) => void;
  readonly onChangeValue: (value: string) => void;
  readonly onCommitEdit: () => void;
  readonly onCancelEdit: () => void;
  readonly onRemove: (id: ProofEntryId) => void;
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

// --- メインコンポーネント ---

export function ProofCollectionPanel({
  entries,
  messages,
  onRenameEntry,
  onUpdateMemo,
  onRemoveEntry,
  onClose,
  testId,
}: ProofCollectionPanelProps) {
  const [panelState, setPanelState] = useState<PanelState>(
    createInitialPanelState,
  );

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
      {entries.length === 0 ? (
        <div style={emptyStyle}>{messages.collectionEmpty}</div>
      ) : (
        entries.map((entry) => (
          <CollectionEntry
            key={entry.id}
            entry={entry}
            panelState={panelState}
            messages={messages}
            onStartEdit={handleStartEdit}
            onChangeValue={handleChangeValue}
            onCommitEdit={handleCommitEdit}
            onCancelEdit={handleCancelEdit}
            onRemove={handleRemove}
            testId={testId}
          />
        ))
      )}
    </div>
  );
}

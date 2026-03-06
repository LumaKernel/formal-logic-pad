/**
 * ノートブック一覧UIコンポーネント。
 *
 * ノートブックの一覧表示、削除、複製、名前変更を提供する。
 * 制御コンポーネント: 状態は外部（useNotebookCollection）で管理する。
 *
 * 変更時は NotebookListComponent.test.tsx, NotebookListComponent.stories.tsx も同期すること。
 */

import { useState, type CSSProperties } from "react";
import type { NotebookListItem } from "./notebookListLogic";
import { validateNotebookName } from "./notebookListLogic";

// --- Props ---

export type NotebookListProps = {
  readonly items: readonly NotebookListItem[];
  readonly onOpen: (id: string) => void;
  readonly onDelete: (id: string) => void;
  readonly onDuplicate: (id: string) => void;
  readonly onRename: (id: string, newName: string) => void;
  readonly onConvertToFree?: (id: string) => void;
};

// --- Styles ---

const containerStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
  padding: 16,
  fontFamily: "var(--font-ui)",
};

const emptyStyle: CSSProperties = {
  textAlign: "center",
  padding: 40,
  color: "var(--color-text-secondary, #666)",
  fontSize: 14,
  background: "var(--color-notebook-card-bg, #fffdf8)",
  borderRadius: 8,
  border: "1px solid var(--color-notebook-card-border, rgba(180,160,130,0.25))",
  boxShadow:
    "0 1px 3px var(--color-notebook-card-shadow, rgba(120,100,70,0.08))",
};

const itemStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  padding: "14px 18px",
  borderRadius: 8,
  border: "1px solid var(--color-notebook-card-border, rgba(180,160,130,0.25))",
  background: "var(--color-notebook-card-bg, #fffdf8)",
  cursor: "pointer",
  transition: "box-shadow 0.2s ease, transform 0.2s ease, background 0.2s ease",
  gap: 12,
  boxShadow:
    "0 1px 3px var(--color-notebook-card-shadow, rgba(120,100,70,0.08))",
  position: "relative" as const,
};

const itemHoverStyle: CSSProperties = {
  ...itemStyle,
  background: "var(--color-notebook-card-hover-bg, rgba(252,249,243,0.98))",
  boxShadow:
    "0 3px 8px var(--color-notebook-card-shadow-hover, rgba(120,100,70,0.18))",
  transform: "translateY(-1px)",
};

const itemInfoStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
};

const itemNameStyle: CSSProperties = {
  fontSize: 15,
  fontWeight: 600,
  color: "var(--color-text-primary, #333)",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const itemMetaStyle: CSSProperties = {
  fontSize: 12,
  color: "var(--color-text-secondary, #888)",
  marginTop: 4,
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const badgeStyle: CSSProperties = {
  display: "inline-block",
  fontSize: 10,
  padding: "2px 8px",
  borderRadius: 10,
  fontWeight: 600,
  letterSpacing: "0.02em",
};

const freeBadgeStyle: CSSProperties = {
  ...badgeStyle,
  background: "var(--color-badge-free-bg)",
  color: "var(--color-badge-free-text)",
};

const questBadgeStyle: CSSProperties = {
  ...badgeStyle,
  background: "var(--color-badge-quest-bg)",
  color: "var(--color-badge-quest-text)",
};

const actionsStyle: CSSProperties = {
  display: "flex",
  gap: 4,
  flexShrink: 0,
};

const actionButtonStyle: CSSProperties = {
  padding: "4px 10px",
  fontSize: 12,
  borderRadius: 6,
  border:
    "1px solid var(--color-notebook-action-border, rgba(180,160,130,0.3))",
  background: "var(--color-notebook-action-bg, rgba(255,253,248,0.9))",
  color: "var(--color-text-primary, #333)",
  cursor: "pointer",
  transition: "background 0.15s ease",
};

const actionButtonHoverStyle: CSSProperties = {
  ...actionButtonStyle,
  background: "var(--color-notebook-action-hover-bg, rgba(245,240,230,0.95))",
};

const deleteButtonStyle: CSSProperties = {
  ...actionButtonStyle,
  color: "var(--color-notebook-delete-text, #c62828)",
  borderColor: "var(--color-notebook-delete-border, rgba(198,40,40,0.25))",
};

const deleteButtonHoverStyle: CSSProperties = {
  ...deleteButtonStyle,
  background: "var(--color-notebook-delete-hover-bg, rgba(198,40,40,0.06))",
};

const deleteConfirmOverlayStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  background: "var(--color-notebook-delete-confirm-bg, rgba(255,253,248,0.97))",
  borderRadius: 8,
  zIndex: 1,
  padding: "0 18px",
};

const deleteConfirmTextStyle: CSSProperties = {
  fontSize: 13,
  color: "var(--color-notebook-delete-text, #c62828)",
  fontWeight: 600,
  flex: 1,
  textAlign: "center",
};

const deleteConfirmBtnStyle: CSSProperties = {
  padding: "6px 14px",
  fontSize: 12,
  borderRadius: 6,
  border: "1px solid var(--color-notebook-delete-border, rgba(198,40,40,0.4))",
  background: "var(--color-notebook-delete-text, #c62828)",
  color: "#fff",
  cursor: "pointer",
  fontWeight: 600,
};

const deleteCancelBtnStyle: CSSProperties = {
  padding: "6px 14px",
  fontSize: 12,
  borderRadius: 6,
  border:
    "1px solid var(--color-notebook-action-border, rgba(180,160,130,0.3))",
  background: "var(--color-notebook-action-bg, rgba(255,253,248,0.9))",
  color: "var(--color-text-primary, #333)",
  cursor: "pointer",
};

const renameInputStyle: CSSProperties = {
  fontSize: 15,
  fontWeight: 600,
  padding: "2px 4px",
  border: "1px solid var(--color-primary, #1976d2)",
  borderRadius: 4,
  outline: "none",
  width: "100%",
  background: "var(--color-notebook-card-bg, #fffdf8)",
  color: "var(--color-text-primary, #333)",
};

const renameErrorStyle: CSSProperties = {
  fontSize: 11,
  color: "var(--color-error, #e06060)",
  marginTop: 2,
};

// --- Sub-components ---

function ActionButton({
  children,
  onClick,
  title,
  "data-testid": testId,
  variant = "default",
}: {
  readonly children: React.ReactNode;
  readonly onClick: (e: React.MouseEvent) => void;
  readonly title: string;
  readonly "data-testid": string;
  readonly variant?: "default" | "danger";
}) {
  const [hovered, setHovered] = useState(false);
  const baseStyle =
    variant === "danger" ? deleteButtonStyle : actionButtonStyle;
  const hoverStyle =
    variant === "danger" ? deleteButtonHoverStyle : actionButtonHoverStyle;
  return (
    <button
      data-testid={testId}
      style={hovered ? hoverStyle : baseStyle}
      onClick={onClick}
      title={title}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
    </button>
  );
}

function ModeBadge({ mode }: { readonly mode: "free" | "quest" }) {
  return (
    <span style={mode === "quest" ? questBadgeStyle : freeBadgeStyle}>
      {mode === "quest" ? "クエスト" : "自由帳"}
    </span>
  );
}

function NotebookItem({
  item,
  onOpen,
  onDelete,
  onDuplicate,
  onRename,
  onConvertToFree,
}: {
  readonly item: NotebookListItem;
  readonly onOpen: (id: string) => void;
  readonly onDelete: (id: string) => void;
  readonly onDuplicate: (id: string) => void;
  readonly onRename: (id: string, newName: string) => void;
  readonly onConvertToFree?: (id: string) => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(item.name);
  const [editError, setEditError] = useState<string | null>(null);
  const [isDeleteConfirming, setIsDeleteConfirming] = useState(false);

  const handleRenameStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditName(item.name);
    setEditError(null);
    setIsEditing(true);
  };

  const handleRenameSubmit = () => {
    const validation = validateNotebookName(editName);
    if (!validation.valid) {
      setEditError(validation.reason);
      return;
    }
    onRename(item.id, editName.trim());
    setIsEditing(false);
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleRenameSubmit();
    } else if (e.key === "Escape") {
      setIsEditing(false);
    }
  };

  const handleDeleteStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleteConfirming(true);
  };

  const handleDeleteConfirm = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(item.id);
    setIsDeleteConfirming(false);
  };

  const handleDeleteCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleteConfirming(false);
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDuplicate(item.id);
  };

  const handleConvertToFree = (e: React.MouseEvent) => {
    e.stopPropagation();
    onConvertToFree?.(item.id);
  };

  return (
    <div
      data-testid={`notebook-item-${item.id satisfies string}`}
      style={isHovered ? itemHoverStyle : itemStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onOpen(item.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          onOpen(item.id);
        }
      }}
    >
      <div style={itemInfoStyle}>
        {isEditing ? (
          <div onClick={(e) => e.stopPropagation()}>
            <input
              data-testid="rename-input"
              style={renameInputStyle}
              value={editName}
              onChange={(e) => {
                setEditName(e.target.value);
                setEditError(null);
              }}
              onBlur={handleRenameSubmit}
              onKeyDown={handleRenameKeyDown}
              autoFocus
            />
            {editError !== null && (
              <div style={renameErrorStyle}>{editError}</div>
            )}
          </div>
        ) : (
          <>
            <div style={itemNameStyle}>{item.name}</div>
            <div style={itemMetaStyle}>
              <span>{item.systemName}</span>
              <ModeBadge mode={item.mode} />
              <span>更新: {item.updatedAtLabel}</span>
            </div>
          </>
        )}
      </div>
      <div style={actionsStyle} onClick={(e) => e.stopPropagation()}>
        <ActionButton
          data-testid={`rename-btn-${item.id satisfies string}`}
          onClick={handleRenameStart}
          title="名前変更"
        >
          名前変更
        </ActionButton>
        <ActionButton
          data-testid={`duplicate-btn-${item.id satisfies string}`}
          onClick={handleDuplicate}
          title="複製"
        >
          複製
        </ActionButton>
        {item.mode === "quest" && onConvertToFree !== undefined && (
          <ActionButton
            data-testid={`convert-btn-${item.id satisfies string}`}
            onClick={handleConvertToFree}
            title="自由帳として複製"
          >
            自由帳として複製
          </ActionButton>
        )}
        <ActionButton
          data-testid={`delete-btn-${item.id satisfies string}`}
          onClick={handleDeleteStart}
          title="削除"
          variant="danger"
        >
          削除
        </ActionButton>
      </div>
      {isDeleteConfirming && (
        <div
          data-testid={`delete-confirm-${item.id satisfies string}`}
          style={deleteConfirmOverlayStyle}
          onClick={(e) => e.stopPropagation()}
        >
          <span style={deleteConfirmTextStyle}>本当に削除しますか？</span>
          <button
            data-testid={`delete-cancel-btn-${item.id satisfies string}`}
            style={deleteCancelBtnStyle}
            onClick={handleDeleteCancel}
          >
            キャンセル
          </button>
          <button
            data-testid={`delete-confirm-btn-${item.id satisfies string}`}
            style={deleteConfirmBtnStyle}
            onClick={handleDeleteConfirm}
          >
            削除する
          </button>
        </div>
      )}
    </div>
  );
}

// --- Main component ---

export function NotebookList({
  items,
  onOpen,
  onDelete,
  onDuplicate,
  onRename,
  onConvertToFree,
}: NotebookListProps) {
  if (items.length === 0) {
    return (
      <div style={containerStyle}>
        <div style={emptyStyle} data-testid="notebook-list-empty">
          ノートがありません。新しいノートを作成してください。
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle} data-testid="notebook-list">
      {items.map((item) => (
        <NotebookItem
          key={item.id}
          item={item}
          onOpen={onOpen}
          onDelete={onDelete}
          onDuplicate={onDuplicate}
          onRename={onRename}
          onConvertToFree={onConvertToFree}
        />
      ))}
    </div>
  );
}

/**
 * ノートブック一覧UIコンポーネント。
 *
 * ノートブックの一覧表示、削除、複製、名前変更を提供する。
 * 制御コンポーネント: 状態は外部（useNotebookCollection）で管理する。
 *
 * 変更時は NotebookListComponent.test.tsx, NotebookListComponent.stories.tsx も同期すること。
 */

import { useState, useRef, useEffect, useMemo, type CSSProperties } from "react";
import { Button, Menu } from "antd";
import { EllipsisOutlined } from "@ant-design/icons";
import type { MenuProps } from "antd";
import type { NotebookListItem } from "./notebookListLogic";
import { validateNotebookName, questProgressText } from "./notebookListLogic";

// --- Style constants ---

const moreMenuContainerStyle: Readonly<CSSProperties> = {
  position: "relative",
  flexShrink: 0,
};

const dropdownStyle: Readonly<CSSProperties> = {
  position: "absolute",
  right: 0,
  top: "100%",
  marginTop: "0.25rem",
  backgroundColor: "var(--ui-card)",
  border: "1px solid var(--ui-border)",
  borderRadius: "0.5rem",
  boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)",
  zIndex: 1000,
  minWidth: "10rem",
  overflow: "hidden",
};

const badgeBaseStyle: Readonly<CSSProperties> = {
  display: "inline-block",
  fontSize: "10px",
  paddingLeft: "0.5rem",
  paddingRight: "0.5rem",
  paddingTop: "2px",
  paddingBottom: "2px",
  borderRadius: "9999px",
  fontWeight: 600,
  letterSpacing: "0.025em",
};

const listContainerStyle: Readonly<CSSProperties> = {
  display: "flex",
  flexDirection: "column",
  gap: "0.75rem",
  padding: "1rem",
};

const emptyStyle: Readonly<CSSProperties> = {
  textAlign: "center",
  padding: "2.5rem",
  color: "var(--ui-muted-foreground)",
  fontSize: "0.875rem",
  backgroundColor: "var(--ui-card)",
  borderRadius: "0.5rem",
  border: "1px solid var(--ui-border)",
  boxShadow: "0 1px 2px 0 rgba(0,0,0,0.05)",
};

const itemStyle: Readonly<CSSProperties> = {
  display: "flex",
  alignItems: "center",
  paddingTop: "0.875rem",
  paddingBottom: "0.875rem",
  paddingLeft: "1.125rem",
  paddingRight: "1.125rem",
  borderRadius: "0.5rem",
  border: "1px solid var(--ui-border)",
  backgroundColor: "var(--ui-card)",
  cursor: "pointer",
  transitionProperty: "all",
  transitionDuration: "150ms",
  gap: "0.75rem",
  boxShadow: "0 1px 2px 0 rgba(0,0,0,0.05)",
  position: "relative",
};

const itemContentStyle: Readonly<CSSProperties> = {
  flex: 1,
  minWidth: 0,
};

const renameInputStyle: Readonly<CSSProperties> = {
  fontSize: "15px",
  fontWeight: 600,
  paddingTop: "2px",
  paddingBottom: "2px",
  paddingLeft: "0.25rem",
  paddingRight: "0.25rem",
  border: "1px solid var(--ui-primary)",
  borderRadius: "4px",
  outline: "none",
  width: "100%",
  backgroundColor: "var(--ui-card)",
  color: "var(--ui-foreground)",
};

const errorStyle: Readonly<CSSProperties> = {
  fontSize: "11px",
  color: "var(--color-error, #e06060)",
  marginTop: "2px",
};

const nameStyle: Readonly<CSSProperties> = {
  fontSize: "15px",
  fontWeight: 600,
  color: "var(--ui-foreground)",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const metaStyle: Readonly<CSSProperties> = {
  fontSize: "0.75rem",
  color: "var(--ui-muted-foreground)",
  marginTop: "0.25rem",
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
};

const deleteOverlayStyle: Readonly<CSSProperties> = {
  position: "absolute",
  inset: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "0.5rem",
  backgroundColor: "color-mix(in srgb, var(--ui-card) 97%, transparent)",
  borderRadius: "0.5rem",
  zIndex: 1,
  paddingLeft: "1.125rem",
  paddingRight: "1.125rem",
};

const deleteMessageStyle: Readonly<CSSProperties> = {
  fontSize: "13px",
  color: "var(--ui-destructive)",
  fontWeight: 600,
  flex: 1,
  textAlign: "center",
};


// --- Props ---

export type NotebookListProps = {
  readonly items: readonly NotebookListItem[];
  readonly onOpen: (id: string) => void;
  readonly onDelete: (id: string) => void;
  readonly onDuplicate: (id: string) => void;
  readonly onRename: (id: string, newName: string) => void;
  readonly onConvertToFree?: (id: string) => void;
  readonly onExport?: (id: string) => void;
};

// --- Sub-components ---

function MoreMenu({
  itemId,
  menuItems,
  onOpenChange,
}: {
  readonly itemId: string;
  readonly menuItems: MenuProps["items"];
  readonly onOpenChange?: (open: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const updateOpen = (nextOpen: boolean) => {
    setOpen(nextOpen);
    onOpenChange?.(nextOpen);
  };

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current !== null &&
        !menuRef.current.contains(e.target as Node)
      ) {
        updateOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <div
      ref={menuRef}
      style={moreMenuContainerStyle}
      onClick={(e) => e.stopPropagation()}
    >
      <Button
        data-testid={`more-btn-${itemId satisfies string}`}
        icon={<EllipsisOutlined />}
        type="text"
        size="small"
        onClick={() => updateOpen(!open)}
        aria-label="その他の操作"
        aria-expanded={open}
        style={{ flexShrink: 0 }}
      />
      {open && (
        <div
          data-testid={`more-menu-${itemId satisfies string}`}
          style={dropdownStyle}
          onClick={() => updateOpen(false)}
        >
          <Menu
            items={menuItems}
            selectable={false}
            style={{ border: "none", boxShadow: "none", borderRadius: "0.5rem" }}
          />
        </div>
      )}
    </div>
  );
}

function ModeBadge({ mode }: { readonly mode: "free" | "quest" }) {
  const variantStyle: Readonly<CSSProperties> =
    mode === "quest"
      ? {
          backgroundColor: "var(--color-badge-quest-bg)",
          color: "var(--color-badge-quest-text)",
        }
      : {
          backgroundColor: "var(--color-badge-free-bg)",
          color: "var(--color-badge-free-text)",
        };
  return (
    <span style={{ ...badgeBaseStyle, ...variantStyle }}>
      {mode === "quest" ? "クエスト" : "自由帳"}
    </span>
  );
}

function QuestProgressBadge({
  progress,
}: {
  readonly progress: NotebookListItem["questProgress"];
}) {
  if (progress === undefined) {
    return null;
  }
  const text = questProgressText(progress);
  const isComplete = progress.achievedCount >= progress.totalCount;
  const variantStyle: Readonly<CSSProperties> = isComplete
    ? {
        backgroundColor: "var(--color-quest-progress-complete-bg, #e8f5e9)",
        color: "var(--color-quest-progress-complete-text, #2e7d32)",
      }
    : {
        backgroundColor: "var(--color-quest-progress-partial-bg, #fff3e0)",
        color: "var(--color-quest-progress-partial-text, #e65100)",
      };
  return (
    <span
      data-testid="quest-progress-badge"
      style={{ ...badgeBaseStyle, ...variantStyle }}
    >
      {text}
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
  onExport,
}: {
  readonly item: NotebookListItem;
  readonly onOpen: (id: string) => void;
  readonly onDelete: (id: string) => void;
  readonly onDuplicate: (id: string) => void;
  readonly onRename: (id: string, newName: string) => void;
  readonly onConvertToFree?: (id: string) => void;
  readonly onExport?: (id: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(item.name);
  const [editError, setEditError] = useState<string | null>(null);
  const [isDeleteConfirming, setIsDeleteConfirming] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleRenameStart = () => {
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

  const handleDeleteStart = () => {
    setIsDeleteConfirming(true);
  };

  const handleDeleteConfirm = () => {
    onDelete(item.id);
    setIsDeleteConfirming(false);
  };

  const handleDeleteCancel = () => {
    setIsDeleteConfirming(false);
  };

  const handleDuplicate = () => {
    onDuplicate(item.id);
  };

  const handleConvertToFree = () => {
    onConvertToFree?.(item.id);
  };

  const handleExport = () => {
    onExport?.(item.id);
  };

  const menuItems: MenuProps["items"] = useMemo(() => {
    const items: NonNullable<MenuProps["items"]> = [
      {
        key: "rename",
        label: <span data-testid={`rename-btn-${item.id satisfies string}`}>名前変更</span>,
        onClick: handleRenameStart,
      },
      {
        key: "duplicate",
        label: <span data-testid={`duplicate-btn-${item.id satisfies string}`}>複製</span>,
        onClick: handleDuplicate,
      },
    ];
    if (onExport !== undefined) {
      items.push({
        key: "export",
        label: <span data-testid={`export-btn-${item.id satisfies string}`}>エクスポート</span>,
        onClick: handleExport,
      });
    }
    if (item.mode === "quest" && onConvertToFree !== undefined) {
      items.push({
        key: "convert",
        label: <span data-testid={`convert-btn-${item.id satisfies string}`}>自由帳として複製</span>,
        onClick: handleConvertToFree,
      });
    }
    items.push({
      key: "delete",
      label: <span data-testid={`delete-btn-${item.id satisfies string}`}>削除</span>,
      danger: true,
      onClick: handleDeleteStart,
    });
    return items;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id, item.mode, onExport, onConvertToFree]);

  return (
    <div
      data-testid={`notebook-item-${item.id satisfies string}`}
      className="notebook-card"
      style={{
        ...itemStyle,
        ...(isMenuOpen ? { zIndex: 100 } : {}),
      }}
      onClick={() => onOpen(item.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          onOpen(item.id);
        }
      }}
    >
      <div style={itemContentStyle}>
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
            {editError !== null && <div style={errorStyle}>{editError}</div>}
          </div>
        ) : (
          <>
            <div style={nameStyle}>{item.name}</div>
            <div style={metaStyle}>
              <span>{item.systemName}</span>
              <ModeBadge mode={item.mode} />
              <QuestProgressBadge progress={item.questProgress} />
              <span>更新: {item.updatedAtLabel}</span>
            </div>
          </>
        )}
      </div>
      <MoreMenu itemId={item.id} menuItems={menuItems} onOpenChange={setIsMenuOpen} />
      {isDeleteConfirming && (
        <div
          data-testid={`delete-confirm-${item.id satisfies string}`}
          style={deleteOverlayStyle}
          onClick={(e) => e.stopPropagation()}
        >
          <span style={deleteMessageStyle}>本当に削除しますか？</span>
          <Button
            data-testid={`delete-cancel-btn-${item.id satisfies string}`}
            size="small"
            onClick={handleDeleteCancel}
          >
            キャンセル
          </Button>
          <Button
            data-testid={`delete-confirm-btn-${item.id satisfies string}`}
            size="small"
            danger
            type="primary"
            onClick={handleDeleteConfirm}
          >
            削除する
          </Button>
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
  onExport,
}: NotebookListProps) {
  if (items.length === 0) {
    return (
      <div style={listContainerStyle}>
        <div style={emptyStyle} data-testid="notebook-list-empty">
          ノートがありません。新しいノートを作成してください。
        </div>
      </div>
    );
  }

  return (
    <div style={listContainerStyle} data-testid="notebook-list">
      {items.map((item) => (
        <NotebookItem
          key={item.id}
          item={item}
          onOpen={onOpen}
          onDelete={onDelete}
          onDuplicate={onDuplicate}
          onRename={onRename}
          onConvertToFree={onConvertToFree}
          onExport={onExport}
        />
      ))}
    </div>
  );
}

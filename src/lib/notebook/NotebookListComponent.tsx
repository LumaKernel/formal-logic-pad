/**
 * ノートブック一覧UIコンポーネント。
 *
 * ノートブックの一覧表示、削除、複製、名前変更を提供する。
 * 制御コンポーネント: 状態は外部（useNotebookCollection）で管理する。
 *
 * 変更時は NotebookListComponent.test.tsx, NotebookListComponent.stories.tsx も同期すること。
 */

import { useState, useRef, useEffect } from "react";
import type { NotebookListItem } from "./notebookListLogic";
import { validateNotebookName, questProgressText } from "./notebookListLogic";

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

function MenuItem({
  children,
  onClick,
  "data-testid": testId,
  variant = "default",
}: {
  readonly children: React.ReactNode;
  readonly onClick: (e: React.MouseEvent) => void;
  readonly "data-testid": string;
  readonly variant?: "default" | "danger";
}) {
  const base =
    "block w-full py-2.5 px-4 text-[13px] text-left border-none bg-transparent cursor-pointer transition-colors";
  const variantClass =
    variant === "danger"
      ? "text-destructive hover:bg-destructive/5"
      : "text-foreground hover:bg-muted";
  return (
    <button data-testid={testId} className={`${base} ${variantClass}`} onClick={onClick}>
      {children}
    </button>
  );
}

function MoreMenu({
  itemId,
  children,
  onOpenChange,
}: {
  readonly itemId: string;
  readonly children: React.ReactNode;
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
      className="relative shrink-0"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        data-testid={`more-btn-${itemId satisfies string}`}
        className="px-2 py-1 text-lg leading-none rounded-md border border-ui-border bg-card text-foreground cursor-pointer transition-colors shrink-0 hover:bg-muted"
        onClick={() => updateOpen(!open)}
        title="その他の操作"
        aria-label="その他の操作"
        aria-expanded={open}
      >
        ⋯
      </button>
      {open && (
        <div
          data-testid={`more-menu-${itemId satisfies string}`}
          className="absolute right-0 top-full mt-1 bg-card border border-ui-border rounded-lg shadow-lg z-[1000] min-w-40 overflow-hidden"
          onClick={() => updateOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
}

function ModeBadge({ mode }: { readonly mode: "free" | "quest" }) {
  const base = "inline-block text-[10px] px-2 py-0.5 rounded-full font-semibold tracking-wide";
  const variantClass =
    mode === "quest"
      ? "bg-[var(--color-badge-quest-bg)] text-[var(--color-badge-quest-text)]"
      : "bg-[var(--color-badge-free-bg)] text-[var(--color-badge-free-text)]";
  return (
    <span className={`${base} ${variantClass}`}>
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
  const variantClass = isComplete
    ? "bg-[var(--color-quest-progress-complete-bg,#e8f5e9)] text-[var(--color-quest-progress-complete-text,#2e7d32)]"
    : "bg-[var(--color-quest-progress-partial-bg,#fff3e0)] text-[var(--color-quest-progress-partial-text,#e65100)]";
  return (
    <span
      data-testid="quest-progress-badge"
      className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-semibold tracking-wide ${variantClass}`}
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

  return (
    <div
      data-testid={`notebook-item-${item.id satisfies string}`}
      className={`flex items-center py-3.5 px-4.5 rounded-lg border border-ui-border bg-card cursor-pointer transition-all gap-3 shadow-sm relative hover:bg-muted hover:shadow-md hover:-translate-y-px ${isMenuOpen ? "z-[100]" : ""}`}
      onClick={() => onOpen(item.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          onOpen(item.id);
        }
      }}
    >
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <div onClick={(e) => e.stopPropagation()}>
            <input
              data-testid="rename-input"
              className="text-[15px] font-semibold py-0.5 px-1 border border-primary rounded outline-none w-full bg-card text-foreground"
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
              <div className="text-[11px] text-[var(--color-error,#e06060)] mt-0.5">
                {editError}
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="text-[15px] font-semibold text-foreground overflow-hidden text-ellipsis whitespace-nowrap">
              {item.name}
            </div>
            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
              <span>{item.systemName}</span>
              <ModeBadge mode={item.mode} />
              <QuestProgressBadge progress={item.questProgress} />
              <span>更新: {item.updatedAtLabel}</span>
            </div>
          </>
        )}
      </div>
      <MoreMenu itemId={item.id} onOpenChange={setIsMenuOpen}>
        <MenuItem
          data-testid={`rename-btn-${item.id satisfies string}`}
          onClick={handleRenameStart}
        >
          名前変更
        </MenuItem>
        <MenuItem
          data-testid={`duplicate-btn-${item.id satisfies string}`}
          onClick={handleDuplicate}
        >
          複製
        </MenuItem>
        {onExport !== undefined && (
          <MenuItem
            data-testid={`export-btn-${item.id satisfies string}`}
            onClick={handleExport}
          >
            エクスポート
          </MenuItem>
        )}
        {item.mode === "quest" && onConvertToFree !== undefined && (
          <MenuItem
            data-testid={`convert-btn-${item.id satisfies string}`}
            onClick={handleConvertToFree}
          >
            自由帳として複製
          </MenuItem>
        )}
        <MenuItem
          data-testid={`delete-btn-${item.id satisfies string}`}
          onClick={handleDeleteStart}
          variant="danger"
        >
          削除
        </MenuItem>
      </MoreMenu>
      {isDeleteConfirming && (
        <div
          data-testid={`delete-confirm-${item.id satisfies string}`}
          className="absolute inset-0 flex items-center justify-center gap-2 bg-card/97 rounded-lg z-[1] px-4.5"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="text-[13px] text-destructive font-semibold flex-1 text-center">
            本当に削除しますか？
          </span>
          <button
            data-testid={`delete-cancel-btn-${item.id satisfies string}`}
            className="py-1.5 px-3.5 text-xs rounded-md border border-ui-border bg-card text-foreground cursor-pointer"
            onClick={handleDeleteCancel}
          >
            キャンセル
          </button>
          <button
            data-testid={`delete-confirm-btn-${item.id satisfies string}`}
            className="py-1.5 px-3.5 text-xs rounded-md border border-destructive/40 bg-destructive text-destructive-foreground cursor-pointer font-semibold"
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
  onExport,
}: NotebookListProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col gap-3 p-4">
        <div
          className="text-center p-10 text-muted-foreground text-sm bg-card rounded-lg border border-ui-border shadow-sm"
          data-testid="notebook-list-empty"
        >
          ノートがありません。新しいノートを作成してください。
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-4" data-testid="notebook-list">
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

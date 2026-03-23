/**
 * ゴミ箱管理パネルのプレゼンテーションコンポーネント。
 *
 * 純粋なプレゼンテーション層。状態管理は外部(HubContent)が担当する。
 * 表示ロジックは trashPanelLogic.ts に依存。
 *
 * 変更時は TrashManagementPanel.stories.tsx, HubPageView.tsx も同期すること。
 */

import { useState, useMemo, useCallback, type CSSProperties } from "react";
import { UiButton } from "../../components/ui";
import type { TrashItem, TrashItemKind } from "./trashState";
import type { TrashKindLabels } from "./trashPanelLogic";
import {
  toTrashDisplayItems,
  filterTrashDisplayItems,
  buildTrashFilterOptions,
  formatRemainingDays,
} from "./trashPanelLogic";

// --- Messages ---

export type TrashPanelMessages = {
  readonly emptyTitle: string;
  readonly emptyDescription: string;
  readonly restoreButton: string;
  readonly deleteButton: string;
  readonly emptyTrashButton: string;
  readonly remainingDaysTemplate: string;
  readonly filterAll: string;
  readonly kindLabels: TrashKindLabels;
  readonly confirmEmptyTitle: string;
  readonly confirmEmptyDescription: string;
  readonly confirmEmptyOk: string;
  readonly confirmEmptyCancel: string;
};

// --- Props ---

export type TrashManagementPanelProps = {
  readonly items: readonly TrashItem[];
  readonly now: number;
  readonly messages: TrashPanelMessages;
  readonly onRestore?: (trashId: string) => void;
  readonly onDeletePermanently?: (trashId: string) => void;
  readonly onEmptyTrash?: () => void;
  readonly testId?: string;
};

// --- Styles ---

const panelStyle: Readonly<CSSProperties> = {
  display: "flex",
  flexDirection: "column",
  gap: "16px",
};

const headerStyle: Readonly<CSSProperties> = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
};

const filterBarStyle: Readonly<CSSProperties> = {
  display: "flex",
  gap: "6px",
  flexWrap: "wrap",
};

const filterButtonBaseStyle: Readonly<CSSProperties> = {
  paddingTop: "4px",
  paddingBottom: "4px",
  paddingLeft: "12px",
  paddingRight: "12px",
  fontSize: "12px",
  fontWeight: 600,
  borderRadius: "6px",
  cursor: "pointer",
  border: "1px solid var(--ui-border)",
  backgroundColor: "transparent",
  color: "var(--ui-muted-foreground)",
};

const filterButtonActiveStyle: Readonly<CSSProperties> = {
  ...filterButtonBaseStyle,
  backgroundColor: "var(--ui-primary)",
  color: "var(--ui-primary-foreground)",
  borderColor: "var(--ui-primary)",
};

const itemCardStyle: Readonly<CSSProperties> = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
  paddingTop: "12px",
  paddingBottom: "12px",
  paddingLeft: "16px",
  paddingRight: "16px",
  borderRadius: "8px",
  border: "1px solid var(--ui-border)",
  backgroundColor: "var(--ui-card)",
};

const itemInfoStyle: Readonly<CSSProperties> = {
  display: "flex",
  flexDirection: "column",
  gap: "2px",
  minWidth: 0,
  flex: 1,
};

const itemNameStyle: Readonly<CSSProperties> = {
  fontSize: "14px",
  fontWeight: 600,
  color: "var(--ui-foreground)",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const itemMetaStyle: Readonly<CSSProperties> = {
  fontSize: "12px",
  color: "var(--ui-muted-foreground)",
  display: "flex",
  gap: "8px",
};

const itemActionsStyle: Readonly<CSSProperties> = {
  display: "flex",
  gap: "6px",
  flexShrink: 0,
};

const emptyStateStyle: Readonly<CSSProperties> = {
  textAlign: "center",
  paddingTop: "60px",
  paddingBottom: "60px",
  paddingLeft: "20px",
  paddingRight: "20px",
  color: "var(--ui-muted-foreground)",
};

const emptyTitleStyle: Readonly<CSSProperties> = {
  fontSize: "1.5rem",
  fontWeight: 700,
  marginBottom: "8px",
  color: "var(--ui-foreground)",
};

const emptyDescriptionStyle: Readonly<CSSProperties> = {
  fontSize: "15px",
  lineHeight: 1.625,
};

const confirmOverlayStyle: Readonly<CSSProperties> = {
  position: "fixed",
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  backgroundColor: "rgba(0,0,0,0.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
};

const confirmCardStyle: Readonly<CSSProperties> = {
  backgroundColor: "var(--ui-card)",
  borderRadius: "12px",
  padding: "24px",
  maxWidth: "400px",
  width: "90%",
  boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
};

const confirmTitleStyle: Readonly<CSSProperties> = {
  fontSize: "1.125rem",
  fontWeight: 700,
  marginBottom: "8px",
  color: "var(--ui-foreground)",
};

const confirmDescriptionStyle: Readonly<CSSProperties> = {
  fontSize: "0.875rem",
  color: "var(--ui-muted-foreground)",
  marginBottom: "20px",
  lineHeight: "normal",
};

const confirmActionsStyle: Readonly<CSSProperties> = {
  display: "flex",
  gap: "8px",
  justifyContent: "flex-end",
};

// --- Component ---

export function TrashManagementPanel({
  items,
  now,
  messages,
  onRestore,
  onDeletePermanently,
  onEmptyTrash,
  testId = "trash-panel",
}: TrashManagementPanelProps) {
  const [filterKind, setFilterKind] = useState<TrashItemKind | null>(null);
  const [confirmEmpty, setConfirmEmpty] = useState(false);

  const displayItems = useMemo(
    () => toTrashDisplayItems(items, now, messages.kindLabels),
    [items, now, messages.kindLabels],
  );

  const filteredItems = useMemo(
    () => filterTrashDisplayItems(displayItems, filterKind),
    [displayItems, filterKind],
  );

  const filterOptions = useMemo(
    () =>
      buildTrashFilterOptions(
        displayItems,
        messages.kindLabels,
        messages.filterAll,
      ),
    [displayItems, messages.kindLabels, messages.filterAll],
  );

  const handleEmptyTrash = useCallback(() => {
    onEmptyTrash?.();
    setConfirmEmpty(false);
  }, [onEmptyTrash]);

  if (items.length === 0) {
    return (
      <div style={emptyStateStyle} data-testid={testId}>
        <div style={emptyTitleStyle}>{messages.emptyTitle}</div>
        <p style={emptyDescriptionStyle}>{messages.emptyDescription}</p>
      </div>
    );
  }

  return (
    <div style={panelStyle} data-testid={testId}>
      {/* Header: filter + empty trash */}
      <div style={headerStyle}>
        <div style={filterBarStyle} data-testid="trash-filter-bar">
          {filterOptions.map((opt) => (
            <button
              key={opt.kind ?? "all"}
              type="button"
              style={
                filterKind === opt.kind
                  ? filterButtonActiveStyle
                  : filterButtonBaseStyle
              }
              data-testid={`trash-filter-${(opt.kind ?? "all") satisfies string}`}
              onClick={() => setFilterKind(opt.kind)}
            >
              {opt.label} ({opt.count})
            </button>
          ))}
        </div>
        {onEmptyTrash !== undefined && (
          <UiButton
            danger
            size="small"
            data-testid="trash-empty-btn"
            onClick={() => setConfirmEmpty(true)}
          >
            {messages.emptyTrashButton}
          </UiButton>
        )}
      </div>

      {/* Item list */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {filteredItems.map((item) => (
          <div
            key={item.trashId}
            style={itemCardStyle}
            data-testid={`trash-item-${item.trashId satisfies string}`}
          >
            <div style={itemInfoStyle}>
              <div style={itemNameStyle}>{item.displayName}</div>
              <div style={itemMetaStyle}>
                <span>{item.kindLabel}</span>
                <span>
                  {formatRemainingDays(
                    item.remainingDays,
                    messages.remainingDaysTemplate,
                  )}
                </span>
              </div>
            </div>
            <div style={itemActionsStyle}>
              {onRestore !== undefined && (
                <UiButton
                  size="small"
                  data-testid={`trash-restore-${item.trashId satisfies string}`}
                  onClick={() => onRestore(item.trashId)}
                >
                  {messages.restoreButton}
                </UiButton>
              )}
              {onDeletePermanently !== undefined && (
                <UiButton
                  danger
                  size="small"
                  data-testid={`trash-delete-${item.trashId satisfies string}`}
                  onClick={() => onDeletePermanently(item.trashId)}
                >
                  {messages.deleteButton}
                </UiButton>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Confirm empty dialog */}
      {confirmEmpty && (
        <div
          style={confirmOverlayStyle}
          data-testid="trash-confirm-empty-dialog"
          onClick={(e) => {
            /* v8 ignore start — backdrop click: Storybook で検証 */
            if (e.target === e.currentTarget) {
              setConfirmEmpty(false);
            }
            /* v8 ignore stop */
          }}
        >
          <div style={confirmCardStyle}>
            <h3 style={confirmTitleStyle}>{messages.confirmEmptyTitle}</h3>
            <p style={confirmDescriptionStyle}>
              {messages.confirmEmptyDescription}
            </p>
            <div style={confirmActionsStyle}>
              <UiButton
                danger
                data-testid="trash-confirm-empty-ok"
                onClick={handleEmptyTrash}
              >
                {messages.confirmEmptyOk}
              </UiButton>
              <UiButton
                data-testid="trash-confirm-empty-cancel"
                onClick={() => setConfirmEmpty(false)}
              >
                {messages.confirmEmptyCancel}
              </UiButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

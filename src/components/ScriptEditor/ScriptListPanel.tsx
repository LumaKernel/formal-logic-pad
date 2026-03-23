/**
 * スクリプト一覧パネル（Hub ページ Scripts タブ用）。
 *
 * 保存済みスクリプトの一覧表示・削除・リネームを提供する。
 * プレゼンテーション層: すべてのデータとコールバックを props で受け取る。
 *
 * 変更時は ScriptListPanel.test.tsx, HubPageView.tsx も同期すること。
 */

import { useState, type CSSProperties } from "react";
import { UiButton } from "../ui";
import type { ScriptListItem } from "./scriptListPanelLogic";

// ── Types ──────────────────────────────────────────────────────

export type ScriptListPanelMessages = {
  readonly emptyTitle: string;
  readonly emptyDescription: string;
  readonly deleteButton: string;
  readonly renameButton: string;
  readonly exportButton: string;
  readonly docsLinkText: string;
};

export type ScriptListPanelProps = {
  readonly items: readonly ScriptListItem[];
  readonly messages: ScriptListPanelMessages;
  readonly onDelete?: (id: string) => void;
  readonly onRename?: (id: string, newTitle: string) => void;
  readonly onExport?: (id: string) => void;
  /** スクリプト関連ドキュメントを表示するコールバック */
  readonly onShowDocs?: () => void;
  readonly testId?: string;
};

// ── Styles ─────────────────────────────────────────────────────

const listStyle: Readonly<CSSProperties> = {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
};

const itemStyle: Readonly<CSSProperties> = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "12px 16px",
  borderRadius: "8px",
  border: "1px solid var(--ui-border)",
  backgroundColor: "var(--ui-card)",
};

const itemInfoStyle: Readonly<CSSProperties> = {
  display: "flex",
  flexDirection: "column",
  gap: "2px",
  flex: 1,
  minWidth: 0,
};

const itemTitleStyle: Readonly<CSSProperties> = {
  fontWeight: 600,
  fontSize: "0.875rem",
  color: "var(--ui-foreground)",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const itemMetaStyle: Readonly<CSSProperties> = {
  fontSize: "0.75rem",
  color: "var(--ui-muted-foreground)",
};

const actionsStyle: Readonly<CSSProperties> = {
  display: "flex",
  gap: "4px",
  marginLeft: "8px",
  flexShrink: 0,
};

const emptyStyle: Readonly<CSSProperties> = {
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

const docsLinkButtonStyle: Readonly<CSSProperties> = {
  display: "inline-block",
  marginTop: "16px",
  paddingTop: "8px",
  paddingBottom: "8px",
  paddingLeft: "20px",
  paddingRight: "20px",
  fontSize: "13px",
  fontWeight: 600,
  borderRadius: "8px",
  cursor: "pointer",
  border: "1px solid var(--ui-primary)",
  backgroundColor: "transparent",
  color: "var(--ui-primary)",
  transitionProperty: "opacity",
  transitionDuration: "150ms",
};

const docsBannerStyle: Readonly<CSSProperties> = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  paddingTop: "10px",
  paddingBottom: "10px",
  paddingLeft: "14px",
  paddingRight: "14px",
  marginBottom: "12px",
  borderRadius: "8px",
  backgroundColor: "var(--ui-muted)",
  fontSize: "13px",
  color: "var(--ui-muted-foreground)",
};

const docsBannerLinkStyle: Readonly<CSSProperties> = {
  marginLeft: "auto",
  fontSize: "13px",
  fontWeight: 600,
  color: "var(--ui-primary)",
  cursor: "pointer",
  background: "none",
  border: "none",
  padding: 0,
  textDecoration: "underline",
  textUnderlineOffset: "3px",
  whiteSpace: "nowrap",
};

const renameInputStyle: Readonly<CSSProperties> = {
  fontWeight: 600,
  fontSize: "0.875rem",
  color: "var(--ui-foreground)",
  border: "1px solid var(--ui-primary)",
  borderRadius: "4px",
  padding: "2px 6px",
  outline: "none",
  width: "100%",
};

// ── Component ──────────────────────────────────────────────────

export function ScriptListPanel({
  items,
  messages,
  onDelete,
  onRename,
  onExport,
  onShowDocs,
  testId = "script-list-panel",
}: ScriptListPanelProps) {
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const handleStartRename = (id: string, currentTitle: string) => {
    setRenamingId(id);
    setRenameValue(currentTitle);
  };

  const handleConfirmRename = () => {
    if (renamingId !== null && renameValue.trim() !== "" && onRename) {
      onRename(renamingId, renameValue.trim());
    }
    setRenamingId(null);
    setRenameValue("");
  };

  const handleCancelRename = () => {
    setRenamingId(null);
    setRenameValue("");
  };

  if (items.length === 0) {
    return (
      <div style={emptyStyle} data-testid={`${testId satisfies string}-empty`}>
        <div style={emptyTitleStyle}>{messages.emptyTitle}</div>
        <p style={emptyDescriptionStyle}>{messages.emptyDescription}</p>
        {onShowDocs !== undefined && (
          <button
            type="button"
            className="hub-hover-opacity-90"
            style={docsLinkButtonStyle}
            data-testid={`${testId satisfies string}-docs-link`}
            onClick={onShowDocs}
          >
            {messages.docsLinkText}
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={listStyle} data-testid={testId}>
      {onShowDocs !== undefined && (
        <div
          style={docsBannerStyle}
          data-testid={`${testId satisfies string}-docs-banner`}
        >
          <span>{messages.emptyDescription}</span>
          <button
            type="button"
            style={docsBannerLinkStyle}
            data-testid={`${testId satisfies string}-docs-link`}
            onClick={onShowDocs}
          >
            {messages.docsLinkText}
          </button>
        </div>
      )}
      {items.map((item) => (
        <div
          key={item.id}
          style={itemStyle}
          data-testid={`script-item-${item.id satisfies string}`}
        >
          <div style={itemInfoStyle}>
            {renamingId === item.id ? (
              <input
                style={renameInputStyle}
                value={renameValue}
                data-testid={`script-rename-input-${item.id satisfies string}`}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleConfirmRename();
                  if (e.key === "Escape") handleCancelRename();
                }}
                onBlur={handleConfirmRename}
                autoFocus
              />
            ) : (
              <div
                style={itemTitleStyle}
                data-testid={`script-title-${item.id satisfies string}`}
              >
                {item.title}
              </div>
            )}
            <div style={itemMetaStyle}>{item.savedAtLabel}</div>
          </div>
          <div style={actionsStyle}>
            {onRename && renamingId !== item.id && (
              <UiButton
                size="small"
                data-testid={`script-rename-btn-${item.id satisfies string}`}
                onClick={() => handleStartRename(item.id, item.title)}
              >
                {messages.renameButton}
              </UiButton>
            )}
            {onExport && (
              <UiButton
                size="small"
                data-testid={`script-export-btn-${item.id satisfies string}`}
                onClick={() => onExport(item.id)}
              >
                {messages.exportButton}
              </UiButton>
            )}
            {onDelete && (
              <UiButton
                size="small"
                danger
                data-testid={`script-delete-btn-${item.id satisfies string}`}
                onClick={() => onDelete(item.id)}
              >
                {messages.deleteButton}
              </UiButton>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

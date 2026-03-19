/**
 * スクリプトライブラリパネル。
 *
 * ビルトインテンプレートと保存済みスクリプトを統合して
 * 検索・フィルタリング可能なライブラリUIを提供する。
 *
 * 変更時は scriptLibraryLogic.ts, ScriptLibraryPanel.stories.tsx も同期すること。
 */

import { useState, type CSSProperties } from "react";
import {
  initialScriptLibraryState,
  buildLibraryItems,
  filterLibraryItems,
  updateSearchQuery,
  updateFilterKind,
} from "./scriptLibraryLogic";
import type {
  LibraryItem,
  LibraryItemKind,
  ScriptLibraryState,
} from "./scriptLibraryLogic";
import type { ScriptTemplate } from "@/lib/script-runner/templates";
import type { DeductionStyle } from "@/lib/logic-core/deductionSystem";
import type { SavedScript } from "./savedScriptsLogic";
import {
  type ScriptEditorMessages,
  defaultScriptEditorMessages,
} from "./scriptEditorMessages";

// ── Props ─────────────────────────────────────────────────────

export type ScriptLibraryPanelProps = {
  readonly templates: readonly ScriptTemplate[];
  readonly savedScripts: readonly SavedScript[];
  readonly deductionStyle?: DeductionStyle;
  readonly onSelect: (item: LibraryItem) => void;
  readonly onClose: () => void;
  readonly onDeleteSaved?: (id: string) => void;
  /** i18nメッセージ（省略時は英語デフォルト） */
  readonly messages?: ScriptEditorMessages;
};

// ── Styles ────────────────────────────────────────────────────

const overlayStyle: Readonly<CSSProperties> = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0, 0, 0, 0.3)",
  zIndex: 100,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const panelStyle: Readonly<CSSProperties> = {
  width: "90%",
  maxWidth: "640px",
  maxHeight: "80%",
  display: "flex",
  flexDirection: "column",
  backgroundColor: "var(--color-surface, #ffffff)",
  border: "1px solid var(--color-border, #e2e8f0)",
  borderRadius: "12px",
  boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
  overflow: "hidden",
};

const headerStyle: Readonly<CSSProperties> = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "12px 16px",
  borderBottom: "1px solid var(--color-border, #e2e8f0)",
};

const headerTitleStyle: Readonly<CSSProperties> = {
  fontSize: "1rem",
  fontWeight: 700,
  color: "var(--color-text-primary, #171717)",
};

const closeBtnStyle: Readonly<CSSProperties> = {
  border: "none",
  background: "none",
  cursor: "pointer",
  fontSize: "1.25rem",
  color: "var(--color-text-secondary, #666666)",
  padding: "4px 8px",
  borderRadius: "4px",
  lineHeight: 1,
};

const searchBarStyle: Readonly<CSSProperties> = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  padding: "8px 16px",
  borderBottom: "1px solid var(--color-border, #e2e8f0)",
};

const searchInputStyle: Readonly<CSSProperties> = {
  flex: 1,
  padding: "6px 10px",
  border: "1px solid var(--color-border, #e2e8f0)",
  borderRadius: "6px",
  fontSize: "0.8125rem",
  backgroundColor: "var(--color-surface, #ffffff)",
  color: "var(--color-text-primary, #171717)",
  outline: "none",
};

const filterBtnBaseStyle: Readonly<CSSProperties> = {
  padding: "4px 10px",
  border: "1px solid var(--color-border, #e2e8f0)",
  borderRadius: "4px",
  fontSize: "var(--font-size-xs, 11px)",
  fontWeight: 500,
  cursor: "pointer",
  lineHeight: 1,
  whiteSpace: "nowrap",
  transition: "background-color 150ms, border-color 150ms",
};

const filterBtnActiveStyle: Readonly<CSSProperties> = {
  ...filterBtnBaseStyle,
  backgroundColor: "var(--color-accent, #555ab9)",
  color: "white",
  borderColor: "var(--color-accent, #555ab9)",
};

const filterBtnInactiveStyle: Readonly<CSSProperties> = {
  ...filterBtnBaseStyle,
  backgroundColor: "var(--color-surface, #ffffff)",
  color: "var(--color-text-primary, #171717)",
};

const listContainerStyle: Readonly<CSSProperties> = {
  flex: 1,
  overflowY: "auto",
  padding: "8px",
};

const itemStyle: Readonly<CSSProperties> = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  padding: "10px 12px",
  borderRadius: "8px",
  cursor: "pointer",
  transition: "background-color 150ms",
  border: "1px solid transparent",
};

const itemTitleStyle: Readonly<CSSProperties> = {
  fontSize: "0.875rem",
  fontWeight: 600,
  color: "var(--color-text-primary, #171717)",
  marginBottom: "2px",
};

const itemDescStyle: Readonly<CSSProperties> = {
  fontSize: "var(--font-size-xs, 11px)",
  color: "var(--color-text-secondary, #666666)",
  lineHeight: 1.4,
};

const kindBadgeStyle: Readonly<CSSProperties> = {
  display: "inline-flex",
  alignItems: "center",
  padding: "2px 6px",
  borderRadius: "3px",
  fontSize: "10px",
  fontWeight: 600,
  lineHeight: 1,
  whiteSpace: "nowrap",
  flexShrink: 0,
  marginLeft: "8px",
  marginTop: "2px",
};

const builtinBadgeStyle: Readonly<CSSProperties> = {
  ...kindBadgeStyle,
  backgroundColor: "var(--color-info-bg, #cce5ff)",
  color: "var(--color-info-text, #004085)",
};

const savedBadgeStyle: Readonly<CSSProperties> = {
  ...kindBadgeStyle,
  backgroundColor: "var(--color-success-bg, #d4edda)",
  color: "var(--color-success-text, #155724)",
};

const emptyStyle: Readonly<CSSProperties> = {
  textAlign: "center",
  padding: "40px 20px",
  color: "var(--color-text-secondary, #666666)",
  fontSize: "0.875rem",
};

const deleteBtnStyle: Readonly<CSSProperties> = {
  border: "none",
  background: "none",
  cursor: "pointer",
  fontSize: "0.75rem",
  color: "var(--color-text-secondary, #666666)",
  padding: "2px 6px",
  borderRadius: "3px",
  lineHeight: 1,
  transition: "background-color 150ms, color 150ms",
  flexShrink: 0,
  marginLeft: "4px",
  marginTop: "2px",
};

// ── Filter buttons config ─────────────────────────────────────

const FILTER_OPTIONS: readonly {
  readonly kind: LibraryItemKind | "all";
  readonly label: string;
}[] = [
  { kind: "all", label: "All" },
  { kind: "builtin", label: "Builtin" },
  { kind: "saved", label: "Saved" },
];

// ── Component ─────────────────────────────────────────────────

export function ScriptLibraryPanel({
  templates,
  savedScripts,
  deductionStyle,
  onSelect,
  onClose,
  onDeleteSaved,
  messages: msg = defaultScriptEditorMessages,
}: ScriptLibraryPanelProps) {
  const [state, setState] = useState<ScriptLibraryState>(
    initialScriptLibraryState,
  );

  const allItems = buildLibraryItems(templates, savedScripts, deductionStyle);
  const filteredItems = filterLibraryItems(allItems, state);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setState((prev) => updateSearchQuery(prev, e.target.value));
  };

  const handleFilterKind = (kind: LibraryItemKind | "all") => {
    setState((prev) => updateFilterKind(prev, kind));
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      style={overlayStyle}
      data-testid="script-library-overlay"
      onClick={handleOverlayClick}
    >
      <div style={panelStyle} data-testid="script-library-panel">
        {/* Header */}
        <div style={headerStyle}>
          <span style={headerTitleStyle}>{msg.scriptLibraryTitle}</span>
          <button
            type="button"
            style={closeBtnStyle}
            onClick={onClose}
            data-testid="script-library-close"
          >
            ×
          </button>
        </div>

        {/* Search + Filter */}
        <div style={searchBarStyle}>
          <input
            type="text"
            style={searchInputStyle}
            placeholder={msg.searchScripts}
            value={state.searchQuery}
            onChange={handleSearchChange}
            data-testid="script-library-search"
            autoFocus
          />
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.kind}
              type="button"
              style={
                state.filterKind === opt.kind
                  ? filterBtnActiveStyle
                  : filterBtnInactiveStyle
              }
              onClick={() => handleFilterKind(opt.kind)}
              data-testid={`script-library-filter-${opt.kind satisfies string}`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* List */}
        <div style={listContainerStyle} data-testid="script-library-list">
          {filteredItems.length === 0 ? (
            <div style={emptyStyle} data-testid="script-library-empty">
              {state.searchQuery.trim() !== ""
                ? "No scripts found."
                : "No scripts available."}
            </div>
          ) : (
            filteredItems.map((item) => (
              <div
                key={`${item.kind satisfies string}-${item.id satisfies string}`}
                style={itemStyle}
                className="script-library-item"
                onClick={() => onSelect(item)}
                data-testid={`script-library-item-${item.id satisfies string}`}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={itemTitleStyle}>{item.title}</div>
                  {item.description !== "" && (
                    <div style={itemDescStyle}>{item.description}</div>
                  )}
                </div>
                <div
                  style={{ display: "flex", alignItems: "flex-start", gap: 0 }}
                >
                  <span
                    style={
                      item.kind === "builtin"
                        ? builtinBadgeStyle
                        : savedBadgeStyle
                    }
                  >
                    {item.kind === "builtin" ? "Builtin" : "Saved"}
                  </span>
                  {item.kind === "saved" && onDeleteSaved && (
                    <button
                      type="button"
                      style={deleteBtnStyle}
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSaved(item.id);
                      }}
                      data-testid={`script-library-delete-${item.id satisfies string}`}
                      title="Delete"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

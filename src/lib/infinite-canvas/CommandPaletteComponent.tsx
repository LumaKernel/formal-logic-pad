/**
 * コマンドパレットUIコンポーネント。
 *
 * InfiniteCanvasのオーバーレイとして表示され、テキスト入力でコマンドを
 * フィルタリングし、キーボードまたはクリックで実行する。
 *
 * 変更時は CommandPaletteComponent.test.tsx, useCommandPalette.ts も同期すること。
 */

import { useCallback, useEffect, useRef } from "react";
import type { CommandItem, CommandPaletteState } from "./commandPalette";

// --- Types ---

export type CommandPaletteProps = {
  /** Whether the palette is visible */
  readonly isOpen: boolean;
  /** Current palette state */
  readonly paletteState: CommandPaletteState;
  /** Called when the search query changes */
  readonly onQueryChange: (query: string) => void;
  /** Called to select next item */
  readonly onNext: () => void;
  /** Called to select previous item */
  readonly onPrevious: () => void;
  /** Called to execute the selected item */
  readonly onExecute: () => void;
  /** Called to close the palette */
  readonly onClose: () => void;
};

// --- Styles ---

const overlayStyle: React.CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: "flex",
  justifyContent: "center",
  paddingTop: "60px",
  pointerEvents: "auto",
  zIndex: 20,
};

const panelStyle: React.CSSProperties = {
  width: "400px",
  maxHeight: "360px",
  display: "flex",
  flexDirection: "column",
  backgroundColor: "var(--color-zoom-controls-bg, rgba(255, 255, 255, 0.98))",
  borderRadius: "8px",
  border: "1px solid var(--color-zoom-controls-border, rgba(0, 0, 0, 0.15))",
  boxShadow: "0 4px 16px rgba(0, 0, 0, 0.15)",
  overflow: "hidden",
  transition:
    "background-color var(--theme-transition-duration, 0s) ease, border-color var(--theme-transition-duration, 0s) ease",
};

const inputStyle: React.CSSProperties = {
  border: "none",
  borderBottom:
    "1px solid var(--color-zoom-controls-border, rgba(0, 0, 0, 0.1))",
  padding: "12px 16px",
  fontSize: "14px",
  outline: "none",
  backgroundColor: "transparent",
  color: "var(--color-zoom-controls-text, #333)",
  width: "100%",
  boxSizing: "border-box",
  transition:
    "border-color var(--theme-transition-duration, 0s) ease, color var(--theme-transition-duration, 0s) ease",
};

const listStyle: React.CSSProperties = {
  overflowY: "auto",
  flex: 1,
  margin: 0,
  padding: "4px 0",
  listStyle: "none",
};

const itemBaseStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  padding: "8px 16px",
  cursor: "pointer",
  gap: "2px",
  transition:
    "background-color 0.1s ease, color var(--theme-transition-duration, 0s) ease",
};

const selectedItemStyle: React.CSSProperties = {
  backgroundColor: "var(--color-selection-bg, rgba(59, 130, 246, 0.12))",
};

const labelStyle: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: 500,
  color: "var(--color-zoom-controls-text, #333)",
  transition: "color var(--theme-transition-duration, 0s) ease",
};

const descriptionStyle: React.CSSProperties = {
  fontSize: "12px",
  color: "var(--color-text-secondary, #888)",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  transition: "color var(--theme-transition-duration, 0s) ease",
};

const categoryBadgeStyle: React.CSSProperties = {
  fontSize: "10px",
  color: "var(--color-text-secondary, #888)",
  backgroundColor: "var(--color-badge-bg, rgba(0, 0, 0, 0.06))",
  borderRadius: "3px",
  padding: "1px 5px",
  marginLeft: "8px",
  whiteSpace: "nowrap",
  transition:
    "background-color var(--theme-transition-duration, 0s) ease, color var(--theme-transition-duration, 0s) ease",
};

const emptyStyle: React.CSSProperties = {
  padding: "16px",
  textAlign: "center",
  fontSize: "13px",
  color: "var(--color-text-secondary, #888)",
  transition: "color var(--theme-transition-duration, 0s) ease",
};

// --- Component ---

function CommandPaletteItem({
  item,
  isSelected,
  onClick,
  onPointerEnter,
}: {
  readonly item: CommandItem;
  readonly isSelected: boolean;
  readonly onClick: () => void;
  readonly onPointerEnter: () => void;
}) {
  const itemRef = useRef<HTMLLIElement>(null);

  // Scroll selected item into view (scrollIntoView may not exist in JSDOM)
  useEffect(() => {
    if (isSelected && typeof itemRef.current?.scrollIntoView === "function") {
      itemRef.current.scrollIntoView({ block: "nearest" });
    }
  }, [isSelected]);

  return (
    <li
      ref={itemRef}
      data-testid={`command-palette-item-${item.id satisfies string}`}
      role="option"
      aria-selected={isSelected}
      style={{
        ...itemBaseStyle,
        ...(isSelected ? selectedItemStyle : {}),
      }}
      onClick={onClick}
      onPointerEnter={onPointerEnter}
    >
      <div style={{ display: "flex", alignItems: "center" }}>
        <span style={labelStyle}>{item.label}</span>
        <span style={categoryBadgeStyle}>{item.category}</span>
      </div>
      <span style={descriptionStyle}>{item.description}</span>
    </li>
  );
}

/** Command palette overlay for InfiniteCanvas.
 *  Provides text search, keyboard navigation (ArrowUp/Down/Enter/Escape),
 *  and click selection of command items. */
export function CommandPaletteComponent({
  isOpen,
  paletteState,
  onQueryChange,
  onNext,
  onPrevious,
  onExecute,
  onClose,
}: CommandPaletteProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input when palette opens
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "Enter") {
        e.preventDefault();
        onExecute();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        onNext();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        onPrevious();
      }
    },
    [onClose, onExecute, onNext, onPrevious],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onQueryChange(e.target.value);
    },
    [onQueryChange],
  );

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose],
  );

  if (!isOpen) return null;

  return (
    <div
      data-testid="command-palette-overlay"
      style={overlayStyle}
      onClick={handleOverlayClick}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div data-testid="command-palette-panel" style={panelStyle}>
        {/* Search input */}
        <input
          ref={inputRef}
          data-testid="command-palette-input"
          type="text"
          value={paletteState.query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a command..."
          style={inputStyle}
          aria-label="Command search"
          role="combobox"
          aria-expanded={true}
          aria-controls="command-palette-list"
          /* v8 ignore start -- selectedIndex < 0 path: empty palette has no active descendant */
          aria-activedescendant={
            paletteState.selectedIndex >= 0
              ? `command-palette-item-${(paletteState.filteredItems[paletteState.selectedIndex]?.id ?? "") satisfies string}`
              : undefined
          }
          /* v8 ignore stop */
        />

        {/* Results list */}
        <ul
          id="command-palette-list"
          data-testid="command-palette-list"
          role="listbox"
          style={listStyle}
        >
          {paletteState.filteredItems.length === 0 ? (
            <li style={emptyStyle}>
              {paletteState.query === ""
                ? "No commands available"
                : "No matching commands"}
            </li>
          ) : (
            paletteState.filteredItems.map((item, index) => (
              <CommandPaletteItem
                key={item.id}
                item={item}
                isSelected={index === paletteState.selectedIndex}
                onClick={() => {
                  onQueryChange(paletteState.query);
                  onExecute();
                }}
                onPointerEnter={() => {
                  // Intentionally not changing selection on hover to keep keyboard-driven UX simple
                }}
              />
            ))
          )}
        </ul>
      </div>
    </div>
  );
}

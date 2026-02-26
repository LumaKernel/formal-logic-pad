import { useCallback, useEffect, useRef } from "react";
import type { SearchResult } from "./nodeSearch";

// --- Types ---

export interface NodeSearchProps {
  /** Whether the search panel is visible */
  readonly isOpen: boolean;
  /** Current search result */
  readonly searchResult: SearchResult;
  /** Called when the search query changes */
  readonly onQueryChange: (query: string) => void;
  /** Called to go to next match */
  readonly onNext: () => void;
  /** Called to go to previous match */
  readonly onPrevious: () => void;
  /** Called to close the search panel */
  readonly onClose: () => void;
}

// --- Styles ---

const panelStyle: React.CSSProperties = {
  position: "absolute",
  top: "8px",
  right: "8px",
  display: "flex",
  alignItems: "center",
  gap: "4px",
  backgroundColor: "var(--color-zoom-controls-bg, rgba(255, 255, 255, 0.95))",
  borderRadius: "6px",
  border: "1px solid var(--color-zoom-controls-border, rgba(0, 0, 0, 0.15))",
  padding: "4px 6px",
  pointerEvents: "auto",
  zIndex: 10,
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
  transition:
    "background-color var(--theme-transition-duration, 0s) ease, border-color var(--theme-transition-duration, 0s) ease",
  userSelect: "none",
};

const inputStyle: React.CSSProperties = {
  border: "1px solid var(--color-zoom-controls-border, rgba(0, 0, 0, 0.15))",
  borderRadius: "4px",
  padding: "4px 8px",
  fontSize: "13px",
  outline: "none",
  width: "180px",
  backgroundColor: "var(--color-input-bg, #fff)",
  color: "var(--color-zoom-controls-text, #333)",
  transition:
    "background-color var(--theme-transition-duration, 0s) ease, border-color var(--theme-transition-duration, 0s) ease, color var(--theme-transition-duration, 0s) ease",
};

const buttonStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "28px",
  height: "28px",
  border: "none",
  borderRadius: "4px",
  backgroundColor: "transparent",
  cursor: "pointer",
  color: "var(--color-zoom-controls-text, #333)",
  fontSize: "14px",
  lineHeight: 1,
  padding: 0,
  transition:
    "background-color 0.15s ease, color var(--theme-transition-duration, 0s) ease",
};

const disabledButtonStyle: React.CSSProperties = {
  opacity: 0.3,
  cursor: "default",
};

const matchCountStyle: React.CSSProperties = {
  fontSize: "12px",
  color: "var(--color-zoom-controls-text, #333)",
  whiteSpace: "nowrap",
  minWidth: "40px",
  textAlign: "center",
  fontVariantNumeric: "tabular-nums",
  transition: "color var(--theme-transition-duration, 0s) ease",
};

// --- Helpers ---

/** Format match count label. Pure function. */
export function formatMatchCount(currentIndex: number, total: number): string {
  if (total === 0) {
    return "0/0";
  }
  return `${String(currentIndex + 1) satisfies string}/${String(total) satisfies string}`;
}

// --- Component ---

/** Node search panel overlay for InfiniteCanvas.
 *  Provides text input, match navigation, and close button. */
export function NodeSearchComponent({
  isOpen,
  searchResult,
  onQueryChange,
  onNext,
  onPrevious,
  onClose,
}: NodeSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input when panel opens
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
        if (e.shiftKey) {
          onPrevious();
        } else {
          onNext();
        }
      }
    },
    [onClose, onNext, onPrevious],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onQueryChange(e.target.value);
    },
    [onQueryChange],
  );

  if (!isOpen) return null;

  const hasMatches = searchResult.matches.length > 0;
  const hasQuery = searchResult.query.length > 0;

  return (
    <div
      data-testid="node-search-panel"
      style={panelStyle}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* Search input */}
      <input
        ref={inputRef}
        data-testid="node-search-input"
        type="text"
        value={searchResult.query}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder="Search nodes..."
        style={inputStyle}
        aria-label="Search nodes"
      />

      {/* Match count */}
      {hasQuery && (
        <span data-testid="node-search-count" style={matchCountStyle}>
          {formatMatchCount(
            searchResult.currentIndex,
            searchResult.matches.length,
          )}
        </span>
      )}

      {/* Previous button */}
      <button
        data-testid="node-search-prev"
        type="button"
        style={{
          ...buttonStyle,
          ...(!hasMatches ? disabledButtonStyle : {}),
        }}
        disabled={!hasMatches}
        onClick={onPrevious}
        aria-label="Previous match"
        title="Previous match (Shift+Enter)"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M3 8.5L7 4.5L11 8.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Next button */}
      <button
        data-testid="node-search-next"
        type="button"
        style={{
          ...buttonStyle,
          ...(!hasMatches ? disabledButtonStyle : {}),
        }}
        disabled={!hasMatches}
        onClick={onNext}
        aria-label="Next match"
        title="Next match (Enter)"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M3 5.5L7 9.5L11 5.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Close button */}
      <button
        data-testid="node-search-close"
        type="button"
        style={buttonStyle}
        onClick={onClose}
        aria-label="Close search"
        title="Close search (Escape)"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M3 3L11 11M11 3L3 11"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
}

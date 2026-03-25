/**
 * 入力補完候補ポップアップコンポーネント。
 *
 * 候補リストを表示し、キーボード/マウスで選択可能。
 * FormulaInput/TermInput の入力欄に統合して使用。
 *
 * 変更時は CompletionPopup.test.tsx, inputCompletion.ts, FormulaInput.tsx, TermInput.tsx も同期すること。
 */

import type { CSSProperties } from "react";
import { useCallback, useEffect, useMemo, useRef } from "react";
import type { CompletionCandidate } from "./inputCompletion";

// --- Props ---

export interface CompletionPopupProps {
  /** 表示する候補リスト */
  readonly candidates: readonly CompletionCandidate[];
  /** 現在選択中のインデックス */
  readonly selectedIndex: number;
  /** 候補選択時のコールバック */
  readonly onSelect: (candidate: CompletionCandidate) => void;
  /** 選択インデックス変更時のコールバック */
  readonly onSelectedIndexChange: (index: number) => void;
  /** ポップアップを閉じるコールバック */
  readonly onClose: () => void;
  /** data-testid */
  readonly testId?: string;
}

// --- スタイル ---

const popupStyle: CSSProperties = {
  position: "absolute",
  zIndex: 10,
  top: "100%",
  left: 0,
  marginTop: 4,
  minWidth: 200,
  maxHeight: 200,
  overflowY: "auto",
  backgroundColor: "var(--color-surface, #ffffff)",
  color: "var(--color-text-primary, #171717)",
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "var(--color-border, #e2e8f0)",
  borderRadius: 6,
  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
  padding: "4px 0",
  fontFamily: "var(--font-mono)",
  fontSize: "0.9em",
};

const itemBaseStyle: CSSProperties = {
  padding: "4px 12px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const itemSelectedStyle: CSSProperties = {
  ...itemBaseStyle,
  backgroundColor: "var(--color-surface-selected, #ebf8ff)",
};

const categoryBadgeStyle: CSSProperties = {
  fontSize: "0.75em",
  padding: "1px 4px",
  borderRadius: 3,
  backgroundColor: "var(--color-bg-secondary, #edf2f7)",
  color: "var(--color-text-secondary, #4a5568)",
};

// --- コンポーネント ---

export function CompletionPopup({
  candidates,
  selectedIndex,
  onSelect,
  onSelectedIndexChange,
  onClose,
  testId,
}: CompletionPopupProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLDivElement>(null);

  // 選択中アイテムをスクロールに追従
  useEffect(() => {
    const el = selectedRef.current;
    if (el && typeof el.scrollIntoView === "function") {
      el.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      /* v8 ignore start -- defensive guard: component renders null when empty */
      if (candidates.length === 0) return;
      /* v8 ignore stop */

      switch (e.key) {
        case "ArrowDown": {
          e.preventDefault();
          const next = (selectedIndex + 1) % candidates.length;
          onSelectedIndexChange(next);
          break;
        }
        case "ArrowUp": {
          e.preventDefault();
          const prev =
            (selectedIndex - 1 + candidates.length) % candidates.length;
          onSelectedIndexChange(prev);
          break;
        }
        case "Tab":
        case "Enter": {
          e.preventDefault();
          const candidate = candidates[selectedIndex];
          /* v8 ignore start -- defensive: selectedIndex should always be in bounds */
          if (candidate) {
            onSelect(candidate);
          }
          /* v8 ignore stop */
          break;
        }
        case "Escape": {
          e.preventDefault();
          onClose();
          break;
        }
        default:
          break;
      }
    },
    [candidates, selectedIndex, onSelect, onSelectedIndexChange, onClose],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  const categoryLabel = useMemo(
    () =>
      (category: CompletionCandidate["category"]): string => {
        switch (category) {
          case "operator":
            return "演算子";
          case "greek":
            return "文字";
          case "quantifier":
            return "量化子";
        }
      },
    [],
  );

  if (candidates.length === 0) {
    return null;
  }

  return (
    <div ref={listRef} style={popupStyle} role="listbox" data-testid={testId}>
      {candidates.map((candidate, i) => (
        <div
          key={`${candidate.trigger satisfies string}-${candidate.insertText satisfies string}`}
          ref={i === selectedIndex ? selectedRef : undefined}
          style={i === selectedIndex ? itemSelectedStyle : itemBaseStyle}
          role="option"
          aria-selected={i === selectedIndex}
          data-testid={
            testId
              ? `${testId satisfies string}-item-${`${i satisfies number}` satisfies string}`
              : undefined
          }
          onMouseDown={(e) => {
            e.preventDefault(); // input からフォーカスを奪わない
            onSelect(candidate);
          }}
          onMouseEnter={() => {
            onSelectedIndexChange(i);
          }}
        >
          <span>{candidate.label}</span>
          <span style={categoryBadgeStyle}>
            {categoryLabel(candidate.category)}
          </span>
        </div>
      ))}
    </div>
  );
}

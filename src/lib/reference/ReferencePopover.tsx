/**
 * リファレンスポップオーバーコンポーネント。
 *
 * (?) マークのクリックで短い解説（summary + 形式表記）を表示する。
 * 「詳しく見る」ボタンで詳細モーダルへ遷移。
 *
 * 変更時は ReferencePopover.test.tsx, ReferencePopover.stories.tsx も同期すること。
 */

import type { CSSProperties } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import katex from "katex";
import type { Locale, ReferenceEntry } from "./referenceEntry";
import { buildPopoverData } from "./referenceUILogic";
import { InlineMarkdown } from "./InlineMarkdown";

// --- Props ---

export interface ReferencePopoverProps {
  /** 表示するリファレンスエントリ */
  readonly entry: ReferenceEntry;
  /** ロケール */
  readonly locale: Locale;
  /** 詳細モーダルを開くコールバック（省略時は「詳しく見る」非表示） */
  readonly onOpenDetail?: (entryId: string) => void;
  /** トリガー要素のスタイル */
  readonly triggerStyle?: CSSProperties;
  /** data-testid */
  readonly testId?: string;
}

// --- スタイル ---

const triggerButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "18px",
  height: "18px",
  borderRadius: "50%",
  border: "1px solid var(--color-border, #e2e8f0)",
  background: "var(--color-surface, #ffffff)",
  color: "var(--color-text-secondary, #666666)",
  fontSize: "var(--font-size-xs, 11px)",
  fontFamily: "var(--font-ui)",
  cursor: "pointer",
  lineHeight: 1,
  padding: 0,
  verticalAlign: "middle",
  transition: "background-color 0.1s ease, color 0.1s ease",
};

const popoverStyle: CSSProperties = {
  position: "absolute",
  zIndex: 1000,
  width: "320px",
  maxWidth: "90vw",
  backgroundColor: "var(--color-surface, #ffffff)",
  border: "1px solid var(--color-border, #e2e8f0)",
  borderRadius: "8px",
  boxShadow: "0 4px 16px rgba(0, 0, 0, 0.12)",
  padding: "12px 16px",
  fontFamily: "var(--font-ui)",
  fontSize: "var(--font-size-sm, 13px)",
  color: "var(--color-text-primary, #171717)",
};

const categoryBadgeStyle: CSSProperties = {
  display: "inline-block",
  fontSize: "var(--font-size-xs, 11px)",
  color: "var(--color-badge-text, #718096)",
  backgroundColor: "var(--color-badge-bg, #e8eaf0)",
  borderRadius: "4px",
  padding: "2px 6px",
  marginBottom: "4px",
};

const titleStyle: CSSProperties = {
  fontSize: "var(--font-size-base, 14px)",
  fontWeight: 600,
  margin: "4px 0",
  color: "var(--color-text-primary, #171717)",
};

const summaryStyle: CSSProperties = {
  fontSize: "var(--font-size-sm, 13px)",
  color: "var(--color-text-secondary, #666666)",
  margin: "4px 0 8px",
  lineHeight: 1.5,
};

const formulaStyle: CSSProperties = {
  margin: "8px 0",
  padding: "6px 10px",
  backgroundColor: "var(--color-bg-secondary, #fafafa)",
  borderRadius: "4px",
  textAlign: "center",
  overflow: "auto",
};

const detailButtonStyle: CSSProperties = {
  display: "inline-block",
  fontSize: "var(--font-size-xs, 11px)",
  color: "var(--color-node-axiom, #5b8bd9)",
  background: "none",
  border: "none",
  cursor: "pointer",
  padding: "4px 0 0",
  fontFamily: "var(--font-ui)",
  textDecoration: "underline",
};

// --- コンポーネント ---

export function ReferencePopover({
  entry,
  locale,
  onOpenDetail,
  triggerStyle: customTriggerStyle,
  testId,
}: ReferencePopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const data = useMemo(() => buildPopoverData(entry, locale), [entry, locale]);

  const formulaHtml = useMemo(() => {
    if (data.formalNotation === undefined) return undefined;
    return katex.renderToString(data.formalNotation, {
      displayMode: false,
      throwOnError: false,
      output: "htmlAndMathml",
    });
  }, [data.formalNotation]);

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleDetailClick = useCallback(() => {
    setIsOpen(false);
    onOpenDetail?.(entry.id);
  }, [entry.id, onOpenDetail]);

  // クリック外で閉じる
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e: MouseEvent) => {
      if (
        containerRef.current !== null &&
        !containerRef.current.contains(e.target as Node)
      ) {
        handleClose();
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen, handleClose]);

  // Escapeキーで閉じる
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      /* v8 ignore start -- other keys are ignored; only Escape triggers close */
      if (e.key === "Escape") {
        handleClose();
      }
      /* v8 ignore stop */
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, handleClose]);

  return (
    <span
      ref={containerRef}
      style={{ position: "relative", display: "inline-block" }}
      data-testid={testId}
    >
      <button
        type="button"
        onClick={handleToggle}
        style={{ ...triggerButtonStyle, ...customTriggerStyle }}
        aria-label={`${data.title satisfies string} ${(locale === "ja" ? "のリファレンスを表示" : "reference") satisfies string}`}
        aria-expanded={isOpen}
        data-testid={
          testId !== undefined
            ? `${testId satisfies string}-trigger`
            : undefined
        }
      >
        ?
      </button>

      {isOpen && (
        <div
          ref={popoverRef}
          role="tooltip"
          style={popoverStyle}
          data-testid={
            testId !== undefined
              ? `${testId satisfies string}-popover`
              : undefined
          }
        >
          <div style={categoryBadgeStyle}>{data.categoryLabel}</div>
          <div style={titleStyle}>{data.title}</div>
          <div style={summaryStyle}>
            <InlineMarkdown text={data.summary} />
          </div>
          {formulaHtml !== undefined && (
            <div
              style={formulaStyle}
              dangerouslySetInnerHTML={{ __html: formulaHtml }}
              data-testid={
                testId !== undefined
                  ? `${testId satisfies string}-formula`
                  : undefined
              }
            />
          )}
          {data.hasDetail && onOpenDetail !== undefined && (
            <button
              type="button"
              style={detailButtonStyle}
              onClick={handleDetailClick}
              /* v8 ignore start -- testId is always provided in test contexts */
              data-testid={
                testId !== undefined
                  ? `${testId satisfies string}-detail-btn`
                  : undefined
              }
              /* v8 ignore stop */
            >
              {locale === "ja" ? "詳しく見る →" : "See details →"}
            </button>
          )}
        </div>
      )}
    </span>
  );
}

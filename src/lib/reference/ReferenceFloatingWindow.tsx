/**
 * リファレンスフローティングウィンドウコンポーネント。
 *
 * 証明作業中にリファレンスを参照できるドラッグ可能なフローティングパネル。
 * ReferenceModal と同じ内容を表示するが、ワークスペースを遮らない。
 *
 * 変更時は ReferenceFloatingWindow.test.tsx, ReferenceFloatingWindow.stories.tsx も同期すること。
 */

import type { CSSProperties } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import katex from "katex";
import type { Locale, ReferenceEntry } from "./referenceEntry";
import { buildModalData } from "./referenceUILogic";
import { InlineMarkdown } from "./InlineMarkdown";
import { buildReferenceViewerUrl } from "./referenceViewerLogic";
import type {
  DragStartInfo,
  ResizeStartInfo,
  WindowRect,
} from "./floatingWindowLogic";
import {
  computeDragPosition,
  computeInitialRect,
  computeResizeSize,
  constrainToViewport,
} from "./floatingWindowLogic";
import type { RelatedQuestInfo } from "./ReferenceModal";

// --- Props ---

export interface ReferenceFloatingWindowProps {
  /** 表示するリファレンスエントリ */
  readonly entry: ReferenceEntry;
  /** 全エントリ（関連エントリ解決用） */
  readonly allEntries: readonly ReferenceEntry[];
  /** ロケール */
  readonly locale: Locale;
  /** 閉じるコールバック */
  readonly onClose: () => void;
  /** 関連エントリへのナビゲーション */
  readonly onNavigate?: (entryId: string) => void;
  /** 関連クエスト（IDとタイトルの解決済みリスト） */
  readonly relatedQuests?: readonly RelatedQuestInfo[];
  /** クエスト開始コールバック */
  readonly onStartQuest?: (questId: string) => void;
  /** data-testid */
  readonly testId?: string;
}

// --- スタイル ---

const windowStyle: CSSProperties = {
  position: "fixed",
  zIndex: 1500,
  backgroundColor: "var(--color-surface, #ffffff)",
  borderRadius: "8px",
  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.18)",
  border: "1px solid var(--color-border, #e2e8f0)",
  display: "flex",
  flexDirection: "column",
  fontFamily: "var(--font-ui)",
  fontSize: "var(--font-size-base, 14px)",
  color: "var(--color-text-primary, #171717)",
  overflow: "hidden",
};

const titleBarStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "8px 12px",
  borderBottom: "1px solid var(--color-border, #e2e8f0)",
  background: "var(--color-bg-secondary, #fafafa)",
  cursor: "grab",
  userSelect: "none",
  flexShrink: 0,
  borderRadius: "8px 8px 0 0",
};

const titleBarTitleStyle: CSSProperties = {
  fontSize: "var(--font-size-sm, 13px)",
  fontWeight: 600,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  flex: 1,
  marginRight: "8px",
};

const titleBarButtonsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "2px",
  flexShrink: 0,
};

const titleBarButtonStyle: CSSProperties = {
  background: "none",
  border: "none",
  fontSize: "var(--font-size-sm, 13px)",
  color: "var(--color-text-secondary, #666666)",
  cursor: "pointer",
  padding: "2px 6px",
  borderRadius: "4px",
  lineHeight: 1,
  fontFamily: "var(--font-ui)",
};

const titleBarLinkStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "none",
  border: "none",
  fontSize: "var(--font-size-sm, 13px)",
  color: "var(--color-text-secondary, #666666)",
  cursor: "pointer",
  padding: "2px 6px",
  borderRadius: "4px",
  lineHeight: 1,
  textDecoration: "none",
};

const bodyStyle: CSSProperties = {
  padding: "12px 16px",
  overflow: "auto",
  flex: 1,
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

const summaryStyle: CSSProperties = {
  color: "var(--color-text-secondary, #666666)",
  fontSize: "var(--font-size-sm, 13px)",
  marginBottom: "12px",
  lineHeight: 1.5,
};

const formulaStyle: CSSProperties = {
  margin: "8px 0 12px",
  padding: "8px 12px",
  backgroundColor: "var(--color-bg-secondary, #fafafa)",
  borderRadius: "6px",
  textAlign: "center",
  overflow: "auto",
};

const paragraphStyle: CSSProperties = {
  margin: "0 0 10px",
  lineHeight: 1.6,
  fontSize: "var(--font-size-sm, 13px)",
  color: "var(--color-text-primary, #171717)",
};

const sectionTitleStyle: CSSProperties = {
  fontSize: "var(--font-size-xs, 11px)",
  fontWeight: 600,
  color: "var(--color-text-secondary, #666666)",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  marginTop: "16px",
  marginBottom: "6px",
};

const relatedItemStyle: CSSProperties = {
  display: "inline-block",
  fontSize: "var(--font-size-xs, 11px)",
  color: "var(--color-node-axiom, #5b8bd9)",
  background: "none",
  border: "1px solid var(--color-border, #e2e8f0)",
  borderRadius: "4px",
  padding: "3px 6px",
  margin: "0 4px 4px 0",
  cursor: "pointer",
  fontFamily: "var(--font-ui)",
  transition: "background-color 0.1s ease",
};

const externalLinkStyle: CSSProperties = {
  display: "block",
  fontSize: "var(--font-size-xs, 11px)",
  color: "var(--color-node-axiom, #5b8bd9)",
  textDecoration: "none",
  padding: "3px 0",
};

const languageTagStyle: CSSProperties = {
  display: "inline-block",
  fontSize: "10px",
  color: "var(--color-text-secondary, #6b7280)",
  border: "1px solid var(--color-border, #e2e8f0)",
  borderRadius: "3px",
  padding: "0 3px",
  marginLeft: "4px",
  verticalAlign: "middle",
  lineHeight: "1.4",
};

const questButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "4px",
  fontSize: "var(--font-size-xs, 11px)",
  color: "var(--color-accent, #555ab9)",
  background: "none",
  border: "1px solid var(--color-accent, #555ab9)",
  borderRadius: "4px",
  padding: "3px 8px",
  margin: "0 4px 4px 0",
  cursor: "pointer",
  fontFamily: "var(--font-ui)",
  transition: "background-color 0.1s ease",
};

const resizeHandleStyle: CSSProperties = {
  position: "absolute",
  right: 0,
  bottom: 0,
  width: "16px",
  height: "16px",
  cursor: "se-resize",
  zIndex: 1,
};

const resizeHandleSvgStyle: CSSProperties = {
  position: "absolute",
  right: "3px",
  bottom: "3px",
  width: "10px",
  height: "10px",
  opacity: 0.3,
};

// --- コンポーネント ---

export function ReferenceFloatingWindow({
  entry,
  allEntries,
  locale,
  onClose,
  onNavigate,
  relatedQuests,
  onStartQuest,
  testId,
}: ReferenceFloatingWindowProps) {
  const [rect, setRect] = useState<WindowRect>(() =>
    computeInitialRect({
      width: typeof window !== "undefined" ? window.innerWidth : 1024,
      height: typeof window !== "undefined" ? window.innerHeight : 768,
    }),
  );
  const dragRef = useRef<DragStartInfo | null>(null);
  const resizeRef = useRef<ResizeStartInfo | null>(null);
  const rectRef = useRef(rect);
  useEffect(() => {
    rectRef.current = rect;
  }, [rect]);

  const data = useMemo(
    () => buildModalData(entry, allEntries, locale),
    [entry, allEntries, locale],
  );

  const formulaHtmlItems = useMemo(() => {
    if (data.formalNotation === undefined) return undefined;
    const notations =
      typeof data.formalNotation === "string"
        ? [data.formalNotation]
        : data.formalNotation;
    return notations.map((notation) =>
      katex.renderToString(notation, {
        displayMode: true,
        throwOnError: false,
        output: "htmlAndMathml",
      }),
    );
  }, [data.formalNotation]);

  const handleRelatedClick = useCallback(
    (entryId: string) => {
      onNavigate?.(entryId);
    },
    [onNavigate],
  );

  // --- ドラッグ ---
  // ドラッグ・リサイズのイベントハンドラは不純（DOM API依存）。
  // 計算ロジックは floatingWindowLogic.ts に分離済み・100%テスト済み。
  /* v8 ignore start -- pointer event handlers: impure glue code, logic tested in floatingWindowLogic.test.ts */
  const handleTitleBarPointerDown = useCallback((e: React.PointerEvent) => {
    // ボタンクリック等はドラッグ対象外
    if ((e.target as HTMLElement).closest("button, a")) return;
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = {
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startWindowX: rectRef.current.x,
      startWindowY: rectRef.current.y,
    };
  }, []);

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (dragRef.current !== null) {
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight,
      };
      const pos = computeDragPosition(
        dragRef.current,
        e.clientX,
        e.clientY,
        rectRef.current.width,
        rectRef.current.height,
        viewport,
      );
      setRect((prev) => ({ ...prev, x: pos.x, y: pos.y }));
    }
    if (resizeRef.current !== null) {
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight,
      };
      const size = computeResizeSize(
        resizeRef.current,
        e.clientX,
        e.clientY,
        rectRef.current.x,
        rectRef.current.y,
        viewport,
      );
      setRect((prev) => ({ ...prev, width: size.width, height: size.height }));
    }
  }, []);

  const handlePointerUp = useCallback(() => {
    dragRef.current = null;
    resizeRef.current = null;
  }, []);

  useEffect(() => {
    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", handlePointerUp);
    return () => {
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
    };
  }, [handlePointerMove, handlePointerUp]);

  // --- リサイズ ---
  const handleResizePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    resizeRef.current = {
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startWidth: rectRef.current.width,
      startHeight: rectRef.current.height,
    };
  }, []);

  // --- ビューポートリサイズ ---
  useEffect(() => {
    const handleResize = () => {
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight,
      };
      setRect((prev) => constrainToViewport(prev, viewport));
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);
  /* v8 ignore stop */

  const windowContent = (
    <div
      role="dialog"
      aria-label={data.title}
      style={{
        ...windowStyle,
        left: rect.x,
        top: rect.y,
        width: rect.width,
        height: rect.height,
      }}
      data-testid={testId}
    >
      {/* タイトルバー */}
      <div
        style={titleBarStyle}
        onPointerDown={handleTitleBarPointerDown}
        data-testid={
          testId !== undefined
            ? `${testId satisfies string}-titlebar`
            : undefined
        }
      >
        <div style={titleBarTitleStyle}>{data.title}</div>
        <div style={titleBarButtonsStyle}>
          <a
            href={buildReferenceViewerUrl(entry.id)}
            target="_blank"
            rel="noopener noreferrer"
            style={titleBarLinkStyle}
            aria-label={
              locale === "ja" ? "新しいタブで開く" : "Open in new tab"
            }
            data-testid={
              testId !== undefined
                ? `${testId satisfies string}-open-new-tab`
                : undefined
            }
          >
            ↗
          </a>
          <button
            type="button"
            style={titleBarButtonStyle}
            onClick={onClose}
            aria-label={locale === "ja" ? "閉じる" : "Close"}
            data-testid={
              testId !== undefined
                ? `${testId satisfies string}-close`
                : undefined
            }
          >
            ✕
          </button>
        </div>
      </div>

      {/* 本体 */}
      <div style={bodyStyle}>
        <div style={categoryBadgeStyle}>{data.categoryLabel}</div>
        {/* 要約 */}
        <div style={summaryStyle}>
          <InlineMarkdown text={data.summary} />
        </div>

        {/* 形式表記 */}
        {formulaHtmlItems !== undefined &&
          formulaHtmlItems.map((html, i) => (
            <div
              key={`formula-${String(i) satisfies string}`}
              style={formulaStyle}
              dangerouslySetInnerHTML={{ __html: html }}
              data-testid={
                testId !== undefined
                  ? `${testId satisfies string}-formula${(formulaHtmlItems.length > 1 ? `-${String(i) satisfies string}` : "") satisfies string}`
                  : undefined
              }
            />
          ))}

        {/* 本文パラグラフ */}
        {data.bodyParagraphs.map((paragraph, i) => (
          <p key={`p-${String(i) satisfies string}`} style={paragraphStyle}>
            <InlineMarkdown text={paragraph} />
          </p>
        ))}

        {/* 関連エントリ */}
        {data.relatedEntries.length > 0 && (
          <div>
            <div style={sectionTitleStyle}>
              {locale === "ja" ? "関連項目" : "Related"}
            </div>
            <div>
              {data.relatedEntries.map((related) => (
                <button
                  key={related.id}
                  type="button"
                  style={relatedItemStyle}
                  onClick={() => {
                    handleRelatedClick(related.id);
                  }}
                  data-testid={
                    testId !== undefined
                      ? `${testId satisfies string}-related-${related.id satisfies string}`
                      : undefined
                  }
                >
                  {related.title}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 関連クエスト */}
        {relatedQuests !== undefined &&
          relatedQuests.length > 0 &&
          onStartQuest !== undefined && (
            <div>
              <div style={sectionTitleStyle}>
                {locale === "ja" ? "関連クエスト" : "Related Quests"}
              </div>
              <div>
                {relatedQuests.map((quest) => (
                  <button
                    key={quest.id}
                    type="button"
                    style={questButtonStyle}
                    onClick={() => {
                      onStartQuest(quest.id);
                    }}
                    data-testid={
                      /* v8 ignore start -- testId条件分岐はテスト用属性 */
                      testId !== undefined
                        ? `${testId satisfies string}-quest-${quest.id satisfies string}`
                        : undefined
                      /* v8 ignore stop */
                    }
                  >
                    {quest.title}
                  </button>
                ))}
              </div>
            </div>
          )}

        {/* 外部リンク */}
        {data.externalLinks.length > 0 && (
          <div>
            <div style={sectionTitleStyle}>
              {locale === "ja" ? "外部リソース" : "External Resources"}
            </div>
            <div>
              {data.externalLinks.map((link, i) => (
                <a
                  key={`link-${String(i) satisfies string}`}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={externalLinkStyle}
                  data-testid={
                    /* v8 ignore start -- testId条件分岐はテスト用属性 */
                    testId !== undefined
                      ? `${testId satisfies string}-link-${String(i) satisfies string}`
                      : undefined
                    /* v8 ignore stop */
                  }
                >
                  {link.label} ↗
                  <span style={languageTagStyle}>{link.documentLanguage}</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* リサイズハンドル */}
      <div
        style={resizeHandleStyle}
        onPointerDown={handleResizePointerDown}
        data-testid={
          /* v8 ignore start -- testId条件分岐はテスト用属性 */
          testId !== undefined ? `${testId satisfies string}-resize` : undefined
          /* v8 ignore stop */
        }
      >
        <svg style={resizeHandleSvgStyle} viewBox="0 0 10 10">
          <line
            x1="9"
            y1="1"
            x2="1"
            y2="9"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <line
            x1="9"
            y1="5"
            x2="5"
            y2="9"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </svg>
      </div>
    </div>
  );

  return createPortal(windowContent, document.body);
}

/**
 * リファレンス詳細モーダルコンポーネント。
 *
 * リファレンスエントリの全文表示：本文、形式表記、
 * 関連エントリ、外部リンクを含む。
 *
 * 変更時は ReferenceModal.test.tsx, ReferenceModal.stories.tsx も同期すること。
 */

import type { CSSProperties } from "react";
import { useCallback, useEffect, useMemo, useRef } from "react";
import katex from "katex";
import type { Locale, ReferenceEntry } from "./referenceEntry";
import { buildModalData } from "./referenceUILogic";
import { InlineMarkdown } from "./InlineMarkdown";
import { buildReferenceViewerUrl } from "./referenceViewerLogic";

// --- Props ---

/** 関連クエスト情報（親で解決済み） */
export type RelatedQuestInfo = {
  readonly id: string;
  readonly title: string;
};

export interface ReferenceModalProps {
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

const overlayStyle: CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 2000,
  padding: "24px",
};

const modalStyle: CSSProperties = {
  backgroundColor: "var(--color-surface, #ffffff)",
  borderRadius: "12px",
  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
  width: "600px",
  maxWidth: "100%",
  maxHeight: "80vh",
  overflow: "auto",
  fontFamily: "var(--font-ui)",
  fontSize: "var(--font-size-base, 14px)",
  color: "var(--color-text-primary, #171717)",
};

const headerStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  padding: "20px 24px 12px",
  borderBottom: "1px solid var(--color-border, #e2e8f0)",
};

const headerButtonsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "4px",
};

const closeButtonStyle: CSSProperties = {
  background: "none",
  border: "none",
  fontSize: "var(--font-size-xl, 20px)",
  color: "var(--color-text-secondary, #666666)",
  cursor: "pointer",
  padding: "4px 8px",
  borderRadius: "4px",
  lineHeight: 1,
  fontFamily: "var(--font-ui)",
};

const openInNewTabStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "none",
  border: "none",
  fontSize: "var(--font-size-sm, 13px)",
  color: "var(--color-text-secondary, #666666)",
  cursor: "pointer",
  padding: "4px 6px",
  borderRadius: "4px",
  lineHeight: 1,
  textDecoration: "none",
  transition: "color 0.1s ease",
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
  fontSize: "var(--font-size-xl, 20px)",
  fontWeight: 600,
  margin: "4px 0 0",
};

const bodyStyle: CSSProperties = {
  padding: "16px 24px",
};

const summaryStyle: CSSProperties = {
  color: "var(--color-text-secondary, #666666)",
  fontSize: "var(--font-size-base, 14px)",
  marginBottom: "16px",
  lineHeight: 1.6,
};

const formulaStyle: CSSProperties = {
  margin: "12px 0 16px",
  padding: "12px 16px",
  backgroundColor: "var(--color-bg-secondary, #fafafa)",
  borderRadius: "6px",
  textAlign: "center",
  overflow: "auto",
};

const paragraphStyle: CSSProperties = {
  margin: "0 0 12px",
  lineHeight: 1.7,
  color: "var(--color-text-primary, #171717)",
};

const sectionTitleStyle: CSSProperties = {
  fontSize: "var(--font-size-sm, 13px)",
  fontWeight: 600,
  color: "var(--color-text-secondary, #666666)",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  marginTop: "20px",
  marginBottom: "8px",
};

const relatedItemStyle: CSSProperties = {
  display: "inline-block",
  fontSize: "var(--font-size-sm, 13px)",
  color: "var(--color-node-axiom, #5b8bd9)",
  background: "none",
  border: "1px solid var(--color-border, #e2e8f0)",
  borderRadius: "4px",
  padding: "4px 8px",
  margin: "0 6px 6px 0",
  cursor: "pointer",
  fontFamily: "var(--font-ui)",
  transition: "background-color 0.1s ease",
};

const externalLinkStyle: CSSProperties = {
  display: "block",
  fontSize: "var(--font-size-sm, 13px)",
  color: "var(--color-node-axiom, #5b8bd9)",
  textDecoration: "none",
  padding: "4px 0",
};

const languageTagStyle: CSSProperties = {
  display: "inline-block",
  fontSize: "var(--font-size-xs, 11px)",
  color: "var(--color-text-secondary, #6b7280)",
  border: "1px solid var(--color-border, #e2e8f0)",
  borderRadius: "3px",
  padding: "0 4px",
  marginLeft: "6px",
  verticalAlign: "middle",
  lineHeight: "1.4",
};

const questButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  fontSize: "var(--font-size-sm, 13px)",
  color: "var(--color-accent, #555ab9)",
  background: "none",
  border: "1px solid var(--color-accent, #555ab9)",
  borderRadius: "4px",
  padding: "4px 10px",
  margin: "0 6px 6px 0",
  cursor: "pointer",
  fontFamily: "var(--font-ui)",
  transition: "background-color 0.1s ease",
};

// --- コンポーネント ---

export function ReferenceModal({
  entry,
  allEntries,
  locale,
  onClose,
  onNavigate,
  relatedQuests,
  onStartQuest,
  testId,
}: ReferenceModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

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

  // Escapeキーで閉じる
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      /* v8 ignore start -- other keys are ignored; only Escape triggers close */
      if (e.key === "Escape") {
        onClose();
      }
      /* v8 ignore stop */
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  // オーバーレイクリックで閉じる
  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose],
  );

  const handleRelatedClick = useCallback(
    (entryId: string) => {
      onNavigate?.(entryId);
    },
    [onNavigate],
  );

  return (
    <div
      style={overlayStyle}
      onClick={handleOverlayClick}
      data-testid={
        testId !== undefined ? `${testId satisfies string}-overlay` : undefined
      }
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-label={data.title}
        style={modalStyle}
        data-testid={testId}
      >
        {/* ヘッダー */}
        <div style={headerStyle}>
          <div>
            <div style={categoryBadgeStyle}>{data.categoryLabel}</div>
            <div style={titleStyle}>{data.title}</div>
          </div>
          <div style={headerButtonsStyle}>
            <a
              href={buildReferenceViewerUrl(entry.id)}
              target="_blank"
              rel="noopener noreferrer"
              style={openInNewTabStyle}
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
              style={closeButtonStyle}
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
                      /* v8 ignore start -- optional testId prop */
                      data-testid={
                        testId !== undefined
                          ? `${testId satisfies string}-quest-${quest.id satisfies string}`
                          : undefined
                      }
                      /* v8 ignore stop */
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
                      testId !== undefined
                        ? `${testId satisfies string}-link-${String(i) satisfies string}`
                        : undefined
                    }
                  >
                    {link.label} ↗
                    <span style={languageTagStyle}>
                      {link.documentLanguage}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

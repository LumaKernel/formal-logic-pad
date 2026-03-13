/**
 * リファレンスビューアーページのプレゼンテーション層。
 *
 * 個別リファレンスエントリの全文表示ページ。
 * ReferenceModalの内容をページレイアウトでゆったり表示する。
 * 不純な依存を持たず、propsで状態とコールバックを受け取る。
 *
 * 変更時は ReferenceViewerPageView.test.tsx, ReferenceViewerPageView.stories.tsx も同期すること。
 */

import { useMemo, type CSSProperties } from "react";
import katex from "katex";
import type { Locale, ReferenceEntry } from "./referenceEntry";
import { InlineMarkdown } from "./InlineMarkdown";
import {
  buildViewerPageData,
  buildReferenceViewerUrl,
  type ViewerPageData,
} from "./referenceViewerLogic";

// --- Props ---

/** 関連クエスト情報（親で解決済み） */
export type RelatedQuestInfo = {
  readonly id: string;
  readonly title: string;
};

export type ReferenceViewerPageViewProps = {
  /** 表示するリファレンスエントリ */
  readonly entry: ReferenceEntry;
  /** 全エントリ（関連エントリ解決用） */
  readonly allEntries: readonly ReferenceEntry[];
  /** ロケール */
  readonly locale: Locale;
  /** 関連エントリクリック時のコールバック */
  readonly onNavigate?: (entryId: string) => void;
  /** 関連クエスト（IDとタイトルの解決済みリスト） */
  readonly relatedQuests?: readonly RelatedQuestInfo[];
  /** クエスト開始コールバック */
  readonly onStartQuest?: (questId: string) => void;
  /** data-testid */
  readonly testId?: string;
};

export type ReferenceViewerNotFoundProps = {
  /** ロケール */
  readonly locale: Locale;
  /** data-testid */
  readonly testId?: string;
};

// --- Styles ---

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  background: "var(--color-bg-primary, #fafafa)",
  color: "var(--color-text-primary, #171717)",
  fontFamily: "var(--font-ui)",
};

const headerStyle: CSSProperties = {
  padding: "16px 24px",
  borderBottom: "1px solid var(--color-border, #e0e0e0)",
  background: "var(--color-surface, #fff)",
};

const breadcrumbStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  fontSize: "var(--font-size-sm, 13px)",
  color: "var(--color-text-secondary, #666)",
};

const breadcrumbLinkStyle: CSSProperties = {
  color: "var(--color-node-axiom, #5b8bd9)",
  textDecoration: "none",
  cursor: "pointer",
  background: "none",
  border: "none",
  fontFamily: "var(--font-ui)",
  fontSize: "var(--font-size-sm, 13px)",
  padding: 0,
};

const breadcrumbSeparatorStyle: CSSProperties = {
  color: "var(--color-text-secondary, #999)",
};

const contentStyle: CSSProperties = {
  maxWidth: 800,
  margin: "0 auto",
  padding: "32px 24px",
};

const categoryBadgeStyle: CSSProperties = {
  display: "inline-block",
  fontSize: "var(--font-size-xs, 11px)",
  color: "var(--color-badge-text, #718096)",
  backgroundColor: "var(--color-badge-bg, #e8eaf0)",
  borderRadius: "4px",
  padding: "2px 8px",
  marginBottom: "8px",
};

const titleStyle: CSSProperties = {
  fontSize: "var(--font-size-2xl, 28px)",
  fontWeight: 700,
  margin: "0 0 12px",
  lineHeight: 1.3,
};

const summaryStyle: CSSProperties = {
  fontSize: "var(--font-size-base, 14px)",
  color: "var(--color-text-secondary, #666)",
  lineHeight: 1.7,
  marginBottom: "24px",
};

const formulaStyle: CSSProperties = {
  margin: "16px 0 24px",
  padding: "16px 20px",
  backgroundColor: "var(--color-bg-secondary, #fafafa)",
  borderRadius: "8px",
  textAlign: "center",
  overflow: "auto",
  border: "1px solid var(--color-border, #e2e8f0)",
};

const paragraphStyle: CSSProperties = {
  margin: "0 0 16px",
  lineHeight: 1.8,
  fontSize: "var(--font-size-base, 14px)",
  color: "var(--color-text-primary, #171717)",
};

const sectionTitleStyle: CSSProperties = {
  fontSize: "var(--font-size-sm, 13px)",
  fontWeight: 600,
  color: "var(--color-text-secondary, #666)",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  marginTop: "32px",
  marginBottom: "12px",
  paddingBottom: "8px",
  borderBottom: "1px solid var(--color-border, #e2e8f0)",
};

const relatedItemStyle: CSSProperties = {
  display: "inline-block",
  fontSize: "var(--font-size-sm, 13px)",
  color: "var(--color-node-axiom, #5b8bd9)",
  background: "none",
  border: "1px solid var(--color-border, #e2e8f0)",
  borderRadius: "6px",
  padding: "6px 12px",
  margin: "0 8px 8px 0",
  cursor: "pointer",
  fontFamily: "var(--font-ui)",
  textDecoration: "none",
  transition: "background-color 0.1s ease, border-color 0.1s ease",
};

const externalLinkStyle: CSSProperties = {
  display: "block",
  fontSize: "var(--font-size-sm, 13px)",
  color: "var(--color-node-axiom, #5b8bd9)",
  textDecoration: "none",
  padding: "6px 0",
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

const notFoundStyle: CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexDirection: "column",
  gap: 16,
  background: "var(--color-bg-primary, #fafafa)",
  color: "var(--color-text-primary, #171717)",
  fontFamily: "var(--font-ui)",
};

const notFoundTitleStyle: CSSProperties = {
  fontSize: "var(--font-size-xl, 20px)",
  fontWeight: 700,
};

const backLinkStyle: CSSProperties = {
  fontSize: "var(--font-size-sm, 13px)",
  color: "var(--color-node-axiom, #5b8bd9)",
  textDecoration: "none",
};

const questButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  fontSize: "var(--font-size-sm, 13px)",
  color: "var(--color-accent, #555ab9)",
  background: "none",
  border: "1px solid var(--color-accent, #555ab9)",
  borderRadius: "6px",
  padding: "6px 12px",
  margin: "0 8px 8px 0",
  cursor: "pointer",
  fontFamily: "var(--font-ui)",
  transition: "background-color 0.1s ease, border-color 0.1s ease",
};

// --- Components ---

function ViewerContent({
  data,
  locale,
  onNavigate,
  relatedQuests,
  onStartQuest,
  testId,
}: {
  readonly data: ViewerPageData;
  readonly locale: Locale;
  readonly onNavigate?: (entryId: string) => void;
  readonly relatedQuests?: readonly RelatedQuestInfo[];
  readonly onStartQuest?: (questId: string) => void;
  readonly testId?: string;
}) {
  const formulaHtml = useMemo(() => {
    if (data.formalNotation === undefined) return undefined;
    return katex.renderToString(data.formalNotation, {
      displayMode: true,
      throwOnError: false,
      output: "htmlAndMathml",
    });
  }, [data.formalNotation]);

  return (
    <div style={contentStyle}>
      {/* カテゴリバッジ */}
      <div style={categoryBadgeStyle}>{data.categoryLabel}</div>

      {/* タイトル */}
      <h1
        style={titleStyle}
        data-testid={
          testId !== undefined ? `${testId satisfies string}-title` : undefined
        }
      >
        {data.title}
      </h1>

      {/* 要約 */}
      <div style={summaryStyle}>
        <InlineMarkdown text={data.summary} />
      </div>

      {/* 形式表記 */}
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
              <a
                key={related.id}
                href={related.href}
                style={relatedItemStyle}
                onClick={(e) => {
                  if (onNavigate !== undefined) {
                    e.preventDefault();
                    onNavigate(related.id);
                  }
                }}
                data-testid={
                  testId !== undefined
                    ? `${testId satisfies string}-related-${related.id satisfies string}`
                    : undefined
                }
              >
                {related.title}
              </a>
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
                    testId !== undefined
                      ? `${testId satisfies string}-quest-${quest.id satisfies string}`
                      : undefined
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
                  testId !== undefined
                    ? `${testId satisfies string}-link-${String(i) satisfies string}`
                    : undefined
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
  );
}

export function ReferenceViewerPageView({
  entry,
  allEntries,
  locale,
  onNavigate,
  relatedQuests,
  onStartQuest,
  testId,
}: ReferenceViewerPageViewProps) {
  const data = useMemo(
    () => buildViewerPageData(entry, allEntries, locale),
    [entry, allEntries, locale],
  );

  return (
    <div style={pageStyle} data-testid={testId}>
      {/* ヘッダー（パンくず） */}
      <header style={headerStyle}>
        <nav style={breadcrumbStyle} aria-label="breadcrumb">
          {data.breadcrumbs.map((crumb, i) => (
            <span key={`bc-${String(i) satisfies string}`}>
              {i > 0 && <span style={breadcrumbSeparatorStyle}>{" / "}</span>}
              {crumb.href !== undefined ? (
                <a
                  href={crumb.href}
                  style={breadcrumbLinkStyle}
                  data-testid={
                    testId !== undefined
                      ? `${testId satisfies string}-breadcrumb-${String(i) satisfies string}`
                      : undefined
                  }
                >
                  {crumb.label}
                </a>
              ) : (
                <span>{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      </header>

      {/* コンテンツ */}
      <ViewerContent
        data={data}
        locale={locale}
        onNavigate={onNavigate}
        relatedQuests={relatedQuests}
        onStartQuest={onStartQuest}
        testId={testId}
      />
    </div>
  );
}

export function ReferenceViewerNotFound({
  locale,
  testId,
}: ReferenceViewerNotFoundProps) {
  return (
    <div style={notFoundStyle} data-testid={testId}>
      <div style={notFoundTitleStyle}>
        {locale === "ja"
          ? "リファレンスが見つかりません"
          : "Reference Not Found"}
      </div>
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- pure lib component, no next/link dependency */}
      <a href="/reference" style={backLinkStyle}>
        {locale === "ja" ? "← リファレンス一覧に戻る" : "← Back to Reference"}
      </a>
    </div>
  );
}

// Re-export for convenience
export { buildReferenceViewerUrl };

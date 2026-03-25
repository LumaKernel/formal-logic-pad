/**
 * リファレンスビューアーページのプレゼンテーション層。
 *
 * 個別リファレンスエントリの全文表示ページ。
 * ReferenceModalの内容をページレイアウトでゆったり表示する。
 * 不純な依存を持たず、propsで状態とコールバックを受け取る。
 *
 * 変更時は ReferenceViewerPageView.test.tsx, ReferenceViewerPageView.stories.tsx も同期すること。
 */

import { useCallback, useMemo, type CSSProperties } from "react";
import { UiButton } from "../../components/ui";
import katex from "katex";
import type {
  BibliographyEntry,
  Locale,
  ReferenceEntry,
} from "./referenceEntry";
import { InlineMarkdown } from "./InlineMarkdown";
import {
  buildViewerPageData,
  buildCategoryNavigation,
  buildReferenceViewerUrl,
  type NavigationData,
  type ViewerPageData,
} from "./referenceViewerLogic";
import { bibliographyRegistry } from "./referenceContent";

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
  color: "var(--color-text-secondary, #666)",
};

const contentStyle: CSSProperties = {
  maxWidth: 800,
  margin: "0 auto",
  padding: "32px 24px",
};

const categoryBadgeStyle: CSSProperties = {
  display: "inline-block",
  fontSize: "var(--font-size-xs, 11px)",
  color: "var(--color-badge-text, #4a5568)",
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

const relatedItemWrapperStyle: CSSProperties = {
  margin: "0 8px 8px 0",
  display: "inline-block",
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

const questItemWrapperStyle: CSSProperties = {
  margin: "0 8px 8px 0",
  display: "inline-block",
};

const bibItemStyle: CSSProperties = {
  fontSize: "var(--font-size-sm, 13px)",
  lineHeight: 1.7,
  color: "var(--color-text-primary, #171717)",
  padding: "6px 0",
};

const bibAuthorsStyle: CSSProperties = {
  fontWeight: 600,
};

const bibTitleStyle: CSSProperties = {
  fontStyle: "italic",
};

const bibBackLinkStyle: CSSProperties = {
  color: "var(--color-link, #0066cc)",
  cursor: "pointer",
  textDecoration: "none",
  fontSize: "0.85em",
  marginLeft: "4px",
};

const navContainerStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "stretch",
  marginTop: "48px",
  paddingTop: "24px",
  borderTop: "1px solid var(--color-border, #e2e8f0)",
  gap: "16px",
};

const navLinkStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "4px",
  padding: "12px 16px",
  borderRadius: "8px",
  border: "1px solid var(--color-border, #e2e8f0)",
  textDecoration: "none",
  cursor: "pointer",
  transition: "background-color 0.1s ease, border-color 0.1s ease",
  background: "var(--color-surface, #fff)",
  maxWidth: "45%",
};

const navLabelStyle: CSSProperties = {
  fontSize: "var(--font-size-xs, 11px)",
  color: "var(--color-text-secondary, #666)",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const navTitleStyle: CSSProperties = {
  fontSize: "var(--font-size-sm, 13px)",
  color: "var(--color-node-axiom, #5b8bd9)",
  fontFamily: "var(--font-ui)",
};

// --- Components ---

function NavigationBar({
  navigation,
  locale,
  onNavigate,
  testId,
}: {
  readonly navigation: NavigationData;
  readonly locale: Locale;
  readonly onNavigate?: (entryId: string) => void;
  readonly testId?: string;
}) {
  const { previous, next } = navigation;
  return (
    <nav style={navContainerStyle} aria-label="entry navigation">
      {previous !== undefined ? (
        <a
          href={previous.href}
          style={{ ...navLinkStyle, alignItems: "flex-start" }}
          onClick={(e) => {
            /* v8 ignore start -- onNavigate optional callback */
            if (onNavigate !== undefined) {
              e.preventDefault();
              onNavigate(previous.id);
            }
            /* v8 ignore stop */
          }}
          data-testid={
            /* v8 ignore start -- optional testId prop */
            testId !== undefined
              ? `${testId satisfies string}-nav-prev`
              : undefined
            /* v8 ignore stop */
          }
        >
          <span style={navLabelStyle}>
            {locale === "ja" ? "← 前" : "← Previous"}
          </span>
          <span style={navTitleStyle}>{previous.title}</span>
        </a>
      ) : (
        <div />
      )}
      {next !== undefined ? (
        <a
          href={next.href}
          style={{
            ...navLinkStyle,
            alignItems: "flex-end",
            marginLeft: "auto",
          }}
          onClick={(e) => {
            /* v8 ignore start -- onNavigate optional callback */
            if (onNavigate !== undefined) {
              e.preventDefault();
              onNavigate(next.id);
            }
            /* v8 ignore stop */
          }}
          data-testid={
            /* v8 ignore start -- optional testId prop */
            testId !== undefined
              ? `${testId satisfies string}-nav-next`
              : undefined
            /* v8 ignore stop */
          }
        >
          <span style={navLabelStyle}>
            {locale === "ja" ? "次 →" : "Next →"}
          </span>
          <span style={navTitleStyle}>{next.title}</span>
        </a>
      ) : (
        <div />
      )}
    </nav>
  );
}

function ViewerContent({
  data,
  navigation,
  locale,
  onNavigate,
  relatedQuests,
  onStartQuest,
  testId,
}: {
  readonly data: ViewerPageData;
  readonly navigation: NavigationData;
  readonly locale: Locale;
  readonly onNavigate?: (entryId: string) => void;
  readonly relatedQuests?: readonly RelatedQuestInfo[];
  readonly onStartQuest?: (questId: string) => void;
  readonly testId?: string;
}) {
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
        <InlineMarkdown text={data.summary} onNavigate={onNavigate} />
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
          <InlineMarkdown
            text={paragraph}
            onNavigate={onNavigate}
            onCiteClick={(citeKey) => {
              const el = document.getElementById(
                `cite-${citeKey satisfies string}`,
              );
              el?.scrollIntoView({ behavior: "smooth", block: "center" });
            }}
          />
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
              <span key={related.id} style={relatedItemWrapperStyle}>
                <a
                  href={related.href}
                  onClick={(e) => {
                    /* v8 ignore start -- onNavigate optional callback */
                    if (onNavigate !== undefined) {
                      e.preventDefault();
                      onNavigate(related.id);
                    }
                    /* v8 ignore stop */
                  }}
                  data-testid={
                    /* v8 ignore start -- testId条件分岐はテスト用属性 */
                    testId !== undefined
                      ? `${testId satisfies string}-related-${related.id satisfies string}`
                      : undefined
                    /* v8 ignore stop */
                  }
                  style={{ textDecoration: "none" }}
                >
                  <UiButton size="small">{related.title}</UiButton>
                </a>
              </span>
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
                <span key={quest.id} style={questItemWrapperStyle}>
                  <UiButton
                    size="small"
                    type="primary"
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
                  </UiButton>
                </span>
              ))}
            </div>
          </div>
        )}

      {/* 参考文献 */}
      {data.bibliography.length > 0 && (
        <div>
          <div style={sectionTitleStyle}>
            {locale === "ja" ? "参考文献" : "References"}
          </div>
          <ol style={{ paddingLeft: "20px", margin: 0 }}>
            {data.bibliography.map((bib: BibliographyEntry) => (
              <li
                key={bib.key}
                id={`cite-${bib.key satisfies string}`}
                style={bibItemStyle}
              >
                <span style={bibAuthorsStyle}>{bib.authors}</span>
                {" ("}
                {String(bib.year)}
                {"): "}
                <span style={bibTitleStyle}>{bib.title}</span>
                {bib.publisher !== undefined && (
                  <>
                    {". "}
                    {bib.publisher}
                  </>
                )}
                {bib.edition !== undefined && (
                  <>
                    {", "}
                    {bib.edition}
                  </>
                )}
                {"."}
                {bib.url !== undefined && (
                  <>
                    {" "}
                    <a
                      href={bib.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "var(--color-link, #0066cc)" }}
                    >
                      [Link]
                    </a>
                  </>
                )}
                <a
                  href={`#cite-ref-${bib.key satisfies string}`}
                  style={bibBackLinkStyle}
                  onClick={(e) => {
                    e.preventDefault();
                    const refEl = document.getElementById(
                      `cite-ref-${bib.key satisfies string}`,
                    );
                    refEl?.scrollIntoView({
                      behavior: "smooth",
                      block: "center",
                    });
                  }}
                  aria-label={locale === "ja" ? "本文に戻る" : "Back to text"}
                >
                  ↩
                </a>
              </li>
            ))}
          </ol>
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

      {/* 前後ナビゲーション */}
      {(navigation.previous !== undefined || navigation.next !== undefined) && (
        <NavigationBar
          navigation={navigation}
          locale={locale}
          onNavigate={onNavigate}
          testId={testId}
        />
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
    () => buildViewerPageData(entry, allEntries, locale, bibliographyRegistry),
    [entry, allEntries, locale],
  );

  const navigation = useMemo(
    () => buildCategoryNavigation(entry, allEntries, locale),
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
                    /* v8 ignore start -- testId条件分岐はテスト用属性 */
                    testId !== undefined
                      ? `${testId satisfies string}-breadcrumb-${String(i) satisfies string}`
                      : undefined
                    /* v8 ignore stop */
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
        navigation={navigation}
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

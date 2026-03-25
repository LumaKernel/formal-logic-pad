/**
 * Reference Viewer ページのローディングスケルトン。
 *
 * Next.js App Router の loading.tsx として、
 * ルート遷移時に即座に表示される。
 * ReferenceViewerPageView のレイアウト（ヘッダー + コンテンツ）を模倣する。
 */

import type { CSSProperties } from "react";

const pageStyle: Readonly<CSSProperties> = {
  minHeight: "100vh",
  background: "var(--color-bg-primary, #fafafa)",
};

const headerStyle: Readonly<CSSProperties> = {
  padding: "16px 24px",
  borderBottom: "1px solid var(--ui-border)",
  background: "var(--color-surface, #fff)",
};

const breadcrumbPlaceholderStyle: Readonly<CSSProperties> = {
  width: "10rem",
  height: "0.875rem",
};

const contentStyle: Readonly<CSSProperties> = {
  maxWidth: 800,
  margin: "0 auto",
  padding: "32px 24px",
  display: "flex",
  flexDirection: "column",
  gap: "1rem",
};

const titlePlaceholderStyle: Readonly<CSSProperties> = {
  width: "60%",
  height: "1.75rem",
};

const paragraphPlaceholderStyle: Readonly<CSSProperties> = {
  width: "100%",
  height: "0.875rem",
};

const shortParagraphStyle: Readonly<CSSProperties> = {
  width: "75%",
  height: "0.875rem",
};

export default function ReferenceLoading() {
  return (
    <div style={pageStyle}>
      <header style={headerStyle}>
        <div className="skeleton-pulse" style={breadcrumbPlaceholderStyle} />
      </header>
      <div style={contentStyle}>
        <div className="skeleton-pulse" style={titlePlaceholderStyle} />
        <div className="skeleton-pulse" style={paragraphPlaceholderStyle} />
        <div className="skeleton-pulse" style={paragraphPlaceholderStyle} />
        <div className="skeleton-pulse" style={shortParagraphStyle} />
      </div>
    </div>
  );
}

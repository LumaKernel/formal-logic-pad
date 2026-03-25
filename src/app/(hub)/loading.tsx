/**
 * Hub ページのローディングスケルトン。
 *
 * Next.js App Router の loading.tsx として、
 * ルート遷移時に即座に表示される。
 * HubPageView のレイアウト（ヘッダー + タブバー + コンテンツ）を模倣する。
 */

import type { CSSProperties } from "react";

const pageStyle: Readonly<CSSProperties> = {
  minHeight: "100vh",
  backgroundColor: "var(--ui-background)",
  color: "var(--ui-foreground)",
};

const headerStyle: Readonly<CSSProperties> = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  paddingLeft: "24px",
  paddingRight: "24px",
  paddingTop: "16px",
  paddingBottom: "16px",
  borderBottom: "1px solid var(--ui-border)",
  backgroundColor: "var(--ui-card)",
};

const brandPlaceholderStyle: Readonly<CSSProperties> = {
  width: "10rem",
  height: "1.25rem",
};

const actionsPlaceholderStyle: Readonly<CSSProperties> = {
  display: "flex",
  gap: "0.5rem",
};

const actionItemStyle: Readonly<CSSProperties> = {
  width: "1.75rem",
  height: "1.75rem",
  borderRadius: "0.375rem",
};

const tabBarStyle: Readonly<CSSProperties> = {
  display: "flex",
  gap: "1.5rem",
  paddingLeft: "24px",
  paddingRight: "24px",
  borderBottom: "1px solid var(--ui-border)",
};

const tabItemStyle: Readonly<CSSProperties> = {
  width: "4rem",
  height: "0.75rem",
  marginTop: "0.75rem",
  marginBottom: "0.75rem",
};

const contentStyle: Readonly<CSSProperties> = {
  padding: "24px",
};

export default function HubLoading() {
  return (
    <div style={pageStyle}>
      <header style={headerStyle}>
        <div className="skeleton-pulse" style={brandPlaceholderStyle} />
        <div style={actionsPlaceholderStyle}>
          <div className="skeleton-pulse" style={actionItemStyle} />
          <div className="skeleton-pulse" style={actionItemStyle} />
        </div>
      </header>
      <div style={tabBarStyle}>
        <div className="skeleton-pulse" style={tabItemStyle} />
        <div className="skeleton-pulse" style={tabItemStyle} />
        <div className="skeleton-pulse" style={tabItemStyle} />
        <div className="skeleton-pulse" style={tabItemStyle} />
      </div>
      <div style={contentStyle} />
    </div>
  );
}

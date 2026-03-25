/**
 * Workspace ページのローディングスケルトン。
 *
 * Next.js App Router の loading.tsx として、
 * ルート遷移時に即座に表示される。
 * WorkspacePageView のレイアウト（ヘッダー + キャンバス領域）を模倣する。
 */

import type { CSSProperties } from "react";

const pageStyle: Readonly<CSSProperties> = {
  display: "flex",
  flexDirection: "column",
  height: "100vh",
  backgroundColor: "var(--ui-background)",
  color: "var(--ui-foreground)",
};

const headerStyle: Readonly<CSSProperties> = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  paddingLeft: "1rem",
  paddingRight: "1rem",
  paddingTop: "0.5rem",
  paddingBottom: "0.5rem",
  borderBottom: "1px solid var(--ui-border)",
  backgroundColor: "var(--ui-card)",
  flexShrink: 0,
};

const backPlaceholderStyle: Readonly<CSSProperties> = {
  width: "3.5rem",
  height: "1.75rem",
};

const titlePlaceholderStyle: Readonly<CSSProperties> = {
  width: "12rem",
  height: "1.25rem",
  margin: "0 auto",
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

const canvasStyle: Readonly<CSSProperties> = {
  flex: 1,
  backgroundColor: "var(--ui-background)",
};

export default function WorkspaceLoading() {
  return (
    <div style={pageStyle}>
      <header style={headerStyle}>
        <div className="skeleton-pulse" style={backPlaceholderStyle} />
        <div className="skeleton-pulse" style={titlePlaceholderStyle} />
        <div style={actionsPlaceholderStyle}>
          <div className="skeleton-pulse" style={actionItemStyle} />
          <div className="skeleton-pulse" style={actionItemStyle} />
        </div>
      </header>
      <div style={canvasStyle} />
    </div>
  );
}

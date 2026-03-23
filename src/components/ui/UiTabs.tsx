/**
 * 軽量 Tabs コンポーネント（antd Tabs の代替）。
 *
 * 変更時は UiTabs.test.tsx も同期すること。
 */

import type { CSSProperties, ReactNode } from "react";
import { useMemo } from "react";
import { useResolvedThemeSafe } from "../../lib/theme/ThemeProvider";

export type UiTabItem = {
  readonly key: string;
  readonly label: string;
};

export type UiTabsProps = {
  readonly activeKey: string;
  readonly onChange: (key: string) => void;
  readonly items: readonly UiTabItem[];
  readonly style?: CSSProperties;
};

const containerStyle: Readonly<CSSProperties> = {
  display: "flex",
  gap: "0",
  borderBottom: "1px solid var(--ui-border)",
  overflowX: "auto",
};

function getTabStyle(isActive: boolean, isDark: boolean): CSSProperties {
  return {
    padding: "0.625rem 1rem",
    fontSize: "0.875rem",
    fontWeight: isActive ? 600 : 400,
    cursor: "pointer",
    background: "none",
    border: "none",
    borderBottom: isActive
      ? `2px solid ${(isDark ? "#fafafa" : "#171717") satisfies string}`
      : "2px solid transparent",
    color: isActive
      ? isDark
        ? "#fafafa"
        : "#171717"
      : isDark
        ? "#999999"
        : "#666666",
    fontFamily: "inherit",
    whiteSpace: "nowrap",
    transition: "color 0.15s, border-color 0.15s",
  };
}

export function UiTabs({
  activeKey,
  onChange,
  items,
  style,
}: UiTabsProps): ReactNode {
  const resolved = useResolvedThemeSafe();
  const isDark = resolved === "dark";

  const mergedStyle = useMemo(
    (): CSSProperties => ({
      ...containerStyle,
      ...style,
    }),
    [style],
  );

  return (
    <div style={mergedStyle} role="tablist">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          role="tab"
          aria-selected={item.key === activeKey}
          style={getTabStyle(item.key === activeKey, isDark)}
          onClick={() => onChange(item.key)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

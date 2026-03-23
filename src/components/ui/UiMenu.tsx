/**
 * 軽量 Menu コンポーネント（antd Menu の代替）。
 * ドロップダウンメニュー用途。
 *
 * 変更時は UiMenu.test.tsx も同期すること。
 */

import type { CSSProperties, ReactNode, MouseEvent } from "react";
import { useResolvedThemeSafe } from "../../lib/theme/ThemeProvider";

export type UiMenuItem = {
  readonly key: string;
  readonly label: ReactNode;
  readonly danger?: boolean;
  readonly onClick?:
    | ((info: { readonly domEvent: MouseEvent }) => void)
    | (() => void);
};

export type UiMenuProps = {
  readonly items: readonly UiMenuItem[] | undefined;
  readonly selectable?: boolean;
  readonly style?: CSSProperties;
};

const listStyle: Readonly<CSSProperties> = {
  listStyle: "none",
  margin: 0,
  padding: "0.25rem 0",
};

function getItemStyle(danger: boolean, isDark: boolean): CSSProperties {
  return {
    display: "block",
    width: "100%",
    padding: "0.375rem 0.75rem",
    fontSize: "0.8125rem",
    textAlign: "left",
    cursor: "pointer",
    background: "none",
    border: "none",
    fontFamily: "inherit",
    color: danger
      ? isDark
        ? "#ff6b6b"
        : "#e06060"
      : isDark
        ? "#e0e0e0"
        : "#171717",
    transition: "background-color 0.1s",
  };
}

export function UiMenu({ items, style }: UiMenuProps): ReactNode {
  const resolved = useResolvedThemeSafe();
  const isDark = resolved === "dark";

  return (
    <ul style={{ ...listStyle, ...style }} role="menu">
      {items?.map((item) => (
        <li key={item.key} role="none">
          <button
            type="button"
            role="menuitem"
            style={getItemStyle(item.danger === true, isDark)}
            onClick={(e) => item.onClick?.({ domEvent: e })}
          >
            {item.label}
          </button>
        </li>
      ))}
    </ul>
  );
}

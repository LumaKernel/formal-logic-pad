/**
 * 軽量 Button コンポーネント（antd Button の代替）。
 *
 * 変更時は UiButton.test.tsx も同期すること。
 */

import type { CSSProperties, ReactNode, MouseEventHandler } from "react";
import { useMemo } from "react";
import { useResolvedThemeSafe } from "../../lib/theme/ThemeProvider";

export type UiButtonType = "primary" | "default" | "text" | "link";
export type UiButtonSize = "small" | "middle";

export type UiButtonProps = {
  readonly type?: UiButtonType;
  readonly size?: UiButtonSize;
  readonly shape?: "default" | "round";
  readonly danger?: boolean;
  readonly disabled?: boolean;
  readonly icon?: ReactNode;
  readonly htmlType?: "button" | "submit" | "reset";
  readonly onClick?: MouseEventHandler<HTMLButtonElement>;
  readonly children?: ReactNode;
  readonly style?: CSSProperties;
  readonly "data-testid"?: string;
  readonly title?: string;
  readonly "aria-label"?: string;
  readonly "aria-expanded"?: boolean;
};

const baseStyle: Readonly<CSSProperties> = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "0.375rem",
  border: "1px solid transparent",
  cursor: "pointer",
  fontFamily: "inherit",
  fontWeight: 500,
  lineHeight: 1.5,
  transition: "background-color 0.15s, border-color 0.15s, opacity 0.15s",
  whiteSpace: "nowrap",
};

function getTypeStyles(
  type: UiButtonType,
  danger: boolean,
  isDark: boolean,
): CSSProperties {
  if (danger && type === "primary") {
    return {
      backgroundColor: isDark ? "#ff6b6b" : "#e06060",
      color: "#ffffff",
      borderColor: isDark ? "#ff6b6b" : "#e06060",
    };
  }
  if (type === "primary") {
    return {
      backgroundColor: isDark ? "#fafafa" : "#171717",
      color: isDark ? "#141414" : "#ffffff",
      borderColor: isDark ? "#fafafa" : "#171717",
    };
  }
  if (type === "text") {
    return {
      backgroundColor: "transparent",
      color: isDark ? "#e0e0e0" : "#171717",
      border: "none",
    };
  }
  if (type === "link") {
    return {
      backgroundColor: "transparent",
      color: isDark ? "#6eb5ff" : "#1677ff",
      border: "none",
      padding: 0,
    };
  }
  // default
  return {
    backgroundColor: isDark ? "#0a0a0a" : "#ffffff",
    color: isDark ? "#e0e0e0" : "#171717",
    borderColor: isDark ? "#262626" : "#e5e5e5",
  };
}

function getSizeStyles(size: UiButtonSize, shape: string): CSSProperties {
  const borderRadius = shape === "round" ? "9999px" : "0.5rem";
  if (size === "small") {
    return {
      fontSize: "0.8125rem",
      paddingTop: "0.125rem",
      paddingBottom: "0.125rem",
      paddingLeft: "0.5rem",
      paddingRight: "0.5rem",
      borderRadius,
    };
  }
  return {
    fontSize: "0.875rem",
    paddingTop: "0.3125rem",
    paddingBottom: "0.3125rem",
    paddingLeft: "0.9375rem",
    paddingRight: "0.9375rem",
    borderRadius,
  };
}

export function UiButton({
  type = "default",
  size = "middle",
  shape = "default",
  danger = false,
  disabled = false,
  icon,
  htmlType = "button",
  onClick,
  children,
  style,
  ...restProps
}: UiButtonProps): ReactNode {
  const resolved = useResolvedThemeSafe();
  const isDark = resolved === "dark";

  const mergedStyle = useMemo(
    (): CSSProperties => ({
      ...baseStyle,
      ...getTypeStyles(type, danger, isDark),
      ...getSizeStyles(size, shape),
      ...(disabled ? { opacity: 0.5, cursor: "not-allowed" } : {}),
      ...style,
    }),
    [type, danger, isDark, size, shape, disabled, style],
  );

  return (
    <button
      type={htmlType}
      disabled={disabled}
      onClick={onClick}
      style={mergedStyle}
      title={restProps.title}
      data-testid={restProps["data-testid"]}
      aria-label={restProps["aria-label"]}
      aria-expanded={restProps["aria-expanded"]}
    >
      {icon}
      {children}
    </button>
  );
}

/**
 * AntDesignThemeProvider — Connects Ant Design's ConfigProvider to the existing theme system.
 *
 * Must be used inside a ThemeProvider. Reads the resolved theme and configures
 * Ant Design's theme algorithm accordingly.
 */

import { ConfigProvider, theme } from "antd";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { useResolvedTheme } from "./ThemeProvider";

export interface AntDesignThemeProviderProps {
  readonly children: ReactNode;
}

export function AntDesignThemeProvider({
  children,
}: AntDesignThemeProviderProps): ReactNode {
  const resolved = useResolvedTheme();

  const themeConfig = useMemo(
    () => ({
      algorithm:
        resolved === "dark" ? theme.darkAlgorithm : theme.defaultAlgorithm,
      token: {
        // Map to existing CSS variable values
        colorPrimary: resolved === "dark" ? "#fafafa" : "#171717",
        colorBgContainer: resolved === "dark" ? "#0a0a0a" : "#ffffff",
        colorText: resolved === "dark" ? "#e0e0e0" : "#171717",
        colorTextSecondary: resolved === "dark" ? "#999999" : "#666666",
        colorBorder: resolved === "dark" ? "#262626" : "#e5e5e5",
        colorBgElevated: resolved === "dark" ? "#1e1e2e" : "#ffffff",
        colorError: resolved === "dark" ? "#ff6b6b" : "#e06060",
        colorSuccess: resolved === "dark" ? "#4ad97a" : "#2ecc71",
        colorWarning: resolved === "dark" ? "#e0a05a" : "#d9944a",
        borderRadius: 8,
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      },
    }),
    [resolved],
  );

  return <ConfigProvider theme={themeConfig}>{children}</ConfigProvider>;
}

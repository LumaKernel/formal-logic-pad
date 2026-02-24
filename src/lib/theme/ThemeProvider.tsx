/**
 * ThemeProvider — React Context provider for theme management.
 *
 * Wraps useTheme hook and provides theme state to the component tree
 * via React Context.
 */

import { createContext, useContext, type ReactNode } from "react";
import { useTheme, type UseThemeResult } from "./useTheme";
import type { ResolvedTheme, ThemeMode } from "./themeLogic";

const ThemeContext = createContext<UseThemeResult | null>(null);

export interface ThemeProviderProps {
  readonly children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps): ReactNode {
  const theme = useTheme();
  return (
    <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
  );
}

/**
 * Access the current theme from any component within a ThemeProvider.
 *
 * @throws if used outside of ThemeProvider.
 */
export function useThemeContext(): UseThemeResult {
  const context = useContext(ThemeContext);
  if (context === null) {
    throw new Error("useThemeContext must be used within a ThemeProvider");
  }
  return context;
}

/**
 * Convenience hook: returns only the resolved theme ("light" | "dark").
 */
export function useResolvedTheme(): ResolvedTheme {
  return useThemeContext().resolved;
}

/**
 * Convenience hook: returns only the theme mode ("light" | "dark" | "system").
 */
export function useThemeMode(): ThemeMode {
  return useThemeContext().mode;
}

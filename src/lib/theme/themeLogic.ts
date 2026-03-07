/**
 * Pure theme logic — no DOM, no React, no side effects.
 *
 * Types and pure functions for theme management.
 */

/** Resolved visual theme (what is actually displayed). */
export type ResolvedTheme = "light" | "dark";

/** User-selected theme mode (includes "system" option). */
export type ThemeMode = "light" | "dark" | "system";

/** All valid ThemeMode values. */
export const THEME_MODES: readonly ThemeMode[] = [
  "light",
  "dark",
  "system",
] as const;

/** localStorage key for persisting the theme mode. */
export const THEME_STORAGE_KEY = "theme-mode";

/** data attribute name on <html> element. */
export const THEME_DATA_ATTRIBUTE = "data-theme";

/** data attribute name on <html> to indicate theme has been loaded (enables transitions). */
export const THEME_LOADED_ATTRIBUTE = "data-theme-loaded";

/**
 * Check if a value is a valid ThemeMode.
 */
export function isThemeMode(value: unknown) {
  return value === "light" || value === "dark" || value === "system";
}

/**
 * Resolve the actual theme to display based on user mode and system preference.
 */
export function resolveTheme(
  mode: ThemeMode,
  systemPrefersDark: boolean,
): ResolvedTheme {
  if (mode === "light") return "light";
  if (mode === "dark") return "dark";
  // mode === "system" (exhaustive: only remaining value)
  return systemPrefersDark ? "dark" : "light";
}

/**
 * Cycle to the next theme mode: light → dark → system → light.
 */
export function nextThemeMode(current: ThemeMode): ThemeMode {
  if (current === "light") return "dark";
  if (current === "dark") return "system";
  // current === "system" (exhaustive: only remaining value)
  return "light";
}

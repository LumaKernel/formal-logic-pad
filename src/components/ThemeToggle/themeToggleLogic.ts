/**
 * Pure logic for the ThemeToggle component.
 *
 * No DOM, no React, no side effects.
 * Provides labels, aria-labels, and icon identifiers for theme modes.
 */

import type { ThemeMode } from "../../lib/theme";

/** Icon identifier for each theme mode. */
export type ThemeIconId = "sun" | "moon" | "monitor";

/** Get the icon identifier for a theme mode. */
export function getThemeIconId(mode: ThemeMode): ThemeIconId {
  if (mode === "light") return "sun";
  if (mode === "dark") return "moon";
  // fall-through: TypeScript narrows to "system"
  return "monitor";
}

/** Get the display label for a theme mode. */
export function getThemeLabel(mode: ThemeMode): string {
  if (mode === "light") return "Light";
  if (mode === "dark") return "Dark";
  // fall-through: TypeScript narrows to "system"
  return "System";
}

/** Get the aria-label for the toggle button for a given mode. */
export function getThemeAriaLabel(mode: ThemeMode): string {
  return `Switch theme (current: ${getThemeLabel(mode) satisfies string})`;
}

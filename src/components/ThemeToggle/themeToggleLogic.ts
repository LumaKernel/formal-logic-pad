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
  switch (mode) {
    case "light":
      return "sun";
    case "dark":
      return "moon";
    case "system":
      return "monitor";
    default: {
      /* v8 ignore start */
      const _exhaustive: never = mode;
      void _exhaustive;
      return "sun";
      /* v8 ignore stop */
    }
  }
}

/** Get the display label for a theme mode. */
export function getThemeLabel(mode: ThemeMode): string {
  switch (mode) {
    case "light":
      return "Light";
    case "dark":
      return "Dark";
    case "system":
      return "System";
    default: {
      /* v8 ignore start */
      const _exhaustive: never = mode;
      void _exhaustive;
      return "Light";
      /* v8 ignore stop */
    }
  }
}

/** Get the aria-label for the toggle button for a given mode. */
export function getThemeAriaLabel(mode: ThemeMode): string {
  return `Switch theme (current: ${getThemeLabel(mode) satisfies string})`;
}

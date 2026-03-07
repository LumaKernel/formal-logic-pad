/**
 * ThemeToggle — A segmented control for switching between light/dark/system themes.
 *
 * Uses inline SVG icons (sun/moon/monitor). Keyboard accessible via Tab/Enter/Space.
 * Requires ThemeProvider in the component tree.
 */

import { type ReactNode, useCallback } from "react";
import { THEME_MODES, type ThemeMode } from "../../lib/theme";
import { useThemeContext } from "../../lib/theme/ThemeProvider";
import {
  getThemeAriaLabel,
  getThemeIconId,
  getThemeLabel,
  type ThemeIconId,
} from "./themeToggleLogic";
import styles from "./ThemeToggle.module.css";

function SunIcon(): ReactNode {
  return (
    <svg
      className={styles.icon}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function MoonIcon(): ReactNode {
  return (
    <svg
      className={styles.icon}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function MonitorIcon(): ReactNode {
  return (
    <svg
      className={styles.icon}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );
}

function ThemeIcon({ iconId }: { readonly iconId: ThemeIconId }): ReactNode {
  if (iconId === "sun") return <SunIcon />;
  if (iconId === "moon") return <MoonIcon />;
  // fall-through: TypeScript narrows to "monitor"
  return <MonitorIcon />;
}

export interface ThemeToggleProps {
  /** Whether to show text labels alongside icons. Default: true. */
  readonly showLabels?: boolean;
}

export function ThemeToggle({
  showLabels = true,
}: ThemeToggleProps): ReactNode {
  const { mode, setMode } = useThemeContext();

  const handleClick = useCallback(
    (targetMode: ThemeMode) => {
      setMode(targetMode);
    },
    [setMode],
  );

  return (
    <div
      className={styles.container}
      role="radiogroup"
      aria-label="Theme selection"
      data-testid="theme-toggle"
    >
      {THEME_MODES.map((m) => {
        const isActive = mode === m;
        const iconId = getThemeIconId(m);
        const label = getThemeLabel(m);
        return (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={getThemeAriaLabel(m)}
            className={[styles.button, isActive ? styles.active : ""]
              .filter(Boolean)
              .join(" ")}
            data-testid={`theme-toggle-${m satisfies string}`}
            onClick={() => handleClick(m)}
          >
            <ThemeIcon iconId={iconId} />
            {showLabels ? <span className={styles.label}>{label}</span> : null}
          </button>
        );
      })}
    </div>
  );
}

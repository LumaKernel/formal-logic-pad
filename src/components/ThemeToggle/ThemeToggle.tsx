/**
 * ThemeToggle — A segmented control for switching between light/dark/system themes.
 *
 * Uses lucide-react icons (Sun/Moon/Monitor). Keyboard accessible via Tab/Enter/Space.
 * Requires ThemeProvider in the component tree.
 * Styled with inline styles + CSS variables defined in globals.css.
 */

import { type CSSProperties, type ReactNode, useCallback } from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { THEME_MODES, type ThemeMode } from "../../lib/theme";
import { useThemeContext } from "../../lib/theme/ThemeProvider";
import {
  getThemeAriaLabel,
  getThemeIconId,
  getThemeLabel,
  type ThemeIconId,
} from "./themeToggleLogic";

const iconStyle: Readonly<CSSProperties> = {
  width: "1rem",
  height: "1rem",
  flexShrink: 0,
};

function ThemeIcon({ iconId }: { readonly iconId: ThemeIconId }): ReactNode {
  if (iconId === "sun") return <Sun style={iconStyle} aria-hidden="true" />;
  if (iconId === "moon") return <Moon style={iconStyle} aria-hidden="true" />;
  // fall-through: TypeScript narrows to "monitor"
  return <Monitor style={iconStyle} aria-hidden="true" />;
}

/**
 * テーマトグルのラベル。
 * i18n対応のため外部から注入可能。未指定時はデフォルト英語ラベルを使用。
 */
export type ThemeToggleLabels = {
  readonly light: string;
  readonly dark: string;
  readonly system: string;
  readonly ariaLabel?: string;
  readonly switchAriaLabelTemplate?: string;
};

function resolveThemeLabel(
  labels: ThemeToggleLabels | undefined,
  mode: ThemeMode,
): string {
  if (labels === undefined) return getThemeLabel(mode);
  if (mode === "light") return labels.light;
  if (mode === "dark") return labels.dark;
  return labels.system;
}

function resolveThemeAriaLabel(
  labels: ThemeToggleLabels | undefined,
  mode: ThemeMode,
): string {
  if (labels?.switchAriaLabelTemplate !== undefined) {
    return labels.switchAriaLabelTemplate.replace(
      "{current}",
      resolveThemeLabel(labels, mode),
    );
  }
  return getThemeAriaLabel(mode);
}

export interface ThemeToggleProps {
  /** Whether to show text labels alongside icons. Default: true. */
  readonly showLabels?: boolean;
  /** i18n labels for theme modes. */
  readonly labels?: ThemeToggleLabels;
}

const containerStyle: Readonly<CSSProperties> = {
  display: "inline-flex",
  gap: "2px",
  borderRadius: "0.5rem",
  border: "1px solid var(--ui-border)",
  backgroundColor: "var(--ui-muted)",
  padding: "2px",
};

const buttonBaseStyle: Readonly<CSSProperties> = {
  display: "inline-flex",
  cursor: "pointer",
  alignItems: "center",
  justifyContent: "center",
  gap: "0.25rem",
  borderRadius: "0.375rem",
  border: "none",
  paddingLeft: "0.625rem",
  paddingRight: "0.625rem",
  paddingTop: "0.375rem",
  paddingBottom: "0.375rem",
  fontSize: "0.875rem",
  lineHeight: "1",
  transitionProperty: "color, background-color",
  transitionDuration: "150ms",
  color: "var(--ui-muted-foreground)",
  backgroundColor: "transparent",
};

const buttonActiveExtraStyle: Readonly<CSSProperties> = {
  backgroundColor: "var(--ui-background)",
  color: "var(--ui-foreground)",
  boxShadow:
    "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)",
};

const labelStyle: Readonly<CSSProperties> = {
  fontWeight: 500,
};

export function ThemeToggle({
  showLabels = true,
  labels,
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
      style={containerStyle}
      role="radiogroup"
      aria-label={labels?.ariaLabel ?? "Theme selection"}
      data-testid="theme-toggle"
    >
      {THEME_MODES.map((m) => {
        const isActive = mode === m;
        const iconId = getThemeIconId(m);
        const label = resolveThemeLabel(labels, m);
        const mergedStyle: Readonly<CSSProperties> = isActive
          ? { ...buttonBaseStyle, ...buttonActiveExtraStyle }
          : buttonBaseStyle;
        return (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={resolveThemeAriaLabel(labels, m)}
            className={
              isActive
                ? "theme-toggle-btn theme-toggle-btn--active"
                : "theme-toggle-btn"
            }
            style={mergedStyle}
            data-testid={`theme-toggle-${m satisfies string}`}
            onClick={() => handleClick(m)}
          >
            <ThemeIcon iconId={iconId} />
            {showLabels ? <span style={labelStyle}>{label}</span> : null}
          </button>
        );
      })}
    </div>
  );
}

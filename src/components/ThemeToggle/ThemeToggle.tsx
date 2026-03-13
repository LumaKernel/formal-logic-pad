/**
 * ThemeToggle — A segmented control for switching between light/dark/system themes.
 *
 * Uses lucide-react icons (Sun/Moon/Monitor). Keyboard accessible via Tab/Enter/Space.
 * Requires ThemeProvider in the component tree.
 * Styled with Tailwind utility classes + shadcn CSS variables.
 */

import { type ReactNode, useCallback } from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { THEME_MODES, type ThemeMode } from "../../lib/theme";
import { useThemeContext } from "../../lib/theme/ThemeProvider";
import {
  getThemeAriaLabel,
  getThemeIconId,
  getThemeLabel,
  type ThemeIconId,
} from "./themeToggleLogic";
import { cn } from "../../lib/utils";

function ThemeIcon({ iconId }: { readonly iconId: ThemeIconId }): ReactNode {
  const iconClass = "size-4 shrink-0";
  if (iconId === "sun") return <Sun className={iconClass} aria-hidden="true" />;
  if (iconId === "moon")
    return <Moon className={iconClass} aria-hidden="true" />;
  // fall-through: TypeScript narrows to "monitor"
  return <Monitor className={iconClass} aria-hidden="true" />;
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
      className="inline-flex gap-0.5 rounded-lg border border-ui-border bg-muted p-0.5"
      role="radiogroup"
      aria-label={labels?.ariaLabel ?? "Theme selection"}
      data-testid="theme-toggle"
    >
      {THEME_MODES.map((m) => {
        const isActive = mode === m;
        const iconId = getThemeIconId(m);
        const label = resolveThemeLabel(labels, m);
        return (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={resolveThemeAriaLabel(labels, m)}
            className={cn(
              "inline-flex cursor-pointer items-center justify-center gap-1 rounded-md border-none px-2.5 py-1.5 text-sm leading-none transition-colors duration-150",
              "text-muted-foreground hover:bg-ui-accent hover:text-foreground",
              "focus-visible:outline-2 focus-visible:outline-ring focus-visible:-outline-offset-2",
              isActive &&
                "bg-background text-foreground shadow-sm hover:bg-background",
            )}
            data-testid={`theme-toggle-${m satisfies string}`}
            onClick={() => handleClick(m)}
          >
            <ThemeIcon iconId={iconId} />
            {showLabels ? <span className="font-medium">{label}</span> : null}
          </button>
        );
      })}
    </div>
  );
}

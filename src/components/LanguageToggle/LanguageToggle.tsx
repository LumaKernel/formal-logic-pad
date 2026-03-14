/**
 * LanguageToggle — A segmented control for switching between supported locales.
 *
 * Presentation-only component. Receives current locale and change handler as props
 * to remain testable in Storybook without next-intl dependency.
 *
 * Keyboard accessible via Tab/Enter/Space.
 */

import { useCallback, type CSSProperties, type ReactNode } from "react";
import type { Locale } from "../../i18n/config";
import {
  getLocaleAriaLabel,
  getLocaleLabel,
  SUPPORTED_LOCALES,
} from "./languageToggleLogic";

export interface LanguageToggleProps {
  /** Currently active locale. */
  readonly locale: Locale;
  /** Called when user selects a different locale. */
  readonly onLocaleChange: (locale: Locale) => void;
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
  fontWeight: 500,
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

export function LanguageToggle({
  locale,
  onLocaleChange,
}: LanguageToggleProps): ReactNode {
  const handleClick = useCallback(
    (targetLocale: Locale) => {
      if (targetLocale !== locale) {
        onLocaleChange(targetLocale);
      }
    },
    [locale, onLocaleChange],
  );

  return (
    <div
      style={containerStyle}
      role="radiogroup"
      aria-label="Language selection"
      data-testid="language-toggle"
    >
      {SUPPORTED_LOCALES.map((l) => {
        const isActive = locale === l;
        const mergedStyle: Readonly<CSSProperties> = isActive
          ? { ...buttonBaseStyle, ...buttonActiveExtraStyle }
          : buttonBaseStyle;
        return (
          <button
            key={l}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={getLocaleAriaLabel(l)}
            className={
              isActive
                ? "theme-toggle-btn theme-toggle-btn--active"
                : "theme-toggle-btn"
            }
            style={mergedStyle}
            data-testid={`language-toggle-${l satisfies string}`}
            onClick={() => handleClick(l)}
          >
            {getLocaleLabel(l)}
          </button>
        );
      })}
    </div>
  );
}

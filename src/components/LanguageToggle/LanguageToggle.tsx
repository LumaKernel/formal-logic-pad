/**
 * LanguageToggle — A segmented control for switching between supported locales.
 *
 * Presentation-only component. Receives current locale and change handler as props
 * to remain testable in Storybook without next-intl dependency.
 *
 * Keyboard accessible via Tab/Enter/Space.
 */

import { useCallback, type ReactNode } from "react";
import type { Locale } from "../../i18n/config";
import {
  getLocaleAriaLabel,
  getLocaleLabel,
  SUPPORTED_LOCALES,
} from "./languageToggleLogic";
import styles from "./LanguageToggle.module.css";

export interface LanguageToggleProps {
  /** Currently active locale. */
  readonly locale: Locale;
  /** Called when user selects a different locale. */
  readonly onLocaleChange: (locale: Locale) => void;
}

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
      className={styles.container}
      role="radiogroup"
      aria-label="Language selection"
      data-testid="language-toggle"
    >
      {SUPPORTED_LOCALES.map((l) => {
        const isActive = locale === l;
        return (
          <button
            key={l}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={getLocaleAriaLabel(l)}
            className={[styles.button, isActive ? styles.active : ""]
              .filter(Boolean)
              .join(" ")}
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

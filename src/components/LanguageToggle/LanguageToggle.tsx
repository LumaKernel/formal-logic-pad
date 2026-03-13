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
import { cn } from "@/lib/utils";
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
      className="inline-flex gap-0.5 p-0.5 rounded-lg bg-[var(--color-badge-bg,#e8eaf0)] border border-[var(--color-border,#e2e8f0)] transition-[background-color,border-color] duration-[var(--theme-transition-duration,0s)] ease-in-out"
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
            className={cn(
              "inline-flex items-center justify-center gap-1 px-2.5 py-1.5 border-none rounded-md bg-transparent text-[var(--color-text-secondary,#666666)] cursor-pointer text-[length:var(--font-size-sm)] leading-none font-medium transition-[background-color,color] duration-150",
              "hover:bg-[var(--color-surface-hover,#f0f0f0)] hover:text-[var(--color-text-primary,#171717)]",
              "focus-visible:outline-2 focus-visible:outline-[var(--color-accent,#555ab9)] focus-visible:outline-offset-[-2px]",
              isActive &&
                "bg-[var(--color-surface,#ffffff)] text-[var(--color-text-primary,#171717)] shadow-sm hover:bg-[var(--color-surface,#ffffff)]",
            )}
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

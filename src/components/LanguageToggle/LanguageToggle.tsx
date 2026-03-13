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
      className="inline-flex gap-0.5 rounded-lg border border-ui-border bg-muted p-0.5"
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
              "inline-flex cursor-pointer items-center justify-center gap-1 rounded-md border-none px-2.5 py-1.5 text-sm leading-none font-medium transition-colors duration-150",
              "text-muted-foreground hover:bg-ui-accent hover:text-foreground",
              "focus-visible:outline-2 focus-visible:outline-ring focus-visible:-outline-offset-2",
              isActive &&
                "bg-background text-foreground shadow-sm hover:bg-background",
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

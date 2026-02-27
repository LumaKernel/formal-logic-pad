/**
 * Hook for locale switching via cookie + page reload.
 *
 * Sets the locale cookie and triggers a page reload to pick up the new locale
 * on the server side (next-intl reads from cookie in getRequestConfig).
 */

import { useCallback, useMemo } from "react";
import type { Locale } from "../../i18n/config";
import { buildLocaleCookieValue } from "./languageToggleLogic";

export interface UseLocaleSwitchDeps {
  /** Get current document.cookie value. */
  readonly getCookie: () => string;
  /** Set document.cookie value. */
  readonly setCookie: (value: string) => void;
  /** Reload the page. */
  readonly reload: () => void;
}

export interface UseLocaleSwitchResult {
  /** Switch to a new locale. Sets cookie and reloads. */
  readonly switchLocale: (locale: Locale) => void;
}

export function useLocaleSwitch(
  deps: UseLocaleSwitchDeps,
): UseLocaleSwitchResult {
  const { setCookie, reload } = deps;

  const switchLocale = useCallback(
    (locale: Locale) => {
      setCookie(buildLocaleCookieValue(locale));
      reload();
    },
    [setCookie, reload],
  );

  return useMemo(() => ({ switchLocale }), [switchLocale]);
}

/** Default browser deps for useLocaleSwitch. */
/* v8 ignore start */
export function getBrowserLocaleSwitchDeps(): UseLocaleSwitchDeps {
  return {
    getCookie: () => document.cookie,
    setCookie: (value: string) => {
      document.cookie = value;
    },
    reload: () => window.location.reload(),
  };
}
/* v8 ignore stop */

/**
 * Pure logic for the LanguageToggle component.
 *
 * No DOM, no React, no side effects.
 * Provides labels and display names for supported locales.
 */

import { type Locale, locales } from "../../i18n/config";

/** All supported locales as a readonly tuple. Re-exported for convenience. */
export const SUPPORTED_LOCALES: readonly Locale[] = locales;

/** Cookie name used to persist user locale preference. */
export const LOCALE_COOKIE_NAME = "locale";

/** Get the display label for a locale (shown in the toggle button). */
export function getLocaleLabel(locale: Locale): string {
  if (locale === "en") return "EN";
  // fall-through: TypeScript narrows to "ja"
  return "JA";
}

/** Get the native language name for a locale (e.g. for aria-label). */
export function getLocaleNativeName(locale: Locale): string {
  if (locale === "en") return "English";
  // fall-through: TypeScript narrows to "ja"
  return "日本語";
}

/** Get the aria-label for the toggle button for a given locale. */
export function getLocaleAriaLabel(locale: Locale): string {
  return `Switch language to ${getLocaleNativeName(locale) satisfies string}`;
}

/** Check if a value is a valid Locale. */
export function isLocale(value: string) {
  const found = locales.find((l) => l === value);
  return found !== undefined ? found : undefined;
}

/** Build cookie string for setting locale preference. */
export function buildLocaleCookieValue(locale: Locale): string {
  // maxAge: 1 year (365 days in seconds)
  return `${LOCALE_COOKIE_NAME satisfies string}=${locale satisfies string};path=/;max-age=31536000;samesite=lax`;
}

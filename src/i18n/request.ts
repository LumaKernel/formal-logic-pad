import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { locales, defaultLocale, type Locale } from "./config";

function findLocale(locale: string): Locale | undefined {
  return locales.find((l) => l === locale);
}

function parseAcceptLanguage(header: string): Locale | null {
  const languages = header
    .split(",")
    .map((lang) => {
      const [code, qValue] = lang.trim().split(";q=");
      return {
        code: code.split("-")[0].toLowerCase(),
        q: qValue ? parseFloat(qValue) : 1,
      };
    })
    .sort((a, b) => b.q - a.q);

  for (const { code } of languages) {
    const found = findLocale(code);
    if (found) {
      return found;
    }
  }
  return null;
}

export default getRequestConfig(async () => {
  // 1. Check cookie (user preference)
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get("locale")?.value;
  const validCookieLocale = cookieLocale ? findLocale(cookieLocale) : undefined;
  if (validCookieLocale) {
    return {
      locale: validCookieLocale,
      messages: (
        await import(
          `../../messages/${validCookieLocale satisfies string}.json`
        )
      ).default,
    };
  }

  // 2. Check Accept-Language header (browser setting)
  const headerStore = await headers();
  const acceptLanguage = headerStore.get("accept-language");
  if (acceptLanguage) {
    const browserLocale = parseAcceptLanguage(acceptLanguage);
    if (browserLocale) {
      return {
        locale: browserLocale,
        messages: (
          await import(`../../messages/${browserLocale satisfies string}.json`)
        ).default,
      };
    }
  }

  // 3. Fallback to default (English)
  return {
    locale: defaultLocale,
    messages: (
      await import(`../../messages/${defaultLocale satisfies string}.json`)
    ).default,
  };
});

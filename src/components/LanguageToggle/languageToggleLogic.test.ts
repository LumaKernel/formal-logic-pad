import { describe, expect, it } from "vitest";
import {
  buildLocaleCookieValue,
  getLocaleAriaLabel,
  getLocaleLabel,
  getLocaleNativeName,
  isLocale,
  LOCALE_COOKIE_NAME,
  SUPPORTED_LOCALES,
} from "./languageToggleLogic";

describe("languageToggleLogic", () => {
  describe("SUPPORTED_LOCALES", () => {
    it("contains en and ja", () => {
      expect(SUPPORTED_LOCALES).toEqual(["en", "ja"]);
    });
  });

  describe("LOCALE_COOKIE_NAME", () => {
    it("is 'locale'", () => {
      expect(LOCALE_COOKIE_NAME).toBe("locale");
    });
  });

  describe("getLocaleLabel", () => {
    it("returns EN for en", () => {
      expect(getLocaleLabel("en")).toBe("EN");
    });

    it("returns JA for ja", () => {
      expect(getLocaleLabel("ja")).toBe("JA");
    });
  });

  describe("getLocaleNativeName", () => {
    it("returns English for en", () => {
      expect(getLocaleNativeName("en")).toBe("English");
    });

    it("returns 日本語 for ja", () => {
      expect(getLocaleNativeName("ja")).toBe("日本語");
    });
  });

  describe("getLocaleAriaLabel", () => {
    it("returns aria-label for en", () => {
      expect(getLocaleAriaLabel("en")).toBe("Switch language to English");
    });

    it("returns aria-label for ja", () => {
      expect(getLocaleAriaLabel("ja")).toBe("Switch language to 日本語");
    });
  });

  describe("isLocale", () => {
    it("returns the locale for valid locales", () => {
      expect(isLocale("en")).toBe("en");
      expect(isLocale("ja")).toBe("ja");
    });

    it("returns undefined for invalid values", () => {
      expect(isLocale("fr")).toBeUndefined();
      expect(isLocale("")).toBeUndefined();
      expect(isLocale("zh")).toBeUndefined();
    });
  });

  describe("buildLocaleCookieValue", () => {
    it("builds correct cookie string for en", () => {
      const result = buildLocaleCookieValue("en");
      expect(result).toBe("locale=en;path=/;max-age=31536000;samesite=lax");
    });

    it("builds correct cookie string for ja", () => {
      const result = buildLocaleCookieValue("ja");
      expect(result).toBe("locale=ja;path=/;max-age=31536000;samesite=lax");
    });
  });
});

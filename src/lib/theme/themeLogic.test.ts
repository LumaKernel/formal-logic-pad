import { describe, expect, it } from "vitest";
import {
  isThemeMode,
  nextThemeMode,
  resolveTheme,
  THEME_MODES,
  THEME_STORAGE_KEY,
  THEME_DATA_ATTRIBUTE,
  type ThemeMode,
  type ResolvedTheme,
} from "./themeLogic";

describe("themeLogic", () => {
  describe("constants", () => {
    it("THEME_MODES contains all three modes", () => {
      expect(THEME_MODES).toEqual(["light", "dark", "system"]);
    });

    it("THEME_STORAGE_KEY is a non-empty string", () => {
      expect(THEME_STORAGE_KEY).toBe("theme-mode");
    });

    it("THEME_DATA_ATTRIBUTE is a non-empty string", () => {
      expect(THEME_DATA_ATTRIBUTE).toBe("data-theme");
    });
  });

  describe("isThemeMode", () => {
    it('returns true for "light"', () => {
      expect(isThemeMode("light")).toBe(true);
    });

    it('returns true for "dark"', () => {
      expect(isThemeMode("dark")).toBe(true);
    });

    it('returns true for "system"', () => {
      expect(isThemeMode("system")).toBe(true);
    });

    it("returns false for arbitrary string", () => {
      expect(isThemeMode("auto")).toBe(false);
    });

    it("returns false for null", () => {
      expect(isThemeMode(null)).toBe(false);
    });

    it("returns false for undefined", () => {
      expect(isThemeMode(undefined)).toBe(false);
    });

    it("returns false for number", () => {
      expect(isThemeMode(42)).toBe(false);
    });
  });

  describe("resolveTheme", () => {
    it('resolves "light" mode to "light" regardless of system preference', () => {
      expect(resolveTheme("light", false)).toBe(
        "light" satisfies ResolvedTheme,
      );
      expect(resolveTheme("light", true)).toBe("light" satisfies ResolvedTheme);
    });

    it('resolves "dark" mode to "dark" regardless of system preference', () => {
      expect(resolveTheme("dark", false)).toBe("dark" satisfies ResolvedTheme);
      expect(resolveTheme("dark", true)).toBe("dark" satisfies ResolvedTheme);
    });

    it('resolves "system" mode to "light" when system prefers light', () => {
      expect(resolveTheme("system", false)).toBe(
        "light" satisfies ResolvedTheme,
      );
    });

    it('resolves "system" mode to "dark" when system prefers dark', () => {
      expect(resolveTheme("system", true)).toBe("dark" satisfies ResolvedTheme);
    });
  });

  describe("nextThemeMode", () => {
    it("cycles light → dark", () => {
      expect(nextThemeMode("light")).toBe("dark" satisfies ThemeMode);
    });

    it("cycles dark → system", () => {
      expect(nextThemeMode("dark")).toBe("system" satisfies ThemeMode);
    });

    it("cycles system → light", () => {
      expect(nextThemeMode("system")).toBe("light" satisfies ThemeMode);
    });

    it("full cycle returns to start", () => {
      const start: ThemeMode = "light";
      const step1 = nextThemeMode(start);
      const step2 = nextThemeMode(step1);
      const step3 = nextThemeMode(step2);
      expect(step3).toBe(start);
    });
  });
});

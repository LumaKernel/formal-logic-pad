import { describe, expect, it } from "vitest";
import {
  getThemeIconId,
  getThemeLabel,
  getThemeAriaLabel,
} from "./themeToggleLogic";
import type { ThemeMode } from "../../lib/theme";

describe("getThemeIconId", () => {
  it("returns 'sun' for light mode", () => {
    expect(getThemeIconId("light")).toBe("sun");
  });

  it("returns 'moon' for dark mode", () => {
    expect(getThemeIconId("dark")).toBe("moon");
  });

  it("returns 'monitor' for system mode", () => {
    expect(getThemeIconId("system")).toBe("monitor");
  });

  it("covers all ThemeMode values", () => {
    const modes: readonly ThemeMode[] = ["light", "dark", "system"];
    const results = modes.map(getThemeIconId);
    expect(results).toEqual(["sun", "moon", "monitor"]);
  });
});

describe("getThemeLabel", () => {
  it("returns 'Light' for light mode", () => {
    expect(getThemeLabel("light")).toBe("Light");
  });

  it("returns 'Dark' for dark mode", () => {
    expect(getThemeLabel("dark")).toBe("Dark");
  });

  it("returns 'System' for system mode", () => {
    expect(getThemeLabel("system")).toBe("System");
  });
});

describe("getThemeAriaLabel", () => {
  it("returns aria-label with current mode for light", () => {
    expect(getThemeAriaLabel("light")).toBe("Switch theme (current: Light)");
  });

  it("returns aria-label with current mode for dark", () => {
    expect(getThemeAriaLabel("dark")).toBe("Switch theme (current: Dark)");
  });

  it("returns aria-label with current mode for system", () => {
    expect(getThemeAriaLabel("system")).toBe("Switch theme (current: System)");
  });
});

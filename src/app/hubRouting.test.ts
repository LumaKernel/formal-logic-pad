import { describe, it, expect } from "vitest";
import { resolveTabFromPath, resolvePathFromTab } from "./hubRouting";
import type { HubTab } from "./HubPageView";

describe("resolveTabFromPath", () => {
  const cases: readonly (readonly [string, HubTab])[] = [
    ["/", "notebooks"],
    ["/quests", "quests"],
    ["/custom-quests", "custom-quests"],
    ["/collection", "collection"],
    ["/reference", "reference"],
    ["/scripts", "scripts"],
    ["/trash", "trash"],
  ] as const;

  it.each(cases)("resolves %s → %s", (path, expected) => {
    expect(resolveTabFromPath(path)).toBe(expected);
  });

  it("returns null for unknown path", () => {
    expect(resolveTabFromPath("/workspace/123")).toBeNull();
    expect(resolveTabFromPath("/unknown")).toBeNull();
  });
});

describe("resolvePathFromTab", () => {
  const cases: readonly (readonly [HubTab, string])[] = [
    ["notebooks", "/"],
    ["quests", "/quests"],
    ["custom-quests", "/custom-quests"],
    ["collection", "/collection"],
    ["reference", "/reference"],
    ["scripts", "/scripts"],
    ["trash", "/trash"],
  ] as const;

  it.each(cases)("resolves %s → %s", (tab, expected) => {
    expect(resolvePathFromTab(tab)).toBe(expected);
  });
});

describe("round-trip consistency", () => {
  const tabs: readonly HubTab[] = [
    "notebooks",
    "quests",
    "custom-quests",
    "collection",
    "reference",
    "scripts",
    "trash",
  ] as const;

  it.each(tabs)("tab → path → tab round-trips for %s", (tab) => {
    const path = resolvePathFromTab(tab);
    expect(resolveTabFromPath(path)).toBe(tab);
  });
});

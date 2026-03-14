import { describe, it, expect } from "vitest";
import {
  formatSavedAtLabel,
  toScriptListItems,
} from "./scriptListPanelLogic";
import type { SavedScript } from "./savedScriptsLogic";

describe("formatSavedAtLabel", () => {
  const base = 1_700_000_000_000;

  it("直後は 'just now' を返す", () => {
    expect(formatSavedAtLabel(base, base + 30_000)).toBe("just now");
  });

  it("1分後は '1m ago' を返す", () => {
    expect(formatSavedAtLabel(base, base + 60_000)).toBe("1m ago");
  });

  it("30分後は '30m ago' を返す", () => {
    expect(formatSavedAtLabel(base, base + 30 * 60_000)).toBe("30m ago");
  });

  it("1時間後は '1h ago' を返す", () => {
    expect(formatSavedAtLabel(base, base + 60 * 60_000)).toBe("1h ago");
  });

  it("23時間後は '23h ago' を返す", () => {
    expect(formatSavedAtLabel(base, base + 23 * 60 * 60_000)).toBe("23h ago");
  });

  it("1日後は '1d ago' を返す", () => {
    expect(formatSavedAtLabel(base, base + 24 * 60 * 60_000)).toBe("1d ago");
  });

  it("7日後は '7d ago' を返す", () => {
    expect(formatSavedAtLabel(base, base + 7 * 24 * 60 * 60_000)).toBe(
      "7d ago",
    );
  });
});

describe("toScriptListItems", () => {
  const now = 1_700_000_100_000;

  const scripts: readonly SavedScript[] = [
    { id: "s1", title: "Script A", code: "a", savedAt: 1_700_000_000_000 },
    { id: "s2", title: "Script B", code: "b", savedAt: 1_700_000_050_000 },
    { id: "s3", title: "Script C", code: "c", savedAt: 1_700_000_090_000 },
  ];

  it("新しい順にソートされる", () => {
    const items = toScriptListItems(scripts, now);
    expect(items.map((i) => i.id)).toEqual(["s3", "s2", "s1"]);
  });

  it("各アイテムに title と savedAtLabel が含まれる", () => {
    const items = toScriptListItems(scripts, now);
    expect(items[0]).toEqual({
      id: "s3",
      title: "Script C",
      savedAtLabel: "just now",
    });
  });

  it("空配列を渡すと空配列を返す", () => {
    expect(toScriptListItems([], now)).toEqual([]);
  });

  it("元配列を変更しない", () => {
    const original = [...scripts];
    toScriptListItems(scripts, now);
    expect(scripts).toEqual(original);
  });
});

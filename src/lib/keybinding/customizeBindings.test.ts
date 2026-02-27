import { describe, it, expect } from "vitest";
import type { KeyBindingMap } from "./keybinding";
import { charKey, specialKey } from "./keybinding";
import { applyOverrides, type KeyBindingOverrides } from "./customizeBindings";

type TestAction = "save" | "delete" | "search";

const defaults: KeyBindingMap<TestAction> = [
  { action: "save", binding: charKey("s", "mod") },
  { action: "delete", binding: specialKey("delete") },
  { action: "delete", binding: specialKey("backspace") },
  { action: "search", binding: charKey("f", "mod") },
];

describe("applyOverrides", () => {
  it("オーバーライドなしならデフォルトそのまま", () => {
    const result = applyOverrides(defaults, []);
    expect(result).toEqual(defaults);
  });

  it("removeでアクションのバインディングを全削除", () => {
    const overrides: KeyBindingOverrides<TestAction> = [
      { action: "delete", strategy: "remove" },
    ];
    const result = applyOverrides(defaults, overrides);
    expect(result).toHaveLength(2);
    expect(result.every((e) => e.action !== "delete")).toBe(true);
  });

  it("replaceでアクションのバインディングを差し替え", () => {
    const overrides: KeyBindingOverrides<TestAction> = [
      {
        action: "save",
        strategy: "replace",
        binding: charKey("w", "mod"),
      },
    ];
    const result = applyOverrides(defaults, overrides);
    // 元のsaveバインディングは消え、新しいものが末尾に追加
    const saveEntries = result.filter((e) => e.action === "save");
    expect(saveEntries).toHaveLength(1);
    const saveBinding = saveEntries[0]?.binding;
    expect(
      saveBinding?.type === "single" &&
        saveBinding.stroke.type === "char" &&
        saveBinding.stroke.char === "w",
    ).toBe(true);
  });

  it("addで既存に追加", () => {
    const overrides: KeyBindingOverrides<TestAction> = [
      {
        action: "save",
        strategy: "add",
        binding: charKey("w", "mod"),
      },
    ];
    const result = applyOverrides(defaults, overrides);
    const saveEntries = result.filter((e) => e.action === "save");
    expect(saveEntries).toHaveLength(2);
  });

  it("複数のオーバーライドを組み合わせ", () => {
    const overrides: KeyBindingOverrides<TestAction> = [
      { action: "delete", strategy: "remove" },
      { action: "save", strategy: "replace", binding: charKey("w", "mod") },
      { action: "search", strategy: "add", binding: charKey("p", "mod") },
    ];
    const result = applyOverrides(defaults, overrides);

    // deleteは消える
    expect(result.filter((e) => e.action === "delete")).toHaveLength(0);
    // saveは差し替え
    const saveEntries = result.filter((e) => e.action === "save");
    expect(saveEntries).toHaveLength(1);
    // searchは元のと追加の2つ
    const searchEntries = result.filter((e) => e.action === "search");
    expect(searchEntries).toHaveLength(2);
  });

  it("空のデフォルトにaddオーバーライド", () => {
    const overrides: KeyBindingOverrides<TestAction> = [
      {
        action: "save",
        strategy: "add",
        binding: charKey("s", "mod"),
      },
    ];
    const result = applyOverrides([], overrides);
    expect(result).toHaveLength(1);
    expect(result[0]?.action).toBe("save");
  });
});

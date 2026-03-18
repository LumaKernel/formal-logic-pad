import { describe, it, expect } from "vitest";
import {
  templateToLibraryItem,
  savedScriptToLibraryItem,
  buildLibraryItems,
  searchLibraryItems,
  filterByKind,
  filterLibraryItems,
  updateSearchQuery,
  updateFilterKind,
  initialScriptLibraryState,
} from "./scriptLibraryLogic";
import type { LibraryItem } from "./scriptLibraryLogic";
import type { ScriptTemplate } from "@/lib/script-runner/templates";
import type { SavedScript } from "./savedScriptsLogic";

// ── テストデータ ───────────────────────────────────────────────

const hilbertTemplate: ScriptTemplate = {
  id: "hilbert-1",
  title: "Hilbert テスト",
  description: "ヒルベルト系テンプレート",
  code: "// hilbert",
  compatibleStyles: ["hilbert"],
};

const scTemplate: ScriptTemplate = {
  id: "sc-1",
  title: "SC テスト",
  description: "シーケント計算テンプレート",
  code: "// sc",
  compatibleStyles: ["sequent-calculus"],
};

const universalTemplate: ScriptTemplate = {
  id: "universal-1",
  title: "Universal テスト",
  description: "汎用テンプレート",
  code: "// universal",
};

const savedScript: SavedScript = {
  id: "saved-1",
  title: "My Script",
  code: "console.log('hello')",
  savedAt: 1000,
};

const allTemplates = [hilbertTemplate, scTemplate, universalTemplate];

// ── テスト ──────────────────────────────────────────────────────

describe("templateToLibraryItem", () => {
  it("テンプレートをライブラリアイテムに変換する", () => {
    const item = templateToLibraryItem(hilbertTemplate);
    expect(item).toEqual({
      id: "hilbert-1",
      title: "Hilbert テスト",
      description: "ヒルベルト系テンプレート",
      code: "// hilbert",
      kind: "builtin",
      compatibleStyles: ["hilbert"],
    });
  });

  it("compatibleStyles未指定のテンプレートも変換できる", () => {
    const item = templateToLibraryItem(universalTemplate);
    expect(item.compatibleStyles).toBeUndefined();
    expect(item.kind).toBe("builtin");
  });
});

describe("savedScriptToLibraryItem", () => {
  it("保存済みスクリプトをライブラリアイテムに変換する", () => {
    const item = savedScriptToLibraryItem(savedScript);
    expect(item).toEqual({
      id: "saved-1",
      title: "My Script",
      description: "",
      code: "console.log('hello')",
      kind: "saved",
    });
  });
});

describe("buildLibraryItems", () => {
  it("テンプレートと保存済みスクリプトを統合する", () => {
    const items = buildLibraryItems(allTemplates, [savedScript], undefined);
    expect(items).toHaveLength(4);
    expect(items[0]?.kind).toBe("builtin");
    expect(items[3]?.kind).toBe("saved");
  });

  it("演繹スタイルでフィルタリングする", () => {
    const items = buildLibraryItems(allTemplates, [savedScript], "hilbert");
    // hilbert-1 + universal-1 + saved-1
    expect(items).toHaveLength(3);
    expect(items.map((i) => i.id)).toEqual([
      "hilbert-1",
      "universal-1",
      "saved-1",
    ]);
  });

  it("保存済みスクリプトが空でもテンプレートは返る", () => {
    const items = buildLibraryItems(allTemplates, [], undefined);
    expect(items).toHaveLength(3);
  });

  it("テンプレートが空でも保存済みスクリプトは返る", () => {
    const items = buildLibraryItems([], [savedScript], undefined);
    expect(items).toHaveLength(1);
  });
});

describe("searchLibraryItems", () => {
  const items: readonly LibraryItem[] = [
    templateToLibraryItem(hilbertTemplate),
    templateToLibraryItem(scTemplate),
    savedScriptToLibraryItem(savedScript),
  ];

  it("空クエリは全アイテムを返す", () => {
    expect(searchLibraryItems(items, "")).toHaveLength(3);
    expect(searchLibraryItems(items, "  ")).toHaveLength(3);
  });

  it("タイトルで部分一致検索する", () => {
    const result = searchLibraryItems(items, "Hilbert");
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("hilbert-1");
  });

  it("説明で部分一致検索する", () => {
    const result = searchLibraryItems(items, "シーケント");
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("sc-1");
  });

  it("case-insensitiveで検索する", () => {
    const result = searchLibraryItems(items, "hilbert");
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("hilbert-1");
  });

  it("該当なしの場合は空配列を返す", () => {
    const result = searchLibraryItems(items, "nonexistent");
    expect(result).toHaveLength(0);
  });
});

describe("filterByKind", () => {
  const items: readonly LibraryItem[] = [
    templateToLibraryItem(hilbertTemplate),
    templateToLibraryItem(scTemplate),
    savedScriptToLibraryItem(savedScript),
  ];

  it("allは全アイテムを返す", () => {
    expect(filterByKind(items, "all")).toHaveLength(3);
  });

  it("builtinでフィルタリングする", () => {
    const result = filterByKind(items, "builtin");
    expect(result).toHaveLength(2);
    expect(result.every((i) => i.kind === "builtin")).toBe(true);
  });

  it("savedでフィルタリングする", () => {
    const result = filterByKind(items, "saved");
    expect(result).toHaveLength(1);
    expect(result[0]?.kind).toBe("saved");
  });
});

describe("filterLibraryItems", () => {
  const items: readonly LibraryItem[] = [
    templateToLibraryItem(hilbertTemplate),
    templateToLibraryItem(scTemplate),
    savedScriptToLibraryItem(savedScript),
  ];

  it("検索とフィルタを組み合わせる", () => {
    const state = updateFilterKind(
      updateSearchQuery(initialScriptLibraryState, "テスト"),
      "builtin",
    );
    const result = filterLibraryItems(items, state);
    expect(result).toHaveLength(2);
    expect(result.every((i) => i.kind === "builtin")).toBe(true);
  });

  it("初期状態では全アイテムを返す", () => {
    const result = filterLibraryItems(items, initialScriptLibraryState);
    expect(result).toHaveLength(3);
  });
});

describe("状態更新", () => {
  it("updateSearchQuery", () => {
    const next = updateSearchQuery(initialScriptLibraryState, "test");
    expect(next.searchQuery).toBe("test");
    expect(next.filterKind).toBe("all");
  });

  it("updateFilterKind", () => {
    const next = updateFilterKind(initialScriptLibraryState, "builtin");
    expect(next.filterKind).toBe("builtin");
    expect(next.searchQuery).toBe("");
  });
});

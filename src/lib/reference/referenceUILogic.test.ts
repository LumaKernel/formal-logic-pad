import { describe, expect, it } from "vitest";
import type { ReferenceEntry } from "./referenceEntry";
import {
  buildModalData,
  buildPopoverData,
  parseInlineMarkdown,
} from "./referenceUILogic";

// --- テスト用ヘルパー ---

const makeEntry = (
  overrides: Partial<ReferenceEntry> = {},
): ReferenceEntry => ({
  id: "test-entry",
  category: "axiom",
  title: { en: "Test Entry", ja: "テストエントリ" },
  summary: {
    en: "A test summary.",
    ja: "テスト要約。",
  },
  body: {
    en: ["First paragraph.", "Second paragraph with **bold** text."],
    ja: ["第1パラグラフ。", "**太字**を含む第2パラグラフ。"],
  },
  formalNotation: "\\varphi \\to \\psi",
  relatedEntryIds: ["related-1"],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://example.com",
      label: { en: "Example Link", ja: "サンプルリンク" },
    },
  ],
  keywords: ["test"],
  order: 1,
  ...overrides,
});

const makeRelatedEntry = (): ReferenceEntry =>
  makeEntry({
    id: "related-1",
    title: { en: "Related Entry", ja: "関連エントリ" },
    relatedEntryIds: [],
  });

// --- parseInlineMarkdown ---

describe("parseInlineMarkdown", () => {
  it("プレーンテキストをそのまま返す", () => {
    const result = parseInlineMarkdown("Hello world");
    expect(result).toEqual([{ type: "text", content: "Hello world" }]);
  });

  it("太字を正しくパースする", () => {
    const result = parseInlineMarkdown("before **bold** after");
    expect(result).toEqual([
      { type: "text", content: "before " },
      { type: "bold", content: "bold" },
      { type: "text", content: " after" },
    ]);
  });

  it("複数の太字をパースする", () => {
    const result = parseInlineMarkdown("**a** text **b**");
    expect(result).toEqual([
      { type: "bold", content: "a" },
      { type: "text", content: " text " },
      { type: "bold", content: "b" },
    ]);
  });

  it("閉じ**がない場合はテキストとして扱う", () => {
    const result = parseInlineMarkdown("before **unclosed");
    expect(result).toEqual([
      { type: "text", content: "before " },
      { type: "text", content: "**unclosed" },
    ]);
  });

  it("空文字列を処理する", () => {
    const result = parseInlineMarkdown("");
    expect(result).toEqual([]);
  });

  it("太字のみの文字列を処理する", () => {
    const result = parseInlineMarkdown("**only bold**");
    expect(result).toEqual([{ type: "bold", content: "only bold" }]);
  });

  it("連続する太字をパースする", () => {
    const result = parseInlineMarkdown("**a****b**");
    expect(result).toEqual([
      { type: "bold", content: "a" },
      { type: "bold", content: "b" },
    ]);
  });

  it("空の太字(***)はスキップする", () => {
    const result = parseInlineMarkdown("before **** after");
    expect(result).toEqual([
      { type: "text", content: "before " },
      { type: "text", content: " after" },
    ]);
  });

  // --- italic ---

  it("イタリックを正しくパースする", () => {
    const result = parseInlineMarkdown("before *italic* after");
    expect(result).toEqual([
      { type: "text", content: "before " },
      { type: "italic", content: "italic" },
      { type: "text", content: " after" },
    ]);
  });

  it("イタリックのみの文字列を処理する", () => {
    const result = parseInlineMarkdown("*only italic*");
    expect(result).toEqual([{ type: "italic", content: "only italic" }]);
  });

  it("複数のイタリックをパースする", () => {
    const result = parseInlineMarkdown("*a* text *b*");
    expect(result).toEqual([
      { type: "italic", content: "a" },
      { type: "text", content: " text " },
      { type: "italic", content: "b" },
    ]);
  });

  it("閉じ*がない場合はテキストとして扱う", () => {
    const result = parseInlineMarkdown("before *unclosed");
    expect(result).toEqual([
      { type: "text", content: "before " },
      { type: "text", content: "*unclosed" },
    ]);
  });

  it("空のイタリック(**)はスキップする", () => {
    // ** は bold の開始マーカーとして扱われる
    const result = parseInlineMarkdown("text ** more");
    expect(result).toEqual([
      { type: "text", content: "text " },
      { type: "text", content: "** more" },
    ]);
  });

  // --- bold と italic の混在 ---

  it("太字とイタリックの混在をパースする", () => {
    const result = parseInlineMarkdown("**bold** and *italic*");
    expect(result).toEqual([
      { type: "bold", content: "bold" },
      { type: "text", content: " and " },
      { type: "italic", content: "italic" },
    ]);
  });

  it("イタリック→太字の順でパースする", () => {
    const result = parseInlineMarkdown("*italic* then **bold**");
    expect(result).toEqual([
      { type: "italic", content: "italic" },
      { type: "text", content: " then " },
      { type: "bold", content: "bold" },
    ]);
  });

  it("MPリファレンスの実際のテキストをパースする", () => {
    const result = parseInlineMarkdown(
      "**Modus ponens** (MP, also called *detachment*) is the sole inference rule.",
    );
    expect(result).toEqual([
      { type: "bold", content: "Modus ponens" },
      { type: "text", content: " (MP, also called " },
      { type: "italic", content: "detachment" },
      { type: "text", content: ") is the sole inference rule." },
    ]);
  });

  it("日本語のMPリファレンスのテキストをパースする", () => {
    const result = parseInlineMarkdown(
      "**モーダスポネンス** (MP、*分離規則*とも呼ばれる) はHilbert系証明体系における唯一の推論規則です。",
    );
    expect(result).toEqual([
      { type: "bold", content: "モーダスポネンス" },
      { type: "text", content: " (MP、" },
      { type: "italic", content: "分離規則" },
      {
        type: "text",
        content:
          "とも呼ばれる) はHilbert系証明体系における唯一の推論規則です。",
      },
    ]);
  });
});

// --- buildPopoverData ---

describe("buildPopoverData", () => {
  it("英語でポップオーバーデータを生成する", () => {
    const entry = makeEntry();
    const result = buildPopoverData(entry, "en");

    expect(result).toEqual({
      title: "Test Entry",
      categoryLabel: "Axioms",
      summary: "A test summary.",
      formalNotation: "\\varphi \\to \\psi",
      hasDetail: true,
    });
  });

  it("日本語でポップオーバーデータを生成する", () => {
    const entry = makeEntry();
    const result = buildPopoverData(entry, "ja");

    expect(result).toEqual({
      title: "テストエントリ",
      categoryLabel: "公理",
      summary: "テスト要約。",
      formalNotation: "\\varphi \\to \\psi",
      hasDetail: true,
    });
  });

  it("formalNotationがない場合はundefined", () => {
    const entry = makeEntry({ formalNotation: undefined });
    const result = buildPopoverData(entry, "en");

    expect(result.formalNotation).toBeUndefined();
  });

  it("bodyも関連も外部リンクもない場合はhasDetailがfalse", () => {
    const entry = makeEntry({
      body: { en: [], ja: [] },
      relatedEntryIds: [],
      externalLinks: [],
    });
    const result = buildPopoverData(entry, "en");

    expect(result.hasDetail).toBe(false);
  });

  it("bodyがあれば関連がなくてもhasDetailはtrue", () => {
    const entry = makeEntry({
      relatedEntryIds: [],
      externalLinks: [],
    });
    const result = buildPopoverData(entry, "en");

    expect(result.hasDetail).toBe(true);
  });

  it("bodyがなくても関連があればhasDetailはtrue", () => {
    const entry = makeEntry({
      body: { en: [], ja: [] },
      externalLinks: [],
    });
    const result = buildPopoverData(entry, "en");

    expect(result.hasDetail).toBe(true);
  });

  it("bodyがなくても外部リンクがあればhasDetailはtrue", () => {
    const entry = makeEntry({
      body: { en: [], ja: [] },
      relatedEntryIds: [],
    });
    const result = buildPopoverData(entry, "en");

    expect(result.hasDetail).toBe(true);
  });

  it("不明なカテゴリの場合はcategory文字列をそのまま使う", () => {
    const entry = makeEntry({
      category: "unknown-category" as "axiom",
    });
    const result = buildPopoverData(entry, "en");

    expect(result.categoryLabel).toBe("unknown-category");
  });
});

// --- buildModalData ---

describe("buildModalData", () => {
  it("英語でモーダルデータを生成する", () => {
    const entry = makeEntry();
    const allEntries = [entry, makeRelatedEntry()];
    const result = buildModalData(entry, allEntries, "en");

    expect(result.title).toBe("Test Entry");
    expect(result.categoryLabel).toBe("Axioms");
    expect(result.summary).toBe("A test summary.");
    expect(result.formalNotation).toBe("\\varphi \\to \\psi");
    expect(result.bodyParagraphs).toEqual([
      "First paragraph.",
      "Second paragraph with **bold** text.",
    ]);
    expect(result.relatedEntries).toEqual([
      { id: "related-1", title: "Related Entry" },
    ]);
    expect(result.externalLinks).toEqual([
      { url: "https://example.com", label: "Example Link" },
    ]);
  });

  it("日本語でモーダルデータを生成する", () => {
    const entry = makeEntry();
    const allEntries = [entry, makeRelatedEntry()];
    const result = buildModalData(entry, allEntries, "ja");

    expect(result.title).toBe("テストエントリ");
    expect(result.categoryLabel).toBe("公理");
    expect(result.bodyParagraphs).toEqual([
      "第1パラグラフ。",
      "**太字**を含む第2パラグラフ。",
    ]);
    expect(result.relatedEntries).toEqual([
      { id: "related-1", title: "関連エントリ" },
    ]);
    expect(result.externalLinks).toEqual([
      { url: "https://example.com", label: "サンプルリンク" },
    ]);
  });

  it("関連エントリが見つからない場合は空配列", () => {
    const entry = makeEntry({ relatedEntryIds: ["nonexistent"] });
    const result = buildModalData(entry, [entry], "en");

    expect(result.relatedEntries).toEqual([]);
  });

  it("外部リンクがない場合は空配列", () => {
    const entry = makeEntry({ externalLinks: [] });
    const result = buildModalData(entry, [entry], "en");

    expect(result.externalLinks).toEqual([]);
  });

  it("formalNotationがない場合はundefined", () => {
    const entry = makeEntry({ formalNotation: undefined });
    const result = buildModalData(entry, [entry], "en");

    expect(result.formalNotation).toBeUndefined();
  });

  it("不明なカテゴリの場合はcategory文字列をそのまま使う", () => {
    const entry = makeEntry({
      category: "unknown-category" as "axiom",
    });
    const result = buildModalData(entry, [entry], "en");

    expect(result.categoryLabel).toBe("unknown-category");
  });
});

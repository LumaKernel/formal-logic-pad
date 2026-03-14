import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ReferenceEntry } from "./referenceEntry";
import {
  ReferenceViewerPageView,
  ReferenceViewerNotFound,
} from "./ReferenceViewerPageView";

afterEach(cleanup);

const makeEntry = (
  overrides: Partial<ReferenceEntry> = {},
): ReferenceEntry => ({
  id: "test-entry",
  category: "axiom",
  title: { en: "Test Axiom", ja: "テスト公理" },
  summary: {
    en: "A test summary with <b>bold</b> text.",
    ja: "<b>太字</b>を含むテスト要約。",
  },
  body: {
    en: ["First paragraph.", "Second paragraph with <code>code</code>."],
    ja: ["第1パラグラフ。", "<code>コード</code>を含む第2パラグラフ。"],
  },
  formalNotation: "\\varphi \\to \\psi",
  relatedEntryIds: ["related-1"],
  externalLinks: [
    {
      type: "wikipedia-en",
      url: "https://example.com/wiki",
      label: { en: "Wikipedia", ja: "ウィキペディア" },
      documentLanguage: "en",
    },
  ],
  keywords: [],
  order: 1,
  ...overrides,
});

const makeRelatedEntry = (): ReferenceEntry =>
  makeEntry({
    id: "related-1",
    title: { en: "Related Entry", ja: "関連エントリ" },
    relatedEntryIds: [],
    externalLinks: [],
  });

describe("ReferenceViewerPageView", () => {
  it("ページが表示される", () => {
    const allEntries = [makeEntry(), makeRelatedEntry()];
    render(
      <ReferenceViewerPageView
        entry={allEntries[0]!}
        allEntries={allEntries}
        locale="en"
        testId="ref-viewer"
      />,
    );
    expect(screen.getByTestId("ref-viewer")).toBeDefined();
  });

  it("タイトルが表示される", () => {
    render(
      <ReferenceViewerPageView
        entry={makeEntry()}
        allEntries={[makeEntry()]}
        locale="en"
        testId="ref-viewer"
      />,
    );
    const title = screen.getByTestId("ref-viewer-title");
    expect(title.textContent).toBe("Test Axiom");
  });

  it("日本語で表示される", () => {
    render(
      <ReferenceViewerPageView
        entry={makeEntry()}
        allEntries={[makeEntry()]}
        locale="ja"
        testId="ref-viewer"
      />,
    );
    const title = screen.getByTestId("ref-viewer-title");
    expect(title.textContent).toBe("テスト公理");
  });

  it("形式表記がKaTeXでレンダリングされる", () => {
    render(
      <ReferenceViewerPageView
        entry={makeEntry()}
        allEntries={[makeEntry()]}
        locale="en"
        testId="ref-viewer"
      />,
    );
    const formula = screen.getByTestId("ref-viewer-formula");
    expect(formula.innerHTML).toContain("katex");
  });

  it("形式表記がない場合は数式欄を表示しない", () => {
    render(
      <ReferenceViewerPageView
        entry={makeEntry({ formalNotation: undefined })}
        allEntries={[makeEntry()]}
        locale="en"
        testId="ref-viewer"
      />,
    );
    expect(screen.queryByTestId("ref-viewer-formula")).toBeNull();
  });

  it("パンくずが表示される", () => {
    render(
      <ReferenceViewerPageView
        entry={makeEntry()}
        allEntries={[makeEntry()]}
        locale="en"
        testId="ref-viewer"
      />,
    );
    const breadcrumb0 = screen.getByTestId("ref-viewer-breadcrumb-0");
    expect(breadcrumb0.textContent).toBe("Home");
    expect(breadcrumb0.getAttribute("href")).toBe("/");
    const breadcrumb1 = screen.getByTestId("ref-viewer-breadcrumb-1");
    expect(breadcrumb1.textContent).toBe("Reference");
    expect(breadcrumb1.getAttribute("href")).toBe("/reference");
  });

  it("関連エントリがリンクとして表示される", () => {
    const allEntries = [makeEntry(), makeRelatedEntry()];
    render(
      <ReferenceViewerPageView
        entry={allEntries[0]!}
        allEntries={allEntries}
        locale="en"
        testId="ref-viewer"
      />,
    );
    const related = screen.getByTestId("ref-viewer-related-related-1");
    expect(related).toBeDefined();
    expect(related.textContent).toBe("Related Entry");
    expect(related.getAttribute("href")).toBe("/reference/related-1");
  });

  it("関連エントリクリックでonNavigateが呼ばれ、デフォルト動作が阻止される", () => {
    const onNavigate = vi.fn();
    const allEntries = [makeEntry(), makeRelatedEntry()];
    render(
      <ReferenceViewerPageView
        entry={allEntries[0]!}
        allEntries={allEntries}
        locale="en"
        onNavigate={onNavigate}
        testId="ref-viewer"
      />,
    );
    const related = screen.getByTestId("ref-viewer-related-related-1");
    const event = new MouseEvent("click", { bubbles: true, cancelable: true });
    Object.defineProperty(event, "preventDefault", { value: vi.fn() });
    related.dispatchEvent(event);
    expect(onNavigate).toHaveBeenCalledWith("related-1");
  });

  it("外部リンクが表示される", () => {
    render(
      <ReferenceViewerPageView
        entry={makeEntry()}
        allEntries={[makeEntry()]}
        locale="en"
        testId="ref-viewer"
      />,
    );
    const link = screen.getByTestId("ref-viewer-link-0");
    expect(link.textContent).toContain("Wikipedia");
    expect(link.getAttribute("href")).toBe("https://example.com/wiki");
    expect(link.getAttribute("target")).toBe("_blank");
  });

  it("関連エントリがない場合は関連セクションを表示しない", () => {
    render(
      <ReferenceViewerPageView
        entry={makeEntry({ relatedEntryIds: [] })}
        allEntries={[makeEntry()]}
        locale="en"
        testId="ref-viewer"
      />,
    );
    const viewer = screen.getByTestId("ref-viewer");
    expect(viewer.textContent).not.toContain("Related");
  });

  it("外部リンクがない場合は外部リンクセクションを表示しない", () => {
    render(
      <ReferenceViewerPageView
        entry={makeEntry({ externalLinks: [] })}
        allEntries={[makeEntry()]}
        locale="en"
        testId="ref-viewer"
      />,
    );
    const viewer = screen.getByTestId("ref-viewer");
    expect(viewer.textContent).not.toContain("External Resources");
  });

  it("本文パラグラフが表示される", () => {
    render(
      <ReferenceViewerPageView
        entry={makeEntry()}
        allEntries={[makeEntry()]}
        locale="en"
        testId="ref-viewer"
      />,
    );
    const viewer = screen.getByTestId("ref-viewer");
    expect(viewer.textContent).toContain("First paragraph");
    expect(viewer.textContent).toContain("Second paragraph");
  });

  it("関連クエストボタンが表示される", () => {
    const relatedQuests = [
      { id: "prop-01", title: "Quest 1" },
      { id: "prop-02", title: "Quest 2" },
    ];
    render(
      <ReferenceViewerPageView
        entry={makeEntry()}
        allEntries={[makeEntry()]}
        locale="en"
        relatedQuests={relatedQuests}
        onStartQuest={vi.fn()}
        testId="ref-viewer"
      />,
    );
    expect(screen.getByTestId("ref-viewer-quest-prop-01")).toBeDefined();
    expect(screen.getByTestId("ref-viewer-quest-prop-02")).toBeDefined();
    expect(screen.getByTestId("ref-viewer-quest-prop-01").textContent).toBe(
      "Quest 1",
    );
  });

  it("関連クエストクリックでonStartQuestが呼ばれる", () => {
    const onStartQuest = vi.fn();
    render(
      <ReferenceViewerPageView
        entry={makeEntry()}
        allEntries={[makeEntry()]}
        locale="en"
        relatedQuests={[{ id: "prop-01", title: "Quest 1" }]}
        onStartQuest={onStartQuest}
        testId="ref-viewer"
      />,
    );
    fireEvent.click(screen.getByTestId("ref-viewer-quest-prop-01"));
    expect(onStartQuest).toHaveBeenCalledWith("prop-01");
  });

  it("関連クエストがない場合はクエストセクションを表示しない", () => {
    render(
      <ReferenceViewerPageView
        entry={makeEntry()}
        allEntries={[makeEntry()]}
        locale="en"
        onStartQuest={vi.fn()}
        testId="ref-viewer"
      />,
    );
    const viewer = screen.getByTestId("ref-viewer");
    expect(viewer.textContent).not.toContain("Related Quests");
  });

  it("日本語で関連クエストセクションが表示される", () => {
    render(
      <ReferenceViewerPageView
        entry={makeEntry()}
        allEntries={[makeEntry()]}
        locale="ja"
        relatedQuests={[{ id: "prop-01", title: "クエスト1" }]}
        onStartQuest={vi.fn()}
        testId="ref-viewer"
      />,
    );
    const viewer = screen.getByTestId("ref-viewer");
    expect(viewer.textContent).toContain("関連クエスト");
  });
});

// --- ナビゲーションテスト用データ ---

const makeNextEntry = (): ReferenceEntry =>
  makeEntry({
    id: "test-entry-next",
    title: { en: "Next Axiom", ja: "次の公理" },
    relatedEntryIds: [],
    externalLinks: [],
    order: 2,
  });

const makePrevEntry = (): ReferenceEntry =>
  makeEntry({
    id: "test-entry-prev",
    title: { en: "Previous Axiom", ja: "前の公理" },
    relatedEntryIds: [],
    externalLinks: [],
    order: 0,
  });

describe("ReferenceViewerPageView ナビゲーション", () => {
  it("次のエントリへのリンクが表示される", () => {
    const entry = makeEntry({ relatedEntryIds: [], externalLinks: [] });
    const allEntries = [entry, makeNextEntry()];
    render(
      <ReferenceViewerPageView
        entry={entry}
        allEntries={allEntries}
        locale="en"
        testId="ref-viewer"
      />,
    );
    const nextLink = screen.getByTestId("ref-viewer-nav-next");
    expect(nextLink.textContent).toContain("Next Axiom");
    expect(nextLink.getAttribute("href")).toBe("/reference/test-entry-next");
  });

  it("前のエントリへのリンクが表示される", () => {
    const entry = makeEntry({ relatedEntryIds: [], externalLinks: [] });
    const allEntries = [makePrevEntry(), entry];
    render(
      <ReferenceViewerPageView
        entry={entry}
        allEntries={allEntries}
        locale="en"
        testId="ref-viewer"
      />,
    );
    const prevLink = screen.getByTestId("ref-viewer-nav-prev");
    expect(prevLink.textContent).toContain("Previous Axiom");
    expect(prevLink.getAttribute("href")).toBe("/reference/test-entry-prev");
  });

  it("前後両方のリンクが表示される", () => {
    const entry = makeEntry({ relatedEntryIds: [], externalLinks: [] });
    const allEntries = [makePrevEntry(), entry, makeNextEntry()];
    render(
      <ReferenceViewerPageView
        entry={entry}
        allEntries={allEntries}
        locale="en"
        testId="ref-viewer"
      />,
    );
    expect(screen.getByTestId("ref-viewer-nav-prev")).toBeDefined();
    expect(screen.getByTestId("ref-viewer-nav-next")).toBeDefined();
  });

  it("カテゴリ内に1つしかない場合はナビゲーションが非表示", () => {
    const entry = makeEntry({ relatedEntryIds: [], externalLinks: [] });
    render(
      <ReferenceViewerPageView
        entry={entry}
        allEntries={[entry]}
        locale="en"
        testId="ref-viewer"
      />,
    );
    expect(screen.queryByTestId("ref-viewer-nav-prev")).toBeNull();
    expect(screen.queryByTestId("ref-viewer-nav-next")).toBeNull();
  });

  it("次のリンククリックでonNavigateが呼ばれる", () => {
    const onNavigate = vi.fn();
    const entry = makeEntry({ relatedEntryIds: [], externalLinks: [] });
    const allEntries = [entry, makeNextEntry()];
    render(
      <ReferenceViewerPageView
        entry={entry}
        allEntries={allEntries}
        locale="en"
        onNavigate={onNavigate}
        testId="ref-viewer"
      />,
    );
    fireEvent.click(screen.getByTestId("ref-viewer-nav-next"));
    expect(onNavigate).toHaveBeenCalledWith("test-entry-next");
  });

  it("前のリンククリックでonNavigateが呼ばれる", () => {
    const onNavigate = vi.fn();
    const entry = makeEntry({ relatedEntryIds: [], externalLinks: [] });
    const allEntries = [makePrevEntry(), entry];
    render(
      <ReferenceViewerPageView
        entry={entry}
        allEntries={allEntries}
        locale="en"
        onNavigate={onNavigate}
        testId="ref-viewer"
      />,
    );
    fireEvent.click(screen.getByTestId("ref-viewer-nav-prev"));
    expect(onNavigate).toHaveBeenCalledWith("test-entry-prev");
  });

  it("日本語のナビゲーションラベルが表示される", () => {
    const entry = makeEntry({ relatedEntryIds: [], externalLinks: [] });
    const allEntries = [makePrevEntry(), entry, makeNextEntry()];
    render(
      <ReferenceViewerPageView
        entry={entry}
        allEntries={allEntries}
        locale="ja"
        testId="ref-viewer"
      />,
    );
    const prevLink = screen.getByTestId("ref-viewer-nav-prev");
    expect(prevLink.textContent).toContain("← 前");
    const nextLink = screen.getByTestId("ref-viewer-nav-next");
    expect(nextLink.textContent).toContain("次 →");
  });
});

describe("ReferenceViewerNotFound", () => {
  it("英語のNotFoundが表示される", () => {
    render(<ReferenceViewerNotFound locale="en" testId="ref-not-found" />);
    const el = screen.getByTestId("ref-not-found");
    expect(el.textContent).toContain("Reference Not Found");
    expect(el.textContent).toContain("Back to Reference");
  });

  it("日本語のNotFoundが表示される", () => {
    render(<ReferenceViewerNotFound locale="ja" testId="ref-not-found" />);
    const el = screen.getByTestId("ref-not-found");
    expect(el.textContent).toContain("リファレンスが見つかりません");
    expect(el.textContent).toContain("リファレンス一覧に戻る");
  });
});

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ReferenceEntry } from "./referenceEntry";
import { ReferenceFloatingWindow } from "./ReferenceFloatingWindow";

afterEach(cleanup);

const makeEntry = (
  overrides: Partial<ReferenceEntry> = {},
): ReferenceEntry => ({
  id: "test-entry",
  category: "axiom",
  title: { en: "Test Axiom", ja: "テスト公理" },
  summary: {
    en: "A test summary.",
    ja: "テスト要約。",
  },
  body: {
    en: ["First paragraph with <b>bold</b> text.", "Second paragraph."],
    ja: ["<b>太字</b>を含む第1パラグラフ。", "第2パラグラフ。"],
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

describe("ReferenceFloatingWindow", () => {
  it("ウィンドウが表示される", () => {
    const allEntries = [makeEntry(), makeRelatedEntry()];
    render(
      <ReferenceFloatingWindow
        entry={allEntries[0]!}
        allEntries={allEntries}
        locale="en"
        onClose={vi.fn()}
        testId="ref-win"
      />,
    );
    const win = screen.getByTestId("ref-win");
    expect(win).toBeDefined();
  });

  it("タイトルバーにタイトルが表示される", () => {
    render(
      <ReferenceFloatingWindow
        entry={makeEntry()}
        allEntries={[makeEntry()]}
        locale="en"
        onClose={vi.fn()}
        testId="ref-win"
      />,
    );
    const titlebar = screen.getByTestId("ref-win-titlebar");
    expect(titlebar.textContent).toContain("Test Axiom");
  });

  it("カテゴリバッジが表示される", () => {
    render(
      <ReferenceFloatingWindow
        entry={makeEntry()}
        allEntries={[makeEntry()]}
        locale="en"
        onClose={vi.fn()}
        testId="ref-win"
      />,
    );
    const win = screen.getByTestId("ref-win");
    expect(win.textContent).toContain("Axioms");
  });

  it("日本語で表示される", () => {
    render(
      <ReferenceFloatingWindow
        entry={makeEntry()}
        allEntries={[makeEntry()]}
        locale="ja"
        onClose={vi.fn()}
        testId="ref-win"
      />,
    );
    const win = screen.getByTestId("ref-win");
    expect(win.textContent).toContain("テスト公理");
    expect(win.textContent).toContain("テスト要約。");
  });

  it("形式表記が表示される", () => {
    render(
      <ReferenceFloatingWindow
        entry={makeEntry()}
        allEntries={[makeEntry()]}
        locale="en"
        onClose={vi.fn()}
        testId="ref-win"
      />,
    );
    const formula = screen.getByTestId("ref-win-formula");
    expect(formula).toBeDefined();
  });

  it("形式表記がない場合は表示されない", () => {
    render(
      <ReferenceFloatingWindow
        entry={makeEntry({ formalNotation: undefined })}
        allEntries={[makeEntry()]}
        locale="en"
        onClose={vi.fn()}
        testId="ref-win"
      />,
    );
    expect(screen.queryByTestId("ref-win-formula")).toBeNull();
  });

  it("閉じるボタンでonCloseが呼ばれる", () => {
    const handleClose = vi.fn();
    render(
      <ReferenceFloatingWindow
        entry={makeEntry()}
        allEntries={[makeEntry()]}
        locale="en"
        onClose={handleClose}
        testId="ref-win"
      />,
    );
    fireEvent.click(screen.getByTestId("ref-win-close"));
    expect(handleClose).toHaveBeenCalled();
  });

  it("新規タブで開くリンクが正しいhrefを持つ", () => {
    render(
      <ReferenceFloatingWindow
        entry={makeEntry()}
        allEntries={[makeEntry()]}
        locale="en"
        onClose={vi.fn()}
        testId="ref-win"
      />,
    );
    const link = screen.getByTestId("ref-win-open-new-tab");
    expect(link.getAttribute("href")).toBe("/reference/test-entry");
    expect(link.getAttribute("target")).toBe("_blank");
  });

  it("関連エントリがボタンとして表示される", () => {
    const allEntries = [makeEntry(), makeRelatedEntry()];
    render(
      <ReferenceFloatingWindow
        entry={allEntries[0]!}
        allEntries={allEntries}
        locale="en"
        onClose={vi.fn()}
        onNavigate={vi.fn()}
        testId="ref-win"
      />,
    );
    const related = screen.getByTestId("ref-win-related-related-1");
    expect(related.textContent).toContain("Related Entry");
  });

  it("関連エントリクリックでonNavigateが呼ばれる", () => {
    const handleNavigate = vi.fn();
    const allEntries = [makeEntry(), makeRelatedEntry()];
    render(
      <ReferenceFloatingWindow
        entry={allEntries[0]!}
        allEntries={allEntries}
        locale="en"
        onClose={vi.fn()}
        onNavigate={handleNavigate}
        testId="ref-win"
      />,
    );
    fireEvent.click(screen.getByTestId("ref-win-related-related-1"));
    expect(handleNavigate).toHaveBeenCalledWith("related-1");
  });

  it("外部リンクが表示される", () => {
    render(
      <ReferenceFloatingWindow
        entry={makeEntry()}
        allEntries={[makeEntry()]}
        locale="en"
        onClose={vi.fn()}
        testId="ref-win"
      />,
    );
    const link = screen.getByTestId("ref-win-link-0");
    expect(link.textContent).toContain("Wikipedia");
    expect(link.getAttribute("href")).toBe("https://example.com/wiki");
  });

  it("関連クエストが表示される", () => {
    render(
      <ReferenceFloatingWindow
        entry={makeEntry()}
        allEntries={[makeEntry()]}
        locale="en"
        onClose={vi.fn()}
        relatedQuests={[{ id: "q1", title: "Quest 1" }]}
        onStartQuest={vi.fn()}
        testId="ref-win"
      />,
    );
    const questBtn = screen.getByTestId("ref-win-quest-q1");
    expect(questBtn.textContent).toContain("Quest 1");
  });

  it("関連クエストクリックでonStartQuestが呼ばれる", () => {
    const handleStartQuest = vi.fn();
    render(
      <ReferenceFloatingWindow
        entry={makeEntry()}
        allEntries={[makeEntry()]}
        locale="en"
        onClose={vi.fn()}
        relatedQuests={[{ id: "q1", title: "Quest 1" }]}
        onStartQuest={handleStartQuest}
        testId="ref-win"
      />,
    );
    fireEvent.click(screen.getByTestId("ref-win-quest-q1"));
    expect(handleStartQuest).toHaveBeenCalledWith("q1");
  });

  it("リサイズハンドルが存在する", () => {
    render(
      <ReferenceFloatingWindow
        entry={makeEntry()}
        allEntries={[makeEntry()]}
        locale="en"
        onClose={vi.fn()}
        testId="ref-win"
      />,
    );
    expect(screen.getByTestId("ref-win-resize")).toBeDefined();
  });

  it("role=dialogが設定されている", () => {
    render(
      <ReferenceFloatingWindow
        entry={makeEntry()}
        allEntries={[makeEntry()]}
        locale="en"
        onClose={vi.fn()}
        testId="ref-win"
      />,
    );
    const win = screen.getByTestId("ref-win");
    expect(win.getAttribute("role")).toBe("dialog");
  });

  it("testIdなしでもレンダリングされる", () => {
    const allEntries = [makeEntry(), makeRelatedEntry()];
    render(
      <ReferenceFloatingWindow
        entry={allEntries[0]!}
        allEntries={allEntries}
        locale="en"
        onClose={vi.fn()}
        onNavigate={vi.fn()}
        relatedQuests={[{ id: "q1", title: "Quest 1" }]}
        onStartQuest={vi.fn()}
      />,
    );
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeDefined();
    expect(dialog.textContent).toContain("Test Axiom");
  });

  it("複数の形式表記が表示される", () => {
    render(
      <ReferenceFloatingWindow
        entry={makeEntry({ formalNotation: ["\\alpha", "\\beta"] })}
        allEntries={[makeEntry()]}
        locale="en"
        onClose={vi.fn()}
        testId="ref-win"
      />,
    );
    expect(screen.getByTestId("ref-win-formula-0")).toBeDefined();
    expect(screen.getByTestId("ref-win-formula-1")).toBeDefined();
  });

  it("関連エントリがない場合は関連セクションを表示しない", () => {
    render(
      <ReferenceFloatingWindow
        entry={makeEntry({ relatedEntryIds: [] })}
        allEntries={[makeEntry()]}
        locale="en"
        onClose={vi.fn()}
        testId="ref-win"
      />,
    );
    const win = screen.getByTestId("ref-win");
    expect(win.textContent).not.toContain("Related");
  });

  it("外部リンクがない場合は外部リンクセクションを表示しない", () => {
    render(
      <ReferenceFloatingWindow
        entry={makeEntry({ externalLinks: [] })}
        allEntries={[makeEntry()]}
        locale="en"
        onClose={vi.fn()}
        testId="ref-win"
      />,
    );
    const win = screen.getByTestId("ref-win");
    expect(win.textContent).not.toContain("External Resources");
  });

  it("ナビゲーションデータがあるとprev/nextが表示される", () => {
    render(
      <ReferenceFloatingWindow
        entry={makeEntry()}
        allEntries={[makeEntry()]}
        locale="en"
        onClose={vi.fn()}
        onNavigate={vi.fn()}
        navigationData={{
          previous: {
            id: "prev-entry",
            title: "Previous Entry",
            href: "/reference/prev-entry",
          },
          next: {
            id: "next-entry",
            title: "Next Entry",
            href: "/reference/next-entry",
          },
        }}
        testId="ref-win"
      />,
    );
    const nav = screen.getByTestId("ref-win-nav");
    expect(nav).toBeDefined();
    const prev = screen.getByTestId("ref-win-nav-prev");
    expect(prev.textContent).toContain("Previous Entry");
    const next = screen.getByTestId("ref-win-nav-next");
    expect(next.textContent).toContain("Next Entry");
  });

  it("ナビゲーションのprevクリックでonNavigateが呼ばれる", () => {
    const handleNavigate = vi.fn();
    render(
      <ReferenceFloatingWindow
        entry={makeEntry()}
        allEntries={[makeEntry()]}
        locale="en"
        onClose={vi.fn()}
        onNavigate={handleNavigate}
        navigationData={{
          previous: {
            id: "prev-entry",
            title: "Previous Entry",
            href: "/reference/prev-entry",
          },
          next: undefined,
        }}
        testId="ref-win"
      />,
    );
    fireEvent.click(screen.getByTestId("ref-win-nav-prev"));
    expect(handleNavigate).toHaveBeenCalledWith("prev-entry");
  });

  it("ナビゲーションのnextクリックでonNavigateが呼ばれる", () => {
    const handleNavigate = vi.fn();
    render(
      <ReferenceFloatingWindow
        entry={makeEntry()}
        allEntries={[makeEntry()]}
        locale="en"
        onClose={vi.fn()}
        onNavigate={handleNavigate}
        navigationData={{
          previous: undefined,
          next: {
            id: "next-entry",
            title: "Next Entry",
            href: "/reference/next-entry",
          },
        }}
        testId="ref-win"
      />,
    );
    fireEvent.click(screen.getByTestId("ref-win-nav-next"));
    expect(handleNavigate).toHaveBeenCalledWith("next-entry");
  });

  it("ナビゲーションデータがundefinedならナビが非表示", () => {
    render(
      <ReferenceFloatingWindow
        entry={makeEntry()}
        allEntries={[makeEntry()]}
        locale="en"
        onClose={vi.fn()}
        testId="ref-win"
      />,
    );
    expect(screen.queryByTestId("ref-win-nav")).toBeNull();
  });

  it("prev/next両方undefinedならナビが非表示", () => {
    render(
      <ReferenceFloatingWindow
        entry={makeEntry()}
        allEntries={[makeEntry()]}
        locale="en"
        onClose={vi.fn()}
        navigationData={{ previous: undefined, next: undefined }}
        testId="ref-win"
      />,
    );
    expect(screen.queryByTestId("ref-win-nav")).toBeNull();
  });

  it("日本語ナビゲーションラベルが表示される", () => {
    render(
      <ReferenceFloatingWindow
        entry={makeEntry()}
        allEntries={[makeEntry()]}
        locale="ja"
        onClose={vi.fn()}
        navigationData={{
          previous: {
            id: "prev",
            title: "前のガイド",
            href: "/reference/prev",
          },
          next: {
            id: "next",
            title: "次のガイド",
            href: "/reference/next",
          },
        }}
        testId="ref-win"
      />,
    );
    const prev = screen.getByTestId("ref-win-nav-prev");
    expect(prev.textContent).toContain("← 前");
    const next = screen.getByTestId("ref-win-nav-next");
    expect(next.textContent).toContain("次 →");
  });

  it("日本語で全セクションが表示される", () => {
    const allEntries = [makeEntry(), makeRelatedEntry()];
    render(
      <ReferenceFloatingWindow
        entry={allEntries[0]!}
        allEntries={allEntries}
        locale="ja"
        onClose={vi.fn()}
        onNavigate={vi.fn()}
        relatedQuests={[{ id: "q1", title: "クエスト1" }]}
        onStartQuest={vi.fn()}
        testId="ref-win"
      />,
    );
    const win = screen.getByTestId("ref-win");
    expect(win.textContent).toContain("関連項目");
    expect(win.textContent).toContain("関連クエスト");
    expect(win.textContent).toContain("外部リソース");
    const closeBtn = screen.getByTestId("ref-win-close");
    expect(closeBtn.getAttribute("aria-label")).toBe("閉じる");
  });

  // --- ブラウズモード ---

  it("entry未指定でブラウズモードが表示される", () => {
    const allEntries = [makeEntry(), makeRelatedEntry()];
    render(
      <ReferenceFloatingWindow
        allEntries={allEntries}
        locale="en"
        onClose={vi.fn()}
        testId="ref-win"
      />,
    );
    const win = screen.getByTestId("ref-win");
    expect(win).toBeDefined();
    // ブラウズモードではタイトルが "Reference"
    const titlebar = screen.getByTestId("ref-win-titlebar");
    expect(titlebar.textContent).toContain("Reference");
    // ブラウザコンポーネントが表示される
    expect(screen.getByTestId("ref-win-browser")).toBeDefined();
  });

  it("ブラウズモードで日本語タイトルが表示される", () => {
    render(
      <ReferenceFloatingWindow
        allEntries={[makeEntry()]}
        locale="ja"
        onClose={vi.fn()}
        testId="ref-win"
      />,
    );
    const titlebar = screen.getByTestId("ref-win-titlebar");
    expect(titlebar.textContent).toContain("リファレンス");
  });

  it("ブラウズモードでは新規タブリンクが表示されない", () => {
    render(
      <ReferenceFloatingWindow
        allEntries={[makeEntry()]}
        locale="en"
        onClose={vi.fn()}
        testId="ref-win"
      />,
    );
    expect(screen.queryByTestId("ref-win-open-new-tab")).toBeNull();
  });

  it("詳細モードでonNavigateHomeがあるとホームボタンが表示される", () => {
    const handleHome = vi.fn();
    render(
      <ReferenceFloatingWindow
        entry={makeEntry()}
        allEntries={[makeEntry()]}
        locale="en"
        onClose={vi.fn()}
        onNavigateHome={handleHome}
        testId="ref-win"
      />,
    );
    const homeBtn = screen.getByTestId("ref-win-home");
    expect(homeBtn).toBeDefined();
    fireEvent.click(homeBtn);
    expect(handleHome).toHaveBeenCalled();
  });

  it("詳細モードでonNavigateHomeがないとホームボタンが表示されない", () => {
    render(
      <ReferenceFloatingWindow
        entry={makeEntry()}
        allEntries={[makeEntry()]}
        locale="en"
        onClose={vi.fn()}
        testId="ref-win"
      />,
    );
    expect(screen.queryByTestId("ref-win-home")).toBeNull();
  });

  it("ブラウズモードではホームボタンが表示されない", () => {
    render(
      <ReferenceFloatingWindow
        allEntries={[makeEntry()]}
        locale="en"
        onClose={vi.fn()}
        onNavigateHome={vi.fn()}
        testId="ref-win"
      />,
    );
    expect(screen.queryByTestId("ref-win-home")).toBeNull();
  });

  it("onNavigate未指定時にprevクリックしてもエラーにならない", () => {
    render(
      <ReferenceFloatingWindow
        entry={makeEntry()}
        allEntries={[makeEntry()]}
        locale="en"
        onClose={vi.fn()}
        navigationData={{
          previous: {
            id: "prev-entry",
            title: "Previous Entry",
            href: "/reference/prev-entry",
          },
          next: undefined,
        }}
        testId="ref-win"
      />,
    );
    const prev = screen.getByTestId("ref-win-nav-prev");
    fireEvent.click(prev);
    // onNavigate未指定なので何も起きないが、エラーにもならない
    expect(prev).toBeInTheDocument();
  });

  it("onNavigate未指定時にnextクリックしてもエラーにならない", () => {
    render(
      <ReferenceFloatingWindow
        entry={makeEntry()}
        allEntries={[makeEntry()]}
        locale="en"
        onClose={vi.fn()}
        navigationData={{
          previous: undefined,
          next: {
            id: "next-entry",
            title: "Next Entry",
            href: "/reference/next-entry",
          },
        }}
        testId="ref-win"
      />,
    );
    const next = screen.getByTestId("ref-win-nav-next");
    fireEvent.click(next);
    expect(next).toBeInTheDocument();
  });
});

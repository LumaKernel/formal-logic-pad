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
});

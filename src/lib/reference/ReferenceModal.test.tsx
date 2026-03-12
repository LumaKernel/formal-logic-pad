import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ReferenceEntry } from "./referenceEntry";
import { ReferenceModal } from "./ReferenceModal";

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

describe("ReferenceModal", () => {
  it("モーダルが表示される", () => {
    const allEntries = [makeEntry(), makeRelatedEntry()];
    render(
      <ReferenceModal
        entry={allEntries[0]!}
        allEntries={allEntries}
        locale="en"
        onClose={vi.fn()}
        testId="ref-modal"
      />,
    );
    const modal = screen.getByTestId("ref-modal");
    expect(modal).toBeDefined();
  });

  it("タイトルとカテゴリが表示される", () => {
    render(
      <ReferenceModal
        entry={makeEntry()}
        allEntries={[makeEntry()]}
        locale="en"
        onClose={vi.fn()}
        testId="ref-modal"
      />,
    );
    const modal = screen.getByTestId("ref-modal");
    expect(modal.textContent).toContain("Test Axiom");
    expect(modal.textContent).toContain("Axioms");
  });

  it("日本語で表示される", () => {
    render(
      <ReferenceModal
        entry={makeEntry()}
        allEntries={[makeEntry()]}
        locale="ja"
        onClose={vi.fn()}
        testId="ref-modal"
      />,
    );
    const modal = screen.getByTestId("ref-modal");
    expect(modal.textContent).toContain("テスト公理");
    expect(modal.textContent).toContain("公理");
    expect(modal.textContent).toContain("第1パラグラフ");
  });

  it("形式表記がKaTeXでレンダリングされる", () => {
    render(
      <ReferenceModal
        entry={makeEntry()}
        allEntries={[makeEntry()]}
        locale="en"
        onClose={vi.fn()}
        testId="ref-modal"
      />,
    );
    const formula = screen.getByTestId("ref-modal-formula");
    expect(formula).toBeDefined();
    expect(formula.innerHTML).toContain("katex");
  });

  it("形式表記がない場合は数式欄を表示しない", () => {
    render(
      <ReferenceModal
        entry={makeEntry({ formalNotation: undefined })}
        allEntries={[makeEntry()]}
        locale="en"
        onClose={vi.fn()}
        testId="ref-modal"
      />,
    );
    expect(screen.queryByTestId("ref-modal-formula")).toBeNull();
  });

  it("本文パラグラフが表示される", () => {
    render(
      <ReferenceModal
        entry={makeEntry()}
        allEntries={[makeEntry()]}
        locale="en"
        onClose={vi.fn()}
        testId="ref-modal"
      />,
    );
    const modal = screen.getByTestId("ref-modal");
    expect(modal.textContent).toContain("First paragraph");
    expect(modal.textContent).toContain("Second paragraph");
  });

  it("太字マークダウンがstrongタグとしてレンダリングされる", () => {
    render(
      <ReferenceModal
        entry={makeEntry()}
        allEntries={[makeEntry()]}
        locale="en"
        onClose={vi.fn()}
        testId="ref-modal"
      />,
    );
    const modal = screen.getByTestId("ref-modal");
    const strongElements = modal.querySelectorAll("strong");
    expect(strongElements.length).toBeGreaterThan(0);
    expect(strongElements[0]?.textContent).toBe("bold");
  });

  it("イタリックマークダウンがemタグとしてレンダリングされる", () => {
    const entry = makeEntry({
      body: {
        en: ["Also called <i>detachment</i> rule."],
        ja: ["<i>分離規則</i>とも呼ばれる。"],
      },
    });
    render(
      <ReferenceModal
        entry={entry}
        allEntries={[entry]}
        locale="en"
        onClose={vi.fn()}
        testId="ref-modal"
      />,
    );
    const modal = screen.getByTestId("ref-modal");
    const emElements = modal.querySelectorAll("em");
    expect(emElements.length).toBeGreaterThan(0);
    expect(emElements[0]?.textContent).toBe("detachment");
  });

  it("関連エントリがボタンとして表示される", () => {
    const allEntries = [makeEntry(), makeRelatedEntry()];
    render(
      <ReferenceModal
        entry={allEntries[0]!}
        allEntries={allEntries}
        locale="en"
        onClose={vi.fn()}
        onNavigate={vi.fn()}
        testId="ref-modal"
      />,
    );
    const relatedBtn = screen.getByTestId("ref-modal-related-related-1");
    expect(relatedBtn).toBeDefined();
    expect(relatedBtn.textContent).toBe("Related Entry");
  });

  it("関連エントリクリックでonNavigateが呼ばれる", () => {
    const onNavigate = vi.fn();
    const allEntries = [makeEntry(), makeRelatedEntry()];
    render(
      <ReferenceModal
        entry={allEntries[0]!}
        allEntries={allEntries}
        locale="en"
        onClose={vi.fn()}
        onNavigate={onNavigate}
        testId="ref-modal"
      />,
    );
    fireEvent.click(screen.getByTestId("ref-modal-related-related-1"));
    expect(onNavigate).toHaveBeenCalledWith("related-1");
  });

  it("外部リンクが表示される", () => {
    render(
      <ReferenceModal
        entry={makeEntry()}
        allEntries={[makeEntry()]}
        locale="en"
        onClose={vi.fn()}
        testId="ref-modal"
      />,
    );
    const link = screen.getByTestId("ref-modal-link-0");
    expect(link).toBeDefined();
    expect(link.textContent).toContain("Wikipedia");
    expect(link.getAttribute("href")).toBe("https://example.com/wiki");
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");
  });

  it("外部リンクにドキュメント言語タグが表示される", () => {
    render(
      <ReferenceModal
        entry={makeEntry()}
        allEntries={[makeEntry()]}
        locale="en"
        onClose={vi.fn()}
        testId="ref-modal"
      />,
    );
    const link = screen.getByTestId("ref-modal-link-0");
    expect(link.textContent).toContain("en");
  });

  it("日本語リンクにjaタグが表示される", () => {
    const entry = makeEntry({
      externalLinks: [
        {
          type: "wikipedia-ja",
          url: "https://ja.wikipedia.org/wiki/test",
          label: { en: "Wikipedia JA", ja: "ウィキペディア" },
          documentLanguage: "ja",
        },
      ],
    });
    render(
      <ReferenceModal
        entry={entry}
        allEntries={[entry]}
        locale="en"
        onClose={vi.fn()}
        testId="ref-modal"
      />,
    );
    const link = screen.getByTestId("ref-modal-link-0");
    expect(link.textContent).toContain("ja");
  });

  it("閉じるボタンでonCloseが呼ばれる", () => {
    const onClose = vi.fn();
    render(
      <ReferenceModal
        entry={makeEntry()}
        allEntries={[makeEntry()]}
        locale="en"
        onClose={onClose}
        testId="ref-modal"
      />,
    );
    fireEvent.click(screen.getByTestId("ref-modal-close"));
    expect(onClose).toHaveBeenCalled();
  });

  it("Escapeキーでoncloseが呼ばれる", () => {
    const onClose = vi.fn();
    render(
      <ReferenceModal
        entry={makeEntry()}
        allEntries={[makeEntry()]}
        locale="en"
        onClose={onClose}
        testId="ref-modal"
      />,
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });

  it("オーバーレイクリックでonCloseが呼ばれる", () => {
    const onClose = vi.fn();
    render(
      <ReferenceModal
        entry={makeEntry()}
        allEntries={[makeEntry()]}
        locale="en"
        onClose={onClose}
        testId="ref-modal"
      />,
    );
    const overlay = screen.getByTestId("ref-modal-overlay");
    fireEvent.click(overlay);
    expect(onClose).toHaveBeenCalled();
  });

  it("モーダル内クリックではonCloseが呼ばれない", () => {
    const onClose = vi.fn();
    render(
      <ReferenceModal
        entry={makeEntry()}
        allEntries={[makeEntry()]}
        locale="en"
        onClose={onClose}
        testId="ref-modal"
      />,
    );
    fireEvent.click(screen.getByTestId("ref-modal"));
    expect(onClose).not.toHaveBeenCalled();
  });

  it("関連エントリがない場合は関連セクションを表示しない", () => {
    render(
      <ReferenceModal
        entry={makeEntry({ relatedEntryIds: [] })}
        allEntries={[makeEntry()]}
        locale="en"
        onClose={vi.fn()}
        testId="ref-modal"
      />,
    );
    const modal = screen.getByTestId("ref-modal");
    expect(modal.textContent).not.toContain("Related");
  });

  it("外部リンクがない場合は外部リンクセクションを表示しない", () => {
    render(
      <ReferenceModal
        entry={makeEntry({ externalLinks: [] })}
        allEntries={[makeEntry()]}
        locale="en"
        onClose={vi.fn()}
        testId="ref-modal"
      />,
    );
    const modal = screen.getByTestId("ref-modal");
    expect(modal.textContent).not.toContain("External Resources");
  });

  it("testIdなしでもレンダリングされる", () => {
    render(
      <ReferenceModal
        entry={makeEntry()}
        allEntries={[makeEntry(), makeRelatedEntry()]}
        locale="en"
        onClose={vi.fn()}
        onNavigate={vi.fn()}
      />,
    );
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeDefined();
    expect(dialog.textContent).toContain("Test Axiom");
  });

  it("dialog roleが設定される", () => {
    render(
      <ReferenceModal
        entry={makeEntry()}
        allEntries={[makeEntry()]}
        locale="en"
        onClose={vi.fn()}
        testId="ref-modal"
      />,
    );
    const modal = screen.getByTestId("ref-modal");
    expect(modal.getAttribute("role")).toBe("dialog");
  });

  it("aria-labelがタイトルに設定される", () => {
    render(
      <ReferenceModal
        entry={makeEntry()}
        allEntries={[makeEntry()]}
        locale="en"
        onClose={vi.fn()}
        testId="ref-modal"
      />,
    );
    const modal = screen.getByTestId("ref-modal");
    expect(modal.getAttribute("aria-label")).toBe("Test Axiom");
  });
});

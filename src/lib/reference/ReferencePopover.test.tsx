import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ReferenceEntry } from "./referenceEntry";
import { ReferencePopover } from "./ReferencePopover";

afterEach(cleanup);

const makeEntry = (
  overrides: Partial<ReferenceEntry> = {},
): ReferenceEntry => ({
  id: "test-entry",
  category: "axiom",
  title: { en: "Test Axiom", ja: "テスト公理" },
  summary: {
    en: "A test summary with **bold** text.",
    ja: "**太字**を含むテスト要約。",
  },
  body: {
    en: ["First paragraph."],
    ja: ["第1パラグラフ。"],
  },
  formalNotation: "\\varphi \\to \\psi",
  relatedEntryIds: [],
  externalLinks: [],
  keywords: [],
  order: 1,
  ...overrides,
});

describe("ReferencePopover", () => {
  it("トリガーボタンが表示される", () => {
    render(
      <ReferencePopover entry={makeEntry()} locale="en" testId="ref-pop" />,
    );
    const trigger = screen.getByTestId("ref-pop-trigger");
    expect(trigger).toBeDefined();
    expect(trigger.textContent).toBe("?");
  });

  it("クリックでポップオーバーが開く", () => {
    render(
      <ReferencePopover entry={makeEntry()} locale="en" testId="ref-pop" />,
    );
    const trigger = screen.getByTestId("ref-pop-trigger");
    fireEvent.click(trigger);
    const popover = screen.getByTestId("ref-pop-popover");
    expect(popover).toBeDefined();
  });

  it("ポップオーバーにタイトルと要約が表示される", () => {
    render(
      <ReferencePopover entry={makeEntry()} locale="en" testId="ref-pop" />,
    );
    fireEvent.click(screen.getByTestId("ref-pop-trigger"));
    const popover = screen.getByTestId("ref-pop-popover");
    expect(popover.textContent).toContain("Test Axiom");
    expect(popover.textContent).toContain("A test summary");
  });

  it("日本語で表示される", () => {
    render(
      <ReferencePopover entry={makeEntry()} locale="ja" testId="ref-pop" />,
    );
    fireEvent.click(screen.getByTestId("ref-pop-trigger"));
    const popover = screen.getByTestId("ref-pop-popover");
    expect(popover.textContent).toContain("テスト公理");
    expect(popover.textContent).toContain("テスト要約");
  });

  it("カテゴリバッジが表示される", () => {
    render(
      <ReferencePopover entry={makeEntry()} locale="en" testId="ref-pop" />,
    );
    fireEvent.click(screen.getByTestId("ref-pop-trigger"));
    const popover = screen.getByTestId("ref-pop-popover");
    expect(popover.textContent).toContain("Axioms");
  });

  it("形式表記がKaTeXでレンダリングされる", () => {
    render(
      <ReferencePopover entry={makeEntry()} locale="en" testId="ref-pop" />,
    );
    fireEvent.click(screen.getByTestId("ref-pop-trigger"));
    const formula = screen.getByTestId("ref-pop-formula");
    expect(formula).toBeDefined();
    expect(formula.innerHTML).toContain("katex");
  });

  it("形式表記がない場合は数式欄を表示しない", () => {
    render(
      <ReferencePopover
        entry={makeEntry({ formalNotation: undefined })}
        locale="en"
        testId="ref-pop"
      />,
    );
    fireEvent.click(screen.getByTestId("ref-pop-trigger"));
    expect(screen.queryByTestId("ref-pop-formula")).toBeNull();
  });

  it("「詳しく見る」ボタンが表示され、クリックでonOpenDetailが呼ばれる", () => {
    const onOpenDetail = vi.fn();
    render(
      <ReferencePopover
        entry={makeEntry()}
        locale="en"
        onOpenDetail={onOpenDetail}
        testId="ref-pop"
      />,
    );
    fireEvent.click(screen.getByTestId("ref-pop-trigger"));
    const detailBtn = screen.getByTestId("ref-pop-detail-btn");
    fireEvent.click(detailBtn);
    expect(onOpenDetail).toHaveBeenCalledWith("test-entry");
  });

  it("onOpenDetailがない場合は「詳しく見る」ボタンが表示されない", () => {
    render(
      <ReferencePopover entry={makeEntry()} locale="en" testId="ref-pop" />,
    );
    fireEvent.click(screen.getByTestId("ref-pop-trigger"));
    expect(screen.queryByTestId("ref-pop-detail-btn")).toBeNull();
  });

  it("再クリックでポップオーバーが閉じる", () => {
    render(
      <ReferencePopover entry={makeEntry()} locale="en" testId="ref-pop" />,
    );
    const trigger = screen.getByTestId("ref-pop-trigger");
    fireEvent.click(trigger);
    expect(screen.getByTestId("ref-pop-popover")).toBeDefined();
    fireEvent.click(trigger);
    expect(screen.queryByTestId("ref-pop-popover")).toBeNull();
  });

  it("Escapeキーで閉じる", () => {
    render(
      <ReferencePopover entry={makeEntry()} locale="en" testId="ref-pop" />,
    );
    fireEvent.click(screen.getByTestId("ref-pop-trigger"));
    expect(screen.getByTestId("ref-pop-popover")).toBeDefined();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByTestId("ref-pop-popover")).toBeNull();
  });

  it("外部クリックで閉じる", () => {
    render(
      <div>
        <ReferencePopover entry={makeEntry()} locale="en" testId="ref-pop" />
        <div data-testid="outside">outside</div>
      </div>,
    );
    fireEvent.click(screen.getByTestId("ref-pop-trigger"));
    expect(screen.getByTestId("ref-pop-popover")).toBeDefined();
    fireEvent.mouseDown(screen.getByTestId("outside"));
    expect(screen.queryByTestId("ref-pop-popover")).toBeNull();
  });

  it("太字マークダウンがstrongタグとしてレンダリングされる", () => {
    render(
      <ReferencePopover entry={makeEntry()} locale="en" testId="ref-pop" />,
    );
    fireEvent.click(screen.getByTestId("ref-pop-trigger"));
    const popover = screen.getByTestId("ref-pop-popover");
    const strongElements = popover.querySelectorAll("strong");
    expect(strongElements.length).toBeGreaterThan(0);
    expect(strongElements[0]?.textContent).toBe("bold");
  });

  it("イタリックマークダウンがemタグとしてレンダリングされる", () => {
    const entry = makeEntry({
      summary: {
        en: "Also called *detachment*.",
        ja: "*分離規則*とも呼ばれる。",
      },
    });
    render(<ReferencePopover entry={entry} locale="en" testId="ref-pop" />);
    fireEvent.click(screen.getByTestId("ref-pop-trigger"));
    const popover = screen.getByTestId("ref-pop-popover");
    const emElements = popover.querySelectorAll("em");
    expect(emElements.length).toBeGreaterThan(0);
    expect(emElements[0]?.textContent).toBe("detachment");
  });

  it("aria-expanded属性が正しく更新される", () => {
    render(
      <ReferencePopover entry={makeEntry()} locale="en" testId="ref-pop" />,
    );
    const trigger = screen.getByTestId("ref-pop-trigger");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
  });

  it("testIdなしでもレンダリングされる", () => {
    render(<ReferencePopover entry={makeEntry()} locale="en" />);
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThan(0);
    const triggerBtn = buttons.find((b) => b.textContent === "?");
    expect(triggerBtn).toBeDefined();
    fireEvent.click(triggerBtn!);
    // ポップオーバーが開いていることをtextContentで確認
    expect(screen.getByRole("tooltip")).toBeDefined();
  });

  it("詳しく見るクリック後にポップオーバーが閉じる", () => {
    const onOpenDetail = vi.fn();
    render(
      <ReferencePopover
        entry={makeEntry()}
        locale="en"
        onOpenDetail={onOpenDetail}
        testId="ref-pop"
      />,
    );
    fireEvent.click(screen.getByTestId("ref-pop-trigger"));
    fireEvent.click(screen.getByTestId("ref-pop-detail-btn"));
    expect(screen.queryByTestId("ref-pop-popover")).toBeNull();
  });
});

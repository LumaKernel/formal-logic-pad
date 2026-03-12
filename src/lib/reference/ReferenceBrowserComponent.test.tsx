import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReferenceEntry } from "./referenceEntry";
import { ReferenceBrowserComponent } from "./ReferenceBrowserComponent";

// --- Test Data ---

const makeEntry = (
  overrides: Partial<ReferenceEntry> & Pick<ReferenceEntry, "id" | "category">,
): ReferenceEntry => ({
  title: {
    en: `Title ${overrides.id satisfies string}`,
    ja: `タイトル ${overrides.id satisfies string}`,
  },
  summary: {
    en: `Summary ${overrides.id satisfies string}`,
    ja: `要約 ${overrides.id satisfies string}`,
  },
  body: { en: ["body"], ja: ["本文"] },
  relatedEntryIds: [],
  externalLinks: [],
  keywords: [],
  order: 0,
  ...overrides,
});

const testEntries: readonly ReferenceEntry[] = [
  makeEntry({ id: "axiom-a1", category: "axiom", order: 1 }),
  makeEntry({ id: "axiom-a2", category: "axiom", order: 2 }),
  makeEntry({
    id: "rule-mp",
    category: "inference-rule",
    order: 1,
    title: { en: "Modus Ponens", ja: "モーダスポネンス" },
    summary: {
      en: "From φ → ψ and φ, derive ψ",
      ja: "φ → ψ と φ から ψ を導出",
    },
  }),
  makeEntry({ id: "concept-sub", category: "concept", order: 1 }),
];

describe("ReferenceBrowserComponent", () => {
  it("エントリ一覧を表示する", () => {
    render(
      <ReferenceBrowserComponent
        entries={testEntries}
        locale="en"
        testId="ref"
      />,
    );
    expect(screen.getByTestId("ref")).toBeInTheDocument();
    expect(screen.getByTestId("ref-search")).toBeInTheDocument();
    expect(screen.getByTestId("ref-count")).toHaveTextContent(
      `${String(testEntries.length) satisfies string} / ${String(testEntries.length) satisfies string}`,
    );
  });

  it("カテゴリバッジが表示される", () => {
    render(
      <ReferenceBrowserComponent
        entries={testEntries}
        locale="en"
        testId="ref"
      />,
    );
    expect(screen.getByTestId("ref-category-axiom")).toBeInTheDocument();
    expect(
      screen.getByTestId("ref-category-inference-rule"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("ref-category-concept")).toBeInTheDocument();
  });

  it("テキスト検索でフィルタできる", async () => {
    const user = userEvent.setup();
    render(
      <ReferenceBrowserComponent
        entries={testEntries}
        locale="en"
        testId="ref"
      />,
    );
    const searchInput = screen.getByTestId("ref-search");
    await user.type(searchInput, "Modus Ponens");
    expect(screen.getByTestId("ref-count")).toHaveTextContent(
      `1 / ${String(testEntries.length) satisfies string}`,
    );
    expect(screen.getByTestId("ref-entry-rule-mp")).toBeInTheDocument();
  });

  it("カテゴリフィルタで絞り込める", async () => {
    const user = userEvent.setup();
    render(
      <ReferenceBrowserComponent
        entries={testEntries}
        locale="en"
        testId="ref"
      />,
    );
    await user.click(screen.getByTestId("ref-category-axiom"));
    expect(screen.getByTestId("ref-count")).toHaveTextContent(
      `2 / ${String(testEntries.length) satisfies string}`,
    );
    expect(screen.getByTestId("ref-entry-axiom-a1")).toBeInTheDocument();
    expect(screen.getByTestId("ref-entry-axiom-a2")).toBeInTheDocument();
  });

  it("カテゴリフィルタのトグル（再クリックで解除）", async () => {
    const user = userEvent.setup();
    render(
      <ReferenceBrowserComponent
        entries={testEntries}
        locale="en"
        testId="ref"
      />,
    );
    // 選択
    await user.click(screen.getByTestId("ref-category-axiom"));
    expect(screen.getByTestId("ref-count")).toHaveTextContent(
      `2 / ${String(testEntries.length) satisfies string}`,
    );
    // 再クリックで解除
    await user.click(screen.getByTestId("ref-category-axiom"));
    expect(screen.getByTestId("ref-count")).toHaveTextContent(
      `${String(testEntries.length) satisfies string} / ${String(testEntries.length) satisfies string}`,
    );
  });

  it("該当なしで空メッセージが表示される", async () => {
    const user = userEvent.setup();
    render(
      <ReferenceBrowserComponent
        entries={testEntries}
        locale="en"
        testId="ref"
        emptyMessage="Nothing found."
      />,
    );
    await user.type(screen.getByTestId("ref-search"), "xyznonexistent");
    expect(screen.getByTestId("ref-empty")).toHaveTextContent("Nothing found.");
  });

  it("エントリクリックでモーダルが開く", async () => {
    const user = userEvent.setup();
    render(
      <ReferenceBrowserComponent
        entries={testEntries}
        locale="en"
        testId="ref"
      />,
    );
    await user.click(screen.getByTestId("ref-entry-rule-mp"));
    // モーダルが表示される
    expect(screen.getByTestId("ref-modal")).toBeInTheDocument();
    // モーダル内にタイトルが表示（entryリストにも同じテキストがあるためgetAllByTextで確認）
    const allModusPonens = screen.getAllByText("Modus Ponens");
    expect(allModusPonens.length).toBeGreaterThanOrEqual(2);
  });

  it("モーダルを閉じる", async () => {
    const user = userEvent.setup();
    render(
      <ReferenceBrowserComponent
        entries={testEntries}
        locale="en"
        testId="ref"
      />,
    );
    await user.click(screen.getByTestId("ref-entry-rule-mp"));
    expect(screen.getByTestId("ref-modal")).toBeInTheDocument();
    // 閉じるボタンをクリック
    await user.click(screen.getByTestId("ref-modal-close"));
    expect(screen.queryByTestId("ref-modal")).not.toBeInTheDocument();
  });

  it("日本語ロケールで表示される", () => {
    render(
      <ReferenceBrowserComponent
        entries={testEntries}
        locale="ja"
        testId="ref"
      />,
    );
    expect(screen.getByTestId("ref-category-axiom")).toHaveTextContent("公理");
  });

  // suppress console.error for intentional modal render
  it("searchPlaceholderのカスタム値が適用される", () => {
    vi.stubGlobal("console", { ...console, error: vi.fn() });
    render(
      <ReferenceBrowserComponent
        entries={testEntries}
        locale="en"
        testId="ref"
        searchPlaceholder="Type to search..."
      />,
    );
    expect(
      screen.getByPlaceholderText("Type to search..."),
    ).toBeInTheDocument();
    vi.unstubAllGlobals();
  });
});

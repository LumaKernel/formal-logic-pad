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

  it("モーダルで関連クエストが表示される", async () => {
    const user = userEvent.setup();
    const entryWithQuests = makeEntry({
      id: "axiom-a1",
      category: "axiom",
      order: 1,
      relatedQuestIds: ["prop-01", "prop-02"],
    });
    const resolveQuestTitle = (questId: string) =>
      questId === "prop-01"
        ? "Quest 1"
        : questId === "prop-02"
          ? "Quest 2"
          : undefined;
    render(
      <ReferenceBrowserComponent
        entries={[entryWithQuests]}
        locale="en"
        testId="ref"
        resolveQuestTitle={resolveQuestTitle}
        onStartQuest={vi.fn()}
      />,
    );
    await user.click(screen.getByTestId("ref-entry-axiom-a1"));
    expect(screen.getByTestId("ref-modal")).toBeInTheDocument();
    expect(screen.getByTestId("ref-modal-quest-prop-01")).toBeInTheDocument();
    expect(screen.getByTestId("ref-modal-quest-prop-02")).toBeInTheDocument();
  });

  it("モーダルでクエストクリック時にonStartQuestが呼ばれる", async () => {
    const user = userEvent.setup();
    const onStartQuest = vi.fn();
    const entryWithQuests = makeEntry({
      id: "axiom-a1",
      category: "axiom",
      order: 1,
      relatedQuestIds: ["prop-01"],
    });
    render(
      <ReferenceBrowserComponent
        entries={[entryWithQuests]}
        locale="en"
        testId="ref"
        resolveQuestTitle={() => "Quest 1"}
        onStartQuest={onStartQuest}
      />,
    );
    await user.click(screen.getByTestId("ref-entry-axiom-a1"));
    await user.click(screen.getByTestId("ref-modal-quest-prop-01"));
    expect(onStartQuest).toHaveBeenCalledWith("prop-01");
  });

  // --- Guide section ---

  it("guideエントリがあるとガイドセクションが表示される", () => {
    const entriesWithGuides: readonly ReferenceEntry[] = [
      ...testEntries,
      makeEntry({
        id: "guide-first",
        category: "guide",
        order: 1,
        title: { en: "First Guide", ja: "最初のガイド" },
        summary: { en: "Start here.", ja: "ここから始めよう。" },
      }),
      makeEntry({
        id: "guide-second",
        category: "guide",
        order: 2,
        title: { en: "Second Guide", ja: "次のガイド" },
        summary: { en: "Then read this.", ja: "次にこちらを読もう。" },
      }),
    ];
    render(
      <ReferenceBrowserComponent
        entries={entriesWithGuides}
        locale="en"
        testId="ref"
      />,
    );
    expect(screen.getByTestId("ref-guide-section")).toBeInTheDocument();
    expect(screen.getByTestId("ref-guide-guide-first")).toBeInTheDocument();
    expect(screen.getByTestId("ref-guide-guide-second")).toBeInTheDocument();
  });

  it("guideエントリがないとガイドセクションは表示されない", () => {
    render(
      <ReferenceBrowserComponent
        entries={testEntries}
        locale="en"
        testId="ref"
      />,
    );
    expect(screen.queryByTestId("ref-guide-section")).not.toBeInTheDocument();
  });

  it("検索中はガイドセクションが非表示になる", async () => {
    const user = userEvent.setup();
    const entriesWithGuides: readonly ReferenceEntry[] = [
      ...testEntries,
      makeEntry({ id: "guide-first", category: "guide", order: 1 }),
    ];
    render(
      <ReferenceBrowserComponent
        entries={entriesWithGuides}
        locale="en"
        testId="ref"
      />,
    );
    expect(screen.getByTestId("ref-guide-section")).toBeInTheDocument();
    await user.type(screen.getByTestId("ref-search"), "axiom");
    expect(screen.queryByTestId("ref-guide-section")).not.toBeInTheDocument();
  });

  it("ガイドカードクリックでモーダルが開く", async () => {
    const user = userEvent.setup();
    const entriesWithGuides: readonly ReferenceEntry[] = [
      ...testEntries,
      makeEntry({
        id: "guide-first",
        category: "guide",
        order: 1,
        title: { en: "First Guide", ja: "最初のガイド" },
      }),
    ];
    render(
      <ReferenceBrowserComponent
        entries={entriesWithGuides}
        locale="en"
        testId="ref"
      />,
    );
    await user.click(screen.getByTestId("ref-guide-guide-first"));
    expect(screen.getByTestId("ref-modal")).toBeInTheDocument();
  });

  it("ガイドカードに関連トピック数が表示される", () => {
    const entriesWithGuides: readonly ReferenceEntry[] = [
      ...testEntries,
      makeEntry({
        id: "guide-with-related",
        category: "guide",
        order: 1,
        title: { en: "Guide With Related", ja: "関連付きガイド" },
        summary: { en: "Has related.", ja: "関連あり。" },
        relatedEntryIds: ["axiom-a1", "concept-sub"],
      }),
    ];
    render(
      <ReferenceBrowserComponent
        entries={entriesWithGuides}
        locale="en"
        testId="ref"
        relatedTopicsLabel="related topics"
      />,
    );
    expect(screen.getByText("+ 2 related topics")).toBeInTheDocument();
  });

  it("関連トピックがないガイドカードにはバッジが表示されない", () => {
    const entriesWithGuides: readonly ReferenceEntry[] = [
      ...testEntries,
      makeEntry({
        id: "guide-no-related",
        category: "guide",
        order: 1,
        title: { en: "Guide No Related", ja: "関連なしガイド" },
        summary: { en: "No related.", ja: "関連なし。" },
        relatedEntryIds: [],
      }),
    ];
    render(
      <ReferenceBrowserComponent
        entries={entriesWithGuides}
        locale="en"
        testId="ref"
        relatedTopicsLabel="related topics"
      />,
    );
    expect(screen.queryByText(/related topics/)).not.toBeInTheDocument();
  });

  it("モーダル内の関連エントリクリックでナビゲートする", async () => {
    const user = userEvent.setup();
    const entryWithRelated = makeEntry({
      id: "axiom-a1",
      category: "axiom",
      order: 1,
      relatedEntryIds: ["rule-mp"],
    });
    render(
      <ReferenceBrowserComponent
        entries={[
          entryWithRelated,
          makeEntry({
            id: "rule-mp",
            category: "inference-rule",
            order: 1,
            title: { en: "Modus Ponens", ja: "モーダスポネンス" },
          }),
        ]}
        locale="en"
        testId="ref"
      />,
    );
    await user.click(screen.getByTestId("ref-entry-axiom-a1"));
    expect(screen.getByTestId("ref-modal")).toBeInTheDocument();
    // 関連エントリのリンクをクリック → handleNavigateが発火
    await user.click(screen.getByTestId("ref-modal-related-rule-mp"));
    // ナビゲーション後もモーダルが表示されている（別エントリに切り替わる）
    expect(screen.getByTestId("ref-modal")).toBeInTheDocument();
  });

  it("resolveQuestTitleがない場合はクエストセクションを表示しない", async () => {
    const user = userEvent.setup();
    const entryWithQuests = makeEntry({
      id: "axiom-a1",
      category: "axiom",
      order: 1,
      relatedQuestIds: ["prop-01"],
    });
    render(
      <ReferenceBrowserComponent
        entries={[entryWithQuests]}
        locale="en"
        testId="ref"
        onStartQuest={vi.fn()}
      />,
    );
    await user.click(screen.getByTestId("ref-entry-axiom-a1"));
    const modal = screen.getByTestId("ref-modal");
    expect(modal.textContent).not.toContain("Related Quests");
  });
});

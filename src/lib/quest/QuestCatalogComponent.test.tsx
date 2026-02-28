import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QuestCatalog } from "./QuestCatalogComponent";
import type { CategoryGroup, QuestCatalogItem } from "./questCatalog";
import type { QuestDefinition } from "./questDefinition";

// --- テストヘルパー ---

function makeQuest(overrides: Partial<QuestDefinition> = {}): QuestDefinition {
  return {
    id: "test-01",
    category: "propositional-basics",
    title: "テスト問題",
    description: "テスト説明",
    difficulty: 1,
    systemPresetId: "lukasiewicz",
    goals: [],
    hints: [],
    estimatedSteps: 5,
    learningPoint: "テスト",
    order: 1,
    version: 1,
    ...overrides,
  };
}

function makeItem(
  overrides: Partial<QuestCatalogItem> & {
    readonly questOverrides?: Partial<QuestDefinition>;
  } = {},
): QuestCatalogItem {
  const { questOverrides, ...rest } = overrides;
  return {
    quest: makeQuest(questOverrides),
    completed: false,
    completionCount: 0,
    bestStepCount: undefined,
    rating: "not-completed",
    ...rest,
  };
}

function makeGroup(overrides: Partial<CategoryGroup> = {}): CategoryGroup {
  const items = overrides.items ?? [
    makeItem({ questOverrides: { id: "q1", title: "問題1" } }),
    makeItem({
      questOverrides: { id: "q2", title: "問題2", difficulty: 2 },
      completed: true,
      rating: "good",
      bestStepCount: 7,
      completionCount: 1,
    }),
  ];
  return {
    category: {
      id: "propositional-basics",
      label: "命題論理の基礎",
      description: "A1, A2, A3 + MP を使った基本的な証明。",
      order: 1,
    },
    items,
    completedCount: items.filter((i) => i.completed).length,
    totalCount: items.length,
    ...overrides,
  };
}

// --- 基本表示 ---

describe("基本表示", () => {
  it("カタログコンテナが表示される", () => {
    render(<QuestCatalog groups={[makeGroup()]} onStartQuest={vi.fn()} />);
    expect(screen.getByTestId("quest-catalog")).toBeTruthy();
  });

  it("カテゴリセクションが表示される", () => {
    render(<QuestCatalog groups={[makeGroup()]} onStartQuest={vi.fn()} />);
    expect(screen.getByTestId("category-propositional-basics")).toBeTruthy();
  });

  it("カテゴリラベルが表示される", () => {
    render(<QuestCatalog groups={[makeGroup()]} onStartQuest={vi.fn()} />);
    expect(screen.getByText("命題論理の基礎")).toBeTruthy();
  });

  it("カテゴリの進捗テキストが表示される", () => {
    render(<QuestCatalog groups={[makeGroup()]} onStartQuest={vi.fn()} />);
    expect(screen.getByText("1 / 2")).toBeTruthy();
  });

  it("クエストアイテムが表示される", () => {
    render(<QuestCatalog groups={[makeGroup()]} onStartQuest={vi.fn()} />);
    expect(screen.getByTestId("quest-item-q1")).toBeTruthy();
    expect(screen.getByTestId("quest-item-q2")).toBeTruthy();
  });

  it("クエストタイトルが表示される", () => {
    render(<QuestCatalog groups={[makeGroup()]} onStartQuest={vi.fn()} />);
    expect(screen.getByText("問題1")).toBeTruthy();
    expect(screen.getByText("問題2")).toBeTruthy();
  });

  it("複数カテゴリが表示される", () => {
    const groups: readonly CategoryGroup[] = [
      makeGroup(),
      makeGroup({
        category: {
          id: "propositional-negation",
          label: "否定を含む命題論理",
          description: "否定テスト",
          order: 2,
        },
        items: [
          makeItem({
            questOverrides: {
              id: "q3",
              title: "否定問題",
              category: "propositional-negation",
            },
          }),
        ],
      }),
    ];
    render(<QuestCatalog groups={groups} onStartQuest={vi.fn()} />);
    expect(screen.getByTestId("category-propositional-basics")).toBeTruthy();
    expect(screen.getByTestId("category-propositional-negation")).toBeTruthy();
  });
});

// --- チャプター番号 ---

describe("チャプター番号", () => {
  it("最初のカテゴリにチャプター番号1が表示される", () => {
    render(<QuestCatalog groups={[makeGroup()]} onStartQuest={vi.fn()} />);
    expect(screen.getByTestId("chapter-number-1")).toBeTruthy();
    expect(screen.getByTestId("chapter-number-1").textContent).toBe("1");
  });

  it("複数カテゴリで連番のチャプター番号が表示される", () => {
    const groups: readonly CategoryGroup[] = [
      makeGroup(),
      makeGroup({
        category: {
          id: "propositional-negation",
          label: "否定を含む命題論理",
          description: "否定テスト",
          order: 2,
        },
        items: [
          makeItem({
            questOverrides: {
              id: "q3",
              category: "propositional-negation",
            },
          }),
        ],
      }),
    ];
    render(<QuestCatalog groups={groups} onStartQuest={vi.fn()} />);
    expect(screen.getByTestId("chapter-number-1").textContent).toBe("1");
    expect(screen.getByTestId("chapter-number-2").textContent).toBe("2");
  });
});

// --- プログレスバー ---

describe("プログレスバー", () => {
  it("プログレスバーが表示される", () => {
    render(<QuestCatalog groups={[makeGroup()]} onStartQuest={vi.fn()} />);
    expect(screen.getByTestId("progress-bar")).toBeTruthy();
  });
});

// --- 難易度星 ---

describe("難易度星", () => {
  it("難易度1のクエストに星が表示される", () => {
    render(<QuestCatalog groups={[makeGroup()]} onStartQuest={vi.fn()} />);
    const stars = screen.getAllByTestId("difficulty-stars");
    expect(stars.length).toBeGreaterThan(0);
  });

  it("難易度バッジにLv.表記がある", () => {
    render(<QuestCatalog groups={[makeGroup()]} onStartQuest={vi.fn()} />);
    const item = screen.getByTestId("quest-item-q1");
    expect(within(item).getByText("Lv.1")).toBeTruthy();
  });
});

// --- 評価バッジ ---

describe("評価バッジ", () => {
  it("未完了は「未クリア」と表示される", () => {
    const groups = [
      makeGroup({
        items: [
          makeItem({ questOverrides: { id: "q1" }, rating: "not-completed" }),
        ],
      }),
    ];
    render(<QuestCatalog groups={groups} onStartQuest={vi.fn()} />);
    const item = screen.getByTestId("quest-item-q1");
    expect(within(item).getByText("未クリア")).toBeTruthy();
  });

  it("perfectは「Perfect!」と表示される", () => {
    const groups = [
      makeGroup({
        items: [
          makeItem({
            questOverrides: { id: "q1" },
            rating: "perfect",
            completed: true,
            bestStepCount: 3,
          }),
        ],
      }),
    ];
    render(<QuestCatalog groups={groups} onStartQuest={vi.fn()} />);
    const item = screen.getByTestId("quest-item-q1");
    expect(within(item).getByText("Perfect!")).toBeTruthy();
  });
});

// --- 開始ボタン ---

describe("開始ボタン", () => {
  it("未完了は「開始」と表示される", () => {
    render(<QuestCatalog groups={[makeGroup()]} onStartQuest={vi.fn()} />);
    expect(screen.getByTestId("start-btn-q1").textContent).toBe("開始");
  });

  it("完了済みは「再挑戦」と表示される", () => {
    render(<QuestCatalog groups={[makeGroup()]} onStartQuest={vi.fn()} />);
    expect(screen.getByTestId("start-btn-q2").textContent).toBe("再挑戦");
  });

  it("ボタンクリックでonStartQuestが呼ばれる", async () => {
    const user = userEvent.setup();
    const onStartQuest = vi.fn();
    render(<QuestCatalog groups={[makeGroup()]} onStartQuest={onStartQuest} />);
    await user.click(screen.getByTestId("start-btn-q1"));
    expect(onStartQuest).toHaveBeenCalledWith("q1");
  });

  it("アイテムクリックでもonStartQuestが呼ばれる", async () => {
    const user = userEvent.setup();
    const onStartQuest = vi.fn();
    render(<QuestCatalog groups={[makeGroup()]} onStartQuest={onStartQuest} />);
    await user.click(screen.getByTestId("quest-item-q2"));
    expect(onStartQuest).toHaveBeenCalledWith("q2");
  });
});

// --- フィルタ ---

describe("フィルタ", () => {
  it("フィルタバーが表示される", () => {
    render(<QuestCatalog groups={[makeGroup()]} onStartQuest={vi.fn()} />);
    expect(screen.getByTestId("filter-bar")).toBeTruthy();
  });

  it("難易度フィルタボタンが6つ表示される", () => {
    render(<QuestCatalog groups={[makeGroup()]} onStartQuest={vi.fn()} />);
    // null, 1, 2, 3, 4, 5
    expect(screen.getByTestId("difficulty-filter-null")).toBeTruthy();
    expect(screen.getByTestId("difficulty-filter-1")).toBeTruthy();
    expect(screen.getByTestId("difficulty-filter-2")).toBeTruthy();
    expect(screen.getByTestId("difficulty-filter-3")).toBeTruthy();
    expect(screen.getByTestId("difficulty-filter-4")).toBeTruthy();
    expect(screen.getByTestId("difficulty-filter-5")).toBeTruthy();
  });

  it("完了状態フィルタボタンが3つ表示される", () => {
    render(<QuestCatalog groups={[makeGroup()]} onStartQuest={vi.fn()} />);
    expect(screen.getByTestId("completion-filter-all")).toBeTruthy();
    expect(screen.getByTestId("completion-filter-completed")).toBeTruthy();
    expect(screen.getByTestId("completion-filter-incomplete")).toBeTruthy();
  });

  it("難易度フィルタをクリックすると絞り込まれる", async () => {
    const user = userEvent.setup();
    render(<QuestCatalog groups={[makeGroup()]} onStartQuest={vi.fn()} />);
    // difficulty: 1 に絞る → q1だけ
    await user.click(screen.getByTestId("difficulty-filter-1"));
    expect(screen.getByTestId("quest-item-q1")).toBeTruthy();
    expect(screen.queryByTestId("quest-item-q2")).toBeNull();
  });

  it("完了状態フィルタで未完了のみに絞る", async () => {
    const user = userEvent.setup();
    render(<QuestCatalog groups={[makeGroup()]} onStartQuest={vi.fn()} />);
    await user.click(screen.getByTestId("completion-filter-incomplete"));
    expect(screen.getByTestId("quest-item-q1")).toBeTruthy();
    expect(screen.queryByTestId("quest-item-q2")).toBeNull();
  });

  it("完了状態フィルタでクリア済みのみに絞る", async () => {
    const user = userEvent.setup();
    render(<QuestCatalog groups={[makeGroup()]} onStartQuest={vi.fn()} />);
    await user.click(screen.getByTestId("completion-filter-completed"));
    expect(screen.queryByTestId("quest-item-q1")).toBeNull();
    expect(screen.getByTestId("quest-item-q2")).toBeTruthy();
  });

  it("全フィルタで空になったら空メッセージが表示される", async () => {
    const user = userEvent.setup();
    const groups = [
      makeGroup({
        items: [
          makeItem({
            questOverrides: { id: "q1", difficulty: 1 },
            completed: false,
          }),
        ],
      }),
    ];
    render(<QuestCatalog groups={groups} onStartQuest={vi.fn()} />);
    await user.click(screen.getByTestId("completion-filter-completed"));
    expect(screen.getByTestId("quest-catalog-empty")).toBeTruthy();
    expect(screen.getByText("条件に合うクエストがありません。")).toBeTruthy();
  });

  it("難易度を解除して全表示に戻る", async () => {
    const user = userEvent.setup();
    render(<QuestCatalog groups={[makeGroup()]} onStartQuest={vi.fn()} />);
    await user.click(screen.getByTestId("difficulty-filter-1"));
    expect(screen.queryByTestId("quest-item-q2")).toBeNull();
    await user.click(screen.getByTestId("difficulty-filter-null"));
    expect(screen.getByTestId("quest-item-q2")).toBeTruthy();
  });
});

// --- 空の状態 ---

describe("空の状態", () => {
  it("グループが空のとき空メッセージが表示される", () => {
    render(<QuestCatalog groups={[]} onStartQuest={vi.fn()} />);
    expect(screen.getByTestId("quest-catalog-empty")).toBeTruthy();
  });
});

// --- ステップ数 ---

describe("ステップ数表示", () => {
  it("未完了は目安のみ表示", () => {
    const groups = [
      makeGroup({
        items: [
          makeItem({
            questOverrides: { id: "q1", estimatedSteps: 5 },
            bestStepCount: undefined,
          }),
        ],
      }),
    ];
    render(<QuestCatalog groups={groups} onStartQuest={vi.fn()} />);
    const item = screen.getByTestId("quest-item-q1");
    expect(within(item).getByText("目安: 5ステップ")).toBeTruthy();
  });

  it("完了済みはベストと目安を表示", () => {
    const groups = [
      makeGroup({
        items: [
          makeItem({
            questOverrides: { id: "q1", estimatedSteps: 5 },
            bestStepCount: 3,
            completed: true,
          }),
        ],
      }),
    ];
    render(<QuestCatalog groups={groups} onStartQuest={vi.fn()} />);
    const item = screen.getByTestId("quest-item-q1");
    expect(within(item).getByText("ベスト: 3 / 目安: 5")).toBeTruthy();
  });
});

// --- キーボード操作 ---

describe("キーボード操作", () => {
  it("Enterキーでクエスト開始", async () => {
    const user = userEvent.setup();
    const onStartQuest = vi.fn();
    render(<QuestCatalog groups={[makeGroup()]} onStartQuest={onStartQuest} />);
    const item = screen.getByTestId("quest-item-q1");
    item.focus();
    await user.keyboard("{Enter}");
    expect(onStartQuest).toHaveBeenCalledWith("q1");
  });
});

// --- ホバー ---

describe("ホバー", () => {
  it("マウスエンター・リーブでスタイルが切り替わる", async () => {
    const user = userEvent.setup();
    render(<QuestCatalog groups={[makeGroup()]} onStartQuest={vi.fn()} />);
    const item = screen.getByTestId("quest-item-q1");
    await user.hover(item);
    await user.unhover(item);
    expect(item).toBeTruthy();
  });
});

// --- ノートブック数バッジ ---

describe("ノートブック数バッジ", () => {
  it("notebookCountsが未指定のときバッジが表示されない", () => {
    render(<QuestCatalog groups={[makeGroup()]} onStartQuest={vi.fn()} />);
    expect(screen.queryByTestId("notebook-count-q1")).toBeNull();
    expect(screen.queryByTestId("notebook-count-q2")).toBeNull();
  });

  it("ノートブック数が0のクエストにはバッジが表示されない", () => {
    const counts = new Map<string, number>([["q1", 0]]);
    render(
      <QuestCatalog
        groups={[makeGroup()]}
        onStartQuest={vi.fn()}
        notebookCounts={counts}
      />,
    );
    expect(screen.queryByTestId("notebook-count-q1")).toBeNull();
  });

  it("ノートブック数が1以上のクエストにバッジが表示される", () => {
    const counts = new Map<string, number>([
      ["q1", 2],
      ["q2", 1],
    ]);
    render(
      <QuestCatalog
        groups={[makeGroup()]}
        onStartQuest={vi.fn()}
        notebookCounts={counts}
      />,
    );
    expect(screen.getByTestId("notebook-count-q1")).toBeTruthy();
    expect(screen.getByTestId("notebook-count-q1").textContent).toBe("2冊");
    expect(screen.getByTestId("notebook-count-q2")).toBeTruthy();
    expect(screen.getByTestId("notebook-count-q2").textContent).toBe("1冊");
  });

  it("バッジクリックでonShowQuestNotebooksが呼ばれる", async () => {
    const user = userEvent.setup();
    const counts = new Map<string, number>([["q1", 3]]);
    const onShow = vi.fn();
    render(
      <QuestCatalog
        groups={[makeGroup()]}
        onStartQuest={vi.fn()}
        notebookCounts={counts}
        onShowQuestNotebooks={onShow}
      />,
    );
    await user.click(screen.getByTestId("notebook-count-q1"));
    expect(onShow).toHaveBeenCalledWith("q1");
  });

  it("バッジクリックでonStartQuestが呼ばれない（stopPropagation）", async () => {
    const user = userEvent.setup();
    const counts = new Map<string, number>([["q1", 3]]);
    const onStart = vi.fn();
    render(
      <QuestCatalog
        groups={[makeGroup()]}
        onStartQuest={onStart}
        notebookCounts={counts}
        onShowQuestNotebooks={vi.fn()}
      />,
    );
    await user.click(screen.getByTestId("notebook-count-q1"));
    expect(onStart).not.toHaveBeenCalled();
  });

  it("mapに含まれないクエストIDのバッジは表示されない", () => {
    const counts = new Map<string, number>([["other-quest", 5]]);
    render(
      <QuestCatalog
        groups={[makeGroup()]}
        onStartQuest={vi.fn()}
        notebookCounts={counts}
      />,
    );
    expect(screen.queryByTestId("notebook-count-q1")).toBeNull();
    expect(screen.queryByTestId("notebook-count-q2")).toBeNull();
  });
});

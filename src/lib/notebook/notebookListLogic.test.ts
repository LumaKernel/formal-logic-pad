import { describe, it, expect } from "vitest";
import {
  formatRelativeTime,
  toNotebookListItem,
  toNotebookListItems,
  filterNotebooksByQuestId,
  validateNotebookName,
  deleteConfirmMessage,
} from "./notebookListLogic";
import { lukasiewiczSystem } from "../logic-core/inferenceRule";
import type { Notebook, NotebookMeta } from "./notebookState";
import { createEmptyWorkspace } from "../proof-pad/workspaceState";

const makeNotebook = (
  id: string,
  name: string,
  createdAt: number,
  updatedAt: number,
): Notebook => ({
  meta: { id, name, createdAt, updatedAt },
  workspace: createEmptyWorkspace(lukasiewiczSystem),
});

describe("formatRelativeTime", () => {
  const base = 1_000_000;

  it("60秒未満は「たった今」", () => {
    expect(formatRelativeTime(base, base - 30_000)).toBe("たった今");
    expect(formatRelativeTime(base, base)).toBe("たった今");
  });

  it("1分〜59分は「N分前」", () => {
    expect(formatRelativeTime(base, base - 60_000)).toBe("1分前");
    expect(formatRelativeTime(base, base - 3_540_000)).toBe("59分前");
  });

  it("1時間〜23時間は「N時間前」", () => {
    expect(formatRelativeTime(base, base - 3_600_000)).toBe("1時間前");
    expect(formatRelativeTime(base, base - 82_800_000)).toBe("23時間前");
  });

  it("1日〜29日は「N日前」", () => {
    expect(formatRelativeTime(base, base - 86_400_000)).toBe("1日前");
    expect(formatRelativeTime(base, base - 86_400_000 * 29)).toBe("29日前");
  });

  it("30日以上は日付表示", () => {
    // 2024/1/1 00:00:00 UTC = 1704067200000ms
    const oldTimestamp = 1_704_067_200_000;
    const now = oldTimestamp + 86_400_000 * 31;
    const result = formatRelativeTime(now, oldTimestamp);
    // Intl.DateTimeFormat("ja-JP") の出力形式に対応
    expect(result).toMatch(/\d{4}\/\d{1,2}\/\d{1,2}/);
  });
});

describe("toNotebookListItem", () => {
  it("ノートブックを表示用データに変換する", () => {
    const now = 100_000;
    const notebook = makeNotebook("nb-1", "テスト", 50_000, 90_000);
    const item = toNotebookListItem(notebook, now);
    expect(item.id).toBe("nb-1");
    expect(item.name).toBe("テスト");
    expect(item.systemName).toBe("Łukasiewicz");
    expect(item.mode).toBe("free");
    expect(item.updatedAtLabel).toBe("たった今");
    expect(item.createdAtLabel).toBe("たった今");
    expect(item.questId).toBeUndefined();
  });

  it("クエストノートブックのquestIdが保持される", () => {
    const now = 100_000;
    const notebook: Notebook = {
      ...makeNotebook("nb-1", "クエスト", 50_000, 90_000),
      questId: "q-01",
    };
    const item = toNotebookListItem(notebook, now);
    expect(item.questId).toBe("q-01");
  });
});

describe("toNotebookListItems", () => {
  it("複数ノートブックを変換する", () => {
    const now = 100_000;
    const items = toNotebookListItems(
      [
        makeNotebook("nb-1", "A", 50_000, 90_000),
        makeNotebook("nb-2", "B", 60_000, 80_000),
      ],
      now,
    );
    expect(items.length).toBe(2);
    expect(items[0]?.name).toBe("A");
    expect(items[1]?.name).toBe("B");
  });

  it("空配列の場合は空を返す", () => {
    expect(toNotebookListItems([], 100_000)).toEqual([]);
  });
});

describe("filterNotebooksByQuestId", () => {
  const items = [
    {
      id: "nb-1",
      name: "Free",
      systemName: "Łukasiewicz",
      mode: "free" as const,
      updatedAtLabel: "たった今",
      createdAtLabel: "たった今",
    },
    {
      id: "nb-2",
      name: "Quest A",
      systemName: "Łukasiewicz",
      mode: "quest" as const,
      updatedAtLabel: "1分前",
      createdAtLabel: "2分前",
      questId: "q-01",
    },
    {
      id: "nb-3",
      name: "Quest B",
      systemName: "Łukasiewicz",
      mode: "quest" as const,
      updatedAtLabel: "3分前",
      createdAtLabel: "4分前",
      questId: "q-02",
    },
    {
      id: "nb-4",
      name: "Quest A2",
      systemName: "Łukasiewicz",
      mode: "quest" as const,
      updatedAtLabel: "5分前",
      createdAtLabel: "6分前",
      questId: "q-01",
    },
  ];

  it("指定クエストIDのノートブックのみを返す", () => {
    const filtered = filterNotebooksByQuestId(items, "q-01");
    expect(filtered).toHaveLength(2);
    expect(filtered[0]?.id).toBe("nb-2");
    expect(filtered[1]?.id).toBe("nb-4");
  });

  it("一致するものがなければ空配列を返す", () => {
    expect(filterNotebooksByQuestId(items, "q-99")).toEqual([]);
  });

  it("questIdが未設定のアイテムはフィルタされる", () => {
    const filtered = filterNotebooksByQuestId(items, "q-01");
    expect(filtered.every((i) => i.questId === "q-01")).toBe(true);
  });
});

describe("validateNotebookName", () => {
  it("有効な名前はvalid: true", () => {
    expect(validateNotebookName("テストノート")).toEqual({ valid: true });
    expect(validateNotebookName("a")).toEqual({ valid: true });
  });

  it("空文字列はvalid: false", () => {
    const result = validateNotebookName("");
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.reason).toContain("名前を入力");
    }
  });

  it("空白のみはvalid: false", () => {
    const result = validateNotebookName("   ");
    expect(result.valid).toBe(false);
  });

  it("100文字を超える名前はvalid: false", () => {
    const result = validateNotebookName("a".repeat(101));
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.reason).toContain("100文字以内");
    }
  });

  it("100文字ちょうどはvalid: true", () => {
    expect(validateNotebookName("a".repeat(100))).toEqual({ valid: true });
  });
});

describe("deleteConfirmMessage", () => {
  it("削除確認メッセージを生成する", () => {
    const meta: NotebookMeta = {
      id: "nb-1",
      name: "テスト",
      createdAt: 0,
      updatedAt: 0,
    };
    const msg = deleteConfirmMessage(meta);
    expect(msg).toContain("テスト");
    expect(msg).toContain("削除");
  });
});

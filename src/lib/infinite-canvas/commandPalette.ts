/**
 * コマンドパレットの純粋ロジック。
 *
 * 汎用的なコマンドパレットのフィルタリング・ナビゲーションを提供する。
 * InfiniteCanvas のオーバーレイUIとして使われ、呼び出し側が具体的なコマンド
 * （公理追加、推論規則など）を注入する。
 *
 * 変更時は commandPalette.test.ts, useCommandPalette.ts, CommandPaletteComponent.tsx も同期すること。
 */

import { unsafeAssertDefined } from "../_unsafe/unsafeLookup";

// --- Types ---

/** コマンドパレットに表示するアイテム */
export type CommandItem = {
  /** ユニークID */
  readonly id: string;
  /** 表示ラベル（検索対象） */
  readonly label: string;
  /** 補足説明（検索対象） */
  readonly description: string;
  /** カテゴリ表示用（例: "公理", "操作"） */
  readonly category: string;
};

/** フィルタ結果 */
export type CommandPaletteState = {
  /** 検索クエリ */
  readonly query: string;
  /** フィルタ済みアイテム */
  readonly filteredItems: readonly CommandItem[];
  /** 選択中のインデックス（-1 = 未選択） */
  readonly selectedIndex: number;
};

/** 空の初期状態 */
export const EMPTY_COMMAND_PALETTE_STATE: CommandPaletteState = {
  query: "",
  filteredItems: [],
  selectedIndex: -1,
};

// --- Pure logic functions ---

/** Case-insensitive substring match against label and description.
 *  Pure function. */
export function filterItems(
  items: readonly CommandItem[],
  query: string,
): readonly CommandItem[] {
  if (query === "") {
    return items;
  }
  const lowerQuery = query.toLowerCase();
  return items.filter(
    (item) =>
      item.label.toLowerCase().includes(lowerQuery) ||
      item.description.toLowerCase().includes(lowerQuery),
  );
}

/** Create a new CommandPaletteState from items and query.
 *  If results exist, selectedIndex defaults to 0.
 *  Pure function. */
export function createCommandPaletteState(
  items: readonly CommandItem[],
  query: string,
): CommandPaletteState {
  const filteredItems = filterItems(items, query);
  return {
    query,
    filteredItems,
    selectedIndex: filteredItems.length > 0 ? 0 : -1,
  };
}

/** Move selection down (wrap around at end).
 *  Pure function. */
export function selectNext(state: CommandPaletteState): CommandPaletteState {
  if (state.filteredItems.length === 0) {
    return state;
  }
  return {
    ...state,
    selectedIndex: (state.selectedIndex + 1) % state.filteredItems.length,
  };
}

/** Move selection up (wrap around at beginning).
 *  Pure function. */
export function selectPrevious(
  state: CommandPaletteState,
): CommandPaletteState {
  if (state.filteredItems.length === 0) {
    return state;
  }
  return {
    ...state,
    selectedIndex:
      (state.selectedIndex - 1 + state.filteredItems.length) %
      state.filteredItems.length,
  };
}

/** Get the currently selected item, or null if none.
 *  Pure function. */
export function getSelectedItem(
  state: CommandPaletteState,
): CommandItem | null {
  if (
    state.selectedIndex < 0 ||
    state.selectedIndex >= state.filteredItems.length
  ) {
    return null;
  }
  return unsafeAssertDefined(
    state.filteredItems[state.selectedIndex],
    "selectedIndex is validated in bounds above",
  );
}

/**
 * コマンドパレットのReact hook。
 *
 * 状態管理（open/close, query, 選択インデックス）とアクション実行を提供する。
 * UIコンポーネント（CommandPaletteComponent.tsx）から利用される。
 *
 * 変更時は useCommandPalette.test.tsx, CommandPaletteComponent.tsx も同期すること。
 */

import { useCallback, useState } from "react";
import {
  createCommandPaletteState,
  selectNext,
  selectPrevious,
  getSelectedItem,
  EMPTY_COMMAND_PALETTE_STATE,
  type CommandItem,
  type CommandPaletteState,
} from "./commandPalette";

// --- Types ---

/** Callbacks for command palette actions */
export type CommandPaletteCallbacks = {
  /** Called when a command item is executed */
  readonly onExecute?: (item: CommandItem) => void;
};

/** Result of the useCommandPalette hook */
export type UseCommandPaletteResult = {
  /** Whether the command palette is currently open */
  readonly isOpen: boolean;
  /** Current palette state */
  readonly paletteState: CommandPaletteState;
  /** Open the command palette */
  readonly open: () => void;
  /** Close the command palette */
  readonly close: () => void;
  /** Update the search query */
  readonly setQuery: (query: string) => void;
  /** Select next item */
  readonly goToNext: () => void;
  /** Select previous item */
  readonly goToPrevious: () => void;
  /** Execute the currently selected item */
  readonly executeSelected: () => void;
};

// --- Hook ---

/** Hook that manages command palette state and navigation.
 *
 *  @param items - All available command items
 *  @param callbacks - Action callbacks
 */
export function useCommandPalette(
  items: readonly CommandItem[],
  callbacks: CommandPaletteCallbacks,
): UseCommandPaletteResult {
  const [isOpen, setIsOpen] = useState(false);
  const [paletteState, setPaletteState] = useState<CommandPaletteState>(
    EMPTY_COMMAND_PALETTE_STATE,
  );

  const open = useCallback(() => {
    setPaletteState(createCommandPaletteState(items, ""));
    setIsOpen(true);
  }, [items]);

  const close = useCallback(() => {
    setIsOpen(false);
    setPaletteState(EMPTY_COMMAND_PALETTE_STATE);
  }, []);

  const setQuery = useCallback(
    (query: string) => {
      setPaletteState(createCommandPaletteState(items, query));
    },
    [items],
  );

  const goToNext = useCallback(() => {
    setPaletteState((prev) => selectNext(prev));
  }, []);

  const goToPrevious = useCallback(() => {
    setPaletteState((prev) => selectPrevious(prev));
  }, []);

  const executeSelected = useCallback(() => {
    const selected = getSelectedItem(paletteState);
    if (selected !== null) {
      callbacks.onExecute?.(selected);
      setIsOpen(false);
      setPaletteState(EMPTY_COMMAND_PALETTE_STATE);
    }
  }, [paletteState, callbacks]);

  return {
    isOpen,
    paletteState,
    open,
    close,
    setQuery,
    goToNext,
    goToPrevious,
    executeSelected,
  };
}

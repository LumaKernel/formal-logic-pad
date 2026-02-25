/**
 * 入力補完の状態管理フック。
 *
 * FormulaInput/TermInput に補完機能を統合するためのカスタムフック。
 * 補完候補の計算・選択・適用のライフサイクルを管理する。
 *
 * 変更時は useCompletion.test.ts, FormulaInput.tsx, TermInput.tsx も同期すること。
 */

import { useCallback, useMemo, useRef, useState } from "react";
import type { CompletionCandidate, CompletionResult } from "./inputCompletion";
import { applyCompletion, computeCompletions } from "./inputCompletion";

// --- 戻り値の型 ---

export interface UseCompletionReturn {
  /** 現在の補完結果 */
  readonly completion: CompletionResult;
  /** 現在選択中のインデックス */
  readonly selectedIndex: number;
  /** ポップアップが表示されているか */
  readonly isOpen: boolean;
  /** 選択インデックスを変更 */
  readonly setSelectedIndex: (index: number) => void;
  /** 候補を選択して適用する。新しいテキストとカーソル位置を返す */
  readonly selectCandidate: (candidate: CompletionCandidate) =>
    | {
        readonly text: string;
        readonly cursorPos: number;
      }
    | undefined;
  /** ポップアップを閉じる */
  readonly close: () => void;
  /** 入力テキストとカーソル位置を更新して補完を再計算 */
  readonly update: (text: string, cursorPos: number) => void;
}

// --- フック ---

export const useCompletion = (currentText: string): UseCompletionReturn => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [cursorPos, setCursorPos] = useState(0);
  const textRef = useRef(currentText);
  textRef.current = currentText;

  const completion = useMemo(
    () => computeCompletions(textRef.current, cursorPos),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- textRef.current is tracked via cursorPos updates
    [cursorPos, currentText],
  );

  const update = useCallback((text: string, newCursorPos: number) => {
    textRef.current = text;
    setCursorPos(newCursorPos);
    const result = computeCompletions(text, newCursorPos);
    if (result.candidates.length > 0) {
      setIsOpen(true);
      setSelectedIndex(0);
    } else {
      setIsOpen(false);
    }
  }, []);

  const selectCandidate = useCallback(
    (candidate: CompletionCandidate) => {
      const result = applyCompletion(textRef.current, completion, candidate);
      setIsOpen(false);
      setSelectedIndex(0);
      return result;
    },
    [completion],
  );

  const close = useCallback(() => {
    setIsOpen(false);
    setSelectedIndex(0);
  }, []);

  return {
    completion,
    selectedIndex,
    isOpen,
    setSelectedIndex,
    selectCandidate,
    close,
    update,
  };
};

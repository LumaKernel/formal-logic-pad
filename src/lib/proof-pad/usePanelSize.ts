/**
 * パネルサイズ計測フック。
 *
 * ResizeObserver を使ってDOM要素の実際のサイズを計測する。
 * callback ref を返すので、パネルのルート要素に ref として渡す。
 *
 * 変更時は usePanelDrag.test.ts, ProofWorkspace.tsx, index.ts も同期すること。
 */

import { useCallback, useRef, useState } from "react";
import type { PanelSize } from "./panelPositionLogic";

/** usePanelSize の戻り値 */
export interface UsePanelSizeResult {
  /** 計測されたサイズ（まだ計測されていない場合はfallback値） */
  readonly size: PanelSize;
  /** パネルのルート要素に渡すcallback ref */
  readonly ref: (node: HTMLElement | null) => void;
}

/**
 * ResizeObserverでパネルの実際のサイズを計測するフック。
 *
 * @param fallback 計測前のフォールバックサイズ
 */
export function usePanelSize(fallback: PanelSize): UsePanelSizeResult {
  const [size, setSize] = useState<PanelSize>(fallback);
  const observerRef = useRef<ResizeObserver | null>(null);
  const nodeRef = useRef<HTMLElement | null>(null);

  const ref = useCallback((node: HTMLElement | null) => {
    // 前のobserverをクリーンアップ
    if (observerRef.current !== null) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    nodeRef.current = node;

    if (node === null) return;

    // 初回計測
    const rect = node.getBoundingClientRect();
    setSize({ width: rect.width, height: rect.height });

    // ResizeObserverで継続的に計測
    /* v8 ignore start -- ResizeObserver is not available in JSDOM */
    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (entry !== undefined) {
          const { width, height } = entry.contentRect;
          setSize({ width, height });
        }
      });
      observer.observe(node);
      observerRef.current = observer;
    }
    /* v8 ignore stop */
  }, []);

  return { size, ref };
}

/**
 * パネルドラッグフック。
 *
 * 浮動パネルのドラッグ移動を管理するReact hook。
 * panelPositionLogic の computeDragPosition を利用して
 * クランプ・スナップ・重なり回避を統合的に処理する。
 *
 * 変更時は usePanelDrag.test.ts, ProofWorkspace.tsx, index.ts も同期すること。
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  PanelPosition,
  PanelSize,
  ContainerSize,
  PanelRect,
  DragOptions,
} from "./panelPositionLogic";
import { computeDragPosition, defaultDragOptions } from "./panelPositionLogic";

// --- 型定義 ---

/** usePanelDrag の引数 */
export interface UsePanelDragConfig {
  /** パネルの現在位置 */
  readonly position: PanelPosition;
  /** パネルのサイズ */
  readonly panelSize: PanelSize;
  /** コンテナのサイズ */
  readonly containerSize: ContainerSize;
  /** 他のパネルの矩形（重なり回避対象） */
  readonly otherPanels: readonly PanelRect[];
  /** 位置変更時のコールバック */
  readonly onPositionChange: (next: PanelPosition) => void;
  /** ドラッグオプション（省略時はdefaultDragOptions） */
  readonly options?: DragOptions;
}

/** usePanelDrag の戻り値 */
export interface UsePanelDragResult {
  /** ドラッグ中かどうか */
  readonly isDragging: boolean;
  /** 直前のpointerdown〜pointerupで実際に移動が発生したかのref（クリックとドラッグの区別に使用。refなのでタイミング問題なし） */
  readonly wasDraggedRef: React.RefObject<boolean>;
  /** ドラッグハンドル要素に付与するイベントハンドラ */
  readonly handleProps: {
    readonly onPointerDown: (e: React.PointerEvent<HTMLElement>) => void;
  };
}

// --- Hook ---

/**
 * パネルのドラッグ移動を管理するフック。
 *
 * ドラッグハンドル（ヘッダー等）に `handleProps` を spread する。
 * pointermove/pointerup は window に登録するため、
 * パネル外にポインタが出てもドラッグが継続する。
 */
export function usePanelDrag(config: UsePanelDragConfig): UsePanelDragResult {
  const [isDragging, setIsDragging] = useState(false);
  const wasDraggedRef = useRef(false);
  const dragStartRef = useRef<{
    readonly pointerPosition: PanelPosition;
    readonly panelPosition: PanelPosition;
  } | null>(null);

  // 最新の config を ref で保持（イベントハンドラ内で使うため）
  const configRef = useRef(config);
  useEffect(() => {
    configRef.current = config;
  });

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLElement>) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();

    const currentConfig = configRef.current;
    dragStartRef.current = {
      pointerPosition: { x: e.clientX, y: e.clientY },
      panelPosition: currentConfig.position,
    };
    setIsDragging(true);
    wasDraggedRef.current = false;

    const handlePointerMove = (ev: PointerEvent): void => {
      const start = dragStartRef.current;
      /* v8 ignore start -- 防御的ガード: pointerdown後にのみ登録されるため到達不能 */
      if (start === null) return;
      /* v8 ignore stop */

      wasDraggedRef.current = true;

      const cfg = configRef.current;
      const result = computeDragPosition(
        start,
        { x: ev.clientX, y: ev.clientY },
        cfg.panelSize,
        cfg.containerSize,
        cfg.otherPanels,
        cfg.options ?? defaultDragOptions,
      );

      cfg.onPositionChange(result.position);
    };

    const handlePointerUp = (): void => {
      dragStartRef.current = null;
      setIsDragging(false);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  }, []);

  return {
    isDragging,
    wasDraggedRef,
    handleProps: {
      onPointerDown,
    },
  };
}

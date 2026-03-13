/**
 * パネルドラッグフック。
 *
 * 浮動パネルのドラッグ移動を管理するReact hook。
 * ドラッグ中はマウスに追従（クランプのみ）、
 * ドロップ時にスナップ・重なり回避を適用する。
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
  SnapResult,
} from "./panelPositionLogic";
import {
  computeDragMovingPosition,
  computeDropPosition,
  defaultDragOptions,
} from "./panelPositionLogic";

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
  /** ドラッグ中のスナッププレビュー位置（ドロップ時にスナップされる先） */
  readonly snapPreview: SnapResult | null;
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
 *
 * ドラッグ中はマウスに追従し（クランプのみ）、
 * ドロップ時にスナップ・重なり回避を適用する。
 * snapPreview でドロップ先のプレビュー位置を提供する。
 */
export function usePanelDrag(config: UsePanelDragConfig): UsePanelDragResult {
  const [isDragging, setIsDragging] = useState(false);
  const [snapPreview, setSnapPreview] = useState<SnapResult | null>(null);
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
    setSnapPreview(null);
    wasDraggedRef.current = false;

    const handlePointerMove = (ev: PointerEvent): void => {
      const start = dragStartRef.current;
      /* v8 ignore start -- 防御的ガード: pointerdown後にのみ登録されるため到達不能 */
      if (start === null) return;
      /* v8 ignore stop */

      wasDraggedRef.current = true;

      const cfg = configRef.current;
      const opts = cfg.options ?? defaultDragOptions;

      // ドラッグ中: マウスに追従（クランプのみ）
      const movingPos = computeDragMovingPosition(
        start,
        { x: ev.clientX, y: ev.clientY },
        cfg.panelSize,
        cfg.containerSize,
        opts,
      );

      cfg.onPositionChange(movingPos);

      // スナッププレビュー: ドロップ時にスナップされる先を計算
      const preview = computeDropPosition(
        movingPos,
        cfg.panelSize,
        cfg.containerSize,
        cfg.otherPanels,
        opts,
      );
      setSnapPreview(preview);
    };

    const handlePointerUp = (): void => {
      if (wasDraggedRef.current) {
        // ドロップ時: スナップ・重なり回避を適用
        const cfg = configRef.current;
        const opts = cfg.options ?? defaultDragOptions;
        const dropResult = computeDropPosition(
          cfg.position,
          cfg.panelSize,
          cfg.containerSize,
          cfg.otherPanels,
          opts,
        );
        cfg.onPositionChange(dropResult.position);
      }

      dragStartRef.current = null;
      setIsDragging(false);
      setSnapPreview(null);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  }, []);

  return {
    isDragging,
    wasDraggedRef,
    snapPreview,
    handleProps: {
      onPointerDown,
    },
  };
}

import { useCallback, useEffect, useRef, useState } from "react";
import { computeDragPosition, computeGrabOffset } from "./drag";
import { applySnap, SNAP_DISABLED } from "./snap";
import type { SnapConfig } from "./snap";
import type { Point, ViewportState } from "./types";

export type UseDragItemResult = {
  /** Whether the item is currently being dragged */
  readonly isDragging: boolean;
  /** Attach to the item's onPointerDown */
  readonly onPointerDown: (e: React.PointerEvent<HTMLElement>) => void;
  /** Attach to the item's onPointerMove */
  readonly onPointerMove: (e: React.PointerEvent<HTMLElement>) => void;
  /** Attach to the item's onPointerUp */
  readonly onPointerUp: (e: React.PointerEvent<HTMLElement>) => void;
};

/** Hook that provides drag-to-move behavior for a CanvasItem.
 *  Uses an offset-based approach: records the cursor-to-item offset at drag start,
 *  then computes position from cursor's world coordinates minus this offset.
 *  This ensures the item follows the cursor exactly, even with snap or viewport changes.
 *
 *  @param position       Current world-space position of the item
 *  @param viewport       Current viewport state (for screen→world conversion)
 *  @param onPositionChange  Callback when position changes due to dragging
 *  @param snapConfig     Optional snap configuration (default: disabled)
 */
export function useDragItem(
  position: Point,
  viewport: ViewportState,
  onPositionChange: (next: Point) => void,
  snapConfig: SnapConfig = SNAP_DISABLED,
): UseDragItemResult {
  const [isDragging, setIsDragging] = useState(false);
  const grabOffsetRef = useRef<Point | null>(null);

  // Keep viewport in a ref so onPointerMove always sees the latest value
  // (important when edge scroll changes the viewport between pointer events)
  const viewportRef = useRef(viewport);
  useEffect(() => {
    viewportRef.current = viewport;
  }, [viewport]);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (e.button !== 0) return;

      // Stop propagation to prevent canvas pan
      e.stopPropagation();

      // ブラウザAPI可用性チェック（テスト環境ではモックされる場合がある）
      /* v8 ignore start */
      if (e.currentTarget.setPointerCapture) {
        /* v8 ignore stop */
        e.currentTarget.setPointerCapture(e.pointerId);
      }
      setIsDragging(true);
      grabOffsetRef.current = computeGrabOffset(
        viewportRef.current,
        { x: e.clientX, y: e.clientY },
        position,
      );
    },
    [position],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (grabOffsetRef.current === null) return;

      // Stop propagation to prevent canvas pan
      e.stopPropagation();

      const screenCursor: Point = { x: e.clientX, y: e.clientY };
      const rawPosition = computeDragPosition(
        viewportRef.current,
        screenCursor,
        grabOffsetRef.current,
      );
      const newPosition = applySnap(rawPosition, snapConfig);

      onPositionChange(newPosition);
    },
    [onPositionChange, snapConfig],
  );

  const onPointerUp = useCallback((e: React.PointerEvent<HTMLElement>) => {
    if (grabOffsetRef.current === null) return;

    // Stop propagation to prevent canvas pan
    e.stopPropagation();

    // ブラウザAPI可用性チェック
    /* v8 ignore start */
    if (e.currentTarget.releasePointerCapture) {
      /* v8 ignore stop */
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    setIsDragging(false);
    grabOffsetRef.current = null;
  }, []);

  return {
    isDragging,
    onPointerDown,
    onPointerMove,
    onPointerUp,
  };
}

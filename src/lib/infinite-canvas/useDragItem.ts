import { useCallback, useRef, useState } from "react";
import { computeDelta } from "./pan";
import { applyDragDelta } from "./drag";
import type { Point } from "./types";

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
 *  Converts screen-space drag deltas to world-space position changes.
 *
 *  @param position       Current world-space position of the item
 *  @param scale          Current viewport scale (for screen→world conversion)
 *  @param onPositionChange  Callback when position changes due to dragging
 */
export function useDragItem(
  position: Point,
  scale: number,
  onPositionChange: (next: Point) => void,
): UseDragItemResult {
  const [isDragging, setIsDragging] = useState(false);
  const lastPointRef = useRef<Point | null>(null);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLElement>) => {
    if (e.button !== 0) return;

    // Stop propagation to prevent canvas pan
    e.stopPropagation();

    if (e.currentTarget.setPointerCapture) {
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    setIsDragging(true);
    lastPointRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      const lastPoint = lastPointRef.current;
      if (lastPoint === null) return;

      // Stop propagation to prevent canvas pan
      e.stopPropagation();

      const currentPoint: Point = { x: e.clientX, y: e.clientY };
      const delta = computeDelta(lastPoint, currentPoint);
      const newPosition = applyDragDelta(position, delta, scale);

      lastPointRef.current = currentPoint;
      onPositionChange(newPosition);
    },
    [position, scale, onPositionChange],
  );

  const onPointerUp = useCallback((e: React.PointerEvent<HTMLElement>) => {
    if (lastPointRef.current === null) return;

    // Stop propagation to prevent canvas pan
    e.stopPropagation();

    if (e.currentTarget.releasePointerCapture) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    setIsDragging(false);
    lastPointRef.current = null;
  }, []);

  return {
    isDragging,
    onPointerDown,
    onPointerMove,
    onPointerUp,
  };
}

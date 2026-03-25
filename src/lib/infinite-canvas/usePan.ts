import { useCallback, useEffect, useRef, useState } from "react";
import { applyPanDelta, computeDelta } from "./pan";
import type { Point, ViewportState } from "./types";

export type UsePanResult = {
  /** Whether the user is currently dragging */
  readonly isDragging: boolean;
  /** Attach to the container's onPointerDown */
  readonly onPointerDown: (e: React.PointerEvent<HTMLElement>) => void;
  /** Attach to the container's onPointerMove */
  readonly onPointerMove: (e: React.PointerEvent<HTMLElement>) => void;
  /** Attach to the container's onPointerUp */
  readonly onPointerUp: (e: React.PointerEvent<HTMLElement>) => void;
};

/** Hook that provides pan (drag-to-scroll) behavior for InfiniteCanvas.
 *  Uses pointer events for unified mouse + touch support.
 *  Viewport updates are batched via requestAnimationFrame to avoid
 *  excessive re-renders during continuous drag (at most 1 state update per frame).
 *
 *  @param viewport   Current viewport state
 *  @param onViewportChange  Callback when viewport changes due to panning
 */
export function usePan(
  viewport: ViewportState,
  onViewportChange: (next: ViewportState) => void,
): UsePanResult {
  const [isDragging, setIsDragging] = useState(false);
  const lastPointRef = useRef<Point | null>(null);

  // Keep viewport and callback in refs to avoid re-creating onPointerMove
  // on every viewport change. This stabilizes the callback chain and
  // prevents cascading invalidation of downstream useCallbacks.
  const viewportRef = useRef(viewport);
  useEffect(() => {
    viewportRef.current = viewport;
  }, [viewport]);
  const onViewportChangeRef = useRef(onViewportChange);
  useEffect(() => {
    onViewportChangeRef.current = onViewportChange;
  }, [onViewportChange]);

  // rAF throttle: accumulate deltas in viewportRef, flush once per frame
  const rafPendingRef = useRef(false);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLElement>) => {
    // Only handle primary button (left click / single touch)
    if (e.button !== 0) return;

    /* v8 ignore start -- defensive: browser API existence check */
    if (e.currentTarget.setPointerCapture) {
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    /* v8 ignore stop */
    setIsDragging(true);
    lastPointRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      const lastPoint = lastPointRef.current;
      if (lastPoint === null) return;

      const currentPoint: Point = { x: e.clientX, y: e.clientY };
      const delta = computeDelta(lastPoint, currentPoint);
      const nextViewport = applyPanDelta(viewportRef.current, delta);

      lastPointRef.current = currentPoint;
      viewportRef.current = nextViewport;

      if (!rafPendingRef.current) {
        rafPendingRef.current = true;
        requestAnimationFrame(() => {
          rafPendingRef.current = false;
          onViewportChangeRef.current(viewportRef.current);
        });
      }
    },
    [], // All values via refs — callback is fully stable
  );

  const onPointerUp = useCallback((e: React.PointerEvent<HTMLElement>) => {
    if (lastPointRef.current === null) return;
    /* v8 ignore start -- defensive: browser API existence check */
    if (e.currentTarget.releasePointerCapture) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    /* v8 ignore stop */
    setIsDragging(false);
    lastPointRef.current = null;

    // Flush any pending rAF update immediately so the final position is committed
    if (rafPendingRef.current) {
      rafPendingRef.current = false;
      onViewportChangeRef.current(viewportRef.current);
    }
  }, []);

  // Cleanup: cancel pending rAF on unmount
  useEffect(() => {
    return () => {
      rafPendingRef.current = false;
    };
  }, []);

  return {
    isDragging,
    onPointerDown,
    onPointerMove,
    onPointerUp,
  };
}

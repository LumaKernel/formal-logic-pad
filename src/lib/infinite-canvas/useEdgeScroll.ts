import { useCallback, useEffect, useRef, useState } from "react";
import type {
  EdgePenetration,
  EdgeScrollConfig,
  EdgeScrollDelta,
} from "./edgeScrollLogic";
import {
  applyEdgeScrollDelta,
  computeEdgeScrollDelta,
  computePerEdgePenetration,
  DEFAULT_EDGE_SCROLL_CONFIG,
  isEdgeScrollIdle,
} from "./edgeScrollLogic";
import type { Point, Size, ViewportState } from "./types";

export type UseEdgeScrollResult = {
  /** Call during drag move events with the current cursor screen position (relative to container).
   *  Starts or updates the edge scroll animation loop. */
  readonly notifyDragMove: (cursorScreen: Point) => void;
  /** Call when the drag ends to stop edge scrolling */
  readonly notifyDragEnd: () => void;
  /** Current per-edge penetration values, or null when not dragging */
  readonly edgePenetration: EdgePenetration | null;
};

/**
 * Hook that provides automatic viewport panning when the cursor is near the
 * edge of the container during a drag operation.
 *
 * Uses `requestAnimationFrame` for smooth animation. The scroll speed increases
 * quadratically as the cursor gets closer to the edge.
 *
 * @param viewport  Current viewport state (kept up-to-date internally via ref)
 * @param containerSize  Container dimensions in screen pixels
 * @param onViewportChange  Callback to update the viewport
 * @param config  Edge scroll configuration (threshold, maxSpeed)
 */
export function useEdgeScroll(
  viewport: ViewportState,
  containerSize: Size,
  onViewportChange: (viewport: ViewportState) => void,
  config: EdgeScrollConfig = DEFAULT_EDGE_SCROLL_CONFIG,
): UseEdgeScrollResult {
  const rafIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const cursorScreenRef = useRef<Point | null>(null);
  const currentDeltaRef = useRef<EdgeScrollDelta>({ dx: 0, dy: 0 });
  const [edgePenetration, setEdgePenetration] =
    useState<EdgePenetration | null>(null);

  // Keep the latest viewport in a ref so rAF callbacks always see current state
  const viewportRef = useRef(viewport);
  useEffect(() => {
    viewportRef.current = viewport;
  }, [viewport]);

  // Use a ref for the tick function to avoid self-reference issues
  const tickRef = useRef<(now: number) => void>(() => {});

  // Keep the tick ref up to date with latest closures
  useEffect(() => {
    tickRef.current = (now: number) => {
      const lastTime = lastTimeRef.current;
      const cursor = cursorScreenRef.current;
      const currentViewport = viewportRef.current;

      // Defensive guard: cursor can be null if drag ended between rAF schedule and tick
      /* v8 ignore start */
      if (cursor === null) {
        rafIdRef.current = null;
        lastTimeRef.current = null;
        return;
      }
      /* v8 ignore stop */

      if (lastTime !== null) {
        const elapsed = (now - lastTime) / 1000; // to seconds
        const delta = currentDeltaRef.current;

        if (!isEdgeScrollIdle(delta) && elapsed > 0) {
          const newOffset = applyEdgeScrollDelta(
            currentViewport.offsetX,
            currentViewport.offsetY,
            delta,
            elapsed,
          );
          const nextViewport: ViewportState = {
            ...currentViewport,
            offsetX: newOffset.offsetX,
            offsetY: newOffset.offsetY,
          };
          viewportRef.current = nextViewport;
          onViewportChange(nextViewport);
        }
      }

      lastTimeRef.current = now;

      // Recompute delta for next frame (cursor may have changed)
      currentDeltaRef.current = computeEdgeScrollDelta(
        cursor,
        containerSize,
        config,
      );

      if (!isEdgeScrollIdle(currentDeltaRef.current)) {
        rafIdRef.current = requestAnimationFrame((t) => {
          tickRef.current(t);
        });
      } else {
        rafIdRef.current = null;
        lastTimeRef.current = null;
      }
    };
  }, [containerSize, config, onViewportChange]);

  const scheduleRaf = useCallback(() => {
    if (rafIdRef.current === null) {
      lastTimeRef.current = null;
      rafIdRef.current = requestAnimationFrame((t) => {
        tickRef.current(t);
      });
    }
  }, []);

  const notifyDragMove = useCallback(
    (cursorScreen: Point) => {
      cursorScreenRef.current = cursorScreen;

      // Compute current delta
      const delta = computeEdgeScrollDelta(cursorScreen, containerSize, config);
      currentDeltaRef.current = delta;

      // Update per-edge penetration for visual indicator
      setEdgePenetration(
        computePerEdgePenetration(cursorScreen, containerSize, config),
      );

      // Start animation loop if needed
      if (!isEdgeScrollIdle(delta)) {
        scheduleRaf();
      }
    },
    [containerSize, config, scheduleRaf],
  );

  const notifyDragEnd = useCallback(() => {
    cursorScreenRef.current = null;
    currentDeltaRef.current = { dx: 0, dy: 0 };
    setEdgePenetration(null);
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    lastTimeRef.current = null;
  }, []);

  return { notifyDragMove, notifyDragEnd, edgePenetration };
}

import { useCallback, useRef } from "react";
import type { ViewportState } from "./types";
import { MAX_SCALE, MIN_SCALE, applyZoom, computeScaleFromWheel } from "./zoom";

export type UseZoomResult = {
  /** Attach to the container's onWheel */
  readonly onWheel: (e: React.WheelEvent<HTMLElement>) => void;
  /** Attach to the container's onPointerDown for pinch tracking */
  readonly onPinchPointerDown: (e: React.PointerEvent<HTMLElement>) => void;
  /** Attach to the container's onPointerMove for pinch tracking */
  readonly onPinchPointerMove: (e: React.PointerEvent<HTMLElement>) => void;
  /** Attach to the container's onPointerUp for pinch tracking */
  readonly onPinchPointerUp: (e: React.PointerEvent<HTMLElement>) => void;
};

type PointerEntry = {
  readonly id: number;
  readonly x: number;
  readonly y: number;
};

function getDistance(a: PointerEntry, b: PointerEntry): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function getMidpoint(
  a: PointerEntry,
  b: PointerEntry,
): { readonly x: number; readonly y: number } {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
  };
}

/** Hook that provides zoom behavior for InfiniteCanvas.
 *  Handles mouse wheel zoom and pinch-to-zoom gestures.
 *
 *  @param viewport   Current viewport state
 *  @param onViewportChange  Callback when viewport changes due to zooming
 *  @param containerRef  Ref to the container element (for computing relative positions)
 *  @param minScale  Minimum allowed scale
 *  @param maxScale  Maximum allowed scale
 */
export function useZoom(
  viewport: ViewportState,
  onViewportChange: (next: ViewportState) => void,
  containerRef: React.RefObject<HTMLElement | null>,
  minScale: number = MIN_SCALE,
  maxScale: number = MAX_SCALE,
): UseZoomResult {
  // Track active pointers for pinch gesture
  const pointersRef = useRef<readonly PointerEntry[]>([]);
  const lastPinchDistanceRef = useRef<number | null>(null);

  const onWheel = useCallback(
    (e: React.WheelEvent<HTMLElement>) => {
      e.preventDefault();

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      // Cursor position relative to the canvas container
      const center = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };

      const newScale = computeScaleFromWheel(viewport.scale, e.deltaY);
      const nextViewport = applyZoom(
        viewport,
        center,
        newScale,
        minScale,
        maxScale,
      );

      if (nextViewport !== viewport) {
        onViewportChange(nextViewport);
      }
    },
    [viewport, onViewportChange, containerRef, minScale, maxScale],
  );

  const onPinchPointerDown = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      const entry: PointerEntry = {
        id: e.pointerId,
        x: e.clientX,
        y: e.clientY,
      };
      pointersRef.current = [...pointersRef.current, entry];

      if (pointersRef.current.length === 2) {
        const [a, b] = pointersRef.current;
        lastPinchDistanceRef.current = getDistance(a!, b!);
      }
    },
    [],
  );

  const onPinchPointerMove = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      // Update the moved pointer
      pointersRef.current = pointersRef.current.map((p) =>
        p.id === e.pointerId ? { id: p.id, x: e.clientX, y: e.clientY } : p,
      );

      if (pointersRef.current.length !== 2) return;
      const lastDist = lastPinchDistanceRef.current;
      if (lastDist === null) return;

      const [a, b] = pointersRef.current;
      const currentDist = getDistance(a!, b!);

      if (currentDist === 0 || lastDist === 0) return;

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const mid = getMidpoint(a!, b!);
      const center = {
        x: mid.x - rect.left,
        y: mid.y - rect.top,
      };

      const scaleFactor = currentDist / lastDist;
      const newScale = viewport.scale * scaleFactor;
      const nextViewport = applyZoom(
        viewport,
        center,
        newScale,
        minScale,
        maxScale,
      );

      lastPinchDistanceRef.current = currentDist;

      if (nextViewport !== viewport) {
        onViewportChange(nextViewport);
      }
    },
    [viewport, onViewportChange, containerRef, minScale, maxScale],
  );

  const onPinchPointerUp = useCallback((e: React.PointerEvent<HTMLElement>) => {
    pointersRef.current = pointersRef.current.filter(
      (p) => p.id !== e.pointerId,
    );
    if (pointersRef.current.length < 2) {
      lastPinchDistanceRef.current = null;
    }
  }, []);

  return {
    onWheel,
    onPinchPointerDown,
    onPinchPointerMove,
    onPinchPointerUp,
  };
}

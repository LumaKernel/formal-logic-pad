import { useCallback, useEffect, useRef } from "react";
import { applyPanDelta } from "./pan";
import type { ViewportState } from "./types";
import {
  MAX_SCALE,
  MIN_SCALE,
  applyZoom,
  classifyWheelEvent,
  computeScaleFromWheel,
} from "./zoom";

export type UseZoomResult = {
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
 *  Wheel events are batched via requestAnimationFrame to avoid
 *  excessive re-renders during continuous scrolling.
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

  // Use ref to keep latest values for the native event handler
  const stateRef = useRef({ viewport, onViewportChange, minScale, maxScale });
  useEffect(() => {
    stateRef.current = { viewport, onViewportChange, minScale, maxScale };
  });

  // rAF throttle for wheel events: accumulate viewport changes, flush once per frame
  const wheelPendingRef = useRef(false);
  const pendingWheelViewportRef = useRef<ViewportState | null>(null);

  // Register wheel listener with { passive: false } to allow preventDefault().
  // React's onWheel is passive in Chrome, which prevents preventDefault().
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      const {
        viewport: vp,
        onViewportChange: onChange,
        minScale: minS,
        maxScale: maxS,
      } = stateRef.current;

      // Use pending viewport if available (accumulated from previous wheel events in same frame)
      const currentVp = pendingWheelViewportRef.current ?? vp;
      const action = classifyWheelEvent(e);

      let nextViewport: ViewportState;
      if (action === "pan") {
        const delta = { x: -e.deltaX, y: -e.deltaY };
        nextViewport = applyPanDelta(currentVp, delta);
      } else {
        const rect = el.getBoundingClientRect();
        const center = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        };
        const newScale = computeScaleFromWheel(currentVp.scale, e.deltaY);
        nextViewport = applyZoom(currentVp, center, newScale, minS, maxS);
        if (nextViewport === currentVp) return;
      }

      pendingWheelViewportRef.current = nextViewport;

      if (!wheelPendingRef.current) {
        wheelPendingRef.current = true;
        requestAnimationFrame(() => {
          wheelPendingRef.current = false;
          const pending = pendingWheelViewportRef.current;
          pendingWheelViewportRef.current = null;
          if (pending !== null) {
            onChange(pending);
          }
        });
      }
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", handleWheel);
    };
  }, [containerRef]);

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
      /* v8 ignore start -- defensive null guard on ref */
      if (lastDist === null) return;
      /* v8 ignore stop */

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

      /* v8 ignore start -- pinch zoom optimization: skip if viewport unchanged */
      if (nextViewport !== viewport) {
        onViewportChange(nextViewport);
      }
      /* v8 ignore stop */
    },
    [viewport, onViewportChange, containerRef, minScale, maxScale],
  );

  /* v8 ignore start -- pinch pointer cleanup, requires multi-touch device */
  const onPinchPointerUp = useCallback((e: React.PointerEvent<HTMLElement>) => {
    pointersRef.current = pointersRef.current.filter(
      (p) => p.id !== e.pointerId,
    );
    if (pointersRef.current.length < 2) {
      lastPinchDistanceRef.current = null;
    }
  }, []);
  /* v8 ignore stop */

  return {
    onPinchPointerDown,
    onPinchPointerMove,
    onPinchPointerUp,
  };
}

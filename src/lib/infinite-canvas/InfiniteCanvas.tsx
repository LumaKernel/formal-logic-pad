import { type ReactNode, useCallback, useId, useRef } from "react";
import { computeGridLinePatternParams, computeGridPatternParams } from "./grid";
import type { MarqueeRect } from "./multiSelection";
import type { Point, ViewportState } from "./types";
import { usePan } from "./usePan";
import { useZoom } from "./useZoom";
import { isClick } from "./nodeMenu";
import { MAX_SCALE, MIN_SCALE } from "./zoom";

export interface InfiniteCanvasProps {
  /** Current viewport state (offset + scale) */
  readonly viewport?: ViewportState;
  /** Spacing between grid dots in world-space pixels */
  readonly dotSpacing?: number;
  /** Color of the grid dots */
  readonly dotColor?: string;
  /** Background color of the canvas */
  readonly backgroundColor?: string;
  /** Draw major grid lines every N dots (0 to disable) */
  readonly majorGridEvery?: number;
  /** Color of the major grid lines */
  readonly gridLineColor?: string;
  /** Width of the major grid lines in px */
  readonly gridLineWidth?: number;
  /** Enable paper-like noise texture overlay. Default: true */
  readonly paperTexture?: boolean;
  /** Callback when viewport changes (e.g. from panning) */
  readonly onViewportChange?: (viewport: ViewportState) => void;
  /** Minimum allowed zoom scale */
  readonly minScale?: number;
  /** Maximum allowed zoom scale */
  readonly maxScale?: number;
  /** Enable/disable pan (drag-to-scroll). Default: true.
   *  Set to false when marquee selection is active. */
  readonly panEnabled?: boolean;
  /** Additional pointer event handlers (for marquee selection etc.) */
  readonly onEmptyAreaPointerDown?: (
    e: React.PointerEvent<HTMLElement>,
  ) => void;
  readonly onEmptyAreaPointerMove?: (
    e: React.PointerEvent<HTMLElement>,
  ) => void;
  readonly onEmptyAreaPointerUp?: (e: React.PointerEvent<HTMLElement>) => void;
  /** Callback when an empty area of the canvas is clicked (not dragged) */
  readonly onEmptyAreaClick?: () => void;
  /** Marquee rectangle to render (screen-space coordinates relative to container) */
  readonly marqueeRect?: MarqueeRect | null;
  /** Color of the marquee rectangle border */
  readonly marqueeColor?: string;
  /** Child elements to render on the canvas */
  readonly children?: ReactNode;
}

const DEFAULT_VIEWPORT: ViewportState = {
  offsetX: 0,
  offsetY: 0,
  scale: 1,
};

const NOOP = () => {};

/** A half-infinite canvas with a dot-grid background.
 *  Fills its parent container. */
export function InfiniteCanvas({
  viewport = DEFAULT_VIEWPORT,
  dotSpacing = 20,
  dotColor = "var(--color-canvas-dot, #c8bfb0)",
  backgroundColor = "var(--color-canvas-bg, #f5f0e8)",
  majorGridEvery = 5,
  gridLineColor = "var(--color-canvas-grid-line, rgba(80, 60, 40, 0.08))",
  gridLineWidth = 0.5,
  paperTexture = true,
  onViewportChange = NOOP,
  minScale = MIN_SCALE,
  maxScale = MAX_SCALE,
  panEnabled = true,
  onEmptyAreaPointerDown,
  onEmptyAreaPointerMove,
  onEmptyAreaPointerUp,
  onEmptyAreaClick,
  marqueeRect,
  marqueeColor = "var(--color-marquee, #3b82f6)",
  children,
}: InfiniteCanvasProps) {
  const patternId = useId();
  const gridLinePatternId = `${patternId satisfies string}-gridline`;
  const paperFilterId = `${patternId satisfies string}-paper`;
  const containerRef = useRef<HTMLDivElement>(null);
  const clickStartRef = useRef<Point | null>(null);
  const { patternSize, patternOffsetX, patternOffsetY, dotRadius } =
    computeGridPatternParams(viewport, dotSpacing);

  const gridLineParams =
    majorGridEvery > 0
      ? computeGridLinePatternParams(viewport, dotSpacing, majorGridEvery)
      : null;

  const { isDragging, onPointerDown, onPointerMove, onPointerUp } = usePan(
    viewport,
    onViewportChange,
  );

  const { onPinchPointerDown, onPinchPointerMove, onPinchPointerUp } = useZoom(
    viewport,
    onViewportChange,
    containerRef,
    minScale,
    maxScale,
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      onPinchPointerDown(e);
      if (e.button === 0) {
        clickStartRef.current = { x: e.clientX, y: e.clientY };
      }
      if (panEnabled) {
        onPointerDown(e);
      }
      onEmptyAreaPointerDown?.(e);
    },
    [onPinchPointerDown, onPointerDown, panEnabled, onEmptyAreaPointerDown],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      onPinchPointerMove(e);
      if (panEnabled) {
        onPointerMove(e);
      }
      onEmptyAreaPointerMove?.(e);
    },
    [onPinchPointerMove, onPointerMove, panEnabled, onEmptyAreaPointerMove],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      onPinchPointerUp(e);
      if (panEnabled) {
        onPointerUp(e);
      }
      onEmptyAreaPointerUp?.(e);

      // クリック検出
      if (
        onEmptyAreaClick !== undefined &&
        clickStartRef.current !== null &&
        e.button === 0
      ) {
        const end: Point = { x: e.clientX, y: e.clientY };
        if (isClick(clickStartRef.current, end)) {
          onEmptyAreaClick();
        }
      }
      clickStartRef.current = null;
    },
    [
      onPinchPointerUp,
      onPointerUp,
      panEnabled,
      onEmptyAreaPointerUp,
      onEmptyAreaClick,
    ],
  );

  const showMarquee =
    marqueeRect != null && (marqueeRect.width > 1 || marqueeRect.height > 1);

  return (
    <div
      ref={containerRef}
      data-testid="infinite-canvas"
      style={{
        width: "100%",
        height: "100%",
        overflow: "hidden",
        position: "relative",
        isolation: "isolate",
        backgroundColor,
        cursor: isDragging ? "grabbing" : panEnabled ? "grab" : "crosshair",
        touchAction: "none",
        transition:
          "background-color var(--theme-transition-duration, 0s) ease",
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <svg
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
        aria-hidden="true"
      >
        <defs>
          <pattern
            id={patternId}
            x={patternOffsetX}
            y={patternOffsetY}
            width={patternSize}
            height={patternSize}
            patternUnits="userSpaceOnUse"
          >
            <circle
              cx={dotRadius}
              cy={dotRadius}
              r={dotRadius}
              fill={dotColor}
              style={{
                transition: "fill var(--theme-transition-duration, 0s) ease",
              }}
            />
          </pattern>
          {paperTexture && (
            <filter id={paperFilterId} data-testid="paper-texture-filter">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.65"
                numOctaves={4}
                stitchTiles="stitch"
                result="noise"
              />
              <feColorMatrix
                type="saturate"
                values="0"
                in="noise"
                result="mono"
              />
            </filter>
          )}
          {gridLineParams != null && (
            <pattern
              id={gridLinePatternId}
              data-testid="grid-line-pattern"
              x={gridLineParams.patternOffsetX}
              y={gridLineParams.patternOffsetY}
              width={gridLineParams.patternSize}
              height={gridLineParams.patternSize}
              patternUnits="userSpaceOnUse"
            >
              <line
                x1={0}
                y1={0}
                x2={gridLineParams.patternSize}
                y2={0}
                stroke={gridLineColor}
                strokeWidth={gridLineWidth}
                style={{
                  transition:
                    "stroke var(--theme-transition-duration, 0s) ease",
                }}
              />
              <line
                x1={0}
                y1={0}
                x2={0}
                y2={gridLineParams.patternSize}
                stroke={gridLineColor}
                strokeWidth={gridLineWidth}
                style={{
                  transition:
                    "stroke var(--theme-transition-duration, 0s) ease",
                }}
              />
            </pattern>
          )}
        </defs>
        <rect
          width="100%"
          height="100%"
          fill={`url(#${patternId satisfies string})`}
        />
        {gridLineParams != null && (
          <rect
            width="100%"
            height="100%"
            fill={`url(#${gridLinePatternId satisfies string})`}
          />
        )}
        {paperTexture && (
          <rect
            data-testid="paper-texture-overlay"
            width="100%"
            height="100%"
            filter={`url(#${paperFilterId satisfies string})`}
            opacity="var(--paper-texture-opacity, 0.04)"
          />
        )}
      </svg>
      {children}
      {showMarquee && marqueeRect != null && (
        <svg
          data-testid="marquee-overlay"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            zIndex: 9999,
          }}
          aria-hidden="true"
        >
          <rect
            x={marqueeRect.x}
            y={marqueeRect.y}
            width={marqueeRect.width}
            height={marqueeRect.height}
            fill="rgba(59, 130, 246, 0.1)"
            stroke={marqueeColor}
            strokeWidth={1}
            strokeDasharray="4 2"
          />
        </svg>
      )}
    </div>
  );
}

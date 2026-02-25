import { type ReactNode, useCallback, useId, useRef } from "react";
import { computeGridLinePatternParams, computeGridPatternParams } from "./grid";
import type { ViewportState } from "./types";
import { usePan } from "./usePan";
import { useZoom } from "./useZoom";
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
  /** Callback when viewport changes (e.g. from panning) */
  readonly onViewportChange?: (viewport: ViewportState) => void;
  /** Minimum allowed zoom scale */
  readonly minScale?: number;
  /** Maximum allowed zoom scale */
  readonly maxScale?: number;
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
  dotColor = "var(--color-canvas-dot, #c0c0c0)",
  backgroundColor = "var(--color-canvas-bg, #ffffff)",
  majorGridEvery = 5,
  gridLineColor = "var(--color-canvas-grid-line, rgba(0, 0, 0, 0.06))",
  gridLineWidth = 0.5,
  onViewportChange = NOOP,
  minScale = MIN_SCALE,
  maxScale = MAX_SCALE,
  children,
}: InfiniteCanvasProps) {
  const patternId = useId();
  const gridLinePatternId = `${patternId satisfies string}-gridline`;
  const containerRef = useRef<HTMLDivElement>(null);
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
      onPointerDown(e);
    },
    [onPinchPointerDown, onPointerDown],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      onPinchPointerMove(e);
      onPointerMove(e);
    },
    [onPinchPointerMove, onPointerMove],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      onPinchPointerUp(e);
      onPointerUp(e);
    },
    [onPinchPointerUp, onPointerUp],
  );

  return (
    <div
      ref={containerRef}
      data-testid="infinite-canvas"
      style={{
        width: "100%",
        height: "100%",
        overflow: "hidden",
        position: "relative",
        backgroundColor,
        cursor: isDragging ? "grabbing" : "grab",
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
      </svg>
      {children}
    </div>
  );
}

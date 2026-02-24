import {
  computeSmartConnectionPath,
  type ConnectionEndpoint,
  type Obstacle,
} from "./connectionPath";
import type { ViewportState } from "./types";

export interface ConnectionProps {
  /** Source endpoint specification */
  readonly from: ConnectionEndpoint;
  /** Target endpoint specification */
  readonly to: ConnectionEndpoint;
  /** Current viewport state */
  readonly viewport: ViewportState;
  /** Stroke color of the connection line */
  readonly color?: string;
  /** Stroke width in pixels */
  readonly strokeWidth?: number;
  /** Other items on the canvas that the connection should try to avoid */
  readonly obstacles?: readonly Obstacle[];
  /** Callback when the connection line is clicked.
   *  Receives screen coordinates (clientX, clientY). */
  readonly onClick?: (screenX: number, screenY: number) => void;
}

/** Width of the invisible hit area for click detection on connections. */
const HIT_AREA_WIDTH = 16;

/**
 * Renders a bezier curve connection between two rectangular endpoints.
 * Adapts exit/entry direction based on node positions and avoids obstacles.
 * Uses a dashed stroke with partial opacity so the line remains visible
 * even when passing behind other items.
 */
export function Connection({
  from,
  to,
  viewport,
  color = "#666",
  strokeWidth = 2,
  obstacles = [],
  onClick,
}: ConnectionProps) {
  const path = computeSmartConnectionPath(from, to, viewport, obstacles);
  const clickable = onClick !== undefined;

  return (
    <svg
      data-testid="connection"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        overflow: "visible",
      }}
    >
      {/* Background stroke for visibility behind items */}
      <path
        d={path.d}
        fill="none"
        stroke="white"
        strokeWidth={strokeWidth + 2}
        strokeDasharray="8 4"
        opacity={0.6}
      />
      {/* Main stroke */}
      <path
        data-testid="connection-path"
        d={path.d}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray="8 4"
        opacity={0.8}
      />
      {/* Invisible hit area for click detection */}
      {clickable && (
        <path
          data-testid="connection-hit-area"
          d={path.d}
          fill="none"
          stroke="transparent"
          strokeWidth={HIT_AREA_WIDTH}
          style={{ pointerEvents: "stroke", cursor: "pointer" }}
          onPointerDown={(e) => {
            e.stopPropagation();
          }}
          onClick={(e) => {
            e.stopPropagation();
            onClick(e.clientX, e.clientY);
          }}
        />
      )}
    </svg>
  );
}

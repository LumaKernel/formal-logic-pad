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
}

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
}: ConnectionProps) {
  const path = computeSmartConnectionPath(from, to, viewport, obstacles);

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
    </svg>
  );
}

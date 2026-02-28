import { useCallback } from "react";
import { computePortPosition, type ConnectorPort } from "./connector";
import { worldToScreen } from "./coordinate";
import type { Point, ViewportState } from "./types";

export interface ConnectorPortComponentProps {
  /** The port definition */
  readonly port: ConnectorPort;
  /** Top-left position of the parent item in world-space */
  readonly itemPosition: Point;
  /** Width of the parent item in world-space */
  readonly itemWidth: number;
  /** Height of the parent item in world-space */
  readonly itemHeight: number;
  /** Current viewport state */
  readonly viewport: ViewportState;
  /** Radius of the port circle in screen pixels */
  readonly radius?: number;
  /** Color of the port */
  readonly color?: string;
  /** Color of the port border */
  readonly borderColor?: string;
  /** Whether this port is highlighted (e.g. on hover) */
  readonly highlighted?: boolean;
  /** Whether this port is dimmed (reduced visibility, e.g. not connected and not dragging) */
  readonly dimmed?: boolean;
  /** Callback when the port is clicked */
  readonly onPortClick?: (portId: string) => void;
  /** Callback when drag starts from this port (for connection preview) */
  readonly onPortDragStart?: (
    portId: string,
    screenX: number,
    screenY: number,
  ) => void;
}

/**
 * Renders a connector port as a small circle on the edge of a canvas item.
 * Ports serve as attachment points for connection lines.
 */
export function ConnectorPortComponent({
  port,
  itemPosition,
  itemWidth,
  itemHeight,
  viewport,
  radius = 5,
  color = "#fff",
  borderColor = "#666",
  highlighted = false,
  dimmed = false,
  onPortClick,
  onPortDragStart,
}: ConnectorPortComponentProps) {
  const worldPos = computePortPosition({
    port,
    itemPosition,
    itemWidth,
    itemHeight,
  });
  const screenPos = worldToScreen(viewport, worldPos);
  const scaledRadius = radius * viewport.scale;
  const displayRadius = highlighted ? scaledRadius * 1.4 : scaledRadius;

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (e.button !== 0) return;
      if (onPortDragStart === undefined) return;
      e.stopPropagation();
      e.preventDefault();
      onPortDragStart(port.id, e.clientX, e.clientY);
    },
    [onPortDragStart, port.id],
  );

  return (
    <div
      data-testid={`connector-port-${port.id satisfies string}`}
      style={{
        position: "absolute",
        left: screenPos.x - displayRadius,
        top: screenPos.y - displayRadius,
        width: displayRadius * 2,
        height: displayRadius * 2,
        borderRadius: "50%",
        backgroundColor: highlighted ? borderColor : color,
        border: `${String(Math.max(1, viewport.scale)) satisfies string}px solid ${borderColor satisfies string}`,
        pointerEvents: "auto",
        cursor: "crosshair",
        zIndex: 500,
        opacity: dimmed ? 0 : 1,
        transition:
          "width 0.15s ease, height 0.15s ease, background-color 0.15s ease, opacity 0.15s ease",
        boxSizing: "border-box",
      }}
      onPointerDown={handlePointerDown}
      onClick={(e) => {
        e.stopPropagation();
        onPortClick?.(port.id);
      }}
    />
  );
}

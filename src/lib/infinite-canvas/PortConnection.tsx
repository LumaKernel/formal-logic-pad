import { type ReactNode, useId } from "react";
import type { ConnectorPortOnItem } from "./connector";
import { computePortConnectionPath, type Obstacle } from "./connectionPath";
import {
  computeConnectionLabelPlacement,
  computeLabelScreenPosition,
} from "./connectionLabel";
import type { ViewportState } from "./types";

export interface PortConnectionProps {
  /** Source port with item geometry */
  readonly from: ConnectorPortOnItem;
  /** Target port with item geometry */
  readonly to: ConnectorPortOnItem;
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
  /** Callback when the connection line is right-clicked (context menu).
   *  Receives screen coordinates (clientX, clientY). */
  readonly onContextMenu?: (screenX: number, screenY: number) => void;
  /** Content to render at the midpoint of the connection line */
  readonly label?: ReactNode;
  /** Vertical offset for the label from the line midpoint (default: -20) */
  readonly labelOffsetY?: number;
  /** Enable hand-drawn style with SVG turbulence filter (optional, default false) */
  readonly handDrawn?: boolean;
  /** data-testid for the connection SVG element */
  readonly testId?: string;
}

/** Width of the invisible hit area for click detection on port connections. */
const HIT_AREA_WIDTH = 16;

/**
 * Renders a bezier curve connection between two connector ports.
 * Similar to Connection but uses explicit port positions instead of
 * auto-determined edge midpoints.
 */
export function PortConnection({
  from,
  to,
  viewport,
  color = "#666",
  strokeWidth = 2,
  obstacles = [],
  onClick,
  onContextMenu,
  label,
  labelOffsetY = -20,
  handDrawn = false,
  testId,
}: PortConnectionProps) {
  const filterId = useId();
  const path = computePortConnectionPath(from, to, viewport, obstacles);
  const hasHitArea = onClick !== undefined || onContextMenu !== undefined;
  const hasLabel = label !== undefined;

  const filterUrl = handDrawn
    ? `url(#${filterId satisfies string})`
    : undefined;

  const labelPos = hasLabel
    ? computeLabelScreenPosition(
        computeConnectionLabelPlacement(path.midpoint, labelOffsetY),
      )
    : undefined;

  return (
    <>
      <svg
        data-testid={testId ?? "port-connection"}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          overflow: "visible",
        }}
      >
        {handDrawn && (
          <defs>
            <filter id={filterId} data-testid="hand-drawn-filter">
              <feTurbulence
                type="turbulence"
                baseFrequency="0.03"
                numOctaves={2}
                seed={42}
                result="turbulence"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="turbulence"
                scale={3}
                xChannelSelector="R"
                yChannelSelector="G"
              />
            </filter>
          </defs>
        )}
        {/* Background stroke for visibility behind items */}
        <path
          d={path.d}
          fill="none"
          stroke="white"
          strokeWidth={strokeWidth + 2}
          strokeDasharray="8 4"
          strokeLinecap="round"
          opacity={0.6}
          filter={filterUrl}
        />
        {/* Main stroke */}
        <path
          data-testid="port-connection-path"
          d={path.d}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray="8 4"
          strokeLinecap="round"
          opacity={0.8}
          filter={filterUrl}
        />
        {/* Invisible hit area for click/context-menu detection */}
        {hasHitArea && (
          <path
            data-testid="port-connection-hit-area"
            d={path.d}
            fill="none"
            stroke="transparent"
            strokeWidth={HIT_AREA_WIDTH}
            style={{ pointerEvents: "stroke", cursor: "pointer" }}
            onPointerDown={(e) => {
              e.stopPropagation();
            }}
            onClick={
              onClick
                ? (e) => {
                    e.stopPropagation();
                    onClick(e.clientX, e.clientY);
                  }
                : undefined
            }
            onContextMenu={
              onContextMenu
                ? (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onContextMenu(e.clientX, e.clientY);
                  }
                : undefined
            }
          />
        )}
      </svg>
      {hasLabel && labelPos !== undefined && (
        <div
          data-testid="port-connection-label"
          style={{
            position: "absolute",
            left: labelPos.x,
            top: labelPos.y,
            transform: "translate(-50%, -50%)",
            pointerEvents: "auto",
          }}
        >
          {label}
        </div>
      )}
    </>
  );
}

import { computePortPosition } from "./connector";
import { computePreviewTarget, computePreviewStyle } from "./connectionPreview";
import type { ConnectionPreviewState } from "./connectionPreview";
import { worldToScreen } from "./coordinate";
import type { ViewportState } from "./types";

export interface ConnectionPreviewLineProps {
  /** Current preview state from useConnectionPreview */
  readonly state: ConnectionPreviewState;
  /** Current viewport state */
  readonly viewport: ViewportState;
  /** Stroke width in pixels */
  readonly strokeWidth?: number;
}

/**
 * Renders a ghost connection line from a source port to the current mouse position
 * or snapped target port. Shows visual feedback for valid/invalid connections.
 */
export function ConnectionPreviewLine({
  state,
  viewport,
  strokeWidth = 2,
}: ConnectionPreviewLineProps) {
  const sourceWorldPos = computePortPosition(state.sourcePortOnItem);
  const targetWorldPos = computePreviewTarget(state);

  const sourceScreen = worldToScreen(viewport, sourceWorldPos);
  const targetScreen = worldToScreen(viewport, targetWorldPos);

  const style = computePreviewStyle(state.isValid);

  // Simple straight line for preview (more responsive than bezier)
  const d = `M ${String(sourceScreen.x) satisfies string} ${String(sourceScreen.y) satisfies string} L ${String(targetScreen.x) satisfies string} ${String(targetScreen.y) satisfies string}`;

  return (
    <svg
      data-testid="connection-preview-line"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        overflow: "visible",
        zIndex: 600,
      }}
    >
      {/* Background stroke for visibility */}
      <path
        d={d}
        fill="none"
        stroke="white"
        strokeWidth={strokeWidth + 2}
        strokeDasharray={style.strokeDasharray}
        strokeLinecap="round"
        opacity={0.4}
      />
      {/* Main colored stroke */}
      <path
        data-testid="connection-preview-path"
        d={d}
        fill="none"
        stroke={style.color}
        strokeWidth={strokeWidth}
        strokeDasharray={style.strokeDasharray}
        strokeLinecap="round"
        opacity={style.opacity}
      />
      {/* Snap indicator at target when snapped */}
      {state.snappedTarget !== null && (
        <circle
          data-testid="connection-preview-snap-indicator"
          cx={targetScreen.x}
          cy={targetScreen.y}
          r={8 * viewport.scale}
          fill="none"
          stroke={style.color}
          strokeWidth={2}
          opacity={style.opacity}
        />
      )}
    </svg>
  );
}

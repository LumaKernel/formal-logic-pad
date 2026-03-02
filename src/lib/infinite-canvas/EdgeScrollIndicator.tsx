import { useMemo } from "react";
import type { EdgePenetration } from "./edgeScrollLogic";
import { computeEdgeScrollShadow } from "./edgeScrollIndicatorLogic";

export type EdgeScrollIndicatorProps = {
  /** Per-edge penetration values, or null when not dragging */
  readonly edgePenetration: EdgePenetration | null;
};

/**
 * Overlay component that renders a subtle inset shadow glow on edges
 * where edge scrolling is active. The shadow intensity is proportional
 * to the cursor's penetration into the edge zone.
 */
export function EdgeScrollIndicator({
  edgePenetration,
}: EdgeScrollIndicatorProps) {
  const shadowStyle = useMemo(
    () => computeEdgeScrollShadow(edgePenetration),
    [edgePenetration],
  );

  if (!shadowStyle.visible) return null;

  return (
    <div
      data-testid="edge-scroll-indicator"
      style={{
        position: "absolute",
        inset: 0,
        boxShadow: shadowStyle.boxShadow,
        pointerEvents: "none",
        zIndex: 9999,
        transition: "box-shadow 0.15s ease-out",
      }}
    />
  );
}

import type { ReactNode } from "react";
import { worldToScreen } from "./coordinate";
import type { Point, ViewportState } from "./types";

export interface CanvasItemProps {
  /** Position in world-space coordinates */
  readonly position: Point;
  /** Current viewport state for coordinate transformation */
  readonly viewport: ViewportState;
  /** Content to render at the specified position */
  readonly children: ReactNode;
}

/** Renders children at a world-space position, transformed to screen-space. */
export function CanvasItem({ position, viewport, children }: CanvasItemProps) {
  const screenPos = worldToScreen(viewport, position);

  return (
    <div
      data-testid="canvas-item"
      style={{
        position: "absolute",
        left: screenPos.x,
        top: screenPos.y,
        transformOrigin: "0 0",
        transform: `scale(${String(viewport.scale) satisfies string})`,
        pointerEvents: "auto",
      }}
    >
      {children}
    </div>
  );
}

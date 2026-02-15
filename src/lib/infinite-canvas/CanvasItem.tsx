import type { ReactNode } from "react";
import { worldToScreen } from "./coordinate";
import type { Point, ViewportState } from "./types";
import { useDragItem } from "./useDragItem";

export interface CanvasItemProps {
  /** Position in world-space coordinates */
  readonly position: Point;
  /** Current viewport state for coordinate transformation */
  readonly viewport: ViewportState;
  /** Content to render at the specified position */
  readonly children: ReactNode;
  /** Callback when item position changes (enables drag) */
  readonly onPositionChange?: (position: Point) => void;
}

const NOOP = () => {};

/** Renders children at a world-space position, transformed to screen-space.
 *  When onPositionChange is provided, the item becomes draggable. */
export function CanvasItem({
  position,
  viewport,
  children,
  onPositionChange = NOOP,
}: CanvasItemProps) {
  const screenPos = worldToScreen(viewport, position);
  const draggable = onPositionChange !== NOOP;
  const { isDragging, onPointerDown, onPointerMove, onPointerUp } = useDragItem(
    position,
    viewport.scale,
    onPositionChange,
  );

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
        cursor: draggable ? (isDragging ? "grabbing" : "grab") : undefined,
        zIndex: isDragging ? 1000 : undefined,
        touchAction: draggable ? "none" : undefined,
      }}
      onPointerDown={draggable ? onPointerDown : undefined}
      onPointerMove={draggable ? onPointerMove : undefined}
      onPointerUp={draggable ? onPointerUp : undefined}
    >
      {children}
    </div>
  );
}

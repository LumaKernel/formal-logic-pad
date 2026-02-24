import type { Point } from "./types";

/** Configuration for positioning a label on a connection line */
export type ConnectionLabelPlacement = {
  /** Center position in screen-space where the label should be placed */
  readonly position: Point;
  /** Offset to apply to the label center (e.g. to avoid overlapping the line) */
  readonly offset: Point;
};

/**
 * Compute the position for a label on a connection line.
 * Uses the midpoint of the bezier curve and applies an optional vertical offset
 * so the label does not sit directly on top of the line stroke.
 */
export function computeConnectionLabelPlacement(
  midpoint: Point,
  offsetY: number = -20,
): ConnectionLabelPlacement {
  return {
    position: midpoint,
    offset: { x: 0, y: offsetY },
  };
}

/**
 * Compute the final screen-space position for the label element,
 * combining the midpoint and offset.
 */
export function computeLabelScreenPosition(
  placement: ConnectionLabelPlacement,
): Point {
  return {
    x: placement.position.x + placement.offset.x,
    y: placement.position.y + placement.offset.y,
  };
}

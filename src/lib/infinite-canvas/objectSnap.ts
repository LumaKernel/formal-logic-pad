import type { Point, Size } from "./types";

/** Threshold in world units: if distance to an alignment edge/center is within this, snap occurs */
export const DEFAULT_OBJECT_SNAP_THRESHOLD = 8;

/** Bounding box of a canvas item in world coordinates */
export interface SnapTargetRect {
  readonly id: string;
  readonly position: Point;
  readonly size: Size;
}

/** Direction of an alignment guide line */
export type AlignmentAxis = "horizontal" | "vertical";

/** A single alignment guide to render */
export interface AlignmentGuide {
  readonly axis: AlignmentAxis;
  /** World-space coordinate on the guide's axis (x for vertical, y for horizontal) */
  readonly value: number;
  /** World-space extent for rendering the guide line */
  readonly from: number;
  readonly to: number;
}

/** Result of computing object snap for a dragged item */
export interface ObjectSnapResult {
  /** Snapped position (may differ from input on one or both axes) */
  readonly snappedPosition: Point;
  /** Alignment guides to display */
  readonly guides: readonly AlignmentGuide[];
}

/** No-op result: no snapping, no guides */
export const OBJECT_SNAP_NONE: ObjectSnapResult = {
  snappedPosition: { x: 0, y: 0 },
  guides: [],
};

/** Configuration for object snapping */
export interface ObjectSnapConfig {
  readonly enabled: boolean;
  /** Snap threshold in world units */
  readonly threshold: number;
}

export const OBJECT_SNAP_DISABLED: ObjectSnapConfig = {
  enabled: false,
  threshold: DEFAULT_OBJECT_SNAP_THRESHOLD,
};

// ── Edge computation helpers ──

/** Compute the 5 snap edges (left, centerX, right, top, centerY, bottom) for a rect */
function computeEdgesX(rect: SnapTargetRect): readonly number[] {
  return [
    rect.position.x,
    rect.position.x + rect.size.width / 2,
    rect.position.x + rect.size.width,
  ];
}

function computeEdgesY(rect: SnapTargetRect): readonly number[] {
  return [
    rect.position.y,
    rect.position.y + rect.size.height / 2,
    rect.position.y + rect.size.height,
  ];
}

interface SnapCandidate {
  readonly snappedValue: number;
  readonly distance: number;
  /** Which edge of the dragged item snapped */
  readonly dragEdgeOffset: number;
  /** Target rects that contributed to this snap */
  readonly targetRects: readonly SnapTargetRect[];
}

/**
 * Find the best snap candidate on one axis.
 *
 * For each edge of the dragged item (left/center/right or top/center/bottom),
 * check against every edge of every target. Pick the closest match within threshold.
 */
function findBestSnap(
  dragEdgeOffsets: readonly number[],
  dragPosition: number,
  targets: readonly SnapTargetRect[],
  targetEdgesFn: (t: SnapTargetRect) => readonly number[],
  threshold: number,
): SnapCandidate | null {
  let best: {
    distance: number;
    snappedValue: number;
    dragEdgeOffset: number;
    targetRects: SnapTargetRect[];
  } | null = null;

  for (const dragOffset of dragEdgeOffsets) {
    const dragEdgeValue = dragPosition + dragOffset;
    for (const target of targets) {
      const targetEdges = targetEdgesFn(target);
      for (const targetEdge of targetEdges) {
        const dist = Math.abs(dragEdgeValue - targetEdge);
        if (dist <= threshold) {
          const snappedDragPos = targetEdge - dragOffset;
          if (best === null || dist < best.distance) {
            best = {
              distance: dist,
              snappedValue: snappedDragPos,
              dragEdgeOffset: dragOffset,
              targetRects: [target],
            };
          } else if (
            dist === best.distance &&
            snappedDragPos === best.snappedValue
          ) {
            // Same snap position from multiple targets — collect them for guide extent
            best = {
              distance: best.distance,
              snappedValue: best.snappedValue,
              dragEdgeOffset: best.dragEdgeOffset,
              targetRects: [...best.targetRects, target],
            };
          }
        }
      }
    }
  }
  return best;
}

/**
 * Build an alignment guide for one axis snap.
 * The guide line extends from the minimum to maximum of all participating rects
 * (both the dragged item and the matched targets).
 */
function buildGuide(
  axis: AlignmentAxis,
  value: number,
  dragRect: SnapTargetRect,
  targets: readonly SnapTargetRect[],
): AlignmentGuide {
  const allRects = [dragRect, ...targets];
  if (axis === "vertical") {
    // Vertical guide at x=value, extends in Y
    let minY = Infinity;
    let maxY = -Infinity;
    for (const r of allRects) {
      minY = Math.min(minY, r.position.y);
      maxY = Math.max(maxY, r.position.y + r.size.height);
    }
    return { axis, value, from: minY, to: maxY };
  }
  // Horizontal guide at y=value, extends in X
  let minX = Infinity;
  let maxX = -Infinity;
  for (const r of allRects) {
    minX = Math.min(minX, r.position.x);
    maxX = Math.max(maxX, r.position.x + r.size.width);
  }
  return { axis, value, from: minX, to: maxX };
}

/**
 * Compute object-snap result for a dragged item.
 *
 * Pure function. Given the dragged item's candidate position, its size, and
 * the positions/sizes of all other items on the canvas, returns the snapped
 * position and alignment guides to display.
 *
 * @param candidatePosition  Where the dragged item would land without snapping
 * @param draggedSize        Size of the dragged item
 * @param draggedId          ID of the dragged item (to exclude from targets)
 * @param targets            All snap-target rects on the canvas
 * @param config             Object snap configuration
 */
export function computeObjectSnap(
  candidatePosition: Point,
  draggedSize: Size,
  draggedId: string,
  targets: readonly SnapTargetRect[],
  config: ObjectSnapConfig,
): ObjectSnapResult {
  if (!config.enabled) {
    return { snappedPosition: candidatePosition, guides: [] };
  }

  const filteredTargets = targets.filter((t) => t.id !== draggedId);
  if (filteredTargets.length === 0) {
    return { snappedPosition: candidatePosition, guides: [] };
  }

  const { threshold } = config;

  // Drag item edge offsets from position origin
  const dragXOffsets = [0, draggedSize.width / 2, draggedSize.width];
  const dragYOffsets = [0, draggedSize.height / 2, draggedSize.height];

  const snapX = findBestSnap(
    dragXOffsets,
    candidatePosition.x,
    filteredTargets,
    computeEdgesX,
    threshold,
  );

  const snapY = findBestSnap(
    dragYOffsets,
    candidatePosition.y,
    filteredTargets,
    computeEdgesY,
    threshold,
  );

  const snappedX = snapX !== null ? snapX.snappedValue : candidatePosition.x;
  const snappedY = snapY !== null ? snapY.snappedValue : candidatePosition.y;

  const snappedPosition: Point = { x: snappedX, y: snappedY };
  const guides: AlignmentGuide[] = [];

  const dragRect: SnapTargetRect = {
    id: draggedId,
    position: snappedPosition,
    size: draggedSize,
  };

  if (snapX !== null) {
    const guideXValue = snappedX + snapX.dragEdgeOffset;
    guides.push(
      buildGuide("vertical", guideXValue, dragRect, snapX.targetRects),
    );
  }

  if (snapY !== null) {
    const guideYValue = snappedY + snapY.dragEdgeOffset;
    guides.push(
      buildGuide("horizontal", guideYValue, dragRect, snapY.targetRects),
    );
  }

  return { snappedPosition, guides };
}

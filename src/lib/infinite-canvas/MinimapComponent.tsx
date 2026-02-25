import { useCallback, useMemo, useRef } from "react";
import {
  computeItemsBoundingBox,
  computeMinimapPlacementStyle,
  computeMinimapTransform,
  computeViewportRect,
  expandBoundingBoxWithViewport,
  minimapClickToViewportOffset,
  worldToMinimap,
} from "./minimap";
import type { MinimapItem, MinimapPosition } from "./minimap";
import type { Size, ViewportState } from "./types";

export interface MinimapProps {
  /** Current main canvas viewport state */
  readonly viewport: ViewportState;
  /** Size of the main canvas container in pixels */
  readonly containerSize: Size;
  /** Items to display on the minimap */
  readonly items: readonly MinimapItem[];
  /** Callback when user clicks/drags on minimap to navigate */
  readonly onViewportChange?: (viewport: ViewportState) => void;
  /** Minimap width in pixels */
  readonly width?: number;
  /** Minimap height in pixels */
  readonly height?: number;
  /** Position within the parent container */
  readonly position?: MinimapPosition;
  /** Whether the minimap is visible */
  readonly visible?: boolean;
  /** Background color of the minimap */
  readonly backgroundColor?: string;
  /** Color for item thumbnails */
  readonly itemColor?: string;
  /** Color for viewport indicator */
  readonly viewportColor?: string;
  /** Color for viewport indicator border */
  readonly viewportBorderColor?: string;
}

const NOOP = () => {};

/** Minimap component showing an overview of items and current viewport.
 *  Renders as an absolute-positioned overlay within InfiniteCanvas. */
export function MinimapComponent({
  viewport,
  containerSize,
  items,
  onViewportChange = NOOP,
  width = 150,
  height = 100,
  position = "bottom-right",
  visible = true,
  backgroundColor = "var(--color-minimap-bg, rgba(255, 255, 255, 0.9))",
  itemColor = "var(--color-minimap-item, rgba(100, 100, 100, 0.6))",
  viewportColor = "var(--color-minimap-viewport, rgba(59, 130, 246, 0.15))",
  viewportBorderColor = "var(--color-minimap-viewport-border, rgba(59, 130, 246, 0.6))",
}: MinimapProps) {
  const isDragging = useRef(false);
  const minimapRef = useRef<HTMLDivElement>(null);

  const minimapSize: Size = useMemo(() => ({ width, height }), [width, height]);

  const boundingBox = useMemo(() => {
    const itemsBox = computeItemsBoundingBox(items);
    return expandBoundingBoxWithViewport(itemsBox, viewport, containerSize);
  }, [items, viewport, containerSize]);

  const minimapTransform = useMemo(
    () => computeMinimapTransform(boundingBox, minimapSize),
    [boundingBox, minimapSize],
  );

  const viewportRect = useMemo(
    () => computeViewportRect(viewport, containerSize, minimapTransform),
    [viewport, containerSize, minimapTransform],
  );

  const placementStyle = useMemo(
    () => computeMinimapPlacementStyle(position),
    [position],
  );

  const navigateToPoint = useCallback(
    (clientX: number, clientY: number) => {
      const el = minimapRef.current;
      if (el == null) return;
      const rect = el.getBoundingClientRect();
      const clickPos = {
        x: clientX - rect.left,
        y: clientY - rect.top,
      };
      const newViewport = minimapClickToViewportOffset(
        clickPos,
        minimapTransform,
        containerSize,
        viewport.scale,
      );
      onViewportChange(newViewport);
    },
    [minimapTransform, containerSize, viewport.scale, onViewportChange],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.stopPropagation();
      e.preventDefault();
      isDragging.current = true;
      if (e.currentTarget.setPointerCapture) {
        e.currentTarget.setPointerCapture(e.pointerId);
      }
      navigateToPoint(e.clientX, e.clientY);
    },
    [navigateToPoint],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging.current) return;
      e.stopPropagation();
      navigateToPoint(e.clientX, e.clientY);
    },
    [navigateToPoint],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging.current) return;
      isDragging.current = false;
      if (e.currentTarget.releasePointerCapture) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    },
    [],
  );

  if (!visible) return null;

  return (
    <div
      ref={minimapRef}
      data-testid="minimap"
      style={{
        position: "absolute",
        ...placementStyle,
        width: `${width satisfies number}px`,
        height: `${height satisfies number}px`,
        backgroundColor,
        borderRadius: "6px",
        border: "1px solid var(--color-minimap-border, rgba(0, 0, 0, 0.15))",
        overflow: "hidden",
        cursor: "crosshair",
        pointerEvents: "auto",
        zIndex: 10,
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
        transition:
          "background-color var(--theme-transition-duration, 0s) ease, border-color var(--theme-transition-duration, 0s) ease",
        touchAction: "none",
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Item thumbnails */}
      <svg
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
        aria-hidden="true"
      >
        {items.map((item) => {
          const pos = worldToMinimap(minimapTransform, item.position);
          const itemWidth = item.size.width * minimapTransform.scale;
          const itemHeight = item.size.height * minimapTransform.scale;
          return (
            <rect
              key={item.id}
              data-testid={`minimap-item-${item.id satisfies string}`}
              x={pos.x}
              y={pos.y}
              width={Math.max(2, itemWidth)}
              height={Math.max(2, itemHeight)}
              fill={itemColor}
              rx={1}
            />
          );
        })}
        {/* Viewport indicator */}
        <rect
          data-testid="minimap-viewport"
          x={viewportRect.x}
          y={viewportRect.y}
          width={viewportRect.width}
          height={viewportRect.height}
          fill={viewportColor}
          stroke={viewportBorderColor}
          strokeWidth={1.5}
          rx={2}
        />
      </svg>
    </div>
  );
}

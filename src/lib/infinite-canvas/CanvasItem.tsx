import { type ReactNode, useCallback, useRef } from "react";
import type { ContextMenuItem } from "./contextMenu";
import { ContextMenuComponent } from "./ContextMenuComponent";
import { worldToScreen } from "./coordinate";
import { isClick } from "./nodeMenu";
import type { SnapConfig } from "./snap";
import type { Point, ViewportState } from "./types";
import { useContextMenu, useLongPress } from "./useContextMenu";
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
  /** Explicitly control drag enabled state (default: true when onPositionChange is provided).
   *  Set to false to temporarily disable drag, e.g. during inline editing. */
  readonly dragEnabled?: boolean;
  /** Snap configuration for grid snapping during drag (default: disabled) */
  readonly snapConfig?: SnapConfig;
  /** Context menu items (enables context menu when provided) */
  readonly contextMenuItems?: readonly ContextMenuItem[];
  /** Callback when a context menu item is selected */
  readonly onContextMenuSelect?: (itemId: string) => void;
  /** Callback when the item is clicked (not dragged).
   *  Receives screen coordinates (clientX, clientY). */
  readonly onClick?: (screenX: number, screenY: number) => void;
  /** Callback during drag move with screen-space cursor position (for edge scroll integration) */
  readonly onDragMove?: (screenPoint: Point) => void;
  /** Callback when drag ends (for edge scroll cleanup) */
  readonly onDragEnd?: () => void;
}

const NOOP = () => {};
const EMPTY_ITEMS: readonly ContextMenuItem[] = [];

/** Renders children at a world-space position, transformed to screen-space.
 *  When onPositionChange is provided, the item becomes draggable.
 *  When contextMenuItems is provided, right-click/long-tap opens a context menu. */
export function CanvasItem({
  position,
  viewport,
  children,
  onPositionChange = NOOP,
  dragEnabled,
  snapConfig,
  contextMenuItems = EMPTY_ITEMS,
  onContextMenuSelect = NOOP,
  onClick,
  onDragMove,
  onDragEnd,
}: CanvasItemProps) {
  const screenPos = worldToScreen(viewport, position);
  const hasDragCallback = onPositionChange !== NOOP;
  const draggable = hasDragCallback && (dragEnabled ?? true);
  const hasContextMenu = contextMenuItems !== EMPTY_ITEMS;
  const clickStartRef = useRef<Point | null>(null);
  const { isDragging, onPointerDown, onPointerMove, onPointerUp } = useDragItem(
    position,
    viewport,
    onPositionChange,
    snapConfig,
  );

  const {
    menuState,
    onContextMenu,
    open: openMenu,
    close,
    menuRef,
  } = useContextMenu();

  const handleLongPress = useCallback(
    (screenX: number, screenY: number) => {
      if (hasContextMenu) {
        openMenu(screenX, screenY);
      }
    },
    [hasContextMenu, openMenu],
  );

  const longPress = useLongPress(handleLongPress);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (onClick !== undefined && e.button === 0) {
        clickStartRef.current = { x: e.clientX, y: e.clientY };
      }
      if (hasContextMenu) {
        longPress.onPointerDown(e);
      }
      if (draggable) {
        onPointerDown(e);
      }
    },
    [hasContextMenu, longPress, draggable, onPointerDown, onClick],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (hasContextMenu) {
        longPress.onPointerMove(e);
      }
      if (draggable) {
        onPointerMove(e);
        onDragMove?.({ x: e.clientX, y: e.clientY });
      }
    },
    [hasContextMenu, longPress, draggable, onPointerMove, onDragMove],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (onClick !== undefined && clickStartRef.current !== null) {
        const end: Point = { x: e.clientX, y: e.clientY };
        if (isClick(clickStartRef.current, end)) {
          onClick(e.clientX, e.clientY);
        }
        clickStartRef.current = null;
      }
      if (hasContextMenu) {
        longPress.onPointerUp(e);
      }
      if (draggable) {
        onPointerUp(e);
        onDragEnd?.();
      }
    },
    [hasContextMenu, longPress, draggable, onPointerUp, onClick, onDragEnd],
  );

  const hasInteraction =
    hasDragCallback || hasContextMenu || onClick !== undefined;

  return (
    <>
      <div
        data-testid="canvas-item"
        style={{
          position: "absolute",
          left: screenPos.x,
          top: screenPos.y,
          transformOrigin: "0 0",
          transform: `scale(${String(viewport.scale) satisfies string})`,
          pointerEvents: "auto",
          cursor: draggable
            ? isDragging
              ? "grabbing"
              : "grab"
            : onClick !== undefined
              ? "pointer"
              : undefined,
          zIndex: isDragging ? 1000 : undefined,
          touchAction: hasInteraction ? "none" : undefined,
          whiteSpace: "nowrap",
        }}
        onPointerDown={hasInteraction ? handlePointerDown : undefined}
        onPointerMove={hasInteraction ? handlePointerMove : undefined}
        onPointerUp={hasInteraction ? handlePointerUp : undefined}
        onContextMenu={hasContextMenu ? onContextMenu : undefined}
      >
        {children}
      </div>
      {menuState.open && hasContextMenu && (
        <ContextMenuComponent
          items={contextMenuItems}
          screenPosition={menuState.screenPosition}
          onSelect={onContextMenuSelect}
          onClose={close}
          menuRef={menuRef}
        />
      )}
    </>
  );
}

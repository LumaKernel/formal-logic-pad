import { type ReactNode, useCallback } from "react";
import type { ContextMenuItem } from "./contextMenu";
import { ContextMenuComponent } from "./ContextMenuComponent";
import { worldToScreen } from "./coordinate";
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
  /** Context menu items (enables context menu when provided) */
  readonly contextMenuItems?: readonly ContextMenuItem[];
  /** Callback when a context menu item is selected */
  readonly onContextMenuSelect?: (itemId: string) => void;
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
  contextMenuItems = EMPTY_ITEMS,
  onContextMenuSelect = NOOP,
}: CanvasItemProps) {
  const screenPos = worldToScreen(viewport, position);
  const draggable = onPositionChange !== NOOP;
  const hasContextMenu = contextMenuItems !== EMPTY_ITEMS;
  const { isDragging, onPointerDown, onPointerMove, onPointerUp } = useDragItem(
    position,
    viewport.scale,
    onPositionChange,
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
      if (hasContextMenu) {
        longPress.onPointerDown(e);
      }
      if (draggable) {
        onPointerDown(e);
      }
    },
    [hasContextMenu, longPress, draggable, onPointerDown],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (hasContextMenu) {
        longPress.onPointerMove(e);
      }
      if (draggable) {
        onPointerMove(e);
      }
    },
    [hasContextMenu, longPress, draggable, onPointerMove],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (hasContextMenu) {
        longPress.onPointerUp(e);
      }
      if (draggable) {
        onPointerUp(e);
      }
    },
    [hasContextMenu, longPress, draggable, onPointerUp],
  );

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
          cursor: draggable ? (isDragging ? "grabbing" : "grab") : undefined,
          zIndex: isDragging ? 1000 : undefined,
          touchAction: draggable || hasContextMenu ? "none" : undefined,
        }}
        onPointerDown={
          draggable || hasContextMenu ? handlePointerDown : undefined
        }
        onPointerMove={
          draggable || hasContextMenu ? handlePointerMove : undefined
        }
        onPointerUp={draggable || hasContextMenu ? handlePointerUp : undefined}
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

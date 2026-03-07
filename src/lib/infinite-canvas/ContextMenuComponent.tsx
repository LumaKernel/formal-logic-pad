import { useCallback, useEffect, useRef } from "react";
import { clampMenuPosition, type ContextMenuItem } from "./contextMenu";
import type { Point } from "./types";

export interface ContextMenuProps {
  /** Menu items to display */
  readonly items: readonly ContextMenuItem[];
  /** Screen-space position to render the menu at */
  readonly screenPosition: Point;
  /** Callback when a menu item is clicked */
  readonly onSelect: (itemId: string) => void;
  /** Callback to close the menu */
  readonly onClose: () => void;
  /** Ref forwarded from useContextMenu for outside-click detection */
  readonly menuRef: React.RefObject<HTMLDivElement | null>;
}

/** Renders a floating context menu at the given screen position. */
export function ContextMenuComponent({
  items,
  screenPosition,
  onSelect,
  onClose,
  menuRef,
}: ContextMenuProps) {
  const innerRef = useRef<HTMLDivElement | null>(null);

  // Adjust position to stay within viewport after measuring
  useEffect(() => {
    const el = innerRef.current;
    /* v8 ignore start -- defensive: el is always non-null when component is mounted */
    if (el === null) return;
    /* v8 ignore stop */
    const clamped = clampMenuPosition(
      screenPosition,
      el.offsetWidth,
      el.offsetHeight,
      window.innerWidth,
      window.innerHeight,
    );
    el.style.left = `${String(clamped.x) satisfies string}px`;
    el.style.top = `${String(clamped.y) satisfies string}px`;
  }, [screenPosition]);

  const setRef = useCallback(
    (node: HTMLDivElement | null) => {
      innerRef.current = node;
      // Synchronise the forwarded ref (React 19 RefObject has writable .current)
      menuRef.current = node;
    },
    [menuRef],
  );

  const handleItemClick = useCallback(
    (itemId: string) => {
      onSelect(itemId);
      onClose();
    },
    [onSelect, onClose],
  );

  const stopPropagation = useCallback((e: React.SyntheticEvent) => {
    e.stopPropagation();
  }, []);

  return (
    <div
      ref={setRef}
      data-testid="context-menu"
      style={{
        position: "fixed",
        left: screenPosition.x,
        top: screenPosition.y,
        zIndex: 2000,
        minWidth: 120,
        background: "#fff",
        border: "1px solid #d0d0d0",
        borderRadius: 6,
        boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
        padding: "4px 0",
        fontFamily: "var(--font-ui)",
        fontSize: 13,
        userSelect: "none",
      }}
      onPointerDown={stopPropagation}
      onPointerMove={stopPropagation}
      onPointerUp={stopPropagation}
      onClick={stopPropagation}
    >
      {items.map((item) => (
        <button
          key={item.id}
          data-testid={`context-menu-item-${item.id satisfies string}`}
          disabled={item.disabled === true}
          onClick={() => {
            handleItemClick(item.id);
          }}
          style={{
            display: "block",
            width: "100%",
            padding: "6px 16px",
            border: "none",
            background: "transparent",
            textAlign: "left",
            cursor: item.disabled === true ? "default" : "pointer",
            color: item.disabled === true ? "#aaa" : "#333",
            fontSize: 13,
            lineHeight: "1.4",
          }}
          onMouseEnter={(e) => {
            if (item.disabled !== true) {
              e.currentTarget.style.background = "#f0f0f0";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
          }}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { useCallback, useState } from "react";
import { CanvasItem } from "./CanvasItem";
import { type ConnectorPort, DEFAULT_PORTS } from "./connector";
import type { ConnectorPortOnItem } from "./connector";
import { ConnectorPortComponent } from "./ConnectorPortComponent";
import { InfiniteCanvas } from "./InfiniteCanvas";
import { PortConnection } from "./PortConnection";
import type { Obstacle } from "./connectionPath";
import type { Point, ViewportState } from "./types";

interface ItemData {
  readonly id: string;
  readonly position: Point;
  readonly label: string;
  readonly color: string;
  readonly ports: readonly ConnectorPort[];
}

interface ItemSize {
  readonly width: number;
  readonly height: number;
}

interface ConnectionData {
  readonly id: string;
  readonly fromItemId: string;
  readonly fromPortId: string;
  readonly toItemId: string;
  readonly toPortId: string;
  readonly color: string;
}

const INITIAL_ITEMS: readonly ItemData[] = [
  {
    id: "axiom",
    position: { x: 80, y: 60 },
    label: "Axiom K",
    color: "#4a90d9",
    ports: DEFAULT_PORTS,
  },
  {
    id: "mp",
    position: { x: 350, y: 130 },
    label: "Modus Ponens",
    color: "#d9944a",
    ports: [
      { id: "premise-1", edge: "left", position: 0.35 },
      { id: "premise-2", edge: "left", position: 0.65 },
      { id: "conclusion", edge: "right", position: 0.5 },
      { id: "top", edge: "top", position: 0.5 },
      { id: "bottom", edge: "bottom", position: 0.5 },
    ],
  },
  {
    id: "result",
    position: { x: 620, y: 130 },
    label: "Result",
    color: "#4ad94a",
    ports: DEFAULT_PORTS,
  },
];

const INITIAL_CONNECTIONS: readonly ConnectionData[] = [
  {
    id: "axiom-to-mp",
    fromItemId: "axiom",
    fromPortId: "right",
    toItemId: "mp",
    toPortId: "premise-1",
    color: "#4a90d9",
  },
  {
    id: "mp-to-result",
    fromItemId: "mp",
    fromPortId: "conclusion",
    toItemId: "result",
    toPortId: "left",
    color: "#4ad94a",
  },
];

function findItem(
  items: readonly ItemData[],
  id: string,
): ItemData | undefined {
  return items.find((item) => item.id === id);
}

function findPortInItem(
  item: ItemData,
  portId: string,
): ConnectorPort | undefined {
  return item.ports.find((p) => p.id === portId);
}

function toPortOnItem(
  item: ItemData,
  sizes: ReadonlyMap<string, ItemSize>,
  portId: string,
): ConnectorPortOnItem | undefined {
  const port = findPortInItem(item, portId);
  const size = sizes.get(item.id);
  if (!port || !size) return undefined;
  return {
    port,
    itemPosition: item.position,
    itemWidth: size.width,
    itemHeight: size.height,
  };
}

function ConnectorPortsDemo() {
  const [viewport, setViewport] = useState<ViewportState>({
    offsetX: 0,
    offsetY: 0,
    scale: 1,
  });
  const [items, setItems] = useState<readonly ItemData[]>(INITIAL_ITEMS);
  const [highlightedPort, setHighlightedPort] = useState<string | null>(null);
  const [itemSizes, setItemSizes] = useState<ReadonlyMap<string, ItemSize>>(
    new Map(),
  );

  const handlePositionChange = (id: string, newPosition: Point) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, position: newPosition } : item,
      ),
    );
  };

  const measureItem = useCallback(
    (id: string) => (el: HTMLDivElement | null) => {
      if (el) {
        const rect = el.getBoundingClientRect();
        const w = rect.width / viewport.scale;
        const h = rect.height / viewport.scale;
        setItemSizes((prev) => {
          const existing = prev.get(id);
          if (existing && existing.width === w && existing.height === h)
            return prev;
          const next = new Map(prev);
          next.set(id, { width: w, height: h });
          return next;
        });
      }
    },
    [viewport.scale],
  );

  const obstacles: readonly Obstacle[] = items
    .map((item) => {
      const size = itemSizes.get(item.id);
      if (!size) return null;
      return {
        position: item.position,
        width: size.width,
        height: size.height,
      };
    })
    .filter((o) => o !== null);

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <InfiniteCanvas viewport={viewport} onViewportChange={setViewport}>
        {/* Port-based connections */}
        {INITIAL_CONNECTIONS.map((conn) => {
          const fromItem = findItem(items, conn.fromItemId);
          const toItem = findItem(items, conn.toItemId);
          if (!fromItem || !toItem) return null;
          const fromPortOnItem = toPortOnItem(
            fromItem,
            itemSizes,
            conn.fromPortId,
          );
          const toPortOnItem_ = toPortOnItem(toItem, itemSizes, conn.toPortId);
          if (!fromPortOnItem || !toPortOnItem_) return null;
          return (
            <PortConnection
              key={conn.id}
              from={fromPortOnItem}
              to={toPortOnItem_}
              viewport={viewport}
              color={conn.color}
              obstacles={obstacles}
            />
          );
        })}

        {/* Items with connector ports */}
        {items.map((item) => (
          <CanvasItem
            key={item.id}
            position={item.position}
            viewport={viewport}
            onPositionChange={(pos) => {
              handlePositionChange(item.id, pos);
            }}
          >
            <div
              ref={measureItem(item.id)}
              data-testid={`item-${item.id satisfies string}`}
              style={{
                padding: "12px 16px",
                background: item.color,
                color: "#fff",
                borderRadius: 8,
                fontFamily: "sans-serif",
                fontSize: 14,
                fontWeight: 600,
                boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                whiteSpace: "nowrap",
                userSelect: "none",
              }}
            >
              {item.label}
            </div>
          </CanvasItem>
        ))}

        {/* Connector ports rendered on top of items */}
        {items.flatMap((item) => {
          const size = itemSizes.get(item.id);
          if (!size) return [];
          return item.ports.map((port) => {
            const uniqueId = `${item.id satisfies string}-${port.id satisfies string}`;
            return (
              <ConnectorPortComponent
                key={uniqueId}
                port={{ ...port, id: uniqueId }}
                itemPosition={item.position}
                itemWidth={size.width}
                itemHeight={size.height}
                viewport={viewport}
                highlighted={highlightedPort === uniqueId}
                onPortClick={() => {
                  setHighlightedPort(uniqueId);
                }}
              />
            );
          });
        })}
      </InfiniteCanvas>

      <div
        data-testid="status-bar"
        style={{
          position: "fixed",
          top: 8,
          left: 8,
          background: "rgba(0,0,0,0.7)",
          color: "#fff",
          padding: "4px 8px",
          borderRadius: 4,
          fontSize: 12,
          fontFamily: "monospace",
          pointerEvents: "none",
        }}
      >
        <div>
          scale: {viewport.scale.toFixed(2)} | offset: (
          {viewport.offsetX.toFixed(0)}, {viewport.offsetY.toFixed(0)})
        </div>
        <div data-testid="selected-port">
          {highlightedPort !== null
            ? `Selected: ${highlightedPort satisfies string}`
            : "Click a port to select it"}
        </div>
      </div>
    </div>
  );
}

const meta = {
  title: "InfiniteCanvas/ConnectorPorts",
  component: ConnectorPortsDemo,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof ConnectorPortsDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Helper: get the center of a DOM element's bounding box.
 */
function getCenter(el: HTMLElement): {
  readonly x: number;
  readonly y: number;
} {
  const rect = el.getBoundingClientRect();
  return { x: (rect.left + rect.right) / 2, y: (rect.top + rect.bottom) / 2 };
}

/**
 * Maximum allowed distance (px) between a connector port center and
 * the expected edge of its parent node.  Accounts for port radius,
 * border widths and sub-pixel rounding.
 */
const PORT_EDGE_TOLERANCE = 15;

export const Interactive: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify all items are rendered
    const axiomNode = canvas.getByTestId("item-axiom");
    const mpNode = canvas.getByTestId("item-mp");
    const resultNode = canvas.getByTestId("item-result");
    await expect(axiomNode).toBeInTheDocument();
    await expect(mpNode).toBeInTheDocument();
    await expect(resultNode).toBeInTheDocument();

    // Verify connector ports are rendered (now with item-prefixed IDs)
    const axiomRight = canvas.getByTestId("connector-port-axiom-right");
    const axiomTop = canvas.getByTestId("connector-port-axiom-top");
    const axiomBottom = canvas.getByTestId("connector-port-axiom-bottom");
    const axiomLeft = canvas.getByTestId("connector-port-axiom-left");
    await expect(axiomRight).toBeInTheDocument();
    await expect(axiomTop).toBeInTheDocument();
    await expect(axiomBottom).toBeInTheDocument();
    await expect(axiomLeft).toBeInTheDocument();

    // MP has unique custom ports
    const mpPremise1 = canvas.getByTestId("connector-port-mp-premise-1");
    const mpConclusion = canvas.getByTestId("connector-port-mp-conclusion");
    await expect(mpPremise1).toBeInTheDocument();
    await expect(mpConclusion).toBeInTheDocument();

    // Verify port-based connections are rendered
    const connections = canvas.getAllByTestId("port-connection");
    await expect(connections).toHaveLength(2);

    const paths = canvas.getAllByTestId("port-connection-path");
    await expect(paths).toHaveLength(2);

    // Verify items are draggable
    const canvasItemAxiom = axiomNode.closest("[data-testid='canvas-item']");
    await expect(canvasItemAxiom).toHaveStyle({ cursor: "grab" });

    // --- Port position proximity tests ---
    // Verify that connector ports are positioned near the correct edges
    // of their parent nodes, using getBoundingClientRect for real DOM positions.

    const axiomRect = axiomNode.getBoundingClientRect();
    const mpRect = mpNode.getBoundingClientRect();
    const resultRect = resultNode.getBoundingClientRect();

    // Axiom "right" port center should be near axiom node's right edge
    const axiomRightCenter = getCenter(axiomRight);
    await expect(Math.abs(axiomRightCenter.x - axiomRect.right)).toBeLessThan(
      PORT_EDGE_TOLERANCE,
    );
    // Y should be near the vertical center of the axiom node
    const axiomMidY = (axiomRect.top + axiomRect.bottom) / 2;
    await expect(Math.abs(axiomRightCenter.y - axiomMidY)).toBeLessThan(
      PORT_EDGE_TOLERANCE,
    );

    // Axiom "top" port center should be near axiom node's top edge
    const axiomTopCenter = getCenter(axiomTop);
    await expect(Math.abs(axiomTopCenter.y - axiomRect.top)).toBeLessThan(
      PORT_EDGE_TOLERANCE,
    );
    // X should be near the horizontal center
    const axiomMidX = (axiomRect.left + axiomRect.right) / 2;
    await expect(Math.abs(axiomTopCenter.x - axiomMidX)).toBeLessThan(
      PORT_EDGE_TOLERANCE,
    );

    // Axiom "bottom" port center should be near axiom node's bottom edge
    const axiomBottomCenter = getCenter(axiomBottom);
    await expect(Math.abs(axiomBottomCenter.y - axiomRect.bottom)).toBeLessThan(
      PORT_EDGE_TOLERANCE,
    );

    // Axiom "left" port center should be near axiom node's left edge
    const axiomLeftCenter = getCenter(axiomLeft);
    await expect(Math.abs(axiomLeftCenter.x - axiomRect.left)).toBeLessThan(
      PORT_EDGE_TOLERANCE,
    );

    // MP "premise-1" port (left edge, position 0.35) should be near MP node's left edge
    const mpPremise1Center = getCenter(mpPremise1);
    await expect(Math.abs(mpPremise1Center.x - mpRect.left)).toBeLessThan(
      PORT_EDGE_TOLERANCE,
    );

    // MP "conclusion" port (right edge, position 0.5) should be near MP node's right edge
    const mpConclusionCenter = getCenter(mpConclusion);
    await expect(Math.abs(mpConclusionCenter.x - mpRect.right)).toBeLessThan(
      PORT_EDGE_TOLERANCE,
    );
    // Y should be near the vertical center
    const mpMidY = (mpRect.top + mpRect.bottom) / 2;
    await expect(Math.abs(mpConclusionCenter.y - mpMidY)).toBeLessThan(
      PORT_EDGE_TOLERANCE,
    );

    // Result "left" port should be near result node's left edge
    const resultLeft = canvas.getByTestId("connector-port-result-left");
    const resultLeftCenter = getCenter(resultLeft);
    await expect(Math.abs(resultLeftCenter.x - resultRect.left)).toBeLessThan(
      PORT_EDGE_TOLERANCE,
    );
  },
};

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { useCallback, useState } from "react";
import { CanvasItem } from "./CanvasItem";
import { Connection } from "./Connection";
import { InfiniteCanvas } from "./InfiniteCanvas";
import {
  closeLineMenu,
  LINE_MENU_CLOSED,
  openLineMenu,
  type LineMenuState,
} from "./lineMenu";
import type { ConnectionEndpoint } from "./connectionPath";
import type { Point, ViewportState } from "./types";

interface NodeData {
  readonly id: string;
  readonly position: Point;
  readonly width: number;
  readonly height: number;
  readonly label: string;
  readonly color: string;
}

interface ConnectionData {
  readonly id: string;
  readonly fromNodeId: string;
  readonly toNodeId: string;
  readonly label: string;
  readonly menuActions: readonly {
    readonly id: string;
    readonly label: string;
  }[];
}

const INITIAL_NODES: readonly NodeData[] = [
  {
    id: "axiom-k",
    position: { x: 50, y: 50 },
    width: 120,
    height: 40,
    label: "Axiom K",
    color: "#4a90d9",
  },
  {
    id: "axiom-s",
    position: { x: 350, y: 50 },
    width: 120,
    height: 40,
    label: "Axiom S",
    color: "#d94a4a",
  },
  {
    id: "mp-result",
    position: { x: 200, y: 220 },
    width: 120,
    height: 40,
    label: "MP Result",
    color: "#4ad94a",
  },
];

const CONNECTIONS: readonly ConnectionData[] = [
  {
    id: "conn-k-mp",
    fromNodeId: "axiom-k",
    toNodeId: "mp-result",
    label: "MP (major)",
    menuActions: [
      { id: "details", label: "View Details" },
      { id: "edit-rule", label: "Edit Rule" },
      { id: "delete", label: "Delete Connection" },
    ],
  },
  {
    id: "conn-s-mp",
    fromNodeId: "axiom-s",
    toNodeId: "mp-result",
    label: "MP (minor)",
    menuActions: [
      { id: "details", label: "View Details" },
      { id: "swap", label: "Swap Direction" },
      { id: "delete", label: "Delete Connection" },
    ],
  },
];

function LineMenuPanel({
  connection,
  screenPosition,
  onSelect,
  onClose,
}: {
  readonly connection: ConnectionData;
  readonly screenPosition: Point;
  readonly onSelect: (connectionId: string, actionId: string) => void;
  readonly onClose: () => void;
}) {
  return (
    <div
      data-testid="line-menu"
      style={{
        position: "fixed",
        left: screenPosition.x + 10,
        top: screenPosition.y + 10,
        zIndex: 2000,
        minWidth: 160,
        background: "#fff",
        border: "2px solid #888",
        borderRadius: 8,
        boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
        padding: 0,
        fontFamily: "sans-serif",
        fontSize: 13,
        userSelect: "none",
        overflow: "hidden",
      }}
      onPointerDown={(e) => {
        e.stopPropagation();
      }}
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      <div
        data-testid="line-menu-header"
        style={{
          background: "#888",
          color: "#fff",
          padding: "8px 12px",
          fontWeight: 600,
          fontSize: 14,
        }}
      >
        {connection.label}
      </div>
      <div style={{ padding: "4px 0" }}>
        {connection.menuActions.map((action) => (
          <button
            key={action.id}
            data-testid={`line-menu-action-${action.id satisfies string}`}
            onClick={() => {
              onSelect(connection.id, action.id);
              onClose();
            }}
            style={{
              display: "block",
              width: "100%",
              padding: "6px 16px",
              border: "none",
              background: "transparent",
              textAlign: "left",
              cursor: "pointer",
              color: "#333",
              fontSize: 13,
              lineHeight: "1.4",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#f0f0f0";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function LineMenuDemo() {
  const [viewport, setViewport] = useState<ViewportState>({
    offsetX: 0,
    offsetY: 0,
    scale: 1,
  });
  const [nodes, setNodes] = useState<readonly NodeData[]>(INITIAL_NODES);
  const [menuState, setMenuState] = useState<LineMenuState>(LINE_MENU_CLOSED);
  const [lastAction, setLastAction] = useState<string>("");

  const handlePositionChange = useCallback((id: string, newPosition: Point) => {
    setNodes((prev) =>
      prev.map((node) =>
        node.id === id ? { ...node, position: newPosition } : node,
      ),
    );
  }, []);

  const handleConnectionClick = useCallback(
    (connectionId: string, screenX: number, screenY: number) => {
      setMenuState((prev) => {
        if (prev.open && prev.connectionId === connectionId) {
          return closeLineMenu();
        }
        return openLineMenu(connectionId, screenX, screenY);
      });
    },
    [],
  );

  const handleMenuSelect = useCallback(
    (connectionId: string, actionId: string) => {
      setLastAction(
        `${connectionId satisfies string}: ${actionId satisfies string}`,
      );
    },
    [],
  );

  const handleMenuClose = useCallback(() => {
    setMenuState(closeLineMenu());
  }, []);

  const activeConnection = menuState.open
    ? CONNECTIONS.find((c) => c.id === menuState.connectionId)
    : undefined;

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  return (
    <div
      style={{ width: "100vw", height: "100vh" }}
      onPointerDown={() => {
        if (menuState.open) {
          handleMenuClose();
        }
      }}
    >
      <InfiniteCanvas viewport={viewport} onViewportChange={setViewport}>
        {CONNECTIONS.map((conn) => {
          const fromNode = nodeMap.get(conn.fromNodeId);
          const toNode = nodeMap.get(conn.toNodeId);
          if (fromNode === undefined || toNode === undefined) return null;

          const fromEndpoint: ConnectionEndpoint = {
            position: fromNode.position,
            width: fromNode.width,
            height: fromNode.height,
          };
          const toEndpoint: ConnectionEndpoint = {
            position: toNode.position,
            width: toNode.width,
            height: toNode.height,
          };

          return (
            <Connection
              key={conn.id}
              from={fromEndpoint}
              to={toEndpoint}
              viewport={viewport}
              color={
                menuState.open && menuState.connectionId === conn.id
                  ? "#ff6600"
                  : "#666"
              }
              strokeWidth={
                menuState.open && menuState.connectionId === conn.id ? 3 : 2
              }
              onClick={(screenX, screenY) => {
                handleConnectionClick(conn.id, screenX, screenY);
              }}
            />
          );
        })}
        {nodes.map((node) => (
          <CanvasItem
            key={node.id}
            position={node.position}
            viewport={viewport}
            onPositionChange={(pos) => {
              handlePositionChange(node.id, pos);
            }}
          >
            <div
              data-testid={`node-${node.id satisfies string}`}
              style={{
                padding: "10px 16px",
                background: node.color,
                color: "#fff",
                borderRadius: 8,
                fontFamily: "sans-serif",
                fontSize: 14,
                fontWeight: 600,
                boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                whiteSpace: "nowrap",
                userSelect: "none",
                width: node.width,
                height: node.height,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {node.label}
            </div>
          </CanvasItem>
        ))}
      </InfiniteCanvas>
      {menuState.open && activeConnection !== undefined && (
        <LineMenuPanel
          connection={activeConnection}
          screenPosition={menuState.screenPosition}
          onSelect={handleMenuSelect}
          onClose={handleMenuClose}
        />
      )}
      <div
        data-testid="last-action"
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
        {lastAction !== ""
          ? `Last action: ${lastAction satisfies string}`
          : "Click a connection line to open its menu"}
      </div>
    </div>
  );
}

const meta = {
  title: "InfiniteCanvas/LineMenu",
  component: LineMenuDemo,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof LineMenuDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify all nodes are rendered
    const axiomK = canvas.getByTestId("node-axiom-k");
    const axiomS = canvas.getByTestId("node-axiom-s");
    const mpResult = canvas.getByTestId("node-mp-result");
    await expect(axiomK).toBeInTheDocument();
    await expect(axiomS).toBeInTheDocument();
    await expect(mpResult).toBeInTheDocument();

    // Verify connections are rendered
    const connections = canvas.getAllByTestId("connection");
    await expect(connections).toHaveLength(2);

    // Verify hit areas are present (indicating onClick is configured)
    const hitAreas = canvas.getAllByTestId("connection-hit-area");
    await expect(hitAreas).toHaveLength(2);

    // No menu should be open initially
    await expect(canvas.queryByTestId("line-menu")).not.toBeInTheDocument();

    // Click the first connection hit area
    await userEvent.click(hitAreas[0]!);

    // Menu should appear
    const menu = canvas.getByTestId("line-menu");
    await expect(menu).toBeInTheDocument();

    // Menu header should show the connection label
    const header = canvas.getByTestId("line-menu-header");
    await expect(header).toHaveTextContent("MP (major)");

    // Menu should have the correct actions
    const detailsAction = canvas.getByTestId("line-menu-action-details");
    await expect(detailsAction).toBeInTheDocument();
    await expect(detailsAction).toHaveTextContent("View Details");

    // Click an action
    await userEvent.click(detailsAction);

    // Menu should close after action
    await expect(canvas.queryByTestId("line-menu")).not.toBeInTheDocument();

    // Last action should be updated
    const lastAction = canvas.getByTestId("last-action");
    await expect(lastAction).toHaveTextContent(
      "Last action: conn-k-mp: details",
    );

    // Click the second connection hit area
    await userEvent.click(hitAreas[1]!);

    const menu2 = canvas.getByTestId("line-menu");
    await expect(menu2).toBeInTheDocument();

    const header2 = canvas.getByTestId("line-menu-header");
    await expect(header2).toHaveTextContent("MP (minor)");

    // Click the same hit area again to toggle close
    await userEvent.click(hitAreas[1]!);
    await expect(canvas.queryByTestId("line-menu")).not.toBeInTheDocument();
  },
};

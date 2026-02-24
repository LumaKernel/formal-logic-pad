import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { useCallback, useState } from "react";
import { CanvasItem } from "./CanvasItem";
import { PortConnection } from "./PortConnection";
import { InfiniteCanvas } from "./InfiniteCanvas";
import type { ConnectorPortOnItem } from "./connector";
import type { Point, ViewportState } from "./types";

interface NodeData {
  readonly id: string;
  readonly position: Point;
  readonly width: number;
  readonly height: number;
  readonly label: string;
  readonly color: string;
}

interface SubstitutionEntry {
  readonly variable: string;
  readonly replacement: string;
}

interface ConnectionData {
  readonly id: string;
  readonly fromNodeId: string;
  readonly fromPortEdge: "top" | "right" | "bottom" | "left";
  readonly toNodeId: string;
  readonly toPortEdge: "top" | "right" | "bottom" | "left";
  readonly ruleLabel: string;
  readonly substitutions: readonly SubstitutionEntry[];
}

const INITIAL_NODES: readonly NodeData[] = [
  {
    id: "premise-a",
    position: { x: 50, y: 50 },
    width: 180,
    height: 50,
    label: "(φ→(ψ→χ))→((φ→ψ)→(φ→χ))",
    color: "#4a90d9",
  },
  {
    id: "premise-b",
    position: { x: 350, y: 50 },
    width: 140,
    height: 50,
    label: "φ→((φ→φ)→φ)",
    color: "#d94a4a",
  },
  {
    id: "conclusion",
    position: { x: 200, y: 250 },
    width: 160,
    height: 50,
    label: "(φ→(φ→φ))→(φ→φ)",
    color: "#4ad94a",
  },
];

const CONNECTIONS: readonly ConnectionData[] = [
  {
    id: "conn-a",
    fromNodeId: "premise-a",
    fromPortEdge: "bottom",
    toNodeId: "conclusion",
    toPortEdge: "top",
    ruleLabel: "MP",
    substitutions: [
      { variable: "ψ", replacement: "φ→φ" },
      { variable: "χ", replacement: "φ" },
    ],
  },
  {
    id: "conn-b",
    fromNodeId: "premise-b",
    fromPortEdge: "bottom",
    toNodeId: "conclusion",
    toPortEdge: "top",
    ruleLabel: "MP",
    substitutions: [{ variable: "ψ", replacement: "φ" }],
  },
];

function SubstitutionPanel({
  connection,
  onSubstitutionChange,
}: {
  readonly connection: ConnectionData;
  readonly onSubstitutionChange: (
    connectionId: string,
    index: number,
    value: string,
  ) => void;
}) {
  return (
    <div
      data-testid={`label-panel-${connection.id satisfies string}`}
      style={{
        background: "rgba(255,255,255,0.95)",
        border: "1px solid #ccc",
        borderRadius: 6,
        padding: "6px 10px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
        fontFamily: "serif",
        fontSize: 13,
        minWidth: 100,
        pointerEvents: "auto",
      }}
      onPointerDown={(e) => {
        e.stopPropagation();
      }}
    >
      <div
        style={{
          fontWeight: 600,
          fontSize: 12,
          color: "#666",
          marginBottom: 4,
          textAlign: "center",
        }}
      >
        {connection.ruleLabel}
      </div>
      {connection.substitutions.map((sub, i) => (
        <div
          key={sub.variable}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            marginBottom: 2,
          }}
        >
          <span style={{ color: "#4a90d9", fontStyle: "italic" }}>
            {sub.variable}
          </span>
          <span style={{ color: "#888" }}>:=</span>
          <input
            data-testid={`subst-input-${connection.id satisfies string}-${String(i) satisfies string}`}
            type="text"
            defaultValue={sub.replacement}
            style={{
              border: "1px solid #ddd",
              borderRadius: 3,
              padding: "2px 4px",
              fontSize: 12,
              fontFamily: "serif",
              width: 60,
            }}
            onChange={(e) => {
              onSubstitutionChange(connection.id, i, e.target.value);
            }}
          />
        </div>
      ))}
    </div>
  );
}

function ConnectionLabelDemo() {
  const [viewport, setViewport] = useState<ViewportState>({
    offsetX: 0,
    offsetY: 0,
    scale: 1,
  });
  const [nodes, setNodes] = useState<readonly NodeData[]>(INITIAL_NODES);
  const [lastEdit, setLastEdit] = useState<string>("");

  const handlePositionChange = useCallback((id: string, newPosition: Point) => {
    setNodes((prev) =>
      prev.map((node) =>
        node.id === id ? { ...node, position: newPosition } : node,
      ),
    );
  }, []);

  const handleSubstitutionChange = useCallback(
    (connectionId: string, index: number, value: string) => {
      setLastEdit(
        `${connectionId satisfies string}[${String(index) satisfies string}] = ${value satisfies string}`,
      );
    },
    [],
  );

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <InfiniteCanvas viewport={viewport} onViewportChange={setViewport}>
        {CONNECTIONS.map((conn) => {
          const fromNode = nodeMap.get(conn.fromNodeId);
          const toNode = nodeMap.get(conn.toNodeId);
          if (fromNode === undefined || toNode === undefined) return null;

          const fromPort: ConnectorPortOnItem = {
            port: {
              id: `${conn.fromNodeId satisfies string}-out`,
              edge: conn.fromPortEdge,
              position: 0.5,
            },
            itemPosition: fromNode.position,
            itemWidth: fromNode.width,
            itemHeight: fromNode.height,
          };
          const toPort: ConnectorPortOnItem = {
            port: {
              id: `${conn.toNodeId satisfies string}-in`,
              edge: conn.toPortEdge,
              position: conn.fromNodeId === "premise-a" ? 0.3 : 0.7,
            },
            itemPosition: toNode.position,
            itemWidth: toNode.width,
            itemHeight: toNode.height,
          };

          return (
            <PortConnection
              key={conn.id}
              from={fromPort}
              to={toPort}
              viewport={viewport}
              color="#666"
              label={
                <SubstitutionPanel
                  connection={conn}
                  onSubstitutionChange={handleSubstitutionChange}
                />
              }
              labelOffsetY={0}
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
                padding: "10px 12px",
                background: node.color,
                color: "#fff",
                borderRadius: 8,
                fontFamily: "serif",
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
      <div
        data-testid="last-edit"
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
        {lastEdit !== ""
          ? `Last edit: ${lastEdit satisfies string}`
          : "Edit substitution parameters on the connection lines"}
      </div>
    </div>
  );
}

const meta = {
  title: "InfiniteCanvas/ConnectionLabelDemo",
  component: ConnectionLabelDemo,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof ConnectionLabelDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify all nodes are rendered
    const premiseA = canvas.getByTestId("node-premise-a");
    const premiseB = canvas.getByTestId("node-premise-b");
    const conclusion = canvas.getByTestId("node-conclusion");
    await expect(premiseA).toBeInTheDocument();
    await expect(premiseB).toBeInTheDocument();
    await expect(conclusion).toBeInTheDocument();

    // Verify port connections are rendered
    const portConnections = canvas.getAllByTestId("port-connection");
    await expect(portConnections).toHaveLength(2);

    // Verify label panels are rendered on the connections
    const panelA = canvas.getByTestId("label-panel-conn-a");
    const panelB = canvas.getByTestId("label-panel-conn-b");
    await expect(panelA).toBeInTheDocument();
    await expect(panelB).toBeInTheDocument();

    // Verify substitution inputs are present
    const inputA0 = canvas.getByTestId("subst-input-conn-a-0");
    const inputA1 = canvas.getByTestId("subst-input-conn-a-1");
    const inputB0 = canvas.getByTestId("subst-input-conn-b-0");
    await expect(inputA0).toBeInTheDocument();
    await expect(inputA1).toBeInTheDocument();
    await expect(inputB0).toBeInTheDocument();

    // Edit a substitution input
    await userEvent.clear(inputA0);
    await userEvent.type(inputA0, "new-val");

    // Last edit should be updated
    const lastEdit = canvas.getByTestId("last-edit");
    await expect(lastEdit).toHaveTextContent("Last edit:");
  },
};

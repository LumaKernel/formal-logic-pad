import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { useState } from "react";
import { CanvasItem } from "./CanvasItem";
import { type ConnectorPort } from "./connector";
import type { ConnectorPortOnItem } from "./connector";
import { ConnectorPortComponent } from "./ConnectorPortComponent";
import { InfiniteCanvas } from "./InfiniteCanvas";
import { PortConnection } from "./PortConnection";
import type { Obstacle } from "./connectionPath";
import type { Point, ViewportState } from "./types";

/**
 * Proof Tree Story: φ→φ (I combinator) from Hilbert-style axioms
 *
 * Demonstrates a formal proof tree as a graph using InfiniteCanvas.
 * The proof of φ→φ uses axioms A1 (K) and A2 (S) with Modus Ponens.
 *
 * Tree structure (top-down):
 *
 *   [A2 instance]      [A1 instance (a)]
 *        \                /
 *         \              /
 *          [MP₁]                    [A1 instance (b)]
 *              \                        /
 *               \                      /
 *                    [MP₂: φ→φ]
 */

// --- Node types for proof tree ---

type ProofNodeKind = "axiom" | "mp" | "conclusion";

interface ProofNode {
  readonly id: string;
  readonly position: Point;
  readonly kind: ProofNodeKind;
  readonly label: string;
  readonly formula: string;
  readonly width: number;
  readonly height: number;
  readonly ports: readonly ConnectorPort[];
}

interface ProofEdge {
  readonly id: string;
  readonly fromNodeId: string;
  readonly fromPortId: string;
  readonly toNodeId: string;
  readonly toPortId: string;
}

// --- Ports ---

const AXIOM_PORTS: readonly ConnectorPort[] = [
  { id: "out", edge: "bottom", position: 0.5 },
];

const MP_PORTS: readonly ConnectorPort[] = [
  { id: "premise-left", edge: "top", position: 0.3 },
  { id: "premise-right", edge: "top", position: 0.7 },
  { id: "out", edge: "bottom", position: 0.5 },
];

const CONCLUSION_PORTS: readonly ConnectorPort[] = [
  { id: "premise-left", edge: "top", position: 0.3 },
  { id: "premise-right", edge: "top", position: 0.7 },
];

// --- Layout constants ---

const NODE_PADDING_X = 24;
const NODE_PADDING_Y = 16;

// --- Proof data for φ→φ ---

const AXIOM_COLOR = "#5b8bd9";
const MP_COLOR = "#d9944a";
const CONCLUSION_COLOR = "#4ad97a";

function makeNode(
  id: string,
  kind: ProofNodeKind,
  label: string,
  formula: string,
  position: Point,
  textWidth: number,
): ProofNode {
  const ports =
    kind === "axiom"
      ? AXIOM_PORTS
      : kind === "conclusion"
        ? CONCLUSION_PORTS
        : MP_PORTS;
  return {
    id,
    position,
    kind,
    label,
    formula,
    width: textWidth + NODE_PADDING_X,
    height: 52 + NODE_PADDING_Y,
    ports,
  };
}

const INITIAL_NODES: readonly ProofNode[] = [
  // Row 1: Axiom instances (leaves)
  makeNode(
    "a2-inst",
    "axiom",
    "A2",
    "(φ→((φ→φ)→φ)) → ((φ→(φ→φ))→(φ→φ))",
    { x: 50, y: 60 },
    340,
  ),
  makeNode(
    "a1-inst-a",
    "axiom",
    "A1",
    "φ → ((φ→φ) → φ)",
    { x: 490, y: 60 },
    180,
  ),
  makeNode("a1-inst-b", "axiom", "A1", "φ → (φ → φ)", { x: 600, y: 230 }, 150),

  // Row 2: First MP application
  makeNode("mp1", "mp", "MP", "(φ→(φ→φ)) → (φ→φ)", { x: 220, y: 230 }, 210),

  // Row 3: Final conclusion
  makeNode("result", "conclusion", "φ→φ", "φ → φ", { x: 370, y: 400 }, 100),
];

const INITIAL_EDGES: readonly ProofEdge[] = [
  // A2 instance → MP₁ (left premise)
  {
    id: "a2-to-mp1",
    fromNodeId: "a2-inst",
    fromPortId: "out",
    toNodeId: "mp1",
    toPortId: "premise-left",
  },
  // A1 instance (a) → MP₁ (right premise)
  {
    id: "a1a-to-mp1",
    fromNodeId: "a1-inst-a",
    fromPortId: "out",
    toNodeId: "mp1",
    toPortId: "premise-right",
  },
  // MP₁ → result (left premise)
  {
    id: "mp1-to-result",
    fromNodeId: "mp1",
    fromPortId: "out",
    toNodeId: "result",
    toPortId: "premise-left",
  },
  // A1 instance (b) → result (right premise)
  {
    id: "a1b-to-result",
    fromNodeId: "a1-inst-b",
    fromPortId: "out",
    toNodeId: "result",
    toPortId: "premise-right",
  },
];

// --- Helpers ---

function findNode(
  nodes: readonly ProofNode[],
  id: string,
): ProofNode | undefined {
  return nodes.find((n) => n.id === id);
}

function toPortOnItem(
  node: ProofNode,
  portId: string,
): ConnectorPortOnItem | undefined {
  const port = node.ports.find((p) => p.id === portId);
  if (!port) return undefined;
  return {
    port,
    itemPosition: node.position,
    itemWidth: node.width,
    itemHeight: node.height,
  };
}

function nodeColor(kind: ProofNodeKind): string {
  switch (kind) {
    case "axiom":
      return AXIOM_COLOR;
    case "mp":
      return MP_COLOR;
    case "conclusion":
      return CONCLUSION_COLOR;
  }
}

function edgeColor(fromKind: ProofNodeKind): string {
  return fromKind === "axiom" ? "#7aa3e0" : "#e0a87a";
}

// --- Component ---

function ProofTreeDemo() {
  const [viewport, setViewport] = useState<ViewportState>({
    offsetX: 0,
    offsetY: 0,
    scale: 1,
  });
  const [nodes, setNodes] = useState<readonly ProofNode[]>(INITIAL_NODES);

  const handlePositionChange = (id: string, newPosition: Point) => {
    setNodes((prev) =>
      prev.map((node) =>
        node.id === id ? { ...node, position: newPosition } : node,
      ),
    );
  };

  const obstacles: readonly Obstacle[] = nodes.map((node) => ({
    position: node.position,
    width: node.width,
    height: node.height,
  }));

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <InfiniteCanvas viewport={viewport} onViewportChange={setViewport}>
        {/* Edges (connections) */}
        {INITIAL_EDGES.map((edge) => {
          const fromNode = findNode(nodes, edge.fromNodeId);
          const toNode = findNode(nodes, edge.toNodeId);
          if (!fromNode || !toNode) return null;
          const fromPort = toPortOnItem(fromNode, edge.fromPortId);
          const toPort = toPortOnItem(toNode, edge.toPortId);
          if (!fromPort || !toPort) return null;
          return (
            <PortConnection
              key={edge.id}
              from={fromPort}
              to={toPort}
              viewport={viewport}
              color={edgeColor(fromNode.kind)}
              obstacles={obstacles}
            />
          );
        })}

        {/* Nodes */}
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
              data-testid={`proof-node-${node.id satisfies string}`}
              style={{
                padding: "8px 12px",
                background: nodeColor(node.kind),
                color: "#fff",
                borderRadius: node.kind === "conclusion" ? 12 : 8,
                fontFamily: "serif, 'Times New Roman', Times",
                fontSize: 13,
                boxShadow:
                  node.kind === "conclusion"
                    ? "0 4px 16px rgba(74,217,122,0.4)"
                    : "0 2px 8px rgba(0,0,0,0.2)",
                userSelect: "none",
                minWidth: 80,
                textAlign: "center",
                border:
                  node.kind === "conclusion"
                    ? "2px solid #2ecc71"
                    : "1px solid rgba(255,255,255,0.2)",
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontFamily: "sans-serif",
                  fontWeight: 700,
                  opacity: 0.8,
                  marginBottom: 2,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                }}
              >
                {node.label}
              </div>
              <div style={{ fontStyle: "italic", whiteSpace: "nowrap" }}>
                {node.formula}
              </div>
            </div>
          </CanvasItem>
        ))}

        {/* Connector ports */}
        {nodes.flatMap((node) =>
          node.ports.map((port) => (
            <ConnectorPortComponent
              key={`${node.id satisfies string}-${port.id satisfies string}`}
              port={port}
              itemPosition={node.position}
              itemWidth={node.width}
              itemHeight={node.height}
              viewport={viewport}
              highlighted={false}
            />
          )),
        )}
      </InfiniteCanvas>

      {/* Legend */}
      <div
        data-testid="proof-legend"
        style={{
          position: "fixed",
          top: 8,
          left: 8,
          background: "rgba(0,0,0,0.8)",
          color: "#fff",
          padding: "8px 12px",
          borderRadius: 6,
          fontSize: 12,
          fontFamily: "sans-serif",
          pointerEvents: "none",
          lineHeight: 1.6,
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 4 }}>
          Proof: φ→φ (I combinator)
        </div>
        <div>
          <span
            style={{
              display: "inline-block",
              width: 10,
              height: 10,
              background: AXIOM_COLOR,
              borderRadius: 2,
              marginRight: 4,
              verticalAlign: "middle",
            }}
          />{" "}
          Axiom instance
        </div>
        <div>
          <span
            style={{
              display: "inline-block",
              width: 10,
              height: 10,
              background: MP_COLOR,
              borderRadius: 2,
              marginRight: 4,
              verticalAlign: "middle",
            }}
          />{" "}
          Modus Ponens
        </div>
        <div>
          <span
            style={{
              display: "inline-block",
              width: 10,
              height: 10,
              background: CONCLUSION_COLOR,
              borderRadius: 2,
              marginRight: 4,
              verticalAlign: "middle",
            }}
          />{" "}
          Conclusion
        </div>
      </div>
    </div>
  );
}

// --- Storybook ---

const meta = {
  title: "InfiniteCanvas/ProofTree",
  component: ProofTreeDemo,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof ProofTreeDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const PhiImpliesPhi: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify all proof nodes are rendered
    const a2Node = canvas.getByTestId("proof-node-a2-inst");
    const a1aNode = canvas.getByTestId("proof-node-a1-inst-a");
    const a1bNode = canvas.getByTestId("proof-node-a1-inst-b");
    const mp1Node = canvas.getByTestId("proof-node-mp1");
    const resultNode = canvas.getByTestId("proof-node-result");

    await expect(a2Node).toBeInTheDocument();
    await expect(a1aNode).toBeInTheDocument();
    await expect(a1bNode).toBeInTheDocument();
    await expect(mp1Node).toBeInTheDocument();
    await expect(resultNode).toBeInTheDocument();

    // Verify axiom labels
    await expect(a2Node).toHaveTextContent("A2");
    await expect(a1aNode).toHaveTextContent("A1");
    await expect(a1bNode).toHaveTextContent("A1");
    await expect(mp1Node).toHaveTextContent("MP");

    // Verify conclusion formula
    await expect(resultNode).toHaveTextContent("φ → φ");

    // Verify port-based connections (4 edges in the tree)
    const connections = canvas.getAllByTestId("port-connection");
    await expect(connections).toHaveLength(4);

    const paths = canvas.getAllByTestId("port-connection-path");
    await expect(paths).toHaveLength(4);

    // Verify legend
    const legend = canvas.getByTestId("proof-legend");
    await expect(legend).toBeInTheDocument();
    await expect(legend).toHaveTextContent("Proof: φ→φ (I combinator)");

    // Verify nodes are draggable
    const canvasItemA2 = a2Node.closest("[data-testid='canvas-item']");
    await expect(canvasItemA2).toHaveStyle({ cursor: "grab" });
  },
};

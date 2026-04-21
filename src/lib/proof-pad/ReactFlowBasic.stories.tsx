/**
 * React Flow 基本動作確認ストーリー。
 * RF-001: @xyflow/react がプロジェクトで正常に動作することを確認する。
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

const initialNodes: readonly Node[] = [
  {
    id: "node-1",
    type: "default",
    position: { x: 100, y: 50 },
    data: { label: "Node A" },
  },
  {
    id: "node-2",
    type: "default",
    position: { x: 300, y: 50 },
    data: { label: "Node B" },
  },
  {
    id: "node-3",
    type: "default",
    position: { x: 200, y: 200 },
    data: { label: "Node C" },
  },
];

const initialEdges: readonly Edge[] = [
  { id: "edge-1-3", source: "node-1", target: "node-3" },
  { id: "edge-2-3", source: "node-2", target: "node-3" },
];

function ReactFlowBasicDemo(): React.JSX.Element {
  return (
    <div style={{ width: "100%", height: "100vh" }}>
      <ReactFlowProvider>
        <ReactFlow
          defaultNodes={[...initialNodes]}
          defaultEdges={[...initialEdges]}
          fitView
          proOptions={{ hideAttribution: true }}
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  );
}

const meta = {
  title: "ProofPad/ReactFlowBasic",
  component: ReactFlowBasicDemo,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof ReactFlowBasicDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // React Flow のコンテナが描画されていること
    const reactFlowContainer = canvasElement.querySelector(".react-flow");
    await expect(reactFlowContainer).toBeInTheDocument();

    // 3つのノードが描画されていること
    const nodeA = canvas.getByText("Node A");
    await expect(nodeA).toBeInTheDocument();
    const nodeB = canvas.getByText("Node B");
    await expect(nodeB).toBeInTheDocument();
    const nodeC = canvas.getByText("Node C");
    await expect(nodeC).toBeInTheDocument();

    // エッジが描画されていること (SVG path として存在)
    const edges = canvasElement.querySelectorAll(".react-flow__edge");
    await expect(edges.length).toBe(2);

    // Background が描画されていること
    const background = canvasElement.querySelector(".react-flow__background");
    await expect(background).toBeInTheDocument();

    // Controls が描画されていること
    const controls = canvasElement.querySelector(".react-flow__controls");
    await expect(controls).toBeInTheDocument();

    // MiniMap が描画されていること
    const minimap = canvasElement.querySelector(".react-flow__minimap");
    await expect(minimap).toBeInTheDocument();
  },
};

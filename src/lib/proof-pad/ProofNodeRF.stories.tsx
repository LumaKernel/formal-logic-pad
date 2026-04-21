/**
 * ProofNodeRF カスタムノードのストーリー。
 * RF-003: 各ノード状態（公理、導出、メモ）の表示を確認する。
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import {
  ReactFlow,
  ReactFlowProvider,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ProofNodeRF } from "./ProofNodeRF";
import type { ProofNodeData } from "./reactFlowAdapter";
import { AXIOM_PORTS, DERIVED_PORTS, NOTE_PORTS } from "./proofNodeUI";

const nodeTypes = { proofNode: ProofNodeRF } as const;

// --- ストーリーデータ ---

const axiomNode: Node<ProofNodeData> = {
  id: "axiom-1",
  type: "proofNode",
  position: { x: 150, y: 50 },
  data: {
    workspaceNode: {
      id: "axiom-1",
      kind: "axiom",
      label: "A1",
      formulaText: "φ → (ψ → φ)",
      position: { x: 150, y: 50 },
      role: "axiom",
    },
    classification: "root-axiom",
    ports: AXIOM_PORTS,
  },
};

const derivedNode: Node<ProofNodeData> = {
  id: "derived-1",
  type: "proofNode",
  position: { x: 150, y: 250 },
  data: {
    workspaceNode: {
      id: "derived-1",
      kind: "axiom",
      label: "MP",
      formulaText: "ψ → φ",
      position: { x: 150, y: 250 },
    },
    classification: "derived",
    ports: DERIVED_PORTS,
  },
};

const noteNode: Node<ProofNodeData> = {
  id: "note-1",
  type: "proofNode",
  position: { x: 400, y: 50 },
  data: {
    workspaceNode: {
      id: "note-1",
      kind: "note",
      label: "Note",
      formulaText: "This is a memo note",
      position: { x: 400, y: 50 },
    },
    classification: "note",
    ports: NOTE_PORTS,
  },
};

// --- ストーリーラッパー ---

function StoryWrapper({
  nodes,
  edges = [],
}: {
  readonly nodes: readonly Node<ProofNodeData>[];
  readonly edges?: readonly Edge[];
}): React.JSX.Element {
  return (
    <div style={{ width: "100%", height: "100vh" }}>
      <ReactFlowProvider>
        <ReactFlow
          defaultNodes={[...nodes]}
          defaultEdges={[...edges]}
          nodeTypes={nodeTypes}
          fitView
          proOptions={{ hideAttribution: true }}
        />
      </ReactFlowProvider>
    </div>
  );
}

// --- Meta ---

const meta = {
  title: "ProofPad/ProofNodeRF",
  component: StoryWrapper,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof StoryWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

// --- ストーリー ---

/** 公理ノード（root-axiom） */
export const Axiom: Story = {
  args: {
    nodes: [axiomNode],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // ノードが描画されていること
    const nodeEl = canvas.getByTestId("proof-node-rf-axiom-1");
    await expect(nodeEl).toBeInTheDocument();

    // ラベル "A1" が表示されていること
    const label = canvas.getByText("A1");
    await expect(label).toBeInTheDocument();

    // Handle が描画されていること（bottom の出力ポート）
    const handles = nodeEl.querySelectorAll(".react-flow__handle");
    await expect(handles.length).toBeGreaterThanOrEqual(1);
  },
};

/** 導出ノード */
export const Derived: Story = {
  args: {
    nodes: [axiomNode, derivedNode],
    edges: [
      {
        id: "edge-1",
        source: "axiom-1",
        target: "derived-1",
        sourceHandle: "out",
        targetHandle: "premise",
      },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // 導出ノードが描画されていること
    const nodeEl = canvas.getByTestId("proof-node-rf-derived-1");
    await expect(nodeEl).toBeInTheDocument();

    // ラベル "MP" が表示されていること
    const label = canvas.getByText("MP");
    await expect(label).toBeInTheDocument();

    // Handle が4つ（premise-left, premise-right, premise, out）
    const handles = nodeEl.querySelectorAll(".react-flow__handle");
    await expect(handles.length).toBe(4);
  },
};

/** メモノード（ポートなし） */
export const Note: Story = {
  args: {
    nodes: [noteNode],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // メモノードが描画されていること
    const nodeEl = canvas.getByTestId("proof-node-rf-note-1");
    await expect(nodeEl).toBeInTheDocument();

    // Handle がないこと（ポートなし）
    const handles = nodeEl.querySelectorAll(".react-flow__handle");
    await expect(handles.length).toBe(0);
  },
};

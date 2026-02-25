/**
 * FI-008: InfiniteCanvas + FormulaEditor 統合ストーリー。
 *
 * CanvasItem内にFormulaEditorを配置し、ドラッグと編集の干渉がないことを検証する。
 */

import { useState, useCallback } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { CanvasItem } from "./CanvasItem";
import { InfiniteCanvas } from "./InfiniteCanvas";
import type { Point, ViewportState } from "./types";
import { FormulaEditor } from "../formula-input/FormulaEditor";
import type { EditorMode } from "../formula-input/editorLogic";

// --- ノードデータ ---

interface FormulaNodeData {
  readonly id: string;
  readonly position: Point;
  readonly value: string;
  readonly label: string;
}

const INITIAL_NODES: readonly FormulaNodeData[] = [
  {
    id: "axiom1",
    position: { x: 100, y: 100 },
    value: "φ → (ψ → φ)",
    label: "Axiom 1",
  },
  {
    id: "axiom2",
    position: { x: 100, y: 250 },
    value: "∀x. P(x) → ∃y. Q(x, y)",
    label: "Axiom 2",
  },
];

// --- 統合デモコンポーネント ---

function FormulaNodeDemo() {
  const [viewport, setViewport] = useState<ViewportState>({
    offsetX: 0,
    offsetY: 0,
    scale: 1,
  });
  const [nodes, setNodes] = useState<readonly FormulaNodeData[]>(INITIAL_NODES);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);

  const handlePositionChange = useCallback((id: string, newPosition: Point) => {
    setNodes((prev) =>
      prev.map((node) =>
        node.id === id ? { ...node, position: newPosition } : node,
      ),
    );
  }, []);

  const handleValueChange = useCallback((id: string, newValue: string) => {
    setNodes((prev) =>
      prev.map((node) =>
        node.id === id ? { ...node, value: newValue } : node,
      ),
    );
  }, []);

  const handleModeChange = useCallback((id: string, mode: EditorMode) => {
    setEditingNodeId(mode === "editing" ? id : null);
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <InfiniteCanvas viewport={viewport} onViewportChange={setViewport}>
        {nodes.map((node) => (
          <CanvasItem
            key={node.id}
            position={node.position}
            viewport={viewport}
            onPositionChange={(pos) => {
              handlePositionChange(node.id, pos);
            }}
            dragEnabled={editingNodeId !== node.id}
          >
            <div
              data-testid={`node-${node.id satisfies string}`}
              style={{
                background: "#ffffff",
                border: "1px solid #d1d5db",
                borderRadius: 8,
                padding: "8px 12px",
                minWidth: 200,
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                userSelect: editingNodeId === node.id ? "text" : "none",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: "#6b7280",
                  marginBottom: 4,
                  fontFamily: "sans-serif",
                }}
              >
                {node.label}
              </div>
              <FormulaEditor
                value={node.value}
                onChange={(v) => {
                  handleValueChange(node.id, v);
                }}
                onModeChange={(mode) => {
                  handleModeChange(node.id, mode);
                }}
                testId={`editor-${node.id satisfies string}`}
                placeholder="Click to edit formula..."
              />
            </div>
          </CanvasItem>
        ))}
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
        editing: {editingNodeId ?? "none"} | scale: {viewport.scale.toFixed(2)}
      </div>
    </div>
  );
}

const meta = {
  title: "InfiniteCanvas/FormulaNodeIntegration",
  component: FormulaNodeDemo,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof FormulaNodeDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * FormulaEditorがCanvasItem内に配置され、編集モード切替とドラッグ制御が連動する。
 *
 * ドラッグ有効/無効のカーソル検証はユニットテスト (FormulaNodeIntegration.test.tsx) で実施。
 * ここでは、コンポーネントの表示とモード切替フローを検証する。
 */
export const Interactive: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // ノードが2つ表示されている
    const node1 = canvas.getByTestId("node-axiom1");
    const node2 = canvas.getByTestId("node-axiom2");
    await expect(node1).toBeInTheDocument();
    await expect(node2).toBeInTheDocument();

    // 表示モードの確認: FormulaEditorが表示モードで表示
    const editor1Display = canvas.getByTestId("editor-axiom1-display");
    await expect(editor1Display).toBeInTheDocument();

    // ステータスバー: 初期状態はediting: none
    const statusBar = canvas.getByTestId("status-bar");
    await expect(statusBar).toHaveTextContent("editing: none");

    // 編集モードに入る
    await userEvent.click(editor1Display);

    // 編集モードの確認
    await waitFor(() => {
      expect(canvas.getByTestId("editor-axiom1-edit")).toBeInTheDocument();
    });

    // ステータスバーにediting状態が反映される
    await waitFor(() => {
      expect(statusBar).toHaveTextContent("editing: axiom1");
    });

    // 入力して編集する
    const input = canvas.getByTestId("editor-axiom1-input-input");
    await userEvent.clear(input);
    await userEvent.type(input, "φ ∧ ψ");

    // Escapeで表示モードに戻る
    await userEvent.keyboard("{Escape}");

    // 表示モードに戻った
    await waitFor(() => {
      expect(canvas.getByTestId("editor-axiom1-display")).toBeInTheDocument();
    });

    // ステータスバーでediting解除
    await waitFor(() => {
      expect(statusBar).toHaveTextContent("editing: none");
    });
  },
};

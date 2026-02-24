/**
 * EditableProofNode ストーリー。
 *
 * 各種証明ノードの編集可能バージョンを表示。
 * play関数でモード切替・編集動作を検証。
 */

import { useState, useCallback } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { EditableProofNode } from "./EditableProofNode";
import type { ProofNodeKind } from "./proofNodeUI";
import { InfiniteCanvas } from "../infinite-canvas/InfiniteCanvas";
import { CanvasItem } from "../infinite-canvas/CanvasItem";
import type { Point, ViewportState } from "../infinite-canvas/types";
import type { EditorMode } from "../formula-input/editorLogic";

// --- デモコンポーネント ---

interface DemoNodeData {
  readonly id: string;
  readonly kind: ProofNodeKind;
  readonly label: string;
  readonly formulaText: string;
  readonly position: Point;
}

const DEMO_NODES: readonly DemoNodeData[] = [
  {
    id: "a1",
    kind: "axiom",
    label: "A1 (K)",
    formulaText: "φ → (ψ → φ)",
    position: { x: 50, y: 50 },
  },
  {
    id: "a2",
    kind: "axiom",
    label: "A2 (S)",
    formulaText: "(φ → (ψ → χ)) → ((φ → ψ) → (φ → χ))",
    position: { x: 50, y: 180 },
  },
  {
    id: "mp1",
    kind: "mp",
    label: "MP",
    formulaText: "(φ→(φ→φ)) → (φ→φ)",
    position: { x: 400, y: 50 },
  },
  {
    id: "result",
    kind: "conclusion",
    label: "Result",
    formulaText: "φ → φ",
    position: { x: 400, y: 180 },
  },
];

function EditableProofNodeDemo() {
  const [viewport, setViewport] = useState<ViewportState>({
    offsetX: 0,
    offsetY: 0,
    scale: 1,
  });
  const [nodes, setNodes] = useState<readonly DemoNodeData[]>(DEMO_NODES);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);

  const handlePositionChange = useCallback((id: string, newPosition: Point) => {
    setNodes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, position: newPosition } : n)),
    );
  }, []);

  const handleFormulaTextChange = useCallback((id: string, text: string) => {
    setNodes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, formulaText: text } : n)),
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
            <EditableProofNode
              id={node.id}
              kind={node.kind}
              label={node.label}
              formulaText={node.formulaText}
              onFormulaTextChange={handleFormulaTextChange}
              onModeChange={handleModeChange}
              testId={`node-${node.id satisfies string}`}
            />
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
        editing: {editingNodeId ?? "none"}
      </div>
    </div>
  );
}

// --- Storybook Meta ---

const meta = {
  title: "ProofPad/EditableProofNode",
  component: EditableProofNodeDemo,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof EditableProofNodeDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * キャンバス上に4種のノードを配置。
 * クリックで編集モードに入り、ESCで戻る。
 */
export const Interactive: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // 全4ノードが表示されている
    const a1 = canvas.getByTestId("node-a1");
    const a2 = canvas.getByTestId("node-a2");
    const mp1 = canvas.getByTestId("node-mp1");
    const result = canvas.getByTestId("node-result");

    await expect(a1).toBeInTheDocument();
    await expect(a2).toBeInTheDocument();
    await expect(mp1).toBeInTheDocument();
    await expect(result).toBeInTheDocument();

    // ラベルが表示されている
    await expect(a1).toHaveTextContent("A1 (K)");
    await expect(mp1).toHaveTextContent("MP");
    await expect(result).toHaveTextContent("Result");

    // ステータスバー: 初期状態
    const statusBar = canvas.getByTestId("status-bar");
    await expect(statusBar).toHaveTextContent("editing: none");

    // A1ノードの表示モードをクリックして編集モードに入る
    const a1Display = canvas.getByTestId("node-a1-editor-display");
    await userEvent.click(a1Display);

    await waitFor(() => {
      expect(canvas.getByTestId("node-a1-editor-edit")).toBeInTheDocument();
    });

    // ステータスバーが更新される
    await waitFor(() => {
      expect(statusBar).toHaveTextContent("editing: a1");
    });

    // ESCで戻る
    await userEvent.keyboard("{Escape}");

    await waitFor(() => {
      expect(canvas.getByTestId("node-a1-editor-display")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(statusBar).toHaveTextContent("editing: none");
    });
  },
};

/**
 * 読み取り専用モードのノード。
 * editable=false で FormulaEditor が表示されない。
 */
export const ReadOnly: Story = {
  render: () => (
    <div style={{ padding: 24, display: "flex", gap: 16, flexWrap: "wrap" }}>
      <EditableProofNode
        id="ro-axiom"
        kind="axiom"
        label="A1 (K)"
        formulaText="φ → (ψ → φ)"
        onFormulaTextChange={() => {}}
        editable={false}
        testId="ro-axiom"
      />
      <EditableProofNode
        id="ro-mp"
        kind="mp"
        label="MP"
        formulaText="(φ→(φ→φ)) → (φ→φ)"
        onFormulaTextChange={() => {}}
        editable={false}
        testId="ro-mp"
      />
      <EditableProofNode
        id="ro-conclusion"
        kind="conclusion"
        label="φ→φ"
        formulaText="φ → φ"
        onFormulaTextChange={() => {}}
        editable={false}
        testId="ro-conclusion"
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // 読み取り専用ではFormulaEditorが表示されない
    await expect(canvas.getByTestId("ro-axiom-formula")).toBeInTheDocument();
    await expect(canvas.getByTestId("ro-mp-formula")).toBeInTheDocument();
    await expect(
      canvas.getByTestId("ro-conclusion-formula"),
    ).toBeInTheDocument();

    // FormulaEditorのdisplayモード要素がない
    expect(
      canvas.queryByTestId("ro-axiom-editor-display"),
    ).not.toBeInTheDocument();
  },
};

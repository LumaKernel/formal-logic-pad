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
import type { DetailLevel, DetailVisibilityOverrides } from "./levelOfDetail";
import { InfiniteCanvas } from "../infinite-canvas/InfiniteCanvas";
import { CanvasItem } from "../infinite-canvas/CanvasItem";
import type { Point, ViewportState } from "../infinite-canvas/types";
import type { EditTrigger, EditorMode } from "../formula-input/editorLogic";

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
          fontFamily: "var(--font-mono)",
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

/**
 * Level-of-Detail デモ。
 * 3つのDetailLevel（full/compact/minimal）を横に並べて比較。
 */
export const LevelOfDetail: Story = {
  render: () => {
    const levels: readonly DetailLevel[] = ["full", "compact", "minimal"];
    return (
      <div style={{ padding: 24 }}>
        <div style={{ display: "flex", gap: 32, alignItems: "flex-start" }}>
          {levels.map((level) => (
            <div key={level}>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 14,
                  fontWeight: 700,
                  marginBottom: 12,
                  textTransform: "uppercase",
                }}
              >
                {level}
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                <EditableProofNode
                  id={`lod-axiom-${level satisfies string}`}
                  kind="axiom"
                  label="A1 (K)"
                  formulaText="φ → (ψ → φ)"
                  onFormulaTextChange={() => {}}
                  editable={false}
                  classification="root-axiom"
                  axiomName="A1 (K)"
                  detailLevel={level}
                  testId={`lod-axiom-${level satisfies string}`}
                />
                <EditableProofNode
                  id={`lod-mp-${level satisfies string}`}
                  kind="mp"
                  label="MP"
                  formulaText="(φ→(φ→φ)) → (φ→φ)"
                  onFormulaTextChange={() => {}}
                  editable={false}
                  statusMessage="MP successfully applied"
                  statusType="success"
                  classification="derived"
                  dependencies={[
                    { nodeId: "a1", displayName: "A1 (K)" },
                    { nodeId: "a2", displayName: "A2 (S)" },
                  ]}
                  detailLevel={level}
                  testId={`lod-mp-${level satisfies string}`}
                />
                <EditableProofNode
                  id={`lod-goal-${level satisfies string}`}
                  kind="conclusion"
                  label="Goal"
                  formulaText="φ → φ"
                  onFormulaTextChange={() => {}}
                  editable={false}
                  classification="root-goal"
                  isProtected={true}
                  detailLevel={level}
                  testId={`lod-goal-${level satisfies string}`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // full level shows all elements
    await expect(
      canvas.getByTestId("lod-axiom-full-role-badge"),
    ).toBeInTheDocument();
    await expect(
      canvas.getByTestId("lod-axiom-full-axiom-name"),
    ).toBeInTheDocument();
    await expect(canvas.getByTestId("lod-mp-full-status")).toBeInTheDocument();
    await expect(
      canvas.getByTestId("lod-mp-full-dependencies"),
    ).toBeInTheDocument();
    await expect(
      canvas.getByTestId("lod-goal-full-protected-badge"),
    ).toBeInTheDocument();

    // compact level hides badges/status/dependencies but shows formula
    expect(
      canvas.queryByTestId("lod-axiom-compact-role-badge"),
    ).not.toBeInTheDocument();
    expect(
      canvas.queryByTestId("lod-mp-compact-status"),
    ).not.toBeInTheDocument();
    expect(
      canvas.queryByTestId("lod-mp-compact-dependencies"),
    ).not.toBeInTheDocument();
    await expect(
      canvas.getByTestId("lod-mp-compact-formula"),
    ).toBeInTheDocument();

    // minimal level hides everything including formula
    expect(
      canvas.queryByTestId("lod-axiom-minimal-formula"),
    ).not.toBeInTheDocument();
    expect(
      canvas.queryByTestId("lod-mp-minimal-status"),
    ).not.toBeInTheDocument();
  },
};

// --- 編集トリガー比較 ---

interface TriggerDemoNodeData {
  readonly id: string;
  readonly kind: ProofNodeKind;
  readonly label: string;
  readonly formulaText: string;
  readonly position: Point;
}

function EditTriggerComparisonDemo({
  editTrigger,
  testIdPrefix,
}: {
  readonly editTrigger: EditTrigger;
  readonly testIdPrefix: string;
}) {
  const initialNodes: readonly TriggerDemoNodeData[] = [
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
  ];

  const [viewport, setViewport] = useState<ViewportState>({
    offsetX: 0,
    offsetY: 0,
    scale: 1,
  });
  const [nodes, setNodes] =
    useState<readonly TriggerDemoNodeData[]>(initialNodes);
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
    <div style={{ width: "100%", height: 300 }}>
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
              editTrigger={editTrigger}
              testId={`${testIdPrefix satisfies string}-${node.id satisfies string}`}
            />
          </CanvasItem>
        ))}
      </InfiniteCanvas>
      <div
        data-testid={`${testIdPrefix satisfies string}-status`}
        style={{
          position: "absolute",
          top: 4,
          left: 4,
          background: "rgba(0,0,0,0.7)",
          color: "#fff",
          padding: "2px 6px",
          borderRadius: 4,
          fontSize: 11,
          fontFamily: "var(--font-mono)",
          pointerEvents: "none",
        }}
      >
        {editTrigger}: editing={editingNodeId ?? "none"}
      </div>
    </div>
  );
}

/**
 * 編集トリガー比較: click / dblclick を並べて比較検討。
 * click: シングルクリックで即座に編集（現行動作）
 * dblclick: ダブルクリックで編集開始（シングルクリックは選択に使える）
 */
export const EditTriggerComparison: Story = {
  render: () => {
    const triggers: readonly EditTrigger[] = ["click", "dblclick"];
    const labels: Record<string, string> = {
      click: "シングルクリック（現行）",
      dblclick: "ダブルクリック",
    };
    return (
      <div style={{ padding: 16 }}>
        <div
          style={{
            fontFamily: "var(--font-ui)",
            fontSize: 16,
            fontWeight: 700,
            marginBottom: 16,
          }}
        >
          編集トリガー比較
        </div>
        {triggers.map((trigger) => (
          <div key={trigger} style={{ marginBottom: 24 }}>
            <div
              style={{
                fontFamily: "var(--font-ui)",
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 4,
              }}
            >
              {labels[trigger]} (editTrigger: &quot;{trigger}&quot;)
            </div>
            <div
              style={{
                position: "relative",
                border: "1px solid var(--color-node-card-border, #ddd)",
                borderRadius: 8,
              }}
            >
              <EditTriggerComparisonDemo
                editTrigger={trigger}
                testIdPrefix={`et-${trigger satisfies string}`}
              />
            </div>
          </div>
        ))}
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // 両方のキャンバスが表示されている
    await expect(canvas.getByTestId("et-click-status")).toBeInTheDocument();
    await expect(canvas.getByTestId("et-dblclick-status")).toBeInTheDocument();

    // clickモードのステータス初期表示
    await expect(canvas.getByTestId("et-click-status")).toHaveTextContent(
      "click: editing=none",
    );
    await expect(canvas.getByTestId("et-dblclick-status")).toHaveTextContent(
      "dblclick: editing=none",
    );
  },
};

// --- 依存情報表示オンオフ比較 ---

/**
 * 依存情報(Depends on)の表示をvisibilityOverridesで制御するデモ。
 * 同じノード構成で showDependencies: true / false を並べて比較。
 */
export const DependencyVisibilityToggle: Story = {
  render: () => {
    const deps = [
      { nodeId: "a1", displayName: "A1 (K)" },
      { nodeId: "a2", displayName: "A2 (S)" },
    ];
    const overrideOptions: readonly {
      readonly label: string;
      readonly overrides: DetailVisibilityOverrides | undefined;
      readonly testPrefix: string;
    }[] = [
      {
        label: "デフォルト (依存情報表示)",
        overrides: undefined,
        testPrefix: "dep-default",
      },
      {
        label: "依存情報非表示 (showDependencies: false)",
        overrides: { showDependencies: false },
        testPrefix: "dep-hidden",
      },
    ];

    return (
      <div style={{ padding: 24 }}>
        <div
          style={{
            fontFamily: "var(--font-ui)",
            fontSize: 16,
            fontWeight: 700,
            marginBottom: 16,
          }}
        >
          依存情報表示の設定比較
        </div>
        <div style={{ display: "flex", gap: 32, alignItems: "flex-start" }}>
          {overrideOptions.map((opt) => (
            <div key={opt.testPrefix}>
              <div
                style={{
                  fontFamily: "var(--font-ui)",
                  fontSize: 13,
                  fontWeight: 600,
                  marginBottom: 8,
                }}
              >
                {opt.label}
              </div>
              <EditableProofNode
                id="mp-node"
                kind="mp"
                label="MP"
                formulaText="ψ"
                onFormulaTextChange={() => {}}
                editable={false}
                isProtected
                statusMessage="MP successfully applied"
                statusType="success"
                classification="derived"
                dependencies={deps}
                detailLevel="full"
                visibilityOverrides={opt.overrides}
                testId={opt.testPrefix}
              />
            </div>
          ))}
        </div>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // デフォルト: 依存情報が表示されている
    await expect(
      canvas.getByTestId("dep-default-dependencies"),
    ).toBeInTheDocument();
    await expect(
      canvas.getByTestId("dep-default-dependencies"),
    ).toHaveTextContent("A1 (K)");

    // 非表示設定: 依存情報が表示されていない
    expect(
      canvas.queryByTestId("dep-hidden-dependencies"),
    ).not.toBeInTheDocument();

    // 非表示でも他の要素は正常に表示される
    await expect(canvas.getByTestId("dep-hidden-status")).toBeInTheDocument();
  },
};

import { useState, useCallback, useRef, useEffect } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within, userEvent } from "storybook/test";
import { Either } from "effect";
import { ScriptEditorComponent } from "./ScriptEditorComponent";
import { lukasiewiczSystem } from "@/lib/logic-core/inferenceRule";
import { ProofWorkspace } from "@/lib/proof-pad/ProofWorkspace";
import {
  createEmptyWorkspace,
  addNode,
  updateNodeFormulaText,
  updateNodeRole,
  removeNode,
  applyMPAndConnect,
  applyTreeLayout,
  addGoal,
} from "@/lib/proof-pad/workspaceState";
import type { WorkspaceState } from "@/lib/proof-pad/workspaceState";
import type { WorkspaceCommandHandler } from "@/lib/script-runner";

const meta = {
  title: "components/ScriptEditor",
  component: ScriptEditorComponent,
  args: {
    height: "300px",
  },
} satisfies Meta<typeof ScriptEditorComponent>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // ツールバーが表示される
    const toolbar = canvas.getByTestId("script-editor-toolbar");
    await expect(toolbar).toBeDefined();

    // ボタンが存在する
    const runButton = canvas.getByTestId("run-button");
    const stepButton = canvas.getByTestId("step-button");
    const playButton = canvas.getByTestId("play-button");
    const resetButton = canvas.getByTestId("reset-button");
    await expect(runButton).toBeDefined();
    await expect(stepButton).toBeDefined();
    await expect(playButton).toBeDefined();
    await expect(resetButton).toBeDefined();

    // 初期状態は Ready
    const status = canvas.getByTestId("execution-status");
    await expect(status.textContent).toBe("Ready");

    // Reset は idle 時に disabled
    await expect(resetButton.getAttribute("disabled")).toBe("");

    // 速度スライダーが表示される
    const speedBar = canvas.getByTestId("speed-bar");
    await expect(speedBar).toBeDefined();

    const speedSlider = canvas.getByTestId("speed-slider");
    await expect(speedSlider).toBeDefined();

    const speedValue = canvas.getByTestId("speed-value");
    await expect(speedValue.textContent).toContain("ms");
  },
};

export const WithCustomCode: Story = {
  args: {
    initialCode: `// カスタムコード
var f = parseFormula("phi -> psi");
console.log(formatFormula(f));`,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // エディタコンテナが存在する
    const editor = canvas.getByTestId("script-editor");
    await expect(editor).toBeDefined();

    // ツールバーが表示される
    const toolbar = canvas.getByTestId("script-editor-toolbar");
    await expect(toolbar).toBeDefined();

    // Run ボタンが有効
    const runButton = canvas.getByTestId("run-button");
    await expect(runButton.getAttribute("disabled")).toBeNull();

    // Play ボタンが有効
    const playButton = canvas.getByTestId("play-button");
    await expect(playButton.getAttribute("disabled")).toBeNull();
  },
};

export const WithSyntaxError: Story = {
  args: {
    initialCode: `// 構文エラーを含むコード
var x = 1;
function {`,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // エディタが表示される
    const editor = canvas.getByTestId("script-editor");
    await expect(editor).toBeDefined();

    // Run ボタンが有効（実行はブラウザ環境でjs-interpreterが非対応のため省略）
    const runButton = canvas.getByTestId("run-button");
    await expect(runButton.getAttribute("disabled")).toBeNull();
  },
};

export const WithRuntimeError: Story = {
  args: {
    initialCode: `// ランタイムエラーを含むコード
var x = 1;
null.property;`,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // エディタが表示される
    const editor = canvas.getByTestId("script-editor");
    await expect(editor).toBeDefined();

    // Run ボタンが有効
    const runButton = canvas.getByTestId("run-button");
    await expect(runButton.getAttribute("disabled")).toBeNull();
  },
};

// ── スクリプト保存・復元デモ ─────────────────────────────────────

let mockNowCounter = 1000;

export const SaveAndLoad: Story = {
  args: {
    initialCode: `// 保存テスト用コード
console.log("hello world");`,
    getNow: () => ++mockNowCounter,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Save ボタンが表示される
    const saveButton = canvas.getByTestId("save-script-button");
    await expect(saveButton).toBeDefined();
    await expect(saveButton.textContent).toBe("Save");

    // Save ボタンをクリック → ダイアログが開く
    await userEvent.click(saveButton);
    const dialog = canvas.getByTestId("save-dialog");
    await expect(dialog).toBeDefined();

    // タイトル入力
    const titleInput = canvas.getByTestId("save-title-input");
    await expect(titleInput).toBeDefined();
    await userEvent.type(titleInput, "My Test Script");

    // Save 確定ボタンをクリック
    const confirmButton = canvas.getByTestId("save-confirm-button");
    await userEvent.click(confirmButton);

    // ダイアログが閉じる
    const dialogAfterSave = canvas.queryByTestId("save-dialog");
    await expect(dialogAfterSave).toBeNull();

    // 保存されたスクリプトが表示される
    const savedItem = canvas.getByText("My Test Script");
    await expect(savedItem).toBeDefined();
  },
};

export const SaveDialogCancel: Story = {
  args: {
    initialCode: `// キャンセルテスト
console.log("cancel test");`,
    getNow: () => ++mockNowCounter,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Save ボタンをクリック
    await userEvent.click(canvas.getByTestId("save-script-button"));

    // ダイアログが開く
    await expect(canvas.getByTestId("save-dialog")).toBeDefined();

    // キャンセルボタンをクリック
    await userEvent.click(canvas.getByTestId("save-cancel-button"));

    // ダイアログが閉じる
    await expect(canvas.queryByTestId("save-dialog")).toBeNull();
  },
};

// ── ScriptEditor + ProofWorkspace 統合デモ ─────────────────────

/** 自動レイアウト用のデフォルトY座標間隔 */
const NODE_Y_SPACING = 120;

function ScriptEditorWithWorkspace() {
  const [workspace, setWorkspace] = useState<WorkspaceState>(() =>
    createEmptyWorkspace(lukasiewiczSystem),
  );

  // ワークスペースへの参照（ブリッジコールバックから最新状態を取得するため）
  const workspaceRef = useRef(workspace);
  useEffect(() => {
    workspaceRef.current = workspace;
  }, [workspace]);

  // 次のノード配置Y座標を計算
  const nextYRef = useRef(50);

  const handler: WorkspaceCommandHandler = useCallback(
    () => ({
      addNode: (formulaText: string) => {
        let ws = workspaceRef.current;
        const y = nextYRef.current;
        nextYRef.current += NODE_Y_SPACING;
        ws = addNode(ws, "axiom", "Node", { x: 200, y }, formulaText);
        const newNodeId = `node-${String(ws.nextNodeId - 1) satisfies string}`;
        setWorkspace(ws);
        return newNodeId;
      },
      setNodeFormula: (nodeId: string, formulaText: string) => {
        const ws = updateNodeFormulaText(
          workspaceRef.current,
          nodeId,
          formulaText,
        );
        setWorkspace(ws);
      },
      getNodes: () =>
        workspaceRef.current.nodes.map((n) => ({
          id: n.id,
          formulaText: n.formulaText,
          label: n.label,
          x: n.position.x,
          y: n.position.y,
        })),
      connectMP: (antecedentId: string, conditionalId: string) => {
        const y = nextYRef.current;
        nextYRef.current += NODE_Y_SPACING;
        const result = applyMPAndConnect(
          workspaceRef.current,
          antecedentId,
          conditionalId,
          { x: 200, y },
        );
        if (Either.isLeft(result.validation)) {
          const tag = result.validation.left._tag satisfies string;
          throw new Error(`Modus Ponens failed: ${tag satisfies string}`);
        }
        setWorkspace(result.workspace);
        return result.mpNodeId;
      },
      addGoal: (formulaText: string) => {
        const ws = addGoal(workspaceRef.current, formulaText);
        setWorkspace(ws);
      },
      removeNode: (nodeId: string) => {
        const ws = removeNode(workspaceRef.current, nodeId);
        setWorkspace(ws);
      },
      setNodeRoleAxiom: (nodeId: string) => {
        const ws = updateNodeRole(workspaceRef.current, nodeId, "axiom");
        setWorkspace(ws);
      },
      applyLayout: () => {
        const ws = applyTreeLayout(workspaceRef.current, "bottom-to-top");
        setWorkspace(ws);
      },
      clearWorkspace: () => {
        setWorkspace(createEmptyWorkspace(lukasiewiczSystem));
        nextYRef.current = 50;
      },
      getSelectedNodeIds: () => [],
    }),
    [],
  )();

  const handleWorkspaceChange = useCallback((ws: WorkspaceState) => {
    setWorkspace(ws);
  }, []);

  return (
    <div
      style={{ display: "flex", width: "100vw", height: "100vh" }}
      data-testid="script-workspace-integration"
    >
      <div
        style={{ width: "50%", height: "100%", borderRight: "1px solid #333" }}
      >
        <ScriptEditorComponent
          initialCode={`// ワークスペース操作デモ
// addNode, setNodeFormula, connectMP, applyLayout が使えます

// 公理を追加
var n1 = addNode("phi -> (psi -> phi)");
setNodeRoleAxiom(n1);

var n2 = addNode("phi");
setNodeRoleAxiom(n2);

// MP適用: phi と phi -> (psi -> phi) から psi -> phi を導出
var n3 = connectMP(n2, n1);

// ゴール設定
addGoal("psi -> phi");

// 自動レイアウト
applyLayout();

// 結果確認
var nodes = getNodes();
console.log("Nodes: " + nodes.length);
for (var i = 0; i < nodes.length; i++) {
  console.log(nodes[i].id + ": " + nodes[i].formulaText);
}`}
          height="100%"
          workspaceCommandHandler={handler}
        />
      </div>
      <div style={{ width: "50%", height: "100%" }}>
        <ProofWorkspace
          system={lukasiewiczSystem}
          workspace={workspace}
          onWorkspaceChange={handleWorkspaceChange}
          testId="proof-workspace"
        />
      </div>
    </div>
  );
}

export const WorkspaceIntegration: Story = {
  args: {
    height: "100%",
  },
  render: () => <ScriptEditorWithWorkspace />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // 統合コンテナが表示される
    const integration = canvas.getByTestId("script-workspace-integration");
    await expect(integration).toBeDefined();

    // ScriptEditorが表示される
    const editor = canvas.getByTestId("script-editor");
    await expect(editor).toBeDefined();

    // ProofWorkspaceが表示される
    const workspace = canvas.getByTestId("proof-workspace");
    await expect(workspace).toBeDefined();

    // ツールバーが表示される
    const toolbar = canvas.getByTestId("script-editor-toolbar");
    await expect(toolbar).toBeDefined();

    // Run ボタンが有効
    const runButton = canvas.getByTestId("run-button");
    await expect(runButton.getAttribute("disabled")).toBeNull();
  },
};

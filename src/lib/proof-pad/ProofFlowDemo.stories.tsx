/**
 * 証明フローデモストーリー。
 *
 * まっさらな状態から証明を組み立てる流れを実演するストーリー群。
 * Łukasiewicz公理系での φ→φ（恒等律）の証明をステップバイステップで構築。
 *
 * 証明手順（Łukasiewicz公理系）:
 *   Step 1. A1: φ → ((φ→φ) → φ)
 *   Step 2. A2: (φ → ((φ→φ) → φ)) → ((φ → (φ→φ)) → (φ → φ))
 *   Step 3. MP(1,2): (φ → (φ→φ)) → (φ → φ)
 *   Step 4. A1: φ → (φ→φ)
 *   Step 5. MP(4,3): φ → φ
 */

import { useState, useCallback } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within, userEvent } from "storybook/test";
import { lukasiewiczSystem } from "../logic-core/inferenceRule";
import { ProofWorkspace } from "./ProofWorkspace";
import {
  createEmptyWorkspace,
  addNode,
  applyMPAndConnect,
  updateNodeRole,
} from "./workspaceState";
import type { WorkspaceState } from "./workspaceState";

// --- φ→φ 完成済み証明 ---

function IdentityProofComplete() {
  const initial = (() => {
    // Step 1: A1インスタンス φ=phi, ψ=(phi→phi)
    let ws = createEmptyWorkspace(lukasiewiczSystem);
    ws = addNode(
      ws,
      "axiom",
      "A1①",
      { x: 50, y: 50 },
      "phi -> ((phi -> phi) -> phi)",
    );

    // Step 2: A2インスタンス φ=phi, ψ=(phi→phi), χ=phi
    ws = addNode(
      ws,
      "axiom",
      "A2",
      { x: 450, y: 50 },
      "(phi -> ((phi -> phi) -> phi)) -> ((phi -> (phi -> phi)) -> (phi -> phi))",
    );

    // Step 3: MP(1,2) → (φ → (φ→φ)) → (φ → φ)
    const mp1 = applyMPAndConnect(ws, "node-1", "node-2", { x: 250, y: 200 });
    ws = mp1.workspace;

    // Step 4: A1インスタンス φ=phi, ψ=phi
    ws = addNode(ws, "axiom", "A1②", { x: 50, y: 350 }, "phi -> (phi -> phi)");

    // Step 5: MP(4,3) → φ → φ
    const mp2 = applyMPAndConnect(ws, "node-4", "node-3", { x: 250, y: 500 });
    ws = mp2.workspace;

    // ゴール設定（ノードとして追加）
    ws = addNode(ws, "axiom", "Goal", { x: 450, y: 500 }, "phi -> phi");
    ws = updateNodeRole(ws, "node-6", "goal");

    return ws;
  })();

  const [workspace, setWorkspace] = useState<WorkspaceState>(initial);
  const handleChange = useCallback((ws: WorkspaceState) => {
    setWorkspace(ws);
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <ProofWorkspace
        system={lukasiewiczSystem}
        workspace={workspace}
        onWorkspaceChange={handleChange}
        testId="workspace"
      />
    </div>
  );
}

// --- φ→φ 途中まで（ユーザーがMP適用で完成させる） ---

function IdentityProofPartial() {
  const initial = (() => {
    // Step 1-3: A1, A2, MP(1,2) まで構築済み
    let ws = createEmptyWorkspace(lukasiewiczSystem);
    ws = addNode(
      ws,
      "axiom",
      "A1①",
      { x: 50, y: 50 },
      "phi -> ((phi -> phi) -> phi)",
    );
    ws = addNode(
      ws,
      "axiom",
      "A2",
      { x: 450, y: 50 },
      "(phi -> ((phi -> phi) -> phi)) -> ((phi -> (phi -> phi)) -> (phi -> phi))",
    );
    const mp1 = applyMPAndConnect(ws, "node-1", "node-2", { x: 250, y: 200 });
    ws = mp1.workspace;

    // Step 4: A1インスタンス（最後のMP適用待ち）
    ws = addNode(ws, "axiom", "A1②", { x: 50, y: 350 }, "phi -> (phi -> phi)");

    // ゴール設定（ノードとして追加）
    ws = addNode(ws, "axiom", "Goal", { x: 450, y: 350 }, "phi -> phi");
    ws = updateNodeRole(ws, "node-5", "goal");

    return ws;
  })();

  const [workspace, setWorkspace] = useState<WorkspaceState>(initial);
  const handleChange = useCallback((ws: WorkspaceState) => {
    setWorkspace(ws);
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <ProofWorkspace
        system={lukasiewiczSystem}
        workspace={workspace}
        onWorkspaceChange={handleChange}
        testId="workspace"
      />
    </div>
  );
}

// --- MP前提書き換え → MP無効化デモ ---

function MPPremiseEditInvalidation() {
  const initial = (() => {
    // phi + (phi -> psi) → MP → psi (成功状態)
    let ws = createEmptyWorkspace(lukasiewiczSystem);
    ws = addNode(ws, "axiom", "A1: φ", { x: 50, y: 50 }, "phi");
    ws = addNode(
      ws,
      "axiom",
      "A2: φ→ψ",
      { x: 350, y: 50 },
      "phi -> psi",
    );
    const mp = applyMPAndConnect(ws, "node-1", "node-2", { x: 200, y: 200 });
    ws = mp.workspace;
    return ws;
  })();

  const [workspace, setWorkspace] = useState<WorkspaceState>(initial);
  const handleChange = useCallback((ws: WorkspaceState) => {
    setWorkspace(ws);
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <ProofWorkspace
        system={lukasiewiczSystem}
        workspace={workspace}
        onWorkspaceChange={handleChange}
        testId="workspace"
      />
    </div>
  );
}

// --- MP連鎖失敗デモ ---

function MPCascadeFailure() {
  const initial = (() => {
    // 2段のMPチェーン:
    // phi + (phi -> psi) → MP1 → psi
    // psi(=MP1) + (psi -> chi) → MP2 → chi
    let ws = createEmptyWorkspace(lukasiewiczSystem);
    ws = addNode(ws, "axiom", "A1: φ", { x: 50, y: 50 }, "phi");
    ws = addNode(
      ws,
      "axiom",
      "A2: φ→ψ",
      { x: 350, y: 50 },
      "phi -> psi",
    );
    const mp1 = applyMPAndConnect(ws, "node-1", "node-2", {
      x: 200,
      y: 200,
    });
    ws = mp1.workspace;
    ws = addNode(
      ws,
      "axiom",
      "A3: ψ→χ",
      { x: 500, y: 200 },
      "psi -> chi",
    );
    const mp2 = applyMPAndConnect(ws, "node-3", "node-4", {
      x: 350,
      y: 350,
    });
    ws = mp2.workspace;
    return ws;
  })();

  const [workspace, setWorkspace] = useState<WorkspaceState>(initial);
  const handleChange = useCallback((ws: WorkspaceState) => {
    setWorkspace(ws);
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <ProofWorkspace
        system={lukasiewiczSystem}
        workspace={workspace}
        onWorkspaceChange={handleChange}
        testId="workspace"
      />
    </div>
  );
}

// --- Meta ---

const meta = {
  title: "ProofPad/ProofFlowDemo",
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * φ→φ（恒等律）の完成済み証明。
 *
 * 5ステップの証明がすべて構築済みで、ゴール「φ → φ」が達成されている状態。
 * 証明の全体像を確認するためのストーリー。
 */
export const IdentityProofCompleted: Story = {
  render: () => <IdentityProofComplete />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("workspace")).toBeInTheDocument();

    // 5つのノードが存在する
    await expect(canvas.getByTestId("proof-node-node-1")).toBeInTheDocument();
    await expect(canvas.getByTestId("proof-node-node-2")).toBeInTheDocument();
    await expect(canvas.getByTestId("proof-node-node-3")).toBeInTheDocument();
    await expect(canvas.getByTestId("proof-node-node-4")).toBeInTheDocument();
    await expect(canvas.getByTestId("proof-node-node-5")).toBeInTheDocument();

    // MP適用が成功している
    await expect(
      canvas.getByTestId("proof-node-node-3-status"),
    ).toHaveTextContent("MP applied");
    await expect(
      canvas.getByTestId("proof-node-node-5-status"),
    ).toHaveTextContent("MP applied");

    // ゴールノードが存在する
    await expect(canvas.getByTestId("proof-node-node-6")).toBeInTheDocument();

    // ゴールが達成されている（バナー表示）
    await expect(
      canvas.getByTestId("workspace-proof-complete-banner"),
    ).toBeInTheDocument();
  },
};

/**
 * φ→φ（恒等律）のインタラクティブ証明。
 *
 * 4つのノード（公理3つ + MP1つ）が配置済みで、最後のMP適用を
 * ユーザー操作（play関数）で行って証明を完成させるストーリー。
 * 実際の証明フローを体験できる。
 */
export const IdentityProofInteractive: Story = {
  render: () => <IdentityProofPartial />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("workspace")).toBeInTheDocument();

    // ゴールは未達成（バナーなし）
    await expect(
      canvas.queryByTestId("workspace-proof-complete-banner"),
    ).not.toBeInTheDocument();

    // 5つのノードが存在（Step 1-4 + Goal）
    await expect(canvas.getByTestId("proof-node-node-1")).toBeInTheDocument();
    await expect(canvas.getByTestId("proof-node-node-2")).toBeInTheDocument();
    await expect(canvas.getByTestId("proof-node-node-3")).toBeInTheDocument();
    await expect(canvas.getByTestId("proof-node-node-4")).toBeInTheDocument();
    await expect(canvas.getByTestId("proof-node-node-5")).toBeInTheDocument();

    // MP適用でStep 5を実行: node-4(左前提) と node-3(右前提) を選択
    await userEvent.click(canvas.getByTestId("workspace-mp-button"));
    await expect(canvas.getByTestId("workspace-mp-banner")).toHaveTextContent(
      "Click the left premise",
    );

    // 左前提: node-4 (φ → (φ→φ))
    await userEvent.click(canvas.getByTestId("proof-node-node-4"));
    await expect(canvas.getByTestId("workspace-mp-banner")).toHaveTextContent(
      "Click the right premise",
    );

    // 右前提: node-3 ((φ → (φ→φ)) → (φ → φ))
    await userEvent.click(canvas.getByTestId("proof-node-node-3"));

    // MPノードが生成された
    await expect(canvas.getByTestId("proof-node-node-6")).toBeInTheDocument();
    await expect(
      canvas.getByTestId("proof-node-node-6-status"),
    ).toHaveTextContent("MP applied");

    // ゴールが達成された！
    await expect(
      canvas.getByTestId("workspace-proof-complete-banner"),
    ).toBeInTheDocument();
  },
};

/**
 * MP前提書き換えによるMP無効化デモ。
 *
 * 初期状態: φ + (φ→ψ) → MP → ψ (成功)
 * play関数で公理ノードの式を書き換え、MPステータスがエラーに変わることを検証。
 */
export const MPPremiseEditInvalidates: Story = {
  render: () => <MPPremiseEditInvalidation />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("workspace")).toBeInTheDocument();

    // 初期状態: MP成功
    await expect(canvas.getByTestId("proof-node-node-1")).toBeInTheDocument();
    await expect(canvas.getByTestId("proof-node-node-2")).toBeInTheDocument();
    await expect(canvas.getByTestId("proof-node-node-3")).toBeInTheDocument();
    await expect(
      canvas.getByTestId("proof-node-node-3-status"),
    ).toHaveTextContent("MP applied");

    // node-1(φ)をクリックして編集モードに入る
    const display = canvas.getByTestId("proof-node-node-1-editor-display");
    await userEvent.click(display);

    // 入力欄をクリア → "chi" を入力
    const input = canvas.getByTestId("proof-node-node-1-editor-input-input");
    await userEvent.clear(input);
    await userEvent.type(input, "chi");

    // 編集確定（blurで確定）
    await userEvent.tab();

    // MP適用が失敗に変わる（chiはφ→ψの前件φと一致しない）
    await expect(
      canvas.getByTestId("proof-node-node-3-status"),
    ).toHaveTextContent("Left premise does not match");
  },
};

/**
 * MPチェーンの連鎖的失敗デモ。
 *
 * 初期状態:
 *   A1(φ) + A2(φ→ψ) → MP1(ψ) — 成功
 *   MP1(ψ) + A3(ψ→χ) → MP2(χ) — 成功
 *
 * play関数で A1 の式を書き換え:
 *   → MP1 が失敗（前提不一致）
 *   → MP1 の結論テキストがクリアされ、MP2 も連鎖的に失敗
 */
export const MPCascadeChainFailure: Story = {
  render: () => <MPCascadeFailure />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("workspace")).toBeInTheDocument();

    // 初期状態: 両方のMP成功
    await expect(
      canvas.getByTestId("proof-node-node-3-status"),
    ).toHaveTextContent("MP applied");
    await expect(
      canvas.getByTestId("proof-node-node-5-status"),
    ).toHaveTextContent("MP applied");

    // node-1(φ)をクリックして編集モードに入る
    const display = canvas.getByTestId("proof-node-node-1-editor-display");
    await userEvent.click(display);

    // 入力欄をクリア → "alpha" を入力
    const input = canvas.getByTestId("proof-node-node-1-editor-input-input");
    await userEvent.clear(input);
    await userEvent.type(input, "alpha");

    // 編集確定
    await userEvent.tab();

    // MP1が失敗（alpha ≠ phi）
    await expect(
      canvas.getByTestId("proof-node-node-3-status"),
    ).toHaveTextContent("Left premise does not match");

    // MP2も連鎖的に失敗（MP1の結論テキストがクリアされたため）
    await expect(
      canvas.getByTestId("proof-node-node-5-status"),
    ).toHaveTextContent("Left premise has invalid formula");
  },
};

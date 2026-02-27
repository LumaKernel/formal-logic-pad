/**
 * ペアノ算術(PA)体系の証明デモストーリー。
 *
 * PA体系で実際に問題を解く流れを実演するストーリー群。
 *
 * ストーリー一覧:
 * 1. PA1公理の配置（公理をそのまま定理として使う、最も簡単な例）
 * 2. 0+0=0 の完成済み証明（PA3 + A5 + MP で∀消去）
 * 3. 0+0=0 のインタラクティブ証明（ユーザーがMP適用で完成）
 * 4. ¬(S(0)=0) の完成済み証明（PA1 + A5 + MP で 1≠0 を導く）
 *
 * 証明パターン（∀消去）:
 *   Step 1. 理論公理: ∀x. φ(x)
 *   Step 2. A5インスタンス: (∀x. φ(x)) → φ(t)
 *   Step 3. MP(1,2): φ(t)
 */

import { useState, useCallback } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within, userEvent } from "storybook/test";
import { peanoArithmeticSystem } from "../logic-core/inferenceRule";
import { ProofWorkspace } from "./ProofWorkspace";
import {
  createEmptyWorkspace,
  addNode,
  addConnection,
  applyMPAndConnect,
  updateNodeRole,
} from "./workspaceState";
import type { WorkspaceState } from "./workspaceState";

// --- PA1公理の直接配置（完成済み） ---

function PA1AxiomComplete() {
  const initial = (() => {
    let ws = createEmptyWorkspace(peanoArithmeticSystem);
    // PA1: ∀x. ¬(S(x) = 0) をそのまま配置
    ws = addNode(ws, "axiom", "PA1", { x: 200, y: 100 }, "all x. ~(S(x) = 0)");
    // ゴールノードを追加して role を設定
    ws = addNode(ws, "axiom", "Goal", { x: 200, y: 250 }, "all x. ~(S(x) = 0)");
    ws = updateNodeRole(ws, "node-2", "goal");
    // 公理ノードからゴールノードへ接続して達成
    ws = addConnection(ws, "node-1", "output", "node-2", "input");
    return ws;
  })();

  const [workspace, setWorkspace] = useState<WorkspaceState>(initial);
  const handleChange = useCallback((ws: WorkspaceState) => {
    setWorkspace(ws);
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <ProofWorkspace
        system={peanoArithmeticSystem}
        workspace={workspace}
        onWorkspaceChange={handleChange}
        testId="workspace"
      />
    </div>
  );
}

// --- 0+0=0 完成済み証明 ---

function ZeroPlusZeroComplete() {
  const initial = (() => {
    let ws = createEmptyWorkspace(peanoArithmeticSystem);

    // Step 1: PA3 (加法基底): ∀x. x + 0 = x
    ws = addNode(ws, "axiom", "PA3", { x: 50, y: 50 }, "all x. x + 0 = x");

    // Step 2: A5インスタンス: (∀x. x + 0 = x) → 0 + 0 = 0
    ws = addNode(
      ws,
      "axiom",
      "A5",
      { x: 450, y: 50 },
      "(all x. x + 0 = x) -> 0 + 0 = 0",
    );

    // Step 3: MP(1,2) → 0 + 0 = 0
    const mp = applyMPAndConnect(ws, "node-1", "node-2", { x: 250, y: 250 });
    ws = mp.workspace;

    // ゴールノードを追加して role を設定
    ws = addNode(ws, "axiom", "Goal", { x: 450, y: 250 }, "0 + 0 = 0");
    ws = updateNodeRole(ws, "node-4", "goal");
    // MP結果ノードからゴールノードへ接続して達成
    ws = addConnection(ws, "node-3", "output", "node-4", "input");

    return ws;
  })();

  const [workspace, setWorkspace] = useState<WorkspaceState>(initial);
  const handleChange = useCallback((ws: WorkspaceState) => {
    setWorkspace(ws);
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <ProofWorkspace
        system={peanoArithmeticSystem}
        workspace={workspace}
        onWorkspaceChange={handleChange}
        testId="workspace"
      />
    </div>
  );
}

// --- 0+0=0 途中まで（ユーザーがMP適用で完成させる） ---

function ZeroPlusZeroPartial() {
  const initial = (() => {
    let ws = createEmptyWorkspace(peanoArithmeticSystem);

    // Step 1: PA3 (加法基底): ∀x. x + 0 = x
    ws = addNode(ws, "axiom", "PA3", { x: 50, y: 50 }, "all x. x + 0 = x");

    // Step 2: A5インスタンス: (∀x. x + 0 = x) → 0 + 0 = 0
    ws = addNode(
      ws,
      "axiom",
      "A5",
      { x: 450, y: 50 },
      "(all x. x + 0 = x) -> 0 + 0 = 0",
    );

    // ゴールノードを追加して role を設定（MP適用前）
    ws = addNode(ws, "axiom", "Goal", { x: 250, y: 200 }, "0 + 0 = 0");
    ws = updateNodeRole(ws, "node-3", "goal");

    return ws;
  })();

  const [workspace, setWorkspace] = useState<WorkspaceState>(initial);
  const handleChange = useCallback((ws: WorkspaceState) => {
    setWorkspace(ws);
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <ProofWorkspace
        system={peanoArithmeticSystem}
        workspace={workspace}
        onWorkspaceChange={handleChange}
        testId="workspace"
      />
    </div>
  );
}

// --- ¬(S(0)=0) 完成済み証明 ---

function SuccessorNotZeroComplete() {
  const initial = (() => {
    let ws = createEmptyWorkspace(peanoArithmeticSystem);

    // Step 1: PA1: ∀x. ¬(S(x) = 0)
    ws = addNode(ws, "axiom", "PA1", { x: 50, y: 50 }, "all x. ~(S(x) = 0)");

    // Step 2: A5インスタンス: (∀x. ¬(S(x) = 0)) → ¬(S(0) = 0)
    ws = addNode(
      ws,
      "axiom",
      "A5",
      { x: 450, y: 50 },
      "(all x. ~(S(x) = 0)) -> ~(S(0) = 0)",
    );

    // Step 3: MP(1,2) → ¬(S(0) = 0)
    const mp = applyMPAndConnect(ws, "node-1", "node-2", { x: 250, y: 250 });
    ws = mp.workspace;

    // ゴールノードを追加して role を設定
    ws = addNode(ws, "axiom", "Goal", { x: 450, y: 250 }, "~(S(0) = 0)");
    ws = updateNodeRole(ws, "node-4", "goal");
    // MP結果ノードからゴールノードへ接続して達成
    ws = addConnection(ws, "node-3", "output", "node-4", "input");

    return ws;
  })();

  const [workspace, setWorkspace] = useState<WorkspaceState>(initial);
  const handleChange = useCallback((ws: WorkspaceState) => {
    setWorkspace(ws);
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <ProofWorkspace
        system={peanoArithmeticSystem}
        workspace={workspace}
        onWorkspaceChange={handleChange}
        testId="workspace"
      />
    </div>
  );
}

// --- Meta ---

const meta = {
  title: "ProofPad/PeanoArithmeticDemo",
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * PA1公理の直接配置。
 *
 * ペアノ算術の公理PA1（∀x. ¬(S(x) = 0)）を公理パレットから配置し、
 * そのままゴールとして達成する最も簡単な例。
 */
export const PA1AxiomPlacement: Story = {
  render: () => <PA1AxiomComplete />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("workspace")).toBeInTheDocument();

    // PA体系が表示されている
    await expect(canvas.getByTestId("workspace-system")).toHaveTextContent(
      "Peano Arithmetic",
    );

    // 公理パレットにPA公理が表示されている
    await expect(
      canvas.getByTestId("workspace-axiom-palette"),
    ).toBeInTheDocument();
    await expect(
      canvas.getByTestId("workspace-axiom-palette-item-PA1"),
    ).toBeInTheDocument();

    // PA1ノードが配置されている
    await expect(canvas.getByTestId("proof-node-node-1")).toBeInTheDocument();

    // ゴールノードが配置されている
    await expect(canvas.getByTestId("proof-node-node-2")).toBeInTheDocument();

    // 証明完成バナーが表示されている
    await expect(
      canvas.getByTestId("workspace-proof-complete-banner"),
    ).toBeInTheDocument();
  },
};

/**
 * 0+0=0 の完成済み証明。
 *
 * PA3（加法基底: ∀x. x+0=x）をA5（∀消去）でインスタンス化し、
 * MPで 0+0=0 を導出する。形式算術における「計算」の基本パターン。
 *
 * 証明手順:
 *   Step 1. PA3: ∀x. x + 0 = x
 *   Step 2. A5:  (∀x. x + 0 = x) → 0 + 0 = 0
 *   Step 3. MP(1,2): 0 + 0 = 0
 */
export const ZeroPlusZeroCompleted: Story = {
  render: () => <ZeroPlusZeroComplete />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("workspace")).toBeInTheDocument();

    // 3つの証明ノードが存在する
    await expect(canvas.getByTestId("proof-node-node-1")).toBeInTheDocument();
    await expect(canvas.getByTestId("proof-node-node-2")).toBeInTheDocument();
    await expect(canvas.getByTestId("proof-node-node-3")).toBeInTheDocument();

    // MP適用が成功している
    await expect(
      canvas.getByTestId("proof-node-node-3-status"),
    ).toHaveTextContent("MP applied");

    // ゴールノードが配置されている
    await expect(canvas.getByTestId("proof-node-node-4")).toBeInTheDocument();

    // 証明完成バナーが表示されている
    await expect(
      canvas.getByTestId("workspace-proof-complete-banner"),
    ).toBeInTheDocument();
  },
};

/**
 * 0+0=0 のインタラクティブ証明。
 *
 * PA3とA5が配置済みで、ユーザーがMP適用で証明を完成させる。
 * play関数で左前提(PA3) → 右前提(A5) の順にクリックして
 * MPを適用し、0+0=0 を導出する。
 */
export const ZeroPlusZeroInteractive: Story = {
  render: () => <ZeroPlusZeroPartial />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("workspace")).toBeInTheDocument();

    // 証明完成バナーは未表示
    await expect(
      canvas.queryByTestId("workspace-proof-complete-banner"),
    ).not.toBeInTheDocument();

    // 2つの証明ノードとゴールノードが存在（PA3, A5, Goal）
    await expect(canvas.getByTestId("proof-node-node-1")).toBeInTheDocument();
    await expect(canvas.getByTestId("proof-node-node-2")).toBeInTheDocument();
    await expect(canvas.getByTestId("proof-node-node-3")).toBeInTheDocument();

    // MP適用でStep 3を実行: node-1(左前提: PA3) と node-2(右前提: A5) を選択
    await userEvent.click(canvas.getByTestId("workspace-mp-button"));
    await expect(canvas.getByTestId("workspace-mp-banner")).toHaveTextContent(
      "Click the left premise",
    );

    // 左前提: node-1 (∀x. x + 0 = x)
    await userEvent.click(canvas.getByTestId("proof-node-node-1"));
    await expect(canvas.getByTestId("workspace-mp-banner")).toHaveTextContent(
      "Click the right premise",
    );

    // 右前提: node-2 ((∀x. x + 0 = x) → 0 + 0 = 0)
    await userEvent.click(canvas.getByTestId("proof-node-node-2"));

    // MPノードが生成された（ゴールノードがnode-3なので、MPノードはnode-4）
    await expect(canvas.getByTestId("proof-node-node-4")).toBeInTheDocument();
    await expect(
      canvas.getByTestId("proof-node-node-4-status"),
    ).toHaveTextContent("MP applied");

    // ゴールノードへの接続はまだないため、Proof Completeにはならない
    await expect(
      canvas.queryByTestId("workspace-proof-complete-banner"),
    ).not.toBeInTheDocument();
  },
};

/**
 * ¬(S(0) = 0) の完成済み証明（1≠0）。
 *
 * PA1（∀x. ¬(S(x)=0)）をA5で x=0 にインスタンス化し、
 * MPで ¬(S(0)=0) を導出する。「1は0ではない」という自然数論の基本事実。
 *
 * 証明手順:
 *   Step 1. PA1: ∀x. ¬(S(x) = 0)
 *   Step 2. A5:  (∀x. ¬(S(x) = 0)) → ¬(S(0) = 0)
 *   Step 3. MP(1,2): ¬(S(0) = 0)
 */
export const SuccessorNotZeroProof: Story = {
  render: () => <SuccessorNotZeroComplete />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("workspace")).toBeInTheDocument();

    // 3つの証明ノードが存在する
    await expect(canvas.getByTestId("proof-node-node-1")).toBeInTheDocument();
    await expect(canvas.getByTestId("proof-node-node-2")).toBeInTheDocument();
    await expect(canvas.getByTestId("proof-node-node-3")).toBeInTheDocument();

    // MP適用が成功している
    await expect(
      canvas.getByTestId("proof-node-node-3-status"),
    ).toHaveTextContent("MP applied");

    // ゴールノードが配置されている
    await expect(canvas.getByTestId("proof-node-node-4")).toBeInTheDocument();

    // 証明完成バナーが表示されている
    await expect(
      canvas.getByTestId("workspace-proof-complete-banner"),
    ).toBeInTheDocument();
  },
};

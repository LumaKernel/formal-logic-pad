/**
 * 群論(Group Theory)体系の証明デモストーリー。
 *
 * 群論の公理を使って実際に問題を解く流れを実演するストーリー群。
 *
 * ストーリー一覧:
 * 1. G1公理の配置（結合律をそのまま定理として使う、最も簡単な例）
 * 2. e*e=e の完成済み証明（G2L + A5 + MP で∀消去）
 * 3. e*e=e のインタラクティブ証明（ユーザーがMP適用で完成）
 * 4. i(e)*e=e の完成済み証明（G3L + A5 + MP で逆元の∀消去）
 *
 * 証明パターン（∀消去）:
 *   Step 1. 理論公理: ∀x. φ(x)
 *   Step 2. A5インスタンス: (∀x. φ(x)) → φ(t)
 *   Step 3. MP(1,2): φ(t)
 */

import { useState, useCallback } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within, userEvent } from "storybook/test";
import { groupTheoryFullSystem } from "../logic-core/inferenceRule";
import { ProofWorkspace } from "./ProofWorkspace";
import {
  createEmptyWorkspace,
  addNode,
  addConnection,
  applyMPAndConnect,
  updateNodeRole,
} from "./workspaceState";
import type { WorkspaceState } from "./workspaceState";

// --- G1公理の直接配置（完成済み） ---

function G1AssociativityComplete() {
  const initial = (() => {
    let ws = createEmptyWorkspace(groupTheoryFullSystem);
    // node-1: G1: ∀x.∀y.∀z. (x * y) * z = x * (y * z) をそのまま配置
    ws = addNode(
      ws,
      "axiom",
      "Axiom",
      { x: 200, y: 100 },
      "all x. all y. all z. (x * y) * z = x * (y * z)",
    );
    // node-2: ゴールノード
    ws = addNode(
      ws,
      "axiom",
      "Goal",
      { x: 200, y: 250 },
      "all x. all y. all z. (x * y) * z = x * (y * z)",
    );
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
        system={groupTheoryFullSystem}
        workspace={workspace}
        onWorkspaceChange={handleChange}
        testId="workspace"
      />
    </div>
  );
}

// --- e*e=e 完成済み証明 ---

function IdentityTimesIdentityComplete() {
  const initial = (() => {
    let ws = createEmptyWorkspace(groupTheoryFullSystem);

    // Step 1: node-1: G2L (左単位元): ∀x. e * x = x
    ws = addNode(ws, "axiom", "Axiom", { x: 50, y: 50 }, "all x. e * x = x");

    // Step 2: node-2: A5インスタンス: (∀x. e * x = x) → e * e = e
    ws = addNode(
      ws,
      "axiom",
      "Axiom",
      { x: 450, y: 50 },
      "(all x. e * x = x) -> e * e = e",
    );

    // Step 3: node-3: MP(1,2) → e * e = e
    const mp = applyMPAndConnect(ws, "node-1", "node-2", { x: 250, y: 250 });
    ws = mp.workspace;

    // node-4: ゴールノード
    ws = addNode(ws, "axiom", "Goal", { x: 450, y: 250 }, "e * e = e");
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
        system={groupTheoryFullSystem}
        workspace={workspace}
        onWorkspaceChange={handleChange}
        testId="workspace"
      />
    </div>
  );
}

// --- e*e=e 途中まで（ユーザーがMP適用で完成させる） ---

function IdentityTimesIdentityPartial() {
  const initial = (() => {
    let ws = createEmptyWorkspace(groupTheoryFullSystem);

    // Step 1: node-1: G2L (左単位元): ∀x. e * x = x
    ws = addNode(ws, "axiom", "Axiom", { x: 50, y: 50 }, "all x. e * x = x");

    // Step 2: node-2: A5インスタンス: (∀x. e * x = x) → e * e = e
    ws = addNode(
      ws,
      "axiom",
      "Axiom",
      { x: 450, y: 50 },
      "(all x. e * x = x) -> e * e = e",
    );

    // node-3: ゴールノード（MP適用前）
    ws = addNode(ws, "axiom", "Goal", { x: 250, y: 200 }, "e * e = e");
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
        system={groupTheoryFullSystem}
        workspace={workspace}
        onWorkspaceChange={handleChange}
        testId="workspace"
      />
    </div>
  );
}

// --- i(e)*e=e 完成済み証明 ---

function InverseIdentityComplete() {
  const initial = (() => {
    let ws = createEmptyWorkspace(groupTheoryFullSystem);

    // Step 1: node-1: G3L (左逆元): ∀x. i(x) * x = e
    ws = addNode(ws, "axiom", "Axiom", { x: 50, y: 50 }, "all x. i(x) * x = e");

    // Step 2: node-2: A5インスタンス: (∀x. i(x) * x = e) → i(e) * e = e
    ws = addNode(
      ws,
      "axiom",
      "Axiom",
      { x: 450, y: 50 },
      "(all x. i(x) * x = e) -> i(e) * e = e",
    );

    // Step 3: node-3: MP(1,2) → i(e) * e = e
    const mp = applyMPAndConnect(ws, "node-1", "node-2", { x: 250, y: 250 });
    ws = mp.workspace;

    // node-4: ゴールノード
    ws = addNode(ws, "axiom", "Goal", { x: 450, y: 250 }, "i(e) * e = e");
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
        system={groupTheoryFullSystem}
        workspace={workspace}
        onWorkspaceChange={handleChange}
        testId="workspace"
      />
    </div>
  );
}

// --- Meta ---

const meta = {
  title: "ProofPad/GroupTheoryDemo",
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * G1公理の直接配置。
 *
 * 群論の公理G1（結合律: ∀x.∀y.∀z. (x*y)*z = x*(y*z)）を
 * 公理パレットから配置し、そのままゴールとして達成する最も簡単な例。
 */
export const G1AssociativityPlacement: Story = {
  render: () => <G1AssociativityComplete />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("workspace")).toBeInTheDocument();

    // 群論体系が表示されている
    await expect(canvas.getByTestId("workspace-system")).toHaveTextContent(
      "Group Theory (Full Axioms)",
    );

    // 公理パレットに群論公理が表示されている
    await expect(
      canvas.getByTestId("workspace-axiom-palette"),
    ).toBeInTheDocument();
    await expect(
      canvas.getByTestId(
        `workspace-axiom-palette-item-${"G1" satisfies string}`,
      ),
    ).toBeInTheDocument();

    // G1ノードが配置されている
    await expect(
      canvas.getByTestId(`proof-node-${"node-1" satisfies string}`),
    ).toBeInTheDocument();

    // ゴールノードが配置されている
    await expect(
      canvas.getByTestId(`proof-node-${"node-2" satisfies string}`),
    ).toBeInTheDocument();

    // 証明完了バナーが表示されている
    await expect(
      canvas.getByTestId("workspace-proof-complete-banner"),
    ).toBeInTheDocument();
  },
};

/**
 * e*e=e の完成済み証明。
 *
 * G2L（左単位元: ∀x. e*x=x）をA5（∀消去）でインスタンス化し、
 * MPで e*e=e を導出する。群論における「単位元の自己乗算」の基本事実。
 *
 * 証明手順:
 *   Step 1. G2L: ∀x. e * x = x
 *   Step 2. A5:  (∀x. e * x = x) → e * e = e
 *   Step 3. MP(1,2): e * e = e
 */
export const IdentityTimesIdentityCompleted: Story = {
  render: () => <IdentityTimesIdentityComplete />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("workspace")).toBeInTheDocument();

    // 3つの証明ノード + ゴールノードが存在する
    await expect(
      canvas.getByTestId(`proof-node-${"node-1" satisfies string}`),
    ).toBeInTheDocument();
    await expect(
      canvas.getByTestId(`proof-node-${"node-2" satisfies string}`),
    ).toBeInTheDocument();
    await expect(
      canvas.getByTestId(`proof-node-${"node-3" satisfies string}`),
    ).toBeInTheDocument();
    await expect(
      canvas.getByTestId(`proof-node-${"node-4" satisfies string}`),
    ).toBeInTheDocument();

    // MP適用が成功している
    await expect(
      canvas.getByTestId(`proof-node-${"node-3" satisfies string}-status`),
    ).toHaveTextContent("MP applied");

    // 証明完了バナーが表示されている
    await expect(
      canvas.getByTestId("workspace-proof-complete-banner"),
    ).toBeInTheDocument();
  },
};

/**
 * e*e=e のインタラクティブ証明。
 *
 * G2LとA5が配置済みで、ユーザーがMP適用で証明を完成させる。
 * play関数で左前提(G2L) → 右前提(A5) の順にクリックして
 * MPを適用し、e*e=e を導出する。
 */
export const IdentityTimesIdentityInteractive: Story = {
  render: () => <IdentityTimesIdentityPartial />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("workspace")).toBeInTheDocument();

    // 証明完了バナーは未表示
    await expect(
      canvas.queryByTestId("workspace-proof-complete-banner"),
    ).not.toBeInTheDocument();

    // 2つの証明ノード + ゴールノードが存在（G2L, A5, Goal）
    await expect(
      canvas.getByTestId(`proof-node-${"node-1" satisfies string}`),
    ).toBeInTheDocument();
    await expect(
      canvas.getByTestId(`proof-node-${"node-2" satisfies string}`),
    ).toBeInTheDocument();
    await expect(
      canvas.getByTestId(`proof-node-${"node-3" satisfies string}`),
    ).toBeInTheDocument();

    // MP適用でStep 3を実行: node-1(左前提: G2L) と node-2(右前提: A5) を選択
    await userEvent.click(canvas.getByTestId("workspace-mp-button"));
    await expect(canvas.getByTestId("workspace-mp-banner")).toHaveTextContent(
      "Click the left premise",
    );

    // 左前提: node-1 (∀x. e * x = x)
    await userEvent.click(
      canvas.getByTestId(`proof-node-${"node-1" satisfies string}`),
    );
    await expect(canvas.getByTestId("workspace-mp-banner")).toHaveTextContent(
      "Click the right premise",
    );

    // 右前提: node-2 ((∀x. e * x = x) → e * e = e)
    await userEvent.click(
      canvas.getByTestId(`proof-node-${"node-2" satisfies string}`),
    );

    // MPノードが生成された（node-4: ゴールノードがnode-3なので、MPはnode-4になる）
    await expect(
      canvas.getByTestId(`proof-node-${"node-4" satisfies string}`),
    ).toBeInTheDocument();
    await expect(
      canvas.getByTestId(`proof-node-${"node-4" satisfies string}-status`),
    ).toHaveTextContent("MP applied");

    // ゴールノードへの接続はまだないため、Proof Completeにはならない
    await expect(
      canvas.queryByTestId("workspace-proof-complete-banner"),
    ).not.toBeInTheDocument();
  },
};

/**
 * i(e)*e=e の完成済み証明（逆元の単位元への適用）。
 *
 * G3L（左逆元: ∀x. i(x)*x=e）をA5で x=e にインスタンス化し、
 * MPで i(e)*e=e を導出する。「単位元の逆元を単位元に左から乗じると単位元」。
 *
 * 証明手順:
 *   Step 1. G3L: ∀x. i(x) * x = e
 *   Step 2. A5:  (∀x. i(x) * x = e) → i(e) * e = e
 *   Step 3. MP(1,2): i(e) * e = e
 */
export const InverseIdentityProof: Story = {
  render: () => <InverseIdentityComplete />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("workspace")).toBeInTheDocument();

    // 3つの証明ノード + ゴールノードが存在する
    await expect(
      canvas.getByTestId(`proof-node-${"node-1" satisfies string}`),
    ).toBeInTheDocument();
    await expect(
      canvas.getByTestId(`proof-node-${"node-2" satisfies string}`),
    ).toBeInTheDocument();
    await expect(
      canvas.getByTestId(`proof-node-${"node-3" satisfies string}`),
    ).toBeInTheDocument();
    await expect(
      canvas.getByTestId(`proof-node-${"node-4" satisfies string}`),
    ).toBeInTheDocument();

    // MP適用が成功している
    await expect(
      canvas.getByTestId(`proof-node-${"node-3" satisfies string}-status`),
    ).toHaveTextContent("MP applied");

    // 証明完了バナーが表示されている
    await expect(
      canvas.getByTestId("workspace-proof-complete-banner"),
    ).toBeInTheDocument();
  },
};

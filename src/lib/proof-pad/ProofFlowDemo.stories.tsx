/**
 * 証明フローデモストーリー。
 *
 * まっさらな状態から証明を組み立てる流れを実演するストーリー群。
 * Łukasiewicz公理系での φ→φ（恒等律）の証明をステップバイステップで構築。
 * 公理スキーマ → 代入操作 → インスタンスの厳密なパターンで構築。
 *
 * 証明手順（Łukasiewicz公理系）:
 *   Step 1. A1スキーマ → 代入[ψ:=(φ→φ)] → φ → ((φ→φ) → φ)
 *   Step 2. A2スキーマ → 代入[ψ:=(φ→φ), χ:=φ] → A2インスタンス
 *   Step 3. MP(1,2): (φ → (φ→φ)) → (φ → φ)
 *   Step 4. A1スキーマ → 代入[ψ:=φ] → φ → (φ→φ)
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
  addGoal,
  applyMPAndConnect,
  applySubstitutionAndConnect,
} from "./workspaceState";
import type { WorkspaceState } from "./workspaceState";

// --- φ→φ 完成済み証明 ---

function IdentityProofComplete() {
  const initial = (() => {
    // 公理スキーマ → 代入操作 → インスタンスの厳密なパターンで構築
    let ws = createEmptyWorkspace(lukasiewiczSystem);

    // Step 1: A1スキーマ φ → (ψ → φ)
    ws = addNode(ws, "axiom", "Axiom", { x: 50, y: 0 }, "phi -> (psi -> phi)");
    // node-1: A1 schema

    // Step 1b: 代入 ψ := (phi → phi) → φ → ((φ→φ) → φ)
    const subst1 = applySubstitutionAndConnect(
      ws,
      "node-1",
      [
        {
          _tag: "FormulaSubstitution",
          metaVariableName: "ψ",
          formulaText: "phi -> phi",
        },
      ],
      { x: 50, y: 60 },
    );
    ws = subst1.workspace;
    // node-2: A1 instance φ → ((φ→φ) → φ)

    // Step 2: A2スキーマ (φ → (ψ → χ)) → ((φ → ψ) → (φ → χ))
    ws = addNode(
      ws,
      "axiom",
      "Axiom",
      { x: 500, y: 0 },
      "(phi -> (psi -> chi)) -> ((phi -> psi) -> (phi -> chi))",
    );
    // node-3: A2 schema

    // Step 2b: 代入 ψ := (phi → phi), χ := phi
    const subst2 = applySubstitutionAndConnect(
      ws,
      "node-3",
      [
        {
          _tag: "FormulaSubstitution",
          metaVariableName: "ψ",
          formulaText: "phi -> phi",
        },
        {
          _tag: "FormulaSubstitution",
          metaVariableName: "χ",
          formulaText: "phi",
        },
      ],
      { x: 500, y: 60 },
    );
    ws = subst2.workspace;
    // node-4: A2 instance

    // Step 3: MP(subst1, subst2) → (φ → (φ→φ)) → (φ → φ)
    const mp1 = applyMPAndConnect(ws, "node-2", "node-4", {
      x: 280,
      y: 120,
    });
    ws = mp1.workspace;
    // node-5: MP result

    // Step 4: A1スキーマ（2回目）
    ws = addNode(
      ws,
      "axiom",
      "Axiom",
      { x: 50, y: 120 },
      "phi -> (psi -> phi)",
    );
    // node-6: A1 schema

    // Step 4b: 代入 ψ := phi → φ → (φ → φ)
    const subst3 = applySubstitutionAndConnect(
      ws,
      "node-6",
      [
        {
          _tag: "FormulaSubstitution",
          metaVariableName: "ψ",
          formulaText: "phi",
        },
      ],
      { x: 50, y: 180 },
    );
    ws = subst3.workspace;
    // node-7: A1 instance φ → (φ → φ)

    // Step 5: MP(subst3, mp1) → φ → φ
    const mp2 = applyMPAndConnect(ws, "node-7", "node-5", {
      x: 280,
      y: 240,
    });
    ws = mp2.workspace;
    // node-8: MP result φ → φ

    // ゴール設定
    ws = addGoal(ws, "phi -> phi");

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
    // Step 1-3: A1スキーマ→代入, A2スキーマ→代入, MP まで構築済み
    let ws = createEmptyWorkspace(lukasiewiczSystem);

    // Step 1: A1スキーマ + 代入
    ws = addNode(ws, "axiom", "Axiom", { x: 50, y: 0 }, "phi -> (psi -> phi)");
    const subst1 = applySubstitutionAndConnect(
      ws,
      "node-1",
      [
        {
          _tag: "FormulaSubstitution",
          metaVariableName: "ψ",
          formulaText: "phi -> phi",
        },
      ],
      { x: 50, y: 60 },
    );
    ws = subst1.workspace;
    // node-2: A1 instance

    // Step 2: A2スキーマ + 代入
    ws = addNode(
      ws,
      "axiom",
      "Axiom",
      { x: 500, y: 0 },
      "(phi -> (psi -> chi)) -> ((phi -> psi) -> (phi -> chi))",
    );
    const subst2 = applySubstitutionAndConnect(
      ws,
      "node-3",
      [
        {
          _tag: "FormulaSubstitution",
          metaVariableName: "ψ",
          formulaText: "phi -> phi",
        },
        {
          _tag: "FormulaSubstitution",
          metaVariableName: "χ",
          formulaText: "phi",
        },
      ],
      { x: 500, y: 60 },
    );
    ws = subst2.workspace;
    // node-4: A2 instance

    // Step 3: MP(subst1, subst2)
    const mp1 = applyMPAndConnect(ws, "node-2", "node-4", {
      x: 280,
      y: 120,
    });
    ws = mp1.workspace;
    // node-5: MP result

    // Step 4: A1スキーマ（2回目）+ 代入（最後のMP適用待ち）
    ws = addNode(
      ws,
      "axiom",
      "Axiom",
      { x: 50, y: 120 },
      "phi -> (psi -> phi)",
    );
    // node-6: A1 schema
    const subst3 = applySubstitutionAndConnect(
      ws,
      "node-6",
      [
        {
          _tag: "FormulaSubstitution",
          metaVariableName: "ψ",
          formulaText: "phi",
        },
      ],
      { x: 50, y: 180 },
    );
    ws = subst3.workspace;
    // node-7: A1 instance φ → (φ → φ)

    // ゴール設定
    ws = addGoal(ws, "phi -> phi");

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
    ws = addNode(ws, "axiom", "Axiom", { x: 50, y: 50 }, "phi");
    ws = addNode(ws, "axiom", "Axiom", { x: 350, y: 50 }, "phi -> psi");
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
    ws = addNode(ws, "axiom", "Axiom", { x: 50, y: 50 }, "phi");
    ws = addNode(ws, "axiom", "Axiom", { x: 350, y: 50 }, "phi -> psi");
    const mp1 = applyMPAndConnect(ws, "node-1", "node-2", {
      x: 200,
      y: 200,
    });
    ws = mp1.workspace;
    ws = addNode(ws, "axiom", "Axiom", { x: 500, y: 200 }, "psi -> chi");
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

// --- 巨大な証明木デモ ---

function LargeProofTreeDemo() {
  const initial = (() => {
    // φ→φの証明をベースに、A1で2段チェーン拡張する巨大証明木
    // 公理スキーマ → 代入操作 → インスタンスの厳密なパターンで構築
    // 合計14ノード（公理スキーマ5 + 代入5 + MP4）

    let ws = createEmptyWorkspace(lukasiewiczSystem);

    // === φ→φ の証明 ===

    // Step 1: A1スキーマ + 代入 ψ:=(phi→phi)
    ws = addNode(ws, "axiom", "Axiom", { x: 30, y: 0 }, "phi -> (psi -> phi)");
    // node-1: A1 schema
    const subst1 = applySubstitutionAndConnect(
      ws,
      "node-1",
      [
        {
          _tag: "FormulaSubstitution",
          metaVariableName: "ψ",
          formulaText: "phi -> phi",
        },
      ],
      { x: 30, y: 35 },
    );
    ws = subst1.workspace;
    // node-2: A1 instance φ → ((φ→φ) → φ)

    // Step 2: A2スキーマ + 代入 ψ:=(phi→phi), χ:=phi
    ws = addNode(
      ws,
      "axiom",
      "Axiom",
      { x: 320, y: 0 },
      "(phi -> (psi -> chi)) -> ((phi -> psi) -> (phi -> chi))",
    );
    // node-3: A2 schema
    const subst2 = applySubstitutionAndConnect(
      ws,
      "node-3",
      [
        {
          _tag: "FormulaSubstitution",
          metaVariableName: "ψ",
          formulaText: "phi -> phi",
        },
        {
          _tag: "FormulaSubstitution",
          metaVariableName: "χ",
          formulaText: "phi",
        },
      ],
      { x: 320, y: 35 },
    );
    ws = subst2.workspace;
    // node-4: A2 instance

    // Step 3: MP(subst1, subst2)
    const mp1 = applyMPAndConnect(ws, "node-2", "node-4", { x: 180, y: 70 });
    ws = mp1.workspace;
    // node-5: (φ → (φ→φ)) → (φ → φ)

    // Step 4: A1スキーマ（2回目）+ 代入 ψ:=phi
    ws = addNode(ws, "axiom", "Axiom", { x: 30, y: 70 }, "phi -> (psi -> phi)");
    // node-6: A1 schema
    const subst3 = applySubstitutionAndConnect(
      ws,
      "node-6",
      [
        {
          _tag: "FormulaSubstitution",
          metaVariableName: "ψ",
          formulaText: "phi",
        },
      ],
      { x: 30, y: 105 },
    );
    ws = subst3.workspace;
    // node-7: φ → (φ → φ)

    // Step 5: MP(subst3, mp1) → φ → φ
    const mp2 = applyMPAndConnect(ws, "node-7", "node-5", { x: 180, y: 140 });
    ws = mp2.workspace;
    // node-8: φ → φ

    // === チェーン第2段: A1で包む ===

    // Step 6: A1スキーマ（3回目）+ 代入 φ:=(phi→phi)
    ws = addNode(
      ws,
      "axiom",
      "Axiom",
      { x: 400, y: 105 },
      "phi -> (psi -> phi)",
    );
    // node-9: A1 schema
    const subst4 = applySubstitutionAndConnect(
      ws,
      "node-9",
      [
        {
          _tag: "FormulaSubstitution",
          metaVariableName: "φ",
          formulaText: "phi -> phi",
        },
      ],
      { x: 400, y: 140 },
    );
    ws = subst4.workspace;
    // node-10: (φ→φ) → (ψ → (φ→φ))

    // Step 7: MP(mp2, subst4) → ψ → (φ→φ)
    const mp3 = applyMPAndConnect(ws, "node-8", "node-10", {
      x: 300,
      y: 175,
    });
    ws = mp3.workspace;
    // node-11: ψ → (φ→φ)

    // === チェーン第3段: さらにA1で包む ===

    // Step 8: A1スキーマ（4回目）+ 代入 φ:=(psi→(phi→phi)), ψ:=chi
    ws = addNode(
      ws,
      "axiom",
      "Axiom",
      { x: 500, y: 140 },
      "phi -> (psi -> phi)",
    );
    // node-12: A1 schema
    const subst5 = applySubstitutionAndConnect(
      ws,
      "node-12",
      [
        {
          _tag: "FormulaSubstitution",
          metaVariableName: "φ",
          formulaText: "psi -> (phi -> phi)",
        },
        {
          _tag: "FormulaSubstitution",
          metaVariableName: "ψ",
          formulaText: "chi",
        },
      ],
      { x: 500, y: 175 },
    );
    ws = subst5.workspace;
    // node-13: (ψ→(φ→φ)) → (χ → (ψ→(φ→φ)))

    // Step 9: MP(mp3, subst5) → χ → (ψ→(φ→φ))
    const mp4 = applyMPAndConnect(ws, "node-11", "node-13", {
      x: 400,
      y: 210,
    });
    ws = mp4.workspace;
    // node-14: χ → (ψ→(φ→φ))

    // ゴール設定: χ → (ψ → (φ → φ))
    ws = addGoal(ws, "chi -> (psi -> (phi -> phi))");

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

// --- 異常系混合デモ ---

function MixedErrorStatesDemo() {
  const initial = (() => {
    // 成功MP、失敗MP、パースエラー、複数ゴール（一部達成・一部未達成）が共存
    let ws = createEmptyWorkspace(lukasiewiczSystem);

    // 成功するMP: φ + (φ→ψ) → ψ
    ws = addNode(ws, "axiom", "Axiom", { x: 50, y: 50 }, "phi");
    ws = addNode(ws, "axiom", "Axiom", { x: 350, y: 50 }, "phi -> psi");
    const mpOk = applyMPAndConnect(ws, "node-1", "node-2", {
      x: 200,
      y: 200,
    });
    ws = mpOk.workspace;

    // 失敗するMP: α + (β→γ) → MP失敗（αとβが不一致）
    ws = addNode(ws, "axiom", "Axiom", { x: 550, y: 50 }, "alpha");
    ws = addNode(ws, "axiom", "Axiom", { x: 850, y: 50 }, "beta -> gamma");
    const mpFail = applyMPAndConnect(ws, "node-4", "node-5", {
      x: 700,
      y: 200,
    });
    ws = mpFail.workspace;

    // パースエラーの公理ノード
    ws = addNode(ws, "axiom", "Axiom", { x: 550, y: 350 }, "-> -> invalid");

    // 未接続の孤立ノード
    ws = addNode(ws, "axiom", "Axiom", { x: 850, y: 350 }, "delta");

    // ゴール1: ψ（MP成功で達成）
    ws = addGoal(ws, "psi");

    // ゴール2: delta→delta（未達成）
    ws = addGoal(ws, "delta -> delta");

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
 * 公理スキーマ→代入→インスタンスの厳密なパターンで構築。
 * 8ノード（公理スキーマ3 + 代入3 + MP2）がすべて配置済み。
 * ゴール「φ → φ」が達成されている状態。
 */
export const IdentityProofCompleted: Story = {
  render: () => <IdentityProofComplete />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("workspace")).toBeInTheDocument();

    // 8ノード: 公理スキーマ3 + 代入3 + MP2
    for (let i = 1; i <= 8; i++) {
      await expect(
        canvas.getByTestId(`proof-node-node-${String(i) satisfies string}`),
      ).toBeInTheDocument();
    }

    // MP適用が成功している（node-5, node-8）
    await expect(
      canvas.getByTestId("proof-node-node-5-status"),
    ).toHaveTextContent("MP applied");
    await expect(
      canvas.getByTestId("proof-node-node-8-status"),
    ).toHaveTextContent("MP applied");

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

    // 7ノード: 公理スキーマ3 + 代入3 + MP1
    for (let i = 1; i <= 7; i++) {
      await expect(
        canvas.getByTestId(`proof-node-node-${String(i) satisfies string}`),
      ).toBeInTheDocument();
    }

    // MP適用でStep 5を実行: node-7(左前提: φ→(φ→φ)) と node-5(右前提: (φ→(φ→φ))→(φ→φ)) を選択
    await userEvent.click(canvas.getByTestId("workspace-mp-button"));
    await expect(canvas.getByTestId("workspace-mp-banner")).toHaveTextContent(
      "Click the left premise",
    );

    // 左前提: node-7 (φ → (φ→φ))
    await userEvent.click(canvas.getByTestId("proof-node-node-7"));
    await expect(canvas.getByTestId("workspace-mp-banner")).toHaveTextContent(
      "Click the right premise",
    );

    // 右前提: node-5 ((φ → (φ→φ)) → (φ → φ))
    await userEvent.click(canvas.getByTestId("proof-node-node-5"));

    // MPノードが生成された（node-8）
    await expect(canvas.getByTestId("proof-node-node-8")).toBeInTheDocument();
    await expect(
      canvas.getByTestId("proof-node-node-8-status"),
    ).toHaveTextContent("MP applied");

    // ゴールは WorkspaceState.goals で管理されており、
    // MPで導出した式がゴール式と一致するため、証明完了となる
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

    // node-1(φ)をダブルクリックして編集モードに入る（editTrigger="dblclick"）
    const display = canvas.getByTestId("proof-node-node-1-editor-display");
    await userEvent.dblClick(display);

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

    // node-1(φ)をダブルクリックして編集モードに入る（editTrigger="dblclick"）
    const display = canvas.getByTestId("proof-node-node-1-editor-display");
    await userEvent.dblClick(display);

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

/**
 * 巨大な証明木デモ。
 *
 * φ→φの証明をベースに、A1を使って結果を2段チェーンした大きな証明木。
 * 公理スキーマ → 代入操作 → インスタンスの厳密なパターンで構築。
 * 合計14ノード（公理スキーマ5 + 代入5 + MP4）。
 *
 * 証明構造:
 *   A1[ψ:=(φ→φ)] + A2[ψ:=(φ→φ),χ:=φ] → MP1 → (φ→(φ→φ))→(φ→φ)
 *   A1[ψ:=φ] + MP1 → MP2 → φ→φ
 *   MP2 + A1[φ:=(φ→φ)] → MP3 → ψ→(φ→φ)
 *   MP3 + A1[φ:=(ψ→(φ→φ)),ψ:=χ] → MP4 → χ→(ψ→(φ→φ))   ← ゴール達成
 */
export const LargeProofTree: Story = {
  render: () => <LargeProofTreeDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("workspace")).toBeInTheDocument();

    // 14ノード（公理スキーマ5 + 代入5 + MP4）が存在
    for (let i = 1; i <= 14; i++) {
      await expect(
        canvas.getByTestId(`proof-node-node-${String(i) satisfies string}`),
      ).toBeInTheDocument();
    }

    // 4つのMP適用がすべて成功（node-5, node-8, node-11, node-14）
    await expect(
      canvas.getByTestId("proof-node-node-5-status"),
    ).toHaveTextContent("MP applied");
    await expect(
      canvas.getByTestId("proof-node-node-8-status"),
    ).toHaveTextContent("MP applied");
    await expect(
      canvas.getByTestId("proof-node-node-11-status"),
    ).toHaveTextContent("MP applied");
    await expect(
      canvas.getByTestId("proof-node-node-14-status"),
    ).toHaveTextContent("MP applied");

    // ゴール達成（χ → (ψ → (φ → φ))）
    await expect(
      canvas.getByTestId("workspace-proof-complete-banner"),
    ).toBeInTheDocument();
  },
};

/**
 * 異常系混合デモ。
 *
 * 以下が同一ワークスペースに共存する状態:
 * - 成功したMP（φ + φ→ψ → ψ）
 * - 失敗したMP（α + β→γ → 前提不一致エラー）
 * - パースエラーの公理ノード（"-> -> invalid"）
 * - 未接続の孤立ノード（δ）
 * - 達成済みゴール（ψ）
 * - 未達成ゴール（δ→δ）
 */
export const MixedErrorStates: Story = {
  render: () => <MixedErrorStatesDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("workspace")).toBeInTheDocument();

    // 8ノードが存在
    for (let i = 1; i <= 8; i++) {
      await expect(
        canvas.getByTestId(`proof-node-node-${String(i) satisfies string}`),
      ).toBeInTheDocument();
    }

    // MP成功（node-3: φ + φ→ψ → ψ）
    await expect(
      canvas.getByTestId("proof-node-node-3-status"),
    ).toHaveTextContent("MP applied");

    // MP失敗（node-6: α + β→γ → 前提不一致）
    await expect(
      canvas.getByTestId("proof-node-node-6-status"),
    ).toHaveTextContent("Left premise does not match");

    // ゴールは一部のみ達成なので、完了バナーは表示されない
    await expect(
      canvas.queryByTestId("workspace-proof-complete-banner"),
    ).not.toBeInTheDocument();
  },
};

// --- MP修復フローデモ ---

function MPRepairFlowDemo() {
  const initial = (() => {
    // φ + (φ→ψ) → MP → ψ（成功状態）
    let ws = createEmptyWorkspace(lukasiewiczSystem);
    ws = addNode(ws, "axiom", "Axiom", { x: 50, y: 50 }, "phi");
    ws = addNode(ws, "axiom", "Axiom", { x: 350, y: 50 }, "phi -> psi");
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

/**
 * MP修復フロー: 公理書き換え → MP無効化 → 削除 → 再構築 → MP再成功。
 *
 * シナリオ:
 *   1. 初期状態: φ + (φ→ψ) → MP → ψ（成功）
 *   2. φ を chi に書き換え → MP失敗
 *   3. MPノードを右クリック→Delete Nodeで削除（接続も一緒に消える）
 *   4. chi ノードを右クリック→Delete Nodeで削除
 *   5. パレットからA1公理を追加
 *   6. A1の式を φ に書き換え
 *   7. 新ノードを右クリック→「Use as MP Left」→ (φ→ψ)ノードをクリック
 *   8. 新しいMPノードが生成され、MP成功
 *
 * 接続削除・ノード削除・パレット追加・コンテキストメニューMP適用を
 * 組み合わせた一連の修復フローを実演する。
 */
export const MPRepairFlow: Story = {
  render: () => <MPRepairFlowDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("workspace")).toBeInTheDocument();

    // === Step 1: 初期状態確認 ===
    // 3ノード（A: φ, B: φ→ψ, MP）が存在
    await expect(canvas.getByTestId("proof-node-node-1")).toBeInTheDocument();
    await expect(canvas.getByTestId("proof-node-node-2")).toBeInTheDocument();
    await expect(canvas.getByTestId("proof-node-node-3")).toBeInTheDocument();

    // MP成功状態
    await expect(
      canvas.getByTestId("proof-node-node-3-status"),
    ).toHaveTextContent("MP applied");

    // === Step 2: 公理φをchiに書き換え → MP失敗 ===
    const display = canvas.getByTestId("proof-node-node-1-editor-display");
    await userEvent.dblClick(display);
    const input = canvas.getByTestId("proof-node-node-1-editor-input-input");
    await userEvent.clear(input);
    await userEvent.type(input, "chi");
    await userEvent.tab();

    // MP失敗を確認
    await expect(
      canvas.getByTestId("proof-node-node-3-status"),
    ).toHaveTextContent("Left premise does not match");

    // === Step 3: MPノードを右クリック→Delete Node ===
    const mpNode = canvas.getByTestId("proof-node-node-3");
    await userEvent.pointer({ keys: "[MouseRight]", target: mpNode });
    await expect(
      canvas.getByTestId("workspace-node-context-menu"),
    ).toBeInTheDocument();
    await userEvent.click(canvas.getByTestId("workspace-delete-node"));

    // MPノードが消えた
    await expect(
      canvas.queryByTestId("proof-node-node-3"),
    ).not.toBeInTheDocument();

    // === Step 4: chiノードを右クリック→Delete Node ===
    const chiNode = canvas.getByTestId("proof-node-node-1");
    await userEvent.pointer({ keys: "[MouseRight]", target: chiNode });
    await expect(
      canvas.getByTestId("workspace-node-context-menu"),
    ).toBeInTheDocument();
    await userEvent.click(canvas.getByTestId("workspace-delete-node"));

    // chiノードが消えた
    await expect(
      canvas.queryByTestId("proof-node-node-1"),
    ).not.toBeInTheDocument();

    // (φ→ψ)ノードのみ残る
    await expect(canvas.getByTestId("proof-node-node-2")).toBeInTheDocument();

    // === Step 5: パレットからA1公理を追加 ===
    const a1Item = canvas.getByTestId("workspace-axiom-palette-item-A1");
    await userEvent.click(a1Item);

    // 新ノードが追加された（node-4）
    await expect(canvas.getByTestId("proof-node-node-4")).toBeInTheDocument();

    // === Step 6: A1の式をφに書き換え ===
    const newDisplay = canvas.getByTestId("proof-node-node-4-editor-display");
    await userEvent.dblClick(newDisplay);
    const newInput = canvas.getByTestId("proof-node-node-4-editor-input-input");
    await userEvent.clear(newInput);
    await userEvent.type(newInput, "phi");
    await userEvent.tab();

    // === Step 7: 新ノードを右クリック→Use as MP Left → (φ→ψ)をクリック ===
    const newNode = canvas.getByTestId("proof-node-node-4");
    await userEvent.pointer({ keys: "[MouseRight]", target: newNode });
    await expect(
      canvas.getByTestId("workspace-node-context-menu"),
    ).toBeInTheDocument();
    await userEvent.click(canvas.getByTestId("workspace-use-as-mp-left"));

    // MP選択バナーが右前提選択を促す
    await expect(canvas.getByTestId("workspace-mp-banner")).toHaveTextContent(
      "Click the right premise",
    );

    // (φ→ψ)ノードをクリック
    await userEvent.click(canvas.getByTestId("proof-node-node-2"));

    // === Step 8: 新MPノード生成、MP成功 ===
    await expect(canvas.getByTestId("proof-node-node-5")).toBeInTheDocument();
    await expect(
      canvas.getByTestId("proof-node-node-5-status"),
    ).toHaveTextContent("MP applied");
  },
};

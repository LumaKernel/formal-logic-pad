/**
 * 模範解答デモストーリー。
 *
 * buildModelAnswerWorkspace で模範解答をワークスペースに変換し、
 * ProofWorkspace で表示する。小規模・中規模・巨大証明をカバー。
 *
 * 変更時は builtinModelAnswers.ts, modelAnswer.ts も参照。
 */

import { useState, useCallback } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within, userEvent } from "storybook/test";
import { ProofWorkspace } from "./ProofWorkspace";
import type { WorkspaceState } from "./workspaceState";
import {
  builtinQuests,
  findQuestById,
  modelAnswerRegistry,
  buildModelAnswerWorkspace,
} from "../quest";

// --- ヘルパー ---

function buildModelAnswerForQuest(questId: string): {
  readonly workspace: WorkspaceState;
} {
  const quest = findQuestById(builtinQuests, questId);
  if (quest === undefined) {
    throw new Error(`Quest not found: ${questId satisfies string}`);
  }
  const answer = modelAnswerRegistry.get(questId);
  if (answer === undefined) {
    throw new Error(`Model answer not found: ${questId satisfies string}`);
  }
  const result = buildModelAnswerWorkspace(quest, answer);
  if (result._tag !== "Ok") {
    throw new Error(
      `Failed to build model answer: ${result._tag satisfies string}`,
    );
  }
  return { workspace: result.workspace };
}

// --- ステートフルラッパー ---

function ModelAnswerWorkspace({ questId }: { readonly questId: string }) {
  const { workspace: initial } = buildModelAnswerForQuest(questId);
  const [workspace, setWorkspace] = useState<WorkspaceState>(initial);
  const handleChange = useCallback((ws: WorkspaceState) => {
    setWorkspace(ws);
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <ProofWorkspace
        system={workspace.system}
        workspace={workspace}
        onWorkspaceChange={handleChange}
        testId="workspace"
      />
    </div>
  );
}

// --- Meta ---

const meta = {
  title: "ProofPad/ModelAnswerDemo",
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// --- ストーリー ---

/**
 * パースエラーを持つノードがないことを検証するヘルパー。
 * 模範解答ではすべてのノードが正しくパースされるべき。
 */
async function assertNoParseErrors(canvasElement: HTMLElement) {
  const errorNodes = canvasElement.querySelectorAll(
    '[data-has-parse-error="true"]',
  );
  await expect(errorNodes.length).toBe(0);
}

/** prop-01: 恒等律 φ→φ（5ステップ, 小規模） */
export const SmallProof: Story = {
  render: () => <ModelAnswerWorkspace questId="prop-01" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("workspace")).toBeInTheDocument();
    await assertNoParseErrors(canvasElement);

    // 証明完了バナー
    await expect(
      canvas.getByTestId("workspace-proof-complete-banner"),
    ).toBeInTheDocument();

    // ゴールパネルが「Proved!」状態
    await expect(canvas.getByTestId("workspace-goal-panel")).toHaveTextContent(
      "Proved!",
    );

    // 公理パレットが表示される
    await expect(
      canvas.getByTestId("workspace-axiom-palette"),
    ).toBeInTheDocument();

    // A1公理をクリック→ノード追加
    await userEvent.click(
      canvas.getByTestId("workspace-axiom-palette-item-A1"),
    );
  },
};

/** prop-02: 定数関数の合成 (7ステップ, 中規模) */
export const MediumProof: Story = {
  render: () => <ModelAnswerWorkspace questId="prop-02" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("workspace")).toBeInTheDocument();
    await assertNoParseErrors(canvasElement);

    // 証明完了バナー
    await expect(
      canvas.getByTestId("workspace-proof-complete-banner"),
    ).toBeInTheDocument();

    // ゴールパネルが「Proved!」状態
    await expect(canvas.getByTestId("workspace-goal-panel")).toHaveTextContent(
      "Proved!",
    );

    // 公理パレットが表示される
    await expect(
      canvas.getByTestId("workspace-axiom-palette"),
    ).toBeInTheDocument();

    // A2公理をクリック→ノード追加
    await userEvent.click(
      canvas.getByTestId("workspace-axiom-palette-item-A2"),
    );
  },
};

/**
 * prop-07: 含意の交換 (φ→(ψ→χ))→(ψ→(φ→χ))（19ステップ, 大規模）
 * CI 15秒タイムアウト制限のため、インタラクションは最小限に抑える
 */
export const LargeProof: Story = {
  render: () => <ModelAnswerWorkspace questId="prop-07" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("workspace")).toBeInTheDocument();
    await assertNoParseErrors(canvasElement);

    // 証明完了バナー（19ステップでもレンダリング完了を確認）
    await expect(
      canvas.getByTestId("workspace-proof-complete-banner"),
    ).toBeInTheDocument();
  },
};

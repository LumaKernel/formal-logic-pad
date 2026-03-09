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
import { expect, within } from "storybook/test";
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

/** prop-01: 恒等律 φ→φ（5ステップ, 小規模） */
export const SmallProof: Story = {
  render: () => <ModelAnswerWorkspace questId="prop-01" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // ノードが存在することを確認
    await expect(canvas.getByTestId("workspace")).toBeInTheDocument();
  },
};

/** prop-04: 推移律 (φ→ψ)→((ψ→χ)→(φ→χ))（14ステップ, 中規模） */
export const MediumProof: Story = {
  render: () => <ModelAnswerWorkspace questId="prop-04" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("workspace")).toBeInTheDocument();
  },
};

/** prop-08: 推移律3段チェイン (φ→ψ)→((ψ→χ)→((χ→θ)→(φ→θ)))（43ステップ, 大規模） */
export const LargeProof: Story = {
  render: () => <ModelAnswerWorkspace questId="prop-08" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("workspace")).toBeInTheDocument();
  },
};

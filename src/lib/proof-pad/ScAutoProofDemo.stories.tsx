/**
 * シーケント計算自動証明カテゴリのデモストーリー。
 *
 * sc-auto-proof カテゴリの代表クエストをカバー。
 *
 * 変更時は builtinModelAnswers.ts, builtinQuests.ts も参照。
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
  title: "ProofPad/ScAutoProofDemo",
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// --- 共通アサーション ---

async function assertNoParseErrors(canvasElement: HTMLElement) {
  const errorNodes = canvasElement.querySelectorAll(
    '[data-has-parse-error="true"]',
  );
  await expect(errorNodes.length).toBe(0);
}

// --- ストーリー ---

/** sc-auto-proof: sc-ap-01 自動証明: 恒等律（LKシーケント計算） */
export const AutoProofIdentity: Story = {
  render: () => <ModelAnswerWorkspace questId="sc-ap-01" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("workspace")).toBeInTheDocument();
    await assertNoParseErrors(canvasElement);
  },
};

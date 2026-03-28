/**
 * 命題論理カテゴリのデモストーリー。
 *
 * propositional-basics, propositional-intermediate, propositional-negation,
 * propositional-advanced の4カテゴリを各1クエストずつカバー。
 *
 * buildModelAnswerWorkspace で模範解答をワークスペースに変換し、
 * ProofWorkspace で表示する。
 *
 * 変更時は builtinModelAnswers.ts, builtinQuests.ts も参照。
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
  title: "ProofPad/PropositionalDemo",
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

/** propositional-basics: prop-01 恒等律 φ→φ（5ステップ） */
export const Basics: Story = {
  render: () => <ModelAnswerWorkspace questId="prop-01" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("workspace")).toBeInTheDocument();
    await assertNoParseErrors(canvasElement);
    await expect(
      canvas.getByTestId("workspace-proof-complete-banner"),
    ).toBeInTheDocument();

    // ゴールパネルが「Proved!」状態
    await expect(canvas.getByTestId("workspace-goal-panel")).toHaveTextContent(
      "Proved!",
    );

    // 公理パレットからA1クリック→ノード追加
    await expect(
      canvas.getByTestId("workspace-axiom-palette"),
    ).toBeInTheDocument();
    await userEvent.click(
      canvas.getByTestId("workspace-axiom-palette-item-A1"),
    );
  },
};

/** propositional-intermediate: prop-10 Bコンビネータ（7ステップ） */
export const Intermediate: Story = {
  render: () => <ModelAnswerWorkspace questId="prop-10" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("workspace")).toBeInTheDocument();
    await assertNoParseErrors(canvasElement);
    await expect(
      canvas.getByTestId("workspace-proof-complete-banner"),
    ).toBeInTheDocument();

    // ゴールパネルが「Proved!」状態
    await expect(canvas.getByTestId("workspace-goal-panel")).toHaveTextContent(
      "Proved!",
    );

    // 公理パレットからA2クリック→ノード追加
    await expect(
      canvas.getByTestId("workspace-axiom-palette"),
    ).toBeInTheDocument();
    await userEvent.click(
      canvas.getByTestId("workspace-axiom-palette-item-A2"),
    );
  },
};

/** propositional-negation: prop-19 ¬φ→(φ→ψ)（4ステップ） */
export const Negation: Story = {
  render: () => <ModelAnswerWorkspace questId="prop-19" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("workspace")).toBeInTheDocument();
    await assertNoParseErrors(canvasElement);
    await expect(
      canvas.getByTestId("workspace-proof-complete-banner"),
    ).toBeInTheDocument();

    // ゴールパネルが「Proved!」状態
    await expect(canvas.getByTestId("workspace-goal-panel")).toHaveTextContent(
      "Proved!",
    );

    // 公理パレットからA3クリック→ノード追加
    await expect(
      canvas.getByTestId("workspace-axiom-palette"),
    ).toBeInTheDocument();
    await userEvent.click(
      canvas.getByTestId("workspace-axiom-palette-item-A3"),
    );
  },
};

/** propositional-advanced: prop-44 恒等律の選言拡張（3ステップ） */
export const Advanced: Story = {
  render: () => <ModelAnswerWorkspace questId="prop-44" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("workspace")).toBeInTheDocument();
    await assertNoParseErrors(canvasElement);
    await expect(
      canvas.getByTestId("workspace-proof-complete-banner"),
    ).toBeInTheDocument();

    // ゴールパネルが「Proved!」状態
    await expect(canvas.getByTestId("workspace-goal-panel")).toHaveTextContent(
      "Proved!",
    );

    // 公理パレットからA1クリック→ノード追加
    await expect(
      canvas.getByTestId("workspace-axiom-palette"),
    ).toBeInTheDocument();
    await userEvent.click(
      canvas.getByTestId("workspace-axiom-palette-item-A1"),
    );
  },
};

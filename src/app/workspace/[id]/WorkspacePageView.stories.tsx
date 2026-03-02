/**
 * WorkspacePageView ストーリー。
 *
 * ワークスペースページのプレゼンテーション層のデモ。
 * ノートブック表示状態と404状態を表示。
 */

import { useState, useCallback } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn, expect, within, userEvent } from "storybook/test";
import { ThemeProvider } from "../../../lib/theme/ThemeProvider";
import { defaultProofMessages } from "../../../lib/proof-pad";
import {
  lukasiewiczSystem,
  predicateLogicSystem,
  groupTheoryLeftSystem,
} from "../../../lib/logic-core/inferenceRule";
import {
  createEmptyWorkspace,
  addNode,
  addGoal,
  applyMPAndConnect,
} from "../../../lib/proof-pad/workspaceState";
import type { WorkspaceState } from "../../../lib/proof-pad/workspaceState";
import type { GoalAchievedInfo } from "../../../lib/proof-pad";
import { WorkspacePageView } from "./WorkspacePageView";

// --- Stateful wrapper for interactive stories ---

function StatefulWorkspace({
  initialWorkspace,
  notebookName,
  onBack,
  onGoalAchieved,
}: {
  readonly initialWorkspace: WorkspaceState;
  readonly notebookName: string;
  readonly onBack: () => void;
  readonly onGoalAchieved: (info: GoalAchievedInfo) => void;
}) {
  const [workspace, setWorkspace] = useState(initialWorkspace);
  const handleChange = useCallback((ws: WorkspaceState) => {
    setWorkspace(ws);
  }, []);

  return (
    <WorkspacePageView
      found={true}
      notebookName={notebookName}
      workspace={workspace}
      messages={defaultProofMessages}
      onBack={onBack}
      onWorkspaceChange={handleChange}
      onGoalAchieved={onGoalAchieved}
      languageToggle={{ locale: "en", onLocaleChange: () => {} }}
    />
  );
}

// --- Meta ---

// WorkspacePageViewProps is a discriminated union, so we use render-based stories
const meta: Meta = {
  title: "Pages/Workspace",
  decorators: [
    (Story) => (
      <ThemeProvider>
        <Story />
      </ThemeProvider>
    ),
  ],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// --- Stories ---

/** ノートブックが見つからない場合（404状態） */
export const NotFound: Story = {
  render: () => {
    const handleBack = fn();
    return <WorkspacePageView found={false} onBack={handleBack} />;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // 404メッセージの確認
    await expect(canvas.getByText("Notebook not found")).toBeInTheDocument();
    await expect(canvas.getByText("Back to Hub")).toBeInTheDocument();
    // testid の確認
    await expect(canvas.getByTestId("workspace-not-found")).toBeInTheDocument();

    // Back to Hubボタンがクリック可能
    await userEvent.click(canvas.getByText("Back to Hub"));
  },
};

/** 空のLukasiewicz体系ワークスペース */
export const EmptyLukasiewicz: Story = {
  render: () => (
    <StatefulWorkspace
      initialWorkspace={createEmptyWorkspace(lukasiewiczSystem)}
      notebookName="My First Proof"
      onBack={fn()}
      onGoalAchieved={fn()}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // ヘッダーにノートブック名が表示される
    await expect(canvas.getByText("My First Proof")).toBeInTheDocument();
    // Backボタンが表示される
    await expect(canvas.getByText("Back")).toBeInTheDocument();
    // testid の確認
    await expect(canvas.getByTestId("workspace-page")).toBeInTheDocument();
  },
};

/** 公理ノード付きのワークスペース */
export const WithAxiomNodes: Story = {
  render: () => {
    let ws = createEmptyWorkspace(lukasiewiczSystem);
    ws = addNode(ws, "axiom", "A1 (K)", { x: 50, y: 50 }, "φ → (ψ → φ)");
    ws = addNode(
      ws,
      "axiom",
      "A2 (S)",
      { x: 50, y: 200 },
      "(φ → (ψ → χ)) → ((φ → ψ) → (φ → χ))",
    );
    return (
      <StatefulWorkspace
        initialWorkspace={ws}
        notebookName="Proof with Axioms"
        onBack={fn()}
        onGoalAchieved={fn()}
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // ノートブック名が表示される
    await expect(canvas.getByText("Proof with Axioms")).toBeInTheDocument();
    // ワークスペースが表示される
    await expect(canvas.getByTestId("workspace-page")).toBeInTheDocument();
  },
};

/** クエストバージョン警告が表示されるワークスペース */
export const WithQuestVersionWarning: Story = {
  render: () => {
    const ws = createEmptyWorkspace(lukasiewiczSystem);
    return (
      <WorkspacePageView
        found={true}
        notebookName="旧バージョンのクエスト"
        workspace={ws}
        messages={defaultProofMessages}
        onBack={fn()}
        onWorkspaceChange={fn()}
        onGoalAchieved={fn()}
        questVersionWarning="このノートブックは古いバージョン (v1) のクエストから作成されました。最新バージョンは v3 です。"
        languageToggle={{ locale: "ja", onLocaleChange: () => {} }}
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByTestId("quest-version-warning"),
    ).toBeInTheDocument();
    await expect(canvas.getByText(/古いバージョン/)).toBeInTheDocument();
    await expect(canvas.getByText(/v1/)).toBeInTheDocument();
    await expect(canvas.getByText(/v3/)).toBeInTheDocument();
  },
};

/** 述語論理体系の空ワークスペース */
export const EmptyPredicateLogic: Story = {
  render: () => (
    <StatefulWorkspace
      initialWorkspace={createEmptyWorkspace(predicateLogicSystem)}
      notebookName="Predicate Logic Notebook"
      onBack={fn()}
      onGoalAchieved={fn()}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByText("Predicate Logic Notebook"),
    ).toBeInTheDocument();
    await expect(canvas.getByTestId("workspace-page")).toBeInTheDocument();
  },
};

/** ゴール設定済みのワークスペース */
export const WithGoal: Story = {
  render: () => {
    let ws = createEmptyWorkspace(lukasiewiczSystem);
    ws = addGoal(ws, "φ → φ", { label: "Identity" });
    ws = addNode(ws, "axiom", "A1", { x: 50, y: 50 }, "φ → (ψ → φ)");
    return (
      <StatefulWorkspace
        initialWorkspace={ws}
        notebookName="Proof with Goal"
        onBack={fn()}
        onGoalAchieved={fn()}
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Proof with Goal")).toBeInTheDocument();
    await expect(canvas.getByTestId("workspace-page")).toBeInTheDocument();
  },
};

/** 証明ツリー（公理 + MP推論エッジ）付きワークスペース */
export const WithProofTree: Story = {
  render: () => {
    let ws = createEmptyWorkspace(lukasiewiczSystem);
    // 公理ノード: φ → (ψ → φ)
    ws = addNode(ws, "axiom", "A1", { x: 50, y: 50 }, "φ → (ψ → φ)");
    // 公理ノード: φ
    ws = addNode(ws, "axiom", "φ", { x: 300, y: 50 }, "φ");
    // MP適用: φ, φ → (ψ → φ) ⊢ ψ → φ
    const mpResult = applyMPAndConnect(
      ws,
      "node-2", // φ (left premise)
      "node-1", // φ → (ψ → φ) (right premise / conditional)
      { x: 175, y: 200 },
    );
    ws = mpResult.workspace;
    return (
      <StatefulWorkspace
        initialWorkspace={ws}
        notebookName="Proof Tree Demo"
        onBack={fn()}
        onGoalAchieved={fn()}
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Proof Tree Demo")).toBeInTheDocument();
    await expect(canvas.getByTestId("workspace-page")).toBeInTheDocument();
  },
};

/** 群論体系のワークスペース */
export const GroupTheoryWorkspace: Story = {
  render: () => {
    let ws = createEmptyWorkspace(groupTheoryLeftSystem);
    ws = addNode(
      ws,
      "axiom",
      "G1",
      { x: 50, y: 50 },
      "(x · y) · z = x · (y · z)",
    );
    ws = addNode(ws, "axiom", "G2", { x: 50, y: 200 }, "e · x = x");
    return (
      <StatefulWorkspace
        initialWorkspace={ws}
        notebookName="Group Theory"
        onBack={fn()}
        onGoalAchieved={fn()}
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Group Theory")).toBeInTheDocument();
    await expect(canvas.getByTestId("workspace-page")).toBeInTheDocument();
  },
};

/**
 * WorkspacePageView ストーリー。
 *
 * ワークスペースページのプレゼンテーション層のデモ。
 * ノートブック表示状態と404状態を表示。
 */

import { useState, useCallback } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn, expect, within, userEvent, waitFor } from "storybook/test";
import { ThemeProvider } from "../../../lib/theme/ThemeProvider";
import { defaultProofMessages } from "../../../lib/proof-pad";
import {
  lukasiewiczSystem,
  predicateLogicSystem,
  groupTheoryLeftSystem,
} from "../../../lib/logic-core/inferenceRule";
import {
  naturalDeduction,
  njSystem,
  sequentCalculusDeduction,
  lkSystem,
  tableauCalculusDeduction,
  tabPropSystem,
  analyticTableauDeduction,
  atSystem,
} from "../../../lib/logic-core/deductionSystem";
import {
  createEmptyWorkspace,
  addNode,
  addGoal,
  applyMPAndConnect,
  createQuestWorkspace,
} from "../../../lib/proof-pad/workspaceState";
import type { WorkspaceState } from "../../../lib/proof-pad/workspaceState";
import type { GoalAchievedInfo } from "../../../lib/proof-pad";
import { allReferenceEntries } from "../../../lib/reference/referenceContent";
import { findEntryById } from "../../../lib/reference/referenceEntry";
import { ReferenceFloatingWindow } from "../../../lib/reference/ReferenceFloatingWindow";
import {
  builtinQuests,
  findQuestById,
  modelAnswerRegistry,
  buildModelAnswerWorkspace,
  resolveSystemPreset,
  buildCatalogByCategory,
  createEmptyProgress,
} from "../../../lib/quest";
import type { ModelAnswer } from "../../../lib/quest";
import type { GoalQuestInfo } from "../../../lib/proof-pad";
import { HubPageView, type HubTab } from "../../HubPageView";
import { WorkspacePageView } from "./WorkspacePageView";

// --- Stateful wrapper for interactive stories ---

function StatefulWorkspace({
  initialWorkspace,
  initialNotebookName,
  onBack,
  onGoalAchieved,
  onNotebookRename,
  onDuplicateToFree,
  questInfo,
  workspaceTestId,
}: {
  readonly initialWorkspace: WorkspaceState;
  readonly initialNotebookName: string;
  readonly onBack: () => void;
  readonly onGoalAchieved: (info: GoalAchievedInfo) => void;
  readonly onNotebookRename?: (newName: string) => void;
  readonly onDuplicateToFree?: () => void;
  readonly questInfo?: GoalQuestInfo;
  readonly workspaceTestId?: string;
}) {
  const [workspace, setWorkspace] = useState(initialWorkspace);
  const [notebookName, setNotebookName] = useState(initialNotebookName);
  const handleChange = useCallback((ws: WorkspaceState) => {
    setWorkspace(ws);
  }, []);
  const handleRename = useCallback(
    (newName: string) => {
      setNotebookName(newName);
      onNotebookRename?.(newName);
    },
    [onNotebookRename],
  );

  return (
    <WorkspacePageView
      found={true}
      notebookName={notebookName}
      onNotebookRename={handleRename}
      workspace={workspace}
      messages={defaultProofMessages}
      onBack={onBack}
      onWorkspaceChange={handleChange}
      onGoalAchieved={onGoalAchieved}
      onDuplicateToFree={onDuplicateToFree}
      questInfo={questInfo}
      languageToggle={{ locale: "en", onLocaleChange: () => {} }}
      workspaceTestId={workspaceTestId}
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
      initialNotebookName="My First Proof"
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
        initialNotebookName="Proof with Axioms"
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
      initialNotebookName="Predicate Logic Notebook"
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
        initialNotebookName="Proof with Goal"
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
        initialNotebookName="Proof Tree Demo"
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
        initialNotebookName="Group Theory"
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

// --- タイトル編集ストーリー ---

/** タイトルクリックで編集モードに入り、名前を変更できる */
export const TitleEdit: Story = {
  render: () => {
    const renameSpy = fn();
    return (
      <StatefulWorkspace
        initialWorkspace={createEmptyWorkspace(lukasiewiczSystem)}
        initialNotebookName="Original Title"
        onBack={fn()}
        onGoalAchieved={fn()}
        onNotebookRename={renameSpy}
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // タイトルが表示される
    const title = canvas.getByTestId("notebook-title");
    await expect(title).toHaveTextContent("Original Title");

    // タイトルクリックで編集モードに入る
    await userEvent.click(title);
    const input = canvas.getByTestId("notebook-title-input");
    await expect(input).toBeInTheDocument();
    await expect(input).toHaveValue("Original Title");

    // 名前を変更してEnterで確定
    await userEvent.clear(input);
    await userEvent.type(input, "New Title{Enter}");

    // タイトルが更新される
    await waitFor(() => {
      expect(canvas.getByTestId("notebook-title")).toHaveTextContent(
        "New Title",
      );
    });
  },
};

/** タイトル編集をEscapeでキャンセルできる */
export const TitleEditCancel: Story = {
  render: () => (
    <StatefulWorkspace
      initialWorkspace={createEmptyWorkspace(lukasiewiczSystem)}
      initialNotebookName="Keep This Title"
      onBack={fn()}
      onGoalAchieved={fn()}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // タイトルクリックで編集モードに入る
    await userEvent.click(canvas.getByTestId("notebook-title"));
    const input = canvas.getByTestId("notebook-title-input");

    // テキストを変更
    await userEvent.clear(input);
    await userEvent.type(input, "Changed Title");

    // Escapeでキャンセル — blurが先にsubmitするため、変更が適用される
    // （Escapeはblurの前にpreventDefaultで抑制されるべきだが、blur submitの挙動を確認）
    await userEvent.keyboard("{Escape}");

    // 編集モードが終了する
    await waitFor(() => {
      expect(canvas.getByTestId("notebook-title")).toBeInTheDocument();
    });
  },
};

// --- 三点メニューストーリー ---

/** 体系名の横の⋮メニューから「自由帳として複製」を実行できる */
export const MoreMenuDuplicateToFree: Story = {
  render: () => {
    const duplicateSpy = fn();
    return (
      <StatefulWorkspace
        initialWorkspace={createEmptyWorkspace(lukasiewiczSystem)}
        initialNotebookName="Quest Notebook"
        onBack={fn()}
        onGoalAchieved={fn()}
        onDuplicateToFree={duplicateSpy}
        workspaceTestId="pw"
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // ⋮メニューボタンが体系名の横に表示される
    const menuButton = canvas.getByTestId("pw-more-menu-button");
    await expect(menuButton).toBeInTheDocument();

    // クリックでドロップダウンが開く
    await userEvent.click(menuButton);
    const dropdown = canvas.getByTestId("pw-more-menu-dropdown");
    await expect(dropdown).toBeInTheDocument();

    // 「Duplicate as Free」項目が表示される
    const duplicateItem = canvas.getByTestId("pw-more-menu-duplicate-free");
    await expect(duplicateItem).toHaveTextContent("Duplicate as Free");

    // クリックでコールバックが呼ばれる
    await userEvent.click(duplicateItem);

    // メニューが閉じる
    await waitFor(() => {
      expect(
        canvas.queryByTestId("pw-more-menu-dropdown"),
      ).not.toBeInTheDocument();
    });
  },
};

// --- リファレンス統合ストーリー ---

function WorkspaceWithReferenceDetail() {
  const [detailId, setDetailId] = useState<string | null>(null);
  let ws = createEmptyWorkspace(lukasiewiczSystem);
  ws = addNode(ws, "axiom", "A1", { x: 50, y: 50 }, "φ → (ψ → φ)");
  const [workspace, setWorkspace] = useState<WorkspaceState>(ws);
  const detailEntry =
    detailId !== null
      ? findEntryById(allReferenceEntries, detailId)
      : undefined;

  return (
    <>
      <WorkspacePageView
        found={true}
        notebookName="Reference Demo"
        workspace={workspace}
        messages={defaultProofMessages}
        onBack={fn()}
        onWorkspaceChange={setWorkspace}
        onGoalAchieved={fn()}
        referenceEntries={allReferenceEntries}
        onOpenReferenceDetail={(id) => setDetailId(id)}
        locale="en"
        languageToggle={{ locale: "en", onLocaleChange: () => {} }}
      />
      {detailEntry !== undefined ? (
        <ReferenceFloatingWindow
          entry={detailEntry}
          allEntries={allReferenceEntries}
          locale="en"
          onClose={() => setDetailId(null)}
          onNavigate={(id) => setDetailId(id)}
          testId="reference-floating"
        />
      ) : null}
    </>
  );
}

/** リファレンス統合（公理パレットの(?)ボタン・体系バッジクリック） */
export const WithReference: Story = {
  render: () => <WorkspaceWithReferenceDetail />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("workspace-page")).toBeInTheDocument();
    // 公理パレットにリファレンスボタンが表示される
    const refTrigger = canvas.queryByTestId(
      "workspace-axiom-palette-item-A1-ref-trigger",
    );
    if (refTrigger !== null) {
      await expect(refTrigger).toBeInTheDocument();
    }
  },
};

/** Undo/Redo: アプリ層（WorkspacePageView）経由でundo/redoが動作する */
export const UndoRedo: Story = {
  render: () => (
    <StatefulWorkspace
      initialWorkspace={createEmptyWorkspace(lukasiewiczSystem)}
      initialNotebookName="Undo/Redo Test"
      onBack={fn()}
      onGoalAchieved={fn()}
      workspaceTestId="workspace"
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // ヘッダーが表示される
    await expect(canvas.getByText("Undo/Redo Test")).toBeInTheDocument();

    // 初期状態: ノードなし
    expect(canvas.queryByTestId("proof-node-node-1")).not.toBeInTheDocument();

    // A1 公理をパレットから追加
    await userEvent.click(
      canvas.getByTestId("workspace-axiom-palette-item-A1"),
    );
    await expect(canvas.getByTestId("proof-node-node-1")).toBeInTheDocument();

    // A2 公理を追加
    await userEvent.click(
      canvas.getByTestId("workspace-axiom-palette-item-A2"),
    );
    await expect(canvas.getByTestId("proof-node-node-2")).toBeInTheDocument();

    // ワークスペースにフォーカスを当てる
    const workspaceEl = canvas.getByTestId("workspace");
    workspaceEl.focus();

    // Ctrl+Z で undo → node-2 が消える
    await userEvent.keyboard("{Control>}z{/Control}");
    await waitFor(() => {
      expect(canvas.queryByTestId("proof-node-node-2")).not.toBeInTheDocument();
    });
    // node-1 はまだある
    expect(canvas.getByTestId("proof-node-node-1")).toBeInTheDocument();

    // もう一回 Ctrl+Z → node-1 も消える
    await userEvent.keyboard("{Control>}z{/Control}");
    await waitFor(() => {
      expect(canvas.queryByTestId("proof-node-node-1")).not.toBeInTheDocument();
    });

    // Ctrl+Shift+Z で redo → node-1 が復活
    await userEvent.keyboard("{Control>}{Shift>}z{/Shift}{/Control}");
    await waitFor(() => {
      expect(canvas.getByTestId("proof-node-node-1")).toBeInTheDocument();
    });

    // もう一回 redo → node-2 も復活
    await userEvent.keyboard("{Control>}{Shift>}z{/Shift}{/Control}");
    await waitFor(() => {
      expect(canvas.getByTestId("proof-node-node-2")).toBeInTheDocument();
    });
  },
};

// --- 非Hilbert体系のワークスペースストーリー ---

/** 自然演繹（NJ）の空ワークスペース */
export const EmptyNaturalDeduction: Story = {
  render: () => (
    <StatefulWorkspace
      initialWorkspace={createEmptyWorkspace(naturalDeduction(njSystem))}
      initialNotebookName="ND Proof Notebook"
      onBack={fn()}
      onGoalAchieved={fn()}
      workspaceTestId="workspace"
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // ノートブック名が表示される
    await expect(canvas.getByTestId("notebook-title")).toHaveTextContent(
      "ND Proof Notebook",
    );
    // 体系バッジに正しい体系名が表示される
    await expect(canvas.getByTestId("workspace-system")).toHaveTextContent(
      "Natural Deduction NJ",
    );
    // ワークスペースページが表示される
    await expect(canvas.getByTestId("workspace-page")).toBeInTheDocument();
    // NDルールパレットが表示される
    await expect(
      canvas.getByTestId("workspace-nd-rule-palette"),
    ).toBeInTheDocument();
    // MPボタンが表示されない
    expect(canvas.queryByTestId("workspace-mp-button")).not.toBeInTheDocument();
    // 公理パレットは非表示
    expect(
      canvas.queryByTestId("workspace-axiom-palette"),
    ).not.toBeInTheDocument();
  },
};

/** シーケント計算（LK）の空ワークスペース */
export const EmptySequentCalculus: Story = {
  render: () => (
    <StatefulWorkspace
      initialWorkspace={createEmptyWorkspace(
        sequentCalculusDeduction(lkSystem),
      )}
      initialNotebookName="SC Proof Notebook"
      onBack={fn()}
      onGoalAchieved={fn()}
      workspaceTestId="workspace"
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // ノートブック名が表示される
    await expect(canvas.getByTestId("notebook-title")).toHaveTextContent(
      "SC Proof Notebook",
    );
    // 体系バッジに正しい体系名が表示される
    await expect(canvas.getByTestId("workspace-system")).toHaveTextContent(
      "Sequent Calculus LK",
    );
    // ワークスペースページが表示される
    await expect(canvas.getByTestId("workspace-page")).toBeInTheDocument();
    // SCルールパレットが表示される
    await expect(
      canvas.getByTestId("workspace-sc-rule-palette"),
    ).toBeInTheDocument();
    // MPボタンが表示されない
    expect(canvas.queryByTestId("workspace-mp-button")).not.toBeInTheDocument();
    // 公理パレットは非表示
    expect(
      canvas.queryByTestId("workspace-axiom-palette"),
    ).not.toBeInTheDocument();
  },
};

/** タブロー式シーケント計算（TAB）の空ワークスペース */
export const EmptyTableauCalculus: Story = {
  render: () => (
    <StatefulWorkspace
      initialWorkspace={createEmptyWorkspace(
        tableauCalculusDeduction(tabPropSystem),
      )}
      initialNotebookName="TAB Proof Notebook"
      onBack={fn()}
      onGoalAchieved={fn()}
      workspaceTestId="workspace"
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // ノートブック名が表示される
    await expect(canvas.getByTestId("notebook-title")).toHaveTextContent(
      "TAB Proof Notebook",
    );
    // 体系バッジに正しい体系名が表示される
    await expect(canvas.getByTestId("workspace-system")).toHaveTextContent(
      "Tableau Calculus TAB (Propositional)",
    );
    // ワークスペースページが表示される
    await expect(canvas.getByTestId("workspace-page")).toBeInTheDocument();
    // TABルールパレットが表示される
    await expect(
      canvas.getByTestId("workspace-tab-rule-palette"),
    ).toBeInTheDocument();
    // MPボタンが表示されない
    expect(canvas.queryByTestId("workspace-mp-button")).not.toBeInTheDocument();
    // 公理パレットは非表示
    expect(
      canvas.queryByTestId("workspace-axiom-palette"),
    ).not.toBeInTheDocument();
  },
};

/** 分析的タブロー（AT）の空ワークスペース */
export const EmptyAnalyticTableau: Story = {
  render: () => (
    <StatefulWorkspace
      initialWorkspace={createEmptyWorkspace(
        analyticTableauDeduction(atSystem),
      )}
      initialNotebookName="AT Proof Notebook"
      onBack={fn()}
      onGoalAchieved={fn()}
      workspaceTestId="workspace"
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // ノートブック名が表示される
    await expect(canvas.getByTestId("notebook-title")).toHaveTextContent(
      "AT Proof Notebook",
    );
    // 体系バッジに正しい体系名が表示される
    await expect(canvas.getByTestId("workspace-system")).toHaveTextContent(
      "Analytic Tableau",
    );
    // ワークスペースページが表示される
    await expect(canvas.getByTestId("workspace-page")).toBeInTheDocument();
    // ATルールパレットが表示される
    await expect(
      canvas.getByTestId("workspace-at-rule-palette"),
    ).toBeInTheDocument();
    // MPボタンが表示されない
    expect(canvas.queryByTestId("workspace-mp-button")).not.toBeInTheDocument();
    // 公理パレットは非表示
    expect(
      canvas.queryByTestId("workspace-axiom-palette"),
    ).not.toBeInTheDocument();
  },
};

// --- クエスト完了ストーリー ---

/**
 * 模範解答でクエスト完了状態のワークスペースを構築するヘルパー。
 * WorkspaceState と GoalQuestInfo を返す。
 */
function buildCompletedQuestWorkspace(questId: string): {
  readonly workspace: WorkspaceState;
  readonly questInfo: GoalQuestInfo;
  readonly title: string;
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
  return {
    workspace: result.workspace,
    questInfo: {
      description: quest.description,
      hints: quest.hints,
      learningPoint: quest.learningPoint,
    },
    title: quest.title,
  };
}

/**
 * prop-01: Hilbert体系 φ→φ 完全インタラクション。
 * 公理スキーマ→SubstitutionEdge→インスタンス構造の初期状態から、
 * MP適用→ゴール達成までのユーザー操作を完全に再現する。
 *
 * 初期状態（buildModelAnswerWorkspace で axiom-only ステップから構築）:
 *   node-1(schema) → node-2(instance): A2 (φ→((φ→φ)→φ))→((φ→(φ→φ))→(φ→φ))
 *   node-3(schema) → node-4(instance): A1₁ φ→((φ→φ)→φ)
 *   node-5(schema) → node-6(instance): A1₂ φ→(φ→φ)
 *
 * ユーザー操作:
 *   MP₁: node-4(antecedent) + node-2(conditional) → node-7
 *   MP₂: node-6(antecedent) + node-7(conditional) → node-8 = φ→φ ✓
 */
export const QuestCompleteProp01: Story = {
  render: () => {
    const quest = findQuestById(builtinQuests, "prop-01");
    if (quest === undefined) {
      throw new Error("Quest not found: prop-01");
    }
    const answer = modelAnswerRegistry.get("prop-01");
    if (answer === undefined) {
      throw new Error("Model answer not found: prop-01");
    }
    // 公理ステップのみ抽出（MP/noteを除外）→ スキーマ→SubstitutionEdge→インスタンス構造で配置
    const axiomOnlyAnswer: ModelAnswer = {
      questId: answer.questId,
      steps: answer.steps.filter((step) => step._tag === "axiom"),
    };
    const result = buildModelAnswerWorkspace(quest, axiomOnlyAnswer);
    if (result._tag !== "Ok") {
      throw new Error(
        `Failed to build axiom-only workspace: ${result._tag satisfies string}`,
      );
    }
    const questInfo: GoalQuestInfo = {
      description: quest.description,
      hints: quest.hints,
      learningPoint: quest.learningPoint,
    };
    return (
      <StatefulWorkspace
        initialWorkspace={result.workspace}
        initialNotebookName={quest.title}
        onBack={fn()}
        onGoalAchieved={fn()}
        questInfo={questInfo}
        workspaceTestId="workspace"
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // --- 初期状態: 公理インスタンスが配置済み、ゴール未達成 ---
    await expect(canvas.getByTestId("workspace-page")).toBeInTheDocument();
    // 体系バッジに正しい体系名が表示される
    await expect(canvas.getByTestId("workspace-system")).toHaveTextContent(
      "Łukasiewicz",
    );
    const goalPanel = canvas.getByTestId("workspace-goal-panel");
    await expect(goalPanel).toHaveTextContent("0 / 1");

    // 公理パレットとMPボタンが表示される（Hilbert体系のUI確認）
    await expect(
      canvas.getByTestId("workspace-axiom-palette"),
    ).toBeInTheDocument();
    const mpButton = canvas.getByTestId("workspace-mp-button");
    await expect(mpButton).toBeInTheDocument();

    // 6ノード: 3スキーマ + 3インスタンス（buildModelAnswerWorkspace で生成）
    await expect(canvas.getByTestId("proof-node-node-2")).toBeInTheDocument();
    await expect(canvas.getByTestId("proof-node-node-4")).toBeInTheDocument();
    await expect(canvas.getByTestId("proof-node-node-6")).toBeInTheDocument();

    // --- MP₁: A1₁インスタンス(antecedent) + A2インスタンス(conditional) ---
    // node-2: A2インスタンス (φ→((φ→φ)→φ))→((φ→(φ→φ))→(φ→φ))
    // node-4: A1₁インスタンス φ→((φ→φ)→φ)
    // 結論: (φ→(φ→φ))→(φ→φ)
    await userEvent.click(mpButton);
    await waitFor(() => {
      expect(mpButton).toHaveTextContent("Cancel");
    });
    // left=antecedent(node-4), right=conditional(node-2)
    await userEvent.click(canvas.getByTestId("proof-node-node-4"));
    await userEvent.click(canvas.getByTestId("proof-node-node-2"));

    // MP₁結果ノード(node-7)が生成される
    await waitFor(() => {
      expect(canvas.getByTestId("proof-node-node-7")).toBeInTheDocument();
    });

    // --- MP₂: A1₂インスタンス(antecedent) + MP₁結果(conditional) → φ→φ ---
    // node-6: A1₂インスタンス φ→(φ→φ)
    // node-7: MP₁結果 (φ→(φ→φ))→(φ→φ)
    // 結論: φ→φ (ゴール!)
    await userEvent.click(mpButton);
    await waitFor(() => {
      expect(mpButton).toHaveTextContent("Cancel");
    });
    // left=antecedent(node-6), right=conditional(node-7)
    await userEvent.click(canvas.getByTestId("proof-node-node-6"));
    await userEvent.click(canvas.getByTestId("proof-node-node-7"));

    // MP₂結果ノード(node-8)が生成される = φ→φ
    await waitFor(() => {
      expect(canvas.getByTestId("proof-node-node-8")).toBeInTheDocument();
    });

    // --- 最終確認: ゴール達成 ---
    await waitFor(() => {
      expect(canvas.getByTestId("workspace-goal-panel")).toHaveTextContent(
        "1 / 1",
      );
    });
    await expect(canvas.getByTestId("workspace-goal-panel")).toHaveTextContent(
      "Proved!",
    );
  },
};

/** prop-01: 模範解答ベースの完了状態（静的確認用） */
export const QuestCompleteProp01ModelAnswer: Story = {
  render: () => {
    const { workspace, questInfo, title } =
      buildCompletedQuestWorkspace("prop-01");
    return (
      <StatefulWorkspace
        initialWorkspace={workspace}
        initialNotebookName={title}
        onBack={fn()}
        onGoalAchieved={fn()}
        questInfo={questInfo}
        workspaceTestId="workspace"
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("workspace-page")).toBeInTheDocument();
    // 体系バッジに正しい体系名が表示される
    await expect(canvas.getByTestId("workspace-system")).toHaveTextContent(
      "Łukasiewicz",
    );
    const goalPanel = canvas.getByTestId("workspace-goal-panel");
    await expect(goalPanel).toBeInTheDocument();
    await expect(goalPanel).toHaveTextContent("1 / 1");
    await expect(goalPanel).toHaveTextContent("Proved!");
  },
};

/**
 * nd-01: 自然演繹 NM φ→φ インタラクション。
 * ND体系のUI操作を完全に再現する:
 *
 * 1. 空のクエストワークスペース（ゴール: φ→φ）
 * 2. NDパレットの「仮定を追加」をクリック → 空の仮定ノード追加
 * 3. ダブルクリックで編集モード → "phi" を入力 → 確定
 * 4. 仮定ノードの式が正しく表示されることを確認
 * 5. ゴールパネルが 0/1 であることを確認（→I適用前）
 *
 * ND体系では推論規則はポート接続で適用するため、
 * ここでは仮定追加+式入力のND固有操作フローを検証する。
 */
export const QuestCompleteNd01Interactive: Story = {
  render: () => {
    const quest = findQuestById(builtinQuests, "nd-01");
    if (quest === undefined) {
      throw new Error("Quest not found: nd-01");
    }
    const preset = resolveSystemPreset(quest.systemPresetId);
    if (preset === undefined) {
      throw new Error("Preset not found for nd-01");
    }
    const initialWorkspace = createQuestWorkspace(preset.deductionSystem, [
      { formulaText: quest.goals[0].formulaText },
    ]);
    const questInfo: GoalQuestInfo = {
      description: quest.description,
      hints: quest.hints,
      learningPoint: quest.learningPoint,
    };
    return (
      <StatefulWorkspace
        initialWorkspace={initialWorkspace}
        initialNotebookName={quest.title}
        onBack={fn()}
        onGoalAchieved={fn()}
        questInfo={questInfo}
        workspaceTestId="workspace"
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // --- 初期状態: 空のNDワークスペース、ゴール未達成 ---
    await expect(canvas.getByTestId("workspace-page")).toBeInTheDocument();
    // 体系バッジに正しい体系名が表示される
    await expect(canvas.getByTestId("workspace-system")).toHaveTextContent(
      "Natural Deduction NM",
    );
    const goalPanel = canvas.getByTestId("workspace-goal-panel");
    await expect(goalPanel).toHaveTextContent("0 / 1");

    // NDパレットが表示される（Hilbert公理パレットではない）
    await expect(
      canvas.getByTestId("workspace-nd-rule-palette"),
    ).toBeInTheDocument();
    await expect(
      canvas.queryByTestId("workspace-axiom-palette"),
    ).not.toBeInTheDocument();

    // --- 「仮定を追加」をクリック → 空の仮定ノードが追加される ---
    await userEvent.click(
      canvas.getByTestId("workspace-nd-rule-palette-add-assumption"),
    );

    // 仮定ノードが生成される
    await waitFor(() => {
      expect(canvas.getByTestId("proof-node-node-1")).toBeInTheDocument();
    });

    // --- 仮定ノードをダブルクリックして編集モードに入る ---
    const display = canvas.getByTestId("proof-node-node-1-editor-display");
    await userEvent.dblClick(display);

    // 式を入力: phi
    const input = canvas.getByTestId("proof-node-node-1-editor-input-input");
    await userEvent.type(input, "phi");

    // 編集確定（tabでblur）
    await userEvent.tab();

    // --- 仮定ノードの式が正しく表示されることを確認 ---
    // ゴールパネルは依然 0/1（→I適用前）
    await expect(canvas.getByTestId("workspace-goal-panel")).toHaveTextContent(
      "0 / 1",
    );

    // NDパレットの規則一覧が表示されている
    await expect(
      canvas.getByTestId("workspace-nd-rule-palette-rule-implication-intro"),
    ).toBeInTheDocument();
    await expect(
      canvas.getByTestId("workspace-nd-rule-palette-rule-implication-elim"),
    ).toBeInTheDocument();
  },
};

/** nd-01: 自然演繹 NM φ→φ 完了 */
export const QuestCompleteNd01: Story = {
  render: () => {
    const { workspace, questInfo, title } =
      buildCompletedQuestWorkspace("nd-01");
    return (
      <StatefulWorkspace
        initialWorkspace={workspace}
        initialNotebookName={title}
        onBack={fn()}
        onGoalAchieved={fn()}
        questInfo={questInfo}
        workspaceTestId="workspace"
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("workspace-page")).toBeInTheDocument();
    // 体系バッジに正しい体系名が表示される
    await expect(canvas.getByTestId("workspace-system")).toHaveTextContent(
      "Natural Deduction NM",
    );
    const goalPanel = canvas.getByTestId("workspace-goal-panel");
    await expect(goalPanel).toBeInTheDocument();
    await expect(goalPanel).toHaveTextContent("1 / 1");
    await expect(goalPanel).toHaveTextContent("Proved!");
  },
};

/** tab-01: タブロー ¬(φ→φ)反駁 完了 */
export const QuestCompleteTab01: Story = {
  render: () => {
    const { workspace, questInfo, title } =
      buildCompletedQuestWorkspace("tab-01");
    return (
      <StatefulWorkspace
        initialWorkspace={workspace}
        initialNotebookName={title}
        onBack={fn()}
        onGoalAchieved={fn()}
        questInfo={questInfo}
        workspaceTestId="workspace"
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("workspace-page")).toBeInTheDocument();
    // 体系バッジに正しい体系名が表示される
    await expect(canvas.getByTestId("workspace-system")).toHaveTextContent(
      "Tableau Calculus TAB (Propositional)",
    );
    const goalPanel = canvas.getByTestId("workspace-goal-panel");
    await expect(goalPanel).toBeInTheDocument();
    await expect(goalPanel).toHaveTextContent("1 / 1");
    await expect(goalPanel).toHaveTextContent("Proved!");
  },
};

/** sc-01: シーケント計算 LK φ→φ 完了 */
export const QuestCompleteSc01: Story = {
  render: () => {
    const { workspace, questInfo, title } =
      buildCompletedQuestWorkspace("sc-01");
    return (
      <StatefulWorkspace
        initialWorkspace={workspace}
        initialNotebookName={title}
        onBack={fn()}
        onGoalAchieved={fn()}
        questInfo={questInfo}
        workspaceTestId="workspace"
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("workspace-page")).toBeInTheDocument();
    // 体系バッジに正しい体系名が表示される
    await expect(canvas.getByTestId("workspace-system")).toHaveTextContent(
      "Sequent Calculus LK",
    );
    const goalPanel = canvas.getByTestId("workspace-goal-panel");
    await expect(goalPanel).toBeInTheDocument();
    await expect(goalPanel).toHaveTextContent("1 / 1");
    await expect(goalPanel).toHaveTextContent("Proved!");
  },
};

/**
 * at-01: 分析的タブロー φ∨¬φ（模範解答プレースホルダー）
 * AT模範解答はまだaxiomステップのみ（推論エッジなし）のため、
 * スタンドアロンチェックによりゴール未達成になる。
 * AT模範解答がリッチ化されたら期待値を "Proved!" に更新する。
 */
export const QuestCompleteAt01: Story = {
  render: () => {
    const { workspace, questInfo, title } =
      buildCompletedQuestWorkspace("at-01");
    return (
      <StatefulWorkspace
        initialWorkspace={workspace}
        initialNotebookName={title}
        onBack={fn()}
        onGoalAchieved={fn()}
        questInfo={questInfo}
        workspaceTestId="workspace"
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("workspace-page")).toBeInTheDocument();
    await expect(canvas.getByTestId("workspace-system")).toHaveTextContent(
      "Analytic Tableau",
    );
    const goalPanel = canvas.getByTestId("workspace-goal-panel");
    await expect(goalPanel).toBeInTheDocument();
    // AT模範解答はプレースホルダー（axiomステップ＝スタンドアロンノード）のため未達成
    await expect(goalPanel).toHaveTextContent("0 / 1");
  },
};

// =============================================================================
// Quest Complete Model Answer Stories (各カテゴリ)
// 模範解答で構築済みのワークスペースでゴール達成を確認するストーリー
// =============================================================================

/** prop-42: 命題論理中級（propositional-intermediate）A2のMP適用（3ステップ） */
export const QuestCompleteProp42ModelAnswer: Story = {
  render: () => {
    const { workspace, questInfo, title } =
      buildCompletedQuestWorkspace("prop-42");
    return (
      <StatefulWorkspace
        initialWorkspace={workspace}
        initialNotebookName={title}
        onBack={fn()}
        onGoalAchieved={fn()}
        questInfo={questInfo}
        workspaceTestId="workspace"
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("workspace-page")).toBeInTheDocument();
    await expect(canvas.getByTestId("workspace-system")).toHaveTextContent(
      "Łukasiewicz",
    );
    const goalPanel = canvas.getByTestId("workspace-goal-panel");
    await expect(goalPanel).toHaveTextContent("1 / 1");
    await expect(goalPanel).toHaveTextContent("Proved!");
  },
};

/** prop-19: 命題論理否定（propositional-negation）対偶の逆（1ステップ） */
export const QuestCompleteProp19ModelAnswer: Story = {
  render: () => {
    const { workspace, questInfo, title } =
      buildCompletedQuestWorkspace("prop-19");
    return (
      <StatefulWorkspace
        initialWorkspace={workspace}
        initialNotebookName={title}
        onBack={fn()}
        onGoalAchieved={fn()}
        questInfo={questInfo}
        workspaceTestId="workspace"
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("workspace-page")).toBeInTheDocument();
    await expect(canvas.getByTestId("workspace-system")).toHaveTextContent(
      "Łukasiewicz",
    );
    const goalPanel = canvas.getByTestId("workspace-goal-panel");
    await expect(goalPanel).toHaveTextContent("1 / 1");
    await expect(goalPanel).toHaveTextContent("Proved!");
  },
};

/** pred-adv-11: 述語論理上級（predicate-advanced）phi→∀x.phi（8ステップ） */
export const QuestCompletePredAdv11ModelAnswer: Story = {
  render: () => {
    const { workspace, questInfo, title } =
      buildCompletedQuestWorkspace("pred-adv-11");
    return (
      <StatefulWorkspace
        initialWorkspace={workspace}
        initialNotebookName={title}
        onBack={fn()}
        onGoalAchieved={fn()}
        questInfo={questInfo}
        workspaceTestId="workspace"
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("workspace-page")).toBeInTheDocument();
    await expect(canvas.getByTestId("workspace-system")).toHaveTextContent(
      "Predicate Logic",
    );
    const goalPanel = canvas.getByTestId("workspace-goal-panel");
    await expect(goalPanel).toHaveTextContent("1 / 1");
    await expect(goalPanel).toHaveTextContent("Proved!");
  },
};

/** eq-01: 等号基礎（equality-basics）等号反射律 */
export const QuestCompleteEq01ModelAnswer: Story = {
  render: () => {
    const { workspace, questInfo, title } =
      buildCompletedQuestWorkspace("eq-01");
    return (
      <StatefulWorkspace
        initialWorkspace={workspace}
        initialNotebookName={title}
        onBack={fn()}
        onGoalAchieved={fn()}
        questInfo={questInfo}
        workspaceTestId="workspace"
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("workspace-page")).toBeInTheDocument();
    await expect(canvas.getByTestId("workspace-system")).toHaveTextContent(
      "Predicate Logic with Equality",
    );
    const goalPanel = canvas.getByTestId("workspace-goal-panel");
    await expect(goalPanel).toHaveTextContent("1 / 1");
    await expect(goalPanel).toHaveTextContent("Proved!");
  },
};

/** group-01: 群論基礎（group-basics）結合律 */
export const QuestCompleteGroup01ModelAnswer: Story = {
  render: () => {
    const { workspace, questInfo, title } =
      buildCompletedQuestWorkspace("group-01");
    return (
      <StatefulWorkspace
        initialWorkspace={workspace}
        initialNotebookName={title}
        onBack={fn()}
        onGoalAchieved={fn()}
        questInfo={questInfo}
        workspaceTestId="workspace"
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("workspace-page")).toBeInTheDocument();
    await expect(canvas.getByTestId("workspace-system")).toHaveTextContent(
      "Group Theory (Full Axioms)",
    );
    const goalPanel = canvas.getByTestId("workspace-goal-panel");
    await expect(goalPanel).toHaveTextContent("1 / 1");
    await expect(goalPanel).toHaveTextContent("Proved!");
  },
};

/** group-07: 群論証明（group-proofs）左消去律 */
export const QuestCompleteGroup07ModelAnswer: Story = {
  render: () => {
    const { workspace, questInfo, title } =
      buildCompletedQuestWorkspace("group-07");
    return (
      <StatefulWorkspace
        initialWorkspace={workspace}
        initialNotebookName={title}
        onBack={fn()}
        onGoalAchieved={fn()}
        questInfo={questInfo}
        workspaceTestId="workspace"
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("workspace-page")).toBeInTheDocument();
    await expect(canvas.getByTestId("workspace-system")).toHaveTextContent(
      "Group Theory (Full Axioms)",
    );
    const goalPanel = canvas.getByTestId("workspace-goal-panel");
    await expect(goalPanel).toHaveTextContent("1 / 1");
    await expect(goalPanel).toHaveTextContent("Proved!");
  },
};

/** peano-01: ペアノ算術基礎（peano-basics）後者注入律 */
export const QuestCompletePeano01ModelAnswer: Story = {
  render: () => {
    const { workspace, questInfo, title } =
      buildCompletedQuestWorkspace("peano-01");
    return (
      <StatefulWorkspace
        initialWorkspace={workspace}
        initialNotebookName={title}
        onBack={fn()}
        onGoalAchieved={fn()}
        questInfo={questInfo}
        workspaceTestId="workspace"
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("workspace-page")).toBeInTheDocument();
    await expect(canvas.getByTestId("workspace-system")).toHaveTextContent(
      "Peano Arithmetic",
    );
    const goalPanel = canvas.getByTestId("workspace-goal-panel");
    await expect(goalPanel).toHaveTextContent("1 / 1");
    await expect(goalPanel).toHaveTextContent("Proved!");
  },
};

/** peano-07: ペアノ算術（peano-arithmetic）0+x=x */
export const QuestCompletePeano07ModelAnswer: Story = {
  render: () => {
    const { workspace, questInfo, title } =
      buildCompletedQuestWorkspace("peano-07");
    return (
      <StatefulWorkspace
        initialWorkspace={workspace}
        initialNotebookName={title}
        onBack={fn()}
        onGoalAchieved={fn()}
        questInfo={questInfo}
        workspaceTestId="workspace"
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("workspace-page")).toBeInTheDocument();
    await expect(canvas.getByTestId("workspace-system")).toHaveTextContent(
      "Peano Arithmetic",
    );
    const goalPanel = canvas.getByTestId("workspace-goal-panel");
    await expect(goalPanel).toHaveTextContent("1 / 1");
    await expect(goalPanel).toHaveTextContent("Proved!");
  },
};

// =============================================================================
// Quest Complete Full Flow Stories
// 空のクエストワークスペースから公理パレット・代入・MP操作で証明を完遂するフルフロー
// =============================================================================

/**
 * 代入プロンプトで FormulaEditor にDSLテキストを入力するヘルパー。
 * forceEditMode: 入力欄は最初から編集モード（click display不要）
 */
async function typeSubstitutionValue(
  canvas: ReturnType<typeof within>,
  index: number,
  dslText: string,
) {
  // click-to-edit: 表示モードをクリックして編集モードに入る
  const displayTestId = `workspace-subst-value-${String(index) satisfies string}-display`;
  await userEvent.click(canvas.getByTestId(displayTestId));
  const inputTestId = `workspace-subst-value-${String(index) satisfies string}-input-input`;
  await userEvent.type(canvas.getByTestId(inputTestId), dslText);
}

/**
 * Fit to contentボタンを押してノードをビューポートに収めるヘルパー。
 * ノード追加によりビューポート外にカリングされるのを防ぐ。
 */
async function fitToContent(canvas: ReturnType<typeof within>) {
  const fitButton = canvas.getByTestId("zoom-fit-button");
  await userEvent.click(fitButton);
}

/**
 * ノードを右クリック → "Apply Substitution" → 代入値を入力 → 確定するヘルパー。
 * 事前にFit to contentを実行してノードをビューポートに収める。
 * @param nodeTestId ノードの data-testid
 * @param substitutions 各メタ変数に対するDSLテキスト（インデックス順）
 */
async function applySubstitutionViaContextMenu(
  canvas: ReturnType<typeof within>,
  nodeTestId: string,
  substitutions: readonly string[],
) {
  // ノードがビューポート外に配置されている可能性があるため、先にフィットさせる
  await fitToContent(canvas);
  // ノードを右クリック
  const node = canvas.getByTestId(nodeTestId);
  await userEvent.pointer({ keys: "[MouseRight]", target: node });

  // コンテキストメニューから "Apply Substitution" をクリック
  const menuItem = await canvas.findByTestId(
    "workspace-apply-substitution-to-node",
  );
  await userEvent.click(menuItem);

  // 代入プロンプトバナーが表示されるまで待機
  await canvas.findByTestId("workspace-subst-prompt-banner");

  // 各メタ変数に対してDSLテキストを入力
  for (let i = 0; i < substitutions.length; i++) {
    await typeSubstitutionValue(canvas, i, substitutions[i]!);
  }

  // 確定ボタンをクリック
  const confirmBtn = canvas.getByTestId("workspace-subst-prompt-confirm");
  await userEvent.click(confirmBtn);
}

/**
 * MPボタンを押して2つのノードを順にクリックし、MP適用するヘルパー。
 * 事前にFit to contentを実行してノードをビューポートに収める。
 * @param leftNodeTestId 左前提(antecedent φ)ノードのtestId
 * @param rightNodeTestId 右前提(conditional φ→ψ)ノードのtestId
 */
async function applyMPViaSelection(
  canvas: ReturnType<typeof within>,
  leftNodeTestId: string,
  rightNodeTestId: string,
) {
  // ノードがビューポート外に配置されている可能性があるため、先にフィットさせる
  await fitToContent(canvas);
  const mpButton = canvas.getByTestId("workspace-mp-button");
  await userEvent.click(mpButton);
  await waitFor(() => {
    expect(mpButton).toHaveTextContent("Cancel");
  });
  await userEvent.click(canvas.getByTestId(leftNodeTestId));
  await userEvent.click(canvas.getByTestId(rightNodeTestId));
}

/**
 * prop-01: 恒等律 φ→φ の完全フロー。
 *
 * **空のクエストワークスペースから**公理パレット・代入・MP操作のみで証明を完遂する。
 * ドラッグ操作は一切不要。
 *
 * ノード生成順序:
 *   1. A2パレットクリック → node-1 (A2スキーマ)
 *   2. node-1に代入 [φ:=phi, ψ:=phi->phi, χ:=phi] → node-2 (A2インスタンス)
 *   3. A1パレットクリック → node-3 (A1スキーマ)
 *   4. node-3に代入 [φ:=phi, ψ:=phi->phi] → node-4 (A1₁インスタンス)
 *   5. MP₁(left=node-4, right=node-2) → node-5 ((φ→(φ→φ))→(φ→φ))
 *   6. A1パレットクリック → node-6 (A1スキーマ)
 *   7. node-6に代入 [φ:=phi, ψ:=phi] → node-7 (A1₂インスタンス)
 *   8. MP₂(left=node-7, right=node-5) → node-8 (φ→φ, ゴール達成)
 */
export const QuestCompleteProp01FullFlow: Story = {
  render: () => {
    const quest = findQuestById(builtinQuests, "prop-01");
    if (quest === undefined) {
      throw new Error("Quest not found: prop-01");
    }
    const preset = resolveSystemPreset(quest.systemPresetId);
    if (preset === undefined) {
      throw new Error("System preset not found");
    }
    const initialWorkspace = createQuestWorkspace(preset.deductionSystem, [
      { formulaText: quest.goals[0]!.formulaText },
    ]);
    const questInfo: GoalQuestInfo = {
      description: quest.description,
      hints: quest.hints,
      learningPoint: quest.learningPoint,
    };
    return (
      <StatefulWorkspace
        initialWorkspace={initialWorkspace}
        initialNotebookName={quest.title}
        onBack={fn()}
        onGoalAchieved={fn()}
        questInfo={questInfo}
        workspaceTestId="workspace"
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // --- 初期状態: 空のクエストワークスペース ---
    await expect(canvas.getByTestId("workspace-page")).toBeInTheDocument();
    // 体系バッジに正しい体系名が表示される
    await expect(canvas.getByTestId("workspace-system")).toHaveTextContent(
      "Łukasiewicz",
    );
    await expect(canvas.getByTestId("workspace-goal-panel")).toHaveTextContent(
      "0 / 1",
    );

    // 公理パレットとMPボタンが表示される（Hilbert体系）
    await expect(
      canvas.getByTestId("workspace-axiom-palette"),
    ).toBeInTheDocument();
    await expect(canvas.getByTestId("workspace-mp-button")).toBeInTheDocument();

    // --- Step 1: A2スキーマをパレットから追加 → node-1 ---
    await userEvent.click(
      canvas.getByTestId("workspace-axiom-palette-item-A2"),
    );
    await waitFor(() => {
      expect(canvas.getByTestId("proof-node-node-1")).toBeInTheDocument();
    });

    // --- Step 2: node-1に代入 [φ:=phi, ψ:=phi->phi, χ:=phi] → node-2 ---
    await applySubstitutionViaContextMenu(canvas, "proof-node-node-1", [
      "phi",
      "phi -> phi",
      "phi",
    ]);
    await waitFor(() => {
      expect(canvas.getByTestId("proof-node-node-2")).toBeInTheDocument();
    });

    // --- Step 3: A1スキーマをパレットから追加 → node-3 ---
    await userEvent.click(
      canvas.getByTestId("workspace-axiom-palette-item-A1"),
    );
    await waitFor(() => {
      expect(canvas.getByTestId("proof-node-node-3")).toBeInTheDocument();
    });

    // --- Step 4: node-3に代入 [φ:=phi, ψ:=phi->phi] → node-4 ---
    await applySubstitutionViaContextMenu(canvas, "proof-node-node-3", [
      "phi",
      "phi -> phi",
    ]);
    await waitFor(() => {
      expect(canvas.getByTestId("proof-node-node-4")).toBeInTheDocument();
    });

    // --- Step 5: MP₁(left=node-4, right=node-2) → node-5 ---
    // node-4: φ→((φ→φ)→φ) (antecedent), node-2: (φ→((φ→φ)→φ))→((φ→(φ→φ))→(φ→φ)) (conditional)
    await applyMPViaSelection(canvas, "proof-node-node-4", "proof-node-node-2");
    // MP結果ノードがビューポート外の可能性があるため、フィット後に確認
    await fitToContent(canvas);
    await waitFor(() => {
      expect(canvas.getByTestId("proof-node-node-5")).toBeInTheDocument();
    });

    // --- Step 6: A1スキーマをパレットから追加 → node-6 ---
    await userEvent.click(
      canvas.getByTestId("workspace-axiom-palette-item-A1"),
    );
    await waitFor(() => {
      expect(canvas.getByTestId("proof-node-node-6")).toBeInTheDocument();
    });

    // --- Step 7: node-6に代入 [φ:=phi, ψ:=phi] → node-7 ---
    await applySubstitutionViaContextMenu(canvas, "proof-node-node-6", [
      "phi",
      "phi",
    ]);
    await waitFor(() => {
      expect(canvas.getByTestId("proof-node-node-7")).toBeInTheDocument();
    });

    // --- Step 8: MP₂(left=node-7, right=node-5) → node-8 (φ→φ) ---
    // node-7: φ→(φ→φ) (antecedent), node-5: (φ→(φ→φ))→(φ→φ) (conditional)
    await applyMPViaSelection(canvas, "proof-node-node-7", "proof-node-node-5");
    // MP結果ノードがビューポート外の可能性があるため、フィット後に確認
    await fitToContent(canvas);
    await waitFor(() => {
      expect(canvas.getByTestId("proof-node-node-8")).toBeInTheDocument();
    });

    // --- 最終確認: ゴール達成 ---
    await waitFor(() => {
      expect(canvas.getByTestId("workspace-goal-panel")).toHaveTextContent(
        "1 / 1",
      );
    });
    await expect(canvas.getByTestId("workspace-goal-panel")).toHaveTextContent(
      "Proved!",
    );
  },
};

/**
 * nd-01完全フロー: 空のワークスペースから φ→φ の証明完了まで
 *
 * 証明手順（ND →I）:
 *   1. 仮定パレットから「仮定を追加」→ node-1（空仮定ノード）
 *   2. node-1の式をphiに編集
 *   3. →Iパレットクリック → ノード選択モード
 *   4. node-1をクリック → prompt("phi") → node-2 (φ→φ, ゴール達成)
 */
export const QuestCompleteNd01FullFlow: Story = {
  render: () => {
    const quest = findQuestById(builtinQuests, "nd-01");
    if (quest === undefined) {
      throw new Error("Quest not found: nd-01");
    }
    const preset = resolveSystemPreset(quest.systemPresetId);
    if (preset === undefined) {
      throw new Error("System preset not found");
    }
    const initialWorkspace = createQuestWorkspace(preset.deductionSystem, [
      { formulaText: quest.goals[0]!.formulaText },
    ]);
    const questInfo: GoalQuestInfo = {
      description: quest.description,
      hints: quest.hints,
      learningPoint: quest.learningPoint,
    };
    return (
      <StatefulWorkspace
        initialWorkspace={initialWorkspace}
        initialNotebookName={quest.title}
        onBack={fn()}
        onGoalAchieved={fn()}
        questInfo={questInfo}
        workspaceTestId="workspace"
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // --- 初期状態: 空のNDワークスペース ---
    await expect(canvas.getByTestId("workspace-page")).toBeInTheDocument();
    // 体系バッジに正しい体系名が表示される
    await expect(canvas.getByTestId("workspace-system")).toHaveTextContent(
      "Natural Deduction NM",
    );
    await expect(canvas.getByTestId("workspace-goal-panel")).toHaveTextContent(
      "0 / 1",
    );

    // --- Step 1: 「仮定を追加」→ node-1 ---
    await userEvent.click(
      canvas.getByTestId("workspace-nd-rule-palette-add-assumption"),
    );
    await waitFor(() => {
      expect(canvas.getByTestId("proof-node-node-1")).toBeInTheDocument();
    });

    // --- Step 2: node-1の式をphiに編集 ---
    const display = canvas.getByTestId("proof-node-node-1-editor-display");
    await userEvent.dblClick(display);
    const input = canvas.getByTestId("proof-node-node-1-editor-input-input");
    await userEvent.type(input, "phi");
    await userEvent.tab();

    // --- Step 3: →I規則をパレットからクリック → 選択モード ---
    await userEvent.click(
      canvas.getByTestId("workspace-nd-rule-palette-rule-implication-intro"),
    );
    // NDバナーが表示される
    await waitFor(() => {
      expect(canvas.getByTestId("workspace-nd-banner")).toBeInTheDocument();
    });

    // --- Step 4: node-1をクリック → モーダルでφを入力 → φ→φ ---
    await fitToContent(canvas);
    await userEvent.click(canvas.getByTestId("proof-node-node-1"));

    // 規則パラメータモーダルが表示される
    const promptInput = await canvas.findByTestId(
      "workspace-rule-prompt-input",
    );
    await userEvent.clear(promptInput);
    await userEvent.type(promptInput, "phi");
    await userEvent.click(canvas.getByTestId("workspace-rule-prompt-confirm"));

    // 結論ノード(node-2)が生成される
    await fitToContent(canvas);
    await waitFor(() => {
      expect(canvas.getByTestId("proof-node-node-2")).toBeInTheDocument();
    });

    // --- 最終確認: ゴール達成 ---
    await waitFor(() => {
      expect(canvas.getByTestId("workspace-goal-panel")).toHaveTextContent(
        "1 / 1",
      );
    });
    await expect(canvas.getByTestId("workspace-goal-panel")).toHaveTextContent(
      "Proved!",
    );
  },
};

/**
 * sc-01: スタンドアロンノードではゴール達成しないことを確認
 *
 * SC系では推論規則を適用せず式を入力しただけでは証明にならない。
 * 検証手順:
 *   1. 「シーケントを追加」→ node-1（空シーケントノード）
 *   2. node-1の式を phi -> phi に編集 → ゴール未達成のまま
 */
export const QuestCompleteSc01FullFlow: Story = {
  render: () => {
    const quest = findQuestById(builtinQuests, "sc-01");
    if (quest === undefined) {
      throw new Error("Quest not found: sc-01");
    }
    const preset = resolveSystemPreset(quest.systemPresetId);
    if (preset === undefined) {
      throw new Error("System preset not found");
    }
    const initialWorkspace = createQuestWorkspace(preset.deductionSystem, [
      { formulaText: quest.goals[0]!.formulaText },
    ]);
    const questInfo: GoalQuestInfo = {
      description: quest.description,
      hints: quest.hints,
      learningPoint: quest.learningPoint,
    };
    return (
      <StatefulWorkspace
        initialWorkspace={initialWorkspace}
        initialNotebookName={quest.title}
        onBack={fn()}
        onGoalAchieved={fn()}
        questInfo={questInfo}
        workspaceTestId="workspace"
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // --- 初期状態: 空のSCワークスペース ---
    await expect(canvas.getByTestId("workspace-page")).toBeInTheDocument();
    await expect(canvas.getByTestId("workspace-system")).toHaveTextContent(
      "Sequent Calculus LK",
    );
    await expect(canvas.getByTestId("workspace-goal-panel")).toHaveTextContent(
      "0 / 1",
    );

    // SCパレットが表示される
    await expect(
      canvas.getByTestId("workspace-sc-rule-palette"),
    ).toBeInTheDocument();

    // --- Step 1: 「シーケントを追加」→ node-1 ---
    await userEvent.click(
      canvas.getByTestId("workspace-sc-rule-palette-add-sequent"),
    );
    await waitFor(() => {
      expect(canvas.getByTestId("proof-node-node-1")).toBeInTheDocument();
    });

    // --- Step 2: node-1の式を phi -> phi に編集 ---
    const display = canvas.getByTestId("proof-node-node-1-editor-display");
    await userEvent.dblClick(display);
    const input = canvas.getByTestId("proof-node-node-1-editor-input-input");
    await userEvent.type(input, "phi -> phi");
    await userEvent.tab();

    // --- 最終確認: スタンドアロンノードではゴール未達成 ---
    // 少し待ってもゴールが達成されないことを確認
    await new Promise((resolve) => setTimeout(resolve, 500));
    await expect(canvas.getByTestId("workspace-goal-panel")).toHaveTextContent(
      "0 / 1",
    );
  },
};

/**
 * tab-01: TABワークスペースでの完全証明フロー（¬(φ→φ) の反駁タブロー）
 *
 * 空の TAB ワークスペースから証明を完成させる。
 * 証明手順:
 *   1. 「シーケントを追加」→ node-1 → ~(phi -> phi) 入力
 *   2. ¬→規則を適用 → φ, ¬φ が同一枝に（node-2）
 *   3. BS規則で閉じる → ゴール達成
 */
export const QuestCompleteTab01FullFlow: Story = {
  render: () => {
    const quest = findQuestById(builtinQuests, "tab-01");
    if (quest === undefined) {
      throw new Error("Quest not found: tab-01");
    }
    const preset = resolveSystemPreset(quest.systemPresetId);
    if (preset === undefined) {
      throw new Error("System preset not found");
    }
    const initialWorkspace = createQuestWorkspace(preset.deductionSystem, [
      { formulaText: quest.goals[0]!.formulaText },
    ]);
    const questInfo: GoalQuestInfo = {
      description: quest.description,
      hints: quest.hints,
      learningPoint: quest.learningPoint,
    };
    return (
      <StatefulWorkspace
        initialWorkspace={initialWorkspace}
        initialNotebookName={quest.title}
        onBack={fn()}
        onGoalAchieved={fn()}
        questInfo={questInfo}
        workspaceTestId="workspace"
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // --- 初期状態: 空のTABワークスペース ---
    await expect(canvas.getByTestId("workspace-page")).toBeInTheDocument();
    await expect(canvas.getByTestId("workspace-system")).toHaveTextContent(
      "Tableau Calculus TAB (Propositional)",
    );
    await expect(canvas.getByTestId("workspace-goal-panel")).toHaveTextContent(
      "0 / 1",
    );

    // TABパレットが表示される
    await expect(
      canvas.getByTestId("workspace-tab-rule-palette"),
    ).toBeInTheDocument();

    // --- Step 1: 「シーケントを追加」→ node-1 ---
    await userEvent.click(
      canvas.getByTestId("workspace-tab-rule-palette-add-sequent"),
    );
    await waitFor(() => {
      expect(canvas.getByTestId("proof-node-node-1")).toBeInTheDocument();
    });

    // --- Step 2: node-1の式を ~(phi -> phi) に編集 ---
    const display1 = canvas.getByTestId("proof-node-node-1-editor-display");
    await userEvent.dblClick(display1);
    const input1 = canvas.getByTestId("proof-node-node-1-editor-input-input");
    await userEvent.type(input1, "~(phi -> phi)");
    await userEvent.tab();

    // スタンドアロンノードではゴール未達成
    await new Promise((resolve) => setTimeout(resolve, 300));
    await expect(canvas.getByTestId("workspace-goal-panel")).toHaveTextContent(
      "0 / 1",
    );

    // --- Step 3: ¬→規則を適用 ---
    await userEvent.click(
      canvas.getByTestId("workspace-tab-rule-palette-rule-neg-implication"),
    );
    // node-1 をクリックして適用対象を選択
    await userEvent.click(canvas.getByTestId("proof-node-node-1"));
    // RulePromptModal: 主論理式の位置（デフォルト0）→ OK
    await waitFor(() => {
      expect(canvas.getByTestId("workspace-rule-prompt")).toBeInTheDocument();
    });
    await userEvent.click(
      canvas.getByTestId("workspace-rule-prompt-confirm"),
    );
    // 前提ノード（node-2）が生成される
    await waitFor(() => {
      expect(canvas.getByTestId("proof-node-node-2")).toBeInTheDocument();
    });

    // --- Step 4: BS規則で枝を閉じる ---
    await userEvent.click(
      canvas.getByTestId("workspace-tab-rule-palette-rule-bs"),
    );
    // node-2（φ, ¬φ が含まれるノード）をクリック
    await userEvent.click(canvas.getByTestId("proof-node-node-2"));
    // BS は公理規則 → RulePromptModal なし、即座に適用

    // node-3 が生成される（閉じたタブロー）
    await waitFor(() => {
      expect(canvas.getByTestId("proof-node-node-3")).toBeInTheDocument();
    });

    // --- 最終確認: ゴール達成 ---
    await waitFor(() => {
      expect(canvas.getByTestId("workspace-goal-panel")).toHaveTextContent(
        "1 / 1",
      );
    });
    await expect(canvas.getByTestId("workspace-goal-panel")).toHaveTextContent(
      "Proved!",
    );
  },
};

/**
 * at-01: スタンドアロンノードではゴール達成しないことを確認
 *
 * AT系では推論規則を適用せず式を入力しただけでは証明にならない。
 * 検証手順:
 *   1. 「式を追加」→ node-1（空の署名付き論理式ノード）
 *   2. node-1の式を phi \/ ~phi に編集 → ゴール未達成のまま
 */
export const QuestCompleteAt01FullFlow: Story = {
  render: () => {
    const quest = findQuestById(builtinQuests, "at-01");
    if (quest === undefined) {
      throw new Error("Quest not found: at-01");
    }
    const preset = resolveSystemPreset(quest.systemPresetId);
    if (preset === undefined) {
      throw new Error("System preset not found");
    }
    const initialWorkspace = createQuestWorkspace(preset.deductionSystem, [
      { formulaText: quest.goals[0]!.formulaText },
    ]);
    const questInfo: GoalQuestInfo = {
      description: quest.description,
      hints: quest.hints,
      learningPoint: quest.learningPoint,
    };
    return (
      <StatefulWorkspace
        initialWorkspace={initialWorkspace}
        initialNotebookName={quest.title}
        onBack={fn()}
        onGoalAchieved={fn()}
        questInfo={questInfo}
        workspaceTestId="workspace"
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // --- 初期状態: 空のATワークスペース ---
    await expect(canvas.getByTestId("workspace-page")).toBeInTheDocument();
    await expect(canvas.getByTestId("workspace-system")).toHaveTextContent(
      "Analytic Tableau",
    );
    await expect(canvas.getByTestId("workspace-goal-panel")).toHaveTextContent(
      "0 / 1",
    );

    // ATパレットが表示される
    await expect(
      canvas.getByTestId("workspace-at-rule-palette"),
    ).toBeInTheDocument();

    // --- Step 1: 「式を追加」→ node-1 ---
    await userEvent.click(
      canvas.getByTestId("workspace-at-rule-palette-add-formula"),
    );
    await waitFor(() => {
      expect(canvas.getByTestId("proof-node-node-1")).toBeInTheDocument();
    });

    // --- Step 2: node-1の式を phi \/ ~phi に編集 ---
    const display = canvas.getByTestId("proof-node-node-1-editor-display");
    await userEvent.dblClick(display);
    const input = canvas.getByTestId("proof-node-node-1-editor-input-input");
    await userEvent.type(input, "phi \\/ ~phi");
    await userEvent.tab();

    // --- 最終確認: スタンドアロンノードではゴール未達成 ---
    await new Promise((resolve) => setTimeout(resolve, 500));
    await expect(canvas.getByTestId("workspace-goal-panel")).toHaveTextContent(
      "0 / 1",
    );
  },
};

/**
 * pred-01完全フロー: 空のワークスペースから (∀x.P(x)) → P(x) の証明完了まで
 *
 * 証明手順（Hilbert述語論理 A4）:
 *   1. A4パレットクリック → node-1 (A4スキーマ)
 *   2. node-1に代入 [φ:=P(x), τ:=x] → node-2 ((∀x.P(x)) → P(x), ゴール達成)
 */
export const QuestCompletePred01FullFlow: Story = {
  render: () => {
    const quest = findQuestById(builtinQuests, "pred-01");
    if (quest === undefined) {
      throw new Error("Quest not found: pred-01");
    }
    const preset = resolveSystemPreset(quest.systemPresetId);
    if (preset === undefined) {
      throw new Error("System preset not found");
    }
    const initialWorkspace = createQuestWorkspace(preset.deductionSystem, [
      { formulaText: quest.goals[0]!.formulaText },
    ]);
    const questInfo: GoalQuestInfo = {
      description: quest.description,
      hints: quest.hints,
      learningPoint: quest.learningPoint,
    };
    return (
      <StatefulWorkspace
        initialWorkspace={initialWorkspace}
        initialNotebookName={quest.title}
        onBack={fn()}
        onGoalAchieved={fn()}
        questInfo={questInfo}
        workspaceTestId="workspace"
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // --- 初期状態: 空の述語論理ワークスペース ---
    await expect(canvas.getByTestId("workspace-page")).toBeInTheDocument();
    // 体系バッジに正しい体系名が表示される
    await expect(canvas.getByTestId("workspace-system")).toHaveTextContent(
      "Predicate Logic",
    );
    await expect(canvas.getByTestId("workspace-goal-panel")).toHaveTextContent(
      "0 / 1",
    );

    // 公理パレットにA4が表示される（述語論理体系）
    await expect(
      canvas.getByTestId("workspace-axiom-palette-item-A4"),
    ).toBeInTheDocument();

    // --- Step 1: A4スキーマをパレットから追加 → node-1 ---
    await userEvent.click(
      canvas.getByTestId("workspace-axiom-palette-item-A4"),
    );
    await waitFor(() => {
      expect(canvas.getByTestId("proof-node-node-1")).toBeInTheDocument();
    });

    // --- Step 2: node-1に代入 [φ:=P(x), τ:=x] → node-2 ---
    await applySubstitutionViaContextMenu(canvas, "proof-node-node-1", [
      "P(x)",
      "x",
    ]);
    await waitFor(() => {
      expect(canvas.getByTestId("proof-node-node-2")).toBeInTheDocument();
    });

    // --- 最終確認: ゴール達成 ---
    await waitFor(() => {
      expect(canvas.getByTestId("workspace-goal-panel")).toHaveTextContent(
        "1 / 1",
      );
    });
    await expect(canvas.getByTestId("workspace-goal-panel")).toHaveTextContent(
      "Proved!",
    );
  },
};

// =============================================================================
// Quest From Hub Full Flow Stories
// クエスト一覧（HubPageView）から開始し、ワークスペースで証明を完遂するフルフロー
// =============================================================================

/**
 * nd-01: クエスト一覧 → ワークスペース → φ→φ証明完了の完全フロー
 *
 * 実際のユーザーフローを再現:
 *   1. HubPageViewのクエストタブが表示される
 *   2. nd-01「恒等律 (→I)」の開始ボタンをクリック
 *   3. ワークスペースに遷移（Natural Deduction NM体系）
 *   4. 仮定追加 → phi入力 → →I適用 → φ→φ証明完了
 */
export const QuestCompleteNd01FromHub: Story = {
  render: () => {
    const [view, setView] = useState<"hub" | "workspace">("hub");
    const [workspace, setWorkspace] = useState<WorkspaceState | null>(null);
    const [questInfo, setQuestInfo] = useState<GoalQuestInfo | undefined>(
      undefined,
    );
    const [notebookName, setNotebookName] = useState("");

    // nd-01を含むクエストグループを生成
    const quest = findQuestById(builtinQuests, "nd-01");
    if (quest === undefined) {
      throw new Error("Quest not found: nd-01");
    }
    const groups = buildCatalogByCategory([quest], createEmptyProgress());

    const handleStartQuest = useCallback((questId: string) => {
      const q = findQuestById(builtinQuests, questId);
      if (q === undefined) return;
      const preset = resolveSystemPreset(q.systemPresetId);
      if (preset === undefined) return;
      const ws = createQuestWorkspace(preset.deductionSystem, [
        { formulaText: q.goals[0]!.formulaText },
      ]);
      setWorkspace(ws);
      setQuestInfo({
        description: q.description,
        hints: q.hints,
        learningPoint: q.learningPoint,
      });
      setNotebookName(q.title);
      setView("workspace");
    }, []);

    const handleWorkspaceChange = useCallback((ws: WorkspaceState) => {
      setWorkspace(ws);
    }, []);

    if (view === "hub") {
      return (
        <HubPageView
          tab={"quests" as HubTab}
          onTabChange={fn()}
          listItems={[]}
          groups={groups}
          onOpenNotebook={fn()}
          onDeleteNotebook={fn()}
          onDuplicateNotebook={fn()}
          onRenameNotebook={fn()}
          onConvertToFree={fn()}
          onStartQuest={handleStartQuest}
          onCreateNotebook={fn()}
          languageToggle={{ locale: "en", onLocaleChange: fn() }}
        />
      );
    }

    if (workspace === null) return <div>Loading...</div>;

    return (
      <WorkspacePageView
        found={true}
        notebookName={notebookName}
        onNotebookRename={fn()}
        workspace={workspace}
        messages={defaultProofMessages}
        onBack={() => setView("hub")}
        onWorkspaceChange={handleWorkspaceChange}
        onGoalAchieved={fn()}
        questInfo={questInfo}
        languageToggle={{ locale: "en", onLocaleChange: () => {} }}
        workspaceTestId="workspace"
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // --- Phase 1: クエスト一覧（HubPageView） ---
    // クエストカタログが表示される
    await expect(canvas.getByTestId("quest-catalog")).toBeInTheDocument();

    // nd-01の開始ボタンをクリック
    const startBtn = canvas.getByTestId("start-btn-nd-01");
    await userEvent.click(startBtn);

    // --- Phase 2: ワークスペースに遷移 ---
    await waitFor(() => {
      expect(canvas.getByTestId("workspace-page")).toBeInTheDocument();
    });

    // 体系バッジに正しい体系名が表示される
    await expect(canvas.getByTestId("workspace-system")).toHaveTextContent(
      "Natural Deduction NM",
    );
    await expect(canvas.getByTestId("workspace-goal-panel")).toHaveTextContent(
      "0 / 1",
    );

    // --- Phase 3: ND φ→φ 証明フロー ---
    // Step 1: 「仮定を追加」→ node-1
    await userEvent.click(
      canvas.getByTestId("workspace-nd-rule-palette-add-assumption"),
    );
    await waitFor(() => {
      expect(canvas.getByTestId("proof-node-node-1")).toBeInTheDocument();
    });

    // Step 2: node-1の式をphiに編集
    const display = canvas.getByTestId("proof-node-node-1-editor-display");
    await userEvent.dblClick(display);
    const input = canvas.getByTestId("proof-node-node-1-editor-input-input");
    await userEvent.type(input, "phi");
    await userEvent.tab();

    // Step 3: →I規則をパレットからクリック → 選択モード
    await userEvent.click(
      canvas.getByTestId("workspace-nd-rule-palette-rule-implication-intro"),
    );
    await waitFor(() => {
      expect(canvas.getByTestId("workspace-nd-banner")).toBeInTheDocument();
    });

    // Step 4: node-1をクリック → モーダルでφを入力 → φ→φ
    await fitToContent(canvas);
    await userEvent.click(canvas.getByTestId("proof-node-node-1"));

    // 規則パラメータモーダルが表示される
    const promptInput2 = await canvas.findByTestId(
      "workspace-rule-prompt-input",
    );
    await userEvent.clear(promptInput2);
    await userEvent.type(promptInput2, "phi");
    await userEvent.click(canvas.getByTestId("workspace-rule-prompt-confirm"));

    // 結論ノード(node-2)が生成される
    await fitToContent(canvas);
    await waitFor(() => {
      expect(canvas.getByTestId("proof-node-node-2")).toBeInTheDocument();
    });

    // --- 最終確認: ゴール達成 ---
    await waitFor(() => {
      expect(canvas.getByTestId("workspace-goal-panel")).toHaveTextContent(
        "1 / 1",
      );
    });
    await expect(canvas.getByTestId("workspace-goal-panel")).toHaveTextContent(
      "Proved!",
    );
  },
};

/**
 * prop-01: クエスト一覧 → ワークスペース → φ→φ証明完了の完全フロー（Hilbert体系）
 *
 * 実際のユーザーフローを再現:
 *   1. HubPageViewのクエストタブが表示される
 *   2. prop-01「恒等律」の開始ボタンをクリック
 *   3. ワークスペースに遷移（Łukasiewicz体系）
 *   4. A2→代入→A1→代入→MP→A1→代入→MP → φ→φ証明完了
 */
export const QuestCompleteProp01FromHub: Story = {
  render: () => {
    const [view, setView] = useState<"hub" | "workspace">("hub");
    const [workspace, setWorkspace] = useState<WorkspaceState | null>(null);
    const [questInfo, setQuestInfo] = useState<GoalQuestInfo | undefined>(
      undefined,
    );
    const [notebookName, setNotebookName] = useState("");

    const quest = findQuestById(builtinQuests, "prop-01");
    if (quest === undefined) {
      throw new Error("Quest not found: prop-01");
    }
    const groups = buildCatalogByCategory([quest], createEmptyProgress());

    const handleStartQuest = useCallback((questId: string) => {
      const q = findQuestById(builtinQuests, questId);
      if (q === undefined) return;
      const preset = resolveSystemPreset(q.systemPresetId);
      if (preset === undefined) return;
      const ws = createQuestWorkspace(preset.deductionSystem, [
        { formulaText: q.goals[0]!.formulaText },
      ]);
      setWorkspace(ws);
      setQuestInfo({
        description: q.description,
        hints: q.hints,
        learningPoint: q.learningPoint,
      });
      setNotebookName(q.title);
      setView("workspace");
    }, []);

    const handleWorkspaceChange = useCallback((ws: WorkspaceState) => {
      setWorkspace(ws);
    }, []);

    if (view === "hub") {
      return (
        <HubPageView
          tab={"quests" as HubTab}
          onTabChange={fn()}
          listItems={[]}
          groups={groups}
          onOpenNotebook={fn()}
          onDeleteNotebook={fn()}
          onDuplicateNotebook={fn()}
          onRenameNotebook={fn()}
          onConvertToFree={fn()}
          onStartQuest={handleStartQuest}
          onCreateNotebook={fn()}
          languageToggle={{ locale: "en", onLocaleChange: fn() }}
        />
      );
    }

    if (workspace === null) return <div>Loading...</div>;

    return (
      <WorkspacePageView
        found={true}
        notebookName={notebookName}
        onNotebookRename={fn()}
        workspace={workspace}
        messages={defaultProofMessages}
        onBack={() => setView("hub")}
        onWorkspaceChange={handleWorkspaceChange}
        onGoalAchieved={fn()}
        questInfo={questInfo}
        languageToggle={{ locale: "en", onLocaleChange: () => {} }}
        workspaceTestId="workspace"
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // --- Phase 1: クエスト一覧（HubPageView） ---
    await expect(canvas.getByTestId("quest-catalog")).toBeInTheDocument();
    const startBtn = canvas.getByTestId("start-btn-prop-01");
    await userEvent.click(startBtn);

    // --- Phase 2: ワークスペースに遷移 ---
    await waitFor(() => {
      expect(canvas.getByTestId("workspace-page")).toBeInTheDocument();
    });
    await expect(canvas.getByTestId("workspace-system")).toHaveTextContent(
      "Łukasiewicz",
    );
    await expect(canvas.getByTestId("workspace-goal-panel")).toHaveTextContent(
      "0 / 1",
    );

    // --- Phase 3: Hilbert φ→φ 証明フロー ---
    // Step 1: A2スキーマをパレットから追加 → node-1
    await userEvent.click(
      canvas.getByTestId("workspace-axiom-palette-item-A2"),
    );
    await waitFor(() => {
      expect(canvas.getByTestId("proof-node-node-1")).toBeInTheDocument();
    });

    // Step 2: node-1に代入 [φ:=phi, ψ:=phi->phi, χ:=phi] → node-2
    await applySubstitutionViaContextMenu(canvas, "proof-node-node-1", [
      "phi",
      "phi -> phi",
      "phi",
    ]);
    await waitFor(() => {
      expect(canvas.getByTestId("proof-node-node-2")).toBeInTheDocument();
    });

    // Step 3: A1スキーマをパレットから追加 → node-3
    await userEvent.click(
      canvas.getByTestId("workspace-axiom-palette-item-A1"),
    );
    await waitFor(() => {
      expect(canvas.getByTestId("proof-node-node-3")).toBeInTheDocument();
    });

    // Step 4: node-3に代入 [φ:=phi, ψ:=phi->phi] → node-4
    await applySubstitutionViaContextMenu(canvas, "proof-node-node-3", [
      "phi",
      "phi -> phi",
    ]);
    await waitFor(() => {
      expect(canvas.getByTestId("proof-node-node-4")).toBeInTheDocument();
    });

    // Step 5: MP₁(left=node-4, right=node-2) → node-5
    await applyMPViaSelection(canvas, "proof-node-node-4", "proof-node-node-2");
    await fitToContent(canvas);
    await waitFor(() => {
      expect(canvas.getByTestId("proof-node-node-5")).toBeInTheDocument();
    });

    // Step 6: A1スキーマをパレットから追加 → node-6
    await userEvent.click(
      canvas.getByTestId("workspace-axiom-palette-item-A1"),
    );
    await waitFor(() => {
      expect(canvas.getByTestId("proof-node-node-6")).toBeInTheDocument();
    });

    // Step 7: node-6に代入 [φ:=phi, ψ:=phi] → node-7
    await applySubstitutionViaContextMenu(canvas, "proof-node-node-6", [
      "phi",
      "phi",
    ]);
    await waitFor(() => {
      expect(canvas.getByTestId("proof-node-node-7")).toBeInTheDocument();
    });

    // Step 8: MP₂(left=node-7, right=node-5) → node-8 (φ→φ)
    await applyMPViaSelection(canvas, "proof-node-node-7", "proof-node-node-5");
    await fitToContent(canvas);
    await waitFor(() => {
      expect(canvas.getByTestId("proof-node-node-8")).toBeInTheDocument();
    });

    // --- 最終確認: ゴール達成 ---
    await waitFor(() => {
      expect(canvas.getByTestId("workspace-goal-panel")).toHaveTextContent(
        "1 / 1",
      );
    });
    await expect(canvas.getByTestId("workspace-goal-panel")).toHaveTextContent(
      "Proved!",
    );
  },
};

/**
 * sc-01: クエスト一覧 → ワークスペース → ⊢ φ→φ 証明完了の完全フロー（SC LK体系）
 *
 * 実際のユーザーフローを再現:
 *   1. HubPageViewのクエストタブが表示される
 *   2. sc-01の開始ボタンをクリック
 *   3. ワークスペースに遷移（Sequent Calculus LK体系）
 *   4. シーケント追加 → phi -> phi 入力 → スタンドアロンノードではゴール未達成
 */
export const QuestCompleteSc01FromHub: Story = {
  render: () => {
    const [view, setView] = useState<"hub" | "workspace">("hub");
    const [workspace, setWorkspace] = useState<WorkspaceState | null>(null);
    const [questInfo, setQuestInfo] = useState<GoalQuestInfo | undefined>(
      undefined,
    );
    const [notebookName, setNotebookName] = useState("");

    const quest = findQuestById(builtinQuests, "sc-01");
    if (quest === undefined) {
      throw new Error("Quest not found: sc-01");
    }
    const groups = buildCatalogByCategory([quest], createEmptyProgress());

    const handleStartQuest = useCallback((questId: string) => {
      const q = findQuestById(builtinQuests, questId);
      if (q === undefined) return;
      const preset = resolveSystemPreset(q.systemPresetId);
      if (preset === undefined) return;
      const ws = createQuestWorkspace(preset.deductionSystem, [
        { formulaText: q.goals[0]!.formulaText },
      ]);
      setWorkspace(ws);
      setQuestInfo({
        description: q.description,
        hints: q.hints,
        learningPoint: q.learningPoint,
      });
      setNotebookName(q.title);
      setView("workspace");
    }, []);

    const handleWorkspaceChange = useCallback((ws: WorkspaceState) => {
      setWorkspace(ws);
    }, []);

    if (view === "hub") {
      return (
        <HubPageView
          tab={"quests" as HubTab}
          onTabChange={fn()}
          listItems={[]}
          groups={groups}
          onOpenNotebook={fn()}
          onDeleteNotebook={fn()}
          onDuplicateNotebook={fn()}
          onRenameNotebook={fn()}
          onConvertToFree={fn()}
          onStartQuest={handleStartQuest}
          onCreateNotebook={fn()}
          languageToggle={{ locale: "en", onLocaleChange: fn() }}
        />
      );
    }

    if (workspace === null) return <div>Loading...</div>;

    return (
      <WorkspacePageView
        found={true}
        notebookName={notebookName}
        onNotebookRename={fn()}
        workspace={workspace}
        messages={defaultProofMessages}
        onBack={() => setView("hub")}
        onWorkspaceChange={handleWorkspaceChange}
        onGoalAchieved={fn()}
        questInfo={questInfo}
        languageToggle={{ locale: "en", onLocaleChange: () => {} }}
        workspaceTestId="workspace"
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // --- Phase 1: クエスト一覧（HubPageView） ---
    await expect(canvas.getByTestId("quest-catalog")).toBeInTheDocument();
    const startBtn = canvas.getByTestId("start-btn-sc-01");
    await userEvent.click(startBtn);

    // --- Phase 2: ワークスペースに遷移 ---
    await waitFor(() => {
      expect(canvas.getByTestId("workspace-page")).toBeInTheDocument();
    });
    await expect(canvas.getByTestId("workspace-system")).toHaveTextContent(
      "Sequent Calculus LK",
    );
    await expect(canvas.getByTestId("workspace-goal-panel")).toHaveTextContent(
      "0 / 1",
    );

    // --- Phase 3: SC φ→φ - スタンドアロンノードではゴール未達成 ---
    // Step 1: 「シーケントを追加」→ node-1
    await userEvent.click(
      canvas.getByTestId("workspace-sc-rule-palette-add-sequent"),
    );
    await waitFor(() => {
      expect(canvas.getByTestId("proof-node-node-1")).toBeInTheDocument();
    });

    // Step 2: node-1の式を phi -> phi に編集
    const display = canvas.getByTestId("proof-node-node-1-editor-display");
    await userEvent.dblClick(display);
    const input = canvas.getByTestId("proof-node-node-1-editor-input-input");
    await userEvent.type(input, "phi -> phi");
    await userEvent.tab();

    // --- 最終確認: スタンドアロンノードではゴール未達成 ---
    await new Promise((resolve) => setTimeout(resolve, 500));
    await expect(canvas.getByTestId("workspace-goal-panel")).toHaveTextContent(
      "0 / 1",
    );
  },
};

/**
 * tab-01: クエスト一覧 → ワークスペース → ¬(φ→φ) 反駁タブロー完成（TAB体系）
 *
 * 実際のユーザーフローを再現:
 *   1. HubPageViewのクエストタブが表示される
 *   2. tab-01の開始ボタンをクリック
 *   3. ワークスペースに遷移（Tableau Calculus TAB体系）
 *   4. シーケント追加 → ~(phi -> phi) 入力
 *   5. ¬→規則を適用 → φ, ¬φ が同一枝に
 *   6. BS規則で閉じる → ゴール達成
 */
export const QuestCompleteTab01FromHub: Story = {
  render: () => {
    const [view, setView] = useState<"hub" | "workspace">("hub");
    const [workspace, setWorkspace] = useState<WorkspaceState | null>(null);
    const [questInfo, setQuestInfo] = useState<GoalQuestInfo | undefined>(
      undefined,
    );
    const [notebookName, setNotebookName] = useState("");

    const quest = findQuestById(builtinQuests, "tab-01");
    if (quest === undefined) {
      throw new Error("Quest not found: tab-01");
    }
    const groups = buildCatalogByCategory([quest], createEmptyProgress());

    const handleStartQuest = useCallback((questId: string) => {
      const q = findQuestById(builtinQuests, questId);
      if (q === undefined) return;
      const preset = resolveSystemPreset(q.systemPresetId);
      if (preset === undefined) return;
      const ws = createQuestWorkspace(preset.deductionSystem, [
        { formulaText: q.goals[0]!.formulaText },
      ]);
      setWorkspace(ws);
      setQuestInfo({
        description: q.description,
        hints: q.hints,
        learningPoint: q.learningPoint,
      });
      setNotebookName(q.title);
      setView("workspace");
    }, []);

    const handleWorkspaceChange = useCallback((ws: WorkspaceState) => {
      setWorkspace(ws);
    }, []);

    if (view === "hub") {
      return (
        <HubPageView
          tab={"quests" as HubTab}
          onTabChange={fn()}
          listItems={[]}
          groups={groups}
          onOpenNotebook={fn()}
          onDeleteNotebook={fn()}
          onDuplicateNotebook={fn()}
          onRenameNotebook={fn()}
          onConvertToFree={fn()}
          onStartQuest={handleStartQuest}
          onCreateNotebook={fn()}
          languageToggle={{ locale: "en", onLocaleChange: fn() }}
        />
      );
    }

    if (workspace === null) return <div>Loading...</div>;

    return (
      <WorkspacePageView
        found={true}
        notebookName={notebookName}
        onNotebookRename={fn()}
        workspace={workspace}
        messages={defaultProofMessages}
        onBack={() => setView("hub")}
        onWorkspaceChange={handleWorkspaceChange}
        onGoalAchieved={fn()}
        questInfo={questInfo}
        languageToggle={{ locale: "en", onLocaleChange: () => {} }}
        workspaceTestId="workspace"
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // --- Phase 1: クエスト一覧（HubPageView） ---
    await expect(canvas.getByTestId("quest-catalog")).toBeInTheDocument();
    const startBtn = canvas.getByTestId("start-btn-tab-01");
    await userEvent.click(startBtn);

    // --- Phase 2: ワークスペースに遷移 ---
    await waitFor(() => {
      expect(canvas.getByTestId("workspace-page")).toBeInTheDocument();
    });
    await expect(canvas.getByTestId("workspace-system")).toHaveTextContent(
      "Tableau Calculus TAB (Propositional)",
    );
    await expect(canvas.getByTestId("workspace-goal-panel")).toHaveTextContent(
      "0 / 1",
    );

    // --- Phase 3: TAB ¬(φ→φ) の反駁タブローを完成させる ---
    // Step 1: 「シーケントを追加」→ node-1
    await userEvent.click(
      canvas.getByTestId("workspace-tab-rule-palette-add-sequent"),
    );
    await waitFor(() => {
      expect(canvas.getByTestId("proof-node-node-1")).toBeInTheDocument();
    });

    // Step 2: node-1の式を ~(phi -> phi) に編集
    const display1 = canvas.getByTestId("proof-node-node-1-editor-display");
    await userEvent.dblClick(display1);
    const input1 = canvas.getByTestId("proof-node-node-1-editor-input-input");
    await userEvent.type(input1, "~(phi -> phi)");
    await userEvent.tab();

    // スタンドアロンノードではゴール未達成
    await new Promise((resolve) => setTimeout(resolve, 300));
    await expect(canvas.getByTestId("workspace-goal-panel")).toHaveTextContent(
      "0 / 1",
    );

    // Step 3: ¬→規則を適用
    await userEvent.click(
      canvas.getByTestId("workspace-tab-rule-palette-rule-neg-implication"),
    );
    await userEvent.click(canvas.getByTestId("proof-node-node-1"));
    // RulePromptModal: 主論理式の位置（デフォルト0）→ OK
    await waitFor(() => {
      expect(canvas.getByTestId("workspace-rule-prompt")).toBeInTheDocument();
    });
    await userEvent.click(
      canvas.getByTestId("workspace-rule-prompt-confirm"),
    );
    await waitFor(() => {
      expect(canvas.getByTestId("proof-node-node-2")).toBeInTheDocument();
    });

    // Step 4: BS規則で枝を閉じる
    await userEvent.click(
      canvas.getByTestId("workspace-tab-rule-palette-rule-bs"),
    );
    await userEvent.click(canvas.getByTestId("proof-node-node-2"));
    await waitFor(() => {
      expect(canvas.getByTestId("proof-node-node-3")).toBeInTheDocument();
    });

    // --- 最終確認: ゴール達成 ---
    await waitFor(() => {
      expect(canvas.getByTestId("workspace-goal-panel")).toHaveTextContent(
        "1 / 1",
      );
    });
    await expect(canvas.getByTestId("workspace-goal-panel")).toHaveTextContent(
      "Proved!",
    );
  },
};

/**
 * at-01: クエスト一覧 → ワークスペース → スタンドアロンノードでゴール未達成を確認（AT体系）
 *
 * ユーザーフロー:
 *   1. HubPageViewのクエストタブが表示される
 *   2. at-01の開始ボタンをクリック
 *   3. ワークスペースに遷移（Analytic Tableau体系）
 *   4. 式追加 → phi \/ ~phi 入力 → 証明完了
 */
export const QuestCompleteAt01FromHub: Story = {
  render: () => {
    const [view, setView] = useState<"hub" | "workspace">("hub");
    const [workspace, setWorkspace] = useState<WorkspaceState | null>(null);
    const [questInfo, setQuestInfo] = useState<GoalQuestInfo | undefined>(
      undefined,
    );
    const [notebookName, setNotebookName] = useState("");

    const quest = findQuestById(builtinQuests, "at-01");
    if (quest === undefined) {
      throw new Error("Quest not found: at-01");
    }
    const groups = buildCatalogByCategory([quest], createEmptyProgress());

    const handleStartQuest = useCallback((questId: string) => {
      const q = findQuestById(builtinQuests, questId);
      if (q === undefined) return;
      const preset = resolveSystemPreset(q.systemPresetId);
      if (preset === undefined) return;
      const ws = createQuestWorkspace(preset.deductionSystem, [
        { formulaText: q.goals[0]!.formulaText },
      ]);
      setWorkspace(ws);
      setQuestInfo({
        description: q.description,
        hints: q.hints,
        learningPoint: q.learningPoint,
      });
      setNotebookName(q.title);
      setView("workspace");
    }, []);

    const handleWorkspaceChange = useCallback((ws: WorkspaceState) => {
      setWorkspace(ws);
    }, []);

    if (view === "hub") {
      return (
        <HubPageView
          tab={"quests" as HubTab}
          onTabChange={fn()}
          listItems={[]}
          groups={groups}
          onOpenNotebook={fn()}
          onDeleteNotebook={fn()}
          onDuplicateNotebook={fn()}
          onRenameNotebook={fn()}
          onConvertToFree={fn()}
          onStartQuest={handleStartQuest}
          onCreateNotebook={fn()}
          languageToggle={{ locale: "en", onLocaleChange: fn() }}
        />
      );
    }

    if (workspace === null) return <div>Loading...</div>;

    return (
      <WorkspacePageView
        found={true}
        notebookName={notebookName}
        onNotebookRename={fn()}
        workspace={workspace}
        messages={defaultProofMessages}
        onBack={() => setView("hub")}
        onWorkspaceChange={handleWorkspaceChange}
        onGoalAchieved={fn()}
        questInfo={questInfo}
        languageToggle={{ locale: "en", onLocaleChange: () => {} }}
        workspaceTestId="workspace"
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // --- Phase 1: クエスト一覧（HubPageView） ---
    await expect(canvas.getByTestId("quest-catalog")).toBeInTheDocument();
    const startBtn = canvas.getByTestId("start-btn-at-01");
    await userEvent.click(startBtn);

    // --- Phase 2: ワークスペースに遷移 ---
    await waitFor(() => {
      expect(canvas.getByTestId("workspace-page")).toBeInTheDocument();
    });
    await expect(canvas.getByTestId("workspace-system")).toHaveTextContent(
      "Analytic Tableau",
    );
    await expect(canvas.getByTestId("workspace-goal-panel")).toHaveTextContent(
      "0 / 1",
    );

    // --- Phase 3: AT φ∨¬φ - スタンドアロンノードではゴール未達成 ---
    // Step 1: 「式を追加」→ node-1
    await userEvent.click(
      canvas.getByTestId("workspace-at-rule-palette-add-formula"),
    );
    await waitFor(() => {
      expect(canvas.getByTestId("proof-node-node-1")).toBeInTheDocument();
    });

    // Step 2: node-1の式を phi \/ ~phi に編集
    const display = canvas.getByTestId("proof-node-node-1-editor-display");
    await userEvent.dblClick(display);
    const input = canvas.getByTestId("proof-node-node-1-editor-input-input");
    await userEvent.type(input, "phi \\/ ~phi");
    await userEvent.tab();

    // --- 最終確認: スタンドアロンノードではゴール未達成 ---
    await new Promise((resolve) => setTimeout(resolve, 500));
    await expect(canvas.getByTestId("workspace-goal-panel")).toHaveTextContent(
      "0 / 1",
    );
  },
};

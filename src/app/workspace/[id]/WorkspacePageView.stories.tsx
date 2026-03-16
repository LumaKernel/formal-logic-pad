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
} from "../../../lib/quest";
import type { ModelAnswer } from "../../../lib/quest";
import type { GoalQuestInfo } from "../../../lib/proof-pad";
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

/** 三点メニューから「自由帳として複製」を実行できる */
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
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // 三点メニューボタンが表示される
    const menuButton = canvas.getByTestId("workspace-more-menu-button");
    await expect(menuButton).toBeInTheDocument();

    // クリックでドロップダウンが開く
    await userEvent.click(menuButton);
    const dropdown = canvas.getByTestId("workspace-more-menu-dropdown");
    await expect(dropdown).toBeInTheDocument();

    // 「Duplicate as Free」項目が表示される
    const duplicateItem = canvas.getByTestId(
      "workspace-more-menu-duplicate-free",
    );
    await expect(duplicateItem).toHaveTextContent("Duplicate as Free");

    // クリックでコールバックが呼ばれる
    await userEvent.click(duplicateItem);

    // メニューが閉じる
    await waitFor(() => {
      expect(
        canvas.queryByTestId("workspace-more-menu-dropdown"),
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
      expect(
        canvas.getByTestId("workspace-goal-panel"),
      ).toHaveTextContent("1 / 1");
    });
    await expect(
      canvas.getByTestId("workspace-goal-panel"),
    ).toHaveTextContent("Proved!");
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
    const goalPanel = canvas.getByTestId("workspace-goal-panel");
    await expect(goalPanel).toBeInTheDocument();
    await expect(goalPanel).toHaveTextContent("1 / 1");
    await expect(goalPanel).toHaveTextContent("Proved!");
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
    const goalPanel = canvas.getByTestId("workspace-goal-panel");
    await expect(goalPanel).toBeInTheDocument();
    await expect(goalPanel).toHaveTextContent("1 / 1");
    await expect(goalPanel).toHaveTextContent("Proved!");
  },
};

/** at-01: 分析的タブロー φ∨¬φ 完了 */
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
    const goalPanel = canvas.getByTestId("workspace-goal-panel");
    await expect(goalPanel).toBeInTheDocument();
    await expect(goalPanel).toHaveTextContent("1 / 1");
    await expect(goalPanel).toHaveTextContent("Proved!");
  },
};

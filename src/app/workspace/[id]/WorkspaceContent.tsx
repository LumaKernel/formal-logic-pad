"use client";

import { useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useNotebookCollection, findNotebook } from "../../../lib/notebook";
import type { GoalAchievedInfo } from "../../../lib/proof-pad";
import type { ProofMessages } from "../../../lib/proof-pad";
import type { WorkspaceState } from "../../../lib/proof-pad/workspaceState";
import { useQuestProgress } from "../../../lib/quest";
import { ThemeProvider } from "../../../lib/theme/ThemeProvider";
import { WorkspacePageView } from "./WorkspacePageView";

/** next-intl の翻訳から ProofMessages オブジェクトを構築するフック */
function useProofMessagesFromIntl(): ProofMessages {
  const t = useTranslations("ProofWorkspace");
  return useMemo(
    (): ProofMessages => ({
      mpApply: t("mpApply"),
      mpCancel: t("mpCancel"),
      mpApplied: t("mpApplied"),
      mpErrorBothMissing: t("mpErrorBothMissing"),
      mpErrorLeftMissing: t("mpErrorLeftMissing"),
      mpErrorRightMissing: t("mpErrorRightMissing"),
      mpErrorLeftParse: t("mpErrorLeftParse"),
      mpErrorRightParse: t("mpErrorRightParse"),
      mpErrorNotImplication: t("mpErrorNotImplication"),
      mpErrorPremiseMismatch: t("mpErrorPremiseMismatch"),
      mpErrorGeneric: t("mpErrorGeneric"),
      mpBannerSelectLeft: t("mpBannerSelectLeft"),
      mpBannerSelectRight: t("mpBannerSelectRight"),
      genApply: t("genApply"),
      genCancel: t("genCancel"),
      genApplied: t("genApplied"),
      genErrorPremiseMissing: t("genErrorPremiseMissing"),
      genErrorPremiseParse: t("genErrorPremiseParse"),
      genErrorVariableEmpty: t("genErrorVariableEmpty"),
      genErrorNotEnabled: t("genErrorNotEnabled"),
      genErrorGeneric: t("genErrorGeneric"),
      genBannerSelectPremise: t("genBannerSelectPremise"),
      goalLabel: t("goalLabel"),
      goalPlaceholder: t("goalPlaceholder"),
      goalProved: t("goalProved"),
      goalNotYet: t("goalNotYet"),
      goalInvalidFormula: t("goalInvalidFormula"),
      proofComplete: t("proofComplete"),
      selectionCount: t("selectionCount"),
      selectionCopy: t("selectionCopy"),
      selectionCut: t("selectionCut"),
      selectionPaste: t("selectionPaste"),
      selectionDuplicate: t("selectionDuplicate"),
      selectionDelete: t("selectionDelete"),
      selectionClear: t("selectionClear"),
      cancel: t("cancel"),
      logicSystemLabel: t("logicSystemLabel"),
      questBadge: t("questBadge"),
      convertToFree: t("convertToFree"),
      autoLayout: t("autoLayout"),
      layoutTopToBottom: t("layoutTopToBottom"),
      layoutBottomToTop: t("layoutBottomToTop"),
      exportJSON: t("exportJSON"),
      exportSVG: t("exportSVG"),
      exportPNG: t("exportPNG"),
      importJSON: t("importJSON"),
      selectSubtree: t("selectSubtree"),
      addAxiomNode: t("addAxiomNode"),
      addGoalNode: t("addGoalNode"),
      addNode: t("addNode"),
      proofCompleteButAxiomViolation: t("proofCompleteButAxiomViolation"),
      axiomViolationDetail: t("axiomViolationDetail"),
    }),
    [t],
  );
}

function WorkspaceInner() {
  const params = useParams();
  const router = useRouter();
  const notebookCollection = useNotebookCollection();
  const questProgress = useQuestProgress();
  const proofMessages = useProofMessagesFromIntl();

  const notebookId =
    typeof params.id === "string"
      ? params.id
      : Array.isArray(params.id)
        ? params.id[0]
        : undefined;

  const notebook =
    notebookId !== undefined
      ? findNotebook(notebookCollection.collection, notebookId)
      : undefined;

  const handleBack = useCallback(() => {
    router.push("/");
  }, [router]);

  const handleWorkspaceChange = useCallback(
    (workspace: WorkspaceState) => {
      if (notebookId !== undefined) {
        notebookCollection.updateWorkspace(notebookId, workspace);
      }
    },
    [notebookId, notebookCollection],
  );

  const questId = notebook?.questId;
  const questRecord = questProgress.record;
  const handleGoalAchieved = useCallback(
    (info: GoalAchievedInfo) => {
      if (questId !== undefined) {
        questRecord(questId, {
          // eslint-disable-next-line @luma-dev/luma-ts/no-date
          completedAt: Date.now(),
          stepCount: info.stepCount,
        });
      }
    },
    [questId, questRecord],
  );

  if (notebook === undefined) {
    return <WorkspacePageView found={false} onBack={handleBack} />;
  }

  return (
    <WorkspacePageView
      found={true}
      notebookName={notebook.meta.name}
      workspace={notebook.workspace}
      messages={proofMessages}
      onBack={handleBack}
      onWorkspaceChange={handleWorkspaceChange}
      onGoalAchieved={handleGoalAchieved}
    />
  );
}

export default function WorkspaceContent() {
  return (
    <ThemeProvider>
      <WorkspaceInner />
    </ThemeProvider>
  );
}

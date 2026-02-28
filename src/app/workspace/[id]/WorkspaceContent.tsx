"use client";

import { useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useNotebookCollection, findNotebook } from "../../../lib/notebook";
import type { GoalAchievedInfo } from "../../../lib/proof-pad";
import type { ProofMessages } from "../../../lib/proof-pad";
import type { WorkspaceState } from "../../../lib/proof-pad/workspaceState";
import { useQuestProgress, builtinQuests } from "../../../lib/quest";
import {
  checkQuestVersion,
  getVersionWarningMessage,
} from "../../../lib/quest/questVersionLogic";
import { ThemeProvider } from "../../../lib/theme/ThemeProvider";
import { isLocale } from "../../../components/LanguageToggle/languageToggleLogic";
import {
  useLocaleSwitch,
  getBrowserLocaleSwitchDeps,
} from "../../../components/LanguageToggle/useLocaleSwitch";
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
      selectionMerge: t("selectionMerge"),
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
      applySubstitution: t("applySubstitution"),
      substitutionApplied: t("substitutionApplied"),
      substErrorPremiseMissing: t("substErrorPremiseMissing"),
      substErrorPremiseParse: t("substErrorPremiseParse"),
      substErrorNoEntries: t("substErrorNoEntries"),
      substErrorFormulaParse: t("substErrorFormulaParse"),
      substErrorTermParse: t("substErrorTermParse"),
      substEntryPrompt: t("substEntryPrompt"),
      selectSubtree: t("selectSubtree"),
      addNode: t("addNode"),
      useAsMPLeft: t("useAsMPLeft"),
      useAsMPRight: t("useAsMPRight"),
      applyGenToNode: t("applyGenToNode"),
      applySubstitutionToNode: t("applySubstitutionToNode"),
      duplicateNode: t("duplicateNode"),
      deleteNode: t("deleteNode"),
      deleteConnection: t("deleteConnection"),
      genVariablePrompt: t("genVariablePrompt"),
      proofCompleteButAxiomViolation: t("proofCompleteButAxiomViolation"),
      axiomViolationDetail: t("axiomViolationDetail"),
      instanceRootViolationDetail: t("instanceRootViolationDetail"),
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
  const rawLocale = useLocale();
  const locale = isLocale(rawLocale) ?? "en";
  const localeSwitchDeps = useMemo(() => getBrowserLocaleSwitchDeps(), []);
  const { switchLocale } = useLocaleSwitch(localeSwitchDeps);

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

  const questVersionWarning = useMemo(
    () =>
      notebook !== undefined
        ? getVersionWarningMessage(checkQuestVersion(notebook, builtinQuests))
        : undefined,
    [notebook],
  );

  const languageToggle = useMemo(
    () => ({ locale, onLocaleChange: switchLocale }),
    [locale, switchLocale],
  );

  if (notebook === undefined) {
    return (
      <WorkspacePageView
        found={false}
        onBack={handleBack}
        languageToggle={languageToggle}
      />
    );
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
      questVersionWarning={questVersionWarning}
      languageToggle={languageToggle}
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

"use client";

import { useCallback, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import type { WorkspacePageMessages } from "./workspacePageMessages";
import type { ThemeToggleLabels } from "../../../components/ThemeToggle/ThemeToggle";
import { useNotebookCollection, findNotebook } from "../../../lib/notebook";
import type { GoalAchievedInfo } from "../../../lib/proof-pad";
import type { ProofMessages } from "../../../lib/proof-pad";
import type { WorkspaceState } from "../../../lib/proof-pad/workspaceState";
import type { ProofSaveParams } from "../../../lib/proof-collection";
import { useProofCollection } from "../../../lib/proof-collection";
import { useQuestProgress, builtinQuests } from "../../../lib/quest";
import type { GoalQuestInfo } from "../../../lib/proof-pad";
import {
  checkQuestVersion,
  getVersionWarningMessage,
} from "../../../lib/quest/questVersionLogic";
import { allReferenceEntries } from "../../../lib/reference/referenceContent";
import { findEntryById } from "../../../lib/reference/referenceEntry";
import { ReferenceFloatingWindow } from "../../../lib/reference/ReferenceFloatingWindow";
import type { Locale as ReferenceLocale } from "../../../lib/reference/referenceEntry";
import { ThemeProvider } from "../../../lib/theme/ThemeProvider";
import { AntDesignThemeProvider } from "../../../lib/theme/AntDesignThemeProvider";
import { isLocale } from "../../../components/LanguageToggle/languageToggleLogic";
import {
  useLocaleSwitch,
  getBrowserLocaleSwitchDeps,
} from "../../../components/LanguageToggle/useLocaleSwitch";
import { WorkspacePageView } from "./WorkspacePageView";

/** next-intl の翻訳から WorkspacePageMessages オブジェクトを構築するフック */
function useWorkspacePageMessagesFromIntl(): WorkspacePageMessages {
  const t = useTranslations("Workspace");
  return useMemo(
    (): WorkspacePageMessages => ({
      back: t("back"),
      backToHub: t("backToHub"),
      notebookNotFound: t("notebookNotFound"),
      duplicateToFree: t("duplicateToFree"),
      titleEditPlaceholder: t("titleEditPlaceholder"),
    }),
    [t],
  );
}

/** next-intl の翻訳から ThemeToggleLabels オブジェクトを構築するフック */
function useThemeLabelsFromIntl(): ThemeToggleLabels {
  const t = useTranslations("Workspace");
  return useMemo(
    (): ThemeToggleLabels => ({
      light: t("themeLight"),
      dark: t("themeDark"),
      system: t("themeSystem"),
      ariaLabel: t("themeSelectionAriaLabel"),
      switchAriaLabelTemplate: String(t.raw("switchThemeAriaLabel")),
    }),
    [t],
  );
}

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
      genBannerSelectPremise: String(t.raw("genBannerSelectPremise")),
      goalLabel: t("goalLabel"),
      goalPlaceholder: t("goalPlaceholder"),
      goalProved: t("goalProved"),
      goalNotYet: t("goalNotYet"),
      goalInvalidFormula: t("goalInvalidFormula"),
      goalAxiomViolation: t("goalAxiomViolation"),
      goalRuleViolation: t("goalRuleViolation"),
      proofComplete: t("proofComplete"),
      goalPanelTitle: t("goalPanelTitle"),
      goalPanelProgress: String(t.raw("goalPanelProgress")),
      goalPanelAllowedAxioms: String(t.raw("goalPanelAllowedAxioms")),
      goalPanelViolatingAxioms: String(t.raw("goalPanelViolatingAxioms")),
      goalDetailDescription: t("goalDetailDescription"),
      goalDetailHints: t("goalDetailHints"),
      goalDetailHintLabel: String(t.raw("goalDetailHintLabel")),
      goalDetailLearningPoint: t("goalDetailLearningPoint"),
      selectionCount: String(t.raw("selectionCount")),
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
      duplicateToFree: t("duplicateToFree"),
      treeLayoutTopToBottom: t("treeLayoutTopToBottom"),
      treeLayoutBottomToTop: t("treeLayoutBottomToTop"),
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
      normalizeFormula: t("normalizeFormula"),
      normalizeApplied: t("normalizeApplied"),
      normalizeNoChange: t("normalizeNoChange"),
      normalizeParseError: t("normalizeParseError"),
      normalizeEmptyFormula: t("normalizeEmptyFormula"),
      selectSubtree: t("selectSubtree"),
      selectProof: t("selectProof"),
      addNode: t("addNode"),
      canvasMenuPaste: t("canvasMenuPaste"),
      useAsMPLeft: t("useAsMPLeft"),
      useAsMPRight: t("useAsMPRight"),
      applyGenToNode: t("applyGenToNode"),
      applySubstitutionToNode: t("applySubstitutionToNode"),
      mergeWithNode: t("mergeWithNode"),
      duplicateNode: t("duplicateNode"),
      deleteNode: t("deleteNode"),
      deleteConnection: t("deleteConnection"),
      saveToCollection: t("saveToCollection"),
      savedToCollection: t("savedToCollection"),
      genVariablePrompt: t("genVariablePrompt"),
      mergeBannerSelectTarget: t("mergeBannerSelectTarget"),
      mergeCancel: t("mergeCancel"),
      mergeNoTargets: t("mergeNoTargets"),
      tabBannerSelectNode: String(t.raw("tabBannerSelectNode")),
      tabCancel: t("tabCancel"),
      tabApplied: t("tabApplied"),
      tabError: t("tabError"),
      applyTabRuleToNode: t("applyTabRuleToNode"),
      tabPositionPrompt: t("tabPositionPrompt"),
      tabExchangePositionPrompt: t("tabExchangePositionPrompt"),
      tabTermPrompt: t("tabTermPrompt"),
      tabEigenVariablePrompt: t("tabEigenVariablePrompt"),
      atBannerSelectNode: String(t.raw("atBannerSelectNode")),
      atCancel: t("atCancel"),
      atApplied: t("atApplied"),
      atError: t("atError"),
      applyAtRuleToNode: t("applyAtRuleToNode"),
      atTermPrompt: t("atTermPrompt"),
      atEigenVariablePrompt: t("atEigenVariablePrompt"),
      atClosureBannerSelectContradiction: t(
        "atClosureBannerSelectContradiction",
      ),
      cutEliminationTitle: t("cutEliminationTitle"),
      cutEliminationCuts: String(t.raw("cutEliminationCuts")),
      cutEliminationCutFree: t("cutEliminationCutFree"),
      cutEliminationStepProgress: String(t.raw("cutEliminationStepProgress")),
      cutEliminationInitialState: t("cutEliminationInitialState"),
      cutEliminationStepInfo: String(t.raw("cutEliminationStepInfo")),
      cutEliminationSuccess: t("cutEliminationSuccess"),
      cutEliminationFailure: t("cutEliminationFailure"),
      cutEliminationNoCuts: t("cutEliminationNoCuts"),
      cutEliminationStart: t("cutEliminationStart"),
      cutEliminationClose: t("cutEliminationClose"),
      cutEliminationBuildError: String(t.raw("cutEliminationBuildError")),
      cutEliminationNoRoot: t("cutEliminationNoRoot"),
      cutEliminationMultipleRoots: t("cutEliminationMultipleRoots"),

      // Node labels / role badges
      roleAxiom: t("roleAxiom"),
      roleRoot: t("roleRoot"),
      roleDerived: t("roleDerived"),
      dependsOn: t("dependsOn"),
      protectedBadge: t("protectedBadge"),
      axiomIdentifiedTooltip: String(t.raw("axiomIdentifiedTooltip")),
      protectedQuestTooltip: t("protectedQuestTooltip"),
      derivedNodeAutoTooltip: t("derivedNodeAutoTooltip"),
      formulaEditorPlaceholder: t("formulaEditorPlaceholder"),
      formulaEditorPlaceholderDblclick: t("formulaEditorPlaceholderDblclick"),
      editFormula: t("editFormula"),
      substitutionKindFormula: t("substitutionKindFormula"),
      substitutionKindTerm: t("substitutionKindTerm"),

      // Palette headers
      axiomPaletteHeader: t("axiomPaletteHeader"),
      ndPaletteHeader: t("ndPaletteHeader"),
      ndAddAssumption: t("ndAddAssumption"),
      ndRulesSection: t("ndRulesSection"),
      tabPaletteHeader: t("tabPaletteHeader"),
      tabAddSequent: t("tabAddSequent"),
      tabRulesSection: t("tabRulesSection"),
      scPaletteHeader: t("scPaletteHeader"),
      scAddSequent: t("scAddSequent"),
      scRulesSection: t("scRulesSection"),
      scPositionPrompt: t("scPositionPrompt"),
      scExchangePositionPrompt: t("scExchangePositionPrompt"),
      scTermPrompt: t("scTermPrompt"),
      scEigenVariablePrompt: t("scEigenVariablePrompt"),
      scCutFormulaPrompt: t("scCutFormulaPrompt"),
      scComponentIndexPrompt: t("scComponentIndexPrompt"),
      scApplyRuleToNode: t("scApplyRuleToNode"),
      scBannerSelectNode: String(t.raw("scBannerSelectNode")),
      scCancel: t("scCancel"),
      atPaletteHeader: t("atPaletteHeader"),
      atAddFormula: t("atAddFormula"),
      atAlphaRules: t("atAlphaRules"),
      atBetaRules: t("atBetaRules"),
      atGammaDeltaRules: t("atGammaDeltaRules"),
      atClosureRules: t("atClosureRules"),

      // Note
      noteEmptyPlaceholder: t("noteEmptyPlaceholder"),
      addNote: t("addNote"),
      editNote: t("editNote"),
      noteEditorTitle: t("noteEditorTitle"),

      // Script
      runScript: t("runScript"),
      openScriptEditor: t("openScriptEditor"),
      applyScript: t("applyScript"),

      // Node creation labels
      nodeLabelAxiom: t("nodeLabelAxiom"),
      nodeLabelAssumption: t("nodeLabelAssumption"),
      nodeLabelSequent: t("nodeLabelSequent"),
      nodeLabelSignedFormula: t("nodeLabelSignedFormula"),

      // Paste compatibility
      pasteIncompatibleStyle: String(t.raw("pasteIncompatibleStyle")),

      // Accessibility
      workspaceMenuAriaLabel: t("workspaceMenuAriaLabel"),

      // Proof collection panel
      openCollection: t("openCollection"),
      collectionPanelTitle: t("collectionPanelTitle"),
      collectionEmpty: t("collectionEmpty"),
      collectionEntryDelete: t("collectionEntryDelete"),
      collectionEntryImport: t("collectionEntryImport"),
      collectionEntryMemoPlaceholder: t("collectionEntryMemoPlaceholder"),
      collectionEntryCount: String(t.raw("collectionEntryCount")),

      // Folder management
      collectionCreateFolder: t("collectionCreateFolder"),
      collectionFolderNamePlaceholder: t("collectionFolderNamePlaceholder"),
      collectionFolderDelete: t("collectionFolderDelete"),
      collectionFolderRename: t("collectionFolderRename"),
      collectionMoveToFolder: t("collectionMoveToFolder"),
      collectionMoveToRoot: t("collectionMoveToRoot"),
      collectionRootEntries: t("collectionRootEntries"),
      collectionFolderEntryCount: String(t.raw("collectionFolderEntryCount")),
      collectionAxiomWarning: String(t.raw("collectionAxiomWarning")),
      collectionStyleMismatch: String(t.raw("collectionStyleMismatch")),
    }),
    [t],
  );
}

function WorkspaceInner() {
  const params = useParams();
  const router = useRouter();
  const notebookCollection = useNotebookCollection();
  const proofCollection = useProofCollection();
  const questProgress = useQuestProgress();
  const proofMessages = useProofMessagesFromIntl();
  const pageMessages = useWorkspacePageMessagesFromIntl();
  const themeLabels = useThemeLabelsFromIntl();
  const rawLocale = useLocale();
  const locale = isLocale(rawLocale) ?? "en";
  const localeSwitchDeps = useMemo(() => getBrowserLocaleSwitchDeps(), []);
  const { switchLocale } = useLocaleSwitch(localeSwitchDeps);
  const [referenceDetailId, setReferenceDetailId] = useState<string | null>(
    null,
  );
  const referenceLocale: ReferenceLocale = locale;

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

  const handleNotebookRename = useCallback(
    (newName: string) => {
      if (notebookId !== undefined) {
        notebookCollection.rename(notebookId, newName);
      }
    },
    [notebookId, notebookCollection],
  );

  const handleDuplicateToFree = useCallback(() => {
    if (notebookId !== undefined) {
      const newId = notebookCollection.convertToFree(notebookId);
      if (newId !== undefined) {
        router.push(`/workspace/${newId satisfies string}`);
      }
    }
  }, [notebookId, notebookCollection, router]);

  const addProofEntry = proofCollection.addEntry;
  const handleSaveToCollection = useCallback(
    (params: ProofSaveParams) => {
      addProofEntry(params);
    },
    [addProofEntry],
  );

  const handleOpenReferenceDetail = useCallback((entryId: string) => {
    setReferenceDetailId(entryId);
  }, []);

  const handleOpenSyntaxHelp = useCallback(() => {
    setReferenceDetailId("notation-input-methods");
  }, []);

  const handleCloseReferenceDetail = useCallback(() => {
    setReferenceDetailId(null);
  }, []);

  const referenceDetailEntry = useMemo(
    () =>
      referenceDetailId !== null
        ? findEntryById(allReferenceEntries, referenceDetailId)
        : undefined,
    [referenceDetailId],
  );

  const questInfo = useMemo((): GoalQuestInfo | undefined => {
    if (questId === undefined) return undefined;
    const quest = builtinQuests.find((q) => q.id === questId);
    if (quest === undefined) return undefined;
    return {
      description: quest.description,
      hints: quest.hints,
      learningPoint: quest.learningPoint,
    };
  }, [questId]);

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
        pageMessages={pageMessages}
        themeLabels={themeLabels}
      />
    );
  }

  return (
    <>
      <WorkspacePageView
        found={true}
        notebookName={notebook.meta.name}
        onNotebookRename={handleNotebookRename}
        workspace={notebook.workspace}
        messages={proofMessages}
        onBack={handleBack}
        onWorkspaceChange={handleWorkspaceChange}
        onGoalAchieved={handleGoalAchieved}
        onOpenSyntaxHelp={handleOpenSyntaxHelp}
        onDuplicateToFree={handleDuplicateToFree}
        onSaveProofToCollection={handleSaveToCollection}
        collectionEntries={proofCollection.entries}
        onRenameCollectionEntry={proofCollection.renameEntry}
        onUpdateCollectionMemo={proofCollection.updateMemo}
        onRemoveCollectionEntry={proofCollection.removeEntry}
        collectionFolders={proofCollection.folders}
        onMoveCollectionEntry={proofCollection.moveEntry}
        onCreateCollectionFolder={proofCollection.createFolder}
        onRemoveCollectionFolder={proofCollection.removeFolder}
        onRenameCollectionFolder={proofCollection.renameFolder}
        questVersionWarning={questVersionWarning}
        questInfo={questInfo}
        referenceEntries={allReferenceEntries}
        onOpenReferenceDetail={handleOpenReferenceDetail}
        locale={referenceLocale}
        languageToggle={languageToggle}
        pageMessages={pageMessages}
        themeLabels={themeLabels}
      />
      {referenceDetailEntry !== undefined ? (
        <ReferenceFloatingWindow
          entry={referenceDetailEntry}
          allEntries={allReferenceEntries}
          locale={referenceLocale}
          onClose={handleCloseReferenceDetail}
          onNavigate={handleOpenReferenceDetail}
        />
      ) : null}
    </>
  );
}

export default function WorkspaceContent() {
  return (
    <ThemeProvider>
      <AntDesignThemeProvider>
        <WorkspaceInner />
      </AntDesignThemeProvider>
    </ThemeProvider>
  );
}

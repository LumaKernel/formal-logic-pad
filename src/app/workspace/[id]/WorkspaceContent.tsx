"use client";

import { useCallback, useMemo, type CSSProperties } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useNotebookCollection, findNotebook } from "../../../lib/notebook";
import { ProofWorkspace } from "../../../lib/proof-pad";
import type { GoalAchievedInfo } from "../../../lib/proof-pad";
import { ProofMessagesProvider } from "../../../lib/proof-pad";
import type { ProofMessages } from "../../../lib/proof-pad";
import type { WorkspaceState } from "../../../lib/proof-pad/workspaceState";
import { useQuestProgress } from "../../../lib/quest";
import { ThemeProvider } from "../../../lib/theme/ThemeProvider";
import { ThemeToggle } from "../../../components/ThemeToggle/ThemeToggle";

// --- Styles ---

const pageStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  height: "100vh",
  background: "var(--color-bg-primary)",
  color: "var(--color-text-primary)",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
};

const headerStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "8px 16px",
  borderBottom: "1px solid var(--color-border, #e0e0e0)",
  background: "var(--color-surface, #fff)",
  flexShrink: 0,
};

const backButtonStyle: CSSProperties = {
  padding: "6px 14px",
  fontSize: 13,
  fontWeight: 600,
  border: "1px solid var(--color-border, #e0e0e0)",
  borderRadius: 6,
  cursor: "pointer",
  background: "transparent",
  color: "var(--color-text-primary, #333)",
  transition: "background 0.15s",
};

const notebookNameStyle: CSSProperties = {
  fontSize: 16,
  fontWeight: 600,
  flex: 1,
  textAlign: "center",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  padding: "0 12px",
};

const headerActionsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const workspaceContainerStyle: CSSProperties = {
  flex: 1,
  position: "relative",
  overflow: "hidden",
};

const notFoundStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  height: "100vh",
  gap: 16,
  color: "var(--color-text-secondary, #666)",
};

/** next-intl の翻訳から ProofMessages オブジェクトを構築するフック */
function useProofMessagesFromIntl(): ProofMessages {
  const t = useTranslations("ProofWorkspace");
  return useMemo((): ProofMessages => ({
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
  }), [t]);
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
    return (
      <div style={notFoundStyle}>
        <div style={{ fontSize: 18, fontWeight: 600 }}>Notebook not found</div>
        <button type="button" style={backButtonStyle} onClick={handleBack}>
          Back to Hub
        </button>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      {/* Header */}
      <header style={headerStyle}>
        <button type="button" style={backButtonStyle} onClick={handleBack}>
          Back
        </button>
        <span style={notebookNameStyle}>{notebook.meta.name}</span>
        <div style={headerActionsStyle}>
          <ThemeToggle />
        </div>
      </header>

      {/* Workspace */}
      <div style={workspaceContainerStyle}>
        <ProofMessagesProvider messages={proofMessages}>
          <ProofWorkspace
            system={notebook.workspace.system}
            workspace={notebook.workspace}
            onWorkspaceChange={handleWorkspaceChange}
            onGoalAchieved={handleGoalAchieved}
          />
        </ProofMessagesProvider>
      </div>
    </div>
  );
}

export default function WorkspaceContent() {
  return (
    <ThemeProvider>
      <WorkspaceInner />
    </ThemeProvider>
  );
}

"use client";

import { useCallback, type CSSProperties } from "react";
import { useParams, useRouter } from "next/navigation";
import { useNotebookCollection, findNotebook } from "../../../lib/notebook";
import { ProofWorkspace } from "../../../lib/proof-pad";
import type { WorkspaceState } from "../../../lib/proof-pad/workspaceState";
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

function WorkspaceInner() {
  const params = useParams();
  const router = useRouter();
  const notebookCollection = useNotebookCollection();

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
        <ProofWorkspace
          system={notebook.workspace.system}
          workspace={notebook.workspace}
          onWorkspaceChange={handleWorkspaceChange}
        />
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

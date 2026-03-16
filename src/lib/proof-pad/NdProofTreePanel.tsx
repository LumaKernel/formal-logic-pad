/**
 * ND証明木のGentzenスタイル表示パネル。
 *
 * ワークスペースのノード＋InferenceEdgesを受け取り、
 * Gentzenスタイルの証明木を表示する。
 *
 * 変更時は NdProofTreePanel.test.tsx, ProofWorkspace.tsx, index.ts も同期すること。
 */

import { type CSSProperties, useMemo, useState, useCallback } from "react";
import type { InferenceEdge } from "./inferenceEdge";
import type { WorkspaceNode } from "./workspaceState";
import type {
  ProofTreeDisplayData,
  ProofTreeDisplayNode,
} from "./scProofTreeRendererLogic";
import {
  convertNdWorkspaceToProofTree,
  findNdProofTreeRoots,
  computeProofTreeStats,
} from "./ndProofTreeRendererLogic";

// --- Props ---

export interface NdProofTreePanelProps {
  /** ワークスペースノード */
  readonly nodes: readonly WorkspaceNode[];
  /** 推論エッジ */
  readonly inferenceEdges: readonly InferenceEdge[];
  /** data-testid */
  readonly testId?: string;
}

// --- スタイル ---

const panelStyle: Readonly<CSSProperties> = {
  position: "absolute",
  bottom: 12,
  right: 12,
  zIndex: 10,
  background: "var(--color-panel-bg, rgba(252, 249, 243, 0.96))",
  borderRadius: 8,
  border: "1px solid var(--color-panel-border, rgba(180, 160, 130, 0.2))",
  boxShadow: "0 2px 12px var(--color-panel-shadow, rgba(120, 100, 70, 0.1))",
  padding: "8px 12px",
  fontFamily: "var(--font-ui)",
  fontSize: 12,
  maxWidth: "60vw",
  maxHeight: "40vh",
  overflow: "auto",
  pointerEvents: "auto",
};

const headerStyle: Readonly<CSSProperties> = {
  fontWeight: 700,
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: 1,
  color: "var(--color-text-secondary, #666)",
  marginBottom: 6,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const statsStyle: Readonly<CSSProperties> = {
  fontSize: 10,
  color: "var(--color-text-secondary, #666)",
  fontWeight: 400,
  textTransform: "none",
  letterSpacing: 0,
};

const treeContainerStyle: Readonly<CSSProperties> = {
  display: "flex",
  justifyContent: "center",
  overflowX: "auto",
  paddingTop: 4,
};

const nodeContainerStyle: Readonly<CSSProperties> = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
};

const premisesRowStyle: Readonly<CSSProperties> = {
  display: "flex",
  gap: 12,
  justifyContent: "center",
  alignItems: "flex-end",
};

const inferenceLineContainerStyle: Readonly<CSSProperties> = {
  display: "flex",
  alignItems: "center",
  gap: 4,
  margin: "2px 0",
};

const inferenceLineStyle: Readonly<CSSProperties> = {
  flex: 1,
  height: 1,
  background: "var(--color-text-primary, #333)",
  minWidth: 20,
};

const ruleLabelStyle: Readonly<CSSProperties> = {
  fontSize: 9,
  fontFamily: "var(--font-formula)",
  color: "var(--color-text-secondary, #666)",
  whiteSpace: "nowrap",
  fontStyle: "italic",
};

const conclusionTextStyle: Readonly<CSSProperties> = {
  fontSize: 11,
  fontFamily: "var(--font-formula)",
  fontStyle: "italic",
  color: "var(--color-text-primary, #333)",
  whiteSpace: "nowrap",
  padding: "0 4px",
};

const rootSelectorStyle: Readonly<CSSProperties> = {
  fontSize: 10,
  color: "var(--color-text-secondary, #666)",
  cursor: "pointer",
  background: "none",
  border: "1px solid var(--color-panel-border, rgba(180, 160, 130, 0.3))",
  borderRadius: 4,
  padding: "1px 6px",
  fontFamily: "var(--font-ui)",
};

const emptyMessageStyle: Readonly<CSSProperties> = {
  color: "var(--color-text-secondary, #999)",
  fontSize: 11,
  fontStyle: "italic",
  textAlign: "center",
  padding: "8px 0",
};

// --- ツリーノード再帰レンダリング ---

function ProofTreeNode({
  nodeId,
  data,
  testId,
}: {
  readonly nodeId: string;
  readonly data: ProofTreeDisplayData;
  readonly testId: string | undefined;
}) {
  const node: ProofTreeDisplayNode | undefined = data.nodes.get(nodeId);
  /* v8 ignore start -- 防御的コード: 正常な変換結果では到達しない */
  if (node === undefined) return null;
  /* v8 ignore stop */

  const hasPremises = node.premiseIds.length > 0;

  return (
    <div
      style={nodeContainerStyle}
      data-testid={
        testId !== undefined
          ? `${testId satisfies string}-node-${node.id satisfies string}`
          : undefined
      }
    >
      {/* 前提 */}
      {hasPremises ? (
        <div style={premisesRowStyle}>
          {node.premiseIds.map((pid) => (
            <ProofTreeNode key={pid} nodeId={pid} data={data} testId={testId} />
          ))}
        </div>
      ) : null}

      {/* 推論線 + 規則ラベル */}
      <div style={inferenceLineContainerStyle}>
        <div style={inferenceLineStyle} />
        <span
          style={ruleLabelStyle}
          data-testid={
            testId !== undefined
              ? `${testId satisfies string}-rule-${node.id satisfies string}`
              : undefined
          }
        >
          {node.ruleLabel}
        </span>
      </div>

      {/* 結論 */}
      <div
        style={conclusionTextStyle}
        data-testid={
          testId !== undefined
            ? `${testId satisfies string}-concl-${node.id satisfies string}`
            : undefined
        }
      >
        {node.conclusionText}
      </div>
    </div>
  );
}

// --- メインコンポーネント ---

export function NdProofTreePanel({
  nodes,
  inferenceEdges,
  testId,
}: NdProofTreePanelProps) {
  const roots = useMemo(
    () => findNdProofTreeRoots(nodes, inferenceEdges),
    [nodes, inferenceEdges],
  );

  const [selectedRootIndex, setSelectedRootIndex] = useState(0);

  // ルートが変わったらインデックスをリセット
  const effectiveIndex =
    roots.length > 0 ? Math.min(selectedRootIndex, roots.length - 1) : 0;

  const handleCycleRoot = useCallback(() => {
    setSelectedRootIndex((prev) => (prev + 1) % Math.max(roots.length, 1));
  }, [roots.length]);

  const displayData = useMemo(() => {
    if (roots.length === 0) return null;
    const rootNodeId = roots[effectiveIndex]!;
    return convertNdWorkspaceToProofTree(nodes, inferenceEdges, rootNodeId);
  }, [nodes, inferenceEdges, roots, effectiveIndex]);

  const stats = useMemo(
    () => (displayData !== null ? computeProofTreeStats(displayData) : null),
    [displayData],
  );

  return (
    <div
      style={panelStyle}
      data-testid={testId}
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      <div style={headerStyle}>
        <span>ND Proof Tree</span>
        <span style={statsStyle}>
          {stats !== null
            ? `${String(stats.totalNodes) satisfies string} nodes, depth ${String(stats.maxDepth) satisfies string}`
            : "No proof"}
          {roots.length > 1 ? (
            <>
              {" "}
              <button
                style={rootSelectorStyle}
                onClick={handleCycleRoot}
                data-testid={
                  testId !== undefined
                    ? `${testId satisfies string}-cycle-root`
                    : undefined
                }
              >
                {`${String(effectiveIndex + 1) satisfies string}/${String(roots.length) satisfies string}`}
              </button>
            </>
          ) : null}
        </span>
      </div>

      {displayData !== null ? (
        <div style={treeContainerStyle}>
          <ProofTreeNode
            nodeId={displayData.rootId}
            data={displayData}
            testId={testId}
          />
        </div>
      ) : (
        <div style={emptyMessageStyle}>
          No inference edges yet. Apply rules to build a proof tree.
        </div>
      )}
    </div>
  );
}

/**
 * TABタブロー証明木の視覚的フロー表示パネル。
 *
 * ワークスペースのノード＋TabInferenceEdgesを受け取り、
 * タブロースタイル（上から下）の証明木を表示する。
 *
 * - ルート（初期シーケント）が最上部
 * - 規則適用で下方に分解
 * - 分岐規則で二股に分かれる
 * - 閉じた枝には × マーク、開いた枝には ○ マーク
 *
 * 変更時は TabProofTreePanel.stories.tsx, ProofWorkspace.tsx, index.ts も同期すること。
 */

import { type CSSProperties, useMemo, useState, useCallback } from "react";
import type { InferenceEdge } from "./inferenceEdge";
import type { WorkspaceNode } from "./workspaceState";
import type {
  TabTreeDisplayData,
  TabTreeDisplayNode,
} from "./tabProofTreeRendererLogic";
import {
  convertTabWorkspaceToTreeDisplay,
  findTabTreeRoots,
  computeTabTreeStats,
} from "./tabProofTreeRendererLogic";
import { FormulaListDisplay } from "./FormulaListDisplay";

// --- Props ---

export interface TabProofTreePanelProps {
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

const branchInfoStyle: Readonly<CSSProperties> = {
  fontSize: 10,
  color: "var(--color-text-secondary, #666)",
  fontWeight: 400,
  textTransform: "none",
  letterSpacing: 0,
  marginLeft: 6,
};

const treeContainerStyle: Readonly<CSSProperties> = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  overflowX: "auto",
  paddingTop: 4,
};

const nodeContainerStyle: Readonly<CSSProperties> = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
};

const sequentTextStyle: Readonly<CSSProperties> = {
  fontSize: 11,
  fontFamily: "var(--font-formula)",
  fontStyle: "italic",
  color: "var(--color-text-primary, #333)",
  whiteSpace: "nowrap",
  padding: "2px 6px",
};

const ruleLabelContainerStyle: Readonly<CSSProperties> = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  margin: "1px 0",
};

const ruleLabelStyle: Readonly<CSSProperties> = {
  fontSize: 9,
  fontFamily: "var(--font-formula)",
  color: "var(--color-text-secondary, #666)",
  whiteSpace: "nowrap",
  fontStyle: "italic",
  background: "var(--color-panel-bg, rgba(252, 249, 243, 0.96))",
  padding: "0 3px",
};

const verticalLineStyle: Readonly<CSSProperties> = {
  width: 1,
  height: 8,
  background: "var(--color-text-primary, #333)",
};

const branchContainerStyle: Readonly<CSSProperties> = {
  display: "flex",
  gap: 16,
  alignItems: "flex-start",
  position: "relative",
};

const closedMarkerStyle: Readonly<CSSProperties> = {
  fontSize: 13,
  fontWeight: 700,
  color: "#c0392b",
  margin: "2px 0",
};

const openMarkerStyle: Readonly<CSSProperties> = {
  fontSize: 13,
  fontWeight: 700,
  color: "#27ae60",
  margin: "2px 0",
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
  color: "var(--color-text-secondary, #666)",
  fontSize: 11,
  fontStyle: "italic",
  textAlign: "center",
  padding: "8px 0",
};

// --- ツリーノード再帰レンダリング ---

function TabTreeNode({
  nodeId,
  data,
  testId,
}: {
  readonly nodeId: string;
  readonly data: TabTreeDisplayData;
  readonly testId: string | undefined;
}) {
  const node: TabTreeDisplayNode | undefined = data.nodes.get(nodeId);
  /* v8 ignore start -- 防御的コード: 正常な変換結果では到達しない */
  if (node === undefined) return null;
  /* v8 ignore stop */

  const hasChildren = node.childIds.length > 0;
  const isBranching = node.childIds.length > 1;

  return (
    <div
      style={nodeContainerStyle}
      data-testid={
        testId !== undefined
          ? `${testId satisfies string}-node-${node.id satisfies string}`
          : undefined
      }
    >
      {/* 規則ラベル（ルート以外） */}
      {node.ruleLabel !== undefined ? (
        <div style={ruleLabelContainerStyle}>
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
      ) : null}

      {/* シーケントテキスト（FormulaListDisplayでシンタックスハイライト） */}
      <div
        style={sequentTextStyle}
        data-testid={
          testId !== undefined
            ? `${testId satisfies string}-seq-${node.id satisfies string}`
            : undefined
        }
      >
        <FormulaListDisplay
          formulaTexts={node.formulaTexts}
          text={node.sequentText}
          fontSize={11}
        />
      </div>

      {/* 枝の状態マーカー */}
      {node.branchStatus === "closed" ? (
        <div
          style={closedMarkerStyle}
          data-testid={
            testId !== undefined
              ? `${testId satisfies string}-closed-${node.id satisfies string}`
              : undefined
          }
        >
          {"×"}
        </div>
      ) : null}
      {node.branchStatus === "open" ? (
        <div
          style={openMarkerStyle}
          data-testid={
            testId !== undefined
              ? `${testId satisfies string}-open-${node.id satisfies string}`
              : undefined
          }
        >
          {"○"}
        </div>
      ) : null}

      {/* 子ノードへの接続線 + 子ノード */}
      {hasChildren ? (
        <>
          {/* 垂直接続線 */}
          <div style={verticalLineStyle} />

          {isBranching ? (
            /* 分岐レイアウト */
            <div style={branchContainerStyle}>
              {node.childIds.map((childId) => (
                <div
                  key={childId}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  <div style={verticalLineStyle} />
                  <TabTreeNode nodeId={childId} data={data} testId={testId} />
                </div>
              ))}
            </div>
          ) : (
            /* 単一子ノード */
            <TabTreeNode
              nodeId={node.childIds[0]!}
              data={data}
              testId={testId}
            />
          )}
        </>
      ) : null}
    </div>
  );
}

// --- メインコンポーネント ---

export function TabProofTreePanel({
  nodes,
  inferenceEdges,
  testId,
}: TabProofTreePanelProps) {
  const roots = useMemo(
    () => findTabTreeRoots(nodes, inferenceEdges),
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
    return convertTabWorkspaceToTreeDisplay(nodes, inferenceEdges, rootNodeId);
  }, [nodes, inferenceEdges, roots, effectiveIndex]);

  const stats = useMemo(
    () => (displayData !== null ? computeTabTreeStats(displayData) : null),
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
        <span>Tableau Tree</span>
        <span style={statsStyle}>
          {stats !== null
            ? `${String(stats.totalNodes) satisfies string} nodes, depth ${String(stats.maxDepth) satisfies string}`
            : "No proof"}
          {stats !== null ? (
            <span style={branchInfoStyle}>
              {`${String(stats.closedBranches) satisfies string}× ${String(stats.openBranches) satisfies string}○`}
            </span>
          ) : null}
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
          <TabTreeNode
            nodeId={displayData.rootId}
            data={displayData}
            testId={testId}
          />
        </div>
      ) : (
        <div style={emptyMessageStyle}>
          No tableau rules applied yet. Apply rules to build a tableau tree.
        </div>
      )}
    </div>
  );
}

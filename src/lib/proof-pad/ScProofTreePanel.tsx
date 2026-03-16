/**
 * SC証明木のGentzenスタイル表示パネル。
 *
 * ScProofNode を受け取り、横線で前提と結論を分けた
 * Gentzenスタイルの証明木を表示する。
 *
 * 変更時は ScProofTreePanel.test.tsx, ProofWorkspace.tsx, index.ts も同期すること。
 */

import { type CSSProperties, useMemo } from "react";
import type { ScProofNode } from "../logic-core/sequentCalculus";
import type {
  ProofTreeDisplayData,
  ProofTreeDisplayNode,
} from "./scProofTreeRendererLogic";
import {
  convertScProofTreeToDisplay,
  computeProofTreeStats,
} from "./scProofTreeRendererLogic";

// --- Props ---

export interface ScProofTreePanelProps {
  /** 表示する証明木 */
  readonly proof: ScProofNode;
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

export function ScProofTreePanel({ proof, testId }: ScProofTreePanelProps) {
  const displayData = useMemo(
    () => convertScProofTreeToDisplay(proof),
    [proof],
  );
  const stats = useMemo(
    () => computeProofTreeStats(displayData),
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
        <span>Proof Tree</span>
        <span style={statsStyle}>
          {`${String(stats.totalNodes) satisfies string} nodes, depth ${String(stats.maxDepth) satisfies string}`}
        </span>
      </div>

      <div style={treeContainerStyle}>
        <ProofTreeNode
          nodeId={displayData.rootId}
          data={displayData}
          testId={testId}
        />
      </div>
    </div>
  );
}

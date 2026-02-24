/**
 * 公理パレットコンポーネント。
 *
 * 利用可能な公理一覧を表示し、クリックで公理ノードをワークスペースに追加する。
 * サイドパネル形式で ProofWorkspace.tsx から利用される。
 *
 * 変更時は AxiomPalette.test.tsx, AxiomPalette.stories.tsx, ProofWorkspace.tsx, index.ts も同期すること。
 */

import { type CSSProperties, useCallback, useMemo } from "react";
import type { AxiomPaletteItem } from "./axiomPaletteLogic";

// --- Props ---

export interface AxiomPaletteProps {
  /** 利用可能な公理リスト */
  readonly axioms: readonly AxiomPaletteItem[];
  /** 公理追加時のコールバック */
  readonly onAddAxiom: (axiom: AxiomPaletteItem) => void;
  /** data-testid */
  readonly testId?: string;
}

// --- スタイル ---

const panelStyle: CSSProperties = {
  position: "absolute",
  top: 48,
  left: 12,
  zIndex: 10,
  background: "rgba(255, 255, 255, 0.95)",
  borderRadius: 8,
  boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
  padding: "8px 0",
  fontFamily: "sans-serif",
  fontSize: 12,
  maxHeight: "calc(100% - 80px)",
  overflowY: "auto" as const,
  minWidth: 200,
  pointerEvents: "auto" as const,
};

const headerStyle: CSSProperties = {
  padding: "4px 12px 8px",
  fontWeight: 700,
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: 1,
  color: "#666",
  borderBottom: "1px solid #eee",
  marginBottom: 4,
};

const itemStyle: CSSProperties = {
  padding: "6px 12px",
  cursor: "pointer",
  display: "flex",
  flexDirection: "column",
  gap: 2,
  transition: "background 0.15s",
};

const itemHoverStyle: CSSProperties = {
  ...itemStyle,
  background: "rgba(91, 139, 217, 0.1)",
};

const itemLabelStyle: CSSProperties = {
  fontWeight: 600,
  fontSize: 12,
  color: "#333",
};

const itemFormulaStyle: CSSProperties = {
  fontFamily: "serif, 'Times New Roman', Times",
  fontStyle: "italic",
  fontSize: 11,
  color: "#666",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

// --- コンポーネント ---

function AxiomPaletteItemView({
  axiom,
  onAdd,
  testId,
}: {
  readonly axiom: AxiomPaletteItem;
  readonly onAdd: (axiom: AxiomPaletteItem) => void;
  readonly testId?: string;
}) {
  const handleClick = useCallback(() => {
    onAdd(axiom);
  }, [axiom, onAdd]);

  return (
    <div
      data-testid={testId}
      style={itemStyle}
      onClick={handleClick}
      onMouseEnter={(e) => {
        Object.assign(e.currentTarget.style, itemHoverStyle);
      }}
      onMouseLeave={(e) => {
        Object.assign(e.currentTarget.style, { background: "" });
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onAdd(axiom);
        }
      }}
    >
      <span style={itemLabelStyle}>{axiom.displayName}</span>
      <span style={itemFormulaStyle}>{axiom.unicodeDisplay}</span>
    </div>
  );
}

export function AxiomPalette({
  axioms,
  onAddAxiom,
  testId,
}: AxiomPaletteProps) {
  const items = useMemo(
    () =>
      axioms.map((axiom) => (
        <AxiomPaletteItemView
          key={axiom.id}
          axiom={axiom}
          onAdd={onAddAxiom}
          testId={
            testId
              ? `${testId satisfies string}-item-${axiom.id satisfies string}`
              : undefined
          }
        />
      )),
    [axioms, onAddAxiom, testId],
  );

  if (axioms.length === 0) {
    return null;
  }

  return (
    <div data-testid={testId} style={panelStyle}>
      <div style={headerStyle}>Axioms</div>
      {items}
    </div>
  );
}

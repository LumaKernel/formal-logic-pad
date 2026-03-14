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
import { getAxiomReferenceEntryId } from "./axiomPaletteLogic";
import type { ReferenceEntry, Locale } from "../reference/referenceEntry";
import { findEntryById } from "../reference/referenceEntry";
import { ReferencePopover } from "../reference/ReferencePopover";
import { FormulaDisplay } from "../formula-input/FormulaDisplay";
import { useProofMessages } from "./ProofMessagesContext";
import type { PanelPosition } from "./panelPositionLogic";

// --- Props ---

export interface AxiomPaletteProps {
  /** 利用可能な公理リスト */
  readonly axioms: readonly AxiomPaletteItem[];
  /** 公理追加時のコールバック */
  readonly onAddAxiom: (axiom: AxiomPaletteItem) => void;
  /** リファレンスエントリ一覧（省略時はリファレンスポップオーバー非表示） */
  readonly referenceEntries?: readonly ReferenceEntry[];
  /** ロケール（リファレンス表示用、省略時は"ja"） */
  readonly locale?: Locale;
  /** リファレンス詳細モーダルを開くコールバック */
  readonly onOpenReferenceDetail?: (entryId: string) => void;
  /** パネル位置（指定時はleft/topで配置、省略時はデフォルトのleft/topで配置） */
  readonly position?: PanelPosition;
  /** ドラッグハンドルのpointerdownイベント */
  readonly onDragHandlePointerDown?: (
    e: React.PointerEvent<HTMLElement>,
  ) => void;
  /** パネルDOM要素へのcallback ref（サイズ計測用） */
  readonly panelRef?: (node: HTMLElement | null) => void;
  /** data-testid */
  readonly testId?: string;
}

// --- スタイル ---

const panelStyle: CSSProperties = {
  position: "absolute",
  top: 48,
  left: 12,
  zIndex: 10,
  background: "var(--color-panel-bg, rgba(252, 249, 243, 0.96))",
  borderRadius: 8,
  border: "1px solid var(--color-panel-border, rgba(180, 160, 130, 0.2))",
  boxShadow: "0 2px 12px var(--color-panel-shadow, rgba(120, 100, 70, 0.1))",
  padding: "8px 0",
  fontFamily: "var(--font-ui)",
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
  color: "var(--color-text-secondary, #666)",
  borderBottom:
    "1px solid var(--color-panel-rule-line, rgba(180, 160, 130, 0.15))",
  marginBottom: 4,
};

const itemStyleConst: Readonly<CSSProperties> = {
  display: "flex",
  cursor: "pointer",
  flexDirection: "column",
  gap: 2,
  padding: "6px 12px",
  transitionProperty: "background, box-shadow",
  transitionDuration: "150ms",
  borderBottom:
    "1px solid var(--color-panel-rule-line, rgba(180, 160, 130, 0.15))",
};

const itemHoverBg =
  "var(--color-paper-button-hover-bg, rgba(245, 240, 230, 0.95))";

const itemLabelStyle: Readonly<CSSProperties> = {
  fontSize: 12,
  fontWeight: 600,
  color: "var(--color-text-primary, #333)",
};

const itemFormulaStyle: Readonly<CSSProperties> = {
  fontFamily: "var(--font-formula)",
  fontStyle: "italic",
  fontSize: 11,
  color: "var(--color-text-secondary, #666)",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

// --- コンポーネント ---

const itemLabelRowStyle: Readonly<CSSProperties> = {
  display: "flex",
  alignItems: "center",
  gap: 4,
};

function AxiomPaletteItemView({
  axiom,
  onAdd,
  referenceEntry,
  locale,
  onOpenReferenceDetail,
  testId,
}: {
  readonly axiom: AxiomPaletteItem;
  readonly onAdd: (axiom: AxiomPaletteItem) => void;
  readonly referenceEntry?: ReferenceEntry;
  readonly locale?: Locale;
  readonly onOpenReferenceDetail?: (entryId: string) => void;
  readonly testId?: string;
}) {
  const handleClick = useCallback(() => {
    onAdd(axiom);
  }, [axiom, onAdd]);

  const handlePopoverClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  return (
    <div
      data-testid={testId}
      style={itemStyleConst}
      onClick={handleClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = itemHoverBg;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "";
      }}
      role="button"
      tabIndex={0}
      /* v8 ignore start -- キーボード操作: role="button"のアクセシビリティ対応 */
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onAdd(axiom);
        }
      }}
      /* v8 ignore stop */
    >
      <span style={itemLabelRowStyle}>
        <span style={itemLabelStyle}>{axiom.displayName}</span>
        {referenceEntry !== undefined && locale !== undefined && (
          <span role="presentation" onClick={handlePopoverClick}>
            <ReferencePopover
              entry={referenceEntry}
              locale={locale}
              onOpenDetail={onOpenReferenceDetail}
              testId={
                testId !== undefined
                  ? `${testId satisfies string}-ref`
                  : undefined
              }
            />
          </span>
        )}
      </span>
      <span style={itemFormulaStyle}>
        <FormulaDisplay formula={axiom.template} fontSize={11} />
      </span>
    </div>
  );
}

export function AxiomPalette({
  axioms,
  onAddAxiom,
  referenceEntries,
  locale,
  onOpenReferenceDetail,
  position,
  onDragHandlePointerDown,
  panelRef,
  testId,
}: AxiomPaletteProps) {
  const msg = useProofMessages();
  const items = useMemo(
    () =>
      axioms.map((axiom) => {
        const refEntryId = getAxiomReferenceEntryId(axiom.id);
        const refEntry =
          refEntryId !== undefined && referenceEntries !== undefined
            ? findEntryById(referenceEntries, refEntryId)
            : undefined;
        return (
          <AxiomPaletteItemView
            key={axiom.id}
            axiom={axiom}
            onAdd={onAddAxiom}
            referenceEntry={refEntry}
            locale={locale}
            onOpenReferenceDetail={onOpenReferenceDetail}
            testId={
              testId
                ? `${testId satisfies string}-item-${axiom.id satisfies string}`
                : undefined
            }
          />
        );
      }),
    [
      axioms,
      onAddAxiom,
      referenceEntries,
      locale,
      onOpenReferenceDetail,
      testId,
    ],
  );

  const resolvedPanelStyle = useMemo(
    (): CSSProperties =>
      position !== undefined
        ? { ...panelStyle, left: position.x, top: position.y }
        : panelStyle,
    [position],
  );

  const dragHeaderStyle = useMemo(
    (): CSSProperties => ({
      ...headerStyle,
      cursor: onDragHandlePointerDown !== undefined ? "grab" : undefined,
      userSelect: onDragHandlePointerDown !== undefined ? "none" : undefined,
    }),
    [onDragHandlePointerDown],
  );

  if (axioms.length === 0) {
    return null;
  }

  return (
    <div ref={panelRef} data-testid={testId} style={resolvedPanelStyle}>
      <div style={dragHeaderStyle} onPointerDown={onDragHandlePointerDown}>
        {msg.axiomPaletteHeader}
      </div>
      {items}
    </div>
  );
}

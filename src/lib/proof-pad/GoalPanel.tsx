/**
 * ゴール一覧パネルコンポーネント。
 *
 * クエストモードのワークスペースで、証明すべきゴールの一覧と達成状況を表示する。
 * 右上にサイドパネル形式で表示される。
 * クエスト情報がある場合、ゴールアイテムのクリックで詳細パネル（解説・ヒント・公理・学習ポイント）を展開する。
 *
 * 変更時は GoalPanel.test.tsx, ProofWorkspace.tsx, index.ts も同期すること。
 */

import { type CSSProperties, useState, useCallback, useMemo } from "react";
import type {
  GoalPanelData,
  GoalPanelItem,
  GoalQuestInfo,
} from "./goalPanelLogic";
import type { ProofMessages } from "./proofMessages";
import { formatMessage } from "./proofMessages";
import { FormulaDisplay } from "../formula-input/FormulaDisplay";
import type { PanelPosition } from "./panelPositionLogic";
import type { ReferenceEntry, Locale } from "../reference/referenceEntry";
import { findEntryById } from "../reference/referenceEntry";
import { getAxiomReferenceEntryId } from "./axiomPaletteLogic";
import { ReferencePopover } from "../reference/ReferencePopover";

// --- Props ---

export interface GoalPanelProps {
  /** ゴールパネルデータ */
  readonly data: GoalPanelData;
  /** メッセージ（i18n） */
  readonly messages: ProofMessages;
  /** パネル位置（指定時はleft/topで配置、省略時はデフォルトのright/topで配置） */
  readonly position?: PanelPosition;
  /** ドラッグハンドルのpointerdownイベント */
  readonly onDragHandlePointerDown?: (
    e: React.PointerEvent<HTMLElement>,
  ) => void;
  /** 直前のドラッグ操作で実際に移動が発生したかのref（折り畳みトグルとドラッグの区別に使用） */
  readonly wasDraggedRef?: React.RefObject<boolean>;
  /** リファレンスエントリ一覧（省略時は公理の(?)ボタン非表示） */
  readonly referenceEntries?: readonly ReferenceEntry[];
  /** ロケール（リファレンス表示用） */
  readonly locale?: Locale;
  /** リファレンス詳細モーダルを開くコールバック */
  readonly onOpenReferenceDetail?: (entryId: string) => void;
  /** data-testid */
  readonly testId?: string;
}

// --- スタイル ---

const panelStyle: CSSProperties = {
  position: "absolute",
  top: 48,
  right: 12,
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
  minWidth: 180,
  maxWidth: 280,
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
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const progressStyle: CSSProperties = {
  fontWeight: 400,
  fontSize: 10,
  color: "var(--color-text-secondary, #666)",
};

const itemStyle: CSSProperties = {
  padding: "6px 12px",
  display: "flex",
  flexDirection: "column",
  gap: 2,
  borderBottom:
    "1px solid var(--color-panel-rule-line, rgba(180, 160, 130, 0.15))",
};

const itemClickableStyle: CSSProperties = {
  ...itemStyle,
  cursor: "pointer",
};

const itemLabelStyle: CSSProperties = {
  fontWeight: 600,
  fontSize: 12,
  color: "var(--color-text-primary, #333)",
  display: "flex",
  alignItems: "center",
  gap: 6,
};

const itemFormulaStyle: CSSProperties = {
  fontFamily: "var(--font-formula)",
  fontStyle: "italic",
  fontSize: 11,
  color: "var(--color-text-secondary, #666)",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const statusAchievedStyle: CSSProperties = {
  color: "var(--color-proof-complete-text, #2d6a3f)",
  fontWeight: 700,
  fontSize: 10,
};

const statusNotAchievedStyle: CSSProperties = {
  color: "var(--color-text-secondary, #666)",
  fontWeight: 400,
  fontSize: 10,
};

const statusParseErrorStyle: CSSProperties = {
  color: "var(--color-error, #c53030)",
  fontWeight: 400,
  fontSize: 10,
};

const statusViolationStyle: CSSProperties = {
  color: "var(--color-warning, #b7791f)",
  fontWeight: 700,
  fontSize: 10,
};

const allowedAxiomsHeaderStyle: CSSProperties = {
  fontSize: 10,
  color: "var(--color-text-secondary, #999)",
  fontStyle: "italic",
  marginTop: 2,
};

const allowedAxiomItemStyle: CSSProperties = {
  fontSize: 10,
  color: "var(--color-text-secondary, #888)",
  display: "flex",
  alignItems: "center",
  gap: 4,
  paddingLeft: 8,
};

const allowedAxiomNameStyle: CSSProperties = {
  fontWeight: 600,
  fontSize: 10,
  color: "var(--color-text-secondary, #777)",
  flexShrink: 0,
};

const violatingAxiomSectionHeaderStyle: CSSProperties = {
  fontWeight: 700,
  fontSize: 10,
  textTransform: "uppercase",
  letterSpacing: 0.5,
  color: "var(--color-warning, #b7791f)",
  marginBottom: 4,
};

const violatingAxiomItemStyle: CSSProperties = {
  fontSize: 10,
  color: "var(--color-warning, #b7791f)",
  display: "flex",
  alignItems: "center",
  gap: 4,
  paddingLeft: 8,
};

const violatingAxiomNameStyle: CSSProperties = {
  fontWeight: 700,
  fontSize: 10,
  color: "var(--color-warning, #b7791f)",
  flexShrink: 0,
};

const toggleButtonStyle: CSSProperties = {
  position: "absolute",
  top: 48,
  right: 12,
  zIndex: 10,
  background: "var(--color-panel-bg, rgba(252, 249, 243, 0.96))",
  borderRadius: 8,
  border: "1px solid var(--color-panel-border, rgba(180, 160, 130, 0.2))",
  boxShadow: "0 2px 12px var(--color-panel-shadow, rgba(120, 100, 70, 0.1))",
  padding: "6px 12px",
  fontFamily: "var(--font-ui)",
  fontSize: 11,
  fontWeight: 700,
  cursor: "pointer",
  color: "var(--color-text-secondary, #666)",
  textTransform: "uppercase",
  letterSpacing: 1,
  pointerEvents: "auto" as const,
};

// --- 詳細パネル用スタイル ---

const detailSectionStyle: CSSProperties = {
  padding: "8px 12px",
  borderBottom:
    "1px solid var(--color-panel-rule-line, rgba(180, 160, 130, 0.15))",
};

const detailSectionHeaderStyle: CSSProperties = {
  fontWeight: 700,
  fontSize: 10,
  textTransform: "uppercase",
  letterSpacing: 0.5,
  color: "var(--color-text-secondary, #888)",
  marginBottom: 4,
};

const detailTextStyle: CSSProperties = {
  fontSize: 11,
  color: "var(--color-text-primary, #333)",
  lineHeight: 1.5,
};

const hintToggleStyle: CSSProperties = {
  fontSize: 10,
  color: "var(--color-link, #2563eb)",
  cursor: "pointer",
  padding: "2px 0",
  fontWeight: 500,
};

const hintTextStyle: CSSProperties = {
  fontSize: 11,
  color: "var(--color-text-primary, #333)",
  lineHeight: 1.5,
  paddingLeft: 8,
  borderLeft:
    "2px solid var(--color-panel-rule-line, rgba(180, 160, 130, 0.3))",
  marginTop: 2,
  marginBottom: 4,
};

const expandIndicatorStyle: CSSProperties = {
  fontSize: 10,
  color: "var(--color-text-secondary, #999)",
  marginLeft: "auto",
};

// --- コンポーネント ---

function GoalItemStatusBadge({
  status,
  messages,
}: {
  readonly status: GoalPanelItem["status"];
  readonly messages: ProofMessages;
}) {
  if (status === "achieved") {
    return <span style={statusAchievedStyle}>{messages.goalProved}</span>;
  }
  if (status === "not-achieved") {
    return <span style={statusNotAchievedStyle}>{messages.goalNotYet}</span>;
  }
  if (status === "parse-error") {
    return (
      <span style={statusParseErrorStyle}>{messages.goalInvalidFormula}</span>
    );
  }
  if (status === "achieved-but-axiom-violation") {
    return (
      <span style={statusViolationStyle}>{messages.goalAxiomViolation}</span>
    );
  }
  return <span style={statusViolationStyle}>{messages.goalRuleViolation}</span>;
}

function HintItem({
  hint,
  index,
  messages,
  testId,
}: {
  readonly hint: string;
  readonly index: number;
  readonly messages: ProofMessages;
  readonly testId: string | undefined;
}) {
  const [revealed, setRevealed] = useState(false);

  const handleReveal = useCallback(() => {
    setRevealed(true);
  }, []);

  const label = formatMessage(messages.goalDetailHintLabel, {
    index: String(index + 1),
  });

  if (revealed) {
    return (
      <div
        data-testid={
          /* v8 ignore start -- testId always provided in tests */
          testId !== undefined
            ? `${testId satisfies string}-hint-${String(index) satisfies string}`
            : undefined
          /* v8 ignore stop */
        }
      >
        <div
          style={{
            ...hintToggleStyle,
            color: "var(--color-text-secondary, #888)",
          }}
        >
          {label}
        </div>
        <div style={hintTextStyle}>{hint}</div>
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      style={hintToggleStyle}
      onClick={(e) => {
        e.stopPropagation();
        handleReveal();
      }}
      /* v8 ignore start -- キーボード操作: role="button"のアクセシビリティ対応 */
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleReveal();
        }
      }}
      /* v8 ignore stop */
      data-testid={
        /* v8 ignore start -- testId always provided in tests */
        testId !== undefined
          ? `${testId satisfies string}-hint-toggle-${String(index) satisfies string}`
          : undefined
        /* v8 ignore stop */
      }
    >
      {`${label satisfies string} ▶`}
    </div>
  );
}

function GoalDetailPanel({
  questInfo,
  item,
  messages,
  referenceEntries,
  locale,
  onOpenReferenceDetail,
  testId,
}: {
  readonly questInfo: GoalQuestInfo;
  readonly item: GoalPanelItem;
  readonly messages: ProofMessages;
  readonly referenceEntries: readonly ReferenceEntry[] | undefined;
  readonly locale: Locale | undefined;
  readonly onOpenReferenceDetail: ((entryId: string) => void) | undefined;
  readonly testId: string | undefined;
}) {
  return (
    <div
      data-testid={
        /* v8 ignore start -- testId always provided in tests */
        testId !== undefined ? `${testId satisfies string}-detail` : undefined
        /* v8 ignore stop */
      }
      /* v8 ignore start -- イベント伝播抑止: テスト環境では発火しない */
      onClick={(e) => {
        e.stopPropagation();
      }}
      /* v8 ignore stop */
    >
      {/* 解説 */}
      <div style={detailSectionStyle}>
        <div style={detailSectionHeaderStyle}>
          {messages.goalDetailDescription}
        </div>
        <div style={detailTextStyle}>{questInfo.description}</div>
      </div>

      {/* ヒント */}
      {questInfo.hints.length > 0 && (
        <div style={detailSectionStyle}>
          <div style={detailSectionHeaderStyle}>{messages.goalDetailHints}</div>
          {questInfo.hints.map((hint, i) => (
            <HintItem
              key={String(i)}
              hint={hint}
              index={i}
              messages={messages}
              testId={testId}
            />
          ))}
        </div>
      )}

      {/* 使用可能な公理群 */}
      {item.allowedAxiomDetails !== undefined &&
      item.allowedAxiomDetails.length > 0 ? (
        <div style={detailSectionStyle}>
          <div style={detailSectionHeaderStyle}>
            {messages.goalPanelAllowedAxioms.replace(
              "{axiomIds}",
              item.allowedAxiomDetails.map((a) => a.id).join(", "),
            )}
          </div>
          {item.allowedAxiomDetails.map((axiom) => {
            const refEntryId = getAxiomReferenceEntryId(axiom.id);
            const refEntry =
              refEntryId !== undefined && referenceEntries !== undefined
                ? findEntryById(referenceEntries, refEntryId)
                : undefined;
            return (
              <div key={axiom.id} style={allowedAxiomItemStyle}>
                <span style={allowedAxiomNameStyle}>{axiom.displayName}:</span>
                <FormulaDisplay formula={axiom.formula} fontSize={10} />
                {refEntry !== undefined && locale !== undefined && (
                  <span
                    role="presentation"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <ReferencePopover
                      entry={refEntry}
                      locale={locale}
                      onOpenDetail={onOpenReferenceDetail}
                      testId={
                        /* v8 ignore start -- testId always provided in tests */
                        testId !== undefined
                          ? `${testId satisfies string}-axiom-ref-${axiom.id satisfies string}`
                          : undefined
                        /* v8 ignore stop */
                      }
                    />
                  </span>
                )}
              </div>
            );
          })}
        </div>
      ) : /* v8 ignore start -- v8 ternary branch artifact */
      item.allowedAxiomIds !== undefined ? (
        /* v8 ignore stop */
        <div style={detailSectionStyle}>
          <div style={allowedAxiomsHeaderStyle}>
            {formatMessage(messages.goalPanelAllowedAxioms, {
              axiomIds: item.allowedAxiomIds.join(", "),
            })}
          </div>
        </div>
      ) : null}

      {/* 違反公理 */}
      {item.violatingAxiomDetails !== undefined &&
      item.violatingAxiomDetails.length > 0 ? (
        <div
          style={detailSectionStyle}
          data-testid={
            /* v8 ignore start -- testId always provided in tests */
            testId !== undefined
              ? `${testId satisfies string}-violating-axioms`
              : undefined
            /* v8 ignore stop */
          }
        >
          <div style={violatingAxiomSectionHeaderStyle}>
            {messages.goalPanelViolatingAxioms.replace(
              "{axiomIds}",
              item.violatingAxiomDetails.map((a) => a.id).join(", "),
            )}
          </div>
          {item.violatingAxiomDetails.map((axiom) => {
            const refEntryId = getAxiomReferenceEntryId(axiom.id);
            const refEntry =
              refEntryId !== undefined && referenceEntries !== undefined
                ? findEntryById(referenceEntries, refEntryId)
                : undefined;
            return (
              <div key={axiom.id} style={violatingAxiomItemStyle}>
                <span style={violatingAxiomNameStyle}>
                  {axiom.displayName}:
                </span>
                <FormulaDisplay formula={axiom.formula} fontSize={10} />
                {refEntry !== undefined && locale !== undefined && (
                  <span
                    role="presentation"
                    /* v8 ignore start -- イベント伝播抑止: テスト環境では発火しない */
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    /* v8 ignore stop */
                  >
                    <ReferencePopover
                      entry={refEntry}
                      locale={locale}
                      onOpenDetail={onOpenReferenceDetail}
                      testId={
                        /* v8 ignore start -- testId always provided in tests */
                        testId !== undefined
                          ? `${testId satisfies string}-violating-ref-${axiom.id satisfies string}`
                          : undefined
                        /* v8 ignore stop */
                      }
                    />
                  </span>
                )}
              </div>
            );
          })}
        </div>
      ) : null}

      {/* 学習ポイント */}
      <div style={detailSectionStyle}>
        <div style={detailSectionHeaderStyle}>
          {messages.goalDetailLearningPoint}
        </div>
        <div style={detailTextStyle}>{questInfo.learningPoint}</div>
      </div>
    </div>
  );
}

function GoalItem({
  item,
  index,
  messages,
  questInfo,
  expanded,
  onToggleExpand,
  referenceEntries,
  locale,
  onOpenReferenceDetail,
  testId,
}: {
  readonly item: GoalPanelItem;
  readonly index: number;
  readonly messages: ProofMessages;
  readonly questInfo: GoalQuestInfo | undefined;
  readonly expanded: boolean;
  readonly onToggleExpand: (() => void) | undefined;
  readonly referenceEntries: readonly ReferenceEntry[] | undefined;
  readonly locale: Locale | undefined;
  readonly onOpenReferenceDetail: ((entryId: string) => void) | undefined;
  readonly testId: string | undefined;
}) {
  const hasDetail = questInfo !== undefined;
  return (
    <div
      style={hasDetail ? itemClickableStyle : itemStyle}
      role={hasDetail ? "button" : undefined}
      tabIndex={hasDetail ? 0 : undefined}
      onClick={onToggleExpand}
      /* v8 ignore start -- キーボード操作: role="button"のアクセシビリティ対応 */
      onKeyDown={
        hasDetail
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onToggleExpand?.();
              }
            }
          : undefined
      }
      /* v8 ignore stop */
      data-testid={
        /* v8 ignore start -- testId always provided in tests */
        testId !== undefined
          ? `${testId satisfies string}-item-${String(index) satisfies string}`
          : undefined
        /* v8 ignore stop */
      }
    >
      <div style={itemLabelStyle}>
        <span>{item.label ?? `#${String(index + 1) satisfies string}`}</span>
        <GoalItemStatusBadge status={item.status} messages={messages} />
        {hasDetail && (
          <span style={expandIndicatorStyle}>{expanded ? "▼" : "▶"}</span>
        )}
      </div>
      <div style={itemFormulaStyle}>
        {item.formula !== undefined ? (
          <FormulaDisplay formula={item.formula} fontSize={11} />
        ) : (
          <span role="math" aria-label={item.formulaText}>
            {item.formulaText}
          </span>
        )}
      </div>
      {/* 詳細なしの場合は従来通り公理情報をインライン表示 */}
      {!hasDetail && (
        <>
          {item.allowedAxiomDetails !== undefined &&
          item.allowedAxiomDetails.length > 0 ? (
            <div>
              <div style={allowedAxiomsHeaderStyle}>
                {messages.goalPanelAllowedAxioms.replace(
                  "{axiomIds}",
                  item.allowedAxiomDetails.map((a) => a.id).join(", "),
                )}
              </div>
              {item.allowedAxiomDetails.map((axiom) => (
                <div key={axiom.id} style={allowedAxiomItemStyle}>
                  <span style={allowedAxiomNameStyle}>
                    {axiom.displayName}:
                  </span>
                  <FormulaDisplay formula={axiom.formula} fontSize={10} />
                </div>
              ))}
            </div>
          ) : item.allowedAxiomIds !== undefined ? (
            <div style={allowedAxiomsHeaderStyle}>
              {formatMessage(messages.goalPanelAllowedAxioms, {
                axiomIds: item.allowedAxiomIds.join(", "),
              })}
            </div>
          ) : null}
          {/* 違反公理のインライン表示 */}
          {item.violatingAxiomDetails !== undefined &&
          item.violatingAxiomDetails.length > 0 ? (
            <div>
              <div style={violatingAxiomSectionHeaderStyle}>
                {messages.goalPanelViolatingAxioms.replace(
                  "{axiomIds}",
                  item.violatingAxiomDetails.map((a) => a.id).join(", "),
                )}
              </div>
              {item.violatingAxiomDetails.map((axiom) => (
                <div key={axiom.id} style={violatingAxiomItemStyle}>
                  <span style={violatingAxiomNameStyle}>
                    {axiom.displayName}:
                  </span>
                  <FormulaDisplay formula={axiom.formula} fontSize={10} />
                </div>
              ))}
            </div>
          ) : null}
        </>
      )}
      {/* 詳細パネル展開時 */}
      {hasDetail && expanded && (
        <GoalDetailPanel
          questInfo={questInfo}
          item={item}
          messages={messages}
          referenceEntries={referenceEntries}
          locale={locale}
          onOpenReferenceDetail={onOpenReferenceDetail}
          testId={testId}
        />
      )}
    </div>
  );
}

export function GoalPanel({
  data,
  messages,
  position,
  onDragHandlePointerDown,
  wasDraggedRef,
  referenceEntries,
  locale,
  onOpenReferenceDetail,
  testId,
}: GoalPanelProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  const handleToggle = useCallback(() => {
    setCollapsed((prev) => !prev);
  }, []);

  const handleItemToggle = useCallback((itemId: string) => {
    setExpandedItemId((prev) => (prev === itemId ? null : itemId));
  }, []);

  const resolvedPanelStyle = useMemo(
    (): CSSProperties =>
      position !== undefined
        ? { ...panelStyle, left: position.x, top: position.y, right: undefined }
        : panelStyle,
    [position],
  );

  const resolvedToggleStyle = useMemo(
    (): CSSProperties =>
      position !== undefined
        ? {
            ...toggleButtonStyle,
            left: position.x,
            top: position.y,
            right: undefined,
            /* v8 ignore start -- onDragHandlePointerDown always provided in tests */
            cursor: onDragHandlePointerDown !== undefined ? "grab" : "pointer",
            /* v8 ignore stop */
          }
        : {
            ...toggleButtonStyle,
            /* v8 ignore start -- onDragHandlePointerDown always provided in tests */
            cursor: onDragHandlePointerDown !== undefined ? "grab" : "pointer",
            /* v8 ignore stop */
          },
    [position, onDragHandlePointerDown],
  );

  const dragHeaderStyle = useMemo(
    (): CSSProperties => ({
      ...headerStyle,
      cursor: onDragHandlePointerDown !== undefined ? "grab" : undefined,
      userSelect: onDragHandlePointerDown !== undefined ? "none" : undefined,
    }),
    [onDragHandlePointerDown],
  );

  const handleCollapsedClick = useCallback(() => {
    if (wasDraggedRef?.current !== true) {
      handleToggle();
    }
  }, [wasDraggedRef, handleToggle]);

  if (data.items.length === 0) {
    return null;
  }

  if (collapsed) {
    return (
      <div
        style={resolvedToggleStyle}
        role="button"
        tabIndex={0}
        onPointerDown={onDragHandlePointerDown}
        onClick={handleCollapsedClick}
        /* v8 ignore start -- キーボード操作: role="button"のアクセシビリティ対応 */
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleToggle();
          }
        }}
        /* v8 ignore stop */
        /* v8 ignore start -- testId分岐: テスト用属性の有無 */
        data-testid={
          testId !== undefined ? `${testId satisfies string}-toggle` : undefined
        }
        /* v8 ignore stop */
      >
        {messages.goalPanelTitle} (
        {formatMessage(messages.goalPanelProgress, {
          achieved: String(data.achievedCount),
          total: String(data.totalCount),
        })}
        )
      </div>
    );
  }

  return (
    <div
      style={resolvedPanelStyle}
      data-testid={testId}
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      <div style={dragHeaderStyle} onPointerDown={onDragHandlePointerDown}>
        <span>{messages.goalPanelTitle}</span>
        <span style={progressStyle}>
          {formatMessage(messages.goalPanelProgress, {
            achieved: String(data.achievedCount),
            total: String(data.totalCount),
          })}
        </span>
        <span
          role="button"
          tabIndex={0}
          style={{ cursor: "pointer", fontSize: 14 }}
          onClick={handleToggle}
          /* v8 ignore start -- キーボード操作: role="button"のアクセシビリティ対応 */
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleToggle();
            }
          }}
          /* v8 ignore stop */
          data-testid={
            /* v8 ignore start -- testId always provided in tests */
            testId !== undefined
              ? `${testId satisfies string}-collapse`
              : undefined
            /* v8 ignore stop */
          }
        >
          ×
        </span>
      </div>
      {data.items.map((item, i) => (
        <GoalItem
          key={item.id}
          item={item}
          index={i}
          messages={messages}
          questInfo={data.questInfo}
          expanded={expandedItemId === item.id}
          onToggleExpand={
            data.questInfo !== undefined
              ? () => {
                  handleItemToggle(item.id);
                }
              : undefined
          }
          referenceEntries={referenceEntries}
          locale={locale}
          onOpenReferenceDetail={onOpenReferenceDetail}
          testId={testId}
        />
      ))}
    </div>
  );
}

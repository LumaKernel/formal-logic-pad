/**
 * ゴール一覧パネルコンポーネント。
 *
 * クエストモードのワークスペースで、証明すべきゴールの一覧と達成状況を表示する。
 * 右上にサイドパネル形式で表示される。
 *
 * 変更時は GoalPanel.test.tsx, ProofWorkspace.tsx, index.ts も同期すること。
 */

import { type CSSProperties, useState, useCallback } from "react";
import type { GoalPanelData, GoalPanelItem } from "./goalPanelLogic";
import type { ProofMessages } from "./proofMessages";
import { formatMessage } from "./proofMessages";
import { FormulaDisplay } from "../formula-input/FormulaDisplay";

// --- Props ---

export interface GoalPanelProps {
  /** ゴールパネルデータ */
  readonly data: GoalPanelData;
  /** メッセージ（i18n） */
  readonly messages: ProofMessages;
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

// --- コンポーネント ---

function GoalItemStatusBadge({
  status,
  messages,
}: {
  readonly status: GoalPanelItem["status"];
  readonly messages: ProofMessages;
}) {
  switch (status) {
    case "achieved":
      return <span style={statusAchievedStyle}>{messages.goalProved}</span>;
    case "not-achieved":
      return <span style={statusNotAchievedStyle}>{messages.goalNotYet}</span>;
    case "parse-error":
      return (
        <span style={statusParseErrorStyle}>{messages.goalInvalidFormula}</span>
      );
  }
}

function GoalItem({
  item,
  index,
  messages,
  testId,
}: {
  readonly item: GoalPanelItem;
  readonly index: number;
  readonly messages: ProofMessages;
  readonly testId: string | undefined;
}) {
  return (
    <div
      style={itemStyle}
      data-testid={
        testId !== undefined
          ? `${testId satisfies string}-item-${String(index) satisfies string}`
          : undefined
      }
    >
      <div style={itemLabelStyle}>
        <span>{item.label ?? `#${String(index + 1) satisfies string}`}</span>
        <GoalItemStatusBadge status={item.status} messages={messages} />
      </div>
      <div style={itemFormulaStyle}>
        {item.formula !== undefined ? (
          <FormulaDisplay formula={item.formula} fontSize={11} />
        ) : (
          item.formulaText
        )}
      </div>
      {item.allowedAxiomDetails !== undefined &&
      item.allowedAxiomDetails.length > 0 ? (
        <div>
          <div style={allowedAxiomsHeaderStyle}>
            {messages.goalPanelAllowedAxioms.replace(
              "{axiomIds}",
              item.allowedAxiomDetails
                .map((a) => a.id)
                .join(", "),
            )}
          </div>
          {item.allowedAxiomDetails.map((axiom) => (
            <div key={axiom.id} style={allowedAxiomItemStyle}>
              <span style={allowedAxiomNameStyle}>{axiom.displayName}:</span>
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
    </div>
  );
}

export function GoalPanel({ data, messages, testId }: GoalPanelProps) {
  const [collapsed, setCollapsed] = useState(false);

  const handleToggle = useCallback(() => {
    setCollapsed((prev) => !prev);
  }, []);

  if (data.items.length === 0) {
    return null;
  }

  if (collapsed) {
    return (
      <div
        style={toggleButtonStyle}
        role="button"
        tabIndex={0}
        onClick={handleToggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleToggle();
          }
        }}
        data-testid={
          testId !== undefined ? `${testId satisfies string}-toggle` : undefined
        }
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
      style={panelStyle}
      data-testid={testId}
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      <div style={headerStyle}>
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
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleToggle();
            }
          }}
          data-testid={
            testId !== undefined
              ? `${testId satisfies string}-collapse`
              : undefined
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
          testId={testId}
        />
      ))}
    </div>
  );
}

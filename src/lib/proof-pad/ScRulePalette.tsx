/**
 * シーケント計算規則パレットコンポーネント。
 *
 * 利用可能なシーケント計算（SC）推論規則一覧を表示する。
 * TabRulePaletteに準じたUIで、公理・構造規則・論理規則を一覧表示。
 *
 * SCではシーケント（Γ ⊢ Δ）をルートとして配置し、
 * 推論規則でツリーを上方向に伸ばしていく。
 * このパレットでは:
 * - 「シーケントを追加」ボタン: 空のシーケントノードをワークスペースに追加
 * - 推論規則一覧: 利用可能な規則の参照用表示（分岐規則は視覚的に区別）
 *
 * 変更時は ScRulePalette.test.tsx, ProofWorkspace.tsx, index.ts も同期すること。
 */

import { type CSSProperties, useCallback, useMemo } from "react";
import type { ScRulePaletteItem } from "./axiomPaletteLogic";
import type { ScRuleId } from "../logic-core/deductionSystem";
import { useProofMessages } from "./ProofMessagesContext";

// --- Props ---

export interface ScRulePaletteProps {
  /** 利用可能な推論規則リスト */
  readonly rules: readonly ScRulePaletteItem[];
  /** シーケントノード追加時のコールバック */
  readonly onAddSequent: () => void;
  /** 規則クリック時のコールバック */
  readonly onRuleClick?: (ruleId: ScRuleId) => void;
  /** 現在選択中の規則ID */
  readonly selectedRuleId?: ScRuleId;
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

const addButtonStyle: CSSProperties = {
  padding: "8px 12px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: 6,
  transition: "background 0.15s",
  borderBottom:
    "1px solid var(--color-panel-rule-line, rgba(180, 160, 130, 0.15))",
  fontWeight: 600,
  fontSize: 12,
  color: "var(--color-text-primary, #333)",
};

const addButtonHoverBg =
  "var(--color-paper-button-hover-bg, rgba(245, 240, 230, 0.95))";

const sectionHeaderStyle: CSSProperties = {
  padding: "8px 12px 4px",
  fontWeight: 700,
  fontSize: 10,
  textTransform: "uppercase",
  letterSpacing: 0.8,
  color: "var(--color-text-secondary, #888)",
};

const ruleItemStyle: CSSProperties = {
  padding: "4px 12px",
  display: "flex",
  alignItems: "center",
  gap: 4,
  fontSize: 11,
  color: "var(--color-text-secondary, #666)",
  cursor: "pointer",
  transition: "background 0.15s",
};

const ruleItemSelectedStyle: CSSProperties = {
  ...ruleItemStyle,
  background: "var(--color-tab-rule-selected-bg, rgba(90, 140, 200, 0.15))",
  color: "var(--color-text-primary, #333)",
  fontWeight: 600,
};

const ruleItemHoverBg =
  "var(--color-paper-button-hover-bg, rgba(245, 240, 230, 0.95))";

const branchingBadgeStyle: CSSProperties = {
  fontSize: 9,
  padding: "1px 4px",
  borderRadius: 3,
  background: "var(--color-badge-branching-bg, rgba(200, 160, 60, 0.15))",
  color: "var(--color-badge-branching-text, #8a6d20)",
  fontWeight: 600,
};

// --- コンポーネント ---

function ScRuleItemView({
  rule,
  testId,
  isSelected,
  onClick,
}: {
  readonly rule: ScRulePaletteItem;
  readonly testId?: string;
  readonly isSelected: boolean;
  readonly onClick?: () => void;
}) {
  return (
    <div
      data-testid={testId}
      style={isSelected ? ruleItemSelectedStyle : ruleItemStyle}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (!isSelected) {
          Object.assign(e.currentTarget.style, {
            background: ruleItemHoverBg,
          });
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          Object.assign(e.currentTarget.style, { background: "" });
        }
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        /* v8 ignore start -- キーボード操作: テストカバー済みだがv8集約で未計上 */
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
        /* v8 ignore stop */
      }}
    >
      <span>{rule.displayName}</span>
      {rule.isBranching && <span style={branchingBadgeStyle}>分岐</span>}
    </div>
  );
}

export function ScRulePalette({
  rules,
  onAddSequent,
  onRuleClick,
  selectedRuleId,
  testId,
}: ScRulePaletteProps) {
  const msg = useProofMessages();
  const handleAddClick = useCallback(() => {
    onAddSequent();
  }, [onAddSequent]);

  const ruleItems = useMemo(
    () =>
      rules.map((rule) => (
        <ScRuleItemView
          key={rule.id}
          rule={rule}
          isSelected={selectedRuleId === rule.id}
          onClick={onRuleClick ? () => onRuleClick(rule.id) : undefined}
          testId={
            testId
              ? `${testId satisfies string}-rule-${rule.id satisfies string}`
              : undefined
          }
        />
      )),
    [rules, testId, onRuleClick, selectedRuleId],
  );

  if (rules.length === 0) {
    return null;
  }

  return (
    <div data-testid={testId} style={panelStyle}>
      <div style={headerStyle}>{msg.scPaletteHeader}</div>
      <div
        data-testid={
          testId ? `${testId satisfies string}-add-sequent` : undefined
        }
        style={addButtonStyle}
        onClick={handleAddClick}
        onMouseEnter={(e) => {
          Object.assign(e.currentTarget.style, {
            background: addButtonHoverBg,
          });
        }}
        onMouseLeave={(e) => {
          Object.assign(e.currentTarget.style, { background: "" });
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          /* v8 ignore start -- キーボード操作: テストカバー済みだがv8集約で未計上 */
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onAddSequent();
          }
          /* v8 ignore stop */
        }}
      >
        {msg.scAddSequent}
      </div>
      <div style={sectionHeaderStyle}>{msg.scRulesSection}</div>
      {ruleItems}
    </div>
  );
}

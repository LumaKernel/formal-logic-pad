/**
 * 自然演繹推論規則パレットコンポーネント。
 *
 * 利用可能なND推論規則一覧を表示する。
 * Hilbert流の AxiomPalette に相当する、自然演繹用のサイドパネル。
 *
 * NDでは公理を追加するのではなく、「仮定」をノードとして追加し、
 * 推論規則でそれらを結合していく。
 * このパレットでは:
 * - 「仮定を追加」ボタン: 空の仮定ノードをワークスペースに追加
 * - 推論規則一覧: 利用可能な規則の参照用表示（ND-004で規則適用UIと統合予定）
 *
 * 変更時は NdRulePalette.test.tsx, ProofWorkspace.tsx, index.ts も同期すること。
 */

import { type CSSProperties, useCallback, useMemo } from "react";
import type { NdRulePaletteItem } from "./axiomPaletteLogic";
import type { NdRuleId } from "../logic-core/deductionSystem";
import { useProofMessages } from "./ProofMessagesContext";

// --- Props ---

export interface NdRulePaletteProps {
  /** 利用可能な推論規則リスト */
  readonly rules: readonly NdRulePaletteItem[];
  /** 仮定追加時のコールバック */
  readonly onAddAssumption: () => void;
  /** 推論規則選択時のコールバック（将来のND-004で利用） */
  readonly onSelectRule?: (ruleId: NdRuleId) => void;
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
};

// --- コンポーネント ---

function NdRuleItemView({
  rule,
  testId,
}: {
  readonly rule: NdRulePaletteItem;
  readonly testId?: string;
}) {
  return (
    <div data-testid={testId} style={ruleItemStyle}>
      <span>{rule.displayName}</span>
    </div>
  );
}

export function NdRulePalette({
  rules,
  onAddAssumption,
  testId,
}: NdRulePaletteProps) {
  const msg = useProofMessages();
  const handleAddClick = useCallback(() => {
    onAddAssumption();
  }, [onAddAssumption]);

  const ruleItems = useMemo(
    () =>
      rules.map((rule) => (
        <NdRuleItemView
          key={rule.id}
          rule={rule}
          testId={
            testId
              ? `${testId satisfies string}-rule-${rule.id satisfies string}`
              : undefined
          }
        />
      )),
    [rules, testId],
  );

  if (rules.length === 0) {
    return null;
  }

  return (
    <div data-testid={testId} style={panelStyle}>
      <div style={headerStyle}>{msg.ndPaletteHeader}</div>
      <div
        data-testid={
          testId ? `${testId satisfies string}-add-assumption` : undefined
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
            onAddAssumption();
          }
          /* v8 ignore stop */
        }}
      >
        {msg.ndAddAssumption}
      </div>
      <div style={sectionHeaderStyle}>{msg.ndRulesSection}</div>
      {ruleItems}
    </div>
  );
}

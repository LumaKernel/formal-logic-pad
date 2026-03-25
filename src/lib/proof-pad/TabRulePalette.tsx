/**
 * タブロー規則パレットコンポーネント。
 *
 * 利用可能なTAB推論規則一覧を表示する。
 * 自然演繹の NdRulePalette に相当する、タブロー式シーケント計算用のサイドパネル。
 *
 * TABではシーケント（Γ ⇒）をルートとして配置し、
 * 推論規則でツリーを上方向に伸ばしていく。
 * このパレットでは:
 * - 「シーケントを追加」ボタン: 空のシーケントノードをワークスペースに追加
 * - 推論規則一覧: 利用可能な規則の参照用表示（分岐規則は視覚的に区別）
 *
 * 変更時は TabRulePalette.test.tsx, ProofWorkspace.tsx, index.ts も同期すること。
 */

import { type CSSProperties, useCallback, useMemo } from "react";
import type { TabRulePaletteItem } from "./axiomPaletteLogic";
import type { TabRuleId } from "../logic-core/tableauCalculus";
import type { ReferenceEntry, Locale } from "../reference/referenceEntry";
import { findEntryById } from "../reference/referenceEntry";
import { ReferencePopover } from "../reference/ReferencePopover";
import { getTabRuleReferenceEntryId } from "./tabRuleReferenceLogic";
import { useProofMessages } from "./ProofMessagesContext";

// --- Props ---

export interface TabRulePaletteProps {
  /** 利用可能な推論規則リスト */
  readonly rules: readonly TabRulePaletteItem[];
  /** シーケントノード追加時のコールバック */
  readonly onAddSequent: () => void;
  /** 規則クリック時のコールバック */
  readonly onRuleClick?: (ruleId: TabRuleId) => void;
  /** 現在選択中の規則ID */
  readonly selectedRuleId?: TabRuleId;
  /** リファレンスエントリ一覧（省略時はリファレンスポップオーバー非表示） */
  readonly referenceEntries?: readonly ReferenceEntry[];
  /** ロケール（リファレンス表示用） */
  readonly locale?: Locale;
  /** リファレンス詳細モーダルを開くコールバック */
  readonly onOpenReferenceDetail?: (entryId: string) => void;
  /** data-testid */
  readonly testId?: string;
}

// --- スタイル ---

const panelStyle: Readonly<CSSProperties> = {
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
  overflowY: "auto",
  minWidth: 200,
  pointerEvents: "auto",
};

const headerStyleConst: Readonly<CSSProperties> = {
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

const addButtonStyle: Readonly<CSSProperties> = {
  padding: "8px 12px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: 6,
  transitionProperty: "background",
  transitionDuration: "150ms",
  borderBottom:
    "1px solid var(--color-panel-rule-line, rgba(180, 160, 130, 0.15))",
  fontWeight: 600,
  fontSize: 12,
  color: "var(--color-text-primary, #333)",
};

const addButtonHoverBg =
  "var(--color-paper-button-hover-bg, rgba(245, 240, 230, 0.95))";

const sectionHeaderStyle: Readonly<CSSProperties> = {
  padding: "8px 12px 4px",
  fontWeight: 700,
  fontSize: 10,
  textTransform: "uppercase",
  letterSpacing: 0.8,
  color: "var(--color-text-secondary, #666)",
};

const ruleItemStyle: Readonly<CSSProperties> = {
  padding: "4px 12px",
  display: "flex",
  alignItems: "center",
  gap: 4,
  fontSize: 11,
  color: "var(--color-text-secondary, #666)",
  cursor: "pointer",
  transitionProperty: "background",
  transitionDuration: "150ms",
};

const ruleItemSelectedStyle: Readonly<CSSProperties> = {
  ...ruleItemStyle,
  background: "var(--color-tab-rule-selected-bg, rgba(90, 140, 200, 0.15))",
  color: "var(--color-text-primary, #333)",
  fontWeight: 600,
};

const ruleItemHoverBg =
  "var(--color-paper-button-hover-bg, rgba(245, 240, 230, 0.95))";

const branchingBadgeStyle: Readonly<CSSProperties> = {
  fontSize: 9,
  padding: "1px 4px",
  borderRadius: 2,
  background: "var(--color-badge-branching-bg, rgba(200, 160, 60, 0.15))",
  color: "var(--color-badge-branching-text, #755a16)",
  fontWeight: 600,
};

// --- コンポーネント ---

const ruleItemLabelRowStyle: Readonly<CSSProperties> = {
  display: "flex",
  alignItems: "center",
  gap: 4,
  flex: 1,
};

function TabRuleItemView({
  rule,
  testId,
  isSelected,
  onClick,
  referenceEntry,
  locale,
  onOpenReferenceDetail,
}: {
  readonly rule: TabRulePaletteItem;
  readonly testId?: string;
  readonly isSelected: boolean;
  readonly onClick?: () => void;
  readonly referenceEntry?: ReferenceEntry;
  readonly locale?: Locale;
  readonly onOpenReferenceDetail?: (entryId: string) => void;
}) {
  const handlePopoverClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

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
      <span style={ruleItemLabelRowStyle}>
        <span>{rule.displayName}</span>
        {rule.isBranching && <span style={branchingBadgeStyle}>分岐</span>}
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
    </div>
  );
}

export function TabRulePalette({
  rules,
  onAddSequent,
  onRuleClick,
  selectedRuleId,
  referenceEntries,
  locale,
  onOpenReferenceDetail,
  testId,
}: TabRulePaletteProps) {
  const msg = useProofMessages();
  const handleAddClick = useCallback(() => {
    onAddSequent();
  }, [onAddSequent]);

  const ruleItems = useMemo(
    () =>
      rules.map((rule) => {
        const refEntryId = getTabRuleReferenceEntryId(rule.id);
        const refEntry =
          refEntryId !== undefined && referenceEntries !== undefined
            ? findEntryById(referenceEntries, refEntryId)
            : undefined;
        return (
          <TabRuleItemView
            key={rule.id}
            rule={rule}
            isSelected={selectedRuleId === rule.id}
            onClick={onRuleClick ? () => onRuleClick(rule.id) : undefined}
            referenceEntry={refEntry}
            locale={locale}
            onOpenReferenceDetail={onOpenReferenceDetail}
            testId={
              testId
                ? `${testId satisfies string}-rule-${rule.id satisfies string}`
                : undefined
            }
          />
        );
      }),
    [
      rules,
      testId,
      onRuleClick,
      selectedRuleId,
      referenceEntries,
      locale,
      onOpenReferenceDetail,
    ],
  );

  if (rules.length === 0) {
    return null;
  }

  return (
    <div data-testid={testId} style={panelStyle}>
      <div style={headerStyleConst}>{msg.tabPaletteHeader}</div>
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
        {msg.tabAddSequent}
      </div>
      <div style={sectionHeaderStyle}>{msg.tabRulesSection}</div>
      {ruleItems}
    </div>
  );
}

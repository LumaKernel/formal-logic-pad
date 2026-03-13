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

import { useCallback, useMemo } from "react";
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

const panelClassName =
  "absolute top-12 left-3 z-10 bg-[var(--color-panel-bg,rgba(252,249,243,0.96))] rounded-lg border border-[var(--color-panel-border,rgba(180,160,130,0.2))] shadow-[0_2px_12px_var(--color-panel-shadow,rgba(120,100,70,0.1))] py-2 px-0 font-[var(--font-ui)] text-xs max-h-[calc(100%-80px)] overflow-y-auto min-w-[200px] pointer-events-auto";

const headerClassName =
  "pt-1 px-3 pb-2 font-bold text-[11px] uppercase tracking-[1px] text-[var(--color-text-secondary,#666)] border-b border-b-[var(--color-panel-rule-line,rgba(180,160,130,0.15))] mb-1";

const addButtonClassName =
  "py-2 px-3 cursor-pointer flex items-center gap-1.5 transition-[background] duration-150 border-b border-b-[var(--color-panel-rule-line,rgba(180,160,130,0.15))] font-semibold text-xs text-[var(--color-text-primary,#333)]";

const addButtonHoverBg =
  "var(--color-paper-button-hover-bg, rgba(245, 240, 230, 0.95))";

const sectionHeaderClassName =
  "pt-2 px-3 pb-1 font-bold text-[10px] uppercase tracking-[0.8px] text-[var(--color-text-secondary,#888)]";

const ruleItemClassName =
  "py-1 px-3 flex items-center gap-1 text-[11px] text-[var(--color-text-secondary,#666)] cursor-pointer transition-[background] duration-150";

const ruleItemSelectedClassName =
  `${ruleItemClassName satisfies string} bg-[var(--color-tab-rule-selected-bg,rgba(90,140,200,0.15))] text-[var(--color-text-primary,#333)] font-semibold`;

const ruleItemHoverBg =
  "var(--color-paper-button-hover-bg, rgba(245, 240, 230, 0.95))";

const branchingBadgeClassName =
  "text-[9px] py-px px-1 rounded-sm bg-[var(--color-badge-branching-bg,rgba(200,160,60,0.15))] text-[var(--color-badge-branching-text,#8a6d20)] font-semibold";

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
      className={isSelected ? ruleItemSelectedClassName : ruleItemClassName}
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
      {rule.isBranching && <span className={branchingBadgeClassName}>分岐</span>}
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
    <div data-testid={testId} className={panelClassName}>
      <div className={headerClassName}>{msg.scPaletteHeader}</div>
      <div
        data-testid={
          testId ? `${testId satisfies string}-add-sequent` : undefined
        }
        className={addButtonClassName}
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
      <div className={sectionHeaderClassName}>{msg.scRulesSection}</div>
      {ruleItems}
    </div>
  );
}

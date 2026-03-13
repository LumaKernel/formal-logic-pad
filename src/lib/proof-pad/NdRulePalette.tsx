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

import { useCallback, useMemo } from "react";
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
  "py-1 px-3 flex items-center gap-1 text-[11px] text-[var(--color-text-secondary,#666)]";

// --- コンポーネント ---

function NdRuleItemView({
  rule,
  testId,
}: {
  readonly rule: NdRulePaletteItem;
  readonly testId?: string;
}) {
  return (
    <div data-testid={testId} className={ruleItemClassName}>
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
    <div data-testid={testId} className={panelClassName}>
      <div className={headerClassName}>{msg.ndPaletteHeader}</div>
      <div
        data-testid={
          testId ? `${testId satisfies string}-add-assumption` : undefined
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
            onAddAssumption();
          }
          /* v8 ignore stop */
        }}
      >
        {msg.ndAddAssumption}
      </div>
      <div className={sectionHeaderClassName}>{msg.ndRulesSection}</div>
      {ruleItems}
    </div>
  );
}

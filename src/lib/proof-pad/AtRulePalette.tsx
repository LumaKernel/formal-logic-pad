/**
 * 分析的タブロー規則パレットコンポーネント。
 *
 * 利用可能なAT推論規則一覧を表示する。
 * TABの TabRulePalette に相当する、分析的タブロー用のサイドパネル。
 *
 * ATでは署名付き論理式（T:φ / F:φ）をノードとして配置し、
 * α/β/γ/δ規則で木を展開、closure で枝を閉じる。
 * このパレットでは:
 * - 「署名付き論理式を追加」ボタン: 空のATノードをワークスペースに追加
 * - 推論規則一覧: α/β/γ/δ/closure をグループ化して表示
 *
 * 変更時は AtRulePalette.test.tsx, ProofWorkspace.tsx, index.ts も同期すること。
 */

import { useCallback, useMemo } from "react";
import type { AtRulePaletteItem } from "./axiomPaletteLogic";
import type { AtRuleId } from "../logic-core/analyticTableau";
import {
  isAlphaRule,
  isBetaRule,
  isGammaRule,
  isDeltaRule,
} from "../logic-core/analyticTableau";
import { useProofMessages } from "./ProofMessagesContext";

// --- Props ---

export interface AtRulePaletteProps {
  /** 利用可能な推論規則リスト */
  readonly rules: readonly AtRulePaletteItem[];
  /** 署名付き論理式ノード追加時のコールバック */
  readonly onAddFormula: () => void;
  /** 規則クリック時のコールバック */
  readonly onRuleClick?: (ruleId: AtRuleId) => void;
  /** 現在選択中の規則ID */
  readonly selectedRuleId?: AtRuleId;
  /** data-testid */
  readonly testId?: string;
}

// --- スタイル ---

const panelClassName = [
  "absolute top-12 left-3 z-10",
  "bg-[var(--color-panel-bg,rgba(252,249,243,0.96))]",
  "rounded-lg",
  "border border-[var(--color-panel-border,rgba(180,160,130,0.2))]",
  "shadow-[0_2px_12px_var(--color-panel-shadow,rgba(120,100,70,0.1))]",
  "py-2 px-0",
  "font-[var(--font-ui)]",
  "text-xs",
  "max-h-[calc(100%-80px)]",
  "overflow-y-auto",
  "min-w-[200px]",
  "pointer-events-auto",
].join(" ");

const headerClassName = [
  "pt-1 px-3 pb-2",
  "font-bold",
  "text-[11px]",
  "uppercase",
  "tracking-[1px]",
  "text-[var(--color-text-secondary,#666)]",
  "border-b border-b-[var(--color-panel-rule-line,rgba(180,160,130,0.15))]",
  "mb-1",
].join(" ");

const addButtonClassName = [
  "py-2 px-3",
  "cursor-pointer",
  "flex items-center",
  "gap-1.5",
  "transition-[background] duration-150",
  "border-b border-b-[var(--color-panel-rule-line,rgba(180,160,130,0.15))]",
  "font-semibold",
  "text-xs",
  "text-[var(--color-text-primary,#333)]",
].join(" ");

const addButtonHoverBg =
  "var(--color-paper-button-hover-bg, rgba(245, 240, 230, 0.95))";

const sectionHeaderClassName = [
  "pt-2 px-3 pb-1",
  "font-bold",
  "text-[10px]",
  "uppercase",
  "tracking-[0.8px]",
  "text-[var(--color-text-secondary,#888)]",
].join(" ");

const ruleItemClassName = [
  "py-1 px-3",
  "flex items-center",
  "gap-1",
  "text-[11px]",
  "text-[var(--color-text-secondary,#666)]",
  "cursor-pointer",
  "transition-[background] duration-150",
].join(" ");

const ruleItemSelectedClassName = [
  "py-1 px-3",
  "flex items-center",
  "gap-1",
  "text-[11px]",
  "cursor-pointer",
  "transition-[background] duration-150",
  "bg-[var(--color-tab-rule-selected-bg,rgba(90,140,200,0.15))]",
  "text-[var(--color-text-primary,#333)]",
  "font-semibold",
].join(" ");

const ruleItemHoverBg =
  "var(--color-paper-button-hover-bg, rgba(245, 240, 230, 0.95))";

const branchingBadgeClassName = [
  "text-[9px]",
  "py-px px-1",
  "rounded-[3px]",
  "bg-[var(--color-badge-branching-bg,rgba(200,160,60,0.15))]",
  "text-[var(--color-badge-branching-text,#8a6d20)]",
  "font-semibold",
].join(" ");

// --- 規則カテゴリ判定 ---

function getRuleCategory(
  ruleId: AtRuleId,
): "alpha" | "beta" | "gamma-delta" | "closure" {
  if (isAlphaRule(ruleId)) return "alpha";
  if (isBetaRule(ruleId)) return "beta";
  if (isGammaRule(ruleId) || isDeltaRule(ruleId)) return "gamma-delta";
  // closure: fall-through (TypeScript narrowing + isClosureRule guarantee this is the only remaining case)
  return "closure";
}

// --- コンポーネント ---

function AtRuleItemView({
  rule,
  testId,
  isSelected,
  onClick,
}: {
  readonly rule: AtRulePaletteItem;
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
      /* v8 ignore start -- キーボード操作: role="button"のアクセシビリティ対応 */
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
      /* v8 ignore stop */
    >
      <span>{rule.displayName}</span>
      {rule.isBranching && <span className={branchingBadgeClassName}>分岐</span>}
    </div>
  );
}

export function AtRulePalette({
  rules,
  onAddFormula,
  onRuleClick,
  selectedRuleId,
  testId,
}: AtRulePaletteProps) {
  const msg = useProofMessages();
  const handleAddClick = useCallback(() => {
    onAddFormula();
  }, [onAddFormula]);

  // 規則をカテゴリ別にグルーピング
  const groupedRules = useMemo(() => {
    const alpha: AtRulePaletteItem[] = [];
    const beta: AtRulePaletteItem[] = [];
    const gammaDelta: AtRulePaletteItem[] = [];
    const closure: AtRulePaletteItem[] = [];
    for (const rule of rules) {
      const category = getRuleCategory(rule.id);
      if (category === "alpha") {
        alpha.push(rule);
      } else if (category === "beta") {
        beta.push(rule);
      } else if (category === "gamma-delta") {
        gammaDelta.push(rule);
      } else {
        // closure: fall-through (TypeScript narrowing guarantees this is the only remaining case)
        closure.push(rule);
      }
    }
    return { alpha, beta, gammaDelta, closure };
  }, [rules]);

  const renderRuleItems = useCallback(
    (items: readonly AtRulePaletteItem[]) =>
      items.map((rule) => (
        <AtRuleItemView
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
    [testId, onRuleClick, selectedRuleId],
  );

  if (rules.length === 0) {
    return null;
  }

  return (
    <div data-testid={testId} className={panelClassName}>
      <div className={headerClassName}>{msg.atPaletteHeader}</div>
      <div
        data-testid={
          testId ? `${testId satisfies string}-add-formula` : undefined
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
        /* v8 ignore start -- キーボード操作: role="button"のアクセシビリティ対応 */
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onAddFormula();
          }
        }}
        /* v8 ignore stop */
      >
        {msg.atAddFormula}
      </div>
      {groupedRules.alpha.length > 0 && (
        <>
          <div className={sectionHeaderClassName}>{msg.atAlphaRules}</div>
          {renderRuleItems(groupedRules.alpha)}
        </>
      )}
      {groupedRules.beta.length > 0 && (
        <>
          <div className={sectionHeaderClassName}>{msg.atBetaRules}</div>
          {renderRuleItems(groupedRules.beta)}
        </>
      )}
      {groupedRules.gammaDelta.length > 0 && (
        <>
          <div className={sectionHeaderClassName}>{msg.atGammaDeltaRules}</div>
          {renderRuleItems(groupedRules.gammaDelta)}
        </>
      )}
      {groupedRules.closure.length > 0 && (
        <>
          <div className={sectionHeaderClassName}>{msg.atClosureRules}</div>
          {renderRuleItems(groupedRules.closure)}
        </>
      )}
    </div>
  );
}

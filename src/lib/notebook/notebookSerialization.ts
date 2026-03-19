/**
 * ノートブックコレクションのシリアライズ/デシリアライズ（純粋ロジック）。
 *
 * LogicSystem の ReadonlySet<PropositionalAxiomId> は JSON 化できないため、
 * Array に変換して保存し、復元時に Set に戻す。
 *
 * DeductionSystem のスタイル（hilbert/natural-deduction/sequent-calculus/
 * tableau-calculus/analytic-tableau）を保存し、復元時に適切なファクトリ関数で
 * DeductionSystem を復元する。
 *
 * 変更時は notebookSerialization.test.ts も同期すること。
 */

import type {
  LogicSystem,
  PropositionalAxiomId,
} from "../logic-core/inferenceRule";
import type { DeductionSystem } from "../logic-core/deductionSystem";
import {
  hilbertDeduction,
  naturalDeduction,
  sequentCalculusDeduction,
  tableauCalculusDeduction,
  analyticTableauDeduction,
} from "../logic-core/deductionSystem";
import type { NdRuleId } from "../logic-core/deductionSystem";
import type { ScRuleId } from "../logic-core/deductionSystem";
import type { TabRuleId } from "../logic-core/tableauCalculus";
import type { AtRuleId } from "../logic-core/analyticTableau";
import { extractLogicSystem } from "../proof-pad/workspaceState";
import type { WorkspaceState } from "../proof-pad/workspaceState";
import type {
  Notebook,
  NotebookCollection,
  NotebookMeta,
} from "./notebookState";
import { createEmptyCollection } from "./notebookState";

// --- バリデーション ---

const VALID_AXIOM_IDS: ReadonlySet<string> = new Set([
  "A1",
  "A2",
  "A3",
  "M3",
  "EFQ",
  "DNE",
  "CONJ-DEF",
  "DISJ-DEF",
]);

function validateAxiomId(value: unknown): PropositionalAxiomId | undefined {
  if (typeof value === "string" && VALID_AXIOM_IDS.has(value)) {
    return value as PropositionalAxiomId;
  }
  return undefined;
}

/** 有効な自然演繹規則ID */
const VALID_ND_RULE_IDS: ReadonlySet<string> = new Set<NdRuleId>([
  "implication-intro",
  "implication-elim",
  "conjunction-intro",
  "conjunction-elim-left",
  "conjunction-elim-right",
  "disjunction-intro-left",
  "disjunction-intro-right",
  "disjunction-elim",
  "weakening",
  "efq",
  "dne",
  "universal-intro",
  "universal-elim",
  "existential-intro",
  "existential-elim",
]);

/** 有効なシーケント計算規則ID */
const VALID_SC_RULE_IDS: ReadonlySet<string> = new Set<ScRuleId>([
  "identity",
  "bottom-left",
  "cut",
  "weakening-left",
  "weakening-right",
  "contraction-left",
  "contraction-right",
  "exchange-left",
  "exchange-right",
  "implication-left",
  "implication-right",
  "conjunction-left",
  "conjunction-right",
  "disjunction-left",
  "disjunction-right",
  "universal-left",
  "universal-right",
  "negation-left",
  "negation-right",
  "existential-left",
  "existential-right",
]);

/** 有効なタブロー式シーケント計算規則ID */
const VALID_TAB_RULE_IDS: ReadonlySet<string> = new Set<TabRuleId>([
  "bs",
  "bottom",
  "exchange",
  "double-negation",
  "conjunction",
  "neg-conjunction",
  "disjunction",
  "neg-disjunction",
  "implication",
  "neg-implication",
  "universal",
  "neg-universal",
  "existential",
  "neg-existential",
]);

/** 有効な分析的タブロー規則ID */
const VALID_AT_RULE_IDS: ReadonlySet<string> = new Set<AtRuleId>([
  "alpha-conj",
  "alpha-neg-disj",
  "alpha-neg-impl",
  "alpha-double-neg-t",
  "alpha-double-neg-f",
  "alpha-neg-t",
  "alpha-neg-f",
  "beta-neg-conj",
  "beta-disj",
  "beta-impl",
  "gamma-univ",
  "gamma-neg-exist",
  "delta-exist",
  "delta-neg-univ",
  "closure",
]);

function parseLogicSystem(raw: unknown): LogicSystem | undefined {
  if (typeof raw !== "object" || raw === null) return undefined;
  const obj = raw as Record<string, unknown>;
  if (typeof obj["name"] !== "string") return undefined;
  if (!Array.isArray(obj["propositionalAxioms"])) return undefined;
  if (typeof obj["predicateLogic"] !== "boolean") return undefined;
  if (typeof obj["equalityLogic"] !== "boolean") return undefined;
  if (typeof obj["generalization"] !== "boolean") return undefined;

  const axiomIds: PropositionalAxiomId[] = [];
  for (const item of obj["propositionalAxioms"] as readonly unknown[]) {
    const validated = validateAxiomId(item);
    if (validated === undefined) return undefined;
    axiomIds.push(validated);
  }

  return {
    name: obj["name"],
    propositionalAxioms: new Set(axiomIds),
    predicateLogic: obj["predicateLogic"],
    equalityLogic: obj["equalityLogic"],
    generalization: obj["generalization"],
  };
}

/**
 * rules 配列をバリデーションしてSetに変換する汎用関数。
 * 全要素が validIds に含まれている場合のみ Set を返す。
 */
function parseRuleSet<T extends string>(
  raw: unknown,
  validIds: ReadonlySet<string>,
): ReadonlySet<T> | undefined {
  if (!Array.isArray(raw)) return undefined;
  const rules: T[] = [];
  for (const item of raw as readonly unknown[]) {
    if (typeof item !== "string" || !validIds.has(item)) return undefined;
    rules.push(item as T);
  }
  return new Set(rules);
}

/**
 * DeductionSystem をシリアライズ用のJSONオブジェクトに変換する。
 */
function serializeDeductionSystem(
  ds: DeductionSystem,
): Record<string, unknown> {
  if (ds.style === "hilbert") {
    return {
      style: "hilbert",
      system: {
        name: ds.system.name,
        propositionalAxioms: [...ds.system.propositionalAxioms],
        predicateLogic: ds.system.predicateLogic,
        equalityLogic: ds.system.equalityLogic,
        generalization: ds.system.generalization,
      },
    };
  }
  if (ds.style === "sequent-calculus") {
    return {
      style: ds.style,
      system: {
        name: ds.system.name,
        rules: [...ds.system.rules],
        ...(ds.system.maxSuccedentLength !== undefined
          ? { maxSuccedentLength: ds.system.maxSuccedentLength }
          : {}),
      },
    };
  }
  // natural-deduction, tableau-calculus, analytic-tableau は共通形式
  return {
    style: ds.style,
    system: {
      name: ds.system.name,
      rules: [...ds.system.rules],
    },
  };
}

/**
 * JSON オブジェクトから DeductionSystem を復元する。
 * style フィールドがない場合は undefined を返す（旧フォーマット）。
 */
function parseDeductionSystem(raw: unknown): DeductionSystem | undefined {
  if (typeof raw !== "object" || raw === null) return undefined;
  const obj = raw as Record<string, unknown>;
  const style = obj["style"];
  if (typeof style !== "string") return undefined;

  const systemRaw = obj["system"];
  if (typeof systemRaw !== "object" || systemRaw === null) return undefined;
  const systemObj = systemRaw as Record<string, unknown>;
  if (typeof systemObj["name"] !== "string") return undefined;

  if (style === "hilbert") {
    const system = parseLogicSystem(systemRaw);
    if (system === undefined) return undefined;
    return hilbertDeduction(system);
  }

  if (style === "natural-deduction") {
    const rules = parseRuleSet<NdRuleId>(systemObj["rules"], VALID_ND_RULE_IDS);
    if (rules === undefined) return undefined;
    return naturalDeduction({ name: systemObj["name"], rules });
  }

  if (style === "sequent-calculus") {
    const rules = parseRuleSet<ScRuleId>(systemObj["rules"], VALID_SC_RULE_IDS);
    if (rules === undefined) return undefined;
    const maxSuccedentLength =
      typeof systemObj["maxSuccedentLength"] === "number"
        ? systemObj["maxSuccedentLength"]
        : undefined;
    return sequentCalculusDeduction({
      name: systemObj["name"],
      rules,
      ...(maxSuccedentLength !== undefined ? { maxSuccedentLength } : {}),
    });
  }

  if (style === "tableau-calculus") {
    const rules = parseRuleSet<TabRuleId>(
      systemObj["rules"],
      VALID_TAB_RULE_IDS,
    );
    if (rules === undefined) return undefined;
    return tableauCalculusDeduction({ name: systemObj["name"], rules });
  }

  if (style === "analytic-tableau") {
    const rules = parseRuleSet<AtRuleId>(
      systemObj["rules"],
      VALID_AT_RULE_IDS,
    );
    if (rules === undefined) return undefined;
    return analyticTableauDeduction({ name: systemObj["name"], rules });
  }

  return undefined;
}

function parseNotebook(raw: unknown): Notebook | undefined {
  if (typeof raw !== "object" || raw === null) return undefined;
  const obj = raw as Record<string, unknown>;

  if (typeof obj["meta"] !== "object" || obj["meta"] === null) return undefined;
  if (typeof obj["workspace"] !== "object" || obj["workspace"] === null)
    return undefined;

  const workspace = obj["workspace"] as Record<string, unknown>;

  // deductionSystem の復元（新フォーマット優先、旧フォーマットはHilbertにfallback）
  const deductionSystem =
    parseDeductionSystem(workspace["deductionSystem"]) ??
    (() => {
      const system = parseLogicSystem(workspace["system"]);
      if (system === undefined) return undefined;
      return hilbertDeduction(system);
    })();
  if (deductionSystem === undefined) return undefined;

  const system = extractLogicSystem(deductionSystem);

  const meta = obj["meta"] as NotebookMeta;

  // questId は optional string（存在しない場合はundefined）
  const questId =
    typeof obj["questId"] === "string" ? obj["questId"] : undefined;

  // questVersion は optional number（旧フォーマットには存在しない）
  const questVersion =
    typeof obj["questVersion"] === "number" ? obj["questVersion"] : undefined;

  // inferenceEdges は旧フォーマットに存在しない場合がある（互換性のためデフォルト空配列）
  const inferenceEdges = Array.isArray(workspace["inferenceEdges"])
    ? (workspace["inferenceEdges"] as readonly unknown[])
    : [];

  const ws = {
    ...workspace,
    system,
    deductionSystem,
    inferenceEdges,
  } as WorkspaceState;

  if (questId !== undefined) {
    return {
      meta,
      workspace: ws,
      questId,
      ...(questVersion !== undefined ? { questVersion } : {}),
    };
  }
  return { meta, workspace: ws };
}

function parseCollection(raw: unknown): NotebookCollection | undefined {
  if (typeof raw !== "object" || raw === null) return undefined;
  const obj = raw as Record<string, unknown>;
  if (!Array.isArray(obj["notebooks"])) return undefined;
  if (typeof obj["nextId"] !== "number") return undefined;
  // 防御コード: JSON.parseでNaN/Infinityにはならないが、将来の入力ソース拡張に備える
  /* v8 ignore start */
  if (!Number.isFinite(obj["nextId"])) return undefined;
  /* v8 ignore stop */

  const notebooks: Notebook[] = [];
  for (const item of obj["notebooks"] as readonly unknown[]) {
    const parsed = parseNotebook(item);
    if (parsed !== undefined) {
      notebooks.push(parsed);
    }
  }

  return {
    notebooks,
    nextId: obj["nextId"],
  };
}

// --- シリアライズ ---

/** NotebookCollection を JSON 文字列にシリアライズする */
export function serializeCollection(collection: NotebookCollection): string {
  const serialized = {
    notebooks: collection.notebooks.map((n) => ({
      meta: n.meta,
      workspace: {
        ...n.workspace,
        // 旧 system フィールドは後方互換性のため残す（Hilbert体系のみ有効値）
        system: {
          name: n.workspace.system.name,
          propositionalAxioms: [...n.workspace.system.propositionalAxioms],
          predicateLogic: n.workspace.system.predicateLogic,
          equalityLogic: n.workspace.system.equalityLogic,
          generalization: n.workspace.system.generalization,
        },
        // 新フォーマット: deductionSystem を明示的に保存
        deductionSystem: serializeDeductionSystem(
          n.workspace.deductionSystem,
        ),
      },
      ...(n.questId !== undefined ? { questId: n.questId } : {}),
      ...(n.questVersion !== undefined ? { questVersion: n.questVersion } : {}),
    })),
    nextId: collection.nextId,
  };
  return JSON.stringify(serialized);
}

/** JSON 文字列から NotebookCollection をデシリアライズする。不正な入力の場合は空コレクションを返す */
export function deserializeCollection(json: string): NotebookCollection {
  try {
    const parsed: unknown = JSON.parse(json);
    return parseCollection(parsed) ?? createEmptyCollection();
  } catch {
    return createEmptyCollection();
  }
}

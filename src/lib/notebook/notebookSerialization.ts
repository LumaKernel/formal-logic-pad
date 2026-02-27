/**
 * ノートブックコレクションのシリアライズ/デシリアライズ（純粋ロジック）。
 *
 * LogicSystem の ReadonlySet<PropositionalAxiomId> は JSON 化できないため、
 * Array に変換して保存し、復元時に Set に戻す。
 *
 * 変更時は notebookSerialization.test.ts も同期すること。
 */

import type {
  LogicSystem,
  PropositionalAxiomId,
} from "../logic-core/inferenceRule";
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
]);

function validateAxiomId(value: unknown): PropositionalAxiomId | undefined {
  if (typeof value === "string" && VALID_AXIOM_IDS.has(value)) {
    return value as PropositionalAxiomId;
  }
  return undefined;
}

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

function parseNotebook(raw: unknown): Notebook | undefined {
  if (typeof raw !== "object" || raw === null) return undefined;
  const obj = raw as Record<string, unknown>;

  if (typeof obj["meta"] !== "object" || obj["meta"] === null) return undefined;
  if (typeof obj["workspace"] !== "object" || obj["workspace"] === null)
    return undefined;

  const workspace = obj["workspace"] as Record<string, unknown>;
  const system = parseLogicSystem(workspace["system"]);
  if (system === undefined) return undefined;

  const meta = obj["meta"] as NotebookMeta;

  // questId は optional string（存在しない場合はundefined）
  const questId =
    typeof obj["questId"] === "string" ? obj["questId"] : undefined;

  // inferenceEdges は旧フォーマットに存在しない場合がある（互換性のためデフォルト空配列）
  const inferenceEdges = Array.isArray(workspace["inferenceEdges"])
    ? (workspace["inferenceEdges"] as readonly unknown[])
    : [];

  return {
    meta,
    workspace: {
      ...workspace,
      system,
      inferenceEdges,
    } as WorkspaceState,
    ...(questId !== undefined ? { questId } : {}),
  };
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
        system: {
          name: n.workspace.system.name,
          propositionalAxioms: [...n.workspace.system.propositionalAxioms],
          predicateLogic: n.workspace.system.predicateLogic,
          equalityLogic: n.workspace.system.equalityLogic,
          generalization: n.workspace.system.generalization,
          // theoryAxioms は Formula テンプレートを含むためシリアライズしない。
          // 復元時はプリセットから体系名で theoryAxioms を取得する。
        },
      },
      ...(n.questId !== undefined ? { questId: n.questId } : {}),
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

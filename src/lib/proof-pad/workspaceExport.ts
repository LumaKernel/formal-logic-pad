/**
 * ワークスペースのJSON エクスポート/インポート（純粋ロジック）。
 *
 * WorkspaceState を JSON 文字列に変換してファイルエクスポートし、
 * JSON 文字列から WorkspaceState を復元する機能を提供する。
 *
 * LogicSystem の ReadonlySet<PropositionalAxiomId> は JSON 化できないため、
 * Array に変換して保存し、復元時に Set に戻す（notebookSerialization と同パターン）。
 *
 * 変更時は workspaceExport.test.ts, index.ts も同期すること。
 */

import type {
  LogicSystem,
  PropositionalAxiomId,
} from "../logic-core/inferenceRule";
import type {
  WorkspaceState,
  WorkspaceNode,
  WorkspaceConnection,
  WorkspaceMode,
  NodeProtection,
} from "./workspaceState";
import type { InferenceEdge } from "./inferenceEdge";
import type { SubstitutionEntry } from "./substitutionApplicationLogic";
import type { GreekLetter } from "../logic-core/greekLetters";
import type { ProofNodeKind } from "./proofNodeUI";
import type { NodeRole } from "./nodeRoleLogic";
import type { Point } from "../infinite-canvas/types";

// --- エクスポートデータ型 ---

/** エクスポートデータのトップレベル型 */
export type WorkspaceExportData = {
  readonly _tag: "ProofPadWorkspace";
  readonly version: 1;
  readonly workspace: SerializedWorkspaceState;
};

/** JSON化可能なWorkspaceState */
type SerializedWorkspaceState = {
  readonly system: SerializedLogicSystem;
  readonly nodes: readonly WorkspaceNode[];
  readonly connections: readonly WorkspaceConnection[];
  readonly inferenceEdges: readonly InferenceEdge[];
  readonly nextNodeId: number;
  readonly mode: WorkspaceMode;
};

/** JSON化可能なLogicSystem（Setの代わりにArray） */
type SerializedLogicSystem = {
  readonly name: string;
  readonly propositionalAxioms: readonly PropositionalAxiomId[];
  readonly predicateLogic: boolean;
  readonly equalityLogic: boolean;
  readonly generalization: boolean;
};

// --- バリデーション ---

const VALID_AXIOM_IDS: ReadonlySet<string> = new Set(["A1", "A2", "A3"]);
const VALID_KINDS: ReadonlySet<string> = new Set([
  "axiom",
  "derived",
  "conclusion",
]);

/**
 * レガシーノード種別をderivedに変換する。
 * 旧フォーマットの互換性のため、mp/gen/substitution をderivedとして読み込む。
 */
const LEGACY_KIND_MAP: ReadonlyMap<string, string> = new Map([
  ["mp", "derived"],
  ["gen", "derived"],
  ["substitution", "derived"],
]);
const VALID_MODES: ReadonlySet<string> = new Set(["free", "quest"]);
const VALID_ROLES: ReadonlySet<string> = new Set(["axiom", "goal"]);
const VALID_PROTECTIONS: ReadonlySet<string> = new Set(["quest-goal"]);
const VALID_EDGE_TAGS: ReadonlySet<string> = new Set([
  "mp",
  "gen",
  "substitution",
]);
const VALID_SUBSTITUTION_ENTRY_TAGS: ReadonlySet<string> = new Set([
  "FormulaSubstitution",
  "TermSubstitution",
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

function parsePoint(raw: unknown): Point | undefined {
  if (typeof raw !== "object" || raw === null) return undefined;
  const obj = raw as Record<string, unknown>;
  if (typeof obj["x"] !== "number" || typeof obj["y"] !== "number")
    return undefined;
  // 防御コード: JSON.parseでInfinity/NaNにはならないが、将来の入力ソース拡張に備える
  /* v8 ignore start */
  if (!Number.isFinite(obj["x"]) || !Number.isFinite(obj["y"]))
    return undefined;
  /* v8 ignore stop */
  return { x: obj["x"], y: obj["y"] };
}

function parseNode(raw: unknown): WorkspaceNode | undefined {
  if (typeof raw !== "object" || raw === null) return undefined;
  const obj = raw as Record<string, unknown>;

  if (typeof obj["id"] !== "string") return undefined;
  if (typeof obj["kind"] !== "string") return undefined;

  // レガシー種別の変換
  let kindStr = obj["kind"];
  const mapped = LEGACY_KIND_MAP.get(kindStr);
  if (mapped !== undefined) {
    kindStr = mapped;
  }
  if (!VALID_KINDS.has(kindStr)) return undefined;

  if (typeof obj["label"] !== "string") return undefined;
  if (typeof obj["formulaText"] !== "string") return undefined;

  const position = parsePoint(obj["position"]);
  if (position === undefined) return undefined;

  let result: WorkspaceNode = {
    id: obj["id"],
    kind: kindStr as ProofNodeKind,
    label: obj["label"],
    formulaText: obj["formulaText"],
    position,
  };

  // optional fields — 複数が同時に存在しうるので排他的にしない
  if (obj["genVariableName"] !== undefined) {
    if (typeof obj["genVariableName"] !== "string") return undefined;
    result = { ...result, genVariableName: obj["genVariableName"] };
  }

  if (obj["role"] !== undefined) {
    if (typeof obj["role"] !== "string" || !VALID_ROLES.has(obj["role"]))
      return undefined;
    result = { ...result, role: obj["role"] as NodeRole };
  }

  if (obj["protection"] !== undefined) {
    if (
      typeof obj["protection"] !== "string" ||
      !VALID_PROTECTIONS.has(obj["protection"])
    )
      return undefined;
    result = { ...result, protection: obj["protection"] as NodeProtection };
  }

  return result;
}

function parseConnection(raw: unknown): WorkspaceConnection | undefined {
  if (typeof raw !== "object" || raw === null) return undefined;
  const obj = raw as Record<string, unknown>;

  if (typeof obj["id"] !== "string") return undefined;
  if (typeof obj["fromNodeId"] !== "string") return undefined;
  if (typeof obj["fromPortId"] !== "string") return undefined;
  if (typeof obj["toNodeId"] !== "string") return undefined;
  if (typeof obj["toPortId"] !== "string") return undefined;

  return {
    id: obj["id"],
    fromNodeId: obj["fromNodeId"],
    fromPortId: obj["fromPortId"],
    toNodeId: obj["toNodeId"],
    toPortId: obj["toPortId"],
  };
}

function parseSubstitutionEntry(
  raw: unknown,
): SubstitutionEntry | undefined {
  if (typeof raw !== "object" || raw === null) return undefined;
  const obj = raw as Record<string, unknown>;
  if (
    typeof obj["_tag"] !== "string" ||
    !VALID_SUBSTITUTION_ENTRY_TAGS.has(obj["_tag"])
  )
    return undefined;
  if (typeof obj["metaVariableName"] !== "string") return undefined;
  if (
    obj["metaVariableSubscript"] !== undefined &&
    typeof obj["metaVariableSubscript"] !== "string"
  )
    return undefined;

  if (obj["_tag"] === "FormulaSubstitution") {
    if (typeof obj["formulaText"] !== "string") return undefined;
    return {
      _tag: "FormulaSubstitution",
      metaVariableName:
        obj["metaVariableName"] as GreekLetter,
      ...(obj["metaVariableSubscript"] !== undefined
        ? {
            metaVariableSubscript: obj["metaVariableSubscript"] as string,
          }
        : {}),
      formulaText: obj["formulaText"],
    };
  }

  // TermSubstitution
  if (typeof obj["termText"] !== "string") return undefined;
  return {
    _tag: "TermSubstitution",
    metaVariableName: obj["metaVariableName"] as GreekLetter,
    ...(obj["metaVariableSubscript"] !== undefined
      ? {
          metaVariableSubscript: obj["metaVariableSubscript"] as string,
        }
      : {}),
    termText: obj["termText"],
  };
}

function parseInferenceEdge(raw: unknown): InferenceEdge | undefined {
  if (typeof raw !== "object" || raw === null) return undefined;
  const obj = raw as Record<string, unknown>;

  if (typeof obj["_tag"] !== "string" || !VALID_EDGE_TAGS.has(obj["_tag"]))
    return undefined;
  if (typeof obj["conclusionNodeId"] !== "string") return undefined;
  if (typeof obj["conclusionText"] !== "string") return undefined;

  const tag = obj["_tag"];

  if (tag === "mp") {
    if (
      obj["leftPremiseNodeId"] !== undefined &&
      typeof obj["leftPremiseNodeId"] !== "string"
    )
      return undefined;
    if (
      obj["rightPremiseNodeId"] !== undefined &&
      typeof obj["rightPremiseNodeId"] !== "string"
    )
      return undefined;

    return {
      _tag: "mp",
      conclusionNodeId: obj["conclusionNodeId"],
      leftPremiseNodeId: (obj["leftPremiseNodeId"] as string) ?? undefined,
      rightPremiseNodeId: (obj["rightPremiseNodeId"] as string) ?? undefined,
      conclusionText: obj["conclusionText"],
    };
  }

  if (tag === "gen") {
    if (
      obj["premiseNodeId"] !== undefined &&
      typeof obj["premiseNodeId"] !== "string"
    )
      return undefined;
    if (typeof obj["variableName"] !== "string") return undefined;

    return {
      _tag: "gen",
      conclusionNodeId: obj["conclusionNodeId"],
      premiseNodeId: (obj["premiseNodeId"] as string) ?? undefined,
      variableName: obj["variableName"],
      conclusionText: obj["conclusionText"],
    };
  }

  // substitution
  if (
    obj["premiseNodeId"] !== undefined &&
    typeof obj["premiseNodeId"] !== "string"
  )
    return undefined;
  if (!Array.isArray(obj["entries"])) return undefined;

  const entries: SubstitutionEntry[] = [];
  for (const item of obj["entries"] as readonly unknown[]) {
    const parsed = parseSubstitutionEntry(item);
    if (parsed === undefined) return undefined;
    entries.push(parsed);
  }

  return {
    _tag: "substitution",
    conclusionNodeId: obj["conclusionNodeId"],
    premiseNodeId: (obj["premiseNodeId"] as string) ?? undefined,
    entries,
    conclusionText: obj["conclusionText"],
  };
}

function parseWorkspaceState(raw: unknown): WorkspaceState | undefined {
  if (typeof raw !== "object" || raw === null) return undefined;
  const obj = raw as Record<string, unknown>;

  const system = parseLogicSystem(obj["system"]);
  if (system === undefined) return undefined;

  if (!Array.isArray(obj["nodes"])) return undefined;
  if (!Array.isArray(obj["connections"])) return undefined;
  if (typeof obj["nextNodeId"] !== "number") return undefined;
  // 防御コード: JSON.parseでInfinity/NaNにはならないが、将来の入力ソース拡張に備える
  /* v8 ignore start */
  if (!Number.isFinite(obj["nextNodeId"])) return undefined;
  /* v8 ignore stop */
  // goalFormulaText は廃止されたが、旧データの互換性のために存在を許容する
  if (typeof obj["mode"] !== "string" || !VALID_MODES.has(obj["mode"]))
    return undefined;

  const nodes: WorkspaceNode[] = [];
  for (const item of obj["nodes"] as readonly unknown[]) {
    const parsed = parseNode(item);
    if (parsed === undefined) return undefined;
    nodes.push(parsed);
  }

  const connections: WorkspaceConnection[] = [];
  for (const item of obj["connections"] as readonly unknown[]) {
    const parsed = parseConnection(item);
    if (parsed === undefined) return undefined;
    connections.push(parsed);
  }

  // inferenceEdges は optional（旧フォーマット互換: 存在しなければ空配列）
  const inferenceEdges: InferenceEdge[] = [];
  if (obj["inferenceEdges"] !== undefined) {
    if (!Array.isArray(obj["inferenceEdges"])) return undefined;
    for (const item of obj["inferenceEdges"] as readonly unknown[]) {
      const parsed = parseInferenceEdge(item);
      if (parsed === undefined) return undefined;
      inferenceEdges.push(parsed);
    }
  }

  return {
    system,
    nodes,
    connections,
    inferenceEdges,
    nextNodeId: obj["nextNodeId"],
    mode: obj["mode"] as WorkspaceMode,
  };
}

function parseExportData(raw: unknown): WorkspaceState | undefined {
  if (typeof raw !== "object" || raw === null) return undefined;
  const obj = raw as Record<string, unknown>;

  if (obj["_tag"] !== "ProofPadWorkspace") return undefined;
  if (obj["version"] !== 1) return undefined;

  return parseWorkspaceState(obj["workspace"]);
}

// --- エクスポート ---

/** LogicSystemをJSON化可能な形式に変換する */
function serializeLogicSystem(system: LogicSystem): SerializedLogicSystem {
  return {
    name: system.name,
    propositionalAxioms: [...system.propositionalAxioms],
    predicateLogic: system.predicateLogic,
    equalityLogic: system.equalityLogic,
    generalization: system.generalization,
  };
}

/** WorkspaceState を JSON 文字列にエクスポートする */
export function exportWorkspaceToJSON(state: WorkspaceState): string {
  const exportData: WorkspaceExportData = {
    _tag: "ProofPadWorkspace",
    version: 1,
    workspace: {
      system: serializeLogicSystem(state.system),
      nodes: state.nodes,
      connections: state.connections,
      inferenceEdges: state.inferenceEdges,
      nextNodeId: state.nextNodeId,
      mode: state.mode,
    },
  };
  return JSON.stringify(exportData, null, 2);
}

/**
 * 日付コンポーネント（UTC）。
 * `new Date` を避けるために、呼び出し側（不純なUI層）で構築して渡す。
 */
export type DateComponents = {
  readonly year: number;
  readonly month: number;
  readonly day: number;
  readonly hour: number;
  readonly minute: number;
};

/** エクスポートファイルのデフォルトファイル名を生成する（純粋関数） */
export function generateExportFileName(
  systemName: string,
  dateComponents: DateComponents,
): string {
  const { year, month, day, hour, minute } = dateComponents;
  const pad = (n: number, len: number): string => String(n).padStart(len, "0");
  const dateStr = `${pad(year, 4) satisfies string}${pad(month, 2) satisfies string}${pad(day, 2) satisfies string}`;
  const timeStr = `${pad(hour, 2) satisfies string}${pad(minute, 2) satisfies string}`;
  const safeName = systemName.replace(/[^a-zA-Z0-9-_]/g, "_");
  return `proof-${safeName satisfies string}-${dateStr satisfies string}-${timeStr satisfies string}.json`;
}

// --- インポート ---

/** インポート結果 */
export type ImportResult =
  | { readonly _tag: "Success"; readonly workspace: WorkspaceState }
  | { readonly _tag: "InvalidJSON" }
  | { readonly _tag: "InvalidFormat" };

/** JSON 文字列から WorkspaceState をインポートする */
export function importWorkspaceFromJSON(json: string): ImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { _tag: "InvalidJSON" };
  }

  const workspace = parseExportData(parsed);
  if (workspace === undefined) {
    return { _tag: "InvalidFormat" };
  }

  return { _tag: "Success", workspace };
}

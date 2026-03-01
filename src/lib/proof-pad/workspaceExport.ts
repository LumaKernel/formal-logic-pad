/**
 * ワークスペースのJSON エクスポート/インポート（純粋ロジック）。
 *
 * WorkspaceState を JSON 文字列に変換してファイルエクスポートし、
 * JSON 文字列から WorkspaceState を復元する機能を提供する。
 *
 * Effect.ts Schema を使用して型安全なシリアライゼーション/デシリアライゼーションを実現。
 * LogicSystem の ReadonlySet<PropositionalAxiomId> は Schema.transform で
 * Array ↔ Set の変換を行う。
 *
 * 変更時は workspaceExport.test.ts, index.ts も同期すること。
 */

import { Either, Schema } from "effect";
import type {
  LogicSystem,
  PropositionalAxiomId,
} from "../logic-core/inferenceRule";
import { hilbertDeduction } from "../logic-core/deductionSystem";
import type {
  WorkspaceState,
  WorkspaceNode,
  WorkspaceConnection,
  WorkspaceGoal,
  WorkspaceMode,
  NodeRole,
} from "./workspaceState";
import type { InferenceEdge } from "./inferenceEdge";
import type { ProofNodeKind } from "./proofNodeUI";

// --- 公理ID定数 ---

const PROPOSITIONAL_AXIOM_IDS = ["A1", "A2", "A3", "M3", "EFQ", "DNE"] as const;

const ALL_AXIOM_IDS = [
  "A1",
  "A2",
  "A3",
  "M3",
  "EFQ",
  "DNE",
  "A4",
  "A5",
  "E1",
  "E2",
  "E3",
  "E4",
  "E5",
] as const;

// --- Schema定義 ---

/**
 * レガシーノード種別をaxiomに変換するマップ。
 * 旧フォーマットの互換性のため、mp/gen/substitution/derived をaxiomとして読み込む。
 */
const LEGACY_KIND_MAP: ReadonlyMap<string, ProofNodeKind> = new Map([
  ["mp", "axiom"],
  ["gen", "axiom"],
  ["substitution", "axiom"],
  ["derived", "axiom"],
]);

/** PointのSchema */
const PointSchema = Schema.Struct({
  x: Schema.Number,
  y: Schema.Number,
});

/** 命題論理公理IDのSchema */
const PropositionalAxiomIdSchema = Schema.Literal(...PROPOSITIONAL_AXIOM_IDS);

/** 全公理IDのSchema */
const AllAxiomIdSchema = Schema.Literal(...ALL_AXIOM_IDS);

/**
 * LogicSystemのSchema（JSON形式 ↔ LogicSystem）。
 * propositionalAxiomsをArray ↔ Setで変換する。
 */
const LogicSystemSchema = Schema.transform(
  Schema.Struct({
    name: Schema.String,
    propositionalAxioms: Schema.Array(PropositionalAxiomIdSchema),
    predicateLogic: Schema.Boolean,
    equalityLogic: Schema.Boolean,
    generalization: Schema.Boolean,
  }),
  Schema.typeSchema(
    Schema.Struct({
      name: Schema.String,
      propositionalAxioms: Schema.ReadonlySetFromSelf(
        PropositionalAxiomIdSchema,
      ),
      predicateLogic: Schema.Boolean,
      equalityLogic: Schema.Boolean,
      generalization: Schema.Boolean,
    }),
  ),
  {
    strict: true,
    decode: (serialized) => ({
      ...serialized,
      propositionalAxioms: new Set(serialized.propositionalAxioms),
    }),
    encode: (system) => ({
      ...system,
      propositionalAxioms: [...system.propositionalAxioms],
    }),
  },
);

/** ProofNodeKindのSchema（レガシー種別を自動変換） */
const ProofNodeKindSchema = Schema.transform(Schema.String, Schema.String, {
  strict: true,
  decode: (kind) => {
    const mapped = LEGACY_KIND_MAP.get(kind);
    return mapped ?? kind;
  },
  encode: (kind) => kind,
}).pipe(Schema.compose(Schema.Literal("axiom", "conclusion")));

/** NodeRoleのSchema（レガシー互換: 不明なroleはundefinedにフィルタ） */
const NodeRoleSchema = Schema.Literal("axiom");

/** WorkspaceNodeのSchema */
const WorkspaceNodeSchema = Schema.transform(
  Schema.Struct({
    id: Schema.String,
    kind: ProofNodeKindSchema,
    label: Schema.String,
    formulaText: Schema.String,
    position: PointSchema,
    genVariableName: Schema.optional(Schema.String),
    role: Schema.optional(Schema.Union(NodeRoleSchema, Schema.String)),
    // レガシーフィールドは無視（protection等）
  }),
  Schema.typeSchema(
    Schema.Struct({
      id: Schema.String,
      kind: Schema.Literal("axiom", "conclusion"),
      label: Schema.String,
      formulaText: Schema.String,
      position: PointSchema,
      role: Schema.optional(NodeRoleSchema),
    }),
  ),
  {
    strict: true,
    decode: (raw) => {
      // genVariableName はレガシーフィールド。InferenceEdgeがsource of truthなので無視する。
      const base: WorkspaceNode = {
        id: raw.id,
        kind: raw.kind satisfies string as ProofNodeKind,
        label: raw.label,
        formulaText: raw.formulaText,
        position: raw.position,
      };
      // レガシー互換: "axiom"のみ有効、それ以外は無視
      const withRole: WorkspaceNode =
        raw.role === "axiom"
          ? { ...base, role: "axiom" satisfies NodeRole }
          : base;
      return withRole;
    },
    encode: (node) => ({
      id: node.id,
      kind: node.kind,
      label: node.label,
      formulaText: node.formulaText,
      position: node.position,
      ...(node.role !== undefined ? { role: node.role } : {}),
    }),
  },
);

/** WorkspaceConnectionのSchema */
const WorkspaceConnectionSchema = Schema.Struct({
  id: Schema.String,
  fromNodeId: Schema.String,
  fromPortId: Schema.String,
  toNodeId: Schema.String,
  toPortId: Schema.String,
});

/** FormulaSubstitutionEntryのSchema */
const FormulaSubstitutionEntrySchema = Schema.Struct({
  _tag: Schema.Literal("FormulaSubstitution"),
  metaVariableName: Schema.String,
  metaVariableSubscript: Schema.optional(Schema.String),
  formulaText: Schema.String,
});

/** TermSubstitutionEntryのSchema */
const TermSubstitutionEntrySchema = Schema.Struct({
  _tag: Schema.Literal("TermSubstitution"),
  metaVariableName: Schema.String,
  metaVariableSubscript: Schema.optional(Schema.String),
  termText: Schema.String,
});

/** SubstitutionEntryのSchema */
const SubstitutionEntrySchema = Schema.Union(
  FormulaSubstitutionEntrySchema,
  TermSubstitutionEntrySchema,
);

/** MPEdgeのSchema */
const MPEdgeSchema = Schema.Struct({
  _tag: Schema.Literal("mp"),
  conclusionNodeId: Schema.String,
  leftPremiseNodeId: Schema.optional(Schema.String),
  rightPremiseNodeId: Schema.optional(Schema.String),
  conclusionText: Schema.String,
});

/** GenEdgeのSchema */
const GenEdgeSchema = Schema.Struct({
  _tag: Schema.Literal("gen"),
  conclusionNodeId: Schema.String,
  premiseNodeId: Schema.optional(Schema.String),
  variableName: Schema.String,
  conclusionText: Schema.String,
});

/** SubstitutionEdgeのSchema */
const SubstitutionEdgeSchema = Schema.Struct({
  _tag: Schema.Literal("substitution"),
  conclusionNodeId: Schema.String,
  premiseNodeId: Schema.optional(Schema.String),
  entries: Schema.Array(SubstitutionEntrySchema),
  conclusionText: Schema.String,
});

// --- ND推論エッジ Schema ---

/** ND →導入 (→I) エッジのSchema */
const NdImplicationIntroEdgeSchema = Schema.Struct({
  _tag: Schema.Literal("nd-implication-intro"),
  conclusionNodeId: Schema.String,
  premiseNodeId: Schema.optional(Schema.String),
  dischargedFormulaText: Schema.String,
  dischargedAssumptionId: Schema.Number,
  conclusionText: Schema.String,
});

/** ND →除去 (→E) エッジのSchema */
const NdImplicationElimEdgeSchema = Schema.Struct({
  _tag: Schema.Literal("nd-implication-elim"),
  conclusionNodeId: Schema.String,
  leftPremiseNodeId: Schema.optional(Schema.String),
  rightPremiseNodeId: Schema.optional(Schema.String),
  conclusionText: Schema.String,
});

/** ND ∧導入 (∧I) エッジのSchema */
const NdConjunctionIntroEdgeSchema = Schema.Struct({
  _tag: Schema.Literal("nd-conjunction-intro"),
  conclusionNodeId: Schema.String,
  leftPremiseNodeId: Schema.optional(Schema.String),
  rightPremiseNodeId: Schema.optional(Schema.String),
  conclusionText: Schema.String,
});

/** ND ∧除去左 (∧E_L) エッジのSchema */
const NdConjunctionElimLeftEdgeSchema = Schema.Struct({
  _tag: Schema.Literal("nd-conjunction-elim-left"),
  conclusionNodeId: Schema.String,
  premiseNodeId: Schema.optional(Schema.String),
  conclusionText: Schema.String,
});

/** ND ∧除去右 (∧E_R) エッジのSchema */
const NdConjunctionElimRightEdgeSchema = Schema.Struct({
  _tag: Schema.Literal("nd-conjunction-elim-right"),
  conclusionNodeId: Schema.String,
  premiseNodeId: Schema.optional(Schema.String),
  conclusionText: Schema.String,
});

/** ND ∨導入左 (∨I_L) エッジのSchema */
const NdDisjunctionIntroLeftEdgeSchema = Schema.Struct({
  _tag: Schema.Literal("nd-disjunction-intro-left"),
  conclusionNodeId: Schema.String,
  premiseNodeId: Schema.optional(Schema.String),
  addedRightText: Schema.String,
  conclusionText: Schema.String,
});

/** ND ∨導入右 (∨I_R) エッジのSchema */
const NdDisjunctionIntroRightEdgeSchema = Schema.Struct({
  _tag: Schema.Literal("nd-disjunction-intro-right"),
  conclusionNodeId: Schema.String,
  premiseNodeId: Schema.optional(Schema.String),
  addedLeftText: Schema.String,
  conclusionText: Schema.String,
});

/** ND ∨除去 (∨E) エッジのSchema */
const NdDisjunctionElimEdgeSchema = Schema.Struct({
  _tag: Schema.Literal("nd-disjunction-elim"),
  conclusionNodeId: Schema.String,
  disjunctionPremiseNodeId: Schema.optional(Schema.String),
  leftCasePremiseNodeId: Schema.optional(Schema.String),
  leftDischargedAssumptionId: Schema.Number,
  rightCasePremiseNodeId: Schema.optional(Schema.String),
  rightDischargedAssumptionId: Schema.Number,
  conclusionText: Schema.String,
});

/** ND 弱化 (w) エッジのSchema */
const NdWeakeningEdgeSchema = Schema.Struct({
  _tag: Schema.Literal("nd-weakening"),
  conclusionNodeId: Schema.String,
  keptPremiseNodeId: Schema.optional(Schema.String),
  discardedPremiseNodeId: Schema.optional(Schema.String),
  conclusionText: Schema.String,
});

/** ND EFQ (爆発律) エッジのSchema */
const NdEfqEdgeSchema = Schema.Struct({
  _tag: Schema.Literal("nd-efq"),
  conclusionNodeId: Schema.String,
  premiseNodeId: Schema.optional(Schema.String),
  conclusionText: Schema.String,
});

/** ND DNE (二重否定除去) エッジのSchema */
const NdDneEdgeSchema = Schema.Struct({
  _tag: Schema.Literal("nd-dne"),
  conclusionNodeId: Schema.String,
  premiseNodeId: Schema.optional(Schema.String),
  conclusionText: Schema.String,
});

/** ND ∀導入 (∀I) エッジのSchema */
const NdUniversalIntroEdgeSchema = Schema.Struct({
  _tag: Schema.Literal("nd-universal-intro"),
  conclusionNodeId: Schema.String,
  premiseNodeId: Schema.optional(Schema.String),
  variableName: Schema.String,
  conclusionText: Schema.String,
});

/** ND ∀除去 (∀E) エッジのSchema */
const NdUniversalElimEdgeSchema = Schema.Struct({
  _tag: Schema.Literal("nd-universal-elim"),
  conclusionNodeId: Schema.String,
  premiseNodeId: Schema.optional(Schema.String),
  termText: Schema.String,
  conclusionText: Schema.String,
});

/** ND ∃導入 (∃I) エッジのSchema */
const NdExistentialIntroEdgeSchema = Schema.Struct({
  _tag: Schema.Literal("nd-existential-intro"),
  conclusionNodeId: Schema.String,
  premiseNodeId: Schema.optional(Schema.String),
  variableName: Schema.String,
  termText: Schema.String,
  conclusionText: Schema.String,
});

/** ND ∃除去 (∃E) エッジのSchema */
const NdExistentialElimEdgeSchema = Schema.Struct({
  _tag: Schema.Literal("nd-existential-elim"),
  conclusionNodeId: Schema.String,
  existentialPremiseNodeId: Schema.optional(Schema.String),
  casePremiseNodeId: Schema.optional(Schema.String),
  dischargedAssumptionId: Schema.Number,
  dischargedFormulaText: Schema.String,
  conclusionText: Schema.String,
});

// --- TAB推論エッジ Schema ---

/** TAB 1前提規則エッジのSchema */
const TabSinglePremiseEdgeSchema = Schema.Struct({
  _tag: Schema.Literal("tab-single"),
  ruleId: Schema.String,
  conclusionNodeId: Schema.String,
  premiseNodeId: Schema.optional(Schema.String),
  conclusionText: Schema.String,
  eigenVariable: Schema.optional(Schema.String),
  termText: Schema.optional(Schema.String),
  exchangePosition: Schema.optional(Schema.Number),
});

/** TAB 2前提（分岐）規則エッジのSchema */
const TabBranchingEdgeSchema = Schema.Struct({
  _tag: Schema.Literal("tab-branching"),
  ruleId: Schema.String,
  conclusionNodeId: Schema.String,
  leftPremiseNodeId: Schema.optional(Schema.String),
  rightPremiseNodeId: Schema.optional(Schema.String),
  leftConclusionText: Schema.String,
  rightConclusionText: Schema.String,
  conclusionText: Schema.String,
});

/** TAB 公理（0前提）マークエッジのSchema */
const TabAxiomEdgeSchema = Schema.Struct({
  _tag: Schema.Literal("tab-axiom"),
  ruleId: Schema.String,
  conclusionNodeId: Schema.String,
  conclusionText: Schema.String,
});

/** InferenceEdgeのSchema（Hilbert系 + ND + TAB） */
const InferenceEdgeSchema = Schema.Union(
  // Hilbert系
  MPEdgeSchema,
  GenEdgeSchema,
  SubstitutionEdgeSchema,
  // ND
  NdImplicationIntroEdgeSchema,
  NdImplicationElimEdgeSchema,
  NdConjunctionIntroEdgeSchema,
  NdConjunctionElimLeftEdgeSchema,
  NdConjunctionElimRightEdgeSchema,
  NdDisjunctionIntroLeftEdgeSchema,
  NdDisjunctionIntroRightEdgeSchema,
  NdDisjunctionElimEdgeSchema,
  NdWeakeningEdgeSchema,
  NdEfqEdgeSchema,
  NdDneEdgeSchema,
  NdUniversalIntroEdgeSchema,
  NdUniversalElimEdgeSchema,
  NdExistentialIntroEdgeSchema,
  NdExistentialElimEdgeSchema,
  // TAB
  TabSinglePremiseEdgeSchema,
  TabBranchingEdgeSchema,
  TabAxiomEdgeSchema,
);

/** WorkspaceGoalのSchema */
const WorkspaceGoalSchema = Schema.Struct({
  id: Schema.String,
  formulaText: Schema.String,
  label: Schema.optional(Schema.String),
  allowedAxiomIds: Schema.optional(Schema.Array(AllAxiomIdSchema)),
});

/** WorkspaceModeのSchema */
const WorkspaceModeSchema = Schema.Literal("free", "quest");

/**
 * WorkspaceStateのSchema（JSON形式 ↔ WorkspaceState）。
 * - LogicSystemのSet ↔ Array変換
 * - deductionSystemの再構築
 * - inferenceEdges/goalsのoptional→デフォルト空配列
 */
const WorkspaceStateSchema = Schema.transform(
  Schema.Struct({
    system: LogicSystemSchema,
    nodes: Schema.Array(WorkspaceNodeSchema),
    connections: Schema.Array(WorkspaceConnectionSchema),
    inferenceEdges: Schema.optional(Schema.Array(InferenceEdgeSchema)),
    nextNodeId: Schema.Number,
    mode: WorkspaceModeSchema,
    goals: Schema.optional(Schema.Array(WorkspaceGoalSchema)),
  }),
  Schema.typeSchema(
    Schema.Struct({
      system: Schema.typeSchema(LogicSystemSchema),
      deductionSystem: Schema.Unknown,
      nodes: Schema.Array(Schema.typeSchema(WorkspaceNodeSchema)),
      connections: Schema.Array(WorkspaceConnectionSchema),
      inferenceEdges: Schema.Array(Schema.typeSchema(InferenceEdgeSchema)),
      nextNodeId: Schema.Number,
      mode: WorkspaceModeSchema,
      goals: Schema.Array(Schema.typeSchema(WorkspaceGoalSchema)),
    }),
  ),
  {
    strict: false,
    decode: (serialized) => ({
      system: serialized.system,
      deductionSystem: hilbertDeduction(
        serialized.system satisfies object as LogicSystem,
      ),
      nodes:
        serialized.nodes satisfies readonly object[] as readonly WorkspaceNode[],
      connections:
        serialized.connections satisfies readonly object[] as readonly WorkspaceConnection[],
      inferenceEdges: (serialized.inferenceEdges ??
        []) satisfies readonly object[] as readonly InferenceEdge[],
      nextNodeId: serialized.nextNodeId,
      mode: serialized.mode satisfies string as WorkspaceMode,
      goals: (serialized.goals ??
        []) satisfies readonly object[] as readonly WorkspaceGoal[],
    }),
    encode: (state) => ({
      system: state.system satisfies object as LogicSystem,
      nodes:
        state.nodes satisfies readonly object[] as readonly WorkspaceNode[],
      connections:
        state.connections satisfies readonly object[] as readonly WorkspaceConnection[],
      inferenceEdges:
        state.inferenceEdges satisfies readonly object[] as readonly InferenceEdge[],
      nextNodeId: state.nextNodeId,
      mode: state.mode satisfies string as WorkspaceMode,
      goals:
        state.goals satisfies readonly object[] as readonly WorkspaceGoal[],
    }),
  },
);

/**
 * エクスポートデータ全体のSchema。
 * _tag: "ProofPadWorkspace", version: 1 のバリデーションを含む。
 */
const WorkspaceExportDataSchema = Schema.Struct({
  _tag: Schema.Literal("ProofPadWorkspace"),
  version: Schema.Literal(1),
  workspace: WorkspaceStateSchema,
});

// --- Schema-based decode/encode ---

const decodeExportData = Schema.decodeUnknownEither(WorkspaceExportDataSchema);
const encodeWorkspaceState = Schema.encodeSync(WorkspaceStateSchema);

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
  readonly goals: readonly WorkspaceGoal[];
};

/** JSON化可能なLogicSystem（Setの代わりにArray） */
type SerializedLogicSystem = {
  readonly name: string;
  readonly propositionalAxioms: readonly PropositionalAxiomId[];
  readonly predicateLogic: boolean;
  readonly equalityLogic: boolean;
  readonly generalization: boolean;
};

// --- エクスポート ---

/** WorkspaceState を JSON 文字列にエクスポートする */
export function exportWorkspaceToJSON(state: WorkspaceState): string {
  const serializedWorkspace = encodeWorkspaceState(state);
  const exportData = {
    _tag: "ProofPadWorkspace" as const,
    version: 1 as const,
    workspace: serializedWorkspace,
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

  const result = decodeExportData(parsed);
  if (Either.isLeft(result)) {
    return { _tag: "InvalidFormat" };
  }

  return {
    _tag: "Success",
    workspace: result.right.workspace satisfies object as WorkspaceState,
  };
}

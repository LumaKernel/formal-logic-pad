/**
 * SC（シーケント計算）ワークスペースグラフから ScProofNode ツリーを構築する純粋ロジック。
 *
 * ワークスペースの WorkspaceNode[] + InferenceEdge[] フラットグラフから
 * ScProofNode 再帰ツリーを構築し、cutEliminationStepperLogic に渡す。
 *
 * 変更時は scTreeBuildLogic.test.ts, ProofWorkspace.tsx, index.ts も同期すること。
 */

import { Data, Either, Effect } from "effect";
import type { Formula } from "../logic-core/formula";
import { equalFormula } from "../logic-core/equality";
import type { ScProofNode, Sequent } from "../logic-core/sequentCalculus";
import {
  sequent,
  scIdentity,
  scBottomLeft,
  scCut,
  scWeakeningLeft,
  scWeakeningRight,
  scContractionLeft,
  scContractionRight,
  scExchangeLeft,
  scExchangeRight,
  scImplicationLeft,
  scImplicationRight,
  scConjunctionLeft,
  scConjunctionRight,
  scDisjunctionLeft,
  scDisjunctionRight,
  scUniversalLeft,
  scUniversalRight,
  scExistentialLeft,
  scExistentialRight,
} from "../logic-core/sequentCalculus";
import type { ScRuleId } from "../logic-core/deductionSystem";
import type {
  InferenceEdge,
  ScSinglePremiseEdge,
  ScBranchingEdge,
  ScAxiomEdge,
  ScInferenceEdge,
} from "./inferenceEdge";
import { isScInferenceEdge } from "./inferenceEdge";
import type { WorkspaceNode } from "./workspaceState";
import { parseSequentText } from "./scApplicationLogic";

// ─── エラー型 ────────────────────────────────────────────

/** SC証明ツリー構築エラー */
export class ScTreeNodeNotFound extends Data.TaggedError(
  "ScTreeNodeNotFound",
)<{
  readonly nodeId: string;
}> {}

export class ScTreeSequentParseError extends Data.TaggedError(
  "ScTreeSequentParseError",
)<{
  readonly nodeId: string;
}> {}

export class ScTreeIncompleteProof extends Data.TaggedError(
  "ScTreeIncompleteProof",
)<{
  readonly nodeId: string;
}> {}

export class ScTreeFormulaRecoveryFailed extends Data.TaggedError(
  "ScTreeFormulaRecoveryFailed",
)<{
  readonly nodeId: string;
  readonly ruleId: ScRuleId;
}> {}

export class ScTreeCycleDetected extends Data.TaggedError(
  "ScTreeCycleDetected",
)<{
  readonly nodeId: string;
}> {}

export type ScTreeBuildError =
  | ScTreeNodeNotFound
  | ScTreeSequentParseError
  | ScTreeIncompleteProof
  | ScTreeFormulaRecoveryFailed
  | ScTreeCycleDetected;

// ─── 論理式復元ヘルパー ──────────────────────────────────────

/**
 * 弱化された論理式を復元する。
 *
 * 弱化規則は前提のシーケントに1つの論理式を追加して結論を作る。
 * 結論側に1つ多い論理式があるため、差分を取って特定する。
 *
 * @param conclusionFormulas 結論側の論理式列（弱化後）
 * @param premiseFormulas 前提側の論理式列（弱化前）
 * @returns 弱化された論理式、または見つからない場合 undefined
 */
export function recoverWeakenedFormula(
  conclusionFormulas: readonly Formula[],
  premiseFormulas: readonly Formula[],
): Formula | undefined {
  // 結論が前提より1つ多いはず
  if (conclusionFormulas.length !== premiseFormulas.length + 1) return undefined;

  // 結論の各位置を試し、その位置を除くと前提と一致するか確認
  for (let i = 0; i < conclusionFormulas.length; i++) {
    const remaining = [
      ...conclusionFormulas.slice(0, i),
      ...conclusionFormulas.slice(i + 1),
    ];
    if (
      remaining.length === premiseFormulas.length &&
      remaining.every((f, j) => {
        const pf = premiseFormulas[j];
        return pf !== undefined && equalFormula(f, pf);
      })
    ) {
      return conclusionFormulas[i];
    }
  }
  return undefined;
}

/**
 * 縮約された論理式を復元する。
 *
 * 縮約規則は前提のシーケントから重複する論理式を1つ除いて結論を作る。
 * 前提側に1つ多い論理式があるため、差分を取って特定する。
 *
 * @param conclusionFormulas 結論側の論理式列（縮約後）
 * @param premiseFormulas 前提側の論理式列（縮約前）
 * @returns 縮約された論理式、または見つからない場合 undefined
 */
export function recoverContractedFormula(
  conclusionFormulas: readonly Formula[],
  premiseFormulas: readonly Formula[],
): Formula | undefined {
  // 前提が結論より1つ多いはず
  if (premiseFormulas.length !== conclusionFormulas.length + 1) return undefined;

  // 前提の各位置を試し、その位置を除くと結論と一致するか確認
  for (let i = 0; i < premiseFormulas.length; i++) {
    const remaining = [
      ...premiseFormulas.slice(0, i),
      ...premiseFormulas.slice(i + 1),
    ];
    if (
      remaining.length === conclusionFormulas.length &&
      remaining.every((f, j) => {
        const cf = conclusionFormulas[j];
        return cf !== undefined && equalFormula(f, cf);
      })
    ) {
      return premiseFormulas[i];
    }
  }
  return undefined;
}

/**
 * カット式を左前提テキストから復元する。
 *
 * 簡略化カット規則では左前提は "Γ ⇒ φ" の形式。
 * φ（唯一の succedent）がカット式。
 *
 * @param leftPremiseText 左前提のシーケントテキスト
 * @returns カット式、または見つからない場合 undefined
 */
export function recoverCutFormula(
  leftPremiseText: string,
): Formula | undefined {
  const parsed = parseSequentText(leftPremiseText);
  if (parsed === undefined) return undefined;
  if (parsed.succedents.length !== 1) return undefined;
  return parsed.succedents[0];
}

// ─── ツリー構築メイン ────────────────────────────────────────

/**
 * ワークスペースのルートノードからSCを検出し、
 * ルートになりうるノードIDのリストを返す。
 *
 * ルートノード = SC エッジの結論ノードのうち、
 * 他のSCエッジの前提として参照されていないもの。
 */
export function findScRootNodeIds(
  nodes: readonly WorkspaceNode[],
  inferenceEdges: readonly InferenceEdge[],
): readonly string[] {
  const scEdges = inferenceEdges.filter(isScInferenceEdge);
  if (scEdges.length === 0) return [];

  // SCエッジに関与する全ノードIDを収集
  const conclusionNodeIds = new Set<string>();
  const premiseNodeIds = new Set<string>();

  for (const edge of scEdges) {
    conclusionNodeIds.add(edge.conclusionNodeId);
    if (edge._tag === "sc-single" && edge.premiseNodeId !== undefined) {
      premiseNodeIds.add(edge.premiseNodeId);
    }
    if (edge._tag === "sc-branching") {
      if (edge.leftPremiseNodeId !== undefined) {
        premiseNodeIds.add(edge.leftPremiseNodeId);
      }
      if (edge.rightPremiseNodeId !== undefined) {
        premiseNodeIds.add(edge.rightPremiseNodeId);
      }
    }
  }

  // 結論ノードのうち、前提として参照されていないものがルート
  const nodeIdSet = new Set(nodes.map((n) => n.id));
  const rootIds: string[] = [];
  for (const cId of conclusionNodeIds) {
    if (!premiseNodeIds.has(cId) && nodeIdSet.has(cId)) {
      rootIds.push(cId);
    }
  }
  return rootIds;
}

/**
 * ワークスペースの SC グラフから ScProofNode ツリーを構築する（Effect版）。
 *
 * @param rootNodeId ルートノード（証明の最終結論）のID
 * @param nodes ワークスペースのノード配列
 * @param inferenceEdges ワークスペースの推論エッジ配列
 * @returns ScProofNode ツリー or エラー
 */
const buildScProofTreeEffect = (
  rootNodeId: string,
  nodes: readonly WorkspaceNode[],
  inferenceEdges: readonly InferenceEdge[],
): Effect.Effect<ScProofNode, ScTreeBuildError> =>
  Effect.gen(function* () {
    // 前処理: ルックアップマップ構築
    const nodeById = new Map<string, WorkspaceNode>();
    for (const node of nodes) {
      nodeById.set(node.id, node);
    }

    const scEdges = inferenceEdges.filter(isScInferenceEdge);
    const edgeByConclusionId = new Map<string, ScInferenceEdge>();
    for (const edge of scEdges) {
      edgeByConclusionId.set(edge.conclusionNodeId, edge);
    }

    // 再帰構築
    const visited = new Set<string>();
    return yield* buildNodeEffect(
      rootNodeId,
      nodeById,
      edgeByConclusionId,
      visited,
    );
  });

/**
 * 単一ノードからScProofNodeを再帰的に構築する（Effect版）。
 */
const buildNodeEffect = (
  nodeId: string,
  nodeById: ReadonlyMap<string, WorkspaceNode>,
  edgeByConclusionId: ReadonlyMap<string, ScInferenceEdge>,
  visited: Set<string>,
): Effect.Effect<ScProofNode, ScTreeBuildError> =>
  Effect.gen(function* () {
    // サイクル検出
    if (visited.has(nodeId)) {
      return yield* Effect.fail(new ScTreeCycleDetected({ nodeId }));
    }
    visited.add(nodeId);

    // ノード取得
    const node = nodeById.get(nodeId);
    if (node === undefined) {
      return yield* Effect.fail(new ScTreeNodeNotFound({ nodeId }));
    }

    // エッジ取得
    const edge = edgeByConclusionId.get(nodeId);
    if (edge === undefined) {
      return yield* Effect.fail(new ScTreeIncompleteProof({ nodeId }));
    }

    // 結論シーケントのパース（エッジに保存されたテキストを使用）
    const conclusionParsed = parseSequentText(edge.conclusionText);
    if (conclusionParsed === undefined) {
      return yield* Effect.fail(new ScTreeSequentParseError({ nodeId }));
    }
    const conclusion: Sequent = sequent(
      conclusionParsed.antecedents,
      conclusionParsed.succedents,
    );

    // エッジタイプに応じた構築
    if (edge._tag === "sc-axiom") {
      return yield* buildAxiomNode(edge, conclusion);
    }
    if (edge._tag === "sc-single") {
      return yield* buildSinglePremiseNode(
        edge,
        conclusion,
        nodeById,
        edgeByConclusionId,
        visited,
      );
    }
    // sc-branching
    return yield* buildBranchingNode(
      edge,
      conclusion,
      nodeById,
      edgeByConclusionId,
      visited,
    );
  });

/**
 * SC公理ノード（identity / bottom-left）を構築する。
 */
const buildAxiomNode = (
  edge: ScAxiomEdge,
  conclusion: Sequent,
): Effect.Effect<ScProofNode, never> =>
  Effect.gen(function* () {
    if (edge.ruleId === "identity") {
      return scIdentity(conclusion);
    }
    // bottom-left
    return scBottomLeft(conclusion);
  });

/**
 * SC 1前提規則ノードを構築する。
 */
const buildSinglePremiseNode = (
  edge: ScSinglePremiseEdge,
  conclusion: Sequent,
  nodeById: ReadonlyMap<string, WorkspaceNode>,
  edgeByConclusionId: ReadonlyMap<string, ScInferenceEdge>,
  visited: Set<string>,
): Effect.Effect<ScProofNode, ScTreeBuildError> =>
  Effect.gen(function* () {
    // 前提ノードの再帰構築
    if (edge.premiseNodeId === undefined) {
      return yield* Effect.fail(
        new ScTreeIncompleteProof({ nodeId: edge.conclusionNodeId }),
      );
    }
    const premise = yield* buildNodeEffect(
      edge.premiseNodeId,
      nodeById,
      edgeByConclusionId,
      visited,
    );

    // 前提シーケントのパース（パラメータ復元用）
    const premiseNode = nodeById.get(edge.premiseNodeId);
    /* v8 ignore start -- premiseNode は直前の buildNodeEffect 成功時に必ず存在 */
    if (premiseNode === undefined) {
      return yield* Effect.fail(
        new ScTreeNodeNotFound({ nodeId: edge.premiseNodeId }),
      );
    }
    /* v8 ignore stop */
    const premiseParsed = parseSequentText(premiseNode.formulaText);

    return yield* buildSinglePremiseFromRule(
      edge.ruleId,
      edge,
      premise,
      conclusion,
      premiseParsed,
    );
  });

/**
 * ruleId に応じて1前提規則のScProofNodeを生成する。
 */
const buildSinglePremiseFromRule = (
  ruleId: ScRuleId,
  edge: ScSinglePremiseEdge,
  premise: ScProofNode,
  conclusion: Sequent,
  premiseParsed: ReturnType<typeof parseSequentText>,
): Effect.Effect<ScProofNode, ScTreeBuildError> =>
  Effect.gen(function* () {
    // パラメータがエッジに直接保存されている規則
    if (ruleId === "exchange-left") {
      return scExchangeLeft(premise, edge.exchangePosition ?? 0, conclusion);
    }
    if (ruleId === "exchange-right") {
      return scExchangeRight(premise, edge.exchangePosition ?? 0, conclusion);
    }
    if (ruleId === "conjunction-left") {
      return scConjunctionLeft(premise, edge.componentIndex ?? 1, conclusion);
    }
    if (ruleId === "disjunction-right") {
      return scDisjunctionRight(premise, edge.componentIndex ?? 1, conclusion);
    }

    // パラメータなしの規則
    if (ruleId === "implication-right") {
      return scImplicationRight(premise, conclusion);
    }
    if (ruleId === "universal-left") {
      return scUniversalLeft(premise, conclusion);
    }
    if (ruleId === "universal-right") {
      return scUniversalRight(premise, conclusion);
    }
    if (ruleId === "existential-left") {
      return scExistentialLeft(premise, conclusion);
    }
    if (ruleId === "existential-right") {
      return scExistentialRight(premise, conclusion);
    }

    // 論理式の復元が必要な規則
    if (premiseParsed === undefined) {
      return yield* Effect.fail(
        new ScTreeFormulaRecoveryFailed({
          nodeId: edge.conclusionNodeId,
          ruleId,
        }),
      );
    }

    if (ruleId === "weakening-left") {
      const weakened = recoverWeakenedFormula(
        conclusion.antecedents,
        premiseParsed.antecedents,
      );
      if (weakened === undefined) {
        return yield* Effect.fail(
          new ScTreeFormulaRecoveryFailed({
            nodeId: edge.conclusionNodeId,
            ruleId,
          }),
        );
      }
      return scWeakeningLeft(premise, weakened, conclusion);
    }
    if (ruleId === "weakening-right") {
      const weakened = recoverWeakenedFormula(
        conclusion.succedents,
        premiseParsed.succedents,
      );
      if (weakened === undefined) {
        return yield* Effect.fail(
          new ScTreeFormulaRecoveryFailed({
            nodeId: edge.conclusionNodeId,
            ruleId,
          }),
        );
      }
      return scWeakeningRight(premise, weakened, conclusion);
    }
    if (ruleId === "contraction-left") {
      const contracted = recoverContractedFormula(
        conclusion.antecedents,
        premiseParsed.antecedents,
      );
      if (contracted === undefined) {
        return yield* Effect.fail(
          new ScTreeFormulaRecoveryFailed({
            nodeId: edge.conclusionNodeId,
            ruleId,
          }),
        );
      }
      return scContractionLeft(premise, contracted, conclusion);
    }
    // fall-through: contraction-right (TypeScript narrows via exhaustive if-chain)
    const contracted = recoverContractedFormula(
      conclusion.succedents,
      premiseParsed.succedents,
    );
    if (contracted === undefined) {
      return yield* Effect.fail(
        new ScTreeFormulaRecoveryFailed({
          nodeId: edge.conclusionNodeId,
          ruleId,
        }),
      );
    }
    return scContractionRight(premise, contracted, conclusion);
  });

/**
 * SC 2前提（分岐）規則ノードを構築する。
 */
const buildBranchingNode = (
  edge: ScBranchingEdge,
  conclusion: Sequent,
  nodeById: ReadonlyMap<string, WorkspaceNode>,
  edgeByConclusionId: ReadonlyMap<string, ScInferenceEdge>,
  visited: Set<string>,
): Effect.Effect<ScProofNode, ScTreeBuildError> =>
  Effect.gen(function* () {
    // 前提ノードの取得
    if (
      edge.leftPremiseNodeId === undefined ||
      edge.rightPremiseNodeId === undefined
    ) {
      return yield* Effect.fail(
        new ScTreeIncompleteProof({ nodeId: edge.conclusionNodeId }),
      );
    }

    // 左右の前提を再帰構築
    const left = yield* buildNodeEffect(
      edge.leftPremiseNodeId,
      nodeById,
      edgeByConclusionId,
      visited,
    );
    const right = yield* buildNodeEffect(
      edge.rightPremiseNodeId,
      nodeById,
      edgeByConclusionId,
      visited,
    );

    if (edge.ruleId === "cut") {
      // カット式を左前提テキストから復元
      const cutFormula = recoverCutFormula(edge.leftConclusionText);
      if (cutFormula === undefined) {
        return yield* Effect.fail(
          new ScTreeFormulaRecoveryFailed({
            nodeId: edge.conclusionNodeId,
            ruleId: "cut",
          }),
        );
      }
      return scCut(left, right, cutFormula, conclusion);
    }
    if (edge.ruleId === "implication-left") {
      return scImplicationLeft(left, right, conclusion);
    }
    if (edge.ruleId === "conjunction-right") {
      return scConjunctionRight(left, right, conclusion);
    }
    // fall-through: disjunction-left
    return scDisjunctionLeft(left, right, conclusion);
  });

// ─── 公開API ─────────────────────────────────────────────

/**
 * ワークスペースの SC グラフから ScProofNode ツリーを構築する。
 *
 * @param rootNodeId ルートノード（証明の最終結論）のID
 * @param nodes ワークスペースのノード配列
 * @param inferenceEdges ワークスペースの推論エッジ配列
 * @returns Either: Right = ScProofNode, Left = ScTreeBuildError
 */
export const buildScProofTree = (
  rootNodeId: string,
  nodes: readonly WorkspaceNode[],
  inferenceEdges: readonly InferenceEdge[],
): Either.Either<ScProofNode, ScTreeBuildError> =>
  Effect.runSync(
    Effect.either(buildScProofTreeEffect(rootNodeId, nodes, inferenceEdges)),
  );

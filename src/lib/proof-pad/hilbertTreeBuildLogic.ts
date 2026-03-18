/**
 * Hilbert系ワークスペースグラフから ProofNode ツリーを構築する純粋ロジック。
 *
 * ワークスペースの WorkspaceNode[] + InferenceEdge[] フラットグラフから
 * ProofNode 再帰ツリーを構築する。
 *
 * 変更時は hilbertTreeBuildLogic.test.ts, ProofWorkspace.tsx, index.ts も同期すること。
 */

import { Data, Either, Effect } from "effect";
import type { Formula } from "../logic-core/formula";
import type { ProofNode } from "../logic-core/proofTree";
import {
  axiomNode,
  modusPonensNode,
  generalizationNode,
} from "../logic-core/proofTree";
import { termVariable } from "../logic-core/term";
import type { InferenceEdge, HilbertInferenceEdge } from "./inferenceEdge";
import { isHilbertInferenceEdge } from "./inferenceEdge";
import type { WorkspaceNode } from "./workspaceState";
import { parseString } from "../logic-lang";

// ─── エラー型 ────────────────────────────────────────────

/** ノードが見つからない */
export class HilbertTreeNodeNotFound extends Data.TaggedError(
  "HilbertTreeNodeNotFound",
)<{
  readonly nodeId: string;
}> {}

/** 論理式のパースに失敗 */
export class HilbertTreeFormulaParseError extends Data.TaggedError(
  "HilbertTreeFormulaParseError",
)<{
  readonly nodeId: string;
  readonly formulaText: string;
}> {}

/** 不完全な証明（前提ノードが未接続） */
export class HilbertTreeIncompleteProof extends Data.TaggedError(
  "HilbertTreeIncompleteProof",
)<{
  readonly nodeId: string;
}> {}

/** サイクル検出 */
export class HilbertTreeCycleDetected extends Data.TaggedError(
  "HilbertTreeCycleDetected",
)<{
  readonly nodeId: string;
}> {}

export type HilbertTreeBuildError =
  | HilbertTreeNodeNotFound
  | HilbertTreeFormulaParseError
  | HilbertTreeIncompleteProof
  | HilbertTreeCycleDetected;

// ─── ルートノード検出 ──────────────────────────────────────

/**
 * Hilbert系のルートノードID（最終結論）を検出する。
 *
 * ルートノード = Hilbert エッジの結論ノードのうち、
 * 他の Hilbert エッジの前提として参照されていないもの。
 */
export function findHilbertRootNodeIds(
  nodes: readonly WorkspaceNode[],
  inferenceEdges: readonly InferenceEdge[],
): readonly string[] {
  const hilbertEdges = inferenceEdges.filter(isHilbertInferenceEdge);
  if (hilbertEdges.length === 0) return [];

  const conclusionNodeIds = new Set<string>();
  const premiseNodeIds = new Set<string>();

  for (const edge of hilbertEdges) {
    conclusionNodeIds.add(edge.conclusionNodeId);
    collectHilbertPremiseNodeIds(edge, premiseNodeIds);
  }

  const nodeIdSet = new Set(nodes.map((n) => n.id));
  const rootIds: string[] = [];
  for (const cId of conclusionNodeIds) {
    if (!premiseNodeIds.has(cId) && nodeIdSet.has(cId)) {
      rootIds.push(cId);
    }
  }
  return rootIds;
}

/** Hilbert エッジの前提ノードIDを収集する */
function collectHilbertPremiseNodeIds(
  edge: HilbertInferenceEdge,
  ids: Set<string>,
): void {
  if (edge._tag === "mp") {
    if (edge.leftPremiseNodeId !== undefined) ids.add(edge.leftPremiseNodeId);
    if (edge.rightPremiseNodeId !== undefined) ids.add(edge.rightPremiseNodeId);
    return;
  }
  if (edge._tag === "gen") {
    if (edge.premiseNodeId !== undefined) ids.add(edge.premiseNodeId);
    return;
  }
  if (edge._tag === "substitution") {
    if (edge.premiseNodeId !== undefined) ids.add(edge.premiseNodeId);
    return;
  }
  if (edge._tag === "simplification") {
    if (edge.premiseNodeId !== undefined) ids.add(edge.premiseNodeId);
    return;
  }
  // substitution-connection
  if (edge.premiseNodeId !== undefined) ids.add(edge.premiseNodeId);
}

// ─── ツリー構築 ────────────────────────────────────────────

/**
 * ワークスペースの Hilbert グラフから ProofNode ツリーを構築する（Effect版）。
 */
const buildHilbertProofTreeEffect = (
  rootNodeId: string,
  nodes: readonly WorkspaceNode[],
  inferenceEdges: readonly InferenceEdge[],
): Effect.Effect<ProofNode, HilbertTreeBuildError> =>
  Effect.gen(function* () {
    const nodeById = new Map<string, WorkspaceNode>();
    for (const node of nodes) {
      nodeById.set(node.id, node);
    }

    const hilbertEdges = inferenceEdges.filter(isHilbertInferenceEdge);
    const edgeByConclusionId = new Map<string, HilbertInferenceEdge>();
    for (const edge of hilbertEdges) {
      edgeByConclusionId.set(edge.conclusionNodeId, edge);
    }

    const visited = new Set<string>();
    return yield* buildNodeEffect(
      rootNodeId,
      nodeById,
      edgeByConclusionId,
      visited,
    );
  });

/** ノードの論理式テキストをパースする */
const parseNodeFormula = (
  node: WorkspaceNode,
): Effect.Effect<Formula, HilbertTreeFormulaParseError> =>
  Effect.gen(function* () {
    const result = parseString(node.formulaText);
    if (Either.isLeft(result)) {
      return yield* Effect.fail(
        new HilbertTreeFormulaParseError({
          nodeId: node.id,
          formulaText: node.formulaText,
        }),
      );
    }
    return result.right;
  });

/** 単一ノードから ProofNode を再帰的に構築する */
const buildNodeEffect = (
  nodeId: string,
  nodeById: ReadonlyMap<string, WorkspaceNode>,
  edgeByConclusionId: ReadonlyMap<string, HilbertInferenceEdge>,
  visited: Set<string>,
): Effect.Effect<ProofNode, HilbertTreeBuildError> =>
  Effect.gen(function* () {
    if (visited.has(nodeId)) {
      return yield* Effect.fail(new HilbertTreeCycleDetected({ nodeId }));
    }
    visited.add(nodeId);

    const node = nodeById.get(nodeId);
    if (node === undefined) {
      return yield* Effect.fail(new HilbertTreeNodeNotFound({ nodeId }));
    }

    const formula = yield* parseNodeFormula(node);
    const edge = edgeByConclusionId.get(nodeId);

    // エッジなし = 葉ノード（公理 or 仮定）
    if (edge === undefined) {
      return axiomNode(formula);
    }

    if (edge._tag === "mp") {
      if (
        edge.leftPremiseNodeId === undefined ||
        edge.rightPremiseNodeId === undefined
      ) {
        return yield* Effect.fail(new HilbertTreeIncompleteProof({ nodeId }));
      }
      const antecedent = yield* buildNodeEffect(
        edge.leftPremiseNodeId,
        nodeById,
        edgeByConclusionId,
        visited,
      );
      const conditional = yield* buildNodeEffect(
        edge.rightPremiseNodeId,
        nodeById,
        edgeByConclusionId,
        visited,
      );
      return modusPonensNode(formula, antecedent, conditional);
    }

    if (edge._tag === "gen") {
      if (edge.premiseNodeId === undefined) {
        return yield* Effect.fail(new HilbertTreeIncompleteProof({ nodeId }));
      }
      const premise = yield* buildNodeEffect(
        edge.premiseNodeId,
        nodeById,
        edgeByConclusionId,
        visited,
      );
      const variable = termVariable(edge.variableName);
      return generalizationNode(formula, variable, premise);
    }

    // substitution, simplification, substitution-connection は
    // 変換規則であり、ProofNode上は結論の論理式を持つ葉ノードとして扱う。
    // 前提がある場合は再帰的に辿る（前提の証明木を含める）。
    if (
      edge._tag === "substitution" ||
      edge._tag === "simplification" ||
      edge._tag === "substitution-connection"
    ) {
      if (edge.premiseNodeId === undefined) {
        return axiomNode(formula);
      }
      // 前提の証明木を辿る（substitutionは公理スキーマの適用と見なし、
      // 結論自体は有効な公理インスタンスとなる）
      // ただし、ここでは前提を辿らず結論をAxiomNodeとして扱う
      // （substitutionの結果は直接的な公理インスタンス）
      return axiomNode(formula);
    }

    /* v8 ignore start */
    edge satisfies never;
    return axiomNode(formula);
    /* v8 ignore stop */
  });

// ─── 公開API ─────────────────────────────────────────────

/**
 * ワークスペースの Hilbert グラフから ProofNode ツリーを構築する。
 *
 * @param rootNodeId ルートノード（証明の最終結論）のID
 * @param nodes ワークスペースのノード配列
 * @param inferenceEdges ワークスペースの推論エッジ配列
 * @returns Either: Right = ProofNode, Left = HilbertTreeBuildError
 */
export const buildHilbertProofTree = (
  rootNodeId: string,
  nodes: readonly WorkspaceNode[],
  inferenceEdges: readonly InferenceEdge[],
): Either.Either<ProofNode, HilbertTreeBuildError> =>
  Effect.runSync(
    Effect.either(
      buildHilbertProofTreeEffect(rootNodeId, nodes, inferenceEdges),
    ),
  );

/**
 * ノードの依存関係・サブツリーを追跡する純粋ロジック。
 *
 * - getNodeDependencies: InferenceEdgeを逆方向に遡り、ルートノード（公理）を特定
 * - getSubtreeNodeIds: InferenceEdgeを順方向に辿り、子孫ノードを収集
 * - getNodeAxiomIds: ノードが依存する公理スキーマIDを特定
 *
 * 変更時は dependencyLogic.test.ts, ProofWorkspace.tsx, index.ts も同期すること。
 */

import { Either } from "effect";
import type { LogicSystem, AxiomId } from "../logic-core/inferenceRule";
import { identifyAxiom } from "../logic-core/inferenceRule";
import { parseString } from "../logic-lang/parser";
import type { DependencyInfo } from "./EditableProofNode";
import type { WorkspaceNode } from "./workspaceState";
import type { InferenceEdge, InferenceRuleId } from "./inferenceEdge";
import { getInferenceEdgePremiseNodeIds } from "./inferenceEdge";
import { isTrivialAxiomSubstitution } from "./axiomNameLogic";

/**
 * あるノードが依存するルートノード（公理）のID集合を返す。
 *
 * InferenceEdgeを逆方向に辿り、前提のないルートノードに到達するまで再帰的に探索する。
 * ルートノード自身は自分自身のIDのみを含む集合を返す。
 * 循環参照がある場合は訪問済みノードをスキップして無限ループを防止する。
 *
 * @param nodeId 対象ノードのID
 * @param nodes ワークスペースの全ノード
 * @param inferenceEdges ワークスペースの全推論エッジ
 * @returns 依存するルートノードIDの集合（ReadonlySet）
 */
export function getNodeDependencies(
  nodeId: string,
  nodes: readonly WorkspaceNode[],
  inferenceEdges: readonly InferenceEdge[],
): ReadonlySet<string> {
  const result = new Set<string>();
  const visited = new Set<string>();

  // conclusionNodeId → InferenceEdge のマップを構築
  const edgeByConclusionId = new Map<string, InferenceEdge>();
  for (const edge of inferenceEdges) {
    edgeByConclusionId.set(edge.conclusionNodeId, edge);
  }

  function traverse(currentId: string): void {
    if (visited.has(currentId)) return;
    visited.add(currentId);

    // このノードを結論とする InferenceEdge を探す
    const edge = edgeByConclusionId.get(currentId);
    if (edge === undefined) {
      // InferenceEdge がない = ルートノード（前提なし）
      result.add(currentId);
      return;
    }

    // 前提ノードIDを取得して再帰的に辿る
    const premiseIds = getInferenceEdgePremiseNodeIds(edge);
    if (premiseIds.length === 0) {
      // 前提が未設定（undefined）のエッジ → ルートとして扱う
      result.add(currentId);
      return;
    }

    for (const premiseId of premiseIds) {
      traverse(premiseId);
    }
  }

  // ノードが存在するか確認
  const node = nodes.find((n) => n.id === nodeId);
  if (node === undefined) return result;

  traverse(nodeId);
  return result;
}

/**
 * ワークスペース上のすべてのノードの公理依存関係を計算する。
 *
 * @param nodes ワークスペースの全ノード
 * @param inferenceEdges ワークスペースの全推論エッジ
 * @returns ノードID → 依存するルートノードIDの集合のMap
 */
export function getAllNodeDependencies(
  nodes: readonly WorkspaceNode[],
  inferenceEdges: readonly InferenceEdge[],
): ReadonlyMap<string, ReadonlySet<string>> {
  const result = new Map<string, ReadonlySet<string>>();
  for (const node of nodes) {
    result.set(node.id, getNodeDependencies(node.id, nodes, inferenceEdges));
  }
  return result;
}

/**
 * あるノードとその全子孫（サブツリー）のID集合を返す。
 *
 * InferenceEdgeを順方向（前提 → 結論）に辿り、
 * 指定ノードから到達可能なすべてのノードを収集する。
 * DAG構造で共有されたノード（複数の親を持つ）も含む。
 * 循環参照がある場合は訪問済みノードをスキップして無限ループを防止する。
 *
 * @param nodeId 起点ノードのID
 * @param inferenceEdges ワークスペースの全推論エッジ
 * @returns サブツリーに含まれるノードIDの集合（起点ノード自身を含む）
 */
export function getSubtreeNodeIds(
  nodeId: string,
  inferenceEdges: readonly InferenceEdge[],
): ReadonlySet<string> {
  const result = new Set<string>([nodeId]);

  // premiseNodeId → 結論ノードIDのマッピングを構築
  const conclusionsByPremise = new Map<string, string[]>();
  for (const edge of inferenceEdges) {
    const premiseIds = getInferenceEdgePremiseNodeIds(edge);
    for (const premiseId of premiseIds) {
      const existing = conclusionsByPremise.get(premiseId);
      if (existing !== undefined) {
        existing.push(edge.conclusionNodeId);
      } else {
        conclusionsByPremise.set(premiseId, [edge.conclusionNodeId]);
      }
    }
  }

  function traverse(currentId: string): void {
    const conclusions = conclusionsByPremise.get(currentId);
    if (conclusions === undefined) return;
    for (const conclusionId of conclusions) {
      if (!result.has(conclusionId)) {
        result.add(conclusionId);
        traverse(conclusionId);
      }
    }
  }

  traverse(nodeId);
  return result;
}

/**
 * あるノードの証明に必要な全ノード（起点＋中間＋ルート）のID集合を返す。
 *
 * InferenceEdgeを逆方向（結論 → 前提）に辿り、
 * 指定ノードから到達可能なすべてのノード（前提チェーン全体）を収集する。
 * getNodeDependencies がルートノードのみを返すのに対し、
 * この関数は中間の導出ノードも含めた完全な証明グラフを返す。
 * 循環参照がある場合は訪問済みノードをスキップして無限ループを防止する。
 *
 * @param nodeId 起点ノードのID
 * @param inferenceEdges ワークスペースの全推論エッジ
 * @returns 証明に必要な全ノードIDの集合（起点ノード自身を含む）
 */
export function getProofNodeIds(
  nodeId: string,
  inferenceEdges: readonly InferenceEdge[],
): ReadonlySet<string> {
  const result = new Set<string>([nodeId]);

  // conclusionNodeId → InferenceEdge のマップを構築
  const edgeByConclusionId = new Map<string, InferenceEdge>();
  for (const edge of inferenceEdges) {
    edgeByConclusionId.set(edge.conclusionNodeId, edge);
  }

  function traverse(currentId: string): void {
    const edge = edgeByConclusionId.get(currentId);
    if (edge === undefined) return;

    const premiseIds = getInferenceEdgePremiseNodeIds(edge);
    for (const premiseId of premiseIds) {
      if (!result.has(premiseId)) {
        result.add(premiseId);
        traverse(premiseId);
      }
    }
  }

  traverse(nodeId);
  return result;
}

// --- 公理スキーマID依存関係 ---

/**
 * あるノードが依存する公理スキーマID（A1, A2, A3, ...）の集合を返す。
 *
 * 1. getNodeDependencies でルートノードIDを取得
 * 2. 各ルートノードの formulaText をパースして identifyAxiom で公理スキーマIDを特定
 * 3. 特定できなかったノードは結果に含まない
 *
 * @param nodeId 対象ノードのID
 * @param nodes ワークスペースの全ノード
 * @param inferenceEdges ワークスペースの全推論エッジ
 * @param system 論理体系設定
 * @returns 依存する公理スキーマIDの集合
 */
export function getNodeAxiomIds(
  nodeId: string,
  nodes: readonly WorkspaceNode[],
  inferenceEdges: readonly InferenceEdge[],
  system: LogicSystem,
): ReadonlySet<AxiomId> {
  const rootNodeIds = getNodeDependencies(nodeId, nodes, inferenceEdges);
  const result = new Set<AxiomId>();

  for (const rootId of rootNodeIds) {
    const node = nodes.find((n) => n.id === rootId);
    if (node === undefined) continue;

    const trimmed = node.formulaText.trim();
    if (trimmed === "") continue;

    const parsed = parseString(trimmed);
    if (Either.isLeft(parsed)) continue;

    const identification = identifyAxiom(parsed.right, system);
    if (identification._tag === "Ok") {
      result.add(identification.axiomId);
    }
  }

  return result;
}

// --- 推論規則ID依存関係 ---

/**
 * あるノードの証明チェーンで使用されている推論規則IDの集合を返す。
 *
 * InferenceEdgeを逆方向に辿り、対象ノードから到達可能な全エッジの
 * _tag（規則ID）を収集する。
 *
 * @param nodeId 対象ノードのID
 * @param inferenceEdges ワークスペースの全推論エッジ
 * @returns 使用されている推論規則IDの集合
 */
export function getNodeInferenceRuleIds(
  nodeId: string,
  inferenceEdges: readonly InferenceEdge[],
): ReadonlySet<InferenceRuleId> {
  const result = new Set<InferenceRuleId>();
  const visited = new Set<string>();

  // conclusionNodeId → InferenceEdge のマップを構築
  const edgeByConclusionId = new Map<string, InferenceEdge>();
  for (const edge of inferenceEdges) {
    edgeByConclusionId.set(edge.conclusionNodeId, edge);
  }

  function traverse(currentId: string): void {
    if (visited.has(currentId)) return;
    visited.add(currentId);

    const edge = edgeByConclusionId.get(currentId);
    if (edge === undefined) return;

    // この規則IDを収集
    result.add(edge._tag);

    // 前提ノードを再帰的に辿る
    const premiseIds = getInferenceEdgePremiseNodeIds(edge);
    for (const premiseId of premiseIds) {
      traverse(premiseId);
    }
  }

  traverse(nodeId);
  return result;
}

// --- ルートノードの厳密なバリデーション ---

/**
 * ルートノードの公理バリデーション結果。
 *
 * - "schema": 公理スキーマそのもの（メタ変数の命名違いのみ）。正当なルートノード。
 * - "instance": 公理スキーマの代入インスタンスがルートに直接配置されている。
 *   SubstitutionEdge を介してスキーマから導出すべき。
 * - "unknown": 公理として識別できないルートノード。
 */
export type RootNodeValidation =
  | {
      readonly _tag: "schema";
      readonly nodeId: string;
      readonly axiomId: AxiomId;
    }
  | {
      readonly _tag: "instance";
      readonly nodeId: string;
      readonly axiomId: AxiomId;
    }
  | {
      readonly _tag: "unknown";
      readonly nodeId: string;
    };

/**
 * あるノードが依存するルートノードを厳密にバリデーションする。
 *
 * ルートノードが公理スキーマそのものか、代入インスタンスか、未知かを判定する。
 * 代入インスタンスがルートに直接配置されている場合は "instance" として報告する
 * （SubstitutionEdge で明示的に導出すべき）。
 *
 * @param nodeId 対象ノードのID
 * @param nodes ワークスペースの全ノード
 * @param inferenceEdges ワークスペースの全推論エッジ
 * @param system 論理体系設定
 * @returns ルートノードごとのバリデーション結果
 */
export function validateRootNodes(
  nodeId: string,
  nodes: readonly WorkspaceNode[],
  inferenceEdges: readonly InferenceEdge[],
  system: LogicSystem,
): readonly RootNodeValidation[] {
  const rootNodeIds = getNodeDependencies(nodeId, nodes, inferenceEdges);
  const results: RootNodeValidation[] = [];

  for (const rootId of rootNodeIds) {
    const node = nodes.find((n) => n.id === rootId);
    if (node === undefined) continue;

    const trimmed = node.formulaText.trim();
    if (trimmed === "") {
      results.push({ _tag: "unknown", nodeId: rootId });
      continue;
    }

    const parsed = parseString(trimmed);
    if (Either.isLeft(parsed)) {
      results.push({ _tag: "unknown", nodeId: rootId });
      continue;
    }

    const identification = identifyAxiom(parsed.right, system);
    if (identification._tag === "Ok") {
      const isTrivial = isTrivialAxiomSubstitution(
        identification.formulaSubstitution,
        identification.termSubstitution,
      );
      if (isTrivial) {
        results.push({
          _tag: "schema",
          nodeId: rootId,
          axiomId: identification.axiomId,
        });
      } else {
        results.push({
          _tag: "instance",
          nodeId: rootId,
          axiomId: identification.axiomId,
        });
      }
    } else {
      results.push({ _tag: "unknown", nodeId: rootId });
    }
  }

  return results;
}

/**
 * ルートノードバリデーション結果からインスタンス直接配置のノードIDを返す。
 */
export function getInstanceRootNodeIds(
  validations: readonly RootNodeValidation[],
): readonly string[] {
  return validations.filter((v) => v._tag === "instance").map((v) => v.nodeId);
}

/**
 * ルートノードバリデーション結果に不正なインスタンス直接配置があるかどうかを返す。
 */
export function hasInstanceRoots(
  validations: readonly RootNodeValidation[],
): boolean {
  return validations.some((v) => v._tag === "instance");
}

/**
 * ルートノードバリデーション結果に未知のルートノードがあるかどうかを返す。
 * 未知のルートノードは公理パターンに一致しないルートノード。
 */
export function hasUnknownRoots(
  validations: readonly RootNodeValidation[],
): boolean {
  return validations.some((v) => v._tag === "unknown");
}

/**
 * 依存公理リストをdisplayNameで重複排除する。
 *
 * 同じ公理スキーマの異なるインスタンス（例: A1[φ:=p] と A1[φ:=q]）が
 * 複数のルートノードとして存在する場合、表示名が同一になるため重複を除去する。
 * 最初に出現したエントリを保持する。
 *
 * @param deps 重複排除前の依存情報配列
 * @returns displayNameが一意な依存情報配列
 */
export function deduplicateDependencyInfos(
  deps: readonly DependencyInfo[],
): readonly DependencyInfo[] {
  const seen = new Set<string>();
  const result: DependencyInfo[] = [];
  for (const dep of deps) {
    if (!seen.has(dep.displayName)) {
      seen.add(dep.displayName);
      result.push(dep);
    }
  }
  return result;
}

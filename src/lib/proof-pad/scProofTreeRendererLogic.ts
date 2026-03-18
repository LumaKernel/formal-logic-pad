/**
 * SC証明木のGentzenスタイルレンダリング用純粋ロジック。
 *
 * ScProofNode（ネスト構造）を受け取り、表示用のフラットなデータ構造に変換する。
 *
 * 変更時は scProofTreeRendererLogic.test.ts, ScProofTreePanel.tsx, index.ts も同期すること。
 */

import type { Sequent } from "../logic-core/sequentCalculus";
import type { ScProofNode } from "../logic-core/sequentCalculus";
import { getScConclusion } from "../logic-core/sequentCalculus";
import { formatSequentText } from "./cutEliminationStepperLogic";

// --- SC規則のGentzenスタイルラベル ---

/**
 * ScProofNodeの_tagからGentzen証明木で使う規則ラベルに変換する。
 * Unicode記号を使用。
 */
export function getScRuleLabel(tag: ScProofNode["_tag"]): string {
  if (tag === "ScIdentity") return "Id";
  if (tag === "ScBottomLeft") return "⊥L";
  if (tag === "ScCut") return "Cut";
  if (tag === "ScWeakeningLeft") return "WL";
  if (tag === "ScWeakeningRight") return "WR";
  if (tag === "ScContractionLeft") return "CL";
  if (tag === "ScContractionRight") return "CR";
  if (tag === "ScExchangeLeft") return "XL";
  if (tag === "ScExchangeRight") return "XR";
  if (tag === "ScImplicationLeft") return "→L";
  if (tag === "ScImplicationRight") return "→R";
  if (tag === "ScConjunctionLeft") return "∧L";
  if (tag === "ScConjunctionRight") return "∧R";
  if (tag === "ScDisjunctionLeft") return "∨L";
  if (tag === "ScDisjunctionRight") return "∨R";
  if (tag === "ScNegationLeft") return "¬L";
  if (tag === "ScNegationRight") return "¬R";
  if (tag === "ScUniversalLeft") return "∀L";
  if (tag === "ScUniversalRight") return "∀R";
  if (tag === "ScExistentialLeft") return "∃L";
  return "∃R";
}

// --- 証明木表示用データ構造 ---

/** Gentzenスタイル証明木の1ノード */
export type ProofTreeDisplayNode = {
  /** ユニークID */
  readonly id: string;
  /** 結論シーケントのフォーマット済みテキスト */
  readonly conclusionText: string;
  /** 結論シーケントのSequentオブジェクト（SC証明木のSequentDisplay用、NDでは未設定） */
  readonly conclusionSequent?: Sequent;
  /** 規則ラベル（例: "→R", "Id"） */
  readonly ruleLabel: string;
  /** 前提ノードのID配列（0=公理, 1=単項規則, 2=二項規則） */
  readonly premiseIds: readonly string[];
  /** ツリーの深さ（ルートが0） */
  readonly depth: number;
};

/** 証明木全体の表示データ */
export type ProofTreeDisplayData = {
  /** ルートノードID */
  readonly rootId: string;
  /** 全ノード（idでアクセス可能） */
  readonly nodes: ReadonlyMap<string, ProofTreeDisplayNode>;
};

// --- ScProofNode → 表示データ変換 ---

/**
 * ScProofNodeの前提ノードを配列で取得する。
 * 公理ノード（前提なし）は空配列、単項規則は1要素、二項規則は2要素。
 */
function getPremises(node: ScProofNode): readonly ScProofNode[] {
  if (node._tag === "ScIdentity") return [];
  if (node._tag === "ScBottomLeft") return [];
  if (node._tag === "ScCut") return [node.left, node.right];
  if (node._tag === "ScImplicationLeft") return [node.left, node.right];
  if (node._tag === "ScConjunctionRight") return [node.left, node.right];
  if (node._tag === "ScDisjunctionLeft") return [node.left, node.right];
  // 残りは全て単項規則（premise を持つ）
  return [node.premise];
}

/**
 * ScProofNode をGentzenスタイル証明木の表示データに変換する。
 */
export function convertScProofTreeToDisplay(
  proof: ScProofNode,
): ProofTreeDisplayData {
  const nodes = new Map<string, ProofTreeDisplayNode>();
  let nextId = 0;

  function traverse(node: ScProofNode, depth: number): string {
    const id = `sctree-${String(nextId++) satisfies string}`;
    const premises = getPremises(node);
    const premiseIds = premises.map((p) => traverse(p, depth + 1));

    const conclusionSequent = getScConclusion(node);
    nodes.set(id, {
      id,
      conclusionText: formatSequentText(conclusionSequent),
      conclusionSequent,
      ruleLabel: getScRuleLabel(node._tag),
      premiseIds,
      depth,
    });

    return id;
  }

  const rootId = traverse(proof, 0);
  return { rootId, nodes };
}

// --- ツリー統計 ---

/** 証明木の統計情報 */
export type ProofTreeStats = {
  /** 総ノード数 */
  readonly totalNodes: number;
  /** 最大深さ */
  readonly maxDepth: number;
  /** 使用されている規則の種類 */
  readonly usedRules: readonly string[];
};

/**
 * 証明木の統計情報を計算する。
 */
export function computeProofTreeStats(
  data: ProofTreeDisplayData,
): ProofTreeStats {
  let maxDepth = 0;
  const usedRulesSet = new Set<string>();

  for (const node of data.nodes.values()) {
    if (node.depth > maxDepth) maxDepth = node.depth;
    usedRulesSet.add(node.ruleLabel);
  }

  return {
    totalNodes: data.nodes.size,
    maxDepth,
    usedRules: [...usedRulesSet].sort(),
  };
}

/**
 * 推論エッジの型定義とユーティリティ。
 *
 * 推論規則をノードではなくエッジとして表現するデータモデル。
 * InferenceEdgeはWorkspaceState.inferenceEdgesに直接保持され、
 * ノードの種別（ProofNodeKind）からは独立して管理される。
 *
 * Hilbert系: MP, Gen, Substitution
 * 自然演繹(ND): →I, →E, ∧I, ∧E_L, ∧E_R, ∨I_L, ∨I_R, ∨E, w, EFQ, DNE
 *
 * 変更時は inferenceEdge.test.ts も同期すること。
 * InferenceEdge union型のメンバー追加時は以下のswitch文すべてを更新:
 *   - inferenceEdge.ts の各ユーティリティ関数
 *   - inferenceEdgeLabelLogic.ts の getInferenceEdgeBadgeColor
 *   - edgeBadgeEditLogic.ts の createEditStateFromEdge
 *   - mergeNodesLogic.ts の replaceNodeIdInInferenceEdge
 *   - copyPasteLogic.ts の remapInferenceEdges
 *   - workspaceState.ts の revalidateInferenceConclusions
 */

import type { SubstitutionEntries } from "./substitutionApplicationLogic";
import type { AssumptionId } from "../logic-core/naturalDeduction";

// ─── Hilbert系 推論エッジ型 ─────────────────────────────────

/**
 * Modus Ponens エッジ。
 * 2つの前提ノード（antecedent + conditional）から結論ノードへの関係。
 */
export type MPEdge = {
  readonly _tag: "mp";
  /** 結論ノードのID（derivedノード） */
  readonly conclusionNodeId: string;
  /** antecedent（φ）のノードID */
  readonly leftPremiseNodeId: string | undefined;
  /** conditional（φ→ψ）のノードID */
  readonly rightPremiseNodeId: string | undefined;
  /** 結論の論理式テキスト */
  readonly conclusionText: string;
};

/**
 * Generalization エッジ。
 * 1つの前提ノードから ∀x.φ を導出する関係。
 */
export type GenEdge = {
  readonly _tag: "gen";
  /** 結論ノードのID（derivedノード） */
  readonly conclusionNodeId: string;
  /** 前提（φ）のノードID */
  readonly premiseNodeId: string | undefined;
  /** 量化変数名 */
  readonly variableName: string;
  /** 結論の論理式テキスト */
  readonly conclusionText: string;
};

/**
 * Substitution エッジ。
 * 1つの前提ノードにメタ変数代入を適用する関係。
 */
export type SubstitutionEdge = {
  readonly _tag: "substitution";
  /** 結論ノードのID（derivedノード） */
  readonly conclusionNodeId: string;
  /** 前提のノードID */
  readonly premiseNodeId: string | undefined;
  /** 代入エントリリスト */
  readonly entries: SubstitutionEntries;
  /** 結論の論理式テキスト */
  readonly conclusionText: string;
};

/** Hilbert系推論エッジのunion型 */
export type HilbertInferenceEdge = MPEdge | GenEdge | SubstitutionEdge;

// ─── 自然演繹(ND) 推論エッジ型 ─────────────────────────────

/**
 * ND →導入 (→I) エッジ。
 * 仮定φの下でψが証明されたとき、φ→ψを導出し仮定を打ち消す。
 * 1前提 + discharged仮定情報。
 */
export type NdImplicationIntroEdge = {
  readonly _tag: "nd-implication-intro";
  readonly conclusionNodeId: string;
  /** ψを証明する前提ノードのID */
  readonly premiseNodeId: string | undefined;
  /** 打ち消す仮定の論理式テキスト */
  readonly dischargedFormulaText: string;
  /** 打ち消す仮定のID */
  readonly dischargedAssumptionId: AssumptionId;
  readonly conclusionText: string;
};

/**
 * ND →除去 (→E) エッジ。
 * φ と φ→ψ から ψ を導出する。（MPと同等）
 * 2前提。
 */
export type NdImplicationElimEdge = {
  readonly _tag: "nd-implication-elim";
  readonly conclusionNodeId: string;
  /** antecedent（φ）のノードID */
  readonly leftPremiseNodeId: string | undefined;
  /** conditional（φ→ψ）のノードID */
  readonly rightPremiseNodeId: string | undefined;
  readonly conclusionText: string;
};

/**
 * ND ∧導入 (∧I) エッジ。
 * φ と ψ から φ∧ψ を導出する。
 * 2前提。
 */
export type NdConjunctionIntroEdge = {
  readonly _tag: "nd-conjunction-intro";
  readonly conclusionNodeId: string;
  /** 左辺（φ）のノードID */
  readonly leftPremiseNodeId: string | undefined;
  /** 右辺（ψ）のノードID */
  readonly rightPremiseNodeId: string | undefined;
  readonly conclusionText: string;
};

/**
 * ND ∧除去左 (∧E_L) エッジ。
 * φ∧ψ から φ を導出する。
 * 1前提。
 */
export type NdConjunctionElimLeftEdge = {
  readonly _tag: "nd-conjunction-elim-left";
  readonly conclusionNodeId: string;
  /** 前提（φ∧ψ）のノードID */
  readonly premiseNodeId: string | undefined;
  readonly conclusionText: string;
};

/**
 * ND ∧除去右 (∧E_R) エッジ。
 * φ∧ψ から ψ を導出する。
 * 1前提。
 */
export type NdConjunctionElimRightEdge = {
  readonly _tag: "nd-conjunction-elim-right";
  readonly conclusionNodeId: string;
  /** 前提（φ∧ψ）のノードID */
  readonly premiseNodeId: string | undefined;
  readonly conclusionText: string;
};

/**
 * ND ∨導入左 (∨I_L) エッジ。
 * φ から φ∨ψ を導出する。
 * 1前提 + 追加する右辺の論理式テキスト。
 */
export type NdDisjunctionIntroLeftEdge = {
  readonly _tag: "nd-disjunction-intro-left";
  readonly conclusionNodeId: string;
  /** 前提（φ）のノードID */
  readonly premiseNodeId: string | undefined;
  /** 追加する右辺の論理式テキスト */
  readonly addedRightText: string;
  readonly conclusionText: string;
};

/**
 * ND ∨導入右 (∨I_R) エッジ。
 * ψ から φ∨ψ を導出する。
 * 1前提 + 追加する左辺の論理式テキスト。
 */
export type NdDisjunctionIntroRightEdge = {
  readonly _tag: "nd-disjunction-intro-right";
  readonly conclusionNodeId: string;
  /** 前提（ψ）のノードID */
  readonly premiseNodeId: string | undefined;
  /** 追加する左辺の論理式テキスト */
  readonly addedLeftText: string;
  readonly conclusionText: string;
};

/**
 * ND ∨除去 (∨E) エッジ。
 * φ∨ψ と、φからχの証明、ψからχの証明から、χを導出する。
 * 3前提 + 2つのdischarged仮定。
 */
export type NdDisjunctionElimEdge = {
  readonly _tag: "nd-disjunction-elim";
  readonly conclusionNodeId: string;
  /** 前提: φ∨ψ のノードID */
  readonly disjunctionPremiseNodeId: string | undefined;
  /** 前提: φからχの証明のノードID */
  readonly leftCasePremiseNodeId: string | undefined;
  /** 打ち消す左仮定のID */
  readonly leftDischargedAssumptionId: AssumptionId;
  /** 前提: ψからχの証明のノードID */
  readonly rightCasePremiseNodeId: string | undefined;
  /** 打ち消す右仮定のID */
  readonly rightDischargedAssumptionId: AssumptionId;
  readonly conclusionText: string;
};

/**
 * ND 弱化 (w) エッジ。
 * φ と ψ から φ を導出する（ψを捨てる）。
 * 2前提。
 */
export type NdWeakeningEdge = {
  readonly _tag: "nd-weakening";
  readonly conclusionNodeId: string;
  /** 残す方の前提ノードID */
  readonly keptPremiseNodeId: string | undefined;
  /** 捨てる方の前提ノードID */
  readonly discardedPremiseNodeId: string | undefined;
  readonly conclusionText: string;
};

/**
 * ND EFQ (爆発律) エッジ。
 * ⊥ から任意のφを導出する。NJの追加規則。
 * 1前提。
 */
export type NdEfqEdge = {
  readonly _tag: "nd-efq";
  readonly conclusionNodeId: string;
  /** 前提（⊥の証明）のノードID */
  readonly premiseNodeId: string | undefined;
  readonly conclusionText: string;
};

/**
 * ND DNE (二重否定除去) エッジ。
 * ¬¬φ から φ を導出する。NKの追加規則。
 * 1前提。
 */
export type NdDneEdge = {
  readonly _tag: "nd-dne";
  readonly conclusionNodeId: string;
  /** 前提（¬¬φ）のノードID */
  readonly premiseNodeId: string | undefined;
  readonly conclusionText: string;
};

/** ND推論エッジのunion型 */
export type NdInferenceEdge =
  | NdImplicationIntroEdge
  | NdImplicationElimEdge
  | NdConjunctionIntroEdge
  | NdConjunctionElimLeftEdge
  | NdConjunctionElimRightEdge
  | NdDisjunctionIntroLeftEdge
  | NdDisjunctionIntroRightEdge
  | NdDisjunctionElimEdge
  | NdWeakeningEdge
  | NdEfqEdge
  | NdDneEdge;

// ─── 統合union型 ─────────────────────────────────────────

/** 推論エッジの union 型（Hilbert系 + ND） */
export type InferenceEdge = HilbertInferenceEdge | NdInferenceEdge;

// ─── 判別ヘルパー ────────────────────────────────────────

/** Hilbert系のエッジかどうかを判定する */
export function isHilbertInferenceEdge(edge: InferenceEdge) {
  return (
    edge._tag === "mp" || edge._tag === "gen" || edge._tag === "substitution"
  );
}

/** NDのエッジかどうかを判定する */
export function isNdInferenceEdge(edge: InferenceEdge) {
  return (
    edge._tag === "nd-implication-intro" ||
    edge._tag === "nd-implication-elim" ||
    edge._tag === "nd-conjunction-intro" ||
    edge._tag === "nd-conjunction-elim-left" ||
    edge._tag === "nd-conjunction-elim-right" ||
    edge._tag === "nd-disjunction-intro-left" ||
    edge._tag === "nd-disjunction-intro-right" ||
    edge._tag === "nd-disjunction-elim" ||
    edge._tag === "nd-weakening" ||
    edge._tag === "nd-efq" ||
    edge._tag === "nd-dne"
  );
}

// ─── ユーティリティ ──────────────────────────────────────

/**
 * 指定ノードIDに関連する推論エッジを検索する。
 * ノードが前提として使われている推論エッジ、または
 * ノード自身が結論ノードである場合のエッジを返す。
 */
export function findInferenceEdgesForNode(
  edges: readonly InferenceEdge[],
  nodeId: string,
): readonly InferenceEdge[] {
  return edges.filter((edge) => {
    // 結論ノード自身
    if (edge.conclusionNodeId === nodeId) return true;

    // 前提として使われている
    return getInferenceEdgePremiseNodeIds(edge).includes(nodeId);
  });
}

/**
 * 推論エッジから結論ノードIDを取得する。
 */
export function getInferenceEdgeConclusionNodeId(edge: InferenceEdge): string {
  return edge.conclusionNodeId;
}

/**
 * 推論エッジの表示ラベル（規則名）を返す。
 */
export function getInferenceEdgeLabel(edge: InferenceEdge): string {
  switch (edge._tag) {
    // Hilbert系
    case "mp":
      return "MP";
    case "gen":
      return edge.variableName !== ""
        ? `Gen(${edge.variableName satisfies string})`
        : "Gen";
    case "substitution":
      return edge.entries.length > 0
        ? `Subst(${String(edge.entries.length) satisfies string})`
        : "Subst";
    // ND
    case "nd-implication-intro":
      return "→I";
    case "nd-implication-elim":
      return "→E";
    case "nd-conjunction-intro":
      return "∧I";
    case "nd-conjunction-elim-left":
      return "∧E_L";
    case "nd-conjunction-elim-right":
      return "∧E_R";
    case "nd-disjunction-intro-left":
      return "∨I_L";
    case "nd-disjunction-intro-right":
      return "∨I_R";
    case "nd-disjunction-elim":
      return "∨E";
    case "nd-weakening":
      return "w";
    case "nd-efq":
      return "EFQ";
    case "nd-dne":
      return "DNE";
  }
}

/**
 * 接続先ノードIDに対応する推論エッジを検索する。
 * 結論ノードIDが一致するエッジを返す。
 */
export function findInferenceEdgeForConclusionNode(
  edges: readonly InferenceEdge[],
  conclusionNodeId: string,
): InferenceEdge | undefined {
  return edges.find((e) => e.conclusionNodeId === conclusionNodeId);
}

/**
 * 推論エッジの前提ノードIDを全て取得する。
 * undefinedの前提は除外する。
 */
export function getInferenceEdgePremiseNodeIds(
  edge: InferenceEdge,
): readonly string[] {
  switch (edge._tag) {
    // Hilbert系
    case "mp": {
      const ids: string[] = [];
      if (edge.leftPremiseNodeId !== undefined) {
        ids.push(edge.leftPremiseNodeId);
      }
      if (edge.rightPremiseNodeId !== undefined) {
        ids.push(edge.rightPremiseNodeId);
      }
      return ids;
    }
    case "gen":
      return edge.premiseNodeId !== undefined ? [edge.premiseNodeId] : [];
    case "substitution":
      return edge.premiseNodeId !== undefined ? [edge.premiseNodeId] : [];
    // ND 1前提系
    case "nd-implication-intro":
      return edge.premiseNodeId !== undefined ? [edge.premiseNodeId] : [];
    case "nd-conjunction-elim-left":
      return edge.premiseNodeId !== undefined ? [edge.premiseNodeId] : [];
    case "nd-conjunction-elim-right":
      return edge.premiseNodeId !== undefined ? [edge.premiseNodeId] : [];
    case "nd-disjunction-intro-left":
      return edge.premiseNodeId !== undefined ? [edge.premiseNodeId] : [];
    case "nd-disjunction-intro-right":
      return edge.premiseNodeId !== undefined ? [edge.premiseNodeId] : [];
    case "nd-efq":
      return edge.premiseNodeId !== undefined ? [edge.premiseNodeId] : [];
    case "nd-dne":
      return edge.premiseNodeId !== undefined ? [edge.premiseNodeId] : [];
    // ND 2前提系
    case "nd-implication-elim": {
      const ids: string[] = [];
      if (edge.leftPremiseNodeId !== undefined) {
        ids.push(edge.leftPremiseNodeId);
      }
      if (edge.rightPremiseNodeId !== undefined) {
        ids.push(edge.rightPremiseNodeId);
      }
      return ids;
    }
    case "nd-conjunction-intro": {
      const ids: string[] = [];
      if (edge.leftPremiseNodeId !== undefined) {
        ids.push(edge.leftPremiseNodeId);
      }
      if (edge.rightPremiseNodeId !== undefined) {
        ids.push(edge.rightPremiseNodeId);
      }
      return ids;
    }
    case "nd-weakening": {
      const ids: string[] = [];
      if (edge.keptPremiseNodeId !== undefined) {
        ids.push(edge.keptPremiseNodeId);
      }
      if (edge.discardedPremiseNodeId !== undefined) {
        ids.push(edge.discardedPremiseNodeId);
      }
      return ids;
    }
    // ND 3前提系
    case "nd-disjunction-elim": {
      const ids: string[] = [];
      if (edge.disjunctionPremiseNodeId !== undefined) {
        ids.push(edge.disjunctionPremiseNodeId);
      }
      if (edge.leftCasePremiseNodeId !== undefined) {
        ids.push(edge.leftCasePremiseNodeId);
      }
      if (edge.rightCasePremiseNodeId !== undefined) {
        ids.push(edge.rightCasePremiseNodeId);
      }
      return ids;
    }
  }
}

/**
 * 推論エッジ内の全ノードIDをマッピング関数で置換する。
 * conclusionNodeIdと全前提ノードIDに対してmapFnを適用する。
 * mapFnがundefinedを返した場合はそのIDのフィールドにはundefinedが設定される。
 */
export function remapEdgeNodeIds(
  edge: InferenceEdge,
  mapFn: (id: string) => string | undefined,
): InferenceEdge {
  const mapRequired = (id: string): string => mapFn(id) ?? id;
  const mapOpt = (id: string | undefined): string | undefined =>
    id !== undefined ? mapFn(id) : undefined;

  switch (edge._tag) {
    // Hilbert系
    case "mp":
      return {
        ...edge,
        conclusionNodeId: mapRequired(edge.conclusionNodeId),
        leftPremiseNodeId: mapOpt(edge.leftPremiseNodeId),
        rightPremiseNodeId: mapOpt(edge.rightPremiseNodeId),
      };
    case "gen":
      return {
        ...edge,
        conclusionNodeId: mapRequired(edge.conclusionNodeId),
        premiseNodeId: mapOpt(edge.premiseNodeId),
      };
    case "substitution":
      return {
        ...edge,
        conclusionNodeId: mapRequired(edge.conclusionNodeId),
        premiseNodeId: mapOpt(edge.premiseNodeId),
      };
    // ND 1前提系
    case "nd-implication-intro":
      return {
        ...edge,
        conclusionNodeId: mapRequired(edge.conclusionNodeId),
        premiseNodeId: mapOpt(edge.premiseNodeId),
      };
    case "nd-conjunction-elim-left":
      return {
        ...edge,
        conclusionNodeId: mapRequired(edge.conclusionNodeId),
        premiseNodeId: mapOpt(edge.premiseNodeId),
      };
    case "nd-conjunction-elim-right":
      return {
        ...edge,
        conclusionNodeId: mapRequired(edge.conclusionNodeId),
        premiseNodeId: mapOpt(edge.premiseNodeId),
      };
    case "nd-disjunction-intro-left":
      return {
        ...edge,
        conclusionNodeId: mapRequired(edge.conclusionNodeId),
        premiseNodeId: mapOpt(edge.premiseNodeId),
      };
    case "nd-disjunction-intro-right":
      return {
        ...edge,
        conclusionNodeId: mapRequired(edge.conclusionNodeId),
        premiseNodeId: mapOpt(edge.premiseNodeId),
      };
    case "nd-efq":
      return {
        ...edge,
        conclusionNodeId: mapRequired(edge.conclusionNodeId),
        premiseNodeId: mapOpt(edge.premiseNodeId),
      };
    case "nd-dne":
      return {
        ...edge,
        conclusionNodeId: mapRequired(edge.conclusionNodeId),
        premiseNodeId: mapOpt(edge.premiseNodeId),
      };
    // ND 2前提系
    case "nd-implication-elim":
      return {
        ...edge,
        conclusionNodeId: mapRequired(edge.conclusionNodeId),
        leftPremiseNodeId: mapOpt(edge.leftPremiseNodeId),
        rightPremiseNodeId: mapOpt(edge.rightPremiseNodeId),
      };
    case "nd-conjunction-intro":
      return {
        ...edge,
        conclusionNodeId: mapRequired(edge.conclusionNodeId),
        leftPremiseNodeId: mapOpt(edge.leftPremiseNodeId),
        rightPremiseNodeId: mapOpt(edge.rightPremiseNodeId),
      };
    case "nd-weakening":
      return {
        ...edge,
        conclusionNodeId: mapRequired(edge.conclusionNodeId),
        keptPremiseNodeId: mapOpt(edge.keptPremiseNodeId),
        discardedPremiseNodeId: mapOpt(edge.discardedPremiseNodeId),
      };
    // ND 3前提系
    case "nd-disjunction-elim":
      return {
        ...edge,
        conclusionNodeId: mapRequired(edge.conclusionNodeId),
        disjunctionPremiseNodeId: mapOpt(edge.disjunctionPremiseNodeId),
        leftCasePremiseNodeId: mapOpt(edge.leftCasePremiseNodeId),
        rightCasePremiseNodeId: mapOpt(edge.rightCasePremiseNodeId),
      };
  }
}

/**
 * 推論エッジ内のノードIDを置換する。
 * oldId → newId に置き換える。
 */
export function replaceNodeIdInEdge(
  edge: InferenceEdge,
  oldId: string,
  newId: string,
): InferenceEdge {
  return remapEdgeNodeIds(edge, (id) => (id === oldId ? newId : id));
}

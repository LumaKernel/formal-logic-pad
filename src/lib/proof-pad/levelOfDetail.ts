/**
 * Level-of-Detail (LoD) の純粋ロジック。
 *
 * ズームレベルに応じて証明ノードの表示詳細度を決定する。
 * 低ズームでは簡略表示にし、描画コストとノイズを削減する。
 *
 * 変更時は levelOfDetail.test.ts, EditableProofNode.tsx, ProofWorkspace.tsx, index.ts も同期すること。
 */

/**
 * 証明ノードの表示詳細度。
 * - full: すべて表示（ラベル、数式、ステータス、バッジ、依存情報）
 * - compact: ラベルと数式のみ（バッジ、ステータス、依存情報を非表示）
 * - minimal: ラベルと色付きブロックのみ（数式も非表示）
 */
export type DetailLevel = "full" | "compact" | "minimal";

/** DetailLevelの閾値設定 */
export interface DetailLevelThresholds {
  /** この値以上でfull表示 */
  readonly fullAbove: number;
  /** この値以上でcompact表示（fullAbove未満） */
  readonly compactAbove: number;
  /** compactAbove未満でminimal表示 */
}

/** デフォルトの閾値 */
export const DEFAULT_THRESHOLDS: DetailLevelThresholds = {
  fullAbove: 0.5,
  compactAbove: 0.3,
};

/**
 * ズームスケール値からDetailLevelを計算する純粋関数。
 */
export function computeDetailLevel(
  scale: number,
  thresholds: DetailLevelThresholds = DEFAULT_THRESHOLDS,
): DetailLevel {
  if (scale >= thresholds.fullAbove) return "full";
  if (scale >= thresholds.compactAbove) return "compact";
  return "minimal";
}

/**
 * DetailLevelごとに表示すべき要素を返す。
 * UIコンポーネントの条件分岐を集約するための純粋関数。
 */
export interface DetailVisibility {
  /** 数式テキスト/エディタを表示するか */
  readonly showFormula: boolean;
  /** ステータスメッセージを表示するか */
  readonly showStatus: boolean;
  /** 役割バッジ(AXIOM/GOAL等)を表示するか */
  readonly showRoleBadge: boolean;
  /** 公理名バッジを表示するか */
  readonly showAxiomName: boolean;
  /** 保護バッジ(QUEST)を表示するか */
  readonly showProtectedBadge: boolean;
  /** 依存情報を表示するか */
  readonly showDependencies: boolean;
}

/**
 * ユーザー設定による表示オーバーライド。
 * 各フィールドが指定された場合、DetailLevelによる自動判定を上書きする。
 */
export interface DetailVisibilityOverrides {
  /** 依存情報の表示をユーザーが明示的に制御する（undefined = DetailLevel自動判定に従う） */
  readonly showDependencies?: boolean;
}

export function getDetailVisibility(
  level: DetailLevel,
  overrides?: DetailVisibilityOverrides,
): DetailVisibility {
  const base = getBaseDetailVisibility(level);
  if (overrides === undefined) return base;
  return {
    ...base,
    ...(overrides.showDependencies !== undefined
      ? { showDependencies: overrides.showDependencies }
      : {}),
  };
}

function getBaseDetailVisibility(level: DetailLevel): DetailVisibility {
  switch (level) {
    case "full":
      return {
        showFormula: true,
        showStatus: true,
        showRoleBadge: true,
        showAxiomName: true,
        showProtectedBadge: true,
        showDependencies: true,
      };
    case "compact":
      return {
        showFormula: true,
        showStatus: false,
        showRoleBadge: false,
        showAxiomName: false,
        showProtectedBadge: false,
        showDependencies: false,
      };
    case "minimal":
      return {
        showFormula: false,
        showStatus: false,
        showRoleBadge: false,
        showAxiomName: false,
        showProtectedBadge: false,
        showDependencies: false,
      };
  }
}

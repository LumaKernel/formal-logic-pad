/**
 * 証明ノードのUI状態と純粋ロジック。
 *
 * 証明ノードの種類（公理/推論規則/結論）ごとの表示スタイルとポート定義を提供する。
 * InfiniteCanvasの connector.ts に依存。
 *
 * 変更時は EditableProofNode.tsx, EditableProofNode.test.tsx, EditableProofNode.stories.tsx, index.ts も同期すること。
 */

import type { ConnectorPort } from "../infinite-canvas/connector";

// --- ノード種別 ---

/**
 * 証明ノードの種類。
 * - axiom: 公理（葉ノード）— 編集可能な論理式
 * - mp: Modus Ponens（推論規則）— 2つの前提から結論を導出（レガシー: derived + InferenceEdge に移行中）
 * - gen: Generalization（汎化規則）— 1つの前提から ∀x.φ を導出（レガシー: derived + InferenceEdge に移行中）
 * - substitution: 代入操作 — 前提の論理式にメタ変数代入を適用（レガシー: derived + InferenceEdge に移行中）
 * - derived: 推論規則で導出されたノード — InferenceEdge経由で前提と結論の関係を管理
 * - conclusion: 最終結論
 */
export type ProofNodeKind =
  | "axiom"
  | "mp"
  | "gen"
  | "substitution"
  | "derived"
  | "conclusion";

/** すべてのProofNodeKindの値（exhaustive checkに使用） */
export const PROOF_NODE_KINDS: readonly ProofNodeKind[] = [
  "axiom",
  "mp",
  "gen",
  "substitution",
  "derived",
  "conclusion",
] as const;

/**
 * ノード種別に対応するデフォルトラベルを返す。
 * 公理ノードは "Axiom" を返す（具体的な公理名は `axiomNameLogic.ts` で計算される）。
 * exhaustive switchで網羅性を保証。
 */
export function getProofNodeKindLabel(kind: ProofNodeKind): string {
  switch (kind) {
    case "axiom":
      return "Axiom";
    case "mp":
      return "MP";
    case "gen":
      return "Gen";
    case "substitution":
      return "Subst";
    case "derived":
      return "Derived";
    case "conclusion":
      return "Conclusion";
  }
}

// --- スタイル ---

export interface ProofNodeStyle {
  readonly backgroundColor: string;
  readonly textColor: string;
  readonly borderRadius: number;
  readonly border: string;
  readonly boxShadow: string;
  /** 左辺ストライプの色（カテゴリアクセント色） */
  readonly stripeColor: string;
  /** ホバー時のbox-shadow */
  readonly boxShadowHover: string;
}

/**
 * ノード色のCSS変数名とフォールバック値。
 * globals.css の --color-node-* と同期すること。
 */
const NODE_COLORS = {
  axiom: { varName: "--color-node-axiom", fallback: "#5b8bd9" },
  mp: { varName: "--color-node-mp", fallback: "#d9944a" },
  gen: { varName: "--color-node-gen", fallback: "#9b59b6" },
  substitution: { varName: "--color-node-substitution", fallback: "#3498db" },
  derived: { varName: "--color-node-derived", fallback: "#e6a84d" },
  conclusion: { varName: "--color-node-conclusion", fallback: "#4ad97a" },
} as const satisfies Record<
  ProofNodeKind,
  { readonly varName: string; readonly fallback: string }
>;

/** CSS変数参照文字列を生成するヘルパー */
function cssVar(entry: {
  readonly varName: string;
  readonly fallback: string;
}): string {
  return `var(${entry.varName satisfies string}, ${entry.fallback satisfies string})`;
}

/** 共通のカードスタイル基盤 */
const CARD_BASE = {
  backgroundColor: "var(--color-node-card-bg, #fffdf8)",
  textColor: "var(--color-node-card-text, #2d2a24)",
  borderRadius: 8,
  border: "1px solid var(--color-node-card-border, rgba(0,0,0,0.08))",
  boxShadow: "0 1px 4px var(--color-node-card-shadow, rgba(0,0,0,0.08))",
  boxShadowHover:
    "0 4px 12px var(--color-node-card-shadow-hover, rgba(0,0,0,0.16))",
} as const;

/**
 * ノード種別に対応するスタイルを返す。
 * exhaustive switchで網羅性を保証。
 *
 * 紙カード風: 白/クリーム背景 + 左辺にカテゴリ色ストライプ + paper drop-shadow。
 * 色はCSS変数を参照し、フォールバック値を持つ。
 */
export function getProofNodeStyle(kind: ProofNodeKind): ProofNodeStyle {
  switch (kind) {
    case "axiom":
      return {
        ...CARD_BASE,
        stripeColor: cssVar(NODE_COLORS.axiom),
      };
    case "mp":
      return {
        ...CARD_BASE,
        stripeColor: cssVar(NODE_COLORS.mp),
      };
    case "gen":
      return {
        ...CARD_BASE,
        stripeColor: cssVar(NODE_COLORS.gen),
      };
    case "substitution":
      return {
        ...CARD_BASE,
        stripeColor: cssVar(NODE_COLORS.substitution),
      };
    case "derived":
      return {
        ...CARD_BASE,
        stripeColor: cssVar(NODE_COLORS.derived),
      };
    case "conclusion":
      return {
        ...CARD_BASE,
        borderRadius: 12,
        border: "2px solid var(--color-node-conclusion-border, #2ecc71)",
        boxShadow:
          "0 2px 8px var(--color-node-conclusion-shadow, rgba(74,217,122,0.25))",
        boxShadowHover:
          "0 6px 20px var(--color-node-conclusion-shadow, rgba(74,217,122,0.25))",
        stripeColor: cssVar(NODE_COLORS.conclusion),
      };
  }
}

// --- ポート定義 ---

/** 公理ノード: 下に1つの出力ポート */
export const AXIOM_PORTS: readonly ConnectorPort[] = [
  { id: "out", edge: "bottom", position: 0.5 },
];

/** MPノード: 上に2つの入力ポート、下に1つの出力ポート */
export const MP_PORTS: readonly ConnectorPort[] = [
  { id: "premise-left", edge: "top", position: 0.3 },
  { id: "premise-right", edge: "top", position: 0.7 },
  { id: "out", edge: "bottom", position: 0.5 },
];

/** Genノード: 上に1つの入力ポート、下に1つの出力ポート */
export const GEN_PORTS: readonly ConnectorPort[] = [
  { id: "premise", edge: "top", position: 0.5 },
  { id: "out", edge: "bottom", position: 0.5 },
];

/** 代入ノード: 上に1つの入力ポート、下に1つの出力ポート */
export const SUBSTITUTION_PORTS: readonly ConnectorPort[] = [
  { id: "premise", edge: "top", position: 0.5 },
  { id: "out", edge: "bottom", position: 0.5 },
];

/**
 * 導出ノード: 全ての入力ポート + 出力ポート。
 * InferenceEdge種別（MP/Gen/Substitution）に応じて異なるポートが利用される。
 * 互換性のため、全ての可能なポートを含む。
 */
export const DERIVED_PORTS: readonly ConnectorPort[] = [
  { id: "premise-left", edge: "top", position: 0.3 },
  { id: "premise-right", edge: "top", position: 0.7 },
  { id: "premise", edge: "top", position: 0.5 },
  { id: "out", edge: "bottom", position: 0.5 },
];

/** 結論ノード: 上に2つの入力ポートのみ */
export const CONCLUSION_PORTS: readonly ConnectorPort[] = [
  { id: "premise-left", edge: "top", position: 0.3 },
  { id: "premise-right", edge: "top", position: 0.7 },
];

/**
 * ノード種別に対応するポート定義を返す。
 * exhaustive switchで網羅性を保証。
 */
export function getProofNodePorts(
  kind: ProofNodeKind,
): readonly ConnectorPort[] {
  switch (kind) {
    case "axiom":
      return AXIOM_PORTS;
    case "mp":
      return MP_PORTS;
    case "gen":
      return GEN_PORTS;
    case "substitution":
      return SUBSTITUTION_PORTS;
    case "derived":
      return DERIVED_PORTS;
    case "conclusion":
      return CONCLUSION_PORTS;
  }
}

// --- エッジカラー ---

/**
 * エッジ色のCSS変数名とフォールバック値。
 * globals.css の --color-edge-* と同期すること。
 */
const EDGE_COLORS = {
  axiom: { varName: "--color-edge-axiom", fallback: "#7aa3e0" },
  mp: { varName: "--color-edge-mp", fallback: "#e0a87a" },
  gen: { varName: "--color-edge-gen", fallback: "#c39bd3" },
  substitution: { varName: "--color-edge-substitution", fallback: "#5dade2" },
  derived: { varName: "--color-edge-derived", fallback: "#e6b870" },
  conclusion: { varName: "--color-edge-conclusion", fallback: "#7ae0a3" },
} as const satisfies Record<
  ProofNodeKind,
  { readonly varName: string; readonly fallback: string }
>;

/**
 * ノード種別に対応するエッジ（接続線）の色を返す。
 * CSS変数を参照し、フォールバック値を持つ。
 */
export function getProofEdgeColor(fromKind: ProofNodeKind): string {
  switch (fromKind) {
    case "axiom":
      return cssVar(EDGE_COLORS.axiom);
    case "mp":
      return cssVar(EDGE_COLORS.mp);
    case "gen":
      return cssVar(EDGE_COLORS.gen);
    case "substitution":
      return cssVar(EDGE_COLORS.substitution);
    case "derived":
      return cssVar(EDGE_COLORS.derived);
    case "conclusion":
      return cssVar(EDGE_COLORS.conclusion);
  }
}

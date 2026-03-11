/**
 * 証明ノードのUI状態と純粋ロジック。
 *
 * 証明ノードの種類（公理/導出/結論）ごとの表示スタイルとポート定義を提供する。
 * 推論規則（MP/Gen/Substitution）はノードではなくInferenceEdgeで管理される。
 * InfiniteCanvasの connector.ts に依存。
 *
 * 変更時は EditableProofNode.tsx, EditableProofNode.test.tsx, EditableProofNode.stories.tsx, index.ts も同期すること。
 */

import type { ConnectorPort } from "../infinite-canvas/connector";

// --- ノード種別 ---

/**
 * 証明ノードの種類（ストレージ上の種別）。
 * - axiom: 公理（通常の論理式ノード）— 編集可能
 * - conclusion: 最終結論（現在未使用だが互換性のため保持）
 * - note: メモノード（マークダウンテキスト。証明ツリーの一部ではない）
 *
 * ノードが "derived" かどうかは InferenceEdge の有無から計算する（computed）。
 * ProofNodeKind には含めない。
 */
export type ProofNodeKind = "axiom" | "conclusion" | "note";

/** すべてのProofNodeKindの値（exhaustive checkに使用） */
export const PROOF_NODE_KINDS: readonly ProofNodeKind[] = [
  "axiom",
  "conclusion",
  "note",
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
    case "conclusion":
      return "Conclusion";
    case "note":
      return "Note";
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
  derived: { varName: "--color-node-derived", fallback: "#e6a84d" },
  conclusion: { varName: "--color-node-conclusion", fallback: "#4ad97a" },
  note: { varName: "--color-node-note", fallback: "#a0a0a0" },
} as const;

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
    case "note":
      return {
        ...CARD_BASE,
        stripeColor: cssVar(NODE_COLORS.note),
      };
  }
}

// --- ポート定義 ---

/** 公理ノード: 下に1つの出力ポート */
export const AXIOM_PORTS: readonly ConnectorPort[] = [
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

/** ノートノード: ポートなし（接続不可） */
export const NOTE_PORTS: readonly ConnectorPort[] = [];

/**
 * ノード種別に対応するポート定義を返す。
 * derived は computed なので、axiom kind のノードは常に全ポート（入出力両方）を持つ。
 * exhaustive switchで網羅性を保証。
 */
export function getProofNodePorts(
  kind: ProofNodeKind,
): readonly ConnectorPort[] {
  switch (kind) {
    case "axiom":
      return DERIVED_PORTS;
    case "conclusion":
      return CONCLUSION_PORTS;
    case "note":
      return NOTE_PORTS;
  }
}

// --- エッジカラー ---

/**
 * エッジ色のCSS変数名とフォールバック値。
 * globals.css の --color-edge-* と同期すること。
 */
const EDGE_COLORS = {
  axiom: { varName: "--color-edge-axiom", fallback: "#7aa3e0" },
  derived: { varName: "--color-edge-derived", fallback: "#e6b870" },
  conclusion: { varName: "--color-edge-conclusion", fallback: "#7ae0a3" },
  note: { varName: "--color-edge-note", fallback: "#c0c0c0" },
} as const;

/**
 * ノード種別に対応するエッジ（接続線）の色を返す。
 * CSS変数を参照し、フォールバック値を持つ。
 */
export function getProofEdgeColor(fromKind: ProofNodeKind): string {
  switch (fromKind) {
    case "axiom":
      return cssVar(EDGE_COLORS.axiom);
    case "conclusion":
      return cssVar(EDGE_COLORS.conclusion);
    case "note":
      return cssVar(EDGE_COLORS.note);
  }
}

// --- NodeClassification ベースのUI関数 ---
// derived はストレージ上の kind ではなく InferenceEdge から computed で判定する。
// NodeClassification を使って UI スタイル/ポート/エッジ色を決定する。

import type { NodeClassification } from "./nodeRoleLogic";

/**
 * NodeClassification に基づいてノードスタイルを返す。
 * derived ノードは InferenceEdge の有無から計算された classification で判定される。
 */
export function getNodeClassificationStyle(
  classification: NodeClassification,
): ProofNodeStyle {
  switch (classification) {
    case "root-axiom":
    case "root-unmarked":
      return {
        ...CARD_BASE,
        stripeColor: cssVar(NODE_COLORS.axiom),
      };
    case "derived":
      return {
        ...CARD_BASE,
        stripeColor: cssVar(NODE_COLORS.derived),
      };
    case "note":
      return {
        ...CARD_BASE,
        stripeColor: cssVar(NODE_COLORS.note),
      };
  }
}

/**
 * NodeClassification に基づいてエッジ色を返す。
 */
export function getNodeClassificationEdgeColor(
  classification: NodeClassification,
): string {
  switch (classification) {
    case "root-axiom":
    case "root-unmarked":
      return cssVar(EDGE_COLORS.axiom);
    case "derived":
      return cssVar(EDGE_COLORS.derived);
    case "note":
      return cssVar(EDGE_COLORS.note);
  }
}

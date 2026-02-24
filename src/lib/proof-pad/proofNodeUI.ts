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
 * - mp: Modus Ponens（推論規則）— 2つの前提から結論を導出
 * - conclusion: 最終結論
 */
export type ProofNodeKind = "axiom" | "mp" | "conclusion";

/** すべてのProofNodeKindの値（exhaustive checkに使用） */
export const PROOF_NODE_KINDS: readonly ProofNodeKind[] = [
  "axiom",
  "mp",
  "conclusion",
] as const;

// --- スタイル ---

export interface ProofNodeStyle {
  readonly backgroundColor: string;
  readonly textColor: string;
  readonly borderRadius: number;
  readonly border: string;
  readonly boxShadow: string;
}

const AXIOM_COLOR = "#5b8bd9";
const MP_COLOR = "#d9944a";
const CONCLUSION_COLOR = "#4ad97a";

/**
 * ノード種別に対応するスタイルを返す。
 * exhaustive switchで網羅性を保証。
 */
export function getProofNodeStyle(kind: ProofNodeKind): ProofNodeStyle {
  switch (kind) {
    case "axiom":
      return {
        backgroundColor: AXIOM_COLOR,
        textColor: "#fff",
        borderRadius: 8,
        border: "1px solid rgba(255,255,255,0.2)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
      };
    case "mp":
      return {
        backgroundColor: MP_COLOR,
        textColor: "#fff",
        borderRadius: 8,
        border: "1px solid rgba(255,255,255,0.2)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
      };
    case "conclusion":
      return {
        backgroundColor: CONCLUSION_COLOR,
        textColor: "#fff",
        borderRadius: 12,
        border: "2px solid #2ecc71",
        boxShadow: "0 4px 16px rgba(74,217,122,0.4)",
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
    case "conclusion":
      return CONCLUSION_PORTS;
  }
}

// --- エッジカラー ---

/**
 * ノード種別に対応するエッジ（接続線）の色を返す。
 */
export function getProofEdgeColor(fromKind: ProofNodeKind): string {
  switch (fromKind) {
    case "axiom":
      return "#7aa3e0";
    case "mp":
      return "#e0a87a";
    case "conclusion":
      return "#7ae0a3";
  }
}

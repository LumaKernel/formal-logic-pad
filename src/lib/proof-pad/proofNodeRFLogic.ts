/**
 * React Flow カスタムノード用の純粋ロジック。
 *
 * ConnectorPort → React Flow Handle props の変換を行う。
 *
 * 変更時は proofNodeRFLogic.test.ts, ProofNodeRF.tsx も同期すること。
 */

import { Position } from "@xyflow/react";
import type { ConnectorPort } from "../infinite-canvas/connector";

// --- Handle props 型 ---

/**
 * React Flow Handle に渡す props のデータ。
 * UI コンポーネント側で <Handle> にスプレッドする。
 */
export type HandleProps = {
  readonly id: string;
  readonly type: "source" | "target";
  readonly position: Position;
  readonly style: {
    readonly left?: string;
    readonly top?: string;
  };
};

// --- 変換ロジック ---

/**
 * ConnectorPort の edge 方向を React Flow Position に変換する。
 */
export function edgeToPosition(
  edge: "top" | "right" | "bottom" | "left",
): Position {
  switch (edge) {
    case "top":
      return Position.Top;
    case "right":
      return Position.Right;
    case "bottom":
      return Position.Bottom;
    case "left":
      return Position.Left;
  }
}

/**
 * ConnectorPort の edge 方向から Handle の type を推定する。
 *
 * top/left = target（入力）, bottom/right = source（出力）。
 * 証明ツリーでは上→下の流れ: 前提(top) → 結論(bottom)。
 */
export function edgeToHandleType(
  edge: "top" | "right" | "bottom" | "left",
): "source" | "target" {
  switch (edge) {
    case "top":
    case "left":
      return "target";
    case "bottom":
    case "right":
      return "source";
  }
}

/**
 * ConnectorPort の position (0.0〜1.0) を Handle の CSS style に変換する。
 *
 * top/bottom ポート: left を %で指定（横方向の位置）
 * left/right ポート: top を %で指定（縦方向の位置）
 */
export function portPositionToStyle(
  edge: "top" | "right" | "bottom" | "left",
  position: number,
): { readonly left?: string; readonly top?: string } {
  const pct = `${(position * 100).toString() satisfies string}%`;
  switch (edge) {
    case "top":
    case "bottom":
      return { left: pct };
    case "left":
    case "right":
      return { top: pct };
  }
}

/**
 * ConnectorPort を React Flow Handle props に変換する。
 */
export function connectorPortToHandleProps(port: ConnectorPort): HandleProps {
  const pos = port.position ?? 0.5;
  return {
    id: port.id,
    type: edgeToHandleType(port.edge),
    position: edgeToPosition(port.edge),
    style: portPositionToStyle(port.edge, pos),
  };
}

/**
 * ConnectorPort 配列を Handle props 配列に変換する。
 */
export function connectorPortsToHandleProps(
  ports: readonly ConnectorPort[],
): readonly HandleProps[] {
  return ports.map(connectorPortToHandleProps);
}

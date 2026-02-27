/**
 * 推論エッジバッジコンポーネント。
 *
 * 接続線上に表示する推論規則名のバッジ。
 * PortConnectionのlabel propとして使用する。
 *
 * 変更時は InferenceEdgeBadge.test.tsx も同期すること。
 */

import type { InferenceEdgeLabelData } from "./inferenceEdgeLabelLogic";

export interface InferenceEdgeBadgeProps {
  /** ラベルデータ（純粋ロジックで計算済み） */
  readonly labelData: InferenceEdgeLabelData;
  /** data-testid */
  readonly testId?: string;
}

/**
 * 推論エッジのラベルバッジ。
 * 接続線の中間点に配置される小さなバッジ。
 */
export function InferenceEdgeBadge({
  labelData,
  testId,
}: InferenceEdgeBadgeProps) {
  return (
    <div
      data-testid={testId}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2px 8px",
        borderRadius: 10,
        backgroundColor: labelData.badgeColor,
        color: "#fff",
        fontSize: 11,
        fontWeight: 600,
        fontFamily: "var(--font-mono, monospace)",
        whiteSpace: "nowrap",
        userSelect: "none",
        pointerEvents: "none",
        boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
        lineHeight: 1.4,
      }}
    >
      {labelData.label}
    </div>
  );
}

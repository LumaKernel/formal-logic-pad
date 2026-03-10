/**
 * 推論エッジバッジコンポーネント。
 *
 * 接続線上に表示する推論規則名のバッジ。
 * PortConnectionのlabel propとして使用する。
 *
 * 全バッジタイプでクリック操作をサポート。
 * Gen/Substitutionはパラメータ編集、MPは接続削除メニューを開く。
 *
 * 変更時は InferenceEdgeBadge.test.tsx も同期すること。
 */

import type { InferenceEdgeLabelData } from "./inferenceEdgeLabelLogic";

export interface InferenceEdgeBadgeProps {
  /** ラベルデータ（純粋ロジックで計算済み） */
  readonly labelData: InferenceEdgeLabelData;
  /** data-testid */
  readonly testId?: string;
  /** バッジクリック時のコールバック（Gen/Substitutionはパラメータ編集、MPは接続削除メニュー） */
  readonly onBadgeClick?: (screenX: number, screenY: number) => void;
}

/**
 * 推論エッジのラベルバッジ。
 * 接続線の中間点に配置される小さなバッジ。
 * onBadgeClickが提供されていれば全タイプがクリック可能。
 */
export function InferenceEdgeBadge({
  labelData,
  testId,
  onBadgeClick,
}: InferenceEdgeBadgeProps) {
  const interactive = onBadgeClick !== undefined;

  return (
    <div
      data-testid={testId}
      role={interactive ? "button" : undefined}
      onClick={
        interactive
          ? (e) => {
              e.stopPropagation();
              onBadgeClick?.(e.clientX, e.clientY);
            }
          : undefined
      }
      onPointerDown={interactive ? (e) => e.stopPropagation() : undefined}
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
        pointerEvents: interactive ? "auto" : "none",
        boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
        lineHeight: 1.4,
        cursor: interactive ? "pointer" : "default",
      }}
    >
      {labelData.label}
    </div>
  );
}

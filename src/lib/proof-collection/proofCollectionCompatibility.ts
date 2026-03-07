/**
 * 証明コレクションの互換性チェック純粋ロジック。
 *
 * 保存された証明を別のワークスペースに適用する際の互換性を判定する。
 * - 証明スタイル（Hilbert/ND/SC/etc.）の一致チェック
 * - 使用されている公理がターゲット体系でサポートされているかのチェック
 *
 * 変更時は proofCollectionCompatibility.test.ts も同期すること。
 */

import type { DeductionStyle } from "../logic-core/deductionSystem";
import type { ProofEntry } from "./proofCollectionState";

// --- 互換性チェック結果 ---

/** 完全互換: スタイルも公理もすべて一致 */
export type FullyCompatible = {
  readonly _tag: "FullyCompatible";
};

/** 公理警告付き互換: スタイルは一致するが、一部の公理がターゲットに存在しない */
export type CompatibleWithAxiomWarnings = {
  readonly _tag: "CompatibleWithAxiomWarnings";
  readonly missingAxiomIds: readonly string[];
};

/** 非互換: 証明スタイルが異なる */
export type IncompatibleStyle = {
  readonly _tag: "IncompatibleStyle";
  readonly sourceStyle: DeductionStyle;
  readonly targetStyle: DeductionStyle;
};

/** 互換性チェック結果 */
export type CompatibilityResult =
  | FullyCompatible
  | CompatibleWithAxiomWarnings
  | IncompatibleStyle;

/**
 * 証明エントリのターゲットワークスペースへの互換性をチェックする。
 *
 * 判定ルール:
 * 1. 証明スタイルが異なる場合 → IncompatibleStyle（呼び出し不可ではない、警告表示）
 * 2. 使用公理がすべてターゲットにある場合 → FullyCompatible
 * 3. 一部の公理がターゲットにない場合 → CompatibleWithAxiomWarnings
 */
export function checkProofCompatibility(
  entry: ProofEntry,
  targetStyle: DeductionStyle,
  targetAvailableAxiomIds: ReadonlySet<string>,
): CompatibilityResult {
  // スタイル不一致
  if (entry.deductionStyle !== targetStyle) {
    return {
      _tag: "IncompatibleStyle",
      sourceStyle: entry.deductionStyle,
      targetStyle,
    };
  }

  // 使用公理の互換性チェック
  const missingAxiomIds = entry.usedAxiomIds.filter(
    (id) => !targetAvailableAxiomIds.has(id),
  );

  if (missingAxiomIds.length === 0) {
    return { _tag: "FullyCompatible" };
  }

  return {
    _tag: "CompatibleWithAxiomWarnings",
    missingAxiomIds,
  };
}

/**
 * 互換性結果が呼び出し可能かどうかを判定する。
 * 仕様: 非互換でも呼び出し自体は可能（警告マーク付き）。
 * つまり、すべての結果で呼び出し可能。
 */
/* v8 ignore start — 現仕様で常にtrue。V8の||短絡分岐追跡を回避 */
export function isCallable(result: CompatibilityResult) {
  // 現仕様: すべての互換性結果で呼び出し可能（非互換でも警告付きで可）
  return (
    result._tag === "FullyCompatible" ||
    result._tag === "CompatibleWithAxiomWarnings" ||
    result._tag === "IncompatibleStyle"
  );
}
/* v8 ignore stop */

/**
 * 互換性結果に警告があるかどうかを判定する。
 */
export function hasWarnings(result: CompatibilityResult) {
  return (
    result._tag === "CompatibleWithAxiomWarnings" ||
    result._tag === "IncompatibleStyle"
  );
}

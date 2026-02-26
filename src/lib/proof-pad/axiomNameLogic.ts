/**
 * 公理名自動判別の純粋ロジック。
 *
 * ノードの論理式がどの有名公理のインスタンスかを自動判定し、
 * 表示名（例: "A1 (K)"）を返す。
 *
 * `identifyAxiom` を内部的に利用し、FormulaのパースはUIレイヤーまたは
 * 呼び出し側が事前に行う前提。
 *
 * 変更時は axiomNameLogic.test.ts, EditableProofNode.tsx, ProofWorkspace.tsx, index.ts も同期すること。
 */

import type { Formula } from "../logic-core/formula";
import type { AxiomId, LogicSystem } from "../logic-core/inferenceRule";
import { identifyAxiom } from "../logic-core/inferenceRule";

// --- 公理IDから表示名へのマッピング ---

/**
 * 公理IDに対応する表示名。
 * axiomPaletteLogic.ts と整合を保つこと。
 *
 * 新しい公理を追加する場合はこのマップとaxiomPaletteLogicの両方を更新する。
 */
const axiomDisplayNames: Readonly<Record<AxiomId, string>> = {
  A1: "A1 (K)",
  A2: "A2 (S)",
  A3: "A3",
  M3: "M3",
  A4: "A4 (UI)",
  A5: "A5 (∀-Dist)",
  E1: "E1 (Refl)",
  E2: "E2 (Sym)",
  E3: "E3 (Trans)",
  E4: "E4",
  E5: "E5",
};

// --- 公理名判定結果 ---

/** 公理名判定の結果 */
export type AxiomNameResult =
  | {
      readonly _tag: "Identified";
      readonly axiomId: AxiomId;
      readonly displayName: string;
    }
  | { readonly _tag: "NotIdentified" };

/**
 * 論理式がシステムで有効な公理のインスタンスかを判定し、
 * マッチした場合は公理IDと表示名を返す。
 *
 * @param formula パース済みの論理式
 * @param system 論理体系設定
 * @returns 公理名判定結果
 */
export function identifyAxiomName(
  formula: Formula,
  system: LogicSystem,
): AxiomNameResult {
  const result = identifyAxiom(formula, system);
  if (result._tag === "Error") {
    return { _tag: "NotIdentified" };
  }
  return {
    _tag: "Identified",
    axiomId: result.axiomId,
    displayName: axiomDisplayNames[result.axiomId],
  };
}

/**
 * 公理IDから表示名を取得する。
 */
export function getAxiomDisplayName(axiomId: AxiomId): string {
  return axiomDisplayNames[axiomId];
}

/**
 * 公理名自動判別の純粋ロジック。
 *
 * ノードの論理式がどの有名公理のスキーマそのものかを自動判定し、
 * 表示名（例: "A1 (K)"）を返す。
 *
 * 公理として識別されるのは、公理スキーマそのものの形のみ。
 * メタ変数に具体的な式を代入して得られたインスタンス（例: φ→(φ→φ)）は
 * 公理として識別しない。ユーザーは代入操作ノードを介して具体化すべき。
 *
 * 変更時は axiomNameLogic.test.ts, EditableProofNode.tsx, ProofWorkspace.tsx, index.ts も同期すること。
 */

import type { Formula } from "../logic-core/formula";
import type { AxiomId, LogicSystem } from "../logic-core/inferenceRule";
import { identifyAxiom } from "../logic-core/inferenceRule";
import type {
  FormulaSubstitutionMap,
  TermMetaSubstitutionMap,
} from "../logic-core/substitution";

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
  EFQ: "EFQ",
  DNE: "DNE",
  "CONJ-DEF": "∧-Def",
  "DISJ-DEF": "∨-Def",
  A4: "A4 (UI)",
  A5: "A5 (∀-Dist)",
  "EX-DEF": "∃-Def",
  E1: "E1 (Refl)",
  E2: "E2 (Sym)",
  E3: "E3 (Trans)",
  E4: "E4",
  E5: "E5",
};

// --- 自明な代入の判定 ---

/**
 * FormulaSubstitutionMap が自明かどうかを判定する。
 * 自明 = すべての値が単一のMetaVariableであり、かつ代入が単射（異なるキーが同じMetaVariableに写らない）。
 *
 * 空マップは自明とみなす。
 */
export function isTrivialFormulaSubstitution(
  map: FormulaSubstitutionMap,
): boolean {
  const usedTargets = new Set<string>();
  for (const [, value] of map) {
    if (value._tag !== "MetaVariable") return false;
    // MetaVariable のキーを生成して重複チェック
    const subscriptSuffix =
      value.subscript !== undefined
        ? `_${value.subscript satisfies string}`
        : "";
    const targetKey = `${value.name satisfies string}${subscriptSuffix satisfies string}`;
    if (usedTargets.has(targetKey)) return false;
    usedTargets.add(targetKey);
  }
  return true;
}

/**
 * TermMetaSubstitutionMap が自明かどうかを判定する。
 * 自明 = すべての値が単一のTermMetaVariableであり、かつ代入が単射。
 *
 * 空マップは自明とみなす。
 */
export function isTrivialTermSubstitution(
  map: TermMetaSubstitutionMap,
): boolean {
  const usedTargets = new Set<string>();
  for (const [, value] of map) {
    if (value._tag !== "TermMetaVariable") return false;
    const { name, subscript } = value;
    const subscriptSuffix =
      subscript !== undefined ? `_${subscript satisfies string}` : "";
    const targetKey = `${name satisfies string}${subscriptSuffix satisfies string}`;
    if (usedTargets.has(targetKey)) return false;
    usedTargets.add(targetKey);
  }
  return true;
}

/**
 * 公理識別結果の代入が自明（公理スキーマそのもの or メタ変数の命名違いのみ）かどうかを判定する。
 * 自明でない場合、その式は公理スキーマそのものではなく代入インスタンスである。
 */
export function isTrivialAxiomSubstitution(
  formulaSub: FormulaSubstitutionMap,
  termSub: TermMetaSubstitutionMap,
): boolean {
  return (
    isTrivialFormulaSubstitution(formulaSub) &&
    isTrivialTermSubstitution(termSub)
  );
}

// --- 公理名判定結果 ---

/**
 * 公理名判定の結果。
 *
 * Identified/TheoryAxiomIdentified は公理スキーマそのもの（メタ変数の命名違いのみ）の場合のみ返る。
 * メタ変数に具体的な式/項を代入したインスタンスは NotIdentified となる。
 */
export type AxiomNameResult =
  | {
      readonly _tag: "Identified";
      readonly axiomId: AxiomId;
      readonly displayName: string;
    }
  | {
      readonly _tag: "TheoryAxiomIdentified";
      readonly theoryAxiomId: string;
      readonly displayName: string;
    }
  | { readonly _tag: "NotIdentified" };

/**
 * 論理式がシステムで有効な公理スキーマそのものかを判定し、
 * マッチした場合は公理IDと表示名を返す。
 *
 * 代入後のインスタンス（例: φ→(φ→φ)）は公理として識別しない。
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
  switch (result._tag) {
    case "Ok": {
      const isTrivial = isTrivialAxiomSubstitution(
        result.formulaSubstitution,
        result.termSubstitution,
      );
      if (!isTrivial) return { _tag: "NotIdentified" };
      return {
        _tag: "Identified",
        axiomId: result.axiomId,
        displayName: axiomDisplayNames[result.axiomId],
      };
    }
    case "TheoryAxiom": {
      const isTrivial = isTrivialAxiomSubstitution(
        result.formulaSubstitution,
        result.termSubstitution,
      );
      if (!isTrivial) return { _tag: "NotIdentified" };
      return {
        _tag: "TheoryAxiomIdentified",
        theoryAxiomId: result.theoryAxiomId,
        displayName: result.displayName,
      };
    }
    case "Error":
      return { _tag: "NotIdentified" };
  }
}

/**
 * 公理IDから表示名を取得する。
 */
export function getAxiomDisplayName(axiomId: AxiomId): string {
  return axiomDisplayNames[axiomId];
}

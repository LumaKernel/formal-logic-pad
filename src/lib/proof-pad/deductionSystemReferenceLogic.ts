/**
 * 演繹体系のリファレンスマッピング純粋ロジック。
 *
 * DeductionSystem名からリファレンスエントリIDへのマッピングを提供する。
 * ProofWorkspace.tsx から利用される。
 *
 * 変更時は deductionSystemReferenceLogic.test.ts, ProofWorkspace.tsx も同期すること。
 * referenceContent.ts に新しい体系エントリを追加した場合もここを更新すること。
 */

import type { ReferenceEntryId } from "../reference/referenceEntry";

// --- 演繹体系名 → リファレンスエントリID マッピング ---

/**
 * 演繹体系名（getDeductionSystemName の返り値）からリファレンスエントリIDへのマッピング。
 *
 * 新しい体系リファレンスエントリ追加時は referenceContent.ts にも追加すること。
 */
const deductionSystemNameToReferenceEntryId: ReadonlyMap<
  string,
  ReferenceEntryId
> = new Map([
  // Hilbert系
  ["Łukasiewicz", "system-lukasiewicz"],
  ["Mendelson", "system-mendelson"],
  ["Minimal Logic", "system-minimal"],
  ["Intuitionistic Logic", "system-intuitionistic"],
  ["Classical Logic (HK)", "system-classical"],
  ["Predicate Logic", "system-predicate"],
  // 理論体系
  ["Peano Arithmetic", "theory-peano"],
  ["Peano Arithmetic (HK)", "theory-peano"],
  ["Peano Arithmetic (Mendelson)", "theory-peano"],
  ["Heyting Arithmetic (HA)", "theory-peano"],
  ["Robinson Arithmetic (Q)", "theory-peano"],
  ["Group Theory (Left Axioms)", "theory-group"],
  ["Group Theory (Full Axioms)", "theory-group"],
  ["Abelian Group", "theory-group"],
]);

/**
 * 演繹体系名に対応するリファレンスエントリIDを返す。
 * 対応するエントリがない場合はundefinedを返す。
 */
export function getDeductionSystemReferenceEntryId(
  systemName: string,
): ReferenceEntryId | undefined {
  return deductionSystemNameToReferenceEntryId.get(systemName);
}

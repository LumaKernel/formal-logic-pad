/**
 * エッジバッジ編集の純粋ロジック。
 *
 * InferenceEdgeBadge上のパラメータ編集状態を管理する純粋関数群。
 * Gen: 量化変数名の編集
 * Substitution: 代入エントリの編集
 *
 * 変更時は edgeBadgeEditLogic.test.ts も同期すること。
 */

import type { InferenceEdge } from "./inferenceEdge";
import { greekLetters } from "../logic-core/greekLetters";
import type {
  SubstitutionEntries,
  SubstitutionEntry,
} from "./substitutionApplicationLogic";

// --- 編集状態型 ---

/** Gen変数名の編集状態 */
export type GenEditState = {
  readonly _tag: "gen";
  /** 編集対象の結論ノードID */
  readonly conclusionNodeId: string;
  /** 現在の入力値 */
  readonly variableName: string;
};

/** Substitution代入エントリの編集状態 */
export type SubstitutionEditState = {
  readonly _tag: "substitution";
  /** 編集対象の結論ノードID */
  readonly conclusionNodeId: string;
  /** 現在の代入エントリ */
  readonly entries: SubstitutionEntries;
};

/** エッジバッジ編集状態のunion型 */
export type EdgeBadgeEditState = GenEditState | SubstitutionEditState;

// --- 編集状態の生成 ---

/**
 * InferenceEdgeから編集状態を生成する。
 * MPエッジはパラメータ編集不可なのでundefined。
 */
export function createEditStateFromEdge(
  edge: InferenceEdge,
): EdgeBadgeEditState | undefined {
  switch (edge._tag) {
    case "mp":
      return undefined;
    case "gen":
      return {
        _tag: "gen",
        conclusionNodeId: edge.conclusionNodeId,
        variableName: edge.variableName,
      };
    case "substitution":
      return {
        _tag: "substitution",
        conclusionNodeId: edge.conclusionNodeId,
        entries: edge.entries,
      };
  }
}

// --- Gen編集操作 ---

/**
 * Gen編集状態の変数名を更新する。
 */
export function updateGenEditVariableName(
  state: GenEditState,
  variableName: string,
): GenEditState {
  return { ...state, variableName };
}

/**
 * Gen編集が確定可能かどうかを判定する。
 */
export function canConfirmGenEdit(state: GenEditState): boolean {
  return state.variableName.trim() !== "";
}

// --- Substitution編集操作 ---

/** Substitution編集のエントリ種別 */
export type SubstEditEntryKind = "formula" | "term";

/** Substitution編集用のUI入力エントリ */
export type SubstEditEntry = {
  readonly kind: SubstEditEntryKind;
  readonly metaVar: string;
  readonly value: string;
};

/**
 * SubstitutionEntries（内部表現）からUI編集用エントリに変換する。
 */
export function toSubstEditEntries(
  entries: SubstitutionEntries,
): readonly SubstEditEntry[] {
  if (entries.length === 0) {
    return [{ kind: "formula", metaVar: "", value: "" }];
  }
  return entries.map((entry) => {
    switch (entry._tag) {
      case "FormulaSubstitution":
        return {
          kind: "formula" as const,
          metaVar: entry.metaVariableName,
          value: entry.formulaText,
        };
      case "TermSubstitution":
        return {
          kind: "term" as const,
          metaVar: entry.metaVariableName,
          value: entry.termText,
        };
    }
  });
}

/**
 * metaVarをGreekLetterに変換する。
 * 無効なギリシャ文字の場合はundefinedを返す。
 * greekLetters.find()の戻り値はGreekLetter | undefinedなので型安全。
 */
function toGreekLetter(s: string) {
  const trimmed = s.trim();
  return greekLetters.find((g) => g === trimmed);
}

/**
 * UI編集用エントリからSubstitutionEntries（内部表現）に変換する。
 * 空のエントリとmetaVarがギリシャ文字でないエントリはフィルタされる。
 */
export function fromSubstEditEntries(
  entries: readonly SubstEditEntry[],
): SubstitutionEntries {
  const result: SubstitutionEntry[] = [];
  for (const e of entries) {
    if (e.metaVar.trim() === "" || e.value.trim() === "") continue;
    const greekLetter = toGreekLetter(e.metaVar);
    if (greekLetter === undefined) continue;
    if (e.kind === "formula") {
      result.push({
        _tag: "FormulaSubstitution",
        metaVariableName: greekLetter,
        formulaText: e.value.trim(),
      });
    } else {
      result.push({
        _tag: "TermSubstitution",
        metaVariableName: greekLetter,
        termText: e.value.trim(),
      });
    }
  }
  return result;
}

/**
 * Substitution編集が確定可能かどうかを判定する。
 * 少なくとも1つの有効なエントリ（metaVarとvalueが非空）が必要。
 */
export function canConfirmSubstEdit(
  entries: readonly SubstEditEntry[],
): boolean {
  return entries.some((e) => e.metaVar.trim() !== "" && e.value.trim() !== "");
}

/**
 * Substitution編集にエントリを追加する。
 */
export function addSubstEditEntry(
  entries: readonly SubstEditEntry[],
): readonly SubstEditEntry[] {
  return [...entries, { kind: "formula", metaVar: "", value: "" }];
}

/**
 * Substitution編集からエントリを削除する。
 */
export function removeSubstEditEntry(
  entries: readonly SubstEditEntry[],
  index: number,
): readonly SubstEditEntry[] {
  if (entries.length <= 1) return entries;
  return entries.filter((_, i) => i !== index);
}

/**
 * Substitution編集のエントリを更新する。
 */
export function updateSubstEditEntry(
  entries: readonly SubstEditEntry[],
  index: number,
  field: keyof SubstEditEntry,
  value: string,
): readonly SubstEditEntry[] {
  return entries.map((entry, i) =>
    i === index ? { ...entry, [field]: value } : entry,
  );
}

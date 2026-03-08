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
import {
  isNdInferenceEdge,
  isTabInferenceEdge,
  isAtInferenceEdge,
  isScInferenceEdge,
} from "./inferenceEdge";
import { greekLetters } from "../logic-core/greekLetters";
import type {
  SubstitutionEntries,
  SubstitutionEntry,
} from "./substitutionApplicationLogic";
import { extractSubstitutionTargetsFromText } from "./substitutionApplicationLogic";

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
  /** 前提ノードの論理式テキスト（メタ変数自動抽出に使用） */
  readonly premiseFormulaText: string | undefined;
};

/** エッジバッジ編集状態のunion型 */
export type EdgeBadgeEditState = GenEditState | SubstitutionEditState;

// --- 編集状態の生成 ---

/**
 * InferenceEdgeから編集状態を生成する。
 * MPエッジ・NDエッジはパラメータ編集不可なのでundefined。
 * premiseFormulaTextは前提ノードの論理式テキスト（Substitutionの場合にメタ変数自動抽出に使用）。
 */
export function createEditStateFromEdge(
  edge: InferenceEdge,
  premiseFormulaText?: string,
): EdgeBadgeEditState | undefined {
  // NDエッジはパラメータ編集不可
  if (isNdInferenceEdge(edge)) {
    return undefined;
  }
  // TABエッジはパラメータ編集不可
  if (isTabInferenceEdge(edge)) {
    return undefined;
  }
  // ATエッジはパラメータ編集不可
  if (isAtInferenceEdge(edge)) {
    return undefined;
  }
  // SCエッジはパラメータ編集不可
  if (isScInferenceEdge(edge)) {
    return undefined;
  }
  if (edge._tag === "mp") {
    return undefined;
  }
  if (edge._tag === "gen") {
    return {
      _tag: "gen",
      conclusionNodeId: edge.conclusionNodeId,
      variableName: edge.variableName,
    };
  }
  // edge._tag === "substitution"（TypeScript narrowingで型安全）
  return {
    _tag: "substitution",
    conclusionNodeId: edge.conclusionNodeId,
    entries: edge.entries,
    premiseFormulaText,
  };
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
 *
 * premiseFormulaTextが指定された場合、前提スキーマから自動抽出されたメタ変数一覧をベースにし、
 * 既存のentriesから対応する値をマージする。
 * これにより、メタ変数の追加/削除はユーザーが手動で行う必要がなくなる。
 */
export function toSubstEditEntries(
  entries: SubstitutionEntries,
  premiseFormulaText?: string,
): readonly SubstEditEntry[] {
  // premiseFormulaTextが指定された場合、メタ変数を自動抽出してテンプレート生成
  if (premiseFormulaText !== undefined) {
    const targets = extractSubstitutionTargetsFromText(premiseFormulaText);
    if (targets !== null) {
      const extractedEntries: SubstEditEntry[] = [];

      // 論理式メタ変数
      for (const mv of targets.formulaMetaVariables) {
        const metaVarKey =
          mv.subscript !== undefined
            ? `${mv.name satisfies string}_${mv.subscript satisfies string}`
            : `${mv.name satisfies string}`;
        // 既存のentriesから値を探す
        const existing = entries.find(
          (e) =>
            e._tag === "FormulaSubstitution" && e.metaVariableName === mv.name,
        );
        extractedEntries.push({
          kind: "formula",
          metaVar: metaVarKey,
          value:
            existing !== undefined && existing._tag === "FormulaSubstitution"
              ? existing.formulaText
              : "",
        });
      }

      // 項メタ変数
      for (const tmv of targets.termMetaVariables) {
        const metaVarKey =
          tmv.subscript !== undefined
            ? `${tmv.name satisfies string}_${tmv.subscript satisfies string}`
            : `${tmv.name satisfies string}`;
        // 既存のentriesから値を探す
        const existing = entries.find(
          (e) =>
            e._tag === "TermSubstitution" && e.metaVariableName === tmv.name,
        );
        extractedEntries.push({
          kind: "term",
          metaVar: metaVarKey,
          value:
            existing !== undefined && existing._tag === "TermSubstitution"
              ? existing.termText
              : "",
        });
      }

      /* v8 ignore start -- parse成功時はメタ変数が必ず存在するため extractedEntries は非空 */
      if (extractedEntries.length === 0) {
        // fall through to フォールバック
      } else {
        /* v8 ignore stop */
        return extractedEntries;
      }
    }
  }

  // フォールバック: 既存のentriesをそのまま変換
  if (entries.length === 0) {
    return [{ kind: "formula", metaVar: "", value: "" }];
  }
  return entries.map((entry) => {
    if (entry._tag === "FormulaSubstitution") {
      return {
        kind: "formula" as const,
        metaVar: entry.metaVariableName,
        value: entry.formulaText,
      };
    }
    // entry._tag === "TermSubstitution"（TypeScript narrowingで型安全）
    return {
      kind: "term" as const,
      metaVar: entry.metaVariableName,
      value: entry.termText,
    };
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
 * Substitution編集のエントリの代入値を更新する。
 * メタ変数名と種別は自動抽出されるため、valueフィールドのみ更新可能。
 */
export function updateSubstEditEntryValue(
  entries: readonly SubstEditEntry[],
  index: number,
  value: string,
): readonly SubstEditEntry[] {
  return entries.map((entry, i) => (i === index ? { ...entry, value } : entry));
}

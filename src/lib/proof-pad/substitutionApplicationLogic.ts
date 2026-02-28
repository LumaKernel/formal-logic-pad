/**
 * 代入操作（Substitution Application）ノードのための純粋ロジック。
 *
 * 公理スキーマやその他の論理式に対して、メタ変数代入を適用し結果を返す。
 * 代入エントリは「φ := p → q」のような形式で指定される。
 * UI層（ProofWorkspace.tsx）から利用される。
 *
 * 変更時は substitutionApplicationLogic.test.ts, ProofWorkspace.tsx, workspaceState.ts, index.ts も同期すること。
 */

import { Data, Effect, Either } from "effect";
import type { Formula } from "../logic-core/formula";
import type { GreekLetter } from "../logic-core/greekLetters";
import {
  substituteFormulaMetaVariables,
  substituteTermMetaVariablesInFormula,
  type FormulaSubstitutionMap,
  type TermMetaSubstitutionMap,
} from "../logic-core/substitution";
import {
  metaVariableKey,
  termMetaVariableKey,
  collectUniqueFormulaMetaVariables,
  collectUniqueTermMetaVariablesInFormula,
} from "../logic-core/metaVariable";
import type { MetaVariable } from "../logic-core/formula";
import type { TermMetaVariable } from "../logic-core/term";
import { formatFormula } from "../logic-lang/formatUnicode";
import {
  parseString as parseFormula,
  parseTermString,
} from "../logic-lang/parser";
import { parseNodeFormula } from "./mpApplicationLogic";
import type { WorkspaceState } from "./workspaceState";

// --- 代入エントリ ---

/**
 * 論理式メタ変数の代入エントリ。
 * 例: φ := p → q
 */
export type FormulaSubstitutionEntry = {
  readonly _tag: "FormulaSubstitution";
  /** メタ変数名（例: "φ"） */
  readonly metaVariableName: GreekLetter;
  /** メタ変数の添字（省略可） */
  readonly metaVariableSubscript?: string;
  /** 代入先の論理式テキスト */
  readonly formulaText: string;
};

/**
 * 項メタ変数の代入エントリ。
 * 例: t := S(0)
 */
export type TermSubstitutionEntry = {
  readonly _tag: "TermSubstitution";
  /** 項メタ変数名（例: "τ"） */
  readonly metaVariableName: GreekLetter;
  /** メタ変数の添字（省略可） */
  readonly metaVariableSubscript?: string;
  /** 代入先の項テキスト */
  readonly termText: string;
};

/** 代入エントリ（論理式 or 項） */
export type SubstitutionEntry =
  | FormulaSubstitutionEntry
  | TermSubstitutionEntry;

// --- 代入ノード固有のフィールド ---

/**
 * 代入ノードの代入テキスト形式。
 * WorkspaceNode.substitutionEntries に格納される。
 */
export type SubstitutionEntries = readonly SubstitutionEntry[];

// --- 代入適用の結果型 ---

/** 代入適用の成功結果 */
export type SubstitutionApplicationSuccess = {
  readonly conclusion: Formula;
  readonly conclusionText: string;
};

/** 代入適用のエラー（Data.TaggedError） */
export class SubstPremiseMissing extends Data.TaggedError(
  "SubstPremiseMissing",
)<Record<string, never>> {}
export class SubstPremiseParseError extends Data.TaggedError(
  "SubstPremiseParseError",
)<{
  readonly nodeId: string;
}> {}
export class SubstNoEntries extends Data.TaggedError("SubstNoEntries")<
  Record<string, never>
> {}
export class SubstFormulaParseError extends Data.TaggedError(
  "SubstFormulaParseError",
)<{
  readonly entryIndex: number;
  readonly formulaText: string;
}> {}
export class SubstTermParseError extends Data.TaggedError(
  "SubstTermParseError",
)<{
  readonly entryIndex: number;
  readonly termText: string;
}> {}

export type SubstitutionApplicationError =
  | SubstPremiseMissing
  | SubstPremiseParseError
  | SubstNoEntries
  | SubstFormulaParseError
  | SubstTermParseError;

/** 代入適用の結果型（Either: Right=成功, Left=エラー） */
export type SubstitutionApplicationResult = Either.Either<
  SubstitutionApplicationSuccess,
  SubstitutionApplicationError
>;

// --- 代入ノードの前提接続を取得 ---

/**
 * 代入ノード/derivedノードに関連する前提ノードのIDを取得する。
 * InferenceEdge（source of truth）から取得する。
 */
export function getSubstitutionPremise(
  state: WorkspaceState,
  substitutionNodeId: string,
): string | undefined {
  const substEdge = state.inferenceEdges.find(
    (e) =>
      e._tag === "substitution" && e.conclusionNodeId === substitutionNodeId,
  );
  if (substEdge && substEdge._tag === "substitution") {
    return substEdge.premiseNodeId;
  }

  return undefined;
}

// --- 代入マップの構築 ---

/**
 * 代入エントリから FormulaSubstitutionMap を構築する。
 * パース失敗時はエラーを返す。
 */
export function buildFormulaSubstitutionMap(entries: SubstitutionEntries):
  | {
      readonly _tag: "Ok";
      readonly map: FormulaSubstitutionMap;
    }
  | {
      readonly _tag: "Error";
      readonly entryIndex: number;
      readonly formulaText: string;
    } {
  const map = new Map<string, Formula>();

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    if (entry === undefined || entry._tag !== "FormulaSubstitution") continue;

    const parseResult = parseFormula(entry.formulaText);
    if (!parseResult.ok) {
      return {
        _tag: "Error",
        entryIndex: i,
        formulaText: entry.formulaText,
      };
    }

    const key = metaVariableKey({
      _tag: "MetaVariable",
      name: entry.metaVariableName,
      subscript: entry.metaVariableSubscript,
    });
    map.set(key, parseResult.formula);
  }

  return { _tag: "Ok", map };
}

/**
 * 代入エントリから TermMetaSubstitutionMap を構築する。
 * 項テキストのパースには parseTermString を使う。
 * パース失敗時はエラーを返す。
 */
export function buildTermSubstitutionMap(entries: SubstitutionEntries):
  | {
      readonly _tag: "Ok";
      readonly map: TermMetaSubstitutionMap;
    }
  | {
      readonly _tag: "Error";
      readonly entryIndex: number;
      readonly termText: string;
    } {
  const map = new Map<string, import("../logic-core/term").Term>();

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    if (entry === undefined || entry._tag !== "TermSubstitution") continue;

    const parseResult = parseTermString(entry.termText);
    if (!parseResult.ok) {
      return {
        _tag: "Error",
        entryIndex: i,
        termText: entry.termText,
      };
    }

    const key = termMetaVariableKey({
      _tag: "TermMetaVariable",
      name: entry.metaVariableName,
      subscript: entry.metaVariableSubscript,
    });
    map.set(key, parseResult.term);
  }

  return { _tag: "Ok", map };
}

// --- 代入適用のバリデーション ---

/**
 * 代入ノードの接続状態を検証し、適用結果を返す（Effect版）。
 *
 * premise: 前提の論理式（公理スキーマ等）
 * entries: 代入エントリのリスト
 *
 * 前提が接続され、パース可能であれば代入を適用し、
 * 成功時は結論式とそのテキスト表現を返す。
 *
 * @returns Effect<SubstitutionApplicationSuccess, SubstitutionApplicationError>
 */
export const validateSubstitutionApplicationEffect = (
  state: WorkspaceState,
  substitutionNodeId: string,
  entries: SubstitutionEntries,
): Effect.Effect<
  SubstitutionApplicationSuccess,
  SubstitutionApplicationError
> =>
  Effect.gen(function* () {
    if (entries.length === 0) {
      return yield* Effect.fail(new SubstNoEntries({}));
    }

    const premiseNodeId = getSubstitutionPremise(state, substitutionNodeId);

    if (premiseNodeId === undefined) {
      return yield* Effect.fail(new SubstPremiseMissing({}));
    }

    // ノードを取得
    const premiseNode = state.nodes.find((n) => n.id === premiseNodeId);

    /* v8 ignore start -- 防御的コード: 接続があるがノードが削除済みのケース（通常到達不能） */
    if (!premiseNode) {
      return yield* Effect.fail(new SubstPremiseMissing({}));
    }
    /* v8 ignore stop */

    // パース
    const premiseFormula = parseNodeFormula(premiseNode);
    if (!premiseFormula) {
      return yield* Effect.fail(
        new SubstPremiseParseError({ nodeId: premiseNodeId }),
      );
    }

    // 論理式メタ変数代入マップを構築
    const formulaMapResult = buildFormulaSubstitutionMap(entries);
    if (formulaMapResult._tag === "Error") {
      return yield* Effect.fail(
        new SubstFormulaParseError({
          entryIndex: formulaMapResult.entryIndex,
          formulaText: formulaMapResult.formulaText,
        }),
      );
    }

    // 項メタ変数代入マップを構築
    const termMapResult = buildTermSubstitutionMap(entries);
    if (termMapResult._tag === "Error") {
      return yield* Effect.fail(
        new SubstTermParseError({
          entryIndex: termMapResult.entryIndex,
          termText: termMapResult.termText,
        }),
      );
    }

    // 代入を適用
    let result = premiseFormula;
    if (formulaMapResult.map.size > 0) {
      result = substituteFormulaMetaVariables(result, formulaMapResult.map);
    }
    if (termMapResult.map.size > 0) {
      result = substituteTermMetaVariablesInFormula(result, termMapResult.map);
    }

    return {
      conclusion: result,
      conclusionText: formatFormula(result),
    };
  });

/**
 * 代入ノードの接続状態を検証し、適用結果を返す（互換ラッパー: Either を返す同期版）。
 */
export const validateSubstitutionApplication = (
  state: WorkspaceState,
  substitutionNodeId: string,
  entries: SubstitutionEntries,
): SubstitutionApplicationResult =>
  Effect.runSync(
    Effect.either(
      validateSubstitutionApplicationEffect(state, substitutionNodeId, entries),
    ),
  );

// --- エラーメッセージ ---

/**
 * 代入適用エラーに対する人間向けメッセージを返す。
 */
export function getSubstitutionErrorMessage(
  error: SubstitutionApplicationError,
): string {
  switch (error._tag) {
    case "SubstPremiseMissing":
      return "Connect a premise to apply substitution";
    case "SubstPremiseParseError":
      return "Premise has invalid formula";
    case "SubstNoEntries":
      return "Add at least one substitution entry";
    case "SubstFormulaParseError":
      return `Invalid formula in substitution entry ${String(error.entryIndex + 1) satisfies string}`;
    case "SubstTermParseError":
      return `Invalid term in substitution entry ${String(error.entryIndex + 1) satisfies string}`;
  }
}

// --- 代入対象の抽出 ---

/**
 * 論理式から代入対象となるメタ変数を抽出した結果。
 */
export type SubstitutionTargets = {
  /** 論理式メタ変数（ユニーク、出現順） */
  readonly formulaMetaVariables: readonly MetaVariable[];
  /** 項メタ変数（ユニーク、出現順） */
  readonly termMetaVariables: readonly TermMetaVariable[];
};

/**
 * 論理式から代入対象となるすべてのメタ変数を抽出する。
 *
 * 論理式メタ変数（φ, ψ等）と項メタ変数（τ, σ等）を
 * それぞれユニークかつ出現順で返す。
 */
export function extractSubstitutionTargets(
  formula: Formula,
): SubstitutionTargets {
  return {
    formulaMetaVariables: collectUniqueFormulaMetaVariables(formula),
    termMetaVariables: collectUniqueTermMetaVariablesInFormula(formula),
  };
}

/**
 * テキスト形式の論理式から代入対象を抽出する。
 * パース失敗時は null を返す。
 */
export function extractSubstitutionTargetsFromText(
  formulaText: string,
): SubstitutionTargets | null {
  const parseResult = parseFormula(formulaText);
  if (!parseResult.ok) {
    return null;
  }
  return extractSubstitutionTargets(parseResult.formula);
}

/**
 * 代入対象のメタ変数から空のSubstitutionEntriesテンプレートを生成する。
 *
 * 各メタ変数に対応する空テキストの代入エントリを生成する。
 * UIで値を入力すれば代入操作が完了する形。
 */
export function generateSubstitutionEntryTemplate(
  targets: SubstitutionTargets,
): SubstitutionEntries {
  const entries: SubstitutionEntry[] = [];

  for (const mv of targets.formulaMetaVariables) {
    entries.push({
      _tag: "FormulaSubstitution",
      metaVariableName: mv.name,
      metaVariableSubscript: mv.subscript,
      formulaText: "",
    });
  }

  for (const tmv of targets.termMetaVariables) {
    entries.push({
      _tag: "TermSubstitution",
      metaVariableName: tmv.name,
      metaVariableSubscript: tmv.subscript,
      termText: "",
    });
  }

  return entries;
}

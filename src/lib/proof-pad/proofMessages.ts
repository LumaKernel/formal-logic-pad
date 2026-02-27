/**
 * 証明ワークスペースのUI文字列定義（純粋ロジック）。
 *
 * ProofWorkspace で表示されるすべてのユーザー向けメッセージのキーとデフォルト値を定義する。
 * i18n対応のため、純粋ロジック層はメッセージキーとデフォルト英語メッセージを提供し、
 * UI層（ProofMessagesContext）がロケールに応じた翻訳を注入する。
 *
 * 変更時は proofMessages.test.ts, ProofMessagesContext.tsx, messages/en.json, messages/ja.json,
 * ProofWorkspace.tsx, WorkspaceContent.tsx (useProofMessagesFromIntl), index.ts も同期すること。
 * ProofMessages に新しいキーを追加した場合、WorkspaceContent.tsx の useProofMessagesFromIntl が
 * コンパイルエラーになるので、そこも必ず更新する。
 */

import type { MPApplicationError } from "./mpApplicationLogic";
import type { GenApplicationError } from "./genApplicationLogic";

// --- メッセージキー定義 ---

/**
 * ProofWorkspace のすべてのUI文字列。
 * キー名は英語で意味が明確な識別子。
 * 値は表示用テキスト（デフォルトは英語）。
 */
export type ProofMessages = {
  // --- MP ---
  readonly mpApply: string;
  readonly mpCancel: string;
  readonly mpApplied: string;
  readonly mpErrorBothMissing: string;
  readonly mpErrorLeftMissing: string;
  readonly mpErrorRightMissing: string;
  readonly mpErrorLeftParse: string;
  readonly mpErrorRightParse: string;
  readonly mpErrorNotImplication: string;
  readonly mpErrorPremiseMismatch: string;
  readonly mpErrorGeneric: string;
  readonly mpBannerSelectLeft: string;
  readonly mpBannerSelectRight: string;

  // --- Gen ---
  readonly genApply: string;
  readonly genCancel: string;
  readonly genApplied: string;
  readonly genErrorPremiseMissing: string;
  readonly genErrorPremiseParse: string;
  readonly genErrorVariableEmpty: string;
  readonly genErrorNotEnabled: string;
  readonly genErrorGeneric: string;
  /** `{variableName}` プレースホルダーを含む */
  readonly genBannerSelectPremise: string;

  // --- ゴール ---
  readonly goalLabel: string;
  readonly goalPlaceholder: string;
  readonly goalProved: string;
  readonly goalNotYet: string;
  readonly goalInvalidFormula: string;
  readonly proofComplete: string;

  // --- 選択バナー ---
  /** `{count}` プレースホルダーを含む */
  readonly selectionCount: string;
  readonly selectionCopy: string;
  readonly selectionCut: string;
  readonly selectionPaste: string;
  readonly selectionDuplicate: string;
  readonly selectionDelete: string;
  readonly selectionClear: string;
  readonly cancel: string;

  // --- ヘッダー ---
  readonly logicSystemLabel: string;
  readonly questBadge: string;
  readonly convertToFree: string;
  readonly autoLayout: string;
  readonly layoutTopToBottom: string;
  readonly layoutBottomToTop: string;
  readonly exportJSON: string;
  readonly exportSVG: string;
  readonly exportPNG: string;
  readonly importJSON: string;

  // --- コンテキストメニュー ---
  readonly selectSubtree: string;
  readonly addAxiomNode: string;
  readonly addGoalNode: string;
  readonly addNode: string;
  readonly useAsMPLeft: string;
  readonly useAsMPRight: string;
  readonly applyGenToNode: string;
  readonly deleteNode: string;
  readonly deleteConnection: string;
  /** `{variableName}` プレースホルダーを含む */
  readonly genVariablePrompt: string;

  // --- 公理制限 ---
  readonly proofCompleteButAxiomViolation: string;
  /** `{axiomIds}` プレースホルダーを含む */
  readonly axiomViolationDetail: string;
};

// --- デフォルトメッセージ（英語） ---

export const defaultProofMessages: ProofMessages = {
  // MP
  mpApply: "Apply MP",
  mpCancel: "Cancel MP",
  mpApplied: "MP applied",
  mpErrorBothMissing: "Connect premises to apply MP",
  mpErrorLeftMissing: "Left premise (\u03C6) not connected",
  mpErrorRightMissing: "Right premise (\u03C6\u2192\u03C8) not connected",
  mpErrorLeftParse: "Left premise has invalid formula",
  mpErrorRightParse: "Right premise has invalid formula",
  mpErrorNotImplication:
    "Right premise must be an implication (\u03C6\u2192\u03C8)",
  mpErrorPremiseMismatch:
    "Left premise does not match antecedent of right premise",
  mpErrorGeneric: "MP application failed",
  mpBannerSelectLeft: "Click the left premise (\u03C6)",
  mpBannerSelectRight: "Click the right premise (\u03C6\u2192\u03C8)",

  // Gen
  genApply: "Apply Gen",
  genCancel: "Cancel Gen",
  genApplied: "Gen applied",
  genErrorPremiseMissing: "Connect a premise to apply Gen",
  genErrorPremiseParse: "Premise has invalid formula",
  genErrorVariableEmpty: "Enter a variable name",
  genErrorNotEnabled: "Gen is not enabled in this logic system",
  genErrorGeneric: "Generalization failed",
  genBannerSelectPremise:
    "Click the premise (\u03C6) to generalize over {variableName}",

  // Goal
  goalLabel: "Goal:",
  goalPlaceholder: "e.g. phi -> phi",
  goalProved: "Proved!",
  goalNotYet: "Not yet",
  goalInvalidFormula: "Invalid formula",
  proofComplete: "Proof Complete!",

  // Selection banner
  selectionCount: "{count} node(s) selected",
  selectionCopy: "Copy",
  selectionCut: "Cut",
  selectionPaste: "Paste",
  selectionDuplicate: "Duplicate",
  selectionDelete: "Delete",
  selectionClear: "Clear",
  cancel: "Cancel",

  // Header
  logicSystemLabel: "Logic System:",
  questBadge: "Quest",
  convertToFree: "Convert to Free",
  autoLayout: "Auto Layout",
  layoutTopToBottom: "Top\u2192Bottom",
  layoutBottomToTop: "Bottom\u2192Top",
  exportJSON: "Export JSON",
  exportSVG: "Export SVG",
  exportPNG: "Export PNG",
  importJSON: "Import JSON",

  // Context menu
  selectSubtree: "Select Subtree",
  addAxiomNode: "Add Axiom Node",
  addGoalNode: "Add Goal Node",
  addNode: "Add Node",
  useAsMPLeft: "Use as MP Left (\u03C6)",
  useAsMPRight: "Use as MP Right (\u03C6\u2192\u03C8)",
  applyGenToNode: "Apply Gen",
  deleteNode: "Delete Node",
  deleteConnection: "Delete Connection",
  genVariablePrompt: "Variable name:",

  // Axiom restriction
  proofCompleteButAxiomViolation: "Proof Complete (axiom restriction violated)",
  axiomViolationDetail: "Disallowed axiom(s) used: {axiomIds}",
};

// --- エラー → メッセージキー変換（純粋関数） ---

/**
 * MP適用エラーに対応するメッセージキーを返す。
 */
export function getMPErrorMessageKey(
  error: MPApplicationError,
): keyof ProofMessages {
  switch (error._tag) {
    case "BothPremisesMissing":
      return "mpErrorBothMissing";
    case "LeftPremiseMissing":
      return "mpErrorLeftMissing";
    case "RightPremiseMissing":
      return "mpErrorRightMissing";
    case "LeftParseError":
      return "mpErrorLeftParse";
    case "RightParseError":
      return "mpErrorRightParse";
    case "RuleError": {
      switch (error.error._tag) {
        case "NotAnImplication":
          return "mpErrorNotImplication";
        case "PremiseMismatch":
          return "mpErrorPremiseMismatch";
        /* v8 ignore start -- exhaustive check: other error types not reachable from applyModusPonens */
        default:
          return "mpErrorGeneric";
        /* v8 ignore stop */
      }
    }
  }
}

/**
 * Gen適用エラーに対応するメッセージキーを返す。
 */
export function getGenErrorMessageKey(
  error: GenApplicationError,
): keyof ProofMessages {
  switch (error._tag) {
    case "PremiseMissing":
      return "genErrorPremiseMissing";
    case "PremiseParseError":
      return "genErrorPremiseParse";
    case "VariableNameEmpty":
      return "genErrorVariableEmpty";
    case "GeneralizationNotEnabled":
      return "genErrorNotEnabled";
    case "RuleError":
      return "genErrorGeneric";
  }
}

/**
 * メッセージテンプレート内のプレースホルダーを置換する。
 * `{key}` 形式のプレースホルダーを `params[key]` の値で置換する。
 */
export function formatMessage(
  template: string,
  params: Readonly<Record<string, string>>,
): string {
  let result = template;
  for (const [key, value] of Object.entries(params)) {
    result = result.replace(`{${key satisfies string}}`, value);
  }
  return result;
}

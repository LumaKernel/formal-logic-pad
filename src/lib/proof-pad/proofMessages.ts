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
import type { SubstitutionApplicationError } from "./substitutionApplicationLogic";

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

  // --- ゴールパネル ---
  readonly goalPanelTitle: string;
  /** `{achieved}` と `{total}` プレースホルダーを含む */
  readonly goalPanelProgress: string;
  readonly goalPanelAllowedAxioms: string;

  // --- 選択バナー ---
  /** `{count}` プレースホルダーを含む */
  readonly selectionCount: string;
  readonly selectionCopy: string;
  readonly selectionCut: string;
  readonly selectionPaste: string;
  readonly selectionDuplicate: string;
  readonly selectionDelete: string;
  readonly selectionMerge: string;
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

  // --- Substitution ---
  readonly applySubstitution: string;
  readonly substitutionApplied: string;
  readonly substErrorPremiseMissing: string;
  readonly substErrorPremiseParse: string;
  readonly substErrorNoEntries: string;
  readonly substErrorFormulaParse: string;
  readonly substErrorTermParse: string;
  readonly substEntryPrompt: string;

  // --- コンテキストメニュー ---
  readonly selectSubtree: string;
  readonly addNode: string;
  readonly useAsMPLeft: string;
  readonly useAsMPRight: string;
  readonly applyGenToNode: string;
  readonly applySubstitutionToNode: string;
  readonly mergeWithNode: string;
  readonly duplicateNode: string;
  readonly deleteNode: string;
  readonly deleteConnection: string;
  /** `{variableName}` プレースホルダーを含む */
  readonly genVariablePrompt: string;

  // --- マージ選択 ---
  readonly mergeBannerSelectTarget: string;
  readonly mergeCancel: string;
  readonly mergeNoTargets: string;

  // --- 公理制限 ---
  readonly proofCompleteButAxiomViolation: string;
  /** `{axiomIds}` プレースホルダーを含む */
  readonly axiomViolationDetail: string;
  /** 公理インスタンスが直接ルートノードに配置されている場合のメッセージ */
  readonly instanceRootViolationDetail: string;

  // --- TAB ---
  /** `{ruleName}` プレースホルダーを含む */
  readonly tabBannerSelectNode: string;
  readonly tabCancel: string;
  readonly tabApplied: string;
  readonly tabError: string;
  /** コンテキストメニュー: TAB規則適用 */
  readonly applyTabRuleToNode: string;
  /** 主論理式位置プロンプト */
  readonly tabPositionPrompt: string;
  /** 交換位置プロンプト */
  readonly tabExchangePositionPrompt: string;
  /** 代入項プロンプト */
  readonly tabTermPrompt: string;
  /** 固有変数プロンプト */
  readonly tabEigenVariablePrompt: string;

  // --- AT (分析的タブロー) ---
  /** `{ruleName}` プレースホルダーを含む */
  readonly atBannerSelectNode: string;
  readonly atCancel: string;
  readonly atApplied: string;
  readonly atError: string;
  /** コンテキストメニュー: AT規則適用 */
  readonly applyAtRuleToNode: string;
  /** 代入項プロンプト（γ規則用） */
  readonly atTermPrompt: string;
  /** 固有変数プロンプト（δ規則用） */
  readonly atEigenVariablePrompt: string;
  /** 矛盾ノード選択プロンプト（closure用） */
  readonly atClosureBannerSelectContradiction: string;

  // --- カット除去ステッパー ---
  readonly cutEliminationTitle: string;
  /** `{cutCount}` プレースホルダーを含む */
  readonly cutEliminationCuts: string;
  readonly cutEliminationCutFree: string;
  /** `{current}` と `{total}` プレースホルダーを含む */
  readonly cutEliminationStepProgress: string;
  readonly cutEliminationInitialState: string;
  /** `{depth}` と `{rank}` プレースホルダーを含む */
  readonly cutEliminationStepInfo: string;
  readonly cutEliminationSuccess: string;
  readonly cutEliminationFailure: string;
  readonly cutEliminationNoCuts: string;
  /** `{stepsUsed}` プレースホルダーを含む。ステップ上限超過時に表示 */
  readonly cutEliminationStepLimitExceeded?: string;
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

  // Goal panel
  goalPanelTitle: "Goals",
  goalPanelProgress: "{achieved} / {total}",
  goalPanelAllowedAxioms: "Allowed axioms: {axiomIds}",

  // Selection banner
  selectionCount: "{count} node(s) selected",
  selectionCopy: "Copy",
  selectionCut: "Cut",
  selectionPaste: "Paste",
  selectionDuplicate: "Duplicate",
  selectionDelete: "Delete",
  selectionMerge: "Merge",
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

  // Substitution
  applySubstitution: "Apply Substitution",
  substitutionApplied: "Substitution applied",
  substErrorPremiseMissing: "Connect a premise to apply substitution",
  substErrorPremiseParse: "Premise has invalid formula",
  substErrorNoEntries: "Add at least one substitution entry",
  substErrorFormulaParse: "Invalid formula in substitution entry",
  substErrorTermParse: "Invalid term in substitution entry",
  substEntryPrompt: "Substitution entries:",

  // Context menu
  selectSubtree: "Select Subtree",
  addNode: "Add Node",
  useAsMPLeft: "Use as MP Left (\u03C6)",
  useAsMPRight: "Use as MP Right (\u03C6\u2192\u03C8)",
  applyGenToNode: "Apply Gen",
  applySubstitutionToNode: "Apply Substitution",
  mergeWithNode: "Merge with\u2026",
  duplicateNode: "Duplicate Node",
  deleteNode: "Delete Node",
  deleteConnection: "Delete Connection",
  genVariablePrompt: "Variable name:",

  // Merge selection
  mergeBannerSelectTarget: "Click a node with the same formula to merge",
  mergeCancel: "Cancel Merge",
  mergeNoTargets: "No mergeable nodes found",

  // Axiom restriction
  proofCompleteButAxiomViolation: "Proof Complete (axiom restriction violated)",
  axiomViolationDetail: "Disallowed axiom(s) used: {axiomIds}",
  instanceRootViolationDetail:
    "Axiom instances must be derived via substitution, not placed directly.",

  // TAB
  tabBannerSelectNode: "Click a sequent node to apply {ruleName}",
  tabCancel: "Cancel TAB",
  tabApplied: "TAB rule applied",
  tabError: "TAB rule application failed",
  applyTabRuleToNode: "Apply TAB Rule",
  tabPositionPrompt: "Principal formula position (0-based):",
  tabExchangePositionPrompt: "Exchange position (0-based):",
  tabTermPrompt: "Substitution term:",
  tabEigenVariablePrompt: "Eigen variable name:",

  // AT (Analytic Tableau)
  atBannerSelectNode: "Click a node to apply {ruleName}",
  atCancel: "Cancel AT",
  atApplied: "AT rule applied",
  atError: "AT rule application failed",
  applyAtRuleToNode: "Apply AT Rule",
  atTermPrompt: "Substitution term:",
  atEigenVariablePrompt: "Eigen variable name:",
  atClosureBannerSelectContradiction:
    "Click the contradicting node to close the branch",

  // Cut elimination stepper
  cutEliminationTitle: "Cut Elimination",
  cutEliminationCuts: "{cutCount} cut(s)",
  cutEliminationCutFree: "Cut-free",
  cutEliminationStepProgress: "Step {current} / {total}",
  cutEliminationInitialState: "Initial proof",
  cutEliminationStepInfo: "depth={depth}, rank={rank}",
  cutEliminationSuccess: "Cut elimination succeeded",
  cutEliminationFailure: "Cut elimination failed",
  cutEliminationNoCuts: "Proof is already cut-free",
  cutEliminationStepLimitExceeded: "Step limit exceeded ({stepsUsed} steps)",
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
    case "MPRuleError": {
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
    case "GenPremiseMissing":
      return "genErrorPremiseMissing";
    case "GenPremiseParseError":
      return "genErrorPremiseParse";
    case "GenVariableNameEmpty":
      return "genErrorVariableEmpty";
    case "GenGeneralizationNotEnabled":
      return "genErrorNotEnabled";
    case "GenRuleError":
      return "genErrorGeneric";
  }
}

/**
 * Substitution適用エラーに対応するメッセージキーを返す。
 */
export function getSubstitutionErrorMessageKey(
  error: SubstitutionApplicationError,
): keyof ProofMessages {
  switch (error._tag) {
    case "SubstPremiseMissing":
      return "substErrorPremiseMissing";
    case "SubstPremiseParseError":
      return "substErrorPremiseParse";
    case "SubstNoEntries":
      return "substErrorNoEntries";
    case "SubstFormulaParseError":
      return "substErrorFormulaParse";
    case "SubstTermParseError":
      return "substErrorTermParse";
  }
}

// --- バリデーション結果 → UI表示変換（共通モジュールから re-export） ---

export {
  type ValidationDisplay,
  processValidationResult,
  formatMessage,
} from "../validation-display";

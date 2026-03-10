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
  /** ゴールの式は一致しているが公理制限違反 */
  readonly goalAxiomViolation: string;
  /** ゴールの式は一致しているが推論規則制限違反 */
  readonly goalRuleViolation: string;
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
  readonly duplicateToFree: string;
  readonly treeLayoutTopToBottom: string;
  readonly treeLayoutBottomToTop: string;
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
  readonly selectProof: string;
  readonly addNode: string;
  readonly canvasMenuPaste: string;
  readonly useAsMPLeft: string;
  readonly useAsMPRight: string;
  readonly applyGenToNode: string;
  readonly applySubstitutionToNode: string;
  readonly mergeWithNode: string;
  readonly duplicateNode: string;
  readonly deleteNode: string;
  readonly deleteConnection: string;
  readonly saveToCollection: string;
  readonly savedToCollection: string;
  /** `{variableName}` プレースホルダーを含む */
  readonly genVariablePrompt: string;

  // --- マージ選択 ---
  readonly mergeBannerSelectTarget: string;
  readonly mergeCancel: string;
  readonly mergeNoTargets: string;

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
  /** カット除去起動ボタンテキスト */
  readonly cutEliminationStart: string;
  /** カット除去閉じるボタンテキスト */
  readonly cutEliminationClose: string;
  /** 証明ツリー構築エラー: `{error}` プレースホルダーを含む */
  readonly cutEliminationBuildError: string;
  /** 証明ルートが見つからないエラー */
  readonly cutEliminationNoRoot: string;
  /** 複数ルートエラー */
  readonly cutEliminationMultipleRoots: string;

  // --- ノードラベル・ロールバッジ ---
  readonly roleAxiom: string;
  readonly roleRoot: string;
  readonly roleDerived: string;
  readonly dependsOn: string;
  readonly protectedBadge: string;
  /** `{axiomName}` プレースホルダーを含む */
  readonly axiomIdentifiedTooltip: string;
  readonly protectedQuestTooltip: string;
  readonly derivedNodeAutoTooltip: string;
  readonly formulaEditorPlaceholder: string;
  readonly formulaEditorPlaceholderDblclick: string;
  /** コンテキストメニュー: 論理式を編集 */
  readonly editFormula: string;
  readonly substitutionKindFormula: string;
  readonly substitutionKindTerm: string;

  // --- パレットヘッダー ---
  readonly axiomPaletteHeader: string;
  readonly ndPaletteHeader: string;
  readonly ndAddAssumption: string;
  readonly ndRulesSection: string;
  readonly tabPaletteHeader: string;
  readonly tabAddSequent: string;
  readonly tabRulesSection: string;
  readonly scPaletteHeader: string;
  readonly scAddSequent: string;
  readonly scRulesSection: string;
  /** SC規則適用のプロンプト */
  readonly scPositionPrompt: string;
  readonly scExchangePositionPrompt: string;
  readonly scTermPrompt: string;
  readonly scEigenVariablePrompt: string;
  readonly scCutFormulaPrompt: string;
  readonly scComponentIndexPrompt: string;
  readonly scApplyRuleToNode: string;
  /** `{ruleName}` プレースホルダーを含む */
  readonly scBannerSelectNode: string;
  readonly scCancel: string;
  readonly atPaletteHeader: string;
  readonly atAddFormula: string;
  readonly atAlphaRules: string;
  readonly atBetaRules: string;
  readonly atGammaDeltaRules: string;
  readonly atClosureRules: string;

  // --- ノード作成ラベル ---
  readonly nodeLabelAxiom: string;
  readonly nodeLabelAssumption: string;
  readonly nodeLabelSequent: string;
  readonly nodeLabelSignedFormula: string;

  // --- ペースト互換性 ---
  /** `{sourceStyle}` と `{targetStyle}` プレースホルダーを含む */
  readonly pasteIncompatibleStyle: string;

  // --- アクセシビリティ ---
  readonly workspaceMenuAriaLabel: string;

  // --- 証明コレクションパネル ---
  readonly openCollection: string;
  readonly collectionPanelTitle: string;
  readonly collectionEmpty: string;
  readonly collectionEntryDelete: string;
  readonly collectionEntryImport: string;
  readonly collectionEntryMemoPlaceholder: string;
  /** `{count}` プレースホルダーを含む */
  readonly collectionEntryCount: string;

  // --- フォルダ管理 ---
  readonly collectionCreateFolder: string;
  readonly collectionFolderNamePlaceholder: string;
  readonly collectionFolderDelete: string;
  readonly collectionFolderRename: string;
  readonly collectionMoveToFolder: string;
  readonly collectionMoveToRoot: string;
  readonly collectionRootEntries: string;
  /** `{count}` プレースホルダーを含む */
  readonly collectionFolderEntryCount: string;

  // --- 互換性チェック ---
  /** 公理不足の警告。`{axiomIds}` プレースホルダーを含む */
  readonly collectionAxiomWarning: string;
  /** スタイル不一致の警告。`{sourceStyle}` と `{targetStyle}` プレースホルダーを含む */
  readonly collectionStyleMismatch: string;
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
  goalAxiomViolation: "Axiom violation",
  goalRuleViolation: "Rule violation",
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
  duplicateToFree: "Duplicate as Free",
  treeLayoutTopToBottom: "Tree Layout (Top\u2192Bottom)",
  treeLayoutBottomToTop: "Tree Layout (Bottom\u2192Top)",
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
  selectProof: "Select Proof",
  addNode: "Add Node",
  canvasMenuPaste: "Paste",
  useAsMPLeft: "Use as MP Left (\u03C6)",
  useAsMPRight: "Use as MP Right (\u03C6\u2192\u03C8)",
  applyGenToNode: "Apply Gen",
  applySubstitutionToNode: "Apply Substitution",
  mergeWithNode: "Merge with\u2026",
  duplicateNode: "Duplicate Node",
  deleteNode: "Delete Node",
  deleteConnection: "Delete Connection",
  saveToCollection: "Save to Collection",
  savedToCollection: "Saved to collection",
  genVariablePrompt: "Variable name:",

  // Merge selection
  mergeBannerSelectTarget: "Click a node with the same formula to merge",
  mergeCancel: "Cancel Merge",
  mergeNoTargets: "No mergeable nodes found",

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
  cutEliminationStart: "Run Cut Elimination",
  cutEliminationClose: "Close",
  cutEliminationBuildError: "Failed to build proof tree: {error}",
  cutEliminationNoRoot: "No SC proof root found",
  cutEliminationMultipleRoots: "Multiple proof roots found (not supported yet)",

  // Node labels / role badges
  roleAxiom: "AXIOM",
  roleRoot: "ROOT",
  roleDerived: "DERIVED",
  dependsOn: "Depends on:",
  protectedBadge: "QUEST",
  axiomIdentifiedTooltip: "Identified as axiom: {axiomName}",
  protectedQuestTooltip: "Protected quest goal (read-only)",
  derivedNodeAutoTooltip: "Derived node (role is automatic)",
  formulaEditorPlaceholder: "Click to edit formula...",
  formulaEditorPlaceholderDblclick: "Double-click to edit formula...",
  editFormula: "Edit Formula",
  substitutionKindFormula: "Formula",
  substitutionKindTerm: "Term",

  // Palette headers
  axiomPaletteHeader: "Axioms",
  ndPaletteHeader: "Natural Deduction",
  ndAddAssumption: "+ Add Assumption",
  ndRulesSection: "Rules",
  tabPaletteHeader: "Tableau Calculus",
  tabAddSequent: "+ Add Sequent",
  tabRulesSection: "Rules",
  scPaletteHeader: "Sequent Calculus",
  scAddSequent: "+ Add Sequent",
  scRulesSection: "Rules",
  scPositionPrompt: "Principal formula position (0-based):",
  scExchangePositionPrompt: "Exchange position (0-based):",
  scTermPrompt: "Substitution term:",
  scEigenVariablePrompt: "Eigen variable name:",
  scCutFormulaPrompt: "Cut formula:",
  scComponentIndexPrompt: "Component index (1 = left, 2 = right):",
  scApplyRuleToNode: "Apply SC Rule",
  scBannerSelectNode: "Click a sequent node to apply {ruleName}",
  scCancel: "Cancel SC",
  atPaletteHeader: "Analytic Tableau",
  atAddFormula: "+ Add Signed Formula",
  atAlphaRules: "\u03B1 (non-branching)",
  atBetaRules: "\u03B2 (branching)",
  atGammaDeltaRules: "\u03B3/\u03B4 (quantifiers)",
  atClosureRules: "Closure",

  // Node creation labels
  nodeLabelAxiom: "Axiom",
  nodeLabelAssumption: "Assumption",
  nodeLabelSequent: "Sequent",
  nodeLabelSignedFormula: "SignedFormula",

  // Paste compatibility
  pasteIncompatibleStyle:
    "Cannot paste: source ({sourceStyle}) is incompatible with target ({targetStyle})",

  // Accessibility
  workspaceMenuAriaLabel: "Workspace menu",

  // Proof collection panel
  openCollection: "My Collection",
  collectionPanelTitle: "My Collection",
  collectionEmpty: "No saved proofs yet",
  collectionEntryDelete: "Delete",
  collectionEntryImport: "Import",
  collectionEntryMemoPlaceholder: "Add a memo…",
  collectionEntryCount: "{count} proofs",

  // Folder management
  collectionCreateFolder: "New Folder",
  collectionFolderNamePlaceholder: "Folder name",
  collectionFolderDelete: "Delete Folder",
  collectionFolderRename: "Rename",
  collectionMoveToFolder: "Move to…",
  collectionMoveToRoot: "(Root)",
  collectionRootEntries: "Uncategorized",
  collectionFolderEntryCount: "{count}",

  // Compatibility check
  collectionAxiomWarning: "Missing axiom(s): {axiomIds}",
  collectionStyleMismatch: "Style mismatch: {sourceStyle} \u2192 {targetStyle}",
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
    case "MPRuleError":
      if (error.error._tag === "NotAnImplication") {
        return "mpErrorNotImplication";
      }
      /* v8 ignore start -- exhaustive check: PremiseMismatch以外のエラーはapplyModusPonensから到達しない */
      if (error.error._tag === "PremiseMismatch") {
        return "mpErrorPremiseMismatch";
      }
      return "mpErrorGeneric";
    /* v8 ignore stop */
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

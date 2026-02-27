/**
 * パラメトリック公理（A4/A5）のスキーマインスタンス生成ロジック。
 *
 * A4/A5は固定テンプレートを持たないメタレベルのスキーマであり、
 * パラメータ（全称式、変数名等）を受け取ってインスタンスを生成する。
 *
 * 3層分離のうち純粋ロジック層。
 * 変更時は parametricAxiomLogic.test.ts, ProofWorkspace.tsx も同期すること。
 */

import { Implication, Universal } from "../logic-core/formula";
import type { Formula } from "../logic-core/formula";
import { TermMetaVariable, TermVariable } from "../logic-core/term";
import { substituteTermVariableInFormula } from "../logic-core/substitution";
import { freeVariablesInFormula } from "../logic-core/freeVariables";
import { formatFormula } from "../logic-lang/formatUnicode";
import { parseString as parseFormula } from "../logic-lang/parser";

// --- A4 パラメトリックインスタンス生成 ---

/** A4インスタンス生成の入力 */
export type A4InstanceInput = {
  /** 全称式のDSLテキスト（例: "all x. x + 0 = x"） */
  readonly universalFormulaText: string;
};

/** A4インスタンス生成の成功結果 */
export type A4InstanceSuccess = {
  readonly _tag: "Success";
  /** 生成されたスキーマインスタンスのDSLテキスト */
  readonly dslText: string;
  /** 生成されたスキーマインスタンスのUnicode表示 */
  readonly unicodeDisplay: string;
  /** 束縛変数名 */
  readonly boundVariableName: string;
  /** 使われた項メタ変数名 */
  readonly termMetaVariableName: string;
};

/** A4インスタンス生成のエラー */
export type A4InstanceError =
  | { readonly _tag: "ParseError"; readonly message: string }
  | { readonly _tag: "NotUniversalFormula" };

/** A4インスタンス生成の結果 */
export type A4InstanceResult = A4InstanceSuccess | A4InstanceError;

/**
 * A4 (∀x.φ → φ[t/x]) のスキーマインスタンスを生成する。
 *
 * 入力: ∀x. φ(x) の形の全称式
 * 出力: (∀x. φ(x)) → φ(τ)  （τは項メタ変数）
 *
 * @param input 全称式のDSLテキスト
 * @returns スキーマインスタンスのDSLテキスト
 */
export function generateA4Instance(input: A4InstanceInput): A4InstanceResult {
  const parseResult = parseFormula(input.universalFormulaText);
  if (!parseResult.ok) {
    return { _tag: "ParseError", message: "Invalid formula" };
  }

  const formula = parseResult.formula;
  if (formula._tag !== "Universal") {
    return { _tag: "NotUniversalFormula" };
  }

  const boundVar = formula.variable;
  const body = formula.formula;

  // 項メタ変数τを生成
  const metaVar = new TermMetaVariable({ name: "τ" });

  // φ(x) 中の x を τ に置換 → φ(τ)
  const substitutedBody = substituteTermVariableInFormula(
    body,
    boundVar,
    metaVar,
  );

  // (∀x. φ(x)) → φ(τ) を構築
  const instanceFormula = new Implication({
    left: formula,
    right: substitutedBody,
  });

  const dslText = formatFormula(instanceFormula);
  const unicodeDisplay = formatFormula(instanceFormula);

  return {
    _tag: "Success",
    dslText,
    unicodeDisplay,
    boundVariableName: boundVar.name,
    termMetaVariableName: "τ",
  };
}

// --- A5 パラメトリックインスタンス生成 ---

/** A5インスタンス生成の入力 */
export type A5InstanceInput = {
  /** 束縛変数名 */
  readonly variableName: string;
  /** 前件（φ）のDSLテキスト。x ∉ FV(φ) が必要 */
  readonly antecedentText: string;
  /** 後件（ψ）のDSLテキスト */
  readonly consequentText: string;
};

/** A5インスタンス生成の成功結果 */
export type A5InstanceSuccess = {
  readonly _tag: "Success";
  /** 生成されたスキーマインスタンスのDSLテキスト */
  readonly dslText: string;
  /** 生成されたスキーマインスタンスのUnicode表示 */
  readonly unicodeDisplay: string;
};

/** A5インスタンス生成のエラー */
export type A5InstanceError =
  | { readonly _tag: "AntecedentParseError"; readonly message: string }
  | { readonly _tag: "ConsequentParseError"; readonly message: string }
  | { readonly _tag: "VariableFreeInAntecedent" }
  | { readonly _tag: "EmptyVariableName" };

/** A5インスタンス生成の結果 */
export type A5InstanceResult = A5InstanceSuccess | A5InstanceError;

/**
 * A5 (∀x.(φ→ψ) → (φ → ∀x.ψ)) のスキーマインスタンスを生成する。
 *
 * 制約: x ∉ FV(φ)
 *
 * @param input 変数名、前件、後件のDSLテキスト
 * @returns スキーマインスタンスのDSLテキスト
 */
export function generateA5Instance(input: A5InstanceInput): A5InstanceResult {
  if (input.variableName.trim() === "") {
    return { _tag: "EmptyVariableName" };
  }

  const antecedentResult = parseFormula(input.antecedentText);
  if (!antecedentResult.ok) {
    return {
      _tag: "AntecedentParseError",
      message: "Invalid antecedent formula",
    };
  }

  const consequentResult = parseFormula(input.consequentText);
  if (!consequentResult.ok) {
    return {
      _tag: "ConsequentParseError",
      message: "Invalid consequent formula",
    };
  }

  const antecedent = antecedentResult.formula;
  const consequent = consequentResult.formula;

  // 制約チェック: x ∉ FV(φ)
  const freeVars = freeVariablesInFormula(antecedent);
  if (freeVars.has(input.variableName.trim())) {
    return { _tag: "VariableFreeInAntecedent" };
  }

  const variable = new TermVariable({ name: input.variableName.trim() });

  // ∀x.(φ→ψ) → (φ → ∀x.ψ) を構築
  const instanceFormula = new Implication({
    left: new Universal({
      variable,
      formula: new Implication({
        left: antecedent,
        right: consequent,
      }),
    }),
    right: new Implication({
      left: antecedent,
      right: new Universal({
        variable,
        formula: consequent,
      }),
    }),
  });

  const dslText = formatFormula(instanceFormula);
  const unicodeDisplay = formatFormula(instanceFormula);

  return {
    _tag: "Success",
    dslText,
    unicodeDisplay,
  };
}

// --- A4 バリデーション（全称式チェック） ---

/** 全称式バリデーションの結果 */
export type UniversalFormulaValidation =
  | {
      readonly _tag: "Valid";
      readonly variable: string;
      readonly body: Formula;
    }
  | { readonly _tag: "ParseError" }
  | { readonly _tag: "NotUniversal" };

/**
 * テキストが全称式（∀x. φ）の形かバリデーションする。
 * A4ダイアログのリアルタイムバリデーションに使用。
 */
export function validateUniversalFormula(
  text: string,
): UniversalFormulaValidation {
  const result = parseFormula(text);
  if (!result.ok) {
    return { _tag: "ParseError" };
  }
  if (result.formula._tag !== "Universal") {
    return { _tag: "NotUniversal" };
  }
  return {
    _tag: "Valid",
    variable: result.formula.variable.name,
    body: result.formula.formula,
  };
}

// --- A5 バリデーション ---

/** A5前件バリデーションの結果 */
export type A5AntecedentValidation =
  | { readonly _tag: "Valid" }
  | { readonly _tag: "ParseError" }
  | { readonly _tag: "VariableFreeInAntecedent" };

/**
 * A5の前件が制約（x ∉ FV(φ)）を満たすかバリデーションする。
 */
export function validateA5Antecedent(
  antecedentText: string,
  variableName: string,
): A5AntecedentValidation {
  const result = parseFormula(antecedentText);
  if (!result.ok) {
    return { _tag: "ParseError" };
  }
  const freeVars = freeVariablesInFormula(result.formula);
  if (freeVars.has(variableName)) {
    return { _tag: "VariableFreeInAntecedent" };
  }
  return { _tag: "Valid" };
}

// --- エラーメッセージ ---

/**
 * A4インスタンス生成エラーのメッセージを返す。
 */
export function getA4ErrorMessage(error: A4InstanceError): string {
  switch (error._tag) {
    case "ParseError":
      return "Invalid formula syntax";
    case "NotUniversalFormula":
      return "Formula must start with ∀ (universal quantifier)";
  }
}

/**
 * A5インスタンス生成エラーのメッセージを返す。
 */
export function getA5ErrorMessage(error: A5InstanceError): string {
  switch (error._tag) {
    case "AntecedentParseError":
      return "Invalid antecedent formula syntax";
    case "ConsequentParseError":
      return "Invalid consequent formula syntax";
    case "VariableFreeInAntecedent":
      return "Variable must not be free in antecedent (φ)";
    case "EmptyVariableName":
      return "Variable name is required";
  }
}

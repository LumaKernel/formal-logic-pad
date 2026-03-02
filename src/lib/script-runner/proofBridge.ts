/**
 * 証明操作 API のサンドボックスブリッジ。
 *
 * logic-core / logic-lang の純粋関数をサンドボックス内から呼び出せるように
 * NativeFunctionBridge[] を生成する。引数・戻り値は JSON 互換プレーンオブジェクトに
 * 自動変換される（scriptRunner の pseudoToNative/nativeToPseudo が担う）。
 *
 * 変更時は proofBridge.test.ts, index.ts も同期すること。
 */

import { Either } from "effect";
import { parseString } from "../logic-lang/parser";
import { formatFormula, formatTerm } from "../logic-lang/formatUnicode";
import {
  equalFormula,
  equalTerm,
  applyModusPonens,
  applyGeneralization,
  identifyAxiom,
  unifyFormulas,
  unifyTerms,
  decodeFormula,
  decodeTerm,
  encodeFormula,
  encodeTerm,
  termVariable,
} from "../logic-core";
import type { Formula } from "../logic-core/formula";
import type { Term } from "../logic-core/term";
import type { LogicSystem } from "../logic-core/inferenceRule";
import { substituteFormulaMetaVariables } from "../logic-core/substitution";
import type { FormulaSubstitutionMap } from "../logic-core/substitution";
import type { NativeFunctionBridge } from "./scriptRunner";

// ── ヘルパー: デコード・バリデーション ─────────────────────

/**
 * unknown → Formula。デコード失敗時は throw。
 */
const decodeFormulaOrThrow = (input: unknown): Formula => {
  const result = decodeFormula(input);
  if (Either.isLeft(result)) {
    const msg = String(result.left) satisfies string;
    throw new Error(`Invalid formula JSON: ${msg satisfies string}`);
  }
  return result.right;
};

/**
 * unknown → Term。デコード失敗時は throw。
 */
const decodeTermOrThrow = (input: unknown): Term => {
  const result = decodeTerm(input);
  if (Either.isLeft(result)) {
    const msg = String(result.left) satisfies string;
    throw new Error(`Invalid term JSON: ${msg satisfies string}`);
  }
  return result.right;
};

/**
 * サンドボックスから渡される JSON オブジェクトを LogicSystem に変換する。
 * Set は配列として渡されるため変換が必要。
 */
const decodeLogicSystem = (systemJson: unknown): LogicSystem => {
  if (
    systemJson === null ||
    systemJson === undefined ||
    typeof systemJson !== "object"
  ) {
    throw new Error("system must be an object");
  }
  const sys = systemJson as Record<string, unknown>;
  const propAxioms = sys["propositionalAxioms"];

  return {
    name: typeof sys["name"] === "string" ? sys["name"] : "",
    propositionalAxioms: new Set(Array.isArray(propAxioms) ? propAxioms : []),
    predicateLogic:
      typeof sys["predicateLogic"] === "boolean"
        ? sys["predicateLogic"]
        : false,
    equalityLogic:
      typeof sys["equalityLogic"] === "boolean" ? sys["equalityLogic"] : false,
    generalization:
      typeof sys["generalization"] === "boolean"
        ? sys["generalization"]
        : false,
    theoryAxioms: Array.isArray(sys["theoryAxioms"])
      ? sys["theoryAxioms"]
      : undefined,
  };
};

// ── ブリッジ関数の実装 ────────────────────────────────────────

/**
 * テキスト → Formula JSON。パース失敗時は throw。
 */
const parseFormulaTextFn = (text: unknown): unknown => {
  if (typeof text !== "string") {
    const t = typeof text satisfies string;
    throw new Error(`parseFormula: expected string, got ${t satisfies string}`);
  }
  const result = parseString(text);
  if (Either.isLeft(result)) {
    const messages = result.left
      .map((e) => e.message)
      .join("; ") satisfies string;
    throw new Error(`Parse error: ${messages satisfies string}`);
  }
  return encodeFormula(result.right);
};

/**
 * Formula JSON → テキスト表現。
 */
const formatFormulaFn = (formulaJson: unknown): unknown => {
  const formula = decodeFormulaOrThrow(formulaJson);
  return formatFormula(formula);
};

/**
 * Term JSON → テキスト表現。
 */
const formatTermFn = (termJson: unknown): unknown => {
  const term = decodeTermOrThrow(termJson);
  return formatTerm(term);
};

/**
 * 2つの Formula JSON の構造的等価性を返す。
 */
const equalFormulaFn = (a: unknown, b: unknown): unknown => {
  const fa = decodeFormulaOrThrow(a);
  const fb = decodeFormulaOrThrow(b);
  return equalFormula(fa, fb);
};

/**
 * 2つの Term JSON の構造的等価性を返す。
 */
const equalTermFn = (a: unknown, b: unknown): unknown => {
  const ta = decodeTermOrThrow(a);
  const tb = decodeTermOrThrow(b);
  return equalTerm(ta, tb);
};

/**
 * Modus Ponens: antecedent (φ) と conditional (φ→ψ) から結論 ψ を導出。
 * 失敗時は throw。
 */
const applyModusPonensFn = (
  antecedentJson: unknown,
  conditionalJson: unknown,
): unknown => {
  const antecedent = decodeFormulaOrThrow(antecedentJson);
  const conditional = decodeFormulaOrThrow(conditionalJson);
  const result = applyModusPonens(antecedent, conditional);
  if (Either.isLeft(result)) {
    const tag = result.left._tag satisfies string;
    throw new Error(`Modus Ponens failed: ${tag satisfies string}`);
  }
  return encodeFormula(result.right.conclusion);
};

/**
 * ユニフィケーション: 2つの Formula を統一する。
 * 成功時は { formulaSubstitution, termSubstitution } を返す。
 * 失敗時は throw。
 */
const unifyFormulasFn = (sourceJson: unknown, targetJson: unknown): unknown => {
  const source = decodeFormulaOrThrow(sourceJson);
  const target = decodeFormulaOrThrow(targetJson);
  const result = unifyFormulas(source, target);
  if (Either.isLeft(result)) {
    const tag = result.left._tag satisfies string;
    throw new Error(`Unification failed: ${tag satisfies string}`);
  }
  const success = result.right;
  // FormulaSubstitutionMap (Map<string, Formula>) → JSON互換オブジェクト
  const formulaSub: Record<string, unknown> = {};
  for (const [key, val] of success.formulaSubstitution) {
    formulaSub[key] = encodeFormula(val);
  }
  const termSub: Record<string, unknown> = {};
  for (const [key, val] of success.termSubstitution) {
    termSub[key] = encodeTerm(val);
  }
  return { formulaSubstitution: formulaSub, termSubstitution: termSub };
};

/**
 * ユニフィケーション: 2つの Term を統一する。
 * 失敗時は throw。
 */
const unifyTermsFn = (sourceJson: unknown, targetJson: unknown): unknown => {
  const source = decodeTermOrThrow(sourceJson);
  const target = decodeTermOrThrow(targetJson);
  const result = unifyTerms(source, target);
  if (Either.isLeft(result)) {
    const tag = result.left._tag satisfies string;
    throw new Error(`Term unification failed: ${tag satisfies string}`);
  }
  const success = result.right;
  const termSub: Record<string, unknown> = {};
  for (const [key, val] of success.termSubstitution) {
    termSub[key] = encodeTerm(val);
  }
  return { termSubstitution: termSub };
};

/**
 * Formula にメタ変数代入を適用する。
 * substitutionMap は { "key": formulaJson, ... } 形式。
 * キーは metaVariableKey 形式の文字列（例: "φ", "ψ_1"）。
 */
const substituteFormulaFn = (
  formulaJson: unknown,
  substitutionMapJson: unknown,
): unknown => {
  const formula = decodeFormulaOrThrow(formulaJson);
  if (
    substitutionMapJson === null ||
    substitutionMapJson === undefined ||
    typeof substitutionMapJson !== "object"
  ) {
    throw new Error("substituteFormula: substitutionMap must be an object");
  }
  const entries = Object.entries(
    substitutionMapJson as Record<string, unknown>,
  );
  const map = new Map<string, Formula>();
  for (const [key, val] of entries) {
    map.set(key, decodeFormulaOrThrow(val));
  }
  const subMap: FormulaSubstitutionMap = map;
  const result = substituteFormulaMetaVariables(formula, subMap);
  return encodeFormula(result);
};

/**
 * 公理識別: Formula JSON + LogicSystem JSON → 識別結果。
 */
const identifyAxiomFn = (
  formulaJson: unknown,
  systemJson: unknown,
): unknown => {
  const formula = decodeFormulaOrThrow(formulaJson);
  const system = decodeLogicSystem(systemJson);
  const result = identifyAxiom(formula, system);
  // result は _tag ベースの discriminated union → JSON 互換
  return result;
};

/**
 * 汎化規則 (Gen): Formula JSON + 変数名 + LogicSystem JSON → ∀x.φ JSON。
 * 失敗時は throw。
 */
const applyGeneralizationFn = (
  formulaJson: unknown,
  variableName: unknown,
  systemJson: unknown,
): unknown => {
  const formula = decodeFormulaOrThrow(formulaJson);
  if (typeof variableName !== "string") {
    const t = typeof variableName satisfies string;
    throw new Error(
      `applyGeneralization: variableName must be string, got ${t satisfies string}`,
    );
  }
  const system = decodeLogicSystem(systemJson);
  const variable = termVariable(variableName);
  const result = applyGeneralization(formula, variable, system);
  if (Either.isLeft(result)) {
    const tag = result.left._tag satisfies string;
    throw new Error(`Generalization failed: ${tag satisfies string}`);
  }
  return encodeFormula(result.right.conclusion);
};

// ── ブリッジ生成 ──────────────────────────────────────────────

/**
 * 証明操作 API の NativeFunctionBridge 配列を生成する。
 *
 * サンドボックス内で以下の関数が利用可能になる:
 * - parseFormula(text) → Formula JSON
 * - formatFormula(formulaJson) → string
 * - formatTerm(termJson) → string
 * - equalFormula(a, b) → boolean
 * - equalTerm(a, b) → boolean
 * - applyMP(antecedent, conditional) → Formula JSON
 * - applyGen(formula, variableName, system) → Formula JSON
 * - unifyFormulas(source, target) → { formulaSubstitution, termSubstitution }
 * - unifyTerms(source, target) → { termSubstitution }
 * - substituteFormula(formula, map) → Formula JSON
 * - identifyAxiom(formula, system) → AxiomIdentificationResult
 */
export const createProofBridges = (): readonly NativeFunctionBridge[] => [
  { name: "parseFormula", fn: parseFormulaTextFn },
  { name: "formatFormula", fn: formatFormulaFn },
  { name: "formatTerm", fn: formatTermFn },
  { name: "equalFormula", fn: equalFormulaFn },
  { name: "equalTerm", fn: equalTermFn },
  { name: "applyMP", fn: applyModusPonensFn },
  { name: "applyGen", fn: applyGeneralizationFn },
  { name: "unifyFormulas", fn: unifyFormulasFn },
  { name: "unifyTerms", fn: unifyTermsFn },
  { name: "substituteFormula", fn: substituteFormulaFn },
  { name: "identifyAxiom", fn: identifyAxiomFn },
];

// ── API 定義（Monaco Editor 補完用）──────────────────────────

/** 各ブリッジ関数の型情報・説明 */
export interface ProofBridgeApiDef {
  /** サンドボックス内の関数名 */
  readonly name: string;
  /** TypeScript型シグネチャ */
  readonly signature: string;
  /** 説明文 */
  readonly description: string;
}

/**
 * ブリッジ関数の API 定義一覧。
 * Monaco Editor の addExtraLib で `.d.ts` に変換して利用する。
 */
export const PROOF_BRIDGE_API_DEFS: readonly ProofBridgeApiDef[] = [
  {
    name: "parseFormula",
    signature: "(text: string) => FormulaJson",
    description:
      "論理式テキストをパースして Formula JSON を返す。パース失敗時は例外をスロー。",
  },
  {
    name: "formatFormula",
    signature: "(formula: FormulaJson) => string",
    description: "Formula JSON を Unicode テキスト表現に変換する。",
  },
  {
    name: "formatTerm",
    signature: "(term: TermJson) => string",
    description: "Term JSON を Unicode テキスト表現に変換する。",
  },
  {
    name: "equalFormula",
    signature: "(a: FormulaJson, b: FormulaJson) => boolean",
    description: "2つの Formula の構造的等価性を返す。",
  },
  {
    name: "equalTerm",
    signature: "(a: TermJson, b: TermJson) => boolean",
    description: "2つの Term の構造的等価性を返す。",
  },
  {
    name: "applyMP",
    signature:
      "(antecedent: FormulaJson, conditional: FormulaJson) => FormulaJson",
    description:
      "Modus Ponens: φ と φ→ψ から ψ を導出する。前提不一致時は例外をスロー。",
  },
  {
    name: "applyGen",
    signature:
      "(formula: FormulaJson, variableName: string, system: LogicSystemJson) => FormulaJson",
    description:
      "汎化規則: φ から ∀x.φ を導出する。体系で汎化が無効の場合は例外をスロー。",
  },
  {
    name: "unifyFormulas",
    signature:
      "(source: FormulaJson, target: FormulaJson) => UnificationResult",
    description:
      "2つの Formula をユニファイする。成功時は代入マップを返す。失敗時は例外。",
  },
  {
    name: "unifyTerms",
    signature: "(source: TermJson, target: TermJson) => TermUnificationResult",
    description:
      "2つの Term をユニファイする。成功時は項代入マップを返す。失敗時は例外。",
  },
  {
    name: "substituteFormula",
    signature:
      "(formula: FormulaJson, substitutionMap: Record<string, FormulaJson>) => FormulaJson",
    description: "Formula にメタ変数代入を適用する。",
  },
  {
    name: "identifyAxiom",
    signature:
      "(formula: FormulaJson, system: LogicSystemJson) => AxiomIdentificationResult",
    description: "Formula が指定体系の公理インスタンスかどうか識別する。",
  },
];

/**
 * ブリッジ API の TypeScript 型定義テキストを生成する。
 * Monaco Editor の addExtraLib に渡す。
 */
export const generateProofBridgeTypeDefs = (): string => {
  const lines = PROOF_BRIDGE_API_DEFS.map((def) => {
    const desc = def.description satisfies string;
    const name = def.name satisfies string;
    const sig = def.signature.replace(/^\(/, "(") satisfies string;
    return `/** ${desc satisfies string} */\ndeclare function ${name satisfies string}${sig satisfies string};\n`;
  });
  return lines.join("\n");
};

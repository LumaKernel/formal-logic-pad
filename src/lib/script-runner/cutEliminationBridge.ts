/**
 * カット除去 API のサンドボックスブリッジ。
 *
 * cutElimination.ts の関数をサンドボックス内から呼び出せるように
 * NativeFunctionBridge[] を生成する。
 *
 * 変更時は cutEliminationBridge.test.ts, index.ts も同期すること。
 */

import { Either } from "effect";
import type { Formula } from "../logic-core/formula";
import type { Sequent, ScProofNode } from "../logic-core/sequentCalculus";
import {
  eliminateCutsWithSteps,
  isCutFree,
  countCuts,
} from "../logic-core/cutElimination";
import type { CutEliminationStep } from "../logic-core/cutElimination";
import { encodeFormula, decodeFormula } from "../logic-core/serialization";
import { formatFormula } from "../logic-lang/formatUnicode";
import type { NativeFunctionBridge } from "./scriptRunner";
import type { ProofBridgeApiDef } from "./proofBridge";

// ── ScProofNode の JSON encode/decode ────────────────────────

/**
 * Sequent 内の Formula 配列を JSON 互換に変換する。
 */
const encodeSequent = (seq: Sequent): unknown => ({
  antecedents: seq.antecedents.map((f) => encodeFormula(f)),
  succedents: seq.succedents.map((f) => encodeFormula(f)),
});

/**
 * ScProofNode を JSON 互換プレーンオブジェクトに変換する。
 * Formula フィールドを encodeFormula で変換する。
 */
export const encodeScProofNode = (node: ScProofNode): unknown => {
  switch (node._tag) {
    case "ScIdentity":
    case "ScBottomLeft":
      return {
        _tag: node._tag,
        conclusion: encodeSequent(node.conclusion),
      };
    case "ScCut":
      return {
        _tag: node._tag,
        conclusion: encodeSequent(node.conclusion),
        left: encodeScProofNode(node.left),
        right: encodeScProofNode(node.right),
        cutFormula: encodeFormula(node.cutFormula),
      };
    case "ScWeakeningLeft":
    case "ScWeakeningRight":
      return {
        _tag: node._tag,
        conclusion: encodeSequent(node.conclusion),
        premise: encodeScProofNode(node.premise),
        weakenedFormula: encodeFormula(node.weakenedFormula),
      };
    case "ScContractionLeft":
    case "ScContractionRight":
      return {
        _tag: node._tag,
        conclusion: encodeSequent(node.conclusion),
        premise: encodeScProofNode(node.premise),
        contractedFormula: encodeFormula(node.contractedFormula),
      };
    case "ScExchangeLeft":
    case "ScExchangeRight":
      return {
        _tag: node._tag,
        conclusion: encodeSequent(node.conclusion),
        premise: encodeScProofNode(node.premise),
        position: node.position,
      };
    case "ScImplicationLeft":
      return {
        _tag: node._tag,
        conclusion: encodeSequent(node.conclusion),
        left: encodeScProofNode(node.left),
        right: encodeScProofNode(node.right),
      };
    case "ScImplicationRight":
      return {
        _tag: node._tag,
        conclusion: encodeSequent(node.conclusion),
        premise: encodeScProofNode(node.premise),
      };
    case "ScConjunctionLeft":
      return {
        _tag: node._tag,
        conclusion: encodeSequent(node.conclusion),
        premise: encodeScProofNode(node.premise),
        componentIndex: node.componentIndex,
      };
    case "ScConjunctionRight":
      return {
        _tag: node._tag,
        conclusion: encodeSequent(node.conclusion),
        left: encodeScProofNode(node.left),
        right: encodeScProofNode(node.right),
      };
    case "ScDisjunctionLeft":
      return {
        _tag: node._tag,
        conclusion: encodeSequent(node.conclusion),
        left: encodeScProofNode(node.left),
        right: encodeScProofNode(node.right),
      };
    case "ScDisjunctionRight":
      return {
        _tag: node._tag,
        conclusion: encodeSequent(node.conclusion),
        premise: encodeScProofNode(node.premise),
        componentIndex: node.componentIndex,
      };
    case "ScUniversalLeft":
    case "ScUniversalRight":
    case "ScExistentialLeft":
    case "ScExistentialRight":
    case "ScNegationLeft":
    case "ScNegationRight":
      return {
        _tag: node._tag,
        conclusion: encodeSequent(node.conclusion),
        premise: encodeScProofNode(node.premise),
      };
  }
  /* v8 ignore start */
  node satisfies never;
  return {};
  /* v8 ignore stop */
};

// ── JSON → ScProofNode のデコード ────────────────────────────

const SC_TAGS = new Set([
  "ScIdentity",
  "ScBottomLeft",
  "ScCut",
  "ScWeakeningLeft",
  "ScWeakeningRight",
  "ScContractionLeft",
  "ScContractionRight",
  "ScExchangeLeft",
  "ScExchangeRight",
  "ScImplicationLeft",
  "ScImplicationRight",
  "ScConjunctionLeft",
  "ScConjunctionRight",
  "ScDisjunctionLeft",
  "ScDisjunctionRight",
  "ScUniversalLeft",
  "ScUniversalRight",
  "ScExistentialLeft",
  "ScExistentialRight",
  "ScNegationLeft",
  "ScNegationRight",
]);

const decodeFormulaOrThrow = (input: unknown): Formula => {
  const result = decodeFormula(input);
  if (Either.isLeft(result)) {
    const msg = String(result.left) satisfies string;
    throw new Error(`Invalid formula in SC proof: ${msg satisfies string}`);
  }
  return result.right;
};

const decodeSequentOrThrow = (input: unknown): Sequent => {
  if (input === null || input === undefined || typeof input !== "object") {
    throw new Error("Sequent must be an object");
  }
  const obj = input as Record<string, unknown>;
  if (!Array.isArray(obj["antecedents"])) {
    throw new Error("Sequent.antecedents must be an array");
  }
  if (!Array.isArray(obj["succedents"])) {
    throw new Error("Sequent.succedents must be an array");
  }
  return {
    antecedents: (obj["antecedents"] as readonly unknown[]).map(
      decodeFormulaOrThrow,
    ),
    succedents: (obj["succedents"] as readonly unknown[]).map(
      decodeFormulaOrThrow,
    ),
  };
};

/**
 * JSON → ScProofNode。不正入力は throw。
 */
export const decodeScProofNode = (input: unknown): ScProofNode => {
  if (input === null || input === undefined || typeof input !== "object") {
    throw new Error("SC proof node must be an object");
  }
  const obj = input as Record<string, unknown>;
  const tag = obj["_tag"];
  if (typeof tag !== "string" || !SC_TAGS.has(tag)) {
    const t = String(tag) satisfies string;
    throw new Error(`Unknown SC proof node _tag: ${t satisfies string}`);
  }

  const conclusion = decodeSequentOrThrow(obj["conclusion"]);

  /* v8 ignore start -- switch行のv8ブランチアーティファクト。defaultは防御的コードでignore済み */
  switch (tag) {
    /* v8 ignore stop */
    case "ScIdentity":
      return { _tag: "ScIdentity", conclusion };
    case "ScBottomLeft":
      return { _tag: "ScBottomLeft", conclusion };
    case "ScCut":
      return {
        _tag: "ScCut",
        conclusion,
        left: decodeScProofNode(obj["left"]),
        right: decodeScProofNode(obj["right"]),
        cutFormula: decodeFormulaOrThrow(obj["cutFormula"]),
      };
    case "ScWeakeningLeft":
      return {
        _tag: "ScWeakeningLeft",
        conclusion,
        premise: decodeScProofNode(obj["premise"]),
        weakenedFormula: decodeFormulaOrThrow(obj["weakenedFormula"]),
      };
    case "ScWeakeningRight":
      return {
        _tag: "ScWeakeningRight",
        conclusion,
        premise: decodeScProofNode(obj["premise"]),
        weakenedFormula: decodeFormulaOrThrow(obj["weakenedFormula"]),
      };
    case "ScContractionLeft":
      return {
        _tag: "ScContractionLeft",
        conclusion,
        premise: decodeScProofNode(obj["premise"]),
        contractedFormula: decodeFormulaOrThrow(obj["contractedFormula"]),
      };
    case "ScContractionRight":
      return {
        _tag: "ScContractionRight",
        conclusion,
        premise: decodeScProofNode(obj["premise"]),
        contractedFormula: decodeFormulaOrThrow(obj["contractedFormula"]),
      };
    case "ScExchangeLeft":
      return {
        _tag: "ScExchangeLeft",
        conclusion,
        premise: decodeScProofNode(obj["premise"]),
        position: typeof obj["position"] === "number" ? obj["position"] : 0,
      };
    case "ScExchangeRight":
      return {
        _tag: "ScExchangeRight",
        conclusion,
        premise: decodeScProofNode(obj["premise"]),
        position: typeof obj["position"] === "number" ? obj["position"] : 0,
      };
    case "ScImplicationLeft":
      return {
        _tag: "ScImplicationLeft",
        conclusion,
        left: decodeScProofNode(obj["left"]),
        right: decodeScProofNode(obj["right"]),
      };
    case "ScImplicationRight":
      return {
        _tag: "ScImplicationRight",
        conclusion,
        premise: decodeScProofNode(obj["premise"]),
      };
    case "ScConjunctionLeft":
      return {
        _tag: "ScConjunctionLeft",
        conclusion,
        premise: decodeScProofNode(obj["premise"]),
        componentIndex: obj["componentIndex"] === 2 ? 2 : 1,
      };
    case "ScConjunctionRight":
      return {
        _tag: "ScConjunctionRight",
        conclusion,
        left: decodeScProofNode(obj["left"]),
        right: decodeScProofNode(obj["right"]),
      };
    case "ScDisjunctionLeft":
      return {
        _tag: "ScDisjunctionLeft",
        conclusion,
        left: decodeScProofNode(obj["left"]),
        right: decodeScProofNode(obj["right"]),
      };
    case "ScDisjunctionRight":
      return {
        _tag: "ScDisjunctionRight",
        conclusion,
        premise: decodeScProofNode(obj["premise"]),
        componentIndex: obj["componentIndex"] === 2 ? 2 : 1,
      };
    case "ScUniversalLeft":
      return {
        _tag: "ScUniversalLeft",
        conclusion,
        premise: decodeScProofNode(obj["premise"]),
      };
    case "ScUniversalRight":
      return {
        _tag: "ScUniversalRight",
        conclusion,
        premise: decodeScProofNode(obj["premise"]),
      };
    case "ScExistentialLeft":
      return {
        _tag: "ScExistentialLeft",
        conclusion,
        premise: decodeScProofNode(obj["premise"]),
      };
    case "ScExistentialRight":
      return {
        _tag: "ScExistentialRight",
        conclusion,
        premise: decodeScProofNode(obj["premise"]),
      };
    case "ScNegationLeft":
      return {
        _tag: "ScNegationLeft",
        conclusion,
        premise: decodeScProofNode(obj["premise"]),
      };
    case "ScNegationRight":
      return {
        _tag: "ScNegationRight",
        conclusion,
        premise: decodeScProofNode(obj["premise"]),
      };
    /* v8 ignore start — 防御的コード: 既知のSCタグで網羅済み */
    default:
      throw new Error(`Unhandled SC tag: ${tag satisfies string}`);
    /* v8 ignore stop */
  }
};

// ── Sequent のフォーマット ────────────────────────────────────

/**
 * Sequent を Unicode テキスト表現に変換する。
 * "φ, ψ ⇒ χ" 形式。
 */
const formatSequentText = (seq: Sequent): string => {
  const left = seq.antecedents.map((f) => formatFormula(f)).join(", ");
  const right = seq.succedents.map((f) => formatFormula(f)).join(", ");
  return `${left satisfies string} ⇒ ${right satisfies string}`;
};

// ── ブリッジ関数の実装 ────────────────────────────────────────

/**
 * SC証明がカットフリーかどうか判定する。
 */
const isCutFreeFn = (proofJson: unknown): unknown => {
  const proof = decodeScProofNode(proofJson);
  return isCutFree(proof);
};

/**
 * SC証明中のカット数を返す。
 */
const countCutsFn = (proofJson: unknown): unknown => {
  const proof = decodeScProofNode(proofJson);
  return countCuts(proof);
};

/**
 * Sequent JSON を Unicode テキストに変換する。
 */
const formatSequentFn = (sequentJson: unknown): unknown => {
  const seq = decodeSequentOrThrow(sequentJson);
  return formatSequentText(seq);
};

/**
 * SC証明のカットを除去し、ステップ情報を返す。
 */
const eliminateCutsWithStepsFn = (
  proofJson: unknown,
  maxStepsArg?: unknown,
): unknown => {
  const proof = decodeScProofNode(proofJson);
  const maxSteps = typeof maxStepsArg === "number" ? maxStepsArg : undefined;
  const { result, steps } = eliminateCutsWithSteps(proof, { maxSteps });

  const encodeStep = (step: CutEliminationStep): unknown => ({
    description: step.description,
    proof: encodeScProofNode(step.proof),
    depth: step.depth,
    rank: step.rank,
  });

  const encodeResult = (): unknown => {
    /* v8 ignore start -- switch行のv8ブランチアーティファクト。Failure caseは防御的コードでignore済み */
    switch (result._tag) {
      /* v8 ignore stop */
      case "Success":
        return {
          _tag: "Success",
          proof: encodeScProofNode(result.proof),
        };
      case "StepLimitExceeded":
        return {
          _tag: "StepLimitExceeded",
          proof: encodeScProofNode(result.proof),
          stepsUsed: result.stepsUsed,
        };
      /* v8 ignore start — 防御的コード: 正常入力では到達しない（cutElimination内部の安全チェック用） */
      case "Failure":
        return {
          _tag: "Failure",
          reason: result.reason,
        };
      /* v8 ignore stop */
    }
  };

  return {
    result: encodeResult(),
    steps: steps.map(encodeStep),
  };
};

/**
 * SC証明の結論シーケントを取得する。
 */
const getScConclusionFn = (proofJson: unknown): unknown => {
  const proof = decodeScProofNode(proofJson);
  return encodeSequent(proof.conclusion);
};

// ── ブリッジ生成 ──────────────────────────────────────────────

/**
 * カット除去 API の NativeFunctionBridge 配列を生成する。
 */
export const createCutEliminationBridges =
  (): readonly NativeFunctionBridge[] => [
    { name: "isCutFree", fn: isCutFreeFn },
    { name: "countCuts", fn: countCutsFn },
    { name: "formatSequent", fn: formatSequentFn },
    { name: "eliminateCutsWithSteps", fn: eliminateCutsWithStepsFn },
    { name: "getScConclusion", fn: getScConclusionFn },
  ];

// ── API 定義（Monaco Editor 補完用）──────────────────────────

export const CUT_ELIMINATION_BRIDGE_API_DEFS: readonly ProofBridgeApiDef[] = [
  {
    name: "isCutFree",
    signature: "(proof: ScProofNodeJson) => boolean",
    description: "SC証明がカットフリーかどうか判定する。",
  },
  {
    name: "countCuts",
    signature: "(proof: ScProofNodeJson) => number",
    description: "SC証明中のカット規則の数を返す。",
  },
  {
    name: "formatSequent",
    signature: "(sequent: SequentJson) => string",
    description:
      'Sequent JSON を Unicode テキスト表現に変換する。例: "φ, ψ ⇒ χ"',
  },
  {
    name: "eliminateCutsWithSteps",
    signature:
      "(proof: ScProofNodeJson, maxSteps?: number) => { result: CutEliminationResultJson, steps: CutEliminationStepJson[] }",
    description:
      "SC証明のカットを除去し、各変換ステップの情報を返す。result._tag は 'Success' | 'StepLimitExceeded' | 'Failure'。",
  },
  {
    name: "getScConclusion",
    signature: "(proof: ScProofNodeJson) => SequentJson",
    description: "SC証明の結論シーケントを取得する。",
  },
];

/**
 * カット除去ブリッジ API の TypeScript 型定義テキストを生成する。
 */
export const generateCutEliminationBridgeTypeDefs = (): string => {
  const lines = CUT_ELIMINATION_BRIDGE_API_DEFS.map((def) => {
    const desc = def.description satisfies string;
    const name = def.name satisfies string;
    const sig = def.signature.replace(/^\(/, "(") satisfies string;
    return `/** ${desc satisfies string} */\ndeclare function ${name satisfies string}${sig satisfies string};\n`;
  });
  return lines.join("\n");
};

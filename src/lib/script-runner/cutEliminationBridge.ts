/**
 * カット除去 API + SC証明ノードコンストラクタのサンドボックスブリッジ。
 *
 * cutElimination.ts の関数およびシーケント計算の証明ノード構築関数を
 * サンドボックス内から呼び出せるように NativeFunctionBridge[] を生成する。
 *
 * 変更時は cutEliminationBridge.test.ts, index.ts も同期すること。
 */

import { Either } from "effect";
import type { Formula } from "../logic-core/formula";
import type { Sequent, ScProofNode } from "../logic-core/sequentCalculus";
import {
  sequent,
  scIdentity,
  scBottomLeft,
  scCut,
  scWeakeningLeft,
  scWeakeningRight,
  scContractionLeft,
  scContractionRight,
  scExchangeLeft,
  scExchangeRight,
  scImplicationLeft,
  scImplicationRight,
  scConjunctionLeft,
  scConjunctionRight,
  scDisjunctionLeft,
  scDisjunctionRight,
  scNegationLeft,
  scNegationRight,
  scUniversalLeft,
  scUniversalRight,
  scExistentialLeft,
  scExistentialRight,
} from "../logic-core/sequentCalculus";
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

// ── SC証明ノードコンストラクタ ─────────────────────────────────
//
// スクリプトユーザーが raw JSON を手書きする代わりに
// 関数呼び出しで SC 証明ノードを構築できるようにする。
// すべての入力は unknown 前提でバリデーションする。

/** Sequent JSON を構築する。 */
const sequentFn = (
  antecedentsJson: unknown,
  succedentsJson: unknown,
): unknown => {
  if (!Array.isArray(antecedentsJson)) {
    throw new Error("sequent: antecedents must be an array");
  }
  if (!Array.isArray(succedentsJson)) {
    throw new Error("sequent: succedents must be an array");
  }
  const ant = (antecedentsJson as readonly unknown[]).map(decodeFormulaOrThrow);
  const suc = (succedentsJson as readonly unknown[]).map(decodeFormulaOrThrow);
  return encodeSequent(sequent(ant, suc));
};

/** ScIdentity ノードを構築する。 */
const scIdentityFn = (sequentJson: unknown): unknown => {
  const seq = decodeSequentOrThrow(sequentJson);
  return encodeScProofNode(scIdentity(seq));
};

/** ScBottomLeft ノードを構築する。 */
const scBottomLeftFn = (sequentJson: unknown): unknown => {
  const seq = decodeSequentOrThrow(sequentJson);
  return encodeScProofNode(scBottomLeft(seq));
};

/** ScCut ノードを構築する。 */
const scCutFn = (
  leftJson: unknown,
  rightJson: unknown,
  cutFormulaJson: unknown,
  conclusionJson: unknown,
): unknown => {
  const left = decodeScProofNode(leftJson);
  const right = decodeScProofNode(rightJson);
  const cutFormula = decodeFormulaOrThrow(cutFormulaJson);
  const conclusion = decodeSequentOrThrow(conclusionJson);
  return encodeScProofNode(scCut(left, right, cutFormula, conclusion));
};

/** ScWeakeningLeft ノードを構築する。 */
const scWeakeningLeftFn = (
  premiseJson: unknown,
  formulaJson: unknown,
  conclusionJson: unknown,
): unknown => {
  const premise = decodeScProofNode(premiseJson);
  const formula = decodeFormulaOrThrow(formulaJson);
  const conclusion = decodeSequentOrThrow(conclusionJson);
  return encodeScProofNode(scWeakeningLeft(premise, formula, conclusion));
};

/** ScWeakeningRight ノードを構築する。 */
const scWeakeningRightFn = (
  premiseJson: unknown,
  formulaJson: unknown,
  conclusionJson: unknown,
): unknown => {
  const premise = decodeScProofNode(premiseJson);
  const formula = decodeFormulaOrThrow(formulaJson);
  const conclusion = decodeSequentOrThrow(conclusionJson);
  return encodeScProofNode(scWeakeningRight(premise, formula, conclusion));
};

/** ScContractionLeft ノードを構築する。 */
const scContractionLeftFn = (
  premiseJson: unknown,
  formulaJson: unknown,
  conclusionJson: unknown,
): unknown => {
  const premise = decodeScProofNode(premiseJson);
  const formula = decodeFormulaOrThrow(formulaJson);
  const conclusion = decodeSequentOrThrow(conclusionJson);
  return encodeScProofNode(scContractionLeft(premise, formula, conclusion));
};

/** ScContractionRight ノードを構築する。 */
const scContractionRightFn = (
  premiseJson: unknown,
  formulaJson: unknown,
  conclusionJson: unknown,
): unknown => {
  const premise = decodeScProofNode(premiseJson);
  const formula = decodeFormulaOrThrow(formulaJson);
  const conclusion = decodeSequentOrThrow(conclusionJson);
  return encodeScProofNode(scContractionRight(premise, formula, conclusion));
};

/** ScExchangeLeft ノードを構築する。 */
const scExchangeLeftFn = (
  premiseJson: unknown,
  positionArg: unknown,
  conclusionJson: unknown,
): unknown => {
  const premise = decodeScProofNode(premiseJson);
  if (typeof positionArg !== "number") {
    throw new Error("scExchangeLeft: position must be a number");
  }
  const conclusion = decodeSequentOrThrow(conclusionJson);
  return encodeScProofNode(scExchangeLeft(premise, positionArg, conclusion));
};

/** ScExchangeRight ノードを構築する。 */
const scExchangeRightFn = (
  premiseJson: unknown,
  positionArg: unknown,
  conclusionJson: unknown,
): unknown => {
  const premise = decodeScProofNode(premiseJson);
  if (typeof positionArg !== "number") {
    throw new Error("scExchangeRight: position must be a number");
  }
  const conclusion = decodeSequentOrThrow(conclusionJson);
  return encodeScProofNode(scExchangeRight(premise, positionArg, conclusion));
};

/** ScImplicationLeft ノードを構築する。 */
const scImplicationLeftFn = (
  leftJson: unknown,
  rightJson: unknown,
  conclusionJson: unknown,
): unknown => {
  const left = decodeScProofNode(leftJson);
  const right = decodeScProofNode(rightJson);
  const conclusion = decodeSequentOrThrow(conclusionJson);
  return encodeScProofNode(scImplicationLeft(left, right, conclusion));
};

/** ScImplicationRight ノードを構築する。 */
const scImplicationRightFn = (
  premiseJson: unknown,
  conclusionJson: unknown,
): unknown => {
  const premise = decodeScProofNode(premiseJson);
  const conclusion = decodeSequentOrThrow(conclusionJson);
  return encodeScProofNode(scImplicationRight(premise, conclusion));
};

/** ScConjunctionLeft ノードを構築する。 */
const scConjunctionLeftFn = (
  premiseJson: unknown,
  componentIndexArg: unknown,
  conclusionJson: unknown,
): unknown => {
  const premise = decodeScProofNode(premiseJson);
  if (componentIndexArg !== 1 && componentIndexArg !== 2) {
    throw new Error("scConjunctionLeft: componentIndex must be 1 or 2");
  }
  const conclusion = decodeSequentOrThrow(conclusionJson);
  return encodeScProofNode(
    scConjunctionLeft(premise, componentIndexArg, conclusion),
  );
};

/** ScConjunctionRight ノードを構築する。 */
const scConjunctionRightFn = (
  leftJson: unknown,
  rightJson: unknown,
  conclusionJson: unknown,
): unknown => {
  const left = decodeScProofNode(leftJson);
  const right = decodeScProofNode(rightJson);
  const conclusion = decodeSequentOrThrow(conclusionJson);
  return encodeScProofNode(scConjunctionRight(left, right, conclusion));
};

/** ScDisjunctionLeft ノードを構築する。 */
const scDisjunctionLeftFn = (
  leftJson: unknown,
  rightJson: unknown,
  conclusionJson: unknown,
): unknown => {
  const left = decodeScProofNode(leftJson);
  const right = decodeScProofNode(rightJson);
  const conclusion = decodeSequentOrThrow(conclusionJson);
  return encodeScProofNode(scDisjunctionLeft(left, right, conclusion));
};

/** ScDisjunctionRight ノードを構築する。 */
const scDisjunctionRightFn = (
  premiseJson: unknown,
  componentIndexArg: unknown,
  conclusionJson: unknown,
): unknown => {
  const premise = decodeScProofNode(premiseJson);
  if (componentIndexArg !== 1 && componentIndexArg !== 2) {
    throw new Error("scDisjunctionRight: componentIndex must be 1 or 2");
  }
  const conclusion = decodeSequentOrThrow(conclusionJson);
  return encodeScProofNode(
    scDisjunctionRight(premise, componentIndexArg, conclusion),
  );
};

/** ScNegationLeft ノードを構築する。 */
const scNegationLeftFn = (
  premiseJson: unknown,
  conclusionJson: unknown,
): unknown => {
  const premise = decodeScProofNode(premiseJson);
  const conclusion = decodeSequentOrThrow(conclusionJson);
  return encodeScProofNode(scNegationLeft(premise, conclusion));
};

/** ScNegationRight ノードを構築する。 */
const scNegationRightFn = (
  premiseJson: unknown,
  conclusionJson: unknown,
): unknown => {
  const premise = decodeScProofNode(premiseJson);
  const conclusion = decodeSequentOrThrow(conclusionJson);
  return encodeScProofNode(scNegationRight(premise, conclusion));
};

/** ScUniversalLeft ノードを構築する。 */
const scUniversalLeftFn = (
  premiseJson: unknown,
  conclusionJson: unknown,
): unknown => {
  const premise = decodeScProofNode(premiseJson);
  const conclusion = decodeSequentOrThrow(conclusionJson);
  return encodeScProofNode(scUniversalLeft(premise, conclusion));
};

/** ScUniversalRight ノードを構築する。 */
const scUniversalRightFn = (
  premiseJson: unknown,
  conclusionJson: unknown,
): unknown => {
  const premise = decodeScProofNode(premiseJson);
  const conclusion = decodeSequentOrThrow(conclusionJson);
  return encodeScProofNode(scUniversalRight(premise, conclusion));
};

/** ScExistentialLeft ノードを構築する。 */
const scExistentialLeftFn = (
  premiseJson: unknown,
  conclusionJson: unknown,
): unknown => {
  const premise = decodeScProofNode(premiseJson);
  const conclusion = decodeSequentOrThrow(conclusionJson);
  return encodeScProofNode(scExistentialLeft(premise, conclusion));
};

/** ScExistentialRight ノードを構築する。 */
const scExistentialRightFn = (
  premiseJson: unknown,
  conclusionJson: unknown,
): unknown => {
  const premise = decodeScProofNode(premiseJson);
  const conclusion = decodeSequentOrThrow(conclusionJson);
  return encodeScProofNode(scExistentialRight(premise, conclusion));
};

// ── ブリッジ生成 ──────────────────────────────────────────────

/**
 * カット除去 API + SC証明ノードコンストラクタの NativeFunctionBridge 配列を生成する。
 */
export const createCutEliminationBridges =
  (): readonly NativeFunctionBridge[] => [
    { name: "isCutFree", fn: isCutFreeFn },
    { name: "countCuts", fn: countCutsFn },
    { name: "formatSequent", fn: formatSequentFn },
    { name: "eliminateCutsWithSteps", fn: eliminateCutsWithStepsFn },
    { name: "getScConclusion", fn: getScConclusionFn },
    // SC証明ノードコンストラクタ
    { name: "sequent", fn: sequentFn },
    { name: "scIdentity", fn: scIdentityFn },
    { name: "scBottomLeft", fn: scBottomLeftFn },
    { name: "scCut", fn: scCutFn },
    { name: "scWeakeningLeft", fn: scWeakeningLeftFn },
    { name: "scWeakeningRight", fn: scWeakeningRightFn },
    { name: "scContractionLeft", fn: scContractionLeftFn },
    { name: "scContractionRight", fn: scContractionRightFn },
    { name: "scExchangeLeft", fn: scExchangeLeftFn },
    { name: "scExchangeRight", fn: scExchangeRightFn },
    { name: "scImplicationLeft", fn: scImplicationLeftFn },
    { name: "scImplicationRight", fn: scImplicationRightFn },
    { name: "scConjunctionLeft", fn: scConjunctionLeftFn },
    { name: "scConjunctionRight", fn: scConjunctionRightFn },
    { name: "scDisjunctionLeft", fn: scDisjunctionLeftFn },
    { name: "scDisjunctionRight", fn: scDisjunctionRightFn },
    { name: "scNegationLeft", fn: scNegationLeftFn },
    { name: "scNegationRight", fn: scNegationRightFn },
    { name: "scUniversalLeft", fn: scUniversalLeftFn },
    { name: "scUniversalRight", fn: scUniversalRightFn },
    { name: "scExistentialLeft", fn: scExistentialLeftFn },
    { name: "scExistentialRight", fn: scExistentialRightFn },
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
  // SC証明ノードコンストラクタ
  {
    name: "sequent",
    signature:
      "(antecedents: FormulaJson[], succedents: FormulaJson[]) => SequentJson",
    description: "シーケント（前件と後件の組）を構築する。",
  },
  {
    name: "scIdentity",
    signature: "(conclusion: SequentJson) => ScProofNodeJson",
    description: "ID公理ノード（φ ⇒ φ）を構築する。",
  },
  {
    name: "scBottomLeft",
    signature: "(conclusion: SequentJson) => ScProofNodeJson",
    description: "⊥L公理ノードを構築する。",
  },
  {
    name: "scCut",
    signature:
      "(left: ScProofNodeJson, right: ScProofNodeJson, cutFormula: FormulaJson, conclusion: SequentJson) => ScProofNodeJson",
    description: "カット規則ノードを構築する。",
  },
  {
    name: "scWeakeningLeft",
    signature:
      "(premise: ScProofNodeJson, formula: FormulaJson, conclusion: SequentJson) => ScProofNodeJson",
    description: "左弱化規則ノードを構築する。",
  },
  {
    name: "scWeakeningRight",
    signature:
      "(premise: ScProofNodeJson, formula: FormulaJson, conclusion: SequentJson) => ScProofNodeJson",
    description: "右弱化規則ノードを構築する。",
  },
  {
    name: "scContractionLeft",
    signature:
      "(premise: ScProofNodeJson, formula: FormulaJson, conclusion: SequentJson) => ScProofNodeJson",
    description: "左縮約規則ノードを構築する。",
  },
  {
    name: "scContractionRight",
    signature:
      "(premise: ScProofNodeJson, formula: FormulaJson, conclusion: SequentJson) => ScProofNodeJson",
    description: "右縮約規則ノードを構築する。",
  },
  {
    name: "scExchangeLeft",
    signature:
      "(premise: ScProofNodeJson, position: number, conclusion: SequentJson) => ScProofNodeJson",
    description: "左交換規則ノードを構築する。",
  },
  {
    name: "scExchangeRight",
    signature:
      "(premise: ScProofNodeJson, position: number, conclusion: SequentJson) => ScProofNodeJson",
    description: "右交換規則ノードを構築する。",
  },
  {
    name: "scImplicationLeft",
    signature:
      "(left: ScProofNodeJson, right: ScProofNodeJson, conclusion: SequentJson) => ScProofNodeJson",
    description: "含意左規則（→⇒）ノードを構築する。",
  },
  {
    name: "scImplicationRight",
    signature:
      "(premise: ScProofNodeJson, conclusion: SequentJson) => ScProofNodeJson",
    description: "含意右規則（⇒→）ノードを構築する。",
  },
  {
    name: "scConjunctionLeft",
    signature:
      "(premise: ScProofNodeJson, componentIndex: 1 | 2, conclusion: SequentJson) => ScProofNodeJson",
    description: "連言左規則（∧⇒）ノードを構築する。",
  },
  {
    name: "scConjunctionRight",
    signature:
      "(left: ScProofNodeJson, right: ScProofNodeJson, conclusion: SequentJson) => ScProofNodeJson",
    description: "連言右規則（⇒∧）ノードを構築する。",
  },
  {
    name: "scDisjunctionLeft",
    signature:
      "(left: ScProofNodeJson, right: ScProofNodeJson, conclusion: SequentJson) => ScProofNodeJson",
    description: "選言左規則（∨⇒）ノードを構築する。",
  },
  {
    name: "scDisjunctionRight",
    signature:
      "(premise: ScProofNodeJson, componentIndex: 1 | 2, conclusion: SequentJson) => ScProofNodeJson",
    description: "選言右規則（⇒∨）ノードを構築する。",
  },
  {
    name: "scNegationLeft",
    signature:
      "(premise: ScProofNodeJson, conclusion: SequentJson) => ScProofNodeJson",
    description: "否定左規則（¬⇒）ノードを構築する。",
  },
  {
    name: "scNegationRight",
    signature:
      "(premise: ScProofNodeJson, conclusion: SequentJson) => ScProofNodeJson",
    description: "否定右規則（⇒¬）ノードを構築する。",
  },
  {
    name: "scUniversalLeft",
    signature:
      "(premise: ScProofNodeJson, conclusion: SequentJson) => ScProofNodeJson",
    description: "全称左規則（∀⇒）ノードを構築する。",
  },
  {
    name: "scUniversalRight",
    signature:
      "(premise: ScProofNodeJson, conclusion: SequentJson) => ScProofNodeJson",
    description: "全称右規則（⇒∀）ノードを構築する。",
  },
  {
    name: "scExistentialLeft",
    signature:
      "(premise: ScProofNodeJson, conclusion: SequentJson) => ScProofNodeJson",
    description: "存在左規則（∃⇒）ノードを構築する。",
  },
  {
    name: "scExistentialRight",
    signature:
      "(premise: ScProofNodeJson, conclusion: SequentJson) => ScProofNodeJson",
    description: "存在右規則（⇒∃）ノードを構築する。",
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

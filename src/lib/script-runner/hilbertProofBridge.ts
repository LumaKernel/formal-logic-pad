/**
 * Hilbert証明木（ProofNode）のサンドボックスブリッジ。
 *
 * ProofNode の JSON encode/decode、演繹定理の適用、
 * 証明木のワークスペース表示を提供する。
 *
 * 変更時は hilbertProofBridge.test.ts, workspaceBridge.ts, index.ts も同期すること。
 */

import { Either } from "effect";
import type { ProofNode } from "../logic-core/proofTree";
import { encodeFormula, decodeFormula } from "../logic-core/serialization";
import { formatFormula } from "../logic-lang/formatUnicode";
import { parseString } from "../logic-lang";
import {
  applyDeductionTheorem,
  reverseDeductionTheorem,
} from "../logic-core/deductionTheorem";
import type { NativeFunctionBridge } from "./scriptRunner";
import type { ProofBridgeApiDef } from "./proofBridge";
import type { WorkspaceCommandHandler } from "./workspaceBridge";

// ── ProofNode の JSON encode/decode ──────────────────────────

/**
 * ProofNode を JSON 互換プレーンオブジェクトに変換する。
 */
export const encodeProofNode = (node: ProofNode): unknown => {
  switch (node._tag) {
    case "AxiomNode":
      return {
        _tag: node._tag,
        formula: encodeFormula(node.formula),
      };
    case "ModusPonensNode":
      return {
        _tag: node._tag,
        formula: encodeFormula(node.formula),
        antecedent: encodeProofNode(node.antecedent),
        conditional: encodeProofNode(node.conditional),
      };
    case "GeneralizationNode":
      return {
        _tag: node._tag,
        formula: encodeFormula(node.formula),
        variable: { _tag: "TermVariable", name: node.variable.name },
        premise: encodeProofNode(node.premise),
      };
  }
  /* v8 ignore start */
  node satisfies never;
  return {};
  /* v8 ignore stop */
};

/**
 * JSON 互換オブジェクトから ProofNode をデコードする。
 * 不正入力はエラーをthrowする。
 */
export const decodeProofNode = (input: unknown): ProofNode => {
  if (typeof input !== "object" || input === null) {
    throw new Error("decodeProofNode: input must be an object");
  }
  const obj = input as Record<string, unknown>;
  const tag = obj["_tag"];
  if (typeof tag !== "string") {
    throw new Error("decodeProofNode: _tag must be a string");
  }

  switch (tag) {
    case "AxiomNode": {
      const formulaResult = decodeFormula(obj["formula"]);
      if (Either.isLeft(formulaResult)) {
        throw new Error("decodeProofNode: failed to decode AxiomNode formula");
      }
      return { _tag: "AxiomNode", formula: formulaResult.right };
    }
    case "ModusPonensNode": {
      const formulaResult = decodeFormula(obj["formula"]);
      if (Either.isLeft(formulaResult)) {
        throw new Error(
          "decodeProofNode: failed to decode ModusPonensNode formula",
        );
      }
      return {
        _tag: "ModusPonensNode",
        formula: formulaResult.right,
        antecedent: decodeProofNode(obj["antecedent"]),
        conditional: decodeProofNode(obj["conditional"]),
      };
    }
    case "GeneralizationNode": {
      const formulaResult = decodeFormula(obj["formula"]);
      if (Either.isLeft(formulaResult)) {
        throw new Error(
          "decodeProofNode: failed to decode GeneralizationNode formula",
        );
      }
      const variable = obj["variable"] as Record<string, unknown> | undefined;
      if (variable === undefined || typeof variable["name"] !== "string") {
        throw new Error(
          "decodeProofNode: GeneralizationNode variable.name must be a string",
        );
      }
      return {
        _tag: "GeneralizationNode",
        formula: formulaResult.right,
        variable: { _tag: "TermVariable", name: variable["name"] },
        premise: decodeProofNode(obj["premise"]),
      };
    }
    default:
      throw new Error(`decodeProofNode: unknown _tag: ${tag satisfies string}`);
  }
};

// ── 演繹定理ブリッジ ────────────────────────────────────────

/**
 * 演繹定理をサンドボックスから呼び出す。
 * proofJson: encodeProofNode済みのJSON互換オブジェクト
 * hypothesisText: 仮定の論理式テキスト
 * 返却値: encodeProofNode済みの変換後証明木
 */
const createApplyDeductionTheoremFn =
  () =>
  (proofJson: unknown, hypothesisText: unknown): unknown => {
    if (typeof hypothesisText !== "string") {
      const t = typeof hypothesisText satisfies string;
      throw new Error(
        `applyDeductionTheorem: hypothesisText must be string, got ${t satisfies string}`,
      );
    }

    // 仮定テキストをパース
    const parseResult = parseString(hypothesisText);
    if (Either.isLeft(parseResult)) {
      throw new Error(
        `applyDeductionTheorem: 仮定の論理式をパースできません: ${hypothesisText satisfies string}`,
      );
    }
    const hypothesis = parseResult.right;

    // 証明木をデコード
    const proof = decodeProofNode(proofJson);

    // 演繹定理を適用
    const result = applyDeductionTheorem(proof, hypothesis);
    if (Either.isLeft(result)) {
      const tag = result.left._tag satisfies string;
      throw new Error(
        `applyDeductionTheorem: 変換に失敗しました: ${tag satisfies string}`,
      );
    }

    return encodeProofNode(result.right);
  };

// ── 逆演繹定理ブリッジ ────────────────────────────────────────

/**
 * 逆演繹定理をサンドボックスから呼び出す。
 * proofJson: encodeProofNode済みのJSON互換オブジェクト（結論が A→B であること）
 * 返却値: encodeProofNode済みの変換後証明木（B の証明）
 */
const createApplyReverseDeductionTheoremFn =
  () =>
  (proofJson: unknown): unknown => {
    // 証明木をデコード
    const proof = decodeProofNode(proofJson);

    // 逆演繹定理を適用
    const result = reverseDeductionTheorem(proof);
    if (Either.isLeft(result)) {
      const tag = result.left._tag satisfies string;
      throw new Error(
        `applyReverseDeductionTheorem: 変換に失敗しました: ${tag satisfies string}`,
      );
    }

    return encodeProofNode(result.right);
  };

// ── 証明木ワークスペース表示 ────────────────────────────────

/**
 * ProofNode を再帰的にワークスペースに配置する。
 * ボトムアップ（葉→根）の順序でノードを追加し、MPで接続する。
 * 返却値: 配置したノードのID
 */
const displayProofNodeRecursive = (
  handler: WorkspaceCommandHandler,
  node: ProofNode,
): string => {
  switch (node._tag) {
    case "AxiomNode": {
      const text = formatFormula(node.formula);
      const id = handler.addNode(text);
      handler.setNodeRoleAxiom(id);
      return id;
    }
    case "ModusPonensNode": {
      const antId = displayProofNodeRecursive(handler, node.antecedent);
      const condId = displayProofNodeRecursive(handler, node.conditional);
      return handler.connectMP(antId, condId);
    }
    case "GeneralizationNode": {
      // Gen は現在のワークスペースAPIでは直接接続できないため、
      // 前提を配置し、結論をAxiomNodeとして配置する
      displayProofNodeRecursive(handler, node.premise);
      const text = formatFormula(node.formula);
      const id = handler.addNode(text);
      return id;
    }
  }
  /* v8 ignore start */
  node satisfies never;
  return "";
  /* v8 ignore stop */
};

/**
 * 証明木をワークスペースに表示する（clearせず横に配置）。
 */
const createDisplayHilbertProofFn =
  (handler: WorkspaceCommandHandler) =>
  (proofJson: unknown): unknown => {
    const proof = decodeProofNode(proofJson);
    displayProofNodeRecursive(handler, proof);
    handler.applyLayout();
    return undefined;
  };

// ── ブリッジ生成 ─────────────────────────────────────────────

/**
 * Hilbert証明木関連 API の NativeFunctionBridge 配列を生成する。
 */
export const createHilbertProofBridges = (
  handler: WorkspaceCommandHandler,
): readonly NativeFunctionBridge[] => [
  {
    name: "applyDeductionTheorem",
    fn: createApplyDeductionTheoremFn(),
  },
  {
    name: "applyReverseDeductionTheorem",
    fn: createApplyReverseDeductionTheoremFn(),
  },
  {
    name: "displayHilbertProof",
    fn: createDisplayHilbertProofFn(handler),
  },
];

// ── API 定義（Monaco Editor 補完用）─────────────────────────

export const HILBERT_PROOF_BRIDGE_API_DEFS: readonly ProofBridgeApiDef[] = [
  {
    name: "applyDeductionTheorem",
    signature:
      "(proof: ProofNodeJson, hypothesisText: string) => ProofNodeJson",
    description:
      "演繹定理を適用する。仮定 A を除去し、A → B の証明木を構築する。証明木のJSON表現と仮定の論理式テキストを指定する。",
  },
  {
    name: "applyReverseDeductionTheorem",
    signature: "(proof: ProofNodeJson) => ProofNodeJson",
    description:
      "逆演繹定理を適用する。A → B の証明木から、A を仮定として追加し B の証明木を構築する。結論が含意でない場合はエラー。",
  },
  {
    name: "displayHilbertProof",
    signature: "(proof: ProofNodeJson) => void",
    description:
      "Hilbert証明木をワークスペースに表示する。既存ノードはクリアせず、横に配置される。",
  },
];

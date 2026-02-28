/**
 * 証明図モジュール。
 *
 * Hilbert系の証明図（木構造）を表現し、検証する。
 * 各ノードは論理式（結論）と適用された規則を持ち、
 * 葉は公理インスタンス、内部ノードは推論規則適用を表す。
 *
 * @see dev/logic-reference/02-propositional-logic.md
 * @see dev/logic-reference/03-predicate-logic.md
 */

import { Either } from "effect";
import { type Formula } from "./formula";
import { type TermVariable } from "./term";
import { equalFormula } from "./equality";
import {
  type LogicSystem,
  type AxiomId,
  identifyAxiom,
  applyModusPonens,
  applyGeneralization,
} from "./inferenceRule";

// ── 証明図のノード型 ────────────────────────────────────────

/**
 * 公理ノード（葉ノード）。
 * 公理スキーマのインスタンスを導入する。
 */
export type AxiomNode = {
  readonly _tag: "AxiomNode";
  /** この公理インスタンスの結論（具体的な論理式） */
  readonly formula: Formula;
};

/**
 * Modus Ponensノード（内部ノード）。
 * 2つの前提（φ と φ→ψ）から結論 ψ を導出する。
 */
export type ModusPonensNode = {
  readonly _tag: "ModusPonensNode";
  /** 結論 ψ */
  readonly formula: Formula;
  /** 前提: φ */
  readonly antecedent: ProofNode;
  /** 前提: φ→ψ */
  readonly conditional: ProofNode;
};

/**
 * 汎化ノード（内部ノード）。
 * 前提 φ から結論 ∀x.φ を導出する。
 */
export type GeneralizationNode = {
  readonly _tag: "GeneralizationNode";
  /** 結論 ∀x.φ */
  readonly formula: Formula;
  /** 量化する変数 */
  readonly variable: TermVariable;
  /** 前提 φ */
  readonly premise: ProofNode;
};

/**
 * 証明図のノード（discriminated union）。
 *
 * 証明図は木構造であり:
 * - 葉は AxiomNode（公理インスタンスの導入）
 * - 内部ノードは ModusPonensNode（MP適用）または GeneralizationNode（Gen適用）
 */
export type ProofNode = AxiomNode | ModusPonensNode | GeneralizationNode;

// ── ファクトリ関数 ──────────────────────────────────────────

export const axiomNode = (formula: Formula): AxiomNode => ({
  _tag: "AxiomNode",
  formula,
});

export const modusPonensNode = (
  formula: Formula,
  antecedent: ProofNode,
  conditional: ProofNode,
): ModusPonensNode => ({
  _tag: "ModusPonensNode",
  formula,
  antecedent,
  conditional,
});

export const generalizationNode = (
  formula: Formula,
  variable: TermVariable,
  premise: ProofNode,
): GeneralizationNode => ({
  _tag: "GeneralizationNode",
  formula,
  variable,
  premise,
});

// ── 証明図のユーティリティ ──────────────────────────────────

/**
 * 証明図のノードから結論の論理式を取得する。
 */
export const getConclusion = (node: ProofNode): Formula => node.formula;

/**
 * 証明図のすべてのノード数を返す。
 */
export const countNodes = (node: ProofNode): number => {
  switch (node._tag) {
    case "AxiomNode":
      return 1;
    case "ModusPonensNode":
      return 1 + countNodes(node.antecedent) + countNodes(node.conditional);
    case "GeneralizationNode":
      return 1 + countNodes(node.premise);
  }
  /* v8 ignore start */
  node satisfies never;
  return 0;
  /* v8 ignore stop */
};

/**
 * 証明図の深さ（ルートからの最大距離）を返す。
 */
export const proofDepth = (node: ProofNode): number => {
  switch (node._tag) {
    case "AxiomNode":
      return 0;
    case "ModusPonensNode":
      return (
        1 + Math.max(proofDepth(node.antecedent), proofDepth(node.conditional))
      );
    case "GeneralizationNode":
      return 1 + proofDepth(node.premise);
  }
  /* v8 ignore start */
  node satisfies never;
  return 0;
  /* v8 ignore stop */
};

/**
 * 証明図で使われた公理ノードをすべて収集する。
 */
export const collectAxiomNodes = (node: ProofNode): readonly AxiomNode[] => {
  switch (node._tag) {
    case "AxiomNode":
      return [node];
    case "ModusPonensNode":
      return [
        ...collectAxiomNodes(node.antecedent),
        ...collectAxiomNodes(node.conditional),
      ];
    case "GeneralizationNode":
      return collectAxiomNodes(node.premise);
  }
  /* v8 ignore start */
  node satisfies never;
  return [];
  /* v8 ignore stop */
};

// ── 検証結果の型 ────────────────────────────────────────────

/**
 * 検証パスの要素。
 * 証明図中のエラー位置を特定するために使用する。
 */
export type PathSegment =
  | { readonly _tag: "Antecedent" }
  | { readonly _tag: "Conditional" }
  | { readonly _tag: "Premise" };

/**
 * 証明図の検証エラー。
 */
export type ProofValidationError =
  | {
      readonly _tag: "InvalidAxiom";
      readonly formula: Formula;
      readonly path: readonly PathSegment[];
    }
  | {
      readonly _tag: "ModusPonensFailure";
      readonly reason: string;
      readonly antecedent: Formula;
      readonly conditional: Formula;
      readonly path: readonly PathSegment[];
    }
  | {
      readonly _tag: "ConclusionMismatch";
      readonly expected: Formula;
      readonly actual: Formula;
      readonly path: readonly PathSegment[];
    }
  | {
      readonly _tag: "GeneralizationFailure";
      readonly reason: string;
      readonly formula: Formula;
      readonly path: readonly PathSegment[];
    };

/**
 * 証明図の検証結果。
 */
export type ProofValidationResult =
  | { readonly _tag: "Valid" }
  | {
      readonly _tag: "Invalid";
      readonly errors: readonly ProofValidationError[];
    };

// ── 検証関数 ────────────────────────────────────────────────

/**
 * 証明図全体の正当性を検証する。
 *
 * 各ノードについて:
 * - AxiomNode: 体系内で有効な公理のインスタンスかチェック
 * - ModusPonensNode: 子ノードの再帰検証 + MP適用の整合性チェック
 * - GeneralizationNode: 子ノードの再帰検証 + Gen適用の整合性チェック
 *
 * @param proof 検証する証明図のルートノード
 * @param system 使用する論理体系
 * @returns 検証結果（Valid または Invalid + エラーリスト）
 */
export const validateProof = (
  proof: ProofNode,
  system: LogicSystem,
): ProofValidationResult => {
  const errors: ProofValidationError[] = [];
  validateNode(proof, system, [], errors);
  if (errors.length === 0) {
    return { _tag: "Valid" };
  }
  return { _tag: "Invalid", errors };
};

const validateNode = (
  node: ProofNode,
  system: LogicSystem,
  path: readonly PathSegment[],
  errors: ProofValidationError[],
): void => {
  switch (node._tag) {
    case "AxiomNode":
      validateAxiomNode(node, system, path, errors);
      return;
    case "ModusPonensNode":
      validateModusPonensNode(node, system, path, errors);
      return;
    case "GeneralizationNode":
      validateGeneralizationNode(node, system, path, errors);
      return;
  }
  /* v8 ignore start */
  node satisfies never;
  /* v8 ignore stop */
};

const validateAxiomNode = (
  node: AxiomNode,
  system: LogicSystem,
  path: readonly PathSegment[],
  errors: ProofValidationError[],
): void => {
  const result = identifyAxiom(node.formula, system);
  if (result._tag === "Error") {
    errors.push({
      _tag: "InvalidAxiom",
      formula: node.formula,
      path,
    });
  }
};

const validateModusPonensNode = (
  node: ModusPonensNode,
  system: LogicSystem,
  path: readonly PathSegment[],
  errors: ProofValidationError[],
): void => {
  // 子ノードを先に検証
  validateNode(
    node.antecedent,
    system,
    [...path, { _tag: "Antecedent" }],
    errors,
  );
  validateNode(
    node.conditional,
    system,
    [...path, { _tag: "Conditional" }],
    errors,
  );

  // MP適用の整合性チェック
  const mpResult = applyModusPonens(
    getConclusion(node.antecedent),
    getConclusion(node.conditional),
  );

  if (Either.isLeft(mpResult)) {
    const reason =
      mpResult.left._tag === "NotAnImplication"
        ? "conditional premise is not an implication"
        : "antecedent does not match the left side of the implication";
    errors.push({
      _tag: "ModusPonensFailure",
      reason,
      antecedent: getConclusion(node.antecedent),
      conditional: getConclusion(node.conditional),
      path,
    });
    return;
  }

  // MP結果とノードの結論が一致するかチェック
  if (!equalFormula(mpResult.right.conclusion, node.formula)) {
    errors.push({
      _tag: "ConclusionMismatch",
      expected: mpResult.right.conclusion,
      actual: node.formula,
      path,
    });
  }
};

const validateGeneralizationNode = (
  node: GeneralizationNode,
  system: LogicSystem,
  path: readonly PathSegment[],
  errors: ProofValidationError[],
): void => {
  // 子ノードを先に検証
  validateNode(node.premise, system, [...path, { _tag: "Premise" }], errors);

  // Gen適用の整合性チェック
  const genResult = applyGeneralization(
    getConclusion(node.premise),
    node.variable,
    system,
  );

  if (Either.isLeft(genResult)) {
    errors.push({
      _tag: "GeneralizationFailure",
      reason: "generalization is not enabled in this system",
      formula: getConclusion(node.premise),
      path,
    });
    return;
  }

  // Gen結果とノードの結論が一致するかチェック
  if (!equalFormula(genResult.right.conclusion, node.formula)) {
    errors.push({
      _tag: "ConclusionMismatch",
      expected: genResult.right.conclusion,
      actual: node.formula,
      path,
    });
  }
};

// ── 可視化用データ出力 ────────────────────────────────────

/**
 * 可視化用のノードデータ。
 * UIレイヤーで証明図をレンダリングするための情報を持つ。
 */
export type ProofNodeVisualization = {
  /** ノードの一意ID */
  readonly id: string;
  /** 結論の論理式 */
  readonly formula: Formula;
  /** ノードの種類ラベル */
  readonly label: string;
  /** 公理IDまたは規則名 */
  readonly rule: string;
  /** 子ノードのID */
  readonly children: readonly string[];
  /** 公理判定結果（AxiomNodeの場合） */
  readonly axiomId?: AxiomId;
};

/**
 * 証明図を可視化用データに変換する。
 * 各ノードに一意なIDを付与し、フラットなリストとして返す。
 *
 * @param proof 証明図のルートノード
 * @param system 使用する論理体系（公理IDの判定に使用）
 * @returns 可視化用ノードデータのリスト（ルートが先頭）
 */
export const toVisualizationData = (
  proof: ProofNode,
  system: LogicSystem,
): readonly ProofNodeVisualization[] => {
  const result: ProofNodeVisualization[] = [];
  let nextId = 0;

  const visit = (node: ProofNode): string => {
    const id = `node-${nextId satisfies number}`;
    nextId++;

    switch (node._tag) {
      case "AxiomNode": {
        const axiomResult = identifyAxiom(node.formula, system);
        const axiomId =
          axiomResult._tag === "Ok" ? axiomResult.axiomId : undefined;
        result.push({
          id,
          formula: node.formula,
          label:
            axiomId !== undefined
              ? `Axiom ${axiomId satisfies string}`
              : "Axiom",
          rule: axiomId ?? "unknown",
          children: [],
          axiomId,
        });
        return id;
      }
      case "ModusPonensNode": {
        const antId = visit(node.antecedent);
        const condId = visit(node.conditional);
        result.push({
          id,
          formula: node.formula,
          label: "MP",
          rule: "MP",
          children: [antId, condId],
        });
        return id;
      }
      case "GeneralizationNode": {
        const premId = visit(node.premise);
        result.push({
          id,
          formula: node.formula,
          label: "Gen",
          rule: "Gen",
          children: [premId],
        });
        return id;
      }
    }
    /* v8 ignore start */
    node satisfies never;
    return id;
    /* v8 ignore stop */
  };

  visit(proof);
  return result;
};

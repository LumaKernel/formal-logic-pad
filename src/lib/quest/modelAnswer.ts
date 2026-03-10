/**
 * クエスト模範解答の型定義・ビルダー・バリデーション。
 *
 * 模範解答は証明図の構造として保持し、ワークスペースへの変換は純粋関数で行う。
 * ノート自体ではなく、ステップのDAG構造で表現する。
 *
 * 変更時は modelAnswer.test.ts, builtinModelAnswers.ts も同期すること。
 *
 * ステップタイプを追加する場合:
 * 1. ModelAnswerStep に新しいタグを追加
 * 2. buildModelAnswerWorkspace の switch に対応する case を追加
 * 3. modelAnswer.test.ts にテストを追加
 */

import * as Either from "effect/Either";
import type { QuestDefinition, QuestId } from "./questDefinition";
import { resolveSystemPreset } from "./questStartLogic";
import {
  type WorkspaceState,
  createQuestWorkspace,
  addNode,
  applyMPAndConnect,
  applyGenAndConnect,
  applyTreeLayout,
  applyTabRuleAndConnect,
  applyScRuleAndConnect,
} from "../proof-pad/workspaceState";
import {
  checkQuestGoalsWithAxioms,
  type QuestGoalCheckWithAxiomsResult,
} from "./questCompletionLogic";
import type { NdInferenceEdge } from "../proof-pad/inferenceEdge";
import {
  validateNdApplication,
  isNdEfqValidResult,
} from "../proof-pad/ndApplicationLogic";
import type { TabRuleId } from "../logic-core/tableauCalculus";
import type { TabRuleApplicationParams } from "../proof-pad/tabApplicationLogic";
import type { ScRuleId } from "../logic-core/deductionSystem";
import type { ScRuleApplicationParams } from "../proof-pad/scApplicationLogic";

// --- ステップ定義 ---

/**
 * 模範解答の1ステップ。
 *
 * Hilbert系:
 * - axiom: 公理インスタンスを直接記述
 * - mp: 既存2ステップにMPを適用
 * - gen: 既存ステップにGen（汎化）を適用
 *
 * ND（自然演繹）:
 * - assumption: 仮定ノードを追加（後でdischargeされうる）
 * - nd-implication-intro: →導入（前提 + 打消し仮定）
 * - nd-implication-elim: →除去（φ + φ→ψ → ψ）
 * - nd-conjunction-intro: ∧導入（φ + ψ → φ∧ψ）
 * - nd-conjunction-elim-left: ∧除去左（φ∧ψ → φ）
 * - nd-conjunction-elim-right: ∧除去右（φ∧ψ → ψ）
 * - nd-disjunction-intro-left: ∨導入左（φ → φ∨ψ）
 * - nd-disjunction-intro-right: ∨導入右（ψ → φ∨ψ）
 * - nd-disjunction-elim: ∨除去（φ∨ψ + φ→χ + ψ→χ → χ）
 * - nd-weakening: 弱化（φ, ψ → φ）
 * - nd-efq: 爆発律（⊥ → φ）
 * - nd-dne: 二重否定除去（¬¬φ → φ）
 * - nd-universal-intro: ∀導入（φ → ∀x.φ）
 * - nd-universal-elim: ∀除去（∀x.φ → φ[t/x]）
 * - nd-existential-intro: ∃導入（φ[t/x] → ∃x.φ）
 * - nd-existential-elim: ∃除去（∃x.φ + φ→χ → χ）
 *
 * TAB（タブロー式シーケント計算）:
 * - tab-root: ルートノード（ゴールの式 = 反駁する式）を配置
 * - tab-rule: TAB規則を前ステップに適用（ruleId + principalPosition で指定）
 *
 * SC（シーケント計算）:
 * - sc-root: ルートノード（結論のシーケント）を配置
 * - sc-rule: SC規則を前ステップに適用（ruleId + principalPosition 等で指定）
 */
export type ModelAnswerStep =
  // Hilbert系ステップ
  | {
      readonly _tag: "axiom";
      /** 公理インスタンスの式テキスト（DSL形式） */
      readonly formulaText: string;
    }
  | {
      readonly _tag: "mp";
      /** 前件ノードのステップインデックス（0始まり） */
      readonly leftIndex: number;
      /** 条件式ノードのステップインデックス（0始まり） */
      readonly rightIndex: number;
    }
  | {
      readonly _tag: "gen";
      /** 前提ノードのステップインデックス（0始まり） */
      readonly premiseIndex: number;
      /** 汎化する変数名 */
      readonly variableName: string;
    }
  // ND（自然演繹）ステップ
  | {
      readonly _tag: "assumption";
      /** 仮定の式テキスト（DSL形式） */
      readonly formulaText: string;
    }
  | {
      readonly _tag: "nd-implication-intro";
      /** ψを証明する前提のステップインデックス */
      readonly premiseIndex: number;
      /** 打ち消す仮定のステップインデックス */
      readonly dischargedIndex: number;
    }
  | {
      readonly _tag: "nd-implication-elim";
      /** antecedent（φ）のステップインデックス */
      readonly leftIndex: number;
      /** conditional（φ→ψ）のステップインデックス */
      readonly rightIndex: number;
    }
  | {
      readonly _tag: "nd-conjunction-intro";
      /** 左辺（φ）のステップインデックス */
      readonly leftIndex: number;
      /** 右辺（ψ）のステップインデックス */
      readonly rightIndex: number;
    }
  | {
      readonly _tag: "nd-conjunction-elim-left";
      /** 前提（φ∧ψ）のステップインデックス */
      readonly premiseIndex: number;
    }
  | {
      readonly _tag: "nd-conjunction-elim-right";
      /** 前提（φ∧ψ）のステップインデックス */
      readonly premiseIndex: number;
    }
  | {
      readonly _tag: "nd-disjunction-intro-left";
      /** 前提（φ）のステップインデックス */
      readonly premiseIndex: number;
      /** 追加する右辺の式テキスト */
      readonly addedRightText: string;
    }
  | {
      readonly _tag: "nd-disjunction-intro-right";
      /** 前提（ψ）のステップインデックス */
      readonly premiseIndex: number;
      /** 追加する左辺の式テキスト */
      readonly addedLeftText: string;
    }
  | {
      readonly _tag: "nd-disjunction-elim";
      /** φ∨ψ のステップインデックス */
      readonly disjunctionIndex: number;
      /** φ→χ の証明のステップインデックス */
      readonly leftCaseIndex: number;
      /** 左仮定のステップインデックス */
      readonly leftDischargedIndex: number;
      /** ψ→χ の証明のステップインデックス */
      readonly rightCaseIndex: number;
      /** 右仮定のステップインデックス */
      readonly rightDischargedIndex: number;
    }
  | {
      readonly _tag: "nd-weakening";
      /** 残す方の前提のステップインデックス */
      readonly keptIndex: number;
      /** 捨てる方の前提のステップインデックス */
      readonly discardedIndex: number;
    }
  | {
      readonly _tag: "nd-efq";
      /** ⊥の証明のステップインデックス */
      readonly premiseIndex: number;
      /** 結論の式テキスト（EFQは結論を自動計算できないため明示指定） */
      readonly conclusionText: string;
    }
  | {
      readonly _tag: "nd-dne";
      /** ¬¬φ の証明のステップインデックス */
      readonly premiseIndex: number;
    }
  | {
      readonly _tag: "nd-universal-intro";
      /** 前提のステップインデックス */
      readonly premiseIndex: number;
      /** 量化変数名 */
      readonly variableName: string;
    }
  | {
      readonly _tag: "nd-universal-elim";
      /** ∀x.φ の前提のステップインデックス */
      readonly premiseIndex: number;
      /** 代入する項のテキスト */
      readonly termText: string;
    }
  | {
      readonly _tag: "nd-existential-intro";
      /** φ[t/x] の前提のステップインデックス */
      readonly premiseIndex: number;
      /** 量化変数名 */
      readonly variableName: string;
      /** 代入する項のテキスト */
      readonly termText: string;
    }
  | {
      readonly _tag: "nd-existential-elim";
      /** ∃x.φ のステップインデックス */
      readonly existentialIndex: number;
      /** φの仮定下でのχの証明のステップインデックス */
      readonly caseIndex: number;
      /** 打ち消す仮定のステップインデックス */
      readonly dischargedIndex: number;
    }
  // TAB（タブロー式シーケント計算）ステップ
  | {
      readonly _tag: "tab-root";
      /** ルートノードのシーケントテキスト（カンマ区切りの前件） */
      readonly sequentText: string;
    }
  | {
      readonly _tag: "tab-rule";
      /**
       * 規則を適用するノードのインデックス（stepNodeIds配列のインデックス）。
       * TABでは分岐規則が2つのノードを生成するため、ステップインデックスとノードインデックスがずれる。
       * 分岐規則のステップは左ノードと右ノードの2つのエントリをstepNodeIdsに追加する。
       */
      readonly conclusionIndex: number;
      /** 適用するTAB規則ID */
      readonly ruleId: TabRuleId;
      /** 主論理式の位置（0-based） */
      readonly principalPosition: number;
      /** 固有変数名（¬∀, ∃規則用） */
      readonly eigenVariable?: string;
      /** 代入項テキスト（∀, ¬∃規則用） */
      readonly termText?: string;
      /** 交換位置（e規則用） */
      readonly exchangePosition?: number;
    }
  // SC（シーケント計算）ステップ
  | {
      readonly _tag: "sc-root";
      /** ルートノードのシーケントテキスト（"Γ ⇒ Δ" 形式） */
      readonly sequentText: string;
    }
  | {
      readonly _tag: "sc-rule";
      /**
       * 規則を適用するノードのインデックス（stepNodeIds配列のインデックス）。
       * SCでは分岐規則が2つのノードを生成するため、ステップインデックスとノードインデックスがずれる。
       * 分岐規則のステップは左ノードと右ノードの2つのエントリをstepNodeIdsに追加する。
       */
      readonly conclusionIndex: number;
      /** 適用するSC規則ID */
      readonly ruleId: ScRuleId;
      /** 主論理式の位置（0-based） */
      readonly principalPosition: number;
      /** 固有変数名（∀右規則, ∃左規則用） */
      readonly eigenVariable?: string;
      /** 代入項テキスト（∀左規則, ∃右規則用） */
      readonly termText?: string;
      /** 交換位置（e規則用） */
      readonly exchangePosition?: number;
      /** 成分インデックス（∧左規則, ∨右規則用: 1 or 2） */
      readonly componentIndex?: 1 | 2;
      /** カット式テキスト（cut規則用） */
      readonly cutFormulaText?: string;
    };

// --- 模範解答定義 ---

/** クエストの模範解答（イミュータブル） */
export type ModelAnswer = {
  /** 対応するクエストID */
  readonly questId: QuestId;
  /** ステップ列（インデックスで前ステップを参照するDAG） */
  readonly steps: readonly ModelAnswerStep[];
};

// --- ビルダー ---

/** ビルド結果 */
export type BuildModelAnswerResult =
  | {
      readonly _tag: "Ok";
      readonly workspace: WorkspaceState;
      readonly goalCheck: QuestGoalCheckWithAxiomsResult;
    }
  | {
      readonly _tag: "PresetNotFound";
      readonly presetId: string;
    }
  | {
      readonly _tag: "StepError";
      readonly stepIndex: number;
      readonly reason: string;
    };

// --- NDステップのヘルパー ---

/** ステップインデックスからノードIDを取得。undefinedなら StepError を返す */
function resolveNodeId(
  stepNodeIds: readonly string[],
  index: number,
  label: string,
  stepIndex: number,
): { readonly nodeId: string } | BuildModelAnswerResult {
  const nodeId = stepNodeIds[index];
  if (nodeId === undefined) {
    /* v8 ignore start — defensive: invalid model answer data */
    return {
      _tag: "StepError",
      stepIndex,
      reason: `invalid ${label satisfies string} index: ${String(index) satisfies string}`,
    };
    /* v8 ignore stop */
  }
  return { nodeId };
}

function isError(result: { readonly nodeId: string } | BuildModelAnswerResult) {
  return "stepIndex" in result || "_tag" in result;
}

/**
 * NDステップを処理する共通ヘルパー。
 * NdInferenceEdge を構築 → バリデーション → 結論ノード作成 → エッジ追加。
 */
function applyNdStep(
  ws: WorkspaceState,
  edge: NdInferenceEdge,
  stepIndex: number,
):
  | { readonly workspace: WorkspaceState; readonly nodeId: string }
  | BuildModelAnswerResult {
  const nodeId = edge.conclusionNodeId;

  // バリデーション
  const validationResult = validateNdApplication(ws, edge);
  /* v8 ignore start — defensive: correct model answers never fail ND validation */
  if (Either.isLeft(validationResult)) {
    return {
      _tag: "StepError",
      stepIndex,
      reason: `ND ${edge._tag satisfies string} validation failed: ${validationResult.left._tag satisfies string}`,
    };
  }
  /* v8 ignore stop */

  // 結論テキストを決定
  const conclusionText = isNdEfqValidResult(validationResult.right)
    ? edge.conclusionText
    : validationResult.right.conclusionText;

  // 結論ノードの formulaText を更新
  const updatedWs: WorkspaceState = {
    ...ws,
    nodes: ws.nodes.map((n) =>
      n.id === nodeId ? { ...n, formulaText: conclusionText } : n,
    ),
    inferenceEdges: ws.inferenceEdges.map((e) =>
      e.conclusionNodeId === nodeId ? { ...e, conclusionText } : e,
    ),
  };

  return { workspace: updatedWs, nodeId };
}

/**
 * ModelAnswer から WorkspaceState を純粋に構築する。
 *
 * 1. resolveSystemPreset でDeductionSystemを取得
 * 2. createQuestWorkspace でゴール付きワークスペースを作成
 * 3. ステップを順に適用（addNode + applyMPAndConnect / ND規則適用）
 * 4. applyTreeLayout で自動配置
 * 5. checkQuestGoalsWithAxioms でゴール達成を検証
 */
export function buildModelAnswerWorkspace(
  quest: QuestDefinition,
  answer: ModelAnswer,
): BuildModelAnswerResult {
  const preset = resolveSystemPreset(quest.systemPresetId);
  if (preset === undefined) {
    return { _tag: "PresetNotFound", presetId: quest.systemPresetId };
  }

  // ゴールのallowedAxiomIdsをクエスト定義から引き継ぐ
  /* v8 ignore start — allowedAxiomIds付きクエストの模範解答は後続イテレーションで追加 */
  const goals =
    quest.allowedAxiomIds !== undefined
      ? quest.goals.map((g) => ({
          ...g,
          allowedAxiomIds: g.allowedAxiomIds ?? quest.allowedAxiomIds,
        }))
      : quest.goals;
  /* v8 ignore stop */

  let ws = createQuestWorkspace(preset.deductionSystem, goals);

  // ステップインデックス → ノードID のマッピング
  const stepNodeIds: string[] = [];

  for (let i = 0; i < answer.steps.length; i++) {
    const step = answer.steps[i];
    /* v8 ignore start — 防御的ガード: 正常な配列アクセスでは到達しない */
    if (step === undefined) {
      return { _tag: "StepError", stepIndex: i, reason: "undefined step" };
    }
    /* v8 ignore stop */

    /* v8 ignore start — switch artifact: v8 creates branch per case at switch line */
    switch (step._tag) {
      /* v8 ignore stop */
      case "axiom": {
        const nodeId = `node-${String(ws.nextNodeId) satisfies string}`;
        ws = addNode(ws, "axiom", "Axiom", { x: 0, y: 0 }, step.formulaText);
        stepNodeIds.push(nodeId);
        break;
      }
      case "mp": {
        const leftNodeId = stepNodeIds[step.leftIndex];
        const rightNodeId = stepNodeIds[step.rightIndex];
        /* v8 ignore start — defensive: invalid model answer data */
        if (leftNodeId === undefined || rightNodeId === undefined) {
          return {
            _tag: "StepError",
            stepIndex: i,
            reason: `invalid index: left=${String(step.leftIndex) satisfies string}, right=${String(step.rightIndex) satisfies string}`,
          };
        }
        /* v8 ignore stop */
        const result = applyMPAndConnect(ws, leftNodeId, rightNodeId, {
          x: 0,
          y: 0,
        });
        ws = result.workspace;
        /* v8 ignore start — defensive: correct model answers never fail MP validation */
        if (Either.isLeft(result.validation)) {
          return {
            _tag: "StepError",
            stepIndex: i,
            reason: `MP validation failed`,
          };
        }
        /* v8 ignore stop */
        stepNodeIds.push(result.mpNodeId);
        break;
      }
      case "gen": {
        const premiseNodeId = stepNodeIds[step.premiseIndex];
        /* v8 ignore start — defensive: invalid model answer data */
        if (premiseNodeId === undefined) {
          return {
            _tag: "StepError",
            stepIndex: i,
            reason: `invalid index: premise=${String(step.premiseIndex) satisfies string}`,
          };
        }
        /* v8 ignore stop */
        const genResult = applyGenAndConnect(
          ws,
          premiseNodeId,
          step.variableName,
          { x: 0, y: 0 },
        );
        ws = genResult.workspace;
        /* v8 ignore start — defensive: correct model answers never fail Gen validation */
        if (Either.isLeft(genResult.validation)) {
          return {
            _tag: "StepError",
            stepIndex: i,
            reason: `Gen validation failed`,
          };
        }
        /* v8 ignore stop */
        stepNodeIds.push(genResult.genNodeId);
        break;
      }
      // --- ND（自然演繹）ステップ ---
      case "assumption": {
        const nodeId = `node-${String(ws.nextNodeId) satisfies string}`;
        ws = addNode(
          ws,
          "axiom",
          "Assumption",
          { x: 0, y: 0 },
          step.formulaText,
        );
        stepNodeIds.push(nodeId);
        break;
      }
      case "nd-implication-intro": {
        const premiseRes = resolveNodeId(
          stepNodeIds,
          step.premiseIndex,
          "premise",
          i,
        );
        /* v8 ignore start — defensive: valid model answer never fails resolveNodeId */
        if (isError(premiseRes)) return premiseRes;
        /* v8 ignore stop */
        const dischRes = resolveNodeId(
          stepNodeIds,
          step.dischargedIndex,
          "discharged",
          i,
        );
        /* v8 ignore start — defensive: valid model answer never fails resolveNodeId */
        if (isError(dischRes)) return dischRes;
        /* v8 ignore stop */

        // 打ち消す仮定のformulaTextを取得
        const dischNode = ws.nodes.find((n) => n.id === dischRes.nodeId);
        /* v8 ignore start — defensive: node always exists for valid model answer */
        if (!dischNode) {
          return {
            _tag: "StepError",
            stepIndex: i,
            reason: "discharged node not found",
          };
        }
        /* v8 ignore stop */

        const conclusionNodeId = `node-${String(ws.nextNodeId) satisfies string}`;
        ws = addNode(ws, "axiom", "→I", { x: 0, y: 0 }, "");

        const assumptionId = step.dischargedIndex + 1;
        const edge: NdInferenceEdge = {
          _tag: "nd-implication-intro",
          conclusionNodeId,
          premiseNodeId: premiseRes.nodeId,
          dischargedFormulaText: dischNode.formulaText,
          dischargedAssumptionId: assumptionId,
          conclusionText: "",
        };
        ws = { ...ws, inferenceEdges: [...ws.inferenceEdges, edge] };

        const ndResult = applyNdStep(ws, edge, i);
        /* v8 ignore start — defensive: valid model answer never fails applyNdStep */
        if ("_tag" in ndResult) return ndResult;
        /* v8 ignore stop */
        ws = ndResult.workspace;
        stepNodeIds.push(conclusionNodeId);
        break;
      }
      case "nd-implication-elim": {
        const leftRes = resolveNodeId(stepNodeIds, step.leftIndex, "left", i);
        /* v8 ignore start — defensive: valid model answer never fails resolveNodeId */
        if (isError(leftRes)) return leftRes;
        /* v8 ignore stop */
        const rightRes = resolveNodeId(
          stepNodeIds,
          step.rightIndex,
          "right",
          i,
        );
        /* v8 ignore start — defensive: valid model answer never fails resolveNodeId */
        if (isError(rightRes)) return rightRes;
        /* v8 ignore stop */

        const conclusionNodeId = `node-${String(ws.nextNodeId) satisfies string}`;
        ws = addNode(ws, "axiom", "→E", { x: 0, y: 0 }, "");

        const edge: NdInferenceEdge = {
          _tag: "nd-implication-elim",
          conclusionNodeId,
          leftPremiseNodeId: leftRes.nodeId,
          rightPremiseNodeId: rightRes.nodeId,
          conclusionText: "",
        };
        ws = { ...ws, inferenceEdges: [...ws.inferenceEdges, edge] };

        const ndResult = applyNdStep(ws, edge, i);
        /* v8 ignore start — defensive: valid model answer never fails applyNdStep */
        if ("_tag" in ndResult) return ndResult;
        /* v8 ignore stop */
        ws = ndResult.workspace;
        stepNodeIds.push(conclusionNodeId);
        break;
      }
      case "nd-conjunction-intro": {
        const leftRes = resolveNodeId(stepNodeIds, step.leftIndex, "left", i);
        /* v8 ignore start — defensive: valid model answer never fails resolveNodeId */
        if (isError(leftRes)) return leftRes;
        /* v8 ignore stop */
        const rightRes = resolveNodeId(
          stepNodeIds,
          step.rightIndex,
          "right",
          i,
        );
        /* v8 ignore start — defensive: valid model answer never fails resolveNodeId */
        if (isError(rightRes)) return rightRes;
        /* v8 ignore stop */

        const conclusionNodeId = `node-${String(ws.nextNodeId) satisfies string}`;
        ws = addNode(ws, "axiom", "∧I", { x: 0, y: 0 }, "");

        const edge: NdInferenceEdge = {
          _tag: "nd-conjunction-intro",
          conclusionNodeId,
          leftPremiseNodeId: leftRes.nodeId,
          rightPremiseNodeId: rightRes.nodeId,
          conclusionText: "",
        };
        ws = { ...ws, inferenceEdges: [...ws.inferenceEdges, edge] };

        const ndResult = applyNdStep(ws, edge, i);
        /* v8 ignore start — defensive: valid model answer never fails applyNdStep */
        if ("_tag" in ndResult) return ndResult;
        /* v8 ignore stop */
        ws = ndResult.workspace;
        stepNodeIds.push(conclusionNodeId);
        break;
      }
      case "nd-conjunction-elim-left": {
        const premiseRes = resolveNodeId(
          stepNodeIds,
          step.premiseIndex,
          "premise",
          i,
        );
        /* v8 ignore start — defensive: valid model answer never fails resolveNodeId */
        if (isError(premiseRes)) return premiseRes;
        /* v8 ignore stop */

        const conclusionNodeId = `node-${String(ws.nextNodeId) satisfies string}`;
        ws = addNode(ws, "axiom", "∧E_L", { x: 0, y: 0 }, "");

        const edge: NdInferenceEdge = {
          _tag: "nd-conjunction-elim-left",
          conclusionNodeId,
          premiseNodeId: premiseRes.nodeId,
          conclusionText: "",
        };
        ws = { ...ws, inferenceEdges: [...ws.inferenceEdges, edge] };

        const ndResult = applyNdStep(ws, edge, i);
        /* v8 ignore start — defensive: valid model answer never fails applyNdStep */
        if ("_tag" in ndResult) return ndResult;
        /* v8 ignore stop */
        ws = ndResult.workspace;
        stepNodeIds.push(conclusionNodeId);
        break;
      }
      case "nd-conjunction-elim-right": {
        const premiseRes = resolveNodeId(
          stepNodeIds,
          step.premiseIndex,
          "premise",
          i,
        );
        /* v8 ignore start — defensive: valid model answer never fails resolveNodeId */
        if (isError(premiseRes)) return premiseRes;
        /* v8 ignore stop */

        const conclusionNodeId = `node-${String(ws.nextNodeId) satisfies string}`;
        ws = addNode(ws, "axiom", "∧E_R", { x: 0, y: 0 }, "");

        const edge: NdInferenceEdge = {
          _tag: "nd-conjunction-elim-right",
          conclusionNodeId,
          premiseNodeId: premiseRes.nodeId,
          conclusionText: "",
        };
        ws = { ...ws, inferenceEdges: [...ws.inferenceEdges, edge] };

        const ndResult = applyNdStep(ws, edge, i);
        /* v8 ignore start — defensive: valid model answer never fails applyNdStep */
        if ("_tag" in ndResult) return ndResult;
        /* v8 ignore stop */
        ws = ndResult.workspace;
        stepNodeIds.push(conclusionNodeId);
        break;
      }
      case "nd-disjunction-intro-left": {
        const premiseRes = resolveNodeId(
          stepNodeIds,
          step.premiseIndex,
          "premise",
          i,
        );
        /* v8 ignore start — defensive: valid model answer never fails resolveNodeId */
        if (isError(premiseRes)) return premiseRes;
        /* v8 ignore stop */

        const conclusionNodeId = `node-${String(ws.nextNodeId) satisfies string}`;
        ws = addNode(ws, "axiom", "∨I_L", { x: 0, y: 0 }, "");

        const edge: NdInferenceEdge = {
          _tag: "nd-disjunction-intro-left",
          conclusionNodeId,
          premiseNodeId: premiseRes.nodeId,
          addedRightText: step.addedRightText,
          conclusionText: "",
        };
        ws = { ...ws, inferenceEdges: [...ws.inferenceEdges, edge] };

        const ndResult = applyNdStep(ws, edge, i);
        /* v8 ignore start — defensive: valid model answer never fails applyNdStep */
        if ("_tag" in ndResult) return ndResult;
        /* v8 ignore stop */
        ws = ndResult.workspace;
        stepNodeIds.push(conclusionNodeId);
        break;
      }
      case "nd-disjunction-intro-right": {
        const premiseRes = resolveNodeId(
          stepNodeIds,
          step.premiseIndex,
          "premise",
          i,
        );
        /* v8 ignore start — defensive: valid model answer never fails resolveNodeId */
        if (isError(premiseRes)) return premiseRes;
        /* v8 ignore stop */

        const conclusionNodeId = `node-${String(ws.nextNodeId) satisfies string}`;
        ws = addNode(ws, "axiom", "∨I_R", { x: 0, y: 0 }, "");

        const edge: NdInferenceEdge = {
          _tag: "nd-disjunction-intro-right",
          conclusionNodeId,
          premiseNodeId: premiseRes.nodeId,
          addedLeftText: step.addedLeftText,
          conclusionText: "",
        };
        ws = { ...ws, inferenceEdges: [...ws.inferenceEdges, edge] };

        const ndResult = applyNdStep(ws, edge, i);
        /* v8 ignore start — defensive: valid model answer never fails applyNdStep */
        if ("_tag" in ndResult) return ndResult;
        /* v8 ignore stop */
        ws = ndResult.workspace;
        stepNodeIds.push(conclusionNodeId);
        break;
      }
      case "nd-disjunction-elim": {
        const disjRes = resolveNodeId(
          stepNodeIds,
          step.disjunctionIndex,
          "disjunction",
          i,
        );
        /* v8 ignore start — defensive: valid model answer never fails resolveNodeId */
        if (isError(disjRes)) return disjRes;
        /* v8 ignore stop */
        const leftCaseRes = resolveNodeId(
          stepNodeIds,
          step.leftCaseIndex,
          "leftCase",
          i,
        );
        /* v8 ignore start — defensive: valid model answer never fails resolveNodeId */
        if (isError(leftCaseRes)) return leftCaseRes;
        /* v8 ignore stop */
        const rightCaseRes = resolveNodeId(
          stepNodeIds,
          step.rightCaseIndex,
          "rightCase",
          i,
        );
        /* v8 ignore start — defensive: valid model answer never fails resolveNodeId */
        if (isError(rightCaseRes)) return rightCaseRes;
        /* v8 ignore stop */

        const conclusionNodeId = `node-${String(ws.nextNodeId) satisfies string}`;
        ws = addNode(ws, "axiom", "∨E", { x: 0, y: 0 }, "");

        const edge: NdInferenceEdge = {
          _tag: "nd-disjunction-elim",
          conclusionNodeId,
          disjunctionPremiseNodeId: disjRes.nodeId,
          leftCasePremiseNodeId: leftCaseRes.nodeId,
          leftDischargedAssumptionId: step.leftDischargedIndex + 1,
          rightCasePremiseNodeId: rightCaseRes.nodeId,
          rightDischargedAssumptionId: step.rightDischargedIndex + 1,
          conclusionText: "",
        };
        ws = { ...ws, inferenceEdges: [...ws.inferenceEdges, edge] };

        const ndResult = applyNdStep(ws, edge, i);
        /* v8 ignore start — defensive: valid model answer never fails applyNdStep */
        if ("_tag" in ndResult) return ndResult;
        /* v8 ignore stop */
        ws = ndResult.workspace;
        stepNodeIds.push(conclusionNodeId);
        break;
      }
      /* v8 ignore start — unused until model answers for these ND step types are added */
      case "nd-weakening": {
        const keptRes = resolveNodeId(stepNodeIds, step.keptIndex, "kept", i);
        /* v8 ignore start — defensive: valid model answer never fails resolveNodeId */
        if (isError(keptRes)) return keptRes;
        /* v8 ignore stop */
        const discardedRes = resolveNodeId(
          stepNodeIds,
          step.discardedIndex,
          "discarded",
          i,
        );
        /* v8 ignore start — defensive: valid model answer never fails resolveNodeId */
        if (isError(discardedRes)) return discardedRes;
        /* v8 ignore stop */

        const conclusionNodeId = `node-${String(ws.nextNodeId) satisfies string}`;
        ws = addNode(ws, "axiom", "w", { x: 0, y: 0 }, "");

        const edge: NdInferenceEdge = {
          _tag: "nd-weakening",
          conclusionNodeId,
          keptPremiseNodeId: keptRes.nodeId,
          discardedPremiseNodeId: discardedRes.nodeId,
          conclusionText: "",
        };
        ws = { ...ws, inferenceEdges: [...ws.inferenceEdges, edge] };

        const ndResult = applyNdStep(ws, edge, i);
        /* v8 ignore start — defensive: valid model answer never fails applyNdStep */
        if ("_tag" in ndResult) return ndResult;
        /* v8 ignore stop */
        ws = ndResult.workspace;
        stepNodeIds.push(conclusionNodeId);
        break;
      }
      /* v8 ignore stop */
      case "nd-efq": {
        const premiseRes = resolveNodeId(
          stepNodeIds,
          step.premiseIndex,
          "premise",
          i,
        );
        /* v8 ignore start — defensive: valid model answer never fails resolveNodeId */
        if (isError(premiseRes)) return premiseRes;
        /* v8 ignore stop */

        const conclusionNodeId = `node-${String(ws.nextNodeId) satisfies string}`;
        ws = addNode(ws, "axiom", "EFQ", { x: 0, y: 0 }, step.conclusionText);

        const edge: NdInferenceEdge = {
          _tag: "nd-efq",
          conclusionNodeId,
          premiseNodeId: premiseRes.nodeId,
          conclusionText: step.conclusionText,
        };
        ws = { ...ws, inferenceEdges: [...ws.inferenceEdges, edge] };

        const ndResult = applyNdStep(ws, edge, i);
        /* v8 ignore start — defensive: valid model answer never fails applyNdStep */
        if ("_tag" in ndResult) return ndResult;
        /* v8 ignore stop */
        ws = ndResult.workspace;
        stepNodeIds.push(conclusionNodeId);
        break;
      }
      case "nd-dne": {
        const premiseRes = resolveNodeId(
          stepNodeIds,
          step.premiseIndex,
          "premise",
          i,
        );
        /* v8 ignore start — defensive: valid model answer never fails resolveNodeId */
        if (isError(premiseRes)) return premiseRes;
        /* v8 ignore stop */

        const conclusionNodeId = `node-${String(ws.nextNodeId) satisfies string}`;
        ws = addNode(ws, "axiom", "DNE", { x: 0, y: 0 }, "");

        const edge: NdInferenceEdge = {
          _tag: "nd-dne",
          conclusionNodeId,
          premiseNodeId: premiseRes.nodeId,
          conclusionText: "",
        };
        ws = { ...ws, inferenceEdges: [...ws.inferenceEdges, edge] };

        const ndResult = applyNdStep(ws, edge, i);
        /* v8 ignore start — defensive: valid model answer never fails applyNdStep */
        if ("_tag" in ndResult) return ndResult;
        /* v8 ignore stop */
        ws = ndResult.workspace;
        stepNodeIds.push(conclusionNodeId);
        break;
      }
      case "nd-universal-intro": {
        const premiseRes = resolveNodeId(
          stepNodeIds,
          step.premiseIndex,
          "premise",
          i,
        );
        /* v8 ignore start — defensive: valid model answer never fails resolveNodeId */
        if (isError(premiseRes)) return premiseRes;
        /* v8 ignore stop */

        const conclusionNodeId = `node-${String(ws.nextNodeId) satisfies string}`;
        ws = addNode(ws, "axiom", "∀I", { x: 0, y: 0 }, "");

        const edge: NdInferenceEdge = {
          _tag: "nd-universal-intro",
          conclusionNodeId,
          premiseNodeId: premiseRes.nodeId,
          variableName: step.variableName,
          conclusionText: "",
        };
        ws = { ...ws, inferenceEdges: [...ws.inferenceEdges, edge] };

        const ndResult = applyNdStep(ws, edge, i);
        /* v8 ignore start — defensive: valid model answer never fails applyNdStep */
        if ("_tag" in ndResult) return ndResult;
        /* v8 ignore stop */
        ws = ndResult.workspace;
        stepNodeIds.push(conclusionNodeId);
        break;
      }
      case "nd-universal-elim": {
        const premiseRes = resolveNodeId(
          stepNodeIds,
          step.premiseIndex,
          "premise",
          i,
        );
        /* v8 ignore start — defensive: valid model answer never fails resolveNodeId */
        if (isError(premiseRes)) return premiseRes;
        /* v8 ignore stop */

        const conclusionNodeId = `node-${String(ws.nextNodeId) satisfies string}`;
        ws = addNode(ws, "axiom", "∀E", { x: 0, y: 0 }, "");

        const edge: NdInferenceEdge = {
          _tag: "nd-universal-elim",
          conclusionNodeId,
          premiseNodeId: premiseRes.nodeId,
          termText: step.termText,
          conclusionText: "",
        };
        ws = { ...ws, inferenceEdges: [...ws.inferenceEdges, edge] };

        const ndResult = applyNdStep(ws, edge, i);
        /* v8 ignore start — defensive: valid model answer never fails applyNdStep */
        if ("_tag" in ndResult) return ndResult;
        /* v8 ignore stop */
        ws = ndResult.workspace;
        stepNodeIds.push(conclusionNodeId);
        break;
      }
      case "nd-existential-intro": {
        const premiseRes = resolveNodeId(
          stepNodeIds,
          step.premiseIndex,
          "premise",
          i,
        );
        /* v8 ignore start — defensive: valid model answer never fails resolveNodeId */
        if (isError(premiseRes)) return premiseRes;
        /* v8 ignore stop */

        const conclusionNodeId = `node-${String(ws.nextNodeId) satisfies string}`;
        ws = addNode(ws, "axiom", "∃I", { x: 0, y: 0 }, "");

        const edge: NdInferenceEdge = {
          _tag: "nd-existential-intro",
          conclusionNodeId,
          premiseNodeId: premiseRes.nodeId,
          variableName: step.variableName,
          termText: step.termText,
          conclusionText: "",
        };
        ws = { ...ws, inferenceEdges: [...ws.inferenceEdges, edge] };

        const ndResult = applyNdStep(ws, edge, i);
        /* v8 ignore start — defensive: valid model answer never fails applyNdStep */
        if ("_tag" in ndResult) return ndResult;
        /* v8 ignore stop */
        ws = ndResult.workspace;
        stepNodeIds.push(conclusionNodeId);
        break;
      }
      case "nd-existential-elim": {
        const existRes = resolveNodeId(
          stepNodeIds,
          step.existentialIndex,
          "existential",
          i,
        );
        /* v8 ignore start — defensive: valid model answer never fails resolveNodeId */
        if (isError(existRes)) return existRes;
        /* v8 ignore stop */
        const caseRes = resolveNodeId(stepNodeIds, step.caseIndex, "case", i);
        /* v8 ignore start — defensive: valid model answer never fails resolveNodeId */
        if (isError(caseRes)) return caseRes;
        /* v8 ignore stop */

        const conclusionNodeId = `node-${String(ws.nextNodeId) satisfies string}`;
        ws = addNode(ws, "axiom", "∃E", { x: 0, y: 0 }, "");

        // 打ち消す仮定のformulaTextを取得
        const dischNodeId = stepNodeIds[step.dischargedIndex];
        /* v8 ignore start — defensive: correct model answers always have valid discharged node */
        const dischNode =
          dischNodeId !== undefined
            ? ws.nodes.find((n) => n.id === dischNodeId)
            : undefined;
        if (!dischNode) {
          return {
            _tag: "StepError",
            stepIndex: i,
            reason: "discharged node not found",
          };
        }
        /* v8 ignore stop */

        const assumptionId = step.dischargedIndex + 1;
        const edge: NdInferenceEdge = {
          _tag: "nd-existential-elim",
          conclusionNodeId,
          existentialPremiseNodeId: existRes.nodeId,
          casePremiseNodeId: caseRes.nodeId,
          dischargedAssumptionId: assumptionId,
          dischargedFormulaText: dischNode.formulaText,
          conclusionText: "",
        };
        ws = { ...ws, inferenceEdges: [...ws.inferenceEdges, edge] };

        const ndResult = applyNdStep(ws, edge, i);
        /* v8 ignore start — defensive: valid model answer never fails applyNdStep */
        if ("_tag" in ndResult) return ndResult;
        /* v8 ignore stop */
        ws = ndResult.workspace;
        stepNodeIds.push(conclusionNodeId);
        break;
      }
      // --- TAB（タブロー式シーケント計算）ステップ ---
      case "tab-root": {
        const nodeId = `node-${String(ws.nextNodeId) satisfies string}`;
        ws = addNode(ws, "axiom", "Root", { x: 0, y: 0 }, step.sequentText);
        stepNodeIds.push(nodeId);
        break;
      }
      case "tab-rule": {
        const conclusionRes = resolveNodeId(
          stepNodeIds,
          step.conclusionIndex,
          "conclusion",
          i,
        );
        if (isError(conclusionRes)) return conclusionRes;

        // 結論ノードのシーケントテキストを取得
        const conclusionNode = ws.nodes.find(
          (n) => n.id === conclusionRes.nodeId,
        );
        /* v8 ignore start — defensive: node always exists for valid model answer */
        if (!conclusionNode) {
          return {
            _tag: "StepError",
            stepIndex: i,
            reason: "conclusion node not found",
          };
        }
        /* v8 ignore stop */

        const tabParams: TabRuleApplicationParams = {
          ruleId: step.ruleId,
          sequentText: conclusionNode.formulaText,
          principalPosition: step.principalPosition,
          eigenVariable: step.eigenVariable,
          termText: step.termText,
          exchangePosition: step.exchangePosition,
        };

        const tabResult = applyTabRuleAndConnect(
          ws,
          conclusionRes.nodeId,
          tabParams,
          [
            { x: 0, y: 0 },
            { x: 0, y: 0 },
          ],
        );

        /* v8 ignore start — defensive: correct model answers never fail TAB validation */
        if (Either.isLeft(tabResult.validation)) {
          return {
            _tag: "StepError",
            stepIndex: i,
            reason: `TAB ${step.ruleId satisfies string} validation failed`,
          };
        }
        /* v8 ignore stop */

        ws = tabResult.workspace;

        // TAB規則の結果ノードIDをstepNodeIdsに追加
        // 0前提（公理）: 結論ノードIDを登録（この操作でタブローが閉じた）
        // 1前提: 前提ノードID を登録
        // 2前提（分岐）: 左前提ノードIDを登録し、右前提ノードIDも別途登録
        if (tabResult.premiseNodeIds.length === 0) {
          // 公理（BS, ⊥）: ステップとしては結論ノードを参照
          stepNodeIds.push(conclusionRes.nodeId);
        } else if (tabResult.premiseNodeIds.length === 1) {
          const premiseId = tabResult.premiseNodeIds[0];
          /* v8 ignore start — defensive: premiseNodeIds[0] exists when length === 1 */
          if (premiseId === undefined) {
            return {
              _tag: "StepError",
              stepIndex: i,
              reason: "TAB single premise node ID is undefined",
            };
          }
          /* v8 ignore stop */
          stepNodeIds.push(premiseId);
        } else {
          // 分岐: 左右のノードIDを連続して登録
          const leftId = tabResult.premiseNodeIds[0];
          const rightId = tabResult.premiseNodeIds[1];
          /* v8 ignore start — defensive: premiseNodeIds[0/1] exist when length >= 2 */
          if (leftId === undefined || rightId === undefined) {
            return {
              _tag: "StepError",
              stepIndex: i,
              reason: "TAB branching premise node IDs are undefined",
            };
          }
          /* v8 ignore stop */
          // 分岐規則は2つのノードを生成するので、2つのステップIDを消費する
          // 左を現在のステップ、右を次のステップとして登録
          stepNodeIds.push(leftId);
          stepNodeIds.push(rightId);
        }
        break;
      }
      // --- SC（シーケント計算）ステップ ---
      case "sc-root": {
        const nodeId = `node-${String(ws.nextNodeId) satisfies string}`;
        ws = addNode(ws, "axiom", "Root", { x: 0, y: 0 }, step.sequentText);
        stepNodeIds.push(nodeId);
        break;
      }
      case "sc-rule": {
        const conclusionRes = resolveNodeId(
          stepNodeIds,
          step.conclusionIndex,
          "conclusion",
          i,
        );
        if (isError(conclusionRes)) return conclusionRes;

        // 結論ノードのシーケントテキストを取得
        const conclusionNode = ws.nodes.find(
          (n) => n.id === conclusionRes.nodeId,
        );
        /* v8 ignore start — defensive: node always exists for valid model answer */
        if (!conclusionNode) {
          return {
            _tag: "StepError",
            stepIndex: i,
            reason: "SC conclusion node not found",
          };
        }
        /* v8 ignore stop */

        const scParams: ScRuleApplicationParams = {
          ruleId: step.ruleId,
          sequentText: conclusionNode.formulaText,
          principalPosition: step.principalPosition,
          eigenVariable: step.eigenVariable,
          termText: step.termText,
          exchangePosition: step.exchangePosition,
          componentIndex: step.componentIndex,
          cutFormulaText: step.cutFormulaText,
        };

        const scResult = applyScRuleAndConnect(
          ws,
          conclusionRes.nodeId,
          scParams,
          [
            { x: 0, y: 0 },
            { x: 0, y: 0 },
          ],
        );

        /* v8 ignore start — defensive: correct model answers never fail SC validation */
        if (Either.isLeft(scResult.validation)) {
          return {
            _tag: "StepError",
            stepIndex: i,
            reason: `SC ${step.ruleId satisfies string} validation failed`,
          };
        }
        /* v8 ignore stop */

        ws = scResult.workspace;

        // SC規則の結果ノードIDをstepNodeIdsに追加
        // 0前提（公理）: 結論ノードIDを登録（identityやbottom-left）
        // 1前提: 前提ノードID を登録
        // 2前提（分岐）: 左前提ノードIDを登録し、右前提ノードIDも別途登録
        if (scResult.premiseNodeIds.length === 0) {
          stepNodeIds.push(conclusionRes.nodeId);
        } else if (scResult.premiseNodeIds.length === 1) {
          const premiseId = scResult.premiseNodeIds[0];
          /* v8 ignore start — defensive: premiseNodeIds[0] exists when length === 1 */
          if (premiseId === undefined) {
            return {
              _tag: "StepError",
              stepIndex: i,
              reason: "SC single premise node ID is undefined",
            };
          }
          /* v8 ignore stop */
          stepNodeIds.push(premiseId);
        } else {
          const leftId = scResult.premiseNodeIds[0];
          const rightId = scResult.premiseNodeIds[1];
          /* v8 ignore start — defensive: premiseNodeIds[0/1] exist when length >= 2 */
          if (leftId === undefined || rightId === undefined) {
            return {
              _tag: "StepError",
              stepIndex: i,
              reason: "SC branching premise node IDs are undefined",
            };
          }
          /* v8 ignore stop */
          stepNodeIds.push(leftId);
          stepNodeIds.push(rightId);
        }
        break;
      }
      /* v8 ignore start — exhaustive check */
      default: {
        const _: never = step;
        return {
          _tag: "StepError",
          stepIndex: i,
          reason: `unknown step type: ${String((_ as { readonly _tag: string })._tag) satisfies string}`,
        };
      }
      /* v8 ignore stop */
    }
  }

  // 自動配置
  ws = applyTreeLayout(ws, "top-to-bottom");

  // ゴール達成チェック
  const goalCheck = checkQuestGoalsWithAxioms(
    ws.goals,
    ws.nodes,
    ws.inferenceEdges,
    ws.system,
  );

  return { _tag: "Ok", workspace: ws, goalCheck };
}

// --- バリデータ ---

/** バリデーション結果 */
export type ValidateModelAnswerResult =
  | { readonly _tag: "Valid" }
  | { readonly _tag: "BuildError"; readonly error: BuildModelAnswerResult }
  | {
      readonly _tag: "GoalNotAchieved";
      readonly goalCheck: QuestGoalCheckWithAxiomsResult;
    };

/**
 * 模範解答がクエストのゴールを正しく達成しているか検証する。
 * テスト用の純粋関数。
 *
 * AllAchieved, AllAchievedButAxiomViolation, AllAchievedButRuleViolation
 * のいずれも Valid として扱う。
 * 模範解答は公理インスタンスを直接記述するため、SubstitutionEdge を経由しない。
 * そのため hasInstanceRootNodes が true になるが、これは正常な挙動。
 */
export function validateModelAnswer(
  quest: QuestDefinition,
  answer: ModelAnswer,
): ValidateModelAnswerResult {
  const buildResult = buildModelAnswerWorkspace(quest, answer);

  if (buildResult._tag !== "Ok") {
    return { _tag: "BuildError", error: buildResult };
  }

  if (
    buildResult.goalCheck._tag !== "AllAchieved" &&
    buildResult.goalCheck._tag !== "AllAchievedButAxiomViolation" &&
    buildResult.goalCheck._tag !== "AllAchievedButRuleViolation"
  ) {
    return { _tag: "GoalNotAchieved", goalCheck: buildResult.goalCheck };
  }

  return { _tag: "Valid" };
}

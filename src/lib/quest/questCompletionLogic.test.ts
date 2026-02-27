import { describe, test, expect } from "vitest";
import {
  computeStepCount,
  checkQuestGoals,
  checkQuestGoalsWithAxioms,
  computeViolatingAxiomIds,
} from "./questCompletionLogic";
import type { WorkspaceNode } from "../proof-pad/workspaceState";
import type { InferenceEdge } from "../proof-pad/inferenceEdge";
import type { LogicSystem, AxiomId } from "../logic-core/inferenceRule";

// --- ヘルパー ---

function makeNode(
  overrides: Partial<WorkspaceNode> & { readonly kind: WorkspaceNode["kind"] },
): WorkspaceNode {
  return {
    id: "n1",
    label: "",
    formulaText: "",
    position: { x: 0, y: 0 },
    ...overrides,
  };
}

describe("computeStepCount", () => {
  test("空のノード配列は0を返す", () => {
    expect(computeStepCount([])).toBe(0);
  });

  test("axiomノードを1ステップとしてカウントする", () => {
    const nodes = [makeNode({ id: "n1", kind: "axiom" })];
    expect(computeStepCount(nodes)).toBe(1);
  });

  test("derivedノードを1ステップとしてカウントする", () => {
    const nodes = [makeNode({ id: "n1", kind: "derived" })];
    expect(computeStepCount(nodes)).toBe(1);
  });

  test("conclusionノードはカウントしない", () => {
    const nodes = [makeNode({ id: "n1", kind: "conclusion" })];
    expect(computeStepCount(nodes)).toBe(0);
  });

  test("quest-goalで保護されたノードはカウントしない", () => {
    const nodes = [
      makeNode({ id: "n1", kind: "axiom", protection: "quest-goal" }),
    ];
    expect(computeStepCount(nodes)).toBe(0);
  });

  test("混合ノードのステップ数を正しく計算する", () => {
    const nodes = [
      makeNode({ id: "n1", kind: "axiom" }),
      makeNode({ id: "n2", kind: "axiom" }),
      makeNode({ id: "n3", kind: "derived" }),
      makeNode({ id: "n4", kind: "derived" }),
      makeNode({ id: "n5", kind: "conclusion" }),
      makeNode({ id: "n6", kind: "axiom", protection: "quest-goal" }),
    ];
    // axiom(2) + derived(2) = 4。conclusionとquest-goalは除外
    expect(computeStepCount(nodes)).toBe(4);
  });

  test("ゴールノード(quest-goal)のみの場合は0を返す", () => {
    const nodes = [
      makeNode({ id: "n1", kind: "axiom", protection: "quest-goal" }),
      makeNode({ id: "n2", kind: "axiom", protection: "quest-goal" }),
    ];
    expect(computeStepCount(nodes)).toBe(0);
  });

  test("role=goalのノードはカウントしない", () => {
    const nodes = [makeNode({ id: "n1", kind: "axiom", role: "goal" })];
    expect(computeStepCount(nodes)).toBe(0);
  });

  test("role=goalとquest-goalの両方が混在しても正しくカウントする", () => {
    const nodes = [
      makeNode({ id: "n1", kind: "axiom" }),
      makeNode({ id: "n2", kind: "axiom", role: "goal" }),
      makeNode({ id: "n3", kind: "axiom", protection: "quest-goal" }),
      makeNode({ id: "n4", kind: "derived" }),
    ];
    // axiom(n1) + derived(n4) = 2。role=goalとquest-goalは除外
    expect(computeStepCount(nodes)).toBe(2);
  });
});

describe("checkQuestGoals", () => {
  test("ゴールノードがない場合はNoGoalsを返す", () => {
    const nodes = [makeNode({ id: "n1", kind: "axiom", formulaText: "phi" })];
    expect(checkQuestGoals(nodes)).toEqual({ _tag: "NoGoals" });
  });

  test("空のノード配列はNoGoalsを返す", () => {
    expect(checkQuestGoals([])).toEqual({ _tag: "NoGoals" });
  });

  test("ゴールが未達成の場合はNotAllAchievedを返す", () => {
    const nodes = [
      makeNode({
        id: "g1",
        kind: "axiom",
        formulaText: "phi -> phi",
        protection: "quest-goal",
      }),
      makeNode({
        id: "n1",
        kind: "axiom",
        formulaText: "phi -> (psi -> phi)",
      }),
    ];
    const result = checkQuestGoals(nodes);
    expect(result._tag).toBe("NotAllAchieved");
    if (result._tag === "NotAllAchieved") {
      expect(result.achievedCount).toBe(0);
      expect(result.totalCount).toBe(1);
    }
  });

  test("ゴールが達成された場合はAllAchievedを返す", () => {
    const nodes = [
      makeNode({
        id: "g1",
        kind: "axiom",
        formulaText: "phi -> phi",
        protection: "quest-goal",
      }),
      makeNode({
        id: "n1",
        kind: "axiom",
        formulaText: "phi -> (psi -> phi)",
      }),
      makeNode({
        id: "n2",
        kind: "derived",
        formulaText: "phi -> phi",
      }),
    ];
    const result = checkQuestGoals(nodes);
    expect(result._tag).toBe("AllAchieved");
    if (result._tag === "AllAchieved") {
      // axiom(1) + mp(1) = 2ステップ（ゴールノードは除外）
      expect(result.stepCount).toBe(2);
    }
  });

  test("複数ゴールのうち一部のみ達成の場合はNotAllAchievedを返す", () => {
    const nodes = [
      makeNode({
        id: "g1",
        kind: "axiom",
        formulaText: "phi -> phi",
        protection: "quest-goal",
      }),
      makeNode({
        id: "g2",
        kind: "axiom",
        formulaText: "psi -> psi",
        protection: "quest-goal",
      }),
      makeNode({
        id: "n1",
        kind: "derived",
        formulaText: "phi -> phi",
      }),
    ];
    const result = checkQuestGoals(nodes);
    expect(result._tag).toBe("NotAllAchieved");
    if (result._tag === "NotAllAchieved") {
      expect(result.achievedCount).toBe(1);
      expect(result.totalCount).toBe(2);
    }
  });

  test("複数ゴールすべて達成の場合はAllAchievedを返す", () => {
    const nodes = [
      makeNode({
        id: "g1",
        kind: "axiom",
        formulaText: "phi -> phi",
        protection: "quest-goal",
      }),
      makeNode({
        id: "g2",
        kind: "axiom",
        formulaText: "psi -> psi",
        protection: "quest-goal",
      }),
      makeNode({
        id: "n1",
        kind: "derived",
        formulaText: "phi -> phi",
      }),
      makeNode({
        id: "n2",
        kind: "axiom",
        formulaText: "psi -> psi",
      }),
    ];
    const result = checkQuestGoals(nodes);
    expect(result._tag).toBe("AllAchieved");
    if (result._tag === "AllAchieved") {
      expect(result.stepCount).toBe(2);
    }
  });

  test("ゴールのformulaTextが空の場合はスキップする", () => {
    const nodes = [
      makeNode({
        id: "g1",
        kind: "axiom",
        formulaText: "",
        protection: "quest-goal",
      }),
      makeNode({
        id: "n1",
        kind: "axiom",
        formulaText: "phi",
      }),
    ];
    // 空のゴールはパース失敗→スキップされるので、ゴール0/1で未達成扱い
    const result = checkQuestGoals(nodes);
    // パース失敗のゴールはcontinueされ、achievedCountは増えないがtotalCountは1
    expect(result._tag).toBe("NotAllAchieved");
  });

  test("ゴールのformulaTextがパース不能な場合はスキップする", () => {
    const nodes = [
      makeNode({
        id: "g1",
        kind: "axiom",
        formulaText: ">>>invalid<<<",
        protection: "quest-goal",
      }),
      makeNode({
        id: "n1",
        kind: "axiom",
        formulaText: "phi",
      }),
    ];
    const result = checkQuestGoals(nodes);
    expect(result._tag).toBe("NotAllAchieved");
  });

  test("ワークノードのformulaTextがパース不能でもエラーにならない", () => {
    const nodes = [
      makeNode({
        id: "g1",
        kind: "axiom",
        formulaText: "phi",
        protection: "quest-goal",
      }),
      makeNode({
        id: "n1",
        kind: "axiom",
        formulaText: ">>>invalid<<<",
      }),
    ];
    const result = checkQuestGoals(nodes);
    expect(result._tag).toBe("NotAllAchieved");
    if (result._tag === "NotAllAchieved") {
      expect(result.achievedCount).toBe(0);
      expect(result.totalCount).toBe(1);
    }
  });
});

// --- computeViolatingAxiomIds ---

describe("computeViolatingAxiomIds", () => {
  test("allowedAxiomIdsがundefinedなら空集合を返す", () => {
    const used: ReadonlySet<AxiomId> = new Set(["A1", "A2"]);
    const result = computeViolatingAxiomIds(used, undefined);
    expect(result).toEqual(new Set());
  });

  test("使用公理がすべて許可されていれば空集合を返す", () => {
    const used: ReadonlySet<AxiomId> = new Set(["A1", "A2"]);
    const result = computeViolatingAxiomIds(used, ["A1", "A2", "A3"]);
    expect(result).toEqual(new Set());
  });

  test("許可されていない公理を返す", () => {
    const used: ReadonlySet<AxiomId> = new Set(["A1", "A2", "A3"]);
    const result = computeViolatingAxiomIds(used, ["A1", "A2"]);
    expect(result).toEqual(new Set(["A3"]));
  });

  test("使用公理が空なら空集合を返す", () => {
    const used: ReadonlySet<AxiomId> = new Set();
    const result = computeViolatingAxiomIds(used, ["A1"]);
    expect(result).toEqual(new Set());
  });

  test("許可が空リストならすべて違反", () => {
    const used: ReadonlySet<AxiomId> = new Set(["A1", "A2"]);
    const result = computeViolatingAxiomIds(used, []);
    expect(result).toEqual(new Set(["A1", "A2"]));
  });
});

// --- checkQuestGoalsWithAxioms ---

describe("checkQuestGoalsWithAxioms", () => {
  const lukasiewiczSystem: LogicSystem = {
    name: "Łukasiewicz",
    propositionalAxioms: new Set(["A1", "A2", "A3"]),
    predicateLogic: false,
    equalityLogic: false,
    generalization: false,
  };

  function makeMPEdge(
    conclusionNodeId: string,
    leftPremiseNodeId: string,
    rightPremiseNodeId: string,
  ): InferenceEdge {
    return {
      _tag: "mp",
      conclusionNodeId,
      leftPremiseNodeId,
      rightPremiseNodeId,
      conclusionText: "",
    };
  }

  test("ゴールノードがない場合はNoGoalsを返す", () => {
    const result = checkQuestGoalsWithAxioms([], [], lukasiewiczSystem);
    expect(result._tag).toBe("NoGoals");
  });

  test("ゴール達成・公理制限なしでAllAchievedを返す", () => {
    const nodes = [
      makeNode({
        id: "g1",
        kind: "axiom",
        formulaText: "phi -> (psi -> phi)",
        protection: "quest-goal",
      }),
      makeNode({
        id: "a1",
        kind: "axiom",
        formulaText: "phi -> (psi -> phi)",
      }),
    ];
    const result = checkQuestGoalsWithAxioms(nodes, [], lukasiewiczSystem);
    expect(result._tag).toBe("AllAchieved");
    if (result._tag === "AllAchieved") {
      expect(result.goalResults).toHaveLength(1);
      expect(result.goalResults[0]?.usedAxiomIds).toEqual(new Set(["A1"]));
      expect(result.goalResults[0]?.violatingAxiomIds).toEqual(new Set());
    }
  });

  test("ゴール達成・公理制限内でAllAchievedを返す", () => {
    const nodes = [
      makeNode({
        id: "g1",
        kind: "axiom",
        formulaText: "phi -> (psi -> phi)",
        protection: "quest-goal",
        allowedAxiomIds: ["A1", "A2"],
      }),
      makeNode({
        id: "a1",
        kind: "axiom",
        formulaText: "phi -> (psi -> phi)",
      }),
    ];
    const result = checkQuestGoalsWithAxioms(nodes, [], lukasiewiczSystem);
    expect(result._tag).toBe("AllAchieved");
  });

  test("ゴール達成・公理制限違反でAllAchievedButAxiomViolationを返す", () => {
    const nodes = [
      makeNode({
        id: "g1",
        kind: "axiom",
        formulaText: "phi -> (psi -> phi)",
        protection: "quest-goal",
        allowedAxiomIds: ["A2", "A3"],
      }),
      makeNode({
        id: "a1",
        kind: "axiom",
        formulaText: "phi -> (psi -> phi)",
      }),
    ];
    const result = checkQuestGoalsWithAxioms(nodes, [], lukasiewiczSystem);
    expect(result._tag).toBe("AllAchievedButAxiomViolation");
    if (result._tag === "AllAchievedButAxiomViolation") {
      expect(result.goalResults[0]?.violatingAxiomIds).toEqual(new Set(["A1"]));
    }
  });

  test("ゴール未達成の場合はNotAllAchievedを返す", () => {
    const nodes = [
      makeNode({
        id: "g1",
        kind: "axiom",
        formulaText: "phi -> phi",
        protection: "quest-goal",
      }),
    ];
    const result = checkQuestGoalsWithAxioms(nodes, [], lukasiewiczSystem);
    expect(result._tag).toBe("NotAllAchieved");
    if (result._tag === "NotAllAchieved") {
      expect(result.achievedCount).toBe(0);
      expect(result.totalCount).toBe(1);
    }
  });

  test("MP導出ノードが複数公理に依存する場合も正しくチェックする", () => {
    // ゴール: psi -> phi  (A3の結論部分と一致するような式)
    // a1 (A1インスタンス) + a3 (A3インスタンス) → mp1 (psi -> phi)
    // ゴールは A1 のみ許可 → A3 が制限違反
    const nodes = [
      makeNode({
        id: "g1",
        kind: "axiom",
        formulaText: "psi -> phi",
        protection: "quest-goal",
        allowedAxiomIds: ["A1"],
      }),
      makeNode({
        id: "a1",
        kind: "axiom",
        formulaText: "phi -> (psi -> phi)",
      }),
      makeNode({
        id: "a3",
        kind: "axiom",
        formulaText: "(~phi -> ~psi) -> (psi -> phi)",
      }),
      makeNode({
        id: "mp1",
        kind: "derived",
        formulaText: "psi -> phi",
      }),
    ];
    const inferenceEdges = [makeMPEdge("mp1", "a1", "a3")];
    const result = checkQuestGoalsWithAxioms(
      nodes,
      inferenceEdges,
      lukasiewiczSystem,
    );
    expect(result._tag).toBe("AllAchievedButAxiomViolation");
    if (result._tag === "AllAchievedButAxiomViolation") {
      expect(result.goalResults[0]?.usedAxiomIds).toEqual(
        new Set(["A1", "A3"]),
      );
      expect(result.goalResults[0]?.violatingAxiomIds).toEqual(new Set(["A3"]));
    }
  });

  test("パース不能なゴールはmatchingNodeId: undefinedで結果に含まれる", () => {
    const nodes = [
      makeNode({
        id: "g1",
        kind: "axiom",
        formulaText: ">>>invalid<<<",
        protection: "quest-goal",
      }),
    ];
    const result = checkQuestGoalsWithAxioms(nodes, [], lukasiewiczSystem);
    expect(result._tag).toBe("NotAllAchieved");
    if (result._tag === "NotAllAchieved") {
      expect(result.goalResults[0]?.matchingNodeId).toBeUndefined();
    }
  });
});

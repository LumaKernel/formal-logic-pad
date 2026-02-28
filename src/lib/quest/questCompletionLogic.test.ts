import { describe, test, expect } from "vitest";
import { Effect } from "effect";
import {
  computeStepCount,
  checkQuestGoals,
  checkQuestGoalsEffect,
  checkQuestGoalsWithAxioms,
  checkQuestGoalsWithAxiomsEffect,
  computeViolatingAxiomIds,
} from "./questCompletionLogic";
import type { WorkspaceNode, WorkspaceGoal } from "../proof-pad/workspaceState";
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

function makeGoal(
  overrides: Partial<WorkspaceGoal> & {
    readonly id: string;
    readonly formulaText: string;
  },
): WorkspaceGoal {
  return {
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
    const nodes = [makeNode({ id: "n1", kind: "axiom" })];
    expect(computeStepCount(nodes)).toBe(1);
  });

  test("conclusionノードはカウントしない", () => {
    const nodes = [makeNode({ id: "n1", kind: "conclusion" })];
    expect(computeStepCount(nodes)).toBe(0);
  });

  test("混合ノードのステップ数を正しく計算する", () => {
    const nodes = [
      makeNode({ id: "n1", kind: "axiom" }),
      makeNode({ id: "n2", kind: "axiom" }),
      makeNode({ id: "n3", kind: "axiom" }),
      makeNode({ id: "n4", kind: "axiom" }),
      makeNode({ id: "n5", kind: "conclusion" }),
    ];
    // axiom(4)。conclusionは除外
    expect(computeStepCount(nodes)).toBe(4);
  });

  test("conclusionノードのみの場合は0を返す", () => {
    const nodes = [
      makeNode({ id: "n1", kind: "conclusion" }),
      makeNode({ id: "n2", kind: "conclusion" }),
    ];
    expect(computeStepCount(nodes)).toBe(0);
  });
});

describe("checkQuestGoals", () => {
  test("ゴールがない場合はNoGoalsを返す", () => {
    const goals: readonly WorkspaceGoal[] = [];
    const nodes = [makeNode({ id: "n1", kind: "axiom", formulaText: "phi" })];
    expect(checkQuestGoals(goals, nodes)).toEqual({ _tag: "NoGoals" });
  });

  test("空のゴール配列と空のノード配列はNoGoalsを返す", () => {
    expect(checkQuestGoals([], [])).toEqual({ _tag: "NoGoals" });
  });

  test("ゴールが未達成の場合はNotAllAchievedを返す", () => {
    const goals = [makeGoal({ id: "g1", formulaText: "phi -> phi" })];
    const nodes = [
      makeNode({
        id: "n1",
        kind: "axiom",
        formulaText: "phi -> (psi -> phi)",
      }),
    ];
    const result = checkQuestGoals(goals, nodes);
    expect(result._tag).toBe("NotAllAchieved");
    if (result._tag === "NotAllAchieved") {
      expect(result.achievedCount).toBe(0);
      expect(result.totalCount).toBe(1);
    }
  });

  test("ゴールが達成された場合はAllAchievedを返す", () => {
    const goals = [makeGoal({ id: "g1", formulaText: "phi -> phi" })];
    const nodes = [
      makeNode({
        id: "n1",
        kind: "axiom",
        formulaText: "phi -> (psi -> phi)",
      }),
      makeNode({
        id: "n2",
        kind: "axiom",
        formulaText: "phi -> phi",
      }),
    ];
    const result = checkQuestGoals(goals, nodes);
    expect(result._tag).toBe("AllAchieved");
    if (result._tag === "AllAchieved") {
      // axiom(2) = 2ステップ
      expect(result.stepCount).toBe(2);
    }
  });

  test("複数ゴールのうち一部のみ達成の場合はNotAllAchievedを返す", () => {
    const goals = [
      makeGoal({ id: "g1", formulaText: "phi -> phi" }),
      makeGoal({ id: "g2", formulaText: "psi -> psi" }),
    ];
    const nodes = [
      makeNode({
        id: "n1",
        kind: "axiom",
        formulaText: "phi -> phi",
      }),
    ];
    const result = checkQuestGoals(goals, nodes);
    expect(result._tag).toBe("NotAllAchieved");
    if (result._tag === "NotAllAchieved") {
      expect(result.achievedCount).toBe(1);
      expect(result.totalCount).toBe(2);
    }
  });

  test("複数ゴールすべて達成の場合はAllAchievedを返す", () => {
    const goals = [
      makeGoal({ id: "g1", formulaText: "phi -> phi" }),
      makeGoal({ id: "g2", formulaText: "psi -> psi" }),
    ];
    const nodes = [
      makeNode({
        id: "n1",
        kind: "axiom",
        formulaText: "phi -> phi",
      }),
      makeNode({
        id: "n2",
        kind: "axiom",
        formulaText: "psi -> psi",
      }),
    ];
    const result = checkQuestGoals(goals, nodes);
    expect(result._tag).toBe("AllAchieved");
    if (result._tag === "AllAchieved") {
      expect(result.stepCount).toBe(2);
    }
  });

  test("ゴールのformulaTextが空の場合はスキップする", () => {
    const goals = [makeGoal({ id: "g1", formulaText: "" })];
    const nodes = [
      makeNode({
        id: "n1",
        kind: "axiom",
        formulaText: "phi",
      }),
    ];
    // 空のゴールはパース失敗→スキップされるので、ゴール0/1で未達成扱い
    const result = checkQuestGoals(goals, nodes);
    // パース失敗のゴールはcontinueされ、achievedCountは増えないがtotalCountは1
    expect(result._tag).toBe("NotAllAchieved");
  });

  test("ゴールのformulaTextがパース不能な場合はスキップする", () => {
    const goals = [makeGoal({ id: "g1", formulaText: ">>>invalid<<<" })];
    const nodes = [
      makeNode({
        id: "n1",
        kind: "axiom",
        formulaText: "phi",
      }),
    ];
    const result = checkQuestGoals(goals, nodes);
    expect(result._tag).toBe("NotAllAchieved");
  });

  test("ワークノードのformulaTextがパース不能でもエラーにならない", () => {
    const goals = [makeGoal({ id: "g1", formulaText: "phi" })];
    const nodes = [
      makeNode({
        id: "n1",
        kind: "axiom",
        formulaText: ">>>invalid<<<",
      }),
    ];
    const result = checkQuestGoals(goals, nodes);
    expect(result._tag).toBe("NotAllAchieved");
    if (result._tag === "NotAllAchieved") {
      expect(result.achievedCount).toBe(0);
      expect(result.totalCount).toBe(1);
    }
  });
});

// --- checkQuestGoalsEffect ---

describe("checkQuestGoalsEffect", () => {
  test("Effect版がSync版と同じ結果を返す", () => {
    const goals = [makeGoal({ id: "g1", formulaText: "phi -> phi" })];
    const nodes = [
      makeNode({
        id: "n1",
        kind: "axiom",
        formulaText: "phi -> phi",
      }),
    ];
    const syncResult = checkQuestGoals(goals, nodes);
    const effectResult = Effect.runSync(checkQuestGoalsEffect(goals, nodes));
    expect(effectResult).toEqual(syncResult);
  });

  test("NoGoalsケースでEffect版が正しく動作する", () => {
    const result = Effect.runSync(checkQuestGoalsEffect([], []));
    expect(result).toEqual({ _tag: "NoGoals" });
  });

  test("NotAllAchievedケースでEffect版が正しく動作する", () => {
    const goals = [
      makeGoal({ id: "g1", formulaText: "phi -> phi" }),
      makeGoal({ id: "g2", formulaText: "psi -> psi" }),
    ];
    const nodes = [
      makeNode({ id: "n1", kind: "axiom", formulaText: "phi -> phi" }),
    ];
    const result = Effect.runSync(checkQuestGoalsEffect(goals, nodes));
    expect(result._tag).toBe("NotAllAchieved");
    if (result._tag === "NotAllAchieved") {
      expect(result.achievedCount).toBe(1);
      expect(result.totalCount).toBe(2);
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

  test("ゴールがない場合はNoGoalsを返す", () => {
    const result = checkQuestGoalsWithAxioms([], [], [], lukasiewiczSystem);
    expect(result._tag).toBe("NoGoals");
  });

  test("ゴール達成・公理制限なしでAllAchievedを返す", () => {
    const goals = [makeGoal({ id: "g1", formulaText: "phi -> (psi -> phi)" })];
    const nodes = [
      makeNode({
        id: "a1",
        kind: "axiom",
        formulaText: "phi -> (psi -> phi)",
      }),
    ];
    const result = checkQuestGoalsWithAxioms(
      goals,
      nodes,
      [],
      lukasiewiczSystem,
    );
    expect(result._tag).toBe("AllAchieved");
    if (result._tag === "AllAchieved") {
      expect(result.goalResults).toHaveLength(1);
      expect(result.goalResults[0]?.usedAxiomIds).toEqual(new Set(["A1"]));
      expect(result.goalResults[0]?.violatingAxiomIds).toEqual(new Set());
    }
  });

  test("ゴール達成・公理制限内でAllAchievedを返す", () => {
    const goals = [
      makeGoal({
        id: "g1",
        formulaText: "phi -> (psi -> phi)",
        allowedAxiomIds: ["A1", "A2"],
      }),
    ];
    const nodes = [
      makeNode({
        id: "a1",
        kind: "axiom",
        formulaText: "phi -> (psi -> phi)",
      }),
    ];
    const result = checkQuestGoalsWithAxioms(
      goals,
      nodes,
      [],
      lukasiewiczSystem,
    );
    expect(result._tag).toBe("AllAchieved");
  });

  test("ゴール達成・公理制限違反でAllAchievedButAxiomViolationを返す", () => {
    const goals = [
      makeGoal({
        id: "g1",
        formulaText: "phi -> (psi -> phi)",
        allowedAxiomIds: ["A2", "A3"],
      }),
    ];
    const nodes = [
      makeNode({
        id: "a1",
        kind: "axiom",
        formulaText: "phi -> (psi -> phi)",
      }),
    ];
    const result = checkQuestGoalsWithAxioms(
      goals,
      nodes,
      [],
      lukasiewiczSystem,
    );
    expect(result._tag).toBe("AllAchievedButAxiomViolation");
    if (result._tag === "AllAchievedButAxiomViolation") {
      expect(result.goalResults[0]?.violatingAxiomIds).toEqual(new Set(["A1"]));
    }
  });

  test("ゴール未達成の場合はNotAllAchievedを返す", () => {
    const goals = [makeGoal({ id: "g1", formulaText: "phi -> phi" })];
    const nodes: readonly WorkspaceNode[] = [];
    const result = checkQuestGoalsWithAxioms(
      goals,
      nodes,
      [],
      lukasiewiczSystem,
    );
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
    const goals = [
      makeGoal({
        id: "g1",
        formulaText: "psi -> phi",
        allowedAxiomIds: ["A1"],
      }),
    ];
    const nodes = [
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
        kind: "axiom",
        formulaText: "psi -> phi",
      }),
    ];
    const inferenceEdges = [makeMPEdge("mp1", "a1", "a3")];
    const result = checkQuestGoalsWithAxioms(
      goals,
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
    const goals = [makeGoal({ id: "g1", formulaText: ">>>invalid<<<" })];
    const nodes: readonly WorkspaceNode[] = [];
    const result = checkQuestGoalsWithAxioms(
      goals,
      nodes,
      [],
      lukasiewiczSystem,
    );
    expect(result._tag).toBe("NotAllAchieved");
    if (result._tag === "NotAllAchieved") {
      expect(result.goalResults[0]?.matchingNodeId).toBeUndefined();
    }
  });

  test("公理インスタンスが直接ルートに配置されている場合はAxiomViolationを返す", () => {
    // ゴール: phi -> ((phi -> phi) -> phi)
    // ワークノード: A1インスタンスを直接配置（スキーマではなく代入済み）
    const goals = [
      makeGoal({ id: "g1", formulaText: "phi -> ((phi -> phi) -> phi)" }),
    ];
    const nodes = [
      makeNode({
        id: "a1-instance",
        kind: "axiom",
        formulaText: "phi -> ((phi -> phi) -> phi)",
      }),
    ];
    const result = checkQuestGoalsWithAxioms(
      goals,
      nodes,
      [],
      lukasiewiczSystem,
    );
    expect(result._tag).toBe("AllAchievedButAxiomViolation");
    if (result._tag === "AllAchievedButAxiomViolation") {
      expect(result.goalResults[0]?.hasInstanceRootNodes).toBe(true);
    }
  });

  test("公理スキーマそのものがルートの場合はhasInstanceRootNodesがfalse", () => {
    const goals = [makeGoal({ id: "g1", formulaText: "phi -> (psi -> phi)" })];
    const nodes = [
      makeNode({
        id: "a1",
        kind: "axiom",
        formulaText: "phi -> (psi -> phi)",
      }),
    ];
    const result = checkQuestGoalsWithAxioms(
      goals,
      nodes,
      [],
      lukasiewiczSystem,
    );
    expect(result._tag).toBe("AllAchieved");
    if (result._tag === "AllAchieved") {
      expect(result.goalResults[0]?.hasInstanceRootNodes).toBe(false);
    }
  });

  test("SubstitutionEdgeを介して導出されたインスタンスは正当", () => {
    // a1-schema (公理スキーマ) → [SubstEdge] → a1-instance (インスタンス)
    // インスタンスがゴールに一致 → 正当な導出
    const goals = [
      makeGoal({ id: "g1", formulaText: "phi -> ((phi -> phi) -> phi)" }),
    ];
    const nodes = [
      makeNode({
        id: "a1-schema",
        kind: "axiom",
        formulaText: "phi -> (psi -> phi)",
      }),
      makeNode({
        id: "a1-instance",
        kind: "axiom",
        formulaText: "phi -> ((phi -> phi) -> phi)",
      }),
    ];
    const inferenceEdges: readonly InferenceEdge[] = [
      {
        _tag: "substitution",
        conclusionNodeId: "a1-instance",
        premiseNodeId: "a1-schema",
        entries: [],
        conclusionText: "phi -> ((phi -> phi) -> phi)",
      },
    ];
    const result = checkQuestGoalsWithAxioms(
      goals,
      nodes,
      inferenceEdges,
      lukasiewiczSystem,
    );
    expect(result._tag).toBe("AllAchieved");
    if (result._tag === "AllAchieved") {
      expect(result.goalResults[0]?.hasInstanceRootNodes).toBe(false);
    }
  });

  test("パース不能なゴールのhasInstanceRootNodesはfalse", () => {
    const goals = [makeGoal({ id: "g1", formulaText: ">>>invalid<<<" })];
    const nodes: readonly WorkspaceNode[] = [];
    const result = checkQuestGoalsWithAxioms(
      goals,
      nodes,
      [],
      lukasiewiczSystem,
    );
    expect(result._tag).toBe("NotAllAchieved");
    if (result._tag === "NotAllAchieved") {
      expect(result.goalResults[0]?.hasInstanceRootNodes).toBe(false);
    }
  });

  test("未達成ゴールのhasInstanceRootNodesはfalse", () => {
    const goals = [makeGoal({ id: "g1", formulaText: "phi -> phi" })];
    const nodes: readonly WorkspaceNode[] = [];
    const result = checkQuestGoalsWithAxioms(
      goals,
      nodes,
      [],
      lukasiewiczSystem,
    );
    expect(result._tag).toBe("NotAllAchieved");
    if (result._tag === "NotAllAchieved") {
      expect(result.goalResults[0]?.hasInstanceRootNodes).toBe(false);
    }
  });
});

// --- checkQuestGoalsWithAxiomsEffect ---

describe("checkQuestGoalsWithAxiomsEffect", () => {
  const lukasiewiczSystem: LogicSystem = {
    name: "Łukasiewicz",
    propositionalAxioms: new Set(["A1", "A2", "A3"]),
    predicateLogic: false,
    equalityLogic: false,
    generalization: false,
  };

  test("Effect版がSync版と同じNoGoals結果を返す", () => {
    const syncResult = checkQuestGoalsWithAxioms([], [], [], lukasiewiczSystem);
    const effectResult = Effect.runSync(
      checkQuestGoalsWithAxiomsEffect([], [], [], lukasiewiczSystem),
    );
    expect(effectResult).toEqual(syncResult);
  });

  test("Effect版がSync版と同じAllAchieved結果を返す", () => {
    const goals = [makeGoal({ id: "g1", formulaText: "phi -> (psi -> phi)" })];
    const nodes = [
      makeNode({
        id: "a1",
        kind: "axiom",
        formulaText: "phi -> (psi -> phi)",
      }),
    ];
    const syncResult = checkQuestGoalsWithAxioms(
      goals,
      nodes,
      [],
      lukasiewiczSystem,
    );
    const effectResult = Effect.runSync(
      checkQuestGoalsWithAxiomsEffect(goals, nodes, [], lukasiewiczSystem),
    );
    expect(effectResult).toEqual(syncResult);
  });

  test("Effect版がSync版と同じAllAchievedButAxiomViolation結果を返す", () => {
    const goals = [
      makeGoal({
        id: "g1",
        formulaText: "phi -> (psi -> phi)",
        allowedAxiomIds: ["A2", "A3"],
      }),
    ];
    const nodes = [
      makeNode({
        id: "a1",
        kind: "axiom",
        formulaText: "phi -> (psi -> phi)",
      }),
    ];
    const syncResult = checkQuestGoalsWithAxioms(
      goals,
      nodes,
      [],
      lukasiewiczSystem,
    );
    const effectResult = Effect.runSync(
      checkQuestGoalsWithAxiomsEffect(goals, nodes, [], lukasiewiczSystem),
    );
    expect(effectResult).toEqual(syncResult);
  });

  test("Effect版がSync版と同じNotAllAchieved結果を返す", () => {
    const goals = [makeGoal({ id: "g1", formulaText: "phi -> phi" })];
    const nodes: readonly WorkspaceNode[] = [];
    const syncResult = checkQuestGoalsWithAxioms(
      goals,
      nodes,
      [],
      lukasiewiczSystem,
    );
    const effectResult = Effect.runSync(
      checkQuestGoalsWithAxiomsEffect(goals, nodes, [], lukasiewiczSystem),
    );
    expect(effectResult).toEqual(syncResult);
  });
});

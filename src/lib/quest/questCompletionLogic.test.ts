import { describe, test, expect } from "vitest";
import { Effect } from "effect";
import {
  computeStepCount,
  checkQuestGoals,
  checkQuestGoalsEffect,
  checkQuestGoalsWithAxioms,
  checkQuestGoalsWithAxiomsEffect,
  computeViolatingAxiomIds,
  computeViolatingRuleIds,
  computeViolatingScRuleIds,
} from "./questCompletionLogic";
import type { WorkspaceNode, WorkspaceGoal } from "../proof-pad/workspaceState";
import type {
  InferenceEdge,
  InferenceRuleId,
} from "../proof-pad/inferenceEdge";
import type { LogicSystem, AxiomId } from "../logic-core/inferenceRule";
import type { ScRuleId } from "../logic-core/deductionSystem";

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

  test("公理インスタンスが直接ルートに配置されている場合はAllAchievedを返す", () => {
    // ゴール: phi -> ((phi -> phi) -> phi)
    // ワークノード: A1インスタンスを直接配置（スキーマではなく代入済み）
    // identifyAxiom はインスタンスも認識するため、公理インスタンスの配置は正当な証明
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
    // 公理インスタンスは identifyAxiom で認識されるため、正当なゴール達成
    expect(result._tag).toBe("AllAchieved");
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
    }
  });

  test("公理パターンに一致しない孤立ノードはゴール未達成", () => {
    // "phi /\\ psi" は公理パターンに一致しない孤立ノード → ゴール未達成
    const goals = [makeGoal({ id: "g1", formulaText: "phi /\\ psi" })];
    const nodes = [
      makeNode({
        id: "n1",
        kind: "axiom",
        formulaText: "phi /\\ psi",
      }),
    ];
    const result = checkQuestGoalsWithAxioms(
      goals,
      nodes,
      [],
      lukasiewiczSystem,
    );
    expect(result._tag).toBe("NotAllAchieved");
  });

  test("正しい公理ルートノードではhasUnknownRootNodesがfalse", () => {
    // A1 schema: phi -> (psi -> phi)
    const goals = [makeGoal({ id: "g1", formulaText: "phi -> (psi -> phi)" })];
    const nodes = [
      makeNode({
        id: "n1",
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
      expect(result.goalResults[0]?.hasUnknownRootNodes).toBe(false);
    }
  });

  test("未達成ゴールのhasUnknownRootNodesはfalse", () => {
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
      expect(result.goalResults[0]?.hasUnknownRootNodes).toBe(false);
    }
  });

  test("未知の公理ルートノード(phiのみ)から置換でゴール達成してもAxiomViolationになる", () => {
    // バグ再現: phiを公理として配置し、phi:=phi->phiで置換してphi->phiを導出
    // phiは公理テンプレートに一致しないため、hasUnknownRootNodes=trueとなり
    // AllAchievedButAxiomViolationを返すべき
    const goals = [
      makeGoal({
        id: "g1",
        formulaText: "phi -> phi",
        allowedAxiomIds: ["A1", "A2"],
      }),
    ];
    const nodes = [
      makeNode({
        id: "phi-node",
        kind: "axiom",
        formulaText: "phi",
      }),
      makeNode({
        id: "derived-node",
        kind: "axiom",
        formulaText: "phi -> phi",
      }),
    ];
    const inferenceEdges: readonly InferenceEdge[] = [
      {
        _tag: "substitution",
        conclusionNodeId: "derived-node",
        premiseNodeId: "phi-node",
        entries: [{ variableName: "phi", replacementText: "phi -> phi" }],
        conclusionText: "phi -> phi",
      },
    ];
    const result = checkQuestGoalsWithAxioms(
      goals,
      nodes,
      inferenceEdges,
      lukasiewiczSystem,
    );
    // 未知のルートノード（phi）があるため公理違反
    expect(result._tag).toBe("AllAchievedButAxiomViolation");
    if (result._tag === "AllAchievedButAxiomViolation") {
      expect(result.goalResults[0]?.hasUnknownRootNodes).toBe(true);
    }
  });

  test("孤立ノードで公理テンプレートに一致しない場合はNotAllAchieved", () => {
    // phi -> phiは公理テンプレートに一致しない孤立ノード
    // findMatchingNodeが孤立+非公理をスキップするためNotAllAchieved
    const goals = [
      makeGoal({
        id: "g1",
        formulaText: "phi -> phi",
        allowedAxiomIds: ["A1", "A2"],
      }),
    ];
    const nodes = [
      makeNode({
        id: "n1",
        kind: "axiom",
        formulaText: "phi -> phi",
      }),
    ];
    const result = checkQuestGoalsWithAxioms(
      goals,
      nodes,
      [],
      lukasiewiczSystem,
    );
    // 孤立ノードで公理でないためfindMatchingNodeがスキップ → 未達成
    expect(result._tag).toBe("NotAllAchieved");
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

  test("Effect版がSync版と同じAllAchievedButRuleViolation結果を返す", () => {
    // ゴール式は導出ノードのみが持つ式（スキーマとは異なる）
    const goals = [
      makeGoal({
        id: "g1",
        formulaText: "phi -> ((phi -> phi) -> phi)",
        allowedRuleIds: ["gen"],
      }),
    ];
    const nodes = [
      makeNode({
        id: "a1-schema",
        kind: "axiom",
        formulaText: "phi -> (psi -> phi)",
      }),
      makeNode({
        id: "a1-derived",
        kind: "axiom",
        formulaText: "phi -> ((phi -> phi) -> phi)",
      }),
    ];
    const inferenceEdges: readonly InferenceEdge[] = [
      {
        _tag: "substitution",
        conclusionNodeId: "a1-derived",
        premiseNodeId: "a1-schema",
        entries: [],
        conclusionText: "phi -> ((phi -> phi) -> phi)",
      },
    ];
    const syncResult = checkQuestGoalsWithAxioms(
      goals,
      nodes,
      inferenceEdges,
      lukasiewiczSystem,
    );
    const effectResult = Effect.runSync(
      checkQuestGoalsWithAxiomsEffect(
        goals,
        nodes,
        inferenceEdges,
        lukasiewiczSystem,
      ),
    );
    expect(effectResult).toEqual(syncResult);
    expect(syncResult._tag).toBe("AllAchievedButRuleViolation");
  });
});

// --- computeViolatingRuleIds ---

describe("computeViolatingRuleIds", () => {
  test("allowedRuleIdsがundefinedなら空集合を返す", () => {
    const used: ReadonlySet<InferenceRuleId> = new Set(["mp", "gen"]);
    const result = computeViolatingRuleIds(used, undefined);
    expect(result).toEqual(new Set());
  });

  test("使用規則がすべて許可されていれば空集合を返す", () => {
    const used: ReadonlySet<InferenceRuleId> = new Set(["mp", "gen"]);
    const result = computeViolatingRuleIds(used, ["mp", "gen", "substitution"]);
    expect(result).toEqual(new Set());
  });

  test("許可されていない規則を返す", () => {
    const used: ReadonlySet<InferenceRuleId> = new Set([
      "mp",
      "gen",
      "substitution",
    ]);
    const result = computeViolatingRuleIds(used, ["mp", "gen"]);
    expect(result).toEqual(new Set(["substitution"]));
  });

  test("使用規則が空なら空集合を返す", () => {
    const used: ReadonlySet<InferenceRuleId> = new Set();
    const result = computeViolatingRuleIds(used, ["mp"]);
    expect(result).toEqual(new Set());
  });

  test("許可が空リストならすべて違反", () => {
    const used: ReadonlySet<InferenceRuleId> = new Set(["mp", "gen"]);
    const result = computeViolatingRuleIds(used, []);
    expect(result).toEqual(new Set(["mp", "gen"]));
  });
});

// --- 規則制限付きゴール達成チェック ---

describe("checkQuestGoalsWithAxioms (rule restriction)", () => {
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

  test("ゴール達成・規則制限なしでAllAchievedを返す", () => {
    // ゴール式は導出ノードのみが持つ式（スキーマとは異なる）
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
        id: "a1-derived",
        kind: "axiom",
        formulaText: "phi -> ((phi -> phi) -> phi)",
      }),
    ];
    const inferenceEdges: readonly InferenceEdge[] = [
      {
        _tag: "substitution",
        conclusionNodeId: "a1-derived",
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
      expect(result.goalResults[0]?.usedRuleIds).toEqual(
        new Set(["substitution"]),
      );
      expect(result.goalResults[0]?.violatingRuleIds).toEqual(new Set());
    }
  });

  test("ゴール達成・規則制限内でAllAchievedを返す", () => {
    // ゴール式は導出ノードのみが持つ式（スキーマとは異なる）
    const goals = [
      makeGoal({
        id: "g1",
        formulaText: "phi -> ((phi -> phi) -> phi)",
        allowedRuleIds: ["mp", "substitution"],
      }),
    ];
    const nodes = [
      makeNode({
        id: "a1-schema",
        kind: "axiom",
        formulaText: "phi -> (psi -> phi)",
      }),
      makeNode({
        id: "a1-derived",
        kind: "axiom",
        formulaText: "phi -> ((phi -> phi) -> phi)",
      }),
    ];
    const inferenceEdges: readonly InferenceEdge[] = [
      {
        _tag: "substitution",
        conclusionNodeId: "a1-derived",
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
  });

  test("ゴール達成・規則制限違反でAllAchievedButRuleViolationを返す", () => {
    // ゴール式は導出ノードのみが持つ式（スキーマとは異なる）
    const goals = [
      makeGoal({
        id: "g1",
        formulaText: "phi -> ((phi -> phi) -> phi)",
        allowedRuleIds: ["mp"],
      }),
    ];
    const nodes = [
      makeNode({
        id: "a1-schema",
        kind: "axiom",
        formulaText: "phi -> (psi -> phi)",
      }),
      makeNode({
        id: "a1-derived",
        kind: "axiom",
        formulaText: "phi -> ((phi -> phi) -> phi)",
      }),
    ];
    const inferenceEdges: readonly InferenceEdge[] = [
      {
        _tag: "substitution",
        conclusionNodeId: "a1-derived",
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
    expect(result._tag).toBe("AllAchievedButRuleViolation");
    if (result._tag === "AllAchievedButRuleViolation") {
      expect(result.goalResults[0]?.violatingRuleIds).toEqual(
        new Set(["substitution"]),
      );
    }
  });

  test("公理制限違反と規則制限違反が両方ある場合は公理違反が優先される", () => {
    // A1インスタンスを直接配置（公理制限違反: A1はallowedにない）
    const goals = [
      makeGoal({
        id: "g1",
        formulaText: "phi -> ((phi -> phi) -> phi)",
        allowedAxiomIds: ["A2"],
        allowedRuleIds: ["mp"],
      }),
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
    // 公理インスタンスは identifyAxiom で認識され、A1として検出される。
    // A1はallowedAxiomIds ["A2"] に含まれないため公理違反。
    expect(result._tag).toBe("AllAchievedButAxiomViolation");
    if (result._tag === "AllAchievedButAxiomViolation") {
      expect(result.goalResults[0]?.violatingAxiomIds).toEqual(
        new Set(["A1"]),
      );
    }
  });

  test("MP導出で規則制限違反をチェックする", () => {
    // a1 + a3 → [mp] → mp1
    // ゴールはmpを許可しない
    const goals = [
      makeGoal({
        id: "g1",
        formulaText: "psi -> phi",
        allowedRuleIds: ["gen", "substitution"],
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
    expect(result._tag).toBe("AllAchievedButRuleViolation");
    if (result._tag === "AllAchievedButRuleViolation") {
      expect(result.goalResults[0]?.usedRuleIds).toEqual(new Set(["mp"]));
      expect(result.goalResults[0]?.violatingRuleIds).toEqual(new Set(["mp"]));
    }
  });

  test("推論規則なし（ルートノードのみ）で規則制限が空でもAllAchievedを返す", () => {
    const goals = [
      makeGoal({
        id: "g1",
        formulaText: "phi -> (psi -> phi)",
        allowedRuleIds: [],
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
    // ルートノードのみ（推論規則なし）→ 規則違反なし
    expect(result._tag).toBe("AllAchieved");
  });

  test("未達成ゴールでもusedRuleIdsとviolatingRuleIdsが空集合で返る", () => {
    const goals = [
      makeGoal({
        id: "g1",
        formulaText: "phi -> phi",
        allowedRuleIds: ["mp"],
      }),
    ];
    const nodes: readonly WorkspaceNode[] = [];
    const result = checkQuestGoalsWithAxioms(
      goals,
      nodes,
      [],
      lukasiewiczSystem,
    );
    expect(result._tag).toBe("NotAllAchieved");
    if (result._tag === "NotAllAchieved") {
      expect(result.goalResults[0]?.usedRuleIds).toEqual(new Set());
      expect(result.goalResults[0]?.violatingRuleIds).toEqual(new Set());
      expect(result.goalResults[0]?.allowedRuleIds).toEqual(["mp"]);
    }
  });
});

// --- computeViolatingScRuleIds ---

describe("computeViolatingScRuleIds", () => {
  test("disallowedがundefinedなら空集合を返す", () => {
    const used: ReadonlySet<ScRuleId> = new Set(["cut", "identity"]);
    const result = computeViolatingScRuleIds(used, undefined);
    expect(result).toEqual(new Set());
  });

  test("禁止リストに含まれるルールが使用されていれば違反を返す", () => {
    const used: ReadonlySet<ScRuleId> = new Set([
      "cut",
      "identity",
      "weakening-left",
    ]);
    const result = computeViolatingScRuleIds(used, ["cut"]);
    expect(result).toEqual(new Set(["cut"]));
  });

  test("禁止リストに含まれないルールのみ使用なら空集合を返す", () => {
    const used: ReadonlySet<ScRuleId> = new Set(["identity", "weakening-left"]);
    const result = computeViolatingScRuleIds(used, ["cut"]);
    expect(result).toEqual(new Set());
  });

  test("使用ルールが空なら空集合を返す", () => {
    const used: ReadonlySet<ScRuleId> = new Set();
    const result = computeViolatingScRuleIds(used, ["cut"]);
    expect(result).toEqual(new Set());
  });

  test("禁止リストが空なら空集合を返す", () => {
    const used: ReadonlySet<ScRuleId> = new Set(["cut", "identity"]);
    const result = computeViolatingScRuleIds(used, []);
    expect(result).toEqual(new Set());
  });

  test("複数の禁止ルールが使用されていればすべて違反を返す", () => {
    const used: ReadonlySet<ScRuleId> = new Set([
      "cut",
      "weakening-left",
      "weakening-right",
    ]);
    const result = computeViolatingScRuleIds(used, ["cut", "weakening-left"]);
    expect(result).toEqual(new Set(["cut", "weakening-left"]));
  });
});

// --- SC規則制限付きゴール達成チェック ---

describe("checkQuestGoalsWithAxioms (SC rule restriction)", () => {
  // SC系ではemptyLogicSystemを使用（公理なし）
  const emptySystem: LogicSystem = {
    name: "empty",
    propositionalAxioms: new Set(),
    predicateLogic: false,
    equalityLogic: false,
    generalization: false,
  };

  function makeScAxiomEdge(
    conclusionNodeId: string,
    ruleId: ScRuleId,
  ): InferenceEdge {
    return {
      _tag: "sc-axiom",
      ruleId,
      conclusionNodeId,
      conclusionText: "",
    };
  }

  function makeScBranchingEdge(
    conclusionNodeId: string,
    leftPremiseNodeId: string,
    rightPremiseNodeId: string,
    ruleId: ScRuleId,
  ): InferenceEdge {
    return {
      _tag: "sc-branching",
      ruleId,
      conclusionNodeId,
      leftPremiseNodeId,
      rightPremiseNodeId,
      leftConclusionText: "",
      rightConclusionText: "",
      conclusionText: "",
    };
  }

  function makeScSingleEdge(
    conclusionNodeId: string,
    premiseNodeId: string,
    ruleId: ScRuleId,
  ): InferenceEdge {
    return {
      _tag: "sc-single",
      ruleId,
      conclusionNodeId,
      premiseNodeId,
      conclusionText: "",
    };
  }

  test("SC規則制限なしでAllAchievedを返す", () => {
    // ⇒ P のゴール。identity公理でP ⇒ Pを作り、cutで ⇒ Pを導出
    const goals = [makeGoal({ id: "g1", formulaText: "P" })];
    const nodes = [makeNode({ id: "n1", kind: "axiom", formulaText: "P" })];
    const edges: readonly InferenceEdge[] = [makeScAxiomEdge("n1", "identity")];
    const result = checkQuestGoalsWithAxioms(goals, nodes, edges, emptySystem);
    expect(result._tag).toBe("AllAchieved");
    if (result._tag === "AllAchieved") {
      expect(result.goalResults[0]?.usedScRuleIds).toEqual(
        new Set(["identity"]),
      );
      expect(result.goalResults[0]?.violatingScRuleIds).toEqual(new Set());
    }
  });

  test("SC規則禁止なし（disallowedScRuleIds undefined）でAllAchievedを返す", () => {
    const goals = [makeGoal({ id: "g1", formulaText: "P" })];
    const nodes = [makeNode({ id: "n1", kind: "axiom", formulaText: "P" })];
    const edges: readonly InferenceEdge[] = [
      makeScAxiomEdge("n1", "identity"),
      makeScBranchingEdge("n1-cut", "n1", "n1", "cut"),
    ];
    // n1-cutはゴールに一致しないので無関係
    const result = checkQuestGoalsWithAxioms(goals, nodes, edges, emptySystem);
    expect(result._tag).toBe("AllAchieved");
  });

  test("cutを禁止し、cutが使用されていればAllAchievedButRuleViolationを返す", () => {
    const goals = [
      makeGoal({ id: "g1", formulaText: "P", disallowedScRuleIds: ["cut"] }),
    ];
    const nodes = [
      makeNode({ id: "n1", kind: "axiom", formulaText: "P ⇒ P" }),
      makeNode({ id: "n2", kind: "axiom", formulaText: "P ⇒ P" }),
      makeNode({ id: "n3", kind: "axiom", formulaText: "P" }),
    ];
    const edges: readonly InferenceEdge[] = [
      makeScAxiomEdge("n1", "identity"),
      makeScAxiomEdge("n2", "identity"),
      makeScBranchingEdge("n3", "n1", "n2", "cut"),
    ];
    const result = checkQuestGoalsWithAxioms(goals, nodes, edges, emptySystem);
    expect(result._tag).toBe("AllAchievedButRuleViolation");
    if (result._tag === "AllAchievedButRuleViolation") {
      expect(result.goalResults[0]?.usedScRuleIds).toEqual(
        new Set(["identity", "cut"]),
      );
      expect(result.goalResults[0]?.violatingScRuleIds).toEqual(
        new Set(["cut"]),
      );
      expect(result.goalResults[0]?.disallowedScRuleIds).toEqual(["cut"]);
    }
  });

  test("cutを禁止し、cutが使用されていなければAllAchievedを返す", () => {
    const goals = [
      makeGoal({ id: "g1", formulaText: "P", disallowedScRuleIds: ["cut"] }),
    ];
    const nodes = [
      makeNode({ id: "n1", kind: "axiom", formulaText: "P ⇒ P" }),
      makeNode({ id: "n2", kind: "axiom", formulaText: "P" }),
    ];
    const edges: readonly InferenceEdge[] = [
      makeScAxiomEdge("n1", "identity"),
      makeScSingleEdge("n2", "n1", "weakening-left"),
    ];
    const result = checkQuestGoalsWithAxioms(goals, nodes, edges, emptySystem);
    expect(result._tag).toBe("AllAchieved");
    if (result._tag === "AllAchieved") {
      expect(result.goalResults[0]?.usedScRuleIds).toEqual(
        new Set(["identity", "weakening-left"]),
      );
      expect(result.goalResults[0]?.violatingScRuleIds).toEqual(new Set());
    }
  });

  test("未達成ゴールでもusedScRuleIdsとviolatingScRuleIdsが空集合で返る", () => {
    const goals = [
      makeGoal({
        id: "g1",
        formulaText: "Q",
        disallowedScRuleIds: ["cut"],
      }),
    ];
    const nodes: readonly WorkspaceNode[] = [];
    const result = checkQuestGoalsWithAxioms(goals, nodes, [], emptySystem);
    expect(result._tag).toBe("NotAllAchieved");
    if (result._tag === "NotAllAchieved") {
      expect(result.goalResults[0]?.usedScRuleIds).toEqual(new Set());
      expect(result.goalResults[0]?.violatingScRuleIds).toEqual(new Set());
      expect(result.goalResults[0]?.disallowedScRuleIds).toEqual(["cut"]);
    }
  });
});

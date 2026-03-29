import { describe, expect, it } from "vitest";
import {
  parseGoalFormula,
  parseNodeFormula,
  checkGoal,
  type GoalCheckResult,
} from "./goalCheckLogic";
import type { WorkspaceNode } from "./workspaceState";
import type { WorkspaceGoal } from "./workspaceState";
import type { LogicSystem } from "../logic-core/inferenceRule";
import type { InferenceEdge } from "./inferenceEdge";

// --- ヘルパー ---

function makeNode(
  id: string,
  formulaText: string,
  kind: "axiom" | "conclusion" = "axiom",
): WorkspaceNode {
  return {
    id,
    kind,
    label: "test",
    formulaText,
    position: { x: 0, y: 0 },
  };
}

function makeGoal(id: string, formulaText: string): WorkspaceGoal {
  return {
    id,
    formulaText,
  };
}

describe("goalCheckLogic", () => {
  describe("parseGoalFormula", () => {
    it("returns undefined for empty string", () => {
      expect(parseGoalFormula("")).toBeUndefined();
    });

    it("returns undefined for whitespace-only string", () => {
      expect(parseGoalFormula("   ")).toBeUndefined();
    });

    it("returns undefined for invalid formula", () => {
      expect(parseGoalFormula("-> ->")).toBeUndefined();
    });

    it("parses a valid simple formula", () => {
      const result = parseGoalFormula("phi");
      expect(result).toBeDefined();
      expect(result!._tag).toBe("MetaVariable");
    });

    it("parses a valid implication", () => {
      const result = parseGoalFormula("phi -> phi");
      expect(result).toBeDefined();
      expect(result!._tag).toBe("Implication");
    });

    it("parses formula with leading/trailing spaces", () => {
      const result = parseGoalFormula("  phi -> psi  ");
      expect(result).toBeDefined();
      expect(result!._tag).toBe("Implication");
    });
  });

  describe("parseNodeFormula", () => {
    it("returns undefined for empty string", () => {
      expect(parseNodeFormula("")).toBeUndefined();
    });

    it("returns undefined for whitespace-only string", () => {
      expect(parseNodeFormula("   ")).toBeUndefined();
    });

    it("returns undefined for invalid formula", () => {
      expect(parseNodeFormula("-> ->")).toBeUndefined();
    });

    it("parses a plain formula directly", () => {
      const result = parseNodeFormula("phi -> psi");
      expect(result).toBeDefined();
      expect(result!._tag).toBe("Implication");
    });

    it("parses a sequent with empty antecedent and single succedent", () => {
      // " ⇒ phi" format — represents theorem phi in SC
      const result = parseNodeFormula("⇒ phi -> psi");
      expect(result).toBeDefined();
      expect(result!._tag).toBe("Implication");
    });

    it("returns undefined for sequent with non-empty antecedent", () => {
      // "phi ⇒ psi" — not a theorem (has assumptions)
      const result = parseNodeFormula("phi ⇒ psi");
      expect(result).toBeUndefined();
    });

    it("returns undefined for sequent with multiple succedents", () => {
      // " ⇒ phi, psi" — multiple succedents
      const result = parseNodeFormula("⇒ phi, psi");
      expect(result).toBeUndefined();
    });

    it("returns undefined for unparseable sequent succedent", () => {
      const result = parseNodeFormula("⇒ -> ->");
      expect(result).toBeUndefined();
    });

    it("parses AT signed formula F:φ (extracts formula part)", () => {
      const result = parseNodeFormula("F:phi \\/ ~phi");
      expect(result).toBeDefined();
      expect(result!._tag).toBe("Disjunction");
    });

    it("parses AT signed formula T:φ (extracts formula part)", () => {
      const result = parseNodeFormula("T:phi -> psi");
      expect(result).toBeDefined();
      expect(result!._tag).toBe("Implication");
    });

    it("returns undefined for AT signed formula with invalid formula part", () => {
      const result = parseNodeFormula("F:-> ->");
      expect(result).toBeUndefined();
    });

    it("returns undefined for too-short AT prefix", () => {
      const result = parseNodeFormula("F:");
      expect(result).toBeUndefined();
    });

    it("uses sequentTexts directly when provided (skips text re-parsing)", () => {
      // sequentTexts with empty antecedent and single succedent → extracts formula
      const result = parseNodeFormula("⇒ phi -> psi", {
        antecedentTexts: [],
        succedentTexts: ["phi -> psi"],
      });
      expect(result).toBeDefined();
      expect(result!._tag).toBe("Implication");
    });

    it("uses sequentTexts even when formulaText has no ⇒", () => {
      // sequentTexts provided but formulaText doesn't contain ⇒
      // sequentTexts should still be used
      const result = parseNodeFormula("invalid text", {
        antecedentTexts: [],
        succedentTexts: ["phi"],
      });
      expect(result).toBeDefined();
      expect(result!._tag).toBe("MetaVariable");
    });

    it("returns undefined when sequentTexts has non-empty antecedent", () => {
      const result = parseNodeFormula("phi ⇒ psi", {
        antecedentTexts: ["phi"],
        succedentTexts: ["psi"],
      });
      expect(result).toBeUndefined();
    });
  });

  describe("checkGoal - AT signed formula matching", () => {
    it("matches AT signed formula node F:φ to plain goal formula", () => {
      const goals = [makeGoal("goal-1", "phi \\/ ~phi")];
      const nodes = [makeNode("node-1", "F:phi \\/ ~phi")];
      const result = checkGoal(goals, nodes);
      expect(result._tag).toBe("GoalAllAchieved");
    });

    it("matches AT signed formula node T:φ to plain goal formula", () => {
      const goals = [makeGoal("goal-1", "phi -> psi")];
      const nodes = [makeNode("node-1", "T:phi -> psi")];
      const result = checkGoal(goals, nodes);
      expect(result._tag).toBe("GoalAllAchieved");
    });
  });

  describe("checkGoal - SC sequent matching", () => {
    it("matches SC sequent node to plain goal formula", () => {
      const goals = [makeGoal("goal-1", "phi -> psi")];
      const nodes = [makeNode("node-1", "⇒ phi -> psi")];
      const result = checkGoal(goals, nodes);
      expect(result._tag).toBe("GoalAllAchieved");
    });

    it("does not match SC sequent with non-empty antecedent", () => {
      const goals = [makeGoal("goal-1", "psi")];
      const nodes = [makeNode("node-1", "phi ⇒ psi")];
      const result = checkGoal(goals, nodes);
      expect(result._tag).toBe("GoalPartiallyAchieved");
    });
  });

  describe("checkGoal (formula matching)", () => {
    it("returns GoalNotSet when no goals exist", () => {
      const result = checkGoal([], []);
      expect(result._tag).toBe("GoalNotSet");
    });

    it("returns GoalNotSet when goals array is empty", () => {
      const nodes = [makeNode("node-1", "phi")];
      const result = checkGoal([], nodes);
      expect(result._tag).toBe("GoalNotSet");
    });

    it("returns GoalPartiallyAchieved when goal exists but no nodes", () => {
      const goals = [makeGoal("goal-1", "phi")];
      const result = checkGoal(goals, []);
      expect(result._tag).toBe("GoalPartiallyAchieved");
      if (result._tag === "GoalPartiallyAchieved") {
        expect(result.achievedCount).toBe(0);
        expect(result.totalCount).toBe(1);
      }
    });

    it("returns GoalAllAchieved when matching node exists on canvas", () => {
      const goals = [makeGoal("goal-1", "phi")];
      const nodes = [makeNode("node-1", "phi")];
      const result = checkGoal(goals, nodes);
      expect(result._tag).toBe("GoalAllAchieved");
      if (result._tag === "GoalAllAchieved") {
        expect(result.achievedGoals).toHaveLength(1);
        expect(result.achievedGoals[0]!.matchingNodeId).toBe("node-1");
      }
    });

    it("returns GoalPartiallyAchieved when no matching node exists", () => {
      const goals = [makeGoal("goal-1", "phi")];
      const nodes = [makeNode("node-1", "psi")];
      const result = checkGoal(goals, nodes);
      expect(result._tag).toBe("GoalPartiallyAchieved");
      if (result._tag === "GoalPartiallyAchieved") {
        expect(result.achievedCount).toBe(0);
        expect(result.totalCount).toBe(1);
      }
    });

    it("matches implication formula correctly", () => {
      const goals = [makeGoal("goal-1", "phi -> psi")];
      const nodes = [makeNode("node-1", "phi -> psi")];
      const result = checkGoal(goals, nodes);
      expect(result._tag).toBe("GoalAllAchieved");
    });

    it("matches Unicode formula with DSL formula", () => {
      const goals = [makeGoal("goal-1", "phi -> phi")];
      const nodes = [makeNode("node-1", "\u03C6 \u2192 \u03C6")];
      const result = checkGoal(goals, nodes);
      expect(result._tag).toBe("GoalAllAchieved");
    });

    it("skips nodes with empty formula text", () => {
      const goals = [makeGoal("goal-1", "phi")];
      const nodes = [makeNode("node-1", ""), makeNode("node-2", "phi")];
      const result = checkGoal(goals, nodes);
      expect(result._tag).toBe("GoalAllAchieved");
      if (result._tag === "GoalAllAchieved") {
        expect(result.achievedGoals[0]!.matchingNodeId).toBe("node-2");
      }
    });

    it("skips nodes with unparseable formula text", () => {
      const goals = [makeGoal("goal-1", "phi")];
      const nodes = [makeNode("node-1", "-> ->"), makeNode("node-2", "phi")];
      const result = checkGoal(goals, nodes);
      expect(result._tag).toBe("GoalAllAchieved");
      if (result._tag === "GoalAllAchieved") {
        expect(result.achievedGoals[0]!.matchingNodeId).toBe("node-2");
      }
    });

    it("matches MP result node formula to goal", () => {
      const goals = [makeGoal("goal-1", "psi")];
      const nodes = [
        makeNode("node-1", "phi", "axiom"),
        makeNode("node-2", "phi -> psi", "axiom"),
        makeNode("node-3", "\u03C8", "axiom"),
      ];
      const result = checkGoal(goals, nodes);
      expect(result._tag).toBe("GoalAllAchieved");
      if (result._tag === "GoalAllAchieved") {
        expect(result.achievedGoals[0]!.matchingNodeId).toBe("node-3");
      }
    });

    it("matches FormulaSubstitution node to resolved goal (P(x)[a/x] ≡ P(a))", () => {
      // FormulaSubstitution ノードが残っていても、equivalentFormula で
      // 正規化後に一致すればゴール達成と判定される
      const goals = [makeGoal("goal-1", "P(a)")];
      const nodes = [makeNode("node-1", "P(x)[a/x]")];
      const result = checkGoal(goals, nodes);
      expect(result._tag).toBe("GoalAllAchieved");
    });

    it("does not match structurally different formulas", () => {
      const goals = [makeGoal("goal-1", "phi -> psi")];
      const nodes = [makeNode("node-1", "psi -> phi")];
      const result = checkGoal(goals, nodes);
      expect(result._tag).toBe("GoalPartiallyAchieved");
    });

    it("handles multiple goals - all achieved", () => {
      const goals = [makeGoal("goal-1", "phi"), makeGoal("goal-2", "psi")];
      const nodes = [makeNode("node-1", "phi"), makeNode("node-2", "psi")];
      const result = checkGoal(goals, nodes);
      expect(result._tag).toBe("GoalAllAchieved");
      if (result._tag === "GoalAllAchieved") {
        expect(result.achievedGoals).toHaveLength(2);
      }
    });

    it("handles multiple goals - partial achievement", () => {
      const goals = [makeGoal("goal-1", "phi"), makeGoal("goal-2", "psi")];
      const nodes = [makeNode("node-1", "phi")];
      const result = checkGoal(goals, nodes);
      expect(result._tag).toBe("GoalPartiallyAchieved");
      if (result._tag === "GoalPartiallyAchieved") {
        expect(result.achievedCount).toBe(1);
        expect(result.totalCount).toBe(2);
        expect(result.goalStatuses[0]!.achieved).toBe(true);
        expect(result.goalStatuses[1]!.achieved).toBe(false);
      }
    });

    it("handles goal with unparseable formula text", () => {
      const goals = [makeGoal("goal-1", "-> ->")];
      const result = checkGoal(goals, []);
      expect(result._tag).toBe("GoalPartiallyAchieved");
      if (result._tag === "GoalPartiallyAchieved") {
        expect(result.goalStatuses[0]!.goalFormula).toBeUndefined();
        expect(result.goalStatuses[0]!.achieved).toBe(false);
      }
    });

    it("handles goal with empty formula text", () => {
      const goals = [makeGoal("goal-1", "")];
      const result = checkGoal(goals, []);
      expect(result._tag).toBe("GoalPartiallyAchieved");
      if (result._tag === "GoalPartiallyAchieved") {
        expect(result.goalStatuses[0]!.goalFormula).toBeUndefined();
        expect(result.goalStatuses[0]!.achieved).toBe(false);
      }
    });

    it("uses goalId (not goalNodeId) in GoalStatus", () => {
      const goals = [makeGoal("goal-1", "phi")];
      const nodes = [makeNode("node-1", "phi")];
      const result = checkGoal(goals, nodes) as Extract<
        GoalCheckResult,
        { readonly _tag: "GoalAllAchieved" }
      >;
      expect(result.achievedGoals[0]!.goalId).toBe("goal-1");
    });

    it("uses goalId (not goalNodeId) in AchievedGoalInfo", () => {
      const goals = [makeGoal("goal-1", "phi")];
      const result = checkGoal(goals, []) as Extract<
        GoalCheckResult,
        { readonly _tag: "GoalPartiallyAchieved" }
      >;
      expect(result.goalStatuses[0]!.goalId).toBe("goal-1");
    });

    it("provides goalFormula in GoalAllAchieved result", () => {
      const goals = [makeGoal("goal-1", "phi")];
      const nodes = [makeNode("node-1", "phi")];
      const result = checkGoal(goals, nodes) as Extract<
        GoalCheckResult,
        { readonly _tag: "GoalAllAchieved" }
      >;
      expect(result.achievedGoals[0]!.goalFormula).toBeDefined();
      expect(result.achievedGoals[0]!.goalFormula._tag).toBe("MetaVariable");
    });

    it("provides goalStatuses in GoalPartiallyAchieved result", () => {
      const goals = [makeGoal("goal-1", "phi -> phi")];
      const nodes = [makeNode("node-1", "psi")];
      const result = checkGoal(goals, nodes) as Extract<
        GoalCheckResult,
        { readonly _tag: "GoalPartiallyAchieved" }
      >;
      expect(result.goalStatuses).toHaveLength(1);
      expect(result.goalStatuses[0]!.goalFormula).toBeDefined();
      expect(result.goalStatuses[0]!.goalFormula!._tag).toBe("Implication");
    });

    it("achieves goal when any node on canvas matches, regardless of node kind", () => {
      const goals = [makeGoal("goal-1", "phi")];
      const nodes = [makeNode("node-1", "phi", "conclusion")];
      const result = checkGoal(goals, nodes);
      expect(result._tag).toBe("GoalAllAchieved");
    });

    it("same formula on multiple nodes - uses first match", () => {
      const goals = [makeGoal("goal-1", "phi")];
      const nodes = [makeNode("node-1", "phi"), makeNode("node-2", "phi")];
      const result = checkGoal(goals, nodes);
      expect(result._tag).toBe("GoalAllAchieved");
      if (result._tag === "GoalAllAchieved") {
        expect(result.achievedGoals[0]!.matchingNodeId).toBe("node-1");
      }
    });
  });

  describe("checkGoal - root validation (circular proof prevention)", () => {
    const lukasiewiczSystem: LogicSystem = {
      name: "Łukasiewicz",
      propositionalAxioms: new Set(["A1", "A2", "A3"]),
      predicateLogic: false,
      equalityLogic: false,
      generalization: false,
    };

    it("rejects standalone node that does not match axiom template", () => {
      // ゴールと同じ式をノードとして置くだけでは証明にならない
      const goals = [makeGoal("goal-1", "phi -> phi")];
      const nodes = [makeNode("node-1", "phi -> phi")];
      const result = checkGoal(goals, nodes, [], lukasiewiczSystem);
      expect(result._tag).toBe("GoalPartiallyAchieved");
      if (result._tag === "GoalPartiallyAchieved") {
        expect(result.achievedCount).toBe(0);
      }
    });

    it("accepts standalone node that matches axiom template", () => {
      // A1: phi -> (psi -> phi) は正当な公理テンプレート
      const goals = [makeGoal("goal-1", "phi -> (psi -> phi)")];
      const nodes = [makeNode("node-1", "phi -> (psi -> phi)")];
      const result = checkGoal(goals, nodes, [], lukasiewiczSystem);
      expect(result._tag).toBe("GoalAllAchieved");
    });

    it("accepts node derived via valid proof chain", () => {
      // A1 + A2 → [MP] → result
      const a1Node = makeNode("a1", "phi -> (psi -> phi)");
      const a2Node = makeNode(
        "a2",
        "(phi -> (psi -> chi)) -> ((phi -> psi) -> (phi -> chi))",
      );
      const mpResult = makeNode("mp-1", "psi -> phi");
      const nodes = [a1Node, a2Node, mpResult];
      const edges: readonly InferenceEdge[] = [
        {
          _tag: "mp",
          conclusionNodeId: "mp-1",
          leftPremiseNodeId: "a2",
          rightPremiseNodeId: "a1",
          conclusionText: "psi -> phi",
        },
      ];
      const goals = [makeGoal("goal-1", "psi -> phi")];
      // MP結果のルートノードは a1, a2 → 両方公理テンプレートに一致
      const result = checkGoal(goals, nodes, edges, lukasiewiczSystem);
      expect(result._tag).toBe("GoalAllAchieved");
    });

    it("skips node with unknown roots and finds valid alternative", () => {
      // node-bad: ゴール式だが公理テンプレートに一致しない（unknownルート）
      // node-good: A1テンプレートから代入で導出された正当なノード
      // ゴール式: phi -> phi（公理テンプレートではない）
      // node-good は代入エッジで A1 テンプレートから導出
      const goals = [makeGoal("goal-1", "phi -> phi")];
      const a1Node = makeNode("a1-schema", "phi -> (psi -> phi)");
      const nodes = [
        makeNode("node-bad", "phi -> phi"),
        a1Node,
        makeNode("node-good", "phi -> phi"),
      ];
      const edges: readonly InferenceEdge[] = [
        {
          _tag: "substitution",
          conclusionNodeId: "node-good",
          premiseNodeId: "a1-schema",
          entries: [],
          conclusionText: "phi -> phi",
        },
      ];
      const result = checkGoal(goals, nodes, edges, lukasiewiczSystem);
      expect(result._tag).toBe("GoalAllAchieved");
      if (result._tag === "GoalAllAchieved") {
        expect(result.achievedGoals[0]!.matchingNodeId).toBe("node-good");
      }
    });

    it("without inferenceEdges/system, skips root validation (backward compat)", () => {
      // inferenceEdges/system を渡さない場合、ルート検証はスキップ
      const goals = [makeGoal("goal-1", "phi -> phi")];
      const nodes = [makeNode("node-1", "phi -> phi")];
      const result = checkGoal(goals, nodes);
      expect(result._tag).toBe("GoalAllAchieved");
    });
  });

  describe("checkGoal - SC/TAB standalone check (non-Hilbert systems)", () => {
    // SC/TAB系はemptyLogicSystem（公理なし）だが、孤立ノードは拒否すべき
    const emptySystem: LogicSystem = {
      name: "Empty (non-Hilbert)",
      propositionalAxioms: new Set(),
      predicateLogic: false,
      equalityLogic: false,
      generalization: false,
    };

    it("rejects standalone sequent node in SC mode (no inference edges)", () => {
      // SC クエスト: ゴール式を持つシーケントノードを置くだけではゴール達成にならない
      const goals = [makeGoal("goal-1", "phi -> phi")];
      const nodes = [makeNode("node-1", "⇒ phi → phi")];
      const result = checkGoal(goals, nodes, [], emptySystem);
      expect(result._tag).toBe("GoalPartiallyAchieved");
      if (result._tag === "GoalPartiallyAchieved") {
        expect(result.achievedCount).toBe(0);
      }
    });

    it("rejects standalone plain formula node in SC mode", () => {
      // SC モードで平文の論理式ノードを置いただけではゴール達成にならない
      const goals = [makeGoal("goal-1", "phi -> phi")];
      const nodes = [makeNode("node-1", "phi -> phi")];
      const result = checkGoal(goals, nodes, [], emptySystem);
      expect(result._tag).toBe("GoalPartiallyAchieved");
      if (result._tag === "GoalPartiallyAchieved") {
        expect(result.achievedCount).toBe(0);
      }
    });

    it("accepts node connected as conclusion of SC rule", () => {
      // SC 規則（→R）の結論として接続されたノードはゴール達成になる
      const goals = [makeGoal("goal-1", "phi -> phi")];
      const nodes = [
        makeNode("root", "⇒ phi → phi"),
        makeNode("premise", "phi ⇒ phi"),
      ];
      const edges: readonly InferenceEdge[] = [
        {
          _tag: "sc-single",
          ruleId: "implication-right",
          conclusionNodeId: "root",
          premiseNodeId: "premise",
          principalPosition: 0,
        },
      ];
      const result = checkGoal(goals, nodes, edges, emptySystem);
      expect(result._tag).toBe("GoalAllAchieved");
      if (result._tag === "GoalAllAchieved") {
        expect(result.achievedGoals[0]!.matchingNodeId).toBe("root");
      }
    });

    it("accepts node connected as premise of SC rule", () => {
      // SC 規則の前提として参加しているノードもゴール達成に使える
      const goals = [makeGoal("goal-1", "phi -> phi")];
      const nodes = [
        makeNode("root", "⇒ phi → phi"),
        makeNode("premise", "phi ⇒ phi"),
      ];
      // root が結論、premise が前提
      const edges: readonly InferenceEdge[] = [
        {
          _tag: "sc-single",
          ruleId: "implication-right",
          conclusionNodeId: "root",
          premiseNodeId: "premise",
          principalPosition: 0,
        },
      ];
      // ゴールが root のフォーミュラにマッチ → root は結論として接続 → 達成
      const result = checkGoal(goals, nodes, edges, emptySystem);
      expect(result._tag).toBe("GoalAllAchieved");
    });

    it("rejects standalone node even with other connected nodes present", () => {
      // 接続されたノードがあっても、ゴールにマッチするのが孤立ノードなら不達成
      const goals = [makeGoal("goal-1", "phi -> phi")];
      const nodes = [
        makeNode("standalone", "phi -> phi"), // 孤立: ゴールにマッチするが未接続
        makeNode("connected", "psi"), // 接続済みだがゴールにマッチしない
      ];
      const edges: readonly InferenceEdge[] = [
        {
          _tag: "sc-axiom",
          ruleId: "identity",
          conclusionNodeId: "connected",
        },
      ];
      const result = checkGoal(goals, nodes, edges, emptySystem);
      expect(result._tag).toBe("GoalPartiallyAchieved");
    });
  });
});

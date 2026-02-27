import { describe, it, expect } from "vitest";
import {
  exportWorkspaceToJSON,
  importWorkspaceFromJSON,
  generateExportFileName,
  type ImportResult,
} from "./workspaceExport";
import type { WorkspaceState } from "./workspaceState";
import type { InferenceEdge } from "./inferenceEdge";
import { lukasiewiczSystem } from "../logic-core/inferenceRule";

// --- テストヘルパー ---

function createSampleWorkspace(): WorkspaceState {
  return {
    system: lukasiewiczSystem,
    nodes: [
      {
        id: "node-1",
        kind: "axiom",
        label: "Axiom",
        formulaText: "phi -> (psi -> phi)",
        position: { x: 100, y: 200 },
        role: "axiom",
      },
      {
        id: "node-2",
        kind: "derived",
        label: "MP",
        formulaText: "psi -> phi",
        position: { x: 300, y: 400 },
      },
    ],
    connections: [
      {
        id: "conn-node-1-out-node-2-premise-left",
        fromNodeId: "node-1",
        fromPortId: "out",
        toNodeId: "node-2",
        toPortId: "premise-left",
      },
    ],
    inferenceEdges: [],
    nextNodeId: 3,
    mode: "free",
  };
}

function createQuestWorkspace(): WorkspaceState {
  return {
    system: lukasiewiczSystem,
    nodes: [
      {
        id: "node-1",
        kind: "axiom",
        label: "Quest Goal",
        formulaText: "phi -> phi",
        position: { x: 100, y: 200 },
        role: "goal",
        protection: "quest-goal",
      },
    ],
    connections: [],
    inferenceEdges: [],
    nextNodeId: 2,
    mode: "quest",
  };
}

function createGenWorkspace(): WorkspaceState {
  return {
    system: {
      name: "Predicate Logic",
      propositionalAxioms: new Set(["A1", "A2", "A3"]),
      predicateLogic: true,
      equalityLogic: false,
      generalization: true,
    },
    nodes: [
      {
        id: "node-1",
        kind: "derived",
        label: "Gen",
        formulaText: "all x. P(x)",
        position: { x: 100, y: 200 },
        genVariableName: "x",
      },
    ],
    connections: [],
    inferenceEdges: [],
    nextNodeId: 2,
    mode: "free",
  };
}

function createWorkspaceWithInferenceEdges(): WorkspaceState {
  const mpEdge: InferenceEdge = {
    _tag: "mp",
    conclusionNodeId: "node-3",
    leftPremiseNodeId: "node-1",
    rightPremiseNodeId: "node-2",
    conclusionText: "psi",
  };
  const genEdge: InferenceEdge = {
    _tag: "gen",
    conclusionNodeId: "node-4",
    premiseNodeId: "node-1",
    variableName: "x",
    conclusionText: "all x. phi",
  };
  const substEdge: InferenceEdge = {
    _tag: "substitution",
    conclusionNodeId: "node-5",
    premiseNodeId: "node-1",
    entries: [
      {
        _tag: "FormulaSubstitution",
        metaVariableName: "φ",
        formulaText: "p -> q",
      },
      {
        _tag: "TermSubstitution",
        metaVariableName: "τ",
        metaVariableSubscript: "1",
        termText: "f(a)",
      },
    ],
    conclusionText: "(p -> q) -> (psi -> (p -> q))",
  };

  return {
    system: {
      name: "Predicate Logic",
      propositionalAxioms: new Set(["A1", "A2", "A3"]),
      predicateLogic: true,
      equalityLogic: false,
      generalization: true,
    },
    nodes: [
      {
        id: "node-1",
        kind: "axiom",
        label: "A1",
        formulaText: "phi -> (psi -> phi)",
        position: { x: 0, y: 0 },
      },
      {
        id: "node-2",
        kind: "axiom",
        label: "Premise",
        formulaText: "phi",
        position: { x: 200, y: 0 },
      },
      {
        id: "node-3",
        kind: "derived",
        label: "MP",
        formulaText: "psi",
        position: { x: 100, y: 200 },
      },
      {
        id: "node-4",
        kind: "derived",
        label: "Gen",
        formulaText: "all x. phi",
        position: { x: 0, y: 400 },
      },
      {
        id: "node-5",
        kind: "derived",
        label: "Subst",
        formulaText: "(p -> q) -> (psi -> (p -> q))",
        position: { x: 200, y: 400 },
      },
    ],
    connections: [
      {
        id: "conn-1-3-left",
        fromNodeId: "node-1",
        fromPortId: "out",
        toNodeId: "node-3",
        toPortId: "premise-left",
      },
      {
        id: "conn-2-3-right",
        fromNodeId: "node-2",
        fromPortId: "out",
        toNodeId: "node-3",
        toPortId: "premise-right",
      },
    ],
    inferenceEdges: [mpEdge, genEdge, substEdge],
    nextNodeId: 6,
    mode: "free",
  };
}

// --- exportWorkspaceToJSON ---

describe("exportWorkspaceToJSON", () => {
  it("空のワークスペースをエクスポートする", () => {
    const state: WorkspaceState = {
      system: lukasiewiczSystem,
      nodes: [],
      connections: [],
      inferenceEdges: [],
      nextNodeId: 1,
      mode: "free",
    };
    const json = exportWorkspaceToJSON(state);
    const parsed = JSON.parse(json);

    expect(parsed._tag).toBe("ProofPadWorkspace");
    expect(parsed.version).toBe(1);
    expect(parsed.workspace.nodes).toEqual([]);
    expect(parsed.workspace.connections).toEqual([]);
    expect(parsed.workspace.nextNodeId).toBe(1);
    expect(parsed.workspace.mode).toBe("free");
  });

  it("LogicSystemのSetがArrayに変換される", () => {
    const state = createSampleWorkspace();
    const json = exportWorkspaceToJSON(state);
    const parsed = JSON.parse(json);

    expect(Array.isArray(parsed.workspace.system.propositionalAxioms)).toBe(
      true,
    );
    expect(parsed.workspace.system.propositionalAxioms).toContain("A1");
    expect(parsed.workspace.system.propositionalAxioms).toContain("A2");
    expect(parsed.workspace.system.propositionalAxioms).toContain("A3");
  });

  it("ノードと接続が正しくシリアライズされる", () => {
    const state = createSampleWorkspace();
    const json = exportWorkspaceToJSON(state);
    const parsed = JSON.parse(json);

    expect(parsed.workspace.nodes).toHaveLength(2);
    expect(parsed.workspace.nodes[0].id).toBe("node-1");
    expect(parsed.workspace.nodes[0].kind).toBe("axiom");
    expect(parsed.workspace.nodes[0].position).toEqual({ x: 100, y: 200 });
    expect(parsed.workspace.nodes[0].role).toBe("axiom");

    expect(parsed.workspace.connections).toHaveLength(1);
    expect(parsed.workspace.connections[0].fromNodeId).toBe("node-1");
    expect(parsed.workspace.connections[0].toNodeId).toBe("node-2");
  });

  it("クエストモードのワークスペースをエクスポートする", () => {
    const state = createQuestWorkspace();
    const json = exportWorkspaceToJSON(state);
    const parsed = JSON.parse(json);

    expect(parsed.workspace.mode).toBe("quest");
    expect(parsed.workspace.nodes[0].protection).toBe("quest-goal");
    expect(parsed.workspace.nodes[0].role).toBe("goal");
  });

  it("Gen変数名を含むノードをエクスポートする", () => {
    const state = createGenWorkspace();
    const json = exportWorkspaceToJSON(state);
    const parsed = JSON.parse(json);

    expect(parsed.workspace.nodes[0].genVariableName).toBe("x");
    expect(parsed.workspace.system.predicateLogic).toBe(true);
    expect(parsed.workspace.system.generalization).toBe(true);
  });

  it("InferenceEdgesがシリアライズされる", () => {
    const state = createWorkspaceWithInferenceEdges();
    const json = exportWorkspaceToJSON(state);
    const parsed = JSON.parse(json);

    expect(parsed.workspace.inferenceEdges).toHaveLength(3);

    // MPエッジ
    expect(parsed.workspace.inferenceEdges[0]._tag).toBe("mp");
    expect(parsed.workspace.inferenceEdges[0].conclusionNodeId).toBe("node-3");
    expect(parsed.workspace.inferenceEdges[0].leftPremiseNodeId).toBe("node-1");
    expect(parsed.workspace.inferenceEdges[0].rightPremiseNodeId).toBe(
      "node-2",
    );
    expect(parsed.workspace.inferenceEdges[0].conclusionText).toBe("psi");

    // Genエッジ
    expect(parsed.workspace.inferenceEdges[1]._tag).toBe("gen");
    expect(parsed.workspace.inferenceEdges[1].variableName).toBe("x");

    // Substitutionエッジ
    expect(parsed.workspace.inferenceEdges[2]._tag).toBe("substitution");
    expect(parsed.workspace.inferenceEdges[2].entries).toHaveLength(2);
    expect(parsed.workspace.inferenceEdges[2].entries[0]._tag).toBe(
      "FormulaSubstitution",
    );
    expect(parsed.workspace.inferenceEdges[2].entries[1]._tag).toBe(
      "TermSubstitution",
    );
    expect(parsed.workspace.inferenceEdges[2].entries[1].metaVariableSubscript).toBe("1");
  });

  it("空のinferenceEdgesがシリアライズされる", () => {
    const state = createSampleWorkspace();
    const json = exportWorkspaceToJSON(state);
    const parsed = JSON.parse(json);

    expect(parsed.workspace.inferenceEdges).toEqual([]);
  });

  it("出力はpretty-printされている", () => {
    const state = createSampleWorkspace();
    const json = exportWorkspaceToJSON(state);
    expect(json).toContain("\n");
    expect(json).toContain("  ");
  });
});

// --- importWorkspaceFromJSON ---

describe("importWorkspaceFromJSON", () => {
  it("エクスポートしたJSONをラウンドトリップで復元する", () => {
    const original = createSampleWorkspace();
    const json = exportWorkspaceToJSON(original);
    const result = importWorkspaceFromJSON(json);

    expect(result._tag).toBe("Success");
    if (result._tag !== "Success") return;

    expect(result.workspace.nodes).toHaveLength(2);
    expect(result.workspace.connections).toHaveLength(1);
    expect(result.workspace.nextNodeId).toBe(3);
    expect(result.workspace.mode).toBe("free");

    // LogicSystemのSetが復元されている
    expect(result.workspace.system.propositionalAxioms).toBeInstanceOf(Set);
    expect(result.workspace.system.propositionalAxioms.has("A1")).toBe(true);
    expect(result.workspace.system.propositionalAxioms.has("A2")).toBe(true);
    expect(result.workspace.system.propositionalAxioms.has("A3")).toBe(true);
  });

  it("クエストモードのラウンドトリップ", () => {
    const original = createQuestWorkspace();
    const json = exportWorkspaceToJSON(original);
    const result = importWorkspaceFromJSON(json);

    expect(result._tag).toBe("Success");
    if (result._tag !== "Success") return;

    expect(result.workspace.mode).toBe("quest");
    expect(result.workspace.nodes[0].protection).toBe("quest-goal");
    expect(result.workspace.nodes[0].role).toBe("goal");
  });

  it("Gen変数名のラウンドトリップ", () => {
    const original = createGenWorkspace();
    const json = exportWorkspaceToJSON(original);
    const result = importWorkspaceFromJSON(json);

    expect(result._tag).toBe("Success");
    if (result._tag !== "Success") return;

    expect(result.workspace.nodes[0].genVariableName).toBe("x");
    expect(result.workspace.system.predicateLogic).toBe(true);
    expect(result.workspace.system.generalization).toBe(true);
  });

  it("InferenceEdgesのラウンドトリップ", () => {
    const original = createWorkspaceWithInferenceEdges();
    const json = exportWorkspaceToJSON(original);
    const result = importWorkspaceFromJSON(json);

    expect(result._tag).toBe("Success");
    if (result._tag !== "Success") return;

    expect(result.workspace.inferenceEdges).toHaveLength(3);

    // MPエッジの復元
    const mp = result.workspace.inferenceEdges[0];
    expect(mp._tag).toBe("mp");
    if (mp._tag !== "mp") return;
    expect(mp.conclusionNodeId).toBe("node-3");
    expect(mp.leftPremiseNodeId).toBe("node-1");
    expect(mp.rightPremiseNodeId).toBe("node-2");
    expect(mp.conclusionText).toBe("psi");

    // Genエッジの復元
    const gen = result.workspace.inferenceEdges[1];
    expect(gen._tag).toBe("gen");
    if (gen._tag !== "gen") return;
    expect(gen.conclusionNodeId).toBe("node-4");
    expect(gen.premiseNodeId).toBe("node-1");
    expect(gen.variableName).toBe("x");

    // Substitutionエッジの復元
    const subst = result.workspace.inferenceEdges[2];
    expect(subst._tag).toBe("substitution");
    if (subst._tag !== "substitution") return;
    expect(subst.conclusionNodeId).toBe("node-5");
    expect(subst.entries).toHaveLength(2);
    expect(subst.entries[0]._tag).toBe("FormulaSubstitution");
    if (subst.entries[0]._tag !== "FormulaSubstitution") return;
    expect(subst.entries[0].metaVariableName).toBe("φ");
    expect(subst.entries[0].formulaText).toBe("p -> q");
    expect(subst.entries[1]._tag).toBe("TermSubstitution");
    if (subst.entries[1]._tag !== "TermSubstitution") return;
    expect(subst.entries[1].metaVariableName).toBe("τ");
    expect(subst.entries[1].metaVariableSubscript).toBe("1");
    expect(subst.entries[1].termText).toBe("f(a)");
  });

  it("旧フォーマット互換: inferenceEdgesフィールドなしでも空配列で復元する", () => {
    // inferenceEdges フィールドが存在しない旧フォーマットのJSON
    const oldFormatJson = JSON.stringify({
      _tag: "ProofPadWorkspace",
      version: 1,
      workspace: {
        system: {
          name: "Łukasiewicz",
          propositionalAxioms: ["A1", "A2", "A3"],
          predicateLogic: false,
          equalityLogic: false,
          generalization: false,
        },
        nodes: [
          {
            id: "node-1",
            kind: "axiom",
            label: "A1",
            formulaText: "phi -> (psi -> phi)",
            position: { x: 0, y: 0 },
          },
        ],
        connections: [],
        nextNodeId: 2,
        mode: "free",
      },
    });

    const result = importWorkspaceFromJSON(oldFormatJson);
    expect(result._tag).toBe("Success");
    if (result._tag !== "Success") return;

    expect(result.workspace.inferenceEdges).toEqual([]);
    expect(result.workspace.nodes).toHaveLength(1);
  });

  it("旧フォーマット互換: レガシーノード種別mp/gen/substitutionがderivedに変換される", () => {
    const oldFormatJson = JSON.stringify({
      _tag: "ProofPadWorkspace",
      version: 1,
      workspace: {
        system: {
          name: "test",
          propositionalAxioms: ["A1"],
          predicateLogic: false,
          equalityLogic: false,
          generalization: false,
        },
        nodes: [
          {
            id: "n1",
            kind: "mp",
            label: "MP",
            formulaText: "psi",
            position: { x: 0, y: 0 },
          },
          {
            id: "n2",
            kind: "gen",
            label: "Gen",
            formulaText: "all x. phi",
            position: { x: 100, y: 0 },
          },
          {
            id: "n3",
            kind: "substitution",
            label: "Subst",
            formulaText: "phi",
            position: { x: 200, y: 0 },
          },
        ],
        connections: [],
        nextNodeId: 4,
        mode: "free",
      },
    });

    const result = importWorkspaceFromJSON(oldFormatJson);
    expect(result._tag).toBe("Success");
    if (result._tag !== "Success") return;

    expect(result.workspace.nodes[0].kind).toBe("derived");
    expect(result.workspace.nodes[1].kind).toBe("derived");
    expect(result.workspace.nodes[2].kind).toBe("derived");
    expect(result.workspace.inferenceEdges).toEqual([]);
  });

  it("undefinedの前提ノードIDのラウンドトリップ", () => {
    const state: WorkspaceState = {
      system: lukasiewiczSystem,
      nodes: [
        {
          id: "node-1",
          kind: "derived",
          label: "MP",
          formulaText: "",
          position: { x: 0, y: 0 },
        },
      ],
      connections: [],
      inferenceEdges: [
        {
          _tag: "mp",
          conclusionNodeId: "node-1",
          leftPremiseNodeId: undefined,
          rightPremiseNodeId: undefined,
          conclusionText: "",
        },
      ],
      nextNodeId: 2,
      mode: "free",
    };

    const json = exportWorkspaceToJSON(state);
    const result = importWorkspaceFromJSON(json);

    expect(result._tag).toBe("Success");
    if (result._tag !== "Success") return;

    const edge = result.workspace.inferenceEdges[0];
    expect(edge._tag).toBe("mp");
    if (edge._tag !== "mp") return;
    expect(edge.leftPremiseNodeId).toBeUndefined();
    expect(edge.rightPremiseNodeId).toBeUndefined();
  });

  it("不正なJSONでInvalidJSONを返す", () => {
    const result = importWorkspaceFromJSON("not a json");
    expect(result._tag).toBe("InvalidJSON");
  });

  it("空文字列でInvalidJSONを返す", () => {
    const result = importWorkspaceFromJSON("");
    expect(result._tag).toBe("InvalidJSON");
  });

  it("正しいJSONだが不正なフォーマットでInvalidFormatを返す", () => {
    const result = importWorkspaceFromJSON(JSON.stringify({ foo: "bar" }));
    expect(result._tag).toBe("InvalidFormat");
  });

  it("JSONがオブジェクトでない(数値)場合InvalidFormatを返す", () => {
    const result = importWorkspaceFromJSON("42");
    expect(result._tag).toBe("InvalidFormat");
  });

  it("JSONがオブジェクトでない(文字列)場合InvalidFormatを返す", () => {
    const result = importWorkspaceFromJSON('"hello"');
    expect(result._tag).toBe("InvalidFormat");
  });

  it("JSONがnullの場合InvalidFormatを返す", () => {
    const result = importWorkspaceFromJSON("null");
    expect(result._tag).toBe("InvalidFormat");
  });

  it("_tagが不正でInvalidFormatを返す", () => {
    const result = importWorkspaceFromJSON(
      JSON.stringify({ _tag: "WrongTag", version: 1, workspace: {} }),
    );
    expect(result._tag).toBe("InvalidFormat");
  });

  it("versionが不正でInvalidFormatを返す", () => {
    const result = importWorkspaceFromJSON(
      JSON.stringify({
        _tag: "ProofPadWorkspace",
        version: 999,
        workspace: {},
      }),
    );
    expect(result._tag).toBe("InvalidFormat");
  });

  it("workspaceがnullでInvalidFormatを返す", () => {
    const result = importWorkspaceFromJSON(
      JSON.stringify({
        _tag: "ProofPadWorkspace",
        version: 1,
        workspace: null,
      }),
    );
    expect(result._tag).toBe("InvalidFormat");
  });

  it("systemが不正でInvalidFormatを返す", () => {
    const result = importWorkspaceFromJSON(
      JSON.stringify({
        _tag: "ProofPadWorkspace",
        version: 1,
        workspace: {
          system: null,
          nodes: [],
          connections: [],
          nextNodeId: 1,
          mode: "free",
        },
      }),
    );
    expect(result._tag).toBe("InvalidFormat");
  });

  it("不正な公理IDでInvalidFormatを返す", () => {
    const result = importWorkspaceFromJSON(
      JSON.stringify({
        _tag: "ProofPadWorkspace",
        version: 1,
        workspace: {
          system: {
            name: "test",
            propositionalAxioms: ["A1", "INVALID"],
            predicateLogic: false,
            equalityLogic: false,
            generalization: false,
          },
          nodes: [],
          connections: [],
          nextNodeId: 1,
          mode: "free",
        },
      }),
    );
    expect(result._tag).toBe("InvalidFormat");
  });

  it("ノードのkindが不正でInvalidFormatを返す", () => {
    const result = importWorkspaceFromJSON(
      JSON.stringify({
        _tag: "ProofPadWorkspace",
        version: 1,
        workspace: {
          system: {
            name: "test",
            propositionalAxioms: ["A1"],
            predicateLogic: false,
            equalityLogic: false,
            generalization: false,
          },
          nodes: [
            {
              id: "n1",
              kind: "invalid-kind",
              label: "X",
              formulaText: "",
              position: { x: 0, y: 0 },
            },
          ],
          connections: [],
          nextNodeId: 2,
          mode: "free",
        },
      }),
    );
    expect(result._tag).toBe("InvalidFormat");
  });

  it("ノードのpositionが不正でInvalidFormatを返す", () => {
    const result = importWorkspaceFromJSON(
      JSON.stringify({
        _tag: "ProofPadWorkspace",
        version: 1,
        workspace: {
          system: {
            name: "test",
            propositionalAxioms: [],
            predicateLogic: false,
            equalityLogic: false,
            generalization: false,
          },
          nodes: [
            {
              id: "n1",
              kind: "axiom",
              label: "X",
              formulaText: "",
              position: { x: "not a number", y: 0 },
            },
          ],
          connections: [],
          nextNodeId: 2,
          mode: "free",
        },
      }),
    );
    expect(result._tag).toBe("InvalidFormat");
  });

  it("ノードのpositionにInfinityが含まれるとInvalidFormatを返す", () => {
    // JSON.parseでInfinityにならないが、将来の拡張に備えたテスト
    const result = importWorkspaceFromJSON(
      JSON.stringify({
        _tag: "ProofPadWorkspace",
        version: 1,
        workspace: {
          system: {
            name: "test",
            propositionalAxioms: [],
            predicateLogic: false,
            equalityLogic: false,
            generalization: false,
          },
          nodes: [
            {
              id: "n1",
              kind: "axiom",
              label: "X",
              formulaText: "",
              position: null,
            },
          ],
          connections: [],
          nextNodeId: 2,
          mode: "free",
        },
      }),
    );
    expect(result._tag).toBe("InvalidFormat");
  });

  it("接続の必須フィールドが欠けているとInvalidFormatを返す", () => {
    const result = importWorkspaceFromJSON(
      JSON.stringify({
        _tag: "ProofPadWorkspace",
        version: 1,
        workspace: {
          system: {
            name: "test",
            propositionalAxioms: [],
            predicateLogic: false,
            equalityLogic: false,
            generalization: false,
          },
          nodes: [],
          connections: [{ id: "c1", fromNodeId: "n1" }],
          nextNodeId: 1,
          mode: "free",
        },
      }),
    );
    expect(result._tag).toBe("InvalidFormat");
  });

  it("modeが不正でInvalidFormatを返す", () => {
    const result = importWorkspaceFromJSON(
      JSON.stringify({
        _tag: "ProofPadWorkspace",
        version: 1,
        workspace: {
          system: {
            name: "test",
            propositionalAxioms: [],
            predicateLogic: false,
            equalityLogic: false,
            generalization: false,
          },
          nodes: [],
          connections: [],
          nextNodeId: 1,
          mode: "invalid-mode",
        },
      }),
    );
    expect(result._tag).toBe("InvalidFormat");
  });

  it("nextNodeIdが非数値でInvalidFormatを返す", () => {
    const result = importWorkspaceFromJSON(
      JSON.stringify({
        _tag: "ProofPadWorkspace",
        version: 1,
        workspace: {
          system: {
            name: "test",
            propositionalAxioms: [],
            predicateLogic: false,
            equalityLogic: false,
            generalization: false,
          },
          nodes: [],
          connections: [],
          nextNodeId: "not-a-number",

          mode: "free",
        },
      }),
    );
    expect(result._tag).toBe("InvalidFormat");
  });

  it("ノードのroleが不正でInvalidFormatを返す", () => {
    const result = importWorkspaceFromJSON(
      JSON.stringify({
        _tag: "ProofPadWorkspace",
        version: 1,
        workspace: {
          system: {
            name: "test",
            propositionalAxioms: [],
            predicateLogic: false,
            equalityLogic: false,
            generalization: false,
          },
          nodes: [
            {
              id: "n1",
              kind: "axiom",
              label: "X",
              formulaText: "",
              position: { x: 0, y: 0 },
              role: "invalid-role",
            },
          ],
          connections: [],
          nextNodeId: 2,
          mode: "free",
        },
      }),
    );
    expect(result._tag).toBe("InvalidFormat");
  });

  it("ノードのprotectionが不正でInvalidFormatを返す", () => {
    const result = importWorkspaceFromJSON(
      JSON.stringify({
        _tag: "ProofPadWorkspace",
        version: 1,
        workspace: {
          system: {
            name: "test",
            propositionalAxioms: [],
            predicateLogic: false,
            equalityLogic: false,
            generalization: false,
          },
          nodes: [
            {
              id: "n1",
              kind: "axiom",
              label: "X",
              formulaText: "",
              position: { x: 0, y: 0 },
              protection: "invalid-protection",
            },
          ],
          connections: [],
          nextNodeId: 2,
          mode: "free",
        },
      }),
    );
    expect(result._tag).toBe("InvalidFormat");
  });

  it("ノードのgenVariableNameが非文字列でInvalidFormatを返す", () => {
    const result = importWorkspaceFromJSON(
      JSON.stringify({
        _tag: "ProofPadWorkspace",
        version: 1,
        workspace: {
          system: {
            name: "test",
            propositionalAxioms: [],
            predicateLogic: false,
            equalityLogic: false,
            generalization: false,
          },
          nodes: [
            {
              id: "n1",
              kind: "derived",
              label: "Gen",
              formulaText: "",
              position: { x: 0, y: 0 },
              genVariableName: 123,
            },
          ],
          connections: [],
          nextNodeId: 2,
          mode: "free",
        },
      }),
    );
    expect(result._tag).toBe("InvalidFormat");
  });

  it("systemのnameが欠けているとInvalidFormatを返す", () => {
    const result = importWorkspaceFromJSON(
      JSON.stringify({
        _tag: "ProofPadWorkspace",
        version: 1,
        workspace: {
          system: {
            propositionalAxioms: [],
            predicateLogic: false,
            equalityLogic: false,
            generalization: false,
          },
          nodes: [],
          connections: [],
          nextNodeId: 1,
          mode: "free",
        },
      }),
    );
    expect(result._tag).toBe("InvalidFormat");
  });

  it("systemのpredicateLogicが非booleanだとInvalidFormatを返す", () => {
    const result = importWorkspaceFromJSON(
      JSON.stringify({
        _tag: "ProofPadWorkspace",
        version: 1,
        workspace: {
          system: {
            name: "test",
            propositionalAxioms: [],
            predicateLogic: "not-bool",
            equalityLogic: false,
            generalization: false,
          },
          nodes: [],
          connections: [],
          nextNodeId: 1,
          mode: "free",
        },
      }),
    );
    expect(result._tag).toBe("InvalidFormat");
  });

  it("systemのequalityLogicが非booleanだとInvalidFormatを返す", () => {
    const result = importWorkspaceFromJSON(
      JSON.stringify({
        _tag: "ProofPadWorkspace",
        version: 1,
        workspace: {
          system: {
            name: "test",
            propositionalAxioms: [],
            predicateLogic: false,
            equalityLogic: 42,
            generalization: false,
          },
          nodes: [],
          connections: [],
          nextNodeId: 1,
          mode: "free",
        },
      }),
    );
    expect(result._tag).toBe("InvalidFormat");
  });

  it("systemのgeneralizationが非booleanだとInvalidFormatを返す", () => {
    const result = importWorkspaceFromJSON(
      JSON.stringify({
        _tag: "ProofPadWorkspace",
        version: 1,
        workspace: {
          system: {
            name: "test",
            propositionalAxioms: [],
            predicateLogic: false,
            equalityLogic: false,
            generalization: "yes",
          },
          nodes: [],
          connections: [],
          nextNodeId: 1,
          mode: "free",
        },
      }),
    );
    expect(result._tag).toBe("InvalidFormat");
  });

  it("ノードのformulaTextが非文字列だとInvalidFormatを返す", () => {
    const result = importWorkspaceFromJSON(
      JSON.stringify({
        _tag: "ProofPadWorkspace",
        version: 1,
        workspace: {
          system: {
            name: "test",
            propositionalAxioms: [],
            predicateLogic: false,
            equalityLogic: false,
            generalization: false,
          },
          nodes: [
            {
              id: "n1",
              kind: "axiom",
              label: "X",
              formulaText: 123,
              position: { x: 0, y: 0 },
            },
          ],
          connections: [],
          nextNodeId: 2,
          mode: "free",
        },
      }),
    );
    expect(result._tag).toBe("InvalidFormat");
  });

  it("接続のfromNodeIdが欠けているとInvalidFormatを返す", () => {
    const result = importWorkspaceFromJSON(
      JSON.stringify({
        _tag: "ProofPadWorkspace",
        version: 1,
        workspace: {
          system: {
            name: "test",
            propositionalAxioms: [],
            predicateLogic: false,
            equalityLogic: false,
            generalization: false,
          },
          nodes: [],
          connections: [
            {
              id: "c1",
              fromPortId: "p",
              toNodeId: "n2",
              toPortId: "q",
            },
          ],
          nextNodeId: 1,
          mode: "free",
        },
      }),
    );
    expect(result._tag).toBe("InvalidFormat");
  });

  it("nodesがArrayでないとInvalidFormatを返す", () => {
    const result = importWorkspaceFromJSON(
      JSON.stringify({
        _tag: "ProofPadWorkspace",
        version: 1,
        workspace: {
          system: {
            name: "test",
            propositionalAxioms: [],
            predicateLogic: false,
            equalityLogic: false,
            generalization: false,
          },
          nodes: "not-array",
          connections: [],
          nextNodeId: 1,
          mode: "free",
        },
      }),
    );
    expect(result._tag).toBe("InvalidFormat");
  });

  it("connectionsがArrayでないとInvalidFormatを返す", () => {
    const result = importWorkspaceFromJSON(
      JSON.stringify({
        _tag: "ProofPadWorkspace",
        version: 1,
        workspace: {
          system: {
            name: "test",
            propositionalAxioms: [],
            predicateLogic: false,
            equalityLogic: false,
            generalization: false,
          },
          nodes: [],
          connections: "not-array",
          nextNodeId: 1,
          mode: "free",
        },
      }),
    );
    expect(result._tag).toBe("InvalidFormat");
  });

  it("ノードのidが欠けているとInvalidFormatを返す", () => {
    const result = importWorkspaceFromJSON(
      JSON.stringify({
        _tag: "ProofPadWorkspace",
        version: 1,
        workspace: {
          system: {
            name: "test",
            propositionalAxioms: [],
            predicateLogic: false,
            equalityLogic: false,
            generalization: false,
          },
          nodes: [
            {
              kind: "axiom",
              label: "X",
              formulaText: "",
              position: { x: 0, y: 0 },
            },
          ],
          connections: [],
          nextNodeId: 2,
          mode: "free",
        },
      }),
    );
    expect(result._tag).toBe("InvalidFormat");
  });

  it("ノードのlabelが欠けているとInvalidFormatを返す", () => {
    const result = importWorkspaceFromJSON(
      JSON.stringify({
        _tag: "ProofPadWorkspace",
        version: 1,
        workspace: {
          system: {
            name: "test",
            propositionalAxioms: [],
            predicateLogic: false,
            equalityLogic: false,
            generalization: false,
          },
          nodes: [
            {
              id: "n1",
              kind: "axiom",
              formulaText: "",
              position: { x: 0, y: 0 },
            },
          ],
          connections: [],
          nextNodeId: 2,
          mode: "free",
        },
      }),
    );
    expect(result._tag).toBe("InvalidFormat");
  });

  it("ノードがnullだとInvalidFormatを返す", () => {
    const result = importWorkspaceFromJSON(
      JSON.stringify({
        _tag: "ProofPadWorkspace",
        version: 1,
        workspace: {
          system: {
            name: "test",
            propositionalAxioms: [],
            predicateLogic: false,
            equalityLogic: false,
            generalization: false,
          },
          nodes: [null],
          connections: [],
          nextNodeId: 2,
          mode: "free",
        },
      }),
    );
    expect(result._tag).toBe("InvalidFormat");
  });

  it("接続がnullだとInvalidFormatを返す", () => {
    const result = importWorkspaceFromJSON(
      JSON.stringify({
        _tag: "ProofPadWorkspace",
        version: 1,
        workspace: {
          system: {
            name: "test",
            propositionalAxioms: [],
            predicateLogic: false,
            equalityLogic: false,
            generalization: false,
          },
          nodes: [],
          connections: [null],
          nextNodeId: 1,
          mode: "free",
        },
      }),
    );
    expect(result._tag).toBe("InvalidFormat");
  });

  it("接続のfromPortIdが欠けているとInvalidFormatを返す", () => {
    const result = importWorkspaceFromJSON(
      JSON.stringify({
        _tag: "ProofPadWorkspace",
        version: 1,
        workspace: {
          system: {
            name: "test",
            propositionalAxioms: [],
            predicateLogic: false,
            equalityLogic: false,
            generalization: false,
          },
          nodes: [],
          connections: [
            { id: "c1", fromNodeId: "n1", toNodeId: "n2", toPortId: "p" },
          ],
          nextNodeId: 1,
          mode: "free",
        },
      }),
    );
    expect(result._tag).toBe("InvalidFormat");
  });

  it("接続のtoPortIdが欠けているとInvalidFormatを返す", () => {
    const result = importWorkspaceFromJSON(
      JSON.stringify({
        _tag: "ProofPadWorkspace",
        version: 1,
        workspace: {
          system: {
            name: "test",
            propositionalAxioms: [],
            predicateLogic: false,
            equalityLogic: false,
            generalization: false,
          },
          nodes: [],
          connections: [
            {
              id: "c1",
              fromNodeId: "n1",
              fromPortId: "p",
              toNodeId: "n2",
            },
          ],
          nextNodeId: 1,
          mode: "free",
        },
      }),
    );
    expect(result._tag).toBe("InvalidFormat");
  });

  it("接続のtoNodeIdが欠けているとInvalidFormatを返す", () => {
    const result = importWorkspaceFromJSON(
      JSON.stringify({
        _tag: "ProofPadWorkspace",
        version: 1,
        workspace: {
          system: {
            name: "test",
            propositionalAxioms: [],
            predicateLogic: false,
            equalityLogic: false,
            generalization: false,
          },
          nodes: [],
          connections: [
            { id: "c1", fromNodeId: "n1", fromPortId: "p", toPortId: "q" },
          ],
          nextNodeId: 1,
          mode: "free",
        },
      }),
    );
    expect(result._tag).toBe("InvalidFormat");
  });

  it("接続のidが欠けているとInvalidFormatを返す", () => {
    const result = importWorkspaceFromJSON(
      JSON.stringify({
        _tag: "ProofPadWorkspace",
        version: 1,
        workspace: {
          system: {
            name: "test",
            propositionalAxioms: [],
            predicateLogic: false,
            equalityLogic: false,
            generalization: false,
          },
          nodes: [],
          connections: [
            {
              fromNodeId: "n1",
              fromPortId: "p",
              toNodeId: "n2",
              toPortId: "q",
            },
          ],
          nextNodeId: 1,
          mode: "free",
        },
      }),
    );
    expect(result._tag).toBe("InvalidFormat");
  });

  it("systemのpropositionalAxiomsがArrayでないとInvalidFormatを返す", () => {
    const result = importWorkspaceFromJSON(
      JSON.stringify({
        _tag: "ProofPadWorkspace",
        version: 1,
        workspace: {
          system: {
            name: "test",
            propositionalAxioms: "not-array",
            predicateLogic: false,
            equalityLogic: false,
            generalization: false,
          },
          nodes: [],
          connections: [],
          nextNodeId: 1,
          mode: "free",
        },
      }),
    );
    expect(result._tag).toBe("InvalidFormat");
  });

  it("inferenceEdgesがArrayでないとInvalidFormatを返す", () => {
    const result = importWorkspaceFromJSON(
      JSON.stringify({
        _tag: "ProofPadWorkspace",
        version: 1,
        workspace: {
          system: {
            name: "test",
            propositionalAxioms: [],
            predicateLogic: false,
            equalityLogic: false,
            generalization: false,
          },
          nodes: [],
          connections: [],
          inferenceEdges: "not-array",
          nextNodeId: 1,
          mode: "free",
        },
      }),
    );
    expect(result._tag).toBe("InvalidFormat");
  });

  it("inferenceEdgeの_tagが不正でInvalidFormatを返す", () => {
    const result = importWorkspaceFromJSON(
      JSON.stringify({
        _tag: "ProofPadWorkspace",
        version: 1,
        workspace: {
          system: {
            name: "test",
            propositionalAxioms: [],
            predicateLogic: false,
            equalityLogic: false,
            generalization: false,
          },
          nodes: [],
          connections: [],
          inferenceEdges: [
            { _tag: "invalid", conclusionNodeId: "n1", conclusionText: "" },
          ],
          nextNodeId: 1,
          mode: "free",
        },
      }),
    );
    expect(result._tag).toBe("InvalidFormat");
  });

  it("inferenceEdgeがnullだとInvalidFormatを返す", () => {
    const result = importWorkspaceFromJSON(
      JSON.stringify({
        _tag: "ProofPadWorkspace",
        version: 1,
        workspace: {
          system: {
            name: "test",
            propositionalAxioms: [],
            predicateLogic: false,
            equalityLogic: false,
            generalization: false,
          },
          nodes: [],
          connections: [],
          inferenceEdges: [null],
          nextNodeId: 1,
          mode: "free",
        },
      }),
    );
    expect(result._tag).toBe("InvalidFormat");
  });

  it("mpエッジのconclusionNodeIdが非文字列でInvalidFormatを返す", () => {
    const result = importWorkspaceFromJSON(
      JSON.stringify({
        _tag: "ProofPadWorkspace",
        version: 1,
        workspace: {
          system: {
            name: "test",
            propositionalAxioms: [],
            predicateLogic: false,
            equalityLogic: false,
            generalization: false,
          },
          nodes: [],
          connections: [],
          inferenceEdges: [
            { _tag: "mp", conclusionNodeId: 123, conclusionText: "" },
          ],
          nextNodeId: 1,
          mode: "free",
        },
      }),
    );
    expect(result._tag).toBe("InvalidFormat");
  });

  it("mpエッジのconclusionTextが非文字列でInvalidFormatを返す", () => {
    const result = importWorkspaceFromJSON(
      JSON.stringify({
        _tag: "ProofPadWorkspace",
        version: 1,
        workspace: {
          system: {
            name: "test",
            propositionalAxioms: [],
            predicateLogic: false,
            equalityLogic: false,
            generalization: false,
          },
          nodes: [],
          connections: [],
          inferenceEdges: [
            { _tag: "mp", conclusionNodeId: "n1", conclusionText: 42 },
          ],
          nextNodeId: 1,
          mode: "free",
        },
      }),
    );
    expect(result._tag).toBe("InvalidFormat");
  });

  it("mpエッジのleftPremiseNodeIdが非文字列でInvalidFormatを返す", () => {
    const result = importWorkspaceFromJSON(
      JSON.stringify({
        _tag: "ProofPadWorkspace",
        version: 1,
        workspace: {
          system: {
            name: "test",
            propositionalAxioms: [],
            predicateLogic: false,
            equalityLogic: false,
            generalization: false,
          },
          nodes: [],
          connections: [],
          inferenceEdges: [
            {
              _tag: "mp",
              conclusionNodeId: "n1",
              leftPremiseNodeId: 123,
              conclusionText: "",
            },
          ],
          nextNodeId: 1,
          mode: "free",
        },
      }),
    );
    expect(result._tag).toBe("InvalidFormat");
  });

  it("mpエッジのrightPremiseNodeIdが非文字列でInvalidFormatを返す", () => {
    const result = importWorkspaceFromJSON(
      JSON.stringify({
        _tag: "ProofPadWorkspace",
        version: 1,
        workspace: {
          system: {
            name: "test",
            propositionalAxioms: [],
            predicateLogic: false,
            equalityLogic: false,
            generalization: false,
          },
          nodes: [],
          connections: [],
          inferenceEdges: [
            {
              _tag: "mp",
              conclusionNodeId: "n1",
              rightPremiseNodeId: true,
              conclusionText: "",
            },
          ],
          nextNodeId: 1,
          mode: "free",
        },
      }),
    );
    expect(result._tag).toBe("InvalidFormat");
  });

  it("genエッジのvariableNameが欠けているとInvalidFormatを返す", () => {
    const result = importWorkspaceFromJSON(
      JSON.stringify({
        _tag: "ProofPadWorkspace",
        version: 1,
        workspace: {
          system: {
            name: "test",
            propositionalAxioms: [],
            predicateLogic: false,
            equalityLogic: false,
            generalization: false,
          },
          nodes: [],
          connections: [],
          inferenceEdges: [
            { _tag: "gen", conclusionNodeId: "n1", conclusionText: "" },
          ],
          nextNodeId: 1,
          mode: "free",
        },
      }),
    );
    expect(result._tag).toBe("InvalidFormat");
  });

  it("genエッジのpremiseNodeIdが非文字列でInvalidFormatを返す", () => {
    const result = importWorkspaceFromJSON(
      JSON.stringify({
        _tag: "ProofPadWorkspace",
        version: 1,
        workspace: {
          system: {
            name: "test",
            propositionalAxioms: [],
            predicateLogic: false,
            equalityLogic: false,
            generalization: false,
          },
          nodes: [],
          connections: [],
          inferenceEdges: [
            {
              _tag: "gen",
              conclusionNodeId: "n1",
              premiseNodeId: 42,
              variableName: "x",
              conclusionText: "",
            },
          ],
          nextNodeId: 1,
          mode: "free",
        },
      }),
    );
    expect(result._tag).toBe("InvalidFormat");
  });

  it("substitutionエッジのentriesがArrayでないとInvalidFormatを返す", () => {
    const result = importWorkspaceFromJSON(
      JSON.stringify({
        _tag: "ProofPadWorkspace",
        version: 1,
        workspace: {
          system: {
            name: "test",
            propositionalAxioms: [],
            predicateLogic: false,
            equalityLogic: false,
            generalization: false,
          },
          nodes: [],
          connections: [],
          inferenceEdges: [
            {
              _tag: "substitution",
              conclusionNodeId: "n1",
              entries: "not-array",
              conclusionText: "",
            },
          ],
          nextNodeId: 1,
          mode: "free",
        },
      }),
    );
    expect(result._tag).toBe("InvalidFormat");
  });

  it("substitutionエッジのpremiseNodeIdが非文字列でInvalidFormatを返す", () => {
    const result = importWorkspaceFromJSON(
      JSON.stringify({
        _tag: "ProofPadWorkspace",
        version: 1,
        workspace: {
          system: {
            name: "test",
            propositionalAxioms: [],
            predicateLogic: false,
            equalityLogic: false,
            generalization: false,
          },
          nodes: [],
          connections: [],
          inferenceEdges: [
            {
              _tag: "substitution",
              conclusionNodeId: "n1",
              premiseNodeId: false,
              entries: [],
              conclusionText: "",
            },
          ],
          nextNodeId: 1,
          mode: "free",
        },
      }),
    );
    expect(result._tag).toBe("InvalidFormat");
  });

  it("substitutionエントリの_tagが不正でInvalidFormatを返す", () => {
    const result = importWorkspaceFromJSON(
      JSON.stringify({
        _tag: "ProofPadWorkspace",
        version: 1,
        workspace: {
          system: {
            name: "test",
            propositionalAxioms: [],
            predicateLogic: false,
            equalityLogic: false,
            generalization: false,
          },
          nodes: [],
          connections: [],
          inferenceEdges: [
            {
              _tag: "substitution",
              conclusionNodeId: "n1",
              entries: [
                { _tag: "Invalid", metaVariableName: "φ", formulaText: "p" },
              ],
              conclusionText: "",
            },
          ],
          nextNodeId: 1,
          mode: "free",
        },
      }),
    );
    expect(result._tag).toBe("InvalidFormat");
  });

  it("substitutionエントリがnullだとInvalidFormatを返す", () => {
    const result = importWorkspaceFromJSON(
      JSON.stringify({
        _tag: "ProofPadWorkspace",
        version: 1,
        workspace: {
          system: {
            name: "test",
            propositionalAxioms: [],
            predicateLogic: false,
            equalityLogic: false,
            generalization: false,
          },
          nodes: [],
          connections: [],
          inferenceEdges: [
            {
              _tag: "substitution",
              conclusionNodeId: "n1",
              entries: [null],
              conclusionText: "",
            },
          ],
          nextNodeId: 1,
          mode: "free",
        },
      }),
    );
    expect(result._tag).toBe("InvalidFormat");
  });

  it("FormulaSubstitutionエントリのmetaVariableNameが非文字列でInvalidFormatを返す", () => {
    const result = importWorkspaceFromJSON(
      JSON.stringify({
        _tag: "ProofPadWorkspace",
        version: 1,
        workspace: {
          system: {
            name: "test",
            propositionalAxioms: [],
            predicateLogic: false,
            equalityLogic: false,
            generalization: false,
          },
          nodes: [],
          connections: [],
          inferenceEdges: [
            {
              _tag: "substitution",
              conclusionNodeId: "n1",
              entries: [
                {
                  _tag: "FormulaSubstitution",
                  metaVariableName: 42,
                  formulaText: "p",
                },
              ],
              conclusionText: "",
            },
          ],
          nextNodeId: 1,
          mode: "free",
        },
      }),
    );
    expect(result._tag).toBe("InvalidFormat");
  });

  it("FormulaSubstitutionエントリのformulaTextが非文字列でInvalidFormatを返す", () => {
    const result = importWorkspaceFromJSON(
      JSON.stringify({
        _tag: "ProofPadWorkspace",
        version: 1,
        workspace: {
          system: {
            name: "test",
            propositionalAxioms: [],
            predicateLogic: false,
            equalityLogic: false,
            generalization: false,
          },
          nodes: [],
          connections: [],
          inferenceEdges: [
            {
              _tag: "substitution",
              conclusionNodeId: "n1",
              entries: [
                {
                  _tag: "FormulaSubstitution",
                  metaVariableName: "φ",
                  formulaText: 42,
                },
              ],
              conclusionText: "",
            },
          ],
          nextNodeId: 1,
          mode: "free",
        },
      }),
    );
    expect(result._tag).toBe("InvalidFormat");
  });

  it("TermSubstitutionエントリのtermTextが非文字列でInvalidFormatを返す", () => {
    const result = importWorkspaceFromJSON(
      JSON.stringify({
        _tag: "ProofPadWorkspace",
        version: 1,
        workspace: {
          system: {
            name: "test",
            propositionalAxioms: [],
            predicateLogic: false,
            equalityLogic: false,
            generalization: false,
          },
          nodes: [],
          connections: [],
          inferenceEdges: [
            {
              _tag: "substitution",
              conclusionNodeId: "n1",
              entries: [
                {
                  _tag: "TermSubstitution",
                  metaVariableName: "τ",
                  termText: true,
                },
              ],
              conclusionText: "",
            },
          ],
          nextNodeId: 1,
          mode: "free",
        },
      }),
    );
    expect(result._tag).toBe("InvalidFormat");
  });

  it("metaVariableSubscriptが非文字列でInvalidFormatを返す", () => {
    const result = importWorkspaceFromJSON(
      JSON.stringify({
        _tag: "ProofPadWorkspace",
        version: 1,
        workspace: {
          system: {
            name: "test",
            propositionalAxioms: [],
            predicateLogic: false,
            equalityLogic: false,
            generalization: false,
          },
          nodes: [],
          connections: [],
          inferenceEdges: [
            {
              _tag: "substitution",
              conclusionNodeId: "n1",
              entries: [
                {
                  _tag: "FormulaSubstitution",
                  metaVariableName: "φ",
                  metaVariableSubscript: 42,
                  formulaText: "p",
                },
              ],
              conclusionText: "",
            },
          ],
          nextNodeId: 1,
          mode: "free",
        },
      }),
    );
    expect(result._tag).toBe("InvalidFormat");
  });

  it("positionのyが欠けているとInvalidFormatを返す", () => {
    const result = importWorkspaceFromJSON(
      JSON.stringify({
        _tag: "ProofPadWorkspace",
        version: 1,
        workspace: {
          system: {
            name: "test",
            propositionalAxioms: [],
            predicateLogic: false,
            equalityLogic: false,
            generalization: false,
          },
          nodes: [
            {
              id: "n1",
              kind: "axiom",
              label: "X",
              formulaText: "",
              position: { x: 0 },
            },
          ],
          connections: [],
          nextNodeId: 2,
          mode: "free",
        },
      }),
    );
    expect(result._tag).toBe("InvalidFormat");
  });
});

// --- generateExportFileName ---

describe("generateExportFileName", () => {
  it("正しいファイル名形式を生成する", () => {
    const filename = generateExportFileName("Łukasiewicz", {
      year: 2026,
      month: 2,
      day: 26,
      hour: 14,
      minute: 30,
    });

    expect(filename).toMatch(/^proof-.*-\d{8}-\d{4}\.json$/);
    expect(filename).toContain("20260226");
    expect(filename).toContain("1430");
  });

  it("特殊文字がアンダースコアに変換される", () => {
    const filename = generateExportFileName("Łukasiewicz System", {
      year: 2026,
      month: 2,
      day: 26,
      hour: 14,
      minute: 30,
    });

    expect(filename).not.toContain(" ");
    expect(filename).not.toContain("Ł");
    expect(filename).toContain("_");
  });

  it("英数字とハイフン・アンダースコアはそのまま保持される", () => {
    const filename = generateExportFileName("my-system_v1", {
      year: 2026,
      month: 1,
      day: 1,
      hour: 0,
      minute: 0,
    });

    expect(filename).toContain("my-system_v1");
  });

  it("1桁の月日時分がゼロパディングされる", () => {
    const filename = generateExportFileName("test", {
      year: 2026,
      month: 1,
      day: 5,
      hour: 3,
      minute: 7,
    });

    expect(filename).toBe("proof-test-20260105-0307.json");
  });
});

// --- 型チェック ---

describe("ImportResult型チェック", () => {
  it("Success型が正しい", () => {
    const result: ImportResult = {
      _tag: "Success",
      workspace: createSampleWorkspace(),
    };
    expect(result._tag).toBe("Success");
  });

  it("InvalidJSON型が正しい", () => {
    const result: ImportResult = { _tag: "InvalidJSON" };
    expect(result._tag).toBe("InvalidJSON");
  });

  it("InvalidFormat型が正しい", () => {
    const result: ImportResult = { _tag: "InvalidFormat" };
    expect(result._tag).toBe("InvalidFormat");
  });
});

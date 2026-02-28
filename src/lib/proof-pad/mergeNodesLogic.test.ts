import { describe, it, expect } from "vitest";
import {
  mergeNodes,
  findMergeableGroups,
  canMergeSelectedNodes,
} from "./mergeNodesLogic";
import type { WorkspaceNode, WorkspaceConnection } from "./workspaceState";
import type { InferenceEdge } from "./inferenceEdge";

// --- ヘルパー ---

function makeNode(
  id: string,
  formulaText: string,
  overrides?: Partial<WorkspaceNode>,
): WorkspaceNode {
  return {
    id,
    kind: "axiom",
    label: "",
    formulaText,
    position: { x: 0, y: 0 },
    ...overrides,
  };
}

function makeConnection(
  fromNodeId: string,
  fromPortId: string,
  toNodeId: string,
  toPortId: string,
): WorkspaceConnection {
  return {
    id: `conn-${fromNodeId satisfies string}-${fromPortId satisfies string}-${toNodeId satisfies string}-${toPortId satisfies string}`,
    fromNodeId,
    fromPortId,
    toNodeId,
    toPortId,
  };
}

const emptyProtected: ReadonlySet<string> = new Set();

// --- mergeNodes ---

describe("mergeNodes", () => {
  describe("バリデーション", () => {
    it("吸収対象が空の場合はNotEnoughNodesエラー", () => {
      const nodes = [makeNode("n1", "phi")];
      const result = mergeNodes("n1", [], nodes, [], [], emptyProtected);
      expect(result).toEqual({
        _tag: "Error",
        error: { _tag: "NotEnoughNodes" },
      });
    });

    it("リーダーノードが存在しない場合はNotEnoughNodesエラー", () => {
      const nodes = [makeNode("n2", "phi")];
      const result = mergeNodes(
        "nonexistent",
        ["n2"],
        nodes,
        [],
        [],
        emptyProtected,
      );
      expect(result).toEqual({
        _tag: "Error",
        error: { _tag: "NotEnoughNodes" },
      });
    });

    it("吸収対象ノードが存在しない場合はNotEnoughNodesエラー", () => {
      const nodes = [makeNode("n1", "phi")];
      const result = mergeNodes(
        "n1",
        ["nonexistent"],
        nodes,
        [],
        [],
        emptyProtected,
      );
      expect(result).toEqual({
        _tag: "Error",
        error: { _tag: "NotEnoughNodes" },
      });
    });

    it("論理式テキストが異なる場合はFormulaTextMismatchエラー", () => {
      const nodes = [makeNode("n1", "phi"), makeNode("n2", "psi")];
      const result = mergeNodes("n1", ["n2"], nodes, [], [], emptyProtected);
      expect(result).toEqual({
        _tag: "Error",
        error: { _tag: "FormulaTextMismatch" },
      });
    });

    it("リーダーが保護ノードの場合はProtectedNodeエラー", () => {
      const nodes = [makeNode("n1", "phi"), makeNode("n2", "phi")];
      const result = mergeNodes("n1", ["n2"], nodes, [], [], new Set(["n1"]));
      expect(result).toEqual({
        _tag: "Error",
        error: { _tag: "ProtectedNode", nodeId: "n1" },
      });
    });

    it("吸収対象が保護ノードの場合はProtectedNodeエラー", () => {
      const nodes = [makeNode("n1", "phi"), makeNode("n2", "phi")];
      const result = mergeNodes("n1", ["n2"], nodes, [], [], new Set(["n2"]));
      expect(result).toEqual({
        _tag: "Error",
        error: { _tag: "ProtectedNode", nodeId: "n2" },
      });
    });
  });

  describe("基本マージ", () => {
    it("2ノードのマージでリーダーが残り吸収ノードが消える", () => {
      const nodes = [
        makeNode("n1", "phi"),
        makeNode("n2", "phi"),
        makeNode("n3", "psi"),
      ];
      const result = mergeNodes("n1", ["n2"], nodes, [], [], emptyProtected);
      expect(result._tag).toBe("Success");
      if (result._tag !== "Success") return;

      expect(result.leaderNodeId).toBe("n1");
      expect(result.absorbedNodeIds).toEqual(["n2"]);
      expect(result.nodes).toHaveLength(2);
      expect(result.nodes.map((n) => n.id)).toEqual(["n1", "n3"]);
    });

    it("3ノードのマージ", () => {
      const nodes = [
        makeNode("n1", "phi"),
        makeNode("n2", "phi"),
        makeNode("n3", "phi"),
      ];
      const result = mergeNodes(
        "n1",
        ["n2", "n3"],
        nodes,
        [],
        [],
        emptyProtected,
      );
      expect(result._tag).toBe("Success");
      if (result._tag !== "Success") return;

      expect(result.nodes).toHaveLength(1);
      expect(result.nodes[0].id).toBe("n1");
    });
  });

  describe("コネクションの統合", () => {
    it("吸収ノードの出力コネクション（定理利用）がリーダーに付替えられる", () => {
      const nodes = [
        makeNode("n1", "phi"),
        makeNode("n2", "phi"),
        makeNode("n3", "psi"),
      ];
      // n2 → n3 の出力コネクション
      const connections = [makeConnection("n2", "out", "n3", "premise-left")];
      const result = mergeNodes(
        "n1",
        ["n2"],
        nodes,
        connections,
        [],
        emptyProtected,
      );
      expect(result._tag).toBe("Success");
      if (result._tag !== "Success") return;

      expect(result.connections).toHaveLength(1);
      expect(result.connections[0].fromNodeId).toBe("n1");
      expect(result.connections[0].toNodeId).toBe("n3");
      expect(result.connections[0].fromPortId).toBe("out");
      expect(result.connections[0].toPortId).toBe("premise-left");
      // IDが再生成されている
      expect(result.connections[0].id).toBe("conn-n1-out-n3-premise-left");
    });

    it("吸収ノードへの入力コネクション（derive元）は削除される", () => {
      const nodes = [
        makeNode("n1", "phi"),
        makeNode("n2", "phi"),
        makeNode("n0", "psi"),
      ];
      // n0 → n2 の入力コネクション（n2はderivedだった）
      const connections = [makeConnection("n0", "out", "n2", "premise")];
      const result = mergeNodes(
        "n1",
        ["n2"],
        nodes,
        connections,
        [],
        emptyProtected,
      );
      expect(result._tag).toBe("Success");
      if (result._tag !== "Success") return;

      // n2への入力コネクションは削除されている
      expect(result.connections).toHaveLength(0);
    });

    it("リーダーへの入力コネクション（derive元）は保持される", () => {
      const nodes = [
        makeNode("n1", "phi"),
        makeNode("n2", "phi"),
        makeNode("n0", "psi"),
      ];
      // n0 → n1 の入力コネクション（リーダーのderive元）
      const connections = [makeConnection("n0", "out", "n1", "premise")];
      const result = mergeNodes(
        "n1",
        ["n2"],
        nodes,
        connections,
        [],
        emptyProtected,
      );
      expect(result._tag).toBe("Success");
      if (result._tag !== "Success") return;

      expect(result.connections).toHaveLength(1);
      expect(result.connections[0].toNodeId).toBe("n1");
    });

    it("リーダーと吸収ノードが同じ先に出力を持つ場合、重複コネクションは除去される", () => {
      const nodes = [
        makeNode("n1", "phi"),
        makeNode("n2", "phi"),
        makeNode("n3", "psi"),
      ];
      // 両方がn3の同じポートに接続 → 付替え後は1本になるべき
      const connections = [
        makeConnection("n1", "out", "n3", "premise-left"),
        makeConnection("n2", "out", "n3", "premise-left"),
      ];
      const result = mergeNodes(
        "n1",
        ["n2"],
        nodes,
        connections,
        [],
        emptyProtected,
      );
      expect(result._tag).toBe("Success");
      if (result._tag !== "Success") return;

      expect(result.connections).toHaveLength(1);
      expect(result.connections[0].fromNodeId).toBe("n1");
    });

    it("異なるポートへの出力は両方保持される", () => {
      const nodes = [
        makeNode("n1", "phi"),
        makeNode("n2", "phi"),
        makeNode("n3", "psi"),
      ];
      // n1 → n3:premise-left, n2 → n3:premise-right
      const connections = [
        makeConnection("n1", "out", "n3", "premise-left"),
        makeConnection("n2", "out", "n3", "premise-right"),
      ];
      const result = mergeNodes(
        "n1",
        ["n2"],
        nodes,
        connections,
        [],
        emptyProtected,
      );
      expect(result._tag).toBe("Success");
      if (result._tag !== "Success") return;

      expect(result.connections).toHaveLength(2);
      const fromIds = result.connections.map((c) => c.fromNodeId);
      expect(fromIds).toEqual(["n1", "n1"]);
    });
  });

  describe("InferenceEdgeの統合", () => {
    it("吸収ノードが結論のInferenceEdgeは削除される", () => {
      const nodes = [makeNode("n1", "phi"), makeNode("n2", "phi")];
      const edges: readonly InferenceEdge[] = [
        {
          _tag: "mp",
          conclusionNodeId: "n2",
          leftPremiseNodeId: "n0",
          rightPremiseNodeId: "n0b",
          conclusionText: "phi",
        },
      ];
      const result = mergeNodes("n1", ["n2"], nodes, [], edges, emptyProtected);
      expect(result._tag).toBe("Success");
      if (result._tag !== "Success") return;

      expect(result.inferenceEdges).toHaveLength(0);
    });

    it("リーダーが結論のInferenceEdgeは保持される", () => {
      const nodes = [makeNode("n1", "phi"), makeNode("n2", "phi")];
      const edges: readonly InferenceEdge[] = [
        {
          _tag: "mp",
          conclusionNodeId: "n1",
          leftPremiseNodeId: "n0",
          rightPremiseNodeId: "n0b",
          conclusionText: "phi",
        },
      ];
      const result = mergeNodes("n1", ["n2"], nodes, [], edges, emptyProtected);
      expect(result._tag).toBe("Success");
      if (result._tag !== "Success") return;

      expect(result.inferenceEdges).toHaveLength(1);
      expect(result.inferenceEdges[0].conclusionNodeId).toBe("n1");
    });

    it("吸収ノードが前提のMPEdgeはリーダーに付替えられる", () => {
      const nodes = [
        makeNode("n1", "phi"),
        makeNode("n2", "phi"),
        makeNode("n3", "psi"),
      ];
      const edges: readonly InferenceEdge[] = [
        {
          _tag: "mp",
          conclusionNodeId: "n3",
          leftPremiseNodeId: "n2",
          rightPremiseNodeId: "n0",
          conclusionText: "psi",
        },
      ];
      const result = mergeNodes("n1", ["n2"], nodes, [], edges, emptyProtected);
      expect(result._tag).toBe("Success");
      if (result._tag !== "Success") return;

      expect(result.inferenceEdges).toHaveLength(1);
      expect(result.inferenceEdges[0]._tag).toBe("mp");
      const mp = result.inferenceEdges[0] as {
        readonly leftPremiseNodeId: string | undefined;
      };
      expect(mp.leftPremiseNodeId).toBe("n1");
    });

    it("吸収ノードがrightPremiseのMPEdgeもリーダーに付替えられる", () => {
      const nodes = [
        makeNode("n1", "phi"),
        makeNode("n2", "phi"),
        makeNode("n3", "psi"),
      ];
      const edges: readonly InferenceEdge[] = [
        {
          _tag: "mp",
          conclusionNodeId: "n3",
          leftPremiseNodeId: "n0",
          rightPremiseNodeId: "n2",
          conclusionText: "psi",
        },
      ];
      const result = mergeNodes("n1", ["n2"], nodes, [], edges, emptyProtected);
      expect(result._tag).toBe("Success");
      if (result._tag !== "Success") return;

      const mp = result.inferenceEdges[0] as {
        readonly rightPremiseNodeId: string | undefined;
      };
      expect(mp.rightPremiseNodeId).toBe("n1");
    });

    it("吸収ノードが前提のGenEdgeはリーダーに付替えられる", () => {
      const nodes = [
        makeNode("n1", "phi"),
        makeNode("n2", "phi"),
        makeNode("n3", "all x. phi"),
      ];
      const edges: readonly InferenceEdge[] = [
        {
          _tag: "gen",
          conclusionNodeId: "n3",
          premiseNodeId: "n2",
          variableName: "x",
          conclusionText: "all x. phi",
        },
      ];
      const result = mergeNodes("n1", ["n2"], nodes, [], edges, emptyProtected);
      expect(result._tag).toBe("Success");
      if (result._tag !== "Success") return;

      expect(result.inferenceEdges[0]._tag).toBe("gen");
      const gen = result.inferenceEdges[0] as {
        readonly premiseNodeId: string | undefined;
      };
      expect(gen.premiseNodeId).toBe("n1");
    });

    it("吸収ノードが前提のSubstitutionEdgeはリーダーに付替えられる", () => {
      const nodes = [
        makeNode("n1", "phi"),
        makeNode("n2", "phi"),
        makeNode("n3", "psi"),
      ];
      const edges: readonly InferenceEdge[] = [
        {
          _tag: "substitution",
          conclusionNodeId: "n3",
          premiseNodeId: "n2",
          entries: [],
          conclusionText: "psi",
        },
      ];
      const result = mergeNodes("n1", ["n2"], nodes, [], edges, emptyProtected);
      expect(result._tag).toBe("Success");
      if (result._tag !== "Success") return;

      expect(result.inferenceEdges[0]._tag).toBe("substitution");
      const subst = result.inferenceEdges[0] as {
        readonly premiseNodeId: string | undefined;
      };
      expect(subst.premiseNodeId).toBe("n1");
    });
  });

  describe("複合ケース", () => {
    it("3ノードマージで全吸収ノードのコネクション・エッジが正しく統合される", () => {
      const nodes = [
        makeNode("n1", "phi"),
        makeNode("n2", "phi"),
        makeNode("n3", "phi"),
        makeNode("n4", "psi"),
        makeNode("n5", "chi"),
      ];
      const connections = [
        // n2 → n4 (定理利用)
        makeConnection("n2", "out", "n4", "premise-left"),
        // n3 → n5 (定理利用)
        makeConnection("n3", "out", "n5", "premise"),
      ];
      const edges: readonly InferenceEdge[] = [
        {
          _tag: "mp",
          conclusionNodeId: "n4",
          leftPremiseNodeId: "n2",
          rightPremiseNodeId: "n0",
          conclusionText: "psi",
        },
        {
          _tag: "gen",
          conclusionNodeId: "n5",
          premiseNodeId: "n3",
          variableName: "x",
          conclusionText: "chi",
        },
      ];

      const result = mergeNodes(
        "n1",
        ["n2", "n3"],
        nodes,
        connections,
        edges,
        emptyProtected,
      );
      expect(result._tag).toBe("Success");
      if (result._tag !== "Success") return;

      // n1, n4, n5が残る
      expect(result.nodes.map((n) => n.id).sort()).toEqual(["n1", "n4", "n5"]);

      // コネクションはn1からの出力に付替え
      expect(result.connections).toHaveLength(2);
      expect(result.connections.every((c) => c.fromNodeId === "n1")).toBe(true);

      // InferenceEdgeのpremiseがn1に付替え
      const mpEdge = result.inferenceEdges.find((e) => e._tag === "mp");
      expect(mpEdge).toBeDefined();
      if (mpEdge?._tag === "mp") {
        expect(mpEdge.leftPremiseNodeId).toBe("n1");
      }

      const genEdge = result.inferenceEdges.find((e) => e._tag === "gen");
      expect(genEdge).toBeDefined();
      if (genEdge?._tag === "gen") {
        expect(genEdge.premiseNodeId).toBe("n1");
      }
    });

    it("両方がderiveを持つ場合、リーダーのderiveのみ保持される", () => {
      const nodes = [
        makeNode("n0", "psi"),
        makeNode("n0b", "chi"),
        makeNode("n1", "phi"), // leader (derived from n0)
        makeNode("n2", "phi"), // absorbed (derived from n0b)
        makeNode("n3", "result"),
      ];
      const connections = [
        makeConnection("n0", "out", "n1", "premise"),
        makeConnection("n0b", "out", "n2", "premise"),
        makeConnection("n2", "out", "n3", "premise-left"),
      ];
      const edges: readonly InferenceEdge[] = [
        {
          _tag: "gen",
          conclusionNodeId: "n1",
          premiseNodeId: "n0",
          variableName: "x",
          conclusionText: "phi",
        },
        {
          _tag: "gen",
          conclusionNodeId: "n2",
          premiseNodeId: "n0b",
          variableName: "y",
          conclusionText: "phi",
        },
      ];

      const result = mergeNodes(
        "n1",
        ["n2"],
        nodes,
        connections,
        edges,
        emptyProtected,
      );
      expect(result._tag).toBe("Success");
      if (result._tag !== "Success") return;

      // n2のInferenceEdge（結論）は削除
      expect(
        result.inferenceEdges.find((e) => e.conclusionNodeId === "n2"),
      ).toBeUndefined();

      // n1のInferenceEdge（結論）は保持
      expect(
        result.inferenceEdges.find((e) => e.conclusionNodeId === "n1"),
      ).toBeDefined();

      // n0 → n1 のコネクションは保持
      expect(
        result.connections.find(
          (c) => c.fromNodeId === "n0" && c.toNodeId === "n1",
        ),
      ).toBeDefined();

      // n0b → n2 のコネクションは削除
      expect(
        result.connections.find((c) => c.toNodeId === "n2"),
      ).toBeUndefined();

      // n2 → n3 はn1 → n3に付替え
      const rewired = result.connections.find((c) => c.toNodeId === "n3");
      expect(rewired?.fromNodeId).toBe("n1");
    });
  });
});

// --- findMergeableGroups ---

describe("findMergeableGroups", () => {
  it("同一テキストの2ノードがグループとして検出される", () => {
    const nodes = [makeNode("n1", "phi"), makeNode("n2", "phi")];
    const groups = findMergeableGroups(["n1", "n2"], nodes, emptyProtected);
    expect(groups).toHaveLength(1);
    expect(groups[0].leaderNodeId).toBe("n1");
    expect(groups[0].absorbedNodeIds).toEqual(["n2"]);
  });

  it("異なるテキストのノードはグループにならない", () => {
    const nodes = [makeNode("n1", "phi"), makeNode("n2", "psi")];
    const groups = findMergeableGroups(["n1", "n2"], nodes, emptyProtected);
    expect(groups).toHaveLength(0);
  });

  it("3ノードが同一テキストの場合、1グループになる", () => {
    const nodes = [
      makeNode("n1", "phi"),
      makeNode("n2", "phi"),
      makeNode("n3", "phi"),
    ];
    const groups = findMergeableGroups(
      ["n1", "n2", "n3"],
      nodes,
      emptyProtected,
    );
    expect(groups).toHaveLength(1);
    expect(groups[0].leaderNodeId).toBe("n1");
    expect(groups[0].absorbedNodeIds).toEqual(["n2", "n3"]);
  });

  it("2つの異なるグループが検出される", () => {
    const nodes = [
      makeNode("n1", "phi"),
      makeNode("n2", "psi"),
      makeNode("n3", "phi"),
      makeNode("n4", "psi"),
    ];
    const groups = findMergeableGroups(
      ["n1", "n2", "n3", "n4"],
      nodes,
      emptyProtected,
    );
    expect(groups).toHaveLength(2);
  });

  it("1ノードしかない場合は空", () => {
    const nodes = [makeNode("n1", "phi")];
    const groups = findMergeableGroups(["n1"], nodes, emptyProtected);
    expect(groups).toHaveLength(0);
  });

  it("保護ノードはグループから除外される", () => {
    const nodes = [makeNode("n1", "phi"), makeNode("n2", "phi")];
    const groups = findMergeableGroups(["n1", "n2"], nodes, new Set(["n2"]));
    // n2が除外されるのでn1だけでグループにならない
    expect(groups).toHaveLength(0);
  });

  it("存在しないノードIDは無視される", () => {
    const nodes = [makeNode("n1", "phi")];
    const groups = findMergeableGroups(
      ["n1", "nonexistent"],
      nodes,
      emptyProtected,
    );
    expect(groups).toHaveLength(0);
  });
});

// --- canMergeSelectedNodes ---

describe("canMergeSelectedNodes", () => {
  it("マージ可能な場合trueを返す", () => {
    const nodes = [makeNode("n1", "phi"), makeNode("n2", "phi")];
    expect(canMergeSelectedNodes(["n1", "n2"], nodes, emptyProtected)).toBe(
      true,
    );
  });

  it("マージ不可の場合falseを返す", () => {
    const nodes = [makeNode("n1", "phi"), makeNode("n2", "psi")];
    expect(canMergeSelectedNodes(["n1", "n2"], nodes, emptyProtected)).toBe(
      false,
    );
  });

  it("1ノードの場合falseを返す", () => {
    const nodes = [makeNode("n1", "phi")];
    expect(canMergeSelectedNodes(["n1"], nodes, emptyProtected)).toBe(false);
  });
});

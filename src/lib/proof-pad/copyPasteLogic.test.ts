import { describe, it, expect } from "vitest";
import {
  computeCentroid,
  buildClipboardData,
  serializeClipboardData,
  deserializeClipboardData,
  pasteClipboardData,
  toggleNodeSelection,
  selectSingleNode,
  clearSelection,
  type ClipboardData,
} from "./copyPasteLogic";
import type { WorkspaceNode, WorkspaceConnection } from "./workspaceState";
import type { InferenceEdge } from "./inferenceEdge";

// --- テスト用ノード ---

const nodeA: WorkspaceNode = {
  id: "node-1",
  kind: "axiom",
  label: "Axiom",
  formulaText: "phi -> (psi -> phi)",
  position: { x: 100, y: 100 },
  role: "axiom",
};

const nodeB: WorkspaceNode = {
  id: "node-2",
  kind: "axiom",
  label: "Axiom",
  formulaText: "(phi -> (psi -> chi)) -> ((phi -> psi) -> (phi -> chi))",
  position: { x: 300, y: 100 },
};

const nodeC: WorkspaceNode = {
  id: "node-3",
  kind: "mp",
  label: "MP",
  formulaText: "(phi -> psi) -> (phi -> chi)",
  position: { x: 200, y: 300 },
};

const nodeD: WorkspaceNode = {
  id: "node-4",
  kind: "gen",
  label: "Gen",
  formulaText: "forall x . phi",
  position: { x: 400, y: 300 },
  genVariableName: "x",
};

// --- テスト用接続 ---

const connAB: WorkspaceConnection = {
  id: "conn-node-1-out-node-3-premise-left",
  fromNodeId: "node-1",
  fromPortId: "out",
  toNodeId: "node-3",
  toPortId: "premise-left",
};

const connBC: WorkspaceConnection = {
  id: "conn-node-2-out-node-3-premise-right",
  fromNodeId: "node-2",
  fromPortId: "out",
  toNodeId: "node-3",
  toPortId: "premise-right",
};

const connCD: WorkspaceConnection = {
  id: "conn-node-3-out-node-4-premise",
  fromNodeId: "node-3",
  fromPortId: "out",
  toNodeId: "node-4",
  toPortId: "premise",
};

const allNodes = [nodeA, nodeB, nodeC, nodeD];
const allConnections = [connAB, connBC, connCD];

// --- computeCentroid ---

describe("computeCentroid", () => {
  it("空の配列では原点を返す", () => {
    expect(computeCentroid([])).toEqual({ x: 0, y: 0 });
  });

  it("1ノードではそのノードの位置を返す", () => {
    expect(computeCentroid([nodeA])).toEqual({ x: 100, y: 100 });
  });

  it("複数ノードでは中心を返す", () => {
    expect(computeCentroid([nodeA, nodeB])).toEqual({ x: 200, y: 100 });
  });

  it("4ノードでは全ノードの中心を返す", () => {
    expect(computeCentroid(allNodes)).toEqual({ x: 250, y: 200 });
  });
});

// --- buildClipboardData ---

describe("buildClipboardData", () => {
  it("選択なしでは空のデータを返す", () => {
    const result = buildClipboardData(new Set(), allNodes, allConnections);
    expect(result._tag).toBe("ProofPadClipboard");
    expect(result.version).toBe(1);
    expect(result.nodes).toEqual([]);
    expect(result.connections).toEqual([]);
  });

  it("単一ノード選択でノードのみコピーされる", () => {
    const result = buildClipboardData(
      new Set(["node-1"]),
      allNodes,
      allConnections,
    );
    expect(result.nodes).toHaveLength(1);
    expect(result.nodes[0]?.originalId).toBe("node-1");
    expect(result.nodes[0]?.kind).toBe("axiom");
    expect(result.nodes[0]?.label).toBe("Axiom");
    expect(result.nodes[0]?.formulaText).toBe("phi -> (psi -> phi)");
    expect(result.nodes[0]?.relativePosition).toEqual({ x: 0, y: 0 });
    expect(result.nodes[0]?.role).toBe("axiom");
    expect(result.connections).toEqual([]);
  });

  it("接続されたノード群を選択すると内部接続も含まれる", () => {
    const result = buildClipboardData(
      new Set(["node-1", "node-2", "node-3"]),
      allNodes,
      allConnections,
    );
    expect(result.nodes).toHaveLength(3);
    // node-1, node-2 → node-3 の接続が含まれる
    expect(result.connections).toHaveLength(2);
    expect(result.connections[0]?.fromOriginalNodeId).toBe("node-1");
    expect(result.connections[0]?.toOriginalNodeId).toBe("node-3");
    expect(result.connections[1]?.fromOriginalNodeId).toBe("node-2");
    expect(result.connections[1]?.toOriginalNodeId).toBe("node-3");
  });

  it("外部接続は含まれない", () => {
    // node-1, node-2 のみ選択 → node-3 への接続は含まれない
    const result = buildClipboardData(
      new Set(["node-1", "node-2"]),
      allNodes,
      allConnections,
    );
    expect(result.nodes).toHaveLength(2);
    expect(result.connections).toEqual([]);
  });

  it("genVariableNameがないノードではgenVariableNameが含まれない", () => {
    const result = buildClipboardData(
      new Set(["node-2"]),
      allNodes,
      allConnections,
    );
    expect(result.nodes[0]?.genVariableName).toBeUndefined();
  });

  it("roleがないノードではroleが含まれない", () => {
    const result = buildClipboardData(
      new Set(["node-2"]),
      allNodes,
      allConnections,
    );
    expect(result.nodes[0]?.role).toBeUndefined();
  });

  it("genVariableName が保存される", () => {
    const result = buildClipboardData(
      new Set(["node-4"]),
      allNodes,
      allConnections,
    );
    expect(result.nodes[0]?.genVariableName).toBe("x");
  });

  it("相対位置が中心基準で計算される", () => {
    const result = buildClipboardData(
      new Set(["node-1", "node-2"]),
      allNodes,
      allConnections,
    );
    // centroid = (200, 100)
    expect(result.nodes[0]?.relativePosition).toEqual({ x: -100, y: 0 });
    expect(result.nodes[1]?.relativePosition).toEqual({ x: 100, y: 0 });
  });
});

// --- serializeClipboardData / deserializeClipboardData ---

describe("シリアライズ/デシリアライズ", () => {
  it("往復変換で同一データが得られる", () => {
    const original = buildClipboardData(
      new Set(["node-1", "node-2", "node-3"]),
      allNodes,
      allConnections,
    );
    const json = serializeClipboardData(original);
    const restored = deserializeClipboardData(json);
    expect(restored).toEqual(original);
  });

  it("不正なJSONではundefinedを返す", () => {
    expect(deserializeClipboardData("not json")).toBeUndefined();
  });

  it("不正な構造ではundefinedを返す", () => {
    expect(
      deserializeClipboardData(JSON.stringify({ foo: "bar" })),
    ).toBeUndefined();
  });

  it("_tagが異なる場合はundefinedを返す", () => {
    expect(
      deserializeClipboardData(
        JSON.stringify({
          _tag: "Wrong",
          version: 1,
          nodes: [],
          connections: [],
        }),
      ),
    ).toBeUndefined();
  });

  it("versionが異なる場合はundefinedを返す", () => {
    expect(
      deserializeClipboardData(
        JSON.stringify({
          _tag: "ProofPadClipboard",
          version: 2,
          nodes: [],
          connections: [],
        }),
      ),
    ).toBeUndefined();
  });

  it("nullではundefinedを返す", () => {
    expect(deserializeClipboardData("null")).toBeUndefined();
  });

  it("配列ではundefinedを返す", () => {
    expect(deserializeClipboardData("[]")).toBeUndefined();
  });

  it("nodesが配列でない場合はundefinedを返す", () => {
    expect(
      deserializeClipboardData(
        JSON.stringify({
          _tag: "ProofPadClipboard",
          version: 1,
          nodes: "not-array",
          connections: [],
        }),
      ),
    ).toBeUndefined();
  });

  it("connectionsが配列でない場合はundefinedを返す", () => {
    expect(
      deserializeClipboardData(
        JSON.stringify({
          _tag: "ProofPadClipboard",
          version: 1,
          nodes: [],
          connections: "not-array",
        }),
      ),
    ).toBeUndefined();
  });
});

// --- pasteClipboardData ---

describe("pasteClipboardData", () => {
  const clipboardWith3Nodes = buildClipboardData(
    new Set(["node-1", "node-2", "node-3"]),
    allNodes,
    allConnections,
  );

  it("新しいIDでノードが生成される", () => {
    const result = pasteClipboardData(
      clipboardWith3Nodes,
      { x: 500, y: 500 },
      10,
    );
    expect(result.newNodes).toHaveLength(3);
    expect(result.newNodes[0]?.id).toBe("node-10");
    expect(result.newNodes[1]?.id).toBe("node-11");
    expect(result.newNodes[2]?.id).toBe("node-12");
    expect(result.nextNodeId).toBe(13);
  });

  it("ペースト先の中心を基準に配置される", () => {
    const result = pasteClipboardData(
      clipboardWith3Nodes,
      { x: 500, y: 500 },
      10,
    );
    // centroid of original = (200, ~166.67)
    // node-1 relative: (-100, -66.67)
    // paste at (500, 500): (400, 433.33)
    const node1 = result.newNodes[0];
    expect(node1?.position.x).toBeCloseTo(400);
    expect(node1?.position.y).toBeCloseTo(433.33, 0);
  });

  it("接続が新しいIDにマッピングされる", () => {
    const result = pasteClipboardData(
      clipboardWith3Nodes,
      { x: 500, y: 500 },
      10,
    );
    expect(result.newConnections).toHaveLength(2);
    // node-1 → node-10, node-2 → node-11, node-3 → node-12
    expect(result.newConnections[0]?.fromNodeId).toBe("node-10");
    expect(result.newConnections[0]?.toNodeId).toBe("node-12");
    expect(result.newConnections[0]?.fromPortId).toBe("out");
    expect(result.newConnections[0]?.toPortId).toBe("premise-left");
    expect(result.newConnections[1]?.fromNodeId).toBe("node-11");
    expect(result.newConnections[1]?.toNodeId).toBe("node-12");
  });

  it("接続IDが新しいノードIDで構成される", () => {
    const result = pasteClipboardData(
      clipboardWith3Nodes,
      { x: 500, y: 500 },
      10,
    );
    expect(result.newConnections[0]?.id).toBe(
      "conn-node-10-out-node-12-premise-left",
    );
  });

  it("protectionはコピーされない", () => {
    const protectedNode: WorkspaceNode = {
      ...nodeA,
      protection: "quest-goal",
    };
    const clipboard = buildClipboardData(
      new Set(["node-1"]),
      [protectedNode],
      [],
    );
    const result = pasteClipboardData(clipboard, { x: 0, y: 0 }, 1);
    expect(result.newNodes[0]?.protection).toBeUndefined();
  });

  it("genVariableNameが保持される", () => {
    const clipboard = buildClipboardData(
      new Set(["node-4"]),
      allNodes,
      allConnections,
    );
    const result = pasteClipboardData(clipboard, { x: 0, y: 0 }, 1);
    expect(result.newNodes[0]?.genVariableName).toBe("x");
  });

  it("roleが保持される", () => {
    const clipboard = buildClipboardData(
      new Set(["node-1"]),
      allNodes,
      allConnections,
    );
    const result = pasteClipboardData(clipboard, { x: 0, y: 0 }, 1);
    expect(result.newNodes[0]?.role).toBe("axiom");
  });

  it("接続が存在しないノードIDを参照する場合はスキップされる", () => {
    const clipboardWithBadConn: ClipboardData = {
      _tag: "ProofPadClipboard",
      version: 1,
      nodes: [
        {
          originalId: "node-1",
          kind: "axiom",
          label: "Axiom",
          formulaText: "phi",
          relativePosition: { x: 0, y: 0 },
        },
      ],
      connections: [
        {
          fromOriginalNodeId: "node-1",
          fromPortId: "out",
          toOriginalNodeId: "node-unknown",
          toPortId: "premise-left",
        },
        {
          fromOriginalNodeId: "node-missing",
          fromPortId: "out",
          toOriginalNodeId: "node-1",
          toPortId: "premise-right",
        },
      ],
    };
    const result = pasteClipboardData(clipboardWithBadConn, { x: 0, y: 0 }, 1);
    expect(result.newNodes).toHaveLength(1);
    expect(result.newConnections).toHaveLength(0);
  });

  it("空のクリップボードデータでは空の結果を返す", () => {
    const emptyClipboard: ClipboardData = {
      _tag: "ProofPadClipboard",
      version: 1,
      nodes: [],
      connections: [],
    };
    const result = pasteClipboardData(emptyClipboard, { x: 0, y: 0 }, 1);
    expect(result.newNodes).toEqual([]);
    expect(result.newConnections).toEqual([]);
    expect(result.nextNodeId).toBe(1);
  });
});

// --- InferenceEdge のコピー＆ペースト ---

describe("buildClipboardData with InferenceEdges", () => {
  const testInferenceEdges: readonly InferenceEdge[] = [
    {
      _tag: "mp",
      conclusionNodeId: "node-3",
      leftPremiseNodeId: "node-1",
      rightPremiseNodeId: "node-2",
      conclusionText: "psi",
    },
  ];

  it("選択ノード内に完結するInferenceEdgeを含める", () => {
    const result = buildClipboardData(
      new Set(["node-1", "node-2", "node-3"]),
      allNodes,
      allConnections,
      testInferenceEdges,
    );
    expect(result.inferenceEdges).toHaveLength(1);
    expect(result.inferenceEdges![0]!._tag).toBe("mp");
  });

  it("結論ノードが選択外のInferenceEdgeは含めない", () => {
    const result = buildClipboardData(
      new Set(["node-1", "node-2"]),
      allNodes,
      allConnections,
      testInferenceEdges,
    );
    expect(result.inferenceEdges ?? []).toHaveLength(0);
  });

  it("前提ノードが選択外のInferenceEdgeは含めない", () => {
    const result = buildClipboardData(
      new Set(["node-2", "node-3"]),
      allNodes,
      allConnections,
      testInferenceEdges,
    );
    expect(result.inferenceEdges ?? []).toHaveLength(0);
  });
});

describe("pasteClipboardData with InferenceEdges", () => {
  it("MPEdgeのノードIDを新しいIDにマッピングする", () => {
    const clipboard: ClipboardData = {
      _tag: "ProofPadClipboard",
      version: 1,
      nodes: allNodes.map((n) => ({
        originalId: n.id,
        kind: n.kind,
        label: n.label,
        formulaText: n.formulaText,
        relativePosition: { x: 0, y: 0 },
      })),
      connections: [],
      inferenceEdges: [
        {
          _tag: "mp",
          conclusionNodeId: "node-3",
          leftPremiseNodeId: "node-1",
          rightPremiseNodeId: "node-2",
          conclusionText: "psi",
        },
      ],
    };
    const result = pasteClipboardData(clipboard, { x: 0, y: 0 }, 10);
    expect(result.newInferenceEdges).toHaveLength(1);
    const edge = result.newInferenceEdges[0]!;
    expect(edge._tag).toBe("mp");
    if (edge._tag === "mp") {
      expect(edge.conclusionNodeId).toBe("node-12");
      expect(edge.leftPremiseNodeId).toBe("node-10");
      expect(edge.rightPremiseNodeId).toBe("node-11");
    }
  });

  it("GenEdgeのノードIDを新しいIDにマッピングする", () => {
    const clipboard: ClipboardData = {
      _tag: "ProofPadClipboard",
      version: 1,
      nodes: [
        {
          originalId: "node-1",
          kind: "axiom",
          label: "A",
          formulaText: "phi",
          relativePosition: { x: 0, y: 0 },
        },
        {
          originalId: "node-2",
          kind: "derived",
          label: "Gen",
          formulaText: "forall x. phi",
          relativePosition: { x: 0, y: 100 },
        },
      ],
      connections: [],
      inferenceEdges: [
        {
          _tag: "gen",
          conclusionNodeId: "node-2",
          premiseNodeId: "node-1",
          variableName: "x",
          conclusionText: "forall x. phi",
        },
      ],
    };
    const result = pasteClipboardData(clipboard, { x: 0, y: 0 }, 5);
    expect(result.newInferenceEdges).toHaveLength(1);
    const edge = result.newInferenceEdges[0]!;
    expect(edge._tag).toBe("gen");
    if (edge._tag === "gen") {
      expect(edge.conclusionNodeId).toBe("node-6");
      expect(edge.premiseNodeId).toBe("node-5");
      expect(edge.variableName).toBe("x");
    }
  });

  it("SubstitutionEdgeのノードIDを新しいIDにマッピングする", () => {
    const clipboard: ClipboardData = {
      _tag: "ProofPadClipboard",
      version: 1,
      nodes: [
        {
          originalId: "node-1",
          kind: "axiom",
          label: "A",
          formulaText: "phi -> psi",
          relativePosition: { x: 0, y: 0 },
        },
        {
          originalId: "node-2",
          kind: "derived",
          label: "Subst",
          formulaText: "alpha -> beta",
          relativePosition: { x: 0, y: 100 },
        },
      ],
      connections: [],
      inferenceEdges: [
        {
          _tag: "substitution",
          conclusionNodeId: "node-2",
          premiseNodeId: "node-1",
          entries: [
            {
              _tag: "FormulaSubstitution",
              metaVariableName: "φ",
              formulaText: "alpha",
            },
          ],
          conclusionText: "alpha -> beta",
        },
      ],
    };
    const result = pasteClipboardData(clipboard, { x: 0, y: 0 }, 1);
    expect(result.newInferenceEdges).toHaveLength(1);
    const edge = result.newInferenceEdges[0]!;
    expect(edge._tag).toBe("substitution");
    if (edge._tag === "substitution") {
      expect(edge.conclusionNodeId).toBe("node-2");
      expect(edge.premiseNodeId).toBe("node-1");
      expect(edge.entries).toHaveLength(1);
    }
  });

  it("InferenceEdgeがないクリップボードでは空配列を返す", () => {
    const clipboard: ClipboardData = {
      _tag: "ProofPadClipboard",
      version: 1,
      nodes: [],
      connections: [],
    };
    const result = pasteClipboardData(clipboard, { x: 0, y: 0 }, 1);
    expect(result.newInferenceEdges).toEqual([]);
  });
});

// --- 選択操作 ---

describe("toggleNodeSelection", () => {
  it("空の選択にノードを追加する", () => {
    const result = toggleNodeSelection(new Set(), "node-1");
    expect(result.has("node-1")).toBe(true);
    expect(result.size).toBe(1);
  });

  it("選択済みノードを解除する", () => {
    const result = toggleNodeSelection(new Set(["node-1"]), "node-1");
    expect(result.has("node-1")).toBe(false);
    expect(result.size).toBe(0);
  });

  it("既存選択を維持したまま追加する", () => {
    const result = toggleNodeSelection(new Set(["node-1"]), "node-2");
    expect(result.has("node-1")).toBe(true);
    expect(result.has("node-2")).toBe(true);
    expect(result.size).toBe(2);
  });
});

describe("selectSingleNode", () => {
  it("単一ノードを選択する", () => {
    const result = selectSingleNode("node-1");
    expect(result.has("node-1")).toBe(true);
    expect(result.size).toBe(1);
  });
});

describe("clearSelection", () => {
  it("空のセットを返す", () => {
    const result = clearSelection();
    expect(result.size).toBe(0);
  });
});

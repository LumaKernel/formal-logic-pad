import { describe, it, expect } from "vitest";
import {
  workspaceNodeToRFNode,
  workspaceNodesToRFNodes,
  workspaceConnectionToRFEdge,
  workspaceConnectionsToRFEdges,
  applyRFNodePositions,
  viewportStateToRFViewport,
  rfViewportToViewportState,
} from "./reactFlowAdapter";
import type { WorkspaceNode, WorkspaceConnection } from "./workspaceState";
import type { InferenceEdge } from "./inferenceEdge";

// --- テストヘルパー ---

function makeNode(
  id: string,
  overrides?: Partial<WorkspaceNode>,
): WorkspaceNode {
  return {
    id,
    kind: "axiom",
    label: "Axiom",
    formulaText: "phi",
    position: { x: 100, y: 200 },
    ...overrides,
  };
}

function makeConnection(
  fromNodeId: string,
  toNodeId: string,
  id?: string,
): WorkspaceConnection {
  return {
    id:
      id ?? `conn-${fromNodeId satisfies string}-${toNodeId satisfies string}`,
    fromNodeId,
    fromPortId: "out",
    toNodeId,
    toPortId: "premise",
  };
}

function makeMPEdge(
  conclusionNodeId: string,
  leftPremiseNodeId: string,
  rightPremiseNodeId: string,
): InferenceEdge {
  return {
    _tag: "mp",
    conclusionNodeId,
    conclusionText: "psi",
    leftPremiseNodeId,
    rightPremiseNodeId,
  } as InferenceEdge;
}

// --- ノード変換テスト ---

describe("workspaceNodeToRFNode", () => {
  it("公理ノード（ルート）を正しく変換する", () => {
    const node = makeNode("n1", { role: "axiom" });
    const result = workspaceNodeToRFNode(node, []);

    expect(result.id).toBe("n1");
    expect(result.type).toBe("proofNode");
    expect(result.position).toEqual({ x: 100, y: 200 });
    expect(result.data.workspaceNode).toBe(node);
    expect(result.data.classification).toBe("root-axiom");
    expect(result.data.ports.length).toBeGreaterThan(0);
  });

  it("導出ノード（入力接続あり）を正しく変換する", () => {
    const node = makeNode("n2");
    const connections = [makeConnection("n1", "n2")];
    const result = workspaceNodeToRFNode(node, connections);

    expect(result.data.classification).toBe("derived");
  });

  it("ノートノードを正しく変換する", () => {
    const node = makeNode("note1", { kind: "note" });
    const result = workspaceNodeToRFNode(node, []);

    expect(result.data.classification).toBe("note");
    expect(result.data.ports).toEqual([]);
  });

  it("スクリプトノードを正しく変換する", () => {
    const node = makeNode("script1", { kind: "script" });
    const result = workspaceNodeToRFNode(node, []);

    expect(result.data.ports).toEqual([]);
  });

  it("未マークのルートノードを root-unmarked に分類する", () => {
    const node = makeNode("n1", { role: undefined });
    const result = workspaceNodeToRFNode(node, []);

    expect(result.data.classification).toBe("root-unmarked");
  });
});

describe("workspaceNodesToRFNodes", () => {
  it("空配列を返す（ノードなし）", () => {
    const result = workspaceNodesToRFNodes([], []);
    expect(result).toEqual([]);
  });

  it("複数ノードを一括変換する", () => {
    const nodes = [makeNode("n1"), makeNode("n2"), makeNode("n3")];
    const connections = [makeConnection("n1", "n2")];
    const result = workspaceNodesToRFNodes(nodes, connections);

    expect(result).toHaveLength(3);
    expect(result[0].id).toBe("n1");
    expect(result[1].id).toBe("n2");
    expect(result[1].data.classification).toBe("derived");
    expect(result[2].id).toBe("n3");
  });
});

// --- エッジ変換テスト ---

describe("workspaceConnectionToRFEdge", () => {
  it("接続を正しく変換する", () => {
    const nodes = [makeNode("n1", { role: "axiom" }), makeNode("n2")];
    const connections = [makeConnection("n1", "n2")];
    const result = workspaceConnectionToRFEdge(
      connections[0],
      nodes,
      connections,
      [],
    );

    expect(result.id).toBe("conn-n1-n2");
    expect(result.type).toBe("proofEdge");
    expect(result.source).toBe("n1");
    expect(result.target).toBe("n2");
    expect(result.sourceHandle).toBe("out");
    expect(result.targetHandle).toBe("premise");
    expect(result.data?.color).toBeTruthy();
    expect(result.data?.inferenceEdge).toBeUndefined();
  });

  it("InferenceEdge がある接続にエッジデータを含める", () => {
    const nodes = [makeNode("n1"), makeNode("n2"), makeNode("n3")];
    const connections = [
      makeConnection("n1", "n3"),
      makeConnection("n2", "n3"),
    ];
    const inferenceEdges = [makeMPEdge("n3", "n1", "n2")];
    const result = workspaceConnectionToRFEdge(
      connections[0],
      nodes,
      connections,
      inferenceEdges,
    );

    expect(result.data?.inferenceEdge).toBeDefined();
    expect(result.data?.inferenceEdge?._tag).toBe("mp");
  });

  it("存在しない fromNode でもフォールバック色を返す", () => {
    const connection = makeConnection("missing", "n1");
    const nodes = [makeNode("n1")];
    const result = workspaceConnectionToRFEdge(
      connection,
      nodes,
      [connection],
      [],
    );

    expect(result.data?.color).toBeTruthy();
  });
});

describe("workspaceConnectionsToRFEdges", () => {
  it("空配列を返す（接続なし）", () => {
    const result = workspaceConnectionsToRFEdges([], [], []);
    expect(result).toEqual([]);
  });

  it("複数接続を一括変換する", () => {
    const nodes = [makeNode("n1"), makeNode("n2"), makeNode("n3")];
    const connections = [
      makeConnection("n1", "n3"),
      makeConnection("n2", "n3"),
    ];
    const result = workspaceConnectionsToRFEdges(connections, nodes, []);

    expect(result).toHaveLength(2);
    expect(result[0].source).toBe("n1");
    expect(result[1].source).toBe("n2");
  });
});

// --- 逆変換テスト ---

describe("applyRFNodePositions", () => {
  it("位置更新を適用する", () => {
    const nodes = [
      makeNode("n1", { position: { x: 0, y: 0 } }),
      makeNode("n2", { position: { x: 100, y: 100 } }),
    ];
    const updates = new Map([["n1", { x: 50, y: 75 }]]);
    const result = applyRFNodePositions(nodes, updates);

    expect(result[0].position).toEqual({ x: 50, y: 75 });
    expect(result[1].position).toEqual({ x: 100, y: 100 });
    // 参照等価性: 変更されていないノードは同じ参照
    expect(result[1]).toBe(nodes[1]);
  });

  it("空の更新マップでは同じ参照を返す", () => {
    const nodes = [makeNode("n1")];
    const result = applyRFNodePositions(nodes, new Map());
    expect(result).toBe(nodes);
  });

  it("同じ位置への更新では同じ参照を返す", () => {
    const nodes = [makeNode("n1", { position: { x: 100, y: 200 } })];
    const updates = new Map([["n1", { x: 100, y: 200 }]]);
    const result = applyRFNodePositions(nodes, updates);
    expect(result).toBe(nodes);
  });

  it("存在しないノードIDの更新は無視する", () => {
    const nodes = [makeNode("n1")];
    const updates = new Map([["nonexistent", { x: 0, y: 0 }]]);
    const result = applyRFNodePositions(nodes, updates);
    expect(result).toBe(nodes);
  });
});

// --- Viewport 変換テスト ---

describe("viewportStateToRFViewport", () => {
  it("ViewportState を RF Viewport に変換する", () => {
    const result = viewportStateToRFViewport({
      offsetX: 100,
      offsetY: -50,
      scale: 1.5,
    });
    expect(result).toEqual({ x: 100, y: -50, zoom: 1.5 });
  });
});

describe("rfViewportToViewportState", () => {
  it("RF Viewport を ViewportState に変換する", () => {
    const result = rfViewportToViewportState({ x: 100, y: -50, zoom: 1.5 });
    expect(result).toEqual({ offsetX: 100, offsetY: -50, scale: 1.5 });
  });
});

// --- 往復変換テスト ---

describe("Viewport 往復変換", () => {
  it("ViewportState → RF → ViewportState の往復が一致する", () => {
    const original = { offsetX: 42, offsetY: -13, scale: 2.0 };
    const rf = viewportStateToRFViewport(original);
    const roundTripped = rfViewportToViewportState(rf);
    expect(roundTripped).toEqual(original);
  });
});

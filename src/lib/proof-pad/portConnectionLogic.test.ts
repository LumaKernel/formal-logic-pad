import { describe, expect, it } from "vitest";
import {
  isOutputPort,
  isInputPort,
  isInputPortOccupied,
  validatePortConnection,
  validateDragConnection,
} from "./portConnectionLogic";
import type { WorkspaceState, WorkspaceConnection } from "./workspaceState";
import { createEmptyWorkspace } from "./workspaceState";
import { minimalLogicSystem } from "../logic-core/inferenceRule";

const system = minimalLogicSystem;

function buildWorkspaceWithNodes(): WorkspaceState {
  const ws = createEmptyWorkspace(system);
  return {
    ...ws,
    nodes: [
      {
        id: "axiom1",
        kind: "axiom",
        label: "Axiom 1",
        formulaText: "φ",
        position: { x: 0, y: 0 },
        role: "axiom",
      },
      {
        id: "axiom2",
        kind: "axiom",
        label: "Axiom 2",
        formulaText: "φ → ψ",
        position: { x: 200, y: 0 },
        role: "axiom",
      },
      {
        id: "mp1",
        kind: "mp",
        label: "MP",
        formulaText: "",
        position: { x: 100, y: 200 },
      },
      {
        id: "goal1",
        kind: "conclusion",
        label: "Goal",
        formulaText: "ψ",
        position: { x: 100, y: 400 },
        role: "goal",
      },
      {
        id: "gen1",
        kind: "gen",
        label: "Gen",
        formulaText: "",
        position: { x: 300, y: 200 },
      },
    ],
    connections: [],
  };
}

describe("isOutputPort", () => {
  it("outポートは出力ポート", () => {
    expect(isOutputPort("axiom", "out")).toBe(true);
  });

  it("premise-leftポートは出力ポートではない", () => {
    expect(isOutputPort("mp", "premise-left")).toBe(false);
  });

  it("premise-rightポートは出力ポートではない", () => {
    expect(isOutputPort("mp", "premise-right")).toBe(false);
  });

  it("premiseポートは出力ポートではない", () => {
    expect(isOutputPort("gen", "premise")).toBe(false);
  });
});

describe("isInputPort", () => {
  it("outポートは入力ポートではない", () => {
    expect(isInputPort("axiom", "out")).toBe(false);
  });

  it("premise-leftポートは入力ポート", () => {
    expect(isInputPort("mp", "premise-left")).toBe(true);
  });

  it("premise-rightポートは入力ポート", () => {
    expect(isInputPort("mp", "premise-right")).toBe(true);
  });

  it("premiseポートは入力ポート", () => {
    expect(isInputPort("gen", "premise")).toBe(true);
  });
});

describe("isInputPortOccupied", () => {
  it("接続がない場合はoccupiedでない", () => {
    expect(isInputPortOccupied([], "mp1", "premise-left")).toBe(false);
  });

  it("対象ポートへの接続がある場合はoccupied", () => {
    const connections: readonly WorkspaceConnection[] = [
      {
        id: "c1",
        fromNodeId: "axiom1",
        fromPortId: "out",
        toNodeId: "mp1",
        toPortId: "premise-left",
      },
    ];
    expect(isInputPortOccupied(connections, "mp1", "premise-left")).toBe(true);
  });

  it("別のポートへの接続はoccupiedにならない", () => {
    const connections: readonly WorkspaceConnection[] = [
      {
        id: "c1",
        fromNodeId: "axiom1",
        fromPortId: "out",
        toNodeId: "mp1",
        toPortId: "premise-left",
      },
    ];
    expect(isInputPortOccupied(connections, "mp1", "premise-right")).toBe(
      false,
    );
  });
});

describe("validatePortConnection", () => {
  it("axiom out → mp premise-left は有効", () => {
    const ws = buildWorkspaceWithNodes();
    expect(
      validatePortConnection(ws, "axiom1", "out", "mp1", "premise-left"),
    ).toBe(true);
  });

  it("axiom out → mp premise-right は有効", () => {
    const ws = buildWorkspaceWithNodes();
    expect(
      validatePortConnection(ws, "axiom2", "out", "mp1", "premise-right"),
    ).toBe(true);
  });

  it("axiom out → gen premise は有効", () => {
    const ws = buildWorkspaceWithNodes();
    expect(validatePortConnection(ws, "axiom1", "out", "gen1", "premise")).toBe(
      true,
    );
  });

  it("mp out → conclusion premise-left は有効", () => {
    const ws = buildWorkspaceWithNodes();
    expect(
      validatePortConnection(ws, "mp1", "out", "goal1", "premise-left"),
    ).toBe(true);
  });

  it("自己接続は無効", () => {
    const ws = buildWorkspaceWithNodes();
    expect(
      validatePortConnection(ws, "mp1", "out", "mp1", "premise-left"),
    ).toBe(false);
  });

  it("input → input は無効", () => {
    const ws = buildWorkspaceWithNodes();
    expect(
      validatePortConnection(
        ws,
        "mp1",
        "premise-left",
        "goal1",
        "premise-left",
      ),
    ).toBe(false);
  });

  it("input → output は無効（逆方向）", () => {
    const ws = buildWorkspaceWithNodes();
    expect(
      validatePortConnection(ws, "mp1", "premise-left", "axiom1", "out"),
    ).toBe(false);
  });

  it("output → output は無効", () => {
    const ws = buildWorkspaceWithNodes();
    expect(validatePortConnection(ws, "axiom1", "out", "axiom2", "out")).toBe(
      false,
    );
  });

  it("入力ポートが既に接続済みの場合は無効", () => {
    const ws: WorkspaceState = {
      ...buildWorkspaceWithNodes(),
      connections: [
        {
          id: "c1",
          fromNodeId: "axiom1",
          fromPortId: "out",
          toNodeId: "mp1",
          toPortId: "premise-left",
        },
      ],
    };
    expect(
      validatePortConnection(ws, "axiom2", "out", "mp1", "premise-left"),
    ).toBe(false);
  });

  it("同じ接続の重複は無効", () => {
    const ws: WorkspaceState = {
      ...buildWorkspaceWithNodes(),
      connections: [
        {
          id: "c1",
          fromNodeId: "axiom1",
          fromPortId: "out",
          toNodeId: "mp1",
          toPortId: "premise-left",
        },
      ],
    };
    expect(
      validatePortConnection(ws, "axiom1", "out", "mp1", "premise-left"),
    ).toBe(false);
  });

  it("存在しないノードの場合は無効", () => {
    const ws = buildWorkspaceWithNodes();
    expect(
      validatePortConnection(ws, "nonexistent", "out", "mp1", "premise-left"),
    ).toBe(false);
  });

  it("存在しないポートの場合は無効", () => {
    const ws = buildWorkspaceWithNodes();
    expect(
      validatePortConnection(
        ws,
        "axiom1",
        "nonexistent",
        "mp1",
        "premise-left",
      ),
    ).toBe(false);
  });

  it("ターゲット側の存在しないポートの場合は無効", () => {
    const ws = buildWorkspaceWithNodes();
    expect(
      validatePortConnection(ws, "axiom1", "out", "mp1", "nonexistent"),
    ).toBe(false);
  });

  it("別のポートが接続済みでも空きポートには接続可能", () => {
    const ws: WorkspaceState = {
      ...buildWorkspaceWithNodes(),
      connections: [
        {
          id: "c1",
          fromNodeId: "axiom1",
          fromPortId: "out",
          toNodeId: "mp1",
          toPortId: "premise-left",
        },
      ],
    };
    expect(
      validatePortConnection(ws, "axiom2", "out", "mp1", "premise-right"),
    ).toBe(true);
  });
});

describe("validateDragConnection", () => {
  it("出力ポートからドラッグして入力ポートにドロップ: 有効", () => {
    const ws = buildWorkspaceWithNodes();
    const result = validateDragConnection(
      ws,
      "axiom1",
      "out",
      "mp1",
      "premise-left",
    );
    expect(result).toEqual({
      valid: true,
      fromNodeId: "axiom1",
      fromPortId: "out",
      toNodeId: "mp1",
      toPortId: "premise-left",
    });
  });

  it("入力ポートからドラッグして出力ポートにドロップ: 有効（方向反転）", () => {
    const ws = buildWorkspaceWithNodes();
    const result = validateDragConnection(
      ws,
      "mp1",
      "premise-left",
      "axiom1",
      "out",
    );
    expect(result).toEqual({
      valid: true,
      fromNodeId: "axiom1",
      fromPortId: "out",
      toNodeId: "mp1",
      toPortId: "premise-left",
    });
  });

  it("出力ポートからドラッグして出力ポートにドロップ: 無効", () => {
    const ws = buildWorkspaceWithNodes();
    const result = validateDragConnection(
      ws,
      "axiom1",
      "out",
      "axiom2",
      "out",
    );
    expect(result).toEqual({ valid: false });
  });

  it("入力ポートからドラッグして入力ポートにドロップ: 無効", () => {
    const ws = buildWorkspaceWithNodes();
    const result = validateDragConnection(
      ws,
      "mp1",
      "premise-left",
      "goal1",
      "premise-left",
    );
    expect(result).toEqual({ valid: false });
  });

  it("自己接続は無効", () => {
    const ws = buildWorkspaceWithNodes();
    const result = validateDragConnection(
      ws,
      "mp1",
      "out",
      "mp1",
      "premise-left",
    );
    expect(result).toEqual({ valid: false });
  });

  it("存在しないノードは無効", () => {
    const ws = buildWorkspaceWithNodes();
    const result = validateDragConnection(
      ws,
      "nonexistent",
      "out",
      "mp1",
      "premise-left",
    );
    expect(result).toEqual({ valid: false });
  });

  it("入力ポートが既に接続済みの場合は無効", () => {
    const ws: WorkspaceState = {
      ...buildWorkspaceWithNodes(),
      connections: [
        {
          id: "c1",
          fromNodeId: "axiom1",
          fromPortId: "out",
          toNodeId: "mp1",
          toPortId: "premise-left",
        },
      ],
    };
    const result = validateDragConnection(
      ws,
      "axiom2",
      "out",
      "mp1",
      "premise-left",
    );
    expect(result).toEqual({ valid: false });
  });

  it("入力ポートからドラッグ＋空きポートへの接続は有効", () => {
    const ws: WorkspaceState = {
      ...buildWorkspaceWithNodes(),
      connections: [
        {
          id: "c1",
          fromNodeId: "axiom1",
          fromPortId: "out",
          toNodeId: "mp1",
          toPortId: "premise-left",
        },
      ],
    };
    // mp1のpremise-rightからドラッグ → axiom2のoutにドロップ（これは有効）
    const result = validateDragConnection(
      ws,
      "mp1",
      "premise-right",
      "axiom2",
      "out",
    );
    expect(result).toEqual({
      valid: true,
      fromNodeId: "axiom2",
      fromPortId: "out",
      toNodeId: "mp1",
      toPortId: "premise-right",
    });
  });
});

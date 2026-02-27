import { describe, it, expect } from "vitest";
import {
  computeExportBounds,
  generateExportSVG,
  generateImageExportFileName,
  type NodeSizeMap,
} from "./workspaceImageExport";
import type { WorkspaceState, WorkspaceNode } from "./workspaceState";
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
        kind: "mp",
        label: "MP",
        formulaText: "psi -> phi",
        position: { x: 300, y: 400 },
      },
    ],
    connections: [
      {
        id: "conn-1",
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

function createEmptyWorkspace(): WorkspaceState {
  return {
    system: lukasiewiczSystem,
    nodes: [],
    connections: [],
    inferenceEdges: [],
    nextNodeId: 1,
    mode: "free",
  };
}

function createMultiNodeWorkspace(): WorkspaceState {
  return {
    system: lukasiewiczSystem,
    nodes: [
      {
        id: "node-1",
        kind: "axiom",
        label: "Axiom",
        formulaText: "phi -> (psi -> phi)",
        position: { x: 0, y: 0 },
      },
      {
        id: "node-2",
        kind: "axiom",
        label: "Axiom",
        formulaText: "(phi -> (psi -> chi)) -> ((phi -> psi) -> (phi -> chi))",
        position: { x: 300, y: 0 },
      },
      {
        id: "node-3",
        kind: "mp",
        label: "MP",
        formulaText: "result",
        position: { x: 150, y: 200 },
      },
      {
        id: "node-4",
        kind: "gen",
        label: "Gen",
        formulaText: "all x. result",
        position: { x: 150, y: 400 },
        genVariableName: "x",
      },
      {
        id: "node-5",
        kind: "conclusion",
        label: "Goal",
        formulaText: "all x. result",
        position: { x: 150, y: 600 },
        role: "goal",
      },
    ],
    connections: [
      {
        id: "conn-1",
        fromNodeId: "node-1",
        fromPortId: "out",
        toNodeId: "node-3",
        toPortId: "premise-left",
      },
      {
        id: "conn-2",
        fromNodeId: "node-2",
        fromPortId: "out",
        toNodeId: "node-3",
        toPortId: "premise-right",
      },
      {
        id: "conn-3",
        fromNodeId: "node-3",
        fromPortId: "out",
        toNodeId: "node-4",
        toPortId: "premise",
      },
      {
        id: "conn-4",
        fromNodeId: "node-4",
        fromPortId: "out",
        toNodeId: "node-5",
        toPortId: "premise-left",
      },
    ],
    inferenceEdges: [],
    nextNodeId: 6,
    mode: "free",
  };
}

// --- computeExportBounds ---

describe("computeExportBounds", () => {
  it("ノードが0個の場合は原点中心のボックスを返す", () => {
    const bounds = computeExportBounds([], new Map());
    expect(bounds.minX).toBe(-40);
    expect(bounds.minY).toBe(-40);
    expect(bounds.maxX).toBe(40);
    expect(bounds.maxY).toBe(40);
  });

  it("ノード1個の場合はそのノードを包含するボックスを返す", () => {
    const nodes: readonly WorkspaceNode[] = [
      {
        id: "n1",
        kind: "axiom",
        label: "Axiom",
        formulaText: "phi",
        position: { x: 100, y: 200 },
      },
    ];
    const bounds = computeExportBounds(nodes, new Map());
    // デフォルトサイズ 200x56, パディング 40
    expect(bounds.minX).toBe(60); // 100 - 40
    expect(bounds.minY).toBe(160); // 200 - 40
    expect(bounds.maxX).toBe(340); // 100 + 200 + 40
    expect(bounds.maxY).toBe(296); // 200 + 56 + 40
  });

  it("カスタムノードサイズを使用する", () => {
    const nodes: readonly WorkspaceNode[] = [
      {
        id: "n1",
        kind: "axiom",
        label: "Axiom",
        formulaText: "phi",
        position: { x: 0, y: 0 },
      },
    ];
    const sizes: NodeSizeMap = new Map([["n1", { width: 100, height: 40 }]]);
    const bounds = computeExportBounds(nodes, sizes);
    expect(bounds.minX).toBe(-40);
    expect(bounds.minY).toBe(-40);
    expect(bounds.maxX).toBe(140); // 0 + 100 + 40
    expect(bounds.maxY).toBe(80); // 0 + 40 + 40
  });

  it("複数ノードの場合はすべてを包含するボックスを返す", () => {
    const nodes: readonly WorkspaceNode[] = [
      {
        id: "n1",
        kind: "axiom",
        label: "Axiom",
        formulaText: "phi",
        position: { x: -50, y: -100 },
      },
      {
        id: "n2",
        kind: "mp",
        label: "MP",
        formulaText: "psi",
        position: { x: 400, y: 300 },
      },
    ];
    const bounds = computeExportBounds(nodes, new Map());
    expect(bounds.minX).toBe(-90); // -50 - 40
    expect(bounds.minY).toBe(-140); // -100 - 40
    expect(bounds.maxX).toBe(640); // 400 + 200 + 40
    expect(bounds.maxY).toBe(396); // 300 + 56 + 40
  });
});

// --- generateExportSVG ---

describe("generateExportSVG", () => {
  it("空のワークスペースでもvalidなSVGを生成する", () => {
    const ws = createEmptyWorkspace();
    const svg = generateExportSVG(ws);

    expect(svg).toContain("<svg");
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
    expect(svg).toContain("</svg>");
    expect(svg).toContain("viewBox=");
  });

  it("ノード付きのワークスペースでSVGを生成する", () => {
    const ws = createSampleWorkspace();
    const svg = generateExportSVG(ws);

    // ノードが描画されている
    expect(svg).toContain("Axiom");
    expect(svg).toContain("MP");
    // 式テキストが含まれる
    expect(svg).toContain("phi");
    // SVGの構造
    expect(svg).toContain("<rect");
    expect(svg).toContain("<text");
    expect(svg).toContain("<g>");
  });

  it("接続線がSVGに含まれる", () => {
    const ws = createSampleWorkspace();
    const svg = generateExportSVG(ws);

    // パスが含まれる（接続線）
    expect(svg).toContain("<path");
    // 背景線とメイン線の2本
    const pathMatches = svg.match(/<path /g);
    expect(pathMatches).not.toBeNull();
    expect(pathMatches!.length).toBeGreaterThanOrEqual(2);
  });

  it("全種類のノード（axiom, mp, gen, conclusion）を正しく描画する", () => {
    const ws = createMultiNodeWorkspace();
    const svg = generateExportSVG(ws);

    // 紙カード背景色が使われる
    expect(svg).toContain("#fffdf8");

    // 各種ストライプ色（CSS変数のfallback）がSVGに含まれる
    expect(svg).toContain("#5b8bd9"); // axiom stripe
    expect(svg).toContain("#d9944a"); // mp stripe
    expect(svg).toContain("#9b59b6"); // gen stripe
    expect(svg).toContain("#4ad97a"); // conclusion stripe

    // 各種ラベル
    expect(svg).toContain("Axiom");
    expect(svg).toContain("MP");
    expect(svg).toContain("Gen");
    expect(svg).toContain("Goal");
  });

  it("背景色をカスタマイズできる", () => {
    const ws = createEmptyWorkspace();
    const svg = generateExportSVG(ws, { backgroundColor: "#1a1a2e" });

    expect(svg).toContain("#1a1a2e");
  });

  it("グリッドを含めるオプションが機能する", () => {
    const ws = createSampleWorkspace();
    const svgWithGrid = generateExportSVG(ws, { includeGrid: true });
    const svgWithoutGrid = generateExportSVG(ws, { includeGrid: false });

    // グリッドありの場合、ドットのcircleが多い
    const circleCountWith = (svgWithGrid.match(/<circle /g) ?? []).length;
    const circleCountWithout = (svgWithoutGrid.match(/<circle /g) ?? []).length;
    expect(circleCountWith).toBeGreaterThan(circleCountWithout);
  });

  it("カスタムノードサイズを使用する", () => {
    const ws: WorkspaceState = {
      system: lukasiewiczSystem,
      nodes: [
        {
          id: "n1",
          kind: "axiom",
          label: "Axiom",
          formulaText: "phi",
          position: { x: 0, y: 0 },
        },
      ],
      connections: [],
      inferenceEdges: [],
      nextNodeId: 2,
      mode: "free",
    };
    const sizes: NodeSizeMap = new Map([["n1", { width: 150, height: 80 }]]);
    const svg = generateExportSVG(ws, { nodeSizes: sizes });

    expect(svg).toContain('width="150"');
    expect(svg).toContain('height="80"');
  });

  it("XMLの特殊文字がエスケープされる", () => {
    const ws: WorkspaceState = {
      system: lukasiewiczSystem,
      nodes: [
        {
          id: "n1",
          kind: "axiom",
          label: "A1 <test>",
          formulaText: 'phi & "psi"',
          position: { x: 0, y: 0 },
        },
      ],
      connections: [],
      inferenceEdges: [],
      nextNodeId: 2,
      mode: "free",
    };
    const svg = generateExportSVG(ws);

    expect(svg).toContain("&lt;test&gt;");
    expect(svg).toContain("&amp;");
    expect(svg).toContain("&quot;");
    // 壊れたXMLにならない
    expect(svg).not.toContain("<test>");
  });

  it("長い式テキストが切り詰められる", () => {
    const longFormula =
      "phi -> (psi -> (chi -> (alpha -> (beta -> (gamma -> (delta -> epsilon))))))";
    const ws: WorkspaceState = {
      system: lukasiewiczSystem,
      nodes: [
        {
          id: "n1",
          kind: "axiom",
          label: "Axiom",
          formulaText: longFormula,
          position: { x: 0, y: 0 },
        },
      ],
      connections: [],
      inferenceEdges: [],
      nextNodeId: 2,
      mode: "free",
    };
    const svg = generateExportSVG(ws);

    // 元の全テキストは含まれない（切り詰められるため）
    expect(svg).not.toContain(longFormula);
    // 省略記号が含まれる
    expect(svg).toContain("…");
  });

  it("存在しない接続先ノードがあっても壊れない", () => {
    const ws: WorkspaceState = {
      system: lukasiewiczSystem,
      nodes: [
        {
          id: "n1",
          kind: "axiom",
          label: "Axiom",
          formulaText: "phi",
          position: { x: 0, y: 0 },
        },
      ],
      connections: [
        {
          id: "conn-1",
          fromNodeId: "n1",
          fromPortId: "out",
          toNodeId: "nonexistent",
          toPortId: "premise-left",
        },
      ],
      inferenceEdges: [],
      nextNodeId: 2,
      mode: "free",
    };
    const svg = generateExportSVG(ws);

    // SVGは生成される（接続線は無視）
    expect(svg).toContain("<svg");
    expect(svg).toContain("</svg>");
    // パスは含まれない
    expect(svg).not.toContain("<path");
  });

  it("存在しないポートIDがあっても壊れない", () => {
    const ws: WorkspaceState = {
      system: lukasiewiczSystem,
      nodes: [
        {
          id: "n1",
          kind: "axiom",
          label: "Axiom",
          formulaText: "phi",
          position: { x: 0, y: 0 },
        },
        {
          id: "n2",
          kind: "mp",
          label: "MP",
          formulaText: "psi",
          position: { x: 200, y: 200 },
        },
      ],
      connections: [
        {
          id: "conn-1",
          fromNodeId: "n1",
          fromPortId: "nonexistent-port",
          toNodeId: "n2",
          toPortId: "premise-left",
        },
      ],
      inferenceEdges: [],
      nextNodeId: 3,
      mode: "free",
    };
    const svg = generateExportSVG(ws);

    // SVGは生成される（接続線は無視）
    expect(svg).toContain("<svg");
    expect(svg).toContain("</svg>");
  });

  it("空の式テキストのノードでもテキスト要素が生成されない", () => {
    const ws: WorkspaceState = {
      system: lukasiewiczSystem,
      nodes: [
        {
          id: "n1",
          kind: "axiom",
          label: "Axiom",
          formulaText: "",
          position: { x: 0, y: 0 },
        },
      ],
      connections: [],
      inferenceEdges: [],
      nextNodeId: 2,
      mode: "free",
    };
    const svg = generateExportSVG(ws);

    // ラベルのtextは1つ、式テキストのtextは0
    const textMatches = svg.match(/<text /g);
    expect(textMatches).not.toBeNull();
    expect(textMatches!.length).toBe(1); // ラベルのみ
  });

  it("viewBoxがノードの位置に基づいて正しく設定される", () => {
    const ws: WorkspaceState = {
      system: lukasiewiczSystem,
      nodes: [
        {
          id: "n1",
          kind: "axiom",
          label: "Axiom",
          formulaText: "phi",
          position: { x: 100, y: 200 },
        },
      ],
      connections: [],
      inferenceEdges: [],
      nextNodeId: 2,
      mode: "free",
    };
    const svg = generateExportSVG(ws);

    // viewBox="60 160 280 136" (100-40, 200-40, 200+80, 56+80)
    expect(svg).toContain('viewBox="60 160 280 136"');
  });
});

// --- generateImageExportFileName ---

describe("generateImageExportFileName", () => {
  it("SVG形式のファイル名を生成する", () => {
    const result = generateImageExportFileName(
      "Lukasiewicz",
      { year: 2026, month: 2, day: 26, hour: 14, minute: 30 },
      "svg",
    );
    expect(result).toBe("proof-Lukasiewicz-20260226-1430.svg");
  });

  it("PNG形式のファイル名を生成する", () => {
    const result = generateImageExportFileName(
      "Lukasiewicz",
      { year: 2026, month: 2, day: 26, hour: 14, minute: 30 },
      "png",
    );
    expect(result).toBe("proof-Lukasiewicz-20260226-1430.png");
  });

  it("システム名の特殊文字をサニタイズする", () => {
    const result = generateImageExportFileName(
      "My System (v2)",
      { year: 2026, month: 1, day: 1, hour: 0, minute: 0 },
      "svg",
    );
    expect(result).toBe("proof-My_System__v2_-20260101-0000.svg");
  });

  it("月日時分をゼロパディングする", () => {
    const result = generateImageExportFileName(
      "test",
      { year: 2026, month: 3, day: 5, hour: 8, minute: 2 },
      "png",
    );
    expect(result).toBe("proof-test-20260305-0802.png");
  });
});

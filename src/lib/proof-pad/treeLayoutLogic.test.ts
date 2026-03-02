import { describe, it, expect } from "vitest";
import {
  buildAdjacencyLists,
  buildForest,
  collectNodesByLevel,
  computeLayoutDiff,
  computeLevelHeights,
  computeTotalHeight,
  computeTreeLayout,
  DEFAULT_LAYOUT_CONFIG,
  findLeafNodes,
  findRootNodes,
  flipYPositions,
  reorderChildrenByBarycenter,
  type LayoutConfig,
  type LayoutEdge,
  type LayoutNode,
} from "./treeLayoutLogic";

const DEFAULT_SIZE = { width: 100, height: 40 };

function node(id: string, size = DEFAULT_SIZE): LayoutNode {
  return { id, size };
}

describe("buildAdjacencyLists", () => {
  it("空のエッジリストで空のマップ", () => {
    const { forward, inverse } = buildAdjacencyLists([]);
    expect(forward.size).toBe(0);
    expect(inverse.size).toBe(0);
  });

  it("単一エッジで正しい隣接リスト", () => {
    const edges: readonly LayoutEdge[] = [{ fromNodeId: "a", toNodeId: "b" }];
    const { forward, inverse } = buildAdjacencyLists(edges);
    expect(forward.get("a")).toEqual(["b"]);
    expect(inverse.get("b")).toEqual(["a"]);
  });

  it("複数エッジで正しい隣接リスト", () => {
    const edges: readonly LayoutEdge[] = [
      { fromNodeId: "a", toNodeId: "c" },
      { fromNodeId: "b", toNodeId: "c" },
      { fromNodeId: "c", toNodeId: "d" },
    ];
    const { forward, inverse } = buildAdjacencyLists(edges);
    expect(forward.get("a")).toEqual(["c"]);
    expect(forward.get("b")).toEqual(["c"]);
    expect(forward.get("c")).toEqual(["d"]);
    expect(inverse.get("c")).toEqual(["a", "b"]);
    expect(inverse.get("d")).toEqual(["c"]);
  });
});

describe("findRootNodes", () => {
  it("入次数0のノードがルート", () => {
    const inverse = new Map([["c", ["a", "b"]]]);
    const roots = findRootNodes(["a", "b", "c"], inverse);
    expect(roots).toEqual(["a", "b"]);
  });

  it("エッジなしの場合すべてがルート", () => {
    const roots = findRootNodes(["a", "b"], new Map());
    expect(roots).toEqual(["a", "b"]);
  });
});

describe("findLeafNodes", () => {
  it("出次数0のノードがリーフ", () => {
    const forward = new Map([
      ["a", ["b"]],
      ["b", ["c"]],
    ]);
    const leaves = findLeafNodes(["a", "b", "c"], forward);
    expect(leaves).toEqual(["c"]);
  });

  it("エッジなしの場合すべてがリーフ", () => {
    const leaves = findLeafNodes(["a", "b"], new Map());
    expect(leaves).toEqual(["a", "b"]);
  });
});

describe("buildForest", () => {
  it("単一ルートの線形チェーン", () => {
    const nodes = new Map([
      ["a", node("a")],
      ["b", node("b")],
      ["c", node("c")],
    ]);
    const forward = new Map([
      ["a", ["b"]],
      ["b", ["c"]],
    ]);
    const forest = buildForest(["a"], nodes, forward);
    expect(forest.length).toBe(1);
    expect(forest[0]!.id).toBe("a");
    expect(forest[0]!.children.length).toBe(1);
    expect(forest[0]!.children[0]!.id).toBe("b");
    expect(forest[0]!.children[0]!.children[0]!.id).toBe("c");
  });

  it("分岐のあるツリー", () => {
    const nodes = new Map([
      ["a", node("a")],
      ["b", node("b")],
      ["c", node("c")],
    ]);
    const forward = new Map([["a", ["b", "c"]]]);
    const forest = buildForest(["a"], nodes, forward);
    expect(forest.length).toBe(1);
    expect(forest[0]!.children.length).toBe(2);
    expect(forest[0]!.children[0]!.id).toBe("b");
    expect(forest[0]!.children[1]!.id).toBe("c");
  });

  it("DAGで共有ノードは最初の訪問のみ", () => {
    const nodes = new Map([
      ["a", node("a")],
      ["b", node("b")],
      ["c", node("c")],
    ]);
    // a → c, b → c (cは2つの親)
    const forward = new Map([
      ["a", ["c"]],
      ["b", ["c"]],
    ]);
    const forest = buildForest(["a", "b"], nodes, forward);
    // a → c を先に訪問するため、c は a の子
    expect(forest.length).toBe(2);
    expect(forest[0]!.children[0]!.id).toBe("c");
    // b は子なし（c は既に訪問済み）
    expect(forest[1]!.children.length).toBe(0);
  });

  it("forward参照先がnodeMapに存在しない場合スキップ", () => {
    const nodes = new Map([["a", node("a")]]);
    // forward references "b" which is not in nodeMap
    const forward = new Map([["a", ["b"]]]);
    const forest = buildForest(["a"], nodes, forward);
    expect(forest.length).toBe(1);
    expect(forest[0]!.id).toBe("a");
    expect(forest[0]!.children.length).toBe(0);
  });

  it("孤立ノードもフォレストに含まれる", () => {
    const nodes = new Map([
      ["a", node("a")],
      ["b", node("b")],
      ["c", node("c")],
    ]);
    const forward = new Map([["a", ["b"]]]);
    const forest = buildForest(["a"], nodes, forward);
    // a → b がツリー、c は孤立
    expect(forest.length).toBe(2);
    expect(forest[0]!.id).toBe("a");
    expect(forest[1]!.id).toBe("c");
  });
});

describe("computeLevelHeights", () => {
  it("各レベルの最大高さを計算", () => {
    const nodes = new Map([
      ["a", node("a", { width: 100, height: 40 })],
      ["b", node("b", { width: 100, height: 60 })],
      ["c", node("c", { width: 100, height: 30 })],
    ]);
    const forward = new Map([["a", ["b", "c"]]]);
    const forest = buildForest(["a"], nodes, forward);
    const heights = computeLevelHeights(forest);
    // Level 0: a (40), Level 1: max(b:60, c:30) = 60
    expect(heights).toEqual([40, 60]);
  });
});

describe("computeTotalHeight", () => {
  it("レベル高さとギャップから総高さを計算", () => {
    expect(computeTotalHeight([40, 60], 80)).toBe(40 + 80 + 60);
  });

  it("単一レベル", () => {
    expect(computeTotalHeight([40], 80)).toBe(40);
  });

  it("空のレベル", () => {
    expect(computeTotalHeight([], 80)).toBe(0);
  });
});

describe("flipYPositions", () => {
  it("nodeMapにIDがない場合はheight=0として処理", () => {
    const positions = new Map([["unknown", { x: 10, y: 20 }]]);
    const nodeMap = new Map<string, LayoutNode>(); // 空
    const flipped = flipYPositions(positions, nodeMap, 100);
    // height=0 → y = 100 - 20 - 0 = 80
    expect(flipped.get("unknown")).toEqual({ x: 10, y: 80 });
  });

  it("y座標を反転する", () => {
    const positions = new Map([
      ["a", { x: 0, y: 0 }],
      ["b", { x: 50, y: 120 }],
    ]);
    const nodeMap = new Map([
      ["a", node("a")],
      ["b", node("b")],
    ]);
    const flipped = flipYPositions(positions, nodeMap, 160);
    // a: y=0, height=40 → 160 - 0 - 40 = 120
    expect(flipped.get("a")).toEqual({ x: 0, y: 120 });
    // b: y=120, height=40 → 160 - 120 - 40 = 0
    expect(flipped.get("b")).toEqual({ x: 50, y: 0 });
  });
});

describe("computeTreeLayout", () => {
  it("空のノードリストで空のマップ", () => {
    const result = computeTreeLayout([], []);
    expect(result.size).toBe(0);
  });

  it("単一ノードで原点配置", () => {
    const result = computeTreeLayout([node("a")], []);
    expect(result.size).toBe(1);
    expect(result.get("a")).toEqual({ x: 0, y: 0 });
  });

  it("線形チェーン（上→下）で垂直配置", () => {
    const nodes = [node("a"), node("b"), node("c")];
    const edges: readonly LayoutEdge[] = [
      { fromNodeId: "a", toNodeId: "b" },
      { fromNodeId: "b", toNodeId: "c" },
    ];
    const config: LayoutConfig = {
      horizontalGap: 40,
      verticalGap: 80,
      direction: "top-to-bottom",
    };
    const result = computeTreeLayout(nodes, edges, config);

    // All nodes should have same x (centered in subtree)
    const posA = result.get("a")!;
    const posB = result.get("b")!;
    const posC = result.get("c")!;
    expect(posA.x).toBe(posB.x);
    expect(posB.x).toBe(posC.x);

    // y should increase: a < b < c
    expect(posA.y).toBeLessThan(posB.y);
    expect(posB.y).toBeLessThan(posC.y);
  });

  it("分岐ツリーで子ノードが水平に並ぶ", () => {
    const nodes = [node("root"), node("left"), node("right")];
    const edges: readonly LayoutEdge[] = [
      { fromNodeId: "root", toNodeId: "left" },
      { fromNodeId: "root", toNodeId: "right" },
    ];
    const result = computeTreeLayout(nodes, edges);

    const posRoot = result.get("root")!;
    const posLeft = result.get("left")!;
    const posRight = result.get("right")!;

    // left と right は同じ y
    expect(posLeft.y).toBe(posRight.y);
    // left は right より左
    expect(posLeft.x).toBeLessThan(posRight.x);
    // root は子ノードの間に配置される
    expect(posRoot.y).toBeLessThan(posLeft.y);
  });

  it("bottom-to-topでy座標が反転", () => {
    const nodes = [node("a"), node("b")];
    const edges: readonly LayoutEdge[] = [{ fromNodeId: "a", toNodeId: "b" }];
    const configTB: LayoutConfig = {
      ...DEFAULT_LAYOUT_CONFIG,
      direction: "top-to-bottom",
    };
    const configBT: LayoutConfig = {
      ...DEFAULT_LAYOUT_CONFIG,
      direction: "bottom-to-top",
    };

    const resultTB = computeTreeLayout(nodes, edges, configTB);
    const resultBT = computeTreeLayout(nodes, edges, configBT);

    // top-to-bottom: a.y < b.y
    expect(resultTB.get("a")!.y).toBeLessThan(resultTB.get("b")!.y);
    // bottom-to-top: a.y > b.y (roots at bottom)
    expect(resultBT.get("a")!.y).toBeGreaterThan(resultBT.get("b")!.y);
  });

  it("MPパターン（2入力1出力）の証明ツリー", () => {
    // axiom1 → mp, axiom2 → mp
    const nodes = [
      node("axiom1", { width: 150, height: 50 }),
      node("axiom2", { width: 150, height: 50 }),
      node("mp", { width: 120, height: 50 }),
    ];
    const edges: readonly LayoutEdge[] = [
      { fromNodeId: "axiom1", toNodeId: "mp" },
      { fromNodeId: "axiom2", toNodeId: "mp" },
    ];
    const result = computeTreeLayout(nodes, edges);

    const posAx1 = result.get("axiom1")!;
    const posAx2 = result.get("axiom2")!;
    const posMp = result.get("mp")!;

    // axioms are at the top, mp is below
    expect(posAx1.y).toBeLessThan(posMp.y);
    expect(posAx2.y).toBeLessThan(posMp.y);
    // axioms are at same level
    expect(posAx1.y).toBe(posAx2.y);
    // axiom1 is left of axiom2
    expect(posAx1.x).toBeLessThan(posAx2.x);
  });

  it("5ステップの恒等証明のレイアウト", () => {
    // 証明: φ → φ
    // Step1(axiom) → Step3(mp) → Step5(mp)
    // Step2(axiom) → Step3(mp)
    // Step4(axiom) → Step5(mp)
    const nodes = [
      node("s1", { width: 200, height: 50 }),
      node("s2", { width: 200, height: 50 }),
      node("s3", { width: 200, height: 50 }),
      node("s4", { width: 200, height: 50 }),
      node("s5", { width: 200, height: 50 }),
    ];
    const edges: readonly LayoutEdge[] = [
      { fromNodeId: "s1", toNodeId: "s3" },
      { fromNodeId: "s2", toNodeId: "s3" },
      { fromNodeId: "s3", toNodeId: "s5" },
      { fromNodeId: "s4", toNodeId: "s5" },
    ];
    const result = computeTreeLayout(nodes, edges);

    // s1, s2 at level 0 (roots)
    expect(result.get("s1")!.y).toBe(result.get("s2")!.y);
    // s4 is also a root
    expect(result.get("s4")!.y).toBe(result.get("s1")!.y);
    // s3 at level 1
    expect(result.get("s3")!.y).toBeGreaterThan(result.get("s1")!.y);
    // s5 at level 2
    expect(result.get("s5")!.y).toBeGreaterThan(result.get("s3")!.y);

    // All 5 nodes have positions
    expect(result.size).toBe(5);
  });

  it("フォレスト（複数の独立したツリー）", () => {
    const nodes = [node("a"), node("b"), node("c"), node("d")];
    const edges: readonly LayoutEdge[] = [
      { fromNodeId: "a", toNodeId: "b" },
      { fromNodeId: "c", toNodeId: "d" },
    ];
    const result = computeTreeLayout(nodes, edges);

    // Tree 1: a → b, Tree 2: c → d
    // Both trees positioned side by side
    expect(result.get("a")!.y).toBe(result.get("c")!.y); // same level
    expect(result.get("b")!.y).toBe(result.get("d")!.y); // same level

    // Tree 2 is to the right of tree 1
    expect(result.get("c")!.x).toBeGreaterThan(result.get("a")!.x);
  });

  it("異なるノードサイズを考慮", () => {
    const nodes = [
      node("wide", { width: 300, height: 40 }),
      node("narrow", { width: 50, height: 40 }),
    ];
    const edges: readonly LayoutEdge[] = [
      { fromNodeId: "wide", toNodeId: "narrow" },
    ];
    const result = computeTreeLayout(nodes, edges);

    // narrow ノードは wide ノードの中央に配置される
    const posWide = result.get("wide")!;
    const posNarrow = result.get("narrow")!;
    const wideCenterX = posWide.x + 300 / 2;
    const narrowCenterX = posNarrow.x + 50 / 2;
    expect(Math.abs(wideCenterX - narrowCenterX)).toBeLessThan(1);
  });

  it("カスタムギャップ設定", () => {
    const nodes = [node("a"), node("b")];
    const edges: readonly LayoutEdge[] = [{ fromNodeId: "a", toNodeId: "b" }];
    const config: LayoutConfig = {
      horizontalGap: 100,
      verticalGap: 200,
      direction: "top-to-bottom",
    };
    const result = computeTreeLayout(nodes, edges, config);

    const posA = result.get("a")!;
    const posB = result.get("b")!;
    // verticalGap = 200, nodeHeight = 40 → b.y = 40 + 200 = 240
    expect(posB.y - posA.y).toBe(40 + 200);
  });

  it("循環グラフでは未訪問ノードが孤立ノードとして配置される", () => {
    // a → b → a の循環。ルートは存在しないが、未訪問ノードが孤立ノードとしてforestに追加される
    const nodes = [node("a"), node("b")];
    const edges: readonly LayoutEdge[] = [
      { fromNodeId: "a", toNodeId: "b" },
      { fromNodeId: "b", toNodeId: "a" },
    ];
    const result = computeTreeLayout(nodes, edges);
    // 未訪問ノードが孤立ノードとして配置されるため、全ノードに位置が割り当てられる
    expect(result.size).toBe(2);
    expect(result.has("a")).toBe(true);
    expect(result.has("b")).toBe(true);
  });
});

describe("computeLayoutDiff", () => {
  it("すべてのノードが新規の場合すべて返す", () => {
    const nodes = [node("a"), node("b")];
    const edges: readonly LayoutEdge[] = [{ fromNodeId: "a", toNodeId: "b" }];
    const diff = computeLayoutDiff(nodes, edges, new Map());
    expect(diff.size).toBe(2);
  });

  it("位置が変わらないノードは含まれない", () => {
    const nodes = [node("a")];
    const layout = computeTreeLayout(nodes, []);
    const diff = computeLayoutDiff(nodes, [], layout);
    expect(diff.size).toBe(0);
  });

  it("閾値以上移動したノードのみ返す", () => {
    const nodes = [node("a"), node("b")];
    const edges: readonly LayoutEdge[] = [{ fromNodeId: "a", toNodeId: "b" }];
    const layout = computeTreeLayout(nodes, edges);

    // aを少しだけ移動
    const modified = new Map(layout);
    const origA = modified.get("a")!;
    modified.set("a", { x: origA.x + 0.5, y: origA.y });

    const diff = computeLayoutDiff(
      nodes,
      edges,
      modified,
      DEFAULT_LAYOUT_CONFIG,
      1,
    );
    // aは0.5しか動いてないので閾値以下、含まれない
    // bは元の位置なので変化なし
    expect(diff.size).toBe(0);
  });

  it("新しいノードが追加された場合含まれる", () => {
    const nodesOld = [node("a")];
    const layoutOld = computeTreeLayout(nodesOld, []);

    const nodesNew = [node("a"), node("b")];
    const edgesNew: readonly LayoutEdge[] = [
      { fromNodeId: "a", toNodeId: "b" },
    ];
    const diff = computeLayoutDiff(nodesNew, edgesNew, layoutOld);
    // b is new, a may have moved
    expect(diff.has("b")).toBe(true);
  });

  it("閾値以上移動したノードは含まれる", () => {
    const nodes = [node("a"), node("b")];
    const edges: readonly LayoutEdge[] = [{ fromNodeId: "a", toNodeId: "b" }];
    const layout = computeTreeLayout(nodes, edges);

    // aを大きく移動
    const modified = new Map(layout);
    const origA = modified.get("a")!;
    modified.set("a", { x: origA.x + 10, y: origA.y });

    const diff = computeLayoutDiff(
      nodes,
      edges,
      modified,
      DEFAULT_LAYOUT_CONFIG,
      1,
    );
    // aは10移動しているので閾値以上、含まれる
    expect(diff.has("a")).toBe(true);
  });
});

describe("DEFAULT_LAYOUT_CONFIG", () => {
  it("デフォルト間隔が十分広い", () => {
    expect(DEFAULT_LAYOUT_CONFIG.horizontalGap).toBeGreaterThanOrEqual(60);
    expect(DEFAULT_LAYOUT_CONFIG.verticalGap).toBeGreaterThanOrEqual(120);
  });
});

describe("collectNodesByLevel", () => {
  it("各レベルのノードIDを収集する", () => {
    const nodes = new Map([
      ["a", node("a")],
      ["b", node("b")],
      ["c", node("c")],
      ["d", node("d")],
    ]);
    const forward = new Map<string, string[]>([
      ["a", ["b", "c"]],
      ["b", ["d"]],
    ]);
    const forest = buildForest(["a"], nodes, forward);
    const levels = collectNodesByLevel(forest);
    expect(levels.get(0)).toEqual(["a"]);
    expect(levels.get(1)).toEqual(["b", "c"]);
    expect(levels.get(2)).toEqual(["d"]);
  });

  it("フォレストの場合、同じレベルに複数のルート", () => {
    const nodes = new Map([
      ["a", node("a")],
      ["b", node("b")],
    ]);
    const forest = buildForest(["a", "b"], nodes, new Map());
    const levels = collectNodesByLevel(forest);
    expect(levels.get(0)).toEqual(["a", "b"]);
  });
});

describe("reorderChildrenByBarycenter", () => {
  it("子が1つ以下の場合は順序変更なし", () => {
    const nodes = new Map([
      ["a", node("a")],
      ["b", node("b")],
    ]);
    const forward = new Map<string, string[]>([["a", ["b"]]]);
    const forest = buildForest(["a"], nodes, forward);
    const inverse = new Map<string, string[]>([["b", ["a"]]]);
    const reordered = reorderChildrenByBarycenter(forest, inverse);
    expect(reordered[0]!.children[0]!.id).toBe("b");
  });

  it("barycenterに基づいて子ノードを並び替える", () => {
    // ルート r1(pos=0), r2(pos=1) がレベル0
    // r1 → c2, r1 → c1  （c2が先、c1が後の順で宣言）
    // r2 → c1             （c1はDAGでr2にも繋がっている）
    // barycenter: c2はr1(0)のみ → bc=0, c1はr1(0)+r2(1) → bc=0.5
    // c2のbcがc1より小さいので、c2が左に来る（既にそうなっているケース）
    const nodes = new Map([
      ["r1", node("r1")],
      ["r2", node("r2")],
      ["c1", node("c1")],
      ["c2", node("c2")],
    ]);
    // r1 → c2, c1 (c2が先)
    const forward = new Map<string, string[]>([
      ["r1", ["c2", "c1"]],
      ["r2", ["c1"]],
    ]);
    const forest = buildForest(["r1", "r2"], nodes, forward);
    const inverse = new Map<string, string[]>([
      ["c2", ["r1"]],
      ["c1", ["r1", "r2"]],
    ]);

    const reordered = reorderChildrenByBarycenter(forest, inverse);
    // r1の子: c2(bc=0), c1(bc=0.5) → c2が左
    expect(reordered[0]!.children[0]!.id).toBe("c2");
    expect(reordered[0]!.children[1]!.id).toBe("c1");
  });

  it("inverse に存在しない子ノードはbarycenter=0になる", () => {
    // ルートr1 → c1, c2
    // inverseにc1/c2のエントリがない場合、barycenter=0
    const nodes = new Map([
      ["r1", node("r1")],
      ["c1", node("c1")],
      ["c2", node("c2")],
    ]);
    const forward = new Map<string, string[]>([["r1", ["c1", "c2"]]]);
    const forest = buildForest(["r1"], nodes, forward);
    // inverseが空 → 全子のbarycenter=0 → 元の順序維持
    const reordered = reorderChildrenByBarycenter(forest, new Map());
    expect(reordered[0]!.children[0]!.id).toBe("c1");
    expect(reordered[0]!.children[1]!.id).toBe("c2");
  });

  it("親のposition indexが存在しない場合スキップ", () => {
    // ルートr1 → c1, c2
    // inverseにc1の親として「unknown_parent」がいるが、position indexにはない
    const nodes = new Map([
      ["r1", node("r1")],
      ["c1", node("c1")],
      ["c2", node("c2")],
    ]);
    const forward = new Map<string, string[]>([["r1", ["c1", "c2"]]]);
    const forest = buildForest(["r1"], nodes, forward);
    const inverse = new Map<string, string[]>([
      ["c1", ["r1", "unknown_parent"]],
      ["c2", ["r1"]],
    ]);
    const reordered = reorderChildrenByBarycenter(forest, inverse);
    // c1のbarycenter = 0 (r1のposだけカウント), c2のbarycenter = 0
    // 同じbarycenterなので元の順序維持
    expect(reordered[0]!.children[0]!.id).toBe("c1");
    expect(reordered[0]!.children[1]!.id).toBe("c2");
  });

  it("交差を減らす方向に並び替える", () => {
    // r1(pos=0), r2(pos=1) がルート
    // r1 → c_right (r2からも接続), r1 → c_left (r1のみ)
    // r2 → c_right
    // c_right の barycenter = (0+1)/2 = 0.5, c_left の barycenter = 0/1 = 0
    // なので c_left が先に来るべき
    const nodes = new Map([
      ["r1", node("r1")],
      ["r2", node("r2")],
      ["c_left", node("c_left")],
      ["c_right", node("c_right")],
    ]);
    // r1の子が c_right, c_left の順（交差する配置）
    const forward = new Map<string, string[]>([
      ["r1", ["c_right", "c_left"]],
      ["r2", ["c_right"]],
    ]);
    const forest = buildForest(["r1", "r2"], nodes, forward);
    const inverse = new Map<string, string[]>([
      ["c_right", ["r1", "r2"]],
      ["c_left", ["r1"]],
    ]);

    const reordered = reorderChildrenByBarycenter(forest, inverse);
    // c_left(bc=0)が先、c_right(bc=0.5)が後に並び替えられる
    expect(reordered[0]!.children[0]!.id).toBe("c_left");
    expect(reordered[0]!.children[1]!.id).toBe("c_right");
  });
});

describe("computeTreeLayout - 交差回避", () => {
  it("交差する配置が最適化される", () => {
    // r1(左), r2(右) がルート
    // r1 → c_right (r2からも接続), r1 → c_left (r1のみ)
    // r2 → c_right
    // 最適化後: c_left(r1のみ接続)が左、c_right(r1+r2接続)が右
    const nodes = [node("r1"), node("r2"), node("c_left"), node("c_right")];
    const edges: readonly LayoutEdge[] = [
      { fromNodeId: "r1", toNodeId: "c_right" },
      { fromNodeId: "r1", toNodeId: "c_left" },
      { fromNodeId: "r2", toNodeId: "c_right" },
    ];
    const result = computeTreeLayout(nodes, edges);

    // c_left がc_rightの左に配置される（交差回避）
    expect(result.get("c_left")!.x).toBeLessThan(result.get("c_right")!.x);
  });

  it("デフォルト間隔でノード同士が十分離れる", () => {
    // 2つの子ノードが重ならないことを確認
    const nodes = [node("root"), node("left"), node("right")];
    const edges: readonly LayoutEdge[] = [
      { fromNodeId: "root", toNodeId: "left" },
      { fromNodeId: "root", toNodeId: "right" },
    ];
    const result = computeTreeLayout(nodes, edges);

    const posLeft = result.get("left")!;
    const posRight = result.get("right")!;

    // rightの左端がleftの右端よりも右にある（重ならない）
    const leftRightEdge = posLeft.x + DEFAULT_SIZE.width;
    expect(posRight.x).toBeGreaterThanOrEqual(leftRightEdge);
    // さらにギャップ分離れている
    expect(posRight.x - leftRightEdge).toBeGreaterThanOrEqual(
      DEFAULT_LAYOUT_CONFIG.horizontalGap,
    );
  });
});

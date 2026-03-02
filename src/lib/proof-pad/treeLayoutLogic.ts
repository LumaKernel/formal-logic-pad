/**
 * 証明ツリーの自動レイアウト計算 — 純粋ロジック。
 *
 * 証明ワークスペースのノードとコネクションから、
 * 上→下 / 下→上のツリー構造を計算し、各ノードの位置を返す。
 *
 * 変更時は treeLayoutLogic.test.ts も同期すること。
 */

import type { Point, Size } from "../infinite-canvas/types";

// --- Types ---

/** レイアウト対象のノード */
export type LayoutNode = {
  readonly id: string;
  readonly size: Size;
};

/** レイアウト対象のエッジ（fromNodeId → toNodeId） */
export type LayoutEdge = {
  readonly fromNodeId: string;
  readonly toNodeId: string;
};

/** レイアウト方向 */
export type LayoutDirection = "top-to-bottom" | "bottom-to-top";

/** レイアウト設定 */
export type LayoutConfig = {
  /** ノード間の水平間隔 */
  readonly horizontalGap: number;
  /** ノード間の垂直間隔 */
  readonly verticalGap: number;
  /** レイアウト方向 */
  readonly direction: LayoutDirection;
};

/** デフォルトのレイアウト設定 */
export const DEFAULT_LAYOUT_CONFIG: LayoutConfig = {
  horizontalGap: 60,
  verticalGap: 120,
  direction: "top-to-bottom",
};

/** レイアウト結果: ノードIDから位置へのマップ */
export type LayoutResult = ReadonlyMap<string, Point>;

// --- Internal tree node type (immutable) ---

type TreeNode = {
  readonly id: string;
  readonly size: Size;
  readonly children: readonly TreeNode[];
  /** x-coordinate of the node's left edge */
  readonly x: number;
  /** y-coordinate of the node's top edge */
  readonly y: number;
  /** The width of the subtree rooted at this node */
  readonly subtreeWidth: number;
};

// --- Pure logic functions ---

/** Build adjacency lists from edges.
 *  Returns forward adjacency (parent → children) and inverse (child → parents).
 *  Pure function. */
export function buildAdjacencyLists(edges: readonly LayoutEdge[]): {
  readonly forward: ReadonlyMap<string, readonly string[]>;
  readonly inverse: ReadonlyMap<string, readonly string[]>;
} {
  const forward = new Map<string, string[]>();
  const inverse = new Map<string, string[]>();

  for (const edge of edges) {
    const fwd = forward.get(edge.fromNodeId);
    if (fwd !== undefined) {
      fwd.push(edge.toNodeId);
    } else {
      forward.set(edge.fromNodeId, [edge.toNodeId]);
    }

    const inv = inverse.get(edge.toNodeId);
    if (inv !== undefined) {
      inv.push(edge.fromNodeId);
    } else {
      inverse.set(edge.toNodeId, [edge.fromNodeId]);
    }
  }

  return { forward, inverse };
}

/** Find root nodes (nodes with no incoming edges).
 *  In a proof tree: axioms (no parents).
 *  Pure function. */
export function findRootNodes(
  nodeIds: readonly string[],
  inverse: ReadonlyMap<string, readonly string[]>,
): readonly string[] {
  return nodeIds.filter((id) => (inverse.get(id) ?? []).length === 0);
}

/** Find leaf nodes (nodes with no outgoing edges).
 *  In a proof tree: conclusions or terminal derived nodes.
 *  Pure function. */
export function findLeafNodes(
  nodeIds: readonly string[],
  forward: ReadonlyMap<string, readonly string[]>,
): readonly string[] {
  return nodeIds.filter((id) => (forward.get(id) ?? []).length === 0);
}

/** Build a tree structure from the graph.
 *  For DAGs where nodes may have multiple parents, each such node is visited
 *  only once (first-visit wins). Returns a forest of tree roots.
 *  Pure function. */
export function buildForest(
  rootIds: readonly string[],
  nodeMap: ReadonlyMap<string, LayoutNode>,
  forward: ReadonlyMap<string, readonly string[]>,
): readonly TreeNode[] {
  const visited = new Set<string>();

  function buildTree(nodeId: string): TreeNode | null {
    if (visited.has(nodeId)) {
      return null;
    }
    visited.add(nodeId);

    const node = nodeMap.get(nodeId);
    if (node === undefined) {
      return null;
    }

    const childIds = forward.get(nodeId) ?? [];
    const children: TreeNode[] = [];
    for (const childId of childIds) {
      const child = buildTree(childId);
      if (child !== null) {
        children.push(child);
      }
    }

    return {
      id: node.id,
      size: node.size,
      children,
      x: 0,
      y: 0,
      subtreeWidth: 0,
    };
  }

  const forest: TreeNode[] = [];
  for (const rootId of rootIds) {
    const tree = buildTree(rootId);
    if (tree !== null) {
      forest.push(tree);
    }
  }

  // Also pick up any unvisited nodes (disconnected)
  for (const [id] of nodeMap) {
    if (!visited.has(id)) {
      const node = nodeMap.get(id)!;
      forest.push({
        id: node.id,
        size: node.size,
        children: [],
        x: 0,
        y: 0,
        subtreeWidth: 0,
      });
    }
  }

  return forest;
}

// --- Crossing reduction ---

/** Collect nodes at each depth level from a forest.
 *  Returns a map from depth to ordered list of node IDs at that depth.
 *  Pure function. */
export function collectNodesByLevel(
  forest: readonly TreeNode[],
): ReadonlyMap<number, readonly string[]> {
  const levels = new Map<number, string[]>();

  function traverse(node: TreeNode, depth: number): void {
    const level = levels.get(depth);
    if (level !== undefined) {
      level.push(node.id);
    } else {
      levels.set(depth, [node.id]);
    }
    for (const child of node.children) {
      traverse(child, depth + 1);
    }
  }

  for (const tree of forest) {
    traverse(tree, 0);
  }

  return levels;
}

/** Reorder children of each node using barycenter heuristic to reduce edge crossings.
 *
 *  For each node, its children are sorted by the barycenter (average position) of their
 *  connections in the layer above. This is a single downward pass of the Sugiyama method.
 *
 *  Uses the original DAG adjacency (inverse map) so that shared nodes (DAG edges not in tree)
 *  are also considered.
 *
 *  Pure function — returns a new forest. */
export function reorderChildrenByBarycenter(
  forest: readonly TreeNode[],
  inverse: ReadonlyMap<string, readonly string[]>,
): readonly TreeNode[] {
  // Step 1: Compute position index for each node at each level
  const levels = collectNodesByLevel(forest);
  const positionIndex = new Map<string, number>();
  for (const [, nodeIds] of levels) {
    for (let i = 0; i < nodeIds.length; i++) {
      positionIndex.set(nodeIds[i]!, i);
    }
  }

  // Step 2: Reorder children using parent positions from the level above
  function reorderNode(node: TreeNode): TreeNode {
    if (node.children.length <= 1) {
      // Recurse even for single children
      return {
        ...node,
        children: node.children.map(reorderNode),
      };
    }

    // For each child, compute barycenter = average position of its parents in the DAG
    const childrenWithBarycenter = node.children.map((child) => {
      const parents = inverse.get(child.id) ?? [];
      let sumPos = 0;
      let count = 0;
      for (const parentId of parents) {
        const pos = positionIndex.get(parentId);
        if (pos !== undefined) {
          sumPos += pos;
          count++;
        }
      }
      const barycenter = count > 0 ? sumPos / count : 0;
      return { child, barycenter };
    });

    // Sort by barycenter (stable sort preserves original order for ties)
    const sorted = [...childrenWithBarycenter].sort(
      (a, b) => a.barycenter - b.barycenter,
    );

    return {
      ...node,
      children: sorted.map((s) => reorderNode(s.child)),
    };
  }

  return forest.map(reorderNode);
}

/** Calculate subtree widths (post-order traversal).
 *  The subtree width is the maximum of the node width and the sum of children's subtree widths with gaps.
 *  Returns a new tree with subtreeWidth set. Pure function. */
export function calculateSubtreeWidths(
  node: TreeNode,
  horizontalGap: number,
): TreeNode {
  const updatedChildren = node.children.map((child) =>
    calculateSubtreeWidths(child, horizontalGap),
  );

  let subtreeWidth: number;
  if (updatedChildren.length === 0) {
    subtreeWidth = node.size.width;
  } else {
    let totalChildWidth = 0;
    for (let i = 0; i < updatedChildren.length; i++) {
      totalChildWidth += updatedChildren[i]!.subtreeWidth;
      if (i > 0) {
        totalChildWidth += horizontalGap;
      }
    }
    subtreeWidth = Math.max(node.size.width, totalChildWidth);
  }

  return { ...node, children: updatedChildren, subtreeWidth };
}

function totalChildrenWidth(node: TreeNode, horizontalGap: number): number {
  if (node.children.length === 0) {
    return 0;
  }
  let total = 0;
  for (let i = 0; i < node.children.length; i++) {
    total += node.children[i]!.subtreeWidth;
    if (i > 0) {
      total += horizontalGap;
    }
  }
  return total;
}

/** Assign x positions to a tree (pre-order traversal).
 *  The node is centered over its children's combined subtree.
 *  `offsetX` is the left edge of the available space for this subtree.
 *  Returns a new tree with x positions set. Pure function. */
export function assignXPositions(
  node: TreeNode,
  offsetX: number,
  horizontalGap: number,
): TreeNode {
  // Center the node in its subtree space
  const x = offsetX + node.subtreeWidth / 2 - node.size.width / 2;

  // Position children within this subtree's space
  let childOffsetX =
    offsetX + (node.subtreeWidth - totalChildrenWidth(node, horizontalGap)) / 2;
  const updatedChildren = node.children.map((child) => {
    const updated = assignXPositions(child, childOffsetX, horizontalGap);
    childOffsetX += child.subtreeWidth + horizontalGap;
    return updated;
  });

  return { ...node, x, children: updatedChildren };
}

/** Assign y positions based on tree depth.
 *  Each level is positioned at depth * (maxNodeHeight + verticalGap).
 *  Returns a new tree with y positions set. Pure function. */
export function assignYPositions(
  node: TreeNode,
  depth: number,
  levelHeights: readonly number[],
  verticalGap: number,
): TreeNode {
  let y = 0;
  for (let i = 0; i < depth; i++) {
    y += levelHeights[i]! + verticalGap;
  }

  const updatedChildren = node.children.map((child) =>
    assignYPositions(child, depth + 1, levelHeights, verticalGap),
  );

  return { ...node, y, children: updatedChildren };
}

/** Compute the maximum node height at each depth level.
 *  Pure function (returns a new array). */
export function computeLevelHeights(
  forest: readonly TreeNode[],
): readonly number[] {
  const heights: number[] = [];

  function traverse(node: TreeNode, depth: number): void {
    while (heights.length <= depth) {
      heights.push(0);
    }
    heights[depth] = Math.max(heights[depth]!, node.size.height);
    for (const child of node.children) {
      traverse(child, depth + 1);
    }
  }

  for (const tree of forest) {
    traverse(tree, 0);
  }

  return heights;
}

/** Collect all positions from a tree into a flat map.
 *  Pure function. */
function collectPositions(node: TreeNode, positions: Map<string, Point>): void {
  positions.set(node.id, { x: node.x, y: node.y });
  for (const child of node.children) {
    collectPositions(child, positions);
  }
}

/** Flip y positions for bottom-to-top layout.
 *  - "top-to-bottom": roots at top, leaves at bottom (standard tree)
 *  - "bottom-to-top": roots at bottom, leaves at top
 *
 *  For proof trees, the natural direction is "top-to-bottom" where axioms (roots) are at top
 *  and derived formulas flow downward.
 *
 *  Pure function. */
export function flipYPositions(
  positions: ReadonlyMap<string, Point>,
  nodeMap: ReadonlyMap<string, LayoutNode>,
  totalHeight: number,
): ReadonlyMap<string, Point> {
  const flipped = new Map<string, Point>();
  for (const [id, pos] of positions) {
    const node = nodeMap.get(id);
    const nodeHeight = node?.size.height ?? 0;
    flipped.set(id, {
      x: pos.x,
      y: totalHeight - pos.y - nodeHeight,
    });
  }
  return flipped;
}

/** Compute total height of the layout.
 *  Pure function. */
export function computeTotalHeight(
  levelHeights: readonly number[],
  verticalGap: number,
): number {
  if (levelHeights.length === 0) {
    return 0;
  }
  let total = 0;
  for (let i = 0; i < levelHeights.length; i++) {
    total += levelHeights[i]!;
    if (i < levelHeights.length - 1) {
      total += verticalGap;
    }
  }
  return total;
}

// --- Main layout function ---

/** Compute tree layout positions for all nodes.
 *
 *  Takes the proof tree as a list of nodes + edges and produces a position map.
 *  Works for forests (multiple disconnected trees), DAGs, and single trees.
 *
 *  Pure function — no side effects. */
export function computeTreeLayout(
  nodes: readonly LayoutNode[],
  edges: readonly LayoutEdge[],
  config: LayoutConfig = DEFAULT_LAYOUT_CONFIG,
): LayoutResult {
  if (nodes.length === 0) {
    return new Map();
  }

  // Build data structures
  const nodeMap = new Map<string, LayoutNode>(nodes.map((n) => [n.id, n]));
  const nodeIds = nodes.map((n) => n.id);
  const { forward, inverse } = buildAdjacencyLists(edges);

  // Find roots (no incoming edges)
  const rootIds = findRootNodes(nodeIds, inverse);

  // Build forest
  const rawForest = buildForest(rootIds, nodeMap, forward);

  // 防御的: nodes.length > 0 かつ buildForest で未訪問ノードが孤立ノードとして追加されるため、
  // forest.length === 0 は到達しない
  /* v8 ignore start */
  if (rawForest.length === 0) {
    return new Map();
  }
  /* v8 ignore stop */

  // Reorder children to reduce edge crossings (barycenter heuristic)
  const forest = reorderChildrenByBarycenter(rawForest, inverse);

  // Calculate subtree widths
  const withWidths = forest.map((tree) =>
    calculateSubtreeWidths(tree, config.horizontalGap),
  );

  // Assign x positions (for the whole forest side by side)
  let forestOffsetX = 0;
  const withX = withWidths.map((tree) => {
    const updated = assignXPositions(tree, forestOffsetX, config.horizontalGap);
    forestOffsetX += tree.subtreeWidth + config.horizontalGap;
    return updated;
  });

  // Compute level heights and assign y positions
  const levelHeights = computeLevelHeights(withX);
  const withXY = withX.map((tree) =>
    assignYPositions(tree, 0, levelHeights, config.verticalGap),
  );

  // Collect positions
  const positions = new Map<string, Point>();
  for (const tree of withXY) {
    collectPositions(tree, positions);
  }

  // Flip for bottom-to-top direction
  if (config.direction === "bottom-to-top") {
    const totalHeight = computeTotalHeight(levelHeights, config.verticalGap);
    return flipYPositions(positions, nodeMap, totalHeight);
  }

  return positions;
}

// --- Incremental layout helper ---

/** Compute layout and return position updates (only nodes that moved significantly).
 *  Useful for incremental re-layout after node add/remove.
 *  `threshold` is the minimum distance (in px) to consider a position change.
 *  Pure function. */
export function computeLayoutDiff(
  nodes: readonly LayoutNode[],
  edges: readonly LayoutEdge[],
  currentPositions: ReadonlyMap<string, Point>,
  config: LayoutConfig = DEFAULT_LAYOUT_CONFIG,
  threshold: number = 1,
): LayoutResult {
  const newPositions = computeTreeLayout(nodes, edges, config);
  const diff = new Map<string, Point>();

  for (const [id, newPos] of newPositions) {
    const oldPos = currentPositions.get(id);
    if (oldPos === undefined) {
      diff.set(id, newPos);
    } else {
      const dx = Math.abs(newPos.x - oldPos.x);
      const dy = Math.abs(newPos.y - oldPos.y);
      if (dx >= threshold || dy >= threshold) {
        diff.set(id, newPos);
      }
    }
  }

  return diff;
}

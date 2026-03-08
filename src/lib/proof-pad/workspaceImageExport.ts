/**
 * ワークスペースの画像エクスポート（SVG/PNG）純粋ロジック。
 *
 * WorkspaceState からスタンドアロン SVG 文字列を生成する。
 * ノードは矩形+テキスト、接続線はベジェ曲線のパスで描画する。
 *
 * 変更時は workspaceImageExport.test.ts, ProofWorkspace.tsx, index.ts も同期すること。
 */

import {
  findPort,
  type ConnectorPortOnItem,
} from "../infinite-canvas/connector";
import { computePortConnectionPath } from "../infinite-canvas/connectionPath";
import type { ViewportState } from "../infinite-canvas/types";
import type { WorkspaceState, WorkspaceNode } from "./workspaceState";
import {
  getNodeClassificationStyle,
  getNodeClassificationEdgeColor,
  getProofNodePorts,
} from "./proofNodeUI";
import type { WorkspaceConnection } from "./workspaceState";
import { classifyNode } from "./nodeRoleLogic";
import type { DateComponents } from "./workspaceExport";

// --- 定数 ---

/** エクスポートノードのデフォルトサイズ（ワールド座標） */
const DEFAULT_NODE_WIDTH = 200;
const DEFAULT_NODE_HEIGHT = 56;

/** エクスポート時のパディング（viewBox周囲の余白） */
const EXPORT_PADDING = 40;

/** Identity viewport（ワールド座標 = スクリーン座標） */
const IDENTITY_VIEWPORT: ViewportState = {
  offsetX: 0,
  offsetY: 0,
  scale: 1,
};

// --- バウンディングボックス ---

/** 軸並行バウンディングボックス */
export type BoundingBox = {
  readonly minX: number;
  readonly minY: number;
  readonly maxX: number;
  readonly maxY: number;
};

/** ノードサイズ情報（エクスポート時に利用） */
export type NodeSizeMap = ReadonlyMap<
  string,
  { readonly width: number; readonly height: number }
>;

/**
 * ワークスペースの全ノードを包含するバウンディングボックスを計算する。
 * ノードが0個の場合は原点中心の最小ボックスを返す。
 */
export function computeExportBounds(
  nodes: readonly WorkspaceNode[],
  nodeSizes: NodeSizeMap,
): BoundingBox {
  if (nodes.length === 0) {
    return {
      minX: -EXPORT_PADDING,
      minY: -EXPORT_PADDING,
      maxX: EXPORT_PADDING,
      maxY: EXPORT_PADDING,
    };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const node of nodes) {
    const size = nodeSizes.get(node.id);
    const w = size?.width ?? DEFAULT_NODE_WIDTH;
    const h = size?.height ?? DEFAULT_NODE_HEIGHT;

    minX = Math.min(minX, node.position.x);
    minY = Math.min(minY, node.position.y);
    maxX = Math.max(maxX, node.position.x + w);
    maxY = Math.max(maxY, node.position.y + h);
  }

  return {
    minX: minX - EXPORT_PADDING,
    minY: minY - EXPORT_PADDING,
    maxX: maxX + EXPORT_PADDING,
    maxY: maxY + EXPORT_PADDING,
  };
}

// --- XML エスケープ ---

/** XML特殊文字をエスケープする */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// --- SVG ノード描画 ---

/** SVGエクスポート用: CSS変数は使えないため、フォールバック色を定義 */
const EXPORT_CARD_BG = "#fffdf8";
const EXPORT_CARD_TEXT = "#2d2a24";
const EXPORT_CARD_BORDER = "rgba(0,0,0,0.08)";

/** 単一ノードのSVG要素文字列を生成する（紙カード風: 白背景 + 左辺ストライプ） */
function renderNodeSVG(
  node: WorkspaceNode,
  nodeSizes: NodeSizeMap,
  connections: readonly WorkspaceConnection[],
): string {
  const classification = classifyNode(node, connections);
  const style = getNodeClassificationStyle(classification);
  const size = nodeSizes.get(node.id);
  const w = size?.width ?? DEFAULT_NODE_WIDTH;
  const h = size?.height ?? DEFAULT_NODE_HEIGHT;
  const { x, y } = node.position;

  const lines: string[] = [];
  lines.push(`  <g>`);

  // 背景矩形（紙カード）
  lines.push(
    `    <rect x="${x satisfies number}" y="${y satisfies number}" width="${w satisfies number}" height="${h satisfies number}" rx="${style.borderRadius satisfies number}" ry="${style.borderRadius satisfies number}" fill="${EXPORT_CARD_BG satisfies string}" stroke="${EXPORT_CARD_BORDER satisfies string}" stroke-width="1"/>`,
  );

  // 左辺ストライプ（カテゴリ色、CSS変数のfallback値を抽出）
  const stripeWidth = 4;
  lines.push(
    `    <rect x="${x satisfies number}" y="${y satisfies number}" width="${stripeWidth satisfies number}" height="${h satisfies number}" rx="${style.borderRadius satisfies number}" ry="0" fill="${escapeXml(style.stripeColor) satisfies string}"/>`,
  );

  // ラベルテキスト
  const labelY = y + 16;
  lines.push(
    `    <text x="${(x + w / 2) satisfies number}" y="${labelY satisfies number}" text-anchor="middle" fill="${EXPORT_CARD_TEXT satisfies string}" font-size="11" font-family="sans-serif" font-weight="bold">${escapeXml(node.label) satisfies string}</text>`,
  );

  // 式テキスト
  if (node.formulaText.length > 0) {
    const formulaY = y + h / 2 + 8;
    // 長すぎる式は切り詰め
    const maxChars = Math.floor(w / 7);
    const displayText =
      node.formulaText.length > maxChars
        ? `${node.formulaText.slice(0, maxChars - 1) satisfies string}…`
        : node.formulaText;
    lines.push(
      `    <text x="${(x + w / 2) satisfies number}" y="${formulaY satisfies number}" text-anchor="middle" fill="${EXPORT_CARD_TEXT satisfies string}" font-size="13" font-family="monospace">${escapeXml(displayText) satisfies string}</text>`,
    );
  }

  lines.push(`  </g>`);
  return lines.join("\n");
}

// --- SVG 接続線描画 ---

/** 接続線1本のSVG要素文字列を生成する */
function renderConnectionSVG(
  fromNode: WorkspaceNode,
  toNode: WorkspaceNode,
  fromPortId: string,
  toPortId: string,
  nodeSizes: NodeSizeMap,
  connections: readonly WorkspaceConnection[],
): string {
  const fromClassification = classifyNode(fromNode, connections);
  const fromPorts = getProofNodePorts(fromNode.kind);
  const toPorts = getProofNodePorts(toNode.kind);
  const fromPort = findPort(fromPorts, fromPortId);
  const toPort = findPort(toPorts, toPortId);

  if (fromPort === undefined || toPort === undefined) {
    return "";
  }

  const fromSize = nodeSizes.get(fromNode.id);
  const toSize = nodeSizes.get(toNode.id);
  const fromW = fromSize?.width ?? DEFAULT_NODE_WIDTH;
  const fromH = fromSize?.height ?? DEFAULT_NODE_HEIGHT;
  const toW = toSize?.width ?? DEFAULT_NODE_WIDTH;
  const toH = toSize?.height ?? DEFAULT_NODE_HEIGHT;

  const fromPortOnItem: ConnectorPortOnItem = {
    port: fromPort,
    itemPosition: fromNode.position,
    itemWidth: fromW,
    itemHeight: fromH,
  };
  const toPortOnItem: ConnectorPortOnItem = {
    port: toPort,
    itemPosition: toNode.position,
    itemWidth: toW,
    itemHeight: toH,
  };

  // identity viewport でワールド座標のまま計算
  const pathData = computePortConnectionPath(
    fromPortOnItem,
    toPortOnItem,
    IDENTITY_VIEWPORT,
  );

  const color = getNodeClassificationEdgeColor(fromClassification);

  const lines: string[] = [];
  lines.push(`  <g>`);
  // 背景線（白）
  lines.push(
    `    <path d="${escapeXml(pathData.d) satisfies string}" fill="none" stroke="white" stroke-width="4" stroke-dasharray="8 4" opacity="0.6"/>`,
  );
  // メイン線
  lines.push(
    `    <path d="${escapeXml(pathData.d) satisfies string}" fill="none" stroke="${escapeXml(color) satisfies string}" stroke-width="2" stroke-dasharray="8 4" opacity="0.8"/>`,
  );
  lines.push(`  </g>`);
  return lines.join("\n");
}

// --- メインエクスポート関数 ---

/** SVGエクスポートのオプション */
export type SVGExportOptions = {
  /** ノードサイズ（DOM実測値）。未指定ならデフォルトサイズを使用 */
  readonly nodeSizes?: NodeSizeMap;
  /** 背景色。未指定なら白 */
  readonly backgroundColor?: string;
  /** 背景グリッドを含めるか */
  readonly includeGrid?: boolean;
};

/**
 * WorkspaceState からスタンドアロン SVG 文字列を生成する。
 *
 * 純粋関数。DOM API は使わない。
 */
export function generateExportSVG(
  state: WorkspaceState,
  /* v8 ignore start -- デフォルトパラメータ: テストではoptions有無両方カバー済み */
  options: SVGExportOptions = {},
  /* v8 ignore stop */
): string {
  const {
    /* v8 ignore start -- destructuringデフォルト値: 各プロパティ有無テスト済み */
    nodeSizes = new Map(),
    backgroundColor = "#ffffff",
    includeGrid = false,
    /* v8 ignore stop */
  } = options;

  const bounds = computeExportBounds(state.nodes, nodeSizes);
  const width = bounds.maxX - bounds.minX;
  const height = bounds.maxY - bounds.minY;

  const parts: string[] = [];

  // SVG ヘッダー
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${bounds.minX satisfies number} ${bounds.minY satisfies number} ${width satisfies number} ${height satisfies number}" width="${width satisfies number}" height="${height satisfies number}">`,
  );

  // 背景
  parts.push(
    `  <rect x="${bounds.minX satisfies number}" y="${bounds.minY satisfies number}" width="${width satisfies number}" height="${height satisfies number}" fill="${escapeXml(backgroundColor) satisfies string}"/>`,
  );

  // オプション: グリッドドット
  if (includeGrid) {
    const dotSpacing = 20;
    const dotRadius = 1;
    const startX = Math.ceil(bounds.minX / dotSpacing) * dotSpacing;
    const startY = Math.ceil(bounds.minY / dotSpacing) * dotSpacing;
    parts.push(`  <g opacity="0.3">`);
    for (let gx = startX; gx <= bounds.maxX; gx += dotSpacing) {
      for (let gy = startY; gy <= bounds.maxY; gy += dotSpacing) {
        parts.push(
          `    <circle cx="${gx satisfies number}" cy="${gy satisfies number}" r="${dotRadius satisfies number}" fill="#c0c0c0"/>`,
        );
      }
    }
    parts.push(`  </g>`);
  }

  // ノードマップ（接続線描画用）
  const nodeMap = new Map<string, WorkspaceNode>();
  for (const node of state.nodes) {
    nodeMap.set(node.id, node);
  }

  // 接続線（ノードの下に描画）
  for (const conn of state.connections) {
    const fromNode = nodeMap.get(conn.fromNodeId);
    const toNode = nodeMap.get(conn.toNodeId);
    if (fromNode !== undefined && toNode !== undefined) {
      const svg = renderConnectionSVG(
        fromNode,
        toNode,
        conn.fromPortId,
        conn.toPortId,
        nodeSizes,
        state.connections,
      );
      if (svg.length > 0) {
        parts.push(svg);
      }
    }
  }

  // ノード（接続線の上に描画）
  for (const node of state.nodes) {
    parts.push(renderNodeSVG(node, nodeSizes, state.connections));
  }

  parts.push(`</svg>`);
  return parts.join("\n");
}

// --- ファイル名生成 ---

/**
 * 画像エクスポート用ファイル名を生成する（純粋関数）。
 * フォーマット: `proof-{systemName}-{YYYYMMDD}-{HHmm}.{extension}`
 */
export function generateImageExportFileName(
  systemName: string,
  dateComponents: DateComponents,
  extension: "svg" | "png",
): string {
  const { year, month, day, hour, minute } = dateComponents;
  const pad = (n: number, len: number): string => String(n).padStart(len, "0");
  const dateStr = `${pad(year, 4) satisfies string}${pad(month, 2) satisfies string}${pad(day, 2) satisfies string}`;
  const timeStr = `${pad(hour, 2) satisfies string}${pad(minute, 2) satisfies string}`;
  const safeName = systemName.replace(/[^a-zA-Z0-9-_]/g, "_");
  return `proof-${safeName satisfies string}-${dateStr satisfies string}-${timeStr satisfies string}.${extension satisfies string}`;
}

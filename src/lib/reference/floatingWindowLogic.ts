/**
 * フローティングウィンドウの純粋ロジック。
 *
 * ドラッグ移動、リサイズ、ビューポート制約などの計算を行う。
 * UIコンポーネント（ReferenceFloatingWindow）から利用する。
 *
 * 変更時は floatingWindowLogic.test.ts も同期すること。
 */

// --- 型定義 ---

/** ウィンドウの位置とサイズ */
export type WindowRect = {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
};

/** ビューポートサイズ */
export type ViewportSize = {
  readonly width: number;
  readonly height: number;
};

/** ドラッグ開始時の情報 */
export type DragStartInfo = {
  readonly startMouseX: number;
  readonly startMouseY: number;
  readonly startWindowX: number;
  readonly startWindowY: number;
};

/** リサイズ開始時の情報 */
export type ResizeStartInfo = {
  readonly startMouseX: number;
  readonly startMouseY: number;
  readonly startWidth: number;
  readonly startHeight: number;
};

// --- 定数 ---

/** ウィンドウの最小サイズ */
export const MIN_WIDTH = 300;
export const MIN_HEIGHT = 200;

/** デフォルトのウィンドウサイズ */
export const DEFAULT_WIDTH = 480;
export const DEFAULT_HEIGHT = 500;

/** ビューポート端からの最小マージン */
export const VIEWPORT_MARGIN = 16;

// --- 初期位置計算 ---

/**
 * ウィンドウの初期位置を計算する。
 * 画面右側中央付近に配置する。
 */
export function computeInitialRect(viewport: ViewportSize): WindowRect {
  const width = Math.min(DEFAULT_WIDTH, viewport.width - VIEWPORT_MARGIN * 2);
  const height = Math.min(
    DEFAULT_HEIGHT,
    viewport.height - VIEWPORT_MARGIN * 2,
  );
  const x = viewport.width - width - VIEWPORT_MARGIN;
  const y = Math.max(
    VIEWPORT_MARGIN,
    Math.round((viewport.height - height) / 2),
  );
  return { x, y, width, height };
}

// --- ドラッグ計算 ---

/**
 * ドラッグ中のウィンドウ位置を計算する。
 * ビューポート内に制約される。
 */
export function computeDragPosition(
  drag: DragStartInfo,
  currentMouseX: number,
  currentMouseY: number,
  windowWidth: number,
  windowHeight: number,
  viewport: ViewportSize,
): { readonly x: number; readonly y: number } {
  const deltaX = currentMouseX - drag.startMouseX;
  const deltaY = currentMouseY - drag.startMouseY;
  const rawX = drag.startWindowX + deltaX;
  const rawY = drag.startWindowY + deltaY;

  // ビューポート内に制約
  const x = Math.max(
    VIEWPORT_MARGIN,
    Math.min(rawX, viewport.width - windowWidth - VIEWPORT_MARGIN),
  );
  const y = Math.max(
    VIEWPORT_MARGIN,
    Math.min(rawY, viewport.height - windowHeight - VIEWPORT_MARGIN),
  );

  return { x, y };
}

// --- リサイズ計算 ---

/**
 * リサイズ中のウィンドウサイズを計算する。
 * 最小サイズとビューポートに制約される。
 */
export function computeResizeSize(
  resize: ResizeStartInfo,
  currentMouseX: number,
  currentMouseY: number,
  windowX: number,
  windowY: number,
  viewport: ViewportSize,
): { readonly width: number; readonly height: number } {
  const deltaX = currentMouseX - resize.startMouseX;
  const deltaY = currentMouseY - resize.startMouseY;
  const rawWidth = resize.startWidth + deltaX;
  const rawHeight = resize.startHeight + deltaY;

  // 最小サイズとビューポート制約
  const maxWidth = viewport.width - windowX - VIEWPORT_MARGIN;
  const maxHeight = viewport.height - windowY - VIEWPORT_MARGIN;
  const width = Math.max(MIN_WIDTH, Math.min(rawWidth, maxWidth));
  const height = Math.max(MIN_HEIGHT, Math.min(rawHeight, maxHeight));

  return { width, height };
}

/**
 * ビューポートが変更された際にウィンドウ位置を調整する。
 * ウィンドウがビューポート外にはみ出している場合に修正する。
 */
export function constrainToViewport(
  rect: WindowRect,
  viewport: ViewportSize,
): WindowRect {
  const width = Math.min(rect.width, viewport.width - VIEWPORT_MARGIN * 2);
  const height = Math.min(rect.height, viewport.height - VIEWPORT_MARGIN * 2);
  const x = Math.max(
    VIEWPORT_MARGIN,
    Math.min(rect.x, viewport.width - width - VIEWPORT_MARGIN),
  );
  const y = Math.max(
    VIEWPORT_MARGIN,
    Math.min(rect.y, viewport.height - height - VIEWPORT_MARGIN),
  );
  return { x, y, width, height };
}

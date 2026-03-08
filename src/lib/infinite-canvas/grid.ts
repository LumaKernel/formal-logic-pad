import type { GridDot, Size, ViewportState } from "./types";

/** Default spacing between grid dots in pixels */
const DEFAULT_DOT_SPACING = 20;

/** Compute visible grid dot positions for a given viewport and container size.
 *  Returns an array of screen-space coordinates for each dot. */
export function computeGridDots(
  viewport: ViewportState,
  containerSize: Size,
  /* v8 ignore start -- デフォルトパラメータ分岐: 呼び出し側は常に明示的に値を渡す */
  dotSpacing: number = DEFAULT_DOT_SPACING,
  /* v8 ignore stop */
): readonly GridDot[] {
  const spacing = dotSpacing * viewport.scale;

  if (spacing <= 0) {
    return [];
  }

  // Calculate the offset of the grid origin in screen space
  const gridOriginX = viewport.offsetX % spacing;
  const gridOriginY = viewport.offsetY % spacing;

  // Calculate how many dots fit in each direction (with padding)
  const colCount = Math.ceil(containerSize.width / spacing) + 1;
  const rowCount = Math.ceil(containerSize.height / spacing) + 1;

  const dots: GridDot[] = [];

  for (let row = 0; row < rowCount; row++) {
    for (let col = 0; col < colCount; col++) {
      dots.push({
        x: gridOriginX + col * spacing,
        y: gridOriginY + row * spacing,
      });
    }
  }

  return dots;
}

/** Generate an SVG pattern definition string for the dot grid background.
 *  This is more performant than rendering individual dots. */
export function computeGridPatternParams(
  viewport: ViewportState,
  dotSpacing: number = DEFAULT_DOT_SPACING,
): {
  readonly patternSize: number;
  readonly patternOffsetX: number;
  readonly patternOffsetY: number;
  readonly dotRadius: number;
} {
  const spacing = dotSpacing * viewport.scale;
  const safeSpacing = Math.max(spacing, 1);

  return {
    patternSize: safeSpacing,
    patternOffsetX: viewport.offsetX % safeSpacing,
    patternOffsetY: viewport.offsetY % safeSpacing,
    dotRadius: Math.max(0.5, viewport.scale * 1),
  };
}

/** Compute SVG pattern parameters for major grid lines.
 *  Grid lines are drawn every `majorGridEvery` dots. */
export function computeGridLinePatternParams(
  viewport: ViewportState,
  dotSpacing: number = DEFAULT_DOT_SPACING,
  majorGridEvery: number = 5,
): {
  readonly patternSize: number;
  readonly patternOffsetX: number;
  readonly patternOffsetY: number;
} {
  const lineSpacing = dotSpacing * majorGridEvery * viewport.scale;
  const safeSpacing = Math.max(lineSpacing, 1);

  return {
    patternSize: safeSpacing,
    patternOffsetX: viewport.offsetX % safeSpacing,
    patternOffsetY: viewport.offsetY % safeSpacing,
  };
}

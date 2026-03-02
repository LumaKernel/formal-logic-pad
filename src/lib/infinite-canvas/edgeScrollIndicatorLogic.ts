import type { EdgePenetration } from "./edgeScrollLogic";

/** CSS box-shadow value for the edge scroll indicator overlay */
export type EdgeScrollShadowStyle = {
  readonly boxShadow: string;
  readonly visible: boolean;
};

function buildShadow(
  offsetX: string,
  offsetY: string,
  blur: string,
  color: string,
  opacity: string,
): string {
  return `inset ${offsetX satisfies string} ${offsetY satisfies string} ${blur satisfies string} rgba(${color satisfies string}, ${opacity satisfies string})`;
}

/**
 * Compute the CSS box-shadow for the edge scroll indicator.
 * Returns an inset box-shadow that glows on active edges, with intensity
 * proportional to the penetration depth.
 *
 * @param penetration  Per-edge penetration values (0~1), or null when not dragging
 * @param color        Shadow color (CSS color string, without alpha)
 * @param maxSpread    Maximum shadow spread in px at full penetration
 * @param maxOpacity   Maximum shadow opacity at full penetration (0~1)
 */
export function computeEdgeScrollShadow(
  penetration: EdgePenetration | null,
  color: string = "100, 149, 237",
  maxSpread: number = 24,
  maxOpacity: number = 0.5,
): EdgeScrollShadowStyle {
  if (penetration === null) {
    return { boxShadow: "none", visible: false };
  }

  const shadows: readonly string[] = [
    penetration.left > 0
      ? buildShadow(
          `${String(Math.round(penetration.left * maxSpread)) satisfies string}px`,
          "0",
          `${String(Math.round(penetration.left * maxSpread * 0.8)) satisfies string}px`,
          color,
          String(penetration.left * maxOpacity),
        )
      : "",
    penetration.right > 0
      ? buildShadow(
          `-${String(Math.round(penetration.right * maxSpread)) satisfies string}px`,
          "0",
          `${String(Math.round(penetration.right * maxSpread * 0.8)) satisfies string}px`,
          color,
          String(penetration.right * maxOpacity),
        )
      : "",
    penetration.top > 0
      ? buildShadow(
          "0",
          `${String(Math.round(penetration.top * maxSpread)) satisfies string}px`,
          `${String(Math.round(penetration.top * maxSpread * 0.8)) satisfies string}px`,
          color,
          String(penetration.top * maxOpacity),
        )
      : "",
    penetration.bottom > 0
      ? buildShadow(
          "0",
          `-${String(Math.round(penetration.bottom * maxSpread)) satisfies string}px`,
          `${String(Math.round(penetration.bottom * maxSpread * 0.8)) satisfies string}px`,
          color,
          String(penetration.bottom * maxOpacity),
        )
      : "",
  ];

  const activeShadows = shadows.filter((s) => s.length > 0);

  if (activeShadows.length === 0) {
    return { boxShadow: "none", visible: false };
  }

  return { boxShadow: activeShadows.join(", "), visible: true };
}

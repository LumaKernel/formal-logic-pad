import type { AlignmentGuide } from "./objectSnap";
import { worldToScreen } from "./coordinate";
import type { ViewportState } from "./types";

export interface AlignmentGuidesProps {
  /** Alignment guides to render (world-space coordinates) */
  readonly guides: readonly AlignmentGuide[];
  /** Current viewport for world→screen conversion */
  readonly viewport: ViewportState;
  /** Guide line color */
  readonly color?: string;
  /** Guide line width in screen pixels */
  readonly strokeWidth?: number;
}

/** Renders alignment guide lines as an SVG overlay.
 *  Place this as a sibling or child inside the InfiniteCanvas container. */
export function AlignmentGuidesComponent({
  guides,
  viewport,
  color = "var(--color-alignment-guide, #f97316)",
  strokeWidth = 1,
}: AlignmentGuidesProps) {
  if (guides.length === 0) return null;

  return (
    <svg
      data-testid="alignment-guides"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 9998,
      }}
      aria-hidden="true"
    >
      {guides.map((guide, i) => {
        if (guide.axis === "vertical") {
          const from = worldToScreen(viewport, {
            x: guide.value,
            y: guide.from,
          });
          const to = worldToScreen(viewport, {
            x: guide.value,
            y: guide.to,
          });
          return (
            <line
              key={`v-${String(i) satisfies string}`}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke={color}
              strokeWidth={strokeWidth}
              strokeDasharray="4 2"
            />
          );
        }
        // horizontal
        const from = worldToScreen(viewport, {
          x: guide.from,
          y: guide.value,
        });
        const to = worldToScreen(viewport, {
          x: guide.to,
          y: guide.value,
        });
        return (
          <line
            key={`h-${String(i) satisfies string}`}
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray="4 2"
          />
        );
      })}
    </svg>
  );
}
